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

## `--tools` 的新语义（v1.0.3+，04b97ef00）

核心不变——`--tools` 仍是启动时一次性设置。但"白名单"的含义复杂了一倍：

**Pattern 语法**：`--tools`/`--exclude-tools` 的条目是精确名字或 `*` pattern（`createToolNameMatcher`，`core/mcp-servers.ts:21`——`*` 匹配任意字符含空串，全锚定；不含 `*` 的条目走 Set 精确匹配）。与 `toolExposure` 配置的 pattern 语法一致（同一匹配器）。

**MCP 豁免**：`--tools` 不再隐式移除 MCP 工具。旧行为是纯 `Set.has`——传 `--tools read,bash` 会把全部 `mcp__*` 工具从会话剔除，`pi --tools codemode` 因此一个 MCP server 都够不到。现在 allowlist 选的是"**声明面**"：未命中的 MCP 工具保持注册、只经 codemode/tool_search 间接可达（豁免三分支 `_allowlistFiltersMcp`/`_isAllowedTool`/`_isActivatable`，`agent-session.ts:445,1523,1535`）。所以 `pi --tools codemode` 现在保留 MCP 可达性——codemode 脚本仍能调 MCP 工具。

**`mcp__` 前缀触发过滤切换**：一旦任一条目以 `mcp__` 开头，语义切换为"MCP 工具也按白名单过滤"——`--tools read,bash,codemode,'mcp__radius__*'` 只留 radius server 的工具。

**反方向的整体移除**：`--exclude-tools 'mcp__*'` 作用于所有工具含 MCP，即整体移除 MCP 工具。

**`--no-mcp`**：与工具过滤正交——直接不加载内置 `builtin:mcp` 扩展（`cli/args.ts:185` → `main.ts:785` → `resource-loader.ts:578`），不连 server、无 MCP 工具、无 `/mcp`，即使 settings 或 `-e` 显式启用也压掉。

注意这同时改变 SDK 行为：`createAgentSession({tools: [...]})` 之前会移除 MCP 工具，现在保留（上游按 bug fix 归档，无迁移提示）。

## 锚点

- `packages/coding-agent/src/core/extensions/types.ts`：`setActiveTools` 签名
- `packages/coding-agent/src/core/mcp-servers.ts`：`createToolNameMatcher`（:21，pattern 匹配）、`isMcpToolName`（:39）
- `packages/coding-agent/src/core/agent-session.ts`：allowlist 的 MCP 豁免三分支（`_allowlistFiltersMcp` :445、`_isAllowedTool` :1523、`_isActivatable` :1535）
- `packages/coding-agent/examples/extensions/plan-mode/index.ts`：在 `before_agent_start` 中调用 `setActiveTools`
- `_faq_on_digested/07/06_field_usage.md` C1（讨论优先模式的社区实践）

## 最小例证

**例证 1（只读讨论模式）**：在 `before_agent_start` 事件里 `setActiveTools(["read", "grep", "find", "ls"])` → agent 只能读文件。对 pi 说"改这个文件" → agent 说"我没工具修改文件"。然后你在同一个扩展里注册一个 `/execute` 命令切回全工具，人确认后才动手。