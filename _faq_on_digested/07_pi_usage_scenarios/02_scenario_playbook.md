# 篇二:三个场景的标准动作

- 场景 A:写代码(交互式,主场景)
- 场景 B:信息加工(非编码,完全合理)
- 场景 C:自动化与嵌入(脚本 / CI / 宿主)

---

## 场景 A:用 pi 写代码

### A0. 一次性准备(杠杆最大,只做一次)

1. **全局 `~/.pi/agent/AGENTS.md`**:跨项目个人规则(语言偏好、commit 规范、"不要自动 commit"之类)。
2. **项目 `AGENTS.md`**:构建命令、测试命令、代码风格、仓库礼仪。只写"没有它会出错"的——CC 对 CLAUDE.md 的原则直接适用:**臃肿的 AGENTS.md 会被模型整体忽略**。本仓库根目录的 `AGENTS.md` 就是活例(对话风格、git 纪律、测试命令、发布流程)。
3. **验证命令**:确认 AGENTS.md 里有"一条模型能自己跑的检查"(test / build / lint)。这是"你盯着的会话"和"你能走开的会话"的分界线,CC 官方把这条列为第一原则。

### A1. 小任务:直接说

一句话能描述清 diff 的(改错字、加日志、改名),不要搞仪式,直接下指令。CC 官方同样说:能一句话描述的改动,跳过计划。

### A2. 中大任务:只读探索 → PLAN.md → 实现

```bash
# 1. 只读探索(降权,防手痒改文件)
pi --tools read,grep,find,ls "理解 auth 模块,列出所有需要改动的文件,别改任何东西"

# 2. 计划落盘(可跨会话、可进 git、可手工编辑)
pi -c --tools read,write "把刚才的方案写成 PLAN.md,含分步计划和每步的验证标准"

# 3. 实现(全工具,引用计划文件)
pi -c "按 PLAN.md 第 3 步实现,补测试,跑 npm run check,直到全绿"
```

PLAN.md 相比内置 plan mode 的优势(Mario 的论证):跨会话存活、随代码版本化、你可随时手改、全程可观测(你亲眼看到它读了哪些文件)。要交互式计划审查 UI,装 plan-mode(example 扩展)或 plannotator 包。

### A3. 过程中:用 pi 特有的几个杠杆

| 动作 | 键位 / 命令 | 说明 |
|---|---|---|
| 喂上下文 | `@file`(Tab 补全) | 精确指文件,别让模型猜 |
| 喂命令输出 | `!command` | 运行 shell 并把输出发给模型;`!!command` 只跑不发 |
| 边跑边纠偏 | Enter(steering 队列) | 当前 assistant turn 的工具执行完后立即送达 |
| 跑完再追加 | Alt+Enter(follow-up 队列) | 整轮结束后再送 |
| 走错路回溯 | `/tree` | 跳回任意历史节点从那里继续(会话是树,不是线) |
| 并行试方案 | `/fork`、`/clone` | 同一任务分叉出多种解法 |
| context 满了 | `/compact` | 手动压缩;自动压缩阈值也在跑 |
| 换脑子 | Ctrl+P / `--models` | 同一会话跨 provider 换模型(pi-ai 的 context handoff) |
| 长文输入 | Ctrl+G | 拉 `$EDITOR` 写长 prompt |

### A4. 固化重复动作(第二遍就沉淀)

- 重复的 prompt → `.pi/prompts/*.md` 模板(支持 `$1`/`$@`/`${1:-默认}`)。本仓库 `.pi/prompts/` 里 `/wr`(端到端收尾)、`/cl`(changelog 审计)等就是实例。
- 重复的流程 → skill:直接对 pi 说"给我建一个 skill"(skills.md 开头原话:*pi can create skills. Ask it to build one for your use case.*);已有 Claude Code / Codex skills 的,在 settings 的 `skills` 数组里加上 `~/.claude/skills`、`~/.codex/skills` 直接复用。

### A5. 收尾

- 让 pi 自己跑验证并**出示证据**(测试输出、diff、截图),不要接受"我做完了"的空口断言(CC 原则)。
- 要第二意见:开第二个 pi 会话做 adversarial review——新 context 只看 diff 和标准,没有"自恋偏差"。
- commit 分步做、你把关;要自动回滚点,装 git-checkpoint 扩展。

---

## 场景 B:用 pi 做信息加工

完全合理。coding agent 的本质是"会读文件、会跑命令、会写代码的模型",信息加工恰好是这组能力的子集;pi 的 Unix 形态(管道 + print 模式)做这件事比 CC 还顺手。生态证据:@companion-ai/feynman(296.7K/月)——"Research-first CLI agent built on Pi"——就是纯信息加工方向长出来的成品。

### B1. 单次加工:把 pi 当 Unix filter

```bash
pi -p "总结这篇文档的三个要点,中文输出" < report.md
cat error.log | pi -p "找出根因,按可能性排序"
pi @screenshot.png "图里的报错是什么,怎么修"
pi @a.ts @b.ts "对比两个实现,哪个更安全,为什么"
```

纯文本加工(不需要读仓库、不需要改文件)加 `--no-tools`:更快、更省 token、不会被多余的工具调用带偏。

### B2. 结构化输出:进管道

```bash
# --mode json 输出 JSONL 事件流,可被 jq 消费(docs/json.md 官方示例的同款口径)
pi -p "列出这个项目所有 CLI flag,输出 JSON 数组" --mode json 2>/dev/null \
  | jq -c 'select(.type=="message_end") | .message'
```

要严格 schema 输出,用 structured-output(example 扩展,examples/extensions/structured-output.ts)。

### B3. 批量加工:fan-out

```bash
cat files.txt | while read f; do
  pi --no-session -p "从 $f 提取 action items,输出 Markdown 列表" >> all-items.md
done
```

CC 官方同款模式;`--no-session` 让一次性任务不污染会话列表。

### B4. 需要外部信息(搜索 / 抓网页)

pi 默认没有 web 工具——哲学是 bash + curl 就是通用工具(见 Mario 的 no-MCP 文)。两条路:

1. 让 pi 直接 `curl` / 现写脚本(YOLO 默认下开箱可用,composability 最好);
2. 装包:pi-web-access(401.1K/月,搜索/抓取/PDF/YouTube)、pi-unsloth-webtools 等。

### B5. 把加工流程固化

高频加工(周报格式、翻译规范、评审清单)→ prompt template,`/name` 一次调用;带操作手册的("爬这个站并入库")→ skill。

---

## 场景 C:自动化与嵌入

| 形态 | 用法 | 对标 CC |
|---|---|---|
| CI / pre-commit | `pi -p --tools read,grep,find,ls "审查暂存 diff,只报问题"`(只读、非交互) | headless `-p` 官方推荐场景 |
| 批处理编排 | shell 循环 `pi -p`,或 `--mode json` 消费事件流 | fan-out across files |
| 宿主程序嵌入 | `--mode rpc`(JSONL over stdio 子进程)或 SDK `createAgentSession()`(进程内) | Agent SDK |
| 自定义 UI | 在 RPC/JSON 事件流之上自己画 | desktop app |

集成细节见 `_digested/integration/03-runtime-api.md`、`05-recipes.md`,此处不重复。

---

## 场景选择的粗判据

| 任务的形状 | 用什么形态 |
|---|---|
| 改代码、修 bug、重构 | 交互式 TUI(A) |
| 一次性问答 / 转换 / 提取 | `pi -p` + 管道 / `@file` + `--no-tools`(B1) |
| 批量同构任务 | shell 循环 fan-out(B3) |
| 周期性重复任务 | prompt template / skill 固化(A4、B5) |
| 无人值守 / CI | `-p` + 工具白名单 + 容器(C) |
| 嵌进自己的程序 | RPC / SDK(C) |
