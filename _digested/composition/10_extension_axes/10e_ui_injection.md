# 10e. 轴 5：注入/修改 UI

## 用户问题

Pi 的 TUI 看起来是个固定的终端界面——底部输入框、中间对话区、顶部 header。但是不是所有 UI 部分都是可定制的？Extension 能改什么、不能改什么？

## 可改的

### Widget（顶部组件）

`ctx.ui.setWidget(id, renderFn)` 在 TUI 顶部注册一个自定义界面组件。

```typescript
ctx.ui.setWidget("my-status", (tui, theme) => {
    return new Text("Current task: fixing login bug", 1, 0);
});
```

效果：TUI 顶部显示 "Current task: fixing login bug"。

**用例**：`prompt-url-widget.ts` 显示 PR title + author + URL；plan-mode 显示步骤进度。

### Notification（瞬态消息）

`ctx.ui.notify(text, level)` 在 TUI 里显示一条不会堵塞对话的提示。

```typescript
ctx.ui.notify("TPS 12.3 tok/s", "info");   // 绿色提示
ctx.ui.notify("Session full, compacting", "warning"); // 黄色警告
ctx.ui.notify("Command failed", "error");           // 红色错误
```

**用例**：`tps.ts` 在每个 agent 回复后显示 token 速率通知。

### Status（底部状态栏）

`ctx.ui.setStatus(text)` 设置底部状态栏文字。

```typescript
ctx.ui.setStatus("READ-ONLY MODE — 10 files scanned");
```

## 不可改的

| UI 区域 | 能否改 | 原因 |
|---------|--------|------|
| 对话框（对话文本区） | 否 | TUI 主渲染区，extension 不能注入假消息 |
| 输入框 | 否 | 用户输入区，保持纯净 |
| 消息渲染（markdown/code block） | 否 | 渲染管线是 TUI 内部的 |
| 快捷键绑定 | 可（轴 3） | 快捷键可以注册 |

## 锚点

- `packages/coding-agent/src/core/extensions/types.ts`：`ui` 对象的完整 API
- pi-mono 项目 `.pi/extensions/prompt-url-widget.ts`：完整的 widget 实现
- pi-mono 项目 `.pi/extensions/tps.ts`：notify 的使用
- `packages/coding-agent/examples/extensions/plan-mode/index.ts`：widget + status + notify 全用

## 最小例证

**例证 1（10 行加一个 widget）**：

```typescript
pi.on("before_agent_start", async (event, ctx) => {
    if (!ctx.hasUI) return;
    ctx.ui.setWidget("hello", (_tui, thm) => {
        return new Text(thm.fg("accent", "Hello from extension!"), 1, 0);
    });
});
```

放在 `.pi/extensions/hello-widget.ts` → 每次 agent 启动，TUI 顶部显示 "Hello from extension!"。