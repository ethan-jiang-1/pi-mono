# 01 · 不变量：transcript 就是 model-visible 状态的唯一事实源

## 一句话

**任何到达模型请求的东西——prompt 各 section、工具声明——都以 system message 的形式记在会话轨迹里；请求不是"另外装配出来"的，而是从这条轨迹求值出来的。** Pi 没有一份独立的"prompt 状态存储"：`docs/session-format.md`（SessionMessageEntry 节）的原话是——

> System messages carry the prompt and tool loadout: … **Replaying them in order yields the current prompt and tools; there is no separate prompt state entry.**

这就是 DSH 用录制 `request/header` + 快照守卫从外部死守的那条纪律（`model-visible ⟺ logged`）在 Pi 里的实现形态：**从外部守，变成按构造成立。**

## 机制链：从写入到求值

沿一次真实请求走一遍（行号见文末锚点表）：

```
prompt sections + tools
        │  buildSystemPrompt() / 工具注册
        ▼
system message（sections patch + toolsAdded/toolsRemoved）
        │  agent loop 的 declareToolChanges() 保证「重放 == 可执行集」
        ▼
transcript（内存中的 AgentMessage[]，随 message_end 逐条落盘）
        │  SessionManager.appendMessage() → session.jsonl（append-only 树）
        ▼
buildSessionProjection() / buildSessionContext()
        │  按叶路径折叠：压缩检查点 → context_edit 改写 → 平铺消息
        ▼
Agent initialState.messages（resume 装配）/ transformContext 扩展钩子
        ▼
declareToolChanges()：日志重放的工具状态 vs context.tools 的差量，写回 system message
        ▼
convertToLlm() → Provider 请求（before_provider_request 是最后一站）
```

四个关键站点的合同：

### 1. 写入：差量落盘，不存全量

首轮请求持久化一条**完整的** system message（全部 prompt sections + 全部工具声明）；此后每次变化只落**差量**——`sections` 按名 patch（`null` 删除），`toolsAdded`/`toolsRemoved` 列增删（[session-format.md](../../packages/coding-agent/docs/session-format.md)）。旧格式会话没有 leading system message 的，首个请求把当前 prompt 作为后置 system message 补进轨迹，重放方式相同。

### 2. 求值：唯一的求值入口在 packages/ai

[transcript.ts](../../packages/ai/src/utils/transcript.ts) 是唯一的重放器：`getCurrentTools()`按顺序应用每条 system message 的工具差量；`getCurrentSystemMessage()`把所有 system message 折叠成"当前 prompt + 当前工具"的单条消息。provider 侧拿到的 system 状态只能从这里出来——不存在第二个真相源。

### 3. 一致性：agent loop 把差量算到"重放必相等"为止

[agent-loop.ts（E013）](../_evidence/render.md#e013) 的 `declareToolChanges()` 把 pending system message 的工具字段替换为「已提交 transcript 重放出的工具状态」与「可执行集 `context.tools`」的差量。注释原话即合同：**"so replay always yields exactly `context.tools`"**。扩展想在请求里改工具，改的是声明面；运行时可执行的集合永远以重放结果为准。

### 4. 压缩与恢复不破坏它

- 压缩：compaction entry 携带压缩边界处的**完整** prompt/tool checkpoint，成为压缩后上下文的 leading system message；被保留区间里的旧 system message 以它为准丢弃（[session-format.md](../../packages/coding-agent/docs/session-format.md) compaction 节；[compaction.ts（E014）](../_evidence/render.md#e014)："System messages are prompt state, not conversation; the compaction entry carries their replay."）。
- 恢复：SDK resume 时 `buildSessionContext()` 折叠出的消息直接灌进 Agent 的 `initialState.messages`（[sdk.ts（E015）](../_evidence/render.md#e015)）；`AgentSession._refreshFinalizedContext()`（[agent-session.ts（E016）](../_evidence/render.md#e016)）在边界提交、压缩等时机把 `agent.state.messages` 与投影重新对齐。

## 这条不变量被当作测试合同，而不是希望

[system-prompt-updates.test.ts（E017）](../_evidence/render.md#e017)："keeps tool declarations stable across a session JSON round-trip"——把 transcript `JSON.parse(JSON.stringify(...))` 往返后断言重放出的声明不变；注释原话 "Simulate a resume: the persisted JSON must replay to the same declarations."

这是 Pi 版的"快照测试"：**不冻结某一次装配的字节，而是冻结"往返后重放相等"这个性质。** DSH 的快照 diff 抓的是"装配结果变了没"；Pi 的 round-trip 抓的是"日志还能不能忠实重建装配"。

## 边界：账本级可重建，不是逐字节级

三个明确的不到之处（[extensions.md](../../packages/coding-agent/docs/extensions.md) Events and concurrency 节；12 号 FAQ research.md 第 6 节同口径）：

1. **请求局部变换不落盘**：`context` / `context_with_system` 扩展钩子可以每次请求做临时变换，强制 prompt 可以与结构化记录不同——变换本身不进轨迹。
2. **provider 流事件不持久化**：chunk 级的流（何时分块、增量顺序）不在 session JSONL 里，持久化的是结算后的消息。
3. **工具副作用不在轨迹里**：树给的是指针级回滚（[orchestration/06](../orchestration/06-session-plane.md)），文件系统改动不会被撤销。

**一个来自实测的精确化**（[04](04-record-replay-diy-fixture.md) 原型第四阶段）：跨上下文 resume 时（比如录制与续跑的 cwd 不同），新宿主的 prompt sections 与录制时不同，机制会往轨迹里**追加一条 patch 型 system message**——此时文件里有两条 system message。这不是不变量被破坏，恰恰是不变量的正确行为：**不变量是"重放轨迹得到当前状态"，不是"轨迹里只有一条 system message"。** 重放两条（base + patch）仍然精确得到当前状态。

## 锚点表

| 主张 | 位置 |
|---|---|
| 无独立 prompt 状态条目；重放即当前状态 | `packages/coding-agent/docs/session-format.md`（SessionMessageEntry 节） |
| 差量求值入口 | `packages/ai/src/utils/transcript.ts`（getCurrentTools / getCurrentSystemMessage） |
| 重放必等合同 | `packages/agent/src/agent-loop.ts`（declareToolChanges） |
| 落盘时机：`message_end` → `appendMessage`（system/user/assistant/toolResult 四类） | `packages/coding-agent/src/core/agent-session.ts`（appendMessage） |
| resume 装配 | `packages/coding-agent/src/core/sdk.ts`（initialState.messages / buildSessionContext） |
| 运行时对齐 | `packages/coding-agent/src/core/agent-session.ts`（_refreshFinalizedContext） |
| 压缩携带 checkpoint | `packages/coding-agent/src/core/compaction/compaction.ts`（compaction entry 的 checkpoint）；session-format.md compaction 节 |
| round-trip 合同测试 | `packages/coding-agent/test/system-prompt-updates.test.ts:276-302` |
| 请求局部变换与流事件边界 | `packages/coding-agent/docs/extensions.md`（Events and concurrency） |
