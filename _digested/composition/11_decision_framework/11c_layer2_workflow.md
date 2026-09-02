# 11c. 层 2：固定工作流——prompt template

## 什么时候加

**加**：你有一类固定步骤的任务每周至少做一次。每次做时给 agent 的初始指令基本一样。
**不加**：做一次就不做了。任务步骤每次都不一样。

## "写成 prompt template"还是"直接在对话里说"的选择

| 使用频率 | 建议 |
|---------|------|
| 第一次 | 对话里直接说 |
| 第二次 | 还是对话里说（但注意 agent 可能还记得上一条流程） |
| 第三次 | 让 pi 自己写 prompt template |
| 第四次 + | 已经在用 prompt template 了，稳定后考虑是否移到全局层 |

## 典型的工作流 checklist

哪些工作流值得写成 prompt？

- 代码审查（"按 Good/Bad/Ugly/Tests 格式输出"）
- Issue 分析（"先读所有相关代码，不信任 issue 里的分析"）
- Changelog 审计（"列出所有 commit，逐条对 changelog"）
- 端到端收尾（"验证→changelog→commit→push→close issue"）
- 批量文件操作（"对指定目录每个文件做同一件事"）
- 信息提取（"从这个文档提取 action items 输出 Markdown"）

## 锚点

- `6_prompt_templates.md`（prompt template 设计的完整分析）
- `_faq_on_digested/07/02_scenario_playbook.md` A4（第二遍就沉淀的社区经验）

## 最小例证

**例证**：每周要审 3+ 个 PR。每次说"审一下这个 PR，按 What/Good/Bad/Ugly/Tests 输出"。写一个 `pr.md` 把 5 段输出格式固定下来。现在是 `/pr <URL>` 就够了。省掉的不是打字的 30 秒——是省了你每次思考"还要不要查 changelog"的 30 秒决策延迟。