# 问题:Pi"只是个命令行工具",是不是能力有限?正常/合理的用法到底是什么?

## 背景

上手体感:pi 打开就是一个终端编辑器——没有权限确认弹窗、没有内置 to-do、没有 plan mode、没有 subagent、没有 MCP。对比 Claude Code / Codex 的"全家桶"体验,第一印象就是"能力有限,只能在命令行里干瞪眼"。

但同一份文档又声称 pi 是完整的 coding agent,底层还有 5600+ 包的生态([pi.dev/packages](https://pi.dev/packages))。这两个印象矛盾。

## 具体困惑

1. "命令行 = 能力有限"这个直觉对吗?pi 缺的到底是"能力",还是"默认值"?
2. 用 pi **写代码**时,合理的使用姿势是什么?该做什么准备、按什么流程走?(对标 Claude Code 官方最佳实践)
3. 用 pi 做**信息加工**(非编码:总结、翻译、数据清洗、批量处理)合理吗?合理形态是什么?
4. Claude Code / Codex 的最佳实践里,哪些可以**平移**到 pi,哪些因为设计哲学不同必须**替换**成别的形态?
5. 什么情况下干脆不该用 pi?

## 证据边界

- pi 侧:本仓库源码与文档 v0.84.4(upstream tag `b79e4cc83`),`packages/coding-agent/docs/`、`examples/extensions/`、`.pi/prompts/`;`_digested/` 消化材料。
- Claude Code 侧:Anthropic 官方 [Best practices for Claude Code](https://www.anthropic.com/engineering/claude-code-best-practices)(2026-09-02 抓取全文),只取其"用户该做什么"的建议层,不审计 CC 源码。
- Codex 侧:openai/codex 公开 repo docs(`docs/` 下多为指向 developers.openai.com 的 stub,后者反爬),只取可核对部分;不深审计。
- 生态数据:[pi.dev/packages](https://pi.dev/packages) 首页快照(2026-09-02,共 5637 个包,含下载量)。
- 方法:把 CC/Codex 的"最佳实践动作"逐条映射到 pi 的能力面;映射不上的条目标出来,追问 pi 的替代物;仍无替代物的记为真差距。

## 篇章

| 篇 | 回答什么 |
|---|---|
| [01_capability_map.md](01_capability_map.md) | "能力有限"是默认值差异:CC 最佳实践 16 条 → pi 逐条映射表 + 真差距清单 |
| [02_scenario_playbook.md](02_scenario_playbook.md) | 三个场景的标准动作:写代码 / 信息加工 / 自动化与嵌入 |
| [03_starter_kit.md](03_starter_kit.md) | 最小组装:pi 启动时看到的文件系统三层 + 可直接拷贝的 [starter-kit/](starter-kit/) 成品 |
| [answer.md](answer.md) | 总论:"我应该做什么"行动清单、反模式、什么时候不用 pi |
