# 答案：pi-mono TUI 快捷键

## 一句话

pi-mono 的 TUI 是自研 terminal 渲染器（`packages/tui`，依赖仅 `get-east-asian-width` + `marked`，无 react/ink）渲染的一个终端应用，它是 SDK 的 **consumer**——所有 TUI 操作最终都调 `AgentSession` 的方法。快捷键定义在 `packages/coding-agent/src/core/keybindings.ts`，可以通过 `~/.pi/agent/keybindings.json` 自定义。

---

## TUI 和 SDK 的关系

```
┌─────────────────────────────────┐
│ TUI (自研渲染器)              │  ← 终端用户看到的
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
| `Ctrl+C` | 清空编辑器 | `app.clear`，只清空编辑器（**不复制**——复制是 `Ctrl+X`，见下） |
| `Ctrl+D` | 退出 | 编辑器为空时退出 pi |

### 模型和思考

| 快捷键 | 动作 |
|--------|------|
| `Ctrl+P` | 轮换到下一个模型 |
| `Shift+Ctrl+P` | 轮换到上一个模型 |
| `Ctrl+L` | 打开模型选择器 |
| `Ctrl+T` | 折叠/展开 thinking block |
| `Shift+Tab` | 轮换 thinking level（off→minimal→low→medium→high→xhigh→max） |
| `Ctrl+S` | 把当前 thinking level 存为全局默认（`app.thinking.save`，只在 `/thinking` 选择器里生效） |

### 工具和输出

| 快捷键 | 动作 |
|--------|------|
| `Ctrl+O` | 折叠/展开工具输出 |

### 消息操作

| 快捷键 | 动作 | key 名 |
|--------|------|--------|
| `Ctrl+X` | 复制最后一条 assistant 消息；v0.84.4 起全屏下有活动选区时**优先复制选区** | `app.message.copy` |
| `Ctrl+G` | 用外部编辑器打开当前消息 | `app.editor.external` |
| `Alt+Enter`（Windows `Ctrl+Q`） | follow-up（新起一轮对话） | `app.message.followUp` |
| `Alt+↑`（Windows `Alt+Q`） | 取回队列中的消息 | `app.message.dequeue` |
| `Ctrl+V` | 粘贴剪贴板图片 | `app.clipboard.pasteImage` |

### Session 管理

**注意：`app.session.new` / `tree` / `fork` / `resume` 目前没有默认键绑定**（`defaultKeys: []`，只能通过 keybindings.json 或命令面板触发）。实际被占用的是：

| 快捷键 | 动作 | key 名 |
|--------|------|--------|
| `Ctrl+N` | 切换命名过滤器 | `app.session.toggleNamedFilter` |
| `Ctrl+R` | 重命名 session | `app.session.rename` |
| `Ctrl+S` | 切换 session 排序方式 | `app.session.toggleSort` |
| `Ctrl+G` | 外部编辑器 | `app.editor.external` |

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
| `Ctrl+P` | 切换 provider 分组（`app.models.toggleProvider`） |
| `Alt+↑` / `Alt+↓` | 调整顺序（`app.models.reorderUp/Down`） |

**注意：`Ctrl+S` 在三个上下文里语义不同**——session 列表里是 `app.session.toggleSort`（切换排序），`/model` 选择器里是 `app.models.save`（把选中项存为全局默认模型），`/thinking` 选择器里是 `app.thinking.save`（把当前 thinking level 存为全局默认）。三者都默认绑定 `ctrl+s`（`keybindings.ts:20,104-106`；官方口径 `docs/keybindings.md:154-156`），互不冲突只因为各自只在对应 UI 里响应。v0.85.1 还专门修过这两个保存键的可配置性（`packages/coding-agent/CHANGELOG.md:16`："Fixed configurable save keybindings in the model and thinking selectors"）。

> 除 `app.*` 之外还有一层 `tui.*` 命名空间：它来自独立包 `packages/tui/src/keybindings.ts`（`TUI_KEYBINDINGS`），coding-agent 通过 `KEYBINDINGS = { ...TUI_KEYBINDINGS, ... }` 合并并覆盖少数平台差异。例如 v0.85.0 新增的 `tui.altScreen.bottom` = `end`（`packages/tui/src/keybindings.ts:58,209`，由 `tui-alt-screen.ts:764` 消费）。完整键位表以 `packages/coding-agent/docs/keybindings.md` 为准。

---

## 复制/显示行为（v0.84.4 起，v0.85.1 仍成立）

- **`fullscreenCopyOnSelect`** setting（默认 `true`）：全屏模式下拖选释放即复制（OSC 52）。关闭后 `Ctrl+X`（`app.message.copy`，handler 在 `interactive-mode.ts:2895-2897`，帮助文本在 `:6326`）在有活动选区时优先复制选区，否则复制最后一条 assistant 消息
- **终端能力覆盖**：settings `terminal.hyperlinks/images/trueColor` + env `PI_HYPERLINKS` / `PI_TRUE_COLOR` / `PI_IMAGE_PROTOCOL`（优先级 settings > env > 自动检测，#8665）

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

`key` 名称来自 `AppKeybindings` 接口（`keybindings.ts:14-58`）。设为空数组 `[]` 可禁用该快捷键。

---

## 架构要点

- **TUI 用自研渲染器**（`packages/tui` 的 tokenizer/布局，依赖仅 `get-east-asian-width` + `marked`，无 react/ink），源码在 `packages/coding-agent/src/modes/interactive/`
- **TUI 是 SDK consumer**——它创建 `AgentSession`、订阅事件、通过快捷键调 session 方法
- **TUI 组件**：assistant message 渲染、diff 预览、session 选择器、模型选择器、thinking 选择器、OAuth 登录对话框等
- **启动方式**：直接 `node dist/cli.js`（不给 `--mode` 时就是默认的 interactive/TUI 模式）；`--mode` 只接受 `"text" | "json" | "rpc"`（`packages/coding-agent/src/cli/args.ts:11,96-99`），**没有** `--mode interactive` 这种写法
- **没有 HTTP server**。TUI 直接跑在进程内，所有状态在内存中

---

## 引用

- 源码：`packages/coding-agent/src/core/keybindings.ts` — 完整快捷键定义
- 源码：`packages/coding-agent/src/modes/interactive/interactive-mode.ts` — TUI 主逻辑
- 源码：`packages/coding-agent/src/modes/interactive/components/` — TUI 组件目录
- `_digested/`：[agent/04-Harness/README.md](_digested/agent/04-Harness/README.md) — AgentHarness 和工具
- `_digested/`：[integration/02-advanced.md](_digested/integration/02-advanced.md) — TUI vs SDK 架构关系
