# 02-Runtime: Agent 运行时

本节拆解 pi-mono `@earendil-works/pi-agent-core` 包中 Agent 的一次完整 prompt→response→tool→response 回合是如何被驱动、流转与约束的。七篇文档分别聚焦一个横切关注点，按问题驱动的阅读路径组织。

## 问题驱动阅读路径

### "为什么一次回答会拆成多个 turn？"

Agent 并不会在一次 LLM 调用后立即返回。它会在一个双层循环中反复"思考-行动-观察"：内层循环处理 tool call 链条（模型返回 tool_use → 执行 → 结果注入上下文 → 再次请求），外层循环处理 follow-up 消息（用户介入）。

**阅读顺序：** 2.1（双层循环结构）→ 2.2（streamAssistantResponse / executeToolCalls 的回合边界）→ 2.6（followUp 队列如何驱动外层循环）

### "为什么会自动重试、显示 busy？"

pi-mono 在两层都有重试机制：pi-ai 层在 `StreamOptions` 中携带 `maxRetries/maxRetryDelayMs`，由 SDK 本身做 HTTP 级重试；coding-agent 层在 AgentSession 中监听 `agent_end` 事件，对可重试错误（overloaded/rate-limit/5xx）执行指数退避后通过 `agent.continue()` 重新进入 loop。

**阅读顺序：** 2.4（双层重试结构）→ 2.6（SingleFlight/Busy gate 如何阻止并发 prompt）→ 2.7（重试期间的 abort 信号传播）

### "流式输出怎么做的？取消怎么做的？"

从 `streamSimple()` 的顶层入口，经过 api-registry 路由到具体 provider，provider 将 pi-mono 统一消息格式转为 provider 原生格式（如 Anthropic Messages API），发起 HTTP streaming 请求，将 SSE/NDJSON 事件流转换为统一的 `AssistantMessageEventStream`。取消信号通过 `AbortController` 从 Agent 层一路传递到 provider 层的 HTTP 请求和 tool 执行。

**阅读顺序：** 2.3（LLM Bridge 的 provider 注册与 Context 转换）→ 2.2（processor 中如何消费 SSE 事件流并 emit message_update）→ 2.7（cancel 信号从 agent.abort() 到 provider 的传播路径）

### "Session 的状态模型和事件模型如何支撑 Runtime？"

Session 是一个 append-only 树形结构。**注意模型归属**：coding-agent 的 `SessionManager` 用 `SessionEntry` union（本目录 2.5 与 03-Memory/3.4 描述的就是它）；agent 包 `harness/session/` 已是 v4 lane-based（`Entry` 7 种，见 03-Memory/3.5），旧的 `SessionTreeEntry` 已删除。两边的 `buildSessionContext()` 都从当前 leaf 走到 root，在 compaction 边界处截断，注入 compaction summary 后拼接出 LLM 可消费的消息列表。这个模型同时支撑了分支/导航/分支摘要/重放等功能，而这些功能都依赖于 Runtime 层的 turn 边界、消息生命周期事件。

**阅读顺序：** 2.5（Session 树形模型与上下文构建）→ 2.6（队列如何与 runtime 的 turn 边界协作）

## 文件索引

| 文件 | 标题 | 核心关注点 |
|------|------|-----------|
| 2.1 | The Loop | `runLoop()` 双层循环、turn 边界、prepareNextTurn、shouldStopAfterTurn |
| 2.2 | Processor | `streamAssistantResponse()` 与 `executeToolCalls()` 的流水线 |
| 2.3 | LLM Bridge | pi-ai 的 `streamSimple`、api-registry、provider 注册与 Context 转换 |
| 2.4 | Retry Scheduler | 双层重试：provider 级 HTTP 重试 + agent 级 tool failure 重试 |
| 2.5 | Session Service | Session tree 模型、SessionStorage 接口、JSONL 存储、上下文重建 |
| 2.6 | Queue Modes | steering/followUp 双队列、QueueMode（all/one-at-a-time）、SingleFlight |
| 2.7 | Cancellation | AbortController 传播链、abort 后的事件表面、扩展 abort 支持 |
