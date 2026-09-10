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

- pi 侧:本仓库源码与文档 v0.85.1(upstream tag `d981de122`),`packages/coding-agent/docs/`、`examples/extensions/`、`.pi/prompts/`;`_digested/` 消化材料。
- **本机实证(2026-09-02 补充)**:`~/.pi/agent/`、`~/.claude/`、`~/.codex/`、`~/mattpocock-skills` 等路径的文件系统实况,见 [04 篇](04_local_audit.md)。用户直觉"要离开这个项目才能找到答案"的这一半,靠本机审计回答。
- Claude Code 侧:Anthropic 官方 Best practices(2025 末重写版)及 Common workflows / Skills / Memory / goal 等新页;Codex 侧:官方页反爬,经检索摘要与已核对镜像重建;agents.md 标准。细节见 [07 篇](07_cross_harness.md)。
- 生态与社区(2026-09-02 补充):pi.dev/packages 全量爬取(5,626 包)+ 约 18 个包 README 逐个核对,见 [05 篇](05_package_ecosystem.md);pi 社区实战用法(作者博文、pi.dev 官方材料、HN/Reddit、GitHub 生态),见 [06 篇](06_field_usage.md)。
- 方法:先把 CC/Codex 的"最佳实践动作"逐条映射到 pi 的能力面(01 篇);再用本机审计 + 三路网络深挖验证与加深;映射不上或有更好实践的,修订前文。

## 篇章

| 篇 | 回答什么 |
|---|---|
| [01_capability_map.md](01_capability_map.md) | "能力有限"是默认值差异:CC 最佳实践 16 条 → pi 逐条映射表 + 真差距清单 |
| [02_scenario_playbook.md](02_scenario_playbook.md) | 三个场景的标准动作:写代码 / 信息加工 / 自动化与嵌入 |
| [03_starter_kit.md](03_starter_kit.md) | 最小组装(v2 三层):接线已有资产 → 场景装包 → [starter-kit/](starter-kit/) 文件件 |
| [04_local_audit.md](04_local_audit.md) | 本机实证:`~/.pi/agent` 全局层为空 vs 一墙之隔的 37 个技能与两本手册 |
| [05_package_ecosystem.md](05_package_ecosystem.md) | 包生态深挖:头部 18 包逐个核到 README;开发栈 / 研究栈组合 |
| [06_field_usage.md](06_field_usage.md) | 社区实战:作者用法、HN 共识与反方、dotfiles、被证伪材料 |
| [07_cross_harness.md](07_cross_harness.md) | 2026 跨 harness 新实践(CC/Codex 官方更新)及其 pi 落地;15 条排序 |
| [answer.md](answer.md) | 总论:"我应该做什么"行动清单、反模式、什么时候不用 pi |
