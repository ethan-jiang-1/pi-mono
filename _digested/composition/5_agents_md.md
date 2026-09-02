# 5. AGENTS.md 的设计艺术

## 用户问题

AGENTS.md 是 pi（以及其他 harness）最重要的指令文件。但"写 AGENTS.md"和"写好 AGENTS.md"是两件事。什么时候该放、什么时候不该放？多长合适？全局、项目、目录三层怎么分配？

## 三个原则

### 原则一：只放"不写会错"的，不放"写了更好"的

这是 pi-mono 项目根 `AGENTS.md` 和社区共识（`_faq_on_digested/07/06_field_usage.md` C10 的 HN 讨论）共同验证的。

项目根部 `AGENTS.md`（`/Users/bowhead/pi-mono/AGENTS.md`）的内容分布：

| 内容 | 类别 | 为什么放 | 如果不放会怎样 |
|------|------|---------|--------------|
| `npm run check` 命令 | 事实 | 没有它 agent 不知道验证回路 | agent 可能不跑检查就 claim done |
| git 纪律（不加 -A、不分步 commit） | 约束 | 反复纠正同一行为 | agent 在错误方向上浪费回合 |
| 代码风格（no any、顶层 import） | 约束 | 显式约定减少风格分歧 | agent 可能引入不一致风格 |
| 测试命令 | 事实 | agent 需要知道检查入口 | 跳过测试 |
| "绝对不要改 models.generated.ts 直接" | 红线 | 减少无意的破坏 | agent 可能以为生成文件可以手改 |

**判据**：如果一个规则不写，agent 会反复踩同一个坑让你纠正——写进 AGENTS.md。如果 agent 本来就做对了，别加——它只是占用 token。

### 原则二：长度纪律——200 行是硬上限，推荐 < 50 行

**证据**：
- CC 官方定量：CLAUDE.md > 200 行被模型整体忽略（`_faq_on_digested/07/07_cross_harness.md` #4）
- Codex 官方定量：AGENTS.md 合并上限 32 KiB，超了尾部静默丢失（同上）

**所以**：
- 目标 30-50 行。多于 100 行时，问自己：哪些可以拆成 prompt template 或 skill？
- 配置的"如何做"（固定流程）移到 prompt template
- 配置的"为什么"（背景知识）移到 skill（按需 read，不占上下文）
- 只留"是什么"（命令、约束、红线）在 AGENTS.md

**一个有效的维护方法**：每次你发现自己在 AGENTS.md 里加了一大段"步骤说明"（第一做什么、第二做什么、第三做什么），把它剪出来做成 prompt template。AGENTS.md 应该越来越薄，不是越来越厚。

### 原则三：分层隔离——全局、项目、override 各司其职

| 层 | 文件 | 放什么 | 举例 |
|---|------|--------|------|
| 全局 | `~/.pi/agent/AGENTS.md` | 你的个人纪律（跨项目不变） | 语言偏好、commit 规范、"不要自动 commit" |
| 项目 | `<root>/AGENTS.md` | 这个项目的常识（构建命令、风格、仓库礼仪） | 构建命令、测试命令、特殊的 git 规则 |
| 目录 | `AGENTS.override.md` | 覆盖项目层（用于子项目有不同规则时） | monorepo 子包的特殊约束 |

**覆盖规则**：`AGENTS.override.md` 在候选表里排第一（`resource-loader.ts` L71-72 的候选表：`AGENTS.override.md / AGENTS.md / CLAUDE.md`）。离被改文件最近的 wins（`_faq_on_digested/07/07_cross_harness.md` #5）。

## 帮你看清现在 AGENTS.md 哪些能删

用三个问题审你的现有 AGENTS.md：

1. **这是事实还是步骤？** 事实 → 留。步骤 → 移到 prompt template。
2. **这是一般编程规范还是这个项目特有的？** 一般规范 → 删（agent 本来就知道）。项目特有 → 留。
3. **这条规则 agent 犯过错吗？** 犯过 → 留。没犯过 → 删。

## 跨 harness 兼容（附加价值）

AGENTS.md 现在是跨 harness 标准（`_faq_on_digested/07/07_cross_harness.md` #5）：

> agents.md 标准被 Codex/Jules/Cursor/Devin/Opend/Zed/Gemini CLI/Copilot/Amp/Windsurf 采纳，**Claude Code 现在也官方读取 AGENTS.md**。

一份 AGENTS.md 同时在 11+ 个 harness 里生效。你在 pi 里写的 AGENTS.md 如果被放在项目根，Claude Code 启动时也会读到。不需要为不同 harness 维护不同版本。

## 锚点

- 本仓库根 `AGENTS.md`（实际案例）
- `harness/04-Self-Description/4.4_context_layers.md`（上下文分层机制）
- `_faq_on_digested/07/07_cross_harness.md` #5（跨 harness 标准）
- `_faq_on_digested/07/06_field_usage.md` C10（"DX beats AGENTS.md" 的社区共识）

## 最小例证

**例证 1（无用规则占 token）**：在 AGENTS.md 里加 "Always read files before editing them"——agent 本来就该这么做。不加这条 agent 也是先读再改。它占的 ~20 token 每一个启动都付，但收益为零。删了它，token 留给真正有用的规则。

**例证 2（规则变成 prompt 模板）**：在 AGENTS.md 里有一段 15 行的"审查 PR 时做以下三步..." → 剪出来做成 `prompts/pr.md`（15 行变 3 行引用："审查流程见 /pr 模板"）。AGENTS.md 薄了，审查流程更完整了，且可以被 `/pr` 命令单独调用。

**例证 3（200 行上限可验证）**：把 AGENTS.md 逐步加到 300 行，观察 agent 在某个 200 行后开始忽略规则。这不是猜测——CC 官方定量证据确认。