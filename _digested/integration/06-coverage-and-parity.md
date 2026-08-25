# 06 Coverage And Parity：哪些能接，哪些不是 TUI API

## 这张表解决什么问题

外部集成最容易掉进两个坑：

- 看到 pi-mono 有 TUI，就以为能遥控所有 TUI 行为。
- 看到 TUI 有各种快捷键和面板，就以为它们都有 SDK/RPC 等价物。

更准确的说法是：pi-mono 的核心 runtime 能力可以通过 SDK（进程内）或 RPC（JSONL 子进程）接入，v0.84 又出现了第三条实验性路径（protocol/client/server 二进制协议，见下文），但 TUI 的产品外壳要由宿主自己实现。

## Runtime 能力覆盖

| 能力 | 当前外部接入 | 主要锚点 |
|---|---|---|
| 创建/管理 session | SDK：`createAgentSession()` / RPC：`new_session` | [`sdk.ts`](../../packages/coding-agent/src/core/sdk.ts)、[`rpc-types.ts`](../../packages/coding-agent/src/modes/rpc/rpc-types.ts) |
| 发送 prompt | SDK：`session.prompt()` / RPC：`{"type":"prompt"}` | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts)、[`rpc-types.ts`](../../packages/coding-agent/src/modes/rpc/rpc-types.ts) |
| steer（方向调整） | SDK：`session.steer()` / RPC：`{"type":"steer"}` | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
| follow-up（后续对话） | SDK：`session.followUp()` / RPC：`{"type":"follow_up"}` | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
| abort | SDK：`session.abort()` / RPC：`{"type":"abort"}` | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
| 事件流 | SDK：`session.subscribe(listener)` / RPC：stdout JSONL | [`types.ts`](../../packages/agent/src/types.ts)、[`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
| 等待 idle（agent settled） | SDK：`session.waitForIdle()` / RPC：监听 `agent_settled` 事件 | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
| compaction | SDK：`session.compact()` / RPC：`{"type":"compact"}` | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
| 自动 compaction 开关 | RPC：`{"type":"set_auto_compaction"}` | [`rpc-types.ts`](../../packages/coding-agent/src/modes/rpc/rpc-types.ts) |
| branch summary abort | SDK：`session.abortBranchSummary()` | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
| session fork / clone | SDK：`session.sessionManager.fork()`（AgentSession 无 fork 方法）/ RPC：`{"type":"fork"}`、`{"type":"clone"}` | [`session-manager.ts`](../../packages/coding-agent/src/core/session-manager.ts)、[`rpc-mode.ts`](../../packages/coding-agent/src/modes/rpc/rpc-mode.ts) |
| session 切换 | SDK：`session.sessionManager.switchSession()` / RPC：`{"type":"switch_session"}` | [`session-manager.ts`](../../packages/coding-agent/src/core/session-manager.ts) |
| 状态快照（重连恢复） | RPC：`{"type":"get_state"}` | [`rpc-types.ts`](../../packages/coding-agent/src/modes/rpc/rpc-types.ts) |
| 模型切换 | SDK：`session.setModel(model, { persist })` / RPC：`{"type":"set_model"}`、`{"type":"cycle_model"}`（v0.84.3：默认只在 session 内生效；`persist: true` 才写全局默认，RPC 路径不传 `persist`，故不再改全局默认） | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
| 可用模型查询 | RPC：`{"type":"get_available_models"}` | [`rpc-types.ts`](../../packages/coding-agent/src/modes/rpc/rpc-types.ts) |
| 模型轮换范围（scoped models） | SDK：`session.setScopedModels()` / `CreateAgentSessionOptions.scopedModels` | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts)、[`sdk.ts`](../../packages/coding-agent/src/core/sdk.ts) |
| 思考深度控制 | SDK：`session.setThinkingLevel(level, { persist })` / `cycleThinkingLevel()` / `getAvailableThinkingLevels()`（`thinkingLevel` getter）；RPC：`set_thinking_level`、`cycle_thinking_level`、`get_available_thinking_levels`（v0.84.3：`persist: true` 才写全局默认；解析顺序改为 per-model 覆盖 → 全局默认） | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts)、[`sdk.ts`](../../packages/coding-agent/src/core/sdk.ts) |
| bash 直接执行 | SDK：`session.executeBash()`（实际方法名）/ RPC：`{"type":"bash"}`（支持 `excludeFromContext`） | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts)、[`bash-executor.ts`](../../packages/coding-agent/src/core/bash-executor.ts) |
| bash 中断 | SDK：`session.abortBash()` / RPC：`{"type":"abort_bash"}` | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
| session 统计 | SDK：`session.getSessionStats()` / RPC：`{"type":"get_session_stats"}` | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
| context 使用追踪 | SDK：`session.getContextUsage()` | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
| 消息列表 | SDK：`session.messages`（getter）/ RPC：`{"type":"get_messages"}` | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
| 最后一条 assistant 文本 | RPC：`{"type":"get_last_assistant_text"}`（05 Recipe 2 推荐取最终文本方式） | [`rpc-types.ts`](../../packages/coding-agent/src/modes/rpc/rpc-types.ts) |
| RPC 命令自省 | RPC：`{"type":"get_commands"}` | [`rpc-types.ts`](../../packages/coding-agent/src/modes/rpc/rpc-types.ts) |
| HTML 导出 | SDK：`session.exportToHtml()` / RPC：`{"type":"export_html"}` | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
| JSONL 导出 | SDK：`session.exportToJsonl()`（v0.84.3 起委托给 `core/session-export.ts`） | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts)、[`session-export.ts`](../../packages/coding-agent/src/core/session-export.ts) |
| fork 消息获取 | SDK：`session.getUserMessagesForForking()` / RPC：`{"type":"get_fork_messages"}` | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
| session 命名 | SDK：`session.setSessionName()` / RPC：`{"type":"set_session_name"}` | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
| session entries 浏览 | RPC：`get_entries`、`get_tree` | [`rpc-types.ts`](../../packages/coding-agent/src/modes/rpc/rpc-types.ts) |
| 重试控制 | RPC：`set_auto_retry`、`abort_retry` | [`rpc-types.ts`](../../packages/coding-agent/src/modes/rpc/rpc-types.ts) |
| 队列模式 | RPC：`set_steering_mode`、`set_follow_up_mode` | [`rpc-types.ts`](../../packages/coding-agent/src/modes/rpc/rpc-types.ts) |
| 工具管理 | SDK：`getActiveToolNames()`、`getAllTools()`、`getToolDefinition()`、`setActiveToolsByName()` | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
| 工具排除（excludeTools） | SDK：`CreateAgentSessionOptions.excludeTools`、`noTools` | [`sdk.ts`](../../packages/coding-agent/src/core/sdk.ts) |
| 自定义工具 | SDK：`customTools` 参数 | [`sdk.ts`](../../packages/coding-agent/src/core/sdk.ts) |
| 扩展系统 | SDK：通过 `AgentSession` 内部的 `ExtensionRunner` | [`runner.ts`](../../packages/coding-agent/src/core/extensions/runner.ts) |
| 扩展事件查询 | SDK：`session.hasExtensionHandlers(eventType)` | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
| session context 替换 | SDK：`session.createReplacedSessionContext()` | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
| auth/runtime（ModelRuntime） | SDK：`CreateAgentSessionOptions.modelRuntime`（替代旧 `authStorage` + `modelRegistry`） | [`sdk.ts`](../../packages/coding-agent/src/core/sdk.ts) |
| 扩展终止整批工具调用 | 扩展 `tool_call` hook 返回 `terminate`（v0.84.1） | [`extensions/types.ts`](../../packages/coding-agent/src/core/extensions/types.ts) |
| auth 预检 | CLI：`pi auth check`（provider/model 级，可输出解析后的 credential）（v0.84.1） | `packages/coding-agent/src/main.ts` |
| 默认工具集配置 | `defaultTools` setting（全局或按项目，v0.84.2；v0.84.3 起可选值含 `powershell`） | [`docs/settings.md`](../../packages/coding-agent/docs/settings.md) |
| PowerShell 执行 | SDK：`createPowerShellTool()`（内置工具，v0.84.3；基于 bash 工具定义，自带 UTF-8 输出 shim） | [`tools/powershell.ts`](../../packages/coding-agent/src/core/tools/powershell.ts)、[`sdk.ts`](../../packages/coding-agent/src/core/sdk.ts) |
| 每模型思考深度 | `modelThinkingLevels` setting（v0.84.3，per-model 覆盖全局默认） | [`settings-manager.ts`](../../packages/coding-agent/src/core/settings-manager.ts) |
| CLI `--` end-of-options | CLI：`pi -p -- "- 以破折号开头的参数"`（v0.84.3，`#7269`） | [`cli/args.ts`](../../packages/coding-agent/src/cli/args.ts) |

## 第三条集成路径：protocol / client / server（v0.84，experimental）

v0.84 出现了成型的 client/server 栈，**明确标注 experimental、API 不稳定**：

| 包 | 角色 |
|----|------|
| [`packages/protocol`](../../packages/protocol/README.md) | runtime-neutral schemas + CBOR 编码 + 字节流 framing。协议版本 1：4 字节大端长度前缀 + 1 个 definite-length CBOR item；首条消息必须 `hello`；请求/响应 envelope + server event envelope；**Session snapshot 是权威状态，progress event 只是 UI 提示** |
| [`packages/client`](../../packages/client/README.md) | 传输无关的 `PiClient`：实现 `ByteTransport` 接口（WebSocket / Unix socket / 任意有序字节流）即可，无 Node 专属依赖；`session.subscribe(snapshot => ...)` 快照订阅模型 |
| [`packages/server`](../../packages/server/README.md) | `PiServer` session server，`PiServerService` 接口挂 storage / modelRegistry，提供 `createUnixServer` |

与 RPC mode 的关键差异：RPC 是"子进程 + stdout 事件流"（事件驱动、宿主拼状态），protocol 路径是"长连接 + 权威快照"（服务端推 `SessionSnapshot`，宿主直接渲染）。JSON/RPC 的 `message_update` 增量化（v0.84.0）可以视为向这个模型靠拢的中间步。

**当前建议**：生产集成仍走 SDK/RPC；protocol 栈适合跟踪和试点。`modes/rpc/` 没有被移除的计划公告，但 upstream 的开发重心明显在这里。

## TUI parity 不覆盖

这些能力属于 TUI 客户端体验，不应假设 SDK/RPC 已有等价接口：

| TUI 能力 | 外部 harness 应怎么处理 |
|---|---|
| 快捷键（Ctrl+P 切模型、Ctrl+T 切换思考等） | 宿主 UI 自己定义 |
| dialog / picker | 宿主 UI 自己实现 |
| toast / status bar / sidebar | 从事件和 agent state 投影 |
| prompt draft / local stash | 宿主自存 |
| theme / layout / selection | 宿主自存 |
| timeline 视觉结构 | 用事件流中的 message + parts 自己渲染 |
| 权限确认弹窗 | 自己实现阻断交互（hook-based，没有内置弹窗 API） |
| extension UI（TUI 内的自定义界面） | 可选实现 `ExtensionUIContext`，第一版不必要 |
| 交互式 bash（TUI 中的实时 stdin） | SDK/RPC 的 `bash` 命令只支持一次性执行 |
| `/thinking` 斜杠命令（v0.84.3，TUI-only） | 等价于 SDK `setThinkingLevel` / RPC `set_thinking_level`，但无独立 RPC 命令 |
| radius session 分享（v0.84.3，experimental、TUI-only） | 宿主自己实现分享链接/上传（`interactive/session-share.ts`，登录 radius 后可用） |
| Markdown 渲染 | 宿主自渲染（事件中是原始文本） |

TUI 的源码在 [`packages/coding-agent/src/modes/interactive/`](../../packages/coding-agent/src/modes/interactive/)，使用 React Ink 渲染。它不是 SDK 的 UI 层——它是 SDK 的一个 consumer，外部 UI 是另一个 consumer。

## 部分覆盖或需要谨慎的能力

| 能力 | 当前判断 |
|---|---|
| 多项目/多 workspace | AgentSession 绑定一个 cwd。多项目需要多个 session 实例 |
| 远程 workspace | 不是内置能力。文件操作在本地文件系统 |
| 多用户服务 | 没有认证、隔离、审计。需要宿主自己实现多用户管理层 |
| 权限自动批准 | hook 层面可以总是返回 approve，但产品上要非常保守 |
| 长会话恢复 | session 持久化到 JSONL 文件（coding-agent 的 `SessionManager`），重启后可恢复。RPC 进程崩溃后需重新 spawn。agent 包另有 session v4（`JsonlSessionRepo`，lane-based），但 coding-agent 尚未接入 |
| ~~web-ui 的纯前端方案~~ | **web-ui 包已被上游移除**（v0.83.0 前即删除）。浏览器方案需宿主自建或跟踪 protocol/client 栈 |
| 扩展系统 | 通过 SDK 加载，jiti 运行时编译 TypeScript。外部集成通常不需要直接操作 |
| 文件变更追踪 | `edit` 和 `write` 工具使用队列+去重机制，但不提供显式 diff API（需从 tool result 提取） |

## 判断新能力时的规则

看到一个 pi-mono 能力时，先问四个问题：

1. 它是 runtime 状态，还是 TUI 客户端状态？
2. 它是否有 SDK method、RPC command 或 type 暴露？
3. 它是否需要 human-in-the-loop？
4. 它是否涉及文件、shell、provider credential 或远程 workspace 风险？

如果答案偏向 runtime，并且有 SDK/RPC 边界，就可以纳入 integration harness。否则先写成"宿主自实现 / CLI 绕路 / 未来设计建议"。

## 和 OpenCode 的能力缺口

| 能力 | OpenCode | pi-mono |
|---|---|---|
| HTTP server | `opencode serve` (端口 + mDNS) | 无（experimental 的 `pi-server` 是 Unix socket，不是 HTTP） |
| SSE 事件流 | 内置 `/event` | 无（RPC JSONL 等价，但不是 HTTP） |
| 交互式权限 API | `/permission/:id/reply` | hook-based，无独立 API |
| 交互式问题 API | `/question/:id/reply` | 无等价物 |
| GitHub Action/Agent | 预置集成 | 无预置集成 |
| Slack bot | 预置集成 | 无预置集成 |
| MCP server 能力 | 有 CLI 管理工具 | 无 |
| ACP 编辑器协议 | 支持 | 无 |
| SDK 跨语言方案 | `@opencode-ai/sdk` (JS/TS) | RPC JSONL（任意语言可实现）；v0.84 起另有 CBOR 二进制 protocol（任意语言，experimental） |
| CI JSON stream | `opencode run --format json` | RPC stdout JSONL |
| in-process 嵌入 | SDK v2（实际 spawn 子进程） | SDK 真 in-process（同一事件循环） |

## 当前推荐口径

对外介绍 pi-mono integration harness 时，可以这样说：

> pi-mono 可以作为本地 headless agent runtime 被其他产品嵌入。JS/TS 宿主优先用 SDK（`createAgentSession`，同进程调用），非 JS 宿主用 RPC 子进程方案（JSONL over stdin/stdout）。没有 HTTP server——这是 library-first 设计（experimental 的 protocol/client/server 栈走 Unix socket + CBOR 二进制，方向是长连接快照而非 HTTP REST）。TUI 只是一个参考实现（React Ink），不是必须复刻的 API surface。
