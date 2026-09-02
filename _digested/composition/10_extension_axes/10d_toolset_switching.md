# 10d. 轴 4：运行时切换工具集

## 用户问题

Pi 默认给 agent 4 个工具（`read`/`bash`/`edit`/`write`）。有时你想让 agent 只能读不能改（讨论模式），有时只让它执行特定工具。怎么切换？

## 是什么

`pi.setActiveTools(filter)` 在运行时切换 agent 可调用的工具集。

```typescript
// 切到只读模式：agent 只能 read/grep/find/ls
event.setActiveTools(["read", "grep", "find", "ls"]);

// 切到全工具模式：恢复默认
event.setActiveTools(["read", "bash", "edit", "write", "grep", "find", "ls"]);
```

## 最核心的用途：只读讨论模式

`_faq_on_digested/07/06_field_usage.md` C1 的 esc.sh 模式：

```typescript
pi.on("before_agent_start", async (event, ctx) => {
    // 切工具：只能读
    event.setActiveTools(["read", "grep", "find", "ls"]);
    // 加指令：强调不要改
    return {
        message: "You are a thinking partner. Default: Discussion. Don't touch anything.",
    };
});
```

效果：agent 进入只读讨论模式。人确认方案后，再切回全工具模式执行。

**为什么这不在内置讨论模式里？**——core-minimal 纪律。讨论模式是"工具限制 + 指令注入"的组合，不是一个独立的内置功能。在 pi 里，你用扩展的轴 4 + 轴 2 拼一个出来。

## 和 `--tools` CLI 的区别

| | CLI `--tools` | Extension `setActiveTools` |
|---|-------------|--------------------------|
| 作用域 | 整个会话 | 当前事件（可每回合切换） |
| 触发方式 | 启动时 | 运行时（在事件里） |
| 灵活性 | 固定一次 | 可条件触发 |

两者互补：`--tools` 是启动时设置默认白名单；`setActiveTools` 是运行时动态调整。

## 锚点

- `packages/coding-agent/src/core/extensions/types.ts`：`setActiveTools` 签名
- `packages/coding-agent/examples/extensions/plan-mode/index.ts`：在 `before_agent_start` 中调用 `setActiveTools`
- `_faq_on_digested/07/06_field_usage.md` C1（讨论优先模式的社区实践）

## 最小例证

**例证 1（只读讨论模式）**：在 `before_agent_start` 事件里 `setActiveTools(["read", "grep", "find", "ls"])` → agent 只能读文件。对 pi 说"改这个文件" → agent 说"我没工具修改文件"。然后你在同一个扩展里注册一个 `/execute` 命令切回全工具，人确认后才动手。