# durable（Pico5）与存储后端：session 事实层的契约 + 接盘的运行时

> **本页基线：v1.4.0（`4a080252f`）。** v1.2.0 时 durable 的定位是"进程内被 coding-agent 消费的运行时与契约上游"；v1.4.0 起多了两条硬约束：**等待变成持久任务状态**（`sleeping`，SQLite schema 升到 2 且不可回退），以及 **SQLite 驱动下沉到 `@earendil-works/chord/sqlite`**（durable 只剩存储语义与自有迁移）。契约本身（原子提交、record 类型、storage backends、ExecutionEnv）不变。

## 它解决什么问题

"session 里发生了什么"必须有一个不依赖任何进程存活的**事实定义**：什么是一次提交、什么状态对外可见、fork/abort 后哪些记录有效。`@earendil-works/pi-durable` 把这些写成 record contracts 和一条 normative spec。

v1.0.0 起它不再只是契约层：pi-agent-core 的 harness/session/pico3 被删除后，durable 成为**唯一**的持久会话运行时。src 从 13 个文档壳文件长到 60 文件（+51.2k 行）；v0.86.x 的独立后端包 `session-backends` 也被它吸收。v1.0.0→v1.0.3 的增长点几乎全在**执行环境契约层**（`src/env/`），v1.0.3→v1.2.0 新增 `src/codemode/`、`src/tool-search/`、`src/images/`（82 文件）。

**v1.2.0→v1.4.0 再增长到 85 文件**（108 文件被改，+7,966/−2,203）。这一轮不是加能力面，而是**改运行时语义**：sleep/wake、crash-loop guard、假时钟、IndexedDB 后端、telemetry；同时把 sqlite 驱动整体移交 chord。叙事仍是"会话事实层 + 执行环境契约层 + 确定性代码执行层"，但"等待"从实现细节变成了契约的一部分。

## 契约（硬事实）

公开 API 面已不小（`packages/durable/src/index.ts`，216 行）：`Harness` + `createRegistry` + `defineTask`/`defineExtension`/`defineTool` + 内置 docs（`AgentDoc`/`InboxDoc`/`UsageDoc`/`LiveDoc`/`ProviderDoc`/`ConversationView`）+ 全套 record 类型 + `MemoryStorage`。`ProviderDoc`（kind `pi.provider`，`src/harness/provider.ts:12`）是 provider 侧会话身份：scope conversation、**fork: "initial"**（每个 fork/子会话拿到全新 UUIDv7 而不是继承父身份），请求前经 `ensureProviderSessionId` 惰性读取，无该文档的 legacy 会话在首次请求前做一次 migration commit 回填。subpath exports：`./env`、`./env/node`、`./tools`（内置 `CodingTools` 扩展：read/write/edit/bash；另有 `createPowerShellTool`（`src/tools/bash.ts:168`），跨平台 argv exec 形式，**不自动安装**）、`./storage/memory|jsonl|jsonl/node|sqlite|sqlite/node|indexeddb`、`./testing`（storage conformance + **env conformance**）（`packages/durable/package.json`）。依赖：chord、pi-ai、pi-codemode、pi-telemetry、diff、typebox，以及 images 子路径用的 `@silvia-odwyer/photon`。subpath 还包括 `./codemode`、`./tool-search`、`./images`、`./images/node`、`./images/cloudflare`、`./storage/sqlite/cloudflare`。

**真正的规范是 `packages/durable/docs/spec.md`（**5,618** 行，normative；前身 `docs/pico-v5.md` 在 1.0.0 发布整形 eaa8b0d06 中改名，npm 不再随包发布 docs/）**，开头引用块即核心规则：

> "A Session atomically commits immutable entries, full task records, and Chord-tracked documents. Only committed state is observable."

关键不变量（§1，`spec.md:46`，v1.4.0 为 8 条）：

1. 一次 Session commit 原子覆盖 records + documents；
2. document 更新**只在 storage commit 成功后发布**（没有 volatile 发布路径）；
3. 所有可见进度都是持久的；
4. 外部 effect 不进 mutation transaction；
5. entry/ID 不可变不复用；
6. **document draft 在事务回调结束后整体吊销**（写入 draft 的值按值拷贝且必须是 strict JSON）；
7. mutation line 持有直到 storage settlement 与 committed-state adoption 完成（commit/close observer 只同步捕获不可变状态，用户回调 off-line 后跑）；
8. **不确定的 storage 失败对 Session 是 fatal**，必须重开。

章节地图：terms/invariants（§1）、core records（§2）、documents（§3）、transactions（§4）、tasks（§5）、submissions and inbox（§6）、**extensions/hooks/tools/system prompt**（§7，新增）、built-in tasks（§8）、document observation 与 Chord（§9）、storage contract（§10）、backends（§11：Memory/SQLite/JSONL **三个都已实现**，不再是前瞻）、API footguns（§12）、non-goals（§13）。

### Record 类型（`src/types.ts`，1,274 行）

- `Id`/`Seq`：session 全局数字 ID / 单调 commit 序号；`ROOT_CONVERSATION_ID = 1`（`types.ts:40`）。
- `ConversationRecord`：fork 源（`parent.conversationId` + `at`）与 owner 边（授权/子树 abort）。
- `EntryRecord`：不可变 transcript 事件；model-facing `messages` 与 application-facing `data` 分离；支持 `edits: ContextEdit[]`（上下文覆盖）与 `head`（active context 起点）。
- `TaskRecord`/`TaskState`/`SubmissionRecord`（requestId 会话内去重）、`StoredError`（JSON-safe 错误快照）。
- `DocumentRecord`（`types.ts:707`，v1.0.3 时为 `:555`）：incarnation ID + `kind`/`key` + createdAt/retiredAt Seq + scope（session 级或 conversation 级，后者带 fork 语义）。
- `Storage`/`StorageWrite`/`Page`/`Cursor`：后端实现面。

### 运行时面（v1.0.0 主线，v1.4.0 改状态机）

- **task runtime**：`defineTask`（`src/tasks.ts:4`）；registry 持有内置任务 Generation/Tool/Compaction（`src/harness/registry.ts:10`），应用经 `createRegistry()`（`registry.ts:112-114`）创建——`Harness.open` 校验注册表缺内置任务即抛错（`src/harness/harness.ts:538-563`）。
- **状态机（v1.4.0 变更）**：`pending | running | waiting | sleeping | completing | terminal`（完整定义 `src/types.ts:599-641`；`:219` 只是 `NextTaskState`）。`sleeping` 是 v1.4.0 新增：任务结束 phase 但不持 invocation，`until` 到点后从 checkpoint 继续；`TaskGraphState` 加 `{status:"sleeping"}`（`harness/task-graph.ts:29`），`TaskInspection` 加 `{kind:"sleeping",until}`（`harness/types.ts:688`）。`completing` 是既有中间态，别漏。
- **等待 API（Breaking）**：`TaskRuntime.sleep()` 删除。替代是 `sleepUntil(until, checkpoint, ctx)`（`types.ts:324-330`）或从 `commit()` 返回 `{status:"sleeping",until,checkpoint}`（`:217-220,622-631`）；相位内的节拍用 `setTimer(cb, delayMs)`（`:312-317`，不持久）。
- **crash-loop guard**：`settings.restartLimit` 默认 5（`harness/types.ts:572-577`、`agent.ts:57`）；`TaskRecord.restarts`（`types.ts:681-686`）在 open 时计数（`scheduler.ts:381-419`），达限 park（`blocked.reason="restart_limit"`），`Harness.retryTask(id)` 放行（`harness/types.ts:823`）。
- **时钟与唤醒**：`HarnessOptions.setTimer`/`now`（`harness/types.ts:640-647`）让 sleep、progress 节流、idle 回收都跑在宿主时钟上；`Harness.wake()`/`onWake`（`:648-656,790-796`）让 Cloudflare DO 这类宿主体眠、靠 alarm 唤醒。
- **失败后的队列策略**：`settings.afterFailedRun`（`:566-571`）= `keep`（默认）/`continue`/`withdraw`。
- **结构化并发**：`TaskScheduler` 串行化于 Session line，任务/会话构成 ownership 树，abort 级联 + `completing` hold（`src/harness/scheduler.ts`，2,507 行）。
- **compaction**：`CompactionTask`（`src/harness/compaction.ts:112`）+ `selectCut`（`:279`）；`settings.compaction.modelOverrides` 按 `"provider/modelId"` 给不同窗口的模型配阈值（`harness/types.ts:516-521`）；默认策略在 `src/harness/agent.ts:20-38`。
- **extensions**：`defineExtension/defineTool/section/hook/wrapTool/wrapSection`（`src/harness/define.ts:6-43`）；安装制 registry：`install/uninstall` 按名替换/移除（`registry.ts:73-86`）；`Extension` 类型（`src/harness/types.ts:365`）。
- **documents**：`defineDoc`/`defineDocFamily` 现在**必须**给 `checkpointWhen`（`types.ts:78`，提交时直接调用而非可选链：`session/transaction.ts:868`）；内置 doc 分别用 `()=>true`（agent/provider/usage/inbox/live）与 `()=>false`（tool/codemode）。
- **telemetry**：`HarnessOptions.telemetry`（`harness/types.ts:611`）接 `TelemetryContext`；`DURABLE_TELEMETRY_SCHEMA`（`harness/telemetry.ts:50`）定义 `pi.durable.submit`/`pi.durable.phase` 与三个 metric，phase 的 span 会透传给 pi-ai 请求（`harness/generation.ts:224-231`）。见 [5.3 Telemetry](../agent/05-Infra/5.3_Telemetry_Layer.md)。
- **inbox/usage/view**：`InboxDoc`（`pi.inbox`，`src/harness/inbox.ts:21`）、`UsageDoc`（`pi.usage`，`src/harness/usage.ts:14`）、`ConversationView`（`src/harness/view.ts:25`；挂载表含 `ProviderDoc`）。
- **task graph view**：`Harness.taskGraph()`/`watchTaskGraph()`（`src/harness/harness.ts:369-373`），从 commit publication 推进 owner 边/status，并把 `blocked` 原因暴露出来（`task-graph.ts:38-46`）。
- **conformance**：`src/testing/storage-conformance.ts`（1,682 行）+ benchmark，经 `registerStorageConformance`（`runner.ts:13`）接入任意 Vitest/Jest 兼容 runner；第二条线 `src/testing/env-conformance.ts`（633 行，`registerEnvConformance`，`runner.ts:28`）验证执行环境，被 `pi-env` 的 conformance/ssh-external 测试直接消费。

### MemoryStorage 与 IndexedDB

`MemoryStorage`（`src/storage/memory.ts:237`）是 detached in-memory 实现：五类记录 + 按 status 索引 tasks、按 requestId 去重 submissions、documents 按 scope/addr 索引；`prepareCommit()`（`:268`）先 `clone + freeze` 再校验，刻意模拟 SQLite 编解码/JSONL 序列化的所有权边界。状态索引现在也包含 `sleeping`（`:250`）。

`IndexedDbStorage`（`src/storage/indexeddb.ts:378`，`static open(name, options?)` `:390`）是 v1.4.0 新增的**第四个**后端（浏览器），经 `./storage/indexeddb` 子路径导出，不进根 index。

## sqlite：durable 保留存储语义，驱动下沉到 chord

v0.86.x 时 SQLite 后端是独立包 `@earendil-works/pi-session-backend-sqlite-node`；1.0.0 整包删除，能力由 `packages/durable/src/storage/sqlite/` 以**异步可移植**架构重新实现（PR #10232 线：f3e68e8ea → cd0ba2fab → 77ac62f22 → ed391c4f0）。**v1.4.0 又把驱动整体移交给 `@earendil-works/chord/sqlite`**（`packages/chord/CHANGELOG.md:13`），durable 只剩"存储语义 + 自有 schema 迁移"：

- **durable 侧只剩四个薄文件**：`sqlite/storage.ts`（`SqliteStorage` 的读写、`close()` 两层语义 `:589-612`、`admitRead` 计数）、`sqlite/migrations.ts`（durable 自己的 v1/v2 schema）、`sqlite/database.ts`（**1 行 type re-export**）与 `sqlite/node.ts`（22 行转发）。
- **驱动在 chord**：`SqliteExecutor`/`SqliteDatabase` 契约（`chord/src/sqlite/database.ts`）、串行队列 + barrier、statement cache、`BEGIN IMMEDIATE` 事务、`wal_checkpoint(TRUNCATE)`、WAL/busy timeout 配置（`chord/src/sqlite/node.ts`）、`DurableObjectSqliteDatabase`（`cloudflare.ts`）、`validateSqliteSchemaPrefix`（`schema.ts`）。
- **迁移 runner 也在 chord**，带版本下界守卫：库的版本 > 代码支持版本直接抛 `SQLite schema version N is newer than supported version …`（`chord/src/sqlite/migrations.ts:34-36`）。这就是"v2 之后不能回退到 1.3.0"的实现点。
- **schema v2（v1.4.0）**：重建 tasks 表放开 status 的 CHECK 约束以容纳 `sleeping`（`storage/sqlite/migrations.ts:91-115`：建 `tasks_v2` → `INSERT…SELECT` → `DROP` → `RENAME` → 重建 5 个索引）。**打开即迁移**（`storage.ts:170-171`），没有 opt-in。
- **namespacing（v1.3.0）**：`SqliteStorage.open(database, { prefix })` 给每张表/索引加前缀，供"与宿主表共库"的场景；Cloudflare DO 适配器对同一 storage 对象协调操作。JSONL 后端不变（`storage/jsonl/storage.ts` 846 行，目录 866 行；sidecar 回收见 spec §11.3）。

## ExecutionEnv：执行环境契约层（v1.0.3 大扩，硬事实）

v1.0.0 时 `src/env/` 只是"够 bash 工具用"的本地抽象；v1.0.3 一晚四连 feat 把它扩张成**带 conformance 的跨平台契约**，并沿这条线成为新包 `pi-env`（SSH 远程环境）的契约上游。接口面在 `src/env/index.ts`：

- **`ExecutionEnv extends FileSystem, Shell`**（`env/index.ts:374`，v1.0.3 时为 `:324`）。`FileSystem`（`:209`）覆盖 lstat/readdir/readFile/readRange/writeFile/appendFile/rename/mkdir/rm 等加上三个定位读/列举/watch 方法（见下）；`Shell`（`:359`）只有 `exec`（`:365`）+ `cleanup`，全部操作返回 `Result` 而非抛错。
- **argv exec**：`exec` 收 `command: string | readonly string[]`——字符串走环境 shell，数组直接 spawn 程序、**不经任何 shell 解析**（接口文档 `env/index.ts:358-372`；实现 `env/node.ts`，空 argv 报 `spawn_error`）。动机（spec §7）：宿主用数据（如文件名）拼命令时永远不必为某个 shell 做引号转义。
- **输出窗口**：`ShellExecOptions.window`（`:315`，v1.0.3 时为 `:266`；`ShellOutputWindow` `:322`：maxBytes/maxLines/minIntervalMs/bytesPerSecond）让环境知道调用方保留的尾部窗口，允许它省略窗口外的输出并经 `ShellOutputInfo.skipped`（`:347`）**精确报告省略量**（字节数/换行数/是否以换行结尾，`ShellOutputSkip` `:338`）。约束收得很紧：省略量必须比窗口多至少一字节或一行、后续输出全部在同一 chunk 送达——被省略的文本**永远不可能**进入保留尾部（spec `spec.md:2823-2839` 一带）。这是为慢链路（远程环境）设计的。
- **有界读**：`openBinaryReader()`（`:231`）对单个已打开普通文件定位读（文件被改名后读到的仍是打开时的那个文件，`noFollow` 拒绝末段符号链接）；`openDirReader()`（`:256`）目录分页列举（`DirReader.next` 契约 `:160-170`：中途消失的 entry 跳过）。`BinaryReader.scanLines()`（`:106`，未变；返回 `LineScan` `:140`）：环境内一次扫描定位并度量一段行，**解码语义与整文件解码完全一致**——实现（`LineScanner`，`env/line-scan.ts`）连同 `rangeDecoder()`/`StreamDecoder`/`startsWithBom`（`env/decode.ts`）一起从 `./env` 导出（`env/index.ts:376-377`），供其他环境（pi-env 的 daemon）复刻同样语义。
- **watch**：`FileSystem.watch()`（`:262`）；`WatchTarget`（`:111`）可以不存在、创建即变化、recursive + exclude hidden/names、不跟随子树内符号链接；`WatchChange = {paths} | {overflow} | {error}`（`:127`）；`FileWatcher.mode: "native" | "polling"`（`:129`）。spec 明确 "Durable itself never calls it"（`spec.md:2859-2860`）——这是给加载 instructions/skills 的宿主用的，不是 durable 自身。
- **NodeExecutionEnv**（`src/env/node.ts`）是本地 Node 参考实现：字符串命令在 Windows 上自动找 Git Bash，argv 命令直接 spawn。
- **NodeFileWatcher**（`src/env/node-watch.ts:139`）的设计核心：**原生事件只触发防抖 rescan，变化 = 快照差分 + 事件路径**（类文档 `node-watch.ts:132-138`）——替换文件、改名父目录、带内容新建的目录，都不依赖平台发了什么事件；新目录在下次扫描**前**先装 watcher，装 watcher 前写进去的内容不会漏。平台差异内建：Windows 上原生 watcher 会让被监视目录保持打开、从而破坏 `rename(parent)`，模式选择默认 win32 取 polling（`node-watch.ts:174-186`）；macOS FSEvents 启动竞态（`fs.watch` 返回时流未 live、紧随其后的变化会丢）用装完 500ms 再 rescan 一次兜底（`FSEVENTS_SETTLE_MS`，`node-watch.ts:52`）。目录预算 `DEFAULT_MAX_DIRECTORIES = 10_000`（`:54`），超限报 `FileError "invalid"`。

这四批扩张（argv exec + 有界 reader、window/skipped、scanLines + BOM 语义、watch）在 `packages/durable/CHANGELOG.md` 的 [1.0.3] 段（`:147-150`）记为 **4 条接口级 Breaking**——全部是"自定义环境实现者必须实现"的接口义务。

### conformance 双线与 packages/env 的关系

- **env-conformance**（`src/testing/env-conformance.ts`，633 行）是 storage-conformance 之外的**第二条 conformance 线**：`registerEnvConformance`（`src/testing/runner.ts:28`）把任意 `ExecutionEnv` 实现接入同一套断言，含 watch 案例（缺失文件创建/替换/删除、祖先目录连带创建、父目录改名重建、exclude、close 幂等、watch 案例超时 30 s 以覆盖轮询延迟，`env-conformance.ts:124`、`:275-620`）。
- **依赖方向是 env → durable，反向不成立**：`packages/env/package.json` 依赖精确版本 `@earendil-works/pi-durable 1.4.0`，其 `watch.ts`/`errors.ts`/`remote-env.ts` 从 `pi-durable/env` 导入（`FileError`/`FileWatcher`/`WatchChange` 等）；durable 不依赖 pi-env。durable 出契约，pi-env（TS 客户端 `RemoteExecutionEnv` + SSH 上的 Rust daemon）做实现。
- **`RemoteExecutionEnv` 是 `ExecutionEnv` 的第二个官方实现**（`packages/env/src/remote-env.ts`，v1.2.0 起在 release 内）：工具的文件操作和命令执行整体搬到远端机器，而 Durable worker、存储与凭据留本地（`packages/env/README.md:3-4`）。合同是**语义等价**（`packages/env/docs/semantics.md`）：`RemoteExecutionEnv` 的结果必须等于 `NodeExecutionEnv` 直接跑在那台远端机器上的结果，只有错误消息文本允许不同——由 conformance（`packages/env/test/conformance.test.ts:4` import、`:17` 调用 durable 的 `registerEnvConformance`）与 differential（随机操作序列 + durable 工具，逐结果对比两个环境）双测试锁定，CI 跨 **5 OS 矩阵**（`env-daemons.yml` 的 8 目标交叉构建）跑，`env.yml` 的 `release-daemons` job 再在 **6 平台 runner** 上用发布构建实测（`env.yml:75-126`）。durable 侧每一步接口扩张（argv exec、window/skipped、scanLines 助手导出、watch）都在为这条消费线铺路。

### images 子系统（v1.2.0 新增）

durable 在 v1.2.0 长出了一个**图像处理**子系统，以子路径导出：`@earendil-works/pi-durable/images`、`/images/node`、`/images/cloudflare`。

- 核心是 **Photon**（Rust → WASM）图像管线：`createPhotonImages(wasm)`（`src/images/index.ts`），EXIF 方向自动纠正（`src/images/exif.ts`）。
- **三种宿主适配**：`/images/node` 把 Photon 放在 worker 线程里跑（`node.ts`，`idleMs` 默认 **30 秒**后回收，失败时回退到进程内）；`/images/cloudflare` 走 Wrangler 的 `CompiledWasm`（`cloudflare.ts`，注释明说其它 bundler 请直接用 `createPhotonImages()`）。
- **默认限额** `DEFAULT_IMAGE_LIMITS = { maxWidth: 2000, maxHeight: 2000, maxBytes: 4.5 MiB }`（注意定义在 `src/tools/image-processor.ts:11`，不是 `src/images/`）。
- 消费方式：`createCodingTools({ images })` 注入；**durable 的 `read` 工具因此能把图片作为 image block 返回**，而不是 `unsupported_image`（`src/tools/read.ts` 引用 `DEFAULT_IMAGE_LIMITS`）。

**为什么放在 durable 而不是 coding-agent**：与 `ExecutionEnv` 同样的理由——图像编解码需要在**与工具执行相同的沙箱语义**下发生（浏览器/Worker/Node 三种宿主都要能跑），所以它是 durable 侧的能力面，coding-agent 通过 `createCodingTools` 消费。

### packages/env 的 v1.2.0 能力面（原页只写到 v1.0.3 合同层）

上一节讲的是 `ExecutionEnv` **合同**与 conformance；`packages/env` 作为它的官方远端实现，v1.2.0 起补齐了若干**此前缺失的能力**，本页旧文未覆盖：

**1. `listFiles` 在 env 侧有了实现（含本地实现）**

durable 只**声明**可选的 `ExecutionEnv.listFiles`（并有 conformance 用例），**实现**在 `packages/env`：

- `LocalExecutionEnv`（`packages/env/src/list-files.ts:84`，"同一个实现在本地和远端"）——`extends NodeExecutionEnv implements ExecutionEnv`，构造参数类型 `LocalExecutionEnvOptions`（`:74`，即 `NodeExecutionEnv` 的构造参数再加额外项）。导出见 `src/index.ts:11`。
- 远端路径经 daemon 的 list 操作；**旧 daemon 缺该能力时报 `not_supported`**（`list-files.ts:40`，官方文案 "The pi-env daemon does not list files; update it"），调用方据此回退到自己的遍历。

> 这一条修掉了本语料先前的一处**易误读**：`orchestration/07-durable-tasks.md` 提到 `ExecutionEnv.listFiles` 时只讲了 durable 侧的**声明**，读者会以为它没有实现。

**2. PTY / 交互式终端子系统（v1.2.0 新增）**

`openTerminal()`、`RemoteTerminal` 与 `TerminalForeground` / `TerminalOptions` 类型（`packages/env/src/index.ts:31`，实现 `src/terminal.ts`；daemon 侧 `daemon/src/pty.rs`）。

- `RemoteTerminal` 提供 `write` / `resize` / `close` / `foreground` / `exited`；写入按块（`WRITE_CHUNK = 1MiB`）切分。
- 对应 daemon 操作：`pty` / `ptyWrite` / `ptyResize` / `ptyForeground`；resize 走 SIGWINCH，关闭时按**进程组** kill。
- **仅 Unix**：Windows 上返回 `ENOTSUP`。

这是"远端跑交互式命令"的能力——远端 daemon 存在的意义之一，此前 corpus 完全没有记录。

**3. 平台名映射与 daemon 部署细节**

- `nodePlatform(info)`（`src/connection.ts:60`）把 daemon 上报的 `os`/`arch` 映射成 Node 风格的 `platform`/`arch`。
- 部署相关导出：`connectSsh` / `deployDaemon` / `detectPlatform` / `localDaemon` / `packagedDaemon` / `sshConnection` / `sshArguments`，以及主机密钥 API `scanHostKey` / `acceptHostKey` / `forgetHostKey` 与 `HostKeyUnknownError` / `HostKeyChangedError`、`SshError`（均在 `src/index.ts`）。
- **daemon 按内容命名部署**：装到远端 `~/.pi/mobile/tools/pi-env-<sha256 前 32 位>`，**每次启动前校验**；`ssh` 以 `BatchMode`、严格主机密钥校验（应用自己的 known-hosts 文件 + 固定 alias）、无任何转发运行（`packages/env/README.md`）。供应线视角见 [`../test-strategy/09-supply-chain-and-protocol-conformance.md`](../test-strategy/09-supply-chain-and-protocol-conformance.md)。

## codemode：确定性代码执行层（v1.2.0 新增，硬事实）

`packages/durable/src/codemode/`（5 文件，主体 `codemode.ts` 1,044 行）是 v1.2.0 新能力面。**注意：这与 `packages/coding-agent/src/extensions/codemode/` 是两套独立实现**——后者调用 `@earendil-works/pi-codemode` 包，前者是 durable 自己的 journal 式实现。不要把其中一个描述为另一个的迁移。

导出面（`src/codemode/index.ts`）：`createCodemodeExtension` / `createCodemodeTool` / `CodemodeStoreDoc` / `CODEMODE_TOOL_NAME` / `CODEMODE_MODULE_VERSION` / `DEFAULT_CODEMODE_INLINE_BUDGET` 与配套类型。

**核心问题**：session 可能在脚本执行到一半时崩溃重启，而脚本要调用工具（有副作用）。durable 的解法是**确定性重放**（`codemode.ts:10-15` 自述）：

- VM 只在宿主投喂结果时运行；同样的 start data + 同样的参数 → 同样的执行。
- 工具是**重放安全**的：重启后 `execute()` 再次运行、脚本从头开始，宿主按**上次交付的顺序**投喂它此前得到的结果，来源是写下的 journal。
- 嵌套调用各有自己的重放策略，其结果从 `NestedCallDoc` 取；重放完成后脚本继续**实时**执行。
- `pi.codemode.journal`：每个交付结果一条，按交付顺序记录 VM call ID、时钟值与确认的调用计数（`:20-29`）。重放时校验每个记录的计数，保证"某个 attempt 至多被放行到它最后记录的次数"。
- 成本自述：每个结果一次 journal commit + 一次 count commit，外加其嵌套调用自身的提交。

## 相关但独立的协议线（已删除）

- ~~**CBOR 协议线**：`packages/protocol` `PROTOCOL_VERSION = 8`~~：**该包与 `packages/client` 已于 v1.2.0 删除**（`7472cda0d`）。`src/protocol.ts`、`src/cbor/` 与 `connection.ts` 均不存在。durable 不再有 CBOR 协议消费者；其与 `packages/env` 之间的远程通信走 env 自己的分帧协议（`packages/env/docs/protocol.md`）。

## 锚点

- `packages/durable/docs/spec.md`（**5,618** 行，normative；§1 不变量、§7 执行环境契约、§11 backends——按节名检索，行号随版本漂移）
- `packages/durable/README.md`（**876** 行，experimental usage guide；`README.md:3` "Experimental" 横幅）
- `packages/durable/src/env/index.ts:374`：`ExecutionEnv`；`:359-373`：`Shell`/`exec`（`:365`）；`:315`：`window`；`:322/:338/:347`：`ShellOutputWindow`/`ShellOutputSkip`/`ShellOutputInfo`；`:231/:256`：`openBinaryReader`/`openDirReader`；`:106`：`scanLines`；`:262`：`watch`
- `packages/durable/src/env/node.ts:612`：`NodeExecutionEnv`；`:673-686`：argv exec 实现；`node-watch.ts:139`：`NodeFileWatcher`（设计说明 `:132-138`）；`:52/:54`：FSEvents settle 与目录预算
- `packages/durable/src/testing/storage-conformance.ts`（1,682 行）、`env-conformance.ts`（633 行）；`runner.ts:13/:28`：双 conformance 注册器
- `packages/durable/src/harness/provider.ts:12`：`ProviderDoc`；`:26`：`ensureProviderSessionId`；`view.ts:26`：`ConversationView`
- `packages/durable/src/tools/bash.ts:145/:168`：`createBashTool`/`createPowerShellTool`（后者不进 `CodingTools`）
- `packages/env/README.md:3-4`：远程执行定位；`packages/env/docs/semantics.md`：语义等价合同；`packages/env/package.json`：env → durable 依赖方向
- `packages/durable/src/types.ts:707`：`DocumentRecord`；`:40`：`ROOT_CONVERSATION_ID`；`:219`：状态集；`:330`：`sleepUntil`
- `packages/durable/src/storage/memory.ts:237`：`MemoryStorage`；`:268`：`prepareCommit`；`:250`：状态索引含 sleeping
- `packages/durable/src/storage/indexeddb.ts:378`：`IndexedDbStorage`（`open` `:390`）
- **sqlite**：durable 侧只剩 `storage/sqlite/storage.ts`（close 两层 `:589-612`）、`sqlite/migrations.ts`（v2 重建 `:91-115`）、`database.ts`（1 行 type re-export）、`node.ts`（22 行转发）；驱动/队列/事务/迁移 runner 在 `packages/chord/src/sqlite/{database,node,migrations,schema,cloudflare}.ts`（版本守卫 `migrations.ts:36-39`）
- `packages/durable/src/harness/harness.ts:369-373`（`taskGraph`/`watchTaskGraph`）、`:538-563`（`Harness.open`）
- `packages/durable/src/tasks.ts:4`（`defineTask`）；`harness/define.ts:6-43`（extension 定义器）；`harness/registry.ts:73-86`（install/uninstall）、`:112`（`createRegistry`）
- `packages/durable/src/codemode/codemode.ts:10-29`：确定性重放设计自述与 `pi.codemode.journal`；`src/codemode/index.ts`：导出面
- `packages/durable/package.json`：subpath exports（含 `./storage/indexeddb`）；files 无 docs
- `packages/durable/docs/`：**只剩 `spec.md`**（`pico-v5-handoff.md`/`pico-v5-chord-usage.md`/`chord-delta-findings.md` 已于 v1.2.0 删除）
- 状态：experimental（README 横幅）；CHANGELOG 自 1.0.1 起逐版本记录，v1.4.0 段有 6 条 Breaking
