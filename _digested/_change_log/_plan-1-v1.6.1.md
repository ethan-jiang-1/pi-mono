# 同步计划 0012–0015：v1.5.0 → v1.6.1（含语料处置，已执行）

**日期**: 2026-11-26
**目标 tag**: `v1.6.1` = `ef4a1cfcc`（2026-11-25，当前 upstream stable）
**起始基线**: `v1.5.0` = `f9a263655`（本仓库 `ethan` 分支）
**合入**: merge tag `v1.6.1` → `a1e6c97e6`（**零冲突**；本地 127 commits 全 docs，upstream 不触碰）
**追加 cherry-pick**: `b18ec60b2`（= upstream `22f5f2995`，#12552）。原因：models.dev 在 v1.6.1 发布后给 `@cf/moonshotai/kimi-k2.6`/`kimi-k2.7-code`（Cloudflare 11-20 弃用）与 `qwen4-max-preview`（11-25 退役）打了 deprecated 标，catalog 的 `skipDeprecated: true` 把它们从再生成数据里跳过，v1.6.1 自带的 tracked 测试引用即失败——**v1.6.1 tag 本身已无法通过 `npm run check`**，upstream 在 post-tag 当天修复。这是对"不追 main tip"口径的**最小例外**（仅此一个纯修复 commit，经用户确认 changelog 冲突解法后落地；`packages/*/CHANGELOG.md` 冲突按"只取本 commit 条目"解决，不引入同批无关条目）。
**together 处置（终版，取代早先的手补缓存方案）**：`togetherai` 在 models.dev 仍有 27 个模型，但 `openai/gpt-oss-120b` 与 `deepseek-ai/DeepSeek-V4-Pro-0813` 被标 deprecated，被 `skipDeprecated: true` 跳过 → tracked 的 `together-models.test.ts` 引用失败。手补 gitignored 缓存的方案被否决——`npm run build` 与 ai 包测试套件都会触发再生成，补丁必被清掉（实测两次）。最终修复走 upstream 同款路：**改测试本身**——两个用例改引用现存模型（`Qwen/Qwen4-Max`、`deepseek-ai/DeepSeek-V4.1-Flash`，均非 deprecated、regen 稳定），断言按实时数据派生值重写，附 drift 注释。tracked 漂移 2 个用例，与 upstream 将来的 together 修复方向一致。
**Discovery 记录**: `0012-v1.5.0-to-v1.5.1.md` / `0013-v1.5.1-to-v1.5.2.md` / `0014-v1.5.2-to-v1.6.0.md` / `0015-v1.6.0-to-v1.6.1.md`（先于执行产出，合入后补记"合入范围"行）
**摘要**: 未单列（四篇 Discovery 记录即摘要；本计划即执行台账）

> **基线口径**：钉 release tag `v1.6.1`，**不追 main tip**。`upstream/main` 在 tag 之后还有 **59** 个 commit（`6ebd63108`），含 chord 持有对象内存减半、p2 Radius 分享邀请、OSC 7577 resume 上报等——留给 0016。

---

## 0. 一句话结论

四个 release、**878 commits**、4,598 文件 **+425,371/−51,106**——规模与 v1.5.0 轮相当，但结构事件不同：

1. **chord v2 转正、v1 删除**（0012）：根 export 换 v2，`/next` 与"双运行时并存"表述终结；slices 9–14 落地（telemetry / surfaces / plugin model / app kit / sync / live+named queries / admission）。
2. **`apps/` 层出现**（0012–0014）：`apps/p2`（chord 插件式 Web UI，EXPERIMENTAL 原型）、`apps/p3`（Pi Roam，方向工程）、`apps/p2-mac`（Swift spike）——产品面走向 chord v2 插件化。
3. **durable 可挂起工具**（0014）：ToolPark（sleep/wait）+ Signals + Gates + hooks 派生任务；`pi.tool` v4 / `pi.generation` v3（存储单向门）；设计文档（`docs/suspendable/`）先于实现一个 release 落地（0013）。
4. **1.6.1 tagged-union 扫荡**（0015）：AGENTS.md 新规则同 release 被代码执行——durable 7 + chord 4 + coding-agent 1 条 Breaking，全部 `{ kind }` 判别；patch 版本背 Breaking 是本轮最需注意的发布特征。
5. **集成面重排**：MCP OAuth/工具命名/结果 schema 下沉 `packages/mcp`（0012/0015 三批）；`pi auth login/logout` CLI；`pi-decision` 决策协议 + codemode `models.classify()`；Anthropic message threads 默认面扩大；notices 四开关拆分。

## 1. 语料处置（已全部执行）

### `_digested/`

- **architecture-next**：`chord.md` 重写为单一 chord v2 页（吸收 chord-v2.md 的文档分工与模块地图，`chord-v2.md` 删除）；新增 `apps-p2-p3.md`（p2/p3/p2-mac 三 app 的定性、结构、CI、AGENTS 钩子）；`README.md` 重写（三页新结构 + 版本史沉底）；`durable-and-storage.md` 补 sync-0012–0015 增量 + 新增"可挂起工具与信号"专节 + `SqliteStorage`/`NodeExecutionEnv`/JSONL readOnly/images fit 更新。
- **harness**：`3.4_engineering_rules.md` 补 v1.6.1 check 链口径（9 步 + 链外 released-changelogs）、锚点行号更新、新增"sync-0012–0015 规则变化"节（五条新规则 + Chord v2 绑定全包 + apps 立法 + 语料含义）；README 版本史加增量段。
- **extensions**：`2.2`（Extension.namespace / GrepOperations 收窄 / strict 边界）、`2.3`（render readonly / messageTypes / blocked / blockedKind）、`2.5`（facet 轴权威描述收敛单页 + v1.6.1 增补）各加版本史；README 增量段。
- **integration**：`06`（cacheWarming 默认 idle / MCP 包级 API 迁移 / 决策模型行 / message threads 行）、`03`（RPC/SDK 契约四条 版本史）、`07`（chord 警示被 v1.6.1 增补超越）。
- **其余专题**：`orchestration/07`（commitSeries 路径 + SeriesResult tagged）、`test-strategy`（README 增量段 + 01 篇 test.sh 现状）、`trajectory/02`（cache warming 助手迁 pi-ai + 表格修复）；`agent/`/`composition` 矩阵核对无正文失效（agent 走台账 re-pin）。
- **README.md**：基线 v1.6.1（滞后声明转正）、包表 chord/durable 行重写、apps 层说明、版本史新增第十二轮段。

### `_faq_on_digested/`

- 台账 26 条 stale 修复（12_pi_philosophy 四页的证据链：issue-gate/AGENTS/ci.yml/package.json/test.sh/install-lock/release.mjs/durable+chord package.json/ai types/agent-loop/chord README/durable README/CONTRIBUTING/agent-session），全量 `checkedAt` → v1.6.1，盲跑 0 stale。
- 内容增量：`01_model_switching`（默认模型两轮大换、Ctrl+P 修复、目录清理、决策模型）、`02_tui_keybindings`（粘贴/SIGTSTP/blockedKind）、`03_third_party_provider_baseurl`（compat 五开关、strict 边界、重试扩容、pi-decision）、`12_pi_philosophy`（AGENTS 四规则、apps 立法、治理面）；README 基线声明加 sync-0012–0015 增量段。

### `_pi_extension_agent_ready_development/`

- 台账 10 条 stale 修复 + **E071 删除**（`scripts/issues/` 已删，卷二 02 页改历史横幅）；全量 `checkedAt` → v1.6.1；`corpus.json` 基线同步；盲跑 0 stale。
- 正文：卷三 01 页（build 规则现文 + apps/p2 blockquote + test.sh packages/*）、卷二 07 页（`version:patch` 现文 + 步骤 1 npm 11）、卷二 04 页（根 test 现文）、卷二 01 页（issue-triage 行为迁移 + remove-labels-on-close）、卷三 07 页（包表括注）。
- **pin 换版**：`verify.mjs` `BASELINE_TAG` → `v1.6.1`；7 处外链 tag 段机械改写；三卷 README/00-index 基线声明同步；`_coverage/00-corpus-maintenance.md` 钉定基线更新 + 0018 轮记录。
- **结构校验**：`verify.mjs` 45 文件全过；`verify.test.mjs` 全过（期间修复一处越语料相对链接——自包含约定）。

## 2. 验证结果（完成判据对照）

| 判据 | 结果 |
|---|---|
| 三语料 `verify-evidence.mjs --tag v1.6.1` 盲跑 | `_digested` 34/34 · `_faq_on_digested` 213/213 · `_pi_ext` 125/125 — **全部 0 stale** |
| `_pi_ext` verify.mjs 结构校验 | 45 files, all rules pass（verify.test.mjs 同过） |
| 三语料 README 基线声明 | 均指向 v1.6.1（`ef4a1cfcc`） |
| 0012–0015 记录含真实合入范围 | `a1e6c97e6`（merge tag v1.6.1，零冲突，2026-11-26） |
| 无"双运行时并存"存活表述 | 残留 grep 仅剩有标记的历史对照/增补节，无存活断言 |

## 3. 遗留与下一轮（0016）

- **post-tag 59 commits 未纳入**（`v1.6.1..upstream/main`，tip `6ebd63108`）：chord 持有对象内存减半（`4f941f5d2`）、decision/follow 语义修复线、错误栈剥离（`8feec0144`）、p2 Radius 短时效分享邀请（`10a1a4d6a`）、`reload_plugins` 按名修复、OSC 7577 resume 命令上报（`cf419553d` #12557）、Bedrock Kimi K3 不重放早期 reasoning、AGENTS.md tip 新规则"never compare values by serializing them"（`6ebd63108`）。
- merge 后未跑 `npm install --ignore-scripts`（node_modules 仍为 v1.5.0 形态）；本轮全程未跑构建/测试（纯文档轮），下轮触碰代码前先 hydrate。
- `_summary-v1.6.1.md` 未建（0012–0015 四篇 Discovery 记录承担摘要职责；如需与旧格式对齐可补）。

## 4. 追加：结构重构 pass（执行后补，同轮）

执行完成后按用户明确的消化原则做了一次结构重构："新增→补、变化→改、剔除→删；结构跟随当前真相，历史属 change log；不被既有文件骨架左右"。处置 7 处"增量贴膏药"：

- **折进正文、删版本史贴片**：`extensions/2.2`（namespace 来源改声明式 / grep readFile 收窄 / strict 边界 → 判断六收紧清单 5/6 条 + ToolInfo 注更新）、`extensions/2.3`（render readonly 契约 → 判断二、messageTypes/blocked/blockedKind → 开篇表）、`integration/03`（shutdown 语义 → §2 头、诊断+事件修复 → session 管理操作、exec 退出码 → executeBash 注）。
- **正文按现状重写、历史压短**：`harness/3.4`（162→107 行；新规则进现象/判断一例证；判断五行号 v1.6.1；两节历史压成"规则变化史"一表两判断）；`integration/07`（四层 ⚠️ 压成一段现状声明，保留 §5 存活声明）；`extensions/2.5`（144→40 行，死取证删除，留概念/现状/术语碰撞/历史线四段）；pi_ext 卷二 02 页（scripts/issues 整节压成短注）。
- **与 `_evidence/PLAN.md` 规则 4 的张力及裁决**：PLAN 规则 4（0015 轮教训）说"不要把成组内容压成表格，要原样沉降到版本史"。本轮裁决：对**已删除体系**的死取证（chord v1 API、scripts/issues、facet/service 运行时），删除而非沉降——标识符全集可在 `_change_log/0007/0009/0010/0012` 原文找回；对**仍生效规则**的历史（AGENTS.md 四轮变化），压缩表保留规则名+issue 号+记录链接。PLAN 规则 4 对"仍相关且不可外部找回的成组细节"继续有效。
- 入站锚点检查：被删标题（`#四处规则变化`、各页 `#版本史`）零入站引用；`verify.mjs` 45 文件全过、`verify.test.mjs` 全过、三语料盲跑仍 0 stale。
