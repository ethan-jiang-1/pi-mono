# 05 — 持久化事件流与状态机恢复测试：packages/durable 的断电与故障自愈验证

> **源码锚点**：
> - 核心持久化与状态机测试套件：`packages/durable/test/`（50+ 测试文件）
> - 跨后端通用一致性测试集：`packages/durable/src/testing/storage-conformance.ts`（1,682 行参数化套件；v1.0.3 时为 1,583）
> - 跨环境一致性测试集：`packages/durable/src/testing/env-conformance.ts`（633 行参数化套件；v1.0.3 时为 473（511 是同步起点 `98d2e1947` 的值，非 tag v1.0.3））
> - 灾难恢复测试：`harness-generation-recovery.test.ts`、`harness-tools-recovery.test.ts`、`harness-tasks-recovery.test.ts`
> - 巨型压缩与分叉测试：`harness-compaction.test.ts`（近 10 万字节）、`session-forks.test.ts`

---

## 一、架构背景：v1.0.0 的核心持久层接盘者

在 Pi `v1.0.0` 的架构大重构中，`packages/agent` 被彻底收缩为最小核（仅保留 Agent 循环与类型），而整个系统的**会话持久化、任务图（Task Graph）、异步收件箱（Inbox）与故障自愈能力，全部转移到了 `packages/durable`**。

对于一个面向生产环境的 Coding Agent，最大的技术挑战不是在内存里跑完一次任务，而是**面对突发灾难时的韧性（Resilience）**：
- 如果 Agent 正在流式生成长篇代码时进程被 `kill -9`，下次启动能否无损恢复？
- 如果长任务执行到第 8 步时宿主机断电，任务图是整体崩溃还是能断点续传？
- 当会话发生激进的历史压缩（Compaction）或者分支回滚（Fork）时，底层存储是产生脏数据还是保持强一致性？

`packages/durable/test/` 构筑了一套被称为**“故障注入与自愈断言（Chaos & Recovery Assertions）”**的测试体系。

---

## 二、恢复测试：重开而不是「续传」

`packages/durable/test/` 里有三个 `-recovery.test.ts`，模拟进程在关键处被截断：

```
[正常执行]
   │ 写入 commit（entry / task / document）/ 调工具 / 生成中
   ▼ 模拟 SIGKILL / 抛错 / 关掉 storage
[丢弃进程内状态]
   │ 重新 Harness.open(同一 storage)
   ▼ open 时 reconcile：running -> pending，重建 abort/finalize 持有
[整段任务重跑：从 checkpoint 决定从哪里继续]
```

**关键口径（v1.4.0 复核）**：**没有 `harness.recover()` 这个公开 API**。恢复 = 重新 `Harness.open(storage, …)`（`harness/harness.ts:540-575`，内部是 `TaskScheduler.open()` 的 reconcile，`scheduler.ts:374`）+ 需要时 `resume()`。恢复语义也不是「把半截生成转成错误事件 + resume handle」，而是**整段任务重跑**：checkpoint 让 phase 函数自己决定从哪里继续（见 [4.1](../agent/04-Harness/4.1_AgentHarness.md)）。这一点自 1.0.0 起成立，v1.4.0 的 `sleeping` 只是让「等待」也能跨重启。

### 1. 生成中断恢复（`harness-generation-recovery.test.ts`）
- **模拟**：流式生成到一半进程消失（或 storage 在生成中关闭）。
- **断言**：重开后会话不会永久卡在「等待响应」；未提交的部分不进入事实层；任务按 checkpoint 重跑，已提交的 entry 不被重复追加。

### 2. 工具执行崩溃恢复（`harness-tools-recovery.test.ts`）
- **模拟**：工具调用返回前子进程/宿主退出。
- **断言**：tool call 与结果不会留下悬空引用；非 replay-safe 的调用按 `abandonOnRestart` 处理（连同它拥有的工作一起 abort，reason `restart`）；嵌套调用走 `NestedCallDoc` 的重放策略。

### 3. 任务拓扑图故障恢复（`harness-tasks-recovery.test.ts`）
- **模拟**：DAG 执行到中途崩溃。
- **断言**：依赖节点处于合规的挂起/等待状态；task graph 从 commit publication 重建，而不是从内存猜；已完成节点的输出仍在存储里（与具体后端无关——conformance 对四个后端跑同一套断言）。

### 4. v1.4.0 新增的恢复面

| 测试 | 覆盖 |
|---|---|
| `harness-sleep.test.ts` | `sleeping` 跨重启存活、到点从 checkpoint 继续、不持 invocation |
| `harness-blocked.test.ts` | crash-loop guard：`restarts` 计数、park、`restart_limit`、`retryTask` |
| `harness-telemetry.test.ts` | `DURABLE_TELEMETRY_SCHEMA`：submit/phase span、内容不含 payload、错误截断 |
| `harness-reports.test.ts` | `onReport(error, info)` 的 `ReportInfo` 分类 |
| `indexeddb-storage.test.ts` | 第四后端接同一套 storage conformance |
| `test-workers/wake.test.ts` | Cloudflare DO：alarm 唤醒 + 驱逐后 `wake()` 报告 |

## 三、解密 harness-compaction.test.ts：近 100KB 的状态压缩断言

在长周期的编程任务中，会话历史动辄达到数万 Token，必须通过上下文压缩（Compaction）把旧轮次折叠。压缩以 `pi.compaction` entry 落盘；`ContextEdit[]` 只是 `EntryRecord.edits` 的字段类型，不存在 `ContextEditEntry` 这种条目。

`harness-compaction.test.ts` 单个文件代码量接近 10 万字节，是全仓库最庞大的单测试文件之一。它测试的核心不变量包括：

1. **引用的因果一致性（Causal Consistency）**：
   压缩算法折叠了前 10 轮对话，但如果第 12 轮的代码修改依赖了第 2 轮中声明的路径，压缩后的摘要必须精准保留该路径的语义锚点；
2. **多分支分叉压缩（Forked Branch Compaction）**：
   当用户在会话树的节点 A 分叉出分支 1 和分支 2 时，分支 1 的压缩**绝对不能污染或影响分支 2 的回放视图**；
3. **跨存储引擎等价性（Cross-Backend Parity 与 storage-conformance.ts）**：
   `packages/durable` 有四个存储后端：
   - `sqlite`（ACID 事务与磁盘恢复；v1.4.0 驱动在 `@earendil-works/chord/sqlite`）
   - `jsonl`（纯文本追加 + sidecar，易审计）
   - `memory`（纯内存，测试与参考语义）
   - `indexeddb`（v1.4.0 新增，浏览器）
   参数化套件 `packages/durable/src/testing/storage-conformance.ts`（1,682 行）对每个后端跑完全相同的状态机断言——durable 不预设哪个后端是「生产默认」，选型由宿主决定。

### 第二条 conformance 线：执行环境（env-conformance.ts，v1.0.3 起）

v1.0.3 把同一套"参数化一致性套件"模式从存储层复制到了**执行环境层**：`packages/durable/src/testing/env-conformance.ts`（633 行；v1.0.3 时为 473，v1.1.0 为 511）经 `registerEnvConformance`（`src/testing/runner.ts:28`）把任意 `ExecutionEnv` 实现接入同一套断言，覆盖面正是本轮接口扩张的能力：argv exec（数组命令直接 spawn、不经 shell）、输出窗口（`window`/`skipped` 的省略量语义）、以及体量最大的 watch 双模式案例（native/polling，缺失文件创建/替换/删除、父目录改名重建、exclude、close 幂等；watch 案例超时放宽到 30 秒以覆盖轮询延迟，`env-conformance.ts:124`，`watchCase` 统一给 30_000ms）。

这条线的第一个外部消费者是新包 `pi-env`（SSH 远程执行环境，**v1.2.0 起在 release 内**）：其 `RemoteExecutionEnv` 与本机 `NodeExecutionEnv` 跑**同一套** env-conformance 断言（`packages/env/test/conformance.test.ts:17` 直接调用 `registerEnvConformance`），配合 differential 测试（随机操作序列逐结果对比两个环境）锁定"远程结果 == 本机直跑"的语义等价合同。CI 上由 `.github/workflows/env.yml` 跨 5 OS 矩阵驱动——一致性套件从"跨存储后端"扩展到了"跨机器、跨操作系统"。

---

## 四、对 Coding Agent 研发的架构启示

1. **必须设计“面对自身崩溃”的测试用例**：
   传统测试往往只测“Happy Path”，但 Agentic 系统拥有外部进程、长耗时 I/O 和流式状态，**进程崩溃是常态而非特例**。`harness-*-recovery` 证明：只有把故障恢复写入常规测试用例，系统才具备工业级的生产可用度；
2. **以不可变事件日志作为真理源**：
   状态机不应该保存在脆弱的内存对象中。所有状态的流转必须体现为只读事件的追加（Append-Only Event Sourcing），任何时刻只要重放日志，就能确定性地复原出最新状态。
