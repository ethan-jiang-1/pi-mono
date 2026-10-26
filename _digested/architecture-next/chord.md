# chord：应用组合运行时（v1.4.0）

> **本页基线：v1.4.0（`4a080252f`）。** 本页在 v1.4.0 重写：旧版本（v1.2.0 的 chord2 重写）是一份"哪些 API 失效了"的清单，v1.2.0→v1.3.0 之间 chord 又把公开面整体画了一遍（`Ref`/placement/async get/协议 4），旧清单本身也过期。变更史见 [_change_log/0010](../_change_log/0010-v1.2.0-to-v1.4.0.md)。

> **依赖关系（硬事实，注意与 chord 自己的 spec 冲突）**：v1.4.0 的 chord 依赖 **`typebox` + `@earendil-works/pi-telemetry`**（`packages/chord/package.json:87-90`），因为 `Context.telemetry` 需要 `TelemetrySpan`。`docs/spec.md:6` 仍写 "no other Pi packages"——那是过时陈述。消费者只有 `packages/durable` 与 `packages/env`（各自 pin `"@earendil-works/chord": "1.4.0"`）；`packages/coding-agent` 不依赖 chord。

## 它解决什么问题

一个应用 feature（一组对象 + 一块 UI + 一份共享状态）要同时跑在多个环境里（主进程、子进程、浏览器、远程 host）。每个环境写一份胶水会漂移。chord 把"对象怎么被找到、怎么被调用、状态怎么同步、代码怎么热替换"做成通用机器。

它不负责 UI、不负责持久化、不负责业务——只负责组合。

## 核心机制

### 契约：四种契约形态 + placement

`local` / `remote` / `method` / `opaque`（`src/contract.ts`）。契约是运行期值（TypeBox schema），既用于类型推导，也用于 fingerprint。

**v1.3.0 起 remote 契约必须声明对象在哪台 host 上**（placement）：

```ts
remote("session", { input, host: hostNamed("server"), ... })
remote("session", { input, host: hostFamily("session:", "session"), ... })
```

`hostNamed` 给固定 host 名，`hostFamily` 用 "前缀 + input 的某个必填字符串字段" 拼 host 名（`contract.ts:50-82,103-108`）。`GetOptions.at` 已删除——调用方不再指定 host，`get` 归一化 input 后按 placement 解析。

placement 进入 description 与 fingerprint；`accepts` 适配器不能跨 placement 桥接。serve 一个不属于本机的类型会被拒（`host.ts:455-458`），hold 一个错位地址也会被拒（`connection.ts:899-902`）。

### object / reference / lifetime

- **object**：按 `(type, canonicalInput, principalKey, contractFingerprint)` 稳定标识，持 state cells / resources / listeners / tasks，**跨 reload 存活**。旧文档叫 record，源码文件叫 `object.ts`（`record.ts` 已删）。
- **reference（`Ref`）**：`get`/`hold` 的返回值，late-bound；`RefStatus` 是它的状态。
- **lifetime**：`"referenced"`（默认，第一个 `get` 创建，最后一个 reference 释放后 dispose）或 `"host"`（facet 加载时创建，host 关闭或 reload 移除 facet 时销毁；只允许无必填 input 的 local 类型，且不能与 `linger` 同用）（`Lifetime` 定义 `object.ts:76`，两个分支 `:51`/`:59`）。
- **linger**：provider 对象在最后一个 reference 释放后再保留一段时间；consumer 侧的远程 binding 也有 `HostOptions.linger`（按 type，cap 默认 4）（`host.ts:138-144`）。

### principal 由应用注入

chord **不发明 principal**：

- `createHost<P>({ self })`（`host.ts:251`）：`self` 是必填项（`HostOptions.self`，`:121`），表示 host 自己代码的 principal。
- `connect(link, { principal })`：父 host 的请求以谁的身份发出（`host.ts:154-157`）。
- `Route.principal`、`accept({ principal })` 同样必填。

host 自己的 principal 按 `principalKey` 识别（不是对象身份）。`createHost<P>`/`defineFacet<P>`/`Serve<P>` 等泛型让工厂、方法、监听器、任务都能直接收窄到应用的 principal 类型。

### 状态：cell、init 与按 variant 的 state

- `self.state(name, schema, initial, { version?, migrate? })` 返回一个 cell；cell 的版本与迁移是**每个 cell 自己的**，`ServeOptions.state` 的全局版本已删除。
- `self.state(name, schema, { init }, options?)`：第一次值由 `init(ctx)` 提供。init 在 resources open、references live 之后、对象 live 之前跑，保证没有方法/监听器/任务看到中间值；reload 保留 cell 不重跑 init，新增 cell 在 prepare 阶段跑（`object.ts:151-153,164-171`）。
- state 成员类型是 `T`（v1.2.0 是 `T | undefined`）。未 hydrate 读会抛 `not_ready`，不在当前 variant 抛 `not_in_variant`。
- 远程 reference 按 `variant` 判别联合；跨 variant 的成员必须先收窄。
- 其余声明式设施：`self.resource(name, { version, deps?, exclusive?, open, close? })`、`self.on(name, source, [select,] handler)`、`self.derive(sources, fn)`、`self.task(fn)`。

### get 是 async 的

`ctx.get` 与 `host.get` 返回 `Promise<Ref>`：等 reference live **且该 variant 的每个 state 成员都有首个快照**才 resolve；超时抛 `unavailable/ready_timeout`（`HostOptions.readyTimeout` 默认 60 s，`host.ts:203-212,907`）。失败只释放那一个 reference。

- 同步形态是 `host.hold`（可能处于 `loading`），给 UI 运行时用。
- `self.get` 保持同步：对象只有在 references ready 且 hydrate 完成后才 live。
- `GetOptions.state: false` 得到"只要方法不要状态"的 reference。

### reload：两个 code version 并存

hot reload 仍是硬要求。host 同时保留两个 code version，reload 分 prepare/commit：

- 提交后旧版本的对象由 `retire` 流程退役：等旧 roots 结束，最多 `retireDeadline`（默认 5 s）；超时先 abort 旧 roots（reason `superseded`，给 1 s 宽限）再关只属于旧代码的资源（`reload.ts:256-278`）。
- 对象的 tasks 在新一轮启动前先停旧的：`HostOptions.taskStopDeadline`（默认 5 s），超时上报后照样启动（`host.ts:128-132`、`object.ts:1404-1434`）。
- `FacetApi.signal` 在该 run 被替换/移除、reload abort 或 host close 时 abort（`host.ts:75-80`）。prepare 期间旧、新 run 同时 live。
- 跨 reload 保留的 resource 在 commit 时采用最新声明（`object.ts:276-284`），旧代码闭包随之可回收。

## 通信：protocol 4

`PROTOCOL_VERSION = 4`（`src/wire.ts:24`）。v1.2.0 **没有**这个常量；它先以 2 引入，随后 2→3、3→4 两次 bump，全部发生在 v1.2.0→v1.3.0 之间；`wire.ts` 在 v1.3.0..v1.4.0 零改动。

- `hello` 带 protocol；**没有协议字段的旧 peer 视为 1，直接 mismatch**：`(frame.protocol ?? 1) !== 4` → `onProtocolMismatch({local:4,peer})` 并以 `protocol-version 4` 关闭（`connection.ts:832-835,654-663`）。没有协商。
- protocol 4 的帧形状：`hold` 隐含该 variant 的 state（`state:false` 退出，`sub` 再开，`unsub` 停）；provider 以 unit 应答（`shape.state` 列出 consumer 缺的成员，随后逐个 snapshot）；`state` 帧是 `{hold, m, as:"snap"|"reset"|"ops"|"error", value?}`；`resync` 要求重发；`again` 标记断链后的重 hold；`origin` 标识 client 连接（`wire.ts:74-140`）。
- **端到端流控**：peer 用 `ack` 帧确认已处理的帧（`hello.acks`），未确认帧超过 `LinkOptions.window`（默认 256 KiB）时 state 帧在发送端等待并按订阅合并；每个订阅的等待有界（`pendingCap`，默认 4 个窗口），超了变 reset（中继向下游发 `resync`）。call/result/控制帧**不受流控**，所以高负载下 result 可能先于它之前的 state 变化到达（`connection.ts:12-32,322-348,460-619`）。
- `AcceptOptions.maxCalls` 限制对端同时在途的调用数，超了直接回 `unavailable/too_many_calls`，link 不断。
- **打包**：JSON 超过 `PACK_THRESHOLD`（64K 字符，`link.ts:113`）的 call 参数/结果/state 快照走 deflate；IPC 用 base64 字段，WebSocket 用二进制 envelope；中继原样转发，使用方解压。`webSocketLink(socket, { compress, acceptPacked })` 控制开关（签名 `link.ts:414`，选项类型 `:354-359`）。
- 同一对象的多个远程 reference **共享一个 binding**（一次 hold、每个 state 成员一条 stream、call 复用同一 hold），各自只保留 status/observer/release（`remote.ts:70-80`）。

## 附属面

| 子路径 | 内容 |
|---|---|
| `@earendil-works/chord/output` | `OutputBuffer`（head/tail 窗口）、`Progress`（按大小节流的提交）、`ProgressClock`、`boundOutput`/`sanitizeOutput`/`characterEnd`/`utf8ByteLength`（v1.3.0 从 durable 迁入，`output.ts`） |
| `@earendil-works/chord/sqlite` | `SqliteDatabase`/`SqliteExecutor`/`SqliteValue`、迁移 runner（带"库版本比代码新就拒绝"的守卫）、schema prefix 校验 |
| `@earendil-works/chord/sqlite/node` | `NodeSqliteDatabase`、`openNodeSqliteDatabase`（串行队列、statement cache、WAL、busy timeout） |
| `@earendil-works/chord/sqlite/cloudflare` | `DurableObjectSqliteDatabase` |
| `@earendil-works/chord/telemetry-sqlite` | `createSqliteTelemetry`：`SqliteTelemetry` 同时实现 `TelemetryContext` 与 `TelemetryStore` |
| `@earendil-works/chord/node` | `nodeLoader` + host manager（fork driver、processLock、control channel） |

`./delta`（JSON delta 引擎）自 v0.86.x 起是唯一实现（不可变 tracker），本页不重复；见 `src/delta/README.md`。

## 为什么值得记

- 它是 monorepo 里**唯一通用运行时**：不服务于 Pi 的业务，durable 与 env 只是它的消费者。
- v1.4.0 的 chord 已经不是一个零依赖的独立库：它把 telemetry 作为运行时的必需上下文，同时把 sqlite 驱动下沉给它——这两件事让 chord 变成"基础设施的公共底座"。
- 读 Pi 源码时遇到 chord，注意三点：(1) 术语是 object/reference/placement，不是旧的 record/handle/service；(2) 协议 4 与旧 peer 不互通；(3) 自定义 `Context` 必须提供 `telemetry`。

## 锚点

- `packages/chord/package.json`：**10** 条 exports（`.`、`./context`、`./output`、`./delta`、`./node`、`./sqlite`、`./sqlite/node`、`./sqlite/cloudflare`、`./telemetry-sqlite`、`./package.json`）、依赖 `typebox` + `@earendil-works/pi-telemetry`
- `packages/chord/CHANGELOG.md`：1.2.0 / 1.3.0 / 1.4.0 三段（1.3.0 是 Breaking 集中版）
- `packages/chord/docs/spec.md`（协议与语义的规范文本，§1 概念、§2 contracts、§5 lifetime、§7 reload、§9 hosts and links、§10 host manager、§11 测试覆盖、§12 已知限制）；`docs/spec.md:6` 的"无其它 Pi 包"已过时
- `packages/chord/src/host.ts`（1,303 行）、`contract.ts`、`object.ts`、`connection.ts`、`wire.ts`、`link.ts`、`reload.ts`、`remote.ts`
- `packages/chord/README.md`（202 行）
- 状态：experimental（`docs/spec.md` 自述"文档与代码不一致是 bug"）。
