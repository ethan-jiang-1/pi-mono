# 差异：灵活的位置不同，不是"多 vs 少"

> 结论先行：pi 的灵活是**可扩展性**（能力从稳定核心长出去，核心不变）；DSH 的灵活是**可组合性**（运行时本身由插件树组合，核心下沉为组合内核）。这是两条不同的轴，不是同一根轴上"谁更多"。

## 差异 1：扩展的身份——二等公民 vs 一等公民

| | pi | DSH |
|---|---|---|
| 扩展形态 | 事件回调：`export default (pi) => { pi.on(...); pi.registerTool(...) }` | 树上的节点：有 fiber（独立生命周期）、inject（缺服务就 PENDING 等）、effect（卸载回收）、`isolate`（可隔离） |
| 生命周期 | 由 host 管（两阶段绑定 bindCore / stale invalidate / fail-close） | 由插件图管（fiber 卸载逆序回收 disposer） |
| 平台性 | 二等公民，活在 host 预留的接缝上 | 一等公民，活在组合内核里 |

**后果**：DSH 能按 agent/session 隔离服务（isolate realm）、能让插件在运行时装卸、能换后端整面换（换 E2B 只替换 bundle/profile patch 两行声明，Consumer 全不动，`capability-seams/01`）。pi 的扩展只能在 host 预留的接缝上动，换后端要走 adapter（如 `ssh.ts` 换 `BashOperations`，见 `harness/01-Architecture/1.1`）。

## 差异 2：模型可见面怎么保证

- pi：`buildSystemPrompt()` 单向组装，工具/自述同源不漂移（`system-prompt.ts`），但**没有"模型可见 ⟺ 已记录"的机器检查**——模型看到什么靠设计保证，不靠运行时校验。
- DSH：**机器不变量 `model-visible ⟺ logged`**——loop 在每次 `llm/stream` 上独立重建请求并与日志比对，不一致直接 fail（`/Users/bowhead/deepseek-harness/_digested/session-and-loop/00-map.md`、`/Users/bowhead/deepseek-harness/_digested/harness-idea/00-map.md` 判断二）。采信口径：属 harness-idea「判断层」结论（不进机制核验矩阵），但有源码 `invariant.ts` 落点。这是 pi 没有的机器保证。

## 差异 3：对 coding agent 的可读性策略

| | pi | DSH |
|---|---|---|
| 静态层 | 故意少画地图（无架构地图、无 tier、无预算），把地图委托运行时（README: "ask the agent to explain itself"） | 画薄地图 + tier taxonomy + 字数预算 + 机器检查（verify-md-links / verify-doc-budgets） |
| 动态层 | 运行时组装（buildSystemPrompt + read + compaction 回收），靠运行时兜底 | **动态可读性**：`--dump-config` / 生成目录是基线能力；`cordis_inspect` 是 opt-in 开发工具（须启用 `dsh-tool-cordis`，非产品默认）——agent 能问运行时，不靠猜源码 |

两者都认"运行时组装才是保证"，但 pi 把责任"委托"给运行时生成，DSH 把责任写成静态契约 + 运行时检查。

## 差异 4：纪律的载体

- pi：纪律写在 CONTRIBUTING（core-minimal）+ 由结构逼出来（能力无处安放只能走接缝）。
- DSH：纪律写成硬货——1486 个 note 文件、数十个门禁、100% coverage、根 AGENTS 上下文预算。**可参与性 = 外置程度 ÷ 外置成本**。

## 差异 5：接入形态

- pi：`createAgentSession()` 进程内 SDK + JSONL RPC 子进程；TUI（`packages/tui`）是自研 terminal 渲染器——依赖仅 `get-east-asian-width` + `marked`，无 react/ink，作为 SDK 的 consumer 参考实现。
- DSH：CLI / Web / ACP / JSON-RPC 复用同一套 runtime spine，入口只是"组合出不同插件树的 profile"；`dsh --profile web` 是 bootstrap 组合时序，比 pi 的 SDK 启动复杂得多。

## 一张表收束

| 轴 | pi | DSH |
|---|---|---|
| 灵活的轴 | 可扩展性（能力） | 可组合性（运行时构成） |
| 二等公民/一等公民 | 扩展=事件回调（二等） | 插件=树上节点（一等） |
| 换后端 | 换 adapter（如 operations） | 换 bundle/profile patch，Consumer 不动 |
| 模型可见保证 | 设计保证（同源自述） | 机器不变量（visible ⟺ logged） |
| 可读性策略 | 委托运行时 | 静态契约 + 动态可读性 |
| 纪律 | CONTRIBUTING + 结构 | 门禁 + note 语料 + coverage |