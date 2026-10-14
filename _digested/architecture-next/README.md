# architecture-next：v0.85.x–1.2.0 沉淀出的新架构层

> **本页基线：v1.2.0（`06a466935`）。** 此前基于 v1.0.3+23（`98d2e1947`）working tree。本区间（v1.0.3 → v1.2.0）该层发生**两次整块删除**，本目录三页的处置各不相同，见下表。
>
> 状态：**experimental 定性仍成立，但形态已分化**。`pi-durable` 是公开发布的 npm 包，README 自带 "**Experimental.** The API changes without notice between releases." 横幅（`packages/durable/README.md`）。1.0.0 曾把 0.87.0–0.99.2 的 16 条 Breaking 历史重置为一条 "Initial release"，**自 1.0.1 起恢复逐版本规范记录**（v1.2.0 时 CHANGELOG 已有 129 行）。chord 在 v1.2.0 **首次获得 CHANGELOG.md**——此前"replicated state 破坏性改形零记录"的缺口已闭合。
>
> coding-agent 侧的 experimental 面则**整体消失**：`src/experimental/` 目录只剩一个无关的 `source-resolver.ts`，不再有任何 experimental 子路径需要 source-only 豁免。

### 本区间的两次删除

| 删除对象 | 提交 | 规模 | 后果 |
|---|---|---|---|
| experimental server 栈：`packages/{server,client,protocol}` + `coding-agent/src/experimental/{services,durable,session-catalog,session-worker}.ts` | `7472cda0d` | 161 文件，+32/−21,561 | 远程会话产品线终结；`packages/` 13→11 |
| chord 的 facet/service 运行时 | `0104fef1e` | 85 文件，+14,743/−8,921 | 换成 chord2 typed host runtime；`PLANNING.md` 被删 |

**三页处置**：本 README 与 [`durable-and-storage.md`](./durable-and-storage.md) 更新到 v1.2.0；[`server-and-experimental-services.md`](./server-and-experimental-services.md) **整页作废，保留为删除记录**；[`chord.md`](./chord.md) 描述的是 chord1 的 facet/service 形状，其 API 已被 chord2 取代（读时须知）。

`_digested/` 其余部分覆盖的是 stable 面（coding-agent / tui / agent / ai）。本轮 v1.0.0 sync（`_change_log/0007`）没有让这层消失，反而完成了它的**收编**：v0.86.x 时 pi-agent-core 里并行的 harness/session/pico3 实验层被整包删除（agent 收缩为 Agent+loop+proxy，7fd478a2e），由 `packages/durable` 长成正式运行时接盘——harness、session 事实层、存储后端全部落入一个包。跨包、低 changelog 记录的特征仍在（chord 全程无 CHANGELOG；session-backends 被删除且全仓无记录；durable 历史在 1.0.0 被重置——此点自 1.0.1 起已缓解，durable 恢复逐版本记录）。

## 一句话主线

**plugin → Chord host runtime（contracts + replicated state + link/RPC）→ durable Harness（spec.md contracts，memory/JSONL/SQLite 后端内置）→ presentation（TUI 进程内直连）**。

> v1.2.0 把中间的"server 只做路由 → 跨进程订阅 transcript"整段拿掉：presentation 与 Harness 回落到**同一进程**。chord 仍在（durable 与 env 依赖它），但不再承担多进程会话路由。

v1.0.0 的变化是把"持久会话事实层"从一套纸面 contracts 变成接盘者：`packages/agent` 的 harness/session/pico3 已删除，`packages/durable` 现在自带 Harness 运行时（task runtime、compaction、extensions、task graph view）和三种存储后端。

## 三个新面（v1.2.0 后现存两个）

| 面 | 位置 | 角色 | 详见 |
|---|------|------|------|
| chord | `packages/chord` | standalone 应用组合运行时（chord2）：contracts、typed host、replicated state、JSON delta（唯一不可变 tracker）、link/RPC over JSON links。**不是 Pi 包**——运行时只依赖自身 `delta` 与 `typebox`。v1.2.0 经 chord2 重写，facet/service API 不兼容 | [chord.md](./chord.md)（chord1 形状，读时须知） |
| durable | `packages/durable` | 完整 durable harness 运行时（src **82** 文件）：Session/Harness/Tasks/Documents + 内置 memory/JSONL/SQLite 存储；v1.0.3 起长出**执行环境契约层**（`ExecutionEnv` 接口 + `NodeExecutionEnv`/`NodeFileWatcher`，是新包 pi-env 的契约上游）；v1.2.0 新增 `src/codemode/`（journal 式确定性重放，与 coding-agent 的 codemode 扩展是**两套实现**，见 [durable-and-storage.md](./durable-and-storage.md)）；normative spec 在包内 `docs/spec.md`（**5,340** 行），不在 README；npm 包不再随发 docs/（`package.json` files 只含 dist/README/CHANGELOG） | [durable-and-storage.md](./durable-and-storage.md) |
| ~~server + experimental services~~ | ~~`packages/server` + `packages/coding-agent/src/experimental/services/`~~ | **v1.2.0 整体删除**（`7472cda0d`，−21,561 行）。原角色：server 只做路由与 fencing，业务语义在 coding-agent 侧服务切片 | [server-and-experimental-services.md](./server-and-experimental-services.md)（删除记录） |

第四个支撑面在 v1.0.0 收缩为一个：`packages/session-backends/sqlite-node` **整包删除**（−4,397，全仓 changelog 无记录），SQLite 能力由 `packages/durable/src/storage/sqlite/` 内置吸收并异步化；agent 侧 pico3 kernel（`packages/agent/src/harness/pico3/`，export `./experimental/pico3`）随 harness 整体删除——pi-agent-core 的 exports 只剩 `.`（`packages/agent/package.json:8-14`），durable 是唯一事实承接。CBOR 协议线**已随 `packages/protocol` 一并删除**（`PROTOCOL_VERSION = 8` 不再存在，consumer `packages/client` 同批移除）。

## 为什么单开一个目录

1. **内容跨 3+ 包**，塞不进任何现有 per-package 条目；chord 还是 standalone 包，按包归属会误导。
2. **CHANGELOG 记录已明显改善**（v1.2.0）：`packages/chord` **首次有了 CHANGELOG.md**，chord2 重写的破坏性改形有了正式记录——此前"replicated state 破坏性改形零记录"的缺口闭合。`packages/durable` 自 1.0.1 起逐版本记录，v1.2.0 时 129 行。仍无记录的仅剩历史遗留：`packages/session-backends` 的删除（v1.0.0 前）与 durable 被重置的 0.87.0–0.99.2 段。
3. **入口是 SPEC，不再是服务 README**：`packages/coding-agent/src/experimental/services/README.md`（原服务切片表 + TODO 能力缺口清单）**已随栈删除**。现存唯一权威入口是 `packages/durable/docs/spec.md`（5,340 行，§1 列 Session 原子提交不变量），durable 的 README 是 751 行 experimental usage guide，可作 spec 前的入门。chord 侧新增 `docs/{guide,spec,tutorial}.md`——这是 v1.2.0 才有的，规格开头即声明「文档与代码不一致时，以不一致为 bug」。

## 怎么跑起来

**v1.2.0 后没有 experimental 入口了。** 原三个 source-only 入口中两个（client/server、durable TUI）随栈删除：

- ~~**experimental client/server**（`PI_EXPERIMENTAL=1`）~~：`pi-test.sh server` / `pi-test.sh client`、`PI_SERVER_DIR`、`PI_SERVER_ID`、`src/experimental/commands.ts` 均不存在。
- ~~**durable coding agent TUI**~~：`node --import .../source-resolver.ts .../experimental/durable/main.ts` 不存在；`experimental/durable/` 与 `vacation/`、`mini-test.sh`、`experimental/mini|micro/` 全部删除。
- **现存唯一入口是 durable 作为库**：`packages/durable` 是被 `packages/coding-agent` 消费的运行时（其 extensions 面），不是独立 CLI。运行 Pi 用根 README 的常规方式；durable 的用法见其 README 与 `docs/spec.md`。

`source-resolver.ts` 仍存在于 `packages/coding-agent/src/experimental/`，但已无同目录消费者——它是残留文件，不构成 experimental 产品面。
