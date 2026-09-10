# 04-Harness：内部接线层

> **⚠️ v0.85.1 基线（2026-09-10）**：本节从 v0.75.3 语义进化，**`AgentHarness` 已在 v0.83 / v0.84 / v0.85 三次重构**——v0.83 加泛型 `TContext`、v0.84 移除并去泛型化为 `AgentLane` 骨架、**v0.85 把这副骨架填成了真实现**。
>
> **本文档集里"`AgentHarness` 是 stub/骨架、不能用"的说法全部过时。** v0.85.1 里 `HarnessNotImplemented` 在源码中**零命中**，`AgentHarness` 现在由 `Drive` + effect gate + 13 个扁平 durable `OperationState` 组成、能跑完整 turn；唯一剩下的未实现方法是 `watchSession()`（`packages/agent/src/harness/runtime/harness.ts:305-307`）。hooks 由 `hooks.ts:15` 的 `HookRegistry` 实现，且 **`HookMap` 的 11 个 hook 全部有真实调用点**（不再是抛错的 `UnavailableRegistry`）。[4.1_AgentHarness.md](4.1_AgentHarness.md) 已按 v0.85.1 整体重写。
>
> **但产品集成路径仍然不变**：`AgentSession` / SDK 仍是推荐入口。原因是 harness 线目前只被 `coding-agent/src/experimental/` 消费，且 **`AgentSession` / `sdk.ts` 完全不 import harness**——两者是**并列实现**，不是上下堆叠。完整变更见 [`../../_change_log/0006-v0.84.4-to-v0.85.1.md`](../../_change_log/0006-v0.84.4-to-v0.85.1.md)。
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
| 关键角色 | 内部接线层的机制：ExtensionRunner、Skills、Tools、System Prompt（`AgentHarness` 是 v0.85 填好的内层 harness，但产品路径不用它，见 4.1） | SDK、RPC、web-ui、CLI |
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

`Agent` 是裸循环（接收 messages，调用 LLM，执行 tool calls，产生 events）。`AgentHarness` 在它上面加 **durable session 状态**（每次 turn 把 effect 落进 bound values/lists）、**typed hooks**（`on(name, handler)` 拦截/修改行为）、**高级操作**（`compact()`、`navigateTree()`、`skill()`）——**这一层在 v0.85 已经是真实现**（v0.83/v0.84 曾是纯骨架）。

**但真正被产品使用的那条线是 `AgentSession`**：extension runner、resource loader、auto-compaction、retry，全部可用。

关键结构事实（v0.85.1 复核）：**这两者是并列实现，不是上下堆叠。** `packages/coding-agent/src/core/agent-session.ts` 与 `sdk.ts` **完全不 import `agent/src/harness/`**（grep 零命中）——`AgentSession` 直接建在 `Agent` 类之上，走的是另一条路。所以不要把它们画成"骨架 → live 实现"的替补关系：

```
                    ┌─ AgentHarness (v0.85 填好的内层 harness；消费方：experimental 线)
Agent (裸循环) ─────┤
                    └─ AgentSession (产品路径的 live orchestrator；消费方：SDK / RPC / TUI)
```

选型结论不变：**产品集成走 `AgentSession` / SDK**。理由从"harness 是 stub"变成了"harness 虽已实现，但只被 `coding-agent/src/experimental/` 消费、且仍有 `watchSession` 一个 stub"。

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
