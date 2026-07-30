# 04 Event Model：自己的 UI 怎么听 pi-mono

## 为什么事件模型是 UI harness 的核心

无 TUI 集成不能靠同步 API 返回值得到完整体验。Agent 会流式输出文本、启动工具、更新工具状态、遇错重试、触发 compaction、进入 idle。宿主 UI 必须把这些事件折叠成自己的 timeline、tool cards、状态栏和错误提示。

pi-mono 的事件通道：

- **SDK**：`session.on("event", callback)` — EventEmitter 风格。
- **RPC**：stdout 的 `{"type":"event",...}` JSONL 行。

事件类型定义在 [`packages/agent/src/harness/types.ts`](../../packages/agent/src/harness/types.ts) 的 `AgentSessionEvent` union type（v0.83.0：从 `AgentEvent` 改名，并移入 harness types）。

## 事件的基本形态

Agent 运行时会产生一系列 `AgentSessionEvent`。每个事件有 `type` 字段区分类别，payload 可包含 message、part、tool、turn 等不同数据。

事件是**推模型**——Agent 主动产生，宿主被动接收。

## 最重要的事件类别

外部 UI 第一版至少关心这些事件：

| 事件类别 | 关键 type 值 | 作用 |
|---|---|---|
| **消息** | `message.updated` | user/assistant message 元信息变化 |
| **Part** | `message.part.updated` | text、tool、reasoning 等 part 增量更新 |
| **Turn** | `turn.started`、`turn.ended` | 标记一轮 prompt-response 的开始和结束 |
| **Tool** | `tool.started`、`tool.ended` | 工具执行的生命周期 |
| **Session** | `session.status`、`session.error` | 判断 running/idle/busy、展示错误 |
| **Agent settled** | `agent_settled` | **v0.83.0 新增**：agent run 完全结束（替代旧的 `agent_end`），用于 idle 检测 |
| **Bash 更新** | `bash_execution_update` | **v0.83.0 新增**：bash 执行过程中的流式输出更新 |
| **模型/思考变更** | `model_update`、`thinking_level_update` | **v0.83.0 改名**：从 `model_select`/`thinking_level_select` 改名 |
| **Compaction** | compaction 事件 + `summarization_retry_*` | 上下文压缩及重试事件（v0.83.0 新增 retry 系列） |
| **Entry** | `entry_appended` | **v0.83.0 新增**：session entry 追加 |

## `message.part.updated` 怎么渲染

`message.part.updated` 是 UI 最应该认真处理的事件。它代表一条 message 中某个 part 的增量更新。part 类型包括：

- **`text`**：assistant 文本输出，应渲染为文本气泡。
- **`reasoning`**：模型的思考过程（thinking），应渲染为可折叠的推理区。
- **`tool`**：工具调用（状态 `pending`、`running`、`completed`、`error`），应渲染为工具卡片。

做图形 UI 时，把 part 投影成自己的组件：

- text bubble — 普通文本气泡
- reasoning collapsible — 可折叠的思考区
- bash / read / edit / write / find / grep / ls tool card — 工具执行卡片
- error card — 错误和重试状态
- turn divider — turn 之间的分隔线

## `turn` 事件

- `turn.started`：新一轮开始。外部 UI 应该在 timeline 上开始一个新的会话轮次。
- `turn.ended`：当前轮次结束。可以折叠该轮次，展示摘要。

## `tool.*` 事件

工具事件提供工具执行的完整生命周期：

- `tool.started`：工具开始执行（显示 loading 状态）。
- `tool.updated`（如果存在）：长运行工具的中间输出（如 bash 流式输出）。
- `tool.ended`：工具执行完成（显示结果或错误）。

bash 工具的流式输出是一个特例——它在执行期间持续更新，外部 UI 应该实时展示 stdout/stderr。

## completion 不等于 prompt() 返回

- SDK 的 `session.prompt()` 返回代表 prompt **被接受并提交**，不代表 Agent 已完成。
- RPC 的 `prompt` 命令被处理后，事件会持续到达，直到 `{"type":"ended",...}`。
- 最终完成判断靠 `session.status` 变为 `idle`。

第一版 UI harness 可以简单做：

1. 发送 prompt 后记录当前状态为 `running`。
2. 事件流中持续更新 UI。
3. 收到 `turn.ended` 或 `session.status` 为 `idle` 后解除输入锁。
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

RPC 模式下，事件被序列化为 JSONL 行：

```json
{"type":"event","event":{"type":"message.part.updated","messageId":"...","part":{"type":"text","text":"I'll fix the auth tests."}}}
{"type":"event","event":{"type":"tool.ended","toolName":"read","result":"...","durationMs":120}}
```

宿主需要在 JSONL 解析中区分三种顶级消息类型：

- `{"type":"event", ...}` → AgentSessionEvent（v0.83.0：从 AgentEvent 改名）
- `{"type":"response", "id":"...", ...}` → 对带 id 命令的直接响应
- `{"type":"ended", ...}` → prompt/steer/follow_up 完成

## 重连恢复

RPC 子进程如果崩溃或断连，宿主不能假设自己拿到了所有事件。

建议恢复策略：

1. 重新 spawn RPC 子进程，或重新创建 AgentSession。
2. 调 `get_state`（RPC）或 `session.getState()`（SDK）重建运行状态。
3. 调 `get_messages`（RPC）或 `session.getMessages()`（SDK）重建消息历史。
4. 如果有未完成的 prompt，用 `get_state` 检查状态再决定是重试还是继续。

pi-mono 的 session 持久化在本地 JSONL 文件（`SessionManager`），重启后可以恢复。这跟 OpenCode 的 SSE 重连 + REST 恢复策略思路一致，但实现上更轻量——直接读文件，不需要调多个 REST endpoint。

## 事件批处理

做 UI 时，Agent 事件可能以高频到达（特别是在流式文本输出期间）。pi-mono 的 interactive mode 使用了 16ms batch 来减少渲染：

```
事件到达 → 入队 → 16ms throttle → batch 处理 → UI 更新
```

这个模式是通用的，外部 UI 也应该考虑。详见 [`packages/coding-agent/src/modes/interactive/`](../../packages/coding-agent/src/modes/interactive/) 中的批处理逻辑。

## Extension UI 协议

pi-mono 有一个 Extension UI 协议（定义在 AgentSession 和 ExtensionRunner 的交互中）。extension 可以通过 `ExtensionAPI` 注册 UI context，在 TUI 中展示自定义界面。

对于外部 UI 来说，这是**可选的进阶特性**。第一版集成不需要处理 Extension UI——它主要是为 TUI 插件设计的。但如果你的宿主也需要让 extension 渲染自定义 UI，需要实现 `ExtensionUIContext` 接口。
