# architecture-next：v0.85.x–0.86.x 落地的新架构层

> 状态：**experimental，source-only**（#9132，v0.85.1 起实验代码不再进公共 SDK 面）。所有行号锚点基于 v0.86.1 working tree。

`_digested/` 其余部分覆盖的是 stable 面（coding-agent / tui / agent / ai / protocol）。本轮 sync（v0.84.4 → v0.86.1，见 `_change_log/0006`）引入了一整套**并行的实验架构层**，跨包、零 changelog 记录，stable 文档读者完全看不到它。这个目录就是为它开的。

## 一句话主线

**plugin/facet → Chord FacetHost（服务图 + replicated state）→ server 只做路由 → session worker 持有 durable Session（Pico5 contracts，SQLite/Memory 后端）→ presentation（TUI）通过服务订阅 replicated transcript**。

## 三个新面

| 面 | 位置 | 角色 | 详见 |
|---|------|------|------|
| chord | `packages/chord` | standalone 应用组合运行时：facets、services、replicated state、JSON delta、transport 无关 wire。**不是 Pi 包**——不依赖任何 Pi workspace 包 | [chord.md](./chord.md) |
| durable | `packages/durable` | Pico5 record contracts + MemoryStorage；normative spec 在包内 `docs/pico-v5.md`（2031 行），不在 README | [durable-and-storage.md](./durable-and-storage.md) |
| server + experimental services | `packages/server`（~1060 行薄路由层）+ `packages/coding-agent/src/experimental/services/` | server 只做路由与 fencing，payload 对它 opaque；业务语义全在 coding-agent 侧的服务切片 | [server-and-experimental-services.md](./server-and-experimental-services.md) |

第四个支撑面 `packages/session-backends/sqlite-node`（durable Storage 的第一个真实后端）与两个相关但独立的表面——agent 侧 pico3 kernel（`packages/agent/src/harness/pico3/`，export `@earendil-works/pi-agent-core/experimental/pico3`）和 CBOR 协议线（`packages/protocol` `PROTOCOL_VERSION = 8`，`protocol.ts:5`；consumer 在 `packages/client`）——都在 [durable-and-storage.md](./durable-and-storage.md) 覆盖。

## 为什么单开一个目录

1. **内容跨 3+ 包**，塞不进任何现有 per-package 条目；chord 还是 standalone 包，按包归属会误导。
2. **CHANGELOG 完全不可用**：`packages/server/CHANGELOG.md` 四个 release（0.85.0–0.86.1）节全空；`packages/chord` 根本没有 CHANGELOG 文件；`packages/durable` 只有一条 0.86.0 的 "initial contracts" Added。实验性变更只进 commit message——想追踪这部分只能读源码和包内 docs。
3. **入口不是 README 就是 spec**：读这两处即可入门——`packages/coding-agent/src/experimental/services/README.md`（服务切片表 + facet/catalogue 语义）与 `packages/durable/docs/pico-v5.md` §1（Session 原子提交不变量）。

## 怎么跑起来

`PI_EXPERIMENTAL=1` 下 `pi client` / `pi client -c` / `pi client -r`（experimental client/server，Unix socket 传输）；冒烟脚本 `mini-test.sh`（experimental mini 面，改 `experimental/mini/` 后须重启）。
