# 答案：pi-mono TUI 快捷键

## 一句话

pi-mono 的 TUI 是 React Ink 渲染的一个终端应用，它是 SDK 的 **consumer**——所有 TUI 操作最终都调 `AgentSession` 的方法。快捷键定义在 `packages/coding-agent/src/core/keybindings.ts`，可以通过 `~/.pi/agent/keybindings.json` 自定义。

---

## TUI 和 SDK 的关系

```
┌─────────────────────────────────┐
│ TUI (React Ink)                 │  ← 终端用户看到的
│   interactive-mode.ts           │
│   └─ 快捷键 → AgentSession 方法 │
├─────────────────────────────────┤
│ AgentSession (SDK)              │  ← 核心 runtime
│   prompt / steer / setModel ... │
├─────────────────────────────────┤
│ Agent + AgentHarness + Tools    │  ← agent 内核
└─────────────────────────────────┘
```

TUI 只是一个参考实现。**所有快捷键能做到的事，SDK/RPC 都有等价方法。**

---

## 完整快捷键列表

定义在 `packages/coding-agent/src/core/keybindings.ts`。

### 核心操作

| 快捷键 | 动作 | 说明 |
|--------|------|------|
| `Escape` | 取消/中断 | 中断当前 agent run |
| `Ctrl+C` | 清空编辑器 | 在输入为空时复制，否则清空 |
| `Ctrl+D` | 退出 | 编辑器为空时退出 pi |

### 模型和思考

| 快捷键 | 动作 |
|--------|------|
| `Ctrl+P` | 轮换到下一个模型 |
| `Shift+Ctrl+P` | 轮换到上一个模型 |
| `Ctrl+L` | 打开模型选择器 |
| `Ctrl+T` | 折叠/展开 thinking block |
| `Shift+Tab` | 轮换 thinking level（off→minimal→low→medium→high→xhigh→max） |

### 工具和输出

| 快捷键 | 动作 |
|--------|------|
| `Ctrl+O` | 折叠/展开工具输出 |

### 消息操作

| 快捷键 | 动作 |
|--------|------|
| `Ctrl+E` | 用外部编辑器打开当前消息 |
| `Ctrl+J` | follow-up（新起一轮对话） |
| `Ctrl+K` | 从队列中移除消息 |
| `Ctrl+V` | 粘贴剪贴板图片 |

### Session 管理

| 快捷键 | 动作 |
|--------|------|
| `Ctrl+N` | 创建新 session |
| `Ctrl+R` | 打开 session 树（浏览/切换） |
| `Ctrl+F` | fork 当前 session |
| `Ctrl+G` | 恢复上次 session |
| `Ctrl+B` | 切换 session 排序方式 |
| `Ctrl+Y` | 重命名 session |

### Session 树内快捷键

| 快捷键 | 动作 |
|--------|------|
| `↑` / `↓` | 上下移动 |
| `→` / `←` | 展开/折叠节点 |
| `Space` | 选中/取消 |
| `Enter` | 切换到选中 session |
| `/` | 搜索过滤 |

### 模型选择器内快捷键

| 快捷键 | 动作 |
|--------|------|
| `Space` | 选中/取消（用于 Ctrl+P 轮换列表） |
| `Ctrl+S` | 保存当前选择 |
| `Ctrl+A` | 全选 |
| `Ctrl+X` | 清除所有选择 |
| `Ctrl+↑↓` | 调整顺序 |
| `Tab` | 切换 provider 分组 |

---

## 自定义快捷键

编辑 `~/.pi/agent/keybindings.json`：

```json
{
  "keybindings": {
    "app.model.cycleForward": {
      "keys": "ctrl+shift+right"
    },
    "app.interrupt": {
      "keys": "ctrl+g"
    }
  }
}
```

`key` 名称来自 `AppKeybindings` 接口（`keybindings.ts:13-55`）。设为空数组 `[]` 可禁用该快捷键。

---

## 架构要点

- **TUI 用 React Ink 渲染**，源码在 `packages/coding-agent/src/modes/interactive/`
- **TUI 是 SDK consumer**——它创建 `AgentSession`、订阅事件、通过快捷键调 session 方法
- **TUI 组件**：assistant message 渲染、diff 预览、session 选择器、模型选择器、thinking 选择器、OAuth 登录对话框等
- **启动方式**：`node dist/cli.js`（默认 interactive mode）或 `node dist/cli.js --mode interactive`
- **没有 HTTP server**。TUI 直接跑在进程内，所有状态在内存中

---

## 引用

- 源码：`packages/coding-agent/src/core/keybindings.ts` — 完整快捷键定义
- 源码：`packages/coding-agent/src/modes/interactive/interactive-mode.ts` — TUI 主逻辑
- 源码：`packages/coding-agent/src/modes/interactive/components/` — TUI 组件目录
- `_digested/`：[agent/04-Harness/README.md](_digested/agent/04-Harness/README.md) — AgentHarness 和工具
- `_digested/`：[integration/02-advanced.md](_digested/integration/02-advanced.md) — TUI vs SDK 架构关系
