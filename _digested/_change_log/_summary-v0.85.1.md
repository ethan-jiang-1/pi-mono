# v0.84.4 → v0.85.1 变更总结

**日期**: 2026-09-10
**范围**: `b79e4cc83`(v0.84.4) → `d981de122`(v0.85.1)（460 commits / 428 非 merge，708 文件 +96348/−25254，~8 天）
**标签**: v0.85.0（2026-09-04）、v0.85.1（2026-09-05）；main 在 v0.85.1 后另有 46 个未发布 commit
**本轮特殊性**：第五次 catch-up，**第二次架构换代**。与 v0.84 那次不同的是，这轮**三篇文档的中心结论被上游反证**（不只是锚点漂移），而且**两层地基同时被换掉**——harness 从骨架变成真实现，session 的 durable 表示法整体换模型。

---

## 一句话

v0.85.1 把 v0.84 那副"契约已画好、实现是空壳"的 harness 骨架填成了真东西——`Drive` + effect gate + 13 个扁平 durable `OperationState`，`HarnessNotImplemented` 在源码里零命中——同时把 session 的 durable 表示法从 `Entry 7 种 / LaneRecord 9 种 / Facts / 全局连续 seq` 整体换成 `Entry 4 种 / 扁平 OperationState / bound values+lists / keyless 独占 mutation 屏障`；代价是诞生了第 11 个包 `packages/chord`，并把实验性的 protocol/client/server 拆掉重建为它的薄适配层（协议版本 1 → **8**，且三包降级为 dev-only）。

---

## 六大主题

### 1. harness 骨架 → 真实现（`packages/agent`）

- `AgentHarness` 从 `class ... implements AgentLane`（508 行，`create()` 遇已有 record 即抛 `HarnessNotImplemented`）变成 **`{create}` 工厂对象**（`agent-harness.ts:622`）；真实现是 `runtime/harness.ts:29` 的 `class Harness<TContext>`，**不从 `index.ts` 导出**
- **22 个公开方法，21 个已实现，唯一剩下的 stub 是 `watchSession`**（`runtime/harness.ts:305-307`）
- hooks 从抛错的 `UnavailableRegistry` 换成 `hooks.ts:15` 的 `HookRegistry`，**`HookMap` 的 11 个 hook 全部有真实调用点**
- `runtime/drive.ts:48-105` 是 total 的执行图（13 个 case 全有实现，含"无进展即抛 `SessionInvariantError`"兜底）
- **`HarnessNotImplemented` 在源码里零命中**（历史 CHANGELOG 里还有 2 处旧文字，grep 时注意区分）
- 公开面只动 `+14/−7`，因为内部整体换了两轮 runtime 而 `agent-harness.ts` 被 `export *` 转发——这是"契约公开、实现私有"的直接回报

### 2. session durable 表示法换模型（不是重构）

- `Entry` **7 → 4 种**；`LaneRecord` **9 种整体删除**；三种 change entry 收进 `LaneConfiguration` bound value；`Facts` → bound values `pi.session.name` / `pi.entry.label`
- **全局严格连续 seq 校验随 `session/state.ts` 一并删除**——这是旧文档最核心的机制断言，现在作废。新规范是"strictly increasing、gaps legal、session-wide monotonic"（`harness.md:297` §1.4 规则 2）
- 新并发原语 `SessionMutation` 是 **"keyless 独占屏障"**（doc comment："Exactly zero or one commit attempt. A second attempt rejects."）
- `JSONL_FORMAT_VERSION` 仍是 **4**——upstream 认定 v4 仍在 WIP，**原地重写不做迁移**（`docs/runtime-simplification.md:7`）；新增 `jsonl/legacy-v3.ts` 只读升级 v3
- compaction **算法未动**（cut point / 阈值 / split-turn / retainedTail 全无变化），只换了接口

### 3. 新包 `packages/chord`（第 11 个包）

- 零 Pi 依赖的"应用组合运行时"，**用测试守边界**（`test/boundary.test.ts:11-33` 断言无任何 `@earendil-works/pi-*` import）；`PLANNING.md:37` 还有一份禁用词汇表
- 四个抽象：facet（可拆到不同进程/环境的插件单元）、service（singleton / keyed）、replicated state、远程服务边界
- **但它已进非实验源码**：`agent/src/harness/context.ts:1-11` 整段 re-export chord 的 `Context`/`ContextKey`，`session/types.ts` 取它的 `JsonValue`/`JsonRepresentation`；五个包声明它为运行时依赖
- **与 `core/extensions` 并存，不是替代**——facet 是平行的第二套组合机制

### 4. protocol / client / server 换地基

- `PROTOCOL_VERSION` **1 → 8**（一个 release 内 7 次破坏性修订）；`PiClient`→`Client`、`PiServerService`→`ServerHost`
- 快照权威模型 → **service 寻址 + attachment**（`RpcTarget` 要带完整三元组）；`session.subscribe(snapshot)` **已删除**
- **三包降级为 dev-only**：`dependencies` → `devDependencies`、`files` 排除、`./client` 子路径 source-only，且 `scripts/coding-agent-consumer.mjs:11,73` 有硬编码断言"不得出现在消费者安装闭包里"
- 起因是 0.85.0 的发布事故（experimental 栈误发到 npm 导致 SDK import 失败，#9132）
- **无兼容窗口**：`isSupportedProtocolVersion` 只接受精确相等

### 5. `harness.md` spec 与代码**已收敛**——0003 的旧结论失效

- 旧结论"harness.md 描述更超前的 registers/SQLite 目标模型、与已发布代码不是一套 API"**三个分句全部失效**
- `harness.md` 2941 → **1468 行**，`register` 出现 **176 → 3**（全是英文动词）；`session/state.ts` 的 record-log 模型已删
- 22 条核心概念：**15 已实现 / 1 部分 / 6 仅 spec**，6 条没有一条在核心对话主路径上
- **收敛的机制证据**：`d09576def` 在同一个 commit 里改了 `harness.md`（−1352 行）、`runtime/lane.ts`、`events.ts`、`values.md`
- 现在的 harness.md **自带 §0.9 implementation-status 清单**，逐项点名未实现项

### 6. coding-agent 的 experimental 线（0 → 47 文件）

- `src/experimental/` 在 v0.84.4 **文件数为 0**，v0.85.1 = **47**。它是 chord 的 facet/service 概念在 Pi 侧的落地（`pi.agent-controller` / `pi.models` / `pi.transcript` / `pi.session-*`，两个 `{local:true}` 的 presentation 服务）
- `mini/` 是**独立的探针**，自带 JSON transport 与自己的 `defineService`（与 chord 是两套），不是同一条路径
- 唯一入口是 checkout 里的 `PI_EXPERIMENTAL=1 ./pi-test.sh server|client`

### 7. 其余

- **`packages/ai`**：`src/auth/` 净 diff **为空**；`src/api/` 三层 + lazy 机制**零结构改动**。唯一 breaking 是 `createGatewayBindingFetch()` → `createAiBindingFetch()`（语义从"翻译"反转为"原样透传"）
- **`packages/tui`**：真 breaking，方向是**去耦合**——不再读 coding-agent 的环境变量；`PI_DEBUG_REDRAW` → `PI_TUI_DEBUG_REDRAW`
- **`packages/session-backends`**：conformance 套件落地，**契约定义在 agent 包**（`harness/session/testing/conformance/`），sqlite 只是执行器
- **`scripts/`**：新增 `check-entry-graphs.mjs`（把 exports map 当**成本契约**：一个 `export *` 可能让窄入口拖入 37 MB 模块图）与 `check-runtime-deps.mjs`，两个都进了 `npm run check`（**7 → 9 步**）。**但 `AGENTS.md` 两版之间零改动**——规则脚本化了却没进文档

---

## 本轮对 `_digested/` 的更新（2026-09-10）

- **merge**：`v0.85.1` 进 ethan（`e3aa42f46`，零冲突）
- **Phase 1 三篇结论级失效整体重写**（这轮唯一"读者照旧文档做事会直接错"的类别）：
  - `agent/03-Memory/3.5_Session_v4.md`（81 行 → 544 行；补齐了 seq 替代规范）
  - `agent/04-Harness/4.1_AgentHarness.md`（143 → 320 行）
  - `harness/02-Boundaries/2.3_agent_lane_skeleton.md` → 改名 `2.3_agent_lane_contract_first.md`，SVG 一并重绘
  - 连带修 `agent/README.md`、`agent/04-Harness/README.md`（警示块 + 那个**画错的架构图**——原文画成堆叠关系，实为并列实现）
- **Phase 2 integration/**：06 的"第三条集成路径"整节重写 + 新增 experimental remote runtime / mini 两节（均标 dev-only）；03 补 abort 语义变化 + 18 处重锚；02/04/05 同步
- **Phase 3 harness/**：显式反转 0003 旧结论；2.1 加 facet 沙箱 scope 限定；2.4 换 v0.85.1 例子；01-Architecture 四篇补 `renderers/` 分层与重锚；03-Discipline 补 entry-graph 预算物证（check 7→9）
- **Phase 4 新增**：`integration/07-chord-and-facets.md`（302 行）
- **Phase 5**：`agent/` 各篇事实错误与锚点（含 `2.6_Queue_Modes.md` 的 `isIdle` 漏 `!isCompacting`）；`extensions/` 加第二条扩展轴；`composition/` 加第八根轴（进程/环境轴）
- **Phase 6 收尾**：顶层 README 基线 → v0.85.1、包清单 10 → 11、显式声明 harness 四义项与 extension 三义项、修 `on()` 33/36 自相矛盾；`_faq_on_digested/` 6 篇补丁 + 基线统一
- **新建**：`_faq_on_digested/08_extension_vs_package/`（Extension vs Package：运行时单位 vs 分发单位）

### 本轮的两条方法论教训（已写进文档）

1. **计数口径极易出错**：RPC 命令数出现过 33/34/36 三个值（只有 33 对）、`on()` 重载出现过 33/36（只有 36 对，33 是单行 grep 假象）、`npm run check` 出现过 6/7/8/9（只有 7→9 对）。**"逐字节比对"比任何计数都可靠**——`rpc-types.ts`/`json-event.ts`/`sdk.ts` 逐字节未变这一条，比计数器强得多。已在 `0006` 记入「口径提醒」。
2. **`mobile-handoff/README.md:22` 那句话要每次都看**："Three units ship working code. Four are specifications. Do not assume a doc describes something that exists." 该目录里 `facets.md` 自称 supersede 了 `plugins.md`，但它的核心改动（静态 manifest、peer mode、`definePeerService`）在 chord 里**全部未实现**。

### 遗留缺口

- **`agent/` 各篇行号逐篇复核**（沿用四轮未清）
- `agent/src/search/`（S3，仅 spec）、telemetry 词表（仅 1 个 span 落地）、`ai/src/compat/`
- **未跑任何测试**：工作树缺 `@earendil-works/chord` 符号链接，且 `packages/ai/src/providers/data/`（gitignored）是 2026-09-02 的 hydrate 产物、不含 `gpt-6-astra`，导致 `tsgo --noEmit` 必挂。**所有结论均来自静态读源码取证。**
- **未追**：main 上 v0.85.1 之后的 46 个未发布 commit，含 `system-prompt-refactor` / `system-role` / `system-tool-deltas` 三个同族分支——那批会直接冲击 `agent/04-Harness/4.3_System_Prompt`，留待 v0.86.x

---

## 相关文件

- Sync record：[`0006-v0.84.4-to-v0.85.1.md`](./0006-v0.84.4-to-v0.85.1.md)
- 执行计划：[`_plan-3-v0.85.1.md`](./_plan-3-v0.85.1.md)
