# 语料维护：基线、证据范围与重审

## 钉定基线

- 仓库：`earendil-works/pi`
- 基线：release tag `v1.4.0`，commit `4a080252f`（`Release v1.4.0`）。
- 上一基线：`v1.2.0`，commit `06a466935`。0015 轮从 `v1.2.0` re-pin 到 `v1.4.0`（跨 v1.3.0）。
- 更早基线：`v1.0.3`，commit `d78dc83d6`（0006 轮从 `v1.0.3` re-pin 到 `v1.2.0`）。
- 这是本轮核验版本，不是永久前提。Pi 处于活跃开发期，接口与主仓制度都会演进；更新版本时应逐条复核并改写过时结论，不能只替换链接。

> **不要混用两个 "v1.0.3"**：`v1.0.3` tag 是 `d78dc83d6`；`_digested/_change_log/0009` 使用的区间起点 `98d2e1947` 在该 tag **之后 23 个 commit**（记为 v1.0.3+23）。两者的 `.github/workflows/` 清单不同——`durable-env.yml`→`env.yml` 的改名就发生在这 23 个 commit 内。核对"v1.0.3 时如何"必须用 `git ls-tree v1.0.3`。
>
> **注意区分两处清单差异**：`packages/` 不同是**另一回事**。`98d2e1947` 仍有 `client`/`protocol`/`server`（**14** 个包），三包删除（`7472cda0d`）**不是** `98d2e1947` 的祖先，发生在 `98d2e1947`→`v1.2.0` 区间内，**不在**上述 23 个 commit 里。即：改名属 v1.0.3+23 窗口，三包删除属 0009 区间（14 → 11）。

## 本轮已核验的证据范围（v1.2.0 时点；0015 轮新增项见文末）

以下来源在本轮挖取时逐项对 tag 核验过存在性与内容：

| 来源 | 核验内容 |
|---|---|
| `packages/coding-agent/docs/` @ v1.2.0 | 文档清单与 `docs.json` 与 v1.0.3 一致（无增删）；17 个文件有修改（extensions.md、mcp.md、codemode.md、cli.md、providers.md +47、llama-cpp.md、models.md、settings.md、themes.md、message-types.md、compaction.md、terminal-setup.md、keybindings.md、environment-variables.md、json.md、tui.md、cli-integration.md） |
| `.pi/` @ v1.2.0 | 七个 prompts（is/pr/wr/deslop/sa/cl/dup；`dup.md` 为本区间新增，查重）；三个 skills（add-llm-provider/interactive-testing/release）；四个 extensions（import-repro/prompt-url-widget/redraws/tps） |
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

re-pin 的**机械替换部分**只改了 362 条外链的 tag 段，并修掉了 6 处**结构性**越界锚点（`durable-env.yml` 三处、`scripts/publish.mjs` 三处）。除此之外另有 **21 处**引用的 v1.0.3 原文在 v1.2.0 已不存在于该文件任何位置——即锚点在范围内但内容已被改写。这一类**必须人工逐条复核**：`verify.mjs` 不核对远端内容，所以它们静默通过所有自动检查，引文却可能与 tag 不符。清单与逐条分类见 [`01-repin-v1.2.0-survey.md`](01-repin-v1.2.0-survey.md)。

21 处的分布：`sdlc-reference/07-release-and-recovery.md`（7）、`sdlc-reference/03-check-pipeline.md`（5）、`repo-harness/07-monorepo-taxonomy.md`（3）、`repo-harness/04-extension-points-map.md`（2）、`sdlc-reference/04-ci-matrix.md`（1）、`sdlc-reference/01-contribution-gates.md`（1）、`repo-harness/06-scope-discipline-and-cost-contracts.md`（1）、`repo-harness/02-terms-and-mental-models.md`（1）。

**本轮的处置**：21 处已逐条对 tag 复核并更正（`_summary-v1.2.0.md` 的"21 处内容性失效锚点更正"指的就是这一项），涉及上述 8 个文件全部；其中 `07-release-and-recovery.md` 的 7 处有 3 处、`07-monorepo-taxonomy.md` 的 3 处，是随本轮 workflows 与包表重做一并修正的。这条例外的意义在于——**机械改 tag 与"锚点仍对得上原文"是两件事**：前者由 `verify.mjs` 兜底；后者它不核对远端内容，只能靠人工对 tag 复核。巡检时若发现某条引文与 tag 不符，先查此处是否漏列，而不是先怀疑 tag 取错。

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

- 正文结构规则由 [`verify.mjs`](../verify.mjs) 强制：严格 UTF-8、恰好一个结尾换行、语料内相对链接与锚点有效、外链只指向 `v1.4.0` 的 Pi 仓库路径（`BASELINE_TAG`，`verify.mjs:26`）、每个目录有 README、SVG 图示的固有尺寸与无障碍元数据、图示与正文引用双向完整。
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

- **0006**（re-pin v1.2.0 轮）：**基线变更** `v1.0.3`（`d78dc83d6`）→ `v1.2.0`（`06a466935`）。上游跨 v1.0.4 / v1.1.0 / v1.2.0 三个 tag。勘察见 [`01-repin-v1.2.0-survey.md`](01-repin-v1.2.0-survey.md)，上游逐项 Discovery 见 `_digested/_change_log/0009-v1.0.3-to-v1.2.0.md`（语料外路径，不建链接——本语料按约定自包含，相对链接不得越出本目录）。本轮先勘察后执行：量化出 24 个文件、362 条外链（347 条带行号锚点）、引用 78 个上游文件，其中 77 个在 v1.2.0 存在、26 个在本区间被改、6 条锚点结构性越界、21 条锚点内容性漂移。执行内容：`verify.mjs:26` 的 `PINNED_EXTERNAL` 与 `:9-10`/`:161` 文案、`verify.test.mjs:48` 的断言字符串同步改为 `v1.2.0`（三者耦合，必须同轮改）；362 条外链 tag 段机械改写；`durable-env.yml` → `env.yml` 三处锚点；`scripts/publish.mjs` 三处越界锚点。随基线变更改写的正文结论：卷三 07 页整节重做（`env.yml` 的触发模型、三个 job、六平台 matrix）、卷三 07 页包表 13→11 行并注明三包删除、卷三 04 页漂移注记改为"改动已并入基线"、卷二 04 页 `env.yml` 与 `ci.yml` 步骤重写、卷二 07 页新增 `env-daemons` 阶段并修正三个后移的行号区间、各卷证据基线段与全部图示来源行。**21 处内容性漂移锚点未改**，登记为上述重审债务。**21 处已于同轮后续提交逐条对 tag 复核并更正**（涉及 8 个文件全部），故本页上方"未解决的重审债务"节记的是登记过程，处置状态见该节末段。

> **本页历轮记录此前止于 0006，缺 0007/0008/0009 三轮**（0007 与 0008 属 `_digested/` 的同步轮次，本语料当时按"基线未变则不记"处理；0009 才是本语料的 re-pin 轮）。补记如下，使本页与 `_digested/_change_log/` 的编号对齐。

- **0007**（v0.86.1 → v1.0.0 轮）：**不涉及本语料**。基线仍为 `v1.0.3`（本语料当时尚未建立）。上游 219 commits、1171 文件、+115,438/−129,148，特征为**删除量历史首次超过新增量**：pi-agent-core 断崖瘦身（单笔 −105,456 行）、durable 接盘持久会话、新增 `mcp`/`codemode` 两包、删除 `session-backends`；v1.0.0 无稳定性承诺声明。记录见 `_digested/_change_log/0007-v0.86.1-to-v1.0.0.md` 与 `_summary-v1.0.0.md`。
- **0008**（v1.0.0 → v1.0.3 轮）：**不涉及本语料**。上游 79 commits、291 文件、+17,127/−4,908（1.0.0 大收缩后第一个纯建设周期）：`npm-shrinkwrap` 删除（改由 install-lock 承接）、`--tools` 语义重做、azure provider 改名、`ExecutionEnv` 4 条接口 Breaking、pi-env 单日成包（当时为 Unreleased）。记录见 `_digested/_change_log/0008-v1.0.0-to-v1.0.3.md` 与 `_summary-v1.0.3.md`。
- **0009**（v1.0.3 → v1.2.0 轮）：**本语料的 re-pin 轮**，即上方 0006 所述执行的技术轮次（0006 是本语料的轮号，0009 是 `_digested/` 的同步编号，两者同指一次上游变更）。上游 139 commits、734 文件、+53,199/−39,113。三个主要结构性变化：① `packages/{client,protocol,server}` 三包整体删除（13 → 11）；② `chord` 经 chord2 重写为 typed host runtime；③ durable 从"任务运行时"扩为"工具执行内核"，且 Storage 失败语义反转。**本轮遗留**：`_digested/` 与 `_faq_on_digested/` 尚有 7 项正文缺口（清单与"页内部分完成"的准确状态见 `0009` 末节"残余事项的真实状态"），其中 `agent/03-Memory/3.1_Compaction.md` 与 `test-strategy/` 两项为空。**更重要的方法论遗留**：本轮的发现机制是读 commit/diff 叙事（`git log → 0009 → _plan → 正文`），因此只覆盖了 0009 提到的对象；区间内另有 96 个新增文件、179 个删除文件未纳入任何清单，需要按"上游区域 × 归属页"的覆盖矩阵补查（见下方"重审触发路径"）。

- **0010**（覆盖矩阵与 Class-3 硬事实复核轮）：**基线不变**（仍钉 `v1.2.0`）。本轮换发现机制：不再沿"`git log` → `0009` → `_plan` → 正文"这条有损链，改为建立**上游区域 × 归属页覆盖矩阵**，再对区间 changeset 做三路筛（Class 1 新增无归属 / Class 2 已删除未标注 / Class 3 修改致硬事实失效）。区间口径 `98d2e1947..v1.2.0`：**139 commit、734 文件、+53,199/−39,113、96 新增、179 删除**。
  - **Class 1（新增无归属）**：机械筛"新增的非测试源文件在语料中零提及"仅得 12 个，且多为次要件（`chord/src/{cell,cluster,declare,publish}.ts`、`codemode/src/{portable.ts,runtime/vm.ts}`、`durable/src/images/{node-worker.ts,photon-wasm.d.ts}`）。按**概念**而非文件名复核：`tool-search`/`BM25`、`images`/`cloudflare`、`systemone`、`LocalExecutionEnv`/PTY、`scan.ts`/`ScanOrder`、`listFiles`、`env-conformance`、`documentRetention` 等大能力**均已被覆盖**。本轮未开新 MD——即 `0009` 所担心的"96 个新增文件无家可归"在概念层不成立。
  - **Class 2（已删除未标注）**：179 个删除文件中 26 个仍被语料点名，但绝大多数是**恰当的历史标注**（`integration/07` 的 v1.2.0 作废块、`4.5_Tool_Bash` 的删除线存档、`0007` 的 pico-v5 迁移表、`10a/10g` 的示例片段 `.pi/extensions/hello.ts`）。**发现 1 处真实缺口**：`agent/04-Harness/4.6_Tool_Edit_Write.md` 的最新横幅停在 v0.84.3，把 v1.0.0 已删除的 `agent/src/harness/tools/` 整树（`edit.ts`/`write.ts`/`file-mutation-queue.ts`/`edit-diff.ts`）当作现役"harness 线"叙述（9 处引用）。已按姊妹页 `4.5` 的既定做法补 v1.0.0 横幅 + 删除线存档。
  - **Class 3（硬事实失效）**：机械复核 67 条行数断言，**MISMATCH 由 32 降至 1**，但**该判定在轮次 0011 被推翻**：余下那条（`07-release-and-recovery.md` 的 `publish.mjs` "108 行 → 64 行"）**并不是正确的历史对比**——`publish.mjs` 在 v0.86.1 / v1.0.0 / v1.0.3 / `98d2e1947` 均为 **110** 行，108 不成立于任何 tag；已于 0011 改为 110。即 0009 的机械扫描当时是"漏报"而非"无误报"。修正涉及 17 个文件，典型：`storage-conformance.ts` 1,584→**1,663**（6 处）、`env-conformance.ts` 511→**633**（4 处）、`faux.ts` 711→**727**、`agent/README.md` 517→**564**、`mcp.md` 248→**272**、`plan-mode/index.ts` 390→**394**、`extensions/loader.ts` 806→**876**、`extensions/runner.ts` 1,286→**1,565**、`skills.ts` 509→**514**、`tools/edit.ts` 461→**220**、`tools/write.ts` 274→**97**、`bash-executor.ts` 156→**146**、`docs/spec.md` 4,601→**5,340**。**行号漂移**（非行数）：`compaction.ts` 的 `CompactionTask` :102→**:110**、`selectCut` :253→**:262**（v1.0.0 时 :102 正确，属漂移而非错锚）；`harness/types.ts` 的 `Extension` :257→**:365**；`skills.ts` 的 `formatSkillsForPrompt` :355→**:358**、`loadSkills` :409→**:414**；`env-conformance.ts` 的 30 秒 watch 锚点 :108→**:124**（`watchCase` 统一给 `30_000`）。另修正 4 处 `file:///Users/bowhead/...` **机器本地绝对链接**为仓库相对路径（破坏可移植性）。
  - **订正中发现的自我订正**：`0009` 与 `_plan-1` 原列的"Claude Haiku 5.5、GPT-6 Luna（分类器）"**两点均不成立**——本区间模型目录**零新增**（`models.generated.ts` 与全部 42 个 `*.models.ts`、`providers/data/*.json` 的 diff 为空）；"Haiku 5.5"只存在于生成器脚本 `generate-models.ts:1094` 的 effort 正则，"GPT-6 Luna"是 chat 模型（`:2700`/`:2756`）且区间前既有。两处已加显式订正说明。同理，`skills.ts` 的 `fileReadTool: "indirect"` 取值经核**在 v1.0.3 已存在**，非本轮新增，我的初稿误判后自行更正。
  - **本页两处遗留方法论判断**：`verify.mjs` 无法发现"链接指向的上游文件已被改名/删除"与"引文与 tag 不符"，上述 Class 2 缺口与 Class 3 漂移都属此类，只能靠对 tag 的静态核对发现；故机械扫描（行数/锚点存在性）必须与**概念层覆盖复核**配对，单靠任一方都会漏。
  - **本轮补充的区域覆盖矩阵结果**（`98d2e1947..v1.2.0` 改动文件数 / 语料引用数）：`packages/coding-agent` 229、`durable` 123、`chord` 85、`ai` 60、`scripts` 50、`codemode` 30、`tui` 29、`server` 29（已删）、`env` 23、`client` 19（已删）、`protocol` 17（已删）、`mcp` 15、`agent` 7、`.github` 3、`telemetry` 2、`evals` 2、`.pi` 2、`nix` 1。**逐文件核对（改动文件是否被语料点名）结果**：`tui` 17/17 源文件已引用（仅测试文件未点名，符合预期）、`ai` 28/35、`scripts` 40/45、`env` 12/16、`mcp` 9/10、`codemode` 18/23、`agent` 4/4、`.github` 3/3、`.pi` 2/2、`nix` 1/1。**未点名者经逐条复核均为次要件或因"按目录整体覆盖"而基名不出现**（例：`scripts/issues/` 的 15 个 `categories/*.md` 中 3 个基名未出现，但整个 `scripts/issues/` 子系统已在 `sdlc-reference/02-issue-diagnosis-and-session-import.md:53-66` 用专节覆盖；`ai` 的 5 个 `*-system-one*` 文件由 `agent/05-Infra/5.1_AI_API_Layer.md:124` 按 API 族覆盖）。**结论：`0009` 所设想的"96 个新增文件无家可归"在概念层与目录层均不成立；本轮新增内容仅 1 处 codex 请求头合并顺序变更（已写入 5.1 的 v1.2.0 横幅）。**

---

## 0011 轮：对抗性独立复核（adversarial verification）

**动机**：0010 的三路筛与行数扫描都是**自证**——用我自己的脚本、对我自己写下的数字。这正是 0009 与 0010 各自漏掉东西的原因（0009 漏了 `4.6`，0010 漏了 `publish.mjs` 与 CI job 数）。本轮改为**委托两个无上下文 subagent 从零核对**，不看既有结论。

### 方法
两个 subagent 各自：只读 `git show v1.2.0:<path>`（钉死 tag，不读工作树）；被明确告知"历史性断言 vs 现役断言"的区分规则，避免把正确的旧值当成错误；被明确警告同名双实现（两处 `serializeConversation`、两处 codemode）必须按语料实际点名的路径核对。要求报告"查了多少条 / 对多少条"，以区分"没发现"与"没查"。

### 结果：共核 157 条硬事实，发现 14 条错误

**A. `agent/03-Memory/3.1_Compaction.md`（58 条中 9 条错）** —— 系统性病症：横幅已按 v1.2.0 重锚，但**正文与部分表格行从未同步**，仍带 v0.84.3/v0.84.4 行号。已修正：

| 位置 | 原值 | 实测 |
|---|---|---|
| L145 `getSummarizationFailure` | `compaction.ts:545` | **:585** |
| L145 `generateSummaryWithUsage` | `:715` | **:696** |
| L145 `generateTurnPrefixSummary` | `:1000` | **:1076** |
| L145 `generateBranchSummary` | `branch-summarization.ts:357` | **:293** |
| L181/L275 `_checkCompaction` | `:2126` / `:2900` | **:2972** |
| L186/L276 `_compactBeforeNextAssistantResponse` | `:543` / `:748`+`877` | **:776**（挂钩 **:905**，`_installAgentNextTurnRefresh` :898） |
| L186 TUI 进度锚点 | `interactive-mode.ts:2162/3197` | 文件已移入 `modes/interactive/`；现役为 `agent_start` **:3415** 与 `turn_start` **:3425** |

**危险模式**：`branch-summarization.ts:357` 与 `compaction.ts:715` **都落在正确函数体内**，抽查会通过，只有精确锚点核对才暴露。这是"看起来对但其实错"的典型。

**B. CI 与环境（4 条错）**
- **`env.yml` 是 4 个 job 不是 3 个**：遗漏了 `tests`（五 OS matrix，`:128-200`），它是 v1.0.3 `env-tests` 的**改名续存体**，v1.0.3 与 v1.2.0 **都存在**。据此推出的 delta"`check`+`env-tests` → `daemons`+`check`+`release-daemons`"因此也是错的。已在 `04-ci-matrix.md`（补完整 bullet + 订正）、`test-strategy/README.md:3`、`_faq_on_digested/07/01_capability_map.md` 三处修正。
- **`test.sh` 是 79 行不是 80**（`01-doctrine-and-isolation.md`）。
- **`publish.mjs` 是 110 行不是 108**（见上方对 0010 判定的推翻）。
- **`env-conformance.ts` 的 v1.0.3 值是 473 不是 511**：511 是**同步起点 `98d2e1947`** 的值。语料其余 v1.0.3 基线一律取 tag，仅此一处取了起点 commit——已改为 473 并注明 511 的出处（3 处：`05-durable-state-and-recovery.md` ×2、`architecture-next/durable-and-storage.md`）。

**C. 自相矛盾类（最高价值）**
- **`test-strategy/README.md:25-26` 的"13 份 Vitest 配置 / 13 个子包"**：v1.2.0 实为 **11 份配置 + 11 个包**。13 是 v1.0.0 旧值。**关键**：`0009:313` 早已记录了这个订正（"'13 份 Vitest 配置'→实际 10 份包级 + 1 根"），但**订正只写进了 changelog，从未落到它描述的 README 上**。任何相信 0010"失配降至 0/1"结论的人都会直接跳过它。已改为 11 并列出全部包名。

**D. 引文与链接精度**
- `is.md` 的 `#L10-L13` 锚点：`Read the issue in full...` 只在 **L10**，L11-13 是它引用的 `gh issue view` 代码围栏，不是独立约束（`02-issue-diagnosis-and-session-import.md`）。
- `_digested/README.md` 的"全库真实残留引用为 0"：唯一命中是 `check-runtime-deps.test.mjs:30` 的测试夹具字符串（构造数据，非活依赖）。**intent 成立但字面不成立**，已加精确限定。

### 目标 E：清偿 0009 登记的两项历史债务
1. **三个 commit hash 全部属实**（此前从未 `git show` 验证）：`cb4375493`（消灭 per-pass 全量扫描，n³→线性，500 held task 12.3s→50ms）、`ea448f454`（索引随 live work 收缩，`indexSizes`）、`eb2fce43d`（等待环拒绝）三者均在区间内且内容相符。**但同一行还有三处错误**，一并订正：① "长 sleep 分片"**不属于这两笔**，它是 `MAX_TIMER_DELAY`（`:54`），由 `da866ada1` 引入；② 等待环拒绝发生在 **`#commitState`（`:1453`）→ `#validateWait`（`:1480-1507`）**，**不是 `runtime.commit()`，且不存在 `runtime.commit()` 这个 API**；③ README"测试示例由 24 个增至 32 个"**不成立**——两端都是 32（v1.0.0 起即 32），本区间只**修改**了 7 个、**零新增**。
2. **`experimental/` 的"先改后删"形态**：0009 的描述**正确**。`7472cda0d` 删除 161 文件/+32/−21,561；净 diff 显示 48 个纯 `D`，但其中 7 个（`client-tui-chat.ts`、`durable/runtime.ts`、`durable/tui.ts`、`vacation/runtime.ts`、`vacation/tui.ts`、`vacation.ts`）确实先被 `e6b9a6af5`/`eba849739` 改过再被删。**语料残留 2 处真实缺口已修**：`agent/04-Harness/4.1_AgentHarness.md`（:79/:99 把 experimental 消费线当现役）与 `harness/02-Boundaries/2.3_agent_lane_skeleton.md`，各补 v1.2.0 横幅。

### 本轮最重要的方法论教训
**口径必须与被核对象对齐，否则复核本身会制造假错误。** 本轮我在 `0007` 的"大删除清单"上犯了一次：用 `git show --numstat <commit>`（非重命名感知）得 109/30,899，据此判定原表的 101/28,721"系统性偏低"并改了它。实际原表用的是 `git diff -M v0.86.1 v1.0.0`（**重命名感知**）——101 已正确排除 **7 个 `R###` 重命名**到 `packages/durable/` 的文件（`tools/edit.ts`、`tools/write.ts` 等），`docs/` 的 64 亦正确排除了 2 个 `.diff` 与 1 个 `.zip`。**原表五行全部正确，是我的复核错了**，已全部回退，并在表下补"口径说明"记录正确方法，避免下一轮重蹈。

**结论**：0010 报告的"Class 3 失配降至 0/1"**过于乐观**——机械扫描只能发现"数字与文件对不上"，发现不了"口径不同""订正未落地""结构性遗漏"。对抗性独立复核是必要的第二层，且必须由**无上下文**的执行者做，否则会继承同一套盲点。

---

## 0012 轮：全域锚点普查发现的 chord2 缺口

**动机**：0011 的两个 subagent 复核的是我**指定给它们的文件**，因此继承了同一份"注意力预算"——没被点名的区域天然不会被查。本轮改用**全语料机械普查**来兜底：把三个目录里所有形如 `` `path/to/file.ts:NN` `` 的锚点全部抽出，对 `v1.2.0` 逐条解析（先按全路径，失败再按唯一后缀匹配以兼容语料"相对包根书写"的既有约定），检出两类硬错：**路径在 tag 上不存在**、**行号超出文件总行数**。

**规模**：1,909 条锚点（已排除语料内部互引与 `_change_log`/`_coverage`），1,353 条当场通过。

### 发现 1（实质）：`chord2` 重写未被 `extensions/2.5` 吸收

`0104fef1e`（`feat(chord): replace the facet and service runtime with the chord2 host runtime`）在 v1.2.0 **整体替换**了 chord 的 facet/service 运行时。`packages/chord/CHANGELOG.md` 1.2.0 的 Breaking Changes 写得很明确：`defineService`、`createFacetHost`、`createRemoteServiceBinding`、`createStaticFacetLoader`、`combineFacetLoaders` 及 remote-service endpoint/provider/error/wire 助手**全部删除**，`packages/chord/src/api.ts` **整个文件消失**；旧的 `defineFacet`/`Facet`/`FacetLoader` 名字保留但语义换新为 typed host（`createHost`/`defineFacet`/`defineRegistry`）。

**为什么 0009–0011 都漏了它**：0009 与 `_plan-1` 确实点过"facet/axis-8 集群 5 个文件"，但那轮标注的是**示例插件 `pi-example-plugin/` 的删除**（`7472cda0d`），不是**运行时替换**。两者是不同的提交、不同的失效面。`extensions/2.5` 因此拿到了一条"示例已删"的横幅就收工了，而它的**主体表格与锚点节全部还在按 v0.85.1 的 chord1 API 描述"chord 的现状"**——文中甚至明确写着"facet 轴的机制未变"。

**已修 3 个文件**：
- `extensions/02-Expansion/2.5_second_axis_facets.md`（改动最大）：新增 v1.2.0 横幅，**否定本文原有的"机制未变"结论**；"pecs vs 现状"对照表 5 行重写（`ServiceMode` 不是"缺 peer"而是**整个概念没了**，`definePeerService`/`onActivate` 同理）；状态表 `packages/chord` 行作废；锚点节 4 条删除线化并补 v1.2.0 现役锚点；例证 3 与"影响"第 4 条同步。
- `composition/10_extension_axes/10i_process_axis.md`：锚点节同样的旧 `types.ts:60/206/227` 与 `api.ts:19/66/70/84/88` 删除线化。
- `integration/07-chord-and-facets.md`：第 7 节表格里"chord 只有 `defineService()`"改为"v1.2.0 后连它也不存在"；另修正 `core/experimental.ts:4` → **`:2`**（该文件是本节少数**幸存者**，v1.2.0 仍在且全文仅 3 行）。

### 发现 2（重要教训）：**一条订正把错误"传染"给了我**

`extensions/2.5` 原有的一行断言是 **"chord 没有 manifest 字段；facet 是 `{ id, setup(env) }`"**。核实后**该断言本身是错的**：chord 有 `uses`——`FacetDefinition.uses?: readonly AnyContract[]`（`chord/src/host.ts:76`），`loader.ts:60` 实际读入 `{ name, setup, uses }`；缺的只有 `provides`。已改正并注明原判断有误。

### 发现 3（方法论边界）：机械普查**能**发现行号越界，**不能**发现"路径存在但语义已换"

本轮唯一的形式化硬错只有 1 条行号越界（`chord/src/types.ts:227`，该文件全文 79 行）。发现 1 之所以被发现，靠的**不是**越界检测，而是我顺着那一条越界锚点**读到了 `api.ts` 不存在**，再追到 CHANGELOG 才看清整片失效。换句话说：**"锚点存在性"检查对"名字保留、语义替换"这类重写是盲的**——`defineFacet` 在 v1.2.0 依然存在、行号也合法，只有读 CHANGELOG 才知道它的意思变了。

> 这与 0009 留下的判断一致并进一步收窄：`verify.mjs` 查不了"链接目标被删/改名"，本轮证明**连"锚点行号普查"也查不了语义替换**。唯一可靠的是**读上游自己的 Breaking Changes 清单**——`packages/*/CHANGELOG.md` 是本区间被语料系统性低估的一手证据源（`packages/chord/CHANGELOG.md` 即为 v1.2.0 新增）。

---

## 0013 轮：清尾——把 0012 留下的"剩余清单"逐项归类

**动机**：0012 结尾我列了一份"还剩什么"，但那份清单本身**只标了面积、没做归类**，所以无法判断哪些是真债、哪些是我自己工具的假阳性。本轮逐项过一遍，**结论是三条真债 + 三条假阳性**。

### 一、先立一条被漏掉的口径：语料有三种路径写法（这是假阳性的根源）

我的锚点普查把 555 条判为"unresolved"，其中**绝大多数不是错**，因为语料有意混用三种写法，而我的解析器只认第一种：

| 写法 | 例子 | 语义 | 处置 |
|---|---|---|---|
| **仓库根相对** | `` `packages/ai/src/types.ts` `` | 相对 repo 根 | 可直接解析 |
| **包根相对** | `` `src/types.ts` ``、`` `docs/spec.md` `` | 相对**当前讨论的那个包** | 需读上下文定包 |
| **加前导斜杠** | `` `/packages/agent/src/agent-loop.ts` `` | 同"仓库根相对"，`agent/02-Runtime` 与 `03-Memory` 的**行文习惯** | **不是错，勿改** |

第三条尤其要记：我一度把 21 处前导斜杠当成 malformed 路径准备批量修，核实后发现它们去掉斜杠**全部指向真实文件**，且集中出现在 `2.1`/`2.2`/`2.4`/`2.6`/`2.7`/`3.1`–`3.4`——是**一贯的风格而非笔误**。批量"修正"会制造 21 处无意义 diff。

> **给后续审计的规则**：`` `src/xxx.ts` `` 这类**不构成**缺陷证据；只有当你**先确定它属于哪个包**、再核实该包下无此文件时，才算缺陷。把这条写进 `_coverage`，是为了避免下一轮重走我这次的 555 条假阳性。

### 二、三条真债（全部已修）

**债 1：`harness/02-Boundaries/2.3_agent_lane_contract_first.md` —— 9 条 v1.0.0 锚点在 v1.2.0 全部错位**

该页基线是 v1.0.0，**从未对 v1.2.0 复核**。`packages/durable/src/harness/harness.ts` 从 v1.0.0 的 409+ 行长到 v1.2.0 的 **470 行**，其间插入的代码让 9 条锚点全部漂移：

| 符号 | 原引（v1.0.0） | v1.2.0 实测 |
|---|---|---|
| `HarnessImpl` | `:164` | **`:169`** |
| `export type Harness` | `:405` | **`:443`** |
| `export const Harness` | `:407` | **`:445`** |
| `Harness.open()` | `:409` | **`:447-451`** |
| `Conversation.agent()` | `:91` | **`:95`** |
| `Conversation.configure()` | `:95` | **`:99`** |
| `taskGraph()` | `:296` | **`:307`** |
| `watchTaskGraph()` | `:300` | **`:311`** |
| `AgentDoc`（agent.ts） | `:36` | **`:43`** |
| `resolveSettings`（agent.ts） | `:47` | **`:57`** |
| `createAgentSession()`（core/sdk.ts） | `:175` | **`:191`** |

同页**第 69 行"消费者清单"**仍在把 `experimental/durable/runtime.ts:138`、`experimental/vacation/runtime.ts:135`、`experimental/session-worker.ts:773/784`、`test/fixtures/faux-session-worker.ts:24`、`experimental/durable/harness-setup.ts` 当现状引用——而该页**第 13 行的横幅早已宣布这四条路径全部作废**。这是**同一页内横幅与锚点节自相矛盾**（0021 型缺陷的又一例，与 `3.4` 同型）。5 条路径逐条对 tag 确认缺失；例证 2 的"消费仍限 experimental"结论也随之不成立（v1.2.0 `src/core/` 对 pi-durable 零引用）。

**债 2：`agent/03-Memory/3.3_Token_Estimation.md` —— 整篇停在 v0.84.2**

`0007`/`0009` 都没点到它。它引的 `packages/agent/src/harness/compaction/compaction.ts` 随 harness 于 v1.0.0 删除，**现役实现分两处**：`packages/coding-agent/src/core/compaction/compaction.ts`（1,119 行）与 `packages/ai/src/utils/estimate.ts`。已补 v1.2.0 横幅并给两处现役锚点；原行号表标注为 v0.84.2 存档。

**债 3：`agent/03-Memory/3.4_Session_Tree.md` + `agent/04-Harness/README.md`**

- `3.4` 的"源码位置"块两条 agent 侧路径均已删除；`SessionTreeEntry`/`LeafEntry` 在 v1.2.0 **全树零命中**（`getLeafEntry()` 是 method 名不是类型）。该页**同样存在横幅说已删除、锚点块仍当现状**的自相矛盾。
- `04-Harness/README.md` 的路径清单四条（`agent-harness.ts`、`harness/types.ts`、`harness/skills.ts`、`harness/system-prompt.ts`）**全部不存在**；已逐条删除线化并给出替代（`coding-agent/src/core/skills.ts`、`core/system-prompt.ts`、`durable/src/harness/types.ts`；`agent-harness.ts` 无同名替代）。

### 三、三条假阳性（**不改**，记录以免下轮重查）

1. **555 条 unresolved 中的 269 个路径**：绝大多数是"包根相对"写法（见上表），非缺陷。
2. **`/Users/bowhead/...` 绝对路径 11 处**：`_faq_on_digested/06_pi_vs_dsh/` 与 `13_recorded_session_snapshots/` 是在**跨仓库比对**（对象是另一个 worktree `deepseek-harness`），绝对路径**必要且已注明**；`composition/5_agents_md.md` 等自指本机 checkout 亦属语料一贯做法。**不改**。
3. **70 个无 `v1.2.0` 字样的文件**：逐类排查后无新债。`_change_log/0002`–`0008`、`_summary-*`、`_plan-*` 是**历史断面**，按定义不该有 v1.2.0 字样；`composition/` 方法论页不含版本化事实。对 22 个**含 ≥3 条真锚点**的 topic 页做了逐文件失败率统计：**`DELETED` 一栏全为 0**——即 0012 找到的 chord2 那类"整片运行时被换掉"的缺口，在这 22 页中**不存在**。

### 三点五、补记：表格层的同型缺陷（在写完上面三段后才查出）

`3.3` 与 `3.4` 两页各有一张**自称「以下均为硬事实」的行号表**，而两张表的行号都指向**已删除**的 `agent/src/harness/**`。前面我只改了「源码位置」块，**表本身没动**——于是这两页变成「横幅说已删、锚点块说已删、**表格仍说硬事实**」的三方矛盾。已补：

- `3.3`：表头加整体作废声明，并写明旧表指的是 agent 侧 `compaction.ts`（**v0.84.4 实测确为 848 行**，与原文一致——所以错的不是行数而是**文件已不在**），现役为 coding-agent 侧 1,119 行版 + ai 侧 `estimate.ts`，两者行号与旧表均不对应。
- `3.4`：同样加整体作废声明。`LeafEntry` 的措辞也已收紧——我最初写「`SessionTreeEntry` 与 `LeafEntry` 全树零命中」，但 `LeafEntry` **作为子串**在 method 名 `getLeafEntry()` 里有 4 处命中；已改为「作为**类型名**零命中，唯一命中是 method 名子串，不是本文所述类型」。**这正是我自己前几轮反复抓的那个毛病：把「我没找到」说成「不存在」。**

### 四、方法学结论（本轮最该记住的一条）

0012 我担心"机械普查对语义替换是盲的"，于是 0013 补了**逐文件失败率**这个中间粒度指标。它的价值在于**能廉价地证伪**：22 个高风险文件一次跑完，`DELETED=0`，我就获得了"这片区域没有第二处 chord2"的**正面证据**，而不是继续凭"没被点名就没查"的运气。**但同一指标也放过了 `2.3`/`3.3`/`3.4`/`README`**——它们的路径**全部解析成功**，错的是**行号**。所以真正抓住它们的是**符号级锚点核对**（抓 `2.3` 的 9 条），而不是路径存在性。三层指标各有盲区，缺一层就会漏：

| 指标 | 抓得到 | 抓不到 |
|---|---|---|
| 路径存在性 | 文件被删/改名 | 行号漂移、语义替换 |
| **逐文件 `DELETED` 失败率** | **整片运行时被换（chord2 型）** | **行号漂移** |
| 符号级锚点核对 | 行号漂移（2.3 的 9 条） | 语义替换（名字还在） |

---

## 0014 轮：越界锚点定案——先前"仅 1 条"的统计是错的

**动机**：0013 结尾我报的是"还剩 1 条行号越界"。复核后发现**这个数字本身是错的**——我的扫描器对同一路径有多个候选文件时，只要**任一**候选够长就放行，于是大量"bare filename 指向了同名的错误文件"被静默判过。改成**全部候选都太短才算越界**后，真实数字是 **4**（其中 2 条是我的注记）。这又是一次"我的工具给了我虚假的安心"。

### 逐条定案

| 位置 | 锚点 | 判定 |
|---|---|---|
| `1.4_Extension_System.md:149` | `virtual-modules.ts:59` | **真错，已修** → **`:14`** |
| `1.3_Tool_Registry.md:132` | `agent/src/index.ts:146` | 合法历史（见下） |
| `2.5_second_axis_facets.md:105` | `chord/src/types.ts:227` | 合法历史（我 0011 的注记在引述旧值） |
| `integration/07-chord-and-facets.md:211` | `commands.ts:94` | 合法历史（"本节整体作废"横幅内引述旧值） |

**唯一真错**：`virtual-modules.ts` 在 v1.2.0 **实测 38 行**，`:59` 根本不存在；`VIRTUAL_MODULES` 实在 **`:14`**。已订正并注明原值越界。这条错得有意思——它不是"文件被删导致锚点失效"，而是**从一开始就指错**（该文件从未有过 59 行）。

**三条合法历史的核实方法**（这三条**不能凭"目标文件现在没有"就算错**）：

- `1.3:132` 引 `applyShellOutputUpdate` + `agent/src/index.ts:146`。该节标题已写「**v0.85.1 新增；v1.0.0 已删除，存档**」。回查 v0.85.1：`index.ts` 当时 **152 行**，其 **`:146` 正是** `export { applyShellOutputUpdate } from "./harness/utils/output-capture.ts";`，`output-capture.ts` 也确实存在（`applyShellOutputUpdate` 在 `:153`）。**引文在它的时代完全准确**，且区块已标注为存档——**不改**。
- 另两条是页内横幅/注记**明确标注为已作废**的历史引述。

> **由此得出一条判据**（补进语料维护规则）：**"锚点越界"本身不是缺陷证据**。判错前必须先问两个问题——① 该锚点所描述的**时代**里它是否成立？② 该锚点是否处在**已标注为存档/作废的区块内**？两条都为"是"即合法历史。我 0012/0013 一度按"当前 tag 查不到即缺陷"批量判定，**这个口径会误伤整个存档区块**。

### 修正后的最终计数口径

- **真缺陷越界：0**（`virtual-modules.ts:59` 已修）。
- 剩余 3 条越界**全部为已标注的存档引述**，属**正确实践**，不再计入债务。
- 先前报的"1 条"既不准确（漏计 3 条），也**把 2 条合法历史算成了债**——两个方向的错都有。

---

## 0015 轮：re-pin v1.4.0

**基线变更**：`v1.2.0`（`06a466935`）→ **`v1.4.0`**（`4a080252f`），跨 v1.3.0（`71023aec1`）。上游 144 commit、477 文件、+33,481/−10,733。勘察见 [`02-repin-v1.4.0-survey.md`](02-repin-v1.4.0-survey.md)，Discovery 见 `_digested/_change_log/0010-v1.2.0-to-v1.4.0.md`（语料外路径）。

**机械部分**：`verify.mjs` 的 `BASELINE_TAG` 从硬编码正则改为常量（`v1.4.0`），369 条外链 tag 全部替换；对 79 个被引上游路径在 `git show v1.4.0:` 下逐条校验**存在性**与 `#L` 行号界，结果 0 缺失、0 越界。区间内被改且被引用的文件共 23 个，逐条复核引文。

**内容层修正**（详见勘察页）：

- pinned-deps 规则扩到内部 registry 依赖（`AGENTS.md:45` + `check-pinned-deps.mjs` 删除豁免）；
- `.pi/skills` 3→4，新增 `github-work`（把 issue/PR/收尾路由到 `is.md`/`pr.md`/`wr.md`）；
- chord 不再是零 Pi 依赖（`pi-telemetry`），telemetry 成 ai/chord/durable 的横切层；
- entry-graph 预算：`ai ./models` 15→20（新增 `allow`）、`durable` 根 62→73；
- release 第 3 步从"`--if-stale` 刷新 pin"改为"pin 最新目录 + hydrate + `build:offline`"，失败阻塞发布；release.mjs 行号整体下移（最大 +43）；
- 模型目录发布新增 `check-model-catalog-compat`（对最新 release 的 pi-ai 跑 tsc）与 `MINIMUM_PI_VERSION`（1.2.1）；
- `check` 首项是 `node scripts/biome-check.mjs --write`（不是 biome 直调）。

**验证**：`node verify.mjs` 40 文件全部规则通过；`node --test verify.test.mjs` 通过。

**残留**：语料未覆盖 `AGENTS.md:28` 的 `providers/data` gitignore 规则本身（只在 01 页补了一句）；`_digested` 与本语料无关的存量锚点债务不在本轮范围。

## 0016 轮：claim-first 重构与证据台账

机制页正文不再携带行号锚点；README/00-index 允许基线版本声明。引用统一为 `[E###]`，指向 `_evidence/render.md` 的对应标题。坐标、引文与核验时间在 `_evidence/claims.json`。

**同步流程（本目录）**

1. 改 `_evidence/corpus.json` 的基线 tag/commit。
2. `node _digested/_evidence/tools/verify-evidence.mjs --corpus _pi_extension_agent_ready_development --repo .`：失败项 = 该 tag 里 locator 或引文变了，逐条改台账。
3. `node _digested/_evidence/tools/render-evidence.mjs --corpus _pi_extension_agent_ready_development` 重生成附录。
4. 正文**只在某条 claim 被证伪时**才改；纯坐标移动不产生正文 diff。
5. `node _digested/_evidence/tools/check-prose.mjs --repo .` 与 `node verify.mjs` 收尾。

`_faq_on_digested` 同构（`--corpus _faq_on_digested`，台账在 `_faq_on_digested/_evidence/`）。`_digested` 仍按“增量改写”处理：正文 `#L` 已清零，但不强制去除历史版本号。
