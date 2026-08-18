# pi-mono Agent 架构手册

> **⚠️ v0.84.2 基线（2026-08-17）**：本仓库代码已同步到 v0.84.2+8（merge `1c91e97a5`），源码锚点对应工作树。v0.84.0 重点变化：① **session v4**——agent 包 session 模型整体重写（lane-based，旧 JSONL/in-memory repo API 删除），新专题 [3.5_Session_v4.md](./03-Memory/3.5_Session_v4.md)；② **`AgentHarness` 去泛型化重设计为 `AgentLane` 骨架**（多数操作 `HarnessNotImplemented`），4.1 大半失效；③ `FileSystem.renameFile()` 变必需；④ `message_update` wire 事件改纯 delta；⑤ auth 一批 breaking（见 5.2 警示）。
>
> **⚠️ v0.83.0 注意**：本文档集基于 v0.75.3 源码编写。v0.75.3→v0.83.0 有重大 API 变更：`AgentEvent`→`AgentSessionEvent`、`ExecutionEnv`→`Models`、AgentHarness 新增泛型 `TContext`、`AgentHarnessTool` 新增 context 参数、新增 `agent/src/harness/tools/` 目录。行号和部分 API 描述可能已过时。参见 [`../_change_log/`](../_change_log/README.md)。

本目录聚焦 pi-mono 的 Agent 内核：`packages/agent`（纯运行时）和 `packages/coding-agent`（应用层扩展）共同构成的 agent 系统。

## 阅读路径

1. 先读 [01-Anatomy](./01-Anatomy/README.md) — 静态结构
2. 再读 [02-Runtime](./02-Runtime/README.md) — 运行时循环和 pipeline
3. 然后读 [03-Memory](./03-Memory/README.md) — 内存管理和 compaction
4. 最后读 [04-Harness](./04-Harness/README.md) — 工具执行和 harness 基础设施
5. 深入源码时以每篇文章的"源码锚点"为入口

## 章节导航

- [01-Anatomy](./01-Anatomy/README.md): 静态结构、消息模型、工具注册、扩展系统
  - [1.1_Agent_Info.md](./01-Anatomy/1.1_Agent_Info.md): Agent 身份、配置与生命周期
  - [1.2_Message_Graph.md](./01-Anatomy/1.2_Message_Graph.md): 消息类型系统与 LLM 转换桥
  - [1.3_Tool_Registry.md](./01-Anatomy/1.3_Tool_Registry.md): 三层工具系统与执行模式
  - [1.4_Extension_System.md](./01-Anatomy/1.4_Extension_System.md): 扩展生命周期、事件扇出与能力注入
- [02-Runtime](./02-Runtime/README.md): Agent 运行时循环、pipeline、queue、cancellation
- [03-Memory](./03-Memory/README.md): Compaction、token 估算、session tree
  - [3.5_Session_v4.md](./03-Memory/3.5_Session_v4.md): **v0.84.0 新增** — lane-based 会话存储（Entry/LaneRecord/facts、durable operations、JSONL 原子发布）
- [04-Harness](./04-Harness/README.md): AgentHarness、Skills、System Prompt、Extension Runner、Bash/Edit/Write Tools
  - ... (6 篇)
  - [4.7_Harness_Tools.md](./04-Harness/4.7_Harness_Tools.md): **v0.83.0 新增** — factory 模式工具架构
- [05-Infra](./05-Infra/README.md): **v0.83.0 新增** — AI 基础设施层（API adapter、auth 子系统）
  - [5.1_AI_API_Layer.md](./05-Infra/5.1_AI_API_Layer.md): wire-protocol streaming 与 lazy loading
  - [5.2_AI_Auth_Subsystem.md](./05-Infra/5.2_AI_Auth_Subsystem.md): credential 生命周期与 OAuth 流程

## 按问题读

- 想先搞清"Agent 到底是什么、怎么配置、有哪些钩子": 读 [1.1_Agent_Info.md](./01-Anatomy/1.1_Agent_Info.md)
- 想看"消息怎么从用户输入变成 LLM 可理解的内容，以及自定义消息怎么注入": 读 [1.2_Message_Graph.md](./01-Anatomy/1.2_Message_Graph.md)
- 想看"工具为什么有三层类型系统、怎么注册、怎么控制执行顺序": 读 [1.3_Tool_Registry.md](./01-Anatomy/1.3_Tool_Registry.md)
- 想看"扩展怎么加载、事件怎么扇出、runtime provider 怎么注册": 读 [1.4_Extension_System.md](./01-Anatomy/1.4_Extension_System.md)
- 想看"Agent 一次回答为什么会分多轮继续跑、steering 和 follow-up 有什么区别": 读 [1.1_Agent_Info.md](./01-Anatomy/1.1_Agent_Info.md) 的 QueueMode 部分 + `packages/agent/src/agent-loop.ts` 的 `runLoop()`
- 想看"Agent 的双层 loop 和 stream/execute pipeline": 读 [02-Runtime/](./02-Runtime/README.md)
- 想看"compaction、token 估算和 session tree": 读 [03-Memory/](./03-Memory/README.md)
- 想看"AgentHarness、skills、bash/edit/write 工具怎么执行": 读 [04-Harness/](./04-Harness/README.md)

## 写作定调（统一标准）

今后章节正文统一采用"能力设计视角"，默认顺序如下：

1. `现象是什么`
2. `核心矛盾是什么`
3. `实现思想是什么`
4. `在 Agent 能力面里的影响是什么`
5. `源码锚点是什么`
6. `最小例子是什么`

执行要求：
- 规则只在本 README 定义，不在每篇正文重复写"写作规范"段落。
- 每篇必须保留源码锚点（至少 2 个有效文件/函数锚点）。
- 例子必须可验证，至少写清"你会观察到什么信号/结果"。
- 避免"先贴源码再讲问题"的旧顺序；优先 `问题 -> 思想 -> 影响 -> 证据 -> 例子`。

## 章节独立性判据（何时应合并）

- `现象` 必须能让读者在 1 段内看懂"这篇在解释什么运行问题"；如果只能写成"本篇补充上一章"，默认不独立成篇。
- `核心矛盾` 必须明确至少两条会互相拉扯的目标；如果只剩术语罗列（例如仅列模块名），应并入上游章节的"实现思想"小节。
- 单篇若无法给出可验证的最小例子（看不到可观察信号），优先合并，不勉强保留。

## 已知缺口（v0.84.2 新结构未覆盖）

| 目录/包 | 一句话 | 优先级 |
|---------|--------|--------|
| `packages/agent/src/harness/session/`（v4） | ✅ 已写 [3.5_Session_v4.md](./03-Memory/3.5_Session_v4.md) | — |
| `packages/ai/src/api/` | ✅ 已写 [5.1_AI_API_Layer.md](./05-Infra/5.1_AI_API_Layer.md)（v0.84 警示已加） | — |
| `packages/ai/src/auth/` | ✅ 已写 [5.2_AI_Auth_Subsystem.md](./05-Infra/5.2_AI_Auth_Subsystem.md)（v0.84 警示已加） | — |
| `packages/agent/src/harness/tools/` | ✅ 已写 [4.7_Harness_Tools.md](./04-Harness/4.7_Harness_Tools.md)（v0.84 警示已加） | — |
| `packages/agent/src/search/` | 通用搜索模块（`scanning.ts`），v0.84 新增 | 中 |
| `packages/protocol` / `client` / `server` | client/server 协议栈（experimental），见 integration/06 的路径介绍 | 中（属 integration 域） |
| `packages/telemetry` | vendor-neutral typed telemetry，从 agent 包 re-export | 低 |
| `packages/session-backends/sqlite-node` | SQLite session 后端（从 `storage/` 迁入） | 低 |
| `packages/coding-agent/src/extensions/` | built-in extensions 层 + llama.cpp 参考实现（v0.83 遗留） | 中 |
| `packages/ai/src/compat/` | legacy extension OAuth type shim（v0.83 遗留） | 低 |

参见 [`_change_log/_scout-v0.83.0.md`](../_change_log/_scout-v0.83.0.md) 了解每个目录的详细分析。

## 收敛说明

- 当前 5 个 section（01-Anatomy / 02-Runtime / 03-Memory / 04-Harness / 05-Infra），共 23 篇。
- 正文基于 v0.75.3 编写，v0.83.0 / v0.84.2 两轮以警示标注演进；本仓库代码已同步到 v0.84.2+8，行号锚点对应工作树。
- v0.83.0 的重要变化（影响 agent/ 文档）：
  - `AgentEvent` → `AgentSessionEvent`（更正旧说法：`AgentEvent` 定义仍在 `agent/src/types.ts:428`，`AgentSessionEvent` 在 `coding-agent/src/core/agent-session.ts:141`，两者都不在 harness/types.ts）
  - AgentHarness 新增泛型 `TContext`（**v0.84.0 又全部移除**，见顶部警示）；`ExecutionEnv` 被 `Models` 替代
  - 新增 `agent/src/harness/tools/` 目录（factory 模式工具架构）
  - `ThinkingLevel` 新增 `"max"`；Compaction 支持 retry 和 `retainedTail`
  - ~~`ModelSelectEvent`/`ThinkingLevelSelectEvent` 改名~~（2026-08-17 复核：v0.84.2 源码中现名仍是 `ModelSelectEvent`/`ThinkingLevelSelectEvent`，`extensions/types.ts:794-806`；改名未发生，旧记载有误）
- v0.84.0 的重要变化见顶部警示和 [`../_change_log/0003-v0.83.0-to-v0.84.2.md`](../_change_log/0003-v0.83.0-to-v0.84.2.md)。
- 未来如果 `packages/agent` 和 `packages/coding-agent` 的职责边界有变化，需要更新本目录的映射。
