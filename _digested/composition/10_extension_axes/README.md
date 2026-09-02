# 10. Extension 七条轴总览

## 用户问题

Pi 的扩展系统被描述为"一个口子进、多种能力出"。但"多种能力"具体是什么？extension 到底能改变 agent 的哪些行为？不能改变哪些？

## 七条轴

从 `_digested/extensions/02-Expansion/` 和 `examples/extensions/` 的 70+ 示例中归纳出七条轴——extension 改变 agent 行为的七个独立维度。

| 轴 | 是什么 | 关键 API | 示例 |
|----|--------|----------|------|
| 1 | 注册命令 | `pi.registerCommand(name, handler)` | `/ir`、`/tui`、`/plan` |
| 2 | 挂事件钩子 | `pi.on(eventName, handler)` | `before_agent_start`、`tool_call`、`agent_end` |
| 3 | 注册快捷键 | `pi.registerShortcut(key, handler)` | `Ctrl+Alt+P`（plan-mode） |
| 4 | 运行时切工具集 | `pi.setActiveTools(filter)` | 只读讨论模式、权限降级 |
| 5 | 注入/修改 UI | `ctx.ui.setWidget()`、`ctx.ui.notify()` | TUI 顶部 widget、token 通知 |
| 6 | 跨会话持久化 | `pi.appendEntry(ns, data)` + `session_start` 重建 | plan-mode 进度跟踪、todo |
| 7 | 注册模型提供商 | `pi.registerProvider(config)` | 自定义中转、私有模型 |

## 一条扩展同时用多轴

**这是统一注入点（`harness/01-Architecture/1.2_single_injection.md`）的真正价值**——不是"能做到"，是"在一个文件里、同一个生命周期、共享同一个 context"。

以 `import-repro.ts` 为例：

```typescript
export default function (pi: ExtensionAPI) {
    // 轴 1：注册 /ir 命令
    pi.registerCommand("ir", { handler: async (args, ctx) => { ... } });

    // 轴 6：写 session 文件（持久化）
    writeFileSync(destination, rewritten);

    // 轴 5：通知 UI
    ctx.ui.notify("Session imported", "info");
}
```

一个扩展、三条轴、一个文件。在 MCP 多协议架构下（每条协议各自的加载/生命周期/错误处理），这要跨三个系统拼接——pi 统一注入点让一个文件搞定。

## 七条轴不能做的事（边界）

| 不能做什么 | 原因 | 替代方案 |
|-----------|------|---------|
| 修改 agent loop 的执行顺序 | 循环在 `agent/src/agent-loop.ts`，extension 只能挂钩子，不能改循环本身的拓扑 | 在 `before_agent_start` 注入指令影响 agent 行为 |
| 新增内置工具（在 `tools/index.ts` 的 `ToolName` 联合里） | 内置工具是静态编译的联合类型 | 用 `registerTool` 注册扩展工具（在 `<available_tools>` 块里） |
| 绕过 trust 机制 | trust 在 extension 加载之前执行 | 不能 |
| 修改其他 extension 的代码 | 隔离性——每个 extension 有自己的 context | 通过 `pi.exec` 调用其他 extension 注册的命令 |
| 持久化任意数据到任意位置 | 只有 `appendEntry` 和 session 文件写入 | 用 bash 工具写磁盘文件 |

## 阅读顺序

七条轴中最常用的三条：**轴 2（事件钩子）**、**轴 1（命令）**、**轴 5（UI 注入）**。建议按这个顺序读：

| 篇号 | 文件 | 优先级 |
|------|------|--------|
| 10b | [10b_event_hooks.md](10b_event_hooks.md) | **必读**——事件是 pi 扩展系统的核心 |
| 10a | [10a_commands.md](10a_commands.md) | 必读——最简单的扩展入口 |
| 10e | [10e_ui_injection.md](10e_ui_injection.md) | 推荐——让扩展可见 |
| 10d | [10d_toolset_switching.md](10d_toolset_switching.md) | 推荐——权限和讨论模式的基础 |
| 10f | [10f_persistence.md](10f_persistence.md) | 需要跨会话时读 |
| 10c | [10c_shortcuts.md](10c_shortcuts.md) | 需要键绑定时读 |
| 10g | [10g_providers.md](10g_providers.md) | 需要私有模型时读 |
| 10h | [10h_combinatorics.md](10h_combinatorics.md) | 七条轴之后读——真实案例解剖 |

## 锚点

- `packages/coding-agent/src/core/extensions/types.ts`：`ExtensionAPI`（唯一注入口）
- `packages/coding-agent/docs/extensions.md`：官方扩展文档
- `packages/coding-agent/examples/extensions/`：70+ 个示例扩展
- `harness/01-Architecture/1.2_single_injection.md`：统一注入点的评价分析
- `extensions/02-Expansion/`：四条扩充轴的机制分析

## 最小例证

**例证 1（一个文件用三轴）**：读 `import-repro.ts`——轴 1（`registerCommand`）+ 轴 5（`ctx.ui.notify`）+ 轴 6（`writeFileSync` session 文件）。一个文件三轴。

**例证 2（等价内置能力）**：plan-mode 示例扩展（`examples/extensions/plan-mode/index.ts`）使用轴 1（`/plan` 命令）+ 轴 2（`before_agent_start` 注入 + `tool_call` 拦截 + `agent_end` 跟踪）+ 轴 4（`setActiveTools` 切只读）+ 轴 5（widget 进度）+ 轴 6（`appendEntry` 持久化）。**不用 5 轴，plan-mode 做不到。** 这就是"为什么要七条轴"的答案。