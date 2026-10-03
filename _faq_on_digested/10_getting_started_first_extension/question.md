# 10 — 如何在 Pi 底下开发第一个插件/扩展？按诉求性质怎么选型与落地最合理？

## 问题

我想在 Pi 框架下为 agent 增加定制能力（开发一个插件/扩展），但面对官方 `packages/coding-agent/examples/extensions/` 里 70+ 个五花八门的扩展案例和多篇文档，容易产生以下困惑：

1. **选型困惑（做成什么形态最合理）**：
   - 看到有人只写了一个 `SKILL.md`，有人写单文件 `.ts` 脚本，有人写完整的 npm 包。面对具体业务需求（如：审计安全、查外部系统、做交互面板、做多步计划模式），到底该按什么标准选型？
2. **工程机制困惑（代码怎么挂进 Pi）**：
   - Pi 宣称自己是 Minimal Core（极简核），不内置 Sub-agent、不内置 Plan-mode。它提供了一个 `export default function(pi: ExtensionAPI)`，但在这个统一入口里，具体有哪些正交动作（轴）可以调用？它们是如何配合的？
3. **开发与调试闭环（怎么最快跑起来验证）**：
   - 从零写一个扩展，是否需要配复杂的 TS 编译、打包脚手架？如何在不重启终端会话的情况下实时热重载？
   - 如何进行自动化测试与防御性编程（避免 Stale Context、Fail-closed 异常、同名覆盖冲突）？

## 背景与基线

- **研究基线**：pi-mono `v1.0.0`（upstream tag `a13d35a74`，本仓库 merge `9e387e653`）。
- **理论依据**：
  - `_digested/extensions/`（极简核 + 靠扩展长能力的四条代码轴 + 一条资源轴）
  - `_digested/composition/10_extension_axes/`（八条正交扩展轴与组合案例解剖）
  - `_faq_on_digested/08_extension_vs_package/`（Extension 运行时模块 vs Package 分发容器）
  - `packages/coding-agent/examples/extensions/`（官方 70+ 示例）
- **对比参考**：吸收 DeerFlow `05_getting-started-first-flow` 的“按需分层、快速闭环、端到端综合穿透”的工程方法论，重塑为适合 Pi 极简核与正交轴特性的实战指南。
