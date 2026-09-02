# 6. Prompt template 设计

## 用户问题

`.pi/prompts/*.md` 注册为 `/命令名`。但它和直接在对话里打"帮我看一下这个 PR"有什么区别？什么时候该用 prompt template、什么时候直接在对话里说就够了？

## 什么时候用

**判据：你第二次说同样的话。**

第一次干一件事（"审查这个 PR"）→ 对话里直接说。
第二次干同类事（又有一个 PR 要审）→ 还是可以对话里说。
第三第四次（每周有 3+ PR 要审）→ 写成 prompt template /`pr`。

社区定调（`_faq_on_digested/07/06_field_usage.md` C4 Armin 的说法）：

> "You don't go and download an extension or a skill. You ask the agent to extend itself."

自扩展优先——让 pi 根据对话历史自己写 prompt template。下载或手写是第三遍才做的事。

## 格式规范

```
---
description: 一句话描述这个命令做什么（必填，否则不出现 / 补全）
argument-hint: "<参数>"（可选，告诉用户参数格式）
---

固定流程的初始指令。参数用 $ARGUMENTS（用户输入的全部文本）。

支持：
- $ARGUMENTS → 用户输入的全部内容
- $@ → 用户输入的参数，空格分隔
- ${1:-default} → 形式参数，可设默认值
```

**必须遵守的规则**：

1. **`description` 必填**。没有它，`/` 补全列表里不出现这个命令。
2. **prompt template 不是编程语言**。不要在里面写条件分支、不要写循环、不要写递归。如果你需要"如果 A 则做 X，否则做 Y"——应该用 extension，不是 prompt template。
3. **长度不必极简。** prompt template 和 AGENTS.md 不同——AGENTS.md 必须短，prompt template 可以是 100+ 行（比如 `/sa` 163 行）。因为 AGENTS.md 每个会话都出现；prompt template 只有在你 `/sa` 时才注入。

## 什么时候应该用 extension 而不是 prompt

| 情况 | 用 prompt | 用 extension |
|------|----------|------------|
| 只需要一段初始指令 | ✅ 完全够 | ❌ 杀鸡用牛刀 |
| 需要在 agent 开始工作前做点事 | ❌ prompt 做不到 | ✅ `before_agent_start` 事件 |
| 需要在 agent 工作后做点事 | ❌ prompt 做不到 | ✅ `agent_end` 事件 |
| 需要 TUI 显示信息 | ❌ prompt 做不到 | ✅ UI widget / notify |
| 需要拦截/修改工具调用 | ❌ prompt 做不到 | ✅ `tool_call` 事件 |
| 需要跨会话记住状态 | ❌ 每个会话重新开始 | ✅ `appendEntry` + `session_start` |

**实例**：在 `/pr` 的需求里，给出审查指令是 prompt 的事（`pr.md`），但在执行审查前抓取 PR title/author 并在 TUI 显示 widget 是 extension 的事（`prompt-url-widget.ts`）。两者配合：prompt 给指令，extension 给运行时上下文。

## prompt 和 AGENTS.md 的分界线

| | AGENTS.md | Prompt template |
|---|---------|----------------|
| 注入方式 | 每个会话自动注入 | `/<命令>` 时才注入 |
| 目标 | 陈述事实（项目常识） | 启动流程（固定步骤） |
| token 成本 | 每个会话付 | 每次调用付 |
| 短信号 | 不写会错的事实 | 第二次说同样的话 |

## 实例解剖：`/sa`（163 行）为什么可以这么长

`sa.md`（安全 advisory 发布）是 pi-mono 项目最长的 prompt，163 行。

它的结构：
- input handling（~5 行）：支持 URL、draft 路径、follow-up 指令
- initial advisory workflow（~45 行）：读取 advisory → 独立验证 → 讨论 CVSS → 写 draft → 等人批准
- draft markdown format（~50 行）：完整 frontmatter + body 模板
- apply to GitHub（~30 行）：PATCH API + CVE request
- safety rules（~15 行）：红线（不包含 PoC、不发布、不用浏览器 cookies）

**为什么它可以长**：
- 安全发布涉及大量一次性规则（"不包含 PoC、不发布、不用浏览器 cookies"）
- 每一步如果 agent 做错都有真实后果（发布未确认的安全细节）
- 163 行不是"膨胀"，是"约束密度高"——每行都是 safety rule

**什么情况该拆**：如果 `sa.md` 的某个步骤需要运行时行为（比如"在 TUI 显示 CVSS 评分比较"），那部分应该拆成 extension。

## 锚点

- pi-mono 项目 `.pi/prompts/`（本机 5 个实例）
- `packages/coding-agent/docs/prompt-templates.md`
- `_faq_on_digested/07/06_field_usage.md` C4（自扩展优先）

## 最小例证

**例证 1（自扩展 prompt）**：对话里对 pi 说"帮我创建一个 prompt template，叫 `/review-pr`，做的事情是审查当前 git diff 并以 Good/Bad/Ugly/Tests 输出"——pi 会写一个 `.pi/prompts/review-pr.md` 文件。不需要手写。

**例证 2（补全靠 description）**：写一个 `.pi/prompts/foo.md`，只有正文没有 `description` → 启动后 `/` 补全没有它。加上 `description: "Do something"` → 重启后出现。说明 frontmatter 格式决定注册行为。