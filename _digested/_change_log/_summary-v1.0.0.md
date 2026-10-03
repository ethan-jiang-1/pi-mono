# v0.86.1 → v1.0.0 变更总结

**日期**: 2026-10-02
**范围**: `13cbf77df`(v0.86.1) → `7fbbd5f4a`(v1.0.0+2)（219 commits，1171 文件 +115,438/−129,148，09-20 → 10-01，11 天）
**标签**: v0.87.0 / v0.87.1 / v0.99.0 / v0.99.1 / v0.99.2 / v1.0.0 六个 release；upstream main 领先 2 个未发布 commit
**本轮特殊性**: 第六次同步，**删除量历史首次超过新增量**（净 −13,710）——1.0 前后的"大收缩 + 大统一"：pi-agent-core 断崖瘦身（单笔 −105k）、durable 接盘持久会话、+`mcp`/`codemode` 两新包、−`session-backends`；**1.0.0 无稳定性承诺声明**（release.md 仍写 "No major releases"，已被事实打破）。详细取证见 [`0007-v0.86.1-to-v1.0.0.md`](./0007-v0.86.1-to-v1.0.0.md)。

---

## 一句话

v0.87→v1.0.0 把"极简核"做完了：pi-agent-core 砍到只剩 Agent + loop + proxy stream（持久会话/Harness/存储全部迁往 pi-durable 并 durable 化重写），官方以两个零依赖新包（MCP 客户端、codemode 沙箱）首次采纳外部工具生态，模型面统一（image/classifier 并入 `Model`），TUI 默认形态翻转（fullscreen + system 主题）——0.99.x 三天三发背走全部 API breaking，1.0.0 是里程碑式营销版本且自身仍携带 breaking。

---

## Breaking 清单

### 明示（Breaking Changes 段）

1. **agent 1.0.0**：experimental harness 整体删除（AgentHarness/sessions/pico3/harness tools/compaction/skills/prompt templates/telemetry schemas/search types）；`./node`、`./harness/*`、`./experimental/pico3` subpath exports 删除；仅剩 Agent/loop/proxy/types；指向 pi-durable
2. **server 1.0.0**：`SessionMetadata` 收进 pi-server（仅要求 `id`），`ServerHost<TMetadata>` 改 `resolveSession`/`openSession` 两薄方法——唯一 Breaking 条目与实际改形一致的包
3. **ai 0.99.0**：image models 统一进主 `Provider`/`Models`（`createImagesModels()`/`ImagesProvider` 全删、`ImageModel` 强制 `type:"image"`、schema v6）
4. **tui 0.99.0**：`queryTerminalColorScheme/BackgroundColor/ForegroundColor` → `queryTerminalColors()`（OSC 10/11/4 单往返）；删 `parseOsc11BackgroundColor`
5. **agent/coding-agent 0.87.0**：`shouldStopAfterTurn` 删除改 `finishTurn`；`SessionEntry` 联合新增 `ContextEditEntry`；SessionManager canonical 化；`TurnEndEvent` 必填字段 + `AgentBeforeSettleEvent`；`emit()` 拒收 `turn_end`

### 记了但降级在 Changed/Fixed（默认值翻转，未走 Breaking）

fullscreen 默认化（1.0.0 头条）、system 主题默认、`--no-extensions` 连带禁内置扩展、MCP 工具名 `-`→`_`、codemode `typeof tools.x` 失效、bash 结构化输出 1MiB/空串、`--provider` 无 `--model` 改报错、`builtin:<name>` 命名、MCP OAuth 凭据按 name+URL 存储

### 完全没记（de facto）

`pi-session-backend-sqlite-node` 停止发布（最显著漏记）；experimental mini/micro 删除；durable 0.87.0–0.99.2 的 16 条 Breaking 被 CHANGELOG 重置抹掉（1.0.0 只剩 "Initial release"）；chord replicated state 破坏性改形（`state/publish` → `change/replace` 等 5 项，chord 从未有 CHANGELOG）；ai strict 默认翻转为 non-strict、PiAnthropic 禁用 SDK 凭据链、grammar 重放 id 丢弃收紧等 ai 侧 10 条

---

## 六大主题

### 1. pi-agent-core 大收缩（7fd478a2e，−105,456 行，占全仓删除 75%）

- agent 包 src 只剩 `agent.ts`/`agent-loop.ts`/`proxy.ts`/`stream-fn.ts`/`types.ts`/`index.ts`（5 行）；exports 8 条 → 2 条
- 删除去向：harness/session（28.7k + 测试 24.6k）**搬迁** `packages/durable`；pico3（~8k）与 agent 内部设计文档（~39k）真删除；tools/env/utils 删除（coding-agent core/tools 现役）
- 依赖方 4 包 → 2 包；coding-agent 39 处 import 收敛为核心循环类型

### 2. durable 接盘（13 文件壳 → 60 文件，净 +47.8k）

- Packages 15–23 全落地：task runtime、first chat/tool turn、inbox/usage/view、结构化并发、compaction、**extensions（defineExtension/registry 安装制）+ per-conversation `pi.agent` 文档**、lifecycle conformance、task graph view（`Harness.taskGraph()`/`watchTaskGraph()`）
- SQLite 异步化（PR #10232 线）：`SqliteExecutor` 按 SQL 文本执行 + per-connection statement cache + 串行队列 barrier + close 等待 admitted reads；memory/JSONL/SQLite 三后端进公开 exports
- `docs/pico-v5.md` → `docs/spec.md`（4,601 行）且 npm 不再随包发 docs；CHANGELOG 重置（见 breaking 清单）

### 3. 两个新包：MCP + codemode（8562bcf66，0.99.0 发布）

- `packages/mcp`：零 pi 依赖（仅 cross-spawn）独立 MCP 客户端——传输中立核心 + stdio/Streamable HTTP/in-memory 测试传输 + OAuth（改编自官方 MIT TS SDK v1.29.0，RFC 9207 iss、step-up scope）；CI 跑 pinned 官方 conformance×3 协议版本对照 baseline.json
- `packages/codemode`：QuickJS-WASM 沙箱，worker 线程跑模型写的 JS，`tools.<name>(args)`，嵌套调用不进 LLM 上下文；声明渲染 + Lark 语法
- coding-agent `extensions/mcp|codemode|tool-search` 是消费方；工具 exposure 五档 `direct|model-only|codemode|deferred|hidden`；嵌套调用有界（256 calls/8KiB/32KiB）
- **意义**：pi 首次采纳 MCP 客户端生态（v0.86.1 源码零实现）；ACP 仍缺席；扩展仍是唯一 authoring 面

### 4. 模型面统一 + 认证扩张（ai 62 commits）

- image/classifier 并入 `Model`/`Provider`（ImagesModels 全删、schema v6、三访问器、新 typesafe provider）
- Anthropic workload identity federation（env 驱动、SDK 交换 token、默认零变化）、copy-code 登录、Sign in with ChatGPT、回调服务器合一
- strict 语义收紧（未知 OpenAI 兼容端点默认 non-strict；Anthropic 被拒关键字静默降级）
- 模型上新：Opus 5.5、Sonnet 5.5、GPT-6 Sol/Luna、GPT-6.1 Sol（Codex 默认）、Grok 4.7（xAI 默认）、Jev 分类器×5 渠道；Kimi K2.6→K3

### 5. TUI 默认形态翻转 + 渲染内存

- fullscreen 默认（逃生舱 `tuiMode:"regular"`）；system 主题默认（OSC 取色，OKLab/OKHSL 颜色体系重建，dark/light 配色重写）
- 渲染内存：flattenLines（V8 扁平化）、Markdown token WeakRef、user message 单份渲染——长消息堆 ~1/5
- 滚轮 `fullscreenWheelScrollLines`（默认 auto）、slash 补全去前导空白、quietStartup "header" 档

### 6. v0.87.0 canonical session context + 版本语义

- SessionManager 权威化 + `ContextEditEntry`（append-only 上下文编辑；session format **version 仍 3**）+ actionable `turn_end`/`agent_before_settle`（`emitBoundary`）+ `context_with_system` + per-model image input limits
- **版本跳跃**：0.87.1 → 0.99.0 跳 12 个 minor 零解释；1.0.0 无稳定性承诺（README/docs 零改动，release.md "No major releases" 未更新）；发布管线未变（shrinkwrap 仍发布；kill-shrinkwrap 分支 #5653 已就绪未合并，是下个 1.0.x 方向）
- 构建链：TypeScript 7.0.2 单一（tsgo/tsx 退场，#9965）

---

## 对 _digested 的影响一览

- **整篇重写**：`agent/04-Harness/4.1_AgentHarness.md`、`agent/03-Memory/3.5_Session_v4.md`、`harness/02-Boundaries/2.2_no_interop_protocol.md`、`architecture-next/` 全部 4 篇
- **局部更新**：agent/ 9 篇（工具注册、循环、重试、压缩、skills、system prompt、bash、AI 两篇）、harness/ 评价层 4 篇、integration/ 4 篇、extensions/ 2 篇、composition/8、FAQ 4 篇
- **基线刷新**：`_digested/README.md`（横幅、包表 13 包、harness 叙事）、`_faq_on_digested/README.md`
- 全库 206 处 v0.86.1/旧 hash 版本锚点逐目录复核
