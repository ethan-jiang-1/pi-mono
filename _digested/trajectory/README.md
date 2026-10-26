# trajectory/ — 会话轨迹：model-visible 状态的事实源、可回放性与录制夹具

> **当前基线：`v1.4.0`（tag `4a080252f`）**。本区间 `core/session-manager.ts` 与轨迹格式**未变**；新增的是 `--tools +name/-name` 在恢复会话时的叠加语义，以及 durable 侧 `sleeping` 让一次 run 可以跨进程边界暂停。
>
> **更早基线**：`v1.2.0`（tag `06a466935`），上一基线 `v1.0.3`（tag `d78dc83d6`）。`core/session-manager.ts` 在 v1.0.3→v1.2.0 区间**逐字节未变**，轨迹格式与 `SessionMessage` 形状不变。本区间对该层的唯一增量是 `AgentToolCallOutcome` 与 `tool_execution_end` 事件新增可选 **`durationMs?`**（单调时钟测得的 `execute()` 耗时，工具未运行时缺省；`packages/agent/src/types.ts:454`、`:538`）。下文行号为专题写作时的树实测。
>
> **基线**：pi-mono 工作树 `6401d578bfd855765d4afd2908fd883a144da5ad`（2026-10-08，`v1.0.3-107-g6401d578b`）。行号均为该树实测；与全库 v1.0.3 基线（`98d2e1947`）区分。本专题由 [`_faq_on_digested/13_recorded_session_snapshots/`](../../_faq_on_digested/13_recorded_session_snapshots/question.md) 的二次研究升级而来——FAQ 保留研究过程归档，本目录是机制消化正文。

## 这一个专题回答什么

一句话：**Pi 把"模型看见了什么"全部记进会话轨迹，并让请求直接从轨迹求值出来。** 围绕这句话有四个问题：

1. **不变量**：为什么说 transcript 就是 model-visible 状态的唯一事实源？它以什么机制保证、边界在哪？（[01](01-model-visible-invariant.md)）
2. **载体**：承载它的 session JSONL 长什么样？有哪些条目、怎么迁移、作为资产有哪些官方通道？（[02](02-session-jsonl-anatomy.md)）
3. **确定性**：在模型不可控的前提下，测试如何让整个循环确定性地跑起来？faux provider 到底能表达什么？（[03](03-faux-and-deterministic-loop.md)）
4. **录制回放**：外部 harness（DSH）的"录制会话快照 → 无 key 回放比对"思想，Pi 有没有、缺什么、能不能 DIY？（[04](04-record-replay-diy-fixture.md)）

![trajectory 专题总览：左半是 model-visible 不变量链（prompt/tools 写入 transcript system message → JSONL append-only → projection 折叠 → declareToolChanges 差量 → provider payload，before_provider_request 是最后断言点）；右半是录制-回放环（真会话 → session.jsonl → 从 assistant 结算推导脚本 → resume/续跑 → 比对），并标注 DSH 的 recorded 一极与 Pi 的 authored 一极](figures/trajectory-overview.svg)

## 为什么值得独立一个专题

这个主题横跨四个既有 section，但每一处都只覆盖一角：

| 既有位置 | 覆盖的 | 没覆盖的 |
|---|---|---|
| [`orchestration/06-session-plane.md`](../orchestration/06-session-plane.md) | 会话树作为**编排时间平面**：分支、恢复、steer/followUp | "transcript 即 model-visible 状态"这条不变量本身 |
| [`agent/03-Memory/`](../agent/03-Memory/)（3.1/3.4） | 压缩与分支摘要的机制 | 会话文件作为轨迹资产的完整形态与回放性 |
| [`agent/03-Memory/3.5_Session_v4.md`](../agent/03-Memory/3.5_Session_v4.md) | **durable 包**的实验线 session（records + documents） | ——注意：那不是本专题的对象。coding-agent 的 JSONL 会话（v3）与 durable session 是两套并存的东西，见 [02](02-session-jsonl-anatomy.md) 的边界节 |
| [`test-strategy/03`](../test-strategy/03-faux-provider-and-harness.md) | faux + harness 作为**测试驱动**的机制 | faux 对失败注入的表达力清单；录制回放与 authored 剧本的对偶 |
| [`test-strategy/10`](../test-strategy/10-extension-repo-test-strategy.md) | DSH 插件测试政策**移植到 pi**的构思 | trajectory 夹具这一层的具体通路（本专题 [04](04-record-replay-diy-fixture.md) 给出实测） |

## 阅读路径

- **只要核心判断（5 分钟）**：读 [01](01-model-visible-invariant.md) 的前两节。带走一句话：DSH 靠"录制请求头再守卫"，Pi 靠"请求从日志求值"，两种实现守的是同一条 `model-visible ⟺ logged` 纪律。
- **要给 extension 做轨迹夹具（15 分钟）**：[04](04-record-replay-diy-fixture.md) 直达——三件套通路已在工作树实测通过，附可直接复刻的原型代码。
- **完整消化（40 分钟）**：按 01 → 02 → 03 → 04 顺序。01 讲合同，02 讲载体，03 讲确定性模型，04 讲录制回放与外部对照。

## 与 `_faq_on_digested/13` 的分工

| | `_faq_on_digested/13` | 本目录 |
|---|---|---|
| 性质 | 研究过程归档（问题 → 证据 → 结论） | 机制消化正文（合同 → 载体 → 确定性 → 回放） |
| 触发 | "Pi 有没有 DSH 录制快照的思想？" | 该问题升级后的系统整理 |
| 独有内容 | 判断的修正过程 | 原型实测、faux 表达力清单、entry 类型表 |
