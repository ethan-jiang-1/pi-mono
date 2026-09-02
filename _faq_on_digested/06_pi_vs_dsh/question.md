# 问题：pi vs DSH —— 两个"很灵活"的 harness，共性、差异、优缺点各是什么？

## 背景

pi-mono 和 DeepSeek Harness（DSH）都被认为是"灵活的 coding harness"，但灵活的形态看起来完全不同：

- **pi**：把核心弄到极小并稳住（8 个内置工具 + loop + 统一扩展口），其他能力全靠 extension 长出去——plan-mode、subagent 都是 example 扩展。
- **DSH**：看什么都是 plugin——"everything is a plugin"，运行时由插件树组合而成。

## 具体困惑

1. 两者都在强调"灵活"，这个"灵活"是同一件事吗？
2. 共性是什么？各自把哪一层设为"不可变锚点"？
3. 差异是什么？是"扩展多少"的差异，还是"灵活的位置"的差异？
4. 谁在哪方面有突出优点、谁在哪方面有突出缺点？
5. 什么场景选谁？（DSH 自己有没有给过"什么时候别用插件式运行时"的判据？）

## 证据边界

- pi 侧引用本仓库 `_digested/`（harness/ 评价维度、extensions/ 扩充思路、agent/01-Anatomy/1.4 扩展系统），源码以 pi-mono `v0.84.4`（upstream `b79e4cc83`）为基线。
- DSH 侧引用 `/Users/bowhead/deepseek-harness/_digested/`（system/、composition/、cordis-runtime/、capability-seams/、harness-idea/），源码基线 DSH `0.1.1-rc.1`（commit `528c682e061696f5a160f363f236ecbf53cbd006`）。
- 两边只做"消化材料→判断"，不做对方源码的新审计。

## 篇章

| 篇 | 回答什么 |
|---|---|
| [01_common.md](01_common.md) | 共性：同一条河的两种渡法 |
| [02_differences.md](02_differences.md) | 差异：灵活的位置不同，不是多 vs 少 |
| [03_mechanism_table.md](03_mechanism_table.md) | 机制对照表：六个维度的逐项对比 |
| [04_strengths_weaknesses.md](04_strengths_weaknesses.md) | 各自突出优点与硬伤 |
| [answer.md](answer.md) | 总论：一句话判断 + 适用场景 |