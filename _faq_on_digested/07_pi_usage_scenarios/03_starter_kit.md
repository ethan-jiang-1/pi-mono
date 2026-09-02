# 篇三:最小组装——让"启动 pi 就能干活"的现成件

> 直答:**有。pi 的"组装"全部是文件,不是配置界面**——把几个文件放到 pi 会扫描的位置,下次启动自动生效。本目录 [`starter-kit/`](starter-kit/) 是一套可直接拷贝的最小成品;本仓库 `.pi/` 里还有更成熟的活例可抄。

## pi 启动时"看到"的文件系统

pi 没有中心化配置页,它的"能力视图"就是三层文件系统(v0.84.4,见 `packages/coding-agent/docs/usage.md`、`skills.md`、`prompt-templates.md`):

| 层 | 位置 | 放什么 | 备注 |
|---|---|---|---|
| 全局层 | `~/.pi/agent/` | `AGENTS.md`(个人规则)、`prompts/*.md`、`skills/`、`extensions/`、`settings.json` | 所有项目生效,无 trust 问题 |
| 项目层 | 项目根 + `.pi/` | 根 `AGENTS.md`(或 `CLAUDE.md`)、`.pi/prompts/*.md`、`.pi/skills/` | **项目 `.pi/` 资源要等项目被 trust 后才加载**(首次交互启动会问;`/trust` 保存决定) |
| CLI 层 | 启动参数 | `--skill <path>`、`--prompt-template <path>`、`-e <extension>`、`--tools <list>` | 一次性覆盖,叠加在上两层之上 |

验证"pi 真的看到了":启动 header 会列出载入的 context files、prompt templates、skills、extensions(usage.md L11);或启动后输入 `/` 看模板补全、`/settings` 看开关。

## 最小可用组合(约 15 分钟,按性价比排序)

1. **项目根 `AGENTS.md`**(杠杆最大,没有之一):构建/测试命令、代码风格红线、工作流纪律。只放"没有它会出错"的内容。
2. **2-3 个 prompt templates**(`.pi/prompts/`):把你重复说的话固化。最少两个:`/plan`(探索+写 PLAN.md)和 `/review`(审查当前改动)。
3. **1 个 verify skill**(`.pi/skills/verify.md`):把"跑检查→读错误→修根因→迭代到绿→出示证据"固化成可复用流程。
4. (可选)**按需装包**,不要一次全装:
   ```bash
   pi install npm:@juicesharp/rpiv-todo   # to-do 覆盖层
   pi install npm:pi-subagents            # 子代理委派
   pi install npm:pi-web-access           # 搜索/抓网页
   ```

做完 1-3,启动 pi 就是"配好的":模型知道怎么检查自己的工作、你有一键审查/规划/收尾、不用再每次重述纪律。这就是"启动就能做挺好的事情"的全部——**没有比这更神秘的东西了,pi 的默认 4 工具本身已经够用,缺的只是这些放在文件里的'项目常识'。**

## [`starter-kit/`](starter-kit/) 目录树

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

用法:

```bash
cp -r starter-kit/AGENTS.md /path/to/your-project/   # 然后按项目改
cp -r starter-kit/.pi /path/to/your-project/
cd /path/to/your-project && pi                        # 首次会问 trust → /trust 保存
```

## 本仓库的成熟活例(值得直接抄)

| 文件 | 形态 | 抄什么 |
|---|---|---|
| `.pi/prompts/wr.md` | 端到端收尾(changelog→commit→push→关 issue) | **收尾类模板怎么写**:上下文探测规则、编号步骤、约束清单(永不 `git add -A` 等) |
| `.pi/prompts/pr.md` | PR 结构化审查(What/Good/Bad/Ugly/Tests) | **审查类模板**:固定输出格式、禁止 checkout PR 分支的护栏 |
| `.pi/prompts/is.md` | issue 分析(不信任 issue 里的分析,独立验证) | **分析类模板**:"读全部相关代码、不截断"这类硬规则 |
| `.pi/skills/add-llm-provider.md` | 单文件 skill(多文件改动的 checklist) | **skill 结构**:frontmatter(name+description)→ 分步 checklist → 每步精确到文件路径 |
| 根 `AGENTS.md` | 项目级 AGENTS.md(对话风格/git 纪律/测试/发布) | **AGENTS.md 的度**:只放"不写会错"的,一条一义 |

## 全局层建议(一次性,五分钟)

`~/.pi/agent/AGENTS.md` 放跨项目个人纪律,例如:

```markdown
# Global rules
- Reply in 中文; technical prose only, no filler.
- Never commit unless I explicitly ask.
- After code changes, run the project's own check command from project AGENTS.md.
- Prefer reading files in full before wide-ranging changes.
```

全局放"你是谁怎么干活",项目放"这个项目怎么干活"——两层会同时生效。

## 引用

- `packages/coding-agent/docs/usage.md`:context files 加载链(全局→父目录链→cwd)、startup header、trust 机制
- `packages/coding-agent/docs/skills.md`:skill 发现规则(`.pi/skills/` 下根级 `.md` 带 frontmatter 即被发现)、复用 `~/.claude/skills` / `~/.codex/skills`
- `packages/coding-agent/docs/prompt-templates.md`:frontmatter 格式、`$1`/`$@`/`${1:-default}` 参数
- 本仓库 `.pi/prompts/`、`.pi/skills/add-llm-provider.md`:活例
