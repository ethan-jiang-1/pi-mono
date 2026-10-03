# durable（Pico5）与存储后端：session 事实层的契约 + 接盘的运行时

## 它解决什么问题

多进程架构里，"session 里发生了什么"必须有一个不依赖任何进程存活的**事实定义**：什么是一次提交、什么状态对外可见、fork/abort 后哪些记录有效。`@earendil-works/pi-durable` 把这些写成 record contracts 和一条 normative spec。

v1.0.0 起它不再只是契约层：pi-agent-core 的 harness/session/pico3 被删除后，durable 成为**唯一**的持久会话运行时——src 从 13 个文档壳文件长到 60 文件（+51.2k 行），Packages 15–23 全落地（task runtime、首个 chat/tool turn、inbox/usage/view、结构化并发、compaction、extensions + per-conversation agent、lifecycle conformance、task graph view）。v0.86.x 的独立后端包 `session-backends` 也被它吸收（见下文 SQLite 章节）。

## 契约（硬事实）

公开 API 面已不小（`packages/durable/src/index.ts`，181 行）：`Harness` + `createRegistry` + `defineTask`/`defineExtension`/`defineTool` + 内置 docs（`AgentDoc`/`InboxDoc`/`UsageDoc`/`LiveDoc`/`ConversationView`）+ 全套 record 类型 + `MemoryStorage`。subpath exports：`./env`、`./env/node`、`./tools`（内置 `CodingTools` 扩展：read/write/edit/bash）、`./storage/memory|jsonl|jsonl/node|sqlite|sqlite/node`、`./testing`（`packages/durable/package.json:8-70`）。依赖只有 chord、pi-ai、diff、typebox。

**真正的规范是 `packages/durable/docs/spec.md`（4,601 行，normative；前身 `docs/pico-v5.md` 在 1.0.0 发布整形 eaa8b0d06 中改名，npm 不再随包发布 docs/）**，开头引用块即核心规则：

> "A Session atomically commits immutable entries, full task records, and Chord-tracked documents. Only committed state is observable."

关键不变量（§1，`spec.md:46`，已从 5 条扩到 8 条）：

1. 一次 Session commit 原子覆盖 records + documents；
2. document 更新**只在 storage commit 成功后发布**（没有 volatile 发布路径）；
3. 所有可见进度都是持久的；
4. 外部 effect 不进 mutation transaction；
5. entry/ID 不可变不复用；
6. **document draft 在事务回调结束后整体吊销**（写入 draft 的值按值拷贝且必须是 strict JSON）；
7. mutation line 持有直到 storage settlement 与 committed-state adoption 完成（commit/close observer 只同步捕获不可变状态，用户回调 off-line 后跑）；
8. **不确定的 storage 失败对 Session 是 fatal**，必须重开。

章节地图：terms/invariants（§1）、core records（§2）、documents（§3）、transactions（§4）、tasks（§5）、submissions and inbox（§6）、**extensions/hooks/tools/system prompt**（§7，新增）、built-in tasks（§8）、document observation 与 Chord（§9）、storage contract（§10）、backends（§11：Memory/SQLite/JSONL **三个都已实现**，不再是前瞻）、API footguns（§12）、non-goals（§13）。

### Record 类型（`src/types.ts`，1,085 行）

- `Id`/`Seq`：session 全局数字 ID / 单调 commit 序号；`ROOT_CONVERSATION_ID = 1`（`types.ts:39`）。
- `ConversationRecord`：fork 源（`parent.conversationId` + `at`）与 owner 边（授权/子树 abort）。
- `EntryRecord`：不可变 transcript 事件；model-facing `messages` 与 application-facing `data` 分离；支持 `edits: ContextEdit[]`（上下文覆盖）与 `head`（active context 起点）。
- `TaskRecord`/`TaskState`/`SubmissionRecord`（requestId 会话内去重）、`StoredError`（JSON-safe 错误快照）。
- `DocumentRecord`（`types.ts:555`）：incarnation ID + `kind`/`key` + createdAt/retiredAt Seq + scope（session 级或 conversation 级，后者带 fork 语义）。
- `Storage`/`StorageWrite`/`Page`/`Cursor`：后端实现面。

### 运行时面（v1.0.0 新增主线，硬事实）

- **task runtime**：`defineTask`（`src/tasks.ts:4`）；registry 持有内置任务 Generation/Tool/Compaction（`src/harness/registry.ts:10`），应用经 `createRegistry()`（`registry.ts:112-114`）创建——`Harness.open` 校验注册表缺内置任务即抛错（`src/harness/harness.ts:407-432`）。
- **结构化并发**：`TaskScheduler` 串行化于 Session line，任务/会话构成一棵 ownership 树，abort 级联 + `completing` hold（`src/harness/scheduler.ts`，1,337 行）。
- **compaction**：`CompactionTask`（`src/harness/compaction.ts:102`）+ `selectCut`（`:253`）；重试/压缩默认策略在 `src/harness/agent.ts:18-30`。
- **extensions**：`defineExtension/defineTool/section/hook/wrapTool/wrapSection`（`src/harness/define.ts:6-43`）；安装制 registry：`install/uninstall` 按名替换/移除（`registry.ts:73-86`）；`Extension` 类型（`src/harness/types.ts:257`）。工具按会话 `pi.agent` 的 tools filter 解析。
- **per-conversation agent 文档**：`pi.agent`（`AgentDoc`，`src/harness/agent.ts:36-44`，scope conversation、history rewindable、fork asOf）；`resolveSettings` 合并重试/压缩/stream/steering 默认值（`agent.ts:47-58`）；Conversation 上 `agent()/configure()`（`harness.ts:91-97`）。
- **inbox/usage/view**：`InboxDoc`（`pi.inbox`，`src/harness/inbox.ts:16`）、`UsageDoc`（`pi.usage`，`src/harness/usage.ts:14`）、`ConversationView`（活跃 transcript + 内置 docs 的结构化 mount，`src/harness/view.ts:25`）。
- **task graph view**：`Harness.taskGraph()` / `watchTaskGraph()`（`src/harness/harness.ts:296-302`），内部 `TaskGraphView`（`src/harness/task-graph.ts:62`，类型 `:19-49`），从 commit publication 推进 owner 边/committed status。
- **conformance**：`src/testing/storage-conformance.ts`（1,583 行）+ benchmark，经 `registerStorageConformance`（`src/testing/runner.ts:12`）接入任意 Vitest/Jest 兼容 runner。

### MemoryStorage（`src/storage/memory.ts:219`，810 行）

detached in-memory 实现：conversations/entries/tasks/submissions/documents 五类记录 + 按 status 索引 tasks、按 requestId 去重 submissions、documents 按 scope/addr 索引。`prepareCommit()` 先 `clone + freeze` 分离出 detached writes 再校验（`memory.ts:250-273`），读写值与内部结构脱钩——刻意模拟 SQLite 编解码 / JSONL 序列化天然形成的所有权边界。它是 spec §11.1 的参考语义与 conformance 基线。

## sqlite：内置第二后端，异步化（取代已删除的 session-backends/sqlite-node）

v0.86.x 时 SQLite 后端是独立包 `@earendil-works/pi-session-backend-sqlite-node`（lease/ancestry 校验那套同步实现）；1.0.0 整包删除且全仓 changelog 零记录，能力由 `packages/durable/src/storage/sqlite/` 重新实现（PR #10232 线：f3e68e8ea → cd0ba2fab → 77ac62f22 → ed391c4f0），并且**从同步 API 改成异步可移植架构**：

- **可移植异步接口**：`sqlite/database.ts:11-16` 定义 `SqliteExecutor`（`exec/run/get/all`，全部返回 Promise，按 SQL 文本 + 位置绑定执行）；`database.ts:35-38` 定义 `SqliteDatabase`（`transaction(cb)` 传事务句柄 + `close()`）。契约写明：适配器必须把其他操作/事务排队到事务之后、回调内调用 db 自身会永久等待、回调拒绝必须 ROLLBACK 后以原错误拒绝，ROLLBACK 失败须换成不同错误（如 AggregateError）。
- **串行队列 + barrier**：`sqlite/node.ts:27-70` `SerialOperationQueue`；空闲时立即执行，异步操作在启动**前**先发布 barrier（`runAsync`，`node.ts:40-56`），使事务回调里的同步调用也排在它后面——这是 ed391c4f0 的 harden 点。
- **per-connection statement cache**：`node.ts:76-115` `NodeSqliteExecutor` 持 `Map<string, StatementSync>`，`statement()` 按 SQL 文本缓存（`node.ts:107-114`）；事务句柄 `NodeSqliteTransaction`（`node.ts:117-129`）与数据库共享同一张缓存表，句柄失活后调用抛 "SQLite transaction handle is no longer active"（`:126`）。
- **事务**：`BEGIN IMMEDIATE` → 回调（传句柄）→ `COMMIT`；失败 `ROLLBACK`，回滚也失败抛 `AggregateError`（`node.ts:140-159`，`:154`）。
- **close 两层语义**：适配器层 `NodeSqliteDatabase.close()` 排队执行、清空 statement cache、`PRAGMA wal_checkpoint(TRUNCATE)` 后关库（`node.ts:161-172`）；存储层 `SqliteStorage.close()` 共享一个 closing promise（`sqlite/storage.ts:506-512`），`closeDatabase()` 等待已放行的多查询读（`admitRead` + `admittedReads` 计数，`storage.ts:514-535`）再关库，防止后继查询打到已关闭的数据库；单查询读与事务天然被数据库队列排在 close 之前。
- **打开配置**：WAL + `synchronous=NORMAL` + `wal_autocheckpoint`（默认 1,000 页）、busy timeout 默认 5,000 ms（`node.ts:16-17,180-202`）；`openNodeSqliteStorage`（`node.ts:205-210`）。
- schema：STRICT 表 + JSON record 列；`durable_metadata.next_id` 用 TEXT 规避超安全整数（`sqlite/migrations.ts:8-14`）。
- JSONL 后端同包内置：`storage/jsonl/`（845 行存储 + `openNodeJsonlStorage`），main.jsonl sidecar 回收见 spec §11.3。

## 相关但独立的协议线

- **CBOR 协议线**：`packages/protocol` `PROTOCOL_VERSION = 8`（`src/protocol.ts:5`，v0.86.1→1.0.0 范围内无任何 commit 触碰该常量），CBOR 编解码在 `src/cbor/`，consumer 在 `packages/client`（`src/connection.ts:4-9`）。experimental client/server 的 socket 传输走这条线。协议与客户端在本轮完全被动——只随 chord/上游重版本，源码零变化。

## 锚点

- `packages/durable/docs/spec.md`（4,601 行，normative；§1 `spec.md:46`，§11 backends `spec.md:4371`）
- `packages/durable/README.md`（597 行，26 节 experimental usage guide；`README.md:3` "Experimental" 横幅）
- `packages/durable/src/types.ts:555`：`DocumentRecord`；`types.ts:39`：`ROOT_CONVERSATION_ID`
- `packages/durable/src/storage/memory.ts:219`：`MemoryStorage`；`memory.ts:250-273`：`prepareCommit` 分离
- `packages/durable/src/storage/sqlite/database.ts:11-16`（`SqliteExecutor`）、`:35-38`（`SqliteDatabase` 契约）；`sqlite/node.ts:27-70`（`SerialOperationQueue`）、`:76-115`（statement cache）、`:140-159`（事务）、`:161-172`（close）、`:205-210`（`openNodeSqliteStorage`）；`sqlite/storage.ts:506-535`（close 两层语义）；`sqlite/migrations.ts:8-14`（STRICT + TEXT next_id）
- `packages/durable/src/harness/harness.ts:296-302`（`taskGraph/watchTaskGraph`）、`:407-432`（`Harness.open`）
- `packages/durable/src/tasks.ts:4`（`defineTask`）；`harness/define.ts:6-43`（extension 定义器）；`harness/registry.ts:73-86`（install/uninstall）；`harness/view.ts:25`（`ConversationView`）
- `packages/durable/src/testing/runner.ts:12`：`registerStorageConformance`
- `packages/durable/package.json:8-70`：subpath exports；`:72-76`：files 无 docs
- `packages/durable/docs/pico-v5-handoff.md`（实现顺序）、`pico-v5-chord-usage.md`（canvas/diff-review/task-observation **扩展模式示例**，非内置服务）、`chord-delta-findings.md`（delta 评审发现）——与 spec.md 并存于 docs/
- `packages/agent/package.json:8-14`：pi-agent-core exports 只剩 `.`（pico3/harness/node 子路径已删）
- `packages/protocol/src/protocol.ts:5`：`PROTOCOL_VERSION = 8`
- 状态：experimental（README 自带横幅）；CHANGELOG 已重置为 1.0.0 "Initial release" 一条，0.87.0–0.99.2 的 16 条 Breaking 历史只存 git
