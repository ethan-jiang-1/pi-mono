# 02 进阶：架构、协议和设计原理

> 本文已对照 v0.84.2 复核（2026-08-17）。

## 前提

读完 `01-start-here.md`，你已经知道 pi-mono 可以用 SDK（进程内）或 RPC（子进程）集成。本文讲它**为什么**这样设计，以及各种集成路径的深层架构。

## 三层架构（从集成视角看）

pi-mono 的核心是三个包的明确分层，每一层都可以独立作为集成面（外围还有 `pi-tui`、`pi-telemetry`、session 存储后端 `packages/session-backends/`（其 npm 名是 `@earendil-works/pi-session-backend-sqlite-node`）、`pi-evals` 等配套包，以及 v0.84 新增的 experimental `pi-protocol`/`pi-client`/`pi-server` 远程会话三件套，见下文）：

```
┌──────────────────────────────────────┐
│ pi-coding-agent                      │  ← 完整产品层：SDK、RPC、工具、扩展
│ @earendil-works/pi-coding-agent      │     第一版集成的默认入口
│ packages/coding-agent/src/core/      │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ pi-agent-core                    │ │  ← Agent 内核：agentLoop、消息、工具执行
│ │ @earendil-works/pi-agent-core    │ │     适合只想要循环逻辑的场景
│ │ packages/agent/src/              │ │
│ │                                  │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │ pi-ai                        │ │ │  ← LLM 抽象层：provider、stream、token
│ │ │ @earendil-works/pi-ai        │ │ │     一般不需要直接集成
│ │ │ packages/ai/src/             │ │ │
│ │ └──────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### 各层的集成价值

| 层 | 集成入口 | 你会得到什么 | 你不会得到什么 |
|---|---|---|---|
| pi-ai | `streamSimple()` | 统一的 LLM provider 抽象、流式响应 | 工具执行、session、权限 |
| pi-agent-core | `Agent` class（循环内核 `agentLoop`/`runAgentLoop`） | LLM + 工具循环、消息树、compaction hook | 具体工具定义、扩展系统、session 持久化 |
| pi-coding-agent | `createAgentSession()` 或 RPC | 完整产品：8 个内置工具（read/bash/edit/write/grep/find/ls/powershell，默认激活前 4 个）、扩展、session 树、bash 安全 | HTTP server、多租户、认证 |

第一版集成建议直接用 `pi-coding-agent`。只有在你已经有一套自己的工具/扩展系统，只想要纯循环逻辑时，才退到 `pi-agent-core`。

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

### 33 个 RPC 命令

`RpcCommand` union（`rpc-types.ts`）当前有 33 个变体（v0.84.4 起，新增 `clear_queue`）：

| 分类 | 命令 | 说明 |
|---|---|---|
| **Prompt** | `prompt` | 普通用户请求，可附带 images、`streamingBehavior: "steer"\|"followUp"` |
| | `steer` | 在当前 turn 中调整方向 |
| | `follow_up` | 启动新一轮 follow-up |
| | `abort` | 取消当前运行的 prompt |
| | `new_session` | 创建新 session，可指定 parent session |
| **State** | `get_state` | 获取 `RpcSessionState` |
| **Model** | `set_model` | 切换 provider 和 model |
| | `cycle_model` | 循环切换可用模型 |
| | `get_available_models` | 列出可用模型 |
| **Thinking** | `set_thinking_level` | 设置思考深度 |
| | `cycle_thinking_level` | 循环切换思考深度 |
| | `get_available_thinking_levels` | 列出当前模型支持的思考深度 |
| **Queue** | `set_steering_mode` | 调整 steering 队列模式 |
| | `set_follow_up_mode` | 调整 follow-up 队列模式 |
| | `clear_queue`（v0.84.4） | 清空 steering/followUp 队列，返回被清掉的文本（Esc 时先清队列再 abort，把文本还原进编辑器） |
| **Compaction** | `compact` | 手动触发 compaction，可带 customInstructions |
| | `set_auto_compaction` | 开关自动 compaction |
| **Retry** | `set_auto_retry` | 开关自动重试 |
| | `abort_retry` | 取消自动重试 |
| **Bash** | `bash` | 直接执行 shell 命令，可 excludeFromContext |
| | `abort_bash` | 取消正在运行的 bash |
| **Session** | `get_session_stats` | 获取 session 统计（tokens, 消息数） |
| | `export_html` | 导出 session 为 HTML |
| | `switch_session` | 切换到另一个 session 文件 |
| | `fork` | 从指定 entry fork 新分支 |
| | `clone` | clone 当前 session |
| | `get_fork_messages` | 列出可 fork 的用户消息 |
| | `get_entries` | 按 append 序返回 session entries（可带 `since`） |
| | `get_tree` | 返回 session entry 树 + leafId |
| | `get_last_assistant_text` | 获取最后一轮 assistant 文本 |
| | `set_session_name` | 设置 session 名称 |
| **Messages** | `get_messages` | 获取当前消息列表 |
| **Commands** | `get_commands` | 列出可用 slash command（extension/prompt/skill） |

另有 `extension_ui_response` 一族 stdin 消息，用于回应 extension 发起的 UI 请求（select/confirm/input/editor/notify/setStatus/setWidget/setTitle/set_editor_text）。

### 命令格式

每条命令是一个 JSON 对象，写入 stdin 时以 `\n` 结尾：

```json
{"type":"prompt","message":"fix the failing tests","images":[]}
{"type":"steer","message":"use vitest instead of jest"}
{"id":"req-1","type":"get_state"}
```

`id` 字段是可选的。有 `id` 时，RPC processor 会在响应中回传同一个 `id`，方便宿主做请求-响应匹配。没有 `id` 的命令是 fire-and-forget。

### 输出格式

stdout 上有两类 JSONL 消息：

```json
{"id":"req-1","type":"response","command":"get_state","success":true,"data":{"thinkingLevel":"medium","isStreaming":false}}
{"id":"req-2","type":"response","command":"bash","success":false,"error":"exit code 1"}
{"type":"event","event":{"type":"message_update","usage":{"totalTokens":0},"assistantMessageEvent":{"type":"text_delta","contentIndex":0,"delta":"..."}}}
{"type":"event","event":{"type":"tool_execution_start","toolCallId":"...","toolName":"edit","args":{}}}
{"type":"event","event":{"type":"agent_settled"}}
```

- `response`：对一个带 `id` 命令的应答——`{ id?, type: "response", command, success: true, data? }` 或 `{ ..., success: false, error }`（完整 union 见 `RpcResponse`，rpc-types.ts:110 起）。注意 payload 在 `data` 字段，且必须回显 `command` 名；不存在 `payload` 字段。
- 事件：**有 `{"type":"event", ...}` 外层包装**——`rpc-mode.ts:355-356` 是 `session.subscribe((event) => output(toJsonEvent(event)))`，`toJsonEvent()` 改写 `message_update`（剥离累积 `partial` 快照；v0.84.3 起对 `toolcall_start` delta 额外补上 `id`/`toolName`，见 `json-event.ts`）；其余事件原样放 `event` 字段（`agent_start`/`turn_start`/`tool_execution_start|update|end`/`message_end`/`agent_end`/`agent_settled`/`compaction_*`/`auto_retry_*`/`queue_update` 等）。宿主解析时按 `04-event-model.md` 的三种顶层类型（event / response）处理。
- **没有 `ended` 消息**。一轮 prompt 的完成信号是 `{"type":"event","event":{"type":"agent_settled"}}`（`RpcClient.waitForIdle()`/`collectEvents()` 靠它判断）。
- `extension_ui_request`（stdout）与 `extension_ui_response`（stdin）：extension 需要宿主代答的 UI 请求（select/confirm/input/editor/notify/setStatus/setWidget/setTitle/set_editor_text），宿主以 `extension_ui_response` 回复。

**v0.84.4 行为备注**（宿主可感知，均无 API 变化）：① `persist` 模型默认时若带非空 `--models` scope，该 model 会同时追加进 scope 与 enabledModels（agent-session.ts:1679，见 03）；② 运行中扩展自定义消息延迟到 `turn_end` 后追加，`message_start`/`message_end` 相应推迟（见 04）；③ 上一轮 session 文件若末行无换行符，读入时自动补 `\n` 修复（session-manager.ts:555，#8345）——宿主直接读 session JSONL 时遇到残尾可按此处理。

## 远程/server 形态：protocol / client / server 三件套（experimental）

本文早先版本描述的 web-ui（把 agent 编译进浏览器、直连 LLM provider）**已删除**——v0.75.3 → v0.83.0 之间就已移除，v0.84.2 树里没有 `apps/web-ui/`。如果需要 server-first / 远程会话形态，现在有一条官方路径——三个 experimental 新包：

| 包 | npm 名 | 角色 |
|---|---|---|
| `packages/protocol/` | `@earendil-works/pi-protocol` | transport 中立的 CBOR 协议：length-prefixed framing + schema（`framing.ts`、`schemas.ts`、`codec.ts`） |
| `packages/client/` | `@earendil-works/pi-client` | `PiClient`：通过 `ByteTransport` 接口（WebSocket/Unix socket 等任意有序字节流）与 server 交换 framed CBOR；session lease（exclusive/shared）、快照订阅、按 ID 关联请求。无 Node 专属 import，可在浏览器运行 |
| `packages/server/` | `@earendil-works/pi-server` | `PiServer` session server：宿主实现 `PiServerService`（listSessions/listModels/createSession/openSession...），`createUnixServer()` 等 listener 组装传输层。README 明确标注 "Experimental... may change or be removed without notice" |

这条路径与 JSONL RPC 的分工：JSONL RPC（`pi --mode rpc`）面向**同机子进程**、人类可读、面向流式 stdout；protocol/client/server 面向**远程/多客户端**会话管理，二进制成帧、快照一致。做 web/远程产品时，现在有四种选择：

1. **pi-client + pi-server**（官方 experimental server 栈，适合远程会话/多前端）
2. 用 SDK 在 Node server 中包装，暴露 HTTP/WS 给前端（自建 server，最可控）
3. 用 RPC 子进程方案，让 server 管理 spawn 的 agent 进程（JSONL 协议）
4. 纯前端直连 provider（pi-ai 本身可在浏览器跑，但没有文件/系统工具，是受限子集）

## 权限模型：hook-based 而非交互弹窗

pi-mono 的权限模型和 OpenCode 有根本差异：

- **OpenCode**：Agent 遇到需要权限的操作时，通过 SSE 发 `permission.asked` 事件，宿主要调用 `/permission/:id/reply` API 回复。
- **pi-mono**：权限通过 **hook 函数** 实现。`beforeToolCall` hook 可以在工具执行前阻断，外部系统注入自己的阻断逻辑。

钩子定义在 [`packages/agent/src/types.ts`](../../packages/agent/src/types.ts) 的 `AgentLoopConfig`（`AgentOptions`，即 `new Agent(...)` 的参数，原样透出）：`beforeToolCall`（参数校验后、执行前；返回 `{ block: true }` 阻断，循环转而产出 error tool result，还可 `terminate: true` 触发批次早停）和 `afterToolCall`（工具完成之后、`tool_execution_end` 与 tool-result 消息事件发出之前；可覆写 content/details/isError/usage）。循环内核在 [`packages/agent/src/agent-loop.ts`](../../packages/agent/src/agent-loop.ts)。注意 `harness/agent-harness.ts` 是另一层东西——session/lane 编排 harness，不定义工具钩子。extension 通过 coding-agent 的 extension 事件系统注册同类拦截。

对外部集成来说，这意味着：

- SDK 路线：你可以在 `createAgentSession` 时注入 custom tools，在 tool 的 execute 函数中实现自己的权限逻辑。
- RPC 路线：JSONL 事件流中包含工具调用信息（`tool_execution_start` 等），你可以实现"监听→阻断→决定"的模式。

但核心循环（`agentLoop`/`runAgentLoop`）本身**不包含内置的交互式权限弹窗**。权限是扩展层关注的，不是循环层关注的。

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
5. JSON 事件改写 → [`packages/coding-agent/src/modes/json-event.ts`](../../packages/coding-agent/src/modes/json-event.ts)
6. 循环内核 → [`packages/agent/src/agent-loop.ts`](../../packages/agent/src/agent-loop.ts)；工具钩子 → [`packages/agent/src/types.ts`](../../packages/agent/src/types.ts)
7. AgentHarness（session/lane 编排） → [`packages/agent/src/harness/agent-harness.ts`](../../packages/agent/src/harness/agent-harness.ts)
8. 远程会话三件套 → [`packages/protocol/src/`](../../packages/protocol/src/)、[`packages/client/src/`](../../packages/client/src/)、[`packages/server/src/`](../../packages/server/src/)
