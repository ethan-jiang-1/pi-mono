# 04 Event Model：自己的 UI 怎么听 pi-mono

## 为什么事件模型是 UI harness 的核心

无 TUI 集成不能靠同步 API 返回值得到完整体验。Agent 会流式输出文本、启动工具、更新工具状态、遇错重试、触发 compaction、进入 idle。宿主 UI 必须把这些事件折叠成自己的 timeline、tool cards、状态栏和错误提示。

pi-mono 的事件通道：

- **SDK**：`session.subscribe(listener)` — 返回取消函数（`agent-session.ts:857`），不是 EventEmitter 风格。
- **RPC**：stdout 的 `{"type":"event",...}` JSONL 行。

事件类型定义在两处（v0.84.2 验证）：

- [`packages/agent/src/types.ts`](../../packages/agent/src/types.ts) `AgentEvent`（types.ts:429）——Agent 内核级事件：消息、turn、工具执行
- [`packages/coding-agent/src/core/agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) `AgentSessionEvent`（agent-session.ts:144）= `AgentEvent`（重定义了带 `willRetry` 的 `agent_end`）+ session 级扩展事件（compaction、retry、queue 等）

SDK 事件监听拿到的就是 `AgentSessionEvent`；JSON/RPC 输出经 `toJsonEvent()`（[`modes/json-event.ts`](../../packages/coding-agent/src/modes/json-event.ts)）做了一次 wire 级裁剪（见下文 `message_update`）。

## 事件的基本形态

Agent 运行时会产生一系列 `AgentSessionEvent`。每个事件有 `type` 字段区分类别，payload 可包含 message、delta、tool、turn 等不同数据。

事件是**推模型**——Agent 主动产生，宿主被动接收。

## 最重要的事件类别

外部 UI 第一版至少关心这些事件（事件名均为 snake_case，v0.84.2 实测，不存在 `message.part.updated` 之类点分事件名）：

| 事件类别 | 关键 type 值 | 作用 |
|---|---|---|
| **消息** | `message_start` / `message_update` / `message_end` | 一条 `AgentMessage` 的生命周期。`message_update` **只对 assistant 流式输出触发**，且 wire 上只带 delta |
| **Turn** | `turn_start` / `turn_end` | 一轮 assistant 响应 + 工具调用；`turn_end` 带完整 `message` 和 `toolResults` |
| **工具** | `tool_execution_start` / `tool_execution_update` / `tool_execution_end` | 工具执行生命周期；`update` 带流式 `partialResult` |
| **Agent 级** | `agent_start` / `agent_end` / `agent_settled` | run 边界；`agent_end` 带 `willRetry`；`agent_settled`（v0.83.0 新增）表示 agent 完全安静下来，**idle 检测用它** |
| **队列** | `queue_update` | steering / followUp 排队消息变化 |
| **Compaction** | `compaction_start` / `compaction_end` + `summarization_retry_*` | 上下文压缩及 summarization 重试（v0.83.0 新增 retry 系列） |
| **Compaction 失败** | `session_compact_failed`（v0.84.3，**扩展专属，不上 wire**） | compaction 失败/中止（manual/threshold/overflow）时通知扩展（`extensions/types.ts:618`）；外部 UI 无法通过 JSON/RPC 监听，只能走 SDK 的 `AgentSession` 扩展事件 |
| **扩展 UI 提示** | `ui_prompt_start` / `ui_prompt_end`（v0.84.4，**扩展专属，不上 wire**） | 阻塞式扩展 UI 提示（`ctx.ui.select/confirm/input/editor/custom`）前后通知扩展（`extensions/types.ts:748-762`，runner 包装见 agent/4.4）；`queueMicrotask` 异步发射不阻塞 prompt；外部 UI 若自己实现了扩展宿主可参考此模式 |
| **自动重试** | `auto_retry_start` / `auto_retry_end` | provider 错误后的自动重试 |
| **Bash 更新** | `bash_execution_update` | bash 执行期间的流式 stdout/stderr delta |
| **杂项** | `entry_appended`、`session_info_changed`、`thinking_level_changed` | session entry 追加、session 改名、thinking level 变化 |

## `message_update` 怎么渲染：delta 拼装模型

`message_update` 是 UI 最应该认真处理的事件，也是 **v0.84.0 的 breaking change**：JSON 和 RPC wire 上的 `message_update` **只带 delta，不再带累积 message 快照**（旧版本的 `message` 和 `assistantMessageEvent.partial` 字段导致输出随长度平方增长，已移除）。

拼装规则（[`modes/json-event.ts:40-45`](../../packages/coding-agent/src/modes/json-event.ts) 的权威注释）：

1. `message_start` → 初始 `AgentMessage`
2. `message_update` → 只带 `{ type, usage, assistantMessageEvent }`，其中 `assistantMessageEvent` 是单个 delta 事件（`partial` 字段已被剥掉）
3. `message_end` → **最终的权威 message**

`assistantMessageEvent` 的 delta 类型（定义在 [`packages/ai/src/types.ts`](../../packages/ai/src/types.ts) `AssistantMessageEvent`，ai/types.ts:535）：

- 文本：`text_start` / `text_delta` / `text_end`（带 `contentIndex` 和 `delta: string`）
- 思考：`thinking_start` / `thinking_delta` / `thinking_end`
- 工具调用：`toolcall_start` / `toolcall_delta` / `toolcall_end`
- 终止：`done`（stop/length/toolUse/deferred）、`error`（aborted/error）

累积 `usage` 保留在每条 `message_update` 里——它大小恒定，不构成平方增长。

**v0.84.3 增强**：wire 上的 `toolcall_start` delta 现在**额外带 `id` 和 `toolName`**（[`modes/json-event.ts:23-30`](../../packages/coding-agent/src/modes/json-event.ts)，从 partial content 提取，`id`/`toolName` 大小恒定不构成增长）。外部 UI 可以在 `message_start` 之前就拿到工具调用的 id 和名称来关联 tool card，而不必等 `toolcall_delta` 或 `tool_execution_*`。

**v0.84.4 注意（custom message 时序）**：扩展在 run 中途 `sendMessage(..., { triggerTurn: false })` 发的自定义消息不再立即入 tree/发事件——入 `_pendingCustomMessages` 队列（agent-session.ts:331），在 `turn_end` 处理末尾 flush（:721/:1532-1536），flush 时才发 `message_start`/`message_end`。这保证自定义消息不会插在 assistant tool call 与其 tool result 之间（严格校验消息顺序的 provider 会拒绝重放），外部 UI 也不会看到"tree 里还没有的消息"的事件。

做图形 UI 时，把 content 投影成自己的组件：

- text bubble — 按 `contentIndex` 维护文本缓冲，`text_delta` 追加
- reasoning collapsible — `thinking_delta` 追加，`thinking_end` 定稿
- tool card — `toolcall_start` 开卡（args 由 `toolcall_delta` 流式拼 JSON），配合 `tool_execution_*` 事件更新状态
- error card — `assistantMessageEvent.type === "error"` 或 `auto_retry_*` 事件
- turn divider — `turn_start` / `turn_end`

## `turn` 事件

- `turn_start`：新一轮开始。外部 UI 应该在 timeline 上开始一个新的会话轮次。
- `turn_end`：当前轮次结束，带完整 `message` 和 `toolResults`——懒加载的 UI 可以只在 turn 边界用 `turn_end` 的权威 payload 渲染，忽略中间 delta。

## `tool_execution_*` 事件

工具事件提供工具执行的完整生命周期：

- `tool_execution_start`：工具开始执行（带 `toolCallId`、`toolName`、`args`，显示 loading 状态）。
- `tool_execution_update`：长运行工具的中间输出（带 `partialResult`）。
- `tool_execution_end`：工具执行完成（带 `result` 和 `isError`）。

bash 工具的流式输出是双重路径——`tool_execution_update`（结构化 partial）之外还有独立的 `bash_execution_update` 事件（纯文本 delta），外部 UI 应该实时展示 stdout/stderr。

## completion 不等于 prompt() 返回

- SDK 的 `session.prompt()` 返回代表 prompt **被接受并提交**，不代表 Agent 已完成。
- RPC 的 `prompt` 命令被处理后，事件会持续到达，直到 `agent_settled` 事件（**没有 `ended` 顶级消息**）。
- 最终完成判断：SDK 监听 `agent_settled`（v0.83.0 起，agent run 完全结束后触发）；RPC 监听 `{"type":"event","event":{"type":"agent_settled"}}`。`agent_end` 带 `willRetry`，不能直接当"结束"用——`willRetry: true` 时后面还有 `auto_retry_*`。

第一版 UI harness 可以简单做：

1. 发送 prompt 后记录当前状态为 `running`。
2. 事件流中持续更新 UI。
3. 收到 `agent_settled`（SDK）或 RPC 的 `{"type":"event","event":{"type":"agent_settled"}}` 后解除输入锁。
4. 期间出现错误时展示错误状态，允许用户重试或修改 prompt。

## 权限和阻断：hook 模型

pi-mono 用 hook 函数做权限控制，不是交互式弹窗：

- `beforeToolCall`：在工具执行前调用。可以返回 `block` 阻断执行。
- `afterToolCall`：在工具执行后调用，可以审查结果。

对外部 UI 来说：

- **SDK 路线**：在 `createAgentSession` 时注入 customTools，在 tool 的 execute 中实现权限逻辑。也可以通过 extension 注册 `beforeToolCall` hook。
- **RPC 路线**：事件流包含工具调用信息。要实现阻断式权限需要更复杂的交互——比如宿主在收到 bash 工具即将执行的通知时，先暂停 Agent（不发下一个事件），向用户弹窗确认，再根据用户选择决定是否允许。

这个模型比 OpenCode 的交互式弹窗更灵活（可以基于任意逻辑决定是否阻断），但也意味着**外部 UI 需要自己实现权限交互流程**。

## 事件在 RPC 中的表示

RPC 模式下，事件被序列化为 JSONL 行（事件名与 SDK 完全一致，但 `message_update` 经过了 delta 裁剪）：

```json
{"type":"event","event":{"type":"message_start","message":{...}}}
{"type":"event","event":{"type":"message_update","usage":{...},"assistantMessageEvent":{"type":"text_delta","contentIndex":0,"delta":"I'll fix the auth tests."}}}
{"type":"event","event":{"type":"tool_execution_end","toolCallId":"...","toolName":"read","result":"...","isError":false}}
{"type":"event","event":{"type":"agent_settled"}}
```

宿主需要在 JSONL 解析中区分三种顶级消息类型：

- `{"type":"event", ...}` → `AgentSessionEvent`（wire 形态 = `JsonAgentSessionEvent`）
- `{"type":"response", "id":"...", ...}` → 对带 id 命令的直接响应
- ~~`{"type":"ended", ...}`~~ — v0.84.2 **没有** `ended` 顶级消息；prompt/steer/follow_up 的完成信号就是 `agent_settled` 事件

## 重连恢复

RPC 子进程如果崩溃或断连，宿主不能假设自己拿到了所有事件。

建议恢复策略：

1. 重新 spawn RPC 子进程，或重新创建 AgentSession。
2. 调 `get_state`（RPC）重建运行状态；SDK 用只读 getter `session.state`（`AgentState`，`agent-session.ts:905`）——没有 `getState()` 方法。
3. 调 `get_messages`（RPC）或 SDK `session.messages`（getter，`agent-session.ts:997`）重建消息历史——没有 `getMessages()` 方法。
4. 如果有未完成的 prompt，用 `get_state` 检查状态再决定是重试还是继续。

pi-mono 的 session 持久化在本地 JSONL 文件（`SessionManager`），重启后可以恢复。(注：agent 包的 session v4 在 JSONL 后端之外另有 `JsonlSessionRepo`，见 agent/03-Memory/3.5，但 coding-agent 层暂未接入。)这跟 OpenCode 的 SSE 重连 + REST 恢复策略思路一致，但实现上更轻量——直接读文件，不需要调多个 REST endpoint。

## 事件批处理

做 UI 时，Agent 事件可能以高频到达（特别是在流式文本输出期间）。pi-mono 的 interactive mode 使用了 16ms batch 来减少渲染：

```
事件到达 → 入队 → 16ms throttle → batch 处理 → UI 更新
```

这个模式是通用的，外部 UI 也应该考虑。详见 [`packages/coding-agent/src/modes/interactive/`](../../packages/coding-agent/src/modes/interactive/) 中的批处理逻辑。

## Extension UI 协议

pi-mono 有一个 Extension UI 协议（定义在 AgentSession 和 ExtensionRunner 的交互中）。extension 可以通过 `ExtensionAPI` 注册 UI context，在 TUI 中展示自定义界面。

对于外部 UI 来说，这是**可选的进阶特性**。第一版集成不需要处理 Extension UI——它主要是为 TUI 插件设计的。但如果你的宿主也需要让 extension 渲染自定义 UI，需要实现 `ExtensionUIContext` 接口。

## session v4 对新事件模型的影响

v0.84.0 agent 包的 session 存储换代 lane-based v4（详见 `agent/03-Memory/3.5_Session_v4.md`），但 coding-agent 的 `SessionManager`（RPC/SDK 使用的 session 持久化）尚未接入这套新模型。对外部集成者来说：

- SDK/RPC 当前事件的产生和存储不受 session v4 影响——事件仍由 `AgentSession` 管理、`SessionManager` 持久化（`core/session-manager.ts` 只从 `pi-agent-core` 取 `AgentMessage`，不 import `harness/session`；唯一接入 harness 的是 **dev-only** 的 `src/experimental/`）。
- 未来 coding-agent 若把主线接入 agent 包的 lane/harness，事件模型才可能增加 lane 相关事件（如 operation / attachment 相关）。
- `message_update` 增量化（v0.84.0，本节已有详述）与快照无关——它是 JSON/RPC wire 的体积优化。

**v0.85.1 更正**：上一版本文写的"跟踪方向是 protocol/client/server 的 `SessionSnapshot` 模型"**已失效**——`SessionSnapshot` 在 `protocol/src`、`client/src`、`server/src` 里**零命中**，旧的 `session.subscribe(snapshot => ...)` 快照订阅也已删除。该路径在 v0.85 被重建为 chord（`packages/chord`）的薄适配层，寻址模型改为 **service-addressed**（`RpcTarget = ServerTarget{serverId} | SessionTarget{serverId,sessionId,attachmentId}`），presentation 状态模型是 **chord service 订阅 + `LaneSnapshot`/`reduceLaneSnapshot`**（`LaneSnapshot` 定义在 `harness/agent-harness.ts:228`，经 `index.ts:43` 的 `export *` 公开；`reduceLaneSnapshot` 由 `index.ts:77` 自 `harness/runtime/reducer.ts` 导出）。**注意这条路径整体已降级为 dev-only、非 supported**（三包从 `dependencies` 降为 `devDependencies`、`files` 排除其 dist、CHANGELOG 在 v0.85.0/0.85.1 段为空）——详见 integration/06，不要把它当"未来方向"来规划。

当前结论自洽：事件模型本篇描述的是 coding-agent 层事件的真实行为，不受 agent 包 session v4 未接入的影响。
