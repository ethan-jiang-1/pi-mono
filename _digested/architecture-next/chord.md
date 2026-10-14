# chord：应用组合运行时（standalone，非 Pi 包）

> **本页基线：v1.2.0（`06a466935`）。** chord 在本区间经历 **chord2 重写**（`0104fef1e` — *replace the facet and service runtime with the chord2 host runtime*，85 文件，+14,743/−8,921）。旧 facet/service 运行时（`src/facets/`、`src/services/`、`src/api.ts`）与 `PLANNING.md` 全部删除，换成 `src/host.ts` 的 typed host runtime。
>
> **读法**：本页「核心机制」中 **§ JSON delta 仍然成立**（该模块文件级存续）；**§Plugins/facets、§Services、§Replicated state 的多数 API 名与锚点已失效**，§Bundler、§Remote service wire 的 `./bundler` 子路径与 `PLANNING.md` 引用也已失效。凡失效处已就地标注。

## 它解决什么问题

一个应用 feature（一组服务 + 一块 UI + 一份共享状态）需要同时跑在多个环境里。每个环境一份手写胶水会漂移；chord 把"怎么组合"做成通用机器。

**与 Pi 的关系（硬事实）**：standalone，在 Pi monorepo 中开发但**不是 Pi 包**——运行时只依赖自身 `delta` 模块、Node/浏览器内建与 `typebox`（`docs/spec.md:5-9` 硬约束节），不依赖任何其它 Pi workspace 包。依赖方向单向：v1.2.0 的消费者只有 `packages/durable` 与 `packages/env`；**`packages/coding-agent` 不再依赖 chord**（v1.0.3 时依赖，随 experimental server 栈删除，见 `7472cda0d`）。

## 核心机制

### Contracts 与 typed host（v1.2.0 新形状）

chord2 的概念表（`docs/spec.md` §1）：**type**（名字 + 契约，分 `remote`/`local`）→ **factory**（`(input, principal, self) => behavior`，同步）→ **record**（按 `(type, canonicalInput, principalKey)` 稳定标识，持 cells/resources/holds/listeners/tasks，**跨 reload 存活**）→ **behavior**（factory 返回值，per-epoch 不可变）→ **handle**（`get` 的返回值，late-bound）→ **hold**（handle 的占用，有 hold 则 record 存活）→ **principal**（应用定义，由 link 盖章）。

- 服务/契约注册：`host.serve(type, factory, options)`，由 plugin facet 调用（`docs/spec.md` §1）。
- **§Plugins/facets（失效）**：旧的 `createFacetHost`（原引 `src/api.ts:22-30`）、`defineFacet`、`createStaticFacetLoader`、`combineFacetLoaders` 与 `src/api.ts` 本身**均已删除**。plugin loader 现在用动态 `import()` + cache-busting query（`docs/spec.md:7` 自述为 owner-approved 例外，并留 `TODO(loader)`：需换成隔离/可驱逐的 loader，旧模块副本会泄漏）。
- **零停机 reload（语义保留，锚点失效）**：hot reload 仍是硬要求（`docs/spec.md:8`）；host restart 只用于 chord/runtime 自身代码变更或 host 级崩溃恢复。实现移到 `src/reload.ts`——原引 `src/facets/host.ts:423` 的 `FacetHost.reload()` **已不存在**。
- **§Services（失效）**：`defineService`（原引 `api.ts:73-85`）、`$chord.` 保留前缀（原引 `src/services/wire.ts:40`）、process-local / remotely-exposable 的 service token 模型，均属 facet 运行时，已删除；`src/services/` 目录不存在。

### Replicated state（概念保留，API 名失效）

旧契约「对 tracked `state` proxy 修改后 `publish(context)`」自 v1.0.0 起已替换为**事务性**接口；chord2 保留了事务性与挂载式两种形态，但**承载它们的模块路径已变**：

- `change(context, mutate)`：同步 copy-on-write draft 修改，回调返回后 draft 失效；写入 draft 的值按值拷贝，赋 `undefined` 删属性。
- `replace(context, value)`：整体接管一份 alias-free strict-JSON 快照（调用方此后不得改动该根）。
- 消费侧：consumer 收到完整不可变值；每次 flush 一个 decoded op batch；**每个 client/state 流持独立 path-codec 字典**；断连/替换后 replica unready 直至 rehydrate。
- **锚点失效**：原引 `src/types.ts:59-71`（`MutableReplicatedState`）与 `src/services/state.ts:184/202/231`（实现）**均已删除**。`src/state.ts` 是 chord2 的新位置；精确 API 以 `docs/spec.md` §2「Contracts」与 `src/contract.ts`/`src/record.ts` 为准。

### JSON delta（本区间未重写，仍成立）

delta 引擎三合一系列（`10d1ad621` → `9a139c62b` → `d5cba1d97`）后只剩一个实现：v0.86.x 的可变 tracker 与 astra/cow 原型（约 3.5k 行）全部删除，唯一实现是不可变 tracker。`src/delta/` 的七个文件（`tracker.ts`、`index.ts`、`diff.ts`、`draft.ts`、`apply-immutable-trusted.ts`、`revision-validator.ts`、`README.md`）在 v1.2.0 **全部存续**，本页原有行号锚点大概率仍然有效：

- `apply` 可变应用；`applyImmutable` 与 `applyImmutableBatches` 应用不可信批次并校验；`apply-immutable-trusted.ts` 提供信任路径。
- `diffRevisions(before, after)`（`src/delta/diff.ts`）与 `Draft` 类型（`src/delta/draft.ts`）——后者是 `change()` 事务 draft 的类型基础。
- 批次保证**收敛**但不保证最小/规范；首个 flush 恒为完整 base batch。独立指南 `packages/chord/src/delta/README.md`。

### §Remote service wire（失效）

原页描述的"transport 无关的服务 wire 语法、`JsonRepresentation<T>`、`InvalidJsonPart` 对 readonly JSON 结构直接判可赋值"属 facet 运行时。chord2 的对应面是 `src/wire.ts` + `src/link.ts` + `src/json.ts` + `src/remote.ts`（link/RPC over JSON links，`docs/spec.md` §9「Hosts and links」）。原引 `src/types.ts:134-150` 锚点已失效。原页"对称 RPC 仍是计划中的可选实现，`PLANNING.md` 有设计"——**`PLANNING.md` 已删除**，该设计文档不存在。

### §Bundler / Node 加载（部分失效）

- **`@earendil-works/chord/bundler` 子路径已删除**。v1.2.0 的 exports 只有 `.`、`./context`、`./delta`、`./node`、`./package.json`；`esbuild` 依赖已从 `package.json` 移除（只剩 `typebox`）。原页描述的 content-addressed `.cjs` + `chord-facets.json` manifest 打包链随 facet 运行时一并消失。
- **`@earendil-works/chord/node` 仍存在**（`src/node.ts`），但原引的 `createFacetBundleLoader`、`readFacetBundleArtifact()`、`createFacetBundleArtifactLoader()` 是 facet 时代的 API，需按 `docs/spec.md` §10「Host manager (library)」重新核对——那里描述的是 `createHostManager({ driver, keepAlive })`：fork driver（entry/init/lock/env）、串行化 start/stop/replace、exit-before-replace、grace 后 process-tree kill、control channel（ready/fatal/shutdown）、liveness callback。

## 为什么值得记

chord 是 Pi monorepo 里**唯一非 Pi 的通用运行时包**：它是"把多环境 feature 组合成声明式"的独立方案，不是 Pi 的子模块。v1.2.0 后 Pi 内部对它的依赖收窄到 durable 与 env 两个包。

**v1.2.0 的变化值得单独记**：chord 此前**全程没有 CHANGELOG**，replicated state / delta 的破坏性改形零记录——v1.2.0 **首次加入 `CHANGELOG.md`**，chord2 重写有了正式记录。同时新增 `docs/{guide,spec,tutorial}.md`，规格开头即声明「文档与代码不一致时，以不一致为 bug」，第 12 节列出运行时尚未做到的事与留待决定的取舍。

如果你在读 Pi 源码时遇到 chord，注意两点：(1) 不要按"Pi 的子模块"理解，它对 Pi 零依赖；(2) v1.0.3 时代的 facet/service 代码与文档**不兼容** chord2，迁移不是改 import 路径。

## 锚点

- `packages/chord/package.json`（v1.2.0 的 exports 与唯一依赖 `typebox`）
- `packages/chord/CHANGELOG.md`（**v1.2.0 新增**）
- `packages/chord/docs/spec.md`（§1 概念表、§2 Contracts、§5 Lifetime、§7 Reload、§9 Hosts and links、§10 Host manager、§11 Test coverage、§12 Known limitations；`:5-9` 硬约束）
- `packages/chord/docs/guide.md`、`docs/tutorial.md`
- `packages/chord/src/host.ts`（chord2 typed host runtime 主体，1010 行）
- `packages/chord/src/delta/`（**唯一在本区间未经重写的模块**，见上）
- `packages/chord/README.md`（147 行；v1.0.3 时为 264 行）
- 删除提交：`0104fef1e`（chord2 重写）、`7472cda0d`（experimental server 栈，coding-agent 随之不再依赖 chord）
- 状态：experimental。**本页 §JSON delta 仍为 v1.2.0 事实；其余各节标注失效处请以 `docs/spec.md` 与 `src/` 为准。**
