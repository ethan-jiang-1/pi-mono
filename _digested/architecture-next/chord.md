# chord：应用组合运行时（standalone，非 Pi 包）

## 它解决什么问题

一个应用 feature（一组服务 + 一块 UI + 一份共享状态）需要同时跑在多个环境里——agent worker 进程、TUI 终端、远程 WebUI。每个环境一份手写胶水会漂移；chord 把"怎么组合"做成通用机器。

**与 Pi 的关系（硬事实）**：README 开篇即声明——standalone，在 Pi monorepo 中开发但**不是 Pi 包**：不依赖任何 Pi workspace 包，可被无关应用使用。依赖方向单向：Pi（durable、server、coding-agent experimental）消费 chord，chord 不感知 Pi。

## 核心机制（硬事实）

### Plugins / facets

plugin 是同步 setup 单元，声明 provide/require 的服务；host 校验整个依赖图，provider 先于 consumer 激活，按反向依赖顺序 dispose。一个 plugin 拆成多个 **facet**，各自 bundle 后加载进目标进程/环境。

- 组合 API：`createFacetHost` / `defineFacet` / `combineFacetLoaders` / `createStaticFacetLoader`（`packages/chord/src/api.ts:14-53`）。
- **零停机 reload**：`FacetHost.reload()`（`src/facets/host.ts:423`）在服务 shape 不变时先验证候选 facet、成功后原地切换（cutover）、失败即丢弃候选——singleton 被替换、consumer 持有的 service handle 不断连、无不可用窗口。

### Services

typed token，singleton（单 provider）或 keyed（动态实例）。可 process-local（任意 JS 契约）或 remotely exposable；consumer 持稳定 facade，provider 断连/替换不失效。`defineService`（`api.ts:70`）拒绝 `$chord.` 前缀——那是 wire 控制调用的保留命名空间（`src/services/wire.ts:39`）。

### Replicated state

producer 对 tracked `state` proxy 做修改后 `publish(context)`；consumer 收到完整不可变值。每次 publish 只 flush 一个 decoded op batch；**每个 client/state 流持独立 path-codec 字典**；断连/替换后 replica unready 直至 rehydrate。`replicatedState()`（`api.ts:88`）。

### JSON delta（`@earendil-works/chord/delta`）

对 tracked plain JSON 记录并合并操作：`track`（`src/delta/index.ts:303`）、`apply`（`:1619`）、`applyImmutable`（`:1695`）。保留常见 string/array 操作（纯 append、滚动窗口 front-truncate），支持 durable base batch，应用不可信操作时校验。批次保证**收敛**但不保证最小/规范；首个 flush 恒为完整 base batch。独立指南：`packages/chord/src/delta/README.md`。

### Remote service wire

transport 无关的服务 wire 语法（strict JSON in/out），**不规定 framing/routing/transport/外层 envelope**；`JsonRepresentation<T>`/`isJsonValue()` 管边界校验。对称 RPC 是计划中的可选实现（PLANNING.md §9 有设计，src 未实现）。

### Bundler / Node 加载

`@earendil-works/chord/bundler` 用 esbuild 产出 content-addressed `.cjs` + `chord-facets.json` manifest（peer deps externalize；**从不安装依赖或跑 lifecycle scripts**）。`@earendil-works/chord/node` 的 `createFacetBundleLoader` 用 SHA-256 校验 + `node:vm` 编译，绕开 Node 模块缓存；跨主机传输用 `readFacetBundleArtifact()`/`createFacetBundleArtifactLoader()`。

## 为什么值得记（解释）

Pi 的 experimental client/server 用它把"多进程 + 多环境 feature"从每处手写变成声明式：服务图由 host 校验、replicated state 让 TUI 与 worker 共享 transcript 而不用手写同步、`reload()` 让 `/reload` 成为原子 cutover。详见 [server-and-experimental-services.md](./server-and-experimental-services.md)。另外它是 standalone 包——如果你在读 Pi 源码时遇到它，不要按"Pi 的子模块"理解，它对 Pi 零依赖。

## 锚点

- `packages/chord/README.md`（205 行，场景与边界）
- `packages/chord/src/api.ts`：组合 API（L14-53）、`defineService`（L70，`$chord.` 拒绝在 L80）、`replicatedState`（L88）
- `packages/chord/src/facets/host.ts:423`：`FacetHost.reload()`
- `packages/chord/src/delta/index.ts`：`track`（L303）、`apply`（L1619）
- `packages/chord/src/services/wire.ts:39`：`$chord.service` 控制调用 id
- 状态：experimental，CHANGELOG 缺失，变更只看 git log
