# 语料维护：基线、证据范围与重审

## 钉定基线

- 仓库：`earendil-works/pi`
- 基线：release tag `v1.2.0`，commit `06a466935`（`Release v1.2.0`）。
- 上一基线：`v1.0.3`，commit `d78dc83d6`。本轮（0006）从 `v1.0.3` re-pin 到 `v1.2.0`。
- 这是本轮核验版本，不是永久前提。Pi 处于活跃开发期，接口与主仓制度都会演进；更新版本时应逐条复核并改写过时结论，不能只替换链接。

> **不要混用两个 "v1.0.3"**：`v1.0.3` tag 是 `d78dc83d6`；`_digested/_change_log/0009` 使用的区间起点 `98d2e1947` 在该 tag **之后 23 个 commit**（记为 v1.0.3+23）。两者的 `packages/` 与 `.github/workflows/` 清单都不同——三包删除与 `durable-env.yml`→`env.yml` 改名都发生在这 23 个 commit 内。核对"v1.0.3 时如何"必须用 `git ls-tree v1.0.3`。

## 本轮已核验的证据范围

以下来源在本轮挖取时逐项对 tag 核验过存在性与内容：

| 来源 | 核验内容 |
|---|---|
| `packages/coding-agent/docs/` @ v1.2.0 | 文档清单与 `docs.json` 与 v1.0.3 一致（无增删）；17 个文件有修改（extensions.md、mcp.md、codemode.md、cli.md、providers.md +47、llama-cpp.md、models.md、settings.md、themes.md、message-types.md、compaction.md、terminal-setup.md、keybindings.md、environment-variables.md、json.md、tui.md、cli-integration.md） |
| `.pi/` @ v1.2.0 | 六个 prompts（is/pr/wr/deslop/sa/cl）+ 新增 `dup.md`（查重）；三个 skills（add-llm-provider/interactive-testing/release）；四个 extensions（import-repro/prompt-url-widget/redraws/tps） |
| `.github/workflows/` @ v1.2.0 | 13 个工作流的存在性与触发条件（ci、env、env-daemons、nix、npm-audit、issue-gate、pr-gate、approve-contributor、issue-analysis、build-binaries、publish-model-catalog、issue-triage-labels、remove-inprogress-on-close）。`ci.yml` 在本区间未变；`durable-env.yml` 改名为 `env.yml` 且触发器改为路径门控；`build-binaries.yml` 新增 `env-daemons` job；`issue-triage-labels.yml` 新增按标签指派 |
| `packages/` @ v1.2.0 | 11 个包的清单与角色（v1.0.3 为 13 个；`client`/`protocol`/`server` 已删除） |
| `scripts/` @ v1.2.0 | check 管线脚本的存在性（check-entry-graphs、check-runtime-deps、check-pinned-deps、check-lockfile-commit、generate-coding-agent-install-lock、check-package-install 等）。**`coding-agent-consumer.mjs` 已删除**，职能拆入 `check-package-install.mjs` + `coding-agent-smoke.mjs` + `local-package-install.mjs` + `package-artifacts.mjs`；新增 `biome-check.mjs`、`npm-command.mjs`、`pack-packages.mjs`、`use-local-packages.mjs` 与整个 `scripts/issues/` |
| `packages/ai` 导出面 | exports map 含 `./compat`；`registerFauxProvider`、`streamSimple` 从 compat 导出（独立扩展仓可复用确定性测试的关键事实） |
| `packages/coding-agent/test/suite/` @ v1.2.0 | faux harness 与回归测试的组装方式，作为验证分层的参考实现 |

## 相对上一基线的机制变化（v1.0.3 → v1.2.0）

上一轮记录的"HEAD 漂移"已并入本基线。0006 逐条复核后的净变化：

- **三包删除**：`packages/client`、`packages/protocol`、`packages/server` 及其 CBOR 协议线（`PROTOCOL_VERSION = 8`）整体移除，不再发布。`packages/` 由 13 减为 11。全库真实残留引用为 0。
- **环境工作流重做**：`durable-env.yml` → `env.yml`（名字 `Durable env` → `Environments`），触发器从「`durable-env-*` 分支 + 手动」改为**路径门控的 PR/push**；job 由 `check` + `env-tests`（五 OS）变为 `daemons` + `check`（新增 `npm pack` 文件清单校验）+ `release-daemons`（**六**平台，测发布形态 daemon）。新增可复用的 `env-daemons.yml`。
- **`ci.yml`**：在 Check 与 Test 之间新增 `npm run build:daemon --workspace packages/env`；两个 job 名与 mcp-conformance 未变。
- **`build-binaries.yml`**：新增 `env-daemons` job，`publish-npm` 的 `needs` 从 `stage-github-release` 扩为 `[stage-github-release, env-daemons]`，并在 publish-npm 内下载 daemon artifact 后断言八个平台产物存在。**这使本文件的多个行号锚点整体后移**（`publish-npm` L304→L312、announce L357→L389、publish-github-release L398→L430）。
- **`scripts/coding-agent-consumer.mjs` 删除**：见上表。`check:package-install` 脚本名保留、仍不在 `check` 链内，但驱动文件与实现全换。
- **根 `package.json`**：workspaces 新增 `"apps/*"`（**仓库内无 `apps/` 目录，是空 glob**）；build 链插入 `packages/env`；`check` 首项由 `biome check --write --error-on-warnings .` 改为 `node scripts/biome-check.mjs --write`；devDeps 新增 `@biomejs/wasm-nodejs`、`pnpm`、`yaml`。
- **文档**：`packages/coding-agent/docs/` 清单与 `docs.json` 未变，17 个文件有内容修改（详见上表）。`CONTRIBUTING.md`、`AGENTS.md` 本区间**未改动**。
- **`packages/ai` 的 Breaking**：`StreamFunction` 返回类型改为 `AssistantMessageEventStream`。**`packages/tui` 的 Breaking**：`Terminal.setProgramStatus()` 成为必需成员；cursor 改零宽 APC 标记。**`packages/mcp` 的 Breaking**：`structuredContent` 由 `Record<string, unknown>` 放宽为 `unknown`。

### 未解决的重审债务（0006 登记，不阻塞）

re-pin 只机械改了 362 条外链的 tag 段，并修掉了 6 处**结构性**越界锚点（`durable-env.yml` 三处、`scripts/publish.mjs` 三处）。另有 **21 处**引用的 v1.0.3 原文在 v1.2.0 已不存在于该文件任何位置——即锚点在范围内但内容已被改写。这些锚点**当前不会使 `verify.mjs` 失败**（它不核对远端内容），但引文可能与 tag 不符。清单与逐条分类见 [`01-repin-v1.2.0-survey.md`](01-repin-v1.2.0-survey.md)。

主要集中在：`sdlc-reference/03-check-pipeline.md`（5）、`sdlc-reference/07-release-and-recovery.md`（7，其中 3 处已随本轮的 workflows 重做修正）、`repo-harness/07-monorepo-taxonomy.md`（3，本轮已随包表修正）、`repo-harness/04-extension-points-map.md`（2）。

## 重审触发路径

| 上游变化 | 需要复核的页 |
|---|---|
| 新 release tag 发布 | 全语料：逐页复核机制事实与行号，更新本页基线，不能只替换 URL |
| `ExtensionAPI` / `extensions/types.ts` 变化 | 卷一全部；卷三的扩展点地图 |
| packages.md 发现规则、`pi` manifest、host 提供包清单变化 | 卷一新仓起步、术语页；卷三扩展点地图 |
| `.pi/` prompts/skills 增减或合同变化 | 卷三对应页 |
| workflows 增删、check 脚本组成变化 | 卷二 check/CI/发布页 |
| 发布管线（release.mjs、build-binaries.yml、publish*）变化 | 卷二发布页 |

## 结构约束

- 正文结构规则由 [`verify.mjs`](../verify.mjs) 强制：严格 UTF-8、恰好一个结尾换行、语料内相对链接与锚点有效、外链只指向 `v1.2.0` 的 Pi 仓库路径（`PINNED_EXTERNAL`，`verify.mjs:26`）、每个目录有 README、SVG 图示的固有尺寸与无障碍元数据、图示与正文引用双向完整。
- `verify.mjs` **不核对远端内容**：它无法发现"链接指向的文件在上游被改名/删除"或"引文与 tag 不符"。本轮 6 处结构性越界锚点与 21 处内容性漂移都属于这一类，必须靠对 tag 的静态核对发现。
- 每卷的图示由该卷自己的 `figures/README.md` 清单管理（文件与对应正文页），不跨卷共享图。
- 陈述四分类（运行时事实／主仓要求／扩展仓建议／仓库自定）由正文维护，机器不可校验。

## 验证要求

- 修改本目录内容后，在语料目录运行 `node verify.mjs`（或从仓库根运行 `node _pi_extension_agent_ready_development/verify.mjs`）。
- 修改验证规则后运行 `node verify.test.mjs` 确认接受与拒绝条件仍然成立。
- 证据复核（对 tag 重核事实）与结构验证是两件事：后者通过不代表事实仍然准确。

## 历轮记录

- **0001**（初始轮）：钉定 `v1.0.3`。建立三卷结构（扩展开发模型 / SDLC Reference / Development Harness）、`_coverage` 与 verify 自举。卷一三页与根 README 由主研究产出；卷二（准入、诊断接续、check 管线、CI 矩阵、测试分层、评审、发布恢复、适用边界）与卷三（agent 入口规则、prompts、skills、扩展点地图、会话可检查性、范围纪律与成本合同、分类学）由并行研究对 tag 核验产出。卷二共审计 196 个行号锚点，修正 6 处错锚。
- **0002**（审阅与图示轮）：全语料系统性审阅（结构、逻辑、自洽）；概念对齐——以 Pi 原生词（resource、cost contracts、core is minimal、review buffer）替换外部语料来源的组织词，卷三 06 页由「铺装路」重构为「范围纪律与成本合同」；新增七张 SVG 图示（每卷 figures/README.md 清单管理），verify 扩展 SVG 规则与图示引用完整性检查，verify.test 增补图示负例。
- **0003**（事实复核轮）：基线不变（仍钉 `v1.0.3`）。对全部 15 个正文页逐条复核：并行核验约 200 个行号锚点与全部英文引文。修正 1 处事实错误（卷一 00 页 `/help` 命令在 v1.0.3 不存在，改用 `/` 命令补全与模型工具清单作例证）；修正若干过度或失准表述（阶梯第 2 级「pi config 可见」口径、卷二 05 页 compat `streamSimple` 机制与 harness 默认 ResourceLoader 替身、卷二 07 页六阶段依赖计数与 cleanup 触发条件、CI 诊断实为 `-p` 非交互模式、模型目录 cron 时段、`pi -ne` 不拦显式 `-e`、pinned-deps 例外含 chord、browser-smoke 期望入口、deslop 与 AGENTS 内联判据由「同一」改「相近」）；补全覆盖缺口（issue-triage-labels 标签生命周期、suite 规则第五条、`/ir` 附加重写规则、`/sa` 的 `request_cve` 分支、forbid 清单、RFC 索引位置、skills 启动元数据含 path、skill 单文件形态）；host 提供包名统一为全称、锚点覆盖不足处扩区间（packages.md L80-L92、approve-contributor、issue-analysis 三段、AGENTS.md changelog 等）；卷三 00 页 session-format 路径改全路径、「九篇机制文档」改为「其中九篇可变性面文档」。
- **0004**（术语清查轮）：基线不变。全语料扫描非 Pi 原生术语并替换为 Pi 原生词：「注意力预算」统一为「审阅缓冲」（CONTRIBUTING FAQ 原话 "Auto-closing creates a buffer"；卷二 06 页标题、小节与观点、卷二 08 页、卷三 00/01/06 页同步）；「成本预算」改「成本合同」（check-entry-graphs.mjs 原话；entry-graph 的 budget/budget 一词是脚本自己的词，保留）；组织性「证据」链改为验证导向措辞（测试证据→测试结果、行为证据→行为验证、确定性证据→确定性验证、回归时会失败的证据→回归时会失败的检查，涉及根 README、卷一 00/01 页、figures/README、extension-change-path.svg）；「卸载」改「注销」（extensions.md 原词 unregistered）；「session 交接/handoff」改「session 接续/导入」并改名文件（Pi 原生动词 import：`/import` "Import and resume a JSONL session"、`import-repro.ts`、`importFromJsonl`；`sdlc-reference/02-issue-diagnosis-and-session-handoff.md` → `02-issue-diagnosis-and-session-import.md`，`repo-harness/figures/session-handoff.svg` → `session-import.svg`，链接同步）；术语页导言注明（本语料命名）标注约定。经核属 Pi 原生而保留的词：workpackage（deslop.md 原文）、worktree（AGENTS.md 原文）、低信号（CONTRIBUTING 原文 "Low-signal"）、gate/门槛（issue-gate.yml 与 CONTRIBUTING "Contribution Gate"）、quality bar、buffer、budget、smoke、conformance、lockstep 等。
- **0005**（外审落地轮）：基线不变（仍钉 `v1.0.3`）。外部 review 以三个并行核查对全部 15 个正文页约 160 个行号锚点与约 40 段英文引文逐字核对 tag：内容错误 0、矛盾 0。落地修正：2 处锚点偏差（卷三 02 页 prompt-templates.md「文件名即命令名」L16→L19、cl.md「先确认再写入」L34→L34-L35）；卷一 00 页阶梯导语改写（不再以「Pi 的扩展机制把工作分成等级」开头，明示七级划分为本语料归纳）；术语页 §九 补标注六个语料自造词（交付判断、Pi-native、验证分层、会话账本、程序性合同、会话可检视性），「首段」口径改「文档开头的判别句」；verification-layers.svg 来源行补「综合自」标注，figures/README 的综合图清单同步（完成度阶梯、变更路径、验证分层）。补充 Pi 原生机制：内建会话接续命令面（卷三 05 页新增一节：`--continue`/`--resume`、`/resume`、`/new`、`/tree`、`/fork`、`/clone`、`/compact`、`/import`、`/export`、`/share`、`--no-session`、`--session-dir`；术语页 §六 加内建接续命令条目）；compaction 的 `session_before_compact` 扩展钩子与 `fromHook`/usage 计量（卷一 00 页生命周期、术语页 §四）；how-pi-works.md 架构总览锚点（术语页 §一）；rpc-extension-ui.md 子协议与 RPC 模式 `ctx.hasUI` 语义（卷一 00 页 UI 节、术语页 §七）；security.md/SECURITY.md/containerization.md 安全边界三专文（卷三 04 页边界节）；cli.md（`-e`/`-ne`/`builtin:` 语义）、settings.md（项目覆盖与资源列表合并）、message-types.md（消息类型权威）、keybindings.md（named actions）锚点（卷一 01 页、卷三 04 页）；issue 模板补全四份（卷二 01 页：bug/contribution/package-report/config，其中 package-report 是 pi.dev package 生态的独立入口）；AGENTS.md L41「Never commit unless the user asks」提交门（卷三 01 页 Git 节）；`/trust` 与 `/reload` 命令（卷一 01 页、术语页 §一）；`.pi/extensions/` 四扩展点名（卷三 00/05 页）；扩展点地图补点名 namespace/prepareLoadout/registerToolRenderer（卷三 04 页）。轻微不精确顺带修正：目录扩展 `index.ts or index.js` 变体、`pi config` 口径收敛为包资源加载配置、卷三 03 页 add-llm-provider 描述无显式 Use 从句的口径、卷二 03 页 lockfile blockquote 省略说明、卷二 05 页 tarball 单复数、漂移注记补 codemode.md 的 prompt guidelines 变更与新引用的 cli.md 漂移（HEAD 工具选择一节新增 `mcp__` 模式与 `--no-mcp`，行号有位移）。

- **0006**（re-pin v1.2.0 轮）：**基线变更** `v1.0.3`（`d78dc83d6`）→ `v1.2.0`（`06a466935`）。上游跨 v1.0.4 / v1.1.0 / v1.2.0 三个 tag。勘察见 [`01-repin-v1.2.0-survey.md`](01-repin-v1.2.0-survey.md)，上游逐项 Discovery 见 `_digested/_change_log/0009-v1.0.3-to-v1.2.0.md`（语料外路径，不建链接——本语料按约定自包含，相对链接不得越出本目录）。本轮先勘察后执行：量化出 24 个文件、362 条外链（347 条带行号锚点）、引用 78 个上游文件，其中 77 个在 v1.2.0 存在、26 个在本区间被改、6 条锚点结构性越界、21 条锚点内容性漂移。执行内容：`verify.mjs:26` 的 `PINNED_EXTERNAL` 与 `:9-10`/`:161` 文案、`verify.test.mjs:48` 的断言字符串同步改为 `v1.2.0`（三者耦合，必须同轮改）；362 条外链 tag 段机械改写；`durable-env.yml` → `env.yml` 三处锚点；`scripts/publish.mjs` 三处越界锚点。随基线变更改写的正文结论：卷三 07 页整节重做（`env.yml` 的触发模型、三个 job、六平台 matrix）、卷三 07 页包表 13→11 行并注明三包删除、卷三 04 页漂移注记改为"改动已并入基线"、卷二 04 页 `env.yml` 与 `ci.yml` 步骤重写、卷二 07 页新增 `env-daemons` 阶段并修正三个后移的行号区间、各卷证据基线段与全部图示来源行。**21 处内容性漂移锚点未改**，登记为上述重审债务。
