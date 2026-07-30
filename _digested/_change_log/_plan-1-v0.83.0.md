# Plan 1：将 `_digested/` 从 v0.75.3 追到 v0.83.0

**状态**：计划阶段（2026-07-30）
**当前基线**：pi-mono `v0.75.3`（commit `76705633`）
**目标基线**：pi-mono `v0.83.0`（commit `71efc6f0`）
**覆盖目录**：`_digested/agent/`、`_digested/integration/`

这不是另一个 release note。`0002-v0.75.3-to-v0.83.0.md` 记录了上游变化；本计划负责把会误导读者的旧结论改为 v0.83.0 的实际行为。

## 为什么不能一次修完

989 commits、8 个 minor 版本、几乎所有关键文件都有两位数的 commit 改动。逐篇硬修会导致：

- 不知道哪些机制描述已经过时、哪些只是行号漂移
- 新结构（`harness/tools/`、`extensions/llama/`、`ai/auth/`）完全没有被覆盖
- 修到一半发现前面的结论错了，需要回退

所以要分 phase，每个 phase 以"验证通过"为完成标准，而不是"改完"。

## Phase 0：确认基线（本 phase，一次性的）

**目标**：把当前状态固定下来，以后每次 sync 有明确的 from → to。

- [x] 建立 `_change_log/` 目录和 README
- [x] 写 `0001-baseline-v0.75.3.md`（初始基线记录）
- [x] 写 `0002-v0.75.3-to-v0.83.0.md`（粗糙 gap 记录）
- [x] 更新 `_digested/README.md` 顶部基线声明
- [ ] merge `ethan` 分支到 `main`（或 rebase），让 `_change_log/` 进入主分支

**验收**：任意读者打开 `_digested/README.md` 能在第一屏看到"当前以 v0.75.3 为准，upstream 已到 v0.83.0"的警示。

---

## Phase 1：Scout — 读 diff，建立主题清单

**目标**：不是修文档，而是搞清楚 989 个 commit 到底改了什么。按主题分组，输出一个更新优先级矩阵。

**执行方式**：

对每个关键文件，读 `76705633..upstream/main` 的 diff summary（不是逐 commit 读），回答三个问题：
1. 这个文件的 API surface 变了吗？（新增/删除/改名了 export？）
2. 核心机制变了吗？（算法、状态机、生命周期？）
3. 还是只是内部重构？（行号漂移但合约不变？）

**Scout 范围**（按热度排序）：

| 优先级 | 文件 | commits | 为什么 |
|--------|------|---------|--------|
| P0 | `coding-agent/src/core/agent-session.ts` | 54 | SDK/RPC 入口，integration/ 的核心锚点 |
| P0 | `ai/src/types.ts` | 42 | LLM 抽象层，agent/ 和 integration/ 都依赖 |
| P1 | `coding-agent/src/core/extensions/types.ts` | 27 | 扩展系统类型定义 |
| P1 | `coding-agent/src/core/extensions/runner.ts` | 19 | 扩展系统运行时 |
| P1 | `coding-agent/src/core/session-manager.ts` | 18 | Session 生命周期管理 |
| P1 | `coding-agent/src/core/sdk.ts` | 16 | SDK 入口 |
| P1 | `agent/src/harness/compaction/compaction.ts` | 16 | Compaction 机制 |
| P2 | `agent/src/harness/types.ts` | 14 | Agent harness 类型 |
| P2 | `agent/src/agent-loop.ts` | 13 | Agent 核心循环 |
| P2 | `agent/src/harness/agent-harness.ts` | 13 | Agent harness |
| P2 | `coding-agent/src/core/extensions/loader.ts` | 10 | 扩展加载 |
| P3 | 其余引用文件 | <10 | 变化较小，大概率只是行号漂移 |

**新增结构 scout**：

| 目录 | 问题 |
|------|------|
| `agent/src/harness/tools/` | 这个目录是什么？和已有的 `coding-agent/src/core/tools/` 什么关系？ |
| `coding-agent/src/extensions/` | 从 `core/extensions/` 移出来的？还是全新的层？ |
| `coding-agent/src/extensions/llama/` | llama 扩展是什么？ |
| `ai/src/api/` | API 层抽象的边界？ |
| `ai/src/auth/`、`auth/oauth/` | 认证架构变化？ |
| `ai/src/compat/` | 兼容层？兼容什么？ |

**输出**：一份 `_change_log/_scout-v0.83.0.md`（或直接在本 plan 里追加），包含：
- 每个关键文件的变更定性（API changed / mechanism changed / refactor only）
- 新增结构的简要说明
- 按主题（不是按文件）的更新优先级矩阵

**验收**：能回答"integration/ 的哪些文档肯定要重写、哪些只需要换行号、哪些可以不动"。

---

## Phase 2：Fix integration/ — 外部集成入口

**目标**：integration/ 是外部用户判断"pi-mono 能不能接、怎么接"的第一入口。SDK/RPC API 变化直接影响集成决策。先修这一层。

**执行顺序**：

### 2.1 修 06-coverage-and-parity.md（能力覆盖表）

这是 integration/ 的"真相表"。54 commits 改动 `agent-session.ts` 意味着能力覆盖表大概率有新增/删除/变化的能力。

- [ ] 重读 `agent-session.ts` 的所有 public method
- [ ] 重读 `rpc-types.ts` 的所有 command type
- [ ] 重读 `sdk.ts` 的 `createAgentSession()` 参数
- [ ] 更新 Runtime 能力覆盖表
- [ ] 更新 "vs OpenCode" 能力缺口表（如果还保留的话）
- [ ] 更新 TUI parity 列表

### 2.2 修 03-runtime-api.md（SDK/RPC API 参考）

- [ ] 用当前 `agent-session.ts` 验证所有 SDK 方法签名
- [ ] 用当前 `rpc-types.ts` 验证所有 RPC command
- [ ] 检查 JSONL 成帧协议是否有变化
- [ ] 更新 completion detection 逻辑（如有变化）

### 2.3 修 04-event-model.md（事件模型）

- [ ] 检查 event type 是否有新增/删除/改名
- [ ] 检查 `message.part.updated` 的 part 类型是否有变化

### 2.4 修 02-advanced.md、01-start-here.md

- [ ] 验证三层架构描述是否仍然准确
- [ ] 验证 library-first 的论述是否需要更新
- [ ] 检查 web-ui 的特殊架构是否有变化
- [ ] 更新 SDK vs RPC 选择建议（如有新的 tradeoff）

### 2.5 修 05-recipes.md

- [ ] 验证各 recipe 中的 API 调用是否仍然有效
- [ ] 添加新能力的使用示例（如 scopedModels、bash_execution_update 等）

**验收**：用当前 `upstream/main` 的源码验证 integration/ 中的每一个 API 名称、方法签名和事件类型都存在且行为描述正确。

---

## Phase 3：Fix agent/ — Agent 内核解剖

**目标**：agent/ 的读者是想深入理解 Agent 内部机制的人。核心机制大概率思想没变（loop、compaction、harness 的基本设计），但行号全部漂移，部分细节需要微调。

**执行策略**：不是逐篇重写，而是：

1. 先定位"核心机制变了"的文件（通过 Phase 1 的 scout 结论）
2. 对于机制没变的文件 → 只更新行号和源码锚点
3. 对于机制变了的文件 → 重读源码，更新机制描述

### 3.1 修 agent/README.md（过时的自述）

- [ ] 修正"当前只有一层：01-Anatomy"的错误描述
- [ ] 补充 02-04 section 的简介

### 3.2 修 02-Runtime/（双层 loop、pipeline、cancellation）

`agent-loop.ts` 有 13 commits。重点验证：
- [ ] `runLoop` 的核心逻辑是否变了
- [ ] `streamAssistantResponse` + `executeToolCalls` 的 pipeline 是否变了
- [ ] Cancellation（AbortController chain）是否变了

### 3.3 修 03-Memory/（compaction、token estimation、session tree）

`compaction.ts` 有 16 commits。重点验证：
- [ ] auto-compaction 的触发条件是否变了
- [ ] split-turn / incremental update 的策略是否变了
- [ ] Token estimation 的 heuristic 是否变了
- [ ] Session tree 的 append-only 模型和 fork 逻辑是否变了

### 3.4 修 04-Harness/（agent harness、skills、system prompt、tools）

`harness/types.ts`(14)、`agent-harness.ts`(13)、新增 `harness/tools/`。重点：
- [ ] AgentHarness 的 phase state machine 是否变了
- [ ] Skills 的 discovery 和 invocation 是否变了
- [ ] System prompt 的 multi-layer assembly 是否变了
- [ ] **新增**：`harness/tools/` 的分析——这个新层是什么，和已有的 tool 系统怎么交互?
- [ ] Bash Tool、Edit/Write Tools 的行为是否变了

### 3.5 修 01-Anatomy/（agent config、message types、tool system、extensions）

- [ ] `AgentLoopConfig` 是否有新的配置项
- [ ] Message type system（declaration merge）是否变了
- [ ] 三层工具模型是否仍然准确
- [ ] Extension system 的类型定义（`extensions/types.ts` 有 27 commits）

**验收**：agent/ 下每一篇的源码锚点表都能在 `upstream/main` 中找到对应的函数/类型，行号在 ±20 行以内。

---

## Phase 4：New topics — 覆盖新增结构

**目标**：针对 Phase 1 scout 发现的新结构，判断是否需要开新篇。

**候选新专题**：

| 候选 | 判断标准 | 优先级 |
|------|---------|--------|
| `harness/tools/` | 如果它是 agent harness 新增的工具执行层，和已有的 tool system 有明确分工，值得一篇 | P1 |
| `extensions/` 重构 | 如果扩展系统从 `core/extensions/` 移到顶层 `extensions/`，架构意义是什么 | P1 |
| `extensions/llama/` | 如果 llama 扩展是一个重要的集成方式 | P2 |
| `ai/auth/` OAuth 架构 | 如果 OAuth 认证是外部集成的关键依赖 | P2 |
| `ai/compat/` | 如果兼容层影响 provider 接入 | P3 |

**判断规则**（沿用 agent/README.md 的标准）：
- 现象必须让读者一段话理解；只能说"这是上一章的补充"就不开
- 核心矛盾必须至少有两个力在对抗；只是模块名列表就合并到已有篇
- 必须能给出可验证的最小例子；不能就不开

**验收**：每个新专题通过 agent/README.md 的独立性标准。

---

## Phase 5：Verification — 交叉验证和收尾

- [ ] 逐篇扫描，删除"这是当前行为"但实际已过时的断言
- [ ] 更新 `_digested/README.md` 顶部基线声明为 v0.83.0
- [ ] 检查 agent/ 和 integration/ 之间的交叉引用是否仍然有效
- [ ] 写 `0003-v0.75.3-to-v0.83.0-completed.md` 记录实际修改范围
- [ ] 更新本 plan 的完成状态

---

## 执行顺序总览

```
Phase 0: 基线建立 ✅（本轮完成）
Phase 1: Scout 读 diff
Phase 2: Fix integration/（最影响外部判断）
Phase 3: Fix agent/（最影响内部理解）
Phase 4: New topics（按优先级开）
Phase 5: Verification（交叉验证收尾）
```

每个 Phase 完成后 commit 一次，这样如果某个 Phase 的方向错了，可以单独回退而不丢失其他 Phase 的进展。

---

## 进度日志

### 2026-07-30 — Phase 0 完成

- 建立 `_change_log/` 目录、README
- 写基线记录 `0001-baseline-v0.75.3.md`，覆盖范围：agent/ 21 篇 + integration/ 6 篇，37 个引用源文件
- 写 gap 记录 `0002-v0.75.3-to-v0.83.0.md`：989 commits，按包拆解，关键文件 commit 数，影响评估
- 更新 `_digested/README.md`：顶部基线声明 + 警示、子目录表、"用法"加版本追踪流程
