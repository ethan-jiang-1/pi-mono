# 篇三:最小组装——让"启动 pi 就能干活"的现成件(v2,经 2026-09 深挖修订)

> 直答:**pi 的"组装"全部是文件,不是配置界面**——把东西放到 pi 会扫描的位置,下次启动自动生效。而本机审计([04 篇](04_local_audit.md))显示:你缺的件大部分**已经在你硬盘上**(37 个 Claude Code 技能、整库的 mattpocock/skills、两本自建手册),只是没接进 pi 的扫描路径。所以组装分三层,从"接线"开始,而不是从"手写"开始。

## pi 启动时"看到"的文件系统

pi 没有中心化配置页,它的"能力视图"就是三层文件系统(v0.84.4,见 `packages/coding-agent/docs/usage.md`、`skills.md`、`prompt-templates.md`):

| 层 | 位置 | 放什么 | 备注 |
|---|---|---|---|
| 全局层 | `~/.pi/agent/` | `AGENTS.md`(个人规则)、`prompts/*.md`、`skills/`、`extensions/`、`settings.json` | 所有项目生效,无 trust 问题 |
| 项目层 | 项目根 + `.pi/` | 根 `AGENTS.md`(或 `CLAUDE.md`)、`.pi/prompts/*.md`、`.pi/skills/`、`.agents/skills/` | 项目 `.pi/` 资源要等项目被 trust 后才加载(首次交互启动会问;`/trust` 保存) |
| CLI 层 | 启动参数 | `--skill <path>`、`--prompt-template <path>`、`-e <extension>`、`--tools <list>` | 一次性覆盖,叠加在上两层之上 |

验证"pi 真的看到了":启动 header 会列出载入的 context files、prompt templates、skills、extensions;或启动后输入 `/` 看模板与 `/skill:` 命令补全。

## 第一层:接线已有资产(十分钟,零手写)

本机已有但 pi 看不见的,两条官方路任选(可并用):

```bash
# 路线 A:skills.sh 官方支持 Pi(项目路径 .pi/skills/,全局路径 ~/.pi/agent/skills/)
npx skills add mattpocock/skills --agent pi -g
# 整套工程方法论进 ~/.pi/agent/skills/:ask-matt / grill-with-docs / research /
# triage / to-spec / to-tickets / implement(内嵌 tdd+code-review)/ diagnosing-bugs / handoff …

# 路线 B:直接复用 Claude Code 已装的 37 个技能(pi 官方文档写明的做法)
# ~/.pi/agent/settings.json 加:
{ "skills": ["~/.claude/skills"] }
```

外加**全局 `~/.pi/agent/AGENTS.md`**(本机审计显示:三台 harness 里唯一完全缺失的底层件):

```markdown
# Global rules
- Reply in 中文; technical prose only, no filler.
- Never commit unless I explicitly ask.
- Commit only files you changed in this session; stage explicit paths, never `git add -A`.
- After code changes, run the project's check command from its AGENTS.md and fix all failures before claiming done.
- Read files in full before editing files you have not inspected.
```

## 第二层:按场景装包(不要一次全装,货号见 [05 篇](05_package_ecosystem.md))

```bash
# 开发栈(按需挑)
pi install npm:pi-lens                    # 每次 edit 自动跑 LSP/linter/类型检查——把"验证回路"机械化
pi install npm:@juicesharp/rpiv-todo      # 任务状态抗 compaction
pi install npm:pi-subagents               # reviewer/oracle 第二意见、scout 调查
pi install npm:pi-mcp-adapter             # 需要接 MCP 时(导入现有 .mcp.json 即可)

# 研究/信息加工栈
pi install npm:pi-web-access              # 零配置搜索/抓取/PDF/YouTube
pi install npm:pi-memory                  # 发现沉淀(~/.pi/agent/memory/,markdown 可 git)

# 方法论 skill 包(与第一层二选一即可,别叠两套纪律)
pi install npm:bigpowers                  # 要硬纪律:6 阶段 SDLC + 质量门
pi install npm:@dietrichgebert/ponytail   # 要克制:最小代码倾向
```

## 第三层:项目文件件(无现成资产可接时的兜底)

[`starter-kit/`](starter-kit/) 是一套可直接拷贝的最小成品:

```
starter-kit/
├── README.md              # 拷贝方法 + 启动验证步骤
├── AGENTS.md              # → 拷到项目根(按项目改)
└── .pi/
    ├── prompts/
    │   ├── plan.md        # → /plan   探索并写 PLAN.md,不动代码
    │   ├── review.md      # → /review 审查未提交改动,给 verdict
    │   └── done.md        # → /done   验证→commit(显式路径)→报告
    └── skills/
        └── verify.md      # → verify skill:跑检查到绿并出示证据
```

```bash
cp -r starter-kit/AGENTS.md /path/to/your-project/   # 然后按项目改
cp -r starter-kit/.pi /path/to/your-project/
cd /path/to/your-project && pi                        # 首次会问 trust → /trust 保存
```

> 装了第一层的 skills 后,`/plan`/`/review`/`/done` 与 mattpocock 的 `/to-spec`、`/implement`、`/code-review` 部分重叠——kit 的价值是**零依赖兜底**(不接技能库时用)和"按自己项目定制"的底稿;两套不冲突,但命令多了记不住,选一套顺手的。

## 方法论的"更深处":两本自建手册

手写模板之前,先查你自己已经写好的方法论(本机 `~/mattpocock-skills/` 下):

- **`_handbook_for_engineering/`**:AI 工程手册,manual 按"你现在卡在哪"进入(define / design-and-plan / build / verify / ship-run-evolve / collaboration),每页带模板、命令卡、质量门。
- **`_handbook_for_information_work/`**:信息加工手册(task-brief / facts-evidence / judgment-options / delivery-review / collaboration-handoff / reliable-repetition),并明确了信息工作可用的 skill 边界。

07 各场景的手册级细节以这两本为准;本 FAQ 只负责"怎么把它们接到 pi 上"。

## 本仓库的成熟活例(值得直接抄)

| 文件 | 形态 | 抄什么 |
|---|---|---|
| `.pi/prompts/wr.md` | 端到端收尾(changelog→commit→push→关 issue) | 收尾类模板:上下文探测规则、编号步骤、约束清单 |
| `.pi/prompts/pr.md` | PR 结构化审查(What/Good/Bad/Ugly/Tests) | 审查类模板:固定输出格式、禁止 checkout PR 分支的护栏 |
| `.pi/prompts/is.md` | issue 分析(不信任 issue 里的分析,独立验证) | 分析类模板:"读全部相关代码、不截断"这类硬规则 |
| `.pi/skills/add-llm-provider.md` | 单文件 skill(多文件改动 checklist) | skill 结构:frontmatter → 分步 checklist → 精确到文件路径 |
| 根 `AGENTS.md` | 项目级 AGENTS.md | AGENTS.md 的度:只放"不写会错"的,一条一义 |

## 引用

- `packages/coding-agent/docs/usage.md`:context files 加载链、startup header、trust 机制
- `packages/coding-agent/docs/skills.md`:skill 发现规则;**"Using Skills from Other Harnesses"**(settings 挂 `~/.claude/skills`、`~/.codex/skills` 的官方做法)
- [skills.sh CLI 文档](https://github.com/vercel-labs/skills):官方支持列表含 **Pi**(`.pi/skills/` / `~/.pi/agent/skills/`),并反向链接 pi 的 skills.md
- [mattpocock/skills](https://github.com/mattpocock/skills):skills.sh 分发,290 万+ 安装
- [04_local_audit.md](04_local_audit.md)、[05_package_ecosystem.md](05_package_ecosystem.md):本机与生态证据
