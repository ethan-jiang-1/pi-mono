# 03-Patterns — 扩充（extension）靠什么套路（pattern）成立

> 本节回答 `extensions/` 的最后一个问题：**"极简核 + 靠扩展长能力"这套思路，靠什么套路才能既安全又便宜地长期运转。** 前面两节讲"核有多小""扩充有哪些轴"，本节讲"让这些成立的设计套路"。

## 三个套路

| 套路 | 解决的问题 | 一句话 | 配图 |
|---|---|---|---|
| [3.1 一个工厂函数](./3.1_one_factory.md) | 扩充的"语法"要统一 | 一个默认导出的工厂（factory） + 一个 `pi` 对象，是唯一的心智模型 | [3.1_factory_phases.svg](figures/3.1_factory_phases.svg) |
| [3.2 覆盖与复用](./3.2_override_and_reuse.md) | 扩充不能逼作者重写核 | 同名覆盖、`defineTool`/`createXxxTool` 工厂、`operations` 接口、slot 分离 | [3.2_override_reuse.svg](figures/3.2_override_reuse.svg) |
| [3.3 安全护栏](./3.3_safety_guards.md) | 挂第三方代码要有边界 | 两阶段绑定、stale 保护、fail-close——"敢挂第三方"的前提 | [3.3_safety_guards.svg](figures/3.3_safety_guards.svg) |

## 写作定调

- 这三个套路在 `agent/`（1.4、4.4）有完整机制，本节**只讲"套路对扩充思路意味着什么"**，不重述加载/扇出实现。
- 与 `harness/01-Architecture/1.2`（统一注入点的取舍）呼应：那里说"一个口子"的利弊，这里说"一个口子"之所以能用，靠的是这三个套路把复杂性藏住了。
- 每个套路都要落到"它让扩展作者省了什么、让核避免了什么"。
