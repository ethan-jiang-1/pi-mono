# architecture-next：新架构层（chord / durable / apps）

> **基线 v1.6.1（`ef4a1cfcc`）**。本目录现有**三页 + 一份删除记录**：[`chord.md`](./chord.md)——chord **v2，唯一运行时**（v1.5.1 起 v1 已整体删除，`chord-v2.md` 已并入该页并删除）；[`durable-and-storage.md`](./durable-and-storage.md)——session 事实层 + 存储后端 + ExecutionEnv/codemode/images 契约层（已补 v1.5.1–v1.6.1 增量，含可挂起工具专节）；[`apps-p2-p3.md`](./apps-p2-p3.md)（**新增**）——`apps/` 层：p2（Pi Mobile，EXPERIMENTAL 原型）、p3（Pi Roam，方向）、p2-mac（Swift spike）；[`server-and-experimental-services.md`](./server-and-experimental-services.md)——v1.2.0 删除记录，仅存档。
>
> 状态定性（v1.6.1）：chord 与 durable 都是逐版本记 CHANGELOG 的公开发布包；chord 的 `/sync` 子路径自标 experimental，durable README 仍带 "Experimental" 横幅。**"双运行时并存"表述全文作废**——chord v1 在 v1.5.1 先移 `/old` 后删除，v2 是唯一运行时；旧页写的协议 4、placement `hostNamed`/`hostFamily`、cell/linger 等 v1 API 事实随之失效。变更史见 [_change_log/0012–0015](../_change_log/0012-v1.5.0-to-v1.5.1.md)。

## 一句话主线

**plugin → Chord v2 host runtime（contracts + objects + registries + link/HTTP/workers/surfaces）→ durable Harness（spec.md contracts，Memory/JSONL/SQLite/IndexedDB 四后端）→ 呈现层三形态：coding-agent TUI（进程内直连）、p2 Web UI、p3（server + 每 session worker + 插件）**。

> v1.2.0 曾把"server 只做路由"整段拿掉，presentation 与 Harness 回落同一进程；v1.5.1 起 chord v2 的 app kit（`startServer`/`startWorker`、sessions、facets）与 surfaces（web/tui）把多进程、多客户端形态**重建在 chord 上**——`apps/p2` 与 `apps/p3` 就是这条线的两个 app（见 [apps-p2-p3.md](./apps-p2-p3.md)）。

## 三个面

| 面 | 位置 | 角色 | 详见 |
|---|------|------|------|
| chord | `packages/chord` | 应用组合运行时（**v2，唯一**）：contracts/objects/registries、documents/derives/jobs、link/HTTP（默认拒绝）/workers（esbuild base 快照）/plugins（版本化 API 检查）、surfaces（web+TUI，终端跑在沙箱子进程）、store（live/named queries、lists、column sets）、admission、sync（experimental）、telemetry（page/worker 上送）。依赖 `pi-schema` + `pi-telemetry`；optional peers `esbuild`/`ws`/`react`。src **315** 个 `.ts`、27 条 exports。消费者：durable、env、apps/p2、apps/p3（pin 1.6.1）；**coding-agent 不依赖它** | [chord.md](./chord.md) |
| durable | `packages/durable` | session 事实层 + Harness 运行时：task graph（v1.4.0 `sleeping` → v1.6.0 **ToolPark/Signals/Gates**、hooks 可派生任务）、Memory/JSONL（1.5.1 起 `readOnly`）/SQLite（驱动在 chord）/IndexedDB 四后端、ExecutionEnv 契约层（pi-env 上游）、codemode（journal 确定性重放）、images（含 1.6.0 `/images/fit`）。`pi.tool` v4 / `pi.generation` v3（1.6.0，存储单向门）；1.6.1 全 API tagged-union | [durable-and-storage.md](./durable-and-storage.md) |
| apps | `apps/{p2,p3,p2-mac}` | 产品形态试验场：p2 = chord 插件式自托管 Web UI（**将被替换的原型**，但仍每 release 大改）；p3 = "one Pi per person"（方向，guides + 26 slices + bench 的完整工程）；p2-mac = Swift 壳 spike。**不计入 packages 计数** | [apps-p2-p3.md](./apps-p2-p3.md) |
| ~~server + experimental services~~ | ~~`packages/server` + `coding-agent/src/experimental/services/`~~ | **v1.2.0 整体删除**（`7472cd0`，−21,561 行）。原角色：server 只做路由与 fencing | [server-and-experimental-services.md](./server-and-experimental-services.md)（删除记录） |

## 为什么单开一个目录

1. **内容跨 3+ 包与 apps 层**，塞不进任何现有 per-package 条目；chord 是 standalone 包，按包归属会误导。
2. **CHANGELOG 记录完整**：chord（1.2.0 起）与 durable（1.0.1 起）都逐版本记录；仍无记录的仅剩历史遗留（`session-backends` 删除、durable 被重置的 0.87.0–0.99.2 段）。
3. **入口是设计文档**：chord 权威文本是 `docs/design.md`（3,691 行 30 章）+ `decisions.md`（3,779 行）+ `slices.md`（380 行）**三份并读**，另有 `plugin-authoring.md` 与 17 个专题目录；durable 权威文本是 `docs/spec.md`（normative），README 是 experimental usage guide。

## 怎么跑起来

- **coding-agent TUI**：根 README 的常规方式（durable 作为库被它消费，不是独立 CLI）。
- **p2**：根目录 `npm install --ignore-scripts` + `npm run hydrate:model-data`，然后 `cd apps/p2 && npm start`（详见 [apps-p2-p3.md](./apps-p2-p3.md)）。apps/p2 在根 check/测试之外，自带 `npm run check` / `npm test`。
- **durable / chord 作为库**：各自 README + spec/design；chord 有 72 个可运行示例（`test/examples/`），durable 的 examples 含 38–46（可挂起工具）。

## 版本史（旧基线记录）

- **v1.0.3 → v1.2.0**：两次整块删除——experimental server 栈（`packages/{server,client,protocol}`，`7472cda0d`，161 文件 −21,561；`packages/` 13→11）与 chord 的 facet/service 运行时（`0104fef1e`，换成 chord2 typed host runtime）。彼时 chord 首次获得 CHANGELOG.md，durable 恢复逐版本记录。详见 [server-and-experimental-services.md](./server-and-experimental-services.md) 与 [_change_log/0009/0010](../_change_log/0009-v1.0.3-to-v1.2.0.md)。
- **v1.4.0 → v1.5.0**：chord 分化出 `./next`（v2 首次有 export）与 v1 并存；durable 重写存储提交契约（`Storage.commit(batches, ...)`、watch 窗口化）。见 [_change_log/0011](../_change_log/0011-v1.4.0-to-v1.5.0.md)。
- **v1.5.0 → v1.6.1**：chord v2 转正、v1 删除（0012）；durable 可挂起工具 + chord slice 14（0014）；tagged-union 扫荡（0015）；`apps/` 层出现并长成主战场。见 [_change_log/0012–0015](../_change_log/0012-v1.5.0-to-v1.5.1.md)。
