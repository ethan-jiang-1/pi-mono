# 04 · codemode:模型写代码编排工具调用

codemode 是 v1.0.0 新增的官方包与 coding-agent 内置扩展能力。模型写 JS，在 QuickJS-WASM 中调用宿主注入能力；它编排的是工具调用，不是专用子代理原语。

> **⚠️ v1.2.0：codemode 有**两份平行实现**，不是一次迁移。** 本页主体描述的是 **coding-agent 侧**（`packages/codemode` 独立包 + `packages/coding-agent/src/extensions/codemode/` 内置扩展）。v1.2.0 在 **durable 侧**又**独立新增**了一套 `packages/durable/src/codemode/`——它**不是**上述实现的下移或替代，两者并存、互不继承。差异见下节。

> **应用合同局部复核**：`cb18c7cbc89d5becbb4ea2e490a6e7ad0e989f04`。下文部分细节属于独立 `CodemodeSandbox` 包，不能直接当 coding-agent 默认值：应用 `codemode` 工具默认 inactive，需显式启用；成功的 `store` 写会话 custom entry，失败写入不保留；应用还注入 `models`、工具搜索等能力，脚本未指定超时则无默认期限。见 [应用 codemode 文档](../../packages/coding-agent/docs/codemode.md)、[启用设置](../../packages/coding-agent/docs/settings.md#tools)。

## 为什么是这个形状:设计考量

独立包 README 开篇概括基础能力边界，不是全部应用合同："Runs model-written JavaScript in a QuickJS VM (compiled to WebAssembly) where the only capability is calling injected tools. **Nested tool calls never enter the LLM context; only the script's output and return value do.**"(`packages/codemode/README.md:3`)。

这条合同回答的是扇出型工具工作(批量读文件、聚合多个来源、多步数据变换)的上下文经济学:逐轮委派时,每个中间工具结果都要付一次 LLM 上下文的钱;把循环搬进代码,中间结果留在 VM 里,**只有脚本吐出的 output 和返回值进上下文**。与 DSH workflow 的对照:`agent()` 钩子让脚本扇出子代理(隔离的是整个 agent 上下文);codemode 让脚本扇出工具调用(隔离的是工具结果的上下文)——**同一思想("脚本而不是对话持有循环、分支与中间结果"),作用在更轻的一级**。

## `packages/codemode` 的三种沙箱后端（v1.2.0 新增，硬事实）

前两节讲的是"谁在用 codemode"。这一节讲**沙箱本身跑在哪**——v1.2.0 把单一沙箱模型扩成了三种后端 + 一个共享基类：

| 后端 | 实现文件 | 形态 |
|---|---|---|
| `CodemodeSandboxBase` | `src/runtime/execution.ts` | **共享基类**，其余后端继承它；桥校验与错误类型也在这里 |
| `InlineCodemodeSandbox` | `src/runtime/inline.ts` | 不另起 worker 线程，在同一 runtime 内跑；带 `interruptBudget`（默认 `DEFAULT_INTERRUPT_BUDGET`） |
| `RemoteCodemodeSandbox` | `src/runtime/remote.ts` | VM 在**另一个 isolate**，工具调用回到调用方；配套 `serveCodemodeRemote` 与 `CodemodeRemote*` 消息类型 |
| `CodemodeSandbox` | `src/runtime/host.ts` | 宿主侧封装（原有的那条路径） |

新增**子路径导出**（`packages/codemode/package.json` 的 `exports`）：`./portable`（不引 Node 内建，供非 Node 宿主）、`./cloudflare`（`CodemodeSandboxDurableObject`）、`./worker`；加上原有的 `.`、`./declarations`、`./source`。仓库内附 `examples/cloudflare`。

这条线意味着：**codemode 的沙箱不必然是本机的一个 worker 线程**。在 Cloudflare 上它可以是一个 Durable Object，在远端场景是另一个 isolate——这对"脚本在哪执行、工具副作用落在哪"的判断是决定性的。

**确定性重放 API（`sandbox.start()`）**：v1.2.0 的沙箱启动面支持按记录重放——`onCall`、`run.deliver()`、`seed`、虚拟时钟（由 `startedAt` 起算）、`onStarted`（指纹）、`onIdle`、`run.finished`；契约要求 UTC、不得依赖 `WeakRef`/`FinalizationRegistry`。这是 durable 侧 `pi.codemode.journal` 那套确定性重放能成立的前提。

## 两份实现的分工（v1.2.0）

| | coding-agent 侧 | durable 侧（v1.2.0 新增） |
|---|---|---|
| 包 | `packages/codemode`（独立）+ `packages/coding-agent/src/extensions/codemode/` | `packages/durable/src/codemode/`（5 个文件：`codemode.ts` 1,037 行、`describe.ts`、`index.ts`、`models.ts`、`output.ts`） |
| 入口 | 扩展 `index.ts` → `tool.ts`，依赖 `@earendil-works/pi-codemode` | `createCodemodeExtension` / `createCodemodeTool`（`index.ts` 导出） |
| 状态 | 成功 `store` 写会话 `codemode-store` custom entry | 每次投递结果写 **`pi.codemode.journal`**（kind 常量 `codemode.ts:149`），按投递顺序 |
| 核心差异 | 沙箱只管执行，持久化由宿主扩展实现 | **journal + 时钟值重放**：给定同样的脚本、`startedAt`、`seed`、工具与 store，在同一 fingerprint 的 VM 上重放出同样的调用、参数与输出（确定性重放，`codemode.ts:10-29` 有完整说明） |
| 版本/名 | — | `CODEMODE_MODULE_VERSION = 2`（`codemode.ts:86`）、`CODEMODE_TOOL_NAME = "codemode"`（`:88`）、`DEFAULT_CODEMODE_INLINE_BUDGET`（`describe.ts` 导出） |

**为什么值得记**：这是"同一问题域、两种正当解法"的实例——coding-agent 需要的是**会话内可恢复的 store**；durable 是持久任务运行时，需要的是**可确定性重放的执行记录**（崩溃后重放要产出逐字相同的结果）。把一者描述成另一者的迁移是错的。

## 机制

### 独立包的基础能力（应用层另有注入）

- `tools.<name>(args)`:调用注入工具,参数与结果做 JSON 往返;非法标识符字符转 `_`(`README.md:40`；v1.2.0 未变);
- `ALL_TOOLS`:列出全部注入工具的 `{ name, description }`(v1.2.0：`README.md:50`);脚本可以**先发现再调用**——这是沙箱内的自省面;
- `text(value)` / `image(...)` / `console.*`:向 `result.output` 追加内容(v1.2.0：`README.md:51`);
- `store(key, value)` / `load(key)`:跨次执行的 JSON 状态,单值上限 256 Ki、总量 1 Mi(v1.2.0：`README.md:74`);
- `exit()`:立即成功结束,保留 output 与 store 写入(v1.2.0：`README.md:53`);
- **可注入 globals**：独立包支持宿主 globals，应用用它提供 `models`、工具搜索/声明等，见 [包合同](../../packages/codemode/README.md#usage)与[应用 Globals](../../packages/coding-agent/docs/codemode.md#globals)。没有原生 timers、`fetch`、`process`、`require`、modules、`WebAssembly`；可通过宿主提供的工具触及外部世界。

### 资源与终止

- `timeoutMs` 默认有期限,`Infinity` 显式免除;**"等一个永远无法 settle 的 promise"会立即失败而不是挂死**——VM 无 timer 无 I/O,宿主能识别这种死态(v1.2.0：`README.md:58`);
- `memoryLimitBytes` 封顶 VM 堆,超限在脚本内部抛 `InternalError: out of memory`(v1.2.0：`README.md:60`);
- 输出封顶(v1.0.1,#10283):`text()`/`image()`/`console.*` 桥接到宿主的输出也有限额——超过 `MAX_OUTPUT_CHARS`(16 Mi 字符,含 base64 图像数据)或 `MAX_OUTPUT_ITEMS`(10 万条)即以 `RangeError` 失败脚本(**v1.2.0：`packages/codemode/src/runtime/prelude-source.ts:42-43`**)。此前 VM 堆有 `memoryLimitBytes` 但宿主侧留存无限额:一个死循环 `console.log` 能把**宿主进程**内存耗到崩溃;item 上限正是堵"循环打印空串"的绕过。

### 状态语义

独立沙箱自己不持久化：宿主传入 `options.store`，成功结果返回 `storeWrites`，失败结果不报告写入，见 [独立包 Store 合同](../../packages/codemode/README.md#store)。coding-agent 已实现宿主持久化：成功 store 写 `codemode-store` custom entry，恢复和分支按会话路径重建，见 [应用 Store values](../../packages/coding-agent/docs/codemode.md#store-values)。**不提交 store 不等于撤销脚本已调用工具的副作用**；工具操作真实发生，失败前的文件/网络操作不会自动回滚。

### lockdown:built-ins 冻结与桥校验(b223082bb，v1.2.0 起在 tag 内)

"唯一能力是注入工具"的合同此前有一个软肋:prelude 与模型脚本**共享同一套 VM built-ins**,prelude 用 `JSON.stringify` 把返回值、store 写入、错误描述序列化后经 bridge 发给宿主。脚本若改写 `Array.prototype.toJSON` 或整个替换 `globalThis.JSON`,序列化桥即被劫持——prelude 发出的 payload 畸形,宿主在 worker message listener 里同步 `JSON.parse` 抛错,直接变成宿主进程的未捕获异常且 `execute()` 永不 settle(注入工具的调用结果同样经这条桥往返,payload 一坏整条执行链失效,#10444)。

修复落在两侧:

- **VM 侧冻结**:prelude 最前面的 `lockdown()` IIFE(**v1.2.0：`packages/codemode/src/runtime/prelude-source.ts:58`起**（v1.0.1 时为 `:56-135`；文件 512→522 行）)BFS 遍历 `globalThis` 自有键与从实例够到的 intrinsics,逐个 `Object.freeze`;built-in global 的数据属性改只读不可配置。freeze 的经典坑"override mistake"(原型上只读数据属性会让实例赋值也抛)用 accessor 化化解:`OVERRIDABLE` 集合(`constructor`/`name`/`message`/`toString`/`toLocaleString`/`valueOf`/`toJSON`)与 `Object.prototype` 全部成员转 getter/setter——实例上定义自有属性仍可用(`class MyError extends Error` 里 `this.name = "MyError"` 照常工作),对原型本身赋值抛 `TypeError`。
- **宿主侧校验**:每个 worker payload 经 `parseBridgeJson`/`parseStoreWrites`/`parseScriptError` 严格校验形状,不合法即 `BridgeError`(**v1.2.0 已迁移：`packages/codemode/src/runtime/execution.ts:102`=`BridgeError`、`:104`=`parseBridgeJson`、`:112`=`parseStoreWrites`、`:131`=`parseScriptError`**);message listener 包 try/catch,`BridgeError` 以 sandbox 错误收场("Sandbox bridge broken: ... The script may have modified built-ins",**v1.2.0：`execution.ts:324`**);`finish()` 本身不再解析 JSON,返回值在 finish 之前解码完毕——"worker 消息 = 可信输入"的假设废除。

这对 :9 "中间结果留在 VM 里"的可靠性边界是实质加固:脚本不能再借原型改写污染序列化桥。但它不触及进程边界——冻结的是 **VM 能力面**,注入工具仍以宿主权限执行("无进程级隔离"结论保留,见下节)。

### 图像:输出落盘与读图返回 image block(coding-agent 侧)

- **出**:`image()` 的输出此前无法再次引用——脚本不能写文件、`write` 工具只收文本。v1.0.3 起 codemode 结果里的每个 image item 在截断**之后**统一落盘,前面插入 `[Image saved to <path> (…)]` 文本标签(`saveImages`,**v1.2.0：`packages/coding-agent/src/extensions/codemode/execute.ts:359`**（标签在 `:370`）;截断后执行,路径永不与图片分离);输出文件统一经 `src/utils/output-files.ts` 创建,权限 **0o600**、`wx` flag 防符号链接抢占,写盘失败降级为标签文本而非丢结果(#10310)。
- **进**:`tools.read()` 读图片文件返回 image block 而非 resize 提示文本——read 工具新增 outputSchema(`string | {type:"image", data, mimeType, note}` 联合,`packages/coding-agent/src/core/tools/read.ts:33`),结果包成 `structuredContent`(`:216`),脚本可直接把它喂给 `image()` 展示(#10251)。
- **guidelines 随声明走**:codemode 的工具声明现在把 prompt guidelines 渲染成 bullet 追加到 description(`toCodemodeDeclaration`,**v1.2.0：`packages/coding-agent/src/extensions/codemode/tool.ts:145`**)——隐藏工具的 guidelines 从 system prompt rules 迁到工具声明,脚本自省面(`ALL_TOOLS`)拿到的描述自带使用约束(#10343)。

## 边界与上限

- **编排的是工具,不是 agent**:脚本里没有"起一个子代理"的原语;要委派,得把 subagent 之类做成注入工具(内置组合未提供)。
- **无进程级隔离**:QuickJS 隔离的是 VM 能力面,不是操作系统权限;脚本调用的工具以宿主权限执行——与 pi"无沙箱、边界在进程外"的一贯立场一致([`harness/02-Boundaries/2.1`](../harness/02-Boundaries/2.1_no_sandbox.md))。lockdown 冻结的同样是 VM 能力面(见上),不改变本条结论。
- **一次性执行**:脚本跑完即结束,没有跨 run 的恢复点;`store` 是唯一的跨执行状态,且要宿主配合保存。
- 结果是否进上下文、以什么预算截断,由 coding-agent 的内置工具层决定,不在本包合同内。

## 与相邻原语的关系

- 比 [03](./03-subagent.md) 轻:同一"隔离执行"需求,委派整 agent 用 subagent,聚合工具调用用 codemode;
- MCP server 的工具可以作为注入工具进脚本——`README.md:5` 明说本包可独立用于"remote APIs, MCP servers, application services",与 [05](./05-ecosystem-tools.md) 天然组合;
- DSH 侧的完整对照(脚本如何托管模型写的代码、meta 为何不进脚本头、schema 为何手写子集校验)见 DSH `_digested/orchestration-ladder/01`;pi 侧对应的取舍记录在 codemode 包内(无 pi 依赖、独立可用)。

## 源码入口

| 路径 | 一句话 |
|------|--------|
| `packages/codemode/README.md:3` | 核心合同:唯一能力是注入工具;嵌套调用不进 LLM 上下文 |
| `packages/codemode/README.md:5` | 脚本词汇表与内置 `codemode` 工具 |
| `packages/codemode/README.md:40-47` | 脚本能力封闭清单 |
| **`packages/codemode/README.md:58,60`** | 超时与内存上限;死态立即失败（v1.0.1 时为 `:49-51`） |
| **`packages/codemode/README.md:74`** | store/load:宿主持久、失败无写入、容量上限（v1.0.1 时为 `:55-65`） |
| **v1.2.0：`packages/codemode/src/runtime/prelude-source.ts:42-43`** | 输出封顶常量 MAX_OUTPUT_CHARS / MAX_OUTPUT_ITEMS |
| **v1.2.0：`packages/codemode/src/runtime/prelude-source.ts:58`起**（v1.0.1 时为 `:56-135`；文件 512→522 行） | lockdown:built-ins 冻结与 OVERRIDABLE accessor 化 |
| **`packages/codemode/src/runtime/execution.ts:102-131,324`** | 宿主侧 BridgeError 严格校验与 sandbox 错误收场（**v1.2.0 从 `host.ts` 迁出**；`host.ts` 416→79 行） |
| **`packages/coding-agent/src/extensions/codemode/execute.ts:359`** | image() 输出落盘与 `[Image saved to ...]` 前置标签（`:370`） |
| `packages/coding-agent/src/core/tools/read.ts:33,216` | tools.read() 读图返回 image block |
| **`packages/coding-agent/src/extensions/codemode/tool.ts:145`** | 工具声明附 guidelines(toCodemodeDeclaration)（渲染在 `:149`） |
