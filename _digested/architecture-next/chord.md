# chord：应用组合运行时（standalone，非 Pi 包）

## 它解决什么问题

一个应用 feature（一组服务 + 一块 UI + 一份共享状态）需要同时跑在多个环境里——agent worker 进程、TUI 终端、远程 WebUI。每个环境一份手写胶水会漂移；chord 把"怎么组合"做成通用机器。

**与 Pi 的关系（硬事实）**：README 开篇即声明——standalone，在 Pi monorepo 中开发但**不是 Pi 包**：不依赖任何 Pi workspace 包，可被无关应用使用。依赖方向单向：Pi（durable、server、coding-agent experimental）消费 chord，chord 不感知 Pi。

## 核心机制（硬事实）

### Plugins / facets

plugin 是同步 setup 单元，声明 provide/require 的服务；host 校验整个依赖图，provider 先于 consumer 激活，按反向依赖顺序 dispose。一个 plugin 拆成多个 **facet**，各自 bundle 后加载进目标进程/环境。

- 组合 API：`createFacetHost`（`packages/chord/src/api.ts:22-30`）/ `defineFacet`（`api.ts:69-71`）/ `createStaticFacetLoader`（`api.ts:32-39`）/ `combineFacetLoaders`（`api.ts:41-67`）。
- **零停机 reload**：`FacetHost.reload()`（`src/facets/host.ts:423`）在服务 shape 不变时先验证候选 facet、成功后原地切换（cutover）、失败即丢弃候选——singleton 被替换、consumer 持有的 service handle 不断连、无不可用窗口。

### Services

typed token，singleton（单 provider）或 keyed（动态实例）。可 process-local（任意 JS 契约）或 remotely exposable；consumer 持稳定 facade，provider 断连/替换不失效。`defineService`（`api.ts:73-85`）拒绝 `$chord.` 前缀——那是 wire 控制调用的保留命名空间（`src/services/wire.ts:40`）。

### Replicated state（v1.0.0 事务性改形）

v0.86.x 的"对 tracked `state` proxy 修改后 `publish(context)`"契约已删除，替换为**事务性**接口（`MutableReplicatedState`，`src/types.ts:59-71`；实现在 `src/services/state.ts:184,202,231`）：

- `change(context, mutate)`：同步 copy-on-write draft 修改，回调返回后 draft 失效；写入 draft 的值按值拷贝，赋 `undefined` 删属性。
- `replace(context, value)`：整体接管一份 alias-free strict-JSON 快照（调用方此后不得改动该根）。
- 消费侧不变：consumer 收到完整不可变值；每次 flush 一个 decoded op batch；**每个 client/state 流持独立 path-codec 字典**；断连/替换后 replica unready 直至 rehydrate。

**`replicatedState()` 重载分化**（`src/api.ts:91-106`）：入参为 `ReplicatedStateSource` 时返回 `AttachedReplicatedState<T>`——挂载式、publication-only、`dispose()` 释放（类型 `src/types.ts:105-119`，source/attachment/frame 契约 `types.ts:74-112`：`attach()` 同步原子快照、attachment 单一 listener 顺序排水缓冲帧）；入参为对象时保留原 `MutableReplicatedState`。durable 的 `ConversationView`/task graph 已按 source 方式挂载。

**`subscribe()` 异步 + 溢出语义**（`src/types.ts:49-57`）：listener 可为异步，每订阅串行化回调、先 hydrate 再推送 update；最多 100 个交付排队，溢出仅保留最新 pending（value/context/delivery），**更新序列可能跳过**；单个回调失败被隔离，交付继续；unsubscribe 丢弃 pending 而不中止/等待在跑的回调。

### JSON delta（`@earendil-works/chord/delta`，v1.0.0 收敛为唯一不可变 tracker）

delta 引擎三合一系列（10d1ad621 → 9a139c62b → d5cba1d97）后只剩一个实现：v0.86.x 的可变 tracker 与 astra/cow 原型（约 3.5k 行）全部删除，唯一实现是不可变 tracker（`src/delta/tracker.ts`，2,205 行；`Tracker` 接口 `:135`，`track(initial)` `:321`，不再接受 `TrackerOptions`）。入口 `src/delta/index.ts` 从 1,879 行缩到 694 行，re-export `Tracker/track`（`index.ts:116`）。要点：

- `apply`（`index.ts:326`）可变应用；`applyImmutable`（`:409`）与 `applyImmutableBatches`（`:419`）应用不可信批次并校验；`apply-immutable-trusted.ts` 提供信任路径。
- 新增 `diffRevisions(before, after)`（`src/delta/diff.ts:513`）与 `Draft` 类型（`src/delta/draft.ts:1`）——后者是 `change()` 事务 draft 的类型基础。
- 保留常见 string/array 操作（纯 append、滚动窗口 front-truncate），支持 durable base batch；批次保证**收敛**但不保证最小/规范；首个 flush 恒为完整 base batch。独立指南：`packages/chord/src/delta/README.md`（191 行，重写过）。

### Remote service wire

transport 无关的服务 wire 语法（strict JSON in/out），**不规定 framing/routing/transport/外层 envelope**；`JsonRepresentation<T>`/`isJsonValue()` 管边界校验；`InvalidJsonPart` 对 readonly JSON 结构直接判可赋值而非递归展开（`src/types.ts:134-150`）——否则 pi-ai 这类递归 JSON 类型会让类型栈爆掉。对称 RPC 仍是计划中的可选实现（PLANNING.md 有设计，src 未实现）。

### Bundler / Node 加载

`@earendil-works/chord/bundler` 用 esbuild 产出 content-addressed `.cjs` + `chord-facets.json` manifest（peer deps externalize；**从不安装依赖或跑 lifecycle scripts**）。`@earendil-works/chord/node` 的 `createFacetBundleLoader` 用 SHA-256 校验 + `node:vm` 编译，绕开 Node 模块缓存；跨主机传输用 `readFacetBundleArtifact()`/`createFacetBundleArtifactLoader()`。

## 为什么值得记（解释）

Pi 的 experimental client/server 用它把"多进程 + 多环境 feature"从每处手写变成声明式：服务图由 host 校验、replicated state 让 TUI 与 worker 共享 transcript 而不用手写同步（worker 侧 provider 现在就是 durable Harness 本身——每个 commit 精确产出操作，worker 里没有自己的 reducer）、`reload()` 让 `/reload` 成为原子 cutover。详见 [server-and-experimental-services.md](./server-and-experimental-services.md)。另外它是 standalone 包——如果你在读 Pi 源码时遇到它，不要按"Pi 的子模块"理解，它对 Pi 零依赖。

## 锚点

- `packages/chord/README.md`（264 行，场景与边界）
- `packages/chord/src/api.ts`：`createFacetHost`（L22-30）、`defineService`（L73-85，`$chord.` 拒绝在 L83）、`replicatedState` 重载（L91-106）
- `packages/chord/src/types.ts:59-71`（`change/replace`）、`:49-57`（subscribe 异步 + 溢出）、`:105-119`（`ReplicatedStateSource`/`AttachedReplicatedState`）、`:134-150`（readonly JSON 契约）
- `packages/chord/src/services/state.ts:184/202/231`：`MutableReplicatedStateImpl` 及其 `change`/`replace`
- `packages/chord/src/facets/host.ts:423`：`FacetHost.reload()`
- `packages/chord/src/delta/tracker.ts:135/321`（`Tracker`/`track`）；`delta/index.ts:326/409/419`（`apply`/`applyImmutable`/`applyImmutableBatches`）、`:116`（re-export）
- `packages/chord/src/delta/diff.ts:513`：`diffRevisions`
- `packages/chord/src/services/wire.ts:40`：`$chord.service` 控制调用 id
- 状态：experimental，**仍无 CHANGELOG 文件**，v1.0.0 的 replicated state/delta 破坏性改形零记录，变更只看 git log（关键节点：`10d1ad621` 事务性 state → `9a139c62b` 收敛 immutable tracking → `d5cba1d97` tracker 定为唯一实现 → `35180b9df` document states → `48dd1e2f0` readonly JSON 契约）
