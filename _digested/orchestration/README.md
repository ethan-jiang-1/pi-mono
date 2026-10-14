# orchestration/ — pi 的工作编排原语阶梯(驾驶座视角)

> **当前基线：`v1.2.0`（tag `06a466935`）**，上一基线 `v1.0.3`（tag `d78dc83d6`）。**历史起点**：`v1.0.0`（tag `a13d35a74`，当时复核锚点 `f0e079560`）；后续同步按 [全库记录](../README.md)追踪。本轮只校正本导览的责任层与完成边界，并复核相关合同到 `cb18c7cbc89d5becbb4ea2e490a6e7ad0e989f04`，不声明目录全部行号或源码仍与旧 tag 一致。
>
> 方法论备注：原语阶梯、统一维度矩阵和诚实登记空白的组织视角历史上受 DSH `orchestration-ladder` 启发；保留出处不等于以 DSH 作为 Pi 原生理念证据。行为事实仍取自 Pi，不能预设它应长成与外部项目同构的阶梯。

## 一句话

Pi 的 coding-agent 默认工作流围绕单 agent loop 和扩展面展开：双队列、循环钩子与工具结算在运行核；计划/委派在示例扩展或生态；MCP 与 codemode 提供工具接入和代码编排（codemode 在 v1.2.0 有 coding-agent 与 durable **两份平行实现**）；独立 durable 提供实验性持久任务，v1.2.0 起同时是**工具执行内核**（内建 Code Mode、嵌套工具调用、tool-search）。不能把“coding-agent 没有统一长目标工作流”扩大成整个 monorepo 没有调度能力。

**完成边界**：应用会话可能在 `agent_end` 后自动重试、压缩或续跑；宿主需要等待 [`agent_settled`](../../packages/coding-agent/docs/extensions.md#respect-the-runtime-lifecycle)。业务正确性仍需另行验收，见 [重试设置](../../packages/coding-agent/docs/settings.md#network-and-retries)。

## 为什么存在本目录

[`agent/`](../agent/) 回答"循环怎么跑、扩展怎么挂";[`harness/`](../harness/) 回答"结构好不好"。本目录回答驾驶座的第三个问题:**pi 给了哪些把工作推进到完成的原语,各自隔离什么、上限在哪、什么时候用哪个、怎么组合。** 方法上它拥有跨原语的统一视角,机制细节引用 `agent/` 与各包 README,不重复。

## 阶梯总表

| 原语 | 位置 | 一句话语义 | 上下文隔离 | 时间跨度 | 形态 |
|------|------|-----------|-----------|---------|------|
| steer / followUp 双队列 | `packages/agent/src/agent.ts` | 运行中注入 vs 即将停止时注入 | 同上下文 | 单 run | **内核内置** |
| loop 钩子(finishTurn / prepareNextTurn / prepareRequest / before-afterToolCall) | `packages/agent/src/types.ts` | 循环节拍与工具结算的自定义点 | 同上下文 | 单 run | **内核内置** |
| 扩展 API(registerTool / setActiveTools / sendMessage / appendEntry …) | `coding-agent/src/core/extensions/types.ts` | 长出工具、命令、事件、界面与状态的唯一口子 | 同上下文 | 会话 | **应用内置** |
| todo(示例扩展) | `examples/extensions/todo.ts` | 上下文内计划留痕;状态存在 toolResult details 里,随 branch 重建 | 同上下文 | 会话 | 范本扩展 |
| plan-mode(示例扩展) | `examples/extensions/plan-mode/` | 计划先行(收缩工具面)→ 人工批准 → 执行([DONE:n] 推进) | 工具面收缩 | 会话 | 范本扩展 |
| subagent(示例扩展) | `examples/extensions/subagent/` | 每个 subagent 一个独立 `pi` 进程;single / parallel(≤8) / chain(`{previous}`) | **独立进程** | 一次性 | 范本扩展 |
| codemode(内置工具) | `packages/codemode`（coding-agent 侧）+ **`packages/durable/src/codemode`（durable 侧，v1.2.0 新增）** | 模型写 JS 在 QuickJS-WASM 沙箱里编排**工具调用**,嵌套调用不进 LLM 上下文。**两份平行实现**：前者宿主持久化 store；后者以 `pi.codemode.journal` 做确定性重放 | 沙箱 VM | 单次执行 | 内置工具 |
| MCP 工具接入 | `packages/mcp` + coding-agent 内置扩展 | 外部工具生态适配为 `AgentTool` | 进程外 server | 按调用 | v1.0.0 采纳 |
| durable tasks | `packages/durable/src/harness/` | 持久任务图:child tasks、join policy、owned conversations、自底向上 abort | 独立 conversation | **跨重启** | experimental |

![pi 编排原语阶梯](./figures/ladder.svg)

## 统一维度矩阵

| 类别 | 原语 | 执行者 | 持久事实 | 推进者 | 完成证据 |
|------|------|--------|----------|--------|----------|
| 进程内同上下文 | 双队列、loop 钩子、扩展、todo、plan-mode | 当前 Agent/应用会话 | 裸 Agent 不自动持久化；应用可写会话 JSONL（含 custom entry） | 模型、用户、扩展及应用恢复 | 应用等待 agent_settled；业务验收另做 |
| 代码编排 | codemode | QuickJS 沙箱内脚本 | 应用会话将成功 store 写 custom entry；失败 store 不保留 | 脚本控制流 | 脚本 return 值 + output；工具副作用另验收 |
| 进程委派 | subagent 扩展 | 独立 `pi` 进程 | 默认无(`--no-session`) | 父会话的工具调用 | 进程退出码 + stopReason |
| 外部工具 | MCP | MCP server | 工具调用/结果可记入应用会话；server 的业务状态由 server 决定 | 模型或codemode工具调用 | CallToolResult；外部副作用另验收 |
| 持久任务 | durable | durable Harness + 存储后端 | Session commit(先落盘后展示) | TaskScheduler | task 终态 outcome;提交即持久 |

`completed`/`exitCode 0`/脚本 `return` 都不自动等于业务正确——与 DSH 同一条纪律:完成证据要分层看(见各页"边界"节)。

## 默认挂载状态

| 原语 | 默认可用? | 出处 |
|------|----------|------|
| 双队列 / loop 钩子 | 是(core) | `packages/agent/src/index.ts` |
| 扩展 API | 是(coding-agent) | `packages/coding-agent/src/core/extensions/types.ts` |
| codemode | 扩展通常加载，但工具注册为 inactive，须显式启用；另有 `codemode.mode` / `codemode.inlineBudget` 设置（`settings.md:43-44`） | [settings](../../packages/coding-agent/docs/settings.md#tools)、[codemode](../../packages/coding-agent/docs/codemode.md)、[durable 侧 Code Mode](../../packages/durable/README.md#code-mode) |
| MCP | 内置扩展通常加载；连接 server 需配置，工具暴露取决于设置 | [MCP 文档](../../packages/coding-agent/docs/mcp.md)；[采纳记录](../harness/02-Boundaries/2.2_no_interop_protocol.md) |
| todo / plan-mode / subagent | 否；可复制、链接或显式加载示例，也可安装生态 package | [扩展加载](../../packages/coding-agent/docs/extensions.md#create-and-load-an-extension)、[packages](../../packages/coding-agent/docs/packages.md) |
| durable | 否——experimental 独立包,自带 examples | `packages/durable/README.md:3` |

## 本目录的核心发现

1. **pi 的编排阶梯是"内核单级 + 扩展补级"。** DSH 的阶梯每一级都是一个有独立合同的原语包;pi 的对应能力要么在 core 里压成一条(`Agent` 的双队列),要么以示例扩展形态存在(todo/plan-mode/subagent 共 ~1700 行)——8 个内置工具 vs 70+ examples 的比例在编排面同样成立([`harness/03-Discipline/3.1`](../harness/03-Discipline/3.1_core_minimal.md) 判断二)。
2. **选择语义没有中心文本。** "什么时候用哪个"的官方语义住在各工具的 description(subagent 扩展 `index.ts:475-480`)、examples README 与 `docs/` 里;pi 没有 DSH `tool:*` prompt section 那样的策略节,也没有跨原语路由句。这是诚实登记的空白,见 [08](./08-choice-and-composition.md)。
3. **隔离与持久性是不同轴，不存在单一强度阶梯。** 同会话原语共享上下文；codemode 隔离脚本 VM，并减少嵌套工具结果进入模型上下文，但工具副作用仍是真实的。应用会持久化成功的 `store`，见 [Store values](../../packages/coding-agent/docs/codemode.md#store-values)。subagent 默认临时会话，durable 提供跨重启任务合同；会话恢复、状态保留与执行续跑不能混为一种“持久性”。
4. **Pi coding-agent 默认未提供统一的长目标、多代理控制面。** 用户可在扩展/宿主层添加；独立 durable 已有持久任务调度，不能一并否定。subagent 的递归安装范围与其它边界见 [03](./03-subagent.md)，这里不把缺级全归因于 core-minimal。

## 问题登记

| 问题 | 结论页 |
|------|--------|
| 最小原语:双队列、内外环、钩子链、工具结算合同的精确形状? | [01-loop.md](./01-loop.md) |
| 扩展 API 怎么把"计划→批准→执行"这种编排长出来?两个完整样本? | [02-extension-seam.md](./02-extension-seam.md) |
| 委派原语:进程隔离、三模式、上限、abort 与信任门?缺什么? | [03-subagent.md](./03-subagent.md) |
| 代码编排:沙箱合同、上下文隔离、与 DSH workflow 的可比处与不可比处? | [04-codemode.md](./04-codemode.md) |
| 外部工具生态怎么接进来? | [05-ecosystem-tools.md](./05-ecosystem-tools.md) |
| 会话树/分支/compaction 作为编排的时间平面? | [06-session-plane.md](./06-session-plane.md) |
| durable 任务图:状态机、join policy、owned conversation、abort 语义? | [07-durable-tasks.md](./07-durable-tasks.md) |
| 选择决策、组合模式、诚实空白与收尾纪律? | [08-choice-and-composition.md](./08-choice-and-composition.md) |

## 阅读路径

先读本页建立阶梯全景,再按 [01](./01-loop.md) → [02](./02-extension-seam.md) → [03](./03-subagent.md) → [04](./04-codemode.md) → [05](./05-ecosystem-tools.md) → [06](./06-session-plane.md) → [07](./07-durable-tasks.md) → [08](./08-choice-and-composition.md) 顺序深入;只想知道"这个任务该用哪个"直接进 [08](./08-choice-and-composition.md)。

## 可审查性清单

审查或同步本目录时,每个结论页至少回答四件事:

1. **事实在哪里实现?** 页面末尾源码入口指向当前工作树的文件与行号;总览只维护跨页比较轴。
2. **失败如何暴露?** 区分 `isError` 工具结果、stopReason `error`/`aborted`、进程退出码、沙箱 `InternalError`、durable `unanswered`/task 终态——不统一写成"失败"。
3. **谁推进下一步?** 区分模型、用户、脚本、应用自动恢复与 TaskScheduler；扩展事件有通知、变换和可动作边界，`turn_end`/`agent_before_settle` 可请求一次 continuation，不能全称为纯观察点。
4. **如何验证结果?** 完成证据指向可执行检查(退出码、`details`、task outcome、测试),不把模型自报当验收。
