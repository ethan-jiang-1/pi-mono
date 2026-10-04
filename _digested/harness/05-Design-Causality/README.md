# 05-Design-Causality — pi 为什么长成这个形状(设计因果层)

> **基线**:pi-mono `v1.0.0`(tag `a13d35a74`)。本目录引用的文件均在 HEAD `f0e079560` 复核,与 `v1.0.0` 一致。
>
> 方法声明:本目录的分析框架——**参与知识外置程度分级、正确路径的摩擦差、反馈三环**——借鉴 DSH `_digested/harness-idea/` 的消化纪律(该专题自称"以判断为主",并要求判断与证据分离);全部**事实与结论取自 pi-mono 自己的源码与文档**,且不预先假设 pi 应当与 DSH 同形。对照性结论只引用 [`_faq_on_digested/06_pi_vs_dsh/`](../../../_faq_on_digested/06_pi_vs_dsh/answer.md),不重做。

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
| [01-Architecture](../01-Architecture/README.md) | 5.2 解释其因果(纪律↔接缝互为因果),不重复其结构分析 |
| [02-Boundaries](../02-Boundaries/README.md) | 5.3/5.4 的"空缺"引用其边界结论,不重判 |
| [03-Discipline](../03-Discipline/README.md) | 5.2/5.3 的直接上游;本目录补"为什么是这条纪律"与"摩擦差"视角 |
| [04-Self-Description](../04-Self-Description/README.md) | 5.1 是其延伸:从"自述够不够"推广到"知识外置分级" |
| [`../../orchestration/`](../../orchestration/README.md) | 编排面的机制事实归它;本目录不重复 |
