# 05 — 持久化事件流与状态机恢复测试：packages/durable 的断电与故障自愈验证

> **源码锚点**：
> - 核心持久化与状态机测试套件：`packages/durable/test/`（50+ 测试文件）
> - 跨后端通用一致性测试集：`packages/durable/src/testing/storage-conformance.ts`（1584 行参数化套件）
> - 跨环境一致性测试集：`packages/durable/src/testing/env-conformance.ts`（511 行参数化套件）
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

## 二、恢复测试三部曲（The Recovery Test Triad）

在 `packages/durable/test/` 中，有三个以 `-recovery.test.ts` 结尾的标志性测试资产，专门用来模拟各种“不可抗力崩溃”：

```
[正常执行链路]
      │
      ▼
   写入事件流 / 触发工具执行 / 记录生成中状态
      │
      ▼ 模拟突发异常 (SIGKILL / 抛出致命异常 / 模拟断电)
[物理阻断: 中断会话]
      │
      ▼ 重新创建存储句柄与 Harness 实例
[重启恢复: harness.recover()]
      │
      ├─► 1. 验证存储层未决事务回滚 (Rollback uncommitted transactions)
      ├─► 2. 验证任务图拓扑未断裂 (DAG state intact)
      ├─► 3. 验证未决消息转换为可恢复错误 (Pending -> Errored with resume handle)
      └─► 4. 再次触发 prompt(): 断点续传成功
```

### 1. 生成中断恢复（`harness-generation-recovery.test.ts`）
- **模拟场景**：大模型刚输出了一半的 Token，网络套接字突发断开或进程崩溃；
- **断言目标**：恢复后的 Session 不应处于“永远等待响应”的死锁状态，系统必须将半截生成记录转化为带错误标记的终止事件，并自动生成可重试的 Token 锚点。

### 2. 工具执行崩溃恢复（`harness-tools-recovery.test.ts`）
- **模拟场景**：Agent 发起了一个耗时工具调用（如长命令执行），工具子进程在返回前夕异常退出；
- **断言目标**：验证 `tool_call_id` 与未完成的执行凭证是否被安全清理，绝不在会话日志中遗留悬空引用（Dangling References）。

### 3. 任务拓扑图故障恢复（`harness-tasks-recovery.test.ts`）
- **模拟场景**：复杂的有向无环图（DAG）子任务在执行到第 3 个节点时崩溃；
- **断言目标**：依赖节点是否处于合规挂起状态，已完成节点的输出物是否依然持久化在 SQLite 中。

---

## 三、解密 harness-compaction.test.ts：近 100KB 的状态压缩断言

在长周期的编程任务中，会话历史动辄达到数万 Token，必须通过上下文压缩（Compaction）将旧轮次折叠为 `ContextEditEntry` 摘要。

`harness-compaction.test.ts` 单个文件代码量接近 10 万字节，是全仓库最庞大的单测试文件之一。它测试的核心不变量包括：

1. **引用的因果一致性（Causal Consistency）**：
   压缩算法折叠了前 10 轮对话，但如果第 12 轮的代码修改依赖了第 2 轮中声明的路径，压缩后的摘要必须精准保留该路径的语义锚点；
2. **多分支分叉压缩（Forked Branch Compaction）**：
   当用户在会话树的节点 A 分叉出分支 1 和分支 2 时，分支 1 的压缩**绝对不能污染或影响分支 2 的回放视图**；
3. **跨存储引擎等价性（Cross-Backend Parity 与 storage-conformance.ts）**：
   `packages/durable` 同时支持三种存储后端：
   - `sqlite-storage`（生产默认，支持 ACID 事务与磁盘恢复）
   - `jsonl-storage`（轻量级纯文本追加文件，易审计）
   - `memory-storage`（纯内存，测试专用）
   系统构建了长达 1584 行的参数化套件 [`packages/durable/src/testing/storage-conformance.ts`](file:///Users/bowhead/pi-mono/packages/durable/src/testing/storage-conformance.ts)，`sqlite-storage.test.ts`、`jsonl-storage.test.ts` 与 `memory-storage.test.ts` 均接入此套件运行完全相同的状态机断言，确保开发、测试与生产的行为毫厘不差。

### 第二条 conformance 线：执行环境（env-conformance.ts，v1.0.3 起）

v1.0.3 把同一套"参数化一致性套件"模式从存储层复制到了**执行环境层**：[`packages/durable/src/testing/env-conformance.ts`](file:///Users/bowhead/pi-mono/packages/durable/src/testing/env-conformance.ts)（511 行）经 `registerEnvConformance`（`src/testing/runner.ts:28`）把任意 `ExecutionEnv` 实现接入同一套断言，覆盖面正是本轮接口扩张的能力：argv exec（数组命令直接 spawn、不经 shell）、输出窗口（`window`/`skipped` 的省略量语义）、以及体量最大的 watch 双模式案例（native/polling，缺失文件创建/替换/删除、父目录改名重建、exclude、close 幂等；watch 案例超时放宽到 30 秒以覆盖轮询延迟，`env-conformance.ts:108`）。

这条线的第一个外部消费者是新包 `pi-env`（SSH 远程执行环境，**v1.2.0 起在 release 内**）：其 `RemoteExecutionEnv` 与本机 `NodeExecutionEnv` 跑**同一套** env-conformance 断言（`packages/env/test/conformance.test.ts:16` 直接调用 `registerEnvConformance`），配合 differential 测试（随机操作序列逐结果对比两个环境）锁定"远程结果 == 本机直跑"的语义等价合同。CI 上由 `.github/workflows/env.yml` 跨 5 OS 矩阵驱动——一致性套件从"跨存储后端"扩展到了"跨机器、跨操作系统"。

---

## 四、对 Coding Agent 研发的架构启示

1. **必须设计“面对自身崩溃”的测试用例**：
   传统测试往往只测“Happy Path”，但 Agentic 系统拥有外部进程、长耗时 I/O 和流式状态，**进程崩溃是常态而非特例**。`harness-*-recovery` 证明：只有把故障恢复写入常规测试用例，系统才具备工业级的生产可用度；
2. **以不可变事件日志作为真理源**：
   状态机不应该保存在脆弱的内存对象中。所有状态的流转必须体现为只读事件的追加（Append-Only Event Sourcing），任何时刻只要重放日志，就能确定性地复原出最新状态。
