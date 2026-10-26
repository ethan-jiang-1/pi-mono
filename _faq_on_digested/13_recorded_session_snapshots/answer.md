# 答案：不变量同根，机制两极，轨迹资产差三步

## 一分钟版

**Pi 有 DSH 那个不变量，没有 DSH 那套机制。** 拆四层：

1. **不变量（`model-visible ⟺ logged`）：有，而且实现得更激进。** Pi 的 transcript 本身就是 model-visible 状态的唯一事实源——[session-format.md:80](../../packages/coding-agent/docs/session-format.md) 原话："System messages carry the prompt and tool loadout … Replaying them in order yields the current prompt and tools; **there is no separate prompt state entry**"。DSH 靠每次录制冻结一份 `request/header` 再用守卫从外部盯；Pi 让请求直接从日志求值出来，从构造上不成立「装配结果与日志不一致」这个错误类，再用 round-trip 测试钉住。
2. **测试策略：在 DSH 的 `recorded` / `authored` 词汇里，Pi 全在 authored 一侧。** faux provider 是个 711 行的确定性模型内核，DSH `replay.override.json` 的四类失败它能表达三类半；但它的脚本来自作者手写，不像 DSH llm-replay 那样从录制推导。
3. **轨迹资产：一等运行时资产，不是测试语料。** session JSONL 有完整的官方通道（open / continueRecent / forkFrom / export / import / share / bug-report），带版本号、载入时自动迁移；但仓库里没有任何录制入库的夹具，也没有无 key 的逐字节回归网。
4. **缺口可以 DIY 补上。** Pi 缺的正是 DSH #04 说的「真实装配面的变更探测器」。三件套（录制文件 + harness 注入 + assistant 结算→faux 脚本推导）能把 DSH 的 L4「轨迹夹具」台阶零新基建地搬过来，断言点用 `before_provider_request`。

一句话记法：**DSH 把现实录下来当期望，Pi 把结构做成不需要录。**

## 结论 1：不变量同根，Pi 的实现是「结构性」的

证据链（行号见 [research.md](research.md)）：

- 工具声明以 `toolsAdded` / `toolsRemoved` 写进 transcript 的 system message；agent-loop 的注释把设计意图说穿了："so replay always yields exactly `context.tools`"（[agent-loop.ts:323-331](../../packages/agent/src/agent-loop.ts)）。
- 求值入口只有一套：[transcript.ts](../../packages/ai/src/utils/transcript.ts) 的 `getCurrentTools` / `getCurrentSystemMessage`——按顺序重放所有 system message 得到当前 prompt 与工具，provider 侧拿到的就是它。
- 这个不变量被当作测试合同而不是希望：`system-prompt-updates.test.ts` 里 "keeps tool declarations stable across a session JSON round-trip"，注释原话 "Simulate a resume: the persisted JSON must replay to the same declarations"（[E001](../_evidence/render.md#e001)）。
- 连压缩都不破坏它：compaction 入口携带完整 prompt/tool checkpoint，成为压缩后上下文的 leading system message（[session-format.md](../../packages/coding-agent/docs/session-format.md) 的 compaction 节）。

两种实现的分工差异：

| | DSH 的 `request/header` 录制 | Pi 的 transcript 即请求源 |
|---|---|---|
| 性质 | 事后证据：每次录制冻结一份装配结果 | 事前合同：装配结果就是从日志求值的 |
| 守法 | 守卫 + 逐字节 diff（变更探测器） | round-trip 不变量测试 |
| 表达力 | 可以录任何装配结果 | 把 prompt/tool 状态锁进了 schema |
| 边界 | projected 夹具省略 `seq`/`time` 包络 | `context` / `context_with_system` 处理器可做请求局部变换，provider 流事件不持久化——账本级可重建，不是逐字节级 |

最后那条边界 12 号 FAQ 的 research.md 已经记为「会话可检查，但不是完整网络或执行记录」，本篇沿用。这也是为什么说 Pi 的不变量**更强但不同维度**：对 prompt 与工具状态，Pi 按构造成立；对请求字节与流事件，两个仓都没有。

## 结论 2：测试全在 authored 一侧，但 faux 的表达力比想象大

DSH `replay.override.json` 四类失败 ↔ faux 对应物：

| DSH override 失败类 | faux 对应物 | 证据（faux.ts） |
|---|---|---|
| pre-2xx 抛（首个 chunk 前） | 工厂函数 throw → 捕获 → `stopReason: "error"` 结算 | [E002](../_evidence/render.md#e002) |
| post-2xx 抛（接受后部分流失败） | step 直接给 `stopReason: "error"` / `"aborted"` 的结算，先推部分流再推 error | [E003](../_evidence/render.md#e003) |
| 取消 / 挂起 | signal 逐块中止检查；deferred 响应 + `pendingFetches` 模拟挂起与轮询 | [E004](../_evidence/render.md#e004) 起、[E005](../_evidence/render.md#e005) |
| 注入重试 | 无内建一次性失败原语，但 `state.callCount` 让「前 N 次失败、第 N+1 次成功」两行写完；AgentSession 另有完整重试事件面 | [E006](../_evidence/render.md#e006)、`agent-session-retry-events.test.ts` |

faux 还有一项 DSH replay 没有的表达力：脚本是 `FauxResponseFactory`，每一步能读到宿主刚传来的**真实** TranscriptContext 动态决策（[E007](../_evidence/render.md#e007)）——剧本可以看菜下饭。差异的本质：DSH 回放要保真，脚本被钉死在录制上；faux 是测试脚手架，要的是可控与可编排。另外 faux 的流是真实分块的（thinking/text/toolcall 的 start/delta/end 事件、可调 tokensPerSecond），不是一次性吐完整消息。

## 结论 3：轨迹是一等运行时资产，不是测试语料

Pi 的 session JSONL 有完整的官方通道：

- 生命周期：`SessionManager.open(path)` / `continueRecent` / `forkFrom`（[E008](../_evidence/render.md#e008) 起）——resume 和分叉（会话树）都是原生能力；
- 可移植：`/export` 导出 jsonl（[E009](../_evidence/render.md#e009)）、`/import` 换入会话、`session-share.ts` 分享、bug-report 自动把 `session.jsonl` 打进诊断包（[E010](../_evidence/render.md#e010)）；
- 格式世代：header 带 `version`，旧会话载入时在内存迁移 v1→v2→v3（[E011](../_evidence/render.md#e011)、[session-format.md](../../packages/coding-agent/docs/session-format.md)）——和 DSH 回放器「旧夹具就地升级后重放」是同一个设计判断。

但它不是测试语料：本仓 `packages/coding-agent/test` 与 `packages/agent/test` 里没有任何入库的 session.jsonl 夹具（仅 `/import` 参数解析和启动传路径的测试提到这个文件名）；vitest snapshot 只用在个别 UI 面（`interactive-mode-status.test.ts`）。Pi 选择了另一条路：用 faux + harness 把模型变成测试的控制变量（毫秒级、确定性、零 key），用 round-trip 测试守住组装面。

## 结论 4：DIY 路径——把 DSH 的 L4 台阶搬进 Pi 生态

三件套：

1. **录制**：真实会话的 session.jsonl——bug-report 会自动带，或直接取 `~/.pi/agent/sessions/` 下的文件。
2. **注入**：`createHarness({ sessionManager: SessionManager.open(path) })`。`HarnessOptions.sessionManager` 的注释原话就是 "Session to continue, for example to test a resume"（[E012](../_evidence/render.md#e012)）。
3. **推导**：写一个 assistant 结算 → `FauxResponseStep[]` 的转换器。session JSONL 里的 assistant message 带 content blocks、stopReason、usage、toolCall id，足够重建脚本——这正是 DSH llm-replay「从持久化结算推导模型脚本」思想的 Pi 版。四类失败用结论 2 的 faux 能力表达。

断言点对应：DSH 的 `request/header` pin ↔ Pi 的 [E013](../_evidence/render.md#e013)（模型可见 payload 的最后一站，可断言可替换）+ `before_provider_headers` + `context_with_system`（handler 拥有 prompt 与工具声明）。

要付的账（诚实清单）：

- 转换器自己写自己养；Pi 没有 DSH 的 `{{session:1}}` tokenize 与 scrub 基建，ID / 时间戳噪声要自己处理（DSH 的 projected/complete 之辨同样适用）。
- resume 录制会话时，`model_change` 条目指向真实 provider，需要把模型拨回 faux——未实测，列为主要风险。
- DSH 的教训原样适用：轨迹夹具是**变更探测器，不是正确性 oracle**（DSH 四篇 postmortem 只有一篇把它当组装回归 pin）。所以照抄 DSH #05 的触发条件表——按需启用，不默认全做。

## DSH ↔ Pi 对照表

| DSH 机制 | Pi 对应物 | 差异 |
|---|---|---|
| `request/header` 录制 | transcript 即请求源 + `before_provider_request` | 事后证据 vs 事前合同 |
| `session.jsonl` 夹具语料 | 无（session JSONL 是运行时资产） | Pi 缺的那一层 |
| llm-replay 从持久化推导脚本 | faux authored 剧本（+ DIY 转换器可补） | 死脚本 vs 能读真实上下文的工厂 |
| `replay.override.json` 四类失败 | faux error / aborted / deferred + callCount | 三类半内建 |
| 无 key CI 回放 | faux 是唯一无 key 路径 | 同一效果，不同来源 |
| 格式世代 + 内存迁移 | session version + 载入迁移 v1→v2→v3 | 同一设计判断 |
| corpus 治理（配额、守卫、委员会） | 无也不该有 | DSH 21 的原判断在此仓同样成立 |

## 元思想：辅助 AI coding agent 做对东西的两条护栏

两个仓的共同元思想：**把「模型看见了什么」变成可持久化、可重放、可断言的数据，让人类的测试资产变成 agent 的护栏。** 分工：

- DSH 用「录制现实」兜 agent 想不到的回归——探测器面，coverage 由语料决定。
- Pi 用「结构不变量 + 确定性脚手架」让 agent 做错立刻响——round-trip 测试就是写给重构 agent 的合同，faux harness 让它毫秒级兑现。
- Pi 可从 DSH 借：触发条件表（什么时候值得为一条真实回归建轨迹夹具），以及 bug 复现 playbook 的三档做法。
- DSH 可从 Pi 借：把不变量做进结构（replay-always-yields-exactly），让一部分守卫从测试降级为构造——守卫会漏，构造不会。

对 extension 仓开发者（本目录读者），可操作的结论只有一条：**先确认 L0-L3（导出守卫、行为 spec、HMR、真实组装测试）做满，再按触发条件上 DIY 轨迹夹具**——判断标准直接用 DSH #05 的五条性质，不必为 Pi 重新发明。

## 三句话记住

1. 不变量同根：DSH 录下来再守，Pi 按构造成立再测。
2. 机制两极：recorded 入库比对 vs authored 假模型剧本；Pi 全在 authored 一侧，但 faux 的工厂能读真实上下文，四类失败覆盖三类半。
3. 缺口可 DIY：录制文件 + harness 注入 + 结算推导脚本 = DSH L4 台阶的 Pi 版；按需启用，别默认全做。
