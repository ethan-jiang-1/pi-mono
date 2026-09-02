# 3. 全局层：`~/.pi/agent/` 的设计

## 用户问题

全局层是全项目共享的。但"共享"有两面：便利（不用每个项目配一遍）和风险（一个项目的配置污染另一个项目）。全局层应该放什么、不放什么？

## 目录结构

```
~/.pi/agent/
├── AGENTS.md          → 个人宪法：语言偏好、git 纪律、跨项目规则
├── prompts/           → 全局 prompt 模板（所有项目可用）
├── skills/            → 全局 skill（所有项目可用）
├── extensions/        → 全局扩展（所有项目可用）
├── settings.json      → 默认 provider、model、UI 主题、tools 白名单
├── trust.json         → 已信任的项目列表
└── models.json        → 自定义模型定义
```

## 放什么（建议）

### 放 `AGENTS.md`

跨项目永远适用的个人纪律：

```
# Global rules
- Reply in 中文；technical prose only
- Never commit unless I explicitly ask
- Commit only files you changed in this session; stage explicit paths
- After code changes, run the project's check command
- Read files in full before editing files you have not inspected
```

**长度基准**：10-20 行。它不是项目 AGENTS.md 的替代品——项目 AGENTS.md 放这个项目自己的构建命令、代码风格、特殊规则。全局层放**你的**规则。

### 放 `settings.json`

```
{
  "defaultProvider": "deepseek",
  "defaultModel": "deepseek-v4-flash",
  "thinking": "high",
  "skills": [],
  "theme": "catppuccin-mocha"
}
```

**`skills` 数组可以引用其他 harness 的技能目录**：`"skills": ["~/.claude/skills"]`。这是跨 harness 共享技能的标准做法（`packages/coding-agent/docs/skills.md` "Using Skills from Other Harnesses"）。

### 条件性放：prompt 模板、skill、扩展

只在"你每个项目都做这类任务"时才放。例如：
- 你每个项目都审查 PR？→ 全局 `/pr` prompt template
- 你每个项目都要用同一个自定义工具？→ 全局扩展

**判据**：如果一个 prompt/extension 只在这一个项目有用，放项目层 `.pi/`。如果在所有项目都有用，放全局层。如果只在一些项目有用，放全局层然后用项目 AGENTS.md 的"不使用"标记？pi 没有"全局排除"机制，需要靠 CLI 层覆盖——这是全局层的一个真实缺陷。

## 不放什么（红线）

| 内容 | 为什么不放 | 应该放哪 |
|------|-----------|---------|
| 项目特定的构建命令 | 切换到另一个项目时给出错误指令 | 项目 AGENTS.md |
| 项目特定的代码风格（"package 用 type: module"） | 跨项目规则冲突 | 项目 AGENTS.md |
| 实验性扩展 | 全局层自动加载，你忘了就还在跑 | 先 CLI 层测试，稳定后再移全局 |
| 20+ 个 skill | 每个项目启动都要付 token 价（裸 5.3k → 20k+） | 按项目在 `skills` 数组里选装 |
| 敏感凭证/密钥 | 扩展在全局层自动加载，不受 trust 控制 | 用环境变量或 `auth.json` |

## 与项目层的互操作

全局层的 AGENTS.md 被 pi 读入后，作为"最顶层的父目录上下文"——它始终存在，但项目 AGENTS.md 在后面追加（`<project_context>` 块）。两个同时出现在 system prompt 里。

**冲突时**：如果全局 AGENTS.md 说"Never commit"，项目 AGENTS.md 说"Auto-commit after tests pass"，两条规则都在上下文中。agent 在 prompt 里同时看到两个约束，由模型判断哪个优先级更高。**没有机械式的覆盖规则。** 这是文件即 UI 的代价——覆盖关系不是程序化的，是 prompt 层的。

## 本机审计的教训

`_faq_on_digested/07/04_local_audit.md` 的事实：

当前机器 `~/.pi/agent/` 的现状：
- `AGENTS.md` — 不存在
- `prompts/` — 不存在
- `skills/` — 不存在
- `extensions/` — 只有 `slim-models.ts`（与工作流无关）
- `settings.json` — 只有 provider/model/thinking/theme，没有 `skills` 数组

而同机器的 `~/.claude/skills/` 有 37 个技能。

**结论**：这台机器的全局层几乎没有配置。37 个 Claude Code 技能、两本自建手册全部在 pi 的扫描路径之外。差距是接线问题，不是能力问题。

## 锚点

- `packages/coding-agent/docs/usage.md`（context files 加载链）
- `packages/coding-agent/docs/skills.md`（"Using Skills from Other Harnesses"）
- `_faq_on_digested/07/04_local_audit.md`（本机实证）

## 最小例证

**例证 1（技能复用）**：在 `~/.pi/agent/settings.json` 加 `"skills": ["~/.claude/skills"]` → 重新启动 pi → `/skill:` 补全出现 Claude Code 的技能。这是"接线已有资产"的直接证据。

**例证 2（全局层的 token 价）**：全局层装 20 个 skill。启动 pi，`/compact` 后看 token 量——hello-world 的 prompt 从 5.3k 涨到 20k+。证明全局层每加一个 skill，每个项目都要付这个 token。