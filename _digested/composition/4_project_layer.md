# 4. 项目层：`.pi/` 目录的组织

## 用户问题

项目 `.pi/` 目录可以放 prompts、extensions、skills。但它们之间的分工是什么？什么场景只用 prompt 就够了、什么场景需要 extension？什么时候该把东西从 `.pi/` 移到全局层、什么时候该提成包？

以一个已有实践为例：pi-mono 自己的 `.pi/`。

```
.pi/
├── prompts/              # 4 个 prompt template（/cl /is /pr /sa /wr）
├── extensions/           # 4 个 TypeScript 扩展
│   ├── tps.ts            # token 速率监控
│   ├── redraws.ts        # TUI 重绘统计
│   ├── import-repro.ts   # CI 会话导入
│   └── prompt-url-widget.ts # GitHub URL 自动 widget
├── skills/               # 1 个 skill（add-llm-provider.md）
├── git/.gitignore        # 占位
└── npm/.gitignore        # 占位
```

为什么是这些、不是别的？

## 三个子目录的分工

| 子目录 | 注入方式 | 生命周期 | 用途 |
|--------|----------|----------|------|
| `prompts/` | 注入 system prompt 的 `<project_context>`，每次 agent 启动 | 每次会话 | "给 agent 说的话"——固定流程的初始指令 |
| `extensions/` | jiti 加载期注入，挂到 agent loop | 整个 session | "运行时能力注入"——需要事件钩子、UI 操作、工具拦截的场景 |
| `skills/` | 加入 `<available_skills>` 目录，agent 用 read 按需取 | 按需 | "多步骤 checklist"——跨子系统的结构化过程 |

**选择判据：只看一个维度——需不需要运行时钩子**

```
一个能力需要注入到 pi
    │
    ├─ 只需要一段文本指令？──→ prompt template（~20 行 .md）
    │   
    └─ 需要运行时行为？
        ├─ 需要挂事件（before_agent_start / tool_call / agent_end）？──→ extension（TS）
        ├─ 需要操作 UI？──→ extension（TS）
        ├─ 需要拦截/替换工具？──→ extension（TS）
        └─ 只是结构化清单、agent 按自己节奏读？──→ skill（.md）
```

## 子目录内文件设计的通用原则

### prompt template

- 必须有 `description`（否则不会被 `/` 补全列出）
- 如果接受参数，必须加 `argument-hint`
- 参数用 `$ARGUMENTS`（单个）、`$@`（多个空格分隔）、`${1:-default}`（形式参数）
- 如果实现的行为是一次性的（"审查这个 PR"），三五十行够了。
- 如果实现了复杂的流程控制（多步、条件分支、错误处理），**说明你应该用 extension**。prompt 不是编程语言。

**红线**：prompt 里不能有 `if/else` 逻辑、不能有循环、不能有状态。这些是 extension 的事。

### extension

- 一个 TS 文件，默认导出一个工厂函数 `export default function (pi: ExtensionAPI)`
- 可以同时做多件事（注册命令、挂钩子、改 UI）——七条轴任意组合
- 推荐命名体现功能（`prompt-url-widget.ts` 比 `gh-integration.ts` 好）
- 如果扩展依赖外部 CLI（如 `gh`），在文件顶部的注释里写清楚

**长度基准**：多数 50-200 行。如果超过 500 行，考虑拆成多个文件或逻辑外包给一个 npm 包。

### skill

- 带 frontmatter 的 Markdown 文件（`name`、`description`）
- 正文是多步骤的结构化流程
- 与 prompt 的区别：skill 是 agent 主动调用（按需 read），prompt 是被动注入
- 与 extension 的区别：skill 没有运行时能力，不能挂钩子

**适用场景**：
- 跨子系统的 checklist（"加一个 LLM provider 要改 7 个文件"）
- 固定验证流程（"跑完检查后按这些规则判断是否通过"）
- 你希望在多个 harness 之间共享的知识（skill 是 Agent Skills 标准，CC/Codex 也读）

## 为什么 pi-mono 的 `.pi/` 长这样

### 5 个 prompt 覆盖了 4 类固定工作流

| 命令 | 覆盖的工作流 | 为什么是 prompt 不是 extension |
|------|-------------|------------------------------|
| `/cl` | 发布前的 changelog 审计 | 只需要一段详细的初始指令 + 步骤列表，无运行时行为 |
| `/is` | issue 分析 | 同上——文本指令就够了 |
| `/pr` | PR 审查 | 同上（但审查前的 URL 抓取用了 extension——prompt-url-widget）|
| `/sa` | 安全 advisory 发布 | 最复杂的 prompt（163 行），但仍然只是文本指令 |
| `/wr` | 端到端收尾 | 同上 |

**关键观察**：5 个 prompt 全部只做一件事——"给 agent 一段固定的初始指令"。**没有运行时钩子。** 所有需要运行时能力的行为（URL 抓取、token 统计、会话导入）都被抽到了 extension 里。

### 4 个 extension 各自需要运行时能力

| 扩展 | 需要的轴 | 为什么不能是 prompt |
|------|---------|-------------------|
| `tps.ts` | 轴 2（`agent_end` 事件） | 需要等 agent 跑完才能统计，prompt 做不到 |
| `redraws.ts` | 轴 1（`/tui` 命令）+ 轴 5（TUI 操作） | 需要读 TUI 内部计数器 |
| `import-repro.ts` | 轴 1（`/ir` 命令）+ 轴 6（写 session 文件） | 需要网络请求 + 文件 IO + session 切换 |
| `prompt-url-widget.ts` | 轴 2（`before_agent_start`/`session_switch` 事件）+ 轴 5（widget） | 需要异步抓取 + TUI widget |

### 1 个 skill 是多步骤 checklist

`add-llm-provider.md`：跨 7 子系统、42 个步骤。agent 可以逐条读 checklist、标记进度、逐条确认。42 步放在 prompt 里会撑爆上下文；放在 extension 里不必要（没有运行时行为）。skill 是唯一正确的形态。

### 2 个占位目录预留了未来能力

`git/` 和 `npm/` 目前只放了全忽略的 `.gitignore`。它们是插槽——未来如果需要 per-project git hooks 或 per-project npm 配置，位置已经在 `.pi/` 里预留好了，不需要重构目录结构。

## 从实例到原则

.pi-mono 的 `.pi/` 验证了三条原则：

1. **prompts 只放"agent 收到一段指令就够"的工作流。** 5 个 prompt = 5 段固定指令。没有控制流。
2. **extensions 放一切需要运行时行为的东西。** 4 个 extension = 4 个不同的运行时需求。
3. **skills 放跨子系统 checklist。** 1 个 skill = 42 步。

如果拆开原则再合成判断方法：

> 如果你写 prompt 的时候在想"不行，这需要分支逻辑"或"不行，agent 做完第一件事后我需要在 UI 上做第二件事"——你该写的是 extension。如果只是"每次干这件事时告诉 agent 同样的步骤"——prompt 就够了。

## 锚点

- pi-mono 项目 `.pi/`：`/Users/bowhead/pi-mono/.pi/`（本机）
- prompts 源码：`packages/coding-agent/docs/prompt-templates.md`
- extensions 源码：`packages/coding-agent/docs/extensions.md`
- skills 源码：`packages/coding-agent/docs/skills.md`
- 扩展系统机制：`agent/01-Anatomy/1.4_Extension_System.md`

## 最小例证

**例证 1（prompt vs extension 分界线）**：对比 `starter-kit/.pi/prompts/plan.md`（19 行纯文本）和 `examples/extensions/plan-mode/index.ts`（390 行 + 运行时接缝）。同一个"plan"需求，两个复杂度层次。选择哪个的依据是"需要运行时行为吗"。

**例证 2（8:70+ 比例）**：数 `tools/index.ts` 的 `ToolName`（8 个）和 `examples/extensions/` 的能力数（70+）。能力不在核里，在扩展面里。`.pi/` 是项目扩展面。