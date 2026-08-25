# 04-Harness：内部接线层

> **⚠️ v0.84.2 基线（2026-08-17）**：本节从 v0.75.3 语义进化，多处描述需以 4.1 的 v0.84.2 复核为准。核心变化：**`AgentHarness` 已在 v0.83/v0.84 两次重构**——v0.83 加泛型 `TContext`、v0.84 又移除并去泛型化为 `AgentLane` 骨架。在 v0.84.2 里 `AgentHarness` **是一个 stub/骨架**：绝大多数操作抛 `HarnessNotImplemented`、`create()` 遇已有 record 抛错、hooks/events 由 `UnavailableRegistry` 直接 throw，"当前没有任何可跑的行为"。真正可用的 live 实现是 **`AgentSession` / SDK**（`createAgentSession()`）。因此本篇"一句话总览"里把 AgentHarness 描述成完整运作层是**过时表述**，以 4.1 为准。
>
> 关于本目录标题里的 "harness"：它是顶层 README 四种含义里的 **① 内部能力 harness**（扩展/Skill/工具如何进入 agent loop），**不是** ③ 的 `AgentHarness` 类。二者抽象层次不同，勿混淆。

> 目标读者：理解 Agent 能力如何进入 agent loop 的人（extension 开发者、平台接入方）。

## 这个目录在看什么

`Agent`（`packages/agent`）只做裸的 LLM 对话循环。它不理解 session、不理解 skills、不理解 extension 事件系统。

本目录研究的是 **Agent 之上的内部 harness 层**：能力（skills、tools、system prompt、extensions、bash/edit/write）如何被注入 agent loop，形成完整可用的 agent 运行时。

## 和 `integration/` 的区别

这是很多文档搞混的地方。我们用最简单的方式讲清楚：

| 维度 | `04-Harness`（内部接线） | `integration/`（外部接线） |
|---|---|---|
| 研究什么 | 能力如何**进入** agent loop | 外部产品如何**嵌入** pi-mono |
| 关键角色 | 内部接线层的机制：ExtensionRunner、Skills、Tools、System Prompt（`AgentHarness` 类只是其中的 stub 骨架，见 4.1） | SDK、RPC、web-ui、CLI |
| 谁在用 | pi-mono 自身的 TUI、RPC、print mode | 外部产品（IDE、Web App、Slack bot） |
| 典型问题 | "system prompt 怎么拼出来的" | "我怎么在自己的 App 里调 `session.prompt()`" |
| 源码位置 | `packages/agent/src/harness/`、`packages/coding-agent/src/core/` | `packages/coding-agent/src/modes/`、`packages/coding-agent/src/core/sdk.ts` |

打个比方：`04-Harness` 研究的是发动机的进气/点火/供油系统；`integration/` 研究的是怎么把这台发动机装到汽车、轮船、发电机上。

## 阅读顺序

| 你想知道什么 | 读哪篇 |
|---|---|
| AgentHarness 怎么在 Agent 上加事件系统 | [`4.1_AgentHarness.md`](4.1_AgentHarness.md) |
| Skills 怎么被发现、加载、注入 prompt | [`4.2_Skills.md`](4.2_Skills.md) |
| System prompt 的完整构建链 | [`4.3_System_Prompt.md`](4.3_System_Prompt.md) |
| Extension 的生命周期和事件分发 | [`4.4_Extension_Runner.md`](4.4_Extension_Runner.md) |
| bash 工具的实现（进程、流、取消） | [`4.5_Tool_Bash.md`](4.5_Tool_Bash.md) |
| edit/write 工具和文件突变队列 | [`4.6_Tool_Edit_Write.md`](4.6_Tool_Edit_Write.md) |
| Harness 工具（factory 模式架构） | [`4.7_Harness_Tools.md`](4.7_Harness_Tools.md) |

## 一句话总览

`Agent` 是裸循环（接收 messages，调用 LLM，执行 tool calls，产生 events）。在 v0.83/v0.84 里曾有一个 `AgentHarness` 想在它上面加 **session 持久化**（每次 turn 写回 session tree）、**typed hooks**（`on(type, handler)` 拦截/修改能力行为）、**高级方法**（`compact()`、`navigateTree()`、`skill()`）——**但这些在 v0.84.2 都是 stub**（多数抛 `HarnessNotImplemented`，见 4.1）。真正把这些能力做出来的是 **`AgentSession`**：extension runner、resource loader、auto-compaction、retry，全部可用。

可以理解为：`AgentHarness` 是"设计好的骨架契约"，`AgentSession` 是"把它实现出来的 live orchestrator"：

```
Agent (裸循环) → AgentHarness (骨架契约，v0.84.2 多为 stub) → AgentSession (live 实现，完整 orchestrator) → SDK/扩展
```

## 源码锚点

- AgentHarness: `packages/agent/src/harness/agent-harness.ts`
- Harness 类型: `packages/agent/src/harness/types.ts`
- Skills 加载: `packages/agent/src/harness/skills.ts`
- System prompt: `packages/agent/src/harness/system-prompt.ts` / `packages/coding-agent/src/core/system-prompt.ts`
- Extension runner: `packages/coding-agent/src/core/extensions/runner.ts`
- Extension loader: `packages/coding-agent/src/core/extensions/loader.ts`
- Bash 工具: `packages/coding-agent/src/core/tools/bash.ts`
- Bash executor: `packages/coding-agent/src/core/bash-executor.ts`
- Edit 工具: `packages/coding-agent/src/core/tools/edit.ts`
- Write 工具: `packages/coding-agent/src/core/tools/write.ts`
- 文件突变队列: `packages/coding-agent/src/core/tools/file-mutation-queue.ts`
