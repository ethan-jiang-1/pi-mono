# 1. Pi 的核心哲学：从设计取舍到配置决策

> **局部复核锚点**：`cb18c7cbc89d5becbb4ea2e490a6e7ad0e989f04`。本篇把理念转成配置选择；完整原生论证见 [理念 FAQ](../../_faq_on_digested/12_pi_philosophy/answer.md)，证据入口见 [理念地图](15_pi_philosophy_evidence_map.md)。

## 用户问题

Pi 的“最小”是被动缺失，还是主动控制范围？当我需要计划、委派、任务跟踪或安全限制时，应该扩大核心，还是选择其它层？

[README](../../README.md#pi)说 Pi 有 powerful defaults，但跳过内置 sub-agent、plan mode，用户可构建或安装自己的能力。[CONTRIBUTING](../../CONTRIBUTING.md#philosophy)要求不属于 core 的功能成为 extension，新增 hook 也要控制复杂交互。**最小是范围纪律，不是功能数量竞赛。**

## 设计取舍：相互支持，不是单因证明

[作者自述](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)给出多种动机：简单可预测、精确控制上下文、检查交互过程、处理会话和构建替代 UI。它们支持一组取舍，但不能证明所有结构必然由一个口号导出。

| 取舍 | 用户拿到的选择 | 边界 |
|---|---|---|
| 工作流不全预装 | 文件、prompt template、extension/package、宿主编排 | 不是每种组合都合理；先理解状态和生命周期 |
| 模型/provider 可替换 | 按任务与约束选择模型 | 跨 provider context 转换不是完全等价 |
| 上下文分层/按需 | 项目指令、skills、工具声明、会话分支可调整 | 文件修改须重新读入；短 prompt 不保证更强遵从 |
| 会话格式可检查 | 查消息、prompt/tool 变化、branch 和 compaction | 不等于原始网络记录或副作用重放 |
| 可被嵌入 | SDK、RPC、print/JSON、默认 TUI | 能嵌入不等于 API 永久兼容 |
| 不内置 OS 访问隔离 | 按风险选择整个进程或工具级隔离 | 项目信任/工具拦截不能替代 OS 边界 |

来源：[SDK](../../packages/coding-agent/docs/sdk.md)、[skills](../../packages/coding-agent/docs/skills.md)、[会话格式](../../packages/coding-agent/docs/session-format.md)、[扩展](../../packages/coding-agent/docs/extensions.md)、[隔离方案](../../packages/coding-agent/docs/containerization.md)。

## 你的决策空间

### 1. 先找责任层，不先扩大 core

- 项目事实与约束：项目指令文件或配置。
- 重复提示：prompt template；领域操作说明：按需 skill。
- 工具、事件、命令、UI 与运行时状态：extension/package。
- 自己的 UI、组织策略、外层任务系统：SDK/RPC 宿主。
- 独立持久任务运行时：[experimental durable](../../packages/durable/README.md)。它不是 coding-agent `SessionManager` 会话树的替代名称。

当前 MCP、codemode、tool_search 已由官方包/内置扩展提供，不能沿用“Pi 没有 MCP”的旧描述。选装或缩小暴露面应按 [MCP](../../packages/coding-agent/docs/mcp.md)与[codemode](../../packages/coding-agent/docs/codemode.md)的当前规则检查。

### 2. 上下文由你调整，状态仍由程序管理

计划文件便于人和 agent 共读，但不是 Pi 唯一的状态载体。`SessionManager` 自动持久化会话，程序也负责请求重试和自动压缩。用户选择资料与会话路径，程序维护合同内的状态；两者不是对立关系。

具体例子：修改计划文件后，先让 agent 重新读取，再讨论下一步。不要认为“磁盘已经改了”就等于模型上下文已经刷新。换分支时，核对 active branch 和 compaction 后的上下文，而不是把全树都当作当前输入。见 [sessions](../../packages/coding-agent/docs/sessions.md)。

### 3. 安全按覆盖范围选，不按审批弹窗数量选

[权限声明](../../README.md#permissions--containerization)说明默认启动权限。需要隔离时，先问：只隔离内置工具，还是整个 Pi 进程、扩展代码、网络和凭据？[containerization](../../packages/coding-agent/docs/containerization.md)列出的方案覆盖面不同。工具 allowlist 是收窄能力，不是完整 sandbox。

### 4. 控制权需要理解与维护

[The One Rule](../../CONTRIBUTING.md#the-one-rule)要求理解代码。扩展也一样：能加载、类型正确，不证明事件组合、权限或失败降级正确。

核心职责克制能减少必须继承的产品决定；它不能消灭 token、维护、升级和安全成本。评价配置时看实际输入和行为，不拿包数量、示例数量或历史 token 数当理念证明。

## 最小例证

1. **核心纪律**：贡献规则说膨胀 core 的 PR “will likely be rejected”，不是说任何核心新功能都必拒。先说明能力为什么属于 core，再讨论实现。
2. **过程可检查**：会话记录中能看到 prompt/tool 声明变化与消息；扩展仍可能做请求级 context 变换，因此不把账本称为完整网络抓包。
3. **完成边界**：模型一轮结束后，程序可能自动重试或压缩续跑。外部宿主需要 [`agent_settled`](../../packages/coding-agent/docs/extensions.md#respect-the-runtime-lifecycle)，而非仅 `agent_end`。

## 与已有维度的关系

- [核心纪律](../harness/03-Discipline/3.1_core_minimal.md)分析项目治理，本篇只提配置上的责任分层。
- [扩展轴](10_extension_axes/README.md)解释能力入口，本篇不重复 API 清单。
- [文件/会话 UI](9_session_and_file_ui.md)展开状态操作，本篇纠正“Pi 不管理状态”的误解。
- [证据地图](15_pi_philosophy_evidence_map.md)与[研究账本](../../_faq_on_digested/12_pi_philosophy/research.md)负责核对依据，不让这些分析互相循环自证。
