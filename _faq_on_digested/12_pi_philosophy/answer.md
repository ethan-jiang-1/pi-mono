# Pi 的理念：简单、可预测、可观察、上下文可控

> **Pi 的重点不是“功能越少越好”，而是让用户理解并控制 agent 的上下文和工作流：核心保持克制，过程尽量可检查，能力可扩展，也可被其它宿主驱动。**
>
> 这是对作者自述与当前仓库合同的归纳，不是官方逐字宣言，也不是“所有设计都由一个原因决定”的证明。

本文核对的源码锚点为 `cb18c7cbc89d5becbb4ea2e490a6e7ad0e989f04`（`v1.0.3-99-gcb18c7cbc`）。作者文章发表于 **2025-11-30**，用于确认当时的动机；当前行为另用仓库 docs 与源码核对。完整证据及限制见 [研究账本](research.md)。

## 一、原生动机：为什么要自己造一个 harness？

[作者的设计自述](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)直接提出几个需要：

- **简单、可预测的工具**，不希望不断加入自己不用的产品能力，并随之改变模型行为；
- **准确控制进入模型上下文的内容**，而不是由 harness 在不可见处注入；
- **检查与模型交互的过程**，拥有清楚记录的 session format，能自动处理会话；
- **在 agent core 上构建其它 UI**，以及使用不同 provider 和自托管模型。

原话 “if I don't need it, it won't be built” 表达的是作者当时的范围纪律，不是 Pi 永久不新增功能的保证。同文曾说不会支持 MCP；当前仓库已经提供 MCP。这恰好说明：**应抽取动机，并持续核对实现，不能把历史功能清单冻结成理念。**

当前 [根 README](../../README.md#pi) 给出更适合当下的表达：

> “Adapt Pi to your workflows, not the other way around.”

它同时说 Pi 有 powerful defaults，但不把 sub-agent、plan mode 固化为内置工作流；用户可以自己构建或安装 package。**有默认值，与不强迫所有人使用同一套工作流，并不矛盾。**

## 二、这些动机如何共同约束设计？

这不是从一个口号必然演绎所有结构，而是几组相互支持的取舍：

| 动机或纪律 | 当前设计落点 | 不能据此推出什么 |
|---|---|---|
| 克制核心责任 | 不属于 core 的功能优先写 extension，hook 也需讨论 | 所有核心新功能都会被拒 |
| 工作流由用户塑造 | 工具、命令、事件、UI、provider 可扩展 | 任意扩展组合都正确、安全 |
| 控制模型可见输入 | 分层 prompt、项目指令、按需 skills、分支与压缩 | prompt 越短，规则就必然越有效 |
| 检查交互过程 | JSONL 会话、事件、SDK 状态接口 | 会话文件等于原始网络抓包或精确执行重放 |
| 构建替代宿主 | interactive、print/JSON、RPC、SDK | API 永久兼容，或所有宿主都有完整 TUI 能力 |

来源：[贡献哲学](../../CONTRIBUTING.md#philosophy)、[扩展合同](../../packages/coding-agent/docs/extensions.md)、[SDK](../../packages/coding-agent/docs/sdk.md)、[会话格式](../../packages/coding-agent/docs/session-format.md)。

## 三、五个可以落到事实的理念侧面

### 1. 核心克制：最小不是空白

[贡献规则](../../CONTRIBUTING.md#philosophy)明确写出 core-minimal，要求不属于核心的能力成为 extension；连扩展 hook 也要避免不可维护的膨胀和复杂交互。

这里必须分清三个层次：

- **Agent 运行核**：[agent 包](../../packages/agent/README.md)提供 loop、工具执行合同、消息与运行中状态；
- **coding-agent 应用层**：[SDK 会话合同](../../packages/coding-agent/docs/sdk.md#sessionmanager-api)包含 CLI/TUI/RPC/SDK、扩展、内置工具和 `SessionManager` 的会话树；
- **独立 durable 运行时**：[durable 包](../../packages/durable/README.md)提供另一套持久会话、任务与文档运行时。它不是 coding-agent JSONL 会话的同义词。

因此，v1.0.0 把内层 durable/harness 能力迁出 agent 包，**不等于 coding-agent 的会话持久化也迁走了**。

### 2. 工作流可塑：扩展是有合同的能力入口

[扩展文档](../../packages/coding-agent/docs/extensions.md#choose-an-integration-point)列出工具、命令、事件、消息、持久化、provider、MCP 和 UI 等入口。其价值是不用为了每种用户工作流都扩大核心，而不是“核心可以任意拼成任何运行时”。

例如，计划或任务扩展可以把状态写到会话条目；不同用户也可以直接维护计划文件。两者都是选择，不是只有文件才符合 Pi 哲学。

扩展并非无约束：[事件合同](../../packages/coding-agent/docs/extensions.md#events-and-concurrency)规定加载顺序、返回值效果与并发行为；[生命周期合同](../../packages/coding-agent/docs/extensions.md#understand-the-runtime-lifecycle)要求正确启动、关闭资源。这些合同帮助理解当前行为，**不构成跨版本兼容承诺**。

### 3. 上下文可控：可编辑的输入，不是“不管理状态”

[system prompt 实现](../../packages/coding-agent/src/core/system-prompt.ts)按区段、工具、项目上下文与 skills 组装输入；[skills 文档](../../packages/coding-agent/docs/skills.md)说明先提供能力索引，需要时再读取完整指令。

一个具体例子：用户可以写计划文件，让 agent 按需读入，也可以用 `/tree` 换到另一条会话分支。前者改变工作资料，后者改变会话上下文路径。**编辑磁盘文件并不自动刷新模型已经看到的内容**，仍需读取或重新加载相应资源。

Pi 也会自动管理状态：会话持久化、上下文压缩、请求恢复都由程序承担。用户控制的是规则、输入与导航入口，而不是亲手执行每一步状态维护。见 [会话操作](../../packages/coding-agent/docs/sessions.md)和[重试设置](../../packages/coding-agent/docs/settings.md#network-and-retries)。

### 4. 可观察与可嵌入：终端不是唯一宿主

[根 README](../../README.md#pi)列出 interactive、print/JSON、RPC 和 TypeScript SDK；[SDK](../../packages/coding-agent/docs/sdk.md)允许宿主在进程内驱动 `AgentSession`。本文把这种结构概括为“library-first”，**不是声称官方宣布了唯一产品优先级或开发先后顺序**。

[会话格式](../../packages/coding-agent/docs/session-format.md)记录消息、prompt/tool 声明变化、compaction 等事实；[SessionManager](../../packages/coding-agent/docs/sdk.md#sessionmanager-api)保留分支并重建模型上下文。

但“可观察”有边界：扩展可以做请求级 context 变换或强制替换 prompt；部分 provider stream 事件不持久化。会话账本不是每次网络请求的逐字节记录，也不是重启工具执行的保证。见 [扩展的 context 与 prompt 合同](../../packages/coding-agent/docs/extensions.md#events-and-concurrency)。

### 5. 人要理解自己的改动：控制权伴随责任

[CONTRIBUTING 的 The One Rule](../../CONTRIBUTING.md#the-one-rule)直接要求：

> “You must understand your code.”

可以用 AI 写代码，但不能提交自己不理解的改动。[人工 review 规则](../../CONTRIBUTING.md#why-not-let-ai-triage-everything)也明确 AI 可以辅助，最终维护者决策仍由人作出。

这是 Pi 原生理念的重要组成部分：**可观察、可定制不是放弃理解的理由，而是帮助人承担判断责任。** 该贡献治理规则不能被扩大成“Pi 运行时从不自动决策”。

## 四、安全与失败恢复：两个容易过度归纳的边界

### 安全：不内置 OS 隔离，不等于没有安全机制

[README 的权限声明](../../README.md#permissions--containerization)说 Pi 默认使用启动它的用户和进程权限，不内置限制文件、进程、网络或凭据访问的 permission system。

当前仍有[项目资源信任控制与安全建议](../../packages/coding-agent/docs/security.md#understand-project-trust)、[工具拦截合同](../../packages/coding-agent/docs/extensions.md#events-and-concurrency)。它们不等同于 OS 隔离。若需要更强边界，应核对[隔离文档](../../packages/coding-agent/docs/containerization.md)：全进程容器与只把内置工具转到 VM 的扩展，覆盖范围不同；后者不自动隔离 host 上的其它扩展代码。

### 恢复：业务判断与程序恢复不是同一层

工具失败通常以 `isError` 返回模型，模型可以选择改参数或换方案；但 coding-agent 对瞬时请求失败有**默认开启的自动重试**，也有自动压缩与溢出恢复。见 [settings](../../packages/coding-agent/docs/settings.md#network-and-retries)。

因此，“harness 报告，模型/人裁决”只适合描述部分业务选择，不能作为全局定律。集成宿主判断完成时，应等待 [`agent_settled`](../../packages/coding-agent/docs/extensions.md#understand-the-runtime-lifecycle)，不能仅看到 `agent_end` 就认为自动工作结束。

## 五、代价是什么？

- **组装成本**：复杂计划、委派与团队流程需要选择、审计和维护扩展，不是开箱全家桶。
- **升级成本**：核心职责克制不等于 SDK/Extension API 永久兼容，宿主仍需复核合同。
- **上下文成本**：项目指令、skills 索引、工具声明、扩展和历史都占预算；不能拿历史 prompt token 数证明当前必然更有效。
- **安全责任**：启动权限、凭据、远端工具和扩展代码都要纳入威胁模型。
- **理解责任**：类型检查与 examples 能发现部分错误，不能替人证明组合语义正确。

合理的总结是：**用组装、维护和理解成本，换取职责受控、上下文可调与宿主选择权；不是换取永久稳定或零风险。**

## 六、研究支撑如何分工？

- 本 FAQ：回答“Pi 为什么这样设计”，给出原生动机、当前落点和代价。
- [研究账本](research.md)：保存一手证据、版本锚点、限制和反例；不把既有 `_digested` 当作者自述。
- [理念证据地图](../../_digested/composition/15_pi_philosophy_evidence_map.md)：提供主张到资料的入口，不再重复整套总论。
- [配置哲学](../../_digested/composition/1_core_philosophy.md)：把理念转成用户配置决策。

既有专题使用的外部分析框架保留其历史出处；这与本 FAQ 只从 Pi 一手材料建立原生论证并不冲突。

## 三句话记住 Pi

1. **最小核心是范围纪律，不是功能数量崇拜。**
2. **上下文可调、过程可检查、宿主可替换，但程序仍承担自动状态管理与恢复。**
3. **使用者能塑造工作流，也要理解改动、审计扩展并承担维护与安全责任。**


## sync-0010 增量（v1.4.0）

- **依赖规则扩展到内部包**：`AGENTS.md:45` 从 "Direct external deps" 改为 "Direct **registry** deps, **including internal workspace deps**"；`scripts/check-pinned-deps.mjs` 删除了内部包豁免，所有 registry 依赖必须是精确版本（实测仓库内已无 `^`）。
- **发布前多了一道数据兼容门禁**：模型目录会直接服务已发布的 pi，发布前用 `check-model-catalog-compat.mjs` 对最新 release 的 pi-ai 做类型校验；不兼容时先升 `MINIMUM_PI_VERSION`（当前 1.2.1）。
- **release 必须先 pin 最新模型目录再构建**（`scripts/release.mjs:91-129`），否则发布脚本失败——把"数据也是发布物"写进了流程。
- **entry-graph 成本合同上调**：`packages/ai` 的 `./models` 15→20，`packages/durable` 根 66→73，并新增 `allow` 例外（`scripts/check-entry-graphs.mjs`）。
