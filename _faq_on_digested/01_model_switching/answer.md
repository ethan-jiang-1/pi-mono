# 答案：pi-mono 里怎么换模型

## 一句话

TUI 提供三种方式换模型：**Ctrl+P 轮换**（最常用）、**Ctrl+L 选择器**（直接选）、**`/scoped-models` 命令**（配置轮换列表）。背后都调 `AgentSession.setModel()` 或 `cycleModel()`，SDK/RPC 有完全等价的方法。

---

## TUI 里的三种方式

### 1. Ctrl+P / Shift+Ctrl+P — 模型轮换

| 快捷键 | 动作 | 对应方法 |
|--------|------|----------|
| `Ctrl+P` | 轮换到下一个模型 | `session.cycleModel("forward")` |
| `Shift+Ctrl+P` | 轮换到上一个模型 | `session.cycleModel("backward")` |

轮换的模型列表来自 `scopedModels`。默认情况下包含所有可用模型，但你可以通过 `/scoped-models` 命令定制。

### 2. Ctrl+L — 模型选择器

打开一个交互式列表，显示所有可用模型（按 provider 分组）。可以直接搜索、选中某个模型。选中后调用 `session.setModel(model)`。

### persist 语义（v0.84.3 起，重要）

`setModel` / `cycleModel` / `setThinkingLevel` / `cycleThinkingLevel` 都接受 `ModelMutationOptions { persist?: boolean }`（agent-session.ts:256-259，字段在 258）：**默认只在 session 内生效**，`persist: true` 才写入全局默认。

- **Ctrl+P 轮换不 persist**（interactive-mode.ts:4190 调 `cycleModel(direction)` 不带选项）——换模型只影响当前 session
- **Ctrl+L 选择器分两路**（interactive-mode.ts:4991-5020：`selectModel(model, persist)` 闭包在 4991-4993，普通确认 `selectModel(model, false)` 在 5013，`onSelectAsDefault`（`app.models.save` = `Ctrl+S`）走 `selectModel(model, true)` 在 5019）：普通选择不 persist（状态栏显示 `Model:`）；显式"设为默认"才 persist（显示 `Default model:`）。thinking 选择器同理（`showThinkingSelector` 4819-4838：普通确认走 `selectLevel(level, false)`，`onSelectAsDefault`（即 `app.thinking.save` = `Ctrl+S`，4828/4833）走 `selectLevel(level, true)`；落到 `selectThinkingLevel` 4808）
- **RPC 的 `set_model` / `set_thinking_level` 不传 persist**——外部宿主远程切换同样不改全局默认
- **v0.84.4 补充**：`persist: true` 且本次会话带非空 `--models` scope 时，该 model 会同时追加进 scope 与 enabledModels（`_addPersistedDefaultToNonEmptyScope`，agent-session.ts:1680，调用点 1669/1736/1771）——persist 的默认模型不会落在 scope 之外

### 3. `/scoped-models` — 配置轮换列表

在 TUI 中输入 `/scoped-models`，打开一个勾选界面。你可以 enable/disable 哪些模型参与 Ctrl+P 轮换。这个界面通过 `session.setScopedModels()` 持久化你的选择。

---

## Thinking level 切换

| 快捷键 | 动作 | 对应方法 |
|--------|------|----------|
| `Shift+Tab` | 轮换 thinking level | `session.cycleThinkingLevel()` |
| `Ctrl+T` | 折叠/展开 thinking block（显示层面，不改变模型行为） | — |
| `Ctrl+S`（`app.thinking.save`） | 把当前高亮项设为全局默认 thinking level | `session.setThinkingLevel(level, { persist: true })` |

Thinking level 可选值：`off` → `minimal` → `low` → `medium` → `high` → `xhigh` → `max`

`Ctrl+S` 是 `/thinking` 选择器里的**显式保存键**（`keybindings.ts:20,104-106`；实现在 `components/thinking-selector.ts:97,131`），对应 `docs/settings.md` 里 `defaultThinkingLevel` "saved with Ctrl+S in `/thinking`" 的说法；不按它、只按 Enter 选择则只改当前会话。

注意：模型切换时的 thinking level 解析（`_getThinkingLevelForModelSwitch`，agent-session.ts:1850-1862）：**per-model 覆盖（`scopedModels` 里的 `thinkingLevel`）优先 → 否则该模型的全局默认 → 再回落当前 level → 最后 `"medium"`**——并不是"一律重置为新模型默认值"；且模型持久化不会隐式改写全局 thinking 默认。

**Claude 的逐轮 effort 持久化（v0.85.0 New Feature）**：内置 Claude 模型若带 `compat.supportsMidConvoEffort`（`packages/ai/src/types.ts:716`），pi 会持久化每一轮实际使用的 provider effort，在后续请求里重建 effort-only 的 system message，并带 `prefix_mismatch_behavior: "drop_block"` 发送 thinking binding controls（`packages/ai/src/api/anthropic-messages.ts:513,1014,1049-1056`）——目的是避免陈旧的 signed-thinking 前缀导致持续 400。对用户来说，思考档位现在跟着对话走，而不是每轮重开；官方口径见 `packages/coding-agent/docs/models.md`（`supportsMidConvoEffort`）。

---

## 背后机制：AgentSession 的方法

```
TUI 快捷键
  → interactive-mode.ts 的 onAction handler
    → this.session.cycleModel(direction)
    → this.session.setModel(model)
    → this.session.setScopedModels(models)
    → this.session.cycleThinkingLevel()
    → this.session.setThinkingLevel(level)
```

`cycleModel()` 内部逻辑：
1. 获取 `scopedModels` 列表
2. 找到当前模型的 index
3. 按 direction 取下一个/上一个
4. 调 `setModel()` 切换
5. 发 `model_update` 事件

---

## SDK 等价操作

```ts
// 轮换模型
await session.cycleModel("forward")
await session.cycleModel("backward")

// 直接选模型
await session.setModel(someModel)

// 配置轮换列表
session.setScopedModels([
  { model: opusModel, thinkingLevel: "xhigh" },
  { model: sonnetModel },
  { model: haikuModel },
])

// 轮换 thinking level
session.cycleThinkingLevel()
session.setThinkingLevel("high")

// 查询可用 thinking levels
session.getAvailableThinkingLevels()  // → ["off", "minimal", "low", "medium", "high", "xhigh", "max"]
```

## RPC 等价操作

```json
{"type": "cycle_model"}
{"type": "set_model", "provider": "anthropic", "modelId": "claude-opus-4-5"}
{"type": "set_thinking_level", "level": "high"}
{"type": "cycle_thinking_level"}
{"type": "get_available_thinking_levels"}
```

---

## 初始配置：createAgentSession 时指定

```ts
const { session } = await createAgentSession({
  model: getModel("anthropic", "claude-sonnet-4-6"),  // 初始模型
  thinkingLevel: "high",                                 // 初始 thinking level
  scopedModels: [                                        // Ctrl+P 轮换列表
    { model: getModel("anthropic", "claude-opus-4-5"), thinkingLevel: "xhigh" },
    { model: getModel("anthropic", "claude-sonnet-4-6") },
    { model: getModel("openai", "gpt-6-astra") },
  ],
})
```

---

## 引用

- 源码：`packages/coding-agent/src/modes/interactive/interactive-mode.ts` → `cycleModel()` (L4190)、`setModel()` 调用点（L4849/4993）
- 基线：pi-mono `v0.85.1`（tag `d981de122`，merge `e3aa42f46`）
- 源码：`packages/coding-agent/src/core/keybindings.ts` → `KEYBINDINGS` 对象
- 源码：`packages/coding-agent/src/modes/interactive/components/scoped-models-selector.ts`
- `_digested/`：[agent/01-Anatomy/1.1_Agent_Info.md](_digested/agent/01-Anatomy/1.1_Agent_Info.md) — AgentLoopConfig
- `_digested/`：[integration/03-runtime-api.md](_digested/integration/03-runtime-api.md) — SDK/RPC 模型管理 API
