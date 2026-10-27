# 证据附录（生成物）

由 `_evidence/claims.json` 生成，基线 `v1.4.0`。**不要手改**；改台账后重新运行：

```sh
node _digested/_evidence/tools/render-evidence.mjs --corpus <语料目录>
```

正文的 `[E###]` 指向本文件的对应标题。每条记录给出符号/小节定位、原文引文与核验版本；
行号仅作为人读提示，机器校验不使用行号。

## 13_recorded_session_snapshots/answer.md

### E001

round-trip 测试断言持久化的 JSON 重放出相同的工具声明

- [`packages/coding-agent/test/system-prompt-updates.test.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/system-prompt-updates.test.ts) — text: `// Simulate a resume: the persisted JSON must replay to the same declarations.`，提示行 295

  ```text
  // Simulate a resume: the persisted JSON must replay to the same declarations.
  ```

核验：`v1.4.0`

### E002

faux 的 deferred 状态记录请求模型、待取次数与取消标记

- [`packages/ai/src/providers/faux.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/src/providers/faux.ts) — text: `model: requestModel, pendingFetches: Math.max(0, Math.floor(options.deferred?.pendingFetches ?? 0)), cancelled: false, }`，提示行 556

  ```text
  model: requestModel, pendingFetches: Math.max(0, Math.floor(options.deferred?.pendingFetches ?? 0)), cancelled: false, }); await streamWithDeltas(
  ```

核验：`v1.4.0`

### E003

faux 把工具调用参数按 token 尺寸分块流式推送

- [`packages/ai/src/providers/faux.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/src/providers/faux.ts) — text: `for (const chunk of splitStringByTokenSize(JSON.stringify(block.arguments), minTokenSize, maxTokenSize)) { await schedul`，提示行 427

  ```text
  for (const chunk of splitStringByTokenSize(JSON.stringify(block.arguments), minTokenSize, maxTokenSize)) { await scheduleChunk(chunk, tokensPerSecond); if (signal?.aborted) { const aborted = createAbortedMessage(partial); stream.push({ type: "error", reason: "aborted", error: aborted });
  ```

核验：`v1.4.0`

### E004

faux 的流最终以完整的 assistant message 结算

- [`packages/ai/src/providers/faux.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/src/providers/faux.ts) — text: `message: AssistantMessage,`，提示行 358

  ```text
  message: AssistantMessage,
  ```

核验：`v1.4.0`

### E005

faux 在开始流之前通过 onResponse 回调报告状态与响应头

- [`packages/ai/src/providers/faux.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/src/providers/faux.ts) — text: `queueMicrotask(async () => { try { await streamOptions?.onResponse?.({ status: 200, headers: {} }, requestModel); if (!s`，提示行 526

  ```text
  queueMicrotask(async () => { try { await streamOptions?.onResponse?.({ status: 200, headers: {} }, requestModel); if (!step) { let message = createErrorMessage( new Error("No more faux responses queued"), api, provider, requestModel.id, ); message = withUsageEstimate(message, context, streamOptions, promptCache); outer.push({ type: "error", reason: "error", error: message }); outer.end(message); return; } if (streamOptions?.deferred) { const handle: DeferredHandle = { provider: requestModel.provider, modelId: requestModel.id, api: requestModel.api, id: randomId("deferred"), ...(options.deferred?.pollAfterMs !== undefined ? { pollAfterMs: options.deferred.pollAfterMs } : {}), }; deferredResponses.set(handle.id, {
  ```

核验：`v1.4.0`

### E006

faux 在 error/aborted 结算时推 error 事件并结束流，不再推 done

- [`packages/ai/src/providers/faux.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/src/providers/faux.ts) — text: `return;`，提示行 447

  ```text
  return;
  ```

核验：`v1.4.0`

### E007

faux 的模型定义带 maxTokens 上限（示例为 16384）

- [`packages/ai/src/providers/faux.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/src/providers/faux.ts) — text: `maxTokens: 16384, }, ］; const models = modelDefinitions.map((definition) => ({ id: definition.id, name: definition.name `，提示行 490

  ```text
  maxTokens: 16384, }, ]; const models = modelDefinitions.map((definition) => ({ id: definition.id, name: definition.name ?? definition.id, api, provider, baseUrl: DEFAULT_BASE_URL, reasoning: definition.reasoning ?? false, input: definition.input ?? ["text", "image"], inputLimits: definition.inputLimits, cost: definition.cost ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: definition.contextWindow ?? 128000,
  ```

核验：`v1.4.0`

### E008

SessionManager.open(path, sessionDir?, cwdOverride?) 打开既有会话

- [`packages/coding-agent/src/core/session-manager.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/session-manager.ts) — text: `static open(path: string, sessionDir?: string, cwdOverride?: string): SessionManager {`，提示行 1766

  ```text
  static open(path: string, sessionDir?: string, cwdOverride?: string): SessionManager {
  ```

核验：`v1.4.0`

### E009

导出会话未给路径时生成带时间戳的 JSONL 文件名

- [`packages/coding-agent/src/core/session-export.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/session-export.ts) — text: `outputPath ?? `session-${new Date().toISOString().replace(/［:.］/g, "-")}.jsonl`,`，提示行 38

  ```text
  outputPath ?? `session-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`,
  ```

核验：`v1.4.0`

### E010

分享会话时把 session.jsonl 以 application/x-ndjson 上传

- [`packages/coding-agent/src/core/bug-report.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/bug-report.ts) — text: `files.push({ name: "session.jsonl", contentType: "application/x-ndjson", data: bundle.sessionJsonl });`，提示行 262

  ```text
  files.push({ name: "session.jsonl", contentType: "application/x-ndjson", data: bundle.sessionJsonl });
  ```

核验：`v1.4.0`

### E011

migrateV1ToV2 就地补出 id/parentId 树结构

- [`packages/coding-agent/src/core/session-manager.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/session-manager.ts) — text: `/** Migrate v1 → v2: add id/parentId tree structure. Mutates in place. */ function migrateV1ToV2(entries: FileEntry［］): `，提示行 286

  ```text
  /** Migrate v1 → v2: add id/parentId tree structure. Mutates in place. */ function migrateV1ToV2(entries: FileEntry[]): void { const ids = new Set<string>(); let prevId: string | null = null; for (const entry of entries) { if (entry.type === "session") { entry.version = 2; continue; } entry.id = generateId(ids); entry.parentId = prevId; prevId = entry.id; // Convert firstKeptEntryIndex to firstKeptEntryId for compaction if (entry.type === "compaction") { const comp = entry as CompactionEntry & { firstKeptEntryIndex?: number }; if (typeof comp.firstKeptEntryIndex === "number") { const targetEntry = entries[comp.firstKeptEntryIndex]; if (targetEntry && targetEntry.type !== "session") { comp.firstKeptEntryId = targetEntry.id; } delete comp.firstKeptEntryIndex; } } } } /** Migrate v2 → v3: rename hookMessage role to custom. Mutates in place. */ function migrateV2ToV3(entries: FileEntry[]): void { for (const entry of entries) { if (entry.type === "session") { entry.version = 3; continue; } // Update message entries with hookMessage role if (entry.type === "message") { const msgEntry = entry as SessionMessageEntry; if (msgEntry.message && (msgEntry.message as { role: string }).role === "hookMessage") { (msgEntry.message as { role: string }).role = "custom"; } }
  ```

核验：`v1.4.0`

### E012

测试 harness 的 sessionManager 选项用于续接会话或测试 resume

- [`packages/coding-agent/test/suite/harness.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/suite/harness.ts) — text: `modelsJson?: Record<string, unknown>; /** Session to continue, for example to test a resume. Default: a new in-memory se`，提示行 122

  ```text
  modelsJson?: Record<string, unknown>; /** Session to continue, for example to test a resume. Default: a new in-memory session. */
  ```

核验：`v1.4.0`

### E013

before_provider_request 钩子可以修改消息后交给模型

- [`packages/coding-agent/src/core/extensions/types.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/extensions/types.ts) — text: `* Fired before each LLM call. Can modify messages. * * `messages` holds the conversation without system messages. The pr`，提示行 879

  ```text
  * Fired before each LLM call. Can modify messages. * * `messages` holds the conversation without system messages. The prompt and tool state * belong to Pi: it restores them after the handler returns, so a handler cannot drop * them and does not need to preserve them.
  ```

核验：`v1.4.0`

## 13_recorded_session_snapshots/research.md

### E014

round-trip 测试断言工具声明在 JSON 往返后不变

- [`packages/coding-agent/test/system-prompt-updates.test.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/system-prompt-updates.test.ts) — text: `test("keeps tool declarations stable across a session JSON round-trip", async () => { const executableTool: AgentTool = `，提示行 276

  ```text
  test("keeps tool declarations stable across a session JSON round-trip", async () => { const executableTool: AgentTool = { name: "plain", label: "Plain", description: "Plain tool", parameters: Type.Object({}), execute: async () => ({ content: [], details: {} }), }; const harness = await createHarness({ tools: [executableTool], initialActiveToolNames: ["plain"] }); try { harness.setResponses([fauxAssistantMessage("first"), fauxAssistantMessage("second")]); await harness.session.prompt("one"); const head = harness.session.messages[0]; if (head?.role !== "system") throw new Error("expected system message"); const declaration = head.toolsAdded?.[0]; if (!declaration) throw new Error("expected tool declaration"); expect(Object.hasOwn(declaration, "constrainedSampling")).toBe(false); expect(Object.hasOwn(declaration, "execute")).toBe(false); // Simulate a resume: the persisted JSON must replay to the same declarations. harness.session.agent.state.messages = JSON.parse(JSON.stringify(harness.session.messages)); await harness.session.prompt("two"); expect(harness.session.messages.filter((message) => message.role === "system")).toHaveLength(1); } finally { harness.cleanup(); } });
  ```

核验：`v1.4.0`

### E015

compaction entry 携带被压缩 system message 的重放状态

- [`packages/coding-agent/src/core/compaction/compaction.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/compaction/compaction.ts) — text: `// System messages are prompt state, not conversation; the compaction entry carries their replay.`，提示行 100

  ```text
  // System messages are prompt state, not conversation; the compaction entry carries their replay.
  ```

核验：`v1.4.0`

### E016

测试 harness 的选项覆盖 provider、模型与 settings

- [`packages/coding-agent/test/suite/harness.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/suite/harness.ts) — text: `export interface HarnessOptions { provider?: string; models?: FauxModelDefinition［］; settings?: Partial<Settings>; tools`，提示行 111

  ```text
  export interface HarnessOptions { provider?: string; models?: FauxModelDefinition[]; settings?: Partial<Settings>; tools?: AgentTool[]; initialActiveToolNames?: string[]; allowedToolNames?: string[]; excludedToolNames?: string[]; resourceLoader?: ResourceLoader; extensionFactories?: Array<InlineExtension | CreateTestExtensionsResultInput>; withConfiguredAuth?: boolean; modelsJson?: Record<string, unknown>; /** Session to continue, for example to test a resume. Default: a new in-memory session. */ sessionManager?: SessionManager;
  ```

核验：`v1.4.0`

### E017

SessionManager.open 用路径打开会话，可覆盖 sessionDir 与 cwd

- [`packages/coding-agent/src/core/session-manager.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/session-manager.ts) — text: `static open(path: string, sessionDir?: string, cwdOverride?: string): SessionManager {`，提示行 1766

  ```text
  static open(path: string, sessionDir?: string, cwdOverride?: string): SessionManager {
  ```

核验：`v1.4.0`

### E018

每次 LLM 调用前的钩子可以改写 transcript 消息

- [`packages/coding-agent/src/core/extensions/types.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/extensions/types.ts) — text: `* Fired before each LLM call. Can modify messages. * * `messages` holds the conversation without system messages. The pr`，提示行 879

  ```text
  * Fired before each LLM call. Can modify messages. * * `messages` holds the conversation without system messages. The prompt and tool state * belong to Pi: it restores them after the handler returns, so a handler cannot drop * them and does not need to preserve them.
  ```

核验：`v1.4.0`

### E019

emitBeforeProviderRequest 允许扩展替换或保留请求 payload

- [`packages/coding-agent/src/core/extensions/runner.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/extensions/runner.ts) — text: `return currentMessages; } async emitBeforeProviderRequest(payload: unknown): Promise<unknown> { const ctx = this.createC`，提示行 1365

  ```text
  return currentMessages; } async emitBeforeProviderRequest(payload: unknown): Promise<unknown> { const ctx = this.createContext(); let currentPayload = payload; for (const { ext, handlers } of snapshotEventHandlers(this.extensions, "before_provider_request")) { for (const handler of handlers) { try { const event: BeforeProviderRequestEvent = { type: "before_provider_request", payload: currentPayload, }; const handlerResult = await handler(event, ctx); if (handlerResult !== undefined) { currentPayload = handlerResult;
  ```

核验：`v1.4.0`

### E020

SessionHeader 的 version 可缺省，缺省即 v1 旧会话

- [`packages/coding-agent/src/core/session-manager.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/session-manager.ts) — text: `export interface SessionHeader { type: "session"; version?: number; // v1 sessions don't have this id: string; timestamp`，提示行 43

  ```text
  export interface SessionHeader { type: "session"; version?: number; // v1 sessions don't have this id: string; timestamp: string; cwd: string; parentSession?: string; } export interface NewSessionOptions { id?: string; parentSession?: string; } export interface SessionEntryBase { type: string; id: string; parentId: string | null; timestamp: string; } export interface SessionMessageEntry extends SessionEntryBase { type: "message"; message: AgentMessage; } export interface ThinkingLevelChangeEntry extends SessionEntryBase { type: "thinking_level_change"; thinkingLevel: string; } export interface ModelChangeEntry extends SessionEntryBase { type: "model_change"; provider: string; modelId: string; } export interface UsageEntry extends SessionEntryBase { type: "usage"; /** Arbitrary usage category, such as "cache_warm". */ kind: string; provider: string; model: string; usage: Usage; /** Optional human-readable qualifier for usage notices. */ note?: string; } export interface CompactionEntry<T = unknown> extends SessionEntryBase { type: "compaction"; summary: string; firstKeptEntryId: string; tokensBefore: number; /** Extension-specific data (e.g., ArtifactIndex, version markers for structured compaction) */ details?: T; /** Usage from the LLM call(s) that generated this summary, if available */ usage?: Usage; /** True if generated by an extension, undefined/false if pi-generated (backward compatible) */ fromHook?: boolean; /** Complete prompt and tool state at this compaction boundary. */ systemMessage?: SystemMessage; } export interface BranchSummaryEntry<T = unknown> extends SessionEntryBase { type: "branch_summary"; fromId: string; summary: string; /** Extension-specific data (not sent to LLM) */ details?: T; /** Usage from the LLM call that generated this summary, if available */ usage?: Usage; /** True if generated by an extension, false if pi-generated */ fromHook?: boolean; } /** * Custom entry for extensions to store extension-specific data in the session. * Use customType to identify your extension's entries. * * Purpose: Persist extension state across session reloads. On reload, extensions can * scan entries for their customType and reconstruct internal state. * * Does NOT participate in LLM context (ignored by buildSessionContext). * For injecting content into context, see CustomMessageEntry. */ export interface CustomEntry<T = unknown> extends SessionEntryBase { type: "custom"; customType: string; data?: T; } /** Label entry for user-defined bookmarks/markers on entries. */ export interface LabelEntry extends SessionEntryBase { type: "label"; targetId: string; label: string | undefined; } /** Session metadata entry (e.g., user-defined display name). */ export interface SessionInfoEntry extends SessionEntryBase { type: "session_info"; name?: string; } /** * Custom message entry for extensions to inject messages into LLM context. * Use customType to identify your extension's entries. * * Unlike CustomEntry, this DOES participate in LLM context. * The content is converted to a user message in buildSessionContext(). * Use details for extension-specific metadata (not sent to LLM). * * display controls TUI rendering: * - false: hidden entirely * - true: rendered with distinct styling (different from user messages) */ export interface CustomMessageEntry<T = unknown> extends SessionEntryBase { type: "custom_message"; customType: string; content: string | (TextContent | ImageContent)[]; details?: T; display: boolean; } /** Content that an append-only context edit may replace without changing message metadata. */ export type ContextEditableContent = | UserMessage["content"] | AssistantMessage["content"] | ToolResultMessage["content"] | CustomMessage["content"]; /** Append-only change to one earlier entry's contribution to model context. */ export interface ContextEditEntry extends SessionEntryBase { type: "context_edit"; targetId: string; /** Null omits the target from model context. A value replaces only its content. */ replacement: { content: ContextEditableContent } | null; } /** Session entry - has id/parentId for tree structure (returned by "read" methods in SessionManager) */ export type SessionEntry = | SessionMessageEntry | ThinkingLevelChangeEntry | ModelChangeEntry | UsageEntry | CompactionEntry | BranchSummaryEntry | CustomEntry | CustomMessageEntry | ContextEditEntry | LabelEntry | SessionInfoEntry; /** Raw file entry (includes header) */ export type FileEntry = SessionHeader | SessionEntry;
  ```

核验：`v1.4.0`

### E021

导出未指定路径时用时间戳生成 session JSONL 文件名

- [`packages/coding-agent/src/core/session-export.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/session-export.ts) — text: `outputPath ?? `session-${new Date().toISOString().replace(/［:.］/g, "-")}.jsonl`,`，提示行 38

  ```text
  outputPath ?? `session-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`,
  ```

核验：`v1.4.0`

### E022

斜杠命令参数解析按首个空白切分

- [`packages/coding-agent/src/modes/interactive/interactive-mode.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/modes/interactive/interactive-mode.ts) — text: `const firstWhitespaceIndex = argsString.search(/\s/);`，提示行 6533

  ```text
  const firstWhitespaceIndex = argsString.search(/\s/);
  ```

核验：`v1.4.0`

### E023

bug-report 把临时目录里的 session.jsonl 打进诊断包

- [`packages/coding-agent/src/modes/interactive/session-share.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/modes/interactive/session-share.ts) — text: `const jsonlFile = path.join(tempDir, "session.jsonl");`，提示行 59

  ```text
  const jsonlFile = path.join(tempDir, "session.jsonl");
  ```

核验：`v1.4.0`

### E024

分享包把 session.jsonl 作为 application/x-ndjson 上传

- [`packages/coding-agent/src/core/bug-report.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/bug-report.ts) — text: `files.push({ name: "session.jsonl", contentType: "application/x-ndjson", data: bundle.sessionJsonl });`，提示行 262

  ```text
  files.push({ name: "session.jsonl", contentType: "application/x-ndjson", data: bundle.sessionJsonl });
  ```

核验：`v1.4.0`

## 12_pi_philosophy/sdlc_evidence.md

### E025

证据：`CONTRIBUTING.md#L5-L11`

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `## Philosophy First things first: **pi's core is minimal**. If your feature does not belong in the core, it should be an`，提示行 5

  ```text
  ## Philosophy First things first: **pi's core is minimal**. If your feature does not belong in the core, it should be an extension. PRs that bloat the core will likely be rejected. Pi's core exists to be minimal and to be extensible so that it can be influenced and manipulated by extensions. Even hook points for extensions however should be well considered and discussed to avoid adding unmaintainable bloat and complex interactions.
  ```

核验：`v1.4.0`

### E026

证据：`CONTRIBUTING.md#L13-L19`

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `## The One Rule **You must understand your code.** If you cannot explain what your changes do and how they interact with`，提示行 13

  ```text
  ## The One Rule **You must understand your code.** If you cannot explain what your changes do and how they interact with the rest of the system, your PR will be closed. Using AI to write code is fine. Submitting AI-generated slop without understanding it is not. If you use an agent, run it from the `pi` root directory so it picks up `AGENTS.md` automatically. Your agent must follow the rules and guidelines in that file.
  ```

核验：`v1.4.0`

### E027

证据：`CONTRIBUTING.md#L21-L34`

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `## Contribution Gate All issues and PRs from new contributors are auto-closed by default. Issues submitted Friday throug`，提示行 21

  ```text
  ## Contribution Gate All issues and PRs from new contributors are auto-closed by default. Issues submitted Friday through Sunday are not guaranteed to be reviewed. If something is urgent, ask on Discord: https://discord.com/invite/3cU7Bz4UPx Maintainers review auto-closed issues daily and reopen worthwhile ones. Issues that do not meet the quality bar below will not be reopened or receive a reply. Approval happens through maintainer replies on issues: - `lgtmi`: your future issues will not be auto-closed - `lgtm`: your future issues and PRs will not be auto-closed The command must be at the start of the reply (optionally after one or more `@username` mentions) or at the end. `lgtmi` does not grant rights to submit PRs. Only `lgtm` grants rights to submit PRs.
  ```

核验：`v1.4.0`

### E028

证据：`CONTRIBUTING.md#L36-L48`

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `## Quality Bar For Issues If you open an issue, you must use one of the two GitHub issue templates. If you open an issue`，提示行 36

  ```text
  ## Quality Bar For Issues If you open an issue, you must use one of the two GitHub issue templates. If you open an issue, keep it short, concrete, and worth reading. - Keep it concise. If it does not fit on one screen, it is too long. - Write in your own voice (do not use an LLM to generate text, if you must, follow up with a clearly AI labeled comment). - State the bug or request clearly. - Explain why it matters. - If you want to implement the change yourself, say so. If the issue is real and written well, a maintainer may reopen it or reply with `lgtmi` or `lgtm` in the command position described above.
  ```

核验：`v1.4.0`

### E029

证据：`CONTRIBUTING.md#L56-L71`

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `## Before Submitting a PR Do not open a PR unless you have already been approved by a maintainer using `lgtm` in the com`，提示行 56

  ```text
  ## Before Submitting a PR Do not open a PR unless you have already been approved by a maintainer using `lgtm` in the command position described above. Before submitting a PR: '''bash npm run check ./test.sh ''' Both must pass. Do not edit `CHANGELOG.md`. Changelog entries are added by maintainers. If you are adding a new provider to `packages/ai`, see `AGENTS.md` for required tests.
  ```

核验：`v1.4.0`

### E030

证据：`issue-gate.yml#L3-L5`

- [`.github/workflows/issue-gate.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/issue-gate.yml) — text: `on: issues: types: ［opened］`，提示行 3

  ```text
  on: issues: types: [opened]
  ```

核验：`v1.4.0`

### E031

证据：`issue-gate.yml#L18-L26`

- [`.github/workflows/issue-gate.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/issue-gate.yml) — text: `const APPROVED_FILE = '.github/APPROVED_CONTRIBUTORS'; const VALID_CAPABILITIES = new Set(［'issue', 'pr'］); const TRUSTE`，提示行 18

  ```text
  const APPROVED_FILE = '.github/APPROVED_CONTRIBUTORS'; const VALID_CAPABILITIES = new Set(['issue', 'pr']); const TRUSTED_BOT_AUTHORS = new Set(['dependabot[bot]', 'sentry[bot]', 'claude[bot]']); const issueAuthor = context.payload.issue.user.login; const defaultBranch = context.payload.repository.default_branch; const isBotAuthor = issueAuthor.endsWith('[bot]'); if (TRUSTED_BOT_AUTHORS.has(issueAuthor)) { console.log(`Skipping trusted bot: ${issueAuthor}`);
  ```

核验：`v1.4.0`

### E032

证据：`issue-gate.yml#L84-L97`

- [`.github/workflows/issue-gate.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/issue-gate.yml) — text: `const permission = await getPermission(issueAuthor); if (!isBotAuthor && ［'admin', 'maintain', 'write'］.includes(permiss`，提示行 84

  ```text
  const permission = await getPermission(issueAuthor); if (!isBotAuthor && ['admin', 'maintain', 'write'].includes(permission)) { console.log(`${issueAuthor} is a collaborator with ${permission} access`); return; } const approvedContent = await getTextFile(APPROVED_FILE); const approvedUsers = parseApprovedUsers(approvedContent); const capability = approvedUsers.get(issueAuthor.toLowerCase()); if (!isBotAuthor && (capability === 'issue' || capability === 'pr')) { console.log(`${issueAuthor} is approved for ${capability}`); return; }
  ```

核验：`v1.4.0`

### E033

证据：`issue-gate.yml#L99-L129`

- [`.github/workflows/issue-gate.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/issue-gate.yml) — text: `const message = ［ 'This issue was auto-closed. All issues from new contributors are auto-closed by default.', '', `Maint`，提示行 99

  ```text
  const message = [ 'This issue was auto-closed. All issues from new contributors are auto-closed by default.', '', `Maintainers review auto-closed issues daily and reopen worthwhile ones. Issues that do not meet the quality bar in [CONTRIBUTING.md](https://github.com/${context.repo.owner}/${context.repo.repo}/blob/${defaultBranch}/CONTRIBUTING.md) will not be reopened or receive a reply.`, '', 'If a maintainer replies `lgtmi` on one of your issues, your future issues will stay open. If a maintainer replies `lgtm`, your future issues and PRs will stay open. The command must be at the start of the reply (optionally after one or more `@username` mentions) or at the end.', '', `See [CONTRIBUTING.md](https://github.com/${context.repo.owner}/${context.repo.repo}/blob/${defaultBranch}/CONTRIBUTING.md).`, ].join('\n'); await github.rest.issues.createComment({ owner: context.repo.owner, repo: context.repo.repo, issue_number: context.issue.number, body: message, }); await github.rest.issues.addLabels({ owner: context.repo.owner, repo: context.repo.repo, issue_number: context.issue.number, labels: ['untriaged'], }); await github.rest.issues.update({ owner: context.repo.owner, repo: context.repo.repo, issue_number: context.issue.number, state: 'closed', state_reason: 'not_planned', });
  ```

核验：`v1.4.0`

### E034

证据：`pr-gate.yml#L3-L5`

- [`.github/workflows/pr-gate.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/pr-gate.yml) — text: `on: pull_request_target: types: ［opened］`，提示行 3

  ```text
  on: pull_request_target: types: [opened]
  ```

核验：`v1.4.0`

### E035

证据：`pr-gate.yml#L19-L29`

- [`.github/workflows/pr-gate.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/pr-gate.yml) — text: `const APPROVED_FILE = '.github/APPROVED_CONTRIBUTORS'; const VALID_CAPABILITIES = new Set(［'issue', 'pr'］); const TRUSTE`，提示行 19

  ```text
  const APPROVED_FILE = '.github/APPROVED_CONTRIBUTORS'; const VALID_CAPABILITIES = new Set(['issue', 'pr']); const TRUSTED_BOT_AUTHORS = new Set(['dependabot[bot]', 'sentry[bot]', 'claude[bot]']); const prAuthor = context.payload.pull_request.user.login; const defaultBranch = context.payload.repository.default_branch; const isBotAuthor = prAuthor.endsWith('[bot]'); if (TRUSTED_BOT_AUTHORS.has(prAuthor)) { console.log(`Skipping trusted bot: ${prAuthor}`); return; }
  ```

核验：`v1.4.0`

### E036

证据：`pr-gate.yml#L101-L128`

- [`.github/workflows/pr-gate.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/pr-gate.yml) — text: `const permission = await getPermission(prAuthor); if (!isBotAuthor && ［'admin', 'maintain', 'write'］.includes(permission`，提示行 101

  ```text
  const permission = await getPermission(prAuthor); if (!isBotAuthor && ['admin', 'maintain', 'write'].includes(permission)) { console.log(`${prAuthor} is a collaborator with ${permission} access`); return; } const approvedContent = await getTextFile(APPROVED_FILE); const approvedUsers = parseApprovedUsers(approvedContent); const capability = approvedUsers.get(prAuthor.toLowerCase()); if (!isBotAuthor && capability === 'pr') { console.log(`${prAuthor} is approved for PRs`); return; } console.log(`${prAuthor} is not approved, closing PR`); const message = [ 'This PR was auto-closed. Only contributors approved with `lgtm` can open PRs. Open an issue first and ask a maintainer for approval.', '', `Maintainers review auto-closed issues daily. Issues that do not meet the quality bar in [CONTRIBUTING.md](https://github.com/${context.repo.owner}/${context.repo.repo}/blob/${defaultBranch}/CONTRIBUTING.md) will not be reopened or receive a reply.`, '', 'If a maintainer replies `lgtmi`, your future issues will stay open. If a maintainer replies `lgtm`, your future issues and PRs will stay open. The command must be at the start of the reply (optionally after one or more `@username` mentions) or at the end.', '', `See [CONTRIBUTING.md](https://github.com/${context.repo.owner}/${context.repo.repo}/blob/${defaultBranch}/CONTRIBUTING.md).`, ].join('\n'); await closePullRequest(message);
  ```

核验：`v1.4.0`

### E037

证据：`approve-contributor.yml#L3-L5`

- [`.github/workflows/approve-contributor.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/approve-contributor.yml) — text: `on: issue_comment: types: ［created］`，提示行 3

  ```text
  on: issue_comment: types: [created]
  ```

核验：`v1.4.0`

### E038

证据：`approve-contributor.yml#L27-L60`

- [`.github/workflows/approve-contributor.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/approve-contributor.yml) — text: `const APPROVED_FILE = '.github/APPROVED_CONTRIBUTORS'; const VALID_CAPABILITIES = new Set(［'issue', 'pr'］); const issueA`，提示行 27

  ```text
  const APPROVED_FILE = '.github/APPROVED_CONTRIBUTORS'; const VALID_CAPABILITIES = new Set(['issue', 'pr']); const issueAuthor = context.payload.issue.user.login; const commenter = context.payload.comment.user.login; const commentBody = (context.payload.comment.body || '').trim(); const approvalAtStartPattern = /^[\s.]*(?:@[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?(?:\s*,\s*|[.:]\s*|\s+))*(lgtmi|lgtm)(?=$|[\s]|[^\p{L}\p{N}_\s])/iu; const approvalAtEndPattern = /(?:^|[\s.])(lgtmi|lgtm)\s*(?:[^\p{L}\p{N}_\s])?\s*$/iu; const approvalMatch = commentBody.match(approvalAtStartPattern) ?? commentBody.match(approvalAtEndPattern); if (!approvalMatch) { console.log('Comment does not start or end with lgtm or lgtmi'); core.setOutput('status', 'skipped'); return; } const targetCapability = approvalMatch[1].toLowerCase() === 'lgtmi' ? 'issue' : 'pr'; try { const { data: permissionLevel } = await github.rest.repos.getCollaboratorPermissionLevel({ owner: context.repo.owner, repo: context.repo.repo, username: commenter, }); if (!['admin', 'maintain', 'write'].includes(permissionLevel.permission)) { console.log(`${commenter} does not have write access`); core.setOutput('status', 'skipped'); return; } } catch { console.log(`${commenter} does not have collaborator access`); core.setOutput('status', 'skipped'); return;
  ```

核验：`v1.4.0`

### E039

证据：`approve-contributor.yml#L133-L183`

- [`.github/workflows/approve-contributor.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/approve-contributor.yml) — text: `const content = fs.readFileSync(APPROVED_FILE, 'utf8'); const { entries, users } = parseApprovedUsers(content); const me`，提示行 133

  ```text
  const content = fs.readFileSync(APPROVED_FILE, 'utf8'); const { entries, users } = parseApprovedUsers(content); const mentionedUsers = parseMentionedUsers(commentBody); const approvalTargets = mentionedUsers.length > 0 ? mentionedUsers : [issueAuthor]; const changedTargets = []; const alreadyTargets = []; for (const username of approvalTargets) { const normalizedUser = username.toLowerCase(); const existingEntry = users.get(normalizedUser); const existingCapability = existingEntry?.capability ?? null; if (existingCapability === 'pr' || existingCapability === targetCapability) { alreadyTargets.push(existingEntry?.username ?? username); console.log(`${username} is already approved for ${existingCapability}`); continue; } if (existingEntry) { existingEntry.capability = targetCapability; changedTargets.push(existingEntry.username); } else { const entry = { type: 'user', username, normalizedUser, capability: targetCapability }; entries.push(entry); users.set(normalizedUser, entry); changedTargets.push(username); } console.log(`Set ${username} capability to ${targetCapability}`); } core.setOutput('capability', targetCapability); core.setOutput('changed_targets', JSON.stringify(changedTargets)); core.setOutput('already_targets', JSON.stringify(alreadyTargets)); if (changedTargets.length === 0) { core.setOutput('status', 'already'); return; } fs.writeFileSync(APPROVED_FILE, stringifyApprovedUsers(entries)); core.setOutput('status', 'changed'); - name: Commit and push if: steps.update.outputs.status == 'changed' run: | git config user.name "github-actions[bot]" git config user.email "github-actions[bot]@users.noreply.github.com" git add .github/APPROVED_CONTRIBUTORS git diff --staged --quiet || git commit -m "chore: approve contributors from issue #${{ github.event.issue.number }}" git push
  ```

核验：`v1.4.0`

### E040

证据：`issue-gate.yml#L43-L55`

- [`.github/workflows/issue-gate.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/issue-gate.yml) — text: `async function getTextFile(path) { const { data: fileContent } = await github.rest.repos.getContent({ owner: context.rep`，提示行 43

  ```text
  async function getTextFile(path) { const { data: fileContent } = await github.rest.repos.getContent({ owner: context.repo.owner, repo: context.repo.repo, path, ref: defaultBranch, }); if (!('content' in fileContent) || typeof fileContent.content !== 'string') { throw new Error(`Expected file content for ${path}`); } return Buffer.from(fileContent.content, 'base64').toString('utf8');
  ```

核验：`v1.4.0`

### E041

证据：`pr-gate.yml#L44-L56`

- [`.github/workflows/pr-gate.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/pr-gate.yml) — text: `async function getTextFile(path) { const { data: fileContent } = await github.rest.repos.getContent({ owner: context.rep`，提示行 44

  ```text
  async function getTextFile(path) { const { data: fileContent } = await github.rest.repos.getContent({ owner: context.repo.owner, repo: context.repo.repo, path, ref: defaultBranch, }); if (!('content' in fileContent) || typeof fileContent.content !== 'string') { throw new Error(`Expected file content for ${path}`); } return Buffer.from(fileContent.content, 'base64').toString('utf8');
  ```

核验：`v1.4.0`

### E042

证据：`AGENTS.md#L15-L28`

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — text: `## Code Quality - Read files in full before wide-ranging changes, before editing files you have not fully inspected, and`，提示行 15

  ```text
  ## Code Quality - Read files in full before wide-ranging changes, before editing files you have not fully inspected, and when asked to investigate or audit. Do not rely on search snippets for broad changes. - No `any` unless absolutely necessary. - Inline single-line helpers that have only one call site. - Check node_modules for external API types; don't guess. - **No inline imports** (`await import()`, `import("pkg").Type`, dynamic type imports). Top-level imports only. - In `packages/coding-agent`, resolve package assets through helpers in `src/config.ts`. Do not use `__dirname` directly; the helpers account for source checkouts, npm installations, and standalone binaries. - Never remove or downgrade code to fix type errors from outdated deps; upgrade the dep instead. - Use only erasable TypeScript syntax (Node strip-only mode) in code checked by the root config (`packages/*/src`, `packages/*/test`, `packages/coding-agent/examples`): no parameter properties, `enum`, `namespace`/`module`, `import =`, `export =`, or other constructs needing JS emit. Use explicit fields with constructor assignments. - Always ask before removing functionality or code that appears intentional. - Do not preserve backward compatibility unless the user asks for it. - Never hardcode key checks (e.g. `matchesKey(keyData, "ctrl+x")`). Add defaults to `DEFAULT_EDITOR_KEYBINDINGS` or `DEFAULT_APP_KEYBINDINGS` so they stay configurable. - Never modify `packages/ai/src/models.generated.ts` directly; update `packages/ai/scripts/generate-models.ts` instead, then regenerate. Including the resulting `models.generated.ts` diff is always OK, even if regeneration includes unrelated upstream model metadata changes. The generated model data in `packages/ai/src/providers/data/` is gitignored: never stage it, and don't look for it in git history.
  ```

核验：`v1.4.0`

### E043

证据：`AGENTS.md#L30-L41`

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — text: `## Commands - After code changes (not docs): `npm run check` (full output, no tail). Fix all errors, warnings, and infos`，提示行 30

  ```text
  ## Commands - After code changes (not docs): `npm run check` (full output, no tail). Fix all errors, warnings, and infos before committing. Does not run tests. - Never run `npm run build` or `npm test` unless requested by the user. - Never run the full vitest suite directly: it includes e2e tests that activate when endpoint/auth env vars are present. For all non-e2e tests, run `./test.sh` from the repo root. Otherwise run specific tests from the package root: - Vitest: `node "$(git rev-parse --show-toplevel)/node_modules/vitest/dist/cli.js" --run test/specific.test.ts` - `packages/tui` (`node:test`): `node --test test/specific.test.ts` - If you create or modify a test file, run it and iterate on test or implementation until it passes. - For `packages/coding-agent/test/suite/`, use `test/suite/harness.ts` + the faux provider. No real provider APIs, keys, or paid tokens. - When regressions tests for fixing a github issue, add a comment with the github issue number next to the test. - For ad-hoc scripts, `write` them to a temp file (e.g. `/tmp`), run, edit if needed, remove when done. Don't embed multi-line scripts in `bash` commands. - Never commit unless the user asks.
  ```

核验：`v1.4.0`

### E044

证据：`AGENTS.md#L43-L50`

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — text: `## Dependency and Install Security - Treat npm dep and lockfile changes as reviewed code. Direct registry deps, includin`，提示行 43

  ```text
  ## Dependency and Install Security - Treat npm dep and lockfile changes as reviewed code. Direct registry deps, including internal workspace deps, stay pinned to exact versions. - When updating `undici`, you MUST read its changelog/release notes for the target version and evaluate whether any changes may affect functionality before applying the update. - Hydrate/update locally with `npm install --ignore-scripts`; clean/CI-style with `npm ci --ignore-scripts`. Don't run lifecycle scripts unless the user asks. - If dep metadata changes, refresh `package-lock.json` with `npm install --package-lock-only --ignore-scripts`. - If `packages/coding-agent/install-lock/` needs regen, run `node scripts/generate-coding-agent-install-lock.mjs` (verify with `--check` or `npm run check`). New deps with lifecycle scripts require review and an explicit allowlist entry in that script; never add one silently. - Pre-commit blocks lockfile commits unless `PI_ALLOW_LOCKFILE_CHANGE=1`. Don't bypass unless the user wants the lockfile change committed.
  ```

核验：`v1.4.0`

### E045

证据：`package.json#L20-L27`

- [`package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/package.json) — text: `"build:native:win32": "npm --prefix packages/tui run build:native:win32", "check": "node scripts/biome-check.mjs --write`，提示行 20

  ```text
  "build:native:win32": "npm --prefix packages/tui run build:native:win32", "check": "node scripts/biome-check.mjs --write && npm run check:pinned-deps && npm run check:runtime-deps && npm run check:ts-imports && npm run check:entry-graphs && npm run check:install-lock:coding-agent && tsc --noEmit && npm run check:browser-smoke", "check:browser-smoke": "node scripts/check-browser-smoke.mjs", "check:pinned-deps": "node scripts/check-pinned-deps.mjs", "check:runtime-deps": "node scripts/check-runtime-deps.mjs", "check:package-install": "node scripts/check-package-install.mjs", "check:install-lock:coding-agent": "node scripts/generate-coding-agent-install-lock.mjs --check", "check:ts-imports": "node scripts/check-ts-relative-imports.mjs",
  ```

核验：`v1.4.0`

### E046

证据：`scripts/check-pinned-deps.mjs#L4-L7`

- [`scripts/check-pinned-deps.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-pinned-deps.mjs) — text: `const dependencySections = ［"dependencies", "devDependencies", "optionalDependencies"］; const exactVersionPattern = /^(?`，提示行 4

  ```text
  const dependencySections = ["dependencies", "devDependencies", "optionalDependencies"]; const exactVersionPattern = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/; const ignoredDirectories = new Set([".git", "dist", "node_modules"]); const packageJsonFiles = [];
  ```

核验：`v1.4.0`

### E047

证据：`scripts/check-pinned-deps.mjs#L24-L34`

- [`scripts/check-pinned-deps.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-pinned-deps.mjs) — text: `function isNonRegistrySpecifier(specifier) { return /^(?:workspace:|file:|link:|portal:|git\+|github:|git:|https?:|ssh:|`，提示行 24

  ```text
  function isNonRegistrySpecifier(specifier) { return /^(?:workspace:|file:|link:|portal:|git\+|github:|git:|https?:|ssh:|git:\/\/)/.test(specifier); } function getVersionSpecifier(specifier) { if (!specifier.startsWith("npm:")) return specifier; const aliasTarget = specifier.slice("npm:".length); const versionSeparator = aliasTarget.lastIndexOf("@"); if (versionSeparator <= 0) return specifier; return aliasTarget.slice(versionSeparator + 1); }
  ```

核验：`v1.4.0`

### E048

证据：`scripts/check-pinned-deps.mjs#L40-L59`

- [`scripts/check-pinned-deps.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-pinned-deps.mjs) — text: `for (const file of packageJsonFiles.sort()) { const packageJson = JSON.parse(readFileSync(file, "utf8")); for (const sec`，提示行 40

  ```text
  for (const file of packageJsonFiles.sort()) { const packageJson = JSON.parse(readFileSync(file, "utf8")); for (const section of dependencySections) { const dependencies = packageJson[section]; if (!dependencies) continue; for (const [name, specifier] of Object.entries(dependencies)) { if (isNonRegistrySpecifier(specifier)) continue; if (exactVersionPattern.test(getVersionSpecifier(specifier))) continue; failures.push(`${file}: ${section}.${name} must be pinned, found ${specifier}`); } } } if (failures.length > 0) { console.error("Direct registry dependencies must use exact versions:"); for (const failure of failures) console.error(` ${failure}`); process.exit(1); }
  ```

核验：`v1.4.0`

### E049

证据：`scripts/check-runtime-deps.mjs#L26-L43`

- [`scripts/check-runtime-deps.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-runtime-deps.mjs) — text: `function checkSource(source, manifest) { const file = source.fileName; const declared = new Set(［ manifest.name, ...Obje`，提示行 26

  ```text
  function checkSource(source, manifest) { const file = source.fileName; const declared = new Set([ manifest.name, ...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.optionalDependencies ?? {}), ...Object.keys(manifest.peerDependencies ?? {}), ]); function checkSpecifier(node) { if (!node || !(isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node))) return; const specifier = node.text; // `cloudflare:` modules are built into the Workers runtime, like `node:` modules are into Node. if ( specifier.startsWith(".") || specifier.startsWith("/") || specifier.startsWith("cloudflare:") || isBuiltin(specifier)
  ```

核验：`v1.4.0`

### E050

证据：`scripts/check-runtime-deps.mjs#L45-L80`

- [`scripts/check-runtime-deps.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-runtime-deps.mjs) — text: `return; } const name = specifier.split("/").slice(0, specifier.startsWith("@") ? 2 : 1).join("/"); if (declared.has(name`，提示行 45

  ```text
  return; } const name = specifier.split("/").slice(0, specifier.startsWith("@") ? 2 : 1).join("/"); if (declared.has(name)) return; const { line } = source.getLineAndCharacterOfPosition(node.getStart(source)); failures.push(`${file}:${line + 1}: ${specifier} is not declared in ${manifest.name}'s runtime dependencies`); } function visit(node) { if (isImportDeclaration(node)) { const clause = node.importClause; const bindings = clause?.namedBindings; if ( !clause || (clause.phaseModifier !== SyntaxKind.TypeKeyword && (clause.name || !bindings || !isNamedImports(bindings) || bindings.elements.length === 0 || bindings.elements.some((element) => !element.isTypeOnly))) ) { checkSpecifier(node.moduleSpecifier); } } else if (isExportDeclaration(node) && !node.isTypeOnly) { const clause = node.exportClause; if ( !clause || !isNamedExports(clause) || clause.elements.length === 0 || clause.elements.some((element) => !element.isTypeOnly) ) { checkSpecifier(node.moduleSpecifier); } } else if ( isCallExpression(node) && (node.expression.kind === SyntaxKind.ImportKeyword ||
  ```

核验：`v1.4.0`

### E051

证据：`scripts/check-runtime-deps.mjs#L83-L123`

- [`scripts/check-runtime-deps.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-runtime-deps.mjs) — text: `) { checkSpecifier(node.arguments［0］); } node.forEachChild(visit); } visit(source); } const packages = getPublicWorkspac`，提示行 83

  ```text
  ) { checkSpecifier(node.arguments[0]); } node.forEachChild(visit); } visit(source); } const packages = getPublicWorkspacePackages() .map(({ directory }) => ({ directory, sourceDirectory: resolve(directory, "src") })) .filter(({ sourceDirectory }) => existsSync(sourceDirectory)) .map(({ directory, sourceDirectory }) => { const configPath = resolve(directory, "tsconfig.build.json"); return { sourceDirectory, manifest: JSON.parse(readFileSync(join(directory, "package.json"), "utf8")), configPath: existsSync(configPath) ? configPath : resolve(directory, fallbackConfigName), }; }); const fallbackConfigs = new Set( packages.map(({ configPath }) => configPath).filter((path) => path.endsWith(fallbackConfigName)), ); const api = new API({ cwd: process.cwd(), fs: { fileExists: (fileName) => (fallbackConfigs.has(resolve(fileName)) ? true : undefined), readFile: (fileName) => (fallbackConfigs.has(resolve(fileName)) ? fallbackConfig : undefined), }, }); try { const snapshot = api.updateSnapshot({ openProjects: packages.map(({ configPath }) => configPath) }); for (const { sourceDirectory, manifest, configPath } of packages) { const project = snapshot.getProject(configPath); const diagnostics = project.program.getConfigFileParsingDiagnostics(); if (diagnostics.length > 0) throw new Error(diagnostics.map((diagnostic) => diagnostic.text).join("\n")); const roots = new Set(project.rootFiles.map((file) => resolve(file))); for (const fileName of project.program.getSourceFileNames()) { if (fileName.endsWith(".d.ts") || fileName.endsWith(".json")) continue; const path = relative(sourceDirectory, resolve(fileName)); if (path.startsWith("..") || isAbsolute(path)) continue;
  ```

核验：`v1.4.0`

### E052

证据：`scripts/generate-coding-agent-install-lock.mjs#L278-L375`

- [`scripts/generate-coding-agent-install-lock.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/generate-coding-agent-install-lock.mjs) — text: `const errors = ［］; const rootEntry = installLock.packages［""］; const includedPackageNames = new Set(); const seenAllowed`，提示行 278

  ```text
  const errors = []; const rootEntry = installLock.packages[""]; const includedPackageNames = new Set(); const seenAllowedInstallScriptPackages = new Set(); if (installLock.lockfileVersion !== 3) { errors.push("package-lock.json must use lockfileVersion 3"); } if (installLock.name !== installerPackageJson.name) { errors.push(`lockfile name ${installLock.name} does not match package.json name ${installerPackageJson.name}`); } if (installLock.version !== installerPackageJson.version) { errors.push( `lockfile version ${installLock.version} does not match package.json version ${installerPackageJson.version}`, ); } if (JSON.stringify(rootEntry?.dependencies ?? {}) !== JSON.stringify(installerPackageJson.dependencies)) { errors.push("lockfile root dependencies do not match package.json dependencies"); } for (const [lockPath, entry] of Object.entries(installLock.packages)) { const packageName = packageNameFromLockPath(lockPath); if (packageName) { includedPackageNames.add(packageName); } if (entry.link) { errors.push(`${lockPath} is a link entry`); } if (typeof entry.resolved === "string" && /^(file:|link:|workspace:|\.\.?\/|\/)/.test(entry.resolved)) { errors.push(`${lockPath} has a local resolved value: ${entry.resolved}`); } if (entry.dev || entry.devOptional || entry.extraneous) { errors.push(`${lockPath || "root"} contains dev/extraneous metadata`); } if ( packageName !== undefined && (packageName.startsWith(internalPackagePrefix) || internalPackageNames.has(packageName)) && entry.version !== installerPackageJson.version ) { errors.push(`${lockPath} internal package version ${entry.version} does not match ${installerPackageJson.version}`); } if (entry.hasInstallScript) { if (!packageName || !entry.version) { errors.push(`${lockPath || "root"} has install scripts but no package name/version`); } else { const packageId = `${packageName}@${entry.version}`; if (allowedInstallScriptPackages.has(packageId)) { seenAllowedInstallScriptPackages.add(packageId); } else { errors.push( `${lockPath} has install scripts (${packageId}). Review it and add it to allowedInstallScriptPackages if intentional.`, ); } } } } for (const packageId of allowedInstallScriptPackages.keys()) { if (!seenAllowedInstallScriptPackages.has(packageId)) { errors.push(`allowed install-script package ${packageId} is no longer present; remove it from the allowlist`); } } for (const name of internalNames) { if (!includedPackageNames.has(name)) { errors.push(`internal dependency ${name} is missing`); } } for (const [lockPath, entry] of Object.entries(installLock.packages)) { for (const [dependencyName, dependencySpec] of Object.entries(packageDependencies(entry))) { let dependencyLockPath; try { dependencyLockPath = resolveExternalDependency(installLock.packages, dependencyName, lockPath); } catch { errors.push(`${lockPath || "root"} dependency ${dependencyName} is missing`); continue; } const dependencyEntry = installLock.packages[dependencyLockPath]; if (isExactVersionSpec(dependencySpec) && dependencyEntry.version !== dependencySpec) { errors.push( `${lockPath || "root"} dependency ${dependencyName}@${dependencySpec} resolves to ${dependencyEntry.version}`, ); } } } if (errors.length > 0) { throw new Error(`Generated installer lock failed validation:\n${errors.map((error) => ` - ${error}`).join("\n")}`); } } function generateInstallLock() { const rootLock = readJson(rootLockfilePath); if (rootLock.lockfileVersion !== 3 || !rootLock.packages) { throw new Error("package-lock.json must be lockfileVersion 3 and contain a packages map"); }
  ```

核验：`v1.4.0`

### E053

证据：`scripts/generate-coding-agent-install-lock.mjs#L429-L447`

- [`scripts/generate-coding-agent-install-lock.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/generate-coding-agent-install-lock.mjs) — text: `console.error("packages/coding-agent/install-lock is missing generated files."); console.error("Run: npm run install-loc`，提示行 429

  ```text
  console.error("packages/coding-agent/install-lock is missing generated files."); console.error("Run: npm run install-lock:coding-agent"); process.exit(1); } const currentPackageJson = readFileSync(outputPackageJsonPath, "utf8"); const currentLockfile = readFileSync(outputLockfilePath, "utf8"); if (currentPackageJson !== packageJsonContent || currentLockfile !== lockfileContent) { console.error("packages/coding-agent/install-lock is out of date."); console.error("Run: npm run install-lock:coding-agent"); process.exit(1); } console.log("packages/coding-agent/install-lock is up to date."); } else { mkdirSync(outputDir, { recursive: true }); writeFileSync(outputPackageJsonPath, packageJsonContent); writeFileSync(outputLockfilePath, lockfileContent); const packageCount = Object.keys(installLock.packages).length - 1; const platformPackageCount = Object.values(installLock.packages).filter((entry) => entry.os || entry.cpu || entry.libc) .length;
  ```

核验：`v1.4.0`

### E054

证据：`.husky/pre-commit#L3-L17`

- [`.husky/pre-commit`](https://github.com/earendil-works/pi/blob/v1.4.0/.husky/pre-commit) — text: `# Get list of staged files before running check STAGED_FILES=$(git diff --cached --name-only) node scripts/check-lockfil`，提示行 3

  ```text
  # Get list of staged files before running check STAGED_FILES=$(git diff --cached --name-only) node scripts/check-lockfile-commit.mjs if [ $? -ne 0 ]; then exit 1 fi # Run the check script (formatting, linting, and type checking) echo "Running formatting, linting, and type checking..." npm run check if [ $? -ne 0 ]; then echo "❌ Checks failed. Please fix the errors before committing." exit 1 fi
  ```

核验：`v1.4.0`

### E055

证据：`.husky/pre-commit#L19-L35`

- [`.husky/pre-commit`](https://github.com/earendil-works/pi/blob/v1.4.0/.husky/pre-commit) — text: `# p2 has its own check (own biome.json, TypeScript 5.9; apps/ is outside the root Biome and tsc configs). # apps/ exists`，提示行 19

  ```text
  # p2 has its own check (own biome.json, TypeScript 5.9; apps/ is outside the root Biome and tsc configs). # apps/ exists only in pi-private. if [ -d apps/p2 ]; then for file in $STAGED_FILES; do case "$file" in apps/p2/*|packages/*|package.json|package-lock.json|tsconfig.json|tsconfig.base.json) echo "Checking apps/p2..." npm --prefix apps/p2 run check if [ $? -ne 0 ]; then echo "❌ apps/p2 checks failed." exit 1 fi break ;; esac done fi
  ```

核验：`v1.4.0`

### E056

证据：`scripts/check-lockfile-commit.mjs#L5-L6`

- [`scripts/check-lockfile-commit.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-lockfile-commit.mjs) — text: `const allowValue = process.env.PI_ALLOW_LOCKFILE_CHANGE; const allowed = allowValue === "1" || allowValue === "true" || `，提示行 5

  ```text
  const allowValue = process.env.PI_ALLOW_LOCKFILE_CHANGE; const allowed = allowValue === "1" || allowValue === "true" || allowValue === "yes";
  ```

核验：`v1.4.0`

### E057

证据：`scripts/check-lockfile-commit.mjs#L77-L103`

- [`scripts/check-lockfile-commit.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-lockfile-commit.mjs) — text: `const stagedFiles = git(［"diff", "--cached", "--name-only"］) .split("\n") .map((line) => line.trim()) .filter(Boolean); `，提示行 77

  ```text
  const stagedFiles = git(["diff", "--cached", "--name-only"]) .split("\n") .map((line) => line.trim()) .filter(Boolean); if (!stagedFiles.includes("package-lock.json")) { process.exit(0); } if (allowed) { console.error("package-lock.json is staged; PI_ALLOW_LOCKFILE_CHANGE is set, allowing commit."); process.exit(0); } const changes = getLockfilePackageChanges(); if (changes && hasOnlyWorkspacePackageChanges(changes)) { console.error("package-lock.json only updates workspace package metadata; allowing commit."); process.exit(0); } console.error("package-lock.json is staged."); console.error(""); console.error("Review lockfile changes before committing:"); console.error(" - confirm every new/updated package is intentional"); console.error(" - confirm npm age gates were active for resolution"); console.error(" - review any new lifecycle scripts in the dependency tree"); console.error(" - regenerate/check coding-agent install lock if release deps changed");
  ```

核验：`v1.4.0`

### E058

证据：`scripts/check-lockfile-commit.mjs#L117-L120`

- [`scripts/check-lockfile-commit.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-lockfile-commit.mjs) — text: `console.error(""); console.error("If this lockfile change is intentional, commit with:"); console.error(" PI_ALLOW_LOCKF`，提示行 117

  ```text
  console.error(""); console.error("If this lockfile change is intentional, commit with:"); console.error(" PI_ALLOW_LOCKFILE_CHANGE=1 git commit ..."); process.exit(1);
  ```

核验：`v1.4.0`

### E059

证据：`ci.yml#L32-L45`

- [`.github/workflows/ci.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/ci.yml) — text: `- name: Install dependencies run: npm ci --ignore-scripts - name: Build run: npm run build - name: Check run: npm run ch`，提示行 32

  ```text
  - name: Install dependencies run: npm ci --ignore-scripts - name: Build run: npm run build - name: Check run: npm run check - name: Build the pi-env daemon run: npm run build:daemon --workspace packages/env - name: Test run: npm test
  ```

核验：`v1.4.0`

### E060

证据：`ci.yml#L3-L7`

- [`.github/workflows/ci.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/ci.yml) — text: `on: push: branches: ［main］ pull_request: branches: ［main］`，提示行 3

  ```text
  on: push: branches: [main] pull_request: branches: [main]
  ```

核验：`v1.4.0`

### E061

证据：`ci.yml#L14-L45`

- [`.github/workflows/ci.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/ci.yml) — text: `build-check-test: runs-on: ubuntu-latest steps: - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da76410c1812`，提示行 14

  ```text
  build-check-test: runs-on: ubuntu-latest steps: - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1 - name: Setup Node.js uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0 with: node-version: 22 cache: npm - name: Install system dependencies run: | sudo apt-get update sudo apt-get install -y libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev fd-find ripgrep sudo ln -s $(which fdfind) /usr/local/bin/fd - name: Install dependencies run: npm ci --ignore-scripts - name: Build run: npm run build - name: Check run: npm run check - name: Build the pi-env daemon run: npm run build:daemon --workspace packages/env - name: Test run: npm test
  ```

核验：`v1.4.0`

### E062

证据：`package.json#L38-L40`

- [`package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/package.json) — text: `"profile:tui": "node scripts/profile-coding-agent-node.mjs --mode tui", "profile:rpc": "node scripts/profile-coding-agen`，提示行 38

  ```text
  "profile:tui": "node scripts/profile-coding-agent-node.mjs --mode tui", "profile:rpc": "node scripts/profile-coding-agent-node.mjs --mode rpc", "test": "npm run test:scripts && npm run test --workspaces --if-present",
  ```

核验：`v1.4.0`

### E063

证据：`packages/agent/package.json#L19-L23`

- [`packages/agent/package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/agent/package.json) — text: `"scripts": { "clean": "shx rm -rf dist", "build": "tsc -p tsconfig.build.json", "test": "vitest --run", "prepublishOnly"`，提示行 19

  ```text
  "scripts": { "clean": "shx rm -rf dist", "build": "tsc -p tsconfig.build.json", "test": "vitest --run", "prepublishOnly": "npm run build"
  ```

核验：`v1.4.0`

### E064

证据：`packages/coding-agent/package.json#L39-L47`

- [`packages/coding-agent/package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/package.json) — text: `"generate:schemas": "node --import ./src/experimental/source-resolver.ts scripts/generate-schemas.ts", "generate:referen`，提示行 39

  ```text
  "generate:schemas": "node --import ./src/experimental/source-resolver.ts scripts/generate-schemas.ts", "generate:references": "node --import ./src/experimental/source-resolver.ts scripts/generate-references.ts", "prepublishOnly": "npm run clean && npm run build" }, "dependencies": { "@earendil-works/pi-agent-core": "1.4.0", "@earendil-works/pi-ai": "1.4.0", "@earendil-works/pi-codemode": "1.4.0", "@earendil-works/pi-mcp": "1.4.0",
  ```

核验：`v1.4.0`

### E065

证据：`packages/tui/package.json#L7-L14`

- [`packages/tui/package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/tui/package.json) — text: `"scripts": { "clean": "shx rm -rf dist", "build": "tsc -p tsconfig.build.json", "build:native:darwin": "native/darwin/bu`，提示行 7

  ```text
  "scripts": { "clean": "shx rm -rf dist", "build": "tsc -p tsconfig.build.json", "build:native:darwin": "native/darwin/build.sh", "build:native:linux": "native/linux/build.sh", "build:native:win32": "node native/win32/build.mjs", "test": "node --test --test-reporter=dot --test-reporter-destination=stdout test/*.test.ts", "prepublishOnly": "npm run clean && npm run build"
  ```

核验：`v1.4.0`

### E066

证据：`ci.yml#L47-L65`

- [`.github/workflows/ci.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/ci.yml) — text: `mcp-conformance: runs-on: ubuntu-latest steps: - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da76410c18127`，提示行 47

  ```text
  mcp-conformance: runs-on: ubuntu-latest steps: - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1 - name: Setup Node.js uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0 with: node-version: 22 cache: npm - name: Install dependencies run: npm ci --ignore-scripts # Runs pi's MCP client from source against the pinned official conformance suite and fails on # regressions against packages/coding-agent/test/mcp-conformance/baseline.json. - name: MCP client conformance run: npm run test:mcp-conformance
  ```

核验：`v1.4.0`

### E067

证据：`test.sh#L4-L37`

- [`test.sh`](https://github.com/earendil-works/pi/blob/v1.4.0/test.sh) — text: `# Isolate user resources, credentials, temporary files, and tool configuration. temp_parent="${TMPDIR:-/tmp}" temp_paren`，提示行 4

  ```text
  # Isolate user resources, credentials, temporary files, and tool configuration. temp_parent="${TMPDIR:-/tmp}" temp_parent="${temp_parent%/}" test_root="$(mktemp -d "$temp_parent/pi-test.XXXXXX")" git_askpass="$(type -P false)" readonly temp_parent test_root git_askpass mkdir -p "$test_root/home/.config" "$test_root/tmp" "$test_root/cache/npm" # Mark the generated root so cleanup can verify ownership before deleting it. touch "$test_root/.pi-test-owned" "$test_root/npm-userconfig" "$test_root/npm-globalconfig" # Only remove the marked directory created above, never an unverified path. cleanup() { local status=$? trap - EXIT case "$test_root" in "$temp_parent"/pi-test.*) if [[ -d "$test_root" && ! -L "$test_root" && -f "$test_root/.pi-test-owned" ]]; then rm -rf -- "$test_root" else printf "Refusing to remove unverified test directory: %s\n" "$test_root" >&2 [[ $status -ne 0 ]] || status=1 fi ;; *) printf "Refusing to remove unexpected test directory: %s\n" "$test_root" >&2 [[ $status -ne 0 ]] || status=1 ;; esac exit "$status" } trap cleanup EXIT
  ```

核验：`v1.4.0`

### E068

证据：`test.sh#L39-L64`

- [`test.sh`](https://github.com/earendil-works/pi/blob/v1.4.0/test.sh) — text: `# Start from an empty environment and allow only required platform and test settings. test_env=( "PATH=$PATH" "PWD=$PWD"`，提示行 39

  ```text
  # Start from an empty environment and allow only required platform and test settings. test_env=( "PATH=$PATH" "PWD=$PWD" "HOME=$test_root/home" "USERPROFILE=$test_root/home" "TMPDIR=$test_root/tmp" "TMP=$test_root/tmp" "TEMP=$test_root/tmp" "XDG_CONFIG_HOME=$test_root/home/.config" "XDG_CACHE_HOME=$test_root/cache" "LANG=C" "LC_ALL=C" "TZ=UTC" "GIT_CONFIG_NOSYSTEM=1" "GIT_CONFIG_GLOBAL=/dev/null" "GIT_TERMINAL_PROMPT=0" "GIT_ASKPASS=$git_askpass" "GIT_EDITOR=true" "GIT_SEQUENCE_EDITOR=true" "NPM_CONFIG_USERCONFIG=$test_root/npm-userconfig" "NPM_CONFIG_GLOBALCONFIG=$test_root/npm-globalconfig" "NPM_CONFIG_CACHE=$test_root/cache/npm" "PI_NO_LOCAL_LLM=1" "AWS_EC2_METADATA_DISABLED=true" ) # Native Windows needs these inherited values to launch child processes. for name in SystemRoot SYSTEMROOT WINDIR COMSPEC PATHEXT; do value="${!name-}" [[ -z "$value" ]] || test_env+=("$name=$value") done # Trust extra certificates of proxies that inspect HTTPS (corporate proxies, sandboxes). # Network tests fail with self-signed certificate errors without it. value="${NODE_EXTRA_CA_CERTS-}" [[ -z "$value" ]] || test_env+=("NODE_EXTRA_CA_CERTS=$value") # Preserve CI detection only for runner behavior and test reporting. for name in CI GITHUB_ACTIONS; do value="${!name-}"
  ```

核验：`v1.4.0`

### E069

证据：`env.yml#L6-L13`

- [`.github/workflows/env.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/env.yml) — text: `on: push: branches: ［main, "durable-env-*"］ paths: ［"packages/durable/src/env/**", "packages/durable/src/tools/**", "pac`，提示行 6

  ```text
  on: push: branches: [main, "durable-env-*"] paths: ["packages/durable/src/env/**", "packages/durable/src/tools/**", "packages/durable/test/env-*", "packages/env/**", ".github/workflows/env.yml", ".github/workflows/env-daemons.yml"] pull_request: branches: [main] paths: ["packages/durable/src/env/**", "packages/durable/src/tools/**", "packages/durable/test/env-*", "packages/env/**", ".github/workflows/env.yml", ".github/workflows/env-daemons.yml"] workflow_dispatch:
  ```

核验：`v1.4.0`

### E070

证据：`env.yml#L25-L72`

- [`.github/workflows/env.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/env.yml) — text: `check: needs: daemons runs-on: ubuntu-latest steps: - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da76410c`，提示行 25

  ```text
  check: needs: daemons runs-on: ubuntu-latest steps: - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1 - name: Setup Node.js uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0 with: node-version: 22 cache: npm - name: Install system dependencies run: | sudo apt-get update sudo apt-get install -y libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev fd-find ripgrep sudo ln -s $(which fdfind) /usr/local/bin/fd - name: Install dependencies run: npm ci --ignore-scripts - name: Build run: npm run build - name: Check run: npm run check - name: Download the pi-env daemons uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4.3.0 with: pattern: pi-env-* path: packages/env/bin - name: Check the pi-env package contents working-directory: packages/env run: | npm pack --dry-run --json > "$RUNNER_TEMP/pack.json" node -e ' const files = new Set(JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8"))[0].files.map((file) => file.path)); const expected = ["dist/index.js", "dist/index.d.ts", "dist/ssh.js", "README.md", "CHANGELOG.md", "docs/protocol.md"]; for (const name of ["linux-x64", "linux-arm64", "android-arm64", "android-x64", "darwin-arm64", "darwin-x64"]) expected.push(`bin/pi-env-${name}/pi-env`); for (const name of ["windows-x64", "windows-arm64"]) expected.push(`bin/pi-env-${name}/pi-env.exe`); const missing = expected.filter((file) => !files.has(file)); const unexpected = [...files].filter((file) => file.startsWith("src/") || file.startsWith("daemon/") || file.startsWith("test/")); if (missing.length || unexpected.length) { console.error({ missing, unexpected }); process.exit(1); } console.log(`${files.size} files`); ' "$RUNNER_TEMP/pack.json"
  ```

核验：`v1.4.0`

### E071

证据：`env.yml#L74-L127`

- [`.github/workflows/env.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/env.yml) — text: `# The pi-env tests against each release build of the daemon, as the npm package ships it. release-daemons: needs: daemon`，提示行 74

  ```text
  # The pi-env tests against each release build of the daemon, as the npm package ships it. release-daemons: needs: daemons strategy: fail-fast: false matrix: include: - { os: ubuntu-latest, name: linux-x64 } - { os: ubuntu-24.04-arm, name: linux-arm64 } - { os: macos-latest, name: darwin-arm64 } # Under Rosetta on the Apple silicon runner. - { os: macos-latest, name: darwin-x64 } - { os: windows-latest, name: windows-x64 } - { os: windows-11-arm, name: windows-arm64 } runs-on: ${{ matrix.os }} defaults: run: shell: bash steps: - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1 - name: Setup Node.js uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0 with: node-version: 22 cache: npm - name: Install dependencies run: npm ci --ignore-scripts - name: Install an SSH server for the bootstrap tests if: runner.os == 'Linux' run: command -v sshd || test -x /usr/sbin/sshd || (sudo apt-get update && sudo apt-get install -y openssh-server) - name: Install Rosetta if: matrix.name == 'darwin-x64' run: softwareupdate --install-rosetta --agree-to-license - name: Download the daemon uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4.3.0 with: name: pi-env-${{ matrix.name }} path: ${{ runner.temp }}/daemon - name: pi-env tests working-directory: packages/env run: | daemon="$RUNNER_TEMP/daemon/pi-env" case "${{ matrix.name }}" in windows-*) daemon="$daemon.exe" ;; esac chmod +x "$daemon" file "$daemon" || true PI_ENV_DAEMON="$daemon" npx vitest --run
  ```

核验：`v1.4.0`

### E072

证据：`env.yml#L128-L200`

- [`.github/workflows/env.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/env.yml) — text: `tests: strategy: fail-fast: false matrix: os: ［ubuntu-latest, ubuntu-24.04-arm, macos-latest, windows-latest, windows-11`，提示行 128

  ```text
  tests: strategy: fail-fast: false matrix: os: [ubuntu-latest, ubuntu-24.04-arm, macos-latest, windows-latest, windows-11-arm] runs-on: ${{ matrix.os }} defaults: run: shell: bash steps: - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1 - name: Setup Node.js uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0 with: node-version: 22 cache: npm - name: Install dependencies run: npm ci --ignore-scripts - name: Install an SSH server for the bootstrap tests if: runner.os == 'Linux' run: command -v sshd || test -x /usr/sbin/sshd || (sudo apt-get update && sudo apt-get install -y openssh-server) - name: Daemon format, lint and unit tests working-directory: packages/env/daemon run: | cargo fmt --check cargo clippy --locked --all-targets -- -D warnings cargo test --locked - name: Build the daemon working-directory: packages/env run: npm run build:daemon - name: Durable env tests working-directory: packages/durable run: npx vitest --run test/env-node.test.ts test/env-node-spill.test.ts test/env-node-conformance.test.ts test/env-line-scan.test.ts test/tools.test.ts test/tools-read-differential.test.ts - name: pi-env tests working-directory: packages/env run: npx vitest --run - name: Start Windows' OpenSSH server if: matrix.os == 'windows-latest' shell: pwsh run: | if (-not (Get-Service sshd -ErrorAction SilentlyContinue)) { Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0 | Out-Null } Start-Service sshd $key = Join-Path $env:RUNNER_TEMP 'ssh_client_key' & "$env:WINDIR\System32\OpenSSH\ssh-keygen.exe" -q -t ed25519 -N '' -f $key icacls $key /inheritance:r /grant "${env:USERNAME}:F" | Out-Null # The runner's user is an administrator; sshd reads administrators' keys from ProgramData. $authorized = "$env:ProgramData\ssh\administrators_authorized_keys" Get-Content "$key.pub" | Set-Content -Path $authorized -Encoding ascii icacls $authorized /inheritance:r /grant "Administrators:F" /grant "SYSTEM:F" | Out-Null - name: pi-env tests over Windows' OpenSSH, with cmd.exe and then PowerShell as its default shell if: matrix.os == 'windows-latest' working-directory: packages/env env: PI_ENV_SSH_HOST: 127.0.0.1 PI_ENV_SSH_KEY: ${{ runner.temp }}\ssh_client_key run: | export PI_ENV_SSH_USER="$USERNAME" export PI_ENV_SSH_PROGRAM="$WINDIR\System32\OpenSSH\ssh.exe" npx vitest --run test/ssh-external.test.ts powershell -NoProfile -Command "New-ItemProperty -Path 'HKLM:\SOFTWARE\OpenSSH' -Name DefaultShell -Value 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' -PropertyType String -Force | Out-Null" PI_ENV_SSH_SHELL=powershell npx vitest --run test/ssh-external.test.ts
  ```

核验：`v1.4.0`

### E073

证据：`nix.yml#L15-L40`

- [`.github/workflows/nix.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/nix.yml) — text: `on: push: tags: - 'v*.*.*' pull_request: branches: ［main］ paths: - '.github/workflows/nix.yml' - 'flake.lock' - 'flake.n`，提示行 15

  ```text
  on: push: tags: - 'v*.*.*' pull_request: branches: [main] paths: - '.github/workflows/nix.yml' - 'flake.lock' - 'flake.nix' - 'nix/**' - 'package-lock.json' - 'packages/*/package.json' - 'packages/coding-agent/install-lock/**' - 'packages/ai/scripts/hydrate-model-catalog.ts' - 'scripts/update-model-catalog-pin.mjs' workflow_run: workflows: - Publish Model Catalog types: - completed # Catches packaging drift from changes pushed to main without a pull request. schedule: - cron: '43 5 * * *' workflow_dispatch:
  ```

核验：`v1.4.0`

### E074

证据：`nix.yml#L120-L151`

- [`.github/workflows/nix.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/nix.yml) — text: `- name: Evaluate all systems if: ${{ matrix.system == 'x86_64-linux' }} run: nix flake check --all-systems --no-build - `，提示行 120

  ```text
  - name: Evaluate all systems if: ${{ matrix.system == 'x86_64-linux' }} run: nix flake check --all-systems --no-build - name: Build run: nix build -L . - name: Smoke-test run: | ./result/bin/pi --version ./result/bin/pi --help > /dev/null if [[ "${GITHUB_REF_TYPE}" == "tag" ]]; then test "$(./result/bin/pi --version)" = "${GITHUB_REF_NAME#v}" fi update-stable: needs: build if: ${{ github.ref_type == 'tag' }} runs-on: ubuntu-latest permissions: contents: write steps: # Full history, so git can verify that the push to stable is a fast-forward. - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1 with: fetch-depth: 0 # Without --force, the push fails unless it is a fast-forward, so stable # never moves back to an older release. - name: Fast-forward stable to the release
  ```

核验：`v1.4.0`

### E075

证据：`npm-audit.yml#L3-L6`

- [`.github/workflows/npm-audit.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/npm-audit.yml) — text: `on: schedule: - cron: '37 7 * * *' workflow_dispatch:`，提示行 3

  ```text
  on: schedule: - cron: '37 7 * * *' workflow_dispatch:
  ```

核验：`v1.4.0`

### E076

证据：`npm-audit.yml#L24-L31`

- [`.github/workflows/npm-audit.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/npm-audit.yml) — text: `- name: Install dependencies without lifecycle scripts run: npm ci --ignore-scripts --no-audit --no-fund - name: Audit p`，提示行 24

  ```text
  - name: Install dependencies without lifecycle scripts run: npm ci --ignore-scripts --no-audit --no-fund - name: Audit production vulnerabilities run: node scripts/npm-audit.mjs - name: Verify registry signatures run: npm audit signatures --omit=dev
  ```

核验：`v1.4.0`

### E077

证据：`scripts/npm-audit.mjs#L9-L21`

- [`scripts/npm-audit.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/npm-audit.mjs) — text: `const auditLevel = "moderate"; const severities = ［"info", "low", "moderate", "high", "critical"］; /** @type {Record<str`，提示行 9

  ```text
  const auditLevel = "moderate"; const severities = ["info", "low", "moderate", "high", "critical"]; /** @type {Record<string, { package: string; reason: string }>} */ const acceptedAdvisories = { "GHSA-86w9-cpqp-85rv": { package: "node-forge", reason: "No fixed node-forge release exists. It is only reachable through @earendil-works/gondolin in the private, " + "unpublished gondolin example extension. Gondolin only verifies leaf certificates against its own locally " + "generated CA (public exponent 65537), so the low-exponent signature forgery does not apply.", }, };
  ```

核验：`v1.4.0`

### E078

证据：`scripts/npm-audit.mjs#L43-L83`

- [`scripts/npm-audit.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/npm-audit.mjs) — text: `const minimumSeverity = severities.indexOf(auditLevel); const seenAccepted = new Set(); const failures = new Map(); for `，提示行 43

  ```text
  const minimumSeverity = severities.indexOf(auditLevel); const seenAccepted = new Set(); const failures = new Map(); for (const vulnerability of Object.values(report.vulnerabilities ?? {})) { for (const via of vulnerability.via) { // String entries point at another vulnerable package, which is reported on its own. if (typeof via === "string") { continue; } const id = via.url?.split("/").pop() ?? String(via.source); const accepted = acceptedAdvisories[id]; if (accepted && accepted.package === via.name) { seenAccepted.add(id); continue; } if (severities.indexOf(via.severity) >= minimumSeverity) { failures.set(`${id}:${via.name}`, via); } } } for (const id of seenAccepted) { console.log(`Accepted ${id} (${acceptedAdvisories[id].package}): ${acceptedAdvisories[id].reason}`); } for (const id of Object.keys(acceptedAdvisories)) { if (!seenAccepted.has(id)) { console.log(`::warning::Accepted advisory ${id} no longer matches; remove it from scripts/npm-audit.mjs.`); } } if (failures.size > 0) { console.error(`\nFound ${failures.size} unaccepted advisories at or above ${auditLevel}:`); for (const via of failures.values()) { console.error(`- ${via.name} ${via.range} [${via.severity}] ${via.title} ${via.url}`); } process.exit(1); } console.log(`No unaccepted advisories at or above ${auditLevel}.`);
  ```

核验：`v1.4.0`

### E079

证据：`packages/evals/README.md#L22-L35`

- [`packages/evals/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/evals/README.md) — text: `## Run evals Host evals (smoke, documentation audit) and documentation-lift evals need `PI_PROVIDER` and `PI_MODEL`. '''`，提示行 22

  ```text
  ## Run evals Host evals (smoke, documentation audit) and documentation-lift evals need `PI_PROVIDER` and `PI_MODEL`. '''bash PI_PROVIDER=openai-codex PI_MODEL=gpt-5.6-sol npm run eval -w packages/evals ''' That runs host evals, then the documentation comparison. Extra CLI flags after `--` go to `eval:docs` only. Host only: '''bash PI_PROVIDER=openai-codex PI_MODEL=gpt-5.6-sol npm run eval:host -w packages/evals
  ```

核验：`v1.4.0`

### E080

证据：`packages/evals/package.json#L6-L12`

- [`packages/evals/package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/evals/package.json) — text: `"scripts": { "clean": "shx rm -rf .eval", "eval": "npm run eval:host && npm run eval:docs --", "eval:host": "vitest run `，提示行 6

  ```text
  "scripts": { "clean": "shx rm -rf .eval", "eval": "npm run eval:host && npm run eval:docs --", "eval:host": "vitest run --config vitest.evals.config.ts --project host", "eval:docs": "node --experimental-strip-types src/cli.ts", "test": "vitest run --config vitest.test.config.ts" },
  ```

核验：`v1.4.0`

### E081

证据：`build-binaries.yml#L131-L208`

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `smoke-test-binaries: runs-on: ${{ matrix.runner }} needs: build strategy: fail-fast: false matrix: runner: - ubuntu-late`，提示行 131

  ```text
  smoke-test-binaries: runs-on: ${{ matrix.runner }} needs: build strategy: fail-fast: false matrix: runner: - ubuntu-latest - macos-latest - windows-latest permissions: actions: read env: RELEASE_TAG: ${{ github.event.inputs.tag || github.ref_name }} SOURCE_REF: ${{ github.event.inputs.source_ref || github.event.inputs.tag || github.ref_name }} steps: - name: Checkout smoke tests uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1 with: ref: ${{ env.SOURCE_REF }} persist-credentials: false - name: Download binary archives uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4.3.0 with: name: release-assets-${{ env.RELEASE_TAG }} path: release-assets - name: Extract current-platform binary id: binary shell: bash run: | set -euo pipefail runtime_platform="$(node -p '`${process.platform}-${process.arch}`')" case "${runtime_platform}" in darwin-arm64|darwin-x64|linux-arm64|linux-x64) platform="${runtime_platform}" archive="release-assets/pi-${platform}.tar.gz" root="extracted/pi" binary="${root}/pi" ;; win32-arm64) platform="windows-arm64" archive="release-assets/pi-${platform}.zip" root="extracted" binary="${root}/pi.exe" ;; win32-x64) platform="windows-x64" archive="release-assets/pi-${platform}.zip" root="extracted" binary="${root}/pi.exe" ;; *) echo "::error::Unsupported runner platform ${runtime_platform}" exit 1 ;; esac mkdir -p extracted if [[ "${archive}" == *.zip ]]; then export ARCHIVE_PATH="$(cygpath -w "${archive}")" export DESTINATION_PATH="$(cygpath -w extracted)" powershell.exe -NoProfile -NonInteractive -Command \ 'Expand-Archive -LiteralPath $env:ARCHIVE_PATH -DestinationPath $env:DESTINATION_PATH -Force' else tar -xf "${archive}" -C extracted fi echo "root=${root}" >> "${GITHUB_OUTPUT}" echo "binary=${binary}" >> "${GITHUB_OUTPUT}" - name: Smoke-test binary shell: bash run: | "${{ steps.binary.outputs.binary }}" --help "${{ steps.binary.outputs.binary }}" --version node scripts/smoke-test-codemode-binary.mjs "${{ steps.binary.outputs.binary }}"
  ```

核验：`v1.4.0`

### E082

证据：`scripts/check-pinned-deps.mjs#L25-L39`

- [`scripts/check-pinned-deps.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-pinned-deps.mjs) — text: `return /^(?:workspace:|file:|link:|portal:|git\+|github:|git:|https?:|ssh:|git:\/\/)/.test(specifier); } function getVer`，提示行 25

  ```text
  return /^(?:workspace:|file:|link:|portal:|git\+|github:|git:|https?:|ssh:|git:\/\/)/.test(specifier); } function getVersionSpecifier(specifier) { if (!specifier.startsWith("npm:")) return specifier; const aliasTarget = specifier.slice("npm:".length); const versionSeparator = aliasTarget.lastIndexOf("@"); if (versionSeparator <= 0) return specifier; return aliasTarget.slice(versionSeparator + 1); } const failures = []; collectPackageJsonFiles(".");
  ```

核验：`v1.4.0`

### E083

证据：`scripts/check-pinned-deps.mjs#L48-L56`

- [`scripts/check-pinned-deps.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-pinned-deps.mjs) — text: `if (isNonRegistrySpecifier(specifier)) continue; if (exactVersionPattern.test(getVersionSpecifier(specifier))) continue;`，提示行 48

  ```text
  if (isNonRegistrySpecifier(specifier)) continue; if (exactVersionPattern.test(getVersionSpecifier(specifier))) continue; failures.push(`${file}: ${section}.${name} must be pinned, found ${specifier}`); } } } if (failures.length > 0) { console.error("Direct registry dependencies must use exact versions:");
  ```

核验：`v1.4.0`

### E084

证据：`packages/coding-agent/package.json#L49-L72`

- [`packages/coding-agent/package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/package.json) — text: `"@silvia-odwyer/photon-node": "0.3.4", "brace-expansion": "5.0.12", "chalk": "6.0.0", "cross-spawn": "7.0.6", "diff": "8`，提示行 49

  ```text
  "@silvia-odwyer/photon-node": "0.3.4", "brace-expansion": "5.0.12", "chalk": "6.0.0", "cross-spawn": "7.0.6", "diff": "8.0.4", "grok-mermaid": "0.2.3", "highlight.js": "10.7.3", "hosted-git-info": "9.0.3", "ignore": "7.0.8", "jiti": "2.7.0", "minimatch": "10.2.6", "proper-lockfile": "4.1.2", "quickjs-wasi": "3.6.2", "semver": "7.8.5", "typebox": "1.3.27", "undici": "8.10.2", "yaml": "2.9.0" }, "overrides": { "protobufjs": "7.6.6" }, "devDependencies": { "@types/cross-spawn": "6.0.6", "@types/hosted-git-info": "3.0.5",
  ```

核验：`v1.4.0`

### E085

证据：`package-lock.json#L1-L6`

- [`package-lock.json`](https://github.com/earendil-works/pi/blob/v1.4.0/package-lock.json) — text: `{ "name": "pi-monorepo", "version": "0.0.3", "lockfileVersion": 3, "requires": true, "packages": {`，提示行 1

  ```text
  { "name": "pi-monorepo", "version": "0.0.3", "lockfileVersion": 3, "requires": true, "packages": {
  ```

核验：`v1.4.0`

### E086

证据：`package-lock.json#L31-L42`

- [`package-lock.json`](https://github.com/earendil-works/pi/blob/v1.4.0/package-lock.json) — text: `"engines": { "node": ">=22.19.0" } }, "node_modules/@anthropic-ai/sandbox-runtime": { "version": "0.0.26", "resolved": "`，提示行 31

  ```text
  "engines": { "node": ">=22.19.0" } }, "node_modules/@anthropic-ai/sandbox-runtime": { "version": "0.0.26", "resolved": "https://registry.npmjs.org/@anthropic-ai/sandbox-runtime/-/sandbox-runtime-0.0.26.tgz", "integrity": "sha512-DYV5LSsVMnzq0lbfaYMSpxZPUMAx4+hy343dRss+pVCLIfF62qOhxpYfZ5TmOk1GTDQm5f9wPprMNSStmnsV4w==", "license": "Apache-2.0", "dependencies": { "@pondwader/socks5-server": "^1.0.10", "@types/lodash-es": "^4.17.12",
  ```

核验：`v1.4.0`

### E087

证据：`ci.yml#L32-L34`

- [`.github/workflows/ci.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/ci.yml) — text: `- name: Install dependencies run: npm ci --ignore-scripts`，提示行 32

  ```text
  - name: Install dependencies run: npm ci --ignore-scripts
  ```

核验：`v1.4.0`

### E088

证据：`scripts/generate-coding-agent-install-lock.mjs#L84-L115`

- [`scripts/generate-coding-agent-install-lock.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/generate-coding-agent-install-lock.mjs) — text: `const copied = { ...entry }; delete copied.dev; delete copied.devOptional; delete copied.extraneous; delete copied.link;`，提示行 84

  ```text
  const copied = { ...entry }; delete copied.dev; delete copied.devOptional; delete copied.extraneous; delete copied.link; return sortedPackageEntry(copied); } function copyPackageJsonEntry(packageJson, options) { const entry = options.includeName ? { name: packageJson.name, version: packageJson.version } : { version: packageJson.version }; for (const field of [ "license", "dependencies", "optionalDependencies", "peerDependencies", "peerDependenciesMeta", "bin", "engines", "os", "cpu", "libc", ]) { if (packageJson[field] !== undefined) { entry[field] = packageJson[field]; } } return sortedPackageEntry(entry); }
  ```

核验：`v1.4.0`

### E089

证据：`scripts/generate-coding-agent-install-lock.mjs#L17-L21`

- [`scripts/generate-coding-agent-install-lock.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/generate-coding-agent-install-lock.mjs) — text: `const allowedInstallScriptPackages = new Map(［ ［"@google/genai@2.21.0", "preinstall is a no-op in the published package"`，提示行 17

  ```text
  const allowedInstallScriptPackages = new Map([ ["@google/genai@2.21.0", "preinstall is a no-op in the published package"], ["protobufjs@7.6.6", "postinstall only warns about protobufjs version scheme mismatches"], ]);
  ```

核验：`v1.4.0`

### E090

证据：`scripts/generate-coding-agent-install-lock.mjs#L320-L339`

- [`scripts/generate-coding-agent-install-lock.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/generate-coding-agent-install-lock.mjs) — text: `if (!packageName || !entry.version) { errors.push(`${lockPath || "root"} has install scripts but no package name/version`，提示行 320

  ```text
  if (!packageName || !entry.version) { errors.push(`${lockPath || "root"} has install scripts but no package name/version`); } else { const packageId = `${packageName}@${entry.version}`; if (allowedInstallScriptPackages.has(packageId)) { seenAllowedInstallScriptPackages.add(packageId); } else { errors.push( `${lockPath} has install scripts (${packageId}). Review it and add it to allowedInstallScriptPackages if intentional.`, ); } } } } for (const packageId of allowedInstallScriptPackages.keys()) { if (!seenAllowedInstallScriptPackages.has(packageId)) { errors.push(`allowed install-script package ${packageId} is no longer present; remove it from the allowlist`); } }
  ```

核验：`v1.4.0`

### E091

证据：`scripts/release.mjs#L251-L266`

- [`scripts/release.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/release.mjs) — text: `console.log(` Added ［Unreleased］ to ${changelog}`); } } // Main flow console.log("\n=== Release Script ===\n"); // 1. Ch`，提示行 251

  ```text
  console.log(` Added [Unreleased] to ${changelog}`); } } // Main flow console.log("\n=== Release Script ===\n"); // 1. Check for uncommitted changes console.log("Checking for uncommitted changes..."); const status = run("git status --porcelain", { silent: true }); if (status && status.trim()) { console.error("Error: Uncommitted changes detected. Commit or stash first."); console.error(status); process.exit(1); } console.log(" Working directory clean\n");
  ```

核验：`v1.4.0`

### E092

证据：`build-binaries.yml#L363-L376`

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `- name: Build run: npm run build - name: Check run: npm run check - name: Build the pi-env daemon for tests run: npm run`，提示行 363

  ```text
  - name: Build run: npm run build - name: Check run: npm run check - name: Build the pi-env daemon for tests run: npm run build:daemon --workspace packages/env - name: Test run: npm test - name: Smoke-test packed npm consumer run: npm run check:package-install
  ```

核验：`v1.4.0`

### E093

证据：`ci.yml#L35-L45`

- [`.github/workflows/ci.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/ci.yml) — text: `- name: Build run: npm run build - name: Check run: npm run check - name: Build the pi-env daemon run: npm run build:dae`，提示行 35

  ```text
  - name: Build run: npm run build - name: Check run: npm run check - name: Build the pi-env daemon run: npm run build:daemon --workspace packages/env - name: Test run: npm test
  ```

核验：`v1.4.0`

### E094

证据：`.pi/skills/release.md#L8-L16`

- [`.pi/skills/release.md`](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/skills/release.md) — text: `Run repository commands from the repo root (two directories above this skill), unless instructed otherwise. **Lockstep v`，提示行 8

  ```text
  Run repository commands from the repo root (two directories above this skill), unless instructed otherwise. **Lockstep versioning**: all packages share one version; every release updates all together. `patch` = fixes + additions, `minor` = breaking changes. No major releases. 1. **Update CHANGELOGs**: ask the user whether they ran the `/cl` prompt on the latest commit on `main`. If not, they must run `/cl` first to audit and update each package's `[Unreleased]` section before releasing. 2. **Local smoke test**: build an unpublished release and smoke test from outside the repo (so it can't resolve workspace files): '''bash npm run release:local -- --out /tmp/pi-local-release --force
  ```

核验：`v1.4.0`

### E095

证据：`.pi/skills/release.md#L14-L35`

- [`.pi/skills/release.md`](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/skills/release.md) — text: `2. **Local smoke test**: build an unpublished release and smoke test from outside the repo (so it can't resolve workspac`，提示行 14

  ```text
  2. **Local smoke test**: build an unpublished release and smoke test from outside the repo (so it can't resolve workspace files): '''bash npm run release:local -- --out /tmp/pi-local-release --force cd /tmp # Node package install smoke tests /tmp/pi-local-release/node/pi --help /tmp/pi-local-release/node/pi --version /tmp/pi-local-release/node/pi --list-models /tmp/pi-local-release/node/pi -p "Say exactly: ok" /tmp/pi-local-release/node/pi # Bun binary smoke tests /tmp/pi-local-release/bun/pi --help /tmp/pi-local-release/bun/pi --version /tmp/pi-local-release/bun/pi --list-models /tmp/pi-local-release/bun/pi -p "Say exactly: ok" /tmp/pi-local-release/bun/pi ''' Verify both Node and Bun startup, model/account listing, interactive startup, and at least one real prompt with the intended default provider. The bare commands `/tmp/pi-local-release/node/pi` and `/tmp/pi-local-release/bun/pi` start interactive mode; run each in tmux, submit a prompt, and wait for the model reply before considering the interactive smoke test passed. Failures are release blockers unless the user explicitly accepts the risk. Load and follow [interactive-testing.md](interactive-testing.md) for the tmux workflow. Start each release binary from `/tmp`, not the repo root.
  ```

核验：`v1.4.0`

### E096

证据：`scripts/release.mjs#L215-L266`

- [`scripts/release.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/release.mjs) — text: `} function updateChangelogsForRelease(version) { const date = new Date().toISOString().split("T")［0］; const changelogs =`，提示行 215

  ```text
  } function updateChangelogsForRelease(version) { const date = new Date().toISOString().split("T")[0]; const changelogs = getChangelogs(); for (const changelog of changelogs) { const content = readFileSync(changelog, "utf-8"); if (!content.includes("## [Unreleased]")) { console.log(` Skipping ${changelog}: no [Unreleased] section`); continue; } const updated = content.replace( "## [Unreleased]", `## [${version}] - ${date}` ); writeFileSync(changelog, updated); console.log(` Updated ${changelog}`); } } function addUnreleasedSection() { const changelogs = getChangelogs(); const unreleasedSection = "## [Unreleased]\n\n"; for (const changelog of changelogs) { const content = readFileSync(changelog, "utf-8"); // Insert after "# Changelog\n\n" const updated = content.replace( /^(# Changelog\n\n)/, `$1${unreleasedSection}` ); writeFileSync(changelog, updated); console.log(` Added [Unreleased] to ${changelog}`); } } // Main flow console.log("\n=== Release Script ===\n"); // 1. Check for uncommitted changes console.log("Checking for uncommitted changes..."); const status = run("git status --porcelain", { silent: true }); if (status && status.trim()) { console.error("Error: Uncommitted changes detected. Commit or stash first."); console.error(status); process.exit(1); } console.log(" Working directory clean\n");
  ```

核验：`v1.4.0`

### E097

证据：`scripts/release.mjs#L268-L292`

- [`scripts/release.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/release.mjs) — text: `// 2. Verify npm package registration before modifying the worktree. assertPackagesAreRegisteredWithNpm(); // Pin and ve`，提示行 268

  ```text
  // 2. Verify npm package registration before modifying the worktree. assertPackagesAreRegisteredWithNpm(); // Pin and verify the Nix model catalog before modifying versions, so the pin // lands in the release commit and a failure leaves the worktree clean. console.log("Pinning and building with the newest model catalog for Nix..."); await pinAndBuildWithNewestModelCatalog(); console.log(); // 3. Bump or set version const version = bumpOrSetVersion(RELEASE_TARGET); console.log(` New version: ${version}\n`); // 4. Update changelogs console.log("Updating CHANGELOG.md files..."); updateChangelogsForRelease(version); console.log(); // 5. Regenerate release artifacts console.log("Regenerating release artifacts..."); run("npm run generate:models"); run("npm run check:model-data"); run("npm run install-lock:coding-agent"); console.log();
  ```

核验：`v1.4.0`

### E098

证据：`nix.yml#L3-L13`

- [`.github/workflows/nix.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/nix.yml) — text: `# The flake builds with the model catalog revision pinned in # nix/model-catalog.json. This workflow keeps that pin usab`，提示行 3

  ```text
  # The flake builds with the model catalog revision pinned in # nix/model-catalog.json. This workflow keeps that pin usable independently of # releases: after pi.dev publishes a catalog from main, it replaces the pin with # the newest catalog only if the current one no longer hydrates main (for # example after a provider was added) or its provider/type/API model groups # differ from the newest catalog for one of main's providers (for example after # a provider gained classifier models or switched APIs), builds the flake, and # commits the new pin to main. # # Release tags are built exactly as tagged, with their committed pin. Once all # systems build, the stable branch is fast-forwarded to the tag so that
  ```

核验：`v1.4.0`

### E099

证据：`nix.yml#L67-L83`

- [`.github/workflows/nix.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/nix.yml) — text: `- name: Refresh the model catalog pin if stale id: pin run: | set -euo pipefail # A release tag must build with its comm`，提示行 67

  ```text
  - name: Refresh the model catalog pin if stale id: pin run: | set -euo pipefail # A release tag must build with its committed pin; it cannot be changed. if [[ "${GITHUB_REF_TYPE}" != "tag" ]]; then node scripts/update-model-catalog-pin.mjs --if-stale fi revision="$(node -p 'require("./nix/model-catalog.json").revision')" echo "revision=${revision}" >> "${GITHUB_OUTPUT}" if git diff --quiet -- nix/model-catalog.json; then echo "updated=false" >> "${GITHUB_OUTPUT}" else echo "updated=true" >> "${GITHUB_OUTPUT}" if [[ "${GITHUB_EVENT_NAME}" == "pull_request" ]]; then echo "::warning::The model catalog pin on main is stale; this build uses ${revision}. The pin is refreshed on main after pi.dev publishes a catalog."
  ```

核验：`v1.4.0`

### E100

证据：`build-binaries.yml#L3-L16`

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `on: push: tags: - 'v*' workflow_dispatch: inputs: tag: description: 'Tag to build (e.g., v0.12.0)' required: true type: `，提示行 3

  ```text
  on: push: tags: - 'v*' workflow_dispatch: inputs: tag: description: 'Tag to build (e.g., v0.12.0)' required: true type: string source_ref: description: 'Source ref to build/publish (defaults to tag; use only for release recovery)' required: false type: string
  ```

核验：`v1.4.0`

### E101

证据：`build-binaries.yml#L52-L121`

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `- name: Hydrate release model data run: npm run hydrate:model-data - name: Create source archive run: | set -euo pipefai`，提示行 52

  ```text
  - name: Hydrate release model data run: npm run hydrate:model-data - name: Create source archive run: | set -euo pipefail VERSION="${RELEASE_TAG#v}" mkdir -p release-assets ./scripts/create-source-archive.sh \ --version "${VERSION}" \ --ref HEAD \ --out "release-assets/pi-${VERSION}-source.tar.gz" - name: Build binaries from source archive run: | set -euo pipefail VERSION="${RELEASE_TAG#v}" build_root="$(mktemp -d)" trap 'rm -rf "${build_root}"' EXIT tar -xzf "release-assets/pi-${VERSION}-source.tar.gz" -C "${build_root}" "${build_root}/pi-${VERSION}/scripts/build-binaries.sh" \ --offline-model-data \ --out "${GITHUB_WORKSPACE}/packages/coding-agent/binaries" - name: Prepare GitHub release payload run: | set -euo pipefail mkdir -p release-assets VERSION="${RELEASE_TAG}" VERSION="${VERSION#v}" # Remove 'v' prefix node scripts/release-notes.mjs extract --version "${VERSION}" --tag "${RELEASE_TAG}" --out release-assets/RELEASE_NOTES.md node scripts/generate-coding-agent-install-lock.mjs --check cp packages/coding-agent/install-lock/package.json release-assets/pi-coding-agent-install-package.json cp packages/coding-agent/install-lock/package-lock.json release-assets/pi-coding-agent-install-package-lock.json cd packages/coding-agent/binaries binary_assets=( pi-darwin-arm64.tar.gz pi-darwin-x64.tar.gz pi-linux-x64.tar.gz pi-linux-arm64.tar.gz pi-windows-x64.zip pi-windows-arm64.zip ) for asset in "${binary_assets[@]}"; do test -f "${asset}" done cp "${binary_assets[@]}" "${GITHUB_WORKSPACE}/release-assets/" cd "${GITHUB_WORKSPACE}/release-assets" source_asset="pi-${VERSION}-source.tar.gz" release_assets=( "${source_asset}" pi-darwin-arm64.tar.gz pi-darwin-x64.tar.gz pi-linux-x64.tar.gz pi-linux-arm64.tar.gz pi-windows-x64.zip pi-windows-arm64.zip pi-coding-agent-install-package.json pi-coding-agent-install-package-lock.json ) sha256sum "${release_assets[@]}" > SHA256SUMS
  ```

核验：`v1.4.0`

### E102

证据：`build-binaries.yml#L210-L301`

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `stage-github-release: runs-on: ubuntu-latest needs: - build - smoke-test-binaries permissions: actions: read contents: w`，提示行 210

  ```text
  stage-github-release: runs-on: ubuntu-latest needs: - build - smoke-test-binaries permissions: actions: read contents: write env: GH_REPO: ${{ github.repository }} RELEASE_TAG: ${{ github.event.inputs.tag || github.ref_name }} steps: - name: Download GitHub release payload uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4.3.0 with: name: release-assets-${{ env.RELEASE_TAG }} path: release-assets - name: Validate GitHub release payload run: | set -euo pipefail cd release-assets VERSION="${RELEASE_TAG#v}" source_asset="pi-${VERSION}-source.tar.gz" expected_assets=( "${source_asset}" pi-darwin-arm64.tar.gz pi-darwin-x64.tar.gz pi-linux-x64.tar.gz pi-linux-arm64.tar.gz pi-windows-x64.zip pi-windows-arm64.zip pi-coding-agent-install-package.json pi-coding-agent-install-package-lock.json SHA256SUMS RELEASE_NOTES.md ) for asset in "${expected_assets[@]}"; do test -f "${asset}" done sha256sum -c SHA256SUMS - name: Create draft GitHub Release and upload assets env: GH_TOKEN: ${{ secrets.GITHUB_TOKEN }} run: | set -euo pipefail cd release-assets VERSION="${RELEASE_TAG#v}" source_asset="pi-${VERSION}-source.tar.gz" release_assets=( "${source_asset}" pi-darwin-arm64.tar.gz pi-darwin-x64.tar.gz pi-linux-x64.tar.gz pi-linux-arm64.tar.gz pi-windows-x64.zip pi-windows-arm64.zip pi-coding-agent-install-package.json pi-coding-agent-install-package-lock.json SHA256SUMS ) existing_release="$(gh release view "${RELEASE_TAG}" --json isDraft --jq .isDraft 2>/dev/null || true)" if [[ "${existing_release}" == "false" ]]; then echo "::error::GitHub Release ${RELEASE_TAG} is already published. Refusing to mutate a public release." exit 1 fi if [[ "${existing_release}" == "true" ]]; then gh release delete "${RELEASE_TAG}" --yes fi gh release create "${RELEASE_TAG}" \ --verify-tag \ --draft \ --title "${RELEASE_TAG}" \ --notes-file RELEASE_NOTES.md \ "${release_assets[@]}" expected_asset_names="$(printf '%s\n' "${release_assets[@]}" | sort)" actual_asset_names="$(gh release view "${RELEASE_TAG}" --json assets --jq '.assets[].name' | sort)" if [[ "${actual_asset_names}" != "${expected_asset_names}" ]]; then echo "::error::Draft GitHub Release asset set does not match expected files." diff -u <(printf '%s\n' "${expected_asset_names}") <(printf '%s\n' "${actual_asset_names}") || true exit 1
  ```

核验：`v1.4.0`

### E103

证据：`build-binaries.yml#L312-L384`

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `publish-npm: runs-on: ubuntu-latest needs: ［stage-github-release, env-daemons］ environment: npm-publish permissions: con`，提示行 312

  ```text
  publish-npm: runs-on: ubuntu-latest needs: [stage-github-release, env-daemons] environment: npm-publish permissions: contents: read id-token: write env: RELEASE_TAG: ${{ github.event.inputs.tag || github.ref_name }} SOURCE_REF: ${{ github.event.inputs.source_ref || github.event.inputs.tag || github.ref_name }} steps: - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1 with: ref: ${{ env.SOURCE_REF }} persist-credentials: false - name: Setup Node.js uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0 with: node-version: '22' registry-url: 'https://registry.npmjs.org' cache: npm - name: Install system dependencies run: | sudo apt-get update sudo apt-get install -y libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev fd-find ripgrep sudo ln -s $(which fdfind) /usr/local/bin/fd - name: Install dependencies run: npm ci --ignore-scripts - name: Download pi-env daemons uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4.3.0 with: pattern: pi-env-* path: packages/env/bin - name: Check pi-env daemons run: | set -euo pipefail for name in linux-x64 linux-arm64 android-arm64 android-x64 darwin-arm64 darwin-x64; do test -s "packages/env/bin/pi-env-${name}/pi-env" done for name in windows-x64 windows-arm64; do test -s "packages/env/bin/pi-env-${name}/pi-env.exe" done chmod +x packages/env/bin/*/pi-env* ls -lR packages/env/bin - name: Build run: npm run build - name: Check run: npm run check - name: Build the pi-env daemon for tests run: npm run build:daemon --workspace packages/env - name: Test run: npm test - name: Smoke-test packed npm consumer run: npm run check:package-install - name: Upgrade npm for trusted publishing run: | npm install -g npm@11.16.0 --ignore-scripts npm --version - name: Validate npm tarball publication with provenance run: node scripts/publish.mjs --dry-run
  ```

核验：`v1.4.0`

### E104

证据：`scripts/publish.mjs#L13-L28`

- [`scripts/publish.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish.mjs) — text: `function isPublished(name, version) { try { const output = execNpmSync(［"view", `${name}@${version}`, "version", "--json`，提示行 13

  ```text
  function isPublished(name, version) { try { const output = execNpmSync(["view", `${name}@${version}`, "version", "--json"], { encoding: "utf8", stdio: ["inherit", "pipe", "pipe"], }); if (!output.trim()) throw new Error(`npm returned no version for ${name}@${version}`); return true; } catch (error) { const output = error && typeof error === "object" ? ["stdout", "stderr"].map((key) => key in error ? String(error[key] ?? "") : "").filter(Boolean).join("\n") : ""; if (output.includes("E404") || output.includes("404 Not Found")) return false; throw new Error(`Failed to query ${name}@${version}${output ? `\n${output}` : ""}`, { cause: error }); } }
  ```

核验：`v1.4.0`

### E105

证据：`scripts/publish-release-announcement.mjs#L70-L126`

- [`scripts/publish-release-announcement.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish-release-announcement.mjs) — text: `async function resolvePackageFromNpm(pkg) { const packageUrl = `${REGISTRY_URL}/${encodeURIComponent(pkg.name)}/${pkg.ve`，提示行 70

  ```text
  async function resolvePackageFromNpm(pkg) { const packageUrl = `${REGISTRY_URL}/${encodeURIComponent(pkg.name)}/${pkg.version}`; const response = await fetch(packageUrl, { headers: { accept: "application/json" } }); if (!response.ok) { throw new Error(`${pkg.name}@${pkg.version}: npm registry returned ${response.status}`); } const data = await response.json(); if ( typeof data !== "object" || data === null || Array.isArray(data) || data.version !== pkg.version || typeof data.dist !== "object" || data.dist === null || Array.isArray(data.dist) || typeof data.dist.tarball !== "string" || typeof data.dist.integrity !== "string" ) { throw new Error(`${pkg.name}@${pkg.version}: npm registry returned invalid metadata`); } const tarball = await fetch(data.dist.tarball, { method: "HEAD" }); if (!tarball.ok) { throw new Error(`${pkg.name}@${pkg.version}: tarball returned ${tarball.status}`); } return { name: pkg.name, version: pkg.version, tarball: data.dist.tarball, integrity: data.dist.integrity, }; } async function verifyPackagesAreAvailable(packages) { const deadline = Date.now() + RETRY_TIMEOUT_MS; let attempt = 0; let failures = []; do { attempt++; const results = await Promise.allSettled(packages.map(resolvePackageFromNpm)); failures = results.flatMap((result, index) => result.status === "rejected" ? [`${packages[index].name}: ${result.reason}`] : [], ); if (failures.length === 0) { console.log(`All ${packages.length} Pi packages are available from npm (attempt ${attempt}).`); return results.map((result) => result.value); } console.log(`Waiting for ${failures.length} Pi package${failures.length === 1 ? "" : "s"} on npm (attempt ${attempt}):`); for (const failure of failures) console.log(` ${failure}`); if (Date.now() < deadline) await sleep(RETRY_DELAY_MS); } while (Date.now() < deadline); throw new Error(`Timed out waiting for Pi packages to become available from npm:\n${failures.map((failure) => ` ${failure}`).join("\n")}`);
  ```

核验：`v1.4.0`

### E106

证据：`scripts/publish-release-announcement.mjs#L224-L240`

- [`scripts/publish-release-announcement.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish-release-announcement.mjs) — text: `function validateInstallerArtifacts(packageJsonPath, packageLockPath, version) { const packageJson = JSON.parse(readFile`，提示行 224

  ```text
  function validateInstallerArtifacts(packageJsonPath, packageLockPath, version) { const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")); const packageLock = JSON.parse(readFileSync(packageLockPath, "utf8")); const root = packageLock.packages?.[""]; if (packageJson.name !== INSTALLER_PACKAGE_NAME || packageJson.version !== version) { throw new Error(`Installer package.json must describe ${INSTALLER_PACKAGE_NAME}@${version}`); } if ( packageLock.lockfileVersion !== 3 || packageLock.version !== version || root?.version !== version || root.dependencies?.["@earendil-works/pi-coding-agent"] !== version ) { throw new Error(`Installer package-lock.json must describe Pi ${version}`); } }
  ```

核验：`v1.4.0`

### E107

证据：`scripts/publish-release-announcement.mjs#L254-L266`

- [`scripts/publish-release-announcement.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish-release-announcement.mjs) — text: `export async function advanceLatestRelease(version, readLatest, writeLatest) { for (let attempt = 0; attempt < MAX_POINT`，提示行 254

  ```text
  export async function advanceLatestRelease(version, readLatest, writeLatest) { for (let attempt = 0; attempt < MAX_POINTER_UPDATE_ATTEMPTS; attempt++) { const current = await readLatest(); if (current && compareReleaseVersions(version, current.version) <= 0) { return { advanced: false, version: current.version }; } const updated = await writeLatest(current ? { etag: current.etag } : { missing: true }); if (updated) { return { advanced: true, version }; } } throw new Error(`Could not advance the Pi release marker to ${version} after ${MAX_POINTER_UPDATE_ATTEMPTS} attempts.`); } async function main() { const options = parseArgs(process.argv.slice(2)); const packages = getPublicWorkspacePackages(); for (const pkg of packages) { if (pkg.version !== options.version) { throw new Error(`${pkg.name} is ${pkg.version}; expected ${options.version}`); } } const publishedPackages = await verifyPackagesAreAvailable(packages); const release = { schemaVersion: 1, version: options.version, sourceCommit: options.sourceCommit ?? gitSourceCommit(), publishedAt: new Date().toISOString(), packages: publishedPackages, }; const temporaryDirectory = mkdtempSync(join(tmpdir(), "pi-release-announcement-")); try { const releasePath = join(temporaryDirectory, "release.json"); const latestPath = join(temporaryDirectory, "latest.json"); writeFileSync(releasePath, `${JSON.stringify(release, null, "\t")}\n`); if ( !putJson( options.bucket, options.endpoint, releasePath, `${RELEASES_PREFIX}/releases/${options.version}.json`, "public, max-age=31536000, immutable", { missing: true }, ) ) { console.log(`Release record ${options.version} already exists.`); } writeFileSync(latestPath, `${JSON.stringify(release, null, "\t")}\n`); validateInstallerArtifacts(options.installerPackageJson, options.installerPackageLock, options.version); const installerReleasePrefix = `${INSTALLER_PREFIX}/releases/${options.version}`; putObject( options.bucket, options.endpoint, options.installerPackageJson, `${installerReleasePrefix}/package.json`, "public, max-age=31536000, immutable", { missing: true }, ); putObject( options.bucket, options.endpoint, options.installerPackageLock, `${installerReleasePrefix}/package-lock.json`, "public, max-age=31536000, immutable", { missing: true }, ); putJson( options.bucket, options.endpoint, releasePath, `${installerReleasePrefix}/metadata.json`, "public, max-age=31536000, immutable", { missing: true }, ); const installerLatest = await advanceLatestRelease( options.version, () => readLatestRelease( options.bucket, options.endpoint, `${INSTALLER_PREFIX}/latest.json`, join(temporaryDirectory, "installer-latest-current.json"), ), (condition) => putJson( options.bucket, options.endpoint, latestPath, `${INSTALLER_PREFIX}/latest.json`, "no-store", condition, ), ); console.log( installerLatest.advanced ? `Published installer artifacts for Pi ${options.version} through s3://${options.bucket}/${INSTALLER_PREFIX}/latest.json` : `Pi ${installerLatest.version} is already the latest installer release.`, ); const result = await advanceLatestRelease( options.version, () => readLatestRelease( options.bucket, options.endpoint, `${RELEASES_PREFIX}/latest.json`, join(temporaryDirectory, "latest-current.json"), ), (condition) => putJson( options.bucket, options.endpoint, latestPath, `${RELEASES_PREFIX}/latest.json`, "no-store", condition, ), );
  ```

核验：`v1.4.0`

### E108

证据：`build-binaries.yml#L427-L455`

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `--installer-package-json packages/coding-agent/install-lock/package.json \ --installer-package-lock packages/coding-agen`，提示行 427

  ```text
  --installer-package-json packages/coding-agent/install-lock/package.json \ --installer-package-lock packages/coding-agent/install-lock/package-lock.json publish-github-release: runs-on: ubuntu-latest needs: - stage-github-release - publish-npm - announce-pi-dev-release permissions: contents: write env: GH_REPO: ${{ github.repository }} RELEASE_TAG: ${{ github.event.inputs.tag || github.ref_name }} steps: - name: Publish staged GitHub Release env: GH_TOKEN: ${{ secrets.GITHUB_TOKEN }} run: | set -euo pipefail existing_release="$(gh release view "${RELEASE_TAG}" --json isDraft --jq .isDraft 2>/dev/null || true)" if [[ "${existing_release}" == "" ]]; then echo "::error::Draft GitHub Release ${RELEASE_TAG} does not exist." exit 1 fi if [[ "${existing_release}" == "false" ]]; then echo "::error::GitHub Release ${RELEASE_TAG} is already published." exit 1
  ```

核验：`v1.4.0`

### E109

证据：`build-binaries.yml#L457-L481`

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `gh release edit "${RELEASE_TAG}" --draft=false cleanup-draft-github-release: runs-on: ubuntu-latest needs: - build - sta`，提示行 457

  ```text
  gh release edit "${RELEASE_TAG}" --draft=false cleanup-draft-github-release: runs-on: ubuntu-latest needs: - build - stage-github-release - publish-npm - announce-pi-dev-release - publish-github-release if: ${{ always() && needs.stage-github-release.result != 'skipped' && (needs.stage-github-release.result != 'success' || needs.publish-npm.result != 'success' || needs.announce-pi-dev-release.result != 'success' || needs.publish-github-release.result != 'success') }} permissions: contents: write env: GH_REPO: ${{ github.repository }} RELEASE_TAG: ${{ github.event.inputs.tag || github.ref_name }} steps: - name: Delete draft GitHub Release after failure env: GH_TOKEN: ${{ secrets.GITHUB_TOKEN }} run: | set -euo pipefail existing_release="$(gh release view "${RELEASE_TAG}" --json isDraft --jq .isDraft 2>/dev/null || true)"
  ```

核验：`v1.4.0`

### E110

证据：`.pi/skills/release.md#L44-L50`

- [`.pi/skills/release.md`](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/skills/release.md) — text: `Use `npm_config_min_release_age=0` only for the release command. The repo's normal npm age gate can otherwise block the `，提示行 44

  ```text
  Use `npm_config_min_release_age=0` only for the release command. The repo's normal npm age gate can otherwise block the release lockfile refresh when the current workspace package version was published recently. Review any lockfile or install lock diffs the release creates before push. The release script pins the newest published model catalog for Nix (`nix/model-catalog.json`) and builds the checkout with it as the Nix build does (it fails if that catalog predates main's model changes; publish one first), bumps all package versions, updates changelogs, regenerates release artifacts, runs `npm run check`, commits `Release vX.Y.Z`, tags `vX.Y.Z`, adds fresh `## [Unreleased]` changelog sections, commits `Add [Unreleased] section for next cycle`, then pushes `main` and the tag. Do not rerun the release script after a tag was pushed. 4. **CI verifies and announces the npm release**: pushing the `vX.Y.Z` tag triggers `.github/workflows/build-binaries.yml`. The `publish-npm` job uses npm trusted publishing through GitHub Actions OIDC with environment `npm-publish`; no local `npm publish`, `npm whoami`, OTP, or WebAuthn flow is required. After publishing, `announce-pi-dev-release` verifies every public workspace package resolves at the exact release version and that its npm tarball is available, then writes the verified release marker to R2. `pi.dev/api/latest-version` reads that marker; it must never announce a release from npm before this job succeeds. 5. **CI builds the Nix release**: the tag push also triggers `.github/workflows/nix.yml`, which builds the tagged flake on Linux and macOS and then fast-forwards the `stable` branch to the release commit. `nix run github:earendil-works/pi/stable` runs the latest release. If the Nix build fails, `stable` stays on the previous release; the tag cannot be fixed, so fix `main` and ship the fix in the next release.
  ```

核验：`v1.4.0`

### E111

证据：`scripts/publish.mjs#L44-L53`

- [`scripts/publish.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish.mjs) — text: `const packageStates = artifactSet.packages.map((pkg) => ({ ...pkg, published: isPublished(pkg.name, pkg.version) })); fo`，提示行 44

  ```text
  const packageStates = artifactSet.packages.map((pkg) => ({ ...pkg, published: isPublished(pkg.name, pkg.version) })); for (const pkg of packageStates) { console.log(`${pkg.name}@${pkg.version} ${pkg.published ? "is already published" : "is ready to publish"}: ${pkg.tarballPath}`); } console.log(dryRun ? "\nDry-running tarball publication with provenance.\n" : "\nAll packages packed; starting publication.\n"); for (const pkg of packageStates) { if (pkg.published) { console.log(`Skipping ${pkg.name}@${pkg.version}: already published\n`); continue; }
  ```

核验：`v1.4.0`

### E112

证据：`scripts/publish-release-announcement.mjs#L291-L329`

- [`scripts/publish-release-announcement.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish-release-announcement.mjs) — text: `if ( !putJson( options.bucket, options.endpoint, releasePath, `${RELEASES_PREFIX}/releases/${options.version}.json`, "pu`，提示行 291

  ```text
  if ( !putJson( options.bucket, options.endpoint, releasePath, `${RELEASES_PREFIX}/releases/${options.version}.json`, "public, max-age=31536000, immutable", { missing: true }, ) ) { console.log(`Release record ${options.version} already exists.`); } writeFileSync(latestPath, `${JSON.stringify(release, null, "\t")}\n`); validateInstallerArtifacts(options.installerPackageJson, options.installerPackageLock, options.version); const installerReleasePrefix = `${INSTALLER_PREFIX}/releases/${options.version}`; putObject( options.bucket, options.endpoint, options.installerPackageJson, `${installerReleasePrefix}/package.json`, "public, max-age=31536000, immutable", { missing: true }, ); putObject( options.bucket, options.endpoint, options.installerPackageLock, `${installerReleasePrefix}/package-lock.json`, "public, max-age=31536000, immutable", { missing: true }, ); putJson( options.bucket, options.endpoint, releasePath, `${installerReleasePrefix}/metadata.json`, "public, max-age=31536000, immutable", { missing: true },
  ```

核验：`v1.4.0`

### E113

证据：`nix.yml#L135-L151`

- [`.github/workflows/nix.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/nix.yml) — text: `update-stable: needs: build if: ${{ github.ref_type == 'tag' }} runs-on: ubuntu-latest permissions: contents: write step`，提示行 135

  ```text
  update-stable: needs: build if: ${{ github.ref_type == 'tag' }} runs-on: ubuntu-latest permissions: contents: write steps: # Full history, so git can verify that the push to stable is a fast-forward. - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1 with: fetch-depth: 0 # Without --force, the push fails unless it is a fast-forward, so stable # never moves back to an older release. - name: Fast-forward stable to the release
  ```

核验：`v1.4.0`

### E114

证据：`.pi/skills/release.md#L47-L50`

- [`.pi/skills/release.md`](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/skills/release.md) — text: `4. **CI verifies and announces the npm release**: pushing the `vX.Y.Z` tag triggers `.github/workflows/build-binaries.ym`，提示行 47

  ```text
  4. **CI verifies and announces the npm release**: pushing the `vX.Y.Z` tag triggers `.github/workflows/build-binaries.yml`. The `publish-npm` job uses npm trusted publishing through GitHub Actions OIDC with environment `npm-publish`; no local `npm publish`, `npm whoami`, OTP, or WebAuthn flow is required. After publishing, `announce-pi-dev-release` verifies every public workspace package resolves at the exact release version and that its npm tarball is available, then writes the verified release marker to R2. `pi.dev/api/latest-version` reads that marker; it must never announce a release from npm before this job succeeds. 5. **CI builds the Nix release**: the tag push also triggers `.github/workflows/nix.yml`, which builds the tagged flake on Linux and macOS and then fast-forwards the `stable` branch to the release commit. `nix run github:earendil-works/pi/stable` runs the latest release. If the Nix build fails, `stable` stays on the previous release; the tag cannot be fixed, so fix `main` and ship the fix in the next release.
  ```

核验：`v1.4.0`

### E115

证据：`build-binaries.yml#L279-L293`

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `existing_release="$(gh release view "${RELEASE_TAG}" --json isDraft --jq .isDraft 2>/dev/null || true)" if ［［ "${existin`，提示行 279

  ```text
  existing_release="$(gh release view "${RELEASE_TAG}" --json isDraft --jq .isDraft 2>/dev/null || true)" if [[ "${existing_release}" == "false" ]]; then echo "::error::GitHub Release ${RELEASE_TAG} is already published. Refusing to mutate a public release." exit 1 fi if [[ "${existing_release}" == "true" ]]; then gh release delete "${RELEASE_TAG}" --yes fi gh release create "${RELEASE_TAG}" \ --verify-tag \ --draft \ --title "${RELEASE_TAG}" \ --notes-file RELEASE_NOTES.md \ "${release_assets[@]}"
  ```

核验：`v1.4.0`

### E116

证据：`publish-model-catalog.yml#L1-L33`

- [`.github/workflows/publish-model-catalog.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/publish-model-catalog.yml) — text: `name: Publish Model Catalog on: workflow_run: workflows: - CI types: - completed pull_request: paths: - '.github/workflo`，提示行 1

  ```text
  name: Publish Model Catalog on: workflow_run: workflows: - CI types: - completed pull_request: paths: - '.github/workflows/publish-model-catalog.yml' - '.gitignore' - 'package.json' - 'packages/ai/**' - 'scripts/check-model-catalog-compat.mjs' - 'scripts/model-catalog-minimum-version.mjs' - 'scripts/model-catalog-protocol.ts' - 'scripts/publish-model-catalog.mjs' # GitHub schedules use UTC. Run hourly candidates across the CET/CEST # boundaries; the publish job only uploads at 10:17, 12:17, and 14:17 # Europe/Vienna time. schedule: - cron: '17 8-13 * * 1-5' workflow_dispatch: inputs: source_ref: description: 'Commit, branch, or tag to generate from' required: false default: 'main' type: string publish: description: 'Upload the generated catalog to production R2' required: true
  ```

核验：`v1.4.0`

### E117

证据：`publish-model-catalog.yml#L38-L75`

- [`.github/workflows/publish-model-catalog.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/publish-model-catalog.yml) — text: `- name: Upload model catalog JSON uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2 with: `，提示行 74

  ```text
  - name: Upload model catalog JSON uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2 with: name: model-catalog-json path: .artifacts/model-catalog if-no-files-found: error retention-days: 14 publish: if: ${{ github.event_name == 'schedule' || github.event_name == 'workflow_run' || (github.event_name == 'workflow_dispatch' && inputs.publish) }} needs: generate runs-on: ubuntu-latest environment: pi-model-upload concurrency:
  ```

核验：`v1.4.0`

### E118

证据：`publish-model-catalog.yml#L41-L81`

- [`.github/workflows/publish-model-catalog.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/publish-model-catalog.yml) — text: `jobs: generate: if: ${{ github.event_name != 'workflow_run' || (github.event.workflow_run.conclusion == 'success' && git`，提示行 39

  ```text
  jobs: generate: if: ${{ github.event_name != 'workflow_run' || (github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.head_branch == 'main') }} runs-on: ubuntu-latest env: SOURCE_REF: ${{ github.event.workflow_run.head_sha || inputs.source_ref || github.sha }} steps: - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1 with: ref: ${{ env.SOURCE_REF }} persist-credentials: false # The compatibility check reads the latest release's source from its git tag. fetch-depth: 0 - name: Setup Node.js uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0 with: node-version: '22' cache: npm - name: Install dependencies run: npm ci --ignore-scripts - name: Generate model catalog JSON run: npm run generate:model-catalog - name: Validate model catalog JSON run: npm run check:model-catalog # pi.dev serves the catalog to released pi >= MINIMUM_PI_VERSION. Fail before # publishing if the latest release's code cannot handle it.
  ```

核验：`v1.4.0`

### E119

证据：`scripts/publish-model-catalog.mjs#L25-L34`

- [`scripts/publish-model-catalog.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish-model-catalog.mjs) — text: `const modelsPath = join(inputDir, "models.json"); const allModelsPath = join(inputDir, "models.all.json"); const provide`，提示行 85

  ```text
  const modelsPath = join(inputDir, "models.json"); const allModelsPath = join(inputDir, "models.all.json"); const providerIndexPath = join(inputDir, "providers.json"); const providersDir = join(inputDir, "providers"); const modelsBytes = readFileSync(modelsPath); const allModelsBytes = readFileSync(allModelsPath); const models = JSON.parse(modelsBytes.toString("utf8")); const allModels = JSON.parse(allModelsBytes.toString("utf8")); const providerIds = readJson(providerIndexPath); if (!isObject(models)) throw new Error("models.json must contain an object"); if (!isObject(allModels)) throw new Error("models.all.json must contain an object"); if (!Array.isArray(providerIds) || !providerIds.every((value) => typeof value === "string")) { throw new Error("providers.json must contain an array of provider IDs"); } const expectedProviderIds = Object.keys(allModels).sort(); if (!isDeepStrictEqual(providerIds, expectedProviderIds)) { throw new Error("providers.json does not match the sorted providers in models.all.json"); } if (!isDeepStrictEqual(Object.keys(models).sort(), expectedProviderIds)) { throw new Error("models.json and models.all.json list different providers"); } for (const providerId of REQUIRED_PROVIDERS) { if (!Object.hasOwn(models, providerId)) throw new Error(`Required provider is missing: ${providerId}`); } // modelCount remains the legacy chat-catalog count for existing consumers. let modelCount = 0; let imageModelCount = 0; let classifierModelCount = 0; for (const providerId of providerIds) { const providerModels = allModels[providerId]; if (!Array.isArray(providerModels)) throw new Error(`Full provider catalog must be an array: ${providerId}`); const providerFile = readJson(join(providersDir, `${providerId}.all.json`)); if (!isDeepStrictEqual(providerFile, providerModels)) { throw new Error(`Provider shard does not match models.all.json: ${providerId}`); } const identities = new Set(); for (const model of providerModels) { if (!isObject(model) || typeof model.id !== "string" || model.provider !== providerId) { throw new Error(`Invalid model entry in provider catalog: ${providerId}`); } if (!MODEL_TYPES.includes(model.type)) { throw new Error(`Model entry has an unknown type: ${providerId}/${model.id} (${JSON.stringify(model.type)})`); } const identity = `${model.type}:${model.id}`; if (identities.has(identity)) throw new Error(`Duplicate model entry: ${providerId}/${identity}`); identities.add(identity); if (model.type === "chat") modelCount++; else if (model.type === "image") imageModelCount++; else classifierModelCount++; } // The legacy variant must be exactly the chat projection of the full catalog. const chatModels = chatProjection(providerModels); if (!isDeepStrictEqual(models[providerId], chatModels)) { throw new Error(`models.json is not the chat projection of models.all.json: ${providerId}`); } if (!isDeepStrictEqual(readJson(join(providersDir, `${providerId}.json`)), chatModels)) { throw new Error(`Provider shard does not match models.json: ${providerId}`); } } const shardFiles = readdirSync(providersDir).filter((name) => name.endsWith(".json")).sort(); const expectedShardFiles = providerIds.flatMap((providerId) => [`${providerId}.json`, `${providerId}.all.json`]).sort(); if (!isDeepStrictEqual(shardFiles, expectedShardFiles)) { throw new Error("Provider shard files do not match providers.json"); } if (modelCount < MINIMUM_MODEL_COUNT) { throw new Error(`Refusing to publish only ${modelCount} models; expected at least ${MINIMUM_MODEL_COUNT}`); } // The full catalog is a superset of the chat catalog, so hashing it alone // changes the revision for chat-only and image-only updates alike. const digest = createHash("sha256").update(allModelsBytes).digest("hex"); return { modelsPath, allModelsPath, providerIndexPath, providersDir, providerIds, providerCount: providerIds.length, modelCount, chatModelCount: modelCount, imageModelCount, classifierModelCount, totalModelCount: modelCount + imageModelCount + classifierModelCount, revision: `sha256-${digest}`, }; }
  ```

核验：`v1.4.0`

### E120

证据：`scripts/publish-model-catalog.mjs#L290-L324`

- [`scripts/publish-model-catalog.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish-model-catalog.mjs) — text: `try { const currentIndexPath = join(temporaryDir, "index-current.json"); const hasCurrentIndex = downloadIndex(options.b`，提示行 290

  ```text
  try { const currentIndexPath = join(temporaryDir, "index-current.json"); const hasCurrentIndex = downloadIndex(options.bucket, options.endpoint, currentIndexPath); const currentIndex = hasCurrentIndex ? validateIndex(readJson(currentIndexPath)) : undefined; const currentEntry = currentIndex?.catalogs.find( (catalog) => catalog.minimumPiVersion === MINIMUM_PI_VERSION, ); if (currentIndex?.defaultRevision === bundle.revision && currentEntry?.revision === bundle.revision) { console.log(`Model catalog ${bundle.revision} is already current; no objects uploaded.`); return; } const revision = bundle.revision; const uploads = [ [bundle.modelsPath, getModelCatalogArtifactKey(revision, "models.json")], [bundle.allModelsPath, getModelCatalogArtifactKey(revision, "models.all.json")], [bundle.providerIndexPath, getModelCatalogArtifactKey(revision, "providers.json")], ...bundle.providerIds.flatMap((providerId) => [ [join(bundle.providersDir, `${providerId}.json`), getModelCatalogProviderKey(revision, providerId, "legacy")], [join(bundle.providersDir, `${providerId}.all.json`), getModelCatalogProviderKey(revision, providerId, "typed")], ]), ]; for (const [sourcePath, key] of uploads) { uploadJson(options.bucket, options.endpoint, sourcePath, key, IMMUTABLE_CACHE_CONTROL); } const nextIndex = buildIndex(currentIndex, publication); const nextIndexPath = join(temporaryDir, "index-next.json"); writeFileSync(nextIndexPath, `${JSON.stringify(nextIndex, null, 2)}\n`); uploadJson(options.bucket, options.endpoint, nextIndexPath, MODEL_CATALOG_INDEX_KEY, INDEX_CACHE_CONTROL); console.log(`Published ${revision} to s3://${options.bucket}/${MODEL_CATALOG_PREFIX}/revisions/${revision}`); } finally { rmSync(temporaryDir, { recursive: true, force: true }); } } main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
  ```

核验：`v1.4.0`

### E121

证据：`check-lockfile-commit.mjs#L77-L120`

- [`scripts/check-lockfile-commit.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-lockfile-commit.mjs) — text: `const stagedFiles = git(［"diff", "--cached", "--name-only"］) .split("\n") .map((line) => line.trim()) .filter(Boolean); `，提示行 77

  ```text
  const stagedFiles = git(["diff", "--cached", "--name-only"]) .split("\n") .map((line) => line.trim()) .filter(Boolean); if (!stagedFiles.includes("package-lock.json")) { process.exit(0); } if (allowed) { console.error("package-lock.json is staged; PI_ALLOW_LOCKFILE_CHANGE is set, allowing commit."); process.exit(0); } const changes = getLockfilePackageChanges(); if (changes && hasOnlyWorkspacePackageChanges(changes)) { console.error("package-lock.json only updates workspace package metadata; allowing commit."); process.exit(0); } console.error("package-lock.json is staged."); console.error(""); console.error("Review lockfile changes before committing:"); console.error(" - confirm every new/updated package is intentional"); console.error(" - confirm npm age gates were active for resolution"); console.error(" - review any new lifecycle scripts in the dependency tree"); console.error(" - regenerate/check coding-agent install lock if release deps changed"); const summary = changes ? summarizeLockfileChange(changes) : []; if (summary.length > 0) { console.error(""); console.error("Detected package version changes:"); for (const change of summary.slice(0, 40)) { console.error(` - ${change}`); } if (summary.length > 40) { console.error(` ... ${summary.length - 40} more`); } } console.error(""); console.error("If this lockfile change is intentional, commit with:"); console.error(" PI_ALLOW_LOCKFILE_CHANGE=1 git commit ..."); process.exit(1);
  ```

核验：`v1.4.0`

### E122

证据：`ci.yml#L13-L65`

- [`.github/workflows/ci.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/ci.yml) — text: `jobs: build-check-test: runs-on: ubuntu-latest steps: - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da7641`，提示行 13

  ```text
  jobs: build-check-test: runs-on: ubuntu-latest steps: - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1 - name: Setup Node.js uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0 with: node-version: 22 cache: npm - name: Install system dependencies run: | sudo apt-get update sudo apt-get install -y libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev fd-find ripgrep sudo ln -s $(which fdfind) /usr/local/bin/fd - name: Install dependencies run: npm ci --ignore-scripts - name: Build run: npm run build - name: Check run: npm run check - name: Build the pi-env daemon run: npm run build:daemon --workspace packages/env - name: Test run: npm test mcp-conformance: runs-on: ubuntu-latest steps: - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1 - name: Setup Node.js uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0 with: node-version: 22 cache: npm - name: Install dependencies run: npm ci --ignore-scripts # Runs pi's MCP client from source against the pinned official conformance suite and fails on # regressions against packages/coding-agent/test/mcp-conformance/baseline.json. - name: MCP client conformance run: npm run test:mcp-conformance
  ```

核验：`v1.4.0`

### E123

证据：`scripts/check-pinned-deps.mjs#L25-L56`

- [`scripts/check-pinned-deps.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-pinned-deps.mjs) — text: `return /^(?:workspace:|file:|link:|portal:|git\+|github:|git:|https?:|ssh:|git:\/\/)/.test(specifier); } function getVer`，提示行 25

  ```text
  return /^(?:workspace:|file:|link:|portal:|git\+|github:|git:|https?:|ssh:|git:\/\/)/.test(specifier); } function getVersionSpecifier(specifier) { if (!specifier.startsWith("npm:")) return specifier; const aliasTarget = specifier.slice("npm:".length); const versionSeparator = aliasTarget.lastIndexOf("@"); if (versionSeparator <= 0) return specifier; return aliasTarget.slice(versionSeparator + 1); } const failures = []; collectPackageJsonFiles("."); for (const file of packageJsonFiles.sort()) { const packageJson = JSON.parse(readFileSync(file, "utf8")); for (const section of dependencySections) { const dependencies = packageJson[section]; if (!dependencies) continue; for (const [name, specifier] of Object.entries(dependencies)) { if (isNonRegistrySpecifier(specifier)) continue; if (exactVersionPattern.test(getVersionSpecifier(specifier))) continue; failures.push(`${file}: ${section}.${name} must be pinned, found ${specifier}`); } } } if (failures.length > 0) { console.error("Direct registry dependencies must use exact versions:");
  ```

核验：`v1.4.0`

### E124

证据：`build-binaries.yml#L427-L481`

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `--installer-package-json packages/coding-agent/install-lock/package.json \ --installer-package-lock packages/coding-agen`，提示行 427

  ```text
  --installer-package-json packages/coding-agent/install-lock/package.json \ --installer-package-lock packages/coding-agent/install-lock/package-lock.json publish-github-release: runs-on: ubuntu-latest needs: - stage-github-release - publish-npm - announce-pi-dev-release permissions: contents: write env: GH_REPO: ${{ github.repository }} RELEASE_TAG: ${{ github.event.inputs.tag || github.ref_name }} steps: - name: Publish staged GitHub Release env: GH_TOKEN: ${{ secrets.GITHUB_TOKEN }} run: | set -euo pipefail existing_release="$(gh release view "${RELEASE_TAG}" --json isDraft --jq .isDraft 2>/dev/null || true)" if [[ "${existing_release}" == "" ]]; then echo "::error::Draft GitHub Release ${RELEASE_TAG} does not exist." exit 1 fi if [[ "${existing_release}" == "false" ]]; then echo "::error::GitHub Release ${RELEASE_TAG} is already published." exit 1 fi gh release edit "${RELEASE_TAG}" --draft=false cleanup-draft-github-release: runs-on: ubuntu-latest needs: - build - stage-github-release - publish-npm - announce-pi-dev-release - publish-github-release if: ${{ always() && needs.stage-github-release.result != 'skipped' && (needs.stage-github-release.result != 'success' || needs.publish-npm.result != 'success' || needs.announce-pi-dev-release.result != 'success' || needs.publish-github-release.result != 'success') }} permissions: contents: write env: GH_REPO: ${{ github.repository }} RELEASE_TAG: ${{ github.event.inputs.tag || github.ref_name }} steps: - name: Delete draft GitHub Release after failure env: GH_TOKEN: ${{ secrets.GITHUB_TOKEN }} run: | set -euo pipefail existing_release="$(gh release view "${RELEASE_TAG}" --json isDraft --jq .isDraft 2>/dev/null || true)"
  ```

核验：`v1.4.0`

### E125

证据：`scripts/publish-release-announcement.mjs#L105-L126`

- [`scripts/publish-release-announcement.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish-release-announcement.mjs) — text: `async function verifyPackagesAreAvailable(packages) { const deadline = Date.now() + RETRY_TIMEOUT_MS; let attempt = 0; l`，提示行 105

  ```text
  async function verifyPackagesAreAvailable(packages) { const deadline = Date.now() + RETRY_TIMEOUT_MS; let attempt = 0; let failures = []; do { attempt++; const results = await Promise.allSettled(packages.map(resolvePackageFromNpm)); failures = results.flatMap((result, index) => result.status === "rejected" ? [`${packages[index].name}: ${result.reason}`] : [], ); if (failures.length === 0) { console.log(`All ${packages.length} Pi packages are available from npm (attempt ${attempt}).`); return results.map((result) => result.value); } console.log(`Waiting for ${failures.length} Pi package${failures.length === 1 ? "" : "s"} on npm (attempt ${attempt}):`); for (const failure of failures) console.log(` ${failure}`); if (Date.now() < deadline) await sleep(RETRY_DELAY_MS); } while (Date.now() < deadline); throw new Error(`Timed out waiting for Pi packages to become available from npm:\n${failures.map((failure) => ` ${failure}`).join("\n")}`);
  ```

核验：`v1.4.0`

### E126

证据：`publish-model-catalog.yml#L74-L147`

- [`.github/workflows/publish-model-catalog.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/publish-model-catalog.yml) — text: `- name: Upload model catalog JSON uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2 with: `，提示行 74

  ```text
  - name: Upload model catalog JSON uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2 with: name: model-catalog-json path: .artifacts/model-catalog if-no-files-found: error retention-days: 14 publish: if: ${{ github.event_name == 'schedule' || github.event_name == 'workflow_run' || (github.event_name == 'workflow_dispatch' && inputs.publish) }} needs: generate runs-on: ubuntu-latest environment: pi-model-upload concurrency: group: publish-model-catalog-r2 cancel-in-progress: true env: SOURCE_REF: ${{ github.event.workflow_run.head_sha || inputs.source_ref || github.sha }} AWS_ACCESS_KEY_ID: ${{ secrets.PI_ARTIFACTS_R2_ACCESS_KEY_ID }} AWS_SECRET_ACCESS_KEY: ${{ secrets.PI_ARTIFACTS_R2_SECRET_ACCESS_KEY }} AWS_DEFAULT_REGION: auto AWS_EC2_METADATA_DISABLED: 'true' R2_ENDPOINT: https://67c0d357268b0fca6e0b465bb9d01b84.r2.cloudflarestorage.com steps: - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1 with: ref: ${{ env.SOURCE_REF }} persist-credentials: false - name: Setup Node.js uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0 with: node-version: '22' - name: Download model catalog JSON uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4.3.0 with: name: model-catalog-json path: .artifacts/model-catalog - name: Verify AWS CLI run: aws --version - name: Check publication window id: publication-window env: EVENT_NAME: ${{ github.event_name }} MANUAL_PUBLISH: ${{ inputs.publish || false }} run: | set -euo pipefail local_day="$(TZ=Europe/Vienna date +%u)" local_hour_text="$(TZ=Europe/Vienna date +%H)" local_hour="$((10#$local_hour_text))" local_time="$(TZ=Europe/Vienna date '+%Y-%m-%d %H:%M:%S %Z')" allowed=false reason="outside the Monday-Friday 10:00-15:00 Europe/Vienna publication window" if [[ "$EVENT_NAME" == "workflow_dispatch" && "$MANUAL_PUBLISH" == "true" ]]; then allowed=true reason="manual publication" elif (( local_day <= 5 && local_hour >= 10 && local_hour < 15 )); then if [[ "$EVENT_NAME" != "schedule" ]] || (( (local_hour - 10) % 2 == 0 )); then allowed=true reason="business-hours publication" else reason="not a scheduled 10:17, 12:17, or 14:17 Europe/Vienna publication" fi fi echo "allowed=$allowed" >> "$GITHUB_OUTPUT" echo "R2 publication allowed: $allowed ($reason; local time: $local_time)"
  ```

核验：`v1.4.0`

## 12_pi_philosophy/structure_quality_evidence.md

### E127

证据：`../../scripts/check-entry-graphs.mjs#L4-L12`

- [`scripts/check-entry-graphs.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-entry-graphs.mjs) — text: `* * A package's `exports` map is the only place that says which modules are public, and one stray * `export *` can silen`，提示行 4

  ```text
  * * A package's `exports` map is the only place that says which modules are public, and one stray * `export *` can silently make a narrow entry drag an entire barrel: importing a 1-file pure * function through a barrel costs ~37 MB of evaluated module graph, and nothing fails until someone * measures a process. This walks the value-import graph of every declared entry point and enforces a * budget per entry, so that regression fails at commit time instead. * * Only value imports count. `import type` / `export type` are erased before Node sees them. */
  ```

核验：`v1.4.0`

### E128

证据：`../../scripts/check-entry-graphs.mjs#L11-L12`

- [`scripts/check-entry-graphs.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-entry-graphs.mjs) — text: `* Only value imports count. `import type` / `export type` are erased before Node sees them. */`，提示行 11

  ```text
  * Only value imports count. `import type` / `export type` are erased before Node sees them. */
  ```

核验：`v1.4.0`

### E129

证据：`../../scripts/check-entry-graphs.mjs#L20-L30`

- [`scripts/check-entry-graphs.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-entry-graphs.mjs) — text: `/** Workspace package name -> its source root, so cross-package imports are followed. */ const WORKSPACE = { "@earendil-`，提示行 20

  ```text
  /** Workspace package name -> its source root, so cross-package imports are followed. */ const WORKSPACE = { "@earendil-works/chord": "packages/chord/src", "@earendil-works/pi-ai": "packages/ai/src", "@earendil-works/pi-durable": "packages/durable/src", "@earendil-works/pi-agent-core": "packages/agent/src", "@earendil-works/pi-codemode": "packages/codemode/src", "@earendil-works/pi-telemetry": "packages/telemetry/src", "@earendil-works/pi-mcp": "packages/mcp/src", "@earendil-works/pi-tui": "packages/tui/src", };
  ```

核验：`v1.4.0`

### E130

证据：`../../scripts/check-entry-graphs.mjs#L53-L74`

- [`scripts/check-entry-graphs.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-entry-graphs.mjs) — text: `maxFiles: 8, forbid: ［"codemode/src/index.ts", "runtime/host.ts", "runtime/worker.ts", "codemode/src/wasm.ts"］, }, "./cl`，提示行 53

  ```text
  maxFiles: 8, forbid: ["codemode/src/index.ts", "runtime/host.ts", "runtime/worker.ts", "codemode/src/wasm.ts"], }, "./cloudflare": { maxFiles: 9, forbid: ["codemode/src/index.ts", "runtime/host.ts", "runtime/worker.ts", "codemode/src/wasm.ts"], }, }, "packages/durable": { ".": { // Tool argument validation reaches TypeBox; provider-session creation reaches pi-ai's lean UUID utility; the // memory and SQLite storages share scan order and cursor handling. Values from Chord's root (copyJson, // replicatedState) reach its host runtime through the root barrel. Chord's context reaches pi-telemetry's root // (index, noop, metrics, memory) for its NOOP telemetry default; harness/telemetry.ts is Durable's schema. // The Harness's request identity reaches pi-ai's utils/identity.ts and its version constant. maxFiles: 73, forbid: [ "packages/ai/src/index.ts", "packages/ai/src/utils/typebox-helpers.ts", // Photon (WebAssembly) loads only through `./images`. "packages/durable/src/images/", ],
  ```

核验：`v1.4.0`

### E131

证据：`../../scripts/check-entry-graphs.mjs#L32-L50`

- [`scripts/check-entry-graphs.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-entry-graphs.mjs) — text: `/** * Budgets are deliberate. Entries with no budget remain unbounded; each listed entry states the * graph it is allowe`，提示行 32

  ```text
  /** * Budgets are deliberate. Entries with no budget remain unbounded; each listed entry states the * graph it is allowed to reach. */ const BUDGETS = { "packages/ai": { "./models": { // Request telemetry reaches pi-ai's telemetry.ts and pi-telemetry's root (index, noop, metrics, memory). // Request identity reaches utils/identity.ts and its version constant. maxFiles: 20, forbid: ["providers/", "models.generated.ts", "index.ts", "utils/validation.ts", "utils/typebox-helpers.ts"], allow: ["packages/telemetry/src/index.ts"], }, "./utils/*": { maxFiles: 3, forbid: ["providers/", "api/", "index.ts"] }, }, "packages/codemode": { // Node and Bun users never load the Cloudflare entry, which imports the `cloudflare:workers` built-in. ".": { maxFiles: 12, forbid: ["codemode/src/cloudflare.ts"] }, // Runtimes without Node built-ins (Workers, browsers) import these; neither may reach the worker-thread host
  ```

核验：`v1.4.0`

### E132

证据：`../../scripts/check-entry-graphs.mjs#L107-L147`

- [`scripts/check-entry-graphs.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-entry-graphs.mjs) — text: `while (queue.length > 0) { const file = queue.pop(); if (seen.has(file) || file.endsWith(".json")) continue; seen.add(fi`，提示行 107

  ```text
  while (queue.length > 0) { const file = queue.pop(); if (seen.has(file) || file.endsWith(".json")) continue; seen.add(file); for (const match of readFileSync(file, "utf8").matchAll(SPEC)) { const target = resolveSpec(match[2], file); if (target) queue.push(target); } } return seen; } /** `./dist/harness/context.js` in the exports map is `src/harness/context.ts` on disk. */ function sourceFor(pkgDir, distPath) { const rel = distPath.replace(/^\.\/dist\//, "").replace(/\.js$/, ".ts"); const file = resolve(ROOT, pkgDir, "src", rel); return existsSync(file) ? file : undefined; } function expand(pkgDir, entry, target) { if (!entry.includes("*")) return [[entry, target]]; const dir = resolve(ROOT, pkgDir, "src", dirname(target.replace(/^\.\/dist\//, ""))); if (!existsSync(dir)) return []; return readdirSync(dir) .filter((name) => name.endsWith(".ts")) .map((name) => [entry.replace("*", name.replace(/\.ts$/, "")), target.replace("*", name.replace(/\.ts$/, ""))]); } let failures = 0; for (const [pkgDir, budgets] of Object.entries(BUDGETS)) { const manifest = JSON.parse(readFileSync(resolve(ROOT, pkgDir, "package.json"), "utf8")); for (const [entry, budget] of Object.entries(budgets)) { const declared = manifest.exports?.[entry]; if (!declared) { console.error(`${pkgDir} declares no export "${entry}" but a budget exists for it`); failures += 1; continue; } const target = typeof declared === "string" ? declared : declared.import; for (const [name, distPath] of expand(pkgDir, entry, target)) { const source = sourceFor(pkgDir, distPath);
  ```

核验：`v1.4.0`

### E133

证据：`../../packages/durable/package.json#L8-L69`

- [`packages/durable/package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/durable/package.json) — text: `"exports": { ".": { "source": "./src/index.ts", "types": "./dist/index.d.ts", "import": "./dist/index.js", "default": ".`，提示行 8

  ```text
  "exports": { ".": { "source": "./src/index.ts", "types": "./dist/index.d.ts", "import": "./dist/index.js", "default": "./dist/index.js" }, "./env": { "source": "./src/env/index.ts", "types": "./dist/env/index.d.ts", "import": "./dist/env/index.js", "default": "./dist/env/index.js" }, "./env/node": { "source": "./src/env/node.ts", "types": "./dist/env/node.d.ts", "import": "./dist/env/node.js", "default": "./dist/env/node.js" }, "./codemode": { "source": "./src/codemode/index.ts", "types": "./dist/codemode/index.d.ts", "import": "./dist/codemode/index.js", "default": "./dist/codemode/index.js" }, "./tool-search": { "source": "./src/tool-search/index.ts", "types": "./dist/tool-search/index.d.ts", "import": "./dist/tool-search/index.js", "default": "./dist/tool-search/index.js" }, "./tools": { "source": "./src/tools/index.ts", "types": "./dist/tools/index.d.ts", "import": "./dist/tools/index.js", "default": "./dist/tools/index.js" }, "./images": { "source": "./src/images/index.ts", "types": "./dist/images/index.d.ts", "import": "./dist/images/index.js", "default": "./dist/images/index.js" }, "./images/node": { "source": "./src/images/node.ts", "types": "./dist/images/node.d.ts", "import": "./dist/images/node.js", "default": "./dist/images/node.js" }, "./images/cloudflare": { "source": "./src/images/cloudflare.ts", "types": "./dist/images/cloudflare.d.ts", "import": "./dist/images/cloudflare.js", "default": "./dist/images/cloudflare.js" }, "./storage/memory": { "source": "./src/storage/memory.ts", "types": "./dist/storage/memory.d.ts", "import": "./dist/storage/memory.js", "default": "./dist/storage/memory.js" }, "./storage/indexeddb": {
  ```

核验：`v1.4.0`

### E134

证据：`../../packages/chord/package.json#L8-L34`

- [`packages/chord/package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/chord/package.json) — text: `"exports": { ".": { "source": "./src/index.ts", "types": "./dist/index.d.ts", "import": "./dist/index.js" }, "./context"`，提示行 8

  ```text
  "exports": { ".": { "source": "./src/index.ts", "types": "./dist/index.d.ts", "import": "./dist/index.js" }, "./context": { "source": "./src/context/index.ts", "types": "./dist/context/index.d.ts", "import": "./dist/context/index.js" }, "./output": { "source": "./src/output.ts", "types": "./dist/output.d.ts", "import": "./dist/output.js" }, "./delta": { "source": "./src/delta/index.ts", "types": "./dist/delta/index.d.ts", "import": "./dist/delta/index.js" }, "./node": { "source": "./src/node.ts", "types": "./dist/node.d.ts", "import": "./dist/node.js" }, "./telemetry-sqlite": {
  ```

核验：`v1.4.0`

### E135

证据：`../../packages/durable/test/storage-runtime-boundary.test.ts#L25-L47`

- [`packages/durable/test/storage-runtime-boundary.test.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/durable/test/storage-runtime-boundary.test.ts) — text: `describe("durable storage runtime boundaries", () => { it("keeps the package root limited to portable core storage", asy`，提示行 25

  ```text
  describe("durable storage runtime boundaries", () => { it("keeps the package root limited to portable core storage", async () => { const graph = await sourceGraph("index.ts"); expect([...graph].some((path) => path.includes("/env/"))).toBe(false); expect([...graph].some((path) => path.includes("/storage/jsonl/"))).toBe(false); expect([...graph].some((path) => path.includes("/storage/sqlite/"))).toBe(false); }); it("keeps the portable SQLite subpath free of Node imports", async () => { const graph = await sourceGraph("storage/sqlite/index.ts"); expect([...graph].some((path) => path.endsWith("/storage/sqlite/node.ts"))).toBe(false); }); it("keeps the portable environment subpath free of Node imports", async () => { const graph = await sourceGraph("env/index.ts"); expect([...graph].some((path) => path.endsWith("/env/node.ts"))).toBe(false); }); it("keeps the portable JSONL subpath free of Node imports", async () => { const graph = await sourceGraph("storage/jsonl/index.ts"); expect([...graph].some((path) => path.endsWith("/storage/jsonl/node.ts"))).toBe(false); expect([...graph].some((path) => path.endsWith("/env/node.ts"))).toBe(false); });
  ```

核验：`v1.4.0`

### E136

证据：browser smoke：durable 与选择性 provider

- [`scripts/check-browser-smoke.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-browser-smoke.mjs) — text: `const durableBuild = await build({ entryPoints: ［"scripts/durable-browser-smoke-entry.ts"］, bundle: true, platform: "bro`，提示行 55

  ```text
  const durableBuild = await build({ entryPoints: ["scripts/durable-browser-smoke-entry.ts"], bundle: true, platform: "browser", format: "esm", logLevel: "silent", metafile: true, outfile: durableOutputPath, write: false, }); const durableInputs = durableBuild.metafile.inputs; for (const expectedInput of [ "packages/durable/src/index.ts", "packages/durable/src/env/index.ts", "packages/durable/src/storage/jsonl/index.ts", "packages/durable/src/storage/jsonl/storage.ts", "packages/durable/src/storage/memory.ts", "packages/durable/src/storage/sqlite/index.ts", "packages/durable/src/storage/sqlite/storage.ts", ]) { if (!findInput(durableInputs, expectedInput)) { throw new Error(`Durable browser bundle does not include ${expectedInput}`); } } for (const forbiddenInput of [ "packages/durable/src/env/node.ts", "packages/durable/src/storage/jsonl/node.ts", "packages/durable/src/storage/sqlite/node.ts", ]) { const nodeAdapter = findInput(durableInputs, forbiddenInput); if (nodeAdapter) throw new Error(`Durable browser bundle unexpectedly includes ${nodeAdapter}`); } const agentTreeshakeBuild = await build({ entryPoints: ["scripts/agent-treeshake-smoke-entry.ts"], bundle: true, platform: "browser", format: "esm", logLevel: "silent", metafile: true, outfile: agentTreeshakeOutputPath, plugins: [generatedCatalogDataPlugin], write: false, }); const inputs = agentTreeshakeBuild.metafile.inputs; for (const forbiddenInput of [ "packages/ai/src/compat.ts", "packages/ai/src/models.generated.ts", "packages/ai/src/providers/all.ts", ]) { const includedInput = findInput(inputs, forbiddenInput); if (includedInput) { throw new Error(`Agent selective-provider bundle unexpectedly includes ${includedInput}`); } } const contributingInputs = new Set( Object.values(agentTreeshakeBuild.metafile.outputs).flatMap((output) => Object.entries(output.inputs) .filter(([, contribution]) => contribution.bytesInOutput > 0) .map(([input]) => input), ), ); const catalogInputs = Array.from(contributingInputs).filter((input) => normalizePath(input).includes("packages/ai/src/providers/data/"), ); if (catalogInputs.length !== 1 || !normalizePath(catalogInputs[0]).endsWith("/anthropic.json")) { throw new Error( `Agent selective-provider bundle catalogs: expected only anthropic.json, found ${catalogInputs.join(", ") || "none"}`, ); }
  ```

核验：`v1.4.0`

### E137

证据：`../../scripts/durable-browser-smoke-entry.ts#L1-L8`

- [`scripts/durable-browser-smoke-entry.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/durable-browser-smoke-entry.ts) — text: `import * as durable from "@earendil-works/pi-durable"; import * as environment from "@earendil-works/pi-durable/env"; im`，提示行 1

  ```text
  import * as durable from "@earendil-works/pi-durable"; import * as environment from "@earendil-works/pi-durable/env"; import * as jsonl from "@earendil-works/pi-durable/storage/jsonl"; import * as sqlite from "@earendil-works/pi-durable/storage/sqlite"; // Keep runtime-neutral public entry points live so the browser smoke build // catches accidental imports of Node-only adapters or built-ins. console.log(Object.keys(durable), Object.keys(environment), Object.keys(jsonl), Object.keys(sqlite));
  ```

核验：`v1.4.0`

### E138

证据：`../../scripts/agent-treeshake-smoke-entry.ts#L1-L13`

- [`scripts/agent-treeshake-smoke-entry.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/agent-treeshake-smoke-entry.ts) — text: `import { Agent } from "@earendil-works/pi-agent-core"; import { createModels } from "@earendil-works/pi-ai"; import { an`，提示行 1

  ```text
  import { Agent } from "@earendil-works/pi-agent-core"; import { createModels } from "@earendil-works/pi-ai"; import { anthropicProvider } from "@earendil-works/pi-ai/providers/anthropic"; const models = createModels(); models.setProvider(anthropicProvider()); const model = models.getModel("anthropic", "claude-sonnet-4-5"); if (!model) throw new Error("Anthropic smoke-test model not found"); export const agent = new Agent({ initialState: { model }, streamFn: models.streamSimple.bind(models), });
  ```

核验：`v1.4.0`

### E139

证据：`../../scripts/check-runtime-deps.mjs#L26-L43`

- [`scripts/check-runtime-deps.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-runtime-deps.mjs) — text: `function checkSource(source, manifest) { const file = source.fileName; const declared = new Set(［ manifest.name, ...Obje`，提示行 26

  ```text
  function checkSource(source, manifest) { const file = source.fileName; const declared = new Set([ manifest.name, ...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.optionalDependencies ?? {}), ...Object.keys(manifest.peerDependencies ?? {}), ]); function checkSpecifier(node) { if (!node || !(isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node))) return; const specifier = node.text; // `cloudflare:` modules are built into the Workers runtime, like `node:` modules are into Node. if ( specifier.startsWith(".") || specifier.startsWith("/") || specifier.startsWith("cloudflare:") || isBuiltin(specifier)
  ```

核验：`v1.4.0`

### E140

证据：`../../scripts/check-runtime-deps.mjs#L45-L80`

- [`scripts/check-runtime-deps.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-runtime-deps.mjs) — text: `return; } const name = specifier.split("/").slice(0, specifier.startsWith("@") ? 2 : 1).join("/"); if (declared.has(name`，提示行 45

  ```text
  return; } const name = specifier.split("/").slice(0, specifier.startsWith("@") ? 2 : 1).join("/"); if (declared.has(name)) return; const { line } = source.getLineAndCharacterOfPosition(node.getStart(source)); failures.push(`${file}:${line + 1}: ${specifier} is not declared in ${manifest.name}'s runtime dependencies`); } function visit(node) { if (isImportDeclaration(node)) { const clause = node.importClause; const bindings = clause?.namedBindings; if ( !clause || (clause.phaseModifier !== SyntaxKind.TypeKeyword && (clause.name || !bindings || !isNamedImports(bindings) || bindings.elements.length === 0 || bindings.elements.some((element) => !element.isTypeOnly))) ) { checkSpecifier(node.moduleSpecifier); } } else if (isExportDeclaration(node) && !node.isTypeOnly) { const clause = node.exportClause; if ( !clause || !isNamedExports(clause) || clause.elements.length === 0 || clause.elements.some((element) => !element.isTypeOnly) ) { checkSpecifier(node.moduleSpecifier); } } else if ( isCallExpression(node) && (node.expression.kind === SyntaxKind.ImportKeyword ||
  ```

核验：`v1.4.0`

### E141

证据：`../../scripts/check-runtime-deps.mjs#L105-L123`

- [`scripts/check-runtime-deps.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-runtime-deps.mjs) — text: `); const api = new API({ cwd: process.cwd(), fs: { fileExists: (fileName) => (fallbackConfigs.has(resolve(fileName)) ? t`，提示行 105

  ```text
  ); const api = new API({ cwd: process.cwd(), fs: { fileExists: (fileName) => (fallbackConfigs.has(resolve(fileName)) ? true : undefined), readFile: (fileName) => (fallbackConfigs.has(resolve(fileName)) ? fallbackConfig : undefined), }, }); try { const snapshot = api.updateSnapshot({ openProjects: packages.map(({ configPath }) => configPath) }); for (const { sourceDirectory, manifest, configPath } of packages) { const project = snapshot.getProject(configPath); const diagnostics = project.program.getConfigFileParsingDiagnostics(); if (diagnostics.length > 0) throw new Error(diagnostics.map((diagnostic) => diagnostic.text).join("\n")); const roots = new Set(project.rootFiles.map((file) => resolve(file))); for (const fileName of project.program.getSourceFileNames()) { if (fileName.endsWith(".d.ts") || fileName.endsWith(".json")) continue; const path = relative(sourceDirectory, resolve(fileName)); if (path.startsWith("..") || isAbsolute(path)) continue;
  ```

核验：`v1.4.0`

### E142

证据：`../../scripts/check-runtime-deps.test.mjs#L27-L34`

- [`scripts/check-runtime-deps.test.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-runtime-deps.test.mjs) — text: `// #9132: workspace resolution and installing every release package masked a missing runtime dependency. test("rejects u`，提示行 27

  ```text
  // #9132: workspace resolution and installing every release package masked a missing runtime dependency. test("rejects undeclared imports even when the workspace package exists", async (t) => { const result = await check(t, {}, 'export { createUnixServer } from "@earendil-works/pi-server/unix";', { "packages/server/package.json": JSON.stringify({ name: "@earendil-works/pi-server", version: "1.0.0" }), }); assert.equal(result.status, 1); assert.match(result.stderr, /src[\\/]index\.ts:1: @earendil-works\/pi-server\/unix is not declared/); });
  ```

核验：`v1.4.0`

### E143

证据：`../../scripts/check-runtime-deps.test.mjs#L57-L71`

- [`scripts/check-runtime-deps.test.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-runtime-deps.test.mjs) — text: `test("rejects dev-only dependencies, side-effect imports, mixed exports, and literal runtime loads", async (t) => { cons`，提示行 57

  ```text
  test("rejects dev-only dependencies, side-effect imports, mixed exports, and literal runtime loads", async (t) => { const result = await check(t, { devDependencies: { dev: "1.0.0" } }, ` import "dev"; import {} from "empty-import"; export {} from "empty-export"; export { type T, value } from "mixed-export"; const lazy = () => import("lazy/subpath"); const required = require("required"); const resolved = require.resolve("resolved/subpath"); `); assert.equal(result.status, 1); for (const name of ["dev", "empty-import", "empty-export", "mixed-export", "lazy/subpath", "required", "resolved/subpath"]) { assert.ok(result.stderr.includes(`${name} is not declared`), result.stderr); } });
  ```

核验：`v1.4.0`

### E144

证据：`../../scripts/check-runtime-deps.test.mjs#L89-L100`

- [`scripts/check-runtime-deps.test.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-runtime-deps.test.mjs) — text: `// #9132: an experimental flag cannot prevent module resolution through a public entrypoint. for (const statement of ［'e`，提示行 89

  ```text
  // #9132: an experimental flag cannot prevent module resolution through a public entrypoint. for (const statement of ['export * from "./experimental/server";', 'import type { Options } from "./experimental/server";']) { test(`rejects excluded code reachable through ${statement}`, async (t) => { const result = await check(t, { devDependencies: { server: "1.0.0" } }, statement, { "packages/example/tsconfig.build.json": JSON.stringify({ include: ["src/**/*.ts"], exclude: ["src/experimental"] }), "packages/example/src/experimental/server.ts": 'import "server"; export interface Options {}', }); assert.equal(result.status, 1); assert.match(result.stderr, /is excluded from example's build but imported by it/); assert.match(result.stderr, /server is not declared/); }); }
  ```

核验：`v1.4.0`

### E145

证据：`../../scripts/check-runtime-deps.test.mjs#L73-L87`

- [`scripts/check-runtime-deps.test.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-runtime-deps.test.mjs) — text: `test("allows imported JSON assets outside the TypeScript include pattern", async (t) => { const result = await check(t, `，提示行 73

  ```text
  test("allows imported JSON assets outside the TypeScript include pattern", async (t) => { const result = await check(t, {}, 'import data from "./data.json";', { "packages/example/tsconfig.build.json": JSON.stringify({ include: ["src/**/*.ts"], compilerOptions: { resolveJsonModule: true } }), "packages/example/src/data.json": "{}", }); assert.equal(result.status, 0, result.stderr); }); test("permits dev-only dependencies in sources excluded from the published build", async (t) => { const result = await check(t, { devDependencies: { server: "1.0.0" } }, "", { "packages/example/tsconfig.build.json": JSON.stringify({ include: ["src/**/*.ts"], exclude: ["src/experimental"] }), "packages/example/src/experimental/server.ts": 'import "server";', }); assert.equal(result.status, 0, result.stderr); });
  ```

核验：`v1.4.0`

### E146

证据：`../../packages/agent/src/types.ts#L193-L224`

- [`packages/agent/src/types.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/agent/src/types.ts) — text: `export interface AgentLoopConfig extends SimpleStreamOptions { model: Model<any>; /** * Converts AgentMessage［］ to LLM-c`，提示行 193

  ```text
  export interface AgentLoopConfig extends SimpleStreamOptions { model: Model<any>; /** * Converts AgentMessage[] to LLM-compatible Message[] before each LLM call. * * Each AgentMessage must be converted to a SystemMessage, UserMessage, AssistantMessage, or ToolResultMessage * that the LLM can understand. AgentMessages that cannot be converted (e.g., UI-only notifications, * status messages) should be filtered out. * * Contract: must not throw or reject. Return a safe fallback value instead. * Throwing interrupts the low-level agent loop without producing a normal event sequence. * * @example * '''typescript * convertToLlm: (messages) => messages.flatMap(m => { * if (m.role === "custom") { * // Convert custom message to user message * return [{ role: "user", content: m.content, timestamp: m.timestamp }]; * } * if (m.role === "notification") { * // Filter out UI-only messages * return []; * } * // Pass through standard LLM messages * return [m]; * }) * ''' */ convertToLlm: (messages: AgentMessage[]) => Message[] | Promise<Message[]>; /**
  ```

核验：`v1.4.0`

### E147

证据：`../../packages/agent/src/agent-loop.ts#L377-L407`

- [`packages/agent/src/agent-loop.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/agent/src/agent-loop.ts) — text: `function withToolChanges(message: SystemMessage, { toolsAdded, toolsRemoved }: ToolStateChanges): SystemMessage { const `，提示行 377

  ```text
  function withToolChanges(message: SystemMessage, { toolsAdded, toolsRemoved }: ToolStateChanges): SystemMessage { const { toolsAdded: _added, toolsRemoved: _removed, ...rest } = message; return { ...rest, ...(toolsAdded.length > 0 ? { toolsAdded } : {}), ...(toolsRemoved.length > 0 ? { toolsRemoved } : {}), }; } /** * Stream an assistant response from the LLM. * This is where AgentMessage[] gets transformed to Message[] for the LLM. */ async function streamAssistantResponse( context: AgentContext, config: AgentLoopConfig, signal: AbortSignal | undefined, emit: AgentEventSink, streamFunction: StreamFn, ): Promise<AssistantMessage> { // Apply context transform if configured (AgentMessage[] → AgentMessage[]) let messages = context.messages; if (config.transformContext) { messages = await config.transformContext(messages, signal); } // Convert to LLM-compatible messages (AgentMessage[] → Message[]) const llmMessages = await config.convertToLlm(messages); const llmContext = normalizeContext({ messages: llmMessages });
  ```

核验：`v1.4.0`

### E148

证据：`../../packages/ai/src/types.ts#L728-L751`

- [`packages/ai/src/types.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/src/types.ts) — text: `provider: ProviderId; model: string; answers: Record<string, ClassifierAnswer>; /** Token usage and its cost at the mode`，提示行 728

  ```text
  provider: ProviderId; model: string; answers: Record<string, ClassifierAnswer>; /** Token usage and its cost at the model's catalog price, when the service reports token counts. */ usage?: Usage; stopReason: ClassifierStopReason; errorMessage?: string; timestamp: number; // Unix timestamp in milliseconds } import type { TSchema } from "typebox"; /** OpenAI grammar variants for constrained sampling. */ export type GrammarFormat = "openai_lark" | "openai_regex"; export type GrammarVariants = Partial<Record<GrammarFormat, string>>; /** * Optional provider-side constrained sampling configs for a tool. * * The `json_schema` value roughly maps to the concept of `strict` in APIs which is * implemented as json-schema constrained sampling by APIs. Grammar variants let * callers provide provider-specific encodings of the same intended language. */
  ```

核验：`v1.4.0`

### E149

证据：`../../packages/ai/src/utils/transcript.ts#L25-L33`

- [`packages/ai/src/utils/transcript.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/src/utils/transcript.ts) — text: `/** * Fold `Context.systemPrompt` and `Context.tools` into a leading system message. * This is the only entry point that`，提示行 25

  ```text
  /** * Fold `Context.systemPrompt` and `Context.tools` into a leading system message. * This is the only entry point that produces a {@link TranscriptContext}; every * provider-facing function expects the result. */ export function normalizeContext(context: Context): TranscriptContext { const initialMessage = createInitialSystemMessage(context.systemPrompt, context.tools); const messages = initialMessage ? [initialMessage, ...context.messages] : context.messages; return { messages } as TranscriptContext;
  ```

核验：`v1.4.0`

### E150

证据：`../../packages/ai/src/utils/transcript.ts#L57-L65`

- [`packages/ai/src/utils/transcript.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/src/utils/transcript.ts) — text: `/** Resolve the tools available after applying every transcript delta in order. */ export function getCurrentTools(messa`，提示行 57

  ```text
  /** Resolve the tools available after applying every transcript delta in order. */ export function getCurrentTools(messages: TranscriptMessages): Tool[] { const tools = new Map<string, Tool>(); for (const message of messages) { if (!isSystemMessage(message)) continue; for (const tool of message.toolsRemoved ?? []) tools.delete(tool.name); for (const tool of message.toolsAdded ?? []) tools.set(tool.name, tool); } return [...tools.values()];
  ```

核验：`v1.4.0`

### E151

证据：`../../packages/ai/src/utils/transcript.ts#L68-L120`

- [`packages/ai/src/utils/transcript.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/src/utils/transcript.ts) — text: `/** * Replay every system message into one leading system message holding the current * prompt and tools. Later `content`，提示行 68

  ```text
  /** * Replay every system message into one leading system message holding the current * prompt and tools. Later `content` is appended to the base prompt, `sections` are * patched by name, and tools are resolved with {@link getCurrentTools}. */ export function getCurrentSystemMessage(messages: TranscriptMessages): SystemMessage | undefined { const content: string[] = []; const sections = new Map<string, string>(); let timestamp: number | undefined; for (const message of messages) { if (!isSystemMessage(message)) continue; timestamp ??= message.timestamp; const text = contentText(message.content); if (text.length > 0) content.push(text); for (const [name, value] of Object.entries(message.sections ?? {})) { if (value === null) sections.delete(name); else sections.set(name, value); } } const tools = getCurrentTools(messages); if (timestamp === undefined && tools.length === 0) return undefined; return { role: "system", content: content.join("\n\n"), ...(sections.size > 0 ? { sections: Object.fromEntries(sections) } : {}), ...(tools.length > 0 ? { toolsAdded: tools } : {}), timestamp: timestamp ?? 0, }; } /** Render the current system prompt text after replaying every system message. */ export function getCurrentSystemPrompt(messages: TranscriptMessages): string { const message = getCurrentSystemMessage(messages); return message ? getSystemMessageText(message) : ""; } /** * Rebuild the transcript for APIs without mid-conversation system messages: the replayed * system message leads, and every later system message is dropped. */ export function collapseSystemMessages(context: TranscriptContext): TranscriptContext { const head = getCurrentSystemMessage(context.messages); const messages = context.messages.filter((message) => message.role !== "system"); return { messages: head ? [head, ...messages] : messages } as TranscriptContext; } /** Keep later system messages in place when the model accepts them; otherwise collapse them. */ export function resolveTranscript( context: TranscriptContext, supportsMidConvoSystemMessages: boolean | undefined, ): TranscriptContext { return supportsMidConvoSystemMessages ? context : collapseSystemMessages(context); }
  ```

核验：`v1.4.0`

### E152

证据：`../../packages/ai/src/api/transform-messages.ts#L59-L74`

- [`packages/ai/src/api/transform-messages.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/src/api/transform-messages.ts) — text: `return result; } function downgradeUnsupportedImages<TApi extends Api>(messages: Message［］, model: Model<TApi>): Message`，提示行 59

  ```text
  return result; } function downgradeUnsupportedImages<TApi extends Api>(messages: Message[], model: Model<TApi>): Message[] { if (model.input.includes("image")) { return messages; } return messages.map((msg) => { if (msg.role === "user" && Array.isArray(msg.content)) { return { ...msg, content: replaceImagesWithPlaceholder(msg.content, NON_VISION_USER_IMAGE_PLACEHOLDER), }; }
  ```

核验：`v1.4.0`

### E153

证据：`../../packages/ai/src/api/transform-messages.ts#L92-L145`

- [`packages/ai/src/api/transform-messages.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/src/api/transform-messages.ts) — text: `messages: Message［］, model: Model<TApi>, normalizeToolCallId?: (id: string, model: Model<TApi>, source: AssistantMessage`，提示行 92

  ```text
  messages: Message[], model: Model<TApi>, normalizeToolCallId?: (id: string, model: Model<TApi>, source: AssistantMessage) => string, ): Message[] { // Build a map of original tool call IDs to normalized IDs const toolCallIdMap = new Map<string, string>(); // Normalize null/undefined content from untyped callers (custom tools, hand-built // histories, old session files) so downstream code can rely on the type contract. const normalizedMessages = messages.map((msg) => (msg.content == null ? { ...msg, content: [] } : msg)); const imageAwareMessages = downgradeUnsupportedImages(normalizedMessages, model); // First pass: transform messages (unsupported image downgrade, thinking blocks, tool call ID normalization) const transformed = imageAwareMessages.map((msg) => { // System and user messages pass through unchanged if (msg.role === "system" || msg.role === "user") { return msg; } // Handle toolResult messages - normalize toolCallId if we have a mapping if (msg.role === "toolResult") { const normalizedId = toolCallIdMap.get(msg.toolCallId); if (normalizedId && normalizedId !== msg.toolCallId) { return { ...msg, toolCallId: normalizedId }; } return msg; } // Assistant messages need transformation check if (msg.role === "assistant") { const assistantMsg = msg as AssistantMessage; const isSameModel = assistantMsg.provider === model.provider && assistantMsg.api === model.api && assistantMsg.model === model.id; const transformedContent = assistantMsg.content.flatMap((block) => { if (block.type === "thinking") { // Thinking from another model is dropped. Signatures and encrypted reasoning are // only valid for the model that produced them, and sending readable thinking as // plain text makes the new model treat it as part of the visible reply. if (!isSameModel) return []; // Keep redacted and signed blocks even if the thinking text is empty // (OpenAI encrypted reasoning); they are needed for replay. if (block.redacted || block.thinkingSignature) return block; if (!block.thinking || block.thinking.trim() === "") return []; return block; } if (block.type === "text") { if (isSameModel) return block; return { type: "text" as const, text: block.text, };
  ```

核验：`v1.4.0`

### E154

证据：`../../packages/ai/test/transform-messages-copilot-openai-to-anthropic.test.ts#L49-L88`

- [`packages/ai/test/transform-messages-copilot-openai-to-anthropic.test.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/test/transform-messages-copilot-openai-to-anthropic.test.ts) — text: `describe("OpenAI to Anthropic session migration for Copilot Claude", () => { it("removes thoughtSignature from tool call`，提示行 49

  ```text
  describe("OpenAI to Anthropic session migration for Copilot Claude", () => { it("removes thoughtSignature from tool calls when migrating between models", () => { const model = makeCopilotClaudeModel(); const messages: Message[] = [ { role: "user", content: "run a command", timestamp: Date.now() }, { role: "assistant", content: [ { type: "toolCall", id: "call_123", name: "bash", arguments: { command: "ls" }, thoughtSignature: JSON.stringify({ type: "reasoning.encrypted", id: "call_123", data: "encrypted" }), }, ], api: "openai-responses", provider: "github-copilot", model: "gpt-5", usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }, }, stopReason: "toolUse", timestamp: Date.now(), }, { role: "toolResult", toolCallId: "call_123", toolName: "bash", content: [{ type: "text", text: "output" }], isError: false, timestamp: Date.now(), }, ];
  ```

核验：`v1.4.0`

### E155

证据：`../../packages/ai/test/transform-messages-copilot-openai-to-anthropic.test.ts#L96-L151`

- [`packages/ai/test/transform-messages-copilot-openai-to-anthropic.test.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/test/transform-messages-copilot-openai-to-anthropic.test.ts) — text: `it("adds synthetic tool results for trailing orphaned tool calls", () => { const model = makeCopilotClaudeModel(); const`，提示行 96

  ```text
  it("adds synthetic tool results for trailing orphaned tool calls", () => { const model = makeCopilotClaudeModel(); const messages: Message[] = [ { role: "user", content: "read the file", timestamp: Date.now() }, makeAssistantMessage([ { type: "toolCall", id: "call_123|fc_123", name: "read", arguments: { path: "README.md" }, }, ]), ]; const result = transformMessages(messages, model, anthropicNormalizeToolCallId); const lastMessage = result[result.length - 1]; expect(lastMessage).toMatchObject({ role: "toolResult", toolCallId: "call_123_fc_123", toolName: "read", isError: true, content: [{ type: "text", text: "No result provided" }], }); }); it("adds synthetic results only for trailing tool calls that are still missing results", () => { const model = makeCopilotClaudeModel(); const messages: Message[] = [ { role: "user", content: "run commands", timestamp: Date.now() }, makeAssistantMessage([ { type: "toolCall", id: "call_1|fc_1", name: "read", arguments: { path: "README.md" } }, { type: "toolCall", id: "call_2|fc_2", name: "bash", arguments: { command: "pwd" } }, ]), { role: "toolResult", toolCallId: "call_1|fc_1", toolName: "read", content: [{ type: "text", text: "done" }], isError: false, timestamp: Date.now(), }, ]; const result = transformMessages(messages, model, anthropicNormalizeToolCallId); const syntheticResults = result.filter((message) => message.role === "toolResult" && message.isError); expect(syntheticResults).toHaveLength(1); expect(syntheticResults[0]).toMatchObject({ role: "toolResult", toolCallId: "call_2_fc_2", toolName: "bash", content: [{ type: "text", text: "No result provided" }], }); }); });
  ```

核验：`v1.4.0`

### E156

证据：`../../packages/agent/src/agent-loop.ts#L707-L776`

- [`packages/agent/src/agent-loop.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/agent/src/agent-loop.ts) — text: `} const preparedArguments = tool.prepareArguments(toolCall.arguments); if (preparedArguments === toolCall.arguments) { r`，提示行 707

  ```text
  } const preparedArguments = tool.prepareArguments(toolCall.arguments); if (preparedArguments === toolCall.arguments) { return toolCall; } return { ...toolCall, arguments: preparedArguments as Record<string, any>, }; } async function prepareToolCall( currentContext: AgentContext, assistantMessage: AssistantMessage, toolCall: AgentToolCall, config: ToolCallHooks, signal: AbortSignal | undefined, tools: readonly AgentTool<any>[] = currentContext.tools ?? [], ): Promise<PreparedToolCall | ImmediateToolCallOutcome> { const tool = tools.find((t) => t.name === toolCall.name); if (!tool) { return { kind: "immediate", result: createErrorToolResult(`Tool ${toolCall.name} not found`), isError: true, }; } try { const preparedToolCall = prepareToolCallArguments(tool, toolCall); const validatedArgs = validateToolArguments(tool, preparedToolCall); if (config.beforeToolCall) { const beforeResult = await config.beforeToolCall( { assistantMessage, toolCall, args: validatedArgs, context: currentContext, }, signal, ); if (signal?.aborted) { return { kind: "immediate", result: createErrorToolResult("Operation aborted"), isError: true, }; } if (beforeResult?.block) { const result = createErrorToolResult(beforeResult.reason || "Tool execution was blocked"); if (beforeResult.terminate === true) { result.terminate = true; } return { kind: "immediate", result, isError: true, }; } } if (signal?.aborted) { return { kind: "immediate", result: createErrorToolResult("Operation aborted"), isError: true, }; } return { kind: "prepared", toolCall,
  ```

核验：`v1.4.0`

### E157

证据：`../../packages/agent/src/agent-loop.ts#L820-L940`

- [`packages/agent/src/agent-loop.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/agent/src/agent-loop.ts) — text: `*/ export async function runToolCall(toolCall: AgentToolCall, options: RunToolCallOptions): Promise<AgentToolCallOutcome`，提示行 820

  ```text
  */ export async function runToolCall(toolCall: AgentToolCall, options: RunToolCallOptions): Promise<AgentToolCallOutcome> { const { assistantMessage, context, signal } = options; const preparation = await prepareToolCall(context, assistantMessage, toolCall, options, signal, options.tools); if (preparation.kind === "immediate") { return { toolCall, result: preparation.result, isError: preparation.isError }; } const executed = await executePreparedToolCall(preparation, signal, options.onUpdate ?? (() => {})); return finalizeExecutedToolCall(context, assistantMessage, preparation, executed, options, signal); } async function executePreparedToolCall( prepared: PreparedToolCall, signal: AbortSignal | undefined, onUpdate: ToolUpdateSink, ): Promise<ExecutedToolCallOutcome> { const updateEvents: Promise<void>[] = []; let acceptingUpdates = true; const startedAt = performance.now(); const elapsed = () => Math.round(performance.now() - startedAt); try { const result = await prepared.tool.execute( prepared.toolCall.id, prepared.args as never, signal, (partialResult) => { if (!acceptingUpdates) return; updateEvents.push(Promise.resolve(onUpdate(partialResult))); }, ); const durationMs = elapsed(); acceptingUpdates = false; await Promise.all(updateEvents); return { result, isError: result.isError === true, durationMs }; } catch (error) { const durationMs = elapsed(); acceptingUpdates = false; await Promise.all(updateEvents); return { result: createErrorToolResult(error instanceof Error ? error.message : String(error)), isError: true, durationMs, }; } finally { acceptingUpdates = false; } } async function finalizeExecutedToolCall( currentContext: AgentContext, assistantMessage: AssistantMessage, prepared: PreparedToolCall, executed: ExecutedToolCallOutcome, config: ToolCallHooks, signal: AbortSignal | undefined, ): Promise<FinalizedToolCallOutcome> { let result = executed.result; let isError = executed.isError; if (config.afterToolCall) { try { const afterResult = await config.afterToolCall( { assistantMessage, toolCall: prepared.toolCall, args: prepared.args, result, isError, context: currentContext, }, signal, ); if (afterResult) { // Structured content not replaced along with the content may no longer match it. const structuredContent = afterResult.structuredContent ?? (afterResult.content ? undefined : result.structuredContent); result = { ...result, content: afterResult.content ?? result.content, details: afterResult.details ?? result.details, usage: afterResult.usage ?? result.usage, terminate: afterResult.terminate ?? result.terminate, }; if (structuredContent === undefined) delete result.structuredContent; else result.structuredContent = structuredContent; isError = afterResult.isError ?? isError; } } catch (error) { result = createErrorToolResult(error instanceof Error ? error.message : String(error)); isError = true; } } return { toolCall: prepared.toolCall, result, isError, durationMs: executed.durationMs, }; } function createErrorToolResult(message: string): AgentToolResult<any> { return { content: [{ type: "text", text: message }], details: {}, }; } async function emitToolExecutionEnd(finalized: FinalizedToolCallOutcome, emit: AgentEventSink): Promise<void> { await emit({ type: "tool_execution_end", toolCallId: finalized.toolCall.id, toolName: finalized.toolCall.name, result: finalized.result, isError: finalized.isError, ...(finalized.durationMs === undefined ? {} : { durationMs: finalized.durationMs }), }); } function createToolResultMessage(finalized: FinalizedToolCallOutcome): ToolResultMessage {
  ```

核验：`v1.4.0`

### E158

证据：`../../packages/agent/src/agent-loop.ts#L586-L659`

- [`packages/agent/src/agent-loop.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/agent/src/agent-loop.ts) — text: `break; } } return { messages, terminate: shouldTerminateToolBatch(finalizedCalls), }; } async function executeToolCallsP`，提示行 586

  ```text
  break; } } return { messages, terminate: shouldTerminateToolBatch(finalizedCalls), }; } async function executeToolCallsParallel( currentContext: AgentContext, assistantMessage: AssistantMessage, toolCalls: AgentToolCall[], config: AgentLoopConfig, signal: AbortSignal | undefined, emit: AgentEventSink, ): Promise<ExecutedToolCallBatch> { const finalizedCalls: FinalizedToolCallEntry[] = []; for (const toolCall of toolCalls) { await emit({ type: "tool_execution_start", toolCallId: toolCall.id, toolName: toolCall.name, args: toolCall.arguments, }); const preparation = await prepareToolCall(currentContext, assistantMessage, toolCall, config, signal); if (preparation.kind === "immediate") { const finalized = { toolCall, result: preparation.result, isError: preparation.isError, } satisfies FinalizedToolCallOutcome; await emitToolExecutionEnd(finalized, emit); finalizedCalls.push(finalized); if (signal?.aborted) { break; } continue; } finalizedCalls.push(async () => { if (signal?.aborted) { const finalized = { toolCall, result: createErrorToolResult("Operation aborted"), isError: true, } satisfies FinalizedToolCallOutcome; await emitToolExecutionEnd(finalized, emit); return finalized; } const executed = await executePreparedToolCall(preparation, signal, emitToolExecutionUpdate(toolCall, emit)); const finalized = await finalizeExecutedToolCall( currentContext, assistantMessage, preparation, executed, config, signal, ); await emitToolExecutionEnd(finalized, emit); return finalized; }); if (signal?.aborted) { break; } } const orderedFinalizedCalls = await Promise.all( finalizedCalls.map((entry) => (typeof entry === "function" ? entry() : Promise.resolve(entry))), ); const messages: ToolResultMessage[] = [];
  ```

核验：`v1.4.0`

### E159

证据：`../../packages/agent/test/agent-loop.test.ts#L627-L719`

- [`packages/agent/test/agent-loop.test.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/agent/test/agent-loop.test.ts) — text: `const userPrompt: AgentMessage = createUserMessage("edit something"); const config: AgentLoopConfig = { model: createMod`，提示行 627

  ```text
  const userPrompt: AgentMessage = createUserMessage("edit something"); const config: AgentLoopConfig = { model: createModel(), convertToLlm: identityConverter, }; let callIndex = 0; const streamFn = () => { const stream = createAssistantMessageEventStream(); queueMicrotask(() => { if (callIndex === 0) { const message = createAssistantMessage( [ { type: "toolCall", id: "tool-1", name: "edit", arguments: { oldText: "before", newText: "after" }, }, ], "toolUse", ); stream.push({ type: "done", reason: "toolUse", message }); } else { const message = createAssistantMessage([{ type: "text", text: "done" }]); stream.push({ type: "done", reason: "stop", message }); } callIndex++; }); return stream; }; const stream = agentLoop([userPrompt], context, config, undefined, streamFn); for await (const _event of stream) { // consume } expect(executed).toEqual([[{ oldText: "before", newText: "after" }]]); }); it("should emit tool_execution_end in completion order but persist tool results in source order", async () => { const toolSchema = Type.Object({ value: Type.String() }); let firstResolved = false; let parallelObserved = false; let releaseFirst: (() => void) | undefined; const firstDone = new Promise<void>((resolve) => { releaseFirst = resolve; }); const tool: AgentTool<typeof toolSchema, { value: string }> = { name: "echo", label: "Echo", description: "Echo tool", parameters: toolSchema, async execute(_toolCallId, params) { if (params.value === "first") { await firstDone; firstResolved = true; } if (params.value === "second" && !firstResolved) { parallelObserved = true; } return { content: [{ type: "text", text: `echoed: ${params.value}` }], details: { value: params.value }, }; }, }; const context: AgentContext = { messages: [], tools: [tool], }; const userPrompt: AgentMessage = createUserMessage("echo both"); const config: AgentLoopConfig = { model: createModel(), convertToLlm: identityConverter, toolExecution: "parallel", }; let callIndex = 0; const stream = agentLoop([userPrompt], context, config, undefined, () => { const mockStream = createAssistantMessageEventStream(); queueMicrotask(() => { if (callIndex === 0) { const message = createAssistantMessage( [ { type: "toolCall", id: "tool-1", name: "echo", arguments: { value: "first" } }, { type: "toolCall", id: "tool-2", name: "echo", arguments: { value: "second" } }, ], "toolUse",
  ```

核验：`v1.4.0`

### E160

证据：`../../packages/agent/test/agent-loop.test.ts#L826-L906`

- [`packages/agent/test/agent-loop.test.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/agent/test/agent-loop.test.ts) — text: `} else { // Second call: return final response const message = createAssistantMessage(［{ type: "text", text: "done" }］);`，提示行 826

  ```text
  } else { // Second call: return final response const message = createAssistantMessage([{ type: "text", text: "done" }]); mockStream.push({ type: "done", reason: "stop", message }); } callIndex++; }); return mockStream; }); for await (const event of stream) { events.push(event); } // Both tools should execute before steering is injected expect(executed).toEqual(["first", "second"]); const toolEnds = events.filter( (e): e is Extract<AgentEvent, { type: "tool_execution_end" }> => e.type === "tool_execution_end", ); expect(toolEnds.length).toBe(2); expect(toolEnds[0].isError).toBe(false); expect(toolEnds[1].isError).toBe(false); // Queued message should appear in events after both tool result messages const eventSequence = events.flatMap((event) => { if (event.type !== "message_start") return []; if (event.message.role === "toolResult") return [`tool:${event.message.toolCallId}`]; if (event.message.role === "user" && typeof event.message.content === "string") { return [event.message.content]; } return []; }); expect(eventSequence).toContain("interrupt"); expect(eventSequence.indexOf("tool:tool-1")).toBeLessThan(eventSequence.indexOf("interrupt")); expect(eventSequence.indexOf("tool:tool-2")).toBeLessThan(eventSequence.indexOf("interrupt")); // Interrupt message should be in context when second LLM call is made expect(sawInterruptInContext).toBe(true); }); it("should force sequential execution when a tool has executionMode=sequential even with default parallel config", async () => { const toolSchema = Type.Object({ value: Type.String() }); let firstResolved = false; let parallelObserved = false; let releaseFirst: (() => void) | undefined; const firstDone = new Promise<void>((resolve) => { releaseFirst = resolve; }); const slowTool: AgentTool<typeof toolSchema, { value: string }> = { name: "slow", label: "Slow", description: "Slow tool", parameters: toolSchema, executionMode: "sequential", async execute(_toolCallId, params) { if (params.value === "first") { await firstDone; firstResolved = true; } if (params.value === "second" && !firstResolved) { parallelObserved = true; } return { content: [{ type: "text", text: `slow: ${params.value}` }], details: { value: params.value }, }; }, }; const context: AgentContext = { messages: [], tools: [slowTool], }; const userPrompt: AgentMessage = createUserMessage("run both"); // config is parallel (default), but tool forces sequential const config: AgentLoopConfig = { model: createModel(), convertToLlm: identityConverter,
  ```

核验：`v1.4.0`

### E161

证据：`../../packages/ai/src/types.ts#L753-L785`

- [`packages/ai/src/types.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/src/types.ts) — text: `| { type: "json_schema"; strict: "prefer" | "require"; } | { type: "grammar"; variants: GrammarVariants; }; export inter`，提示行 753

  ```text
  | { type: "json_schema"; strict: "prefer" | "require"; } | { type: "grammar"; variants: GrammarVariants; }; export interface Tool<TParameters extends TSchema = TSchema> { name: string; description: string; parameters: TParameters; constrainedSampling?: false | ConstrainedSamplingConfig; } export interface ToolReference { name: string; } /** * Request input accepted by the public stream entry points (`Models.stream()`, * `streamSimple()`, ...). `systemPrompt` and `tools` are shorthand for a leading * system message; `normalizeContext()` folds them into one before the request * reaches a provider. */ export interface Context { systemPrompt?: string; messages: Message[]; tools?: Tool[]; } declare const transcriptContextBrand: unique symbol;
  ```

核验：`v1.4.0`

### E162

证据：`../../packages/ai/test/faux-provider.test.ts#L457-L531`

- [`packages/ai/test/faux-provider.test.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/test/faux-provider.test.ts) — text: `{ ...fauxAssistantMessage("partial"), stopReason: "error", errorMessage: "upstream failed", }, ］); const events = await `，提示行 457

  ```text
  { ...fauxAssistantMessage("partial"), stopReason: "error", errorMessage: "upstream failed", }, ]); const events = await collectEvents( stream(registration.getModel(), { messages: [{ role: "user", content: "hi", timestamp: Date.now() }] }), ); expect(events.map((event) => event.type)).toEqual(["start", "text_start", "text_delta", "text_end", "error"]); const terminal = events[events.length - 1]; expect(terminal.type).toBe("error"); if (terminal.type === "error") { expect(terminal.reason).toBe("error"); expect(terminal.error.stopReason).toBe("error"); expect(terminal.error.errorMessage).toBe("upstream failed"); } }); it("streams an explicit assistant aborted message as a terminal error", async () => { const registration = registerFauxProvider({ tokenSize: { min: 2, max: 2 } }); registrations.push(registration); registration.setResponses([ { ...fauxAssistantMessage("partial"), stopReason: "aborted", errorMessage: "Request was aborted", }, ]); const events = await collectEvents( stream(registration.getModel(), { messages: [{ role: "user", content: "hi", timestamp: Date.now() }] }), ); expect(events.map((event) => event.type)).toEqual(["start", "text_start", "text_delta", "text_end", "error"]); const terminal = events[events.length - 1]; expect(terminal.type).toBe("error"); if (terminal.type === "error") { expect(terminal.reason).toBe("aborted"); expect(terminal.error.stopReason).toBe("aborted"); expect(terminal.error.errorMessage).toBe("Request was aborted"); } }); it("supports aborting before the first chunk", async () => { const registration = registerFauxProvider({ tokensPerSecond: 50, tokenSize: { min: 3, max: 3 } }); registrations.push(registration); registration.setResponses([fauxAssistantMessage("abcdefghijklmnopqrstuvwxyz")]); const controller = new AbortController(); controller.abort(); const events = await collectEvents( stream( registration.getModel(), { messages: [{ role: "user", content: "hi", timestamp: Date.now() }] }, { signal: controller.signal }, ), ); expect(events).toHaveLength(1); expect(events[0].type).toBe("error"); if (events[0].type === "error") { expect(events[0].reason).toBe("aborted"); expect(events[0].error.stopReason).toBe("aborted"); } }); it("supports aborting mid-text stream when paced", async () => { const registration = registerFauxProvider({ tokensPerSecond: 100, tokenSize: { min: 3, max: 3 } }); registrations.push(registration); registration.setResponses([fauxAssistantMessage("abcdefghijklmnopqrstuvwxyz")]); const controller = new AbortController();
  ```

核验：`v1.4.0`

### E163

证据：`../../packages/ai/test/faux-provider.test.ts#L533-L605`

- [`packages/ai/test/faux-provider.test.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/test/faux-provider.test.ts) — text: `let textDeltaCount = 0; const s = stream( registration.getModel(), { messages: ［{ role: "user", content: "hi", timestamp`，提示行 533

  ```text
  let textDeltaCount = 0; const s = stream( registration.getModel(), { messages: [{ role: "user", content: "hi", timestamp: Date.now() }] }, { signal: controller.signal }, ); for await (const event of s) { events.push(event.type); if (event.type === "text_delta") { textDeltaCount++; controller.abort(); } } expect(textDeltaCount).toBe(1); expect(events).toContain("text_start"); expect(events).toContain("text_delta"); expect(events).toContain("error"); expect(events).not.toContain("text_end"); }); it("supports aborting mid-thinking stream when paced", async () => { const registration = registerFauxProvider({ tokensPerSecond: 100, tokenSize: { min: 3, max: 3 } }); registrations.push(registration); registration.setResponses([ { ...fauxAssistantMessage("ignored"), content: [{ type: "thinking", thinking: "abcdefghijklmnopqrstuvwxyz" }], }, ]); const controller = new AbortController(); const events: string[] = []; let thinkingDeltaCount = 0; const s = stream( registration.getModel(), { messages: [{ role: "user", content: "hi", timestamp: Date.now() }] }, { signal: controller.signal }, ); for await (const event of s) { events.push(event.type); if (event.type === "thinking_delta") { thinkingDeltaCount++; controller.abort(); } } expect(thinkingDeltaCount).toBe(1); expect(events).toContain("thinking_start"); expect(events).toContain("thinking_delta"); expect(events).toContain("error"); expect(events).not.toContain("thinking_end"); }); it("supports aborting mid-toolcall stream when paced", async () => { const registration = registerFauxProvider({ tokensPerSecond: 100, tokenSize: { min: 3, max: 3 } }); registrations.push(registration); registration.setResponses([ { ...fauxAssistantMessage("done"), content: [ { type: "toolCall", id: "tool-1", name: "echo", arguments: { text: "abcdefghijklmnopqrstuvwxyz", count: 123456789 }, }, ], stopReason: "toolUse", }, ]); const controller = new AbortController();
  ```

核验：`v1.4.0`

### E164

证据：`../../packages/agent/test/agent.test.ts#L487-L550`

- [`packages/agent/test/agent.test.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/agent/test/agent.test.ts) — text: `delayedUpdate = onUpdate; onUpdate?.({ content: ［{ type: "text", text: "running" }］, details: { status: "running" }, });`，提示行 487

  ```text
  delayedUpdate = onUpdate; onUpdate?.({ content: [{ type: "text", text: "running" }], details: { status: "running" }, }); return { content: [{ type: "text", text: "ok" }], details: { status: "done" }, terminate: true, }; }, }; const agent = new Agent({ initialState: { tools: [tool] }, streamFn: () => { const stream = createAssistantMessageEventStream(); queueMicrotask(() => { stream.push({ type: "done", reason: "toolUse", message: createAssistantToolUseMessage([ { type: "toolCall", id: "call-1", name: "delayed_tool", arguments: {} }, ]), }); }); return stream; }, }); agent.subscribe((event) => { events.push(event); }); process.on("unhandledRejection", onUnhandledRejection); try { await agent.prompt("run tool"); const eventCountAfterPrompt = events.length; delayedUpdate?.({ content: [{ type: "text", text: "late" }], details: { status: "late" }, }); await new Promise((resolve) => setTimeout(resolve, 0)); expect(events.filter((event) => event.type === "tool_execution_update")).toHaveLength(1); expect(events).toHaveLength(eventCountAfterPrompt); expect(unhandledRejections).toEqual([]); } finally { process.off("unhandledRejection", onUnhandledRejection); } }); it("should ignore a settled parallel tool update while another tool is still running", async () => { const toolSchema = Type.Object({}); const slowStarted = createDeferred(); const settledToolEnded = createDeferred(); const releaseSlow = createDeferred(); let settledToolUpdate: AgentToolUpdateCallback<{ status: string }> | undefined; const events: AgentEvent[] = []; const settledTool: AgentTool<typeof toolSchema, { status: string }> = { name: "settled_tool", label: "Settled Tool", description: "Captures progress callbacks", parameters: toolSchema, async execute(_toolCallId, _params, _signal, onUpdate) {
  ```

核验：`v1.4.0`

### E165

证据：`../../packages/agent/test/agent.test.ts#L376-L447`

- [`packages/agent/test/agent.test.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/agent/test/agent.test.ts) — text: `if (event.type === "agent_end") { await barrier.promise; listenerFinished = true; } }); let promptResolved = false; cons`，提示行 376

  ```text
  if (event.type === "agent_end") { await barrier.promise; listenerFinished = true; } }); let promptResolved = false; const promptPromise = agent.prompt("hello").then(() => { promptResolved = true; }); await new Promise((resolve) => setTimeout(resolve, 10)); expect(promptResolved).toBe(false); expect(listenerFinished).toBe(false); expect(agent.state.isStreaming).toBe(true); barrier.resolve(); await promptPromise; expect(listenerFinished).toBe(true); expect(promptResolved).toBe(true); expect(agent.state.isStreaming).toBe(false); }); it("waitForIdle should wait for async subscribers", async () => { const barrier = createDeferred(); const agent = new Agent({ streamFn: () => { const stream = createAssistantMessageEventStream(); queueMicrotask(() => { stream.push({ type: "done", reason: "stop", message: createAssistantMessage("ok") }); }); return stream; }, }); agent.subscribe(async (event) => { if (event.type === "message_end" && event.message.role === "assistant") { await barrier.promise; } }); const promptPromise = agent.prompt("hello"); let idleResolved = false; const idlePromise = agent.waitForIdle().then(() => { idleResolved = true; }); await new Promise((resolve) => setTimeout(resolve, 10)); expect(idleResolved).toBe(false); expect(agent.state.isStreaming).toBe(true); barrier.resolve(); await Promise.all([promptPromise, idlePromise]); expect(idleResolved).toBe(true); expect(agent.state.isStreaming).toBe(false); }); it("should pass the active abort signal to subscribers", async () => { let receivedSignal: AbortSignal | undefined; const agent = new Agent({ streamFn: (_model, _context, options) => { const stream = createAssistantMessageEventStream(); queueMicrotask(() => { stream.push({ type: "start", partial: createAssistantMessage("") }); const checkAbort = () => { if (options?.signal?.aborted) { stream.push({ type: "error", reason: "aborted", error: createAssistantMessage("Aborted") }); } else { setTimeout(checkAbort, 5); }
  ```

核验：`v1.4.0`

### E166

证据：`../../packages/chord/README.md#L3-L7`

- [`packages/chord/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/chord/README.md) — text: `Chord builds applications out of **objects** that live in several processes (a server, workers, browser tabs) and can be`，提示行 3

  ```text
  Chord builds applications out of **objects** that live in several processes (a server, workers, browser tabs) and can be **hot reloaded** while they run. - An **object** is state plus code at an address. It is created on demand and lives while someone references it. - Everyone gets a **reference**, never the object. References work the same locally and across processes, and survive reloads. - Every object knows its **principal**: an owner and a guest get different objects, with different methods.
  ```

核验：`v1.4.0`

### E167

证据：`../../packages/chord/README.md#L47-L68`

- [`packages/chord/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/chord/README.md) — text: `host.serve(Counter, ({ name }, _principal, self) => { const count = self.state("count", Type.Number(), 0); return { vari`，提示行 47

  ```text
  host.serve(Counter, ({ name }, _principal, self) => { const count = self.state("count", Type.Number(), 0); return { variant: "default", count, increment: async ({ by }, ctx) => { count.change(ctx, (n) => n + by); }, }; }); await host.root(async (ctx) => { const clicks = await ctx.get(Counter, { name: "clicks" }); // ready, with its state; released when this root ends clicks.count.subscribe((n) => console.log("count", n)); await clicks.increment({ by: 2 }, ctx); // logs 0, then 2 }); ''' ## Documentation - [Tutorial](docs/tutorial.md): a shared todo list, built up section by section. Every example runs as `test/tutorial.test.ts`.
  ```

核验：`v1.4.0`

### E168

证据：`../../packages/chord/README.md#L70-L105`

- [`packages/chord/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/chord/README.md) — text: `- ［Specification］(docs/spec.md): compatibility, lifetime, and reload semantics, plus known limitations and implementatio`，提示行 70

  ```text
  - [Specification](docs/spec.md): compatibility, lifetime, and reload semantics, plus known limitations and implementation decisions. - [Delta guide](src/delta/README.md): ownership, lifecycle, operation, and replica contracts of `@earendil-works/chord/delta`. ## Explicit Context telemetry `Context` always carries a `telemetry: TelemetrySpan`, alongside `abortSignal`. `BACKGROUND_CONTEXT` and `TODO_CONTEXT` use the shared no-op span `NOOP_TELEMETRY_CONTEXT`. Adapters (`TelemetryContext`) belong to hosts and start root spans; adapters are never placed in a `Context`. '''ts import { BACKGROUND_CONTEXT, traceIn, withTelemetry } from '@earendil-works/chord/context'; import { InMemoryTelemetryContext } from '@earendil-works/pi-telemetry'; const telemetry = new InMemoryTelemetryContext(); await telemetry.startSpan({ name: 'app.request' }, async (span) => { const context = withTelemetry(span, BACKGROUND_CONTEXT); await traceIn(context, { name: 'app.load' }, async (child) => { child.telemetry.addEvent('cache.miss'); return traceIn(child, { name: 'app.read' }, (nested) => readAccount(nested)); }); }); ''' `withTelemetry(span, context)` derives a new context; it never changes its parent, cancellation, or typed values. `traceIn(context, options, fn)` creates a callback-managed child span, and `fn` receives its derived context. Every context already supports `telemetry.addEvent()` and `telemetry.addLink()`. Values, cancellation, callback results, and rejection identities are preserved. Concurrent calls keep independent parents; there is no ambient current span. `value()`, `ContextKey`, and `withContextValue()` remain supported. These helpers operate on the standalone `Context` API. They do not yet instrument Chord hosts, methods, or network frames. ## SQLite telemetry '''ts import { createSqliteTelemetry } from '@earendil-works/chord/telemetry-sqlite'; import { openNodeSqliteDatabase } from '@earendil-works/chord/sqlite/node'; import { renderTrace } from '@earendil-works/pi-telemetry/render'; const db = await openNodeSqliteDatabase('telemetry.db'); const telemetry = await createSqliteTelemetry(db); try { await telemetry.startSpan({ name: 'app.request' }, async (span) => {
  ```

核验：`v1.4.0`

### E169

证据：`../../packages/chord/test/boundary.test.ts#L10-L33`

- [`packages/chord/test/boundary.test.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/chord/test/boundary.test.ts) — text: `describe("package boundary", () => { // pi-telemetry is the one allowed Pi package: a leaf without dependencies, needed `，提示行 10

  ```text
  describe("package boundary", () => { // pi-telemetry is the one allowed Pi package: a leaf without dependencies, needed for Context.telemetry. const ALLOWED = new Set(["@earendil-works/pi-telemetry"]); test("does not depend on Pi packages other than pi-telemetry, or on files outside Chord", async () => { const manifest = JSON.parse(await readFile(resolve(packageDirectory, "package.json"), "utf8")) as { dependencies?: Record<string, string>; }; expect( Object.keys(manifest.dependencies ?? {}).filter( (name) => name.startsWith("@earendil-works/pi-") && !ALLOWED.has(name), ), ).toEqual([]); const paths = (await readdir(sourceDirectory, { recursive: true })).filter((path) => path.endsWith(".ts")).sort(); const violations: string[] = []; for (const path of paths) { const file = resolve(sourceDirectory, path); const source = await readFile(file, "utf8"); for (const match of source.matchAll(IMPORT_SPECIFIER)) { const specifier = match[1]!; const pkg = specifier.split("/").slice(0, 2).join("/"); if (specifier.startsWith("@earendil-works/pi-") && !ALLOWED.has(pkg)) violations.push(`${path}: ${specifier}`);
  ```

核验：`v1.4.0`

### E170

证据：`../../packages/telemetry/README.md#L3-L13`

- [`packages/telemetry/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/telemetry/README.md) — text: `Vendor-neutral telemetry contracts and typed schema utilities for pi packages. This package provides: - an explicit, cal`，提示行 3

  ```text
  Vendor-neutral telemetry contracts and typed schema utilities for pi packages. This package provides: - an explicit, callback-based `TelemetryContext` / `TelemetrySpan` contract; - a shared `NOOP_TELEMETRY_CONTEXT`; - opaque cross-process propagation and span links; - counters, up-down counters, histograms, and typed metric schemas; - a reference `InMemoryTelemetryContext` implementation; - serializable schema definitions with inferred TypeScript types; - no exporter, global current-span state, or dependency on a telemetry backend.
  ```

核验：`v1.4.0`

### E171

证据：`../../packages/telemetry/README.md#L118-L132`

- [`packages/telemetry/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/telemetry/README.md) — text: `} return result; }); ''' ## Adapter Contract An adapter implements `TelemetryContext` and bridges the generic API to its`，提示行 118

  ```text
  } return result; }); ''' ## Adapter Contract An adapter implements `TelemetryContext` and bridges the generic API to its backend. Typed inputs are trusted; malformed inputs have unspecified behavior. Adapters are not required to validate inputs or suppress adapter/backend failures. The callback and recording contract is: - create a child span and invoke the callback synchronously, exactly once; - expose optional metric and propagation capabilities on its contexts, child spans, and extracted parents, including inert fallback spans; - preserve the callback's returned value and rejection value, returning a promise rejected with the same value after a synchronous throw; - keep the native span open until a returned promise settles;
  ```

核验：`v1.4.0`

### E172

证据：`../../packages/telemetry/src/testing/conformance.ts#L60-L84`

- [`packages/telemetry/src/testing/conformance.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/telemetry/src/testing/conformance.ts) — text: `let settled: TelemetrySpan | undefined; await fixture.context.startSpan({ name: "capabilities" }, async (span) => { sett`，提示行 60

  ```text
  let settled: TelemetrySpan | undefined; await fixture.context.startSpan({ name: "capabilities" }, async (span) => { settled = span; assertCapabilities(span); await span.startSpan({ name: "capabilities.child" }, assertCapabilities); if (propagation) { const parent = propagation.extract(propagation.inject(span)); assertCapabilities(parent); await parent.startSpan({ name: "capabilities.extracted" }, assertCapabilities); } }); ok(settled); await settled.startSpan({ name: "capabilities.inert" }, assertCapabilities); }, ), createCase( factory, "metrics", "records ordered measurements and optional histogram exemplars", async (fixture) => { if (!fixture.metrics) return; ok(fixture.getMetrics, "Metrics fixtures require a normalized measurement reader"); fixture.metrics .counter("bytes", { description: "Encoded bytes", unit: "By" }) .add(12, { direction: "out" });
  ```

核验：`v1.4.0`

### E173

证据：`../../packages/telemetry/src/testing/conformance.ts#L184-L244`

- [`packages/telemetry/src/testing/conformance.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/telemetry/src/testing/conformance.ts) — text: `const context = fixture.propagation.extract(carrier); strictEqual(await context.startSpan({ name: `fallback-${index}` },`，提示行 184

  ```text
  const context = fixture.propagation.extract(carrier); strictEqual(await context.startSpan({ name: `fallback-${index}` }, () => 42), 42); } for (const span of await fixture.getSpans()) strictEqual(span.parentContext, null); }), createCase(factory, "propagation", "propagates across fresh adapters and multiple hops", async (fixture) => { if (!fixture.propagation) return; await using receiver = await factory(); await using worker = await factory(); if (!receiver.propagation || !worker.propagation) throw new Error("Expected propagation on each fixture"); let senderCarrier: TelemetryCarrier | undefined; await fixture.context.startSpan({ name: "sender" }, (span) => { senderCarrier = fixture.propagation?.inject(span); }); ok(senderCarrier); let receiverCarrier: TelemetryCarrier | undefined; await receiver.propagation .extract(JSON.parse(JSON.stringify(senderCarrier)) as TelemetryCarrier) .startSpan({ name: "receiver" }, (span) => { receiverCarrier = receiver.propagation?.inject(span); }); ok(receiverCarrier); await worker.propagation .extract(JSON.parse(JSON.stringify(receiverCarrier)) as TelemetryCarrier) .startSpan({ name: "worker" }, () => {}); deepStrictEqual(findSpan(await receiver.getSpans(), "receiver").parentContext, senderCarrier); deepStrictEqual(findSpan(await worker.getSpans(), "worker").parentContext, receiverCarrier); }), createCase( factory, "callback lifecycle", "admits once synchronously and preserves the result", async (fixture) => { let admitted = false; let calls = 0; const expected = { value: 42 }; const result = fixture.context.startSpan({ name: "success" }, () => { admitted = true; calls++; return expected; }); strictEqual(admitted, true); strictEqual(calls, 1); strictEqual(await result, expected); deepStrictEqual(findSpan(await fixture.getSpans(), "success").status, { status: "ok" }); strictEqual(findSpan(await fixture.getSpans(), "success").settled, true); }, ), createCase( factory, "callback lifecycle", "preserves synchronous and asynchronous rejection values", async (fixture) => { const syncError = new Error("sync"); await rejectsWithSameValue( fixture.context.startSpan({ name: "sync-error" }, () => { throw syncError; }),
  ```

核验：`v1.4.0`

### E174

证据：`../../packages/telemetry/src/testing/conformance.ts#L246-L313`

- [`packages/telemetry/src/testing/conformance.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/telemetry/src/testing/conformance.ts) — text: `); const asyncError = { kind: "async" }; await rejectsWithSameValue( fixture.context.startSpan({ name: "async-error" }, `，提示行 246

  ```text
  ); const asyncError = { kind: "async" }; await rejectsWithSameValue( fixture.context.startSpan({ name: "async-error" }, async () => { throw asyncError; }), asyncError, ); await rejectsWithSameValue( fixture.context.startSpan({ name: "undefined-error" }, () => Promise.reject(undefined)), undefined, ); const spans = await fixture.getSpans(); for (const name of ["sync-error", "async-error", "undefined-error"]) { strictEqual(findSpan(spans, name).status.status, "error"); } }, ), createCase(factory, "status", "uses last explicit status without automatic overwrite", async (fixture) => { await fixture.context.startSpan({ name: "last-status" }, (span) => { span.setStatus({ status: "error", error: { name: "Expected", message: "first" } }); span.setStatus({ status: "ok" }); }); const thrown = new Error("after explicit status"); await rejectsWithSameValue( fixture.context.startSpan({ name: "explicit-before-throw" }, (span) => { span.setStatus({ status: "ok" }); throw thrown; }), thrown, ); const rejected = new Error("after async explicit status"); await rejectsWithSameValue( fixture.context.startSpan({ name: "explicit-before-rejection" }, (span) => { span.setStatus({ status: "error", error: { name: "Expected", message: "async failure" } }); return Promise.reject(rejected); }), rejected, ); await fixture.context.startSpan({ name: "expected-failure" }, (span) => { span.setStatus({ status: "error", error: { name: "Expected", message: "returned failure" } }); return { ok: false }; }); const spans = await fixture.getSpans(); deepStrictEqual(findSpan(spans, "last-status").status, { status: "ok" }); deepStrictEqual(findSpan(spans, "explicit-before-throw").status, { status: "ok" }); deepStrictEqual(findSpan(spans, "explicit-before-rejection").status, { status: "error", error: { name: "Expected", message: "async failure" }, }); deepStrictEqual(findSpan(spans, "expected-failure").status, { status: "error", error: { name: "Expected", message: "returned failure" }, }); }), createCase(factory, "recording", "merges attributes and records ordered events", async (fixture) => { await fixture.context.startSpan( { name: "recording",
  ```

核验：`v1.4.0`

### E175

证据：`../../packages/telemetry/README.md#L385-L391`

- [`packages/telemetry/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/telemetry/README.md) — text: `status: { default: 'ok', errorWhen: 'The read throws or returns an error result', }, }, }, } as const);`，提示行 385

  ```text
  status: { default: 'ok', errorWhen: 'The read throws or returns an error result', }, }, }, } as const);
  ```

核验：`v1.4.0`

### E176

证据：`../../packages/durable/README.md#L1-L7`

- [`packages/durable/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/durable/README.md) — text: `# @earendil-works/pi-durable > **Experimental.** The API changes without notice between releases. A durable agent harnes`，提示行 1

  ```text
  # @earendil-works/pi-durable > **Experimental.** The API changes without notice between releases. A durable agent harness. Conversations, model turns, tool calls, and your own state are committed to storage before anything is shown. If the process dies mid-turn, reopening the storage picks the work up where it stopped. Built on [`@earendil-works/pi-ai`](../ai/README.md) for model access and `@earendil-works/chord` for document state.
  ```

核验：`v1.4.0`

### E177

证据：`../../packages/durable/README.md#L69-L99`

- [`packages/durable/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/durable/README.md) — text: `''' What happened: - `Harness.open()` opens a Session over a storage backend. `MemoryStorage` keeps everything in memory`，提示行 69

  ```text
  ''' What happened: - `Harness.open()` opens a Session over a storage backend. `MemoryStorage` keeps everything in memory. - `root()` returns the root conversation, creating it on first use with the given agent choices. A conversation is a transcript of immutable entries. - `submit()` durably admits your input and returns a `Submission`. A built-in generation task calls the model and appends the answer. - `wait()` resolves once the input is answered (`done`) or has failed (`unanswered`, with a reason). Every async call takes a Chord `Context`, which carries cancellation and its current `TelemetrySpan`. `BACKGROUND_CONTEXT` never cancels and uses a NOOP span. The Harness owns the root adapter; adapters are never stored in a `Context`. Cancelling a wait only cancels that wait, never the work. `HarnessOptions.identity` sets how model requests identify the app to providers (a pi-ai `ClientIdentity`), merged over `DEFAULT_HARNESS_IDENTITY` (`{ attribution: PI_ATTRIBUTION }`: OpenRouter, NVIDIA NIM, and OpenCode attribution headers name pi). It applies to generation, compaction, hooks, and tools, over the identity the host's `Models` was created with. Pass your app's attribution, for example `{ attribution: { name: "my-app", url: "https://my-app.example" } }`, or `{ attribution: null }` to send none. `HarnessOptions.telemetry` accepts a host-owned `TelemetryContext` from `@earendil-works/pi-telemetry`, with optional `propagation` and `metrics` capabilities; omitted, it is a no-op. `DURABLE_TELEMETRY_SCHEMA`, exported from the package root, documents its typed spans, events, and metrics. Attributes contain IDs and control metadata, never messages, arguments, or results; IDs point to the transcript. - `pi.durable.submit` covers the public submit call and its commit. Each input starts a new root trace with a link to its caller's current span; a write is a child of its caller. Duplicate `requestId` preserves the original submission and carrier. Internal admissions, such as compaction writes, emit events on their phase span without a submit span. - `pi.durable.phase` covers one run or abort phase of every task, including its decision commit, never the next phase, a durable wait, or a restart. Its attributes identify the task, phase, attempt when present, `resumed`, and outcome. Tool phases also identify the tool and call. Nested tasks and background compactions inherit the creating phase; model requests receive that phase context. Hooks add no spans. - Failed phase outcomes set error status with a fixed category (`task_faulted`, `task_failed`, or `task_orphaned`) and the outcome's diagnostic message, truncated to 500 characters (the reason for an orphaned task). Diagnostics can contain caller content; no error detail or exception name is recorded. An `aborted` outcome keeps status `ok`, including interruption by close or cancellation. - Every `onReport` report also emits a `pi.durable.report` event on its current span. Without a span, the NOOP span drops the event; no root report span is created. Only `type`, optional fixed `reason`, `extension`, and `task.id` are recorded; no error payload is included. `pi.durable.reports` counts all reports by `type` only, including those without a span. Clock failures report without a phase context. The `onReport` callback is unchanged. - Committed entries and settled submissions emit `pi.durable.entry` and `pi.durable.submission`. Committed running phase changes emit `pi.durable.checkpoint`; a nested call answered from its stored result emits `pi.durable.replay`. - Propagation stores optional opaque `trace` carriers in submission and task JSON without a storage migration. Phase spans extract their task's stored carrier, or start at the adapter root when absent or unknown. `TaskOptions.trace` inherits the creator's carrier when absent, accepts an explicit carrier override, or uses `"root"` to start at the adapter root without storing a carrier. A run started for several queued inputs takes the first input's trace; its first invocation's phase spans link to the other inputs through immutable task `links`. A steer stays in the running trace and its submit span links to that run's stored carrier. A reopened task's first invocation has `resumed: true` in the same trace. - Metrics record `pi.durable.phase.duration` (milliseconds; task, phase, outcome) and `pi.durable.tasks.active` (live tasks; task name), without record IDs. Closing the Harness releases its active counts. ## Concepts - **Harness**: one open storage plus the machinery that runs agents on it. All changes go through one line of atomic commits, and nothing is shown before its commit is stored. - **Conversation**: a transcript. `root()` creates the root conversation on first use; you can create more and fork them. A `Conversation` handle holds no state; compare handles by `id`. - **Entry**: one immutable transcript record, such as a user message (`pi.user`), a model response (`pi.assistant`), a tool result (`pi.tool-result`), a system prompt change (`pi.system`), a reset (`pi.reset`), or your own kind. The model sees the entries from the newest reset onward. - **Commit**: an atomic write. `conversation.commit((tx) => ...)` can append entries, edit documents, and create tasks together; either all of it is stored or none of it. - **Document**: typed JSON state stored next to the transcript and changed in commits. Built-in ones hold each conversation's agent choices (`pi.agent`), provider-facing session identity (`pi.provider`), running generation and tools (`pi.live`), queued submissions (`pi.inbox`), and spend (`pi.usage`). - **Task**: a durable state machine that saves a checkpoint at every step, so a restarted process continues from the last one. Every task has an owner: its conversation, or another task. The Harness runs answers as built-in tasks: `pi.generation` calls the model and owns the `pi.tool` tasks of its tool calls, waits for them, and hands the run to the next generation.
  ```

核验：`v1.4.0`

### E178

证据：`../../packages/durable/README.md#L147-L170`

- [`packages/durable/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/durable/README.md) — text: `version: 1, initial: () => ({ phase: "wait" }), phases: { // Resolves once the sleep is stored; the phase ends there. wa`，提示行 147

  ```text
  version: 1, initial: () => ({ phase: "wait" }), phases: { // Resolves once the sleep is stored; the phase ends there. wait: (task, runtime, context) => runtime.sleepUntil(task.input.at, { phase: "deliver" }, context), deliver: async (task, runtime, context) => { await notify(task.input.text); await runtime.commit(() => ({ status: "terminal", outcome: { status: "completed", result: null } }), context); }, }, abort: (_task, runtime, context) => runtime.commit(() => ({ status: "terminal", outcome: { status: "aborted" } }), context), }); ''' There is no sleep in the middle of a phase: a phase reruns from its top after a restart, so work after the wait goes in the next phase, and what it needs goes in the checkpoint. `{ status: "sleeping", until, checkpoint }` returned from `runtime.commit()` is the same sleep, committed together with other writes. Retry backoffs and deferred-response polls of the built-in tasks sleep the same way. The timers of the Session, the scheduler, and its tasks go through `setTimer` (default `setTimeout`), and their times through `now` (default `Date.now`); pass both to run a Harness on a fake clock. The Node.js environment, file watcher, and image worker keep their own timers. Sleep deadlines are stored on `now`, so every process that opens one storage must use the same clock. While scheduling runs, a timer resumes sleeping tasks when they are due and keeps a Node.js process alive meanwhile. A host whose process can be evicted, such as a Cloudflare Durable Object, wakes it itself. With `onWake`, the Harness arms no timer for sleeps; it tells the host what `harness.wake()` says whenever that changes: `active` while some task can run now or is running, and `at`, the earliest sleep. The host keeps its alarm armed and calls `resume()` when it fires: '''typescript export class Session extends DurableObject<Env> { #harness!: Harness;
  ```

核验：`v1.4.0`

### E179

证据：`../../packages/durable/README.md#L535-L567`

- [`packages/durable/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/durable/README.md) — text: `''' It behaves like any other input: it starts a run, steers, follows up, or rejects, and is answered. While queued, its`，提示行 535

  ```text
  ''' It behaves like any other input: it starts a run, steers, follows up, or rejects, and is answered. While queued, its inbox item carries the entry. The kind must not start with `pi.`. ## Reset and Handoff `reset()` starts a new context. The model no longer sees older entries, but they stay in storage: '''typescript await root.reset(undefined, context); // start from nothing await root.reset("We were fixing the flaky login test. Continue.", context); // start from a handoff note ''' While busy, the reset is queued like a write. When it is placed during a tool round, the current run ends. A tool can request the same with `control: { handoff: "..." }`. ## Compaction Compaction shrinks what the model sees: it summarizes older entries and appends a `pi.compaction` entry that holds the summary and heads the first entry it keeps. Older entries stay in storage. '''typescript const id = await root.compact("Keep the failing test names", context); // manual, with optional instructions const { outcome } = (await harness.waitForTask(id, context)).state; if (outcome.status === "completed" && outcome.result.submissionId !== undefined) { const placed = await (await harness.submission(outcome.result.submissionId, context))!.wait(context); console.log(placed.status); // "done", or "unanswered" with reason "stale" } ''' The conversation keeps working while the summary is made. The summary is placed at once when the conversation is idle, otherwise at the next turn boundary. Esc (`abort()`) cancels a manual compaction. Generation also compacts on its own, controlled by the [settings](#settings): '''typescript
  ```

核验：`v1.4.0`

## 12_pi_philosophy/review.md

### E180

新贡献者的 issue/PR 默认自动关闭，维护者按节奏复审重开

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `## Contribution Gate All issues and PRs from new contributors are auto-closed by default. Issues submitted Friday throug`，提示行 21

  ```text
  ## Contribution Gate All issues and PRs from new contributors are auto-closed by default. Issues submitted Friday through Sunday are not guaranteed to be reviewed. If something is urgent, ask on Discord: https://discord.com/invite/3cU7Bz4UPx Maintainers review auto-closed issues daily and reopen worthwhile ones. Issues that do not meet the quality bar below will not be reopened or receive a reply. Approval happens through maintainer replies on issues: - `lgtmi`: your future issues will not be auto-closed - `lgtm`: your future issues and PRs will not be auto-closed The command must be at the start of the reply (optionally after one or more `@username` mentions) or at the end. `lgtmi` does not grant rights to submit PRs. Only `lgtm` grants rights to submit PRs.
  ```

核验：`v1.4.0`

### E181

较大的设计变更走 RFC，公开的只是一部分

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `## Where can I learn about plans? Earendil uses RFCs to discuss larger changes. Not all of them are public, but quite a `，提示行 99

  ```text
  ## Where can I learn about plans? Earendil uses RFCs to discuss larger changes. Not all of them are public, but quite a few are. They can be found at [rfc.earendil.com](https://rfc.earendil.com/keyword/pi/).
  ```

核验：`v1.4.0`

### E182

根的 check 命令串起 biome、依赖、类型、入口图、install-lock 与 browser smoke

- [`package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/package.json) — text: `"build:native:win32": "npm --prefix packages/tui run build:native:win32", "check": "node scripts/biome-check.mjs --write`，提示行 20

  ```text
  "build:native:win32": "npm --prefix packages/tui run build:native:win32", "check": "node scripts/biome-check.mjs --write && npm run check:pinned-deps && npm run check:runtime-deps && npm run check:ts-imports && npm run check:entry-graphs && npm run check:install-lock:coding-agent && tsc --noEmit && npm run check:browser-smoke", "check:browser-smoke": "node scripts/check-browser-smoke.mjs", "check:pinned-deps": "node scripts/check-pinned-deps.mjs", "check:runtime-deps": "node scripts/check-runtime-deps.mjs", "check:package-install": "node scripts/check-package-install.mjs", "check:install-lock:coding-agent": "node scripts/generate-coding-agent-install-lock.mjs --check", "check:ts-imports": "node scripts/check-ts-relative-imports.mjs",
  ```

核验：`v1.4.0`

### E183

release 脚本在收尾时把 [Unreleased] 段落改名并输出提示

- [`scripts/release.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/release.mjs) — text: `console.log(` Added ［Unreleased］ to ${changelog}`); } } // Main flow console.log("\n=== Release Script ===\n"); // 1. Ch`，提示行 251

  ```text
  console.log(` Added [Unreleased] to ${changelog}`); } } // Main flow console.log("\n=== Release Script ===\n"); // 1. Check for uncommitted changes console.log("Checking for uncommitted changes..."); const status = run("git status --porcelain", { silent: true }); if (status && status.trim()) { console.error("Error: Uncommitted changes detected. Commit or stash first."); console.error(status); process.exit(1); } console.log(" Working directory clean\n"); // 2. Verify npm package registration before modifying the worktree. assertPackagesAreRegisteredWithNpm(); // Pin and verify the Nix model catalog before modifying versions, so the pin // lands in the release commit and a failure leaves the worktree clean. console.log("Pinning and building with the newest model catalog for Nix..."); await pinAndBuildWithNewestModelCatalog(); console.log(); // 3. Bump or set version const version = bumpOrSetVersion(RELEASE_TARGET); console.log(` New version: ${version}\n`); // 4. Update changelogs console.log("Updating CHANGELOG.md files..."); updateChangelogsForRelease(version); console.log(); // 5. Regenerate release artifacts console.log("Regenerating release artifacts..."); run("npm run generate:models"); run("npm run check:model-data");
  ```

核验：`v1.4.0`

### E184

主 CI 的 build-check-test 在单个 Linux runner 上跑 checkout/build/check/test

- [`.github/workflows/ci.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/ci.yml) — text: `build-check-test: runs-on: ubuntu-latest steps: - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da76410c1812`，提示行 14

  ```text
  build-check-test: runs-on: ubuntu-latest steps: - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1 - name: Setup Node.js uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0 with: node-version: 22 cache: npm - name: Install system dependencies run: | sudo apt-get update sudo apt-get install -y libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev fd-find ripgrep sudo ln -s $(which fdfind) /usr/local/bin/fd - name: Install dependencies run: npm ci --ignore-scripts - name: Build run: npm run build - name: Check run: npm run check - name: Build the pi-env daemon run: npm run build:daemon --workspace packages/env - name: Test run: npm test mcp-conformance: runs-on: ubuntu-latest steps: - name: Checkout uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1 - name: Setup Node.js uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0 with: node-version: 22 cache: npm - name: Install dependencies run: npm ci --ignore-scripts # Runs pi's MCP client from source against the pinned official conformance suite and fails on # regressions against packages/coding-agent/test/mcp-conformance/baseline.json. - name: MCP client conformance run: npm run test:mcp-conformance
  ```

核验：`v1.4.0`

### E185

issue 量超过维护者能实时负责的量，是自动关闭的政策理由

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `pi receives more issues than the maintainers can responsibly review in real time. Many reports do not meet the quality b`，提示行 81

  ```text
  pi receives more issues than the maintainers can responsibly review in real time. Many reports do not meet the quality bar in this guide or do not follow CONTRIBUTING.md. Some are slung at the repository mindlessly via an agent instead of being reviewed and shaped by the person submitting them. Auto-closing creates a buffer so maintainers can review the tracker on their own schedule and reopen the issues that meet the quality bar. ### Why are weekend issues lower priority? We triage the tracker during working hours. That means more issues can accumulate over the weekend. Anything submitted Friday through Sunday may be missed or given lower priority in the Monday review queue. If a problem is urgent, ask on Discord and include the short version, a repro, and the relevant logs. ### Why do some issues get no reply? A reply is maintenance work too. Low-signal issues, unclear reports, duplicates, and issues that do not follow this guide may be closed without discussion. This keeps time available for reproducible bugs, thoughtful requests, and contributors who have done the work to make their report actionable. ### Why not let AI triage everything? AI can help group duplicates, summarize reports, and spot missing information. It is not trusted to make final maintainer decisions. Polished AI-generated issues can still be wrong, misleading, or expensive to investigate. Human review remains the final gate. ### Is this hostile to contributors? No. It is a guardrail against burnout and tracker spam. Short, concrete, reproducible issues are welcome. Thoughtful contributions are welcome. Automated slop, entitlement, and large volumes of low-effort reports are not.
  ```

核验：`v1.4.0`

### E186

证据：issue 分析 prompt

- [`.pi/prompts/is.md`](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/prompts/is.md) — text: `3. Do not trust analysis written in the issue. Independently verify behavior and derive your own analysis from the code `，提示行 14

  ```text
  3. Do not trust analysis written in the issue. Independently verify behavior and derive your own analysis from the code and execution path. 4. **For bugs**: - Ignore any root cause analysis in the issue (likely wrong) - Read all related code files in full (no truncation) - Trace the code path and identify the actual root cause - Propose a fix 5. **For feature requests**: - Do not trust implementation proposals in the issue without verification - Read all related code files in full (no truncation) - Propose the most concise implementation approach - List affected files and changes needed Do NOT implement unless explicitly asked. Analyze and propose only.
  ```

核验：`v1.4.0`

### E187

证据：issue-analysis 工作流

- [`.github/workflows/issue-analysis.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/issue-analysis.yml) — text: `- name: Run pi /is id: run_pi uses: actions/github-script@3a2844b7e9c422d3c10d287c895573f7108da1b3 # v9.0.0 env: PI_CODI`，提示行 355

  ```text
  - name: Run pi /is id: run_pi uses: actions/github-script@3a2844b7e9c422d3c10d287c895573f7108da1b3 # v9.0.0 env: PI_CODING_AGENT_DIR: ${{ runner.temp }}/pi-agent GH_TOKEN: ${{ github.token }} ISSUE_URL: ${{ github.event.issue.html_url }} EXTRA_INSTRUCTIONS: ${{ needs.authorize.outputs.extra_instructions }} WORKDIR: ${{ steps.workdir.outputs.name }} with: script: | const fs = require('fs'); const path = require('path'); const { spawn } = require('child_process'); const workdir = path.join(process.env.GITHUB_WORKSPACE, process.env.WORKDIR); const outDir = path.join(process.env.RUNNER_TEMP, 'pi-out'); const sessionDir = path.join(outDir, 'session'); fs.mkdirSync(sessionDir, { recursive: true }); let prompt = `/is ${process.env.ISSUE_URL}`; if (process.env.EXTRA_INSTRUCTIONS) { prompt += '\n\nAdditional instructions from @issuron analyze comment:\n'; prompt += process.env.EXTRA_INSTRUCTIONS; } const outputPath = path.join(outDir, 'output.md'); const output = fs.createWriteStream(outputPath); const args = [ 'packages/coding-agent/src/cli.ts', '-p', '--approve', '--session-dir', sessionDir, '--model', process.env.ISSUE_ANALYSIS_MODEL, '--thinking', process.env.ISSUE_ANALYSIS_THINKING, prompt, ];
  ```

核验：`v1.4.0`

### E188

证据：输出

- [`.github/workflows/issue-analysis.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/issue-analysis.yml) — text: `const body = ［ 'Pi issue analysis finished.', '', `Share URL: ${shareUrl}`, `Gist: ${gistUrl}`, '', 'Continue locally fr`，提示行 623

  ```text
  const body = [ 'Pi issue analysis finished.', '', `Share URL: ${shareUrl}`, `Gist: ${gistUrl}`, '', 'Continue locally from a checkout with:', '', ''''sh', `pi "/ir ${gistId}"`, ''''', '', '<details>', '<summary>Agent analysis summary</summary>', '', lastAgentMessage, '', '</details>', ].join('\n');
  ```

核验：`v1.4.0`

### E189

证据：import-repro 扩展

- [`.pi/extensions/import-repro.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/extensions/import-repro.ts) — text: `try { const targetCwd = ctx.sessionManager.getCwd(); const sessionDir = ctx.sessionManager.getSessionDir(); const parsed`，提示行 293

  ```text
  try { const targetCwd = ctx.sessionManager.getCwd(); const sessionDir = ctx.sessionManager.getSessionDir(); const parsedRef = parseRef(ref, targetCwd); ctx.ui.notify(`Importing repro session from ${ref}...`, "info"); let sourceName: string; let decoded: { header: SessionHeader; jsonl: string }; if (parsedRef.type === "gist") { decoded = await fetchGistSession(parsedRef.id); sourceName = `${parsedRef.id}.jsonl`; } else if (parsedRef.type === "issue") { const gistId = await findIssueGistId(parsedRef.owner, parsedRef.repo, parsedRef.issue); decoded = await fetchGistSession(gistId); sourceName = `${gistId}.jsonl`; } else { if (!existsSync(parsedRef.path)) throw new Error(`session file not found: ${parsedRef.path}`); const raw = readFileSync(parsedRef.path, "utf8"); decoded = parsedRef.path.endsWith(".html") ? decodeExportedHtml(raw) : parseSessionJsonl(raw); sourceName = basename(parsedRef.path).replace(/\.html$/, ".jsonl"); } const platformNotice = getPlatformContinuationNotice(decoded.header.cwd); const rewritten = rewriteSessionCwd(decoded.jsonl, decoded.header.cwd, targetCwd); const destination = join(sessionDir, sourceName); if (existsSync(destination)) { const overwrite = await ctx.ui.confirm( "Session already imported", `Overwrite ${destination}? Local changes to that session will be lost.`, ); if (!overwrite) { ctx.ui.notify("Import cancelled", "warning"); return; } } writeFileSync(destination, rewritten); ctx.ui.notify(`Imported session ${decoded.header.id} (cwd ${decoded.header.cwd} -> ${targetCwd})`, "info"); await ctx.switchSession(destination, { withSession: async (nextCtx) => { if (!platformNotice) return; await nextCtx.sendMessage( { customType: "import-repro", content: platformNotice, display: true, details: { sourceCwd: decoded.header.cwd, targetCwd }, }, { triggerTurn: false }, ); }, });
  ```

核验：`v1.4.0`

### E190

证据：入口图检查

- [`scripts/check-entry-graphs.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-entry-graphs.mjs) — text: `* Entry points are cost contracts. * * A package's `exports` map is the only place that says which modules are public, a`，提示行 3

  ```text
  * Entry points are cost contracts. * * A package's `exports` map is the only place that says which modules are public, and one stray * `export *` can silently make a narrow entry drag an entire barrel: importing a 1-file pure * function through a barrel costs ~37 MB of evaluated module graph, and nothing fails until someone * measures a process. This walks the value-import graph of every declared entry point and enforces a * budget per entry, so that regression fails at commit time instead. * * Only value imports count. `import type` / `export type` are erased before Node sees them. */
  ```

核验：`v1.4.0`

### E191

证据：当前预算

- [`scripts/check-entry-graphs.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-entry-graphs.mjs) — text: `/** * Budgets are deliberate. Entries with no budget remain unbounded; each listed entry states the * graph it is allowe`，提示行 32

  ```text
  /** * Budgets are deliberate. Entries with no budget remain unbounded; each listed entry states the * graph it is allowed to reach. */ const BUDGETS = { "packages/ai": { "./models": { // Request telemetry reaches pi-ai's telemetry.ts and pi-telemetry's root (index, noop, metrics, memory). // Request identity reaches utils/identity.ts and its version constant. maxFiles: 20, forbid: ["providers/", "models.generated.ts", "index.ts", "utils/validation.ts", "utils/typebox-helpers.ts"], allow: ["packages/telemetry/src/index.ts"], }, "./utils/*": { maxFiles: 3, forbid: ["providers/", "api/", "index.ts"] }, }, "packages/codemode": { // Node and Bun users never load the Cloudflare entry, which imports the `cloudflare:workers` built-in. ".": { maxFiles: 12, forbid: ["codemode/src/cloudflare.ts"] }, // Runtimes without Node built-ins (Workers, browsers) import these; neither may reach the worker-thread host
  ```

核验：`v1.4.0`

### E192

证据：#6363 回归测试

- [`packages/coding-agent/test/suite/regressions/6363-agent-settled-event.test.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/suite/regressions/6363-agent-settled-event.test.ts) — text: `it("emits one agent_settled event after automatic retry finishes", async () => { const extensionEvents: string［］ = ［］; c`，提示行 29

  ```text
  it("emits one agent_settled event after automatic retry finishes", async () => { const extensionEvents: string[] = []; const publicEvents: string[] = []; const harness = await createHarness({ settings: { retry: { enabled: true, maxRetries: 3, baseDelayMs: 1 } }, extensionFactories: [ (pi) => { pi.on("agent_end", () => { extensionEvents.push("agent_end"); }); pi.on("agent_settled", (_event, ctx) => { extensionEvents.push(`agent_settled:${ctx.isIdle()}`); }); }, ], }); harnesses.push(harness); harness.session.subscribe((event) => { if (event.type === "agent_settled") { publicEvents.push("agent_settled"); } }); harness.setResponses([ fauxAssistantMessage("", { stopReason: "error", errorMessage: "overloaded_error" }), fauxAssistantMessage("recovered"), ]); await harness.session.prompt("test"); expect(harness.eventsOfType("agent_end").map((event) => event.willRetry)).toEqual([true, false]); expect(harness.eventsOfType("agent_settled")).toEqual([{ type: "agent_settled", aborted: false }]); expect(extensionEvents).toEqual(["agent_end", "agent_end", "agent_settled:true"]); expect(publicEvents).toEqual(["agent_settled"]); });
  ```

核验：`v1.4.0`

### E193

证据：agent_end handler 排入 follow-up

- [`packages/coding-agent/test/suite/regressions/6363-agent-settled-event.test.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/suite/regressions/6363-agent-settled-event.test.ts) — text: `it("settles only after follow-ups queued by agent_end handlers run", async () => { let queuedFollowUp = false; const set`，提示行 64

  ```text
  it("settles only after follow-ups queued by agent_end handlers run", async () => { let queuedFollowUp = false; const settledIdleStates: boolean[] = []; const harness = await createHarness({ extensionFactories: [ (pi) => { pi.on("agent_end", () => { if (queuedFollowUp) return; queuedFollowUp = true; pi.sendUserMessage("status follow-up", { deliverAs: "followUp" }); }); pi.on("agent_settled", (_event, ctx) => { settledIdleStates.push(ctx.isIdle()); }); }, ], }); harnesses.push(harness); harness.setResponses([fauxAssistantMessage("first"), fauxAssistantMessage("second")]); await harness.session.prompt("hello"); expect(getUserTexts(harness)).toEqual(["hello", "status follow-up"]); expect(harness.eventsOfType("agent_end")).toHaveLength(2); expect(harness.eventsOfType("agent_settled")).toHaveLength(1); expect(settledIdleStates).toEqual([true]); });
  ```

核验：`v1.4.0`

### E194

证据：waitForIdle

- [`packages/coding-agent/test/suite/regressions/6363-agent-settled-event.test.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/suite/regressions/6363-agent-settled-event.test.ts) — text: `it("extension command waitForIdle waits for session-level settlement", async () => { let releaseTool = () => {}; const r`，提示行 92

  ```text
  it("extension command waitForIdle waits for session-level settlement", async () => { let releaseTool = () => {}; const released = new Promise<void>((resolve) => { releaseTool = resolve; }); let markCommandStarted = () => {}; const commandStarted = new Promise<void>((resolve) => { markCommandStarted = resolve; }); const commandResults: boolean[] = []; const harness = await createHarness({ tools: [createWaitTool(released)], extensionFactories: [ (pi) => { pi.registerCommand("after-idle", { description: "Wait for idle", handler: async (_args, ctx) => { markCommandStarted(); await ctx.waitForIdle(); commandResults.push(ctx.isIdle()); }, }); }, ], }); harnesses.push(harness); await harness.session.bindExtensions({ commandContextActions: { waitForIdle: () => harness.session.waitForIdle(), newSession: async () => ({ cancelled: false }), fork: async () => ({ cancelled: false }), navigateTree: async () => ({ cancelled: false }), switchSession: async () => ({ cancelled: false }), reload: async () => {}, }, }); const toolStarted = new Promise<void>((resolve) => { const unsubscribe = harness.session.subscribe((event) => { if (event.type === "tool_execution_start" && event.toolName === "wait") { unsubscribe(); resolve(); } }); }); harness.setResponses([ fauxAssistantMessage(fauxToolCall("wait", {}), { stopReason: "toolUse" }), fauxAssistantMessage("done"), ]); const promptPromise = harness.session.prompt("start"); await toolStarted; const commandPromise = harness.session.prompt("/after-idle"); await commandStarted; let commandFinished = false; void commandPromise.then(() => { commandFinished = true; }); await new Promise((resolve) => setTimeout(resolve, 0)); expect(commandFinished).toBe(false); releaseTool(); await Promise.all([promptPromise, commandPromise]); expect(commandResults).toEqual([true]); expect(harness.eventsOfType("agent_settled")).toHaveLength(1); }); });
  ```

核验：`v1.4.0`

### E195

证据：faux harness

- [`packages/coding-agent/test/suite/harness.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/suite/harness.ts) — text: `export async function createHarness(options: HarnessOptions = {}): Promise<Harness> { const tempDir = createTempDir(); c`，提示行 150

  ```text
  export async function createHarness(options: HarnessOptions = {}): Promise<Harness> { const tempDir = createTempDir(); const fauxProvider: FauxProviderRegistration = registerFauxProvider({ provider: options.provider, models: options.models, }); fauxProvider.setResponses([]); const model = fauxProvider.getModel(); const toolMap = options.tools ? Object.fromEntries(options.tools.map((tool) => [tool.name, tool])) : undefined; const withConfiguredAuth = options.withConfiguredAuth ?? true; const extensionRunnerRef: { current?: ExtensionRunner } = {}; const sessionManager = options.sessionManager ?? SessionManager.inMemory(); const settingsManager = SettingsManager.inMemory(options.settings); const authStorage = AuthStorage.inMemory(); if (withConfiguredAuth) { await authStorage.modify(model.provider, async () => ({ type: "api_key", key: "faux-key" })); } const modelsPath = options.modelsJson === undefined ? undefined : join(tempDir, "models.json"); if (modelsPath) writeFileSync(modelsPath, JSON.stringify(options.modelsJson)); const modelRegistry = modelsPath ? await createModelRegistry(authStorage, modelsPath) : await createInMemoryModelRegistry(authStorage); if (withConfiguredAuth) { modelRegistry.registerProvider(model.provider, { baseUrl: model.baseUrl, apiKey: "faux-key", api: fauxProvider.api, models: fauxProvider.models.map((registeredModel) => ({ id: registeredModel.id, name: registeredModel.name, api: registeredModel.api, reasoning: registeredModel.reasoning, input: registeredModel.input, inputLimits: registeredModel.inputLimits, cost: registeredModel.cost, contextWindow: registeredModel.contextWindow, maxTokens: registeredModel.maxTokens, baseUrl: registeredModel.baseUrl, })), }); } const agent = new Agent({ getApiKey: () => (withConfiguredAuth ? "faux-key" : undefined), streamFn: streamSimple, initialState: { model, systemPrompt: "", tools: [], }, convertToLlm, onPayload: async (payload) => { const runner = extensionRunnerRef.current; if (!runner?.hasHandlers("before_provider_request")) { return payload; } return runner.emitBeforeProviderRequest(payload); }, onResponse: async (response) => { const runner = extensionRunnerRef.current; if (!runner?.hasHandlers("after_provider_response")) { return; } await runner.emit({ type: "after_provider_response", status: response.status, headers: response.headers, }); }, transformContext: async (messages: AgentMessage[]) => { const runner = extensionRunnerRef.current; if (!runner) return messages; return runner.emitContext(messages); }, }); const extensionsResult = options.extensionFactories ? await createTestExtensionsResult(options.extensionFactories, tempDir) : undefined; const resourceLoader = options.resourceLoader ?? createTestResourceLoader(extensionsResult ? { extensionsResult } : undefined); const session = new AgentSession({ agent, sessionManager, settingsManager, cwd: tempDir, modelRuntime: getModelRuntime(modelRegistry), resourceLoader, baseToolsOverride: toolMap, initialActiveToolNames: options.initialActiveToolNames, usesDefaultTools: options.initialActiveToolNames === undefined, allowedToolNames: options.allowedToolNames, excludedToolNames: options.excludedToolNames, extensionRunnerRef, }); const events: AgentSessionEvent[] = [];
  ```

核验：`v1.4.0`

### E196

证据：扩展案例

- [`packages/evals/evals/extensions.docs.eval.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/evals/evals/extensions.docs.eval.ts) — text: `describeEval( "Create and use a tool extension", { harness, judges: ［ StructuredOutputJudge({ expected: { response: TOOL`，提示行 25

  ```text
  describeEval( "Create and use a tool extension", { harness, judges: [ StructuredOutputJudge({ expected: { response: TOOL_RESULT, extensionErrors: [], toolLoaded: true, toolResult: TOOL_RESULT, }, match: "strict", allowExtras: false, }), ToolCallJudge({ expectedTools: [{ name: TOOL_NAME, arguments: TOOL_ARGUMENTS }] }), ], judgeThreshold: null, }, (it) => { it("creates, reloads, and invokes the extension", async ({ run }) => { await run([ { type: "prompt", content: "Configure this running Pi installation with an extension containing a hello tool that takes a name and returns a greeting. Do not create project source. For example, passing Bob should return `Hello, Bob!`.", }, { type: "reload" }, { type: "prompt", content: "Use the hello tool to greet Bob. Respond with exactly the tool's greeting and nothing else.", }, ]); }); }, );
  ```

核验：`v1.4.0`

### E197

证据：任务计划

- [`packages/evals/src/plan.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/evals/src/plan.ts) — text: `export function createTaskPlan( cases: readonly DiscoveredEvalCase［］, model: string, runsPerVariant: number, ): EvalTask`，提示行 39

  ```text
  export function createTaskPlan( cases: readonly DiscoveredEvalCase[], model: string, runsPerVariant: number, ): EvalTask[] { if (!model.includes("/") || model.startsWith("/") || model.endsWith("/")) { throw new TypeError("Model identity must contain a provider and model."); } if (!Number.isSafeInteger(runsPerVariant) || runsPerVariant < 1) { throw new TypeError("Runs per variant must be a positive integer."); } const tasks: EvalTask[] = []; for (const evalCase of cases) { for (let runNumber = 1; runNumber <= runsPerVariant; runNumber += 1) { const variants: DocumentationVariant[] = runNumber % 2 === 1 ? ["without_docs", "with_docs"] : ["with_docs", "without_docs"]; for (const variant of variants) tasks.push({ ...evalCase, variant, model, runNumber }); } } return tasks;
  ```

核验：`v1.4.0`

### E198

证据：pair resolution

- [`packages/evals/src/report.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/evals/src/report.ts) — text: `function resolvePair(group: PairGroup): { pair?: Pair; blocked?: BlockedPair } { const reasons: string［］ = ［］; for (cons`，提示行 249

  ```text
  function resolvePair(group: PairGroup): { pair?: Pair; blocked?: BlockedPair } { const reasons: string[] = []; for (const variant of VARIANTS) { const expected = group.expected.get(variant) ?? 0; const observed = group.observations.get(variant) ?? []; if (expected !== 1) reasons.push(`${variant}: design expected 1 run, found ${expected}`); if (observed.length !== expected) { reasons.push( `${variant}: expected ${expected} observation${expected === 1 ? "" : "s"}, found ${observed.length}`, ); } if (expected === 1 && observed.length === 1 && observed[0].outcome !== "scored") { reasons.push(`${variant}: ${observed[0].outcome}`); } } if (reasons.length > 0) { return { blocked: { evalSet: group.evalSet, caseId: group.caseId, model: group.model, runNumber: group.runNumber, reasons, }, }; } return { pair: { control: group.observations.get(CONTROL)![0] as EvalObservation & { outcome: "scored" }, treatment: group.observations.get(TREATMENT)![0] as EvalObservation & { outcome: "scored" }, }, };
  ```

核验：`v1.4.0`

### E199

证据：测试

- [`packages/evals/test/comparison.test.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/evals/test/comparison.test.ts) — text: `it("fails closed for incomplete and errored pairs while retaining totals", () => { const observations: EvalObservation［］`，提示行 85

  ```text
  it("fails closed for incomplete and errored pairs while retaining totals", () => { const observations: EvalObservation[] = [ scored("without_docs", 1, 0), errored("with_docs", 1, 120), scored("without_docs", 2, 1, { totalTokens: 200 }), ]; const report = summarizeEvalObservations("digest", expectedFor([1, 2]), observations); expect(report.comparisons[0]).toEqual( expect.objectContaining({ totalPairs: 2, eligiblePairs: 0, blockedPairs: 2, lift: null }), ); expect(report.blockedPairs).toEqual([ expect.objectContaining({ runNumber: 1, reasons: ["with_docs: errored"] }), expect.objectContaining({ runNumber: 2, reasons: ["with_docs: expected 1 observation, found 0"] }), ]); expect(report.operationalTotals[0].totalTokens).toEqual({ availableRuns: 2, total: 300 }); }); it("blocks duplicate observations and keeps missing metrics distinct from zero", () => { const withoutTokens = scored("without_docs", 1, 1); delete withoutTokens.totalTokens; const report = summarizeEvalObservations("digest", expectedFor([1]), [ withoutTokens, withoutTokens, scored("with_docs", 1, 1, { totalTokens: 0 }), ]); expect(report.blockedPairs[0].reasons).toEqual(["without_docs: expected 1 observation, found 2"]); expect(report.operationalTotals[0].totalTokens).toEqual({ availableRuns: 0, total: null }); expect(report.operationalTotals[1].totalTokens).toEqual({ availableRuns: 1, total: 0 }); }); it("formats blocked comparisons and operational totals", () => { const report = summarizeEvalObservations("digest", expectedFor([1, 2]), [ scored("without_docs", 1, 1), scored("with_docs", 1, 1), ]); const formatted = stripVTControlCharacters(formatEvalComparisonReport(report)); expect(formatted).toContain("Documentation Eval Comparisons"); expect(formatted).toContain("Pass rate withheld because pairs are blocked"); expect(formatted).toContain("without_docs: 1 runs"); });
  ```

核验：`v1.4.0`

### E200

证据：零分测试

- [`packages/evals/test/report.test.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/evals/test/report.test.ts) — text: `it("treats a zero score as scored data", async () => { const { observation } = await readObservation({ meta: scoredMeta(`，提示行 184

  ```text
  it("treats a zero score as scored data", async () => { const { observation } = await readObservation({ meta: scoredMeta({ avgScore: 0 }) }); expect(observation).toMatchObject({ outcome: "scored", score: 0 }); });
  ```

核验：`v1.4.0`

### E201

证据：release 脚本

- [`scripts/release.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/release.mjs) — text: `console.log(` Added ［Unreleased］ to ${changelog}`); } } // Main flow console.log("\n=== Release Script ===\n"); // 1. Ch`，提示行 251

  ```text
  console.log(` Added [Unreleased] to ${changelog}`); } } // Main flow console.log("\n=== Release Script ===\n"); // 1. Check for uncommitted changes console.log("Checking for uncommitted changes..."); const status = run("git status --porcelain", { silent: true }); if (status && status.trim()) { console.error("Error: Uncommitted changes detected. Commit or stash first."); console.error(status); process.exit(1); }
  ```

核验：`v1.4.0`

### E202

证据：tag publish job

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `- name: Build run: npm run build - name: Check run: npm run check - name: Build the pi-env daemon for tests run: npm run`，提示行 363

  ```text
  - name: Build run: npm run build - name: Check run: npm run check - name: Build the pi-env daemon for tests run: npm run build:daemon --workspace packages/env - name: Test run: npm test - name: Smoke-test packed npm consumer run: npm run check:package-install
  ```

核验：`v1.4.0`

### E203

证据：README

- [`README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/README.md) — text: `'''bash node scripts/use-local-packages.mjs \ --manifest .artifacts/pi-packages/manifest.json \ --consumer ../my-project`，提示行 126

  ```text
  '''bash node scripts/use-local-packages.mjs \ --manifest .artifacts/pi-packages/manifest.json \ --consumer ../my-project \ --package @earendil-works/pi-durable \ --package @earendil-works/pi-agent-core cd ../my-project npm install --ignore-scripts ''' For a pnpm project, point `--consumer` at the workspace root:
  ```

核验：`v1.4.0`

### E204

证据：publish helper

- [`scripts/publish.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish.mjs) — text: `function isPublished(name, version) { try { const output = execNpmSync(［"view", `${name}@${version}`, "version", "--json`，提示行 13

  ```text
  function isPublished(name, version) { try { const output = execNpmSync(["view", `${name}@${version}`, "version", "--json"], { encoding: "utf8", stdio: ["inherit", "pipe", "pipe"], }); if (!output.trim()) throw new Error(`npm returned no version for ${name}@${version}`); return true; } catch (error) { const output = error && typeof error === "object" ? ["stdout", "stderr"].map((key) => key in error ? String(error[key] ?? "") : "").filter(Boolean).join("\n") : ""; if (output.includes("E404") || output.includes("404 Not Found")) return false; throw new Error(`Failed to query ${name}@${version}${output ? `\n${output}` : ""}`, { cause: error }); } }
  ```

核验：`v1.4.0`

## 12_pi_philosophy/research.md

### E205

证据：README:15–21

- [`README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/README.md) — text: `Pi is a minimal, extensible agent harness that you can make your own. Adapt Pi to your workflows, not the other way arou`，提示行 15

  ```text
  Pi is a minimal, extensible agent harness that you can make your own. Adapt Pi to your workflows, not the other way around. Customize Pi with [extensions](packages/coding-agent/docs/extensions.md), [skills](packages/coding-agent/docs/skills.md), [prompt templates](packages/coding-agent/docs/prompt-templates.md), and [themes](packages/coding-agent/docs/themes.md). Bundle them as [Pi packages](packages/coding-agent/docs/packages.md) and share via npm or git. Pi ships with powerful defaults but skips features like sub-agents and plan mode. Ask Pi to build what you want, or install a package that does it your way. Use Pi [interactively](packages/coding-agent/docs/usage.md), automate it in [print or JSON mode](packages/coding-agent/docs/cli.md), control it over [RPC](packages/coding-agent/docs/rpc.md), or build apps with the [Pi TypeScript SDK](packages/coding-agent/docs/sdk.md). See [OpenClaw](https://github.com/OpenClaw/OpenClaw) for a real-world integration.
  ```

核验：`v1.4.0`

### E206

证据：CONTRIBUTING:7–11

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `First things first: **pi's core is minimal**. If your feature does not belong in the core, it should be an extension. PR`，提示行 7

  ```text
  First things first: **pi's core is minimal**. If your feature does not belong in the core, it should be an extension. PRs that bloat the core will likely be rejected. Pi's core exists to be minimal and to be extensible so that it can be influenced and manipulated by extensions. Even hook points for extensions however should be well considered and discussed to avoid adding unmaintainable bloat and complex interactions.
  ```

核验：`v1.4.0`

### E207

证据：README:21

- [`README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/README.md) — text: `Use Pi ［interactively］(packages/coding-agent/docs/usage.md), automate it in ［print or JSON mode］(packages/coding-agent/d`，提示行 21

  ```text
  Use Pi [interactively](packages/coding-agent/docs/usage.md), automate it in [print or JSON mode](packages/coding-agent/docs/cli.md), control it over [RPC](packages/coding-agent/docs/rpc.md), or build apps with the [Pi TypeScript SDK](packages/coding-agent/docs/sdk.md). See [OpenClaw](https://github.com/OpenClaw/OpenClaw) for a real-world integration.
  ```

核验：`v1.4.0`

### E208

证据：AgentSession:1839–1876

- [`packages/coding-agent/src/core/agent-session.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/agent-session.ts) — text: `// Tools the branch ever added or removed. Removed tools stay inactive. const mentioned = new Set( systemMessages .flatM`，提示行 1839

  ```text
  // Tools the branch ever added or removed. Removed tools stay inactive. const mentioned = new Set( systemMessages .flatMap((message) => [...(message.toolsAdded ?? []), ...(message.toolsRemoved ?? [])]) .map((tool) => tool.name), ); // Extension tools the branch never mentioned were registered after it recorded its loadout, so // they are activated like newly registered tools. Built-in tools follow `defaultTools` instead. const newTools = [...this._toolRegistry.keys()].filter( (name) => !mentioned.has(name) && !this._baseToolDefinitions.has(name) && this._isActivatedOnRegistration(name), ); // The recorded loadout plus the new tools, with `--tools +name`/`-name` applied. const names = applyToolModifiers( [...getCurrentTools(systemMessages).map((tool) => tool.name), ...newTools], modifiers, ); // Recorded tools that are not registered yet, such as MCP tools of servers still connecting, are // activated when they register. Excluded tools never register, so they are not kept pending. this._pendingToolNames = new Set(names.filter((name) => this._isAllowedTool(name))); // Ignores names that are not registered. this._setActiveTools(names); } // ========================================================================= // Prompting // ========================================================================= /** * Start a run from a user or custom message. The session counts as busy from here on, so * messages sent while before_agent_start handlers run are queued into this run instead of * starting another, and an abort requested meanwhile aborts the run as soon as it exists. * @param onStarted Called once the run's messages are prepared, before the first request. */ private async _startRun(trigger: BeforeAgentStartTrigger, onStarted?: () => void): Promise<void> { this._isAgentRunActive = true; this._agentRunAbortRequested = false; let messages: AgentMessage[];
  ```

核验：`v1.4.0`

### E209

证据：_prepareRetry:3747–3786

- [`packages/coding-agent/src/core/agent-session.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/agent-session.ts) — text: `const hasBindings = this._extensionUIContext || this._extensionCommandContextActions || this._extensionShutdownHandler |`，提示行 3747

  ```text
  const hasBindings = this._extensionUIContext || this._extensionCommandContextActions || this._extensionShutdownHandler || this._extensionErrorListener; if (hasBindings) { await options?.beforeSessionStart?.(); await this._extensionRunner.emit({ type: "session_start", reason: "reload" }); this._extensionRunner.reportUnhandledMcpServers(); await this.extendResourcesFromExtensions("reload"); } } // ========================================================================= // Auto-Retry // ========================================================================= /** * Check if an error is retryable (overloaded, rate limit, server errors). * Context overflow errors are NOT retryable (handled by compaction instead). */ private _isRetryableError(message: AssistantMessage): boolean { // Context overflow is handled by compaction, not retry. if (isContextOverflow(message, (this._modelForMessage(message) ?? this.model)?.contextWindow ?? 0)) return false; return isRetryableAssistantError(message); } /** * Retry policy + callbacks shared by compaction and branch-summary summarization calls. * Uses the same `settings.retry` budget/backoff as agent-turn retries so a single transient * stream drop no longer fails the whole operation. `source` carries the context * the TUI needs to render the retry and recreate the underlying indicator. */ private _summarizationRetryCallbacks( source: { source: "branchSummary" } | { source: "compaction"; reason: "manual" | "threshold" | "overflow" }, ): RetryCallbacks { return { onRetryScheduled: (attempt, maxAttempts, delayMs, errorMessage) => { this._emit({
  ```

核验：`v1.4.0`

### E210

证据：package.json:20–27

- [`package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/package.json) — text: `"build:native:win32": "npm --prefix packages/tui run build:native:win32", "check": "node scripts/biome-check.mjs --write`，提示行 20

  ```text
  "build:native:win32": "npm --prefix packages/tui run build:native:win32", "check": "node scripts/biome-check.mjs --write && npm run check:pinned-deps && npm run check:runtime-deps && npm run check:ts-imports && npm run check:entry-graphs && npm run check:install-lock:coding-agent && tsc --noEmit && npm run check:browser-smoke", "check:browser-smoke": "node scripts/check-browser-smoke.mjs", "check:pinned-deps": "node scripts/check-pinned-deps.mjs", "check:runtime-deps": "node scripts/check-runtime-deps.mjs", "check:package-install": "node scripts/check-package-install.mjs", "check:install-lock:coding-agent": "node scripts/generate-coding-agent-install-lock.mjs --check", "check:ts-imports": "node scripts/check-ts-relative-imports.mjs",
  ```

核验：`v1.4.0`

### E211

证据：tsconfig:56–57

- [`tsconfig.json`](https://github.com/earendil-works/pi/blob/v1.4.0/tsconfig.json) — text: `"include": ［"scripts/model-catalog-protocol.ts", "scripts/model-catalog-protocol.test.ts", "packages/*/src/**/*", "packa`，提示行 52

  ```text
  "include": ["scripts/model-catalog-protocol.ts", "scripts/model-catalog-protocol.test.ts", "packages/*/src/**/*", "packages/*/test/**/*", "packages/durable/test-workers/**/*", "packages/coding-agent/examples/**/*", "packages/agent/examples/**/*"], "exclude": ["**/dist/**", "packages/coding-agent/examples/extensions/gondolin/**"]
  ```

核验：`v1.4.0`

### E212

证据：runtime-deps 负例测试:27–34

- [`scripts/check-runtime-deps.test.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-runtime-deps.test.mjs) — text: `// #9132: workspace resolution and installing every release package masked a missing runtime dependency. test("rejects u`，提示行 27

  ```text
  // #9132: workspace resolution and installing every release package masked a missing runtime dependency. test("rejects undeclared imports even when the workspace package exists", async (t) => { const result = await check(t, {}, 'export { createUnixServer } from "@earendil-works/pi-server/unix";', { "packages/server/package.json": JSON.stringify({ name: "@earendil-works/pi-server", version: "1.0.0" }), }); assert.equal(result.status, 1); assert.match(result.stderr, /src[\\/]index\.ts:1: @earendil-works\/pi-server\/unix is not declared/); });
  ```

核验：`v1.4.0`

### E213

证据：settings:44

- [`packages/coding-agent/docs/settings.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/settings.md) — text: `| `codemode.inlineBudget` | number | `3000` | Estimated tokens (characters / 4) the `codemode` tool's description may sp`，提示行 44

  ```text
  | `codemode.inlineBudget` | number | `3000` | Estimated tokens (characters / 4) the `codemode` tool's description may spend on tool declarations. Tools that do not fit are left out and found with `searchTools()`. `0` lists only namespaces. |
  ```

核验：`v1.4.0`
