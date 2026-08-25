# 01-Core — 核（core）到底有多小

> 本节回答 `extensions/` 的第一个问题：**什么留在核（core）里，什么必须出去，判据（criterion）是什么。** 它是理解"靠扩展长能力"的前提——先知道核小成什么样，才知道"扩充"是在给什么东西补肉。

## 本节立场

"核极小"不是一句口号，要落到两个可核对的事实：

1. **核的清单**：核里到底有哪些东西，每一件的理由是什么（见 [1.1](./1.1_minimal_core.md)）。
2. **故意不做**：哪些别的 harness 会内置的功能，pi 主动把它做成了示例而不是核（见 [1.2](./1.2_skipped_features.md)）。

## 篇章

| 篇 | 讲什么 | 一句话结论 | 配图 |
|---|---|---|---|
| [1.1_minimal_core.md](./1.1_minimal_core.md) | 核（core）的清单与"进核 vs 扩展"判据 | 核只留"跑循环 + 摸文件 + 挂扩展"三件事，其余一律有更强的理由待在外面 | [1.1_core_boundary.svg](figures/1.1_core_boundary.svg) |
| [1.2_skipped_features.md](./1.2_skipped_features.md) | plan-mode / subagent 被故意做成示例 | "skips features like sub agents and plan mode"是哲学实锤，不是资源不够 | [1.2_primitives_to_workflow.svg](figures/1.2_primitives_to_workflow.svg) |

## 写作定调

- 机制细节回指 `../../agent/`，本节只回答"核里有什么、为什么"。
- 与 `../../harness/03-Discipline/3.1_core_minimal.md`（纪律视角）互补：那里讲"纪律逼出极小核"，这里讲"极小核具体小成什么样"。
- 每条"为什么留在核里"都必须给出**它没法被扩展替代**的理由，否则它就该出去。
