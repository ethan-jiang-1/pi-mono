# 同步摘要 v1.4.0

**范围**: `06a466935`（release tag `v1.2.0`）→ `4a080252f`（**release tag `v1.4.0`**），跨两个 minor：**v1.3.0**（`71023aec1`，10-15）与 **v1.4.0**（`4a080252f`，10-22）
**合入**: `1bb504b0d`（`ethan` 分支，merge tag `v1.4.0`，**零冲突**）
**提交数量**: 144（v1.2.0→v1.3.0 63、v1.3.0→v1.4.0 81）；**477 文件，+33,481/−10,733**
**取证**: 5 路并行 subagent（chord / durable+codemode / ai+telemetry / coding-agent+tui / 仓库规则与发布工具），全部落回 v1.4.0 工作树逐条核验
**验证**: `_digested` 885 条相对链接 0 问题；`_faq_on_digested` 491 条 0 问题；extension corpus `verify.mjs` 40 文件通过、`verify.test.mjs` 通过、373 条外链在 v1.4.0 下 0 缺失/0 越界。`tsc` 需先 `npm run build` hydrate 模型数据（CI 是 Build→Check），本轮未跑。
**Discovery 记录**: [0010-v1.2.0-to-v1.4.0.md](0010-v1.2.0-to-v1.4.0.md)

## 一句话

v1.4.0 不是新方向，而是**把 v1.2.0 的新架构真正跑起来**：chord 的协议与公开面在两个 minor 内被重新画了一遍（`PROTOCOL_VERSION` 从"没有"到 4），durable 把"等待"变成持久任务状态并让 SQLite schema 不可回退，telemetry 从辅助包升为 ai/chord/durable 共用的横切层，ai 的模型数据从"一个生成文件"拆成"gitignore 的构建期数据 + 独立发布的 catalog"。

## 五个必须先建立的判断

### 1. chord 的第二次收口：不是重构，是换契约

`packages/chord` 在 v1.2.0 的 chord2 之后，**公开面的大改全部发生在 v1.2.0→v1.3.0 之间**；v1.4.0 只补了两个面：

- **v1.3.0**（tag 时 `PROTOCOL_VERSION` 已经是 **4**——2→3→4 三次 bump 都在 10-14 落在这个窗口，`wire.ts` 在 v1.3.0..v1.4.0 零改动）：`Handle`→`Ref`、`epoch`→`codeVersion`、`eager`→`lifetime`、`record.ts`→`object.ts`；principal 由应用注入（`createHost({ self })` 必需、`connect(link, { principal })` 必需、`Route.principal` 必需）；remote contract 必须声明 placement（`hostNamed`/`hostFamily`）；`ctx.get`/`host.get` 变 **async**（`readyTimeout` 默认 60 s）；state 成员类型从 `T | undefined` 收紧为 `T`；**端到端流控**（`ack`、`LinkOptions.window` 默认 256 KiB、`pendingCap`、`maxCalls`）、>64K 载荷 deflate、hold 带 `origin`、按对象共享 binding + `linger`、`self.state(name, schema, { init })`、`FacetApi.signal`、`taskStopDeadline`，以及 `@earendil-works/chord/output`（`OutputBuffer`/`Progress` 从 durable 迁入）。

- **v1.4.0**：`Context.telemetry`（自定义 `Context` 必须提供 `TelemetrySpan`，因此 chord **首次依赖另一个 Pi 包** `@earendil-works/pi-telemetry`——"零 Pi 依赖"的说法到此结束）、`@earendil-works/chord/sqlite` 三入口、`./telemetry-sqlite`、`ProgressClock`。

> 语料现有的 `architecture-next/chord.md` 是**在 v1.2.0 写的"失效清单"**（逐条标注 chord2 让什么失效），不是对 chord 现状的描述。v1.3.0 之后这份清单本身也过期，本页必须重写。

### 2. durable 的 sleep 是状态机改动，不是 API 糖

`TaskRuntime.sleep()` **删除**——它在 phase 内等待，而 phase 持有 invocation，重启后会重跑整个 phase 并重新等待。替代是**持久化睡眠**：任务以 `sleeping` 状态结束 phase（`TaskRuntime.sleepUntil(until, checkpoint, ctx)`，`src/types.ts:330`；或从 `commit()` 返回 `{ status: "sleeping", until, checkpoint }`），不持 invocation、跨重启存活、到点从 checkpoint 继续。

连带三处硬约束：

- **SQLite schema 迁到 2**（`storage/sqlite/migrations.ts:114-115`，重建 task 表）。打开旧库会自动迁移，**迁完不能再被 1.3.0 或更早打开**——部署无法回滚过这个 release。JSONL 不用迁移，但旧版本读不懂 sleeping 任务。
- **crash-loop guard**：连续 5 次（`settings.restartLimit`）未提交新状态就被 park（`blocked.reason = "restart_limit"`），`Harness.retryTask(id)` 放行。
- `ToolExecutionApi` 新增 `now()`（`harness/types.ts:222-223`）；`TaskRuntime.now()` 自 v1.2.0 就有，不要写成新增。手工构造这两个对象的测试 fake 必须补成员。

### 3. telemetry 从"一个包"变成横切层

v1.2.0 只有 `packages/ai` 依赖 `@earendil-works/pi-telemetry`；v1.4.0 chord 与 durable 也依赖（`packages/{chord,durable}/package.json` 的 `1.4.0` pin），并且 **`Context.telemetry: TelemetrySpan` 成为 chord 自定义 Context 的必需成员**。

- 两侧各有一套 **schema 化**的事件/指标名：`AI_TELEMETRY_SCHEMA`（`packages/ai/src/telemetry.ts:63`）、`DURABLE_TELEMETRY_SCHEMA`（`packages/durable/src/harness/telemetry.ts:50`）。属性是 content-free 的（首事件、块大小、最终 usage、错误类别），错误消息最多 500 字符。
- telemetry 包自己新增 propagation（不透明 carrier 注入/提取）、span links、metrics（counter/up-down/histogram、`createTypedMetrics()`）、`StoredSpan`/`StoredTrace`/`TelemetryStore` 与 `/render` 的 `renderTrace()`。
- 语料此前几乎没有这一层（`telemetry` 只在边角出现）。本轮为它建立独立覆盖。

### 4. 模型目录成了"有兼容门禁的运行时数据面"

数据布局本身在 v1.2.0 就已拆好（`providers/data/` 已 gitignore、构建期 hydrate、`models.generated.ts` 只做汇编，这些不是本轮新增）。**本轮变的是投递契约**：

- pi.dev 会把 catalog **直接服务给已发布的客户端**（`?pi-version=` 按 `MINIMUM_PI_VERSION` 分档）。于是一份新 catalog 可能要求旧客户端没有的代码：kimi-coding 从 `anthropic-messages` 切到 `openai-completions` 后，1.2.0 客户端仍按旧 API 发请求而失败——这就是 `MINIMUM_PI_VERSION` 提到 **1.2.1** 的原因（`scripts/model-catalog-minimum-version.mjs`）。
- 新增 `scripts/check-model-catalog-compat.mjs`：把"最新 release 的内建模型 + 新 catalog 覆盖"编译一遍，用 pi-ai 的类型（provider 与它实现的 API 绑定）在**发布前**证明不兼容；workflow 加 `fetch-depth: 0` 以便从 release tag 读源码。
- `scripts/update-model-catalog-pin.mjs` 改为**发现最新 catalog**（不带 `pi-version`，避免拿到给旧客户端的那份），并按 `provider/type/api` 分组校验——因为 provider factory 的泛型绑定 API。
- Nix 构建钉 `nix/model-catalog.json`（本轮 pin `sha256-7fe1b41…`）；release 脚本现在**先发布一版 catalog、再用它构建**，否则直接失败（`.pi/skills/release.md` 同步改写）。
- 新增 `packages/coding-agent/docs/models-configuration.md`（从 `models.json` schema 生成的全字段参考）。

### 5. client identity：UA 与 attribution 统一由 ai 决定

`identity` 选项贯穿 `Models` → `Agent` → `AgentSession`/`Harness`：`formatUserAgent()` 产出 `pi/<version> (<platform>; <runtime>; <arch>)`，`getPiUserAgent()` 删除；OpenRouter / NVIDIA NIM / OpenCode 的 attribution 头由 `PI_ATTRIBUTION` + `identity.attribution` 统一注入；`withClientIdentity()` 给宿主拿到的 `Models` 加身份。扩展的 `before_provider_headers` 处理器**不再看到**这些 attribution 头（返回 `null` 仍可删除）。

## 其它要点

- **coding-agent**：`sessionShareDestination`（`auto`/`gist`/`radius`）、`--tools +name`/`-name` 现在叠加在恢复会话的 active tools 上（#10785/#10887 在 v1.3.0 内）、summary 忽略 `reserveTokens` 改用模型输出上限、codemode 并行脚本排队等空闲 worker（默认 2 个、等 60 s、`PI_CODEMODE_MAX_WORKERS` 可调）、Rex 终端、`grep` 工具 `rg --no-config`、默认模型更换（Copilot→`gpt-6.1-sol`、NVIDIA→Nemotron 3.5、Xiaomi→`mimo-v2.6-pro`）。
- **codemode 包**：worker 生命周期语义（`acquireWorker()`、`onWorkerStarted(exited)`、`close()`/abort 在**请求**关闭后结算而非等 worker 退出）。
- **tui**：Rex（`TERM_PROGRAM=rex`，OSC 8 + truecolor + Kitty images）、进程退出时同步恢复终端模式（mouse/focus/Kitty/alternate screen）、`$$` 数学块吞表格、CJK 标点旁的粗斜体、`@` 补全的正则元字符。
- **文档**：`docs/extensions.md` 的生命周期章重写为三张 mermaid 图 + 事件分组表（**仅文档**，`agent_before_settle`/`agent_settled`/`provider_stream_event` 等事件名在 v1.2.0 已存在）；新增 `docs/models-configuration.md`、`docs/nvidia-rtx-llama-cpp.md`；`docs/tui.md` +70 行。
- **规则与工具**：`AGENTS.md` 两处（`providers/data` 不入库；"direct registry deps 含内部 workspace 包"都要精确 pin）；新增 `.pi/skills/github-work.md`（把 issue/PR 工作路由到 `.pi/prompts/{is,pr,wr}.md`）；`release.md` 把 catalog pin 设为 release 前置；`scripts/check-pinned-deps.mjs` 不再豁免内部包。

## 三类文档失效（本轮都出现了）

| 类型 | 样本 | 处置 |
|---|---|---|
| **结论整体过时** | `architecture-next/chord.md` 通篇是 v1.2.0 的"chord2 让什么失效"清单；v1.2.0→v1.3.0 之间公开面又被整体重画（`Ref`/placement/async get/协议 4） | 整页重写为 chord v1.4.0 现状描述，失效清单降为历史注记 |
| **证据链断裂（锚点）** | `docs/extensions.md` 的 `## Respect the runtime lifecycle` 改名 `Understand …`，10 条 `#respect-the-runtime-lifecycle` 链接失效；`scripts/check-pinned-deps.mjs` 64→59 行、`transform-messages-*.test.ts` 191→151 行使行锚越界 | 已改 fragment / 重定行锚，并订正"内部包被跳过"的过时结论 |
| **一手依据变化** | 模型目录的投递契约变了：catalog 直接服务已发布客户端，一份要求新代码的 catalog 会打断旧客户端（kimi-coding 切 API 即实例），所以新增 `MINIMUM_PI_VERSION` 与发布前兼容检查 | `agent/05-Infra/5.1_AI_API_Layer.md` 补 catalog 投递链与 client identity；`models-configuration.md` 进锚点 |

> **对上轮结论的订正**：0010 复核写"全库 1,559 条相对链接现全部可解析"——那只验证了**文件存在性**。本轮按行锚与 fragment 逐条核对，实际有 **20 条**失效（10 条本区间造成，10 条为 v1.2.0 之前就存在的存量缺陷，都已修复）。"链接能解析"不等于"锚点仍指向原文"。

## 两个版本基线陷阱

| 含义 | 事实 | 差异 |
|---|---|---|
| chord 的 `PROTOCOL_VERSION` | v1.2.0 **没有**这个常量；v1.3.0 tag 已经是 **4**（2→3→4 三次 bump 都在 v1.2.0..v1.3.0 之间，`wire.ts` 在 v1.3.0..v1.4.0 零改动） | 写"v1.3.0 时协议是几"必须看 `git show v1.3.0:packages/chord/src/wire.ts`；也不能把流控/单位化 state 帧算作 v1.4.0 的变化 |
| v1.2.0 tag 日期 | tag 的 committer date 是 10-13 00:46 +0200（= 10-12 22:46 UTC），CHANGELOG 写 `2026-10-12` | 跨时区引用日期时说明用的是哪种 |

## post-tag 未纳入

`v1.4.0..b84d5d1bc` 共 **68 commit**（270 文件，+12,893/−3,077），本轮**不追**，清单见 0010 的"post-tag 未纳入"节。要点：preview 包发布到 `pkg.earendil.com`（#11260）、chord `Watchable`/`NativeWatchable`、durable 只读 Harness / throttled commit 延迟落盘 / tool handoff 后继续 run、跨包增量解析 tool-call 参数（#9265）、`/ir` 从 URL 导入、coding-agent 一堆修复。

**注意**：`upstream/main` 上所有包的 `## [Unreleased]` 都是空的——这 68 个 commit 没有 changelog 记录，只能读 commit。

## 三份待同步语料

| 语料 | 关键动作 |
|---|---|
| `_digested/` | README 基线 → v1.4.0；`architecture-next/chord.md`、`architecture-next/durable-and-storage.md`、`orchestration/04-codemode.md`、`agent/05-Infra/5.1_AI_API_Layer.md` 重写；新增 telemetry 页；`integration/07` 的"chord 无 CHANGELOG/无 PROTOCOL_VERSION"断言删除 |
| `_faq_on_digested/` | README 基线；受影响篇目追加 sync-0010 增量（settings、session、provider、tui、philosophy 的 pin 口径） |
| `_pi_extension_agent_ready_development/` | 外链基线 `v1.2.0` → `v1.4.0`（369 条，`verify.mjs` 的 `BASELINE_TAG`）；AGENTS.md / release / workflows / 包表相关页复核；`_coverage/00-corpus-maintenance.md` 记 0015 轮 |
