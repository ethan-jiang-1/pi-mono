# 10c. 轴 3：快捷键

## 用户问题

Pi 的 TUI 有默认快捷键（`Ctrl+P` 换模型、`Ctrl+E` 编辑器、`Ctrl+G` 拉编辑器写 prompt）。如果需要自定义快捷键，怎么加？什么操作用得着快捷键？

## 是什么

`pi.registerShortcut(keyCombo, handler)` 注册一个全局 TUI 快捷键。

```typescript
pi.registerShortcut("ctrl+alt+f", {
    description: "Toggle focus mode",
    handler: async (ctx) => {
        ctx.ui.notify("Toggled focus mode", "info");
    },
});
```

## 什么场景需要快捷键

| 场景 | 默认已有 | 需要自己加的 |
|------|---------|-------------|
| 换模型 | `Ctrl+P` | — |
| 开编辑器写 prompt | `Ctrl+G` | — |
| 压缩上下文 | `/compact` | 可以绑 `Ctrl+Shift+C` |
| 切换只读/全工具模式 | 无 | `Ctrl+Alt+F` |
| 开关某种 widget | 无 | `Ctrl+Alt+W` |
| 查看 token 统计 | 无 | `Ctrl+T`（如果装了 tps 扩展） |

**经验法则**：快捷键适用三类操作——频繁切换的（工具模式）、频繁查看的（token 用量）、需要快速响应的（中断 agent）。

## 锚点

- `packages/coding-agent/src/core/extensions/types.ts`：`registerShortcut`
- `packages/coding-agent/examples/extensions/plan-mode/index.ts`：`registerShortcut("ctrl+alt+p", ...)`
- `_faq_on_digested/07/02_tui_keybindings/`：TUI 快捷键全集