# architecture-next：v0.85.x–1.0.0 沉淀出的新架构层

> 状态：**experimental 定性仍成立，但形态已分化**（v1.0.0 现实）：`pi-durable` 现在是公开发布的 npm 包，README 自带 "**Experimental.** The API changes without notice between releases." 横幅（`packages/durable/README.md:3`），且 1.0.0 把 0.87.0–0.99.2 的 16 条 Breaking 历史重置为一条 "Initial release"（`packages/durable/CHANGELOG.md`，仅 9 行）——连版本化迁移承诺都不存在。coding-agent 侧的 experimental 面则维持 #9132 语义的 **source-only**：server/client/experimental 子路径被排除出 npm 包与 standalone 二进制（`packages/coding-agent/package.json` files 段 `!dist/experimental`；`src/experimental/services/README.md:12`）。所有行号锚点基于 v1.0.0（`7fbbd5f4a`+2）working tree。

`_digested/` 其余部分覆盖的是 stable 面（coding-agent / tui / agent / ai / protocol）。本轮 v1.0.0 sync（`_change_log/0007`）没有让这层消失，反而完成了它的**收编**：v0.86.x 时 pi-agent-core 里并行的 harness/session/pico3 实验层被整包删除（agent 收缩为 Agent+loop+proxy，7fd478a2e），由 `packages/durable` 长成正式运行时接盘——harness、session 事实层、存储后端全部落入一个包。跨包、低 changelog 记录的特征仍在（chord 全程无 CHANGELOG；durable 历史被重置；session-backends 被删除且全仓无记录）。

## 一句话主线

**plugin/facet → Chord FacetHost（服务图 + replicated state）→ server 只做路由 → session worker 持有 durable Harness（spec.md contracts，memory/JSONL/SQLite 后端内置）→ presentation（TUI）通过服务订阅 replicated transcript**。

v1.0.0 的变化是把"持久会话事实层"从一套纸面 contracts 变成接盘者：`packages/agent` 的 harness/session/pico3 已删除，`packages/durable` 现在自带 Harness 运行时（task runtime、compaction、extensions、task graph view）和三种存储后端。

## 三个新面

| 面 | 位置 | 角色 | 详见 |
|---|------|------|------|
| chord | `packages/chord` | standalone 应用组合运行时：facets、services、replicated state（事务性 `change()/replace()`）、JSON delta（唯一不可变 tracker）、transport 无关 wire。**不是 Pi 包**——不依赖任何 Pi workspace 包 | [chord.md](./chord.md) |
| durable | `packages/durable` | 完整 durable harness 运行时（src 60 文件）：Session/Harness/Tasks/Documents + 内置 memory/JSONL/SQLite 存储；normative spec 在包内 `docs/spec.md`（4,601 行），不在 README；npm 包不再随发 docs/（`package.json` files 只含 dist/README/CHANGELOG） | [durable-and-storage.md](./durable-and-storage.md) |
| server + experimental services | `packages/server`（src 核心 ~1,060 行薄路由层）+ `packages/coding-agent/src/experimental/services/` | server 只做路由与 fencing（`ServerHost<TMetadata>` 两薄方法），payload 对它 opaque；业务语义全在 coding-agent 侧的服务切片；worker 持 per-session `session.sqlite` | [server-and-experimental-services.md](./server-and-experimental-services.md) |

第四个支撑面在 v1.0.0 收缩为一个：`packages/session-backends/sqlite-node` **整包删除**（−4,397，全仓 changelog 无记录），SQLite 能力由 `packages/durable/src/storage/sqlite/` 内置吸收并异步化；agent 侧 pico3 kernel（`packages/agent/src/harness/pico3/`，export `./experimental/pico3`）随 harness 整体删除——pi-agent-core 的 exports 只剩 `.`（`packages/agent/package.json:8-14`），durable 是唯一事实承接。CBOR 协议线保留：`packages/protocol` `PROTOCOL_VERSION = 8`（`src/protocol.ts:5`，整个 sync 范围内零 commit 触碰），consumer 在 `packages/client`——见 [durable-and-storage.md](./durable-and-storage.md)。

## 为什么单开一个目录

1. **内容跨 3+ 包**，塞不进任何现有 per-package 条目；chord 还是 standalone 包，按包归属会误导。
2. **CHANGELOG 依旧不可用**：`packages/chord` 仍然没有 CHANGELOG 文件（replicated state 破坏性改形零记录）；`packages/durable` 的 0.87.0–0.99.2 历史（16 条 Breaking）在 1.0.0 被重置为 "Initial release" 一条；`packages/session-backends` 的删除没有任何包记录。唯一例外是 server：1.0.0 的 Breaking 条目（SessionMetadata/ServerHost）与实际改形一致。实验性变更仍主要活在 commit message 与包内 docs 里。
3. **入口还是 README/spec**：`packages/coding-agent/src/experimental/services/README.md`（服务切片表 + TODO 能力缺口清单）与 `packages/durable/docs/spec.md` §1（Session 原子提交不变量，现 8 条）。durable 的 README 也升级成 26 节 experimental usage guide（597 行），可作为 spec 前的入门。

## 怎么跑起来

三个入口，全部 source-only（须在 pi checkout 内、`npm run build` 或走 source-resolver）：

- **experimental client/server**（`PI_EXPERIMENTAL=1`）：`PI_EXPERIMENTAL=1 ./pi-test.sh server` / `PI_EXPERIMENTAL=1 ./pi-test.sh client`（`-c`/`-r` 附着最新已有 Session；Unix socket，profile/socket 目录默认 `~/.pi/server`，`PI_SERVER_DIR` 可覆盖）——`src/experimental/services/README.md:5-12`。`pi-test.sh` 用 source-resolver 拉起 `src/experimental/cli.ts`，由它分发 `server`/`client` 子命令（`src/experimental/commands.ts:86`）。
- **durable coding agent TUI**（v0.86.x 的 mini/micro 前端已删除，这是替代演示）：`node --import ./packages/coding-agent/src/experimental/source-resolver.ts packages/coding-agent/src/experimental/durable/main.ts`（`--continue` 开最近会话）。单进程：模型 runtime + durable Harness + SQLite 存储 + TUI；会话在 `~/.pi/agent/experimental/durable-sessions/<cwd-hash>/<session>/session.sqlite`——`src/experimental/durable/README.md:7-16`。`vacation/` 是它的换皮副本（去 coding 工具的 vacation planner）。
- 旧的冒烟脚本 `mini-test.sh` 与 `experimental/mini|micro/` 前端已整体删除，无迁移无记录。
