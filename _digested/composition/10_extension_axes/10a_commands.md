# 10a. 轴 1：注册命令

## 用户问题

`/pr`、`/is`、`/wr` 这些 slash 命令是 prompt template 提供的。但如果 `pr.md` 不能满足需求（比如需要在 TUI 显示点什么、需要异步抓取数据），怎么注册一个带运行时行为的命令？

## 是什么

`pi.registerCommand(name, handler)` 在 TUI 里注册一个 `/命令`。

```typescript
pi.registerCommand("hello", {
    description: "Say hello",
    handler: async (args, ctx) => {
        ctx.ui.notify(`Hello, ${args || "world"}!`, "info");
    },
});
```

使用时在对话里输入 `/hello friend` → TUI 通知 "Hello, friend!"。

## 和 prompt template 的区别

| | Prompt template (`prompts/*.md`) | Extension 命令 (`registerCommand`) |
|---|-------------------------------|-----------------------------------|
| 调用方式 | `/命令名 <参数>` | `/命令名 <参数>`（用户无差别） |
| 实现方式 | 注入一段文本到 system prompt | 运行一段 TypeScript 代码 |
| 能做的事 | 只能"给 agent 说一段话" | 可以挂钩子、写文件、网络请求、操作 UI |
| 参数传递 | `$ARGUMENTS` 注入到 agent prompt | `handler(args, ctx)` 直接得到 string |
| 触发时机 | 给 agent 输入指令 | 注册的命令异步执行 |

**选择判据**：如果命令只需要"告诉 agent 做什么"，用 prompt template。如果命令需要在告诉 agent 之前做点事（网络请求、文件操作、UI 交互），用 extension。

## 参数和上下文

```typescript
pi.registerCommand("greet", {
    description: "Greet someone with a custom message",
    argumentHint: "<name> [message]",
    handler: async (args: string, ctx: ExtensionCommandContext) => {
        // args = 用户在 /greet 后面输入的全部文本
        // ctx.cwd = 当前工作目录
        // ctx.hasUI = 是否在 TUI 中运行
        // ctx.ui - TUI 操作方法
        // ctx.sessionManager - 会话管理
        // ctx.switchSession() - 切换到其他会话
    },
});
```

## 常见模式

### 模式 1：命令 + UI 通知

```typescript
pi.registerCommand("check", {
    description: "Check if working directory is clean",
    handler: async (_args, ctx) => {
        const result = await pi.exec("git", ["status", "--porcelain"]);
        if (result.stdout.trim()) {
            ctx.ui.notify("Dirty: uncommitted changes", "warning");
        } else {
            ctx.ui.notify("Clean!", "info");
        }
    },
});
```

### 模式 2：命令 + 事件组合（同一扩展）

```typescript
export default function (pi: ExtensionAPI) {
    // 命令：手动触发
    pi.registerCommand("focus", {
        description: "Enter focus mode (read-only)",
        handler: async (_args, ctx) => {
            ctx.ui.notify("Focus mode activated", "info");
        },
    });

    // 事件：自动触发
    pi.on("before_agent_start", async (event, ctx) => {
        event.setActiveTools(["read", "grep", "find", "ls"]);
    });
}
```

### 模式 3：命令 + 持久化

参见 `10f_persistence.md`——`/ir` 导入 session 并持久化到磁盘。

## 锚点

- `packages/coding-agent/src/core/extensions/types.ts`：`registerCommand` 的定义
- `packages/coding-agent/examples/extensions/`：多数示例都包含 `registerCommand`
- pi-mono 项目 `.pi/extensions/import-repro.ts`：`/ir` 的完整实现

## 最小例证

**例证 1（10 行注册一条命令）**：

```typescript
export default function (pi: ExtensionAPI) {
    pi.registerCommand("hello", {
        description: "Say hello",
        handler: async (args, ctx) => {
            ctx.ui.notify(`Hello, ${args}!`, "info");
        },
    });
}
```

放在 `.pi/extensions/hello.ts` → 启动 pi → 输入 `/hello world`。10 行，一个文件。