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

---

## v1.0.0 注记（2026-10-02 同步，未逐项重验本篇其余结论）

- **默认模型迁移**：xAI 默认 → Grok 4.7（0.87.1）；OpenAI Codex 默认 → GPT-6.1 Sol（0.99.1，OpenAI/Azure/Codex 可用）；Together / OpenCode Go / Fireworks 默认 → Kimi K3（0.99.0，均为被移除模型 K2.6 的被动迁移，`packages/coding-agent/CHANGELOG.md:172-174`）。依赖"某 provider 默认模型是 X"的脚本需复核。后续补入本清单：NVIDIA 默认 → Nemotron 3 Ultra（v1.0.1，`49b9df489`，`packages/coding-agent/src/core/model-resolver.ts:28`，旧 NVIDIA 默认模型已下线）。
- **`--provider` 必须配 `--model`**（0.99.2 Fixed #10236）：CLI 传孤立 `--provider` 不再被静默忽略/不再跑别的 provider 的默认模型，而是推 error diagnostic 退出（`src/main.ts:470-474`）。方向是 `--provider` 需要 `--model`，反之不要求。
- **Virtual models**（0.99.0，#10035，commit `540e174c7`）：扩展可用 `pi.registerVirtualModel()` 注册"每次请求选物理模型"的虚拟模型，出现在 `/model`、`--model`、scoped models 里，页脚显示实际路由模型（`docs/virtual-models.md`，114 行）。Ctrl+P 轮换列表因此可能含虚拟模型——`/session` 按物理模型计费。
- **模型目录 schema v6**（0.99.0 模型类型大统一）：image/classifier 并入统一 `Model` 面（`ImagesModels` 删除），生成 schema 升 v6（`packages/ai/scripts/model-data.ts:5` `MODEL_DATA_SCHEMA_VERSION = 6`）；每 provider `.models.ts` 变 chat/image/classifier 三访问器。本篇的 `getModel()` 用法对 chat 模型不变。

## v1.0.3 注记（2026-10-06 sync-0008 同步，未逐项重验本篇其余结论）

- **azure provider 改名（v1.0.3 唯一 Breaking，`a37306d43`）**：KnownProvider 的 `azure-openai-responses` 改名为 `azure`（`packages/ai/src/types.ts:46`；coding-agent 侧 `packages/coding-agent/src/core/model-resolver.ts:25`）。**用户侧迁移**：models.json / auth.json / settings.json 里以 `azure-openai-responses` 为键的条目必须改名 `azure`；SDK 用户改 `getModel("azure", ...)` 与 `providers/azure` 导入；依赖 provider id 字符串的脚本/配置同受影响；存量会话下一轮会看到不同的 provider 名。api id `azure-openai-responses` 未变，`AZURE_OPENAI_*` 环境变量名不变。
- **Together 模型 ID 改名（`28eaccb8e`，#10336）**：`deepseek-ai/DeepSeek-V4-Pro` → `deepseek-ai/DeepSeek-V4-Pro-0813`（toggle-reasoning 集合同步改名，`packages/ai/scripts/generate-models.ts:201`），否则该模型丢失 thinking level 控制。按模型 id 字符串引用 Together 该模型的配置/脚本是一处小迁移。

## v1.2.0 注记（2026-10-13 sync-0009 同步，未逐项重验本篇其余结论）

- **本区间模型目录"零新增"——这点本身是结论**：`packages/ai/src/models.generated.ts`、`packages/ai/src/providers/*.models.ts`（42 个）与 `packages/ai/src/providers/data/*.json` 在 `98d2e1947..v1.2.0` 区间**全部未变**（`git diff --stat` 无输出）。因此**没有需要补进本篇的新模型条目**；计划里"新模型条目"一项经核实不成立（详见下方两条订正）。
- **订正 1：Haiku 5.5 不是新模型条目，而是 effort-level 正则扩宽**。`generate-models.ts` 把 `xhigh` 的可用性判据从只认 Sonnet 5 扩到同时认 Haiku 5.5（`:1094` 注释改为 "…Sonnet 5, Haiku 5.5, and Fable 5."；对应正则 `^claude-(?:sonnet|haiku)-5[.-]5(?:-\d{8})?$`，另有 `haiku-5-5`/`haiku-5.5` 分支）。**注意断言边界**：Haiku 5.5 只出现在**生成器脚本**里（`scripts/generate-models.ts`），**未出现在任何已发布的 catalog 文件**中——搜 `models.generated.ts` 与 `*.models.ts` 均无命中。所以正确的说法是"生成器已预备 Haiku 5.5 的 effort 元数据映射"，而**不是**"v1.2.0 新增了 Haiku 5.5 模型"。
- **订正 2：「GPT-6 Luna（分类器）」这一表述有误导**。`GPT-6 Luna` 确实存在于 `generate-models.ts`（`:2700`/`:2910`/`:3155`），但它是 **chat 模型**（`gpt-6-sol` 的同系列兄弟，`:2756`：`id === "gpt-6-sol" ? "GPT-6 Sol" : "GPT-6 Luna"`），**不是分类器**；且如上是**区间前既有**，本轮未新增。本篇不应据此写"新增分类器模型"。
- **真正新增的分类器能力在 llama.cpp，且它是"原生决策模型"而非新模型条目**（见下条）。分类器 API 的清单可查 `packages/ai/src/types.ts:82`（api 联合类型）与 `:876-886`（`ClassifierModel` 契约）。

- **llama.cpp 原生分类器：`typesafe-system-one`（v1.2.0 新增）**。v1.0.3 时 llama.cpp 的所有模型都只有一种分类方式——`llama-cpp-classify`（从 next-token 标签概率读答案）。v1.2.0 起分两路（`packages/coding-agent/src/extensions/llama/provider.ts`）：

  | llama.cpp 模型形态 | 判定 | 分类 API | baseUrl |
  |---|---|---|---|
  | **决策模型**（decision model） | `architecture.output_modalities` 含 `"decisions"` | `typesafe-system-one`（**新增**） | `llamaInferenceUrl(serverUrl)` → `/v1/systemone` |
  | **chat 模型** | 其它（含旧版服务端） | `llama-cpp-classify`（原有） | `serverUrl` |

  - 判定函数 `isDecisionModel()` / `isChatModel()`：源码注释说明 llama.cpp **0.6.0 起** `/models` 会为决策模型列出 `decisions`，且**对未加载与 sleeping 的模型也报**（router 从 GGUF 元数据读出，不需加载）；旧版报 `["text"]` 或不报 `architecture`，其决策模型被当作 chat 模型。
  - **重要语义**：`isChatModel()` 为 `!isDecisionModel(model) || output_modalities.includes("text")`——即**纯决策模型（不含 `text`）不会出现在 `/model` 列表里**，只作为分类器存在。这是 `/model` 与分类器两个列表在本轮的第一次分化。
  - 官方文档已同步：`packages/coding-agent/docs/llama-cpp.md`（Classification 节重写，分"Decision models"与"Chat models as classifiers"两路，点名 Julia-1、Laya、Kev、lev、OpenJev 等决策模型）。
  - **与 OpenRouter 按 key 目录的关系**：两者都在 v1.2.0 让"模型列表随凭据/服务端能力而变"，但机制不同（前者按**本地服务端报告的架构**，后者按**key 的授权集合**）。OpenRouter 那条见 [`03_third_party_provider_baseurl`](../03_third_party_provider_baseurl/answer.md) §8。

## 引用

- 源码：`packages/coding-agent/src/modes/interactive/interactive-mode.ts` → `cycleModel()` (L4190)、`setModel()` 调用点（L4849/4993）
- 基线：pi-mono `v0.85.1`（tag `d981de122`，merge `e3aa42f46`）
- 源码：`packages/coding-agent/src/core/keybindings.ts` → `KEYBINDINGS` 对象
- 源码：`packages/coding-agent/src/modes/interactive/components/scoped-models-selector.ts`
- `_digested/`：[agent/01-Anatomy/1.1_Agent_Info.md(../../_digested/agent/01-Anatomy/1.1_Agent_Info.md) — AgentLoopConfig
- `_digested/`：[integration/03-runtime-api.md(../../_digested/integration/03-runtime-api.md) — SDK/RPC 模型管理 API


## sync-0010 增量（v1.4.0）

- **默认模型更换**（`core/model-resolver.ts:28,32,58-61`）：GitHub Copilot `gpt-5.4` → **`gpt-6.1-sol`**（5.4 已退役）；NVIDIA → **`nvidia/nemotron-3.5-super-vl-120b-a12b`**；Xiaomi 与三个 Token Plan → **`mimo-v2.6-pro`**（`mimo-v2.5-pro` 已离开目录）。
- **`--model` 的 provider 选择规则变了**：不再按 catalog 顺序取第一个；先收集候选，具名 provider 可用则胜出，否则"唯一有凭据的候选"胜出，否则若具名匹配存在（哪怕不可用）就用它（`--api-key` 可给它补凭据），都没有才报歧义要求 `--provider`（`model-resolver.ts:227-259`）。`--api-key` 不参与选择。
- **`kimi-coding` 改走 OpenAI Chat Completions**（`https://api.kimi.com/coding/v1`）：对 `models.json` 的 base URL 覆盖现在**必须带 `/v1`**，否则请求打错路径。
- **切模型时丢弃旧模型的 thinking block**（v1.3.0）：不再把它当纯文本发给新模型；否则新模型会看到旧模型的推理并可能写进正文。GPT-6（API key）中途改 thinking level 则保留 prompt cache。
- 新增 `MiniMax-M3.1-Flash`（minimax / minimax-cn，thinking low…max；**不能关闭**思考）。
