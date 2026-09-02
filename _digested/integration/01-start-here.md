# 01 Start Here：先判断能不能接

## 先给结论

pi-mono 可以被无 TUI 接入。它有两种集成模式：

1. **SDK in-process**（推荐 JS/TS 宿主）：直接 `import { createAgentSession }`，在同一个 Node/Bun 进程中创建和管理 session。
2. **RPC subprocess**（跨语言或隔离需求）：spawn `pi --mode rpc`，通过 stdin/stdout JSONL 协议通信。

这两条路线都绕过终端 TUI，直接复用背后的 agent runtime：session、message、tool loop、permission hook、compaction、diff、revert 和 event stream。

pi-mono **没有 HTTP server**。源码里没有 `opencode serve` 等价物。如果你需要 HTTP 暴露，需要自己包一层（Electron/Tauri 后端、Express/Fastify wrapper 等）。

## 你真正接到的是什么

pi-mono 分为三个包，集成时按需选择深度：

```
pi-ai            ← 纯 LLM 抽象层（`@earendil-works/pi-ai`）。一般不需要直接集成
pi-agent-core     ← Agent 内核（`@earendil-works/pi-agent-core`）。适合只想复用循环逻辑的场景
pi-coding-agent   ← 完整产品层（`@earendil-works/pi-coding-agent`）。SDK、RPC、工具、扩展都在这里
```

第一版集成直接面对 `pi-coding-agent`。它提供了：

- **SDK**：[`packages/coding-agent/src/core/sdk.ts`](../../packages/coding-agent/src/core/sdk.ts) — `createAgentSession()` 工厂。
- **AgentSession**：[`packages/coding-agent/src/core/agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) — 核心编排器，封装 prompt、compaction、bash、event 订阅、session 切换。
- **RPC**：[`packages/coding-agent/src/modes/rpc/rpc-types.ts`](../../packages/coding-agent/src/modes/rpc/rpc-types.ts) — 33 个命令（v0.84.4 起，新增 `clear_queue`）的 JSONL 协议（`RpcCommand` union，rpc-types.ts:20）。
- **SessionManager**：[`packages/coding-agent/src/core/session-manager.ts`](../../packages/coding-agent/src/core/session-manager.ts) — JSONL 持久化和 session 树管理。

## 第一版接入应该怎么想

把 pi-mono 当成一个可嵌入的 agent engine：

### SDK 路线（JS/TS）

```ts
import { createAgentSession } from "@earendil-works/pi-coding-agent"

// 1. 创建 session
const { session } = await createAgentSession({  // 返回 { session, extensionsResult, modelFallbackMessage? }，需解构
  cwd: "/path/to/project",
  model: myModel,           // 从 pi-ai 拿到的 Model
  thinkingLevel: "medium",
})

// 2. 订阅事件
session.subscribe((event) => {
  // message_start/message_update/message_end, tool_execution_*, turn_start/turn_end, ...
})

// 3. 发送 prompt（返回 void，只代表"被接受"，不代表完成；完成看 agent_settled）
await session.prompt("fix the failing tests")

// 4. 处理后续
await session.followUp("also add tests for the edge case")
```

### RPC 路线（跨语言或子进程）

```bash
# 启动
node dist/cli.js --mode rpc
```

然后通过 stdin 发送 JSONL：

```json
{"type":"prompt","message":"fix the failing tests"}
{"type":"steer","message":"use a different approach"}
{"type":"abort"}
{"type":"get_state"}
```

从 stdout 读取 JSONL 响应：

```json
{"type":"response","id":"...","command":"prompt","success":true}
{"type":"event","event":{"type":"message_update","usage":{...},"assistantMessageEvent":{"type":"text_delta","delta":"..."}}}
{"type":"event","event":{"type":"agent_settled"}}
```

## 最小闭环

无论 SDK 还是 RPC，一个最小闭环是：

1. 创建 session（SDK：`createAgentSession`；RPC：`new_session`）。
2. 订阅事件（SDK：`session.subscribe(listener)`；RPC：开始读取 stdout 事件行）。
3. 发送 prompt（SDK：`session.prompt()`；RPC：`{"type":"prompt",...}`）。
4. 处理事件（`message_start`/`message_update`/`message_end`、`tool_execution_*`、`turn_start`/`turn_end`）。
5. 等到 session idle（SDK：`agent_settled` 事件；RPC：`{"type":"event","event":{"type":"agent_settled"}}`）。

## 什么时候用 SDK，什么时候用 RPC

| 场景 | 推荐 |
|---|---|
| Node/Bun 宿主，需要直接对象交互 | SDK |
| Electron/Tauri 后端 | SDK |
| IDE 插件（VS Code / JetBrains） | SDK |
| 测试 harness | SDK |
| 非 JS/TS 语言（Python、Go、Rust 等） | RPC |
| 需要进程隔离 | RPC |
| 本地 supervisor 管理多个 agent 实例 | RPC |
| CI pipeline | RPC |

## 什么时候用 CLI

如果你只需要一次性执行任务，不需要长期持有 UI 状态：

```bash
pi "fix the failing tests"
```

CLI 入口在 [`packages/coding-agent/src/main.ts`](../../packages/coding-agent/src/main.ts)，根据不同参数路由到 interactive（React Ink TUI）、print（流式输出到终端）或 rpc 模式。

## 不要一开始就追求 TUI parity

TUI 是一个客户端。它有自己的快捷键、dialog、picker、布局、theme。TUI 通过 SDK 消费 runtime，源码在 [`packages/coding-agent/src/modes/interactive/`](../../packages/coding-agent/src/modes/interactive/)。

你的宿主 App 不应该期待 pi-mono 自动提供完整 TUI 行为。更合理的边界是：

- pi-mono runtime 负责 agent 能力（循环、工具、模型调用、session 管理）。
- 宿主 App 负责自己的 UI、权限弹窗、任务状态、重连策略和产品工作流。

## 关于 web-ui 的特殊性

pi-mono 曾有 web-ui（`apps/web-ui/`）——一个**纯前端应用**，Agent 直接在浏览器里运行、直接调 LLM provider API、中间没有 server。**该包已在上游移除**（v0.83.0 前即删除），本节保留描述仅供理解架构史。

如果你的产品需要一个 web 界面，有两种做法：

1. **参考旧 web-ui 的纯前端方案**：在浏览器运行 pi-agent-core（若走这条线，需自行重建 web-ui 的角色；协议栈见 02-advanced 的 client/server 三件套）。
2. **自己包一层 server**：用 SDK 在 Node server 中创建 AgentSession，暴露 HTTP/WebSocket 给前端。这是 OpenCode 的做法，但 pi-mono 没有内置。

## 最小路线

如果只想证明"能接"：

### SDK 路线
1. 安装 `@earendil-works/pi-coding-agent`（+ `@earendil-works/pi-ai`、`@earendil-works/pi-agent-core`）或从 monorepo 构建
2. `import { createAgentSession } from "@earendil-works/pi-coding-agent"`
3. 调 `createAgentSession({ model: ... })`
4. 调 `session.prompt("hello")`
5. 监听 `session.subscribe(listener)` 拿到流式事件

### RPC 路线
1. `node dist/cli.js --mode rpc`
2. stdin 写 `{"type":"prompt","message":"hello"}\n`
3. stdout 读 JSONL 响应和事件
4. 读到 prompt 完成的事件

更详细调用顺序见 [`03-runtime-api.md`](03-runtime-api.md)。
