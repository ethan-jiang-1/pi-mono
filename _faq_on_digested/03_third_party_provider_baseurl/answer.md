# 答案：第三方中转的模型怎么挂，才能不和官方 DeepSeek 冲突

## 一句话

pi-mono 里模型身份是 **`provider` + `id` 二元组**；"同名冲突"只在**同一个 provider 下**发生。第三方中转给一个新 provider 名（下面用实测过的 `micuapi`），模型 id 用第三方 `/v1/models` 暴露的原名（`deepseek-v4-flash-0731` / `deepseek-v4-pro-0813`），`baseUrl` 指向第三方——官方 `deepseek` 和第三方**井水不犯河水**。真正的坑有俩：① **第三方 baseUrl 不含 `deepseek.com` 时，官方 deepseek 的"魔法自动探测"全部失效**，必须手动补 `compat` 字段；② 第三方模型 id 常带着日期后缀（0731/0813），和官方同名模型裸 id 会跨 provider 撞名，要用 `provider/model` 全限定。

---

## 1. 模型身份与"冲突"到底指什么

源码：`provider-composer.ts` 的 `applyModelsJson()` / `modelFromJson()`，`Model` 对象 = `{ provider, id, baseUrl, api, ... }`。

- 冲突只发生在 **provider 相同 + id 相同** 时：`applyModelsJson` 的 merge 语义是 **upsert by id**——你 `models` 里 id 撞上官方，就**替换**官方那条（换成你的 baseUrl）；没撞的就**叠加**。
- **provider 不同** → 完全独立的两组模型，TUI 里按 provider 分组。**`provider/model` 只是提示，不是强制**：v1.4.0 的 `resolveModelReference` 会把整串也当作别家 provider 的模型 id 再匹配一次（`model-resolver.ts:224,257-258`），所以无凭据的 `micuapi/x` 可能解析到有凭据的官方 `deepseek/x`；要锁定 provider 用 `--provider`（`:149-150`）。
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
| `supportsReasoningEffort` = `!isGrok && !isZai && !isMoonshot && !isTogether && !isCloudflareAiGateway && !isNvidia && !isAntLing` | **true**（`isDeepSeek` **不在**排除列表里，内置 `providers/data/deepseek.json` 也没写这个字段） | 同样是 **true**（排除列表里没有你的第三方） | 一般不用管；只有第三方明确拒绝 `reasoning_effort` 才手动 `false`（`openai-completions.ts:1635-1636`） |

**核心结论：** 只要第三方 baseUrl 不含 `deepseek.com`、provider 名不是 `deepseek`，前三条就都要手动补（第四条 `supportsReasoningEffort` 默认不会变）。最关键是 `thinkingFormat: "deepseek"`——它决定思考参数发成 DeepSeek 的 `thinking: { type: "enabled" }` 格式（`openai-completions.ts:914-923`），不补的话 reasoning 模型会发成普通 OpenAI 的格式。

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
- **CLI**：`pi --provider micuapi --model deepseek-v4-flash-0731 ...`，或 `pi --model micuapi/deepseek-v4-flash-0731 ...`（`model-resolver.ts` 接受 `provider/model`，但它是**提示**不是约束；无凭据时可能落到另一家同名 id，需要锁定请加 `--provider`）。注意这里 id 是 `deepseek-v4-flash-0731`，和官方 `deepseek/deepseek-v4-flash-0731` **id 完全相同**——两个 provider 下各有一个同名模型，裸 id `--model deepseek-v4-flash-0731` 会报 `ambiguous across providers`，必须用全限定或 `--provider`。
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
| `reasoning_effort:"high"` | 接受（不报错）——所以 `supportsReasoningEffort` 可以留 `true`，发 `high` 档无副作用；本节示例 JSON 里显式写 `false` 只是保守选择（等价于让 pi 不发这个字段），不是必须 |
| 带 `tools`（function calling） | 正常返回 `tool_calls`（`finish_reason:"tool_calls"`） |
| 不存在的模型名 | `{"error":{"code":"model_not_found","message":"No available channel for model ..."}}` —— 所以 models.json 里 **id 必须写第三方原名** |

> ⚠️ 安全提醒：上面用到的 key 是 **你在对话里直接贴出来的真实 API key**，已对第三方暴露。若这是你的生产 key，建议尽快去 micuapi 控制台轮换（rotate），日常开发用环境变量 `$MICUAPI_API_KEY` 或 `/login micuapi` 存储，别写进 git 或聊天记录。

## 6. 引用

- 源码：`packages/coding-agent/src/core/provider-composer.ts` — `applyModelsJson()` (L177)、`modelFromJson()` (L130)、`applyExtension()` (L217)
- 源码：`packages/coding-agent/src/core/model-runtime.ts` — `registerProvider()` (L750)、`providerIds()` (L236)、models.json 组合 (L260)、`modelsPath` 默认 `join(getAgentDir(), "models.json")` (L174-175)
- 源码：`packages/ai/src/api/openai-completions.ts` — deepseek 魔法探测 (L1598)、`thinkingFormat:"deepseek"` 发送逻辑 (L914-923)、`supportsReasoningEffort` 排除列表 (L1635-1636)
- 源码：`packages/ai/scripts/generate-models.ts` — 生成 `packages/ai/src/providers/deepseek.models.ts`（`models.generated.ts:12`、`providers/deepseek.ts:4` 引入）、`DEEPSEEK_V4_FLASH_THINKING_LEVEL_MAP` (L286)
- 新增可选 compat 字段（v0.85.1）：`vllmPriority`（`OpenAICompletionsCompat`，`packages/ai/src/types.ts:642`）把 vLLM 的调度优先级作为顶层 `priority` 发出，仅在 vLLM 以 `--scheduling-policy priority` 运行时有意义；`supportsMaxOutputTokens`（`OpenAIResponsesCompat`，`:664`）控制 Responses 请求是否带 `max_output_tokens`（部分 Codex 协议网关会拒绝），默认 `true`
- 源码：`packages/coding-agent/src/core/model-resolver.ts` — `provider/model` 解析与歧义报错 (L443-500)
- 官方文档：`packages/coding-agent/docs/models.md`（custom models / override / modelOverrides）、`docs/custom-provider.md`、`docs/providers.md`
- 消化材料：`_digested/agent/05-Infra/5.2_AI_Auth_Subsystem.md`（credential 生命周期、models.json 在 auth 层的位置）

> 基线：以上源码路径以本仓库工作树 v0.85.1 为准（tag `d981de122`，merge `e3aa42f46`）。

---

## 7. v1.0.0 注记（2026-10-02 同步后）

**⚠️ 本文正文的行号锚点仍以 v0.85.1 为准，v1.0.0 下已漂移**（如 `applyModelsJson` 从 provider-composer.ts:177 移至 :281，`modelFromJson` :130 → :192）。机制叙述（身份二元组、upsert by id、魔法探测）未经全面复核前按历史结论对待；以下为已核实的 v1.0.0 关键变化：

- **strict 工具采样默认翻转**（影响走中转的工具调用）：未知 OpenAI 兼容端点（第三方中转基本都命中）现在默认 `supportsStrictMode: false`（`packages/ai/src/api/openai-completions.ts:1667`，890f92088）——依赖 strict JSON schema 的场景需在模型条目显式写 `supportsStrictMode: true`。
- **`--provider` 必须配 `--model`**（`packages/coding-agent/src/main.ts:470-474`，0c453048b）：孤立 `--provider` 从"静默忽略"变为报错退出；§4 的 CLI 用法两参数成对使用。
- 模型目录生成 schema 升 v6、新 `typesafe` provider（不影响 models.json 手写流程）。

### v1.0.3 增量（2026-10-06 sync-0008 同步后）

- **自定义 provider 的新官方范例**：Azure Foundry 上只讲 Chat Completions 的部署（代表：deepseek/deepseek-v4-pro）现在可用 `provider: "azure"` + `api: "openai-completions"` 挂进 models.json——azure provider 从单一 Responses API 扩为双 API dispatch（`packages/ai/src/providers/azure.ts:44-53`，`azureStreams` 在 dispatch 前解析 endpoint 并把请求里的 `model` 换成部署名、`model.id` 保持 catalog id）。`AZURE_OPENAI_DEPLOYMENT_NAME_MAP` / `azureDeploymentName`（`packages/ai/src/api/azure-openai-config.ts:27-33`）对两种 API 都生效（此前部署名映射只作用于 Responses 路径，Chat Completions 发的是 catalog model id，任何部署名≠模型名的部署 404）。本篇 §2 的"新 provider 名 + 手动补 compat"流程因此多了一个官方范本。
- **provider id 集合已变**：`azure-openai-responses` 已改名 `azure`（`a37306d43`，v1.0.3 唯一 Breaking）——models.json/auth.json/settings.json 里键为 `azure-openai-responses` 的条目必须改 `azure`（SDK 侧 `getModel("azure", ...)`）。本篇正文以自定义 provider（micuapi）为例不直接命中，但通用流程叙述里凡涉及官方 provider id 集合的地方均以此为准。
- **锚点漂移声明**（v1.2.0 轮追加，**v1.4.0 再次漂移**）：`generate-models.ts` 在 v1.2.0→v1.4.0 又改 343 行（`DEEPSEEK_V4_FLASH_THINKING_LEVEL_MAP` 现 **:275**；Together 改名集按名检索）、`provider-composer.ts`（`modelFromJson` 现 **:212**、`applyModelsJson` 现 **:302**）、`openai-completions.ts` 的 deepseek 探测现 **:1621** 一带。§7 开头"锚点仍以 v0.85.1 为准"的声明对正文历史部分继续适用，但**引用这几处代码时请按 v1.4.0 行号**，本段追加 v1.0.3（`76dfb88f6` 等）这轮漂移。

## 8. v1.2.0 增量（2026-10-13 sync-0009 同步后）

> **锚点基线变更**：本节所有行号以 **tag `v1.2.0`（`06a466935`）** 为准，不再沿用 §7 的 v0.85.1 基线。§1–§7 正文的历史锚点**未逐项重验**。

- **`RefreshModelsContext.baseUrl`：目录刷新现在知道"注册后"的 base URL**（`packages/ai/src/models.ts:100`，接口 `:80`，文件 1269 行）。注释原文：

  > Base URL of the registered provider, including configuration overrides that wrappers apply outside the provider receiving this context.

  关键是"**wrappers apply outside**"：provider 对象自己硬编码的 base URL 是 `https://openrouter.ai/api/v1`（`packages/ai/src/providers/openrouter.ts:13`），而 models.json 的区域覆盖是在**更外层**由 composer 合成的——`provider-composer.ts:608` 的 `baseUrl: extension?.baseUrl ?? config?.baseUrl ?? base?.baseUrl`。所以刷新逻辑若读自己的常量就拿不到覆盖；读 `context.baseUrl` 才拿得到。赋值点在 `models.ts:554`（`runProviderRefreshPhase` 内 `baseUrl: provider.baseUrl`），即取自**已注册**的 provider 对象。

- **具体收益——OpenRouter 区域端点**：`personalizeOpenRouterCatalog` 用 `context.baseUrl ?? OPENROUTER_BASE_URL` 拼出 `/models/user` 请求（`openrouter.ts:30`）。因此 models.json 里把 OpenRouter 指向区域端点（如 `https://us.openrouter.ai/api/v1`）时，**该区域的过滤规则会随之生效**，而不是永远打全球端点。

- **新增能力：按 key 裁剪模型目录**（`ee409a85f`）。`personalizeOpenRouterCatalog`（`openrouter.ts:24`，文件 88 行）请求 `GET /models/user`，把目录裁成**该 key 真正可用**的 chat 模型集合。三条精确语义：
  1. **无 key（匿名）→ 原样返回目录**（`openrouter.ts:28-29`：`context.credential?.type === "oauth" ? context.credential.access : context.credential?.key`，取不到 key 就 return）。这是"登录用户与匿名用户看到不同目录"的真实机制——代码只区分**有 key / 无 key**，不区分免费档与付费档。
  2. **图片与分类模型不过滤**（`openrouter.ts:47`：`if (!isModelType(model, "chat")) return [model];`）。
  3. **回退规则很窄**：仅 **401/403/404** 时整体退回原目录（`:34`）；其它非 OK 状态**抛错**（`:35`）。缺 limit 时保留目录原值，per-key 值经 `top_provider`（contextWindow/maxTokens）与 `openRouterCost`（cost）覆盖目录。

- **接线在 coding-agent**：`packages/coding-agent/src/core/model-runtime.ts:230-238` 对 `provider.id === "openrouter"` 走 `withPersonalizedCatalog(provider, personalizeOpenRouterCatalog, ...)`，其它 provider 落到 `withRemoteCatalog`（:239）。两者都是 `remote-catalog-provider.ts` 里的函数（文件 240 行）：`withRemoteCatalog` :104 是 pi.dev 目录叠加，`withPersonalizedCatalog` :195 则**跳过刷新间隔/etag 缓存，并把个性化结果持久化为目录**（:232-237），因此离线、`pi -p`、RPC 路径也用得上。

  > **版本判定注意**：`remote-catalog-provider.ts` **不是** v1.2.0 新增（v1.1.0 已有，158 → 240 行，+109/−27）；新增的是其中的 `withPersonalizedCatalog` 函数，以及新文件 `packages/ai/src/providers/openrouter-api.ts`（77 行，含 `OpenRouterModel` :28、`openRouterCost` :50）。

- **对本篇主题的含义**：`personalizeOpenRouterCatalog` **不是一个 `fetchModels` 字段**——`createProvider()`（`openrouter.ts:62-87`）没有 `fetchModels`，它是被 coding-agent 注入的**自由函数**。回答"第三方 provider 的 baseUrl 怎么影响模型列表"时，这是 v1.2.0 新增的第三条路径（前两条是 §1–§7 讲的 pi.dev 目录与 models.json 自定义条目）。


## sync-0010 增量（v1.4.0）

- **attribution 头迁到 pi-ai**：OpenRouter / NVIDIA NIM / OpenCode 的归属头由 `identity` 统一注入（`packages/ai/src/utils/identity.ts`），coding-agent 的 `provider-attribution.ts` 已删除。扩展的 `before_provider_headers` 处理器**不再看到**这些头；返回 `null` 仍能删除某个头。
- **自定义 provider 命中 `opencode.ai` 时**：`x-opencode-session` 现在也会发送（`packages/ai/src/models.ts:883`），不再只限内置 OpenCode provider；attribution 开启时还会发 `x-opencode-client`。
- **UA 统一**：`pi/<version> (<platform>; <runtime>; <arch>)`（`formatUserAgent()`）；Cloudflare 不再发 `pi-coding-agent`。
- 指向旧 base URL 的 `kimi-coding` 覆盖需补 `/v1`（见 01 篇）。
