# v0.75.3 → v0.83.0 变更总结

**日期**: 2026-07-30
**范围**: `76705633` → `71efc6f0`（989 commits，~2.5 个月）
**标签**: v0.75.4, v0.75.5, v0.76.0, v0.77.0, v0.78.0–v0.78.1, v0.79.0–v0.79.10, v0.80.0–v0.80.10, v0.81.0–v0.81.1, v0.82.0–v0.82.1, v0.83.0
**上游**: [earendil-works/pi](https://github.com/earendil-works/pi)

---

## 一句话

pi-mono 在把这 2.5 个月变成一个**更模块化、更可嵌入的平台**——auth 和 API 从 ad-hoc 变成了正式子系统，工具从 TUI 耦合变成了可替换的抽象层，事件和 SDK surface 在收敛成更干净的合约。

---

## 五大主题

### 1. Auth 模型彻底重写

| 旧 (v0.75.3) | 新 (v0.83.0) |
|---|---|
| `AuthStorage` + `ModelRegistry` 分开管理 | 统一的 `ModelRuntime` |
| 调用方手动 `getApiKeyAndHeaders()` 拼 header | 一句 `modelRuntime.getAuth(provider)` |
| OAuth refresh 逻辑散落在 provider 定义里 | 独立的 `ai/src/auth/` 子系统（16 文件） |
| 无并发保护 | `CredentialStore.modify()` 串行化，double-checked locking |

新 auth 子系统支持 7 个 provider 的 OAuth：Anthropic（PKCE + loopback）、OpenRouter（PKCE → 永久 API key）、GitHub Copilot（device-code + token exchange）、Kimi Code（device-code + retry）、OpenAI Codex、xAI、Radius。

### 2. AI provider 层拆成三层架构

```
旧: providers/  ← API 实现 + model catalog + auth 全混在一起

新: api/        ← wire-protocol streaming（31 文件，每 API 一个 adapter）
    providers/  ← model 数据（纯 catalog）
    auth/       ← 凭证生命周期
```

关键机制是 **lazy loading**：每个 API adapter 有一个 `.lazy.ts` wrapper——import 它几乎是零成本的（一个闭包），真正的 SDK（AWS、Google、Anthropic）在第一次 `stream()` 调用时才加载。`lazyStream()` 甚至**同步返回**一个 event stream，模块加载和网络请求在后台并行。

### 3. Agent harness 加 tool context 泛型

| 旧 (v0.75.3) | 新 (v0.83.0) |
|---|---|
| `AgentHarness<TSkill, TPromptTemplate, TTool>` | `AgentHarness<TContext, TSkill, TPromptTemplate, TTool>` |
| 工具直接 `import { readFile } from "fs"` | 工具通过 `ExecutionEnv` 抽象接口交互 |
| 工具实现在 `coding-agent/src/core/tools/`（耦合 TUI） | 工具实现在 `agent/src/harness/tools/`（纯运行时，factory 模式） |
| `ExecutionEnv` 在 harness 构造函数中 | `ExecutionEnv` 被 `Models` 替代，auth 下沉到 `Models` |

同一个 `createReadTool<TContext>()` 可以通过不同的 `ExecutionEnv` 实现跑在本地文件系统、Docker 容器或浏览器沙箱上。

### 4. Compaction 机制升级

- `Models` 接口替代直接 `apiKey`+`headers` 传参——summarization 不再管理凭证
- 新增 retry 支持：`completeSimpleWithRetries` 包装 summarization LLM 调用
- `firstKeptEntryId` 变 optional——compaction 可以自包含 `retainedTail`，不再依赖引用链解析
- `SUMMARIZATION_SYSTEM_PROMPT` 文本从 "AI coding assistant" 改为 "AI assistant"

### 5. 事件系统和 API surface 的 breaking changes

**事件改名**：
| 旧名 | 新名 |
|---|---|
| `AgentEvent` | `AgentSessionEvent`（移入 `harness/types.ts`） |
| `agent_end` | `agent_settled` |
| `ModelSelectEvent` | `ModelUpdateEvent` |
| `ThinkingLevelSelectEvent` | `ThinkingLevelUpdateEvent` |

**新增事件**：`bash_execution_update`、`entry_appended`、`summarization_retry_scheduled`、`summarization_retry_attempt_start`、`summarization_retry_finished`

**SDK 新增方法（10+）**：`setScopedModels()`、`getContextUsage()`、`exportToJsonl()`、`getUserMessagesForForking()`、`abortBranchSummary()`、`hasExtensionHandlers()`、`createReplacedSessionContext()`、`getActiveToolNames()`、`getAllTools()`、`getToolDefinition()`、`setActiveToolsByName()`、`getAvailableThinkingLevels()`、`supportsThinking()`

**SDK 新增参数**：`modelRuntime`（替代 `authStorage`+`modelRegistry`）、`scopedModels`、`excludeTools`、`sessionStartEvent`

**RPC 新增命令**：`get_available_thinking_levels`、`get_entries`、`get_tree`

**类型变化**：`ThinkingLevel` 新增 `"xhigh"` 和 `"max"`；`Provider`→`ProviderId`、`ImagesProvider`→`ImagesProviderId`

---

## 新增源码目录

| 目录 | 文件数 | 作用 |
|------|--------|------|
| `packages/ai/src/api/` | 31 | wire-protocol streaming 层 + lazy loading |
| `packages/ai/src/auth/` | 16 | credential store + OAuth flows |
| `packages/agent/src/harness/tools/` | 10 | factory 模式工具（bash/read/write/edit） |
| `packages/coding-agent/src/extensions/` | 6 | built-in extensions 层 + llama.cpp |
| `packages/ai/src/compat/` | 1 | legacy OAuth type shim |

---

## 对 `_digested/` 的更新（2026-07-30）

- **integration/**：能力覆盖表 19→32 行，SDK/RPC API 全面更新，事件模型更新
- **agent/**：全部 21 篇 + 4 个 section README 加 v0.83.0 版本警示
- **新建**：`05-Infra/` section（5.1 API Layer + 5.2 Auth Subsystem）、`4.7_Harness_Tools.md`
- **已知剩余缺口**：`coding-agent/src/extensions/`（llama.cpp）、`ai/src/compat/`

---

## 相关文件

- 详细 gap 分析：[`0002-v0.75.3-to-v0.83.0.md`](./0002-v0.75.3-to-v0.83.0.md)
- 逐文件 scout 报告：[`_scout-v0.83.0.md`](./_scout-v0.83.0.md)
- 执行计划与进度：[`_plan-1-v0.83.0.md`](./_plan-1-v0.83.0.md)
