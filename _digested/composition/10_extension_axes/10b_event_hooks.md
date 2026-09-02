# 10b. 轴 2：挂事件钩子

## 用户问题

Pi 的核心循环（agent loop）是一串固定的事件：agent 启动 → 发消息给 LLM → 接收到回复 → 执行工具 → 继续或停止。Extension 可以挂到这些事件上，在它们发生时插入自定义行为。但"36 个事件"太多了一一不可能全读。哪些事件真的有用？常用模式是什么？

## 事件分类

v0.84.4 共有 36 个可挂载事件（`extensions/types.ts` 的 `on()` 重载列表）。按使用频率和作用分为四类：

### A 类：最常用（每个写扩展的人都应该知道）

| 事件 | 触发时机 | 典型用途 | token 影响 |
|------|---------|---------|-----------|
| `before_agent_start` | system prompt 已拼好，但还没发给 LLM | 注入额外指令、切换工具集、拒绝启动 | 注入的指令增加 token 成本 |
| `tool_call` | agent 请求调工具，还没执行 | 权限拦截、参数检查、白名单、替换工具 | 几乎为零（不注入） |
| `agent_end` | agent 完成一轮推理+工具执行 | token 统计、持久化状态、触发后续操作 | 零（不注入任何内容） |

### B 类：常用

| 事件 | 触发时机 | 典型用途 |
|------|---------|---------|
| `session_start` | 新会话开始 | 重建持久状态（恢复 plan-mode 进度） |
| `session_switch` | 切换到另一个会话 | 重建 widget、适配新会话 |
| `turn_end` | 每回合结束 | 进度跟踪 |
| `compact` | 压缩发生 | 标记"压缩后需要恢复的状态" |

### C 类：特定场景

| 事件 | 触发时机 | 典型用途 |
|------|---------|---------|
| `input` | 用户输入消息 | 过滤/修改输入、检查特定关键词 |
| `tool_result` | 工具执行完，结果返回 | 修改/过滤工具结果 |
| `resolve` | provider 返回结果 | 流式消息汇聚 |
| `shortcut` | 快捷键触发 | 与轴 3 配合 |

### D 类：调试/监控

`provider_request`、`provider_result`、`model_selected`、`thinking_level_selected`、`agent_start` 等——通常只在 `tps.ts` 这类监控扩展里用到。

## 三种最关键的模式

### 模式 1：`before_agent_start` — 注入指令

```typescript
pi.on("before_agent_start", async (event, ctx) => {
    // 给 agent 加一条只读指令
    return {
        message: "You are in read-only mode. Do NOT modify any files. Only read and report.",
    };
});
```

**变体 1：切换工具集**

```typescript
// 在同一个事件里切掉修改工具
event.setActiveTools(["read", "grep", "find", "ls"]);
```

**变体 2：阻止启动**

```typescript
if (repoDirty) {
    return { cancel: true }; // 阻止 agent 启动
}
```

### 模式 2：`tool_call` — 权限/白名单

```typescript
pi.on("tool_call", async (event, ctx) => {
    const toolName = event.params.name;
    const blockedTools = ["bash", "write"];
    if (blockedTools.includes(toolName)) {
        // 阻塞调用
        return { block: true, message: `Tool ${toolName} is not allowed` };
    }
    // 放行
    return;
});
```

**这是 pi 的"权限模型"**——没有内置的审批弹窗，但你可以在 `tool_call` 里实现任何复杂的权限判断：检查 cwd、检查文件名、检查命令模式。由你决定。

### 模式 3：`agent_end` — 统计/持久化

```typescript
pi.on("agent_end", async (event, ctx) => {
    const tokens = /* 从 event.messages 提取 usage */;
    ctx.ui.notify(`Used ${tokens} tokens`, "info");

    // 持久化进度
    pi.appendEntry("my-extension", { progress: "step 3 done" });
});
```

## 安全模型

事件钩子的两个关键安全机制：

1. **fail-close**：`tool_call` 里抛出异常 → 工具调用被阻断、agent 不执行（不是隐藏异常继续执行）。
2. **stale context 保护**：`ctx.invalidate()` 后任何对这个上下文的操作都抛错——防止 session 切换后一个过期的扩展还在操作旧 session。

**不放心的配置**：在 `settings.json` 里用 `tools: ["read", "bash"]` 限制默认工具集。然后禁止 extension 用 `setActiveTools` 添加被排除的工具？——事件里没有内置这个检查，需要自己写 `tool_call` handler 做 final gate。

## 锚点

- `packages/coding-agent/src/core/extensions/types.ts`：`on()` 的可选事件列表（36 个）
- `packages/coding-agent/examples/extensions/`：大量使用事件钩子的示例
- pi-mono 项目 `.pi/extensions/tps.ts`：`agent_end` 事件使用
- pi-mono 项目 `.pi/extensions/prompt-url-widget.ts`：`before_agent_start` + `session_switch` 事件使用
- `agent/01-Anatomy/1.4_Extension_System.md`：扩展系统事件机制详解
- `harness/01-Architecture/1.2_single_injection.md`：统一注入点的分析（护栏写一次、覆盖全事件）

## 最小例证

**例证 1（`tool_call` 权限拦截）**：`examples/extensions/permission-gate.ts` 用 `tool_call` 事件拦截 bash 调用，根据文件名模式判断是否放行。12 行代码实现了一个权限系统——不是内置的，但效果一样。

**例证 2（`before_agent_start` 注入的成功信号）**：用 `before_agent_start` 注入 "You are a thinking partner. Do NOT write code." → agent 第一句话是"让我先理解你的需求..."而不是"让我开始修改文件"。prompt 注入有实时效果。

**例证 3（36 个事件不都是给你用的）**：读 `extensions/types.ts` 的 `on()` 签名——大部分事件带 `ExtensionEventMap` 的泛型约束，其中约一半是内部事件（`turn_start`、`resolve`、`provider_request`）对外部扩展来说很少用到。**A 类 3 个事件覆盖 80% 的真实使用场景。**