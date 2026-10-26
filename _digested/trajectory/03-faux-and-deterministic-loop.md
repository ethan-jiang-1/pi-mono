# 03 · 确定性：faux provider 的表达力全表

## 一句话

**轨迹的另一头是模型。Pi 让模型在测试里变成一个 727 行的确定性内核（faux provider）：剧本化的响应、能读真实上下文的动态工厂、真实分块的流、以及完整的一族失败注入。** 本篇是 [test-strategy/03](../test-strategy/03-faux-provider-and-harness.md)（驱动机制）的姊妹篇：那篇讲"怎么驱动循环"，本篇讲"这个假模型**能表达什么、不能表达什么**"——这决定了下一篇录制回放的覆盖面。

全部锚点：[packages/ai/src/providers/faux.ts](../../packages/ai/src/providers/faux.ts)（727 行，v1.4.0 实测；v1.2.0 为 710）。

## 能力分层

### 1. 剧本：静态 step 与动态工厂

- `FauxResponseStep = AssistantMessage | FauxResponseFactory`；`setResponses()` 整体替换队列，`appendResponses()` 追加（v1.4.0 `:682-689`），`getPendingResponseCount()` 可断言积压。
- **工厂能读到真实上下文**：`resolveResponse()`（v1.4.0 `:507` 起）对函数 step 执行 `step(context, streamOptions, state, model)`，`context` 是宿主刚传来的 `TranscriptContext`。剧本可以看菜下饭——"上一步工具结果包含 X 就调工具，否则收尾"这类分支测试不需要 mock 框架，一个闭包写完。
- `FauxProviderState`（v1.4.0 `:464`）携带 `callCount`、`deferredFetchCount`、`cancelledDeferred`，工厂可按调用次数做状态机。

### 2. 流：真实分块，不是一次性吐整条

`streamWithDeltas()`（v1.4.0 `:356` 起）按 token 尺寸把 thinking / text / toolCall JSON 逐块切分，推送完整的 `start/delta/end` 事件族，`tokensPerSecond` 可调节奏（v1.4.0 `:348-360` 一带）。也就是说 UI 层、增量解析层、tool-call JSON 累积层面对的流形态与真 provider 同构。工具调用参数是**逐块流式累积**的（v1.4.0 `:425-438`），最后落成完整 arguments。

### 3. 失败注入全表（录制回放视角的核心资产）

| 失败类 | faux 的表达 | 锚点 |
|---|---|---|
| 请求前抛出（对应 DSH "pre-2xx throw"） | 工厂函数直接 throw，`queueMicrotask` 捕获 → `stopReason: "error"` 结算 | :556-560 |
| 接受后失败（"post-2xx throw"） | step 给出 `stopReason: "error"` / `"aborted"` 的结算：先推部分流，再推 `error` 事件终止 | :424-431 |
| 用户取消 | `AbortSignal` 逐块检查（首个 chunk 前、每块之间），落 `createAbortedMessage` | :348-353, :358-421 |
| 挂起 / 轮询 | `streamOptions.deferred` → `DeferredHandle`；`pendingFetches > 0` 时每次 fetch 只消耗一次配额继续挂起，`pollAfterMs` 控制可轮询时点 | :526-551, :591-602 |
| 延迟交付 / 取消延迟任务 | `fetchDeferred()` / `cancelDeferred()`；取消会记入 `state.cancelledDeferred` 供断言 | :569-644 |
| 队列耗尽 | 剧本用尽时报 "No more faux responses queued"（error 结算）——少写一步剧本会**响亮地失败**而不是静默错位 | :513-523 |
| 注入重试 | 无一次性失败原语（缺证归纳，见文末），但 `state.callCount` 让"前 N 次失败、第 N+1 次成功"两行写完；AgentSession 层另有完整重试事件面（`agent-session-retry-events.test.ts`） | :447 |

与 DSH 的对偶：DSH 的回放器从录制推导脚本，四类"日志里推不出来"的失败（纯抛出 / 取消挂起 / 注入重试）要靠 `replay.override.json` sidecar 补。faux 把这四类全部做成了**一等 API**——代价是没有"从现实录制"的默认来源，剧本全靠作者手写。这就是 recorded / authored 两极的分工：**DSH 保真但死板，Pi 可控但需要作者想到。**

### 4. 伪装成真 Provider

`fauxProvider()`（v1.4.0 `:704-727`）把内核包装成标准 `Provider`：真 auth resolver（v1.4.0 `:704` 一带）、真 `stream/streamSimple/fetchDeferred/cancelDeferred` 面。生产代码看到的就是一个 provider 实例——**零生产妥协**（test-strategy/03 的核心论点，此处不重复）。usage 由 `withUsageEstimate` 按上下文估算（v1.4.0 `:514-518`），prompt cache 行为也有内建模拟（v1.4.0 `:465`）。

## 接线：harness 把它缝进全真宿主

[test/suite/harness.ts](../../packages/coding-agent/test/suite/harness.ts)（275 行）的装配面，从"测试能用什么"角度重述：

| 注入点 | 选项 | 说明 |
|---|---|---|
| 会话 | `sessionManager`（:122-123） | 默认 `SessionManager.inMemory()`；**可注入磁盘会话**——注释原话 "Session to continue, for example to test a resume"。录制回放通路的关键缝（[04](04-record-replay-diy-fixture.md)） |
| 工具 | `tools` + `initialActiveToolNames` / `allowedToolNames` / `excludedToolNames` | 真 AgentTool（带 schema 与 execute），注册链全真 |
| 扩展 | `extensionFactories` | 真 ExtensionRunner 生命周期 |
| 断言面 | `events` / `eventsOfType` / `getToolResult` / `getAssistantTexts` | 会话事件流全量捕获 |
| 模型可见面 | Agent `onPayload` → `before_provider_request`（:202-208） | **最终 provider payload 的统一截点**——DSH `request/header` pin 的 Pi 对应物 |

## 边界

- faux **不验证协议转换**：它绕过了 `packages/ai` 各 API 适配器（anthropic/openai/…）的请求序列化与 SSE 解析；那部分由各 API 层的单测覆盖（不少用真端点的 e2e，见 [test-strategy/02](../test-strategy/02-testing-tiers.md) 的分轨）。
- faux 的 usage 是估算值，不用于成本断言。
- "无一次性失败原语"是缺证归纳：通读 :300-727 未见内建 API，非文档明示；`callCount` 惯用法可覆盖。

## 锚点表

| 主张 | 位置 |
|---|---|
| 工厂读真实 TranscriptContext | `faux.ts:490-503` |
| 真实分块流 | `faux.ts:348-360, :356 起`（v1.4.0） |
| error / aborted 结算出口 | `faux.ts:308-320, :424-431` |
| 工厂 throw 捕获 | `faux.ts:556-560` |
| deferred / pendingFetches / cancel | `faux.ts:526-551, :569-644` |
| 队列耗尽报错 | `faux.ts:513-523` |
| Provider 包装 | `faux.ts:704-727`（v1.4.0） |
| harness 注入面 | `test/suite/harness.ts:111-124, :150-161, :202-208` |
