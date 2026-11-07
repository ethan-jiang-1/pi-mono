# chord v2：experimental 的第二运行时（v1.5.0）

> **本页基线：v1.5.0（`f9a263655`）。** 本页在 v1.5.0 新建。v1.5.0 之前 chord v2 只存在于 `src/next/`，**没有 package export**（v1.4.0 的 CHANGELOG 明写"experimental and not exported yet"）。v1.5.0 起 `@earendil-works/chord/next` 首次成为正式入口，标注 experimental。
>
> **先读这一句**：chord 在 v1.5.0 之后是**双运行时并存**——现役的是 `@earendil-works/chord`（v1，见 [chord.md](./chord.md)），v2 是并列的第二套，不是它的升级。两者共享 `Context`/`JsonValue`/`Draft`/watch 类型这些底座，但对象模型、host 契约、存储与插件模型都是重写的。

## 为什么它值得单独一页

| 维度 | v1（现役） | v2（`./next`） |
|---|---|---|
| 入口 | `@earendil-works/chord` 及 `./node`、`./context`、`./delta`、`./output`、`./sqlite*`、`./telemetry-sqlite` | `@earendil-works/chord/next`（另有即将导出的 `./next/plugins`、`./next/http`、`./next/workers`） |
| 模块规模 | — | `src/next` **146** 个 `.ts`（10 个子目录 + 根部 `index.ts`），`src/next-node` **29** 个 |
| 设计依据 | `docs/{guide,spec,tutorial}.md` | `docs/next/` **33 篇** |
| 可运行示例 | — | `test/next/examples/` **46** 个编号示例（32 个单文件 `.ts` + 14 个目录；目录内共 **101** 个 `.ts`，含 fixture 与共享 helper） |
| 稳定性 | 现役，按 semver 记录变更 | **experimental**：每个 slice 都会改 API |

## 三份文档的分工（不要只读 design.md）

`packages/chord/docs/next/`：

| 文件 | 行数 | 回答什么 |
|---|---|---|
| `design.md` | **2,554** | **是什么**：对象模型、数据、文档、host、job、link、store 的形状与不变量 |
| `decisions.md` | **2,957** | **为什么不是另一种做法**：决策日志，逐条记录被否掉的方案与理由 |
| `slices.md` | **230** | **怎么分步建**：垂直 slice 计划 + 每个 slice 的 carry-over |

**这三份要并读。** 只引 `design.md` 会写出"这是唯一做法"的错误印象——`decisions.md` 里大量条目是"考虑过 X，因为 Y 没选"。`slices.md` 的每个 slice 还有 "Carry-over" 段，`AGENTS.md` 规定"留给后续 slice 的工作必须写进该段，且随同一 change 落地"。

## 模块地图

`packages/chord/src/next/`（146 个 `.ts`：10 个子目录 + 根部 `index.ts`）：

| 目录 | 文件 | 职责 |
|---|---|---|
| `store/` | 34 | 持久化：commit、id 分配、document history、batch apply |
| `host/` | 31 | host 与对象生命周期、facet 装载、路由、root scope |
| `documents/` | 13 | 文档引擎：读写在 commit 内的形状 |
| `contracts/` | 13 | 契约声明与校验（建在 `@earendil-works/pi-schema` 上） |
| `link/` | 12 | 帧、流控、origin、relay |
| `jobs/` | 10 | 可持久化 job（`persist: { resume }`、存储化的 `abort`） |
| `remote/` | 10 | 跨 host 引用与 binding |
| `data/` | 8 | JSON 值、draft、增量 |
| `registries/` | 7 | 注册表（插件间共享值） |
| `state/` | 7 | 可观察状态单元 |
| （根） | 1 | `index.ts`——`./next` 的导出面 |

`packages/chord/src/next-node/`（29 个 `.ts`）：`http/` 13、`plugins/` 9、`workers/` 6、根部 `compression.ts` 1。

## 五个新能力面

### 1. plugins（slice 7c）

`src/next-node/plugins`，计划导出为 `@earendil-works/chord/next/plugins`。

- 发现插件目录，**用 esbuild 构建**每个 facet，**用 `vm.Script` 求值**，映射插件栈（`mapStack`），安装插件依赖，监视插件与基础代码，并把 reload 按 host 成批推出。
- `host.load` / `host.reload` **按插件粒度**工作：setup / factory / 声明失败的插件在 `load` 时被排除（返回 `{ failed }`），在 `reload` 时保留旧代码（报告里的 `failed`，`reload(facets, ctx, { failed })`）；闭包规则保证"provider 被保留旧代码时，其 consumer 也保持旧代码"。
- reload 提交后再 abort，reject 带 `details.committed`。
- 组件定义"每种 facet 一个 definition"（`kinds: { name: { platform, hostPackages } }`），并把加载拆成 `createPluginRuntime()`（不引 esbuild）与 `scripts(kind)`。
- **跨插件按名导入**：`@app/notes/contract`。

### 2. registries（slice 8）

- `defineRegistry<C, V>(name, { version })` 产生由插件共享的 token；由定义它的插件的 facet 用 `host.serve(R, { compose, accepts? })` 提供。
- 贡献来自 facet（`defineFacet((host, self) => self.contribute(R, value))`）与 host 生命周期对象（`StoreSelf.contribute`），按插件名排序、惰性组合。
- 读取：`self.registry(R)`（**声明式依赖**：有值后才激活；无人提供时以新 reason `unavailable/undeclared` 失败）、`host.registry(R, ctx)` 返回 `RegistryValue<V>`（带 `observe`）。
- 旧贡献者/读者靠 `accepts` 适配；辅助 `keyedEntries` / `orderedEntries`。
- 新增 `onError` 种类：`registry_conflict`、`registry_failed`、`contribution_failed`、`contribution_refused`。
- 配套 `self.writable(initial)`、`self.retryOn(...sources)`（注册表值变化时重试失败对象）、`host.root(fn, context, { principal? })`。

### 3. HTTP（slice 10）

`src/next-node/http`，计划导出为 `@earendil-works/chord/next/http`。

- 从路由/包装/socket/host/relay/CSP 源构建**Web 标准 `fetch` handler**（`Request` → `Response`）。
- 响应即描述：`json`、`html`、`bytes`（支持 ranges）、`redirect`、`error`、`fileResponse`。
- **默认开启的安全基线**：按 socket + `Host` 判定来源、外部请求匿名、`Origin` 校验、默认响应头带 per-response CSP nonce、签 cookies、安全下载。
- chord 自己的 Node listener 是一个 host 生命周期对象；`nodeRequest` 供应用挂到自有 Node server；links endpoint 与插件 socket 带心跳，贡献离开时立刻关闭。

### 4. workers（slice 10）

`src/next-node/workers`：`createWorkers` / `workerMain`。

- 按 host kind 的地址 fork 一个 worker，**按需启动**、空闲停止、**不会自动重启**（失败会一直停留到 `retry` 或 rollout），其插件由 server 构建并下发。

### 5. store

- `ChordStore.commitSeries(commits, receive, ctx)`：一次后端事务里多个 commit，各自 seq 与 outbox 行，store 元数据只写一次。每个 commit 的检查看到它之前的 commit；检查抛错只拒该 commit 并保留其前的，语句/写入失败则整批回滚，`COMMIT` 失败则 store 停机。**取代 `commitInBatch`**。Durable 的 `StoreStorage` 用它承载每次 Session commit。
- 单一 id 分配器；按表与按文档 namespace 的 claim；document history 三档 `none` / `latest` / `rewindable`（带按点读取）；archive 携带 document revision；batch apply。

## 依赖面

`packages/chord/package.json` 在 v1.5.0：

```json
"dependencies": {
  "@earendil-works/pi-schema": "1.5.0",
  "@earendil-works/pi-telemetry": "1.5.0"
},
"peerDependencies": { "esbuild": "0.28.2", "ws": "8.21.0" },
"peerDependenciesMeta": {
  "esbuild": { "optional": true },
  "ws": { "optional": true }
}
```

**`esbuild` 与 `ws` 都是 optional peer，只在对应子路径里按需 import**（esbuild 只在 plugins，ws 只在 HTTP/socket）。所以"chord 引了 esbuild"不等于"chord 变重了"——不装它们就用不了那两个子路径，其余照常。

## 怎么读它

1. 先读 [chord.md](./chord.md) 建立**现役运行时**的心智模型（对象/引用/lifetime/principal/placement/replicated state）。
2. 再读本页的模块地图与五个面，确定你要的那一层在哪个目录。
3. 需要精确语义时回源码：`docs/next/design.md` 定形状，`decisions.md` 定取舍，`slices.md` 定边界与 carry-over。
4. 需要可运行的样子时看 `test/next/examples/`——**46 个编号示例**（`01-objects.ts` … `48-http-baseline`，编号非连续），其中 32 个是单文件 `.ts`、14 个是目录（目录里除入口外还有 fixture 与共享 helper，递归共 101 个 `.ts`）。格式与 durable 的 `test/examples/` 一致（头部写明演示什么与怎么跑，步骤有注释，结果打印）。

## 不要误解

- **v2 不是 v1 的下一版**：没有"迁移路径"这回事，两者并行存在。
- **v2 的 API 每个 slice 都会变**：在它拿到稳定入口并脱离 experimental 之前，任何"v2 就是这样"的说法都有保质期。
- **`./next` 的导出不覆盖全部面**：`plugins` / `http` / `workers` 计划以独立子路径导出（`next-node` 侧），不要假设 `./next` 一把全给。
