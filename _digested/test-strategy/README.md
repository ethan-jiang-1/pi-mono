# test-strategy/ — Pi-mono 官方测试策略与工程纪律的消化层

> **基线**：pi-mono **`v1.2.0`（tag `06a466935`）**。此前为 `v1.0.0`（tag `a13d35a74`）。本区间（v1.0.3 → v1.2.0）测试面的主要变化：`scripts/coding-agent-consumer.mjs` 拆为 `check-package-install.mjs` + `package-artifacts.mjs` + `local-package-install.mjs` + `coding-agent-smoke.mjs`；`durable-env.yml` 改名 `env.yml` 并扩为**四** job（`daemons`/`check`/`release-daemons`/`tests`；v1.0.3 为 `check`+`env-tests` 两个，`tests` 是 `env-tests` 的改名续存体）；`env-daemons.yml` 增 8 目标交叉构建；新增 `packages/env` 的 Rust daemon 构建与 pack 校验。详见 [`_change_log/0009`](../_change_log/0009-v1.0.3-to-v1.2.0.md)。本目录是 `_digested/` 下对 **Pi-mono 官方测试体系与工程纪律** 的全景解剖层，全面覆盖其测试宪法、分层架构、仿真内核、持久化验证与端到端发布门禁。

---

## 一、这是什么

Pi-mono 是一个以极简、高执行速度与强嵌入性著称的 AI Coding Agent 平台。与大量粗制滥造的 Agent 玩具项目不同，Pi-mono 的测试体系拥有工业级编译器和操作系统级的严苛标准：

- **零真实模型依赖（Zero Paid Tokens / Zero LLM API）**：日常 CI、单测与集成测试 100% 离线运行，严禁直连外部模型；
- **极致环境强隔离（Environmental Hermeticism）**：通过 `test.sh` 构造物理沙箱，抹平一切系统与用户环境变量，杜绝本机污染与 Git 逃逸；
- **多引擎分轨驱动（Engine-Specialized Routing）**：Vitest 负责核心逻辑与多包编译、Node.js 原生 `node:test` 负责 TUI 底层字符流断言、`tmux` 负责发布产物端到端无头终端验证；
- **确定性状态机测试内核（Deterministic Faux Engine）**：内置 711 行的官方 Faux Provider 与全功能会话 Harness，毫秒级驱动 Agent Loop 的完整生命周期。

本目录回答一个核心问题：**Pi-mono 自身是如何系统性组织测试的——它的测试宪法、分层架构、伪装机制、TUI 断言与发布门禁是什么？**

---

## 二、规模与测试资产基线（硬事实，v1.0.0 实测口径）

| 资产维度 | 物理事实与分布 |
|---|---|
| **测试执行脚本** | 根目录 `test.sh`（强隔离沙箱）、`pi-test.sh`（30+ API Key 抹除器）、`pi-test.bat`/`ps1`（Windows 宿主支持） |
| **测试配置文件** | **11** 份 Vitest 配置（1 份根目录 `vitest.base.ts` + 10 份包级配置：agent / ai / codemode / coding-agent / durable（含 `vitest.benchmark.config.ts`）/ env / evals（`vitest.evals.config.ts` + `vitest.test.config.ts`）/ mcp）。**订正**：原写"13 份（1 根 + 12 子包）"是 v1.0.0 的旧值，v1.0.3→v1.2.0 期间随 `protocol`/`client`/`server` 三包删除而降为 11 |
| **测试用例分布** | 覆盖全部 **11** 个子包（`packages/` 仅 11 个目录：agent / ai / chord / codemode / coding-agent / durable / env / evals / mcp / telemetry / tui；其中 `chord`、`telemetry` 无独立 vitest 配置，由根配置覆盖），集中于 `packages/*/test/`、`packages/durable/test/`（40+ 份高阶持久化与自愈状态机单测） |
| **虚拟模型内核** | `packages/ai/src/providers/faux.ts`（727 行代码，提供剧本化事件流与 `FauxResponseStep`） |
| **Agent 状态机驱动** | `packages/coding-agent/test/suite/harness.ts` 与 `test-harness.ts`（全生命周期 AgentSession 模拟器） |
| **TUI 独立测试车道** | `packages/tui/test/`（**脱离 Vitest，独占采用 Node.js 原生 `node:test` 引擎**） |
| **二进制与冒烟资产** | `scripts/smoke-test-codemode-binary.mjs`（本地微型 SSE 流服务器）+ `.pi/skills/interactive-testing.md`（tmux 虚拟终端控制） |
| **模型能力评测车道** | `packages/evals/`（独立评测包，与基础 CI 严格物理隔离，使用独立 `vitest-evals` 运行） |
| **协议合规证据锁** | `packages/coding-agent/test/mcp-conformance/`（运行官方 `@modelcontextprotocol/conformance`，以 `baseline.json` 强锁防退化） |
| **供应链与工程守卫** | `scripts/check-runtime-deps.mjs`（AST 幽灵依赖审计）、`check-entry-graphs.mjs`（图预算）、`check-package-install.mjs` + `package-artifacts.mjs`（真实 Tarball 逐包隔离消费验证） |
| **存储通用一致性** | `packages/durable/src/testing/storage-conformance.ts`（1,663 行跨 SQLite / JSONL / Memory 参数化等价性套件；v1.0.3 时为 1,584） |

---

## 三、文档结构（10 篇深度专题 + 1 篇导航）

| 序号 | 专题文档 | 核心解决的问题与解剖对象 |
|---|---|---|
| **01** | [**01-doctrine-and-isolation.md**](01-doctrine-and-isolation.md) | **测试宪法与强隔离机制**：解剖 `test.sh` 的 `env -i` 沙箱、临时 HOME 构造、API Key 抹除、Git 逃逸防御与所有权标记销毁。 |
| **02** | [**02-testing-tiers.md**](02-testing-tiers.md) | **五级测试金字塔与路由矩阵**：从静态检查与九重守卫（`npm run check`）、单测、Harness 集成测试、独立二进制冒烟到 Evals 的分级执行路由。 |
| **03** | [**03-faux-provider-and-harness.md**](03-faux-provider-and-harness.md) | **虚拟模型驱动内核与 Agent 会话测试**：深度解密 711 行 `faux.ts` 剧本状态机与 `harness.ts` 零 Token 驱动 Agent Loop 的机制。 |
| **04** | [**04-tui-headless-testing.md**](04-tui-headless-testing.md) | **TUI 无头测试与 Node:test 实践**：为什么 TUI 车道坚决弃用 Vitest、改用 `node:test`；纯字符网格投影与 ANSI 转义流断言。 |
| **05** | [**05-durable-state-and-recovery.md**](05-durable-state-and-recovery.md) | **持久化事件流与状态机恢复测试**：解剖 `packages/durable` 的 SQLite/JSONL 后端恢复、任务图拓扑、Compaction 树与故障自愈断言。 |
| **06** | [**06-smoke-and-interactive-tmux.md**](06-smoke-and-interactive-tmux.md) | **二进制本地 SSE 桩与 Tmux 受控交互测试**：解剖 `smoke-test-*.mjs` 的本地微型 SSE 服务与 tmux `80x24` 无头终端屏显快照技术。 |
| **07** | [**07-evals-separation.md**](07-evals-separation.md) | **确定性回归与模型评测的分轨工程学**：CI 快速严格测试（布尔断言）与 Evals 系统（概率统计）的物理隔离与防干扰设计。 |
| **08** | [**08-extension-testing-playbook.md**](08-extension-testing-playbook.md) | **Pi 扩展测试实战指南**：如何用 Pi 的测试哲学检验你的 Extension；从契约 Mock 到基于 Harness 的会话状态机全真仿真。 |
| **09** | [**09-supply-chain-and-protocol-conformance.md**](09-supply-chain-and-protocol-conformance.md) | **协议合规证据锁与工程守卫**：MCP Conformance、baseline.json 证据锁、AST 幽灵依赖防御与打包消费仿真。 |
| **10** | [**10-extension-repo-test-strategy.md**](10-extension-repo-test-strategy.md) | **Extension Repo 测试策略搭建指南**：把 DSH 插件测试政策（证据阶梯/承诺组合/自足检查单）移植到 pi 生态的构思方法、机制映射、反转要点与 repo 蓝图。 |

---

## 四、阅读建议与路径

- **快速掌握核心理念（10 分钟）**：
  先读本文件与 [01-doctrine-and-isolation.md](01-doctrine-and-isolation.md)。理解为什么 Pi 能够做到毫秒级测试、以及为什么绝不能在自动化测试中触碰真实网络与大模型。
- **扩展与插件开发者（强烈推荐，30 分钟）**：
  精读 [03-faux-provider-and-harness.md](03-faux-provider-and-harness.md)、[08-extension-testing-playbook.md](08-extension-testing-playbook.md) 与 [10-extension-repo-test-strategy.md](10-extension-repo-test-strategy.md)。掌握如何利用 Pi 官方提供的 `harness.ts`、`faux.ts` 与 UI 替身对自身扩展进行零 Token、高确定性的自动化测试覆盖；要为 extension repo 定测试策略时，从 10 篇的四问构思框架与 repo 蓝图入手。
- **端到端与界面发布人员（深潜）**：
  研读 [04-tui-headless-testing.md](04-tui-headless-testing.md) 与 [06-smoke-and-interactive-tmux.md](06-smoke-and-interactive-tmux.md)，掌握终端应用与单体发布二进制的自动化验收技巧。
- **工程基建与架构师（深潜，40 分钟）**：
  研读 [05-durable-state-and-recovery.md](05-durable-state-and-recovery.md) 与 [09-supply-chain-and-protocol-conformance.md](09-supply-chain-and-protocol-conformance.md)，学习如何在 Monorepo 下构建幽灵依赖审计、模块图预算、打包消费验证、跨存储一致性与标准协议证据锁。

---

## 五、矢量架构图谱集（figures/）

为了帮助初学者建立直观的视觉心智模型，本专题在 `figures/` 子目录下配备了 5 张高信息密度的矢量架构图：

| 图解文件 | 对应章节 | 核心传达的视觉心智模型 |
|---|---|---|
| [**01-hermetic-sandbox.svg**](figures/01-hermetic-sandbox.svg) | [01 篇](01-doctrine-and-isolation.md) | `test.sh` 物理清洗管道：宿主污染拦截、`.pi-test-owned` 自毁与 `env -i` 真空派生 |
| [**02-testing-pyramid-and-gates.svg**](figures/02-testing-pyramid-and-gates.svg) | [02 篇](02-testing-tiers.md) | 五级测试金字塔与 Tier 1 九重自动化工程守卫流水线全景 |
| [**03-faux-provider-state-machine.svg**](figures/03-faux-provider-state-machine.svg) | [03 篇](03-faux-provider-and-harness.md) | 粗暴 Mock 反模式 vs 全真宿主 + Faux 剧本驱动 Agentic Loop 零 Token 时序 |
| [**04-virtual-terminal-grid.svg**](figures/04-virtual-terminal-grid.svg) | [04 篇](04-tui-headless-testing.md) | `VirtualTerminal` 无头架构：ANSI 逃逸序列流映射为纯净二维字符矩阵与语义断言 |
| [**05-supply-chain-and-evidence-lock.svg**](figures/05-supply-chain-and-evidence-lock.svg) | [09 篇](09-supply-chain-and-protocol-conformance.md) | MCP `baseline.json` 四维判定证据锁与本地 Tarball 隔离消费验证流程 |

