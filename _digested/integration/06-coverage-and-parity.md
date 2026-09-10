# 06 Coverage And Parity：哪些能接，哪些不是 TUI API

## 这张表解决什么问题

外部集成最容易掉进两个坑：

- 看到 pi-mono 有 TUI，就以为能遥控所有 TUI 行为。
- 看到 TUI 有各种快捷键和面板，就以为它们都有 SDK/RPC 等价物。

更准确的说法是：pi-mono 的核心 runtime 能力可以通过 SDK（进程内）或 RPC（JSONL 子进程）接入，v0.84 出现的第三条路径（protocol/client/server 二进制协议）在 v0.85 被拆掉重建、且已降级为 **dev-only、非 supported**（见下文），而 TUI 的产品外壳始终要由宿主自己实现。

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
| 模型切换 | SDK：`session.setModel(model, { persist })` / RPC：`{"type":"set_model"}`、`{"type":"cycle_model"}`（v0.84.3：默认只在 session 内生效；`persist: true` 才写全局默认，RPC 路径不传 `persist`，故不再改全局默认；v0.84.4：persist 时若带非空 scope，model 同时追加进 scope 与 enabledModels） | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts) |
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
| 队列清空 | SDK：`session.clearQueue()` / RPC：`{"type":"clear_queue"}`（v0.84.4，返回被清掉的 steering/followUp 文本，Esc-restore 模式见 03） | [`agent-session.ts`](../../packages/coding-agent/src/core/agent-session.ts)、[`rpc-client.ts`](../../packages/coding-agent/src/modes/rpc/rpc-client.ts) |
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
| 终端能力覆盖 | `terminal.hyperlinks/images/trueColor` setting + env `PI_HYPERLINKS`/`PI_TRUE_COLOR`/`PI_IMAGE_PROTOCOL`（v0.84.4；优先级 settings > env > 自动检测） | [`terminal-image.ts`](../../packages/tui/src/terminal-image.ts)、[`settings-manager.ts`](../../packages/coding-agent/src/core/settings-manager.ts) |
| 模型目录 | v0.84.4：DeepSeek 新增 `deepseek-v4-flash-vision-exp`（vision，1M ctx）；Cloudflare gateway 补 `workers-ai/*` passthrough；OpenRouter 图像模型刷新 | [`scripts/generate-models.ts`](../../packages/ai/scripts/generate-models.ts) |
| CLI `--` end-of-options | CLI：`pi -p -- "- 以破折号开头的参数"`（v0.84.3，`#7269`） | [`cli/args.ts`](../../packages/coding-agent/src/cli/args.ts) |

## 第三条集成路径：protocol / client / server（v0.85 重建，dev-only，非 supported）

v0.84 曾出现过一套 client/server 栈（协议版本 **1**、`PiClient`、`PiServerService` + `SessionSnapshot` 快照订阅）。**v0.85 把它整个拆掉重建**：三个包现在只是 chord（`packages/chord`，本轮新增的第 11 个包）的薄适配层，协议版本 **1 → 8**。下表按 v0.85.1 现状。

| 包 | v0.85.1 角色 |
|----|------|
| [`packages/protocol`](../../packages/protocol/README.md) | runtime-neutral routed envelopes + CBOR 编码 + 字节流 framing。协议版本 **8**（`protocol.ts:5`）：4 字节大端长度前缀 + 1 个 definite-length CBOR item 的 framing **没变**；首条消息 `hello` 带 `serverId`；**寻址模型改为 service-addressed**——`RpcTarget = ServerTarget{serverId} \| SessionTarget{serverId,sessionId,attachmentId}`（`protocol.ts:36-47`）。业务 payload 是 opaque 的 chord 调用 `{ serviceId, instance?, member, args }`，协议层只校验 strict-JSON 边界、不解释其语义 |
| [`packages/client`](../../packages/client/README.md) | 传输无关的 `Client`（`client/src/index.ts:1`，已去掉 `Pi` 前缀；错误类型相应变为 `ClientDisposedError`/`DisconnectedError`/`ServerError`，`errors.ts:3,13,20`）。`ByteTransport` 接口仍在（`client/src/transport.ts:1`），可接 WebSocket / Unix socket / 任意有序字节流。**旧的 `session.subscribe(snapshot => ...)` 快照订阅已删除**，改为 service 订阅（`ServiceSubscription`，`types.ts:16`；`createClientServiceTransport()`，`client.ts:448`——先 hydrate 服务快照再 `start()` 释放缓冲更新） |
| [`packages/server`](../../packages/server/README.md) | 服务宿主接口从 `PiServerService` 变为 `ServerHost`（`server/src/types.ts:59-64`，只剩 `serverServices`/`resolveSession`/`openSession`）；`createUnixServer` 仍在（`transports/unix/preset.ts:8`）。wire 语义上移到 chord（commit `1a7bc80e7 feat: move service wire semantics into Chord`） |

`SessionSnapshot` 在 `protocol/src`、`client/src`、`server/src` 里**已无任何命中**——"服务端推权威快照、宿主直接渲染"的旧模型已被 chord service 路由取代，业务观测（如 coding-agent 的 `Transcript`）现在只是普通 chord service。

**兼容性**：`isSupportedProtocolVersion`（`protocol/src/codec.ts:139-140`）只接受精确等于 `PROTOCOL_VERSION`，**没有兼容窗口**；协议版本在一个 release 周期内破坏性改了 7 次（1→3→4→5→6→7→8）。客户端与服务端**必须同版本**才能握手。

### ⚠️ 三包是 dev-only、source-only，不是 supported 集成面

- `packages/coding-agent/package.json` 里 `pi-client`/`pi-protocol`/`pi-server` 已从 `dependencies` **降为 `devDependencies`**（`pi-ai`/`pi-agent-core`/`pi-tui`/`chord` 仍是运行时依赖）。
- `files` 排除 `dist/client`、`dist/experimental`、`dist/cli/experimental`；`./client` 与 `./experimental/plugin` 两个 exports 子路径**只有 `{"source": ...}` 一个条件**，标准 Node 解析不出来。
- `scripts/coding-agent-consumer.mjs:11,73` 硬编码断言这三包**不得出现在外部消费者的安装闭包里**（`must not be installed`）。
- 三个包的 CHANGELOG 在 v0.85.0/v0.85.1 段**完全是空的**——不为它们写用户可见 changelog。
- 背景：v0.85.0 曾把整套 experimental 远程栈误发布进 npm 包，消费者一装就 import 失败（#9132），v0.85.1 用上述手段修复（`1382777ed`、`6f11c31d1`）。

**当前建议**：生产集成走 SDK/RPC。这条路径只适合**读源码跟踪**，不要基于它做产品；`modes/rpc/` 没有被移除的计划公告，且本轮 `rpc-types.ts`/`rpc-mode.ts` **逐字节未变**。

## 另一条 authoring 面：experimental remote runtime 与 mini（dev-only，source-only）

`packages/coding-agent/src/experimental/` 在 v0.84.4 **文件数为 0**（目录不存在），v0.85.1 = **47 个文件**。它不是上面三件套的替代，而是让 durable agent 跑在 worker 进程里、presentation 通过 RPC service 目录远程接上去的运行时，**明确非 supported**。

### experimental remote runtime（chord facet/service 概念在 coding-agent 侧的落地）

`experimental/services/README.md` 自述 "Experimental client/server service slices"。服务 token 全带 `pi.` 前缀：

```
pi.agent-controller      AgentLane 的 presentation-safe 门面（prompt/queue/abort/resume/compaction/navigation）
pi.models                ReplicatedState
pi.session-directory / pi.session-management
pi.transcript            ReplicatedState，复制 lane 状态
pi.presentation-plugins / pi.session-plugins
pi.local.slash-commands  {local:true} —— 永不进 RPC catalogue
pi.local.presentation-ui {local:true}
```

token 定义分别在 `services/agent-controller.ts:54`、`models.ts:35`、`sessions.ts:26/:35`、`transcript.ts:15`、`plugins.ts:12/:19`、`slash-commands.ts:30`、`presentation-ui.ts:20`。带 `{local:true}` 的两个只在 presentation 进程本地、不会出口到 RPC catalogue。

**唯一入口是 repo checkout**：`PI_EXPERIMENTAL=1 ./pi-test.sh server|client`（本轮 `pi-test.sh` 已把入口从 `src/cli.ts` 换成 `src/experimental/cli.ts`；`runExperimentalCommand` 在 `commands.ts:94` 同时校验 `PI_EXPERIMENTAL=1` 与 `server`/`client` 子命令）。**不在 npm 包、也不在 standalone binary 里**——发布的 `bin` 是 `dist/bundle/cli.js`，走的是不含 experimental 的 `src/cli.ts`。

### mini —— 独立探针，不是上面那套的上层

`experimental/mini/`（`mini/README.md`）自述 *"It exists to exercise the harness from a real client and to find out what an RPC-shaped presentation actually needs from it."* 它把 durable `AgentHarness` 拆成 server / worker / presentation 三进程，用 socket + pipe 说 JSON。

**它不用 pi-client/pi-protocol 的 CBOR 栈**：自带 newline-delimited JSON transport（`mini/shared/transport.ts`）、自研 frame 集（`mini/shared/rpc.ts:14-21` 的 `Frame` union，实列 `call`/`result`/`error`/`cancel`/`event`/`announce`/`ping` **七**项——README 自称 "six frame kinds"，与代码对不上，以代码为准）、**自己的 `defineService`**（`mini/shared/protocol.ts:56`）——与 chord 的 `defineService`（`packages/chord/src/api.ts:70`）是**两套不同的东西**。它与 `experimental/services/` 那套 chord 栈是**并列**关系，不是其上层。

直接入口：`node packages/coding-agent/src/experimental/mini/main.ts [--continue]`（源码变动期用 `./node_modules/.bin/tsx packages/coding-agent/src/experimental/mini/main.ts`）。**标研究性质，不是集成 API。**

## TUI parity 不覆盖

这些能力属于 TUI 客户端体验，不应假设 SDK/RPC 已有等价接口：

| TUI 能力 | 外部 harness 应怎么处理 |
|---|---|
| 快捷键（Ctrl+P 切模型、Ctrl+T 切换思考等） | 宿主 UI 自己定义 |
| 全屏选区复制 | `fullscreenCopyOnSelect` setting（v0.84.4，默认拖选即复制；关闭后 `app.message.copy`/ctrl+x 优先复制活动选区）——宿主可抄语义，无 SDK/RPC 等价物 |
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
| 跳到底部指示器（`TuiAltScreen.scrollToEndIndicator`，v0.85.0 新增） | 宿主自己渲染：follow-end 主 scroll view 滚离末端时，在最后一行居中显示一个可点击的"跳到底部"标签（选项 `tui-alt-screen.ts:180`，渲染 `:1618-1634`）。无 SDK/RPC 等价物 |
| 鼠标区域组件（`MouseRegion`） | pi-tui 已从 `packages/tui/src/index.ts:21` 导出（`components/mouse-region.ts`），可作为宿主自绘 UI 的复用原语；无 SDK/RPC 等价物 |

TUI 的源码在 [`packages/coding-agent/src/modes/interactive/`](../../packages/coding-agent/src/modes/interactive/)，使用 React Ink 渲染。它不是 SDK 的 UI 层——它是 SDK 的一个 consumer，外部 UI 是另一个 consumer。

## 部分覆盖或需要谨慎的能力

| 能力 | 当前判断 |
|---|---|
| 多项目/多 workspace | AgentSession 绑定一个 cwd。多项目需要多个 session 实例 |
| 远程 workspace | 不是内置能力。文件操作在本地文件系统 |
| 多用户服务 | 没有认证、隔离、审计。需要宿主自己实现多用户管理层 |
| 权限自动批准 | hook 层面可以总是返回 approve，但产品上要非常保守 |
| 长会话恢复 | session 持久化到 JSONL 文件（coding-agent 的 `SessionManager`），重启后可恢复。RPC 进程崩溃后需重新 spawn。agent 包另有 session v4（`JsonlSessionRepo`，lane-based），但 coding-agent 尚未接入 |
| ~~web-ui 的纯前端方案~~ | **web-ui 包已被上游移除**（v0.83.0 前即删除）。浏览器方案需宿主自建，或（仅限读源码跟踪）参考 dev-only 的 protocol/client 栈 |
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
| SDK 跨语言方案 | `@opencode-ai/sdk` (JS/TS) | RPC JSONL（任意语言可实现）；另有 CBOR 二进制 protocol，但**已降级为 dev-only/source-only、非 supported**（见上文） |
| CI JSON stream | `opencode run --format json` | RPC stdout JSONL |
| in-process 嵌入 | SDK v2（实际 spawn 子进程） | SDK 真 in-process（同一事件循环） |

## 当前推荐口径

对外介绍 pi-mono integration harness 时，可以这样说：

> pi-mono 可以作为本地 headless agent runtime 被其他产品嵌入。JS/TS 宿主优先用 SDK（`createAgentSession`，同进程调用），非 JS 宿主用 RPC 子进程方案（JSONL over stdin/stdout）。没有 HTTP server——这是 library-first 设计。历史上曾有一条 experimental 的 protocol/client/server 栈（Unix socket + CBOR 二进制），但它在 v0.85 被重建为 chord 适配层、且已降级为 **dev-only、非 supported**，不构成对外的集成面。TUI 只是一个参考实现（React Ink），不是必须复刻的 API surface。
