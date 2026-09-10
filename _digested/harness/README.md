# harness/ — pi 作为 harness 平台的评价层

> **基线**：pi-mono `v0.85.1`（upstream tag `d981de122`，merge `e3aa42f46`），源码锚点对应工作树。本目录是 2026-08-24 新增的评价维度，与 [`agent/`](../agent/)（机制解剖）和 [`integration/`](../integration/)（外部嵌入）并列。
> v0.84.3 变更：内置工具 7→8（`ToolName` 联合 `tools/index.ts:95`）；`ExtensionAPI` `on()` 重载 34→36（v0.84.4 新增 `ui_prompt_start`/`ui_prompt_end`；注意重载列表含 3 个多行格式——`session_before_switch`/`session_before_compact`/`before_provider_request`——单行 grep 口径会少计 3）；1.4 新增"失败 factory 状态丢弃"护栏（#8424）。v0.84.4 变更：扩展事件新增 `ui_prompt_start`/`ui_prompt_end`（#8355）、runner.ts +52 行（相关锚点已重锚）。
> **v0.85.1 变更（2026-09-10）**：2.3 **整篇重写**并改名（`2.3_agent_lane_skeleton.md` → [`2.3_agent_lane_contract_first.md`](./02-Boundaries/2.3_agent_lane_contract_first.md)，图同改名）——旧标题两半立论都被反证；2.1 加 scope 限定并新增"facet 隔离"判断；2.4 把 breaking 实例换成 v0.85.1 并改图；1.1 补 `renderers/` 分层 + 重锚；1.2/1.3/1.4 行号复核；3.1/3.4 补两条物证。**01-Architecture 四篇对本轮 `packages/agent` harness 重写免疫**（grep 确认 1.1–1.4 全文零提及 `AgentLane`/`AgentHarness`/`HarnessNotImplemented`）——它们评的是 coding-agent 的 extension / tool-factory / operations 三层接缝，与 `packages/agent` 的 harness 运行时无关；1.1 只因为 coding-agent 的 tool 层同轮被大改（`core/tools/` +1092/−946，新增 `renderers/`）而需要重锚。详见 [`../_change_log/0006-v0.84.4-to-v0.85.1.md`](../_change_log/0006-v0.84.4-to-v0.85.1.md)。

## 旧结论反转：0003 那条"harness.md 与代码不是一套 API"已失效

**旧结论**（记录在 [`_change_log/0003-v0.83.0-to-v0.84.2.md`](../_change_log/0003-v0.83.0-to-v0.84.2.md) 与 [`_plan-2-v0.84.2.md`](../_change_log/_plan-2-v0.84.2.md)）：

> 官方 `packages/agent/docs/harness.md` 描述的是更超前的 registers/SQLite 目标模型，**与已发布代码不是一套 API**。

**现状（硬事实，v0.85.1）**：这条**已失效**，三个分句都被反证：

| 旧分句 | 现状 | 证据 |
|---|---|---|
| "registers 存储模型" | 从 spec 和代码里**同时消失** | `harness.md` 体量 2941 → **1468** 行；`register` 在 spec 里只剩 **3** 次，且全是英文动词 `registered`/`registers`（`harness.md:941,1238,1353`），**没有一处是存储模型**；配套代码 `session/state.ts` 的 `LaneRecord`/`LogItem` 已删除 |
| "更超前的目标态文档" | 不再准确 | 现在的 spec **自带 §0.9 implementation-status 清单**（`harness.md:141-158`），逐项点名未实现项（J1 JSONL 回收、C1 RemoteSession、R12 `watchSession`、T1 telemetry、S3 search、R11 schema migration、WP08 fork、H1 契约闭合）——它现在是"**实现规格 + 未实现项清单**"，不是"目标态宣言" |
| "与已发布代码不是一套 API" | **反了** | 22 条核心概念中 **15 条已实现（68%）**、1 条部分（fork WP08 Slice A）、6 条仅 spec；6 条"仅 spec"**没有一条落在核心对话主路径上** |

**收敛的机制证据（硬事实）**：不是"文档追代码"，而是**同一个 commit 同时改两边**——`d09576def fix(agent): finalize durable lane replication`（2026-08-26）在**同一个 commit** 里改了 `harness.md`（−1352 行）、`runtime/lane.ts`、`events.ts`、`telemetry.ts`、`values.md`（11 文件 +621/−1027）。这是 registers → values/lists 的转折点。

**一个易被文件名误导的点**：`packages/agent/docs/values.md`（735 行）是 WP01 的**详细设计规格**，不是"价值观宣言"——内容是 `value<T>()`/`list<T>()` 的 bound typed address 模型（`values.md:7-8`、构造 `:93,98`）、后端语义、事务写与 conformance 清单。

**对评价的含义**：0003 时代的判断**在当时是有据的**（v0.84.x 正处在 runtime 重写窗口期，spec 确实超前于代码）；但它描述的是**时点状态**，不是 pi 的永久特征。v0.85.1 把 spec 与实现收敛到了同一批 commit 上。评价一个 design-first 的项目，"现在处在哪个时点"比"它是不是 design-first"更值钱——[2.3](./02-Boundaries/2.3_agent_lane_contract_first.md) 的"契约优先已兑现"就是这条反转的正面表述。

## 这是什么

`agent/` 回答"扩展系统怎么运转、system prompt 怎么拼、agent loop 怎么跑"；`integration/` 回答"别的宿主怎么把 pi 接进去"。

本目录回答的是**第三个、也是历史侧重点漏掉的问题**：**pi 作为一个开源 coding harness，结构优不优秀、好不好扩充、对上面跑的 coding agent 自描述够不够。**

它不替代 `agent/` 的机制细节，而是在机制之上做评价：哪些接缝设计得好、为什么好，哪些边界是短板、对"开源吸纳新东西"意味着什么。

## 结构（四个子目录，每篇一个子议题）

每个大主题一个子目录，每个子议题一篇 MD，统一用 `codebase-design` 词汇 + 真 seam 检验 / deletion test / design-it-twice 写深。硬事实 / 解释 / 推测分开标。

| 问题 | 阅读入口 | 篇章 |
|---|---|---|
| 结构优秀不优秀、第三方好不好加能力 | [01-Architecture/](./01-Architecture/README.md) | 1.1 三层接缝 · 1.2 统一注入点 · 1.3 分发闭环 · 1.4 生命周期护栏 |
| 扩展的边界在哪、哪些能力加不了或没护栏 | [02-Boundaries/](./02-Boundaries/README.md) | 2.1 无沙箱 · 2.2 无 MCP/ACP · 2.3 内层 harness 契约优先已兑现（边界上移到 experimental-only） · 2.4 无版本契约 |
| 它开发有没有策略和纪律 | [03-Discipline/](./03-Discipline/README.md) | 3.1 core-minimal · 3.2 一条规则 · 3.3 贡献门 · 3.4 工程规则 |
| 它有没有把自己说清楚给上面的 coding agent 听 | [04-Self-Description/](./04-Self-Description/README.md) | 4.1 system prompt 自述 · 4.2 工具 prompt 契约 · 4.3 文档随包 · 4.4 上下文分层 |

## 阅读路径

1. 先读 [01-Architecture/](./01-Architecture/README.md)：建立"三层接缝（真 seam 检验）+ 统一注入点（design-it-twice）+ 分发闭环 + 生命周期护栏"这个骨架
2. 再读 [02-Boundaries/](./02-Boundaries/README.md)：看清骨架的四条边界，避免高估
3. 然后读 [03-Discipline/](./03-Discipline/README.md) 和 [04-Self-Description/](./04-Self-Description/README.md)：从"怎么开发"和"怎么自述"两个角度补齐 harness 的评价

## 写作定调（评价视角，区别于 agent/）

本目录是**评价文档**，不是机制文档。默认顺序：

1. `现象是什么` —— 读者 1 段内看懂"这篇在评价什么结构/行为"
2. `核心矛盾是什么` —— 至少两条互相拉扯的目标
3. `设计判断是什么` —— 评价核心：结构优不优秀、为什么；**硬事实 / 解释 / 推测分开标记**
4. `影响是什么` —— 对"开源吸纳新东西"或"作为 coding harness"意味着什么
5. `源码锚点是什么` —— 至少 2 个有效文件/函数锚点
6. `最小例证是什么` —— 一个可验证的观察信号，能证明或反驳判断

执行要求：

- 规则只在本 README 定义，不在每篇正文重复"写作规范"段落。
- **不与 `agent/` 重写机制**：引用对应篇章，只补评价。机制细节以 `agent/` 对应文档为准。
- **硬事实（能从源码核对）与评价（判断）分开**：评价要落到具体锚点，不能空谈"优秀"。
- **锚点给"为什么"**：不只列文件，要说清这个文件里的哪处设计支撑了判断。

## 与 agent/、integration/ 的边界

| 目录 | 本质 | 本目录的关系 |
|---|---|---|
| `agent/` | 机制解剖（怎么运转） | 本目录引用它，不重复 |
| `integration/` | 外部嵌入（怎么接进去） | 本目录 01 的分发闭环与其互补 |
| `extensions/` | 扩充思路（核有多小、扩充四轴、扩充套路） | 本目录评"结构/纪律"，它讲"思路"，互为表里 |
| `harness/`（本目录） | 平台评价（结构优不优秀、好不好扩展、自描述够不够） | 独立维度 |

当一篇评价需要大量复述机制时，说明它写偏了——应该引用 `agent/` 并只保留"这处设计为什么好/不好"。
