# Research · 「Pi 里有没有录制会话快照思想」的证据账本

## 证据范围与版本

- Pi 侧：工作树 `6401d578bfd855765d4afd2908fd883a144da5ad`（2026-10-08，`v1.0.3-107-g6401d578b`）。全部行号为该树实测；与本目录 README 的 v1.0.3 全库基线（锚点 `98d2e1947`）区分，同 12 号先例。
- DSH 侧：引用 `/Users/bowhead/deepseek-harness/_faq_on_digested/21_recorded-session-snapshots/`（下称 DSH 21）的已发布结论，未重新取证；该篇自报基线为 DSH 工作树 `187ad35d`、npm `dsh-llm-replay@0.2.0-rc.2`。
- 术语 `recorded` / `authored` / `L4` / `override` 沿用 DSH 21 的定义（见其 answer.md 术语速查）。

## 主张 → 证据

### 1. 不变量是结构性实现的（transcript 即请求源）

- [docs/session-format.md](../../packages/coding-agent/docs/session-format.md)（SessionMessageEntry 节，:80）：原话 "System messages carry the prompt and tool loadout: the first request of a session persists one with every prompt section and tool declaration, and later changes persist as system messages that patch `sections` by name (`null` removes one) and list `toolsAdded`/`toolsRemoved`. Replaying them in order yields the current prompt and tools; **there is no separate prompt state entry**."；:87 说明旧会话的兼容路径（首个请求补声明、重放方式相同）。
- [packages/agent/src/agent-loop.ts:323-331](../../packages/agent/src/agent-loop.ts)：`declareToolChanges` 的合同注释——"the transcript's system messages declare what the model may call … so replay always yields exactly `context.tools`"。实现把 pending system message 的工具字段替换为「已提交 transcript 与可执行集的差量」。
- [packages/ai/src/utils/transcript.ts:57-66](../../packages/ai/src/utils/transcript.ts)：`getCurrentTools`——"Resolve the tools available after applying every transcript delta in order"；:73-96 `getCurrentSystemMessage`——"Replay every system message into one leading system message holding the current prompt and tools"；:98-102 `getCurrentSystemPrompt`；:104-112 无 mid-conversation system message 的 API 的折叠路径。
- [packages/coding-agent/test/system-prompt-updates.test.ts:276-302](../../packages/coding-agent/test/system-prompt-updates.test.ts#L276-L302)：round-trip 合同测试，:295 注释 "Simulate a resume: the persisted JSON must replay to the same declarations."。
- compaction 不破坏不变量：[docs/session-format.md](../../packages/coding-agent/docs/session-format.md) compaction 节（`systemMessage` 字段 = 压缩边界处的完整 prompt/tool checkpoint）；[packages/coding-agent/src/core/compaction/compaction.ts:100](../../packages/coding-agent/src/core/compaction/compaction.ts#L100) 注释 "System messages are prompt state, not conversation; the compaction entry carries their replay."。
- 边界（账本级而非逐字节级）：[packages/coding-agent/docs/extensions.md](../../packages/coding-agent/docs/extensions.md)（Events and concurrency 节）——`context` / `context_with_system` 可做请求局部变换，强制 prompt 可与结构化记录不同；provider 流事件不持久化。与 12 号 FAQ research.md 第 6 节一致。

### 2. faux 能力清单（对 DSH 四类 override 失败的覆盖）

均实测于 [packages/ai/src/providers/faux.ts](../../packages/ai/src/providers/faux.ts)（711 行）：

- 工厂读真实上下文：:490-503 `resolveResponse`——`typeof step === "function" ? await step(context, streamOptions, state, requestModel) : step`，`FauxResponseFactory` 拿到的是宿主传来的 `TranscriptContext`。
- pre-2xx 抛：:556-560 `queueMicrotask` 内 catch 工厂抛出 → `createErrorMessage` → `stopReason: "error"`。
- post-2xx 抛 / 中止结算出口：:424-431——`stopReason: "error"` / `"aborted"` 的结算走 `stream.push({ type: "error" ... })`；部分流后终止。
- 取消：:348-353 及 :358-421 每块 chunk 前检查 `signal?.aborted` → `createAbortedMessage`。
- 挂起 / 轮询：:526-551 `streamOptions.deferred` → `DeferredHandle`；:532 `pollAfterMs`；:540 `pendingFetches`（每次 fetch 消耗一次，>0 时挂起）。
- 注入重试的替代件：:447 `FauxProviderState.callCount`（工厂可按调用次数决定失败/成功）；AgentSession 层的重试面见 `packages/coding-agent/test/suite/agent-session-retry-events.test.ts`。
- 附带保真度：:339-435 `streamWithDeltas` 真实分块（thinking/text/toolcall 的 start/delta/end，`tokensPerSecond` 可调）；:513-523 队列耗尽报 "No more faux responses queued"。

### 3. harness 注入面（DIY 路径的通路证据）

- [packages/coding-agent/test/suite/harness.ts:111-124](../../packages/coding-agent/test/suite/harness.ts#L111-L124)：`HarnessOptions.sessionManager` 注释 "Session to continue, for example to test a resume. Default: a new in-memory session."。
- :150-161：默认 `SessionManager.inMemory()`；:161-191 真模型注册表 + faux provider 注册。
- :202-208：Agent 的 `onPayload` 接线 `before_provider_request`——测试里给模型的最终 payload 有统一截点。
- `SessionManager.open(path)`：[packages/coding-agent/src/core/session-manager.ts:1766](../../packages/coding-agent/src/core/session-manager.ts#L1766)；`continueRecent` :1793；`forkFrom` :1815。

### 4. 模型可见 payload 的断言点（DSH request/header 的对应物）

- [packages/coding-agent/src/core/extensions/types.ts:879-883](../../packages/coding-agent/src/core/extensions/types.ts#L879-L883)：`BeforeProviderRequestEvent`——"Fired before a provider request is sent. Can replace the payload."。
- :886-893：`BeforeProviderHeadersEvent`——请求头组装后、HTTP 调用前，可增删改头部。
- :869-877：`ContextWithSystemEvent`——"the handler owns the prompt and tool declarations"。
- 分发实现：[packages/coding-agent/src/core/extensions/runner.ts:1365-1381](../../packages/coding-agent/src/core/extensions/runner.ts#L1365-L1381)。

### 5. 轨迹资产的官方通道

- 类型面：[packages/coding-agent/src/core/session-manager.ts:43-197](../../packages/coding-agent/src/core/session-manager.ts#L43-L197)（`SessionHeader`、`message` / `model_change` / `compaction` / `branch_summary` / `label` / `context_edit` 等 entry）。
- 迁移：:286-329 `migrateV1ToV2` / `migrateV2ToV3`（载入时就地变异）；[docs/session-format.md](../../packages/coding-agent/docs/session-format.md)（version 节，:24-30）"Existing sessions are automatically migrated to the current version (v3) when loaded."。
- 可移植：`/export` jsonl（[packages/coding-agent/src/core/session-export.ts:38](../../packages/coding-agent/src/core/session-export.ts#L38)）；`/import`（[packages/coding-agent/src/modes/interactive/interactive-mode.ts:6533](../../packages/coding-agent/src/modes/interactive/interactive-mode.ts#L6533)）；分享（[packages/coding-agent/src/modes/interactive/session-share.ts:59](../../packages/coding-agent/src/modes/interactive/session-share.ts#L59)）；bug-report 自动携带（[packages/coding-agent/src/core/bug-report.ts:262](../../packages/coding-agent/src/core/bug-report.ts#L262) `files.push({ name: "session.jsonl", ... })`）。

### 6. 「不是测试语料」的反证（grep 口径）

- `grep -rn "session.jsonl" packages/coding-agent/test/ packages/agent/test/`：仅命中 `/import` 参数解析、startup 传路径、以及 sdk-codex-cache-probe 的 `--session` 输出路径说明——**没有任何测试提交录制会话作为夹具**。
- vitest snapshot 使用面：`grep -rl "toMatchSnapshot\|toMatchInlineSnapshot" packages/coding-agent/test/` → 仅 `interactive-mode-status.test.ts`（UI 面，非轨迹）。
- 对照：DSH 主仓有 `snapshots/session/` 语料树 + `pnpm run test:snapshot`（DSH 21，未在本仓复核）。

### 7. DSH 侧对照结论的出处

- 机制 vs 制度、「语料治理搬不走」：DSH 21 `question.md`（结论先说）、`answer.md`（一分钟版、术语速查）。
- 推导式回放（从持久化 assistant 结算推导脚本）、四类失败、格式世代内存迁移：DSH 21 `02-what-a-trajectory-is.md`。
- 「变更探测器 ≠ 正确性 oracle」、postmortem 校准（四篇仅一篇当组装回归 pin）：DSH 21 `04-what-its-worth.md`。
- L0-L4 阶梯与 L4 触发条件表、五条不变量：DSH 21 `05-plugin-repo-organization.md`。
- override 条目与 bug 复现三档做法：DSH 21 `06-bug-reproduction-playbook.md`。

## 证据薄弱处

1. **DIY 转换器未落地**：通路论证（assistant 结算字段足够重建 `FauxResponseStep[]`）是读 schema 得出的，没有写代码验证；resume 录制会话时 `model_change` 指向真实 provider、需要拨回 faux 的摩擦**未实测**，是本篇最大的未验证假设。
2. **faux 的 deferred 只核了注册与 pendingFetches 路径**：`fetchDeferred`（faux.ts:569 起）的取消分支未逐行通读，「挂起可精确模拟」的措辞按已读部分收敛。
3. **「无一次性失败原语」是缺证归纳**：grep faux.ts 无对应 API + 通读主要路径未见，非文档明示；不排除以其它构造表达。
4. **DSH 侧全为二手引用**：本篇不复核 DSH 21 的行号与版本口径。
5. **evals 未展开**：Pi 另有一个真 provider 的 eval 面（[packages/evals/src/harness.ts:389-391](../../packages/evals/src/harness.ts)——transcript 作为 prompt 重放、记录 `systemPromptSha256`），与测试分离，本篇只记录存在与位置，机制细节见 `_digested/test-strategy/07-evals-separation.md`，未全面复核。
