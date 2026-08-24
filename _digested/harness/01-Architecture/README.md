# 01-Architecture — 结构评价：pi 的扩展面是深还是浅

> 本节回答 `harness/` 的第一个问题：**结构优不优秀、好不好扩充。** 用 [`codebase-design`](../../../.agents/skills/codebase-design/) 的词汇（module / interface / implementation / seam / depth / leverage / locality / adapter）做严格评价，不做 cheerleading。

## 本节的立场

"结构优秀"不能靠"它分层了 / 它有很多 hook"来论证——那可能是浅模块堆砌。本节只认三类硬证据：

1. **真 seam 检验**：一个接缝有没有第二个 adapter（一个 adapter = 假想 seam，两个 = 真 seam）。见 [1.1](./1.1_three_tier_seams.md)。
2. **deletion test**：删掉这个接缝，复杂度是消失（它是 pass-through）还是散到 N 个调用方（它赚回了存在）。
3. **design-it-twice**：换成另一种接口设计，会烂在哪。见 [1.2](./1.2_single_injection.md)。

## 篇章

| 篇 | 评的是什么 | 一句话结论 |
|---|---|---|
| [1.1_three_tier_seams.md](./1.1_three_tier_seams.md) | 三层接缝（operations / tool / extension）各自深不深、seam 放得对不对 | 三层对应三条"变化轴"，每层的接口被裁到它调用方的学习预算——这是它深的原因 |
| [1.2_single_injection.md](./1.2_single_injection.md) | 统一注入点 vs 多协议 | 一个口子进、多种能力出，省一次认知成本，代价是生态锁定 |
| [1.3_distribution_loop.md](./1.3_distribution_loop.md) | 分发闭环（单文件 → npm/git） | 本地和分发是同一条路径的自然延伸，没有第二套心智 |
| [1.4_lifecycle_guards.md](./1.4_lifecycle_guards.md) | 两阶段绑定 / stale 保护 / fail-close | 这三道护栏是"能放心挂第三方代码"的前提，不是可有可无 |

## 写作定调（本节专属，叠加在 `../README.md` 之上）

- **每个判断必须落到"这个接口藏了什么复杂度"**，不能停在"这个接口存在"。
- **真 seam 检验必做**：说某层是"好的接缝"之前，先回答"它有没有第二个 adapter"。
- **硬事实 / 解释 / 推测分开标**：源码能核的写"硬事实"，帮助理解的设计动机写"解释"，作者意图的推断写"推测"并标注。
- 机制细节回指 `../../agent/`，本节只做评价，不重述加载/扇出流程。
