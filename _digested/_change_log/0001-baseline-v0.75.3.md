# 基线 0001：`_digested/` 初始建立

**日期**: 2026-05-19
**upstream**: [earendil-works/pi](https://github.com/earendil-works/pi)
**fork**: [ethan-jiang-1/pi-mono](https://github.com/ethan-jiang-1/pi-mono)
**基线 commit**: `76705633` (v0.75.3 + 9 commits)
**仓库总 commit 数**: ~4183

## 这不是一次 sync

这是 `_digested/` 的初始建立——不是从一个旧版本同步到新版本，而是对 pi-mono 源码的**首次消化分析**。

当时没有记录"从哪个版本开始"的意识。事后追溯：`ethan` 分支基于 `main`（= `upstream/main`）在 commit `76705633` 处建立，`_digested/` 作为唯一一个额外 commit 叠在上面。

## 覆盖范围

### agent/ — 21 篇，4 个 section

| Section | 篇数 | 覆盖 |
|---------|------|------|
| 01-Anatomy | 4 | AgentLoopConfig、消息类型系统、三层工具模型、扩展系统 |
| 02-Runtime | 7 | 双层 loop、Processor pipeline、LLM Bridge、Retry Scheduler、Session Service、Queue Modes、Cancellation |
| 03-Memory | 4 | Compaction、Branch Summary、Token Estimation、Session Tree |
| 04-Harness | 6 | AgentHarness、Skills、System Prompt、Extension Runner、Bash Tool、Edit/Write Tools |

### integration/ — 6 篇

| 篇 | 覆盖 |
|----|------|
| 01-start-here | SDK vs RPC 快速判断、最小闭环 |
| 02-advanced | 三层架构、library-first 设计、RPC 协议、web-ui |
| 03-runtime-api | SDK API 序列、RPC 命令目录、JSONL 成帧 |
| 04-event-model | 事件分类、消息渲染、重连策略 |
| 05-recipes | 5 种产品形态的集成方案 |
| 06-coverage-and-parity | Runtime 能力覆盖表、TUI parity 差距 |

### 关键源码文件（37 个引用）

```
packages/agent/src/agent.ts
packages/agent/src/agent-loop.ts
packages/agent/src/types.ts
packages/agent/src/harness/agent-harness.ts
packages/agent/src/harness/types.ts
packages/agent/src/harness/skills.ts
packages/agent/src/harness/system-prompt.ts
packages/agent/src/harness/compaction/compaction.ts
packages/agent/src/harness/compaction/branch-summarization.ts
packages/agent/src/harness/session/session.ts
packages/ai/src/types.ts
packages/ai/src/stream.ts
packages/ai/src/api-registry.ts
packages/ai/src/models.generated.ts
packages/ai/src/providers/anthropic.ts
packages/ai/src/utils/event-stream.ts
packages/coding-agent/src/main.ts
packages/coding-agent/src/core/sdk.ts
packages/coding-agent/src/core/agent-session.ts
packages/coding-agent/src/core/session-manager.ts
packages/coding-agent/src/core/messages.ts
packages/coding-agent/src/core/system-prompt.ts
packages/coding-agent/src/core/skills.ts
packages/coding-agent/src/core/bash-executor.ts
packages/coding-agent/src/core/tools/index.ts
packages/coding-agent/src/core/tools/bash.ts
packages/coding-agent/src/core/tools/edit.ts
packages/coding-agent/src/core/tools/write.ts
packages/coding-agent/src/core/tools/file-mutation-queue.ts
packages/coding-agent/src/core/tools/output-accumulator.ts
packages/coding-agent/src/core/tools/tool-definition-wrapper.ts
packages/coding-agent/src/core/extensions/types.ts
packages/coding-agent/src/core/extensions/loader.ts
packages/coding-agent/src/core/extensions/runner.ts
packages/coding-agent/src/modes/rpc/jsonl.ts
packages/coding-agent/src/modes/rpc/rpc-client.ts
packages/coding-agent/src/modes/rpc/rpc-types.ts
```

### 未覆盖

| 包 | 状态 |
|----|------|
| `packages/tui` | 仅提及存在，未深入分析 |
| `packages/web-ui` | 仅在 integration/02 中简要提及 |
| `packages/mom` | 未分析 |
| `packages/pods` | 未分析 |

### 已知问题

- `agent/README.md` 自述"当前只有一层：01-Anatomy"，但 02-04 已完整填充
- 所有源码锚点带行号，随 upstream 演进会漂移
- 无 commit hash / tag 引用——无法判断文档对应当前哪个代码状态
- agent 与 integration 之间的交叉引用很少
- 没有术语索引或 glossary
