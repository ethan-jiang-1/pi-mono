# durable（Pico5）与存储后端：session 事实层的契约

## 它解决什么问题

多进程架构里，"session 里发生了什么"必须有一个不依赖任何进程存活的**事实定义**：什么是一次提交、什么状态对外可见、fork/abort 后哪些记录有效。`@earendil-works/pi-durable` 把这些写成 record contracts 和一条 normative spec。

## 契约（硬事实）

公开 API 极小（`packages/durable/src/index.ts:1-23`）：`MemoryStorage` + `ROOT_CONVERSATION_ID` + 全套 record 类型。README 只有 15 行索引——**真正的规范是 `packages/durable/docs/pico-v5.md`（2031 行，normative）**，开头引用块即核心规则：

> "A Session atomically commits immutable entries, full task records, and Chord-tracked documents. Only committed state is observable."

关键不变量（§1）：

1. 一次 Session commit 原子覆盖 records + documents；
2. document 更新**只在 storage commit 成功后发布**（没有 volatile 发布路径）；
3. 外部 effect 不进 mutation transaction；
4. entry/ID 不可变不复用；
5. **flush 后失败（含 checkpoint/storage 失败）对 Session 是 fatal**，必须重开。

章节地图：records（§2，含 context override `ContextEdit`）、documents（§3：生命周期/mutation ownership/bases+checkpoints/forks）、transactions（§4）、tasks（§5：状态机、effect sandwich、scheduler/abort）、inputs/inbox（§6）、hooks/tools/system sections（§7）、built-in tasks（§8）、document observation 与 Chord（§9）、storage contract（§10）、backends（§11：Memory / SQLite / JSONL）、API footguns（§12）、non-goals（§13）。注意 §11 的 JSONL backend 仓库里不存在，spec 前瞻；已实现的是 Memory 与 SQLite。

### Record 类型（`src/types.ts`，362 行）

- `Id`/`Seq`：session 全局数字 ID / 单调 commit 序号；`ROOT_CONVERSATION_ID = 1`。
- `ConversationRecord`：fork 源（`parent.conversationId` + `at`）与 owner 边（授权/子树 abort）。
- `EntryRecord`：不可变 transcript 事件；**model-facing `messages` 与 application-facing `data` 分离**；支持 `edits: ContextEdit[]`（对更早 entry 的 omit/replace 上下文覆盖）与 `head`（active context 起点）。
- `TaskRecord`/`TaskState`/`Input`（`requestId` 会话内去重）、`StoredError`（JSON-safe 错误快照）。
- `DocumentRecord`（types.ts:219）：incarnation ID + `kind`/`key` + createdAt/retiredAt Seq + scope（session 级或 conversation 级，后者带 fork 语义）。
- `Storage`/`StorageWrite`/`Page`/`Cursor`：后端实现面。

### MemoryStorage（`src/memory-storage.ts:112`）

372 行 detached in-memory 实现：四张表（conversation/entry/task/input）+ 按 status 索引 tasks、按 requestId 去重 inputs；读出值深拷贝（保留 null-prototype），与内部结构脱钩。它是 spec §11.1 的参考后端与 conformance 基线。

## sqlite-node：第一个真实后端

`packages/session-backends/sqlite-node`（包名 `@earendil-works/pi-session-backend-sqlite-node`），59 commits 从零建成，四个 release 的 CHANGELOG 节全空。要点：

- **事务**：apply commit 走 `BEGIN IMMEDIATE`，跨表唯一 ID 用 SQLite triggers 强制。
- **会话语义**：lease 生命周期与续租；fork 必须显式命名 branch 并**校验 ancestry**；跳过 corrupt sessions；`databasePath`/`sessionId` 分片。
- **质量**：conformance suite（`test/storage-conformance.test.ts`、`repo-conformance.test.ts`）对照 chord/pi-agent-core 合约，另有 benchmark。

## 相关但独立的两个面

- **pico3 kernel（agent 侧）**：`packages/agent/src/harness/pico3/`，export 为 `@earendil-works/pi-agent-core/experimental/pico3`（`packages/agent/package.json` exports）。这是 harness 内的 agent kernel（turn/scheduler/retention/jsonl storage），coding-agent 的 `experimental/micro/` 以它为底座（`micro/api.ts:1`）。它与 durable 的 Pico5 contracts 是"kernel"与"durable 事实层"的配套，不是同一个东西。
- **CBOR 协议线**：`packages/protocol` `PROTOCOL_VERSION = 8`（`src/protocol.ts:5`），CBOR 编解码在 `src/cbor/`，consumer 在 `packages/client`。experimental client/server 的 socket 传输走这条线。

## 锚点

- `packages/durable/docs/pico-v5.md`（2031 行，normative；§1 入口）
- `packages/durable/src/types.ts`：record contracts；`DocumentRecord`（L219）
- `packages/durable/src/memory-storage.ts:112`：`MemoryStorage`
- `packages/durable/docs/pico-v5-handoff.md`（实现顺序）、`pico-v5-chord-usage.md`（canvas/diff-review/task-observation **扩展模式示例**，非内置服务）、`chord-delta-findings.md`（delta 评审发现）
- `packages/session-backends/sqlite-node/src|test`
- `packages/agent/package.json` exports：`./experimental/pico3`
- `packages/protocol/src/protocol.ts:5`：`PROTOCOL_VERSION = 8`
- 状态：experimental，source-only（#9132）；durable CHANGELOG 仅 0.86.0 一条 initial Added，其余空
