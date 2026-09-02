# 7. Skill 设计

## 用户问题

Skill 和 prompt template 有什么区别？为什么要有两种东西？什么时候该写 skill 而不是 prompt？

## Skill vs Prompt 的核心区别

| | Prompt template | Skill |
|---|---|---|
| 注入方式 | 启动时注入到 `<project_context>` | 加入 `<available_skills>` 目录，按需 read |
| 何时占用上下文 | 每次 `/<命令>` 都注入 | 只在 agent 决定 **read** 时才占用 |
| 调用方式 | `/命令名` | 显式指令："用 verify skill" 或 agent 自主决定 |
| 长度上限 | 无所谓（按需调用） | 无所谓（按需 read） |
| 文件位置 | `.pi/prompts/` | `.pi/skills/` |

**本质区别**：prompt 是"告诉 agent 该做的事"（推送），skill 是"agent 可以读的知识"（拉取）。

## 什么时候用 skill 而不是 prompt

| 场景 | 用 prompt | 用 skill |
|------|----------|---------|
| 每调用必执行的流程 | ✅ "审查这个 PR" | ❌ 每次都要 agent 自己发现 |
| 密集的分步 checklist | ❌ 上下文膨胀 | ✅ 按需 read，不占上下文 |
| 跨系统操作清单 | ❌ 太长 | ✅ 42 步 checklist 不长 |
| agent 应该自主判断是否使用 | ❌ | ✅ agent 可以在运行时决定"我需要读那个 skill" |
| 跨 harness 共享 | ❌ pi 自有格式 | ✅ Agent Skills 标准 |

## 格式规范

```markdown
---
name: skill-name
description: One line about what this skill does
---

# Skill Title

## Steps

1. Do this
2. Do that
3. Verify with command: `npm run check`

## Rules

- Rule one
- Rule two
```

**关键要求**：
1. `name` 和 `description` 必填——它们出现在 `<available_skills>` 目录里，agent 靠这个决定要不要 read。
2. 正文可以任意长（因为按需 read）。
3. 格式自由——markdown 即可，不需要脚本，不需要 YAML 以外的 frontmatter。

## 发现路径

pi 在以下位置扫描 skill（`packages/coding-agent/docs/skills.md`）：

| 位置 | 作用域 |
|------|--------|
| `~/.pi/agent/skills/` | 全局可用 |
| `.pi/skills/` | 项目可用（需 trust） |
| `.agents/skills/` | 项目可用（兼容目录） |
| `settings.json` 的 `skills` 数组 | 引用任意目录（如 `~/.claude/skills`） |

**跨 harness 复用**：settings.json 里加 `"skills": ["~/.claude/skills"]`——37 个 Claude Code 技能直接出现在 pi 的技能列表里。

## 覆用别人已有的 skill：有两条路

路径 A：**skills.sh 官方分发**（`_faq_on_digested/07/03_starter_kit.md` 第一层）

```bash
npx skills add mattpocock/skills --agent pi -g
```

安装到 `~/.pi/agent/skills/`。290 万+ 安装，内含 tdd、code-review、research、wizard、writing-for-agents 等工程流。

路径 B：**直接挂载 Claude Code/Codex 的技能目录**

```json
{
  "skills": ["~/.claude/skills"]
}
```

零拷贝，现有技能立即出现在 pi 里。这是官方文档写明的做法。

## 什么时候该让 pi 自己写 skill

社区共识（`_faq_on_digested/07/06_field_usage.md` C4 Armin）：

> "If you want the agent to do something that it doesn't do yet, you don't go and download an extension or a skill. You ask the agent to extend itself."

对 pi 说"把我刚才让你做的事写成一个 skill"——pi 会在 `.pi/skills/` 下生成一个 Markdown 文件。不需要手写、不需要搜包。下载只给第三次遇到同样需求时才做的事。

## 锚点

- `packages/coding-agent/docs/skills.md`
- 本仓库 `.pi/skills/add-llm-provider.md`（42 步 checklist 的完整实例）
- `skills.sh` 官方文档（支持 pi 项目路径 `.pi/skills/` 和全局路径 `~/.pi/agent/skills/`）
- `_faq_on_digested/07/05_package_ecosystem.md`（技能类包）

## 最小例证

**例证 1（按需不占上下文）**：在 `<available_skills>` 目录里有 10 个 skill，每个 200 行。但 system prompt 只出现每个 skill 的 `name` 和 `description`（共 ~300 token）。真正的 2000 行文本只在 agent 调 read 时才加载。证明按需加载机制。

**例证 2（跨 harness 共享）**：在 settings.json 加 `"skills": ["~/.claude/skills"]` → 启动 pi → `/skill:` 补全出现 Claude Code 的 37 个技能。零拷贝复用。