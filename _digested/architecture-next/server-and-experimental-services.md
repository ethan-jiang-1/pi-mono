# server（薄路由层）与 coding-agent 实验服务切片

## 演进结论

v0.84.x 的 `packages/server` 还承载业务语义；v0.86.x 周期把它抽干成**纯路由层**，业务语义上移到 `packages/coding-agent/src/experimental/services/`。v1.0.0（`48dd1e2f0`）再把整条 experimental client/server 从已删除的 pi-agent-core harness **迁到 pi-durable**：worker 改持 per-session `session.sqlite`，server 永不打开存储。`packages/server` 是本轮唯一 Breaking 记录与实际改形一致的包（1.0.0 Breaking 条目：`SessionMetadata` 收进本包且只要求 `id`，不再依赖 pi-agent-core；`TestServerHost`/`TestHarness` 改形）。

## server 现在长什么样（硬事实）

- **与 pi-agent-core 解耦**：`SessionMetadata` 收进 pi-server（`packages/server/src/types.ts:17-19`，仅要求 `id`，应用可扩展）；package.json 依赖只剩 `@earendil-works/chord` + `@earendil-works/pi-protocol`。
- **`ServerHost<TMetadata>` 收敛为两薄方法**（`src/types.ts:63-68`）：`resolveSession(sessionId, context)` 返回 metadata（有界路由错误）、`openSession(metadata, context)` 返回 `RoutedSessionHandle`；旧的 list/歧义解析/open-then-cleanup 流程全部移出（**Session 发现与管理是应用自有服务**，README 明说）。`SessionAmbiguousError` 类仍在导出面（`src/errors.ts:38`）供应用自用，但主流程不再触发它。
- 其余形状不变：`RoutedServerServiceHost.attachClient(presentation, context)`（`types.ts:50-52`）→ `RoutedServerServiceAttachment`；`RoutedSessionHandle.attachClient(context)`（`types.ts:55-60`，含 `terminated` promise）。所有 invoke 都是 chord `ServiceCall` → `JsonValue`，订阅用 `publish(subscriptionId, update, context)`——**server 对 payload 完全 opaque**。
- **`SessionRouter`（`src/session-router.ts:34`）**：每 client 串行化操作队列（`runForClient`，`:146`）；attachment 生命周期（acquire session、释放旧 attachment、`handle.attachClient`、向 client 发布 `{serverId, sessionId, attachmentId}`）；worker 意外终止走 `invalidate`（`:302`）。请求按三元组 `{serverId, sessionId, attachmentId}` 做 **fencing 校验**（`requireAttachment`，`:224`）——旧 attachment 的迟到请求被拒。
- **`server.ts`**：握手时 `attachClient` 构造 presentation，hello/version 协商后进入 ready。`server.ts:280/:283` 仍传 `TODO_CONTEXT`（`:331/:431-432` 也在用）而非真实请求 context——握手期鉴权/取消链路未完成。
- **传输仅 Unix socket**（`src/transports/unix/`，exports `./unix`）；`testing/` 提供 in-memory conformance 工具（`TestServerHost` 用内存 Map 而非 MemorySessionRepo，`TestHarness` 暴露 `metadata` 而非 `session`——`src/testing/host.ts:25-26,147`）。

## worker/sqlite 布局（v1.0.0 新形态）

- server 侧每个 Session 一个目录，**只含 `meta.json` + `session.sqlite`**，server 从 `meta.json` 列出/创建 Session，永不打开存储（`src/experimental/session-catalog.ts:5,15-16`；`readSession` 只读 `meta.json`，`:42`）。
- Session worker 锁目录（proper-lockfile）、打开存储——per-session `openNodeSqliteStorage`（`src/experimental/session-worker.ts:16,785`）、`harness.resume()` 恢复中断工作（`:594`），并在 task graph 有活任务时持有 retirement（`harness.taskGraph()`，`session-worker.ts:525-560`；hold 计数 `:250,255,296`）——worker 在 Harness task graph 有 live tasks 期间不退役。

## 业务语义在哪：experimental/services

`packages/coding-agent/src/experimental/services/README.md`（45 行，手写架构说明；v1.0.0 随 pi-durable 迁移重写）：

- **服务目录是生成物**：facet setup 从 provided non-local tokens **自动生成** RPC catalogue，没有手写 inventory；presentation-only 服务显式声明 `local`，不进 catalogue。
- **切片表**（README:14-24）：server scope `SessionDirectory`（replicated state 已实现）/ `SessionManagement` / `PresentationPlugins`；session scope `SessionPlugins` / `Models`（跟随会话 `pi.agent` 文档，`models-provider.ts:139`）/ `AgentController`（根 durable conversation 的 presentation-safe facade：prompting、steering、follow-ups、queue cancellation、abort、compaction）/ `Transcript`（**直接把 `Conversation.viewState()` 的 `AttachedReplicatedState` 作为复制态**，`transcript-provider.ts:4-15`——worker 侧没有自己的 reducer）；presentation scope `SlashCommands` / `PresentationUI`（均 `local`）。
- **DTO 归属**：session directory/creation/address 的 DTO 由 coding-agent 服务契约持有而非 `pi-protocol`，传输层视为 opaque service data。
- **`/reload`**：原子重建 plugin 包 → 加载候选 generation → `FacetHost.reload()` cutover → dispose 退役 generation（零不可用窗口）。
- `pico-v5-chord-usage.md` 里的 canvas/diff-review/task-observation 是**扩展模式示例**，不是 coding-agent 内置服务。

### 被删能力清单（services/README.md:38-45 TODO 段，能力缺口的权威清单）

迁到 durable 后被放弃、等待重设计的表面：

1. **Tree navigation**：`AgentController.navigate()` 删除。durable 用 fork 产生新会话来分支，导航需要 fork + 开新 context 的 summary entry + 指向当前会话的指针（README:42）。
2. **Next-run queue**：`AgentController.nextRun()` 删除——durable 只排 steering 和 follow-up 输入；**`resume()` 也删除**：worker 打开 Session 时自动恢复中断工作（README:43）。
3. **Subagents**：服务只覆盖根会话；暴露 subagent 会话需要 per-conversation keyed service instances（README:44）。durable 侧 `pi.agent`/task graph 已就绪，缺口在服务面。
4. **Transcript history**：`Transcript` 只含最近一次 reset/compaction 后的活跃上下文；更早条目需要基于 `Conversation.entries()` 的分页方法（README:45）。

## 三者如何拼起来（解释）

chord 是"语言"（facet 服务图 + replicated state + wire 语法）；server 是"交换机"（把 socket 连接路由到 session worker 的 chord endpoint，不解构 payload）；durable 是"事实"（session worker 内 Harness 的原子提交模型 + task graph）。presentation（TUI）通过服务订阅 replicated `Transcript`，provider（durable Harness）是唯一 reducer——TUI 侧没有自己的 agent 状态副本，只有 replica。stable 与 experimental 两个 TUI 共享渲染组件（editor/transcript/dock/theme），这是两条产品线的衔接缝。durable TUI 入口（`experimental/durable/`）则是"单进程版"同一套事实层：一个进程持 Harness + SQLite + TUI，说明这层架构不强制多进程。

## 与 stable 面的边界

- 协议数字：experimental wire 走 `packages/protocol` 的 CBOR（`PROTOCOL_VERSION = 8`，`src/protocol.ts:5`），但 session 业务 DTO 不进 `pi-protocol` 公共契约。
- 入口：`PI_EXPERIMENTAL=1 ./pi-test.sh server` / `... client`（`-c`/`-r` 附着最新 Session；`PI_SERVER_DIR` 覆盖 profile/socket 目录，默认 `~/.pi/server`；`PI_SERVER_ID` 选逻辑 server ID）——`services/README.md:5-12`。v0.86.x 的冒烟脚本 `mini-test.sh` 与 mini/micro 前端已删除。
- 状态：experimental、source-only（server/client/experimental 子路径排除出 npm 包与 standalone 二进制，`services/README.md:12`）；鉴权投影、真实握手 context、navigate/nextRun/resume 等能力均未完成（见上 TODO 清单）——**别把它当稳定 API 引用**。durable 包本身虽已发布 1.0.0，但其 README 自带 experimental 横幅、CHANGELOG 已重置。

## 锚点

- `packages/coding-agent/src/experimental/services/README.md`（入口文档；`:14-24` 切片表、`:30` meta.json/session.sqlite 布局、`:38-45` TODO 能力缺口权威清单）
- `packages/server/src/types.ts:17-19`（`SessionMetadata`）、`:63-68`（`ServerHost` 两薄方法）、`:50-52`/`:55-60`（attachClient 面）
- `packages/server/src/session-router.ts:34`、`src/server.ts:280`（`TODO_CONTEXT`）、`src/errors.ts:38`（`SessionAmbiguousError` 退役但保留）
- `packages/coding-agent/src/experimental/session-catalog.ts:15-16`（`meta.json`/`session.sqlite` 常量）、`session-worker.ts:16/:785`（per-session `openNodeSqliteStorage`）、`:594`（`harness.resume()`）、`:525-560`（task graph retirement hold）
- `packages/coding-agent/src/experimental/durable/README.md:7-16`（durable TUI 运行方式与会话目录）
- `packages/chord/src/facets/host.ts:423`（`FacetHost.reload()`）
- `packages/protocol/src/protocol.ts:5`（`PROTOCOL_VERSION = 8`）
- 状态：server 1.0.0 Breaking 条目与实际改形一致（唯一如实记录的包）；experimental 面仍 source-only，能力缺口以上述 TODO 段为准
