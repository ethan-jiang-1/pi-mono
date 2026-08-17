# v0.83.0 → v0.84.2 变更总结

**日期**: 2026-08-17
**范围**: `71efc6f0` → `d3ab2af9`（515 commits，~2.5 周）
**标签**: v0.84.0, v0.84.1, v0.84.2（main 在 v0.84.2 后另有 8 个未发布 commit）
**本轮特殊性**：**fork 代码首次与文档同步到位**——upstream/main 已 merge 进本仓库（`1c91e97a5`），文档源码锚点从此对应工作树。

---

## 一句话

v0.84.0 用一次 release 完成了三件事：把 agent 包的 session 存储换成 lane-based v4 模型、把 `AgentHarness` 重设计为去泛型化的 `AgentLane` 骨架、让 client/server/protocol 二进制协议栈成型——pi-mono 从"单进程 library"向"可托管的多 lane agent 平台"迈出了第一步。

---

## 五大主题

### 1. Session v4（最大 breaking）

旧 session 模型（`SessionTreeEntry` + legacy JSONL/in-memory repo API）删除，换成三种 durable 数据（Entry 7 种 / LaneRecord 9 种 / facts）+ 严格连续的全局 seq。lane 是 entry 树上的具名游标，每 lane 至多一个 open operation（0=空闲 1=suspended 2=corruption）。JSONL 常规写是单行 append，只有 torn-tail 修复和 fork 走 `renameFile` 原子发布。**coding-agent 尚未接入**（`SessionManager` 仍是自有实现）——v4 目前是 harness 演进的地基。

### 2. AgentHarness → AgentLane 骨架

v0.83 的四泛型 `AgentHarness<TContext, TSkill, TPromptTemplate, TTool>` 整体移除；现在是零泛型的 `class AgentHarness implements AgentLane`，从 experimental 入口转正为默认导出——但实现是 scaffold：`create()` 遇已有 record 即抛 `HarnessNotImplemented`，多数 lane 操作返回 unavailable。官方 `docs/harness.md` spec 描述的是更超前的 registers/SQLite 目标模型，与已发布代码不是一套 API。

### 3. `message_update` 改纯增量（直接影响外部集成）

JSON/RPC wire 上的 `message_update` 移除累积 `message` 和 `partial` 字段（修复平方级输出增长），只带 `usage` + `assistantMessageEvent` delta；客户端在 `message_start`/`message_end` 之间自己拼装。

### 4. protocol / client / server 三件套（experimental）

`pi-protocol`（长度前缀 + CBOR，hello 握手，快照权威/进度提示分离）、`pi-client`（`ByteTransport` 任意有序字节流）、`pi-server`（Unix socket）。第三条集成路径，方向是长连接权威快照，与 RPC 的事件流模型形成对照。

### 5. Auth 加固 + 全链路取消语义

`ModelsRequestTransforms` 改名、`getApiKeyAndHeaders()` 返回 `string | null` 的 `ProviderHeaders`、`refresh()` 带选项带结果、OAuth `refreshToken` 强制尊重 abort signal、`context.stored`/`context.publish()` 事务替代 raw store 访问。新 provider：Baseten、Qwen Token Plan Individual；`pi auth check`。

---

## 本轮对 `_digested/` 的更新（2026-08-17）

- **代码**：merge upstream/main 进 ethan（`1c91e97a5`，零冲突）；清理已删包的构建残留（mom/pods/web-ui 的 dist 与 node_modules）
- **integration/**：修正**从 v0.75.3 起就错误的虚构事件名**（`message.part.updated`/`turn.started`/`session.status` 等——真实事件是 snake_case 的 `message_update`/`turn_start`/`agent_settled`），涉及 01/02/03/04/05 五篇；06 新增 protocol/client/server 路径介绍和 v0.84 能力行
- **agent/**：新建 `3.5_Session_v4.md`（lane-based 存储全解）；4.1 加 AgentHarness 重设计警示；16 篇追加 v0.84.2 警示；README 刷新（含修正"事件类型移入 harness/types.ts"的错误说法——实际在 `agent/src/types.ts:428` 和 `agent-session.ts:141`）
- **`_digested/README.md` / `_faq_on_digested/`**：基线声明 → v0.84.2+8；包清单更新为 10 包
- **遗留缺口**：`agent/src/search/`、`coding-agent/src/extensions/`（llama.cpp）、`ai/src/compat/`、telemetry 专题、agent/ 各篇行号逐篇复核

---

## 相关文件

- Gap 分析：[`0003-v0.83.0-to-v0.84.2.md`](./0003-v0.83.0-to-v0.84.2.md)
- 执行计划与进度：[`_plan-2-v0.84.2.md`](./_plan-2-v0.84.2.md)
