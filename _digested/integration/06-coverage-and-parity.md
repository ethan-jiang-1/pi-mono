# 06 Coverage And Parity：哪些能接，哪些不是 TUI API

> 本文已对照 v0.86.1 复核。
> v1.0.0（2026-10-02 同步）增补：MCP 客户端成为官方一级能力（原"无"的论断失效，见 OpenCode 对比表）；fullscreen 成为 TUI 默认形态（见"TUI parity 不覆盖"末尾注记）。

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
| session fork / clone | SDK：`AgentSessionRuntime.fork()`（`agent-session-runtime.ts:262`；`SessionManager` 没有 `fork()`）/ RPC：`{"type":"fork"}`、`{"type":"clone"}` | [`session-manager.ts`](../../packages/coding-agent/src/core/session-manager.ts)、[`rpc-mode.ts`](../../packages/coding-agent/src/modes/rpc/rpc-mode.ts) |
| session 切换 | SDK：`AgentSessionRuntime.switchSession()`（`:196`）/ RPC：`{"type":"switch_session"}` | [`session-manager.ts`](../../packages/coding-agent/src/core/session-manager.ts) |
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
| PowerShell 执行 | SDK：`createPowerShellTool()`（内置工具，v0.84.3；基于 bash 工具定义，自带 UTF-8 输出 shim）。注意（v1.2.0 起在 release 内，sync 0008/0009）：durable 侧另有**同名**工厂 `createPowerShellTool()`（`packages/durable/src/tools/bash.ts:168`）——跨平台、argv exec 形式直接启动 pwsh 不经 shell 解析，与本行 coding-agent 的 Windows-only 实现是两回事 | [`tools/powershell.ts`](../../packages/coding-agent/src/core/tools/powershell.ts)、[`sdk.ts`](../../packages/coding-agent/src/core/sdk.ts) |
| 每模型思考深度 | `modelThinkingLevels` setting（v0.84.3，per-model 覆盖全局默认） | [`settings-manager.ts`](../../packages/coding-agent/src/core/settings-manager.ts) |
| 终端能力覆盖 | `terminal.hyperlinks/images/trueColor` setting + env `PI_HYPERLINKS`/`PI_TRUE_COLOR`/`PI_IMAGE_PROTOCOL`（v0.84.4；优先级 settings > env > 自动检测） | [`terminal-image.ts`](../../packages/tui/src/terminal-image.ts)、[`settings-manager.ts`](../../packages/coding-agent/src/core/settings-manager.ts) |
| 模型目录 | v0.84.4：DeepSeek 新增 `deepseek-v4-flash-vision-exp`（vision，1M ctx）；Cloudflare gateway 补 `workers-ai/*` passthrough；OpenRouter 图像模型刷新 | [`scripts/generate-models.ts`](../../packages/ai/scripts/generate-models.ts) |
| CLI `--` end-of-options | CLI：`pi -p -- "- 以破折号开头的参数"`（v0.84.3，`#7269`） | [`cli/args.ts`](../../packages/coding-agent/src/cli/args.ts) |
| prompt cache warming | setting：`cacheWarming`（`off/streaming/idle`，默认 `streaming`，global-only，v0.86.0 #9668）；扩展经 `cache_warming_decision` 事件可 stop/强制 refresh。无 SDK/RPC 命令——后台行为，宿主只需知道成本模型（预期节省 < $0.05 不刷新） | [`cache-warmer.ts`](../../packages/coding-agent/src/core/cache-warmer.ts)、[`settings-manager.ts`](../../packages/coding-agent/src/core/settings-manager.ts) |
| `/bug` 报告 | interactive mode：`/bug [description]`（v0.86.0；zip 或上传 Radius gateway，secrets redact；崩溃记入 `~/.pi/agent/crashes.json`）。无 RPC/SDK 等价命令 | [`bug-report.ts`](../../packages/coding-agent/src/core/bug-report.ts)、[`interactive-mode.ts`](../../packages/coding-agent/src/modes/interactive/interactive-mode.ts) |
| Radius 模型 catalog | Radius provider 自带 persisted + 动态刷新 catalog（v0.86.0），UI 侧 cached/live 合并支持**离线选模型**；Radius 登录后等待 catalog discovery 再报 missing-model | [`radius.ts`](../../packages/ai/src/providers/radius.ts)、[`model-selector.ts`](../../packages/coding-agent/src/modes/interactive/components/model-selector.ts) |
| Meta Muse provider | 新增 Meta provider（v0.86.1）：Model API key + Muse 订阅 OAuth（auth.meta.com 设备授权流），默认 `muse-spark-1.3`；`getBuiltinModel("meta", ...)` 可用 | [`generate-models.ts`](../../packages/ai/scripts/generate-models.ts)、[`packages/ai/src/auth/oauth/meta.ts`](../../packages/ai/src/auth/oauth/meta.ts) |
| per-model compaction budgets | setting：`compaction.modelOverrides["provider/modelId"]`（`reserveTokens`/`keepRecentTokens`，v0.86.0 #8133），按 modelKey 覆盖全局默认 | [`settings-manager.ts`](../../packages/coding-agent/src/core/settings-manager.ts) |
| fallback 模型约束 | model compat：`compat.allowedFallbackModels`（v0.86.x；限制该模型可回落到的候选集，影响宿主侧 model fallback 提示） | [`packages/ai/src/types.ts`](../../packages/ai/src/types.ts) |

## 第三条集成路径：protocol / client / server（v0.85 重建，dev-only，非 supported）

v0.84 曾出现过一套 client/server 栈（协议版本 **1**、`PiClient`、`PiServerService` + `SessionSnapshot` 快照订阅）；v0.85 把它整个拆掉重建成 chord 的薄适配层（协议版本 1 → 8）；**v1.2.0 把重建后的版本也整栈删除了**。

### 删除事实（v1.2.0）

`packages/protocol`、`packages/client`、`packages/server` 三包**不再存在**（提交 `7472cda0d`，161 文件、+32/−21,561 行）。同批移除的还有 `packages/coding-agent/src/experimental/` 下的 services 切片、session-catalog/session-worker、durable TUI，以及 CBOR 协议线本体（`PROTOCOL_VERSION = 8`、`src/cbor/`、framing）。

`packages/` 因此从 13 个包减为 11 个。上游没有提供替代的远程会话栈。

### 被删栈的形态（历史记录，仅用于理解为什么删）

下表按 v0.85.1–v1.0.3 的形态记录，**所有路径与锚点均已失效**：

| 包 | 当时的角色 |
|----|------|
| `packages/protocol` | runtime-neutral routed envelopes + CBOR 编码 + 字节流 framing。协议版本 8：4 字节大端长度前缀 + 1 个 definite-length CBOR item；首条消息 `hello` 带 `serverId`；寻址模型是 service-addressed 的 `RpcTarget = ServerTarget{serverId} \| SessionTarget{serverId,sessionId,attachmentId}`。业务 payload 是 opaque 的 chord 调用，协议层只校验 strict-JSON 边界 |
| `packages/client` | 传输无关的 `Client`；`ByteTransport` 接口（WebSocket / Unix socket / 任意有序字节流）；快照订阅已改为 service 订阅（`ServiceSubscription` + `createClientServiceTransport()`，先 hydrate 服务快照再 `start()` 释放缓冲更新） |
| `packages/server` | 服务宿主接口 `ServerHost`（只剩 `serverServices`/`resolveSession`/`openSession`）；`createUnixServer()` 组装 Unix socket 传输层；wire 语义上移到 chord（`1a7bc80e7`） |

**一个值得记住的设计教训**：`isSupportedProtocolVersion` 只接受精确等于 `PROTOCOL_VERSION`，**没有兼容窗口**；协议版本在一个 release 周期内破坏性改了 7 次（1→3→4→5→6→7→8），客户端与服务端必须同版本才能握手。叠加 #9132（v0.85.0 误把整套 experimental 远程栈发布进 npm 包，消费者一装就 import 失败），这条线的维护成本与收益始终不成比例——最终整栈删除。

### 三包曾是 dev-only、source-only（历史）

- `packages/coding-agent/package.json` 里 `pi-client`/`pi-protocol`/`pi-server` 曾在 v0.85.1 从 `dependencies` **降为 `devDependencies`**。
- `files` 曾排除 `dist/client`、`dist/experimental`、`dist/cli/experimental`；`./client` 与 `./experimental/plugin` 两个 exports 子路径只有 `{"source": ...}` 一个条件，标准 Node 解析不出来。
- 旧 `scripts/coding-agent-consumer.mjs` 曾硬编码断言三包**不得出现在外部消费者的安装闭包里**（`must not be installed`）。v1.2.0 三包被删，该断言失去对象；旧脚本本身也被拆为 `check-package-install.mjs` + `package-artifacts.mjs` + `local-package-install.mjs` + `coding-agent-smoke.mjs`。
- 三个包的 CHANGELOG 在 v0.85.0/v0.85.1 段**完全是空的**——不为它们写用户可见 changelog。信号很早就有了。

**当前建议**：生产集成走 SDK/RPC。`modes/rpc/` 没有被移除，且其 `rpc-types.ts`/`rpc-mode.ts` 在 v1.0.3→v1.2.0 区间**逐字节未变**。原先"可评估 pi-client + pi-server 做远程会话"的建议**已作废**——不存在官方远程栈；需要远程能力请自建（见 [02-advanced.md](./02-advanced.md) 的三种自建方案）。

## 另一条 authoring 面：experimental remote runtime 与 mini（**v1.2.0 全部删除**）

本节的三个研究对象——`experimental/services/`（chord facet/service 在 coding-agent 侧的落地）、`experimental/durable/`（单进程 durable TUI）、`experimental/mini/`（三进程探针）——**在 v1.2.0 全部不存在**。

`packages/coding-agent/src/experimental/` 目录现在**只剩一个文件 `source-resolver.ts`**，且已无同目录消费者。原 v0.84.4 → v0.85.1 的"文件数 0 → 47"增长曲线，到 v1.2.0 回落为 1。删除提交 `7472cda0d`（与三件套同批，−21,561 行）。

### 原形态（历史记录，仅用于理解被删了什么）

**experimental remote runtime**：让 durable agent 跑在 worker 进程里、presentation 通过 RPC service 目录远程接上去的运行时。服务 token 全带 `pi.` 前缀——`pi.agent-controller`（AgentLane 的 presentation-safe 门面：prompt/queue/abort/resume/compaction/navigation）、`pi.models`、`pi.session-directory`/`pi.session-management`、`pi.transcript`（ReplicatedState，复制 lane 状态）、`pi.presentation-plugins`/`pi.session-plugins`，以及两个 `{local:true}` 的 `pi.local.slash-commands`/`pi.local.presentation-ui`（只在 presentation 进程本地、不进 RPC catalogue）。

**mini**：自述 *"It exists to exercise the harness from a real client and to find out what an RPC-shaped presentation actually needs from it."* 把 durable `AgentHarness` 拆成 server / worker / presentation 三进程，用 socket + pipe 说 JSON。它**不用** pi-client/pi-protocol 的 CBOR 栈，而是自带 newline-delimited JSON transport、自研 frame 集（`call`/`result`/`error`/`cancel`/`event`/`announce`/`ping` 七项——其 README 自称 "six frame kinds"，与代码对不上）、**自己的 `defineService`**，与 chord 的 `defineService` 是两套不同的东西。它与 `experimental/services/` 是**并列**关系，不是其上层。

### 结论

原页对这条线的定性（"研究性质，不是集成 API"、"dev-only、source-only"）是对的，上游的最终处置比定性更进一步：**直接删除**。这条 authoring 面不构成任何当前集成路径。

**注意**：durable 侧的对应能力（Harness、task graph、replicated state、`ConversationView`）**没有**被删除——它们仍是 `packages/durable` 的正式接口。被删的是 coding-agent 里那套把 durable 挂到跨进程 RPC 服务目录上的**装配与演示层**。

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
| session 分享（v0.84.3 起） | `/share` 上传；v1.3.0 起由 `sessionShareDestination` 选 `auto`/`gist`/`radius`（默认 `auto`：有 Radius 认证走 Radius，否则私有 gist；`settings-schema.ts:224-229`） |
| Markdown 渲染 | 宿主自渲染（事件中是原始文本） |
| 跳到底部指示器（`TuiAltScreen.scrollToEndIndicator`，v0.85.0 新增） | 宿主自己渲染：follow-end 主 scroll view 滚离末端时，在最后一行居中显示一个可点击的"跳到底部"标签（选项 `tui-alt-screen.ts:180`，渲染 `:1618-1634`）。无 SDK/RPC 等价物 |
| 鼠标区域组件（`MouseRegion`） | pi-tui 已从 `packages/tui/src/index.ts:21` 导出（`components/mouse-region.ts`），可作为宿主自绘 UI 的复用原语；无 SDK/RPC 等价物 |

TUI 的源码在 [`packages/coding-agent/src/modes/interactive/`](../../packages/coding-agent/src/modes/interactive/)，使用自研 pi-tui 渲染器。它不是 SDK 的 UI 层——它是 SDK 的一个 consumer，外部 UI 是另一个 consumer。

> **v1.0.0 注记（嵌入宿主时的 TUI 形态）**：fullscreen 成为默认 TUI 模式（`settings-manager.ts:184` 注释、`:1348-1350` `getTuiMode()` 未设置即 fullscreen）。把 `pi` spawn 进宿主提供的终端面板、又想要"普通滚动回终端"形态的宿主，需显式逃生舱：setting `tuiMode: "regular"` 或 `--tui-mode regular`（`args.ts:326` 帮助文本）。注意 fullscreen 专属设置（`fullscreenExitOutput`/`fullscreenScrollbar`/`fullscreenCopyOnSelect`/`fullscreenWheelScrollLines`）在 regular 模式下无效果（`settings-manager.ts:185-188`）。

## 部分覆盖或需要谨慎的能力

| 能力 | 当前判断 |
|---|---|
| 多项目/多 workspace | AgentSession 绑定一个 cwd。多项目需要多个 session 实例 |
| 远程 workspace | 不是内置能力。文件操作在本地文件系统 |
| 多用户服务 | 没有认证、隔离、审计。需要宿主自己实现多用户管理层 |
| 权限自动批准 | hook 层面可以总是返回 approve，但产品上要非常保守 |
| 长会话恢复 | session 持久化到 JSONL 文件（coding-agent 的 `SessionManager`），重启后可恢复。RPC 进程崩溃后需重新 spawn。agent 包的 session v4（`JsonlSessionRepo`）已在 v1.0.0 随 session 层整树删除；coding-agent 用 `SessionManager`（JSONL v3），durable 用 `Session` |
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
| HTTP server | `opencode serve` (端口 + mDNS) | 无。experimental 的 `pi-server` 曾是 Unix socket、不是 HTTP，且已于 v1.2.0 删除 |
| SSE 事件流 | 内置 `/event` | 无（RPC JSONL 等价，但不是 HTTP） |
| 交互式权限 API | `/permission/:id/reply` | hook-based，无独立 API |
| 交互式问题 API | `/question/:id/reply` | 无等价物 |
| GitHub Action/Agent | 预置集成 | 无预置集成 |
| Slack bot | 预置集成 | 无预置集成 |
| MCP server 能力 | 有 CLI 管理工具 | **v1.0.0 起有一级支持**（旧结论"无"失效）：独立客户端包 `packages/mcp`（`@earendil-works/pi-mcp`，零 pi 依赖 + OAuth）+ 内置 `mcp` 扩展；配置在 `~/.pi/agent/mcp.json` 与受信项目 `.pi/mcp.json`（sync 0008 重锚：项目 override 逻辑现 `extensions/mcp/config.ts:74-154`，旧 `:117-118` 已失效；v1.0.1 起项目条目没有 `command`/`url`/`type` 即为 override，只改 `enabled`/`exposure`/`toolExposure`，其余继承全局定义，#10277）；CLI `pi mcp add/remove/list/login/logout`（`extensions/mcp/cli.ts:34-39`）、`--no-mcp`（**1.0.4 起已发布**，非 Unreleased）整体禁用内置 MCP 扩展；TUI `/mcp`（`extensions/mcp/index.ts:271`）。仍无 ACP |
| ACP 编辑器协议 | 支持 | 无 |
| SDK 跨语言方案 | `@opencode-ai/sdk` (JS/TS) | RPC JSONL（任意语言可实现）；CBOR 二进制 protocol 已随 `packages/protocol` 在 v1.2.0 整体删除，不存在 dev-only 的现存实现（见上文删除事实） |
| CI JSON stream | `opencode run --format json` | RPC stdout JSONL |
| in-process 嵌入 | SDK v2（实际 spawn 子进程） | SDK 真 in-process（同一事件循环） |

## 当前推荐口径

对外介绍 pi-mono integration harness 时，可以这样说：

> pi-mono 可以作为本地 headless agent runtime 被其他产品嵌入。JS/TS 宿主优先用 SDK（`createAgentSession`，同进程调用），非 JS 宿主用 RPC 子进程方案（JSONL over stdin/stdout）。没有 HTTP server——这是 library-first 设计。历史上曾有一条 experimental 的 protocol/client/server 栈（Unix socket + CBOR 二进制），但它在 v0.85 被重建为 chord 适配层、且已降级为 **dev-only、非 supported**，不构成对外的集成面。TUI 只是一个参考实现（React Ink），不是必须复刻的 API surface。
