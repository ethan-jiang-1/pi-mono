# Scout Report: v0.75.3 → v0.83.0 关键文件变更定性

**日期**: 2026-07-30
**基线**: `76705633`
**目标**: `71efc6f0` (v0.83.0)
**方法**: 逐文件读 diff，定性为 API changed / mechanism changed / refactor only

## 总览

这是一次**多版本跨越式变更**，不是渐进式迭代。核心主题：
1. **Auth 模型完全替换**: `ModelRegistry` + `AuthStorage` → `ModelRuntime`
2. **三个新架构层**: `ai/src/api/`(31 files), `ai/src/auth/`(16 files), `agent/src/harness/tools/`(10 files)
3. **Extension 系统大升级**: project trust, native provider, InlineExtension, EntryRenderer
4. **Compaction 机制重写**: `Models` 接口替代直接 API key, retry 支持, retainedTail

---

## Integration/ 关键文件（Phase 2 修改范围）

### P0: agent-session.ts (54 commits, +910 lines) → API CHANGED + MECHANISM CHANGED

**新增 public 方法**:
- `setScopedModels()` — 设置模型轮换列表
- `getActiveToolNames()`, `getAllTools()`, `getToolDefinition()`, `setActiveToolsByName()` — 工具内省/管理
- `setSessionName()` — 命名 session
- `getUserMessagesForForking()` — fork 支持
- `getContextUsage()` — context 窗口使用追踪
- `abortBranchSummary()` — 分支总结控制
- `hasExtensionHandlers()` — 扩展事件查询
- `createReplacedSessionContext()` — session context 替换
- `exportToJsonl()` — JSONL 导出
- `getAvailableThinkingLevels()`, `supportsThinking()` — thinking 内省

**新事件类型**: `agent_settled`, `entry_appended`, `summarization_retry_*`(4), `bash_execution_update`

**机制变化**: `ModelRuntime` 替代 `ModelRegistry`；concurrent bash；idle tracking 重写；summarization retries；extension mode 传播

### P0: sdk.ts (16 commits, +151 lines) → API CHANGED

**CreateAgentSessionOptions 新增参数**:
- `modelRuntime?: ModelRuntime` (替代已删除的 authStorage + modelRegistry)
- `scopedModels?: Array<{ model, thinkingLevel }>`
- `noTools?: "all" | "builtin"`
- `excludeTools?: string[]`
- `sessionStartEvent?: SessionStartEvent`

### P1: rpc-types.ts (4 commits) → ADDITIVE

**新 RPC commands**: `get_available_thinking_levels`, `get_entries`, `get_tree`
**新 bash 参数**: `excludeFromContext?: boolean`

### P1: rpc-client.ts (6 commits) → ADDITIVE + MECHANISM

**新方法**: `getAvailableThinkingLevels()`, `getEntries()`, `getTree()`
**事件改名**: `agent_end` → `agent_settled`
**进程生命周期加固**: exitError tracking, rejectPendingRequests

### P1: extensions/types.ts (27 commits) → ADDITIVE

**新概念**: ProjectTrustEvent, ExtensionMode, InlineExtension, EntryRenderer, ScopedModel, BeforeProviderHeadersEvent, AgentSettledEvent

---

## Agent/ 关键文件（Phase 3 修改范围）

### P2: harness/types.ts (14 commits) → MAJOR BREAKING

- 新泛型 `TContext` — tool 现在接收 per-turn context
- `ExecutionEnv` 删除 → `Models` 替代
- `AgentHarnessTool` — 5-arg execute (加 context)
- `ActiveToolsChangeEntry` 新 session entry type
- event 改名: `ModelSelect`→`ModelUpdate`, `ThinkingLevelSelect`→`ThinkingLevelUpdate`
- `CompactResult.firstKeptEntryId` → optional

### P2: agent-loop.ts (13 commits) → MECHANISM

- `failToolCallsFromTruncatedMessage()` — 截断的工具调用现在会 fail 而不是执行
- abort signal 检查增强
- `acceptingUpdates` flag 防止竞态

### P2: agent-harness.ts (13 commits) → MAJOR BREAKING

- 新泛型 `TContext`
- `env`→`models`, `getApiKeyAndHeaders` 删除
- tool context binding (`bindToolContext`, `resolveToolContext`)
- retry callbacks for compaction/branch summary

### P2: compaction.ts (16 commits) → MECHANISM

- `Models` 接口替代直接 apiKey+headers
- Retry 支持 (`completeSimpleWithRetries`)
- `retainedTail` 自包含 compaction
- `combineUsage()` 合并 split-turn usage

### P3: types.ts (9 commits) → ADDITIVE

- `ThinkingLevel` + `"max"`
- `AgentToolResult` + `usage`, `addedToolNames`
- `StreamFn` type 解耦

### P3: agent.ts (7 commits) → MODERATE

- `streamFn` required (from optional)
- `prepareNextTurnWithContext` 新回调

### Trivial: skills.ts, system-prompt.ts, tools/index.ts

纯 import style 变化 (`.js` → `.ts`)，无实质变更。

---

## 新增结构（Phase 4 候选）

| 目录 | 文件数 | 重要性 | 一句话 |
|------|--------|--------|--------|
| `ai/src/api/` | 31 | 🔴 最高 | wire-protocol streaming 层，lazy loading 架构 |
| `ai/src/auth/` | 16 | 🔴 最高 | 一阶 auth 子系统，credential store + OAuth 7 providers |
| `agent/src/harness/tools/` | 10 | 🟡 高 | factory 模式工具架构 |
| `coding-agent/src/extensions/` | 6 | 🟡 高 | built-in extensions 层 + llama.cpp 参考实现 |
| `ai/src/compat/` | 1 | 🟢 低 | 兼容 shim |

---

## 更新优先级矩阵

| 优先级 | 文件 | _digested_ 影响 | 动作 |
|--------|------|-----------------|------|
| P0 | agent-session.ts | integration/ 核心锚点 | 重写 API 描述 |
| P0 | sdk.ts | integration/ SDK 入口 | 更新参数表 |
| P1 | rpc-types.ts | integration/ RPC 参考 | 补 3 个新命令 |
| P1 | rpc-client.ts | integration/ RPC 参考 | 补 3 个新方法 + 事件改名 |
| P1 | extensions/types.ts | agent/ + integration/ | 补新类型 |
| P2 | harness/types.ts | agent/ 核心类型 | 更新泛型 + ExecutionEnv 删除 |
| P2 | agent-harness.ts | agent/ harness 机制 | 更新 auth model + tool context |
| P2 | agent-loop.ts | agent/ loop 机制 | 补 truncated tool call 处理 |
| P2 | compaction.ts | agent/ memory 机制 | 更新 Models + retry + retainedTail |
| P3 | types.ts | agent/ 基础类型 | 补 max level + usage 字段 |
| P3 | agent.ts | agent/ 入口 | 补 prepareNextTurnWithContext |
| — | skills.ts, system-prompt.ts, tools/index.ts | 无影响 | 跳过 |
