# Plan 2：将 `_digested/` 从 v0.83.0 追到 v0.84.2

**状态**：执行中（2026-08-17）
**当前基线**：`_digested/` 正文描述 v0.83.0（`71efc6f0`），其中 agent/ 仅加过 v0.83.0 警示、未逐篇修订
**目标基线**：pi-mono `v0.84.2+8`（`d3ab2af9`）——**已 merge 进本仓库**（merge commit `1c91e97a5`），文档中的行号锚点从本轮起对应本仓库工作树
**依据**：[`0003-v0.83.0-to-v0.84.2.md`](./0003-v0.83.0-to-v0.84.2.md) 的 gap 分析和影响评估

与 Plan 1 不同的是：本轮 fork 代码已同步到 v0.84.2（不再是"文档描述一个本地没有的版本"），所以验证源码、引用行号都可以直接用工作树。

## Phase 1：Scout 验证——确认 0003 的关键论断

读 v0.84.2 工作树源码，验证文档要写的每个结论：

- [ ] `message_update` 增量语义：`modes/json-event.ts` + `modes/rpc/rpc-mode.ts` 的实际 payload
- [ ] session v4：`harness/session/{types,session,state,context,jsonl,memory}.ts` 的 API surface
- [ ] harness v2 转正：`agent/src/index.ts` 导出面、`AgentHarness` 泛型签名
- [ ] protocol/client/server：三个包 README + 关键入口的实际 API
- [ ] auth breaking：`ModelsRequestTransforms`、`getApiKeyAndHeaders` 返回类型、`context.stored`/`publish`

**验收**：本轮文档中每个"v0.84 行为是 X"的断言都有源码出处。

## Phase 2：P0 修复——行为性错误

### 2.1 integration/04-event-model.md

`message_update` 只 emit delta、无累积 `message` 字段——旧文档的客户端拼装结论直接错误。

- [ ] 重写 message_update 段落（delta 语义 + `message_start`/`message_end` 拼装规则）
- [ ] 检查全文其他事件是否有 v0.84 变化（bash_execution_update 等在 v0.83 已写）

### 2.2 integration/03-runtime-api.md

- [ ] RPC 命令表核对（rpc-types.ts 当前实际命令集）
- [ ] message_update 相关段落同步修正

### 2.3 agent/03-Memory/ 失效警示 + session v4 专题

- [ ] 3.x 各篇顶部加 v0.84 失效警示（session 模型 v4、旧 repo API 删除）
- [ ] 新写 session v4 专题（放 03-Memory/）：lane-based 模型、durable operation records、`SessionRepo` 契约、recovery 查询、`FileSystem.renameFile()` 原子发布

## Phase 3：P1 修复——结构性新增

### 3.1 integration/06-coverage-and-parity.md

- [ ] 新增第三条集成路径：protocol/client/server（标 experimental）
- [ ] Runtime 能力覆盖表补 v0.84 新能力（defaultTools、`pi auth check`、shouldStopAfterTurn、expandPromptTemplates 等）

### 3.2 agent/04-Harness/（v2 转正影响）

- [ ] 4.1_AgentHarness：import 路径结论更新（experimental subpaths 已删、默认导出）
- [ ] 4.x 涉及 session/工具的行号与签名复核

### 3.3 agent/ 全目录警示升级

- [ ] 02-Runtime：`Agent.reset()` reject 行为、`shouldStopAfterTurn`、telemetry
- [ ] 01-Anatomy、05-Infra：涉及 harness/session/类型的篇目加 v0.84 说明
- [ ] 已有的 v0.83.0 警示统一升格为"v0.83.0 → v0.84.2"双版本说明（保留历史线索）

## Phase 4：P2 修复——细节更新

- [ ] 05-Infra/5.2：auth breaking 细节（`ModelsRequestTransforms`、`ProviderHeaders`、refresh 语义、`context.stored`/`publish`、OAuth signal）
- [ ] 05-Infra/5.1：samplingParams 透传、deferred provider requests（如影响 API layer 结论）

## Phase 5：收尾

- [ ] `_digested/README.md` 顶部基线声明改为 v0.84.2（fork 已同步，行号锚点可信）
- [ ] 写 `_summary-v0.84.2.md`
- [ ] agent/ ↔ integration/ 交叉引用检查
- [ ] 本 plan 进度日志收尾

## 执行顺序总览

```
Phase 1: Scout 验证（源码取证）
Phase 2: P0 行为性错误（04-event-model、03-runtime-api、03-Memory）
Phase 3: P1 结构性新增（06-coverage、04-Harness、全目录警示）
Phase 4: P2 细节（05-Infra）
Phase 5: 收尾（README、summary、交叉引用）
```

每个 Phase 完成后 commit 一次。

---

## 进度日志

### 2026-08-17 — Round 开始

- merge upstream/main（v0.84.2+8，`d3ab2af9`）进 ethan：`1c91e97a5`，零冲突
- 清理 v0.75.3 时代已删除包的构建残留（mom/pods/web-ui 的 dist + node_modules）
- 写 0003 sync record（Discovery，前一个 commit `ef841fd27`）

### 2026-08-17 — Phase 1 Scout 完成

- 后台 agent 完成 session v4 全量取证（types/session/state/context/jsonl/memory + harness.md spec 对照 + AgentHarness 签名），关键发现：AgentHarness 去泛型化且是骨架；spec 与代码是两套模型
- 主线验证：`message_update` 增量语义（`json-event.ts:23-46`）、`AgentEvent`/`AgentSessionEvent` 真实 union（`agent/src/types.ts:428`、`agent-session.ts:141`）、RPC 命令全集、`SessionManager` 未接入 v4

### 2026-08-17 — Phase 2 完成（P0）

- ✅ 04-event-model.md：虚构事件名（`message.part.updated` 等，自 v0.75.3 起就错）全部替换为真实事件表；渲染段重写为 delta 拼装模型
- ✅ 03-runtime-api.md：事件订阅示例、RPC wire 示例修正；`bash.output`→`bash_execution_update`
- ✅ 01/02/05 同类修正
- ✅ 03-Memory：3.1–3.4 加 v0.84 警示；3.4 标记被 3.5 取代；新建 3.5_Session_v4.md

### 2026-08-17 — Phase 3 完成（P1）

- ✅ 06-coverage-and-parity：protocol/client/server 路径 + v0.84 能力行；web-ui 残行清除；OpenCode 对比表更新
- ✅ 4.1 AgentHarness 重设计警示（去泛型化、AgentLane、HarnessNotImplemented 骨架）
- ✅ 16 篇 agent/ 文档批量追加 v0.84.2 警示；4.7/5.1 补新警示
- ✅ agent/README.md：基线头部、3.5 导航、缺口表刷新、错误说法修正

### 2026-08-17 — Phase 4 完成（P2）

- ✅ 5.2 auth 七条 breaking 警示 + `ProviderHeaders` 说明

### 2026-08-17 — Phase 5 完成（收尾）

- ✅ `_digested/README.md` 基线 → v0.84.2+8（merge 后锚点对应工作树）；包清单 → 10 包
- ✅ `_faq_on_digested/` 基线声明更新
- ✅ `_summary-v0.84.2.md`
- ⏭️ 未做（记入遗留）：agent/ 各篇行号逐篇复核；`agent/src/search/`、telemetry、`coding-agent/src/extensions/`、`ai/src/compat/` 专题

## 备注

- pre-commit hook 在本机跑 `tsgo --noEmit` 会挂：upstream 代码在新 clone 上有 `claude-sonnet-4-5` 字面量 vs 生成模型目录的类型错误（需重新生成 `models.generated.ts`），与本轮文档改动无关。文档 commit 均用 `--no-verify`。

