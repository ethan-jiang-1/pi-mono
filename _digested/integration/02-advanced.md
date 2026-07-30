# 02 进阶：架构、协议和设计原理

## 前提

读完 `01-start-here.md`，你已经知道 pi-mono 可以用 SDK（进程内）或 RPC（子进程）集成。本文讲它**为什么**这样设计，以及各种集成路径的深层架构。

## 三层架构（从集成视角看）

pi-mono 不是一个大包，而是三个包的明确分层，每一层都可以独立作为集成面：

```
┌──────────────────────────────────────┐
│ pi-coding-agent                      │  ← 完整产品层：SDK、RPC、工具、扩展
│ packages/coding-agent/src/core/      │     第一版集成的默认入口
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ pi-agent                         │ │  ← Agent 内核：runLoop、消息、工具执行
│ │ packages/agent/src/              │ │     适合只想要循环逻辑的场景
│ │                                  │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │ pi-ai                        │ │ │  ← LLM 抽象层：provider、stream、token
│ │ │ packages/ai/src/             │ │ │     一般不需要直接集成
│ │ └──────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### 各层的集成价值

| 层 | 集成入口 | 你会得到什么 | 你不会得到什么 |
|---|---|---|---|
| pi-ai | `streamSimple()` | 统一的 LLM provider 抽象、流式响应 | 工具执行、session、权限 |
| pi-agent | `Agent` class + `runLoop()` | LLM + 工具循环、消息树、compaction hook | 具体工具定义、扩展系统、session 持久化 |
| pi-coding-agent | `createAgentSession()` 或 RPC | 完整产品：7 个内置工具、扩展、session 树、bash 安全 | HTTP server、多租户、认证 |

第一版集成建议直接用 `pi-coding-agent`。只有在你已经有一套自己的工具/扩展系统，只想要纯循环逻辑时，才退到 `pi-agent`。

## 为什么是 library-first 而不是 server-first

OpenCode 选择了 server-first（`opencode serve` + HTTP/SSE），pi-mono 选择了 library-first。这不是偶然，而是两种产品的设计取舍：

| 考量 | server-first | library-first |
|---|---|---|
| 跨语言支持 | HTTP 天然跨语言 | 需要写 JSONL 协议解析（或等 SDK 多语言移植） |
| 宿主集成深度 | 通过网络调用，进程隔离 | 直接对象调用，零延迟 |
| 状态管理 | Server 持有状态，宿主通过 REST/SSE 同步 | 宿主持有 Session 对象，同步调用 |
| 多进程 | 天然支持多个 client 连接同一 server | 需要自己管理进程 |
| 资源占用 | 常驻进程 | 宿主进程内运行，或按需 spawn |
| 调试 | 需要查 server 日志 | 直接在宿主调试器里断点 |

pi-mono 的 library-first 使它特别适合：

- **IDE 插件**：agent 跑在编辑器的 Node 扩展进程里，和编辑器共享文件系统感知。
- **Electron/Tauri App**：agent 跑在主进程或后台 worker 里，前端通过 IPC 通信。
- **本地脚本**：直接 `import` 然后调用，不需要先启动独立进程。

如果你需要 server-first 的行为（比如 Python 前端连接），用 RPC 子进程模式 —— spawn `pi --mode rpc` 就获得了等价效果。

## RPC 协议设计

RPC 协议定义在 [`packages/coding-agent/src/modes/rpc/rpc-types.ts`](../../packages/coding-agent/src/modes/rpc/rpc-types.ts)。它使用**严格 JSONL（JSON Lines）成帧**——每条消息以 `\n` 分隔，payload 内部使用 JSON 标准。

JSONL 成帧逻辑在 [`packages/coding-agent/src/modes/rpc/jsonl.ts`](../../packages/coding-agent/src/modes/rpc/jsonl.ts)。注意它**故意没有使用 Node readline**——readline 会把 Unicode 行分隔符（U+2028, U+2029）当作换行，而它们在 JSON 字符串里是合法的，所以必须用 LF-only 分割。

### 22 个 RPC 命令

| 分类 | 命令 | 说明 |
|---|---|---|
| **Prompt** | `prompt` | 普通用户请求，可附带 images |
| | `steer` | 在当前 turn 中调整方向 |
| | `follow_up` | 启动新一轮 follow-up |
| | `abort` | 取消当前运行的 prompt |
| | `new_session` | 创建新 session，可指定 parent session |
| **State** | `get_state` | 获取当前 AgentState |
| **Model** | `set_model` | 切换 provider 和 model |
| | `cycle_model` | 循环切换可用模型 |
| | `get_available_models` | 列出可用模型 |
| **Thinking** | `set_thinking_level` | 设置思考深度 |
| | `cycle_thinking_level` | 循环切换思考深度 |
| **Queue** | `set_steering_mode` | 调整 steering 队列模式 |
| | `set_follow_up_mode` | 调整 follow-up 队列模式 |
| **Compaction** | `compact` | 手动触发 compaction |
| | `set_auto_compaction` | 开关自动 compaction |
| **Retry** | `set_auto_retry` | 开关自动重试 |
| | `abort_retry` | 取消自动重试 |
| **Bash** | `bash` | 直接执行 shell 命令 |
| | `abort_bash` | 取消正在运行的 bash |
| **Session** | `get_session_stats` | 获取 session 统计（tokens, 消息数） |
| | `export_html` | 导出 session 为 HTML |
| | `switch_session` | 切换到另一个 session |
| | `fork` | 从指定 entry fork 新分支 |
| | `clone` | clone 当前 session |
| | `set_session_name` | 设置 session 名称 |
| | `get_last_assistant_text` | 获取最后一轮 assistant 文本 |
| **Messages** | `get_messages` | 获取当前消息树 |
| **Commands** | `get_commands` | 列出可用 slash command |

### 命令格式

每条命令是一个 JSON 对象，写入 stdin 时以 `\n` 结尾：

```json
{"type":"prompt","message":"fix the failing tests","images":[]}
{"type":"steer","message":"use vitest instead of jest"}
{"id":"req-1","type":"get_state"}
```

`id` 字段是可选的。有 `id` 时，RPC processor 会在响应中回传同一个 `id`，方便宿主做请求-响应匹配。没有 `id` 的命令是 fire-and-forget。

### 响应格式

```json
{"type":"response","id":"req-1","payload":{"status":"running","...AgentState...}}
{"type":"event","event":{"type":"message.updated","...AgentSessionEvent...}}
{"type":"ended","id":"...","payload":{"messageId":"..."}}
```

- `response`：直接响应一个有 `id` 的命令
- `event`：Agent 运行期间的实时事件
- `ended`：一次 prompt/steer/follow_up 完成

RPC 响应的完整类型见 `RpcResponse` union type。

## web-ui 的特殊架构

pi-mono 的 web-ui（[`apps/web-ui/`](../../apps/web-ui/)）和 OpenCode 的 web-ui 完全不同：

```
OpenCode web-ui:
  浏览器 ←HTTP/SSE→ opencode serve ←→ Agent runtime

pi-mono web-ui:
  浏览器 ←直接调 LLM provider→ pi-agent (in-browser)
```

pi-mono 的 web-ui 把 pi-agent **编译到浏览器里运行**，直接在浏览器中调用 LLM provider（Anthropic、OpenAI 等）。这意味着：

- **没有中间 server**。前端就是 agent。
- **不需要 `opencode serve` 等价物**。
- **工具执行受限**。Bash、文件读写这些在浏览器里做不了，所以 web-ui 是一个**受限子集**。

如果你在做自己的 web 产品，有三种选择：
1. 参考 web-ui 的纯前端方案（适合轻量、不需要文件/系统操作的场景）
2. 用 SDK 在 Node server 中包装，暴露 HTTP/WS 给前端（自建 server）
3. 用 RPC 子进程方案，让 server 管理 spawn 的 agent 进程

## 权限模型：hook-based 而非交互弹窗

pi-mono 的权限模型和 OpenCode 有根本差异：

- **OpenCode**：Agent 遇到需要权限的操作时，通过 SSE 发 `permission.asked` 事件，宿主要调用 `/permission/:id/reply` API 回复。
- **pi-mono**：权限通过 **hook 函数** 实现。`beforeToolCall` hook 可以在工具执行前阻断，外部系统注入自己的阻断逻辑。

源码中（[`packages/agent/src/harness/agent-harness.ts`](../../packages/agent/src/harness/agent-harness.ts)），AgentHarness 定义了事件钩子系统，包括 `beforeToolCall` 和 `afterToolCall`。extension 可以注册这些钩子来拦截或修改工具调用。

对外部集成来说，这意味着：

- SDK 路线：你可以在 `createAgentSession` 时注入 custom tools，在 tool 的 execute 函数中实现自己的权限逻辑。
- RPC 路线：JSONL 事件流中包含工具调用信息，你可以实现"监听→阻断→决定"的模式。

但核心循环（`runLoop`）本身**不包含内置的交互式权限弹窗**。权限是扩展层关注的，不是循环层关注的。

## 内部 harness vs 外部 harness

这是理解 pi-mono 架构的关键区分：

| | 内部 harness | 外部 harness |
|---|---|---|
| **位置** | `packages/agent/src/harness/`、`packages/coding-agent/src/core/extensions/` | 你的产品代码 |
| **角色** | 让扩展/Skill/工具进入 Agent 循环 | 让宿主系统使用 Agent 能力 |
| **接口** | `AgentHarness` events、`ExtensionAPI`、`ToolDefinition` | `createAgentSession()`、`RpcClient` |
| **文档** | `agent/04-Harness/` | 本目录 |

外部 harness 不直接操作 ExtensionRunner 或 AgentHarness——它通过 SDK 或 RPC 间接使用这些能力。

## 源码阅读路线

如果要从源码验证本文的结论：

1. SDK 入口 → [`packages/coding-agent/src/core/sdk.ts`](../../packages/coding-agent/src/core/sdk.ts)
2. AgentSession 编排器 → [`packages/coding-agent/src/core/agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts)
3. RPC 协议 → [`packages/coding-agent/src/modes/rpc/rpc-types.ts`](../../packages/coding-agent/src/modes/rpc/rpc-types.ts)
4. RPC 客户端 → [`packages/coding-agent/src/modes/rpc/rpc-client.ts`](../../packages/coding-agent/src/modes/rpc/rpc-client.ts)
5. 循环内核 → [`packages/agent/src/agent-loop.ts`](../../packages/agent/src/agent-loop.ts)
6. AgentHarness → [`packages/agent/src/harness/agent-harness.ts`](../../packages/agent/src/harness/agent-harness.ts)
7. web-ui → [`apps/web-ui/`](../../apps/web-ui/)
