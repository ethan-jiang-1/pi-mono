# v0.84.2 → v0.84.3 变更总结

**日期**: 2026-08-25
**范围**: `914cf1472`(v0.84.2) → `4e58f324f`(v0.84.3)；ethan 实际合入 `d3ab2af9` → `4e58f324f`（97 commits，230 文件 +7664/-2330，~10 天）
**标签**: v0.84.3（main 在 v0.84.3 后另有 13 个未发布 commit）
**本轮特殊性**：第三次 catch-up，**纯渐进迭代，无架构换代**——没有 session 模型变化、没有新集成路径、没有 wire 协议变化。coding-agent 占 75/97 commits，重点是工具扩充与 settings/model 持久化语义。

---

## 一句话

v0.84.3 把 pi-mono 往"更完整的独立 coding agent"方向推：新增 PowerShell 工具与内置 Node runtime bundle，模型/思考深度切换从"改全局默认"收敛为"默认 session 内生效、显式 persist 才落盘"，同时给 wire 协议做了一处对外部 UI 有利的小增强（`toolcall_start` 带 id/toolName）。

---

## 六大主题

### 1. 新工具：PowerShell + 打包分发（coding-agent）

- `tools/powershell.ts`（v0.84.3 新增）：Windows-only，基于 bash 工具定义 + UTF-8 输出 shim（`getPowerShellConfig` 在非 Windows 抛错），内置工具 7→8
- **内置 Node runtime bundle**（#8474）：`build-coding-agent-bundle.mjs` 新增，`package-manager` 大幅改动，pi 可带内置 Node 分发
- `--` end-of-options（#7269）：`pi -p -- "- ..."` 传以破折号开头的参数

### 2. settings / model / thinking 持久化语义收敛

- `setModel`/`cycleModel`/`setThinkingLevel`/`cycleThinkingLevel` 统一接受 `ModelMutationOptions { persist?: boolean }`（agent-session.ts:256）：**默认 session 内生效**，`persist: true` 才写全局默认（`ctrl+s` 走这条路径）；RPC 路径不传 persist，v0.84.3 起不再改全局默认（#8356）
- 默认思考深度改为 per-model 覆盖（`modelThinkingLevels` setting）→ 全局默认；移除全局 `--default` model 语义；settings-selector 重构（`settings-submenu.ts` 新增）

### 3. wire 小增强：`toolcall_start` 带 id/toolName

- `json-event.ts` 重写：`message_update` 的 `toolcall_start` delta 现在保留 `id` 和 `toolName`（从 partial content 提取），其余 delta 仍剥 `partial`——外部 UI 可在 `message_start` 前拿到工具调用标识来关联 tool card。增量语义本身未变

### 4. compaction / branch-summary 加固

- 摘要请求新增 `toolChoice: "none"` 且对 `toolCall` 响应抛错（compaction.ts:706 / branch-summarization.ts:361）
- `sessionId` 复用调用方 routing session（不再总是新建 uuidv7）
- **zero-usage 阈值回退**（#8328）：latest assistant `stopReason:"error"` 或 usage 全零时，用纯消息长度估算驱动阈值压缩
- `branchWithSummary` 的 `fromId` 改为保留源 leaf（#preserve source leaf）
- 新增扩展事件 `session_compact_failed`（#8241）

### 5. 扩展系统

- jiti 运行时模式 3→4：新增 Node SEA / bundled Node（`virtualModules` + `tryNative:false`，#8237/#8474）
- 失败 factory 状态丢弃（#8424）：`createExtensionAPI` 返回 `{api, commit, discard}`
- `registerFlag` 默认值做声明类型运行时校验（#8123）；新增 PowerShell 工具事件变体

### 6. AI 层

- `SimpleStreamOptions` 新增 `toolChoice?: "auto"|"none"`，所有 `streamSimple` 转发
- `ThinkingTokenBudgetField` 泛化原 `supportsThinkingTokenBudget`；`$var: "thinking.budget"` chat-template kwarg
- OpenAI Completions reasoning details replay（重发 `reasoning_details`）；Anthropic server-side fallback beta；Bedrock redacted reasoning 往返 + 原始响应头中间件；默认 pi User-Agent
- GitHub Copilot OAuth 重构：登录只 enable `policyModelIds`（不是所有模型），rate-limit 走 `fetchWithRateLimitRetry`（Retry-After / 预算），refresh 重取 model list

---

## 本轮对 `_digested/` 的更新（2026-08-25）

- **merge**：v0.84.3 进 ethan（`6f8312a52`，零冲突——upstream 完全不碰 `_digested/`/`_faq_on_digested/`）
- **integration/**：02 内置工具 7→8；03 persist 语义 + 全部行号重锚（subscribe 826、prompt 1127、exportToJsonl 3376 等 ~12 处）；04 `toolcall_start` id/toolName + 锚点（ai/types.ts:535、agent-session.ts:826 等）；06 新增 PowerShell/`--`/`modelThinkingLevels` 行、model/thinking 行补 persist、`/thinking`/radius 进 TUI parity 表
- **agent/**：3.1 compaction（toolChoice/zero-usage/session_compact_failed/重锚 2050）、3.2 fromId 语义 + toolCall guard、4.2 skills isDeclaredSkill、4.3 条件 guideline 加 powershell、4.4 jiti 四模式 + commit/discard、4.5/4.6 PowerShell + splitBom、1.3 内置工具 8 个、1.4 jiti 四模式 + 事件、5.1/5.2 AI 层新能力 + Copilot policyModelIds
- **`_digested/README.md` / `_faq_on_digested/README.md`**：基线声明 → v0.84.3
- **遗留缺口**（沿用）：`agent/src/search/`、`coding-agent/src/extensions/`（llama.cpp）、`ai/src/compat/`、telemetry 专题、agent/ 各篇行号逐篇复核

---

## 相关文件

- Sync record：[`0004-v0.84.2-to-v0.84.3.md`](./0004-v0.84.2-to-v0.84.3.md)
