# Research · Pi 原生理念的证据账本

## 证据范围与版本

- **当前核对锚点**：`cb18c7cbc89d5becbb4ea2e490a6e7ad0e989f04`，`git describe` 为 `v1.0.3-99-gcb18c7cbc`。以下仓库路径和行号以此为准。
- **既有消化基线**：[总导览](../../_digested/README.md)记录的是 v1.0.3 及工作树锚点 `98d2e1947`；部分专题仍有更早基线。本次只复核理念相关合同，不声称全库完成版本同步。
- **作者自述**：[Mario Zechner 的文章](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)发表于 2025-11-30，只用于确认当时直接表达的动机。文章中的 no-MCP、prompt 长度和缺少 compaction 不能直接当成当前事实。
- **证据分级**：作者原话说明意图；当前源码/docs说明行为；理念归纳是解释。既有 `_digested` 是二手分析与导航，不能被标成一手证据。

本篇保存详细证据和限制；[答案](answer.md)负责总论，[证据地图](../../_digested/composition/15_pi_philosophy_evidence_map.md)负责导航。

## 1. 简单、可预测、上下文控制与可观察性

**作者证据**：文章开头直接说 “simple, predictable tools”，希望 “inspect every aspect of my interactions with the model”，并需要 cleanly documented session format 与构建 alternative UIs 的办法。另有原话：

> “My philosophy in all of this was: if I don't need it, it won't be built.”

**性质**：直接表达的历史动机；四关键词是归纳。作者说“我不需要”，不能改写为“所有用户都不需要”或“永不新增”。其 No MCP support 一节的永久措辞已被当前实现推翻。

## 2. 用户塑造工作流，核心保持克制

**一手合同**：

- [README:15–21](../../README.md#L15-L21)：minimal/extensible/make your own、适配用户工作流、powerful defaults、跳过内置 sub-agent/plan mode、四种驱动入口。
- [CONTRIBUTING:7–11](../../CONTRIBUTING.md#L7-L11)：不属于 core 的功能应成为 extension；膨胀 core 的 PR **可能**被拒；hook 也须谨慎讨论。

**性质**：原文定位与贡献规则是事实；“职责克制以保护用户选择”是解释。不能推出“所有新核心 PR 必拒”或“扩展点越多越好”。

**二手入口**：[核心纪律分析](../../_digested/harness/03-Discipline/3.1_core_minimal.md)。

## 3. 扩展提供有边界的变化入口

**一手合同**：[extensions:73–88](../../packages/coding-agent/docs/extensions.md#choose-an-integration-point)列出事件、工具、命令、UI、消息、provider 等 API；[事件合同](../../packages/coding-agent/docs/extensions.md#events-and-concurrency)规定顺序、返回值效果、并发与 context 变换；精确类型见 [ExtensionAPI 声明](../../packages/coding-agent/src/core/extensions/types.ts)。

**性质**：入口与合同是事实；“扩展面深”“变化优先从扩展进入”是结构解释。不能只凭接口存在就证明任何组合正确或跨版本稳定。

**二手入口**：[扩展轴](../../_digested/composition/10_extension_axes/README.md)、[版本契约边界](../../_digested/harness/02-Boundaries/2.4_no_version_contract.md)。

## 4. 可嵌入不等于唯一产品优先级

**一手合同**：[README:21](../../README.md#L21)、[SDK](../../packages/coding-agent/docs/sdk.md)、[RPC](../../packages/coding-agent/docs/rpc.md)提供多种驱动方式；作者文章明确希望构建替代 UI。

**性质**：“TUI 不是唯一宿主”有直接机制支持；“library-first”是本文与既有消化材料的结构概括，不是当前 README 的逐字定位，也不证明开发先后顺序。

**职责分离**：[SDK:28–40](../../packages/coding-agent/docs/sdk.md#sessionmanager-api)将应用会话树归给 `SessionManager`；[durable README:3–7、78–90](../../packages/durable/README.md#concepts)介绍另一套 experimental 持久运行时。v1.0.0 的内层迁移记录见 [0007](../../_digested/_change_log/0007-v0.86.1-to-v1.0.0.md)，不是 coding-agent JSONL 会话整体迁走的证明。

## 5. 上下文分层、按需与可导航

**一手合同**：[system-prompt 实现](../../packages/coding-agent/src/core/system-prompt.ts)、[skills](../../packages/coding-agent/docs/skills.md)、[sessions](../../packages/coding-agent/docs/sessions.md)说明 prompt 组装、技能按需加载、分支选择和自动压缩。

**性质**：机制是事实；“user-owned context”是解释，不代表人手工管理所有状态，也不保证模型严格遵守指令。

**反例与限制**：

- 计划文件是用户/作者推荐的工作方式，不是核心统一管理的计划状态合同；文件改变后还需读入模型上下文。
- 历史 ~500/~1000 token 读数不能替代当前配置测量，也不能推出短 prompt 必然更有效。

**二手入口**：[文件与会话 UI](../../_digested/composition/9_session_and_file_ui.md)。

## 6. 会话可检查，但不是完整网络或执行记录

**一手合同**：[session-format:3、78–80](../../packages/coding-agent/docs/session-format.md#sessionmessageentry)规定 JSONL 树和 system message 中的 prompt/tool 变化；[SDK:38–40](../../packages/coding-agent/docs/sdk.md#sessionmanager-api)说明 active leaf、保留分支和模型上下文重建。

**必须保留的限制**：[extensions:103–117](../../packages/coding-agent/docs/extensions.md#events-and-concurrency)说明强制 prompt 可以与结构化记录不同，`context`/`context_with_system` 可做请求局部变换；provider stream 事件不持久化。因此可重建账本状态，不等于每次请求逐字节重建，更不等于工具副作用确定性重放。

## 7. 业务失败与基础设施恢复分层

**一手合同**：

- [agent-loop](../../packages/agent/src/agent-loop.ts)和[工具合同](../../packages/agent/src/types.ts)：工具执行错误转换为模型可见错误结果。
- [settings:125–133](../../packages/coding-agent/docs/settings.md#network-and-retries)：agent-level retry 默认开启、最多 3 次，provider 重试另有配置。
- [AgentSession:1839–1876](../../packages/coding-agent/src/core/agent-session.ts#L1839-L1876)处理重试与压缩后的续跑；[_prepareRetry:3747–3786](../../packages/coding-agent/src/core/agent-session.ts#L3747-L3786)执行预算、指数退避及事件通知。
- [extensions:62–67](../../packages/coding-agent/docs/extensions.md#understand-the-runtime-lifecycle)：`agent_end` 后仍可能有自动工作；`agent_settled` 才是最终通知边界。

**性质**：当前行为事实。工具业务重试常由模型选择，但“Pi 从不自动恢复/裁决”是错误的全局归纳。

## 8. 安全边界与理解责任

**一手合同**：

- [README:88–96](../../README.md#permissions--containerization)：默认进程权限，没有内置 OS 访问限制系统。
- [安全文档](../../packages/coding-agent/docs/security.md)、[隔离方案](../../packages/coding-agent/docs/containerization.md)：项目信任、凭据与全进程/工具级隔离的区别。
- [CONTRIBUTING:15–19](../../CONTRIBUTING.md#the-one-rule)：理解代码是贡献前提；[人工最终审查:91–93](../../CONTRIBUTING.md#why-not-let-ai-triage-everything)说明 AI 只是辅助。

**性质**：机制与治理规则是事实；“控制权伴随人的责任”是综合解释。没有 OS sandbox 不等于没有安全机制；治理中的人审不等于运行时无自动恢复。

## 9. 组装与维护成本：能证明到哪里？

**一手支撑**：[扩展生命周期](../../packages/coding-agent/docs/extensions.md#understand-the-runtime-lifecycle)、[package](../../packages/coding-agent/docs/packages.md)、[贡献纪律](../../CONTRIBUTING.md#philosophy)说明用户与维护者仍需管理资源、选择能力并理解交互。

[package.json:20–27](../../package.json#L20-L27)与[tsconfig:56–57](../../tsconfig.json#L52-L53)显示 examples 多数参加类型检查，但 gondolin 明确排除。类型兼容也不保证运行语义正确。[runtime-deps 负例测试:27–34](../../scripts/check-runtime-deps.test.mjs#L27-L34)直接反驳“Pi 门禁从不测负例”。

**性质**：“用组装与理解成本换职责受控、上下文可调和宿主选择权”是解释。没有成本测量，不能声称“低一个数量级”；没有逐项覆盖审计，不能声称所有散文都无验证、所有 examples 都保真。

## 本轮结构性复核修正

1. 新 FAQ 只从 Pi 一手资料建立原生论证；既有外部分析框架的历史出处保留，不改写 provenance。
2. 把单因约束链收窄为多动机共同约束，不把所有边界归因于“嵌入不需要”。
3. 区分 agent loop、应用会话与 durable；修正无自动重试/无状态管理等绝对判断。
4. 去掉跨版本稳定性、数量级成本和无负例测试等无证据结论；图示与正文同步修正。
5. 区分本次源码核对锚点与既有全库消化基线；索引页不再声称所有历史引用与旧 tag 逐字一致。
6. 直接衔接的[文件/会话 UI](../../_digested/composition/9_session_and_file_ui.md)取消“Pi 不管理状态”及所有内置计划都无持久性的比较。
7. [编排导览](../../_digested/orchestration/README.md)与[codemode 分析](../../_digested/orchestration/04-codemode.md)区分扩展注册、工具启用和应用持久化：当前 codemode 工具注册为 inactive；成功 store 写会话条目；store 失败不提交不等于回滚已经调用工具的外部副作用。依据：[settings:44](../../packages/coding-agent/docs/settings.md#L44)、[Store values](../../packages/coding-agent/docs/codemode.md#store-values)、[脚本失败合同](../../packages/coding-agent/docs/codemode.md#scripts)。
