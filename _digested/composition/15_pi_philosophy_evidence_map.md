# 15. Pi 理念证据地图

> **核对锚点**：`cb18c7cbc89d5becbb4ea2e490a6e7ad0e989f04`（`v1.0.3-99-gcb18c7cbc`）。这是理念相关合同的局部复核，不更新 [全库消化基线](../README.md)，也不保证旧专题所有行号均已同步。

## 用途与分工

本页只做导航，不再复写完整理念总论：

- [FAQ 答案](../../_faq_on_digested/12_pi_philosophy/answer.md)：Pi 原生动机、当前落点与代价。
- [研究账本](../../_faq_on_digested/12_pi_philosophy/research.md)：详细证据、源码锚点、反例和限制。
- [配置哲学](1_core_philosophy.md)：把理念转成用户的配置决策。

**证据边界**：作者自述能直接说明意图；当前源码/docs能说明机制；既有消化材料是二手解释。不能让这些层次互相替代。

## 主张 → 一手来源 → 既有分析

| 主张 | 一手入口 | 既有分析 | 证据性质与限制 |
|---|---|---|---|
| 简单、可预测、控制上下文、检查交互 | [作者自述，2025-11-30](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/) | [配置哲学](1_core_philosophy.md) | 直接历史动机；不是当前功能清单 |
| 用户塑造工作流，core 保持克制 | [README](../../README.md#pi)、[贡献哲学](../../CONTRIBUTING.md#philosophy) | [核心纪律](../harness/03-Discipline/3.1_core_minimal.md) | 当前定位/治理事实；不能推出所有 core PR 必拒 |
| 扩展提供变化入口与合同 | [extensions](../../packages/coding-agent/docs/extensions.md)、[ExtensionAPI](../../packages/coding-agent/src/core/extensions/types.ts) | [架构评价](../harness/01-Architecture/README.md)、[扩展轴](10_extension_axes/README.md) | 接口事实；“深扩展面”是解释，不保证任意组合正确 |
| 终端不是唯一宿主 | [SDK](../../packages/coding-agent/docs/sdk.md)、[README](../../README.md#pi) | [集成](../integration/README.md) | 驱动入口事实；library-first 是结构概括，不是兼容保证 |
| 上下文可分层、按需、导航 | [system-prompt](../../packages/coding-agent/src/core/system-prompt.ts)、[skills](../../packages/coding-agent/docs/skills.md)、[sessions](../../packages/coding-agent/docs/sessions.md) | [自描述](../harness/04-Self-Description/README.md)、[文件/会话 UI](9_session_and_file_ui.md) | 机制事实；不能推出无自动状态管理或指令必然生效 |
| 会话树可检查与重建 | [session-format](../../packages/coding-agent/docs/session-format.md)、[SessionManager](../../packages/coding-agent/docs/sdk.md#sessionmanager-api) | [会话树分析](../agent/03-Memory/3.4_Session_Tree.md) | 应用会话合同；不是原始网络抓包或确定性执行重放 |
| 工具失败与请求恢复分层 | [重试设置](../../packages/coding-agent/docs/settings.md#network-and-retries)、[settled 边界](../../packages/coding-agent/docs/extensions.md#respect-the-runtime-lifecycle) | [反馈分析](../harness/05-Design-Causality/5.4_feedback_loops.md) | 默认自动重试/压缩存在；“模型裁决”不能全局化 |
| OS 隔离属于运行环境，代码仍须理解 | [权限声明](../../README.md#permissions--containerization)、[隔离方案](../../packages/coding-agent/docs/containerization.md)、[The One Rule](../../CONTRIBUTING.md#the-one-rule) | [安全边界](12_security_boundaries.md) | 安全与治理事实；无 sandbox 不等于无安全机制 |
| 选择权伴随组装、升级和审计成本 | [扩展生命周期](../../packages/coding-agent/docs/extensions.md#respect-the-runtime-lifecycle)、[packages](../../packages/coding-agent/docs/packages.md) | [知识载体](../harness/05-Design-Causality/5.1_knowledge_externalization.md)、[正确路径](../harness/05-Design-Causality/5.3_paved_road_friction.md) | 综合解释；没有成本测量或永久稳定性承诺 |

## 更新时先检查什么？

1. README 与 CONTRIBUTING 的定位、贡献纪律及人的理解责任。
2. agent 核、coding-agent `SessionManager`、独立 durable 运行时的职责是否变化。
3. 扩展生命周期、context 变换、自动恢复与 `agent_settled` 完成边界。
4. prompt、skills 与工具声明的实际加载；不要用旧 token 数或工具数量代替审计。
5. MCP、codemode、tool_search 的当前启用/暴露规则。
6. API breaking changes、隔离覆盖范围与[上游同步记录](../_change_log/)。

既有分析框架的历史出处保留在各专题方法声明中；本地图不把框架来源当作 Pi 作者意图的证据。
