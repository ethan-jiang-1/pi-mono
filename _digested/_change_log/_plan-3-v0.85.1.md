# Plan 3：将 `_digested/` 从 v0.84.4 追到 v0.85.1

**状态**：执行中（2026-09-10）
**当前基线**：`_digested/` 正文描述 v0.84.4（`b79e4cc83`）
**目标基线**：pi-mono `v0.85.1`（`d981de122`）——**已 merge 进本仓库**（merge `e3aa42f46`），锚点自本轮起对应工作树
**依据**：[`0006-v0.84.4-to-v0.85.1.md`](./0006-v0.84.4-to-v0.85.1.md) 的影响评估

## 与前两轮不同的地方

Plan 1 是"gap 太大、先加警示、别逐篇修"；Plan 2 是"首次代码与文档同步、集中修行为性错误"。

本轮的特点是：**三篇文档的中心结论被上游反证了，不只是锚点漂移。** 对读者来说这三篇现在会**主动误导**——比如 `4.1` 告诉人"今天做产品集成不要用 `AgentHarness`"，而它已经能用了；`3.5` 描述的整套存储模型已被删除。

所以本轮的顺序与 Plan 2 相反：**先重写结论失效的三篇（Phase 1），再修集成面（Phase 2），最后才做新增专题（Phase 4）**——因为新增专题（session 新模型、chord/facets）的内容边界依赖 Phase 1 的重写结论。

## 前置：一个环境问题

**本工作树在未重装依赖前既不可测也不可构建。** `pi-agent-core` 现在硬依赖 `@earendil-works/chord`，而 `node_modules/@earendil-works/` 的符号链接建立于 2026-08-17、不含 chord。跑 harness 测试会直接 `Cannot find package '@earendil-works/chord/context'`。

- [ ] 决定是否 `npm install` 刷新工作区（会改变工作树状态）
- 若不做：所有锚点验证走静态读源码（本轮取证已证明够用），并在 summary 里记录"未跑测试"

## Phase 1：P0 结论级失效三篇 —— 重写

### 1.1 `agent/03-Memory/3.5_Session_v4.md`

整篇讲 v0.84 的 lane-based record log 模型，**该模型已不存在**。重写要点（依据 `0006` 主题 2）：

- [ ] Entry 7 种 → **4 种**（`session/types.ts:16`）；三种 change entry 收进 `LaneConfiguration` bound value
- [ ] `LaneRecord` 9 种 → **整体删除**
- [ ] "全局严格连续 seq" 这一核心断言作废（`session/state.ts` 已删，无会话级 seq 校验）；改为"按 write 分配 seq"
- [ ] `Facts` → bound values `pi.session.name` / `pi.entry.label`
- [ ] 三大接口表（`SessionStorage`/`SessionTree`/`SessionRepo`）→ `Storage`/`SessionReader`/`SessionMutation`/`SessionMutator`/`Branch`/`Session`
- [ ] 新增 `SessionMutation` "keyless 独占屏障"并发原语
- [ ] 新增扁平 `OperationState` 13 leaves + `OperationMeta` + `OperationResultRecord`
- [ ] JSONL 行 kind：`entry|record|lane|fact` → `entry|usage|value|list`；`JSONL_FORMAT_VERSION` 仍是 4（原地重写，无内部迁移）
- [ ] Fork 契约改为强制 `scope:"branch"|"tree"` discriminated union
- [ ] 补：新文件 `session/{values,mutation-line,fork,fork-policy,in-memory-storage-state}.ts`、`jsonl/legacy-v3.ts`
- [ ] 修该篇自身第 20 行"AgentHarness 是骨架"的错误引用
- [ ] **待取证**：`seq` 语义的完整替代规范（取证 agent 未定论，`harness.md` Part 1 可能有钱索）

### 1.2 `agent/04-Harness/4.1_AgentHarness.md`

受影响最深的一篇。**不能只改行号，需整篇重写。**

- [ ] 标题与"结论先行"重写：`HarnessNotImplemented` 零命中；`AgentHarness` 已是 `{create}` 工厂对象（`agent-harness.ts:622`）
- [ ] §1 操作面：删 `peekAction`/`executeAction`/`runToCompletion`/`drive:"manual"`/`readonly session`；每个方法加尾参 `context: Context`；增 `accept`/`drive`/`getResult`/`inspectExecution`
- [ ] §2 结果类型：四个 Outcome 族 + 各 Rejected union → `OperationResultRecord`/`DriveOutcome`/`SuspendedRun`
- [ ] §3：`SuspendedOperation`/`ActionInfo` 删除；hook 加 `before_drive`、去 `before_resume`；`HarnessTool` → `AgentHarnessTool`（带 invocation）
- [ ] §4：`create()` 真的 restore，返回 `{harness, open: OpenOperation[]}`；`unavailable()` 不存在
- [ ] §5：`harness/reducer.ts`(667 行 record log 重放) 已删 → 新 `runtime/reducer.ts`(232 行) 是**纯视图 fold**，两者同名不同职能
- [ ] §6：`toolContext` 变 `AgentHarnessToolContextSource<TContext>`
- [ ] 最小例子整段重写（现例子不可编译）
- [ ] 保留并转写：`AgentSession`/SDK 仍是产品路径这一层判断仍然成立，但"agent 包 harness 不能跑"要改成"已能跑，真实 consumer 在 `experimental/session-worker.ts:805`"

### 1.3 `harness/02-Boundaries/2.3_agent_lane_skeleton.md`

整篇就是一条边界论断，现在两半都塌了。

- [ ] 核心判断改写：「library-first 是方向 + 契约，不是现状」→「**契约优先策略已经兑现**」
- [ ] `UnavailableRegistry`/`HarnessNotImplemented` 零命中 → `hooks.ts:15` 的 `HookRegistry`，已接入 5 个 hook
- [ ] "唯一 consumer 是 `coding-agent/src/server/create-harness.ts` 的 stub" → **`coding-agent/src/server/` 目录整个不存在**；真实 consumer 是 `experimental/session-worker.ts:805`（`AgentHarness.create()` 在 `:834`）、`mini/worker/run.ts:66`、测试 fixture
- [ ] 例证 1/3 重写（都建立在已删除的符号计数上）
- [ ] 同步改：`02-Boundaries/README.md:17` 的一句话结论、`figures/agent_lane_half_adapter.svg` 图内文字
- [ ] 保留诚实结论的**新版本**：唯一未实现方法是 `watchSession`（`runtime/harness.ts:305-307`）

**验收**：三篇的每一处断言都能在新源码里找到对应符号；不再出现 `HarnessNotImplemented`/`ActionInfo`/`LaneRecord` 等已删除符号作为"当前行为"。

---

## Phase 2：integration/ —— 集成面

### 2.1 `06-coverage-and-parity.md`（🔴 一节重写）

- [ ] 第 68-76 行"第三条集成路径"整节重写：`PiClient`→`Client`、`PiServerService`→`ServerHost`、**协议版本 1→8**、`session.subscribe(snapshot)` 已删除、寻址模型 session→service
- [ ] 明确标注三包**已是 dev-only / source-only**（依据 `coding-agent-consumer.mjs:11,73` 的断言 + `files` 排除 + CHANGELOG #9132）
- [ ] 新增条目：`experimental remote runtime`（chord facets/services，worker 持 durable agent，presentation 远程 attach）
- [ ] 新增条目：`mini`（独立 JSON RPC 探针，3 进程，**研究性质**，自带 `defineService` 与 chord 是两套）
- [ ] TUI parity 表：新增 `TuiAltScreen.scrollToEndIndicator` 行、`MouseRegion` 可选行
- [ ] 保留正确部分：128 行 "pi-server 是 Unix socket 不是 HTTP" 仍对；framing（4 字节大端长度前缀 + CBOR）仍对

### 2.2 `03-runtime-api.md`（🟡 两处语义 + 18 处重锚）

- [ ] **补 abort 语义变化**：RPC `abort` 现在阻塞到 session idle 才回响应，且取消进行中的 manual compaction 与 branch summary（依据 `docs/rpc.md` 唯一那行改动 + CHANGELOG #8920）——**这是唯一"不补就会让读者误判 abort 时序"的一处**
- [ ] 补 `isIdle` 含 `!isCompacting`、`waitForIdle()` 会等 compaction/branch summary
- [ ] **18 处锚点重锚**，位移表（5 个符号验证 5/5 命中）：

```
≤185       不变                             例：141/142/144
186–1619   −1                              例：826→825, 998→997, 1160→1159, 1588→1587
1620–1922  +1                              例：1679→1680
1923–2420  +6                              例：abortBranchSummary 2101→2107, 2124→2130
2421–3292  +7                              例：3106→3113
≥3293      +8                              例：getUserMessagesForForking 3301→3309, getSessionStats 3323→3331
```

### 2.3 `02-advanced.md`

- [ ] 第 143-155 行"远程/server 形态"整节按上改正 + 补 experimental/chord 事实
- [ ] 第 11 行包清单：10 → 11 包（含 chord）
- [ ] 第 79 行 abort 行补语义
- [ ] 1 处锚点重锚

### 2.4 `04-event-model.md`

- [ ] 第 170 行跟踪方向句：`SessionSnapshot` 快照模型 → service 寻址 + `LaneSnapshot`/`reduceLaneSnapshot`，并加 dev-only 限定
- [ ] 5 处锚点重锚
- [ ] **正文事件表主体不变**（本轮事件模型无变化，`json-event.ts` 逐字节未变）

### 2.5 `05-recipes.md`

- [ ] 第 315 行"其他路径"加限定：三包是 devDependencies、source-only、不在 npm 包/二进制里；`PiClient`→`Client`
- [ ] 第 61-62 行 `await session.abort()` recipe 本身不用改

### 2.6 `01-start-here.md` / `integration/README.md`

- [ ] 01：**不用动**（无行号锚点、wire 未变）；可选补一句 abort 会阻塞到 idle
- [ ] README：复核是否也列了三件套，若列则同改

**验收**：integration/ 里每一个 API 名、方法签名、事件类型都在 v0.85.1 源码里存在且行为描述正确；34 个 RPC 命令清单与 `rpc-types.ts` 逐字符一致。

---

## Phase 3：harness/ 旧结论反转 + 连带篇目

### 3.1 反转 0003 的旧结论（必须显式推翻，否则读者继续按旧判断理解）

- [ ] 在 `harness/` 相关篇目与 `harness/README.md` 里显式写明：旧结论"harness.md 描述 registers/SQLite 目标模型、与代码不是一套 API"**已失效**
- [ ] 给出现状：22 条核心概念 15 已实现（68%）/ 1 部分 / 6 仅 spec；spec 自带 §0.9 implementation-status 清单；spec 与代码同批 commit 一起改
- [ ] 说明收敛的转折点：`d09576def`（同一 commit 改 `harness.md` + `runtime/lane.ts`）

### 3.2 harness/ 其余篇目

- [ ] `02-Boundaries/2.1_no_sandbox.md:35` 加 scope 限定（对 `core/extensions` 仍成立；facet 投递路径已选 isolated-vm + 字符串膜，是 PoC 不是产品）
- [ ] `02-Boundaries/2.4_no_version_contract.md` 换更新的例子（v0.85.1 这次 breaking 更近更强）+ 改 `figures/no_version_contract.svg`
- [ ] `01-Architecture/1.1_three_tier_seams.md` 补 `renderers/` 分层 + 重锚（`read.ts:209`→`:65`、`bash.ts:71`→`:59`）
- [ ] `01-Architecture/1.2/1.3/1.4` 轻量行号复核（**结论均成立**，grep 确认零提及 AgentLane/AgentHarness）
- [ ] `03-Discipline/*`：3.1 补"入口即成本契约"物证（`check-entry-graphs.mjs`）；3.4 把 `npm run check` 从 6 项更新到 8 项
- [ ] `harness/README.md`：基线 → v0.85.1；表格里 2.3 的一句话结论；变更注记加 v0.85.1 段

---

## Phase 4：新增专题（P0）

### 4.1 session durable 新模型（替代已失效的 3.5）

- [ ] 新篇建议放 `agent/03-Memory/`，与 3.5 的关系需明确（3.5 是重写还是新建 3.6、3.5 是否降级为历史？）
- [ ] 覆盖：bound values/lists 地址模型、13-leaf OperationState、keyless mutation barrier、fork 的 scope 化、JSONL v4 原地重写与 v3 只读升级
- [ ] 依赖 Phase 1.1 的重写结论

### 4.2 chord / facets / services

- [ ] `_digested/` 全树零覆盖，而它**已进非实验源码**（`agent/src/harness/context.ts:1-11` re-export chord 的 Context）
- [ ] 覆盖：facet/service/replicated-state/remote boundary 四个抽象、`boundary.test.ts` 的零 Pi 依赖守边界、禁用词汇表
- [ ] **必须写清与 `core/extensions` 的关系是并存不是替代**，以及 "extension" 一词的三重义项碰撞
- [ ] **必须标注**：引用 `facets.md` 时它是**规格不是现状**（静态 manifest / peer mode / `definePeerService` 在 chord 里全部未实现）；`mobile-handoff/README.md:22` 的 "Three units ship working code. Four are specifications."
- [ ] 落点待定：`integration/`（集成路径视角）还是新建维度（组装视角）？倾向 `integration/` + `extensions/` 加节

---

## Phase 5：其余修正

- [ ] `agent/02-Runtime/2.6_Queue_Modes.md`：**:127/:162 是现成事实错误**（idle 判定漏 `!isCompacting`）+ 锚点 921-928→920-927
- [ ] `agent/02-Runtime/2.5_Session_Service.md`：换警示块（`buildSessionContext` **又存在了**，`session/context.ts:47`）+ 改路径指引
- [ ] `agent/02-Runtime/2.1_The_Loop.md`：仅行号复核（结论不受影响）
- [ ] `agent/01-Anatomy/1.3`/`1.4`：按 `AgentHarnessTool.execute()` 签名 + `ShellOutput*` 复核
- [ ] `agent/03-Memory/3.1`：签名/行号更新（**算法未变**）；`3.2` 复核
- [ ] `agent/05-Infra/5.1`：改 `cloudflare-ai-binding.ts` + 行为反转 + 补 `./utils/*`
- [ ] `agent/05-Infra/5.2`：末段 exports 列举补 `./utils/*`
- [ ] `agent/README.md:3`：改"AgentHarness 重设计为 AgentLane 骨架（多数操作 HarnessNotImplemented）"
- [ ] `extensions/03-Patterns/3.1`：绝对化断言加限定"凡走 `core/extensions` 的"；加一节"第二条扩展轴：facet 插件"
- [ ] `composition/10_extension_axes`：加第八根轴（进程/环境轴）；`10h` 组合数学重算；`12_security_boundaries` 加 scope
- [ ] `composition/README.md`、`extensions/README.md`：基线声明同步

---

## Phase 6：收尾

- [ ] `_digested/README.md`：基线 → v0.85.1；**包清单 10 → 11（含 chord）**；修前次发现的三处不一致（`on()` 33 vs 36、基线括注 v0.84.2、缺 `composition`/`harness` 导航）
- [ ] `_faq_on_digested/README.md` 基线声明
- [ ] `_faq_on_digested/` 受影响篇目修正（专项取证已完成，**无一篇核心结论被推翻**）：

  | 篇目 | 判断 | 要点 |
  |---|---|---|
  | `01_model_switching` | 🟡 | 漏 `app.thinking.save`(ctrl+s) + Claude 逐轮 effort 持久化（`supportsMidConvoEffort`）；行号漂 4190/4993/4849/1680/1850 |
  | `02_tui_keybindings` | 🟡 | 键位表**全对**（`keybindings.ts` 本轮仅 +5 行）；漏 `app.thinking.save` 与 `tui.*` 命名空间（含新 `tui.altScreen.bottom`）；`--mode interactive` 不存在（**pre-existing**）。**TUI breaking 本篇未引用 → 无过时** |
  | `03_third_party_provider_baseurl` | 🟡 | 身份/upsert/魔法探测/全限定/歧义报错逐字成立；`supportsReasoningEffort` 行与源码不符（**pre-existing**）、`scripts/providers/deepseek.models.ts` 路径不存在（**pre-existing**）；行号 +9 |
  | `04_root_entry_doc_design` | 🟡 | All Packages 5→**6**（新增 chord）；`scripts/` 清单遗漏两个新守卫（`check` 链 6→8）——但"地图漂移不会被 CI 发现"的结论**仍成立**（新守卫不是文档门禁） |
  | `05_root_entry_doc_navigation` | 🟡 | **真语义过时**：skills 闸门 `read` → `read\|bash`（`system-prompt.ts:45-46,161-162`、`skills.ts:355`）；全部行号 −1 |
  | `06_pi_vs_dsh` | 🟢/⚪ | pi 侧 8 工具/4 默认工具/无 ACP/tui 依赖全成立；`src/core/models/` 不存在（**pre-existing**）；其余是 DSH 侧基线 |
  | `07_pi_usage_scenarios` | 🟡（仅 08） | **`08_pi_config_explained`：本地 `.pi/prompts/` 5→6**（新增 `deslop.md`，`5009d0608`）；01 的 `on()` 36 实测为 33（**pre-existing**）；02/03/04-07/09/10 🟢/⚪ |

  注：多处标 **pre-existing** 的错误（`--mode interactive`、`supportsReasoningEffort`、`scripts/providers/` 路径、`src/core/models/`、`on()` 计数）**不是本轮引入**，可顺手修但要在 commit message 里注明
- [ ] 新写 `3.x`/chord 篇目的交叉引用检查（agent/ ↔ harness/ ↔ integration/ ↔ composition/）
- [ ] 写 `_summary-v0.85.1.md`
- [ ] 本 plan 进度日志收尾

---

## 执行顺序总览

```
Phase 1: P0 结论级失效三篇重写（3.5 / 4.1 / 2.3）
Phase 2: integration/ 集成面（06 整节 / 03 abort+18锚点 / 02 / 04 / 05）
Phase 3: harness/ 旧结论反转 + 连带篇目
Phase 4: 新增专题（session 新模型、chord/facets）—— 依赖 Phase 1
Phase 5: 其余修正（2.6 事实错误、5.1/5.2、extensions/、composition/）
Phase 6: 收尾（README、summary、交叉引用）
```

每个 Phase 完成后 commit 一次。

**已知约束**：本轮不追 upstream main 上 v0.85.1 之后的 46 个未发布 commit（含 `system-prompt-refactor`/`system-role`/`system-tool-deltas` 三个同族分支）——那批会直接冲击 `agent/04-Harness/4.3_System_Prompt`，留待 v0.86.x 一起追。

---

## 进度日志

### 2026-09-10 — Round 开始

- fetch upstream：发现 v0.85.0 / v0.85.1 两个新 tag（本地 remote ref 上次未 fetch）
- merge `v0.85.1` 进 ethan：`e3aa42f46`，零冲突（upstream 不碰 `_digested/`/`_faq_on_digested/`）
- 6 个并行取证 subagent（harness runtime 重写 / harness.md spec 收敛复核 / chord-facets / coding-agent experimental+接口面 / 其余包 / FAQ），外加主线元数据收集
- 写 `0006-v0.84.4-to-v0.85.1.md`（commit `3ef134264`）

### 2026-09-10 — Phase 1–6 完成

- **Phase 1**：三篇结论级失效整体重写（`3.5_Session_v4` 81→544 行、`4.1_AgentHarness` 143→320 行、`2.3` 改名 `2.3_agent_lane_contract_first` + SVG 重绘）；连带修两个 README 的警示块与那张**画错的架构图**（原画成堆叠，实为并列实现）→ `41896eac7`
- **Phase 2**：`integration/06` 第三条路径整节重写 + 新增 experimental remote runtime / mini 两节；`03` 补 abort 语义 + 18 处重锚；`02/04/05` 同步 → `31f78a2cd`
- **Phase 3**：显式反转 0003 旧结论；`2.1` 加 facet 沙箱 scope；`2.4` 换 v0.85.1 例子；`01-Architecture` 四篇补 `renderers/` 与重锚；`03-Discipline` 补 entry-graph 预算物证（check 7→9）→ `b5caf4d39`
- **Phase 4**：新增 `integration/07-chord-and-facets.md`（302 行）→ `dd546cee9`
- **Phase 5**：`agent/` 各篇事实错误与锚点（含 `2.6` 的 `isIdle` 漏 `!isCompacting`、`2.5` 的 `buildSessionContext` 误判）；`extensions/` 加 `2.5_second_axis_facets.md`；`composition/` 加 `10i_process_axis.md` 与 `12` 的 scope 块 → `75b5eceff`
- **Phase 6**：顶层 README 基线 + 包清单 10→11 + harness 四义项/extension 三义项声明 + 修 `on()` 33/36 自相矛盾 → `3a89a69d2`；FAQ 6 篇补丁 + 基线统一 → `2c4861403`；`_summary-v0.85.1.md` → `43f7555ef`
- **交叉引用检查**：相对链接全部有效；清掉 4 处残留旧结论（`2.7_Cancellation` ×2、`4.2_Skills`、`4.5_Tool_Bash`、`3.1_Compaction`、`3.5` 的"全仓零命中"口径）→ `efdf69e41`

### 2026-09-10 — 事故记录（必须留档）

本轮的并行 agent 执行方式出过一次事故：**一个后台 agent 在共享工作区上执行了 git 历史操作**（`commit --amend` → `reset` → `rebase`），把当时未提交的工作区改动（Phase 3 / Phase 5 / FAQ 补丁，共 ~30 个文件）全部丢弃。已提交的部分（Phase 1/2/4）未受影响。

- **恢复**：打了 5 个 `wip-v0851-*` 标签保护候选状态；`git checkout HEAD -- _digested/` 救回被暂存删除的 chord 篇；三个 agent 从原上下文唤醒、重放编辑（研究结论本来就在 `0006` 里）
- **根因**：给多个 agent 共享工作区的 Bash 权限，却**只在 brief 里划了"不要改哪些目录"，没有禁止 git 写操作**
- **教训**：并行 agent 改文档时，① brief 必须明令禁止一切 git 命令（只允许读写文件，提交由主线统一做）；② 每个 agent 一完成就立刻提交，不积压未提交改动。本条对后续所有轮次有效

### 遗留（未做，留待下轮）

- `agent/` 各篇行号逐篇复核（沿用五轮）
- `2.5_Session_Service` 的锚点表未动，而 `session-manager.ts` 本轮 +45/−15，19 行锚点很可能已漂移
- `3.1`/`3.2` 的最小例子仍是 v0.84.x 形状（只加了"哪几处失效"的提示块，未重写）
- `agent/src/search/`（S3）、telemetry 词表、`ai/src/compat/`
- **未跑测试**（工作树缺 `@earendil-works/chord`，且 gitignored 的 `packages/ai/src/providers/data/` 是 2026-09-02 hydrate 产物、不含 `gpt-6-astra`，`tsgo --noEmit` 必挂）
- 未追 main 上 v0.85.1 之后的 46 个未发布 commit（含 `system-prompt-refactor` / `system-role` / `system-tool-deltas` 三同族分支）
