# Pi 理念专题审阅：遗漏的研发方法与质量闭环

> 核对锚点：`0834f00835992629a6f84d9498e7ea427049981c`。与原专题锚点 `cb18c7cbc89d5becbb4ea2e490a6e7ad0e989f04` 的差异为分析文档，本轮核对的是同一代码状态。本文是静态仓库研究，未运行构建、测试、模型评估或发布。原 [问题](question.md)、[答案](answer.md)和[研究账本](research.md)保持原样。

## 1. 审阅结论

**同意原专题还不够深入。主要原因是研究范围偏向产品与运行时，未展开维护这种产品所需要的研发系统。** 现有 [答案](answer.md)对最小核心、扩展、上下文、宿主、自动恢复的边界已经比较准确；缺的不是再加一句“简单、可控”，而是解释：需求如何进入核心，改动怎样证明正确，依赖与平台边界怎样防止退化，源码怎样成为用户实际安装的产品，以及部分发布失败如何处理。

[问题](question.md)主要问作者动机、结构落点与使用代价，没有明确追问软件开发生命周期（SDLC）；[答案的人理解责任部分](answer.md)因此只展开了贡献纪律，[研究账本](research.md)也没有系统追踪 CI、消费端安装和发布恢复。遗漏具有范围原因，不应把它描述成原答案整体错误。

本轮的核心补充可以表述为：**Pi 用范围纪律控制核心，用显式合同承载必要复杂度，再用不同阶段的检查维护这些合同。** 这是基于仓库机制的综合解释，不是作者说过的官方口号，也不证明仓库整体质量优于其他项目。

两份专题证据账本分别保存详细来源与反例：[SDLC 证据](sdlc_evidence.md)、[结构与质量证据](structure_quality_evidence.md)。下面只展开最影响理解的遗漏。

## 2. SDLC 实际长什么样

| 阶段 | 仓库里的具体机制 | 现有专题遗漏的含义 |
|---|---|---|
| 需求与贡献准入 | [E180](../_evidence/render.md#e180)；大改动先通过 [E181](../_evidence/render.md#e181) 讨论 | 核心克制先发生在需求入口；维护者的审阅时间也是受保护的资源 |
| 问题诊断 | [bug 模板](../../.github/ISSUE_TEMPLATE/bug.yml)要求先排除扩展；[issue 分析 prompt](../../.pi/prompts/is.md)要求独立追踪代码路径 | 输入的分析与实现建议不自动成为事实；先建立可复核的问题，再决定是否实现 |
| 设计与实施 | [项目开发规则](../../AGENTS.md)；[Chord 规格](../../packages/chord/docs/spec.md)分开合同、硬约束、已知限制与决策 | “做完”需要行为和边界条件，不能只以文件齐全或功能能跑来定义 |
| 确定性回归 | [faux-provider 测试套件](../../packages/coding-agent/test/suite/README.md)；[settled 回归](../../packages/coding-agent/test/suite/regressions/6363-agent-settled-event.test.ts) | 把重试、并发、取消和完成事件变成可断言的语义，减少真实模型波动 |
| 静态与构建质量 | [E182](../_evidence/render.md#e182)；[主 CI](../../.github/workflows/ci.yml) | 类型、依赖声明、入口成本、安装锁和实际浏览器 bundle 分别检查不同错误 |
| 模型行为与文档 | [evals](../../packages/evals/README.md)区分 host eval 与成对文档评估 | 程序合同正确与模型能完成任务是两个需要分别验证的问题 |
| 安装与发布 | [packed consumer](../../scripts/check-package-install.mjs)；[E183](../_evidence/render.md#e183)；[tag 管线](../../.github/workflows/build-binaries.yml) | monorepo 里跑通不代表发布包能独立安装；发布完成也不只是 push tag |
| 发布恢复与数据更新 | [幂等 npm 发布](../../scripts/publish.mjs)；[发布公告与指针](../../scripts/publish-release-announcement.mjs)；[独立模型目录管线](../../.github/workflows/publish-model-catalog.yml) | 对已发生的外部副作用分步恢复；代码版本之外还有数据交付面 |

这是一组不同触发条件的流程，不能把整张表合并成“每个 PR 都执行所有检查”。[E184](../_evidence/render.md#e184)配置为 Linux build/check/test 和独立 MCP conformance；跨平台 env、Nix、供应链 audit、tag 发布和模型目录另有工作流。文档行为评估没有普通 PR 主 CI 调用证据。详细触发矩阵见 [SDLC 证据第 3 节](sdlc_evidence.md)。

## 3. 最值得补入的八个发现

### 3.1 核心克制也依赖研发准入，不只依赖代码分层

现有专题写了“You must understand your code”，但漏了它前后的维护机制。[E180](../_evidence/render.md#e180)规定新贡献者 issue/PR 默认自动关闭，`lgtmi` 批准 issue，`lgtm` 批准 issue 和 PR；[E185](../_evidence/render.md#e185)说明这是缓冲不断涌入的工作，保护维护者审阅时间，最终判断由人承担。

具体例子：一个 AI 写成的 PR 即使格式和类型都正确，仍可能因为贡献者不能解释代码、需求不该进入 core，或没有获准贡献而被关闭。这些条件不是编译器能够替代的。

因此，核心最小化至少有两个维护位置：需求讨论决定哪些问题值得纳入；实现检查约束纳入后的代码边界。自动批准/关闭工作流只验证贡献资格，并不证明技术方案合理；`lgtm` 在这里也不能被当成具体 PR 已通过质量审阅。来源与事件边界见 [SDLC 证据第 1 节](sdlc_evidence.md)。

### 3.2 Pi 把自己的研发过程写成可执行的 agent 工作流

[E186](../_evidence/render.md#e186)要求不信任 issue 中的根因推断，完整读相关代码，独立追踪路径；默认分析与建议，不直接实现。[PR prompt](../../.pi/prompts/pr.md)把 diff、关联代码、文档与 examples、测试纳入审查。[deslop prompt](../../.pi/prompts/deslop.md)则明确反对推测性的抽象和配置，要求在真实信任边界验证输入，检查通过之外还要理解设计。

更具体的是：[E187](../_evidence/render.md#e187)在获授权后运行仓库内的 `/is`，导出分析 session；[E188](../_evidence/render.md#e188)给出本地 `pi "/ir …"` 的继续入口。[E189](../_evidence/render.md#e189)导入 session，重写 CI 路径，切换本地会话，还处理跨平台提示。

这说明“过程可检查、上下文可携带”也用于项目自身开发，形成从远端分析到本地继续的接续机制。但 session 导入不恢复整个文件系统、依赖或外部服务，也不保证确定性执行重放；prompt 写出规则也不保证模型每次遵守。应保留原专题对会话账本的谨慎边界。

### 3.3 设计文档包含退出条件与迁移顺序

[Chord 规格](../../packages/chord/docs/spec.md)把运行时写成可判定的合同：第 2 节定义 type/contract，第 12 节「Known limitations and decisions」列出运行时**尚未做到的事**与各节留待决定的取舍，开头即声明「文档与代码不一致时以不一致为 bug」。这是把"做完了"落成可核对边界的方式——非目标被写在规格里，而不是留在人的记忆里。

竞态与交错点在 v1.2.0 主要靠**测试**而非规划文档承载：`packages/chord/test/` 下有 `reload.test.ts`、`replication.test.ts`、`websocket.test.ts`、`link.test.ts`、`manager.test.ts` 等，覆盖 reload cutover、取消与请求接纳、fork 生命周期等场景。规格第 11 节「Test coverage」逐项点名对应测试文件——这比"模块清晰、可测试"更能说明研发方法。

> **证据基础已变更**：本节此前引用 `packages/chord/PLANNING.md`（工作包拆分、迁移顺序、完成定义、精确交错点控制）。该文件在本区间被 chord2 重写（`0104fef1e`，facet/service runtime → typed host runtime）**删除**，上述内容没有等价替代文档——workpackage 与 definition-of-done 的叙述在 v1.2.0 的 chord 文档中不存在。现引用 `docs/{guide,spec,tutorial}.md`（本区间新增），结论相应收窄为"规格内的合同与已知限制 + 测试覆盖清单"。

本卷不能声称全仓库统一实行某种正式方法。chord 的规格是**单个包**的设计文档，其"硬约束"节（`:5-9`）声明运行时只依赖自身 `delta` 模块与 `typebox`、不依赖其它 Pi 包——**这条自述在 本基线 已不成立**（chord 依赖 `@earendil-works/pi-telemetry`，`package.json:89`）；它只能作为历史自述，不是全仓制度的证明。

### 3.4 公开入口承担依赖成本合同

一个看似无害的 `export *` 可能让调用一个工具函数时加载整个 provider 集合。[E190](../_evidence/render.md#e190)明确把 entry point 称为 cost contract，并让指定入口受到文件数预算和禁达路径约束。

例如 [E191](../_evidence/render.md#e191)要求 `pi-ai/models` 不带 providers 和生成模型总表，utils 窄入口不带 provider/API/index，durable 根入口不拉入 ai 根桶。不是只凭包名判断“模块很小”，而是对可达模块图设置可失败的条件。

还有一层实际构建证据：[browser smoke](../../scripts/check-browser-smoke.mjs)用浏览器平台打包 portable durable 入口，拒绝 Node adapter 混入；selective-provider agent fixture 检查未引入全部 providers/模型总表，并约束实际 SDK/catalog 组成。这使“替代宿主可用”有了具体检测方法。

边界同样重要：入口预算只覆盖列出的条目；未配置入口不受预算限制。图脚本追踪静态 value import，止步外部依赖，不是完整动态加载或运行时内存测量。browser smoke 也只证明指定 fixture 的构建图。参见 [结构质量证据第 1、2 节](structure_quality_evidence.md)。

### 3.5 “可预测”依靠事件与状态的回归合同

原 [答案](answer.md)已经提醒宿主等待 `agent_settled`，但没有解释这个合同怎样被维护。[E192](../_evidence/render.md#e192)提供了一个足够具体的轨迹：

```text
脚本化 provider 返回 overloaded_error
→ agent_end（willRetry = true）
→ 自动重试返回 recovered
→ agent_end（willRetry = false）
→ 恰好一个 agent_settled，ctx.isIdle() = true
```

同一文件还测试 [E193](../_evidence/render.md#e193)后必须先运行 follow-up 再 settled，以及 [E194](../_evidence/render.md#e194)不能在工具尚未释放时提前返回。

[E195](../_evidence/render.md#e195)创建真实 `Agent`/`AgentSession` 和扩展路径，用可编排的 provider 响应替换模型不确定性。这样的测试能稳定检查程序的完成语义，不需要为验证一个事件顺序消耗真实 API token。它不能证明某个真实模型能完成用户任务，也不能代替 provider 协议兼容测试。

[结构质量账本](structure_quality_evidence.md)还记录了消息在 provider 边界转换、跨 provider 的 thinking/tool ID/orphan result 适配，以及 tool pairing、并发结果顺序和取消语义。最值得写进正文的是一两个完整轨迹，而不是一长串测试文件名。

### 3.6 文档也接受行为检验

这是原专题漏掉的一条重要研究证据。[evals 文档](../../packages/evals/README.md)区分两类实验：host eval 检查当前配置行为；`.docs.eval.ts` 在相同任务与安装内容下比较 `without_docs` 和 `with_docs`，记录文档带来的任务表现变化及 token、工具调用、耗时、估算成本。

[E196](../_evidence/render.md#e196)让 agent 创建 hello tool，reload 后实际调用，评分检查加载无误、工具存在、实参正确、返回值和最终输出正确。这里的文档价值通过用户可见行为检查，不止检查 agent 是否能复述说明。

实验报告也防止样本缺失被隐藏：[E197](../_evidence/render.md#e197)先枚举双方并交替运行顺序；[E198](../_evidence/render.md#e198)拒绝缺失、重复、未评分或失败的 arm；[E199](../_evidence/render.md#e199)断言不完整配对时 lift 为 null，并保留已消耗资源。缺失 telemetry 与零消耗分开；[E200](../_evidence/render.md#e200)把模型未完成任务保留为数据，不等同于实验基础设施故障。

这支持“项目建立了验证文档是否帮助 agent 的方法”，还不支持“文档已被证明能稳定提高成功率”。本轮未运行 eval，未检查历史结果；默认一次重复无法建立稳定性。普通 PR 主 CI 运行 evals 的基础设施单测，不等于运行这些真实模型实验。另有 [模型辅助文档审计](../../packages/evals/evals/documentation-audit.eval.ts)，其 verdict 仍来自模型判断，也不能当成人工验证后的事实。

### 3.7 验证用户安装的包，而不只验证工作区源码

monorepo 中的依赖提升、workspace link 或构建残留，可能让缺依赖或漏文件的包仍能运行。[runtime-deps 检查](../../scripts/check-runtime-deps.mjs)先检查 runtime import 是否在 manifest 中声明；[packed consumer](../../scripts/check-package-install.mjs)再逐包 pack，在仓库外临时目录按生产依赖装进只含该包的隔离工程，检查 SDK/CLI 与隐藏 subpath。

[E201](../_evidence/render.md#e201)在检查、离线构建和测试后实际调用消费端检查；[E202](../_evidence/render.md#e202)也调用它。发布准备另有 Node/Bun 与真实交互的人工 smoke 要求，见 [SDLC 证据第 5 节](sdlc_evidence.md)；不可把文档要求误写成 release 脚本自动完成了全部交互测试。

供应链方面，[E203](../_evidence/render.md#e203)明确区分直接外部依赖 exact pin、根 lockfile、无安装脚本、install-script allowlist 与生成安装锁。pi.dev installer 使用安装锁固定传递依赖；普通 npm 包本身不固定传递依赖。这些控制分别解决解析、安装执行和发布消费的问题，不能用“依赖已锁定”一语合并。

### 3.8 发布恢复承认部分成功，以及代码之外的数据变化

[tag 管线](../../.github/workflows/build-binaries.yml)分开构建与资产校验、draft release、npm publish、registry 可用性确认、发布公告和公开 release。[E204](../_evidence/render.md#e204)跳过已存在版本，便于部分 npm 包发布成功后重试；[公告代码](../../scripts/publish-release-announcement.mjs)验证精确版本和 tarball，并使用不可变 release record 与条件 latest pointer 更新。

具体例子：部分 npm 包已发布、随后公告失败时，删除 draft 不能撤销 npm 副作用。恢复要重新执行可重复步骤，并维护正确指针；Nix 构建失败则保留旧 stable。不能把它归纳为一键 rollback。完整证据与例外见 [SDLC 账本第 5.3 节](sdlc_evidence.md)。

此外，[模型目录工作流](../../.github/workflows/publish-model-catalog.yml)有独立的生成、验证、artifact 和生产发布条件，[发布脚本](../../scripts/publish-model-catalog.mjs)校验 provider shards、模型身份、投影与数量，并用 catalog hash 标记 revision。仅追踪 npm 代码版本不足以描述模型目录交付。代码发布和数据发布要分别记录边界；不能因此推断所有旧客户端必然使用最新目录。

## 4. 怎样补强原专题

建议把题目范围明确扩为“Pi 的产品理念与研发方法”，或保留原产品理念题目，另增一篇 SDLC 问答。优先级如下：

1. **P0：补完整开发生命周期。** 增加需求/贡献准入、独立诊断、设计合同、回归、CI、消费端验证、发布恢复；正文使用第 2 节的精简表，详细证据留在账本。
2. **P0：用两个具体例子解释质量。** 选“窄入口被 barrel 污染”和“重试后才 settled”，写出错误影响、约束方法及检查范围。这样能解释架构为什么能持续维护。
3. **P1：补文档行为评估。** 把它作为项目的验证方法，清楚区分确定性程序测试、真实 provider 兼容性、模型任务表现，避免写成已有性能结论。
4. **P1：修正 minimal 的讨论对象。** 分开 agent 核、CLI、独立库和整个 monorepo。[Chord](../../packages/chord/README.md)、[telemetry](../../packages/telemetry/README.md)、[durable](../../packages/durable/README.md)都有必要的复杂合同；核心范围克制不等于全仓库简单，也不等于抽象越少越好。
5. **P2：补交付的时序与触发条件。** 标出本地规则、普通 CI、路径条件工作流、发布事件、定时 audit 和手动 eval 的区别；单独说明模型目录数据交付。

原 [答案](answer.md)对自动重试/压缩、会话记录、运行权限与实验性 durable 的限制值得保留。深化应把这些边界与研发证据连接起来，不应为了统一哲学而把它们再次抹平。

## 5. 本轮能与不能下的结论

- **能确认**：上述规则、检查、测试断言和发布条件存在于此代码锚点；原专题没有系统解释它们。它们为研发治理、结构边界、语义合同和交付恢复提供一手证据。
- **不能确认**：所有维护者一直遵守规则、所有历史 CI 都成功、分支保护实际要求哪些 job、测试覆盖充分、任意扩展组合正确，或这些方法带来了可测的质量优势。
- **未执行验证**：本轮只新增研究和审阅文档，没有运行 build/test/install/eval/release，没有修改产品代码、提交 commit 或向外发布。源码研究能说明机制，运行记录与实验结果才可进一步说明实际效果。
