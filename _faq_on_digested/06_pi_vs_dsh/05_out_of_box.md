# 开箱 outfit：为什么"DSH 拿来就能写程序，pi 像没配置好"

> 结论先行：这个体感差异是真的，但它不是"运行时能力"差异，而是**默认组合（default outfit）宽度的差异**——两边哲学在"开箱这一层"的投影。pi 的 core-minimal 落到默认配置 = 裸 loop + 4 工具，配置好的编码 agent 要用户自己拼；DSH 的 paved road 落到默认配置 = standard preset 把整队工具和流程机械预先挂好。另外"话唠"有两个机械原因（提示词薄 + 缺结构化容器）和一个混杂变量（两边跑的模型不同）。

## 证据边界说明

本章应"实际对照"的要求，**两边都做了新源码核对**（超出 question.md 原"只做消化材料→判断"的边界）：
- pi：本仓库 `a27c36749`（v0.84.4，2026-09-02，与既有基线一致）。
- DSH：`/Users/bowhead/deepseek-harness` 工作树 `ab0f5864bd`（0.1.2-alpha.3，2026-09-01），比 question.md 记的 `0.1.1-rc.1 / 528c682e` 新；引用处均为当前工作树路径。

## 1. 开箱默认装了什么（逐项盘点）

### pi 默认会话

| 项 | 默认值 | 落点 |
|---|---|---|
| 激活工具 | **4 个**：read / bash / edit / write | `packages/coding-agent/src/core/sdk.ts` L256 `defaultActiveToolNames` |
| 内置但默认不激活 | grep / find / ls（只读模式用）、powershell（Windows） | `src/core/tools/index.ts` L96-105、L164-180 |
| 找文件方式 | 提示词直接叫模型**用 bash 跑 `ls, rg, find`** | `src/core/system-prompt.ts` L111 |
| 默认 system prompt | **约 25 行 / ~1.5KB**：身份一句 + 4 条工具一行简介 + 3 条 guideline（含"Be concise in your responses"）+ pi 自身文档路径 + cwd | `src/core/system-prompt.ts` L128-166 |
| 工作区指令 | AGENTS.override.md / AGENTS.md / CLAUDE.md → `<project_context>` 注入 | `src/core/resource-loader.ts` L72 |
| skills | 有加载机制（`.pi/skills` 项目级 + 全局），但**不预装任何 skill** | `src/core/skills.ts` L452-456 |
| compaction | 内置，默认开 | `src/core/settings-manager.ts` L830 |
| plan mode / subagent / todo | **是 `examples/extensions/` 79 个示例中的 3 个，默认不装** | `examples/extensions/{plan-mode,subagent,todo.ts}` |
| 沙箱 / 审批 | 无（`confirm-destructive.ts` 也是示例扩展） | 同上 |
| 模型路由 | 完全留给用户（`/model`、providers、baseURL——FAQ 01/03 的全部起因） | `src/core/models/` |

### DSH 标准会话（standard preset + host）

| 项 | 默认值 | 落点 |
|---|---|---|
| 文件工具 | tool-fs（read/write/edit/read_image）+ tool-fs-search（glob/grep）**独立成工具** | `packages/preset/agent-presets/presets/standard/agent.cordis.yml` L52-63 |
| shell | bash（Windows 换 pwsh） | 同上 L44-50 |
| 后台作业 | tool-jobs（collect/stop） | 同上 L73-74 |
| skills | skill-filesystem 发现 + tool-skill 目录/加载器 | 同上 L83-87 |
| 目标管理 | command-goal + tool-goal | 同上 L94-98 |
| plan mode | 默认挂载，含整段 plan-mode 行为契约（section 文本约 10 行） | 同上 L104-124 |
| compaction | compaction-basic + command-compact + tool-result-pruner | 同上 L137-155 |
| 委托/工作流 | subagent + subagent_fork（continuable）+ workflow + ralph；codex/claude-code 子 agent 预留但 disabled | 同上 L174-239 |
| 交互 | ask_user_question + todo_write | 同上 L243-249 |
| web | web_search + fetch | 同上 L253-256 |
| 沙箱/审批 | host 平面统一持有（本会话快照："file policy: workspace-write / approval: ask"） | `_digested/runtime-profiles/00-map.md` 共同基底表 |
| 工作区指令 | agent-instructions 插件（AGENTS.md/CLAUDE.md + `.local` 变体 + `~/.dsh/AGENTS.md` 全局层，maxBytes 64KiB，**带 invariant.ts**） | `packages/context/agent-instructions/src/config.ts` L12-19 |
| 身份 | persona 默认就是 "You are a coding agent powered by the {{model}} model" | `agent.cordis.yml` L24-28 |

preset 文件本身 257 行、约 20 个插件行。同一份 AGENTS.md 两边都注入——**工作区指令这条轴两边打平**，差异全在 harness 自己加的那一层。

## 2. "话唠"的机械原因

1. **harness 层提示词薄**。pi harness 自己出的风格约束只有 3 条 bullet；DSH 是整本操作手册：per-tool 跨调用指导按约定注册成 order 100–199 的 prompt section（`_digested/tools-prompt-llm/01-section顺序与前缀.md`），外加 runtime context、政策 section。模型不是天生知道"edit 前先 read、glob 不用 bash"——DSH 把这些写进契约，pi 留给模型自觉。
2. **缺结构化容器，叙述只能走 prose**。todo 列表、plan 文档（exit_plan_mode）、追问（ask_user_question）、委派（subagent）在 DSH 里都是**工具调用**；pi 默认一个都没有，于是"列计划、汇报进度、确认取舍"全部变成聊天正文。pi 不是天生话唠，是没给容器、只能说话。
3. **混杂变量：模型不同**。用户 pi 侧跑的是 DeepSeek 系（FAQ 01/03），当前 DSH 会话跑的是 glm-5.3-flash。话痨度相当一部分是模型默认风格。要公平归因，得同模型跨 harness 对比——本章只断言前两条机械原因，第 3 条记为未控制变量。

## 3. "没配置好"是设计立场，不是半成品

- pi：`harness/01-Architecture/1.2` 的 core-minimal 落到默认配置层就是"核心不预设你的工作流"。开箱 = 裸 loop + 4 工具；"配置好的编码 agent"是用户拼出来的：装 examples、写 AGENTS.md、`settings.defaultTools`、`pi install`。`extensions/01-Core/1.2` 明说 plan-mode/subagent 让用户选，核只给乐高。
- DSH：`harness-idea/03-paved-road.md` 的 paved road 落到默认配置层就是"正确路径预先铺好"。standard preset 就是一台组装完毕的整车；定制 = patch 组合（`dsh plugin` / cordis.patch.yml）。
- 所以两个体感是同一枚硬币：**一个卖骨架（肌肉自装），一个卖整车（可改装）**。把 02_differences.md 的"可扩展性 vs 可组合性"往下压一层，就是"默认组合窄 vs 默认组合宽"。

## 4. 反向记账：DSH 的"先天"也是组合出来的

DSH 并非处处开箱即写代码：`sdk-minimal` profile 就把工具面收窄（fs-local 代替 sandbox、无 subagent、无 goal，`_digested/runtime-profiles/00-map.md`）。选错 profile 的 DSH 一样"没配置好"。反过来，pi 把 examples 拼齐后也不话唠。**判据：比"开箱体验"实际是在比"默认组合"的宽度，不是运行时能力上限。** 这也解释了为什么两边可以同时成立：pi 的窄是可扩展的窄，DSH 的宽是可裁剪的宽。

## 引用

- pi（`a27c36749` / v0.84.4）：`packages/coding-agent/src/core/sdk.ts`、`src/core/system-prompt.ts`、`src/core/tools/index.ts`、`src/core/resource-loader.ts`、`src/core/skills.ts`、`src/core/settings-manager.ts`、`examples/extensions/`
- DSH（`ab0f5864bd` / 0.1.2-alpha.3）：`packages/preset/agent-presets/presets/standard/agent.cordis.yml`、`packages/core/system-prompt/src/index.ts`、`packages/context/agent-instructions/`、`_digested/runtime-profiles/00-map.md`、`_digested/tools-prompt-llm/01-…前缀.md`
