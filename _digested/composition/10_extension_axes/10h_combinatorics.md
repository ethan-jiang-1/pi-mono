# 10h. 组合使用：一条扩展同时用多轴的真实案例解剖

## 用户问题

七条轴独立理解了。但真正的扩展通常同时用多条轴。看一个真实案例怎么把多轴组合在一起。

## 案例 1：`import-repro.ts`（三轴）

**位置**：pi-mono 项目 `.pi/extensions/import-repro.ts`（351 行）

**解决问题**：CI 分析 issue 后把 session 上传为 gist，开发者用一条命令导入同一个会话，在本地继续。

### 使用的轴

| 轴 | 使用方式 | 为什么需要 |
|----|---------|-----------|
| 轴 1：命令 | `pi.registerCommand("ir", {...})` | 用户输入 `/ir <gist-id>` 触发导入 |
| 轴 5：UI | `ctx.ui.notify("Importing...")` + `ctx.ui.confirm()` | 显示进度 + 覆盖确认对话框 |
| 轴 6：持久化 | `writeFileSync(destination, rewritten)` | 把 session 写入磁盘，然后切换 |

### 设计判断

这个扩展不需要轴 2（事件钩子），因为它是按需触发的（用户主动 `/ir`），不是自动触发的。不需要轴 4（工具切换），因为导入后全工具集继续工作。35 行里的**真正逻辑代码**（URL 解析、路径重写、API 调用）是 ~300 行，七条轴的"接线"代码不到 50 行。

## 案例 2：`plan-mode/index.ts`（五轴）

**位置**：`packages/coding-agent/examples/extensions/plan-mode/index.ts`（390 行）

**解决问题**：给 pi 加一套计划模式——agent 只能读、写计划、不能改代码。

### 使用的轴

| 轴 | 使用方式 |
|----|---------|
| 轴 1：命令 | `registerCommand("plan", ...)` → `/plan` 进入计划模式 |
| 轴 2：事件 | `before_agent_start` 注入"你在计划模式"指令 + `tool_call` 拦截 bash/write/edit + `agent_end` 收集 `[DONE:n]` 标记 |
| 轴 3：快捷键 | `registerShortcut("ctrl+alt+p", ...)` → 快速切换 |
| 轴 4：工具切换 | `setActiveTools(getPlanModeTools(...))` → 只读工具集 |
| 轴 5：UI | `ctx.ui.setWidget()` 显示进度 widget |
| 轴 6：持久化 | `appendEntry("plan-mode", ...)` + `session_start` 重建 |

**关键观察**：390 行的 plan-mode 扩展全用通用接缝拼成。没有用任何"plan-mode 专用"的核能力——这就是 `1.2_skipped_features.md` 说的"用积木拼工作流"。

## 案例 3：`prompt-url-widget.ts`（两轴）

**位置**：pi-mono 项目 `.pi/extensions/prompt-url-widget.ts`（270 行）

**解决问题**：当用户输入 `/pr <URL>` 或 `/is <URL>` 时，自动抓取 PR/Issue 的 title 和 author 并在 TUI 顶部显示 widget。

### 使用的轴

| 轴 | 使用方式 |
|----|---------|
| 轴 2：事件 | `before_agent_start` 检测 prompt 是否包含 URL → 启动抓取；`session_switch` 重建 widget |
| 轴 5：UI | `ctx.ui.setWidget("prompt-url", ...)` 显示 title + author + URL |

### 为什么不用轴 1（命令）

这个扩展不需要 `/命令`——它是自动触发的。用户输入 `/pr <URL>` 时，`before_agent_start` 事件检测到 prompt 文本里有 URL，自动启动 widget 抓取。不需要用户多打一条命令。

**设计判断**：PM 审查一个 PR 的工作流已经被 `/pr` prompt template 覆盖了。`prompt-url-widget.ts` 只是给它加上"在你说话前，我先帮你查一下 title 和 author"的运行时行为。两个东西在同一工作流里独立互补——prompt 给指令，extension 给运行时上下文。

## 组合成功的标志

一个扩展组合多条轴时，问三个问题：

1. **每条轴有没有独立存在的理由？**（不是"顺便加上"）
2. **各条轴会不会冲突？**（一个事件里改了工具集，另一个事件又改了一次）
3. **去掉某条轴，扩展功能是否严重退化？**（如果是，说明它是必需的）

如果三条都是肯定的，组合是合理的。

## 锚点

- pi-mono 项目 `.pi/extensions/import-repro.ts`（三轴组合实例，351 行）
- pi-mono 项目 `.pi/extensions/prompt-url-widget.ts`（两轴组合实例，270 行）
- `packages/coding-agent/examples/extensions/plan-mode/index.ts`（五轴组合实例，390 行）
- `harness/01-Architecture/1.2_single_injection.md`：统一注入点分析——"跨能力组合在统一口子里是天然的，在多协议里要拼接"

## 最小例证

**例证 1（轴 1 + 轴 5 的最简组合）**：

```typescript
export default function (pi: ExtensionAPI) {
    pi.registerCommand("hello", {
        description: "Say hello with time",
        handler: async (_args, ctx) => {
            const time = new Date().toLocaleTimeString();
            ctx.ui.notify(`Hello! Current time: ${time}`, "info");
        },
    });
}
```

轴 1（命令）+ 轴 5（UI notify）。25 行，两轴。注册条命令、做点事、告诉用户。