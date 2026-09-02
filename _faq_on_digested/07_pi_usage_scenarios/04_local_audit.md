# 篇四:本机审计——pi 在这台机器上到底"看到"了什么

> 结论先行:**"pi 能力有限"在这台机器上是真实体感,但原因是全局层为空,不是 pi 的问题。**`~/.pi/agent/` 里没有全局 AGENTS.md、没有 prompt templates、没有 skills,只装了一个模型列表清理扩展;而同一台机器上,`~/.claude/skills/` 装着 37 个技能、`~/mattpocock-skills` 有整套工程方法论和两本自建手册。pi 从未获得过这些资产——它们全都活在 pi 的扫描路径之外。

## 审计时间与范围

2026-09-02,直接读取本机路径(证据均为文件系统实况,非推断):

- `~/.pi/agent/`(pi 全局层)
- `~/.claude/`(Claude Code 配置)
- `~/.codex/`(Codex 配置)
- `~/mattpocock-skills`、`~/grillme-skills`(技能库克隆)
- `~/` 下相关项目(`spec-kit`、`OpenSpec`、`12-factor-agents`、`claude-code-src`、`codex`、`opencode` 等)

## 逐项盘点

### pi 全局层 `~/.pi/agent/`( pi 每次启动真正加载的)

| 项 | 现状 | 影响 |
|---|---|---|
| `AGENTS.md`(全局个人规则) | **不存在** | pi 对"你是谁、你的纪律"一无所知,每个会话从零猜 |
| `prompts/*.md`(模板) | **目录不存在** | 重复的话每次手打 |
| `skills/` | **目录不存在** | 无任何技能,方法论为零 |
| `extensions/` | 只有 `slim-models.ts`(清理内置 provider 模型列表:屏蔽 anthropic 13 个模型、精简 zai) | 与工作流能力无关 |
| `settings.json` | 仅 `defaultProvider: deepseek`、`defaultModel: deepseek-v4-flash`、`thinking: high`、主题、TUI 模式 | 没有任何能力接线(无 `skills` 数组等) |
| `trust.json` | 8 个项目已信任(ai_dev 系列、deepseek-harness、pi-mono) | 项目层 `.pi/` 资源在这些项目里可用,但那些项目里也基本没放东西 |
| `models.json` / `models-store.json` | 自定义模型(第三方中转,见 [FAQ 03](../03_third_party_provider_baseurl/question.md)) | 已配置好,无问题 |

### 一墙之隔的 `~/.claude/`(同一台机器,同一批任务)

`~/.claude/skills/` 装 **37 个技能**(与 [mattpocock/skills](https://github.com/mattpocock/skills) 高度重合):

> ask-matt, claude-handoff, code-review, codebase-design, diagnosing-bugs, domain-modeling, find-skills, git-guardrails-claude-code, grill-me, grill-with-docs, grilling, handoff, implement, improve-codebase-architecture, loop-me, migrate-to-shoehorn, prototype, research, resolving-merge-conflicts, scaffold-exercises, setup-matt-pocock-skills, setup-pre-commit, setup-ts-deep-modules, tdd, teach, to-questionnaire, to-spec, to-tickets, triage, wait-what, wayfinder, wizard, writing-beats, writing-for-agents, writing-fragments, writing-shape, youtube-transcript

这是一套完整的工程流:router(`/ask-matt`)→ 对齐(`/grill-with-docs`、`/domain-modeling`)→ 研究(`/research`)→ 规格(`/to-spec`→`/to-tickets`)→ 实现(`/implement` 内嵌 `/tdd`,收尾调 `/code-review`)→ 诊断(`/diagnosing-bugs`)→ 交接(`/handoff`)。**pi 一个都没有加载。**

### `~/.codex/`

`AGENTS.md` 存在但为**空文件**。也就是说不是"pi 特别缺配置"——三家里只有 Claude Code 是配置完整的。

### `~/` 下的方法论资产(未被任何 harness 自动消费)

| 资产 | 是什么 | 对 pi 的价值 |
|---|---|---|
| `~/mattpocock-skills`(与 `~/grillme-skills` 的 `skills/` 完全相同,`diff -rq` 零差异) | Matt Pocock "Skills for Real Engineers" 完整仓库,含 `skills/engineering/*`、`skills/productivity/*`;官方经 skills.sh 分发(skills.sh 上该仓库累计 290 万+ 安装) | **skills.sh 官方支持 Pi**(项目路径 `.pi/skills/`,全局路径 `~/.pi/agent/skills/`)——一条命令接入 |
| `_handbook_for_engineering/` | 自建 AI 工程手册:tutorial 00-12 + manual(define / design-and-plan / build / verify / ship-run-evolve / collaboration),每页带方法、模板、命令卡、质量门 | 07 场景 A 的方法论母本,比任何网文深 |
| `_handbook_for_information_work/` | 自建信息加工手册:tutorial 00-07 + manual(task-brief / facts-evidence / judgment-options / delivery-review / collaboration-handoff / reliable-repetition) | 07 场景 B 的方法论母本;其中明确列了信息工作可用的 skill 边界(grill-me、research、to-questionnaire、handoff、wait-what、wizard、teach、grill-with-docs、writing-for-agents) |
| `spec-kit`、`OpenSpec`、`12-factor-agents` 等 | 规格驱动/agent 方法学文献 | 对照参考;mattpocock README 明确把自己定位为"小而可组合,反对接管流程的重方法论" |

## 差距诊断

1. **不是模型问题,不是 pi 问题,是加载路径问题。**能力资产(37 技能、两本手册)与 pi 的扫描路径(`~/.pi/agent/skills/`、`.pi/skills/`、`.agents/skills/`、settings `skills` 数组)零交集。
2. **三家 harness 配置水平:Claude Code 满,Codex 空,pi 近乎空。**你感受到的"pi 不如 Claude Code",相当一部分是这 37 个技能在说话,不是底层模型或 harness 在说话。
3. **好消息:差距是纯接线问题。**skills.sh 官方支持 pi;pi 官方支持读取 `~/.claude/skills` 目录(skills.md "Using Skills from Other Harnesses");两条路都不需要写一行扩展代码。

## 最短接线路径(十分钟,详见 [03_starter_kit.md](03_starter_kit.md))

```bash
# 路线一:skills.sh 官方 pi 目标,全局安装(装到 ~/.pi/agent/skills/)
npx skills add mattpocock/skills --agent pi -g

# 路线二:直接复用 Claude Code 已装的 37 个(skills.md 官方做法)
# ~/.pi/agent/settings.json 加:
# { "skills": ["~/.claude/skills"] }
```

外加一份全局 `~/.pi/agent/AGENTS.md`(5-10 行个人纪律)——本机审计显示这是三台 harness 里唯一完全缺失的底层件。
