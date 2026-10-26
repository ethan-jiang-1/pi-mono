# experimental server 栈的移除（v1.2.0）

## 本页状态：整页作废，保留为删除记录

本页此前描述 `packages/server`（薄路由层）、`packages/protocol`（CBOR 协议线）、`packages/client`（传输中立客户端）与 `packages/coding-agent/src/experimental/services/` 组成的**远程会话产品线**：多进程架构下 TUI 通过 chord 服务订阅 replicated `Transcript`，session worker 持 Harness + SQLite。

**该产品线在 v1.2.0 被整体删除**，本页原引用的每一个路径都已不存在：

| 原引用路径 | v1.2.0 状态 |
|---|---|
| `packages/server/`（含 `src/types.ts`、`session-router.ts`、`server.ts`、`errors.ts`、`transports/unix/`） | 删除 |
| `packages/protocol/`（`src/protocol.ts`，`PROTOCOL_VERSION = 8`） | 删除 |
| `packages/client/` | 删除 |
| `packages/coding-agent/src/experimental/services/`（README 与全部切片） | 删除 |
| `packages/coding-agent/src/experimental/session-catalog.ts`、`session-worker.ts` | 删除 |
| `packages/coding-agent/src/experimental/durable/`（durable TUI） | 删除 |
| `packages/chord/src/facets/host.ts`（`FacetHost.reload()`） | 删除（chord2 重写，见下） |

删除提交：`7472cda0d` — *remove the experimental server stack and the client, protocol, and server packages*，**161 文件、+32/−21,561 行**。`packages/coding-agent/src/experimental/` 目录仅存一个无关文件 `source-resolver.ts`。

## 为什么整页作废而不是局部更新

原页面的论证结构建立在三个当时成立的设定上，三个都不再成立：

1. **多进程是这套架构的存在理由**。原页结尾自己指出「durable TUI 入口是单进程版同一套事实层，说明这层架构不强制多进程」——上游的选择是**收敛到单进程**：整个 `experimental/durable/` TUI 一并删除，而不是保留两条产品线。
2. **chord 是"语言"，server 是"交换机"**。`packages/server` 依赖 `@earendil-works/chord` + `@earendil-works/pi-protocol`；`pi-protocol` 删除后 server 无传输契约可用。
3. **业务语义在 `experimental/services/`**。该目录连同其 README（原页称之为"能力缺口的权威清单"）整体消失，"被删能力清单"里的 navigate/nextRun/resume/subagents/transcript 分页等待重设计项随之失去载体。

因此本页的结论（协议栈形状、SessionRouter fencing、worker/sqlite 布局、切片表）全部作废，不能靠改链接修复。

## chord 同时被重写（相关但独立的变化）

`packages/chord` 在本区间经历 chord2 重写（`0104fef1e` — *replace the facet and service runtime with the chord2 host runtime*，85 文件、+14,743/−8,921）：

- `src/facets/host.ts` 的 facet/service 运行时被 `src/host.ts`（1010 行）的 **typed host runtime** 取代；`src/` 变平（`contract.ts`、`record.ts`、`reload.ts`、`registry.ts`、`remote.ts`、`websocket.ts` 等）。
- exports 由多子路径收敛为 `.`、`./context`、`./delta`、`./node`、`./package.json`（v1.4.0 又增 `./output`、`./sqlite*`、`./telemetry-sqlite`）——**`./facets` 与 `./bundler` 子路径不再存在**，`esbuild` 依赖移除；v1.4.0 依赖为 `typebox` + `pi-telemetry`。
- 新增 `docs/{guide,spec,tutorial}.md` 与 `CHANGELOG.md`；删除 `PLANNING.md`。
- 硬约束自述（`docs/spec.md:5-9`）：运行时只依赖自身 `delta` 模块、Node/浏览器内建与 `typebox`，**不依赖任何其它 Pi 包**。

chord 的消费者也随之收窄：v1.2.0 只有 `packages/durable` 与 `packages/env` 依赖它，**`packages/coding-agent` 不再依赖 chord**。

## 对扩展作者的意义

- **不要引用这套栈**。它不在 v1.2.0 的任何发布包里，也不在源码树里；`PI_EXPERIMENTAL=1 ./pi-test.sh server` 入口与其环境变量（`PI_SERVER_DIR`、`PI_SERVER_ID`）、`*_CONTEXT` 占位均不存在。
- **扩展面对的是进程内扩展点**，不是远程服务订阅。`ExtensionAPI`、工具注册、`ctx.hasUI` 等机制与这套被删栈无关（见 `_pi_extension_agent_ready_development/repo-harness/04-extension-points-map.md`；跨语料，不建链接）。
- **若需要一个 Pi 之外的 host runtime**：`@earendil-works/chord` 仍是独立、可发布的通用运行时（无 Pi 依赖），但 API 是 chord2 形状——v1.0.3 的 facet/service 代码**不兼容**。
- **durable 仍是发布包**且自带 experimental 横幅；它是被删栈所依赖的持久化层中**唯一存活**的部分。

## 锚点

- 删除提交：`7472cda0d`（`git show 7472cda0d --stat`）
- chord2 重写提交：`0104fef1e`（`git show 0104fef1e --stat`）
- v1.2.0 的 chord 形状：[`packages/chord/package.json`](../../packages/chord/package.json)、[`packages/chord/src/host.ts`](../../packages/chord/src/host.ts)、[`packages/chord/docs/spec.md`](../../packages/chord/docs/spec.md)
- v1.2.0 现存包清单：[`packages/`](../../packages/)（11 个）
- 状态：**本页为历史删除记录，不描述 v1.2.0 的现存机制**；引用时只可用于"什么被删了、为什么"。
