# server（薄路由层）与 coding-agent 实验服务切片

## 演进结论

v0.84.x 的 `packages/server` 还承载业务语义；本周期 58 commits 把它抽干成**纯路由层**（src 全部 ~1060 行），业务语义上移到 `packages/coding-agent/src/experimental/services/`。`packages/server` 四个 release 的 CHANGELOG 节全空——这条演进只在 git log 里（关键节点：`f8a6e670d` replace remote sessions with routed services → `28b49a6b3` chord 基础 → `34dc9d055` facet services 移入 chord → `86bac52f9` delta-backed replicated state → `1a7bc80e7` service wire 语义移入 chord → `7cf456aa1` 移除兼容 shim）。

## server 现在长什么样（硬事实）

- **全部接口在 `src/types.ts`（64 行）**：`RoutedServerServiceHost.attachClient(presentation, context)`（L47）→ `RoutedServerServiceAttachment`；`RoutedSessionHandle.attachClient(context)`（L52，含 `terminated` promise）；`ServerHost.resolveSession`/`openSession`（L59-64）。所有 invoke 都是 chord `ServiceCall` → `JsonValue`，订阅用 `publish(subscriptionId, update, context)`——**server 对 payload 完全 opaque**。
- **`SessionRouter`（`src/session-router.ts:34`）**：每 client 串行化操作队列（`runForClient`）；attachment 生命周期（acquire session、释放旧 attachment、`handle.attachClient`、向 client 发布 `{serverId, sessionId, attachmentId}`）；worker 意外终止走 `invalidate`。请求按三元组 `{serverId, sessionId, attachmentId}` 做 **fencing 校验**（`requireAttachment`）——旧 attachment 的迟到请求被拒。
- **`server.ts`**：握手时 `attachClient` 构造 presentation，hello/version 协商后进入 ready。注意 `server.ts:280/:283` 仍传 `TODO_CONTEXT` 而非真实请求 context——握手期鉴权/取消链路未完成。
- **传输仅 Unix socket**（`src/transports/`）；`testing/` 提供 in-memory conformance 工具。

## 业务语义在哪：experimental/services

`packages/coding-agent/src/experimental/services/README.md`（25 行但信息密度极高，手写架构说明）：

- **服务目录是生成物**：facet setup 从 provided non-local tokens **自动生成** RPC catalogue，没有手写 inventory；presentation-only 服务显式声明 `local`，不进 catalogue。
- **切片表**：server scope `SessionDirectory`（replicated state 已实现，排队等 per-client 鉴权投影）/ `SessionManagement` / `PresentationPlugins`；session scope `SessionPlugins` / `Models` / `AgentController`（`AgentLane` 的 presentation-safe facade：prompting、queueing、abort、resume、compaction、navigation）/ `Transcript`（replicated lane state）；presentation scope `SlashCommands` / `PresentationUI`（均 `local`）。
- **DTO 归属**：session directory/creation/address 的 DTO 由 coding-agent 服务契约持有而非 `pi-protocol`，传输层视为 opaque service data。
- **`/reload`**：原子重建 plugin 包 → 加载候选 generation → `FacetHost.reload()` cutover → dispose 退役 generation（零不可用窗口）。
- `pico-v5-chord-usage.md` 里的 canvas/diff-review/task-observation 是**扩展模式示例**，不是 coding-agent 内置服务。

## 三者如何拼起来（解释）

chord 是"语言"（facet 服务图 + replicated state + wire 语法）；server 是"交换机"（把 socket 连接路由到 session worker 的 chord endpoint，不解构 payload）；durable 是"事实"（session worker 内 Session 的原子提交模型）。presentation（TUI）通过服务订阅 replicated `Transcript`，provider（session worker 里的 agent）是唯一 reducer——TUI 侧没有自己的 agent 状态副本，只有 replica。stable 与 experimental 两个 TUI 共享渲染组件（editor/transcript/dock/theme），这是两条产品线的衔接缝。

## 与 stable 面的边界

- 协议数字：experimental wire 走 `packages/protocol` 的 CBOR（`PROTOCOL_VERSION = 8`），但 session 业务 DTO 不进 `pi-protocol` 公共契约。
- 入口：`pi client`（`PI_EXPERIMENTAL=1`）；冒烟 `mini-test.sh`（experimental mini client/server 分离面，与 services 面并存）。
- 状态：experimental、source-only（#9132，v0.85.1 起不发布 `client`/`experimental/plugin` subpath）；鉴权投影、对称 RPC、真实握手 context 均未完成——**别把它当稳定 API 引用**。

## 锚点

- `packages/coding-agent/src/experimental/services/README.md`（入口文档）
- `packages/server/src/types.ts:47/:52`、`src/session-router.ts:34`、`src/server.ts:280`（`TODO_CONTEXT`）
- `packages/chord/src/facets/host.ts:423`（`FacetHost.reload()`）
- `packages/protocol/src/protocol.ts:5`（`PROTOCOL_VERSION = 8`）
- 状态：experimental，source-only（#9132），CHANGELOG 空
