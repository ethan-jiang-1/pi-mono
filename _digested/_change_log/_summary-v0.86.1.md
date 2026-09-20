# v0.84.4 → v0.86.1 变更总结

**日期**: 2026-09-21
**范围**: `b79e4cc83`(v0.84.4) → `13cbf77df`(v0.86.1)（636 commits，1095 文件 +158514/-33847，08-28 → 09-20，23 天）
**标签**: v0.85.0 / v0.85.1 / v0.86.0 / v0.86.1 四个 release；upstream main 领先 1 个未发布 commit
**本轮特殊性**: 第五次 catch-up，**建档以来最大一轮（超过之前所有轮次总和）**——架构分水岭：agent 包 durable drive 大重构（CHANGELOG 静默，de facto breaking 5 项）、#9548 transcript-first 贯穿式重构（v0.86.0 明示 3 个 breaking 中的 2 个）、新架构层 chord/durable/server 完整落地（`_digested/` 零覆盖）。

---

## 一句话

v0.85.x–0.86.x 把三件事同时做完了：AgentHarness 从 stub 骨架变成 durable drive 完整运行时（且 changelog 静默）、system prompt/tool 从请求参数变成 transcript 内 SystemMessage 流水（provider 输入随之 branded `TranscriptContext` 化）、以及 chord+durable+server 这条完全平行的应用组合/持久化新架构线入树——外加 cache warming、/bug、Radius、pico3 kernel 等大量新面。

---

## Breaking 清单

### v0.86.0 明示（3 项）

1. **B1 `Context` → `TranscriptContext`**（#9548，`9e05370b2`）：branded type（ai/types.ts:631）；自定义 provider 必须从 `context.messages` 用 `getCurrentSystemPrompt()`/`getCurrentTools()` 重放
2. **B2 JSON 化**：`ToolCall.arguments`/`ToolResultMessage.details` 限 JSON 值，`ToolResultMessage` 变 conditional type（types.ts:539，不兼容 → `never`）
3. **B3 `user_bash` fail-closed**（#9068）：错误/非法返回即 abort；只有 `undefined` 放行

### agent 包 de facto（5 项，CHANGELOG 未记录）

4. `state.systemPrompt` readonly（`src/types.ts:348`），变更改为 append system message
5. import subpath `./session/testing` → `./harness/session/testing`；`SessionContext` 移除、reducer 路径迁移
6. 新必需依赖 `@earendil-works/chord`
7. fork 必须显式 named-branch、entry 须在祖先链上（`fork-policy.ts:5`）
8. tui 去 coding-agent 环境变量耦合（v0.85.0）

---

## 六大主题

### 1. agent 包 durable drive 大重构（328 commits，+8.9 万行，changelog 静默）

- `Harness`（runtime/harness.ts:29）/`Lane`（lane.ts:221，2012 行）/`driveOperation`（drive.ts:29，OperationState 状态机持久化驱动，含 recovery/retry/deferred/structural/terminal）；`HarnessNotImplemented` → `SliceNotImplemented`
- Session：branch/lanes 分离、`OperationState` tagged union（session/types.ts:316）、guarded mutations、values 寄存器
- 存储：JSONL format 4、legacy v3 首写自动升级（legacy-v3.ts，681 行）、conformance/benchmark 套件
- Fork：named-branch 语义 + 流式两遍 JSONL fork（jsonl/fork.ts）
- Pico3 hardened kernel 入树（`./experimental/pico3`，~10k 行）；pico5 纯规格

### 2. Transcript-first（#9548 贯穿 ai/agent/coding-agent）

- `normalizeContext()` 折叠 systemPrompt+tools 为 leading SystemMessage（transcript.ts:30）；不支持 mid-conversation system message 的 API 走 `collapseSystemMessages()`（:108）
- coding-agent：section-diff SystemMessage patch 持久化（agent-session.ts:1149）；forced prompt 只投影不落盘（:1166）；`CompactionEntry.systemMessage` 快照

### 3. 成本/缓存智能化

- Cache warming（#9668）：off/streaming/idle（默认 streaming）、$0.05 阈值、TTL 90% 刷新、`cache_warming_decision` 事件
- Per-model compaction budgets（#8133）；oversized trailing tool result 修复（#9740）；retry backoff cap 60s（#8826）

### 4. 可运营性

- `/bug`（redact + Radius 上传/zip + `pi.bug-report` entry + crashes.json）；session picker 渐进加载；Radius 离线目录；Node persistent compile cache

### 5. 新架构层（chord/durable/server/session-backends，零 changelog）

- chord=组合语言（facets/services/replicated state/delta/remote wire）；server=路由交换机（SessionRouter，payload opaque）；durable=事实层（Pico5 contracts + MemoryStorage）；业务语义在 `coding-agent/src/experimental/services/`
- protocol/client 全部变更属此线（CBOR，PROTOCOL_VERSION=8）；session-backends 从零新建 sqlite-node
- coding-agent experimental 多进程 ~80+ commits，source-only（#9132）

### 6. ai 层 + 扩展 + TUI

- ai：providerThinkingLevel 持久化、signed-thinking relay 修复潮、session-affinity headers、EventStream O(n²) 修复、目录大刷新（GPT-6 Astra、Meta Muse、Radius；删 GPT-5.4/Grok Build 0.1）
- 扩展：`pi.on()` 返回 unsubscribe（#8967）、`ctx.modelRegistry.stream()`（#8964）、内置工具 strict-prefer 采样默认化、RPC steer/follow_up 走 input handler（#8718）
- TUI：native clipboard、fuzzy native substring、Alt+wheel 加速、WezTerm 图像修复

---

## 本轮对 `_digested/` 的更新（2026-09-21）

- **merge**：v0.86.1 进 ethan（`b700a07be`，零冲突）
- **Discovery 完成**：4 路并行取证（agent / coding-agent / ai+protocol+client / 新包+tui+session-backends），sync record `0006`
- **Execution（按 0006 优先级建议执行）**：
  - [x] README 基线声明 → v0.86.1 + 包表补 chord/durable/sqlite-node
  - [x] agent/04-Harness 4.1 重写（durable drive runtime）
  - [x] integration/03 B1/B2 示例修复 + modelRegistry.stream
  - [x] extensions/2.1+2.4 loop seam 与持久化模型
  - [x] agent/03-Memory 3.4/3.5 + 02-Runtime 2.5
  - [x] 新架构面子目录或入口页
  - [x] 其余按 0006 影响评估表

---

## 相关文件

- Sync record：[`0006-v0.84.4-to-v0.86.1.md`](./0006-v0.84.4-to-v0.86.1.md)
