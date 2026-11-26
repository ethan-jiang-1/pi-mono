# chord：应用组合运行时（v2，唯一运行时）

> **v1.5.1 起本页只有一个主角**：`@earendil-works/chord` 的根 export 就是 **chord v2**。v1（cell/cluster/connection 那套 API）在同一 release 内两步走——先整体移到 `@earendil-works/chord/old`，随即连 `src/old`/`test/old`/`docs/old` 一起删除；仍跑 v1 的 app 只能 pin `@earendil-works/chord@1.5.0`（npm 上 v1 的最后一版）。**没有迁移路径**。
>
> 因此：旧版本页写的"现役 v1"（协议 4、placement `hostNamed`/`hostFamily`、async get、cell/linger、`PROTOCOL_VERSION = 4`）描述的是**已删除的代码**，全部作废；chord-v2.md（已删除）的"双运行时并存"分界同样作废，其"三份文档并读"与模块地图已并入本页。变更史：[_change_log/0012](../_change_log/0012-v1.5.0-to-v1.5.1.md)（v2 转正 + slices 9–13）、[0014](../_change_log/0014-v1.5.2-to-v1.6.0.md)（slice 14：named queries/admission）、[0015](../_change_log/0015-v1.6.0-to-v1.6.1.md)（tagged-union 扫荡）。
>
> **依赖关系（硬事实）**：chord 依赖 **`@earendil-works/pi-schema` + `@earendil-works/pi-telemetry`**（均 pin `1.6.1`）；**optional peer** 三个——`esbuild ^0.28.2`（`/plugins`、`/surfaces`、`/workers`）、`ws ^8.21.0`（`/http`、`/tui/launcher`）、`react ^19.3.0`（`/react`），只在对应子路径按需 import（`/app` 用到除 react 外全部）。peer 从精确版本改 ranges 是 1.6.0 的修复（#12008）。消费者四个：`packages/durable`、`packages/env`、`apps/p2`、`apps/p3`（均 pin `1.6.1`）；**`packages/coding-agent` 不依赖 chord**。

## 它解决什么问题

应用由若干 **objects** 组成，object 活在多个进程里（server、workers、浏览器 tab），并且在其插件被 **reload** 时持续运行。chord 负责"对象怎么被找到、状态怎么同步、代码怎么热替换、谁能调用"，不负责 UI、业务与持久化。

## 核心模型（权威文本：`docs/design.md`，3,691 行，30 章）

- **object type = contract**：名字、选择实例的 params、宿主 host、成员（state 与 methods）、版本；契约是运行期 JSON Schema 值，用 `@earendil-works/pi-schema` 的 builders 写（§5）。
- **facet**：插件对一个 host 的声明——它 serve 哪些类型、对 registries 贡献什么。factory 只声明，Chord 负责激活（§16）。
- **reference**：所有人拿到的都是 reference 而非对象；`get` resolve 后即 live 且已 hydrate，本地与跨 link 同形，并维持对象存活（§7）。
- **documents**（§9）／**derives**（§12）／**natives**（§13）／**routines**（§14）／**jobs**（§15，可持久化、活得比发起它的调用久）／**registries**（§17）。
- **principal**：每个调用都有；link 盖章、应用定型，对象按 principal key 分实例保存（§4）。chord 不发明 principal，由应用注入。
- **reload/rollout**（§21）：插件代码在运行中的 app 里换装，**按 host 逐个 rollout**。1.5.1 起语义是"reload 重启变更插件的每个活对象"（旧的纯 in-place swap 已删）：旧 work 在旧 attempt 上跑完（有 `reloadDrainTimeout`，默认 5 s，超时切 `released` 并报 `drain_timeout`），新调用在新代码上等；`RolloutHost` 在 1.6.1 是 tagged union（`{ kind: "reloaded"|"stopped"|"failed", ... }`）。
- **admission**（slice 14，1.6.0）：contract 可声明 `admission: schema`；`host.serve`/`host.route`/`createWorkers` 的 `admit(params, principal, self)` 在解析/转发**之前**做每 principal+address 一次的决定——被拒的 caller 不会启动 worker（拒绝为 `forbidden`）。

## 能力面（slice 9–14，1.5.1–1.6.0 落地）

| 面 | 内容 | 入口 |
|---|---|---|
| telemetry | `CHORD_TELEMETRY_SCHEMA`、host adapter、`chord.call`/`chord.method`/`chord.commit` 等 span 面；page/worker 在内存记录、批量上送 server 的 `ingest`（页面批次严格校验、上限 1,200 spans/分钟、盖 `chord.host: browser`）；SQLite store 微秒时间戳（store v2 就地迁移） | `./telemetry-sqlite`、`./telemetry-sqlite/node`、`./telemetry-ingest` |
| HTTP | Web 标准 fetch handler、默认拒绝（无 principal 且非 `public: true` → 401）、CSP nonce、签 cookies、links endpoint 心跳 | `./http` |
| workers | 按 host kind 地址 fork worker，按需启动/空闲停止；base 用 esbuild 打进私有临时目录再 fork（源码中途编辑不影响已起的 worker）；1.6.0 起要求 `store` | `./workers`、`./workers/child` |
| plugins | esbuild 构建 + `vm.Script` 求值 + mapStack + 按 host 成批 rollout；版本化 API import 检查、`<name>.<kind>.<ext>` 文件、git/npm `installPlugin`、`testPlugin` | `./plugins`、`./plugins/runtime` |
| app kit | `startServer`（数据目录布局、sessions、owner link/token/设备配对、0700/0600、`Files`、`exportData`/`importData`）、`startWorker`、可选 facet `defineUsers`/`inviteFacet`/`ephemeralLoginFacet`（§25） | `./app`、`./app/files` |
| surfaces | `webSurface`/`tuiSurface`（内容哈希 base bundle + 插件 facet 自注册脚本）；`startPage` 连接循环与插件就地换装；`startTerminal` 在**沙箱子进程**跑 app 的终端代码（Node permission model，无 fs/网络/SQLite；`requireSandboxNode`）；主题与 i18n 的 client 侧 | `./surfaces`、`./web`、`./react`、`./tui`、`./tui/launcher` |
| 查询 | live queries（`self.query`，commit 步内重跑、只发 diff，按索引跳过不可能受影响的 read）；named queries（slice 14：contract 声明 `queries()`，owner 用 `self.queries` 实现）；`self.list`（固定书签分页、`more` 增量）；column sets（跨插件 `exists`/join） | 根 export（store 面） |
| sync（experimental） | store outbox → remote slots：`uploadSession`/`pullSession`/`foldSession`/`FlushScheduler`；`diverged`/`behind`/`remote_empty`（1.6.1 起 writer epochs 已删除） | `./sync` |

## 入口点（26 条内容 exports + `./package.json` 指针，全部核验自 `package.json`）

分组（运行位置见 `README.md` 的表）：**双端** `.`（contracts/errors/hosts/facets/documents/derives/natives/jobs/links/registries/store/client 共享面）、`./context`、`./delta`、`./json`、`./watch`、`./output`、`./sync`、`./sqlite`、`./telemetry-sqlite`、`./telemetry-ingest`；**存储适配** `./sqlite/node`、`./sqlite/cloudflare`、`./telemetry-sqlite/node`；**Node 侧** `./http`、`./workers`、`./compression`、`./workers/child`、`./plugins`、`./plugins/runtime`、`./app`、`./app/files`、`./surfaces`、`./tui/launcher`；**客户端** `./web`、`./react`、`./tui`。

## 三份文档并读（不要只读 design.md）

| 文件 | 行数 | 回答什么 |
|---|---|---|
| `docs/design.md` | 3,691（30 章） | **是什么**：§3 hosts/links、§6 objects、§9 documents、§10 store、§21 reload、§23 optional components、§29 telemetry、§30 cost model |
| `docs/decisions.md` | 3,779 | **为什么不是另一种做法**：被否掉的方案与理由 |
| `docs/slices.md` | 380（slice 1–14+） | **怎么分步建** + 每个 slice 的 Carry-over（AGENTS.md 规定 carry-over 必须随同一 change 落地） |

另有 `docs/plugin-authoring.md`（插件作者指南）与 17 个专题目录（`http-workers/`、`guide-plugins-hosts/`、`i18n/`、`theming/`、`store/`、`tutorial/` 等）。可运行示例：`test/examples/` **72 个条目 / 递归 236 个 `.ts`**（durable `test/examples/` 同格式）。

## 与 v1 的断裂（读旧材料时的对照表）

| 旧（v1，已删除） | 现（v2） |
|---|---|
| `@earendil-works/chord` 根 export = v1；`./next` = v2 | 根 export = v2；`./next` 导出**不存在** |
| v1 的 placement `hostNamed`/`hostFamily`、`GetOptions.at` | v2 的 host 归属在 contract 上声明（design §3/§5） |
| v1 的 `PROTOCOL_VERSION = 4`、帧形状、window/pendingCap | v2 的 wire 在 design §22（`PROTOCOL_VERSION = 1`，1.5.1 加 `old`/trace 位时未 bump） |
| v1 的 cell/`linger`/`retire`/async `get` 语义 | v2 的 documents/state/references（§6–§9、§11） |
| 模块 `src/next`（146 `.ts`）+ `src/next-node`（29） | `src/` 21 个模块 + 根部 5 个 `.ts`，共 **315** 个 `.ts`（`node/` 72：app 23、http 13、plugins 12、surfaces 8、tui 7、workers 8、根部 `compression.ts` 1） |

## 锚点

- `packages/chord/package.json`：26 条内容 exports + `./package.json` 指针；deps `pi-schema` + `pi-telemetry`（pin 1.6.1）；optional peers `esbuild`/`ws`/`react`（ranges）
- `packages/chord/CHANGELOG.md`：8 段（1.2.0–1.6.1；1.5.1 是"v2 转正 + v1 删除 + slices 9–13"集中版）
- `packages/chord/README.md`：对象模型摘要 + 全部入口点表（写本页时的对照基准）
- `packages/chord/docs/`：28 篇 md + 17 个目录（design/decisions/slices/plugin-authoring + 专题目录）
- 消费者：`packages/durable`、`packages/env`、`apps/p2`、`apps/p3`（pin 1.6.1）；`packages/coding-agent` **无** chord 依赖
- 状态：包本身按 semver 记录；`/sync` 仍标注 experimental
