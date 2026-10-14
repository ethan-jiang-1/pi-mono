# 执行计划 1：v1.2.0 语料同步

**目标**: 把 `_digested/`、`_faq_on_digested/`、`_pi_extension_agent_ready_development/` 三份语料对齐到 release tag `v1.2.0`（`06a466935`）。
**Discovery 记录**: [0009-v1.0.3-to-v1.2.0.md](0009-v1.0.3-to-v1.2.0.md)｜**摘要**: [_summary-v1.2.0.md](_summary-v1.2.0.md)

## 前置状态

- [x] 升级：merge tag `v1.2.0` → `7757c6707`，零冲突
- [x] 验证：`npm install --ignore-scripts` + `npm run check` exit 0
- [x] 取证：3 路并行 subagent，逐条对 v1.2.0 工作树核验
- [x] Discovery 记录 0009 按 v1.2.0 口径改写（post-tag 22 commit 隔离）
- [x] 扩展语料 re-pin 勘察

## 工作项

### A. `_digested/` —— 包删除注销（第一优先）

实际命中 12 个正文文件（已 grep 确认，非预估）：

- [x] `_digested/README.md:40-42` —— 包表删 3 行 + 基线横幅改 v1.2.0
- [x] `_digested/agent/README.md:97` —— 包表删 1 行
- [x] `_digested/architecture-next/server-and-experimental-services.md` —— **整篇以 `packages/server` 为主题**，注销或转折为历史篇
- [x] `_digested/architecture-next/README.md:19,21`
- [x] `_digested/architecture-next/durable-and-storage.md:89,110`
- [x] `_digested/integration/02-advanced.md:12,154-156,160,205`
- [x] `_digested/integration/05-recipes.md:315`
- [x] `_digested/integration/06-coverage-and-parity.md:79-81,85,89,123,181`
- [x] `_digested/integration/07-chord-and-facets.md:10,27-31,41-42` —— 兼 chord 重写
- [x] `_digested/harness/03-Discipline/3.4_engineering_rules.md:55`

### B. `_digested/` —— `coding-agent-consumer.mjs` 删除（新增类，易漏）

旧脚本删除，职能拆到 `check-package-install.mjs` + `coding-agent-smoke.mjs` + `local-package-install.mjs` + `package-artifacts.mjs`。
**6 处相对链接指向已不存在的文件**：

- [x] `_digested/test-strategy/09-supply-chain-and-protocol-conformance.md`（4 个带锚点链接）
- [x] `_digested/test-strategy/README.md`
- [x] `_digested/test-strategy/figures/05-supply-chain-and-evidence-lock.svg`（图示文字）
- [x] `_digested/harness/03-Discipline/3.4_engineering_rules.md`（兼 A 类）
- [x] `_digested/integration/06-coverage-and-parity.md`（兼 A 类）
- [x] `_faq_on_digested/12_pi_philosophy/sdlc_evidence.md`、`review.md`（C 类：`chord/PLANNING.md` 删除，6 处链接）

> 结论"不在 check 链"**仍然成立**（已验证 `check:package-install` 不在 `check` 中，且只被 `package.json` 调用）；需改的是文件路径与机制描述。

### C. `_digested/` —— 重写（不止增补）

- [x] `architecture-next/durable-and-storage.md` —— 缺嵌套调用、structuredOutput、deferred tools、Storage 失败语义、内建 codemode、有界性三修、listFiles、images。1.2.0 把 durable 从"任务运行时"改成"工具执行内核"
- [x] `orchestration/04-codemode.md` —— **必须写清两份平行实现**（coding-agent `src/extensions/codemode/` 用 `pi-codemode`；durable `src/codemode/` 自带 journal 重放），不要写成"下移"
- [x] `architecture-next/README.md` —— 全量刷新

### D. `_digested/` —— 局部更新

> 执行范围已超出原定的"re-pin 立即执行 + 最小修正"：A/B/C/F 全部落地，D 的锚点漂移（v1.0.3 行号 → v1.2.0 行号）与 E 的基线声明均已按实测更正。剩余 D 条目为内容增补（新 API 面），逐项见下。

- [x] `orchestration/03-subagent.md` —— `+`/`-` 语义（**不引用 #10785**）
- [x] `orchestration/05-ecosystem-tools.md` —— tool-search（BM25）、`callers`/`deferred`、`reachesTools`、`aliases`
- [ ] `orchestration/07-durable-tasks.md` —— `abandonOnRestart`、`abortOwned`/`ownedTasks`、环检测、调度器有界性
- [x] `agent/01-Anatomy/1.3_Tool_Registry.md` —— `reachesTools`、`aliases`、deferred、`callers`
- [x] `agent/01-Anatomy/1.4_Extension_System.md` —— `before_agent_start` union（Breaking）、`durationMs`、`agent_settled.aborted`
- [x] `agent/04-Harness/4.3_System_Prompt.md` —— codemode 约束标签、去 thinking
- [ ] `agent/03-Memory/`（compaction 篇）—— 去 thinking、阻塞阈值失败即 `model_error`、`compactionFailure`
- [x] `agent/05-Infra/5.1_AI_API_Layer.md` —— `AssistantMessageEventStream`（Breaking）、`durationMs`、openai-decisions、Haiku 5.5、OpenRouter 按 key 目录、重试面
- [ ] `composition/`（config 系列）—— `$schema` 发布、theme 严格校验（**无 `vars` 迁移**）、`~` 展开、`showHardwareCursor`
- [x] `composition/10_extension_axes/10d_toolset_switching.md` —— `+`/`-` 条目
- [ ] `test-strategy/` —— env conformance 加 listFiles（实现指向 `packages/env`）、durable conformance 的 `order`

### E. `_faq_on_digested/`

- [x] `README.md` —— 基线 → v1.2.0
- [ ] `01_model_switching` —— Haiku 5.5、GPT-6 Luna、llama.cpp 分类器、OpenRouter 按 key
- [ ] `02_tui_keybindings` —— `showHardwareCursor`、shifted symbol、program status（`PI_PROGRAM_STATUS` 仅 tui 读取）
- [ ] `03_third_party_provider_baseurl` —— `RefreshModelsContext.baseUrl`、OpenRouter 区域 endpoint
- [x] `06_pi_vs_dsh/02_differences.md:38` —— 三包删除（A 类）
- [x] `07_pi_usage_scenarios` —— PTY、`LocalExecutionEnv`
- [x] `08_extension_vs_package` —— durable 子路径导出样本（注意 `/codemode` 是自有实现）
- [ ] `12_pi_philosophy/sdlc_evidence.md`、`review.md` —— `coding-agent-consumer`（B 类）

### F. `_pi_extension_agent_ready_development/` re-pin

按用户裁定：**re-pin 立即执行，正文只做最小修正，21 处内容性漂移锚点登记为债务**。

- [x] `_coverage/00-corpus-maintenance.md` —— 基线 `v1.0.3`(`d78dc83d6`) → `v1.2.0`(`06a466935`)；"已知基线漂移"节重写（原内容描述的就是新基线）；历轮记录加 **0006**
- [x] `verify.mjs:26` `PINNED_EXTERNAL` → `v1\.2\.0`；`:9-10` 注释同步
- [x] 批量改写 **362** 条外链 tag 段（机械）
- [x] `.github/workflows/durable-env.yml` → `env.yml`（3 处锚点，`sdlc-reference/04-ci-matrix.md`）
- [x] `scripts/publish.mjs` 三处越界锚点（`sdlc-reference/07-release-and-recovery.md`）
- [x] **21 处内容性漂移锚点**登记债务清单（见勘察报告表格），不重写正文
- [x] 运行 `node verify.mjs` + `node verify.test.mjs`

> `verify.mjs` 与 362 条链接**必须同一轮改完**——`verify.test.mjs` 断言非 pin tag 的外链被拒绝。

## 已知陷阱（执行时勿踩）

1. **`pi-client` 在 `mcp-conformance/`** 是 conformance check 标签，不是被删包。按字面 grep "修"是错的。
2. **两个 `v1.0.3`**：真 tag `d78dc83d6` vs 区间起点 `98d2e1947`（+23 commit）。写"v1.0.3 时如何"只能用 `git ls-tree v1.0.3`。
3. **codemode 两份实现**平行存在，不是迁移。
4. **`#10785`/`#10887`/`#10865` 不得引用**——post-tag。
5. **`apps/*`** 在 workspaces 里但无 `apps/` 目录，空 glob。
6. **`agent/05-Infra` 协议线**：`PROTOCOL_VERSION` 锚点全部失效，非行号漂移。

## 完成判据

- 三份语料 README 的基线声明均为 `v1.2.0`
- 全库无对 `packages/{client,protocol,server}` 的**现时**断言（历史注记除外）
- 全库无指向 `scripts/coding-agent-consumer.mjs` 的链接
- `_pi_extension_agent_ready_development/` 的 `verify.mjs` 与 `verify.test.mjs` 均通过
- 无任何 #10785/#10887/#10865 引用

### D-plus（第二轮内容漂移复核后追加，已完成）

- [x] `orchestration/04-codemode.md` —— **两份平行实现**专节 + journal 重放差异表；`host.ts` 迁移、`prelude-source.ts`、`execute.ts`、`tool.ts` 全部重锚
- [x] `composition/8_settings_json.md` —— `allowedFallbackModels` 迁 `compat-schema.ts:485`；L176 锚点块全面重锚；**项目层 `.pi/settings.json` 存在**（原写"pi 不读"是错的）；`thinking` → `defaultThinkingLevel`；"5 个新符号"改为"仅导出变化"
- [x] `extensions/02-Expansion/2.1_loop_seams.md`、`2.2_register_surface.md` —— `before_agent_start` union 专节；`reachesTools` 专节；`setActiveTools` 不解析修饰符的界分
- [x] `extensions/03-Patterns/{3.1,3.2,3.3}.md` —— `ExtensionFactory` :2045、`getAllRegisteredTools` :637、`emitUserBash` :1268-1296、**loader+runner 行数更正 876+1565=2441**（原写 806+1286=2092）
- [x] `agent/05-Infra/5.1_AI_API_Layer.md` —— **`api/openrouter-images.ts` 未被删除**（删的是 `providers/` 下的同名文件）；`api/` 40→43 文件；`TranscriptContext` :780、`SimpleStreamOptions` :369 等重锚
- [x] `agent/04-Harness/4.3_System_Prompt.md` —— **`emitBeforeAgentStart` 错误代码样例更正**（三参数 → 单 `trigger` 对象，`agent-session.ts:1894`）；union 说明；锚点块重锚
- [x] `orchestration/03-subagent.md`、`composition/10_extension_axes/10d_toolset_switching.md` —— `--tools` 接受 `+name`/`-name`（`ddaa0a034`，in-tag）

### 自审复核（第三轮，用户要求「从新增/调整/删除三个角度再 REVIEW」）

两路独立 subagent 审计 + 逐条人工复核。**关键结论：此前只做了"重锚定"，漏掉了"内容增补"**——`0009` 记录了这些变化，但 corpus 正文从未写入。`_plan-1` 中对应项当时仍是 `[ ]`。

**（1）新增内容 —— 已补写**

- [x] `composition/8_settings_json.md` —— **新专节**：`$schema` 与发布的四份 JSON Schema（`pi.dev/schemas/*`）、生成器 `scripts/generate-schemas.ts`、`settings-schema.ts`/`settings-defaults.ts` 事实源
- [x] `architecture-next/durable-and-storage.md` —— **两个新专节**：`packages/env` v1.2.0 能力面（**PTY 子系统** `openTerminal`/`RemoteTerminal`、`LocalExecutionEnv` + `nodePlatform` + `listFiles` 实现、daemon 内容寻址部署）；**images 子系统**（Photon/WASM、三种宿主适配、`DEFAULT_IMAGE_LIMITS`、`read` 返回 image block）
- [x] `orchestration/04-codemode.md` —— **新专节**：`packages/codemode` 的**三种沙箱后端**（`CodemodeSandboxBase`/`Inline`/`Remote`）+ `./portable`/`./cloudflare`/`./worker` 子路径 + `sandbox.start()` 确定性重放 API
- [x] `agent/05-Infra/5.1_AI_API_Layer.md` —— **新专节**：按 key 的 OpenRouter 目录（`personalizeOpenRouterCatalog` + `RefreshModelsContext.baseUrl?` `models.ts:99`）、`openai-decisions`、`ModelCostTier`、`api/` 40→43
- [x] `_faq_on_digested/02_tui_keybindings/answer.md` —— **新专节**：`PI_CLIPBOARD_OSC52`、OSC 7501 程序状态 + `PI_PROGRAM_STATUS`、`Terminal.setProgramStatus()` 为必需方法（Breaking）
- [x] `_pi.../sdlc-reference/02-issue-diagnosis-and-session-import.md` —— **新专节**：`scripts/issues/` 本地 triage 工具（25 文件 / 15 categories / 9 个 `TRIAGE_*` 环境变量；**不在任何 workflow 中**）
- [x] `_pi.../repo-harness/02-prompts-as-procedural-contracts.md` —— `.pi/prompts/` **六 → 七个**（新增 `dup`）

**（2）内容调整 —— 已改**

- [x] **全局 stale 标记**：`"v1.0.3+ Unreleased"` 共 **11 处**改为 `"v1.2.0 起在 release 内"`（`packages/env` 相关 6 处 + `--tools`/MCP 关闭语义/lockdown/同名工厂等）——此前把**已随 v1.2.0 发布**的东西仍标为 Unreleased
- [x] `agent/03-Memory/3.5_Session_v4.md:24` —— `StorageRejected` **已删除**（改述为 `StorageRequestError` + `SessionFailed`）；行号 `:4/:12/:20` → `:17/:49`
- [x] `agent/04-Harness/4.1_AgentHarness.md` —— `docs/pico-v5-handoff.md` **已删除**（4 处引用加注）；`spec.md` 行数 4,601 → **5,340**
- [x] `_faq_on_digested` 等页面的 `Unreleased` 描述与 v1.2.0 状态对齐

**（3）内容删除/作废 —— 已标注**

- [x] `harness/02-Boundaries/2.3_agent_lane_contract_first.md` —— **本页论点作废**：4 个 experimental 消费者路径全删；coding-agent **已不依赖 pi-durable**（原页零 v1.2.0 标记）
- [x] `integration/05-recipes.md:315` —— 删除的 `pi-client`/`pi-server` 从"可评估选项"改为"已删除，无替代"
- [x] **facet/axis-8 集群 5 个文件**（`extensions/2.5`、`extensions/3.1`、`composition/10h`、`10i`、`10_extension_axes/README.md`）—— `chord/src/api.ts` + `examples/plugins/pi-example-plugin/` 全删，此前仍作"活证据"
- [x] `.pi/prompts` / `PLANNING.md` 残留引用加注

**审计覆盖声明**：两路审计各自列出了"检查过且判定 OK"的清单（三包删除、`coding-agent-consumer.mjs` 拆分、`./facets`/`./bundler` + esbuild 移除、chord README 锚点等），确认这些传播正确。审计同时**排除**了两个我可能误报的项：`--no-builtin-tools` 与 `RetryPolicy` 在区间起点**已存在**，不是新特性。
