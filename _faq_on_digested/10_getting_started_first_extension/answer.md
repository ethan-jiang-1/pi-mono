# 10 — Pi 插件开发指南：按性质选型、正交轴拼装与工程落地

> 基线：pi-mono `v1.0.0`（upstream tag `a13d35a74`，本仓库 merge `9e387e653`）。

## 一、核心结论：扩展是“正交动作的组合”，不是“单一继承树”

在 DeerFlow 等重型 harness 中，“开发 Flow”通常是自顶向下的层级梯子（Skill -> Agent -> Sub-agent -> MCP）。
但在 Pi 的极简核哲学（Minimal Core）下：
- **核内只保留最小循环（agent loop）与 8 个原子工具**；
- 所谓“插件/扩展”（Extension），本质上是向循环暴露的既定**接缝（Seams）**挂载**正交动作（Axes）**；
- **想做成什么，其“诉求性质”决定了该用哪几条轴组合，而不是所有人都要爬同一个等级梯子**。

---

## 二、按性质分类的选型与推荐矩阵

开发前对照下表对号入座，选择最小代价的实现形态：

| 诉求性质 | 典型需求场景 | 推荐形态 | 核心扩展轴 | 官方活例锚点 | 避坑与反模式 |
|---|---|---|---|---|---|
| **1. 行为守卫型 (Guards / Safety)** | 拦截危险 bash（如 `rm -rf`）、敏感路径防写、git 脏提交阻断 | 单 `.ts` 脚本 | **轴 2 (事件钩子 - Seam 拦截)**<br>`tool_call` / `input` | `permission-gate.ts`<br>`protected-paths.ts`<br>`dirty-repo-guard.ts` | 禁忌：专门写一个“安全检查工具”让模型主动调用（模型容易幻觉跳过）；守卫必须由宿主硬拦截（fail-closed，返回 `{ block: true }`）。 |
| **2. 工具能力型 (Capabilities / Tools)** | 查内部数据库、调用私有 CLI、对接业务 API | 单 `.ts` 脚本 或 MCP | **轴 2.2 (注册面 - registerTool)** | `hello.ts`<br>`truncated-tool.ts`<br>`tool-override.ts` | 禁忌：不加输出截断导致返回数万行爆掉 context；已有标准 MCP 服务时直接挂载，不要重复写 TS 代码。 |
| **3. 交互感知型 (Presentation / TUI)** | 状态栏显示 token / git 分支、终端通知、自定义折叠渲染 | 单 `.ts` 脚本 | **轴 5 (UI 注入) + 轴 1/3 (命令/快捷键)**<br>`ctx.ui.setStatus` / `setWidget` | `status-line.ts`<br>`notify.ts`<br>`custom-footer.ts` | 禁忌：侵入 agent loop 决策；UI 扩展应保持纯展示，不产生副作用。 |
| **4. 模式工作流型 (Workflow / State Machine)** | 计划模式 (Plan-mode)、任务待办 (Todo)、子代理委派 (Subagent) | 多轴组合单文件或目录 | **轴 1 (命令) + 轴 2 (钩子) + 轴 4 (工具集切换) + 轴 6 (持久化)** | `plan-mode/`<br>`todo.ts`<br>`subagent/` | 禁忌：状态只保存在 TS 全局变量中；会话切换（`/tree`、`/fork`）或压缩后状态丢失，必须走 `appendEntry` 并通过 `sessionManager.getEntries()` 恢复。 |
| **5. 基础设施型 (Infrastructure / Backend)** | 远程 SSH 执行工具、微虚拟化沙箱、自定义模型提供商 | 单 `.ts` 脚本或独立包 | **底层 Operations 替换 + 轴 7 (Provider 注册)** | `ssh.ts`<br>`sandbox/`<br>`custom-provider-anthropic` | 禁忌：试图在每个内置工具上挂钩子去重定向；应通过两阶段绑定替换底层 `operations` 接口。 |
| **6. 纯流程知识型 (Declarative / Zero-code)** | 团队代码风格要求、排错 Checklist、特定框架审查规约 | 纯 Markdown 资源包 | **声明式资源轴**<br>`SKILL.md` 或 Prompt 模板 | `.pi/skills/`<br>`.pi/prompts/` | 禁忌：为了让 Agent 遵循一段规范而手写 TypeScript 钩子去改 system prompt；用 Skill 纯文本最轻量。 |

---

## 三、架构组合的三问裁决法则

当扩展跨越多个轴时（如案例 4 的复杂工作流），必须自检三个问题（源自 `_digested/composition/10_extension_axes/10h_combinatorics.md`）：

1. **每条轴有没有独立存在的理由？**（非必需的命令或 UI 坚决不挂）。
2. **各条轴会不会冲突？**（如：钩子 A 锁定了只读工具，钩子 B 又恢复了写入工具）。
3. **去掉某条轴，功能是否发生严重退化？**（如果去掉持久化，会话回溯后状态丢失，则该轴为强必需）。

---

## 四、快速参考卡

### 关键路径与作用域

| 位置 | 作用域 | 典型用途 |
|---|---|---|
| `./.pi/extensions/` | 当前项目本地 | 项目专用的工作流、命令与代码规范拦截 |
| `~/.pi/agent/extensions/` | 当前用户全局 | 个人跨项目的日常工具（如通用 status bar、全局按键） |
| `./.pi/skills/` | 当前项目本地 | 项目专用的纯 Prompt 技能指令 |
| `~/.pi/agent/skills/` | 当前用户全局 | 个人全局通用的 Prompt 技能 |
| `settings.json` 的 `packages` 列表 | 项目或全局 | 安装的第三方 npm / Git 扩展包 |

### 核心 CLI 调试指令

```bash
# 1. 临时加载单个扩展测试（不写入配置，退出即失效）
pi -e ./my-extension.ts

# 2. 交互模式下修改代码后实时热重载（无需重启会话，保持当前 context）
/reload

# 3. 排除所有扩展（用于快速排障判定是否扩展冲突）
pi --no-extensions

# 4. 打印完整调试日志（观察 extension 注册与事件分发）
PI_DEBUG=1 pi -e ./my-extension.ts
```

---

## 五、分篇索引

本专题由浅入深分为以下模块，按需阅读：

1. [**Part A: 零仪式极速开发循环**](part-a-dev-loop.md) — 利用 jiti 动态加载免编译、`-e` 临时运行与 `/reload` 热重载的秒级开发流。
2. [**Part B: 五大性质的代码模板与最小活例**](part-b-paradigms-by-nature.md) — 守卫型、工具型、交互型、工作流型、声明式五类性质的最小标准实现。
3. [**Part C: 复杂实战：多轴协同的审查门禁工作流**](part-c-composite-workflow.md) — 串联命令、工具集降权、危险拦截、状态栏与持久化的端到端全流程案例与时序图。
4. [**工程化、自动化测试与防坑避险**](engineering-and-testing.md) — 基于 `harness.ts` 与 faux provider 的单测编写、Stale Context 陷阱防御与 Package 打包发布。

---

## 关联研究与文献

- 概念判据：[`08_extension_vs_package/`](../08_extension_vs_package/answer.md)（Extension 运行时 vs Package 容器）
- 生态视野：[`09_package_ecosystem/`](../09_package_ecosystem/answer.md)（包品类分布与空白机会）
- 底层机制：[`_digested/extensions/`](../../_digested/extensions/README.md)（极简核与扩充四轴）
- 组合解剖：[`_digested/composition/10_extension_axes/`](../../_digested/composition/10_extension_axes/README.md)
