# 2. 配置加载链：全局层、项目层、CLI 层的叠加规则

## 用户问题

在 `.pi/` 放了一个 prompt template，启动 pi 后它没出现。在 `~/.pi/agent/` 放了一个 skill，也没出现。为什么？

回答这个问题需要理解 pi 的配置加载链——不是所有文件都在同一时刻被同一个扫描发现。三层加载链按"宽→窄"叠加，且有 trust 闸门。

## 三层总览

| 层 | 位置 | 放什么 | 什么时候生效 | 是否受 trust 控制 |
|---|------|--------|-------------|------------------|
| **全局层** | `~/.pi/agent/` | 个人纪律、全局技能、全局扩展、全局 prompt 模板 | 所有项目自动 | 否（全信任） |
| **项目层** | `<cwd>/.pi/` 及父目录 `.pi/` | 项目特定 prompts、skills、extensions | 首次交互问信任，`/trust` 保存 | 是 |
| **CLI 层** | 启动参数 | `--skill`、`--prompt-template`、`-e`、`--tools` | 仅本次启动 | 否（一次性覆盖） |

## 全局层：`~/.pi/agent/`

加载顺序和内容：

```
~/.pi/agent/
├── AGENTS.md              → 注入 <project_context>（作为最顶层的父目录上下文）
├── prompts/*.md           → 注册为 /command（全局可用）
├── skills/                → 加入 <available_skills> 目录
├── extensions/*.ts        → jiti 加载，挂到 agent loop
├── settings.json          → defaultProvider、defaultModel、tools、skills 数组等
├── trust.json             → 已信任的项目列表
└── models.json            → 自定义模型定义
```

**关键事实**（来自 `_digested/harness/04-Self-Description/4.4_context_layers.md` 和本机审计 `_faq_on_digested/07/04_local_audit.md`）：

全局层在所有项目生效。**它不受 trust 机制控制。** 你在全局层放的东西，对所有项目立即可见。这既是便利（语言偏好、git 纪律可以写一次全局生效）也是风险（全局层加了 20 个 skill，hello-world 项目也要付 20 个 skill 的 token 价）。

## 项目层：`.pi/`

加载顺序和内容：

```
<project>/.pi/
├── AGENTS.override.md      → 如果存在，覆盖项目根 AGENTS.md
├── prompts/*.md            → 注册为 /command（仅本项目可用）
├── skills/                 → 加入 <available_skills> 目录
└── extensions/*.ts         → jiti 加载，挂到 agent loop
```

**关键机制**：项目层受 **trust** 控制。

首次在一个项目里启动 pi，交互提示 "信任这个项目吗？"（因为 `.pi/` 里的扩展会被执行代码）。信任后记入 `~/.pi/agent/trust.json`，后续启动自动加载。也可用 `/trust` 手动管理。

**未被信任的项目，`.pi/` 里的扩展不会被加载。** prompt template 和 skill 是否加载取决于具体实现（v0.84.4 的默认行为是都等 trust）。

**父目录链继承**：`loadProjectContextFiles` 从 cwd 向上遍历到根，收集每层的 `AGENTS.md`/`CLAUDE.md`，`unshift` 保证"根部的在前"，去重（`seenPaths`），并处理 git worktree 的 shadow 情况。外地 `AGENTS.override.md` 在候选表里排第一，可覆盖上层的同名文件。

## CLI 层：一次性覆盖

```
pi --tools read,grep,find,ls        # 覆盖内置工具白名单
pi -e ./my-extension.ts              # 加一个扩展（仅本次）
pi --skill ./custom-skill.md         # 加一个 skill（仅本次）
pi --prompt-template ./tmpl.md       # 加一个 prompt template（仅本次）
pi --models claude-sonnet-4-20250514 # 显式指定模型
pi --no-tools                        # 纯对话，无工具
```

**CLI 层覆盖全局层 + 项目层**，但只对本次启动有效。下次启动回到全局层 + 项目层的叠加。

## 三层叠加的全景

```
             CLI 层（本次覆盖）
                  │
                  ├── CLI 扩展
                  ├── CLI skill
                  ├── CLI prompt template
                  ├── CLI 工具白名单
                  └── CLI 模型
                  │
  ┌───────────────┼───────────────┐
  │  全局层        │  项目层        │
  │ （所有项目）    │ （信任后）      │
  │               │               │
  │ AGENTS.md     │ AGENTS.override.md
  │ prompts/      │ prompts/
  │ skills/       │ skills/
  │ extensions/   │ extensions/
  │ settings.json │ （无 settings）
  │ trust.json    │
  │ models.json   │
  └───────┬───────┴───────┬───────┘
          │               │
          ▼               ▼
     注入 system prompt
     + 注册 slash 命令
     + 挂事件钩子
     + 注册工具
```

**重复注册规则**（来自 `harness/01-Architecture/1.2_single_injection.md` 的统一注入点机制）：

- 同名命令：CLI 层覆盖项目层，项目层覆盖全局层
- 同名工具：同覆盖规则
- 同名事件钩子：**全部触发**，按注册顺序执行
- 同名 provider：最后注册的生效

## 对配置决策的影响

> **三条规则**：
>
> 1. 你想让一个配置在所有项目生效 → `~/.pi/agent/`
> 2. 你想让一个配置只在本项目生效 → `.pi/`
> 3. 你想试一下某个配置但不确定是否长期要 → `--flag`

**常见误配置**：

- 把项目特定规则写进全局 AGENTS.md → 切换到另一个项目时规则仍在生效，可能冲突
- 把全局纪律（语言偏好、commit 规范）写进项目 AGENTS.md → 每个项目都要抄一遍
- 装了一个包但没出现 → 检查 trust 状态（未信任的项目不加载扩展）
- 写了 prompt template 但 `/` 补全没出现 → 检查文件后缀（必须是 `.md`，放在 `prompts/` 下，有 `description` frontmatter）

## 锚点

- 加载链源码：`packages/coding-agent/src/core/resource-loader.ts`（`loadContextFileFromDir` L71、`loadProjectContextFiles` L119）
- 上下文分层机制：`harness/04-Self-Description/4.4_context_layers.md`
- trust 机制：`packages/coding-agent/docs/usage.md`（"project trust" section）
- 全局层位置：`~/.pi/agent/`

## 最小例证

**例证 1（trust 闸门）**：在一个未被信任的项目 `.pi/` 下放一个扩展，启动 pi → 提示"信任这个项目吗"（或静默不加载，取决于 v0.84.4 的具体版本实现）。说"yes"后重启，扩展出现。证明项目层被 trust 闸住。

**例证 2（父目录继承）**：在 repo 的子目录启动 pi，看 system prompt 的 `<project_context>` 块——根部的 AGENTS.md 出现在里面。证明向上遍历继承真实存在。

**例证 3（CLI 覆盖）**：全局 settings.json 里设了 `tools: ["read","bash","edit","write","grep","find","ls"]`，启动时加 `--tools read,grep,find` → agent 只有 3 个工具。证明 CLI 覆盖全局。