# extensions/ — pi 的扩充思路：极简核 + 靠扩展长能力

> **基线**：pi-mono `v0.84.4`（upstream tag `4e58f324f`，merge `6f8312a52`）；工作树已同步至 **v0.86.1**，2026-08 起的新增机制（transcript SystemMessage 持久化、forced prompt 投影、`user_bash` fail-closed、`pi.on()` unsubscribe、cache warming 等）已在各篇以"警示"标注，锚点对应 v0.86.1 工作树。本目录是 2026-08 新增的第三个维度，与 [`agent/`](../agent/)（机制解剖）、[`harness/`](../harness/)（平台评价）、[`integration/`](../integration/)（外部嵌入）并列。
> v0.84.3 变更：内置工具 7→8（新增 Windows-only 的 powershell，`ToolName` 联合在 `tools/index.ts:95`），本目录"7 个"表述已同步为 8。

## 这是什么

一句话：**pi 的核（core）被刻意做到极小，产品里绝大多数能力都不是"核"，而是通过 extension 这一个口子扩充（expand）出来的。** 本目录就是把这句话讲清楚——不是讲扩展系统怎么运转（那是 `agent/`），也不是评它优不优秀（那是 `harness/`），而是讲 **pi 靠扩展"长能力"的这套思路本身**，以及它在 `packages/coding-agent/examples/extensions/` 里体现出来的扩充维度。

## 核心命题

pi 的 README 自己把立场说得很白：

> "Pi is a minimal terminal coding harness. … **Pi ships with powerful defaults but skips features like sub agents and plan mode.** Instead, you can ask pi to build what you want or install a third party pi package that matches your workflow."

`CONTRIBUTING.md` 开篇更硬：

> "**pi's core is minimal.** If your feature does not belong in the core, it should be an extension. PRs that bloat the core will likely be rejected."

把这些句子翻成结构事实，就是本目录的四个子议题：

1. **核有多小**（[`01-Core/`](01-Core/)）——核里只剩"跑循环的引擎 + 8 个摸文件/跑命令的最小工具 + 扩展系统这个骨架本身"。连 plan-mode、subagent 这种别的 coding harness 几乎必内置的功能，都被**故意不做**，放进了 `examples/extensions/`。
2. **扩充怎么发生**（[`02-Expansion/`](02-Expansion/)）——读完 70+ 个示例归纳出来的四条扩充轴：沿着 agent loop 的接缝拦截改写、往循环里注册新东西、改变循环的长相、让扩充活过重启。
3. **扩充靠什么套路成立**（[`03-Patterns/`](03-Patterns/)）——一个工厂函数、覆盖与复用、安全护栏。这是"极简核能长期不膨胀、又敢挂第三方代码"的原因。
4. **核外长出了什么、谁在管**（[`04-Ecosystem/`](04-Ecosystem/)）——官方包协议（`pi install`、npm `pi-package` keyword、pi.dev 目录、举报制治理）与生态快照：5300+ 包、core 留白功能全部被第三方补齐且多实现竞争（2026-09-21 快照）。

## 先建立一张心理图

pi 的"核"是一个**循环（agent loop）**，不是一堆功能：

```
session ──► input ──► before_agent_start ──► ┌─ agent loop（每轮）───────────┐
                                               │ context → provider → tools → │
                                               │ tool_result → 下一轮          │
                                               └───────────────────────────────┘
                                            ──► agent_end / agent_settled
                                            ──► compaction / fork / switch
```

- **留在核里的**：让这个循环转起来的最小件——消息图、session 树、provider 抽象、8 个内置工具、以及"让扩展能挂在循环上"的接缝本身。
- **被赶出去的**：所有"工作流"（plan-mode、subagent、todo、preset、git-checkpoint）、所有"护栏偏好"（permission-gate、protected-paths、dirty-repo-guard）、所有"长相"（minimal-mode、footer、header、snake）、所有"后端接入"（custom-provider、ssh、sandbox）。

关键不是"pi 有很多扩展"，而是**这些被赶出去的东西，和核里的东西走的是同一条接缝（seam）**——一个 `pi` 对象（`ExtensionAPI`）、一个工厂函数（`export default function (pi) {}`）。这让"扩充"成为一种**可预测、可组合、可分发**的动作，而不是每次都要 fork 内部。

## 术语对照（中英，方便对代码）

| 中文 | 英文 / 代码 | 一句话 |
|---|---|---|
| 核 / 极简核 | core / minimal core | `CONTRIBUTING.md` 的 "pi's core is minimal" |
| 扩充 | extension / expansion | 靠扩展（extension）把能力"长"出来 |
| 扩展 | extension | 一个默认导出的工厂函数模块 |
| 接缝 | seam | 循环上可被扩展挂住的节点，即 `pi.on(...)` 的事件点 |
| 循环 | agent loop | `session → input → before_agent_start → … → agent_end` 的主循环 |
| 注册面 | register surface | `registerTool` / `registerCommand` / `registerShortcut` / `registerFlag` / `registerProvider` |
| 长相 | presentation / rendering | `renderCall` / `renderResult` / `setFooter` / overlay |
| 持久化 | persistence | `details` / `appendEntry` / session 树重建 |
| 同名覆盖 | same-name override | 注册与内置同名的工具替换内置 |
| 两阶段绑定 | two-phase binding | 加载期排队，`bindCore()` 时统一生效 |
| stale 保护 | stale-context guard | `invalidate()` / `assertActive()` 抛错 |
| fail-close | fail-closed | `tool_call` 异常不吞、阻断执行 |
| 原子动作 | atomic operations | 8 个内置工具 `read`/`bash`/`edit`/`write`/`grep`/`find`/`ls`/`powershell` |
| 工作流 | workflow | plan-mode / subagent / todo 这类偏好组装 |
| 护栏 | guard / guardrail | permission-gate 这类拦截 |
| 偏好 | preference | "价值依赖偏好"——进核 vs 扩展的判据关键词 |
| 开放集 | open set | 模型 provider / 执行后端这类"核枚举不完"的集合 |

## 本目录的边界（不重复什么）

| 目录 | 回答什么 | 本目录与它的关系 |
|---|---|---|
| [`agent/01-Anatomy/1.4`](../agent/01-Anatomy/1.4_Extension_System.md) | 扩展系统**怎么运转**（jiti 加载、事件扇出、两阶段绑定） | 引用，不重述 |
| [`agent/04-Harness/4.4`](../agent/04-Harness/4.4_Extension_Runner.md) | ExtensionRunner **怎么分发事件** | 引用，不重述 |
| [`harness/01-Architecture/1.2`](../harness/01-Architecture/1.2_single_injection.md) | 统一注入点是**取舍**（评价） | 引用，不重评 |
| [`harness/03-Discipline/3.1`](../harness/03-Discipline/3.1_core_minimal.md) | core-minimal 是**纪律**（评价） | 引用，本目录补"扩充维度"的具体地图 |
| [`harness/02-Boundaries/`](../harness/02-Boundaries/README.md) | 扩充的**边界**（哪些加不了） | 引用，不重复 |

一句话区分：`agent/` 讲**机制**，`harness/` 讲**评价**，本目录讲**思路**——"极简核 + 靠扩展长能力"这件事，在 examples 里长成了一张什么样的地图。

## 阅读路径

1. 先读 [`01-Core/`](01-Core/)：建立"核到底有多小、判据是什么"的基准。
2. 再读 [`02-Expansion/`](02-Expansion/)：四条扩充轴，每条都有具体示例锚点。这是本目录的主体。
3. 最后读 [`03-Patterns/`](03-Patterns/)：这些扩充为什么能既安全又便宜地成立。
4. 想看"这套思路跑起来之后世界长什么样"：[`04-Ecosystem/`](04-Ecosystem/)——官方包协议 + 生态快照 + 治理模式（数据带快照日期）。

## 写作定调

- 每篇默认顺序：`现象是什么` → `核心矛盾是什么` → `扩充思路是什么` → `影响是什么` → `源码/示例锚点` → `最小例证`。
- **锚点优先落在 examples 上**（用户指明的读源），机制细节回指 `agent/`。
- **硬事实 / 解释 / 推测分开标**：能从源码或 examples 核对的是"硬事实"，帮助理解的抽象是"解释"，作者意图推断是"推测"。
- 不 cheerleading：每条扩充轴都要说清"为什么它必须被赶出核"，而不只是"它能被扩展"。
