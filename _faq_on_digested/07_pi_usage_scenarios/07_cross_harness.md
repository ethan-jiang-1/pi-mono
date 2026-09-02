# 篇七:2026 年跨 harness 最佳实践——比"经典 CC 最佳实践"更新的部分,以及它们在 pi 上怎么落地

> 证据来源(2026-09-02):Claude Code 官方文档(直接抓取);OpenAI Codex 官方页(反爬,经 web 检索摘要 + 已核对镜像重建,文中标"镜像");agents.md 标准;2025-2026 从业者文章。方法与逐源细节见文末引用。

## 自 2025 年经典文之后,官方指引新增了什么

1. **上下文窗口被立为唯一组织原则。**CC 的 best practices 页现在明说:多数最佳实践都从"context 填满 → 性能退化"这一条约束推出来。配了 context 消耗可视化与自定义状态栏。
2. **验证从"一句话建议"升级成四级阶梯**:prompt 内点名检查 → `/goal`(独立小模型逐回合复核完成条件)→ Stop hook(脚本卡回合结束,连续 8 次阻断后放行)→ 验证 subagent / 动态 workflow("干活的不是给自己打分的那个")。
3. **长任务有了官方配方**(Anthropic 2025-11-26《Effective harnesses for long-running agents》):initializer agent 一次性写好 feature 清单(每条标 `passes: false`)+ init 脚本 + progress 文件 + 初始 commit;之后每个会话必须"增量推进 + 留下可合并的干净状态 + 更新进度文件"。点名的两种失败:一口气吃完(上下文耗尽)和过早宣布完成。
4. **指令文件被定量了**:CLAUDE.md 目标 **<200 行**;Codex 的 AGENTS.md 合并上限 **32 KiB**(超了尾部静默丢出上下文)。过程性内容从指令文件移进 skills(按需加载);硬约束用 hook 不用散文("agent 把 memory 文件当上下文,不是当配置")。
5. **AGENTS.md 赢了指令文件之战**:agents.md 标准(Linux Foundation 旗下,60k+ 开源仓库)被 Codex/Jules/Cursor/Devin/opencode/Zed/Gemini CLI/Copilot/Amp/Windsurf 采纳,**Claude Code 现在也官方读取 AGENTS.md**。嵌套规则:离被改文件最近的 wins。
6. **非编码用途转正**:Codex 官方用例目录明确收录数据集清洗/分析/报告、用代码生成幻灯片、Figma→代码;CC 官方支持在笔记库/文档目录里跑。信息加工不再是"民间偏方"。
7. **把"跑通的方法"固化成 skill**:CC 新增 `/run`/`/verify` 内置 skill 与 `/run-skill-generator`——让 agent 把"这个项目怎么启动怎么验证"记成仓库里的 skill 文件,后续任何 agent 照方抓药。Codex 侧对应 Record & Replay。
8. **评估循环成为官方模式**(Codex):给迭代打分、记录分数与改动、迭代到阈值(如 ≥90%)为止,除非新版明确更差否则不回退——"别停在第一个能用的版本"。
9. **多 agent 编排降温**:CC 的 agent teams 仍是实验特性、默认关闭,官方原话是"先看更轻的选项(subagents、跨会话消息)够不够用";明确更差于单会话的场景:顺序任务、同文件编辑、重依赖工作。

## 15 条跨 harness 实践 × pi 落地

综合三路证据按支持强度排序。**1-7、9-12 在裸 pi 上原样可用**(只需要 文件编辑 + shell + git);8、13 需要装包(见 [05 篇](05_package_ecosystem.md));其余见标注。

| # | 实践 | pi 落地 |
|---|---|---|
| 1 | 给 agent 一条能跑的检查,并在 prompt/AGENTS.md 里点名 | 裸 pi 可用;要"每次编辑自动跑"装 pi-lens |
| 2 | Explore → plan → 实现 → commit,计划写进可手编的文件 | `--tools read,grep,find,ls` + PLAN.md(01 篇映射 #2) |
| 3 | 指令文件短、分层、只放事实 | AGENTS.md 全局→父目录链→cwd,同 CC/Codex;目标 <200 行(32KiB 硬上限的教训) |
| 4 | 构建/测试/验证命令写进指令文件,agent 自查 | 同上;pi 无权限弹窗,自查成本为零 |
| 5 | 要证据,不要"做完了" | 裸 pi 可用(test 输出/diff/截图);pi 的可观测性(全程见它读了什么)更强 |
| 6 | 调查类工作交给 subagent,保主上下文干净 | 装 pi-subagents(scout/researcher)或 @tintinweb;或 tmux 双会话 |
| 7 | 长任务:initializer + 进度文件 + feature 清单 + 每会话留干净可合并状态 | 裸 pi 可用(FEATURES.md + PROGRESS.md);要自动续跑/独立审计装 pi-goal-x |
| 8 | 自动化按阶梯升级:prompt → 完成条件 → 卡点 hook → 独立评审 | pi-goal-x(完成条件+auditor)→ extension `on()` 事件自写 hook → pi-subagents reviewer/oracle |
| 9 | 重复过程固化成 skill(Markdown+脚本),不是把 AGENTS.md 写长 | pi 实现同一 Agent Skills 标准;且 skills.sh 官方支持 pi(见 [03 篇](03_starter_kit.md)) |
| 10 | 迭代到分数,不停在"看着行" | prompt 模式即可;正解见 Codex eval 循环,pi 侧配 eval 脚本 + pi-background-tasks |
| 11 | 合入前对抗评审(新上下文专挑毛病) | 双 pi 会话;或 pi-subagents reviewer;评审尺度写进 AGENTS.md(Codex P0/P1 分级法) |
| 12 | 并行工作互相隔离(worktree/目录),绝不同文件双 agent | git worktree + 多 pi;本仓库 AGENTS.md 的 git 纪律就是这条的散文版 |
| 13 | fire-and-forget 的工作放隔离环境;生产仓库收紧 | 容器(containerization.md)/bwrap 扩展;Willison 的"专用非敏感研究仓库"模式对 pi 完全适用 |
| 14 | 用 coding agent 做非编码信息加工,产出留成可复跑脚本 | 裸 pi 可用(-p/管道/json 模式,02 篇场景 B);Codex 已将其列为官方用例 |
| 15 | 记录你的纠正:同样错误第二次 → 指令文件;个人偏好 → 本地覆盖;硬禁止 → hook | AGENTS.md 全局 + `AGENTS.override.md`;hook 用 extension 写;CC 的 auto-memory 对应 pi 生态的 pi-memory/@remnic |

## 对 01 篇映射表的三处增量修正

1. **指令文件**:CC 现在也读 AGENTS.md——01 篇"换文件名"的说法可以升级为"AGENTS.md 是唯一跨 harness 标准,写一次三家通吃"。
2. **验证**:CC 新增的 /goal、Stop hook、验证 subagent 在 pi 无内置对应——但包生态四级全有货(见 05 篇对账节),"内置 → 包"的判断不变、更扎实。
3. **plan mode 的形态之争有了第三方证词**:CC 的 plan 会最终写成 markdown 文件(与 pi 的 PLAN.md 同构);@plannotator 浏览器批注是"要 UI"时的共同答案。

## 引用

- [Best practices for Claude Code(2025 末重写版)](https://code.claude.com/docs/en/best-practices) · [Common workflows](https://code.claude.com/docs/en/common-workflows) · [Skills](https://code.claude.com/docs/en/skills) · [Memory](https://code.claude.com/docs/en/memory) · [/goal](https://code.claude.com/docs/en/goal) · [Agent teams](https://code.claude.com/docs/en/agent-teams)
- [Anthropic: Effective harnesses for long-running agents (2025-11-26)](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- Codex 官方(canonical,反爬经镜像核对):[Best practices](https://developers.openai.com/codex/best-practices) · [AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md) · [Codex 101 用例目录](https://developers.openai.com/showcase/codex-101)(镜像:[CodexGuide AGENTS.md](https://github.com/freestylefly/CodexGuide/blob/main/docs/advanced/02-agents-md.md)、[GeekNews 全译](https://news.hada.io/topic?id=27938))
- [agents.md 标准](https://agents.md)
- [Simon Willison: Code research projects with async coding agents (2025-11-06)](https://simonwillison.net/2025/Nov/6/async-code-research/) · [Claude Skills (2025-10-16)](https://simonwillison.net/2025/Oct/16/claude-skills/)
- [跨 harness 配置文件兼容矩阵(2026-04)](https://github.com/codylindley/ai-harness-engineering-compatibility-matrix)
