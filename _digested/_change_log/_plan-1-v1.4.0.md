# 执行计划 1：v1.4.0 语料同步

**目标**：把 `_digested/`、`_faq_on_digested/`、`_pi_extension_agent_ready_development/` 从 Pi `v1.2.0` 同步到 `v1.4.0`（`4a080252f`），覆盖 v1.2.0..v1.4.0 的 144 个 commit。
**Discovery**：[0010-v1.2.0-to-v1.4.0.md](0010-v1.2.0-to-v1.4.0.md)；摘要 [_summary-v1.4.0.md](_summary-v1.4.0.md)。

**状态**：A–G 全部执行完毕；验证结果见 0010 的“Execution 状态”节。

## 前置状态

- `ethan` 已 merge `v1.4.0`（`1bb504b0d`，零冲突）；`npm install --ignore-scripts` 完成（需 `--cache`，系统 `~/.npm` 不可写）。
- extension corpus 的外链 tag 与 `verify.mjs` 的 `BASELINE_TAG` 已机械改为 `v1.4.0`（369 条，全部在界内）。
- `_digested`/`_faq` 的相对链接、`#L` 行界、fragment 已清零（修 20 条）。

## 工作项

### A. `_digested/` —— 基线与索引（先做）

- [x] `README.md`：基线横幅 → `v1.4.0` / `4a080252f`，把 v1.2.0 那段降为历史；包表更新（chord 依赖 telemetry、durable sleeping/schema v2、telemetry 升横切层）；`v1.2.0 删除` 块保留。
- [x] `architecture-next/README.md`、`agent/README.md`、`orchestration/README.md`、`test-strategy/README.md`、`harness/README.md`：基线句与索引（新增 5.3 telemetry）。

### B. `_digested/` —— chord（重写，第一优先）

- [x] `architecture-next/chord.md`：整页改为 v1.4.0 现状（object/reference、lifetime、placement、typed principal、async get、协议 4 与拒绝旧 peer、流控、packed frames、output、sqlite、telemetry、reload/retire）。
- [x] `integration/07-chord-and-facets.md`：补 v1.4.0 横幅；§2/§3/§8/§9 重写；删 `:326`"无 CHANGELOG/无 PROTOCOL_VERSION"；保留 v0.85.1 取证存档并标注。
- [x] `extensions/02-Expansion/2.5_second_axis_facets.md`：确认 chord2 作废横幅是否需升级到"v1.3.0 再改"。

### C. `_digested/` —— durable（重写 SQLite 与状态机）

- [x] `architecture-next/durable-and-storage.md`：§sqlite 全部改指 `chord/src/sqlite/*`；§运行时面重写（sleeping、restartLimit、sleepUntil/setTimer/now、afterFailedRun、wake、IndexedDB、四后端）；行数重锚。
- [x] `orchestration/07-durable-tasks.md`：状态机 + `sleeping`；timer 移到 `src/timers.ts`；补 sleep/wake 与 crash-loop 两节。
- [x] `agent/04-Harness/4.1_AgentHarness.md`：状态集、文件数、`Harness.open` 行号、后端 4。
- [x] `agent/03-Memory/3.5_Session_v4.md`：后端三→四、错误类型、`checkpointWhen` 必填。
- [x] `test-strategy/05-durable-state-and-recovery.md`：删除 `harness.recover()` 叙述，恢复模型改为 open+resume；补 sleep/blocked/telemetry/indexeddb 测试面。

### D. `_digested/` —— ai / telemetry

- [x] 新建 `agent/05-Infra/5.3_Telemetry_Layer.md`（契约、propagation、links、metrics、Stored/render、三包集成、反模式）。
- [x] `agent/05-Infra/5.1_AI_API_Layer.md`：补 identity、telemetry 选项、模型目录投递链；修 13 处行号；链 5.3。
- [x] `agent/02-Runtime/2.3_LLM_Bridge.md`：`MODELS` 不再是单文件常量；`telemetry` 选项改名；行号漂移。
- [x] `agent/05-Infra/5.2_AI_Auth_Subsystem.md`：只补导出清单小过期。

### E. `_digested/` —— codemode / 配置 / 其余

- [x] `orchestration/04-codemode.md`：worker 生命周期 Breaking；`host.ts` 行数；"上限 2 只在 coding-agent"。
- [x] `composition/8_settings_json.md`：`sessionShareDestination`。
- [x] 其余按 0010 的"需局部更新"逐条。

### F. `_faq_on_digested/`

- [x] `README.md` 基线 + 债务表述。
- [x] 01/02/03/06/07/12 按受影响面追加 sync-0010 增量（不重写全篇）。

### G. `_pi_extension_agent_ready_development/`

- [x] prose 基线统一：根 `README.md`、`repo-harness/README.md`、`_coverage/00-corpus-maintenance.md`。
- [x] 契约性改写：pinned-deps 内部包、skills 3→4、chord 依赖 telemetry、entry-graphs 预算与 `allow`、release catalog 闸门。
- [x] 锚点重核：`sdlc-reference/03/04/07`、`repo-harness/06`（release.mjs 12 + nix.yml 6 + publish-model-catalog 3 + nix.yml 5 + pinned-deps 2 + entry-graphs 2 + 1）。
- [x] 旧错顺手修：`repo-harness/00:23`、`sdlc-reference/03:7`、`repo-harness/06:29`。
- [x] `_coverage/00` 补 0015 轮记录。

## 已知陷阱（执行时勿踩）

1. **不要把 chord 的协议变更都算到 v1.4.0**：2→3→4 全在 v1.3.0 之前，`wire.ts` 在 1.3.0..1.4.0 零改动。
2. **不要把 `models.generated.ts` 的拆分写成 v1.4.0 的新变化**：v1.2.0 已是汇编器 + gitignored data + R2 catalog。本轮真增量是"对已发布客户端的兼容门禁"。
3. **`TaskRuntime.now()` 不是新增**，只有 `ToolExecutionApi.now()` 是。
4. **`harness.recover()` 不存在**，不要在任何新文字里沿用。
5. **sqlite 驱动不在 durable**：写"`SerialOperationQueue` 在 `durable/src/storage/sqlite/node.ts`"会直接指错文件。
6. **extension corpus 的 369 条链接已换 tag、prose 未换**：不要按旧前提再搜 `v1.2.0` 链接。
7. **`verify.mjs` 不核对远端内容**：行号与引文必须人工对 tag 复核。

## 完成判据

- `_digested` 与 `_faq` 的相对链接 / `#L` 行界 / fragment 全绿（脚本复跑）。
- `_pi_extension_agent_ready_development`：`node verify.mjs` 与 `node --test verify.test.mjs` 通过；prose 无"v1.2.0 基线"残留（历史断面除外）。
- 0010 的"已证伪断言"表逐条落地；新增 telemetry 页被 at least 2 处引用。
- 三个目录的基线声明一致：`v1.4.0` / `4a080252f`。
- 不引入未经 v1.4.0 工作树核实的断言；未核实项显式标注。
