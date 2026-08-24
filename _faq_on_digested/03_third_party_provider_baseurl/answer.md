# 答案：第三方中转的模型怎么挂，才能不和官方 DeepSeek 冲突

## 一句话

pi-mono 里模型身份是 **`provider` + `id` 二元组**；"同名冲突"只在**同一个 provider 下**发生。第三方中转给一个新 provider 名（下面用实测过的 `micuapi`），模型 id 用第三方 `/v1/models` 暴露的原名（`deepseek-v4-flash-0731` / `deepseek-v4-pro-0813`），`baseUrl` 指向第三方——官方 `deepseek` 和第三方**井水不犯河水**。真正的坑有俩：① **第三方 baseUrl 不含 `deepseek.com` 时，官方 deepseek 的"魔法自动探测"全部失效**，必须手动补 `compat` 字段；② 第三方模型 id 常带着日期后缀（0731/0813），和官方同名模型裸 id 会跨 provider 撞名，要用 `provider/model` 全限定。

---

## 1. 模型身份与"冲突"到底指什么

源码：`provider-composer.ts` 的 `applyModelsJson()` / `modelFromJson()`，`Model` 对象 = `{ provider, id, baseUrl, api, ... }`。

- 冲突只发生在 **provider 相同 + id 相同** 时：`applyModelsJson` 的 merge 语义是 **upsert by id**——你 `models` 里 id 撞上官方，就**替换**官方那条（换成你的 baseUrl）；没撞的就**叠加**。
- **provider 不同** → 完全独立的两组模型，TUI 里按 provider 分组、`provider/model` 全限定引用无歧义。
- 所以"第三方的模型也叫 `deepseek-*`"本身**不是问题**，前提是给它**换一个 provider 名**。
- 但要注意：即使 provider 不同，**裸 id 仍然会撞**——官方 `deepseek/deepseek-v4-flash-0731` 和第三方 `micuapi/deepseek-v4-flash-0731` 存在同名模型，CLI `--model deepseek-v4-flash-0731` 会报 `ambiguous across providers`，必须 `micuapi/deepseek-v4-flash-0731` 或 `--provider`。（见 §4）

**最容易踩的坑：** 如果你图省事把第三方的 provider 也写成 `deepseek`，那才是真冲突——同 id 的模型只剩一个 baseUrl 能存在，官方和第三方不可能同时在线。

---

## 2. 方案 A（推荐）：models.json 新增 provider

文件：`~/.pi/agent/models.json`（项目级可另配，`modelsPath` 默认 `getAgentDir()`）。改完**每次开 `/model` 自动重读**，会话中途编辑无需重启。

> 以下配置已按你给的 vendor 实测（2026-08-18，见 §6 探测记录）：baseUrl `https://www.micuapi.ai`、`/v1/chat/completions` OpenAI 兼容、暴露 `deepseek-v4-flash-0731` 与 `deepseek-v4-pro-0813` 两个模型、支持 `thinking:{type:"enabled"}`、能正常返回 `tool_calls`。

```json
{
  "providers": {
    "micuapi": {
      "baseUrl": "https://www.micuapi.ai/v1",
      "api": "openai-completions",
      "apiKey": "$MICUAPI_API_KEY",
      "models": [
        {
          "id": "deepseek-v4-flash-0731",
          "name": "DeepSeek V4 Flash 0731 (micuapi)",
          "reasoning": true,
          "input": ["text"],
          "contextWindow": 1000000,
          "maxTokens": 384000,
          "compat": {
            "thinkingFormat": "deepseek",
            "requiresReasoningContentOnAssistantMessages": true,
            "maxTokensField": "max_tokens",
            "supportsReasoningEffort": false
          }
        },
        {
          "id": "deepseek-v4-pro-0813",
          "name": "DeepSeek V4 Pro 0813 (micuapi)",
          "reasoning": true,
          "input": ["text"],
          "contextWindow": 1000000,
          "maxTokens": 384000,
          "compat": {
            "thinkingFormat": "deepseek",
            "requiresReasoningContentOnAssistantMessages": true,
            "maxTokensField": "max_tokens",
            "supportsReasoningEffort": false
          }
        }
      ]
    }
  }
}
```

### 为什么这些字段必须这么填（源码依据）

官方 deepseek 走 `openai-completions`，有一串**按 baseUrl/provider 的魔法探测**（`packages/ai/src/api/openai-completions.ts`，`inferOpenAICompat` / `getOpenAICompat`）：

| 探测项 | 官方规则 | 你的第三方 | 怎么办 |
|---|---|---|---|
| `isDeepSeek` = `provider==="deepseek" \|\| baseUrl.includes("deepseek.com")` | 命中 | **不命中** | `compat.thinkingFormat = "deepseek"` |
| `requiresReasoningContentOnAssistantMessages: isDeepSeek` | true | **false（默认）** | 手动 `true` |
| `maxTokensField = useMaxTokens ? "max_tokens" : ...`，`useMaxTokens` 含 `isDeepSeek` | `max_tokens` | **默认 `max_completion_tokens`** | 手动 `"max_tokens"` |
| `supportsReasoningEffort`（deepseek 分支关掉） | false | 默认可能 true | 手动 `false`（第三方不支持 `reasoning_effort` 时） |

**核心结论：** 只要第三方 baseUrl 不含 `deepseek.com`、provider 名不是 `deepseek`，上面四条就全要手动补。最关键是 `thinkingFormat: "deepseek"`——它决定思考参数发成 DeepSeek 的 `thinking: { type: "enabled" }` 格式（`openai-completions.ts:802-811`），不补的话 reasoning 模型会发成普通 OpenAI 的格式。

- `thinkingLevelMap`（可选）：官方 `deepseek-v4-flash` = `{ high: "high", max: "max" }`（flash 另有 `low: "low"`），其余 null（`generate-models.ts` `DEEPSEEK_V4_FLASH_THINKING_LEVEL_MAP`）。第三方行为一致可以照抄；拿不准就留空走默认。
- `apiKey`：支持 `$ENV` / `${ENV}` 插值、`!command` 执行、字面量。也可以不写，用 `/login micuapi` 交互式录入（存 `auth.json`）。
- 模型 id 必须是第三方 `/v1/models` 暴露的原名（这里是 `deepseek-v4-flash-0731` / `deepseek-v4-pro-0813`）——**不要**改成官方 `deepseek-v4-flash`，否则请求发过去会 `model_not_found`。`contextWindow`/`maxTokens` 按第三方实际参数填，官方值（1M/384K）只当参考。

---

## 3. 方案 B（备选）：劫持官方 provider 的 baseUrl

如果你**只想要一条 DeepSeek 通道**、官方以后不用了：

```json
{
  "providers": {
    "deepseek": {
      "baseUrl": "https://www.micuapi.ai/v1"
    }
  }
}
```

`applyModelsJson` 里：没写 `models` 时，官方所有模型**继承**新 baseUrl（`baseUrl: config.baseUrl ?? model.baseUrl`），模型 id 不变，OAuth/API key 照旧。**代价：官方 `api.deepseek.com` 完全被顶掉**，两边不能共存。此时因为 provider 名仍是 `deepseek`，`thinkingFormat`/`requiresReasoningContentOnAssistantMessages`/`maxTokensField` 的自动探测**依然命中**，反而不需要手动补 compat——这是方案 B 唯一的好处。

---

## 4. 使用方式

- **TUI**：`/model`（或 `/model` 后搜索）里 `micuapi` 单独分组，和官方 `deepseek` 并排；`/login micuapi` 录密钥。
- **CLI**：`pi --provider micuapi --model deepseek-v4-flash-0731 ...`，或 `pi --model micuapi/deepseek-v4-flash-0731 ...`（`model-resolver.ts` 支持 `provider/model` 全限定，避免歧义报错）。注意这里 id 是 `deepseek-v4-flash-0731`，和官方 `deepseek/deepseek-v4-flash-0731` **id 完全相同**——两个 provider 下各有一个同名模型，裸 id `--model deepseek-v4-flash-0731` 会报 `ambiguous across providers`，必须用全限定或 `--provider`。
- **SDK**：`createAgentSession({ model: models.getModel("micuapi", "deepseek-v4-flash-0731") })`。
- **扩展**：等价写法 `pi.registerProvider("micuapi", { ...同上 })`（`custom-provider.md`），适合动态拉模型列表（fetch `/v1/models` 后注册）。

---

---

## 5. 探测记录（micuapi，2026-08-18）

| 探测 | 结果 |
|---|---|
| `GET /v1/models` | `{"data":[{"id":"deepseek-v4-flash-0731",...},{"id":"deepseek-v4-pro-0813",...}]}` |
| `POST /v1/chat/completions` model=`deepseek-v4-flash-0731` | 正常返回；`message` 带 `reasoning` + `reasoning_details`，`usage` 有 `reasoning_tokens` |
| `thinking: {"type":"enabled"}` | 接受，返回 reasoning 内容 |
| `thinking: {"type":"disabled"}` | 接受 |
| `reasoning_effort:"high"` | 接受（不报错）——所以 `supportsReasoningEffort` 可以留 `true`，发 `high` 档无副作用 |
| 带 `tools`（function calling） | 正常返回 `tool_calls`（`finish_reason:"tool_calls"`） |
| 不存在的模型名 | `{"error":{"code":"model_not_found","message":"No available channel for model ..."}}` —— 所以 models.json 里 **id 必须写第三方原名** |

> ⚠️ 安全提醒：上面用到的 key 是 **你在对话里直接贴出来的真实 API key**，已对第三方暴露。若这是你的生产 key，建议尽快去 micuapi 控制台轮换（rotate），日常开发用环境变量 `$MICUAPI_API_KEY` 或 `/login micuapi` 存储，别写进 git 或聊天记录。

## 6. 引用

- 源码：`packages/coding-agent/src/core/provider-composer.ts` — `applyModelsJson()` (L168)、`modelFromJson()` (L124)、`applyExtension()` (L205)
- 源码：`packages/coding-agent/src/core/model-runtime.ts` — `registerProvider()` (L742)、`providerIds()` (L236)、models.json 组合 (L260)
- 源码：`packages/ai/src/api/openai-completions.ts` — deepseek 魔法探测 (L1471)、`thinkingFormat:"deepseek"` 发送逻辑 (L802-811)
- 源码：`packages/ai/scripts/generate-models.ts` — 内置 deepseek 模型与 thinkingLevelMap (L2428-2465)、`DEEPSEEK_V4_FLASH_THINKING_LEVEL_MAP` (L266)
- 源码：`packages/coding-agent/src/core/model-resolver.ts` — `provider/model` 解析与歧义报错 (L443-500)
- 官方文档：`packages/coding-agent/docs/models.md`（custom models / override / modelOverrides）、`docs/custom-provider.md`、`docs/providers.md`
- 消化材料：`_digested/agent/05-Infra/5.2_AI_Auth_Subsystem.md`（credential 生命周期、models.json 在 auth 层的位置）

> 基线：以上源码路径以本仓库工作树 v0.84.2+8 为准（commit `d3ab2af9` merged）。
