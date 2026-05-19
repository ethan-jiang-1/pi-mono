# pi-mono Agent 架构手册

本目录聚焦 pi-mono 的 Agent 内核：`packages/agent`（纯运行时）和 `packages/coding-agent`（应用层扩展）共同构成的 agent 系统。

## 阅读路径

1. 先读 [01-Anatomy](./01-Anatomy/README.md) — 静态结构
2. 然后回到本文件查看"按问题读"定位具体问题
3. 深入源码时以每篇文章的"源码锚点"为入口

相比 OpenCode 的四层体系（01-Anatomy / 02-Runtime / 03-Memory / 04-Harness），pi-mono 的 agent 层更紧凑。核心原因是：

- **pi-mono 的 Agent 内核设计极度干净。** `packages/agent` 只有 ~700 行的 agent-loop，没有任何内置的工具实现、权限引擎或内存管理策略——这些全部通过 `AgentLoopConfig` 的回调点暴露给上层（coding-agent 或外部宿主）自己决定。
- **扩展系统是应用层的事。** 不像 OpenCode 把插件/ACP/MCP 作为内核的一部分，pi-mono 的扩展系统全在 `packages/coding-agent` 里，agent 内核甚至不知道扩展的存在。
- **内存管理在会话层。** 压缩、截断、上下文预算等都由 `packages/coding-agent/src/core/compaction/` 处理，不是 agent 内核的职责。

因此本目录当前只有一层：**01-Anatomy**。它覆盖了理解 agent 系统所需的所有静态结构。

## 章节导航

- [01-Anatomy](./01-Anatomy/README.md): 静态结构、消息模型、工具注册、扩展系统
  - [1.1_Agent_Info.md](./01-Anatomy/1.1_Agent_Info.md): Agent 身份、配置与生命周期
  - [1.2_Message_Graph.md](./01-Anatomy/1.2_Message_Graph.md): 消息类型系统与 LLM 转换桥
  - [1.3_Tool_Registry.md](./01-Anatomy/1.3_Tool_Registry.md): 双层工具系统与执行模式
  - [1.4_Extension_System.md](./01-Anatomy/1.4_Extension_System.md): 扩展生命周期、事件扇出与能力注入

## 按问题读

- 想先搞清"Agent 到底是什么、怎么配置、有哪些钩子": 读 [1.1_Agent_Info.md](./01-Anatomy/1.1_Agent_Info.md)
- 想看"消息怎么从用户输入变成 LLM 可理解的内容，以及自定义消息怎么注入": 读 [1.2_Message_Graph.md](./01-Anatomy/1.2_Message_Graph.md)
- 想看"工具为什么有三层类型系统、怎么注册、怎么控制执行顺序": 读 [1.3_Tool_Registry.md](./01-Anatomy/1.3_Tool_Registry.md)
- 想看"扩展怎么加载、事件怎么扇出、runtime provider 怎么注册": 读 [1.4_Extension_System.md](./01-Anatomy/1.4_Extension_System.md)
- 想看"Agent 一次回答为什么会分多轮继续跑、steering 和 follow-up 有什么区别": 读 [1.1_Agent_Info.md](./01-Anatomy/1.1_Agent_Info.md) 的 QueueMode 部分 + `packages/agent/src/agent-loop.ts` 的 `runLoop()`

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

## 收敛说明

- 当前为初始版本，覆盖了理解 pi-mono agent 系统的最小必要范围。
- 未来如果 `packages/agent` 和 `packages/coding-agent` 的职责边界有变化，需要更新本目录的映射。
- 与 OpenCode 的主要区别：pi-mono 没有内置的 Agent 角色（build/plan/explore），没有权限引擎（permission ask/deny），工具数量少得多（7 个 vs 20+），但扩展系统和 SDK 集成路径更加清晰。
