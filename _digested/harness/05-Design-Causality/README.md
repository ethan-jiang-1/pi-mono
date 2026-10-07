# 05-Design-Causality — pi 为什么长成这个形状(设计因果层)

> **历史起点**：本专题最初按 `v1.0.0`（tag `a13d35a74`，当时复核锚点 `f0e079560`）写作。本轮四篇正文与配图局部复核到 `cb18c7cbc89d5becbb4ea2e490a6e7ad0e989f04`；引用的其它专题保留各自基线，不再声称当前源码与旧 tag 逐字一致。
>
> 方法声明：参与知识外置分级、正确路径摩擦差、反馈三环的组织视角，历史上受 DSH `harness-idea` 启发。保留这一出处，不将研究框架伪装成 Pi 作者原生术语。**Pi 行为事实只用 Pi 源码/docs 核对，因果解释另行标明限制**。Pi 原生动机的独立论证见 [理念 FAQ](../../../_faq_on_digested/12_pi_philosophy/answer.md)。

## 这是什么

01-04 四个子目录回答"结构好不好、边界在哪、纪律如何、自述够不够"——它们以 pi 的现状为基准做**评价**。本目录往回退一步问**因果**:

1. 这些结构是**被什么逼出来的**(生产方式、组合压力、纪律选择)?
2. pi 把"如何正确参与"的知识**外置到了哪一层**(系统/文档/人脑)?哪一层还是空的?
3. 失败信号如何流动,pi 如何从自己的失败里改规则?

换言之:01-04 是横截面,本目录是纵剖面。硬事实/解释/推测按本仓库惯例分开标记。

## 篇章

| 问题 | 篇 |
|------|-----|
| pi 把参与知识放在哪三层?每层的覆盖与空缺? | [5.1_knowledge_externalization.md](./5.1_knowledge_externalization.md) |
| "极简核 + 深扩展口 + library-first"这个形状的因果来源? | [5.2_shape_causality.md](./5.2_shape_causality.md) |
| 正确做法与错误做法的摩擦差在哪?哪里摩擦差消失了? | [5.3_paved_road_friction.md](./5.3_paved_road_friction.md) |
| 失败如何塑形、反馈如何落账、pi 如何从失败改规则? | [5.4_feedback_loops.md](./5.4_feedback_loops.md) |

## 阅读顺序

5.1 → 5.2 → 5.3 → 5.4。5.1 与 5.2 立基底,5.3 与 5.4 分别检验"读懂后做不做得到对"与"错了之后系统怎么学"。

## 与现有子目录的关系

| 子目录 | 本目录的关系 |
|--------|--------------|
| [01-Architecture](../01-Architecture/README.md) | 5.2 讨论纪律与接缝相互支持，不声称证明全部历史因果 |
| [02-Boundaries](../02-Boundaries/README.md) | 相关边界作为研究入口；本轮用当前一手合同核对并收窄旧绝对判断 |
| [03-Discipline](../03-Discipline/README.md) | 5.2/5.3 的直接上游;本目录补"为什么是这条纪律"与"摩擦差"视角 |
| [04-Self-Description](../04-Self-Description/README.md) | 5.1 是其延伸:从"自述够不够"推广到"知识外置分级" |
| [`../../orchestration/`](../../orchestration/README.md) | 编排面的机制事实归它;本目录不重复 |
