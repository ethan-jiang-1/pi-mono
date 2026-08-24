# 04-Self-Description — 自描述：harness 怎么把自己说清楚给上面的 coding agent 听

> 本节回答 `harness/` 的第四个问题：**作为 coding harness，pi 有没有把自己说清楚，让在上面跑的 coding agent 能轻松捕捉到东西。** 结论先行：有，而且分层、同源、随包可达，比大多数 harness 更自觉。

## 本节的立场

一个 coding harness 的"自描述"不是"文档写得多"，而是三件事：

1. **够得到**：agent 运行时能真的 read 到这些描述（不是外链、不是 wiki）。
2. **不腐化**：描述和它描述的东西同源，不会漂移（工具变了，prompt 里的工具列表自动跟着变）。
3. **分层**：harness 自述 / 项目约定 / 领域知识三者分开注入，不混成一段大杂烩。

本节每篇各检验一条。

## 篇章

| 篇 | 评的是什么 | 一句话结论 |
|---|---|---|
| [4.1_system_prompt_self.md](./4.1_system_prompt_self.md) | system prompt 自报家门 + 文档地图 | 教 agent 怎么查自己，而不是替 agent 背下自己 |
| [4.2_tool_prompt_contract.md](./4.2_tool_prompt_contract.md) | 工具的 `promptSnippet`/`promptGuidelines` 同源 | 工具自描述和工具定义锁在一起，永不漂移 |
| [4.3_docs_in_package.md](./4.3_docs_in_package.md) | docs/examples 随包分发 | 自描述是"活文档"，agent 运行时够得到 |
| [4.4_context_layers.md](./4.4_context_layers.md) | harness/项目/skills 三层分离注入 | 三份信息分层，不混成大杂烩 |

## 写作定调（本节专属，叠加在 `../README.md` 之上）

- **自描述的评价标准是"agent 能不能真的捕获到"**：不是"文档写了"，是"文档在 agent 够得着的地方 + system prompt 给了路径 + 相对路径可解析"。
- **重点评"同源性"**：描述和它描述的对象是否锁在一起（防漂移），这是自描述会不会腐化的关键。
- 机制回指 `../../agent/04-Harness/4.2_Skills.md`、`4.3_System_Prompt.md`；与 [03-Discipline](../03-Discipline/README.md) 的"AGENTS.md 双向服务"互相印证。
