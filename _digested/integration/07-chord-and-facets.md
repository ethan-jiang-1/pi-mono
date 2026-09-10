# 07 Chord 与 Facet/Service：第四条 authoring 面

> **基线**：v0.85.1（tag `d981de122`，merge `e3aa42f46`）。本文全部结论来自当前工作树的静态读源码取证，**没有运行 chord 测试**（原因与后果见末节）。
>
> **标注约定**：本目录此前没有强制标记法，本文对关键判断显式标注 —— **【硬事实】** 可直接读源码/文档验证；**【解释】** 基于事实的推断；**【未取证/推测】** 没有直接证据。其余沿用本目录的粗体强调与 `>` 提示块。

## 这篇在讲什么，不重复什么

[`06-coverage-and-parity.md`](06-coverage-and-parity.md) 已经写了"**第三条集成路径**"（`pi-protocol`/`pi-client`/`pi-server` 三件套，v0.85 重建、协议版本 1 → 8、已降级为 dev-only）以及它下面的 experimental remote runtime 与 `mini` 两个条目。**本篇不重复那些结论**，只补它没讲的一层：

- chord 本身是什么、为什么它已经进了**非实验源码**却仍几乎无人知道；
- facet / service / replicated state / remote boundary 这四个抽象，以及 chord 与 Pi 既有 extension 系统的关系；
- **一个必须显式声明的术语碰撞**；
- **一个读者最容易踩的坑**：`facets.md` 自称"取代 `plugins.md`"，但它的核心改动在 chord 里**一条都没实现**。

**chord 不是"第四条集成路径"。** 三条集成路径回答的是"宿主怎么调用 pi-mono"（SDK 进程内 / RPC 子进程 / dev-only 的 protocol 三件套）。本篇讲的是另一个轴：**第三方代码怎么写进 pi-mono，又怎么从服务端流到客户端**。这是第四条 **authoring 面**，而它的地基就埋在第三条路径脚下 —— 三件套现在只是 chord 的薄适配层。

## 1. 现象：一个进了非实验源码、却几乎零讨论的包

**【硬事实】** chord 不是"实验目录里的东西"。它已经出现在多个**非实验**源码文件的 import 里：

```text
packages/agent/src/harness/context.ts:1-25        Harness 的 Context/ContextKey + 8 个 context 函数全部来自 chord，整段 re-export
packages/agent/src/harness/agent-harness.ts:1     JsonRepresentation 来自 chord
packages/agent/src/harness/session/types.ts:1,10  JsonValue / JsonRepresentation 来自 chord
packages/protocol/src/codec.ts:1                  isJsonValue 来自 chord
packages/protocol/src/protocol.ts:1               JsonValue 来自 chord
packages/client/src/types.ts:1                    ServiceSubscriptionSnapshot 来自 chord
packages/server/src/types.ts:1                    JsonValue / ServiceCall / ServiceProviderUpdate 来自 chord
packages/server/src/errors.ts:1                   RemoteServiceErrorCode 来自 chord
```

**【硬事实】** 五个包把 chord 声明为**运行时 `dependencies`**（不是 dev）：

| 包 | `@earendil-works/chord` 位置 |
|---|---|
| `packages/agent` | `dependencies` `^0.85.1` |
| `packages/protocol` | `dependencies` `^0.85.1` |
| `packages/client` | `dependencies` `^0.85.1` |
| `packages/server` | `dependencies` `^0.85.1` |
| `packages/coding-agent` | `dependencies` `^0.85.1` |

也就是说：**即使你完全不碰 facet/plugin，只要你用 `pi-agent-core` 的 Harness，`Context` 类型就已经是 chord 的**（`harness/context.ts` 是整段 re-export，`BACKGROUND_CONTEXT`/`withAbortSignal`/`createContextKey` 等函数的实现在 `packages/chord/src/context/index.ts`）。

**【硬事实】** chord 自己的边界测试把这一点钉死了 —— `packages/chord/test/boundary.test.ts:11-33` 遍历 `packages/chord/src/**/*.ts`，断言三件事：源码里没有任何 `@earendil-works/pi-*` import、没有逃出 `src/` 的相对 import、`package.json` 的 `dependencies` 里没有 `@earendil-works/pi-*`。

**【解释】** 这是本篇最值得评价的结构事实：**它用自己的测试守住自己的设计边界**。README 声称"it is not a Pi package"（`packages/chord/README.md:6-7`）不是一句口号 —— 一旦有人为了图省事在 chord 里 `import` 一个 Pi 类型，CI 会直接红。这种"用可执行断言固定架构方向"的手法在本轮仓库里不是孤例（`scripts/check-entry-graphs.mjs`、`check-runtime-deps.mjs` 是同一思路），但 chord 是**唯一把这个断言写进自己包内**的。

## 2. chord 是什么

**【硬事实】** 定位（`packages/chord/README.md:3-7` 原文）：

> Chord is an application-composition runtime for systems assembled from plugins/extensions. … It is developed as a standalone package in the Pi monorepo, but **it is not a Pi package: it does not depend on any other Pi workspace package** and can be used by unrelated applications.

**【硬事实】** 它的**唯一运行时依赖是 `esbuild`**（`packages/chord/package.json:65-67`，pin 在 `0.28.1`），且只给 bundler 用。其余都是标准 JavaScript/Node API。`devDependencies` 只有 `shx` 与 `vitest`。`engines.node >= 22.19.0`。

**【硬事实】** 它的五个功能性子路径（`packages/chord/package.json:8-35`，另有 `./package.json` 自身）：

| 子路径 | 内容 |
|---|---|
| `@earendil-works/chord` | 根 API（`src/index.ts`）：facet host、service token、provider、remote binding、replicated state、wire 解析器、delta 无关的通用类型 |
| `@earendil-works/chord/context` | `Context` 常量与函数 —— **故意分出来**，因为它们的通用名字不该污染根 API（README:63-65） |
| `@earendil-works/chord/delta` | 独立的 JSON delta 原语（`track()` / `apply()` / `encoder()` / `decoder()`） |
| `@earendil-works/chord/bundler` | 基于 esbuild 的 facet 打包（`bundleFacetPackage()` / `bundleFacets()`） |
| `@earendil-works/chord/node` | Node-only 的加载器（`createFacetBundleLoader()` / `readFacetBundleArtifact()` 等） |

**【硬事实】** 规模：`src/` 24 个 `.ts` 文件、5822 行；`test/` 3553 行。

### 为什么它长在 pi-mono 里（而不是独立仓库）

**【硬事实】** `packages/chord/PLANNING.md:14` 明说了来源：

> The current Pi experiments prove many required behaviors, but **Chord will be implemented from scratch. Existing source may be used as test and design evidence, not copied** into this package. Compatibility with experimental APIs or wire messages is not a requirement.

**【硬事实】** 同一份文档的 `:538-563` 是一张 **Pi 迁移边界表**，逐文件点名"哪些 Pi 既有文件描述的行为应该变成 chord 的职责"：

| 既有区域 | 变成 chord 的职责 |
|---|---|
| `packages/agent/src/plugins/services/types.ts` | service token、mode、remote contract 检查、strict JSON、snapshot、update、connection 接口 |
| `packages/agent/src/plugins/services/replicated-state.ts` | 权威 replicated state 与投递语义 |
| `packages/agent/src/plugins/services/provider.ts` | provider 分类、调用、singleton 替换、keyed generation、snapshot |
| `packages/agent/src/plugins/services/namespace.ts` | 稳定 remote facade、hydration、state 更新、keyed observation |
| `packages/coding-agent/src/experimental/facets.ts` | plugin environment、dependency ledger、生命周期图、host、reload |
| `packages/coding-agent/src/experimental/facet-loader.ts` | static / combined loader 与 loaded-generation 所有权 |
| `packages/protocol/src/protocol.ts` 的通用 service 段 | chord 拥有的、带版本的 service/RPC envelope |

**【解释】** 所以答案是"**提炼，不是新发明**"：chord 是先把 Pi 实验代码里那套通用机制**重写成零依赖**、再回头让 Pi 依赖它。这解释了为什么一个新包会在诞生当天就进入五个包的 `dependencies`。

**【硬事实，容易误判】** 迁移表点名的 `experimental/facets.ts` 与 `experimental/facet-loader.ts` **在 v0.85.1 树里已经不存在**（被搬进 chord）。继任者是 `packages/coding-agent/src/experimental/plugin.ts`（对外 re-export 的 Pi 侧插件 API）与 `experimental/plugins/{bundled,package}.ts`（打包与加载适配）。如果你按旧文档去 grep 那两个文件名，会一无所获。

**【硬事实】** 迁移**尚未全部完成**：`PLANNING.md:565-572` 列了六步迁移顺序，`PLANNING.md:749-751` 的退出条件是 "Pi depends on Chord, while Chord remains independently packable and contains no Pi imports."。第 2、3 步（thin Pi adapters、迁移 experimental plugin host/loader）在本轮**已经发生**（见 §6）；第 6 步（删除重复的 experimental 通用实现）**没有**——`experimental/services/` 仍然在。

## 3. 四个核心抽象（外加一个 delta 原语）

**【硬事实】** 逐一对应源码入口：

| 抽象 | 类型 / 入口 | 关键语义 |
|---|---|---|
| **Facet** | `Facet { id, setup(env: FacetEnvironment) }`（`src/types.ts:225-228`）；`createFacetHost()`（`src/api.ts:19-27`）、`defineFacet()`（`src/api.ts:66-68`） | 插件的组成单元。**一个 plugin 可拆成多份，分别跑在不同进程/环境**（backend / browser / TUI） |
| **FacetEnvironment** | `src/types.ts:206-223`，**8 个成员** | `use` / `observe` / `provide` / `provideMany` / `replicatedState` / `own` / `onActivate` / `onDeactivate` |
| **Service** | `Service<T> { id, local }`（`src/types.ts:63-68`）；`ServiceMode = "singleton" \| "keyed"`（`src/types.ts:60`）；`defineService()`（`src/api.ts:70-82`） | typed + stable token。`{local:true}` 表示**进程本地、不出口**。消费者拿的是**稳定 facade**，provider 断连或被替换时不断连 |
| **Replicated state** | `ReplicatedState<T>`（`src/types.ts:43-48`）、`MutableReplicatedState<T>`（`src/types.ts:50-56`）；`replicatedState()`（`src/api.ts:88-90`） | 单写者、latest-value 复制。生产者改 tracked `state` 代理 + `publish(context)`，消费者收**完整不可变值** |
| **Remote-service boundary** | `RemoteServiceTransport`（`src/types.ts:184-192`）、`RemoteServiceBinding`（`src/types.ts:202-204`）、`RemoteServiceSource`（`src/types.ts:230-239`）、`createRemoteServiceBinding()`（`src/api.ts:84-86`） | chord **不规定** framing、routing、transport、应用外层 envelope |
| **Delta**（额外） | `src/delta/index.ts`：`track()` / `apply()` / `applyImmutable()` / `encoder()` / `decoder()` | 六动词 op、数组路径、`WireOp` 路径 interning |

### 几条容易读错的语义

**【硬事实】** `setup()` 是**同步声明**：只能 provide/use/observe/replicate/注册回调，**不能**调用服务、读 replicated state、做异步工作，也不能在事后（事件回调、activation 回调里）引入新的服务依赖（`PLANNING.md:114-131`）。异步初始化走 `onActivate`。

**【硬事实】** 依赖是通过 setup 期的 `env.use()` / `env.provide()` 调用**记录**下来的，不是手写 manifest：`PLANNING.md:132` 原文 "Plugin authors do not maintain a parallel `requires`/`provides` manifest."。这也意味着 `use()` 返回的 façade 在装配完成前是**断连的 lazy proxy**（`PLANNING.md:299`： "A local singleton consumer receives a stable lazy facade, not the provider object."）—— 记住这条，§7 会用到。

**【硬事实】** Replicated state 的**显式非目标**（`PLANNING.md:389-396`）：无持久化或重启重建、无事件历史、无 CRDT 多写者、无离线重放、无自动 unchanged-value 抑制、无高频流式传输。每次 publication flush **一个 decoded op batch**；**每个 remote client / state 流拥有独立的 path-codec 状态**（`README.md:37-39`，实现见 `src/services/state-codec.ts` 的 `StateCodecRegistry`）；断连/替换后 replica 变 unready，直到 rehydrate。

**【硬事实】** 六动词 op 的 wire 形式：`r`（整体替换）/ `s`（set）/ `d`（delete）/ `a`（string append）/ `t`（front-truncate）/ `p`（array splice），定义在 `src/delta/index.ts:30-36`（`Op`）与 `:48-60`（`WireOp`）。`WireOp` 只多了两件压缩：`["#", id, path]` 在路径**第二次**出现时定义 id，以及省略路径（复用上一 op 的路径，靠 arity 消歧）。规则写在 `src/delta/README.md:76-141`。

**【硬事实】** chord 的 RPC 边界目前**不对称**：`RemoteServiceTransport`/`RemoteServiceSource` 只覆盖"跨边界调用与订阅服务"，对称 RPC（两个 peer 互相调用）**仍是 planned、未实现**。`PLANNING.md:3` 原文：

> Symmetric RPC and structural generation replacement remain planned. **This is not a stable public API contract yet.**

**【硬事实】** chord 保留了一个 `$chord.*` 保留命名空间：service id 不能以 `$chord.` 开头（`src/api.ts:79-80`），wire 控制调用走 `$chord.service` 这个伪 service（`src/services/wire.ts:39-42`，成员 `catalogue` / `subscribe` / `unsubscribe`）。

## 4. chord 与 Pi 既有 extension 系统的关系：**并存，不是替代**

**【硬事实】** `core/extensions` 那套**完好无损**：`ExtensionAPI`（`packages/coding-agent/src/core/extensions/types.ts:1252`）与 `ExtensionFactory`（同文件 `:1588`）都还在，`packages/coding-agent/examples/extensions/` 本轮零改动（该目录顶层 79 个条目、递归 118 个文件，其中 86 个是 `.ts`/`.js` 源文件——**引用数字时说明口径**）。

**【解释】** 所以 facet/plugin 是**平行的第二套组合机制**，不是 extension 系统 2.0。两者的差别不在功能，而在**代码住在哪个进程里**：

| 维度 | extension 系统 | facet / plugin |
|---|---|---|
| 归属 | `coding-agent/src/core/extensions/`（Pi 自有） | `packages/chord`（应用中立）+ Pi 适配层 |
| 作者形状 | `export default function (pi: ExtensionAPI)` 单个同步工厂 | 一个包多个 entry（`contract.ts`/`session.ts`/`tui.ts`），**运行时不互相链接** |
| 运行位置 | 宿主进程，一份代码 | 按 host 拆 bundle，跑在不同进程/环境 |
| 安装方式 | 落在 `~/.pi/agent/extensions/` 或 `<cwd>/.pi/extensions/`（`core/extensions/loader.ts:777-782`），**由用户在本机放置** | 由宿主应用（server）发现、打包、按 entry 投递 |
| 依赖声明 | 运行时读取 `pi.extensions` 字段 | setup 期调用产生 ledger（见 §3） |
| 显式否定 | — | `packages/agent/docs/plugins.md:57` 原文："Their shared service IDs and wire contracts connect them, **not an aggregate JavaScript object or a `definePlugin()` wrapper.**" |

**【硬事实】** extension 的安装位置可以从源码确认：`core/extensions/loader.ts:777-782` 依次扫描 `<cwd>/.pi/extensions/`（项目本地）与 `<agentDir>/extensions/`（全局，默认 `~/.pi/agent/`）。

## 5. 术语碰撞（**必须先声明，否则一定读错**）

**【硬事实】** 本轮的文档里 "extension" / "扩展" 至少有**三个不同义项**同时存在：

| # | 义项 | 出处 |
|---|---|---|
| 1 | `core/extensions` 的 `ExtensionAPI` 扩展（`export default function (pi)`） | `packages/coding-agent/src/core/extensions/` |
| 2 | **"分发 facet 的包"** —— 一个可独立打包、包含多 host facet 的第三方包 | `packages/agent/docs/plugins.md:17`："An **extension** may distribute independent host-specific bundles containing **facets**." |
| 3 | 泛指"扩展层 / 扩展机制"本身 | 同文档 `:951`："Before the **extension layer** becomes normative"、`packages/coding-agent/docs/rpc.md` 的整体语境 |

**【解释】** 义项 1 与 2 是**同名不同物**，而且形状相反：义项 1 是"一个进程里的一段挂载代码"，义项 2 是"一个跨进程分发的包"。义项 3 只是前两者的口语统称。**任何写"pi 的扩展"的文档都必须先声明用哪个义项** —— 本篇之后一律用 "extension（`core/extensions`）" 与 "plugin 包（facet 分发）" 区分。

## 6. Pi 侧的落地：`experimental/services/`（dev-only，非 supported）

**【硬事实】** chord 的 facet/service 概念在 coding-agent 侧有一份**完整落地**：`packages/coding-agent/src/experimental/services/`（47 个文件的 `experimental/` 目录的一部分）。service token **全带 `pi.` 前缀**：

```
pi.agent-controller        AgentLane 的 presentation-safe 门面        services/agent-controller.ts:54
pi.models                  ReplicatedState                             services/models.ts:35
pi.session-directory       ReplicatedState                            services/sessions.ts:26
pi.session-management      create/remove/attach/detach                services/sessions.ts:35
pi.transcript              ReplicatedState，lane 状态复制            services/transcript.ts:15
pi.presentation-plugins    server 侧，准备并投递 TUI artifact         services/plugins.ts:12
pi.session-plugins         session 侧，重载 facet generation          services/plugins.ts:19
pi.local.slash-commands    {local:true} —— 永不进 RPC catalogue      services/slash-commands.ts:30
pi.local.presentation-ui   {local:true}                              services/presentation-ui.ts:20
```

**【硬事实】** 带 `{local:true}` 的两个只在 presentation 进程本地，**不会出口到 RPC catalogue**（`experimental/services/README.md` 明说 "Presentation-only hookpoints such as `SlashCommands` are explicitly local and never enter an RPC catalogue."）。

**【硬事实】** 唯一入口是 **repo checkout**：`PI_EXPERIMENTAL=1 ./pi-test.sh server|client`（`pi-test.sh` 末行把入口指向 `packages/coding-agent/src/experimental/cli.ts`）；门禁在 `experimental/commands.ts:94`，同时校验 `PI_EXPERIMENTAL=1`（`core/experimental.ts:4` 读的就是这个环境变量）与 `server`/`client` 子命令。**不在 npm 包、也不在 standalone binary 里** —— 发布的 `bin` 是 `dist/bundle/cli.js`（`packages/coding-agent/package.json`），走的是不含 experimental 的 `src/cli.ts`；`files` 还显式排除了 `dist/experimental` 与 `dist/cli/experimental`。

### 一个具体的示例插件

**【硬事实】** `packages/coding-agent/examples/plugins/pi-example-plugin/` 是一个**真的 plugin 包**（`private: true`）：

```
contract.ts   ExampleFacetService = defineService<...>("pi.example-plugin.greeting") + JSON DTO
session.ts    export default defineFacet({ id: ".../session" })  —— provide + onActivate publish
tui.ts        export default defineFacet({ id: ".../tui" })      —— use SlashCommands/AgentController/PresentationUI
```

`session.ts:5-23` 提供 greeting 服务并维护一个 `replicatedState({count})`；`tui.ts:5-31` 用它注册 `/hello` 斜杠命令，命令体里 `await example.greet({name}, context)` 再 `controller.prompt(...)`。注意两个文件**互不 import**，只共享 `contract.ts` 里的 token —— 这正是 §4 表格里"运行时不互相链接"的实物。

### 拓扑反转：代码从服务端流向客户端

**【硬事实】** 这是本篇标题"第四条 authoring 面"最实质的一点。看 `experimental/plugins/package.ts` 与 `experimental/plugins/bundled.ts`：

1. server 侧用 `createServerPluginPackage()`（`plugins/package.ts:69`）调用 chord 的 `bundleFacetPackage()`，把 plugin 包的约定 entry（默认 `src/session.ts` / `src/tui.ts`，`DEFAULT_PLUGIN_FACETS`，`:13`）分别打成独立的 `.cjs`；
2. **server 只留 `session` entry 给自己**，`tui` entry 经 `readFacetBundleArtifact()` 读成 artifact（`plugins/package.ts:88`）；
3. artifact 经 `createPresentationFacetData()`（`plugins/bundled.ts`）塞进 chord 的 `JsonValue`，随 `PresentationPlugins` 服务**发给 client**；
4. client 侧 `createPresentationFacetLoaders()` 只用 server 选中的 artifact 建 loader（`plugins/bundled.ts`，注释原文 "Create local loaders only from artifacts selected and sent by the connected server."）。

**【解释】** 对照 §4 的 extension 系统：那条路的代码是**用户在本机放置**的；这条路是**server 打包、选择、投递，client 只加载收到的**。方向相反，所以"第四条 authoring 面"改的是**谁决定客户端跑什么代码**（是宿主应用，不是终端用户）。这也是为什么它有独立的安全含义 —— 但 chord 自己声明**不做信任策略**（`PLANNING.md:820`："trust policy, code signing, sandboxing, or capability security" 是非目标）。

**【硬事实，重复但重要】** 这条整线**全是 dev-only / source-only / 非 supported**。背景是 v0.85.0 曾把整套 experimental 远程栈误发布进 npm 包、消费者一装就 import 失败（#9132），v0.85.1 用 `devDependencies` + `files` 排除 + `./client`/`./experimental/plugin` 两个 `{"source": ...}` only 的 exports 子路径修复（详见 [`06-coverage-and-parity.md`](06-coverage-and-parity.md) 的"三包是 dev-only"一节）。

## 7. ⚠️ 现状 vs 规格：这一节是本篇的诚实底线

**【硬事实】** `packages/agent/docs/mobile-handoff/README.md:22` 原文：

> **Three units ship working code. Four are specifications. Do not assume a doc describes something that exists.**

**【硬事实】** 那个 README 的状态表把 `02-plugins/01-facets` 标成 **`[SPEC ONLY]`**，把 `01-harness/01-delta` 标成 **`[LANDED IN CHORD]`**。

### 陷阱：`facets.md` 自称取代 `plugins.md`，但它的改动一条都没落地

**【硬事实】** `packages/agent/docs/mobile-handoff/02-plugins/01-facets/facets.md:3` 自称：

> **Status:** Design specification. **Supersedes the facet/service model in `plugins.md` where the two disagree.** Read `rpc.md` for transport framing.

**【硬事实】** 它的核心改动**在 chord 里全部没有实现**：

| `facets.md` 的主张 | chord 的实际状态 |
|---|---|
| 静态 `uses`/`provides`/`observes` manifest（§3，`:113-115`） | **没有**。chord 靠 setup 期的调用产生 ledger（`PLANNING.md:132`） |
| `ServiceMode = "singleton" \| "keyed" \| "peer"`（`facets.md:42`） | chord 只有 `ServiceMode = "singleton" \| "keyed"`（`packages/chord/src/types.ts:60`） |
| `defineKeyedService()` / `definePeerService()`（`facets.md:52-65`） | **不存在**。chord 只有 `defineService()`（`packages/chord/src/api.ts:70-82`） |
| sync `construct` + 返回 provisions 数组（`:122-133`） | **没有**。chord 的 `setup(env)` 不返回值，异步走 `onActivate` |
| "no lazy proxy"（`:136-141` 批评 `plugins.md` 的 lazy façade 是 "an object whose type is a lie"） | **批评被驳回**。chord 明确保留 lazy façade（`PLANNING.md:299`） |
| host entry 名单固定为 `contract.ts`/`server.ts`/`worker.ts`/`tui.ts`（`facets.md:5-11`） | chord 的 entry 名是**不透明应用数据**（`PLANNING.md:486`："Chord does not assume names such as `server`, `session`, `tui`, or `web`"）；Pi 侧约定的是 `session`/`tui` |

**【解释】** **结论**：`plugins.md` 才是被 chord 实际实现的那一份（配合 `rpc.md` 与 `harness.md`）。引用 `facets.md` 时**必须标为规格，不能标为现状** —— 它描述的是**比 chord 更激进的下一步设计**，而且有几处是**明确与 chord 相反的方向**（静态 manifest vs 副作用 ledger、peer mode vs 无、honest types vs lazy proxy）。

### 唯一已确认落地的：delta

**【硬事实】** `facets.md` 自己把 delta 部分排除在外 —— `:540` 原文："`Op` and its encoding — six verbs, array paths, tuple form, second-use path interning — are specified in `delta.md` §2 and §4. **They are not restated here.**"。而 chord 的 `src/delta/index.ts:30-36`（`Op`）与 `:48-60`（`WireOp`）正是六动词 + 数组路径 + interning。`mobile-handoff/README.md` 的状态表也标 `01-delta [LANDED IN CHORD]`。

**【硬事实】** 还有一处**跨文档**的诚实问题值得记：`packages/agent/docs/plugins.md` 与 `packages/agent/docs/rpc.md` 都自称 **"Design specification"**（`plugins.md:7`、`rpc.md:8`）。它们描述的行为**大部分**能在 `experimental/services/` 里找到对应实现（§6），但**不是全部** —— 例如 `plugins.md` 里的 `TuiHost`（`:342-351`）、`AgentFacetScope`（`:300-306`）、question extension、diff review 都被 `experimental/services/README.md` 明确点名为 "extension patterns, **not built-in coding-agent services**"。

### 一个真实的文档碰撞：两份同名 `rpc.md`

**【硬事实】** 仓库里有**两份标题不同的 `rpc.md`**，讨论的是**完全不同的东西**：

| 路径 | 行数 | 标题 | 讲什么 |
|---|---|---|---|
| `packages/coding-agent/docs/rpc.md` | 1618 | **RPC Mode** | JSONL over stdin/stdout，33 个 RPC 命令 —— 这是**真正对外的**集成面 |
| `packages/agent/docs/rpc.md` | 215 | **Facet Service RPC** | chord service 穿越 remote boundary 的语义 —— 是 **spec**（`:8` 自称 "Design specification"） |

**【解释】** 两份文档都叫 "RPC" 但**没有任何关系**：前者是 stdio 上的 JSON 帧协议，后者是"跨进程调用 service 成员"的语义说明。任何链接或引用 `rpc.md` 的地方都必须带路径。这个碰撞本身值得写，因为搜索"pi rpc"的人极可能落在错的那份上。

## 8. 对集成者的意义

**【解释】** 按读者分三类：

**A. 只想把 pi-mono 当 agent 引擎接进自己的产品**（本目录的主体读者）：**这一篇可以只读 §1 与 §7**。你需要知道的只有两点：(1) chord 已经是 `pi-agent-core` 的运行依赖，`Context` 类型从它来，这**不改变**你的 SDK/RPC 用法；(2) §6 那条 dev-only 路径**不要基于它做产品**。

**B. 想给 pi-mono 写插件/扩展**：先判断你要的是哪一套 ——

- 只在自己机器上加能力 → 写 `core/extensions` 的 `ExtensionAPI` 扩展，放进 `~/.pi/agent/extensions/`。这是**当前唯一 supported** 的扩展路径。
- 想让一个包同时给 server / worker / presentation 三处提供代码 → 那是 facet/plugin 模型，**目前只在 repo checkout + `PI_EXPERIMENTAL=1` 下可用**。

**C. 想自己拿 chord 做一套别的应用组合运行时**：`packages/chord` 是**可以独立打包使用**的（`files` 含 `dist` + `README.md` + `src/delta/README.md`，`boundary.test.ts` 保证它不偷 Pi 依赖）。但 `PLANNING.md:3` 已声明 **"This is not a stable public API contract yet."** —— 版本号虽跟 monorepo 走（`0.85.1`），但作者不承认它是稳定公开 API。

**【解释】** 判断规则（沿用本目录的四问法）：

| 问题 | 若答案是 |
|---|---|
| 我要不要跟 server/client 之间传代码？ | 是 → 这条路 dev-only，先别规划 |
| 我只要扩展自己的 agent 行为？ | 用 `core/extensions`，与 chord 无关 |
| 我只是想用 Harness 的 `Context`？ | 你已经在用它了（chord 是运行时依赖），不需要做任何事 |
| 我想引用 `facets.md` 的某个设计？ | 先确认它在 `plugins.md`/chord 源码里有实现，否则标为规格 |

## 9. 源码锚点

chord 本体：

- 定位 / 用法总览：[`packages/chord/README.md`](../../packages/chord/README.md)
- 实现计划与边界（含迁移表、禁用词汇表、退出条件）：[`packages/chord/PLANNING.md`](../../packages/chord/PLANNING.md)
- 边界守卫测试：[`packages/chord/test/boundary.test.ts`](../../packages/chord/test/boundary.test.ts)
- 核心类型（`Facet` `:225`、`FacetEnvironment` `:206`、`ServiceMode` `:60`、`ReplicatedState` `:43`、`RemoteServiceTransport` `:184`）：[`packages/chord/src/types.ts`](../../packages/chord/src/types.ts)
- 根 API（`createFacetHost` `:19`、`defineFacet` `:66`、`defineService` `:70`、`createRemoteServiceBinding` `:84`、`replicatedState` `:88`）：[`packages/chord/src/api.ts`](../../packages/chord/src/api.ts)
- 公开导出面：[`packages/chord/src/index.ts`](../../packages/chord/src/index.ts)
- 跨边界 wire 语法（`$chord.service` 控制调用、snapshot/update 校验、错误码）：[`packages/chord/src/services/wire.ts`](../../packages/chord/src/services/wire.ts)、[`errors.ts`](../../packages/chord/src/services/errors.ts)、[`state-codec.ts`](../../packages/chord/src/services/state-codec.ts)
- delta 原语与指南：[`packages/chord/src/delta/index.ts`](../../packages/chord/src/delta/index.ts)、[`packages/chord/src/delta/README.md`](../../packages/chord/src/delta/README.md)
- facet host 与 loader：[`packages/chord/src/facets/host.ts`](../../packages/chord/src/facets/host.ts)、[`loader.ts`](../../packages/chord/src/facets/loader.ts)
- bundler / Node 加载：[`packages/chord/src/bundler.ts`](../../packages/chord/src/bundler.ts)、[`node.ts`](../../packages/chord/src/node.ts)

Pi 侧：

- 被实现的那份规格：[`packages/agent/docs/plugins.md`](../../packages/agent/docs/plugins.md)（service transport 语义：[`packages/agent/docs/rpc.md`](../../packages/agent/docs/rpc.md)，**注意与 `coding-agent/docs/rpc.md` 同名不同物**）
- **规格、未实现**：[`packages/agent/docs/mobile-handoff/02-plugins/01-facets/facets.md`](../../packages/agent/docs/mobile-handoff/02-plugins/01-facets/facets.md)、状态表 [`mobile-handoff/README.md`](../../packages/agent/docs/mobile-handoff/README.md)
- 落地实现：[`packages/coding-agent/src/experimental/services/`](../../packages/coding-agent/src/experimental/services/)（服务清单见同目录 `README.md`）
- Pi 侧插件 API 与打包/加载适配：[`experimental/plugin.ts`](../../packages/coding-agent/src/experimental/plugin.ts)、[`experimental/plugins/bundled.ts`](../../packages/coding-agent/src/experimental/plugins/bundled.ts)、[`experimental/plugins/package.ts`](../../packages/coding-agent/src/experimental/plugins/package.ts)
- 示例 plugin 包：[`packages/coding-agent/examples/plugins/pi-example-plugin/`](../../packages/coding-agent/examples/plugins/pi-example-plugin/)（`contract.ts` / `session.ts` / `tui.ts`）
- 非实验的 chord 接入点：[`packages/agent/src/harness/context.ts`](../../packages/agent/src/harness/context.ts)（整段 re-export）

## 10. 未取证 / 不确定

**本篇明确没做的事**：

- **没有跑 chord 的测试。** 当前工作树未安装 `@earendil-works/chord`（`node_modules/@earendil-works/` 的符号链接建立于 chord 存在之前），跑 harness 或 chord 测试会直接 `Cannot find package '@earendil-works/chord/context'`。**"chord 测试是否全绿"是未验证的。**
- **测试数量与线索给的数字不一致。** 线索说 "56 个 `it/test`"。实测：`packages/chord/test/` 下顶层 `it(`/`test(` 声明共 **160 个**（`delta.test.ts` 100、`services.test.ts` 18、`facets.test.ts` 14、`facet-loader.test.ts` 9、`service-wire.test.ts` 7、`bundle.test.ts` 5、`context.test.ts` 5、`boundary.test.ts` 1、`json.test.ts` 1；`helpers.ts` 0），另有 `services.test.ts:500` 一个 `test.each` 表（2 行，运行时展开）。`describe(` 24 个。**"存在多少条测试"是硬事实，"通过与否"未知。**

**没核实的 / 存疑的**：

- **chord 的 CI 接线状态未逐条核对。** `scripts/check-entry-graphs.mjs:22` 把 `@earendil-works/chord` 登记进了 `WORKSPACE` 映射（用于跨包解析 import），但 `BUDGETS` 表里**没有 chord 的条目** —— 也就是说 chord 的 entry 目前不受"入口即成本契约"预算约束。这是有意还是遗漏，**未取证**。
- **`PLANNING.md:580-618` 的规划目录树多数不存在**（它列了 `src/errors.ts`、`rpc/`、`plugins/` 等；实际布局是 `facets/` + `services/` + `delta/` + `node/`）。同节 `:578` 自己声明该布局 "is a planning aid, not a requirement to create all files immediately"。**不要把 PLANNING 的目录树当现状。**
- **`PLANNING.md` 不被发布。** `packages/chord/package.json:37-41` 的 `files` 只含 `dist`、`README.md`、`src/delta/README.md` —— **PLANNING.md 不在 npm tarball 里**。所以关于"chord 不是稳定 API"的这句免责声明，外部消费者**看不到**。
- **"mobile" 指什么：不确定。** 修正一条更早的口径：**"mobile 全仓零命中"是不准确的**。实际命中分布是 —— `packages/*/src` 里只有 `coding-agent/src/core/export-html/template.{css,js}` 的响应式布局代码（与 facet 无关，5 处）；其余全在文档：`mobile-handoff/**`、`agent/docs/post-wp05-roadmap.md`、`agent/docs/work-packages/05-direct-durable-drive.md:524`（"## 13. Mobile assistant-output handoff"）、`agent/docs/harness.md`（4 处，均指向同一个 handoff）、`coding-agent/docs/sdk.md:8`（"Build a custom UI (web, desktop, mobile)"）。**没有任何 mobile 产品、包或服务**；这个词在 harness 语境里是 "mobile assistant-output handoff" 这个工作项名。只能写"它自称 design handoff，面向跨进程/远端 presentation 场景"。**不要断言存在移动端产品。**
- **`experimental/mini/` 与 chord 的 `defineService` 是两套不同的东西**（`mini/shared/protocol.ts` 有它自己的 `defineService`），`mini/README.md` 自称 "six frame kinds" 而代码里的 `Frame` union 有七项 —— **以代码为准**。mini 与 `experimental/services/` 那套 chord 栈是**并列**关系，不是其上层。详见 [`06-coverage-and-parity.md`](06-coverage-and-parity.md)。
- **chord 是否会被 Pi 之外的第三方采用：无法验证。** `README.md:6-7` 说"can be used by unrelated applications"，`boundary.test.ts` 保证了这个**技术前提**，但仓库里没有任何第三方消费者。
- **chord 无 CHANGELOG、无版本协商。** `PLANNING.md:476` 要求"version negotiation can be a peer handshake or an adapter-guaranteed constructor parameter"，但 chord 侧**没有** `PROTOCOL_VERSION` 之类的版本常量（协议版本 8 在 `packages/protocol/src/protocol.ts:5`，属于 Pi，不属于 chord）。这与 §3 的"对称 RPC 仍未实现"一致。
- **`plugins.md` / `rpc.md` 里哪些是现状、哪些是规格，本篇只抽查了少数几项**（§7 末）。要做全量对照需要逐符号核对 `experimental/services/`，本轮未做。
