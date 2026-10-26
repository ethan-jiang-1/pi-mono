# Pi 结构与质量工程：证据研究

## 证据边界

本报告只使用当前工作树的一手仓库证据：源码、包 manifest、仓库脚本及其测试。本次工作树 HEAD 为 `0834f00835992629a6f84d9498e7ea427049981c`；与现有专题使用的 `cb18c7cbc89d5becbb4ea2e490a6e7ad0e989f04` 代码一致，本轮仅有 docs-only diff。这里的“设计意图”指 README/JSDoc/注释明确写出的目标；“自动检查”指脚本或测试实际执行的约束；“推断”只表示由结构和检查范围归纳出的工程含义，不把推断冒充作者宣言。未运行 build、tests、install，也未修改其它文件。

现有 [`answer.md`](answer.md) 已覆盖 core-minimal、扩展合同、上下文控制、可观察性、重试/安全边界及组装成本；但它把“极简”主要写成职责分层和用户选择，尚未具体说明这些边界如何由公开入口、依赖图和语义测试持续强制。以下是建议优先补入的深层机制。

## 1. 公开 API 是成本合同，不只是导出清单

**设计意图。** `check-entry-graphs.mjs` 的文件头把 entry point 直接定义为 cost contract：`exports` map 是公开模块的边界，而一次意外的 `export *` 可能让窄入口拖入整桶模块；脚本的目标是在提交时用每入口预算阻止这种回归，而不是等运行进程后才测量。[E127](../_evidence/render.md#e127)

**自动检查。** 脚本只追踪 value import；`import type` / `export type` 不计入运行时图。[E128](../_evidence/render.md#e128) 它把工作区包名映射到源码根，因而跨包 value import 也会被追踪；外部依赖则在图边界停止。扫描使用正则匹配静态 import/export，不覆盖动态 import/require，因此这不是完整动态加载图或运行时内存测量。[E129](../_evidence/render.md#e129)、[E130](../_evidence/render.md#e130) 但这不是所有公开入口的通用预算：`BUDGETS` 只列出 `@earendil-works/pi-ai` 的 `./models`、`./utils/*` 和 durable 的根入口；未列出的入口保持 unbounded。[E131](../_evidence/render.md#e131) 这些已列预算并非抽象口号：ai `./models` 禁止 providers、生成模型总表和根 index，`./utils/*` 禁止 providers、api 和 index；durable 根入口也禁止拉入 ai 根 index 与 TypeBox helper。脚本还检查预算对应的 export 是否存在、目标源码是否存在，并对超预算与 forbidden path 失败。[E132](../_evidence/render.md#e132)

**推断。** 对受预算覆盖的入口而言，minimal 不是“源码文件少”，而是入口承诺可接受的依赖和评估成本；脚本本身并未把这项保证扩展到所有公开入口。因此 answer.md 中“核心克制”应补一句：public API 的窄化需要针对性图预算和 forbidden dependency 门禁来维持；否则只写 `exports`、extension 或职责分层，无法解释一次 barrel import 为什么是质量回归。

## 2. node/browser 隔离是双重边界：入口合同 + 实际 bundle 证据

**设计意图。** durable 的 manifest 把可移植根入口、可移植 `env`/storage 子路径和显式 Node 子路径分开；例如 `./env` 与 `./env/node`、`./storage/sqlite` 与 `./storage/sqlite/node` 是不同 export。[E133](../_evidence/render.md#e133) Chord 也把通用 root/context/delta 与 Node-only `./node` 分开。[E134](../_evidence/render.md#e134)

**自动检查。** durable 的 runtime-boundary 测试递归读取入口源图，遇到 `node:` import 立即失败，并明确忽略 type-only import（因为它们会被擦除）。它要求 durable 根入口不带 env、JSONL、SQLite 实现图；portable SQLite/环境/JSONL 子路径也不得带对应 node adapter。[E135](../_evidence/render.md#e135) 这把“browser-safe”从命名约定变成可执行图约束。

仓库级浏览器 smoke 进一步真的用 esbuild `platform: "browser"` 打包：durable smoke 要求 portable core/storage 文件出现，同时拒绝三个 Node adapter；agent selective-provider smoke 要求不出现 `pi-ai/compat`、`models.generated.ts`、`providers/all`，且实际 SDK 只能出现 Anthropic、catalog 只能贡献 `anthropic.json`。[E136](../_evidence/render.md#e136) 对应的入口文件刻意导入这些公共入口并保持 runtime-neutral，说明 smoke 检测的是暴露出来的实际可打包路径，而不只是静态 manifest。[E137](../_evidence/render.md#e137)、[E138](../_evidence/render.md#e138)

**推断。** “library-first”在这里不是一个产品优先级宣言，而是多个 host 合同：同一能力必须有明确的可移植入口和显式 Node adapter，且 bundle 结果必须验证。answer.md 目前写了“替代宿主”和“durable 是另一运行时”，但缺少“入口条件与实际 bundle 图必须同时过门禁”这一机制。

## 3. 运行时依赖检查阻止“工作区存在”掩盖发布错误

**自动检查。** `check-runtime-deps.mjs` 用 TypeScript AST 检查 public workspace packages 的源文件。它把 package 自身、dependencies、optionalDependencies、peerDependencies 作为允许集合；相对路径、绝对路径和 Node built-in 免检，其他运行时 import 必须声明。[E139](../_evidence/render.md#e139) 检查范围不止静态 import/export，还包括动态 `import()`、`require()` 和 `require.resolve()`。[E140](../_evidence/render.md#e140) 它另外拒绝“被 tsconfig exclude 但又被 public build 引入”的文件，注释明确指出 TypeScript 的 exclude 只过滤 roots，不能阻止 import 把排除文件重新拉回构建。[E141](../_evidence/render.md#e141)

**自动检查的反例。** 测试覆盖了工作区包存在但未声明依赖的失败案例（#9132）、side-effect/mixed export/literal dynamic load，以及通过 `export *` 或 type-only import 触达 excluded source 的失败案例。[E142](../_evidence/render.md#e142)、[E143](../_evidence/render.md#e143)、[E144](../_evidence/render.md#e144) JSON asset 和构建排除的实验目录则有明确允许例外。[E145](../_evidence/render.md#e145)

**推断。** 复用 workspace 基础库不等于可以省略 package 边界：本地 symlink/monorepo resolution 可能掩盖发布 manifest 缺依赖，type-only 也不意味着“可以从 runtime build 随便引入 excluded code”。这应成为 answer.md 里“复用基础库的真实限制”的优先补充：复用要付出声明依赖、入口图、构建条件和 adapter 语义的审计成本。

## 4. 消息类型与模型输入之间有显式转换边界与类型约束

**设计意图与类型合同。** agent loop 全程保留可扩展的 `AgentMessage`；`convertToLlm` 负责把它转换成 LLM 能理解的四种标准消息，不能转换的 UI/status 消息应过滤，且 converter 不应抛出而应返回安全 fallback。[E146](../_evidence/render.md#e146) loop 只在 provider 请求边界执行 `transformContext`、`convertToLlm`，随后调用 `normalizeContext`；它不把内部消息直接交给 provider。[E147](../_evidence/render.md#e147) pi-ai 的 `Context` 是调用者侧 shorthand，而 `TranscriptContext` 带 brand，注释明确说明只有 `normalizeContext()` 能产生它，在 TypeScript 类型层面防止 raw Context 被误传到 provider；这不是运行时或安全隔离。[E148](../_evidence/render.md#e148)、[E149](../_evidence/render.md#e149)

**语义机制。** transcript 中 system message 记录 prompt/tool 的增量；`getCurrentTools` 按顺序 replay，工具重定义被表示为 removal + addition；对于不支持中途 system message 的 provider，`collapseSystemMessages` 重建 leading system message。[E150](../_evidence/render.md#e150)、[E151](../_evidence/render.md#e151) 这不是把所有 provider 当成同一种 API，而是先统一内部 transcript，再按 provider 能力折叠/保留。

**跨 provider 适配与测试。** `transformMessages` 先规范 null/missing content，再按目标模型能力降级图片；跨模型时**丢弃**不兼容的 thinking（v1.3.0 起是 drop，不再是转 text：`transform-messages.ts:128-136`），并通过映射同步归一化 tool-call ID。[E152](../_evidence/render.md#e152)、[E153](../_evidence/render.md#e153) 测试证明 Copilot/OpenAI 历史迁移到 Anthropic 时会把 thinking 转 text、移除 thought signature，并为尾部孤儿 tool call 生成 error tool result；部分已存在结果的多 call 只补缺失者。[E154](../_evidence/render.md#e154)、[E155](../_evidence/render.md#e155)

**推断。** “可扩展消息”并不意味着 provider 任意接受内部类型；可扩展性被限制在一个显式适配边界。answer.md 对上下文控制的描述应补充：可控输入依赖 AgentMessage → Message → branded TranscriptContext → provider-specific transform 这条路径，且适配必须处理历史不完整、能力差异和 tool-call identity。

## 5. tool call/result pairing、取消和并发是被测试锁定的语义

**实现路径。** agent loop 对每个 assistant tool call 先找工具、prepareArguments、校验 schema，再执行 `beforeToolCall`；未知工具、校验失败、阻断和 abort 都生成错误结果而不是让工具 call 无对应结果。[E156](../_evidence/render.md#e156) 执行完成后才运行 `afterToolCall`，再由同一个 `toolCall` 生成带 `toolCallId`/`toolName` 的 `toolResult`，并按 message lifecycle 发出。[E157](../_evidence/render.md#e157)

并发模式先按 assistant source order 做准备，然后并发执行；`tool_execution_end` 按完成顺序发出，但 tool-result message 按 source order 生成，保证 UI 事件能反映真实完成顺序而 provider transcript 保持稳定配对。[E158](../_evidence/render.md#e158) 测试用一个阻塞的 first call 和立即完成的 second call 证明：执行 end 是 `tool-2, tool-1`，而 message/turn result 是 `tool-1, tool-2`。[E159](../_evidence/render.md#e159) 同一测试文件还证明一个 `executionMode: "sequential"` 工具会强制整批顺序执行，即使全局默认是 parallel。[E160](../_evidence/render.md#e160)

取消不是单纯设置 flag：stream contract 要求错误/取消编码为 terminal stream event 和 `AssistantMessage.stopReason`；faux provider 测试覆盖首 chunk 前、中途 text/thinking/toolcall delta 的 abort，并断言不会伪造未完成的 `*_end`。[E161](../_evidence/render.md#e161)、[E162](../_evidence/render.md#e162)、[E163](../_evidence/render.md#e163) agent 测试还覆盖已 settle tool 的 late update 被忽略，以及 async subscriber 未 settle 前 agent 仍保持 streaming/idle 不变。[E164](../_evidence/render.md#e164)、[E165](../_evidence/render.md#e165)

**推断。** 这里体现的“简单”是少数可组合状态机和明确 pairing/in-flight 语义，而不是省略并发、取消、重试的复杂性。现有 answer.md 提到 `agent_settled` 和自动恢复，但没有说明质量工程如何用事件顺序、结果顺序和 abort terminality 把这些语义固定下来；应优先补入一条具体 trace。

## 6. Chord、telemetry、durable 说明“极简”是分层，而非全仓库无复杂度

**Chord 的边界。** Chord 是独立的 application-composition runtime，可供无关应用使用；**本基线 起它依赖 `@earendil-works/pi-telemetry`**（`package.json:89`，`test/boundary.test.ts` 显式放行），README 里"不依赖其它 Pi 包"的旧话已不成立。[E166](../_evidence/render.md#e166) 它把 strict-JSON remote boundary、服务 grammar、replicated state、delta reset/order 和 context cancellation 作为通用机制，但不规定 framing/routing/outer envelope。[E167](../_evidence/render.md#e167)、[E168](../_evidence/render.md#e168) package boundary 测试自动拒绝依赖 Pi 包和越出 Chord source root 的相对 import。[E169](../_evidence/render.md#e169)

这支持一个有限结论：Pi 可以把 composition/RPC/replication 复杂度放在可复用的独立层，降低 agent core 的职责；但不能把“agent core minimal”改写为“整个仓库的运行语义简单”。Chord 的通用边界仍要求 adapter、strict JSON、队列/reset 和 replica 生命周期正确。

**Telemetry 的边界。** telemetry root 只提供显式 callback-based context/span、no-op/reference adapter 和 schema utilities；没有 exporter、global current-span 或 backend dependency。[E170](../_evidence/render.md#e170) 它要求 adapter 保持 callback exactly once、传播结果/拒绝 identity、等 promise settlement、记录方法同步/非抛出并在 settlement 后 inert。[E171](../_evidence/render.md#e171) runner-independent conformance suite 直接覆盖并发 parentage、事件顺序、post-settlement inert 和 unreadable payload 的被动失败。[E172](../_evidence/render.md#e172)、[E173](../_evidence/render.md#e173)、[E174](../_evidence/render.md#e174) telemetry 还明确禁止把 context/span/backend trace object 当 durable application state，并避免 AsyncLocalStorage，使 root 可用于 Node、Bun、browser、worker。[E175](../_evidence/render.md#e175)

这意味着“可观察”也有最小边界：显式传递、不改变业务结果、适配器承担 backend-specific complexity；不是把 telemetry 逻辑塞进每个核心 API，也不是自动拥有完整 trace。

**Durable 的边界与真实限制。** durable README 把它标为 experimental；其语义是 conversation/model turn/tool call 在展示前先 commit，进程死亡后 reopen 可恢复。[E176](../_evidence/render.md#e176) 它的最小单位不是一次函数调用，而是 Harness、immutable transcript entries、atomic commit、checkpointed task、inbox 和 usage 文档等层次；README 的 trace 明确展示 generation 持有 tool tasks 并等待对应 results。[E177](../_evidence/render.md#e177) tool intent 先 commit；只有 `replay: "safe"` 才会在重开时 rerun，否则返回 interrupted error，并保留已经 commit 的输出。[E178](../_evidence/render.md#e178) portable storage core 与 Node adapter 分开，且明确没有 cross-process locking；自定义 backend 需要跑 storage conformance suite。[E179](../_evidence/render.md#e179)

**推断。** durable、Chord、telemetry 不是对“极简”的反例，而是它的层次含义：把持久性、分布式状态、诊断和 runtime adapter 放进独立合同；核心简化的是责任边界和可替换接缝，不是把每个层的失败、并发和恢复语义删掉。answer.md 已区分 agent loop、coding-agent session、durable，但仍应补充“独立层也各自有 conformance、runtime boundary 和恢复合同；复用它们不是零成本”。

## 7. 现有 answer.md 的缺口与优先补充顺序

1. **优先补入口成本合同。** 在“核心克制”后加入 `exports → value-import graph → maxFiles/forbid` 的具体路径，说明 minimal 的一个可测含义是窄入口不应隐式携带整个 provider/模型图。
2. **优先补 node/browser 依赖边界。** 将 durable 的 portable/node subpath 与 browser smoke 的 metafile 检查并列，说明“可嵌入”要求实际 bundle 不含 Node adapter；manifest 命名本身不是证明。
3. **优先补消息适配边界。** 在“上下文可控”中加入 `AgentMessage → convertToLlm → normalizeContext/TranscriptContext → provider transform`；说明内部扩展消息与 provider 可接受消息之间存在显式转换边界与类型约束，而跨 provider 迁移还要处理 ID、thinking、图片和 orphan tool result。
4. **优先补语义测试 trace。** 在“可观察与可嵌入”或“失败恢复”中加入 tool call/result pairing、parallel completion vs source-order persistence、abort terminal event、subscriber settlement 的测试证据。这样能把“可预测”从修辞变成可复核的事件/状态合同。
5. **补“复用基础库的真实限制”。** 明确 workspace package 存在不能替代 runtime dependency declaration；Chord 的独立性不代表其 remote/delta 语义免费；telemetry adapter 仍要满足 conformance；durable 的 replay policy、单进程 storage ownership 和 experimental API 都是宿主责任。
6. **收窄“library-first”措辞。** 当前证据支持多入口与显式边界，不支持把 library-first 当官方产品优先级或保证所有宿主行为完全等价。建议保留现有 answer.md 的谨慎表述，并以入口/bundle/adapter 检查作为事实依据。

## 结论

现有专题正确指出 Pi 以职责克制换取可定制、可观察和宿主选择权，但还没有写出质量工程如何使这种克制可持续。仓库证据显示，Pi 的结构质量依赖一组互补门禁：公开入口图预算、运行时依赖 AST 检查、portable/node 的 source graph 与 browser metafile smoke，以及对消息适配、tool pairing、并发、取消和 adapter 生命周期的语义测试。更准确的总结不是“Pi 把复杂性消灭”，而是：**把复杂性放到命名清晰、可替换、可测试的边界；再用入口和 conformance 检查防止它反向渗入核心。** 这句话是结构推断，不是仓库中的官方口号。
