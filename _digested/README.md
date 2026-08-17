# _digested

> **当前源码基线**：正文当前对应 pi-mono `v0.83.0`（commit `71efc6f0`）。2026-07-30 从 v0.75.3 更新而来，但只完成了一半：integration/ 已更新 API 描述和事件类型；agent/ 21 篇仅有版本警示、行号和机制细节未逐篇修订；5 个新增源码结构（`ai/api/`、`ai/auth/`、`agent/harness/tools/` 等）已有专题分析。版本演进和旧行为只记录在 [`_change_log/`](./_change_log/README.md)。
>
> ⚠️ **upstream 当前已到 v0.84.2+8**（`d3ab2af9`，515 commits ahead，2026-08-17 发现）。v0.84.0 是架构换代版本，直接推翻本目录多处结论：harness session 模型重写为 v4（旧 JSONL/in-memory repo API 已删除）、`message_update` 事件改纯增量、client/server/protocol 三件套（experimental）成型、fullscreen TUI、auth 一批 breaking。详见 [`_change_log/0003-v0.83.0-to-v0.84.2.md`](./_change_log/0003-v0.83.0-to-v0.84.2.md)。
>
> 上一轮的执行计划与进度见 [`_change_log/_plan-1-v0.83.0.md`](./_change_log/_plan-1-v0.83.0.md)（Phase 5 收尾未完成）。

## 这是什么

`_digested/` 是 pi-mono 的"消化层"：它不替代源码、README 或正式 docs，而是把源码里分散的入口、协议、事件、Agent loop 和集成边界重新整理成更容易进入的心智模型。

它服务的读者不是"已经熟悉项目的人"，而是第一次研究 pi-mono、想快速判断架构、运行路径、Agent 内核和外部嵌入可能性的人。目标是让读者先知道"这是什么、怎么跑、哪里重要、哪些说法不能误解"，再决定要不要深入源码。

Agent 内核入口：[`agent/`](agent/)

集成入口：[`integration/`](integration/)

## pi-mono 是什么

pi-mono 是一个 **library-first 的 AI coding agent 平台**，设计目标不仅是一个可以在终端使用的 coding agent，更是一个可以被其他产品嵌入的 agent 引擎。

基线 v0.83.0 时它由 7 个包组成一个 monorepo（v0.75.3 时代的 `web-ui`/`mom`/`pods` 已在上游移除）：

| 包 | 职责 | 层级 |
|---|---|---|
| `packages/ai` | LLM 抽象层：模型定义、多 provider 适配、流式协议、消息类型 | 基础设施 |
| `packages/agent` | 纯 Agent 运行时：消息管理、工具执行、事件系统、Agent loop | Agent 内核 |
| `packages/coding-agent` | 完整应用层：CLI/TUI/RPC/SDK、扩展系统、会话管理、内置工具 | 应用外壳 |
| `packages/tui` | 终端 UI 库：组件系统、渲染引擎、输入处理 | UI 框架 |
| `packages/evals` | eval harness | 辅助 |
| `packages/server` | PiServer session server（experimental） | 集成 |
| `packages/storage` | session 存储（sqlite-node） | 基础设施 |

v0.84.x 又新增 4 个包（`protocol`、`client`、`telemetry`、`session-backends`），见顶部警示和 [`_change_log/0003-v0.83.0-to-v0.84.2.md`](./_change_log/0003-v0.83.0-to-v0.84.2.md)。

## 核心思想

这个目录的核心不是"多写几篇总结"，而是做三件事：

1. **把项目读薄。** 先把 pi-mono 压成少数关键心智模型：library-first 集成、两种 harness、Agent 内核与外壳分离、扩展系统、工具注册链、消息转换桥。
2. **把误解挡住。** 例如 pi-mono 没有 HTTP server 作为主要集成方式——SDK（`createAgentSession()` 进程内）和 RPC（JSONL over stdin/stdout 子进程）才是。`packages/agent` 是纯运行时，`packages/coding-agent` 才是带 TUI 的全应用。
3. **把研究变成入口。** 每一轮研究都应该沉淀成更好的读者路径：10 分钟快速判断、30 分钟 Agent 骨架、深潜专题，而不是只留下零散笔记。

## 这个目录的特点

- **读者优先。** 先回答陌生读者的问题，再放源码名和路径。
- **分层阅读。** 入口文档只讲判断和地图，深文档才讲 API、事件和源码细节。
- **事实和解释分开。** 能从源码、README、docs 核对的写成"硬事实"；帮助理解的抽象写成"解释"。
- **核心运行时和产品外壳分开。** TUI、CLI、Web-UI 都是客户端形态；Agent 内核（`packages/agent`）和会话管理（`packages/coding-agent/src/core`）才是宿主系统最可能复用的能力面。
- **只改 `_digested/`。** 这是研究层，不污染 upstream 源码和正式文档。

## 两种 Harness 不要混淆

pi-mono 里需要严格区分两种 harness：

| 名称 | 关心的问题 | 阅读入口 |
|---|---|---|
| 内部能力 harness | 扩展、工具、模型、快捷键、CLI flag、Skill、Prompt 如何进入 Agent loop | [`agent/01-Anatomy/1.4_Extension_System.md`](agent/01-Anatomy/1.4_Extension_System.md) |
| 外部集成 harness | 另一个产品如何启动 pi-mono、创建 session、发请求、听事件、处理状态 | [`integration/`](integration/) |

前者是"给 Agent 补能力和护栏"，后者是"把 Agent 接进另一个宿主系统"。两者共享同一套源码事实，但读者问题完全不同。

## 推荐阅读路径

### 10 分钟：快速判断能不能嵌入

1. 阅读本文件了解整体架构和两种 harness 区分
2. 看 [`integration/README.md`](integration/) 了解 SDK 和 RPC 两种集成路径
3. 确认 pi-mono 是 library-first：`createAgentSession()` 返回一个 `AgentSession` 对象供宿主驱动

目标：能说清楚 SDK、RPC、AgentSession、Agent、事件订阅、tool allowlisting 之间的关系，知道没有 HTTP server 这一集成路径。

### 30 分钟：建立 Agent 骨架

1. [`agent/01-Anatomy/`](agent/01-Anatomy/) — 静态结构：Agent 信息、消息图、工具注册、扩展系统
2. 源码深潜：`packages/agent/src/agent.ts`（Agent 类）、`packages/agent/src/types.ts`（AgentLoopConfig）、`packages/coding-agent/src/core/sdk.ts`（createAgentSession）

目标：能看懂 Agent 是怎样通过 AgentLoopConfig 把所有行为点暴露给宿主的，以及 coding-agent 层是如何组合 agent 内核 + 扩展 + 会话管理生成一个可用的 session。

### 深入专题：按问题进入

- 想理解 Agent 内核和消息循环：[`agent/`](agent/)
- 想理解外部宿主怎么接：[`integration/`](integration/)
- 想理解扩展系统怎么注入能力：`agent/01-Anatomy/1.4_Extension_System.md`
- 想理解工具怎么注册、怎么执行：`agent/01-Anatomy/1.3_Tool_Registry.md`

## 研究背后的期望

做这些研究的最终目的，是把 pi-mono 从"一个可以替代 Claude Code 的终端 AI coding agent"，读成一个可以被评估、被解释、被集成、被二次利用的平台能力。

当前最关心的方向是**外部集成 harness**：也就是不直接使用终端 TUI，而是用合适的接入方式把 pi-mono 的 agent 运行时能力接到其他宿主系统里。SDK（进程内）和 RPC（子进程 JSONL）是两条已经存在的集成路径。

换句话说，`_digested/` 不只是读源码笔记；它也是在回答一个更实际的问题：**pi-mono 能不能成为别的产品里的 agent 引擎，应该怎么接，边界在哪里。**

## 事实锚点

关键事实主要来自这些源码：

- Agent 运行时：`packages/agent/src/agent.ts`、`packages/agent/src/types.ts`、`packages/agent/src/agent-loop.ts`
- LLM 抽象层：`packages/ai/src/types.ts`
- SDK 入口：`packages/coding-agent/src/core/sdk.ts`
- AgentSession：`packages/coding-agent/src/core/agent-session.ts`
- 扩展系统：`packages/coding-agent/src/core/extensions/types.ts`、`loader.ts`、`runner.ts`
- 工具系统：`packages/coding-agent/src/core/tools/index.ts`、`tool-definition-wrapper.ts`
- RPC 模式：`packages/coding-agent/src/modes/rpc/`

## 子目录

| 目录 | 聚焦 | 一句话 |
|------|------|--------|
| `agent/` | Agent 内核解剖 | 静态结构、运行时、内存管理、harness 机制 |
| `integration/` | 外部集成 | SDK/RPC 两种接入路径、事件模型、recipes |
| `_change_log/` | 上游同步记录 | 每次 upstream 版本同步的变更摘要和影响评估 |

## 与同级目录的关系

| 目录 | 本质 | 受众 |
|------|------|------|
| **`_digested/`** | 源码消化，机制剖析 | 想彻底搞懂背后发生了什么的人 |
| `../_faq_on_digested/` | 基于消化材料的二次研究 | 我自己（产出者） |
| `_change_log/` | 上游版本追踪 | 维护者 |

## 用法

- **分析产物**：所有 markdown 分析文档放入对应子目录。
- **事实标记**：新增导览尽量区分"硬事实 / 解释 / 推测"，避免把未来方向写成已经发生。
- **新增专题**：如果需要新的分析维度，创建新的子目录即可。
- **版本追踪**：upstream 发布新版本后，在 `_change_log/` 中写 sync record，然后按影响评估更新受影响的专题文档。
- **严禁**：不要编辑 `_digested/` 之外的任何文件，除非任务明确要求。
