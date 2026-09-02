# 1. Pi 的核心哲学：一条约束链

## 用户问题

Pi 被描述为"最小终端 coding harness"。但"最小"是结果还是选择？它少掉的功能（没有审批弹窗、没有 plan mode、没有 subagent、没有 MCP）是被动缺失还是主动跳过？

如果答案是"主动跳过"，那推导出这些跳过的决策逻辑是什么？

## 设计约束链

Pi 的所有设计选择——从极简工具集到 YOLO 默认到无内置工作流到约 500 token 的 system prompt——不是一堆独立判断，而是一条从同一个根推导出的约束链。

```
根："你做决定，机器无条件执行"
 │
 ├→ 不需要内置审批弹窗（你已经在机器面前了）
 │   ├→ YOLO 默认全权，不弹窗问"可以吗"
 │   ├→ 安全靠隔离（VM/容器/bwrap），不是靠弹窗
 │   └→ 对应源码事实：sandbox 不是默认内置的，containerization.md 是文档方案
 │
 ├→ 不替你决定工作流长什么样
 │   ├→ 不内置 plan mode、subagent、todo、MCP
 │   ├→ plan mode 和 subagent 做成了 examples/extensions/ 示例（故意跳过）
 │   ├→ 用扩展长出来，你自己选、自己拼、自己改
 │   └→ 对应源码事实：CONTRIBUTING.md 第一句 "pi's core is minimal"
 │
 ├→ 不替你锁定模型/提供商
 │   ├→ 无默认模型锁定，跨 provider 运行时换
 │   ├→ 包生态 5600+ 包自由组合
 │   └→ 对应源码事实：--models flag、Ctrl+P 切换、provider 注册系统
 │
 ├→ 不替你管理状态（文件就是 UI）
 │   ├→ AGENTS.md、PLAN.md、TODO.md、PROGRESS.md 都是文件
 │   ├→ 人和 agent 读同一个文件，人在文件里编辑就是改 agent 的认知
 │   ├→ 会话是树（/fork /clone /tree），人肉导航而不是 agent 自动管理
 │   └→ 对应源码事实：packages/agent/src/agent.ts 的 session tree 结构
 │
 └→ 不替你记住"正确用法"
     ├→ 极简 system prompt（约 500 token）
     ├→ 你的 AGENTS.md 真正有约束力（不与 ~20k 内置产品逻辑竞争）
     └→ 对应源码事实：packages/coding-agent/src/core/system-prompt.ts 的拼接结构
```

每个"不"后面都有实际源码事实支撑。这不是"PI 应该做什么"的宣言——这是从源码读出的设计判断。

## 根的证据：`CONTRIBUTING.md` 的 core-minimal 纪律

这条约束链最硬的机械式证据不是哲学宣言，是 `CONTRIBUTING.md` 的 PR 路线：

> "If your feature does not belong in the core, it should be an extension. PRs that bloat the core will likely be rejected."

这不是对用户说的——这是对贡献者说的。它把"你决定"这个哲学翻译成了项目治理规则。如果一条功能不通过扩展面在核心外实现，PR 会被拒。

`_digested/harness/03-Discipline/3.1_core_minimal.md` 已经完整分析了这条纪律。结论是：**可扩展性不是架构天赋，是被纪律逼出来的。**

## 链的补偿：你放弃的东西不等于净损失

| 你放弃的 | 你拿到的 |
|---------|---------|
| 开箱全家桶 | 只装你需要的——token 预算由你控制，不被迫为 20 个 skill 付 token |
| 产品化审批弹窗 | 自己决定安全边界——从 YOLO 到 bwrap 到容器四档 |
| 官方托管的编排 | 自选编排层——tmux、worktree、pi-subagents 自己编排 |
| 内置 plan mode | 按自己的方式计划——`.scratch/` + `n2c:` 人审、或 PLAN.md、或 pi-subagents、或计划 preset |
| 内置 subagent | 自选代理粒度——简单双会话、或 pi-subagents、或 JS Workflow 编排 |
| 一个"标准用法" | 你的用法就是对你合理的用法——没有预设正确答案 |

**最关键的交易是你拿回了上下文控制权。** 在一个 ~20k token 内置产品逻辑的 harness 里，你的规则是跟 20k token 竞争 agent 注意力的失败者。在一个 ~500 token 的极简 harness 里，你的 20 行 AGENTS.md 就是 agent 前半段读到的最有约束力的指令。

## 这条链不是 pi 独有的——它是 library-first 设计的一般形式

Pi 验证了一件事：**如果你把"用户决定"推到极致，整个设计就可以从一条根推导出来。** 它不是"缺功能的 Claude Code"——它是一个不同类的东西，缺点和优点是同一条链的两面。

## 锚点

- 核心纪律：`CONTRIBUTING.md` 开篇 "pi's core is minimal"
- 故意跳过：`packages/coding-agent/README.md` "skips features like sub agents and plan mode"
- 极简工具集：`packages/coding-agent/src/core/tools/index.ts` 的 `ToolName` 联合（8 个内置工具）
- 极简 system prompt：`packages/coding-agent/src/core/system-prompt.ts`（~500 token 的 harness 自述）
- 会话树：`packages/agent/src/agent.ts`
- 扩展系统：`packages/coding-agent/src/core/extensions/types.ts` 的 `ExtensionAPI`（统一注入点）
- 已有分析回指：`harness/03-Discipline/3.1_core_minimal.md`、`extensions/01-Core/1.2_skipped_features.md`、`harness/01-Architecture/1.2_single_injection.md`

## 最小例证

**例证 1（core-minimal 不是宣言是纪律）：** 读 `CONTRIBUTING.md` 第一句话——"PRs that bloat the core will likely be rejected." 这不是说明文，是对贡献者的闸门。如果你提一个加内置 new feature 的 PR，它会被拒。这是"你做决定"在项目治理层的落点。

**例证 2（链的传染性）：** 看 8 个内置工具 vs 70+ 示例扩展的比例（8:70+）。`"你做决定"` → `"不替你决定工作流"` → `"不内置 plan mode/subagent"` → `"它们必须是扩展"` → `"70+ 扩展示例，8 个内置工具"`。比例本身就是从根到叶的物证。

**例证 3（补偿真实存在）：** 把裸 pi 的 system prompt token 数和 Claude Code 对比。pi 的 ~500 token harness 自述 vs CC 的 ~20k 内置产品逻辑。你写进 AGENTS.md 的规则在 pi 上更有约束力——这是"你拿回上下文控制权"的可测量证据。见 `_faq_on_digested/07_pi_usage_scenarios/06_field_usage.md` 的 esc.sh 对照（同模型 Opus 4.6，prompt 约束力差异）。

## 与已有维度的关系

本篇不是对 `harness/03-Discipline/3.1_core_minimal.md` 的替代——那篇分析"core-minimal 作为纪律"的结构意义。本篇是补充：**为什么**要有这条纪律（从"你做决定"推导），以及它如何约束整个配置决策空间。