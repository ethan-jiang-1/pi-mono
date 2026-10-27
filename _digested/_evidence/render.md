# 证据附录（生成物）

由 `_evidence/claims.json` 生成，基线 `v1.4.0`。**不要手改**；改台账后重新运行：

```sh
node _digested/_evidence/tools/render-evidence.mjs --corpus <语料目录>
```

正文的 `[E###]` 指向本文件的对应标题。每条记录给出符号/小节定位、原文引文与核验版本；
行号仅作为人读提示，机器校验不使用行号。

## harness/05-Design-Causality/5.1_knowledge_externalization.md

### E001

仓库把质量规则写成一条 npm run check 链：biome、依赖、类型、入口图、install-lock 与 browser smoke

- [`package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/package.json) — text: `"build:native:win32": "npm --prefix packages/tui run build:native:win32", "check": "node scripts/biome-check.mjs --write`，提示行 20

  ```text
  "build:native:win32": "npm --prefix packages/tui run build:native:win32", "check": "node scripts/biome-check.mjs --write && npm run check:pinned-deps && npm run check:runtime-deps && npm run check:ts-imports && npm run check:entry-graphs && npm run check:install-lock:coding-agent && tsc --noEmit && npm run check:browser-smoke", "check:browser-smoke": "node scripts/check-browser-smoke.mjs", "check:pinned-deps": "node scripts/check-pinned-deps.mjs", "check:runtime-deps": "node scripts/check-runtime-deps.mjs", "check:package-install": "node scripts/check-package-install.mjs", "check:install-lock:coding-agent": "node scripts/generate-coding-agent-install-lock.mjs --check", "check:ts-imports": "node scripts/check-ts-relative-imports.mjs",
  ```

核验：`v1.4.0`

### E002

根 tsconfig 的 include 覆盖 packages/*/src、test 与 examples，类型检查面与仓库结构一致

- [`tsconfig.json`](https://github.com/earendil-works/pi/blob/v1.4.0/tsconfig.json) — text: `"include": ［"scripts/model-catalog-protocol.ts", "scripts/model-catalog-protocol.test.ts", "packages/*/src/**/*", "packa`，提示行 52

  ```text
  "include": ["scripts/model-catalog-protocol.ts", "scripts/model-catalog-protocol.test.ts", "packages/*/src/**/*", "packages/*/test/**/*", "packages/durable/test-workers/**/*", "packages/coding-agent/examples/**/*", "packages/agent/examples/**/*"], "exclude": ["**/dist/**", "packages/coding-agent/examples/extensions/gondolin/**"]
  ```

核验：`v1.4.0`

### E003

runtime-deps 检查有回归测试，覆盖 workspace 解析与缺依赖导致的失败

- [`scripts/check-runtime-deps.test.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-runtime-deps.test.mjs) — text: `// #9132: workspace resolution and installing every release package masked a missing runtime dependency. test("rejects u`，提示行 27

  ```text
  // #9132: workspace resolution and installing every release package masked a missing runtime dependency. test("rejects undeclared imports even when the workspace package exists", async (t) => { const result = await check(t, {}, 'export { createUnixServer } from "@earendil-works/pi-server/unix";', { "packages/server/package.json": JSON.stringify({ name: "@earendil-works/pi-server", version: "1.0.0" }), }); assert.equal(result.status, 1); assert.match(result.stderr, /src[\\/]index\.ts:1: @earendil-works\/pi-server\/unix is not declared/); });
  ```

核验：`v1.4.0`

## harness/05-Design-Causality/5.2_shape_causality.md

### E004

核心保持最小且可被扩展操纵；扩展 hook 点也要经讨论

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `Pi's core exists to be minimal and to be extensible so that it can be influenced and manipulated by extensions. Even hoo`，提示行 11

  ```text
  Pi's core exists to be minimal and to be extensible so that it can be influenced and manipulated by extensions. Even hook points for extensions however should be well considered and discussed to avoid adding unmaintainable bloat and complex interactions.
  ```

核验：`v1.4.0`

### E005

根 README 把贡献规则与开发规则指向 CONTRIBUTING.md 与 AGENTS.md

- [`README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/README.md) — text: `See ［CONTRIBUTING.md］(CONTRIBUTING.md) for contribution guidelines and ［AGENTS.md］(AGENTS.md) for project-specific rules`，提示行 100

  ```text
  See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines and [AGENTS.md](AGENTS.md) for project-specific rules (for both humans and agents). Longer term plans for Pi can also be found in [RFCs](https://rfc.earendil.com/keyword/pi/).
  ```

核验：`v1.4.0`

## harness/05-Design-Causality/5.3_paved_road_friction.md

### E006

session 出错后清空错误态与 steer/follow-up 两条队列，避免残留状态影响下一轮

- [`packages/agent/src/agent.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/agent/src/agent.ts) — text: `this._state.errorMessage = undefined; this.clearFollowUpQueue(); this.clearSteeringQueue(); }`，提示行 374

  ```text
  this._state.errorMessage = undefined; this.clearFollowUpQueue(); this.clearSteeringQueue(); }
  ```

核验：`v1.4.0`

### E007

runtime-deps 的负例测试覆盖 dev-only 依赖、副作用 import、混合导出与字面量运行时加载

- [`scripts/check-runtime-deps.test.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-runtime-deps.test.mjs) — text: `test("rejects dev-only dependencies, side-effect imports, mixed exports, and literal runtime loads", async (t) => { cons`，提示行 57

  ```text
  test("rejects dev-only dependencies, side-effect imports, mixed exports, and literal runtime loads", async (t) => { const result = await check(t, { devDependencies: { dev: "1.0.0" } }, ` import "dev"; import {} from "empty-import"; export {} from "empty-export"; export { type T, value } from "mixed-export"; const lazy = () => import("lazy/subpath"); const required = require("required"); const resolved = require.resolve("resolved/subpath"); `); assert.equal(result.status, 1); for (const name of ["dev", "empty-import", "empty-export", "mixed-export", "lazy/subpath", "required", "resolved/subpath"]) { assert.ok(result.stderr.includes(`${name} is not declared`), result.stderr); } }); test("allows imported JSON assets outside the TypeScript include pattern", async (t) => { const result = await check(t, {}, 'import data from "./data.json";', { "packages/example/tsconfig.build.json": JSON.stringify({ include: ["src/**/*.ts"], compilerOptions: { resolveJsonModule: true } }), "packages/example/src/data.json": "{}", }); assert.equal(result.status, 0, result.stderr); }); test("permits dev-only dependencies in sources excluded from the published build", async (t) => { const result = await check(t, { devDependencies: { server: "1.0.0" } }, "", { "packages/example/tsconfig.build.json": JSON.stringify({ include: ["src/**/*.ts"], exclude: ["src/experimental"] }), "packages/example/src/experimental/server.ts": 'import "server";', }); assert.equal(result.status, 0, result.stderr); }); // #9132: an experimental flag cannot prevent module resolution through a public entrypoint. for (const statement of ['export * from "./experimental/server";', 'import type { Options } from "./experimental/server";']) { test(`rejects excluded code reachable through ${statement}`, async (t) => { const result = await check(t, { devDependencies: { server: "1.0.0" } }, statement, { "packages/example/tsconfig.build.json": JSON.stringify({ include: ["src/**/*.ts"], exclude: ["src/experimental"] }), "packages/example/src/experimental/server.ts": 'import "server"; export interface Options {}', }); assert.equal(result.status, 1); assert.match(result.stderr, /is excluded from example's build but imported by it/); assert.match(result.stderr, /server is not declared/); });
  ```

核验：`v1.4.0`

### E008

仓库提供 profile:tui 与 profile:rpc 脚本用于性能剖析

- [`package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/package.json) — text: `"profile:tui": "node scripts/profile-coding-agent-node.mjs --mode tui", "profile:rpc": "node scripts/profile-coding-agen`，提示行 38

  ```text
  "profile:tui": "node scripts/profile-coding-agent-node.mjs --mode tui", "profile:rpc": "node scripts/profile-coding-agent-node.mjs --mode rpc",
  ```

核验：`v1.4.0`

## harness/05-Design-Causality/5.4_feedback_loops.md

### E009

工具可在执行前通过 prepareArguments 调整调用参数

- [`packages/agent/src/agent-loop.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/agent/src/agent-loop.ts) — text: `if (!tool.prepareArguments) { return toolCall; } const preparedArguments = tool.prepareArguments(toolCall.arguments); if`，提示行 705

  ```text
  if (!tool.prepareArguments) { return toolCall; } const preparedArguments = tool.prepareArguments(toolCall.arguments); if (preparedArguments === toolCall.arguments) { return toolCall; } return { ...toolCall, arguments: preparedArguments as Record<string, any>, }; } async function prepareToolCall( currentContext: AgentContext, assistantMessage: AssistantMessage, toolCall: AgentToolCall, config: ToolCallHooks, signal: AbortSignal | undefined, tools: readonly AgentTool<any>[] = currentContext.tools ?? [], ): Promise<PreparedToolCall | ImmediateToolCallOutcome> { const tool = tools.find((t) => t.name === toolCall.name); if (!tool) { return { kind: "immediate", result: createErrorToolResult(`Tool ${toolCall.name} not found`), isError: true, }; } try { const preparedToolCall = prepareToolCallArguments(tool, toolCall); const validatedArgs = validateToolArguments(tool, preparedToolCall); if (config.beforeToolCall) { const beforeResult = await config.beforeToolCall( { assistantMessage, toolCall, args: validatedArgs, context: currentContext, }, signal, ); if (signal?.aborted) { return { kind: "immediate", result: createErrorToolResult("Operation aborted"), isError: true, }; } if (beforeResult?.block) { const result = createErrorToolResult(beforeResult.reason || "Tool execution was blocked"); if (beforeResult.terminate === true) { result.terminate = true; } return { kind: "immediate", result, isError: true, }; } } if (signal?.aborted) { return { kind: "immediate", result: createErrorToolResult("Operation aborted"), isError: true, }; } return { kind: "prepared",
  ```

核验：`v1.4.0`

### E010

循环把 prepareRequest 返回的 thinkingLevel 应用到下一次请求

- [`packages/agent/src/agent-loop.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/agent/src/agent-loop.ts) — text: `? undefined : requestUpdate.thinkingLevel, }; } // Stream assistant response const message = await streamAssistantRespon`，提示行 245

  ```text
  ? undefined : requestUpdate.thinkingLevel, }; } // Stream assistant response const message = await streamAssistantResponse(currentContext, config, signal, emit, streamFunction); newMessages.push(message); if (message.stopReason === "error" || message.stopReason === "aborted") { lastCompletedTurn = { message, toolResults: [], context: currentContext, newMessages, }; await config.finishTurn?.(lastCompletedTurn, signal); await emit({ type: "turn_end", message, toolResults: [] }); await emit({ type: "agent_end", messages: newMessages }); return; } // Check for tool calls const toolCalls = message.content.filter((c) => c.type === "toolCall"); const toolResults: ToolResultMessage[] = [];
  ```

核验：`v1.4.0`

### E011

分支记录曾增删的工具，被移除的工具保持 inactive

- [`packages/coding-agent/src/core/agent-session.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/agent-session.ts) — text: `// Tools the branch ever added or removed. Removed tools stay inactive. const mentioned = new Set( systemMessages .flatM`，提示行 1839

  ```text
  // Tools the branch ever added or removed. Removed tools stay inactive. const mentioned = new Set( systemMessages .flatMap((message) => [...(message.toolsAdded ?? []), ...(message.toolsRemoved ?? [])]) .map((tool) => tool.name), ); // Extension tools the branch never mentioned were registered after it recorded its loadout, so // they are activated like newly registered tools. Built-in tools follow `defaultTools` instead. const newTools = [...this._toolRegistry.keys()].filter( (name) => !mentioned.has(name) && !this._baseToolDefinitions.has(name) && this._isActivatedOnRegistration(name), ); // The recorded loadout plus the new tools, with `--tools +name`/`-name` applied. const names = applyToolModifiers( [...getCurrentTools(systemMessages).map((tool) => tool.name), ...newTools], modifiers, ); // Recorded tools that are not registered yet, such as MCP tools of servers still connecting, are // activated when they register. Excluded tools never register, so they are not kept pending. this._pendingToolNames = new Set(names.filter((name) => this._isAllowedTool(name))); // Ignores names that are not registered. this._setActiveTools(names); } // ========================================================================= // Prompting // ========================================================================= /** * Start a run from a user or custom message. The session counts as busy from here on, so * messages sent while before_agent_start handlers run are queued into this run instead of * starting another, and an abort requested meanwhile aborts the run as soon as it exists. * @param onStarted Called once the run's messages are prepared, before the first request. */ private async _startRun(trigger: BeforeAgentStartTrigger, onStarted?: () => void): Promise<void> { this._isAgentRunActive = true; this._agentRunAbortRequested = false; let messages: AgentMessage[];
  ```

核验：`v1.4.0`

### E012

扩展 UI、命令上下文或关闭动作任一存在即视为有绑定

- [`packages/coding-agent/src/core/agent-session.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/agent-session.ts) — text: `const hasBindings = this._extensionUIContext || this._extensionCommandContextActions || this._extensionShutdownHandler |`，提示行 3747

  ```text
  const hasBindings = this._extensionUIContext || this._extensionCommandContextActions || this._extensionShutdownHandler || this._extensionErrorListener; if (hasBindings) { await options?.beforeSessionStart?.(); await this._extensionRunner.emit({ type: "session_start", reason: "reload" }); this._extensionRunner.reportUnhandledMcpServers(); await this.extendResourcesFromExtensions("reload"); } } // ========================================================================= // Auto-Retry // ========================================================================= /** * Check if an error is retryable (overloaded, rate limit, server errors). * Context overflow errors are NOT retryable (handled by compaction instead). */ private _isRetryableError(message: AssistantMessage): boolean { // Context overflow is handled by compaction, not retry. if (isContextOverflow(message, (this._modelForMessage(message) ?? this.model)?.contextWindow ?? 0)) return false; return isRetryableAssistantError(message); } /** * Retry policy + callbacks shared by compaction and branch-summary summarization calls. * Uses the same `settings.retry` budget/backoff as agent-turn retries so a single transient * stream drop no longer fails the whole operation. `source` carries the context * the TUI needs to render the retry and recreate the underlying indicator. */ private _summarizationRetryCallbacks( source: { source: "branchSummary" } | { source: "compaction"; reason: "manual" | "threshold" | "overflow" }, ): RetryCallbacks { return { onRetryScheduled: (attempt, maxAttempts, delayMs, errorMessage) => { this._emit({
  ```

核验：`v1.4.0`

## trajectory/01-model-visible-invariant.md

### E013

declareToolChanges 把工具声明与 context.tools 的差量写进 system message，保证重放得到相同工具集

- [`packages/agent/src/agent-loop.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/agent/src/agent-loop.ts) — text: `/** * Declare tool loadout changes to the model. * * `context.tools` is what the runtime can execute; the transcript's s`，提示行 332

  ```text
  /** * Declare tool loadout changes to the model. * * `context.tools` is what the runtime can execute; the transcript's system messages declare * what the model may call. Before each request the difference becomes `toolsAdded` and * `toolsRemoved` on a system message. When a pending system message exists, its tool fields * are treated as intent and replaced with the delta between the committed transcript and * the executable set, so replay always yields exactly `context.tools`. Otherwise a new * system message is inserted before the first non-system pending message. */ function declareToolChanges(context: AgentContext, pendingMessages: AgentMessage[]): AgentMessage[] {
  ```

核验：`v1.4.0`

### E014

compaction entry 携带被压缩 system message 的重放状态

- [`packages/coding-agent/src/core/compaction/compaction.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/compaction/compaction.ts) — text: `// System messages are prompt state, not conversation; the compaction entry carries their replay.`，提示行 100

  ```text
  // System messages are prompt state, not conversation; the compaction entry carries their replay.
  ```

核验：`v1.4.0`

### E015

resume 时 SDK 把 buildSessionContext 折叠出的消息灌入 Agent 的 initialState.messages

- [`packages/coding-agent/src/core/sdk.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/sdk.ts) — text: `const agent = new Agent({ initialState: { systemPrompt: "", model, thinkingLevel, tools: ［］, messages: existingSession.m`，提示行 403

  ```text
  const agent = new Agent({ initialState: { systemPrompt: "", model, thinkingLevel, tools: [], messages: existingSession.messages,
  ```

核验：`v1.4.0`

### E016

会话在边界提交与压缩时把 agent.state.messages 与投影重新对齐

- [`packages/coding-agent/src/core/agent-session.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/agent-session.ts) — text: `private _refreshFinalizedContext(): void { const projection = this.sessionManager.buildSessionProjection(); for (const e`，提示行 938

  ```text
  private _refreshFinalizedContext(): void { const projection = this.sessionManager.buildSessionProjection(); for (const entry of projection.entries) { for (const message of entry.messages) this._entryIdsByMessage.set(message, entry.sourceEntry.id); } this.agent.state.messages = projection.messages; }
  ```

核验：`v1.4.0`

### E017

round-trip 测试断言 session JSON 往返后工具声明不变

- [`packages/coding-agent/test/system-prompt-updates.test.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/system-prompt-updates.test.ts) — text: `test("keeps tool declarations stable across a session JSON round-trip", async () => { const executableTool: AgentTool = `，提示行 276

  ```text
  test("keeps tool declarations stable across a session JSON round-trip", async () => { const executableTool: AgentTool = { name: "plain", label: "Plain", description: "Plain tool", parameters: Type.Object({}), execute: async () => ({ content: [], details: {} }), }; const harness = await createHarness({ tools: [executableTool], initialActiveToolNames: ["plain"] }); try { harness.setResponses([fauxAssistantMessage("first"), fauxAssistantMessage("second")]); await harness.session.prompt("one"); const head = harness.session.messages[0]; if (head?.role !== "system") throw new Error("expected system message"); const declaration = head.toolsAdded?.[0]; if (!declaration) throw new Error("expected tool declaration"); expect(Object.hasOwn(declaration, "constrainedSampling")).toBe(false); expect(Object.hasOwn(declaration, "execute")).toBe(false); // Simulate a resume: the persisted JSON must replay to the same declarations. harness.session.agent.state.messages = JSON.parse(JSON.stringify(harness.session.messages)); await harness.session.prompt("two"); expect(harness.session.messages.filter((message) => message.role === "system")).toHaveLength(1); } finally { harness.cleanup(); } });
  ```

核验：`v1.4.0`

## trajectory/02-session-jsonl-anatomy.md

### E018

打开既有会话时用 buildSessionContext 恢复消息上下文

- [`packages/coding-agent/src/core/sdk.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/sdk.ts) — text: `// Check if session has existing data to restore const existingSession = sessionManager.buildSessionContext(); const has`，提示行 209

  ```text
  // Check if session has existing data to restore const existingSession = sessionManager.buildSessionContext(); const hasExistingSession = existingSession.messages.length > 0; const hasThinkingEntry = sessionManager.getBranch().some((entry) => entry.type === "thinking_level_change"); let model = options.model; let modelFallbackMessage: string | undefined; // Assistant messages name the physical model that answered, so a virtual selection is only in // model_change entries. const sessionModel = getBranchSelection(sessionManager.getBranch(), (provider, modelId) => modelRuntime.getModel(provider, modelId), );
  ```

核验：`v1.4.0`

### E019

custom 消息转换为上下文时被包成 text block

- [`packages/coding-agent/src/core/messages.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/messages.ts) — text: `case "custom": { const content = typeof m.content === "string" ? ［{ type: "text" as const, text: m.content }］ : m.conten`，提示行 162

  ```text
  case "custom": { const content = typeof m.content === "string" ? [{ type: "text" as const, text: m.content }] : m.content; return { role: "user", content, timestamp: m.timestamp, }; }
  ```

核验：`v1.4.0`

### E020

buildSessionProjection 从条目树与叶子构建会话投影

- [`packages/coding-agent/src/core/session-manager.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/session-manager.ts) — text: `export function buildSessionProjection( entries: SessionEntry［］, leafId?: string | null, byId?: Map<string, SessionEntry`，提示行 543

  ```text
  export function buildSessionProjection( entries: SessionEntry[], leafId?: string | null, byId?: Map<string, SessionEntry>, ): SessionProjection { const path = buildSessionPath(entries, leafId, byId); const { thinkingLevel, model } = getSessionContextSettings(path); const contextEntries = buildContextEntries(entries, leafId, byId); const edits = new Map<string, ContextEditEntry>(); for (const entry of contextEntries) { if (entry.type === "context_edit") edits.set(entry.targetId, entry); } const projectedEntries = contextEntries.map( (sourceEntry, index): ProjectedSessionEntry => ({ sourceEntry, // buildContextEntries() may retain an older compaction entry because its // raw ID lies inside the newest retained range. Only the newest compaction // at index zero contributes a checkpoint and summary. messages: sourceEntry.type === "compaction" && index > 0 ? [] : projectContextEntry(sourceEntry, edits.get(sourceEntry.id)), }), ); return { entries: projectedEntries, messages: projectedEntries.flatMap((entry) => entry.messages), thinkingLevel, model, }; }
  ```

核验：`v1.4.0`

### E021

convertToLlm 把 AgentMessage 映射为 provider 的 Message

- [`packages/coding-agent/src/core/messages.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/messages.ts) — text: `export function convertToLlm(messages: AgentMessage［］): Message［］ { return messages .map((m): Message | undefined => { s`，提示行 148

  ```text
  export function convertToLlm(messages: AgentMessage[]): Message[] { return messages .map((m): Message | undefined => { switch (m.role) { case "bashExecution": // Skip messages excluded from context (!! prefix) if (m.excludeFromContext) { return undefined; } return { role: "user", content: [{ type: "text", text: bashExecutionToText(m) }], timestamp: m.timestamp, }; case "custom": { const content = typeof m.content === "string" ? [{ type: "text" as const, text: m.content }] : m.content; return { role: "user", content, timestamp: m.timestamp, }; } case "branchSummary": return { role: "user", content: [{ type: "text" as const, text: BRANCH_SUMMARY_PREFIX + m.summary + BRANCH_SUMMARY_SUFFIX }], timestamp: m.timestamp, }; case "compactionSummary": return { role: "user", content: [ { type: "text" as const, text: COMPACTION_SUMMARY_PREFIX + m.summary + COMPACTION_SUMMARY_SUFFIX }, ], timestamp: m.timestamp, }; case "system": case "user": case "assistant": case "toolResult": return m; default: // biome-ignore lint/correctness/noSwitchDeclarations: fine const _exhaustiveCheck: never = m; return undefined; } }) .filter((m) => m !== undefined); }
  ```

核验：`v1.4.0`

### E022

session JSONL 当前版本是 3

- [`packages/coding-agent/src/core/session-manager.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/session-manager.ts) — text: `export const CURRENT_SESSION_VERSION = 3;`，提示行 41

  ```text
  export const CURRENT_SESSION_VERSION = 3;
  ```

核验：`v1.4.0`

### E023

旧 v1 会话在载入时就地迁移出 id/parentId 树结构

- [`packages/coding-agent/src/core/session-manager.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/session-manager.ts) — text: `/** Migrate v1 → v2: add id/parentId tree structure. Mutates in place. */ function migrateV1ToV2(entries: FileEntry［］): `，提示行 286

  ```text
  /** Migrate v1 → v2: add id/parentId tree structure. Mutates in place. */ function migrateV1ToV2(entries: FileEntry[]): void { const ids = new Set<string>(); let prevId: string | null = null; for (const entry of entries) { if (entry.type === "session") { entry.version = 2; continue; } entry.id = generateId(ids); entry.parentId = prevId; prevId = entry.id; // Convert firstKeptEntryIndex to firstKeptEntryId for compaction if (entry.type === "compaction") { const comp = entry as CompactionEntry & { firstKeptEntryIndex?: number }; if (typeof comp.firstKeptEntryIndex === "number") { const targetEntry = entries[comp.firstKeptEntryIndex]; if (targetEntry && targetEntry.type !== "session") { comp.firstKeptEntryId = targetEntry.id; } delete comp.firstKeptEntryIndex; } } } } /** Migrate v2 → v3: rename hookMessage role to custom. Mutates in place. */ function migrateV2ToV3(entries: FileEntry[]): void { for (const entry of entries) { if (entry.type === "session") { entry.version = 3; continue; } // Update message entries with hookMessage role if (entry.type === "message") { const msgEntry = entry as SessionMessageEntry; if (msgEntry.message && (msgEntry.message as { role: string }).role === "hookMessage") { (msgEntry.message as { role: string }).role = "custom"; } } } } /** * Run all necessary migrations to bring entries to current version. * Mutates entries in place. Returns true if any migration was applied. */ function migrateToCurrentVersion(entries: FileEntry[]): boolean { const header = entries.find((e) => e.type === "session") as SessionHeader | undefined; const version = header?.version ?? 1; if (version >= CURRENT_SESSION_VERSION) return false; if (version < 2) migrateV1ToV2(entries); if (version < 3) migrateV2ToV3(entries);
  ```

核验：`v1.4.0`

### E024

可用一 token 输出上限重放请求，检查 prompt cache 条目是否保持不变

- [`packages/coding-agent/src/core/cache-warmer.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/cache-warmer.ts) — text: `* Whether replaying the request with a one-token output cap leaves its cache * entry untouched. Anthropic's budget-based`，提示行 49

  ```text
  * Whether replaying the request with a one-token output cap leaves its cache * entry untouched. Anthropic's budget-based thinking (Claude models without * adaptive thinking) derives `budget_tokens` from `max_tokens`; the replay * would get a different budget, which Anthropic keys the message cache on, * and the model could still think for thousands of tokens. */ export function isReplayable(model: Model<Api>, options: SimpleStreamOptions | undefined): boolean {
  ```

核验：`v1.4.0`

### E025

SessionManager.open(path) 打开既有会话文件

- [`packages/coding-agent/src/core/session-manager.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/session-manager.ts) — text: `static open(path: string, sessionDir?: string, cwdOverride?: string): SessionManager {`，提示行 1766

  ```text
  static open(path: string, sessionDir?: string, cwdOverride?: string): SessionManager {
  ```

核验：`v1.4.0`

### E026

/export 未给路径时生成带时间戳的 JSONL 文件名

- [`packages/coding-agent/src/core/session-export.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/session-export.ts) — text: `outputPath ?? `session-${new Date().toISOString().replace(/［:.］/g, "-")}.jsonl`,`，提示行 38

  ```text
  outputPath ?? `session-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`,
  ```

核验：`v1.4.0`

### E027

命令参数解析按首个空白切分参数串

- [`packages/coding-agent/src/modes/interactive/interactive-mode.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/modes/interactive/interactive-mode.ts) — text: `const firstWhitespaceIndex = argsString.search(/\s/);`，提示行 6533

  ```text
  const firstWhitespaceIndex = argsString.search(/\s/);
  ```

核验：`v1.4.0`

### E028

会话导出与导入使用 session.jsonl 文件名

- [`packages/coding-agent/src/modes/interactive/session-share.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/modes/interactive/session-share.ts) — text: `const jsonlFile = path.join(tempDir, "session.jsonl");`，提示行 59

  ```text
  const jsonlFile = path.join(tempDir, "session.jsonl");
  ```

核验：`v1.4.0`

### E029

分享时把 session.jsonl 作为 application/x-ndjson 上传

- [`packages/coding-agent/src/core/bug-report.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/bug-report.ts) — text: `files.push({ name: "session.jsonl", contentType: "application/x-ndjson", data: bundle.sessionJsonl });`，提示行 262

  ```text
  files.push({ name: "session.jsonl", contentType: "application/x-ndjson", data: bundle.sessionJsonl });
  ```

核验：`v1.4.0`

### E030

无扩展注入时，provider 收到的 system prompt 就是重放出的 transcript prompt

- [`packages/evals/src/harness.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/evals/src/harness.ts) — text: `// extension sent; otherwise the replayed transcript prompt is what the provider received. const systemPrompt = forcedSy`，提示行 389

  ```text
  // extension sent; otherwise the replayed transcript prompt is what the provider received. const systemPrompt = forcedSystemPrompt ?? getCurrentSystemPrompt(session.messages); const stats = session.getSessionStats();
  ```

核验：`v1.4.0`

## trajectory/04-record-replay-diy-fixture.md

### E031

test harness 的 sessionManager 选项用于续接会话或测试 resume

- [`packages/coding-agent/test/suite/harness.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/suite/harness.ts) — text: `/** Session to continue, for example to test a resume. Default: a new in-memory session. */ sessionManager?: SessionMana`，提示行 123

  ```text
  /** Session to continue, for example to test a resume. Default: a new in-memory session. */ sessionManager?: SessionManager; }
  ```

核验：`v1.4.0`

### E032

before_provider_request 可替换 provider 请求 payload

- [`packages/coding-agent/src/core/extensions/types.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/extensions/types.ts) — text: `/** Fired before a provider request is sent. Can replace the payload. */ export interface BeforeProviderRequestEvent { t`，提示行 900

  ```text
  /** Fired before a provider request is sent. Can replace the payload. */ export interface BeforeProviderRequestEvent { type: "before_provider_request"; payload: unknown; }
  ```

核验：`v1.4.0`

### E033

AgentSession 构造时从 transcript 恢复默认工具集

- [`packages/coding-agent/src/core/agent-session.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/agent-session.ts) — text: `if (this._usesDefaultTools) this._restoreToolsFromTranscript(this._defaultToolModifiers);`，提示行 525

  ```text
  if (this._usesDefaultTools) this._restoreToolsFromTranscript(this._defaultToolModifiers);
  ```

核验：`v1.4.0`

### E034

SDK 未传 settingsManager 时按 cwd 与 agentDir 创建

- [`packages/coding-agent/src/core/sdk.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/core/sdk.ts) — text: `const settingsManager = options.settingsManager ?? SettingsManager.create(cwd, agentDir);`，提示行 200

  ```text
  const settingsManager = options.settingsManager ?? SettingsManager.create(cwd, agentDir);
  ```

核验：`v1.4.0`
