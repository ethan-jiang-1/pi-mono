# 07 · durable tasks:实验性的持久编排层

`packages/durable` 是 pi 阶梯上唯一把**编排状态本身变成持久事实**的一级:任务、对话、工具调用全部先落存储再展示,"If the process dies mid-turn, reopening the storage picks the work up where it stopped"(`packages/durable/README.md:3-5`)。它提供 child tasks、join policy、owned conversations(subagent)与自底向上 abort——pi 版"重型编排"的完整形态,但 **experimental,API 随版本变动不另行通知**(`README.md:3`)。

> **⚠️ v1.2.0：durable 不再只是"任务运行时",已扩成"工具执行内核"（sync-0009）**。本区间把 durable 的能力面显著加宽，本页原有结论仍然成立但**不完整**。新增面（均为 v1.2.0 in-tag）：
>
> - **内建 Code Mode**（`README.md` §Code Mode，**:259**）：durable 侧**独立**实现了一套 codemode（`packages/durable/src/codemode/`，5 个文件），以 `pi.codemode.journal` + 时钟值做**确定性重放**——与 coding-agent 侧的 codemode 是**两份平行实现，不是迁移**。详见 [`04-codemode.md`](./04-codemode.md)。
> - **`abandonOnRestart`**（`README.md:257`）：只被创建者内存中 await、且重启后创建者不再恢复的任务可标此位；Harness 重新调度时若发现它仍 live，会以 `abortReason: "restart"` 连同它拥有的一切一起 abort，然后才继续。非 replay-safe 的嵌套工具调用自动获得该标记。
> - **嵌套工具调用与 structured output**、`callers`、`ToolExecutionApi`/`HookApi` 暴露 `models`。
> - **tool-search**（BM25）与 **images** 能力面：`src/tool-search/`、`src/search.ts`、`src/images/`。
> - **调度器有界性**修复（`cb4375493`、`ea448f454`）：长 sleep 分片、等待环拒绝（`runtime.commit()` 对具名环**直接拒绝**而不是挂死，`eb2fce43d`）。
> - **`documentRetentionMs`**（`README.md:323`）：无人观察的已加载文档在最后一次使用后保留这么久；被观察的文档始终保留。
> - **`ExecutionEnv.listFiles`**（可选方法）与 `packages/durable/src/testing/env-conformance.ts` 一致性套件。
> - **Compaction 失败语义变更**：阻塞/阈值 compaction 失败现在**直接让该次生成以 `model_error` 失败**（`89e5c2c07`），并通过 `pi.live.compactionFailure` 保留最后一次失败；摘要生成**去掉 thinking**（`15e7bdc14`）。详见 [`../agent/03-Memory/3.1_Compaction.md`](../agent/03-Memory/3.1_Compaction.md)。
> - README 由 613 行增至 **751** 行；测试示例由 24 个增至 **32** 个（`00`-`31`，新增 `25-compaction.ts` 至 `31-reload-and-restart.ts`）。

## 为什么是这个形状:设计考量

普通 pi 会话([06](./06-session-plane.md))的事实层是会话树,但**编排运行态**(哪个任务在等谁、谁拥有哪个子代理、重启后从哪继续)不在事实层里——双队列是内存的,subagent 是一次性的。durable 的答案是把"运行态"压进同一条 commit 线:任务状态只能经事务提交改变,Scheduler 从已提交状态推进工作,崩溃后重启的任务从 checkpoint 恢复。**持久事实、派生投影、内存权限的边界被明确画出来**:TaskGraphView 的注释直说 "built on the Session line by its first observer… advances from the Session's commit publications, **which are durable**"(`durable/src/harness/task-graph.ts:58-62`)。

## 机制

### 任务状态机

![durable 任务状态机与 abort 语义](./figures/task-states.svg)

- 活跃状态集 `pending | running | waiting | completing`,终态离开图(`task-graph.ts:19-28`；v1.2.0 实测 `TaskGraphState` :19、`TaskGraphNode` :30、`TaskGraph` :44、`TaskGraphWatch` :49——旧引的 `:55` 已无效);
- **waiting 是一等状态**:任务提交一个 `{ status: "waiting", checkpoint, on: [childTaskId…], policy }` 后不再运行任何代码,子任务就绪后由 Scheduler 恢复(`README.md` Child Tasks 节);
- **重启后的诚实投影**:"tasks that were `running` show as `pending` until they run again"——图上显示的是已提交状态,不是推测的运行态(README Task Graph 节)。

### join policy:fan-out / fan-in 的最小合同

子任务等待二选一:**`allSettled`**(全部 done 才恢复)或 **`failFast`**(首个失败同时 abort 其余)(README Child Tasks 节,官方 checkout/payments 示例 `test/examples/24-child-tasks.ts`)。fan-out 的节点由 `createTask` 循环产生,fan-in 是一次 waiting 提交——**DAG 不是数据结构,是一段顺序代码加一次状态提交**,与 codemode"脚本持有控制流"同构,只是控制流可跨重启。

### owned conversations:持久化的 subagent

subagent 工具在 `api.commit()` 里以 `ownership: { kind: "task", taskId }` 创建子 conversation,`replay: "safe"` 让崩溃重跑时经 ownership 索引**找到同一个孩子而不是再起一个**("a rerun after a crash finds the same child and submission",README Abort and Subagents 节,示例 `22/23-subagent-*.ts`)。所有权推论:

- abort 调用即 abort 孩子;调用失败(抛错或非 replay-safe 的崩溃中断)同样;
- **父的 idle 以孩子 idle 为前提**;
- `{ background: true }` 的任务是**隔离边界**:它拥有的工作在父 abort 后存活、也不让父保持 busy。

### abort 语义:自底向上

"abort runs bottom-up. Aborting a task aborts the work it owns first, and its own abort handler starts only once that work is done, so each task undoes its own effects."(README Child Tasks 节)——清理顺序由所有权图决定,补偿逻辑写在各自任务的 abort handler 里。

### TaskGraph:读时派生的投影

`harness.taskGraph()` 返回全部活跃任务的单一 Chord 状态,`watchTaskGraph()` 提供推送;节点带 owner 边、状态、background/abort 标记与拥有的 conversations(README Task Graph 节)。投影由 commit publications 增量推进(`task-graph.ts:151-190`:terminal 即删节点、conversation 归属在任务变更之后补),**图是派生视图,不是第二个权威**——被丢弃就由存储重建(`#build`,`:131-148`),这与 todo 随 branch 重建是同一条纪律的重装版。

### 能力面延伸:工具跑远端,事实留本地(v1.2.0 起在 release 内)

v1.0.3 之后 durable 的执行环境抽象(`ExecutionEnv`,`src/env/`)长出了第二个官方实现:新包 `@earendil-works/pi-env` 把"agent 的工具在另一台机器上执行"做成包级能力——pi-env README 的定位原文:"an agent's tools run on another machine, usually over SSH, while the Durable worker, its storage and credentials stay local"(`packages/env/README.md:3-4`)。即**工具的文件操作与命令执行整体上远端,而 Durable worker、存储与凭据留本地**——持久事实层与执行层可以拆到两台机器上。依赖方向是 env → durable(pi-env 实现 durable 的接口,反向不成立),且该包 Unreleased、monorepo 内暂无消费者。这是 durable 线的能力延伸证据,但不改变下面的 experimental 定位结论。

## 边界与上限

- **experimental**:无稳定性合同(`README.md:3`);不在默认组合里,当前 pi CLI 会话不跑在 durable 上。
- **复杂度上限在包内**:join policy 只有两种;没有 DSH goal 式的"人类可编辑长目标",没有跨会话的优先级调度。
- **等待 ≠ 进度**:`waiting` 只说明提交了等待状态;子任务完成是机械条件,"完成得对不对"仍要任务代码自己验收。

## 与相邻原语的关系

- 它是 [03](./03-subagent.md) 委派模式的产品化终点(replay-safe 的子代理、可消息传递的后台孩子,示例 `23-subagent-background.ts`);
- 它把 [06](./06-session-plane.md) 的"事实先行"从会话文件升级为带事务与 watch 的存储合同;
- 与 [01](./01-loop.md) 的关系:TaskScheduler 是 loop 节拍在持久层的重写者——"什么时候跑下一步"由已提交状态决定,不再由内存队列决定。

## 源码入口

| 路径 | 一句话 |
|------|--------|
| `packages/durable/README.md:3-5` | experimental 定位与持久承诺 |
| `packages/durable/README.md`(Abort and Subagents / Child Tasks / Task Graph 三节) | owned conversation、join policy、自底向上 abort、投影语义的官方表述 |
| **`packages/durable/src/harness/task-graph.ts:19-28,60`** | 状态集与"durable commit publications"边界（v1.2.0 实测 :60；v1.0.3 时为 :58-62） |
| **`packages/durable/src/harness/task-graph.ts:136`起** | 全量重建与增量推进（v1.2.0 `#build` :136；文件 222→236 行） |
| **`packages/durable/src/harness/scheduler.ts:54-55`** | 活跃状态常量与长 sleep 分片（v1.2.0 `MAX_TIMER_DELAY` :54、`LIVE_STATUSES` :55；文件 **1337→1953** 行） |
| `packages/durable/test/examples/22/23/24-*.ts` | 前台/后台 subagent 与 child tasks 官方示例 |
| **`packages/durable/README.md:257`** | `abandonOnRestart`：重启后放弃仍 live 的任务 |
| **`packages/durable/README.md:259`** | §Code Mode：durable 侧内建 codemode（v1.2.0 新增） |
| **`packages/durable/README.md:323`** | `documentRetentionMs` 文档保留期 |
| **`packages/durable/src/codemode/`** | 5 文件；`createCodemodeExtension`/`createCodemodeTool`；`pi.codemode.journal` 确定性重放 |
