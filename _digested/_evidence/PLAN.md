# 语料重构执行计划（claim-first + 证据台账）

目标：正文只写论断，版本坐标进台账；版本升级只改台账，不改正文。

## 已定方案

- 共享台账：`_digested/_evidence/`（`_digested` 与 `_faq_on_digested` 共用；FAQ 先保留自己的条目，不依赖 `_digested` 的 claim id）。
- 独立台账：`_pi_extension_agent_ready_development/_evidence/`（该语料要求可整目录拷走）。
- `_digested`：不做全量迁移，只"新增止血 + 增量改写"；新行禁止裸 `path:NNN`。
- 正文写法：``[E###]`（指向 render.md 的对应标题）`；不写 `#L`、不写版本号、不写行数。
- 校验：`verify-evidence.mjs`（维护者，需 git tag）；`verify.mjs`（读者，离线结构校验）。

## 状态

计划文件位置：`_digested/_evidence/PLAN.md`（不在 extension 语料内，避免 verify.mjs 把示例锚点当真链接）。

| 阶段 | 内容 | 状态 |
|---|---|---|
| P0 | 提交 v1.4.0 同步为回滚点（`c5a3938a7`） | 完成 |
| P1 | schema、verifier、renderer、migrate 工具、共享台账骨架 | 完成 |
| P2 | 试点 `repo-harness/01`：22 条 / 32 源，v1.4.0 全绿 | 完成 |
| P3 | extension 语料其余 28 页迁移 | **完成**（正文 #L=0；126 条 / 360 源） |
| P3.5 | FAQ 六个热点页（404 锚点）迁移 | 待开始 |
| P4 | 流程切换 + lint（正文禁 `#L`/版本） | 待开始 |
| P5 | v1.2.0→v1.4.0 重放度量 | **完成**：bump 到 v1.3.0 时正文 0 文件变化；stale 仅 9（extension）/29（FAQ）条真实变更 |
| 加项 | `_digested` 正文 `#L` 清零（34 条，地址解析到各自 render） | 完成 |
| R11-P0 | v1.5.0 代码合入（`git merge --no-ff v1.5.0` → `82fa18e67`，0 冲突） | 完成 |
| R11-P1 | Discovery：`_change_log/0011` + `_summary-v1.5.0` | 完成 |
| R11-P2 | 三台账重钉到 v1.5.0（`_digested` 2→0、extension 32→0、FAQ 51→0 stale） | 完成 |
| R11-P3 | verifier 新增 `pin` locator（版本 pin 不再随 release 失效） | 完成 |
| R11-P4 | 16 处内容层新增/重写（含新建 `architecture-next/chord-v2.md`） | 完成 |
| R11-P5 | 本轮流程与工具更新（本表、`_coverage/00-corpus-maintenance.md`、`README.md` 基线块） | 完成 |
| R12-P1 | 删页首基线横幅 13 处（7 种格式变体），`README.md` 成为唯一声明源 | 完成 |
| R12-P2 | 正文版本补注去标签（`（v1.5.0 为 N 行）` → `（N 行）`）；`check-prose.mjs` 新增页首横幅守卫 | 完成 |
| R12-P3 | 页首变更记录沉降到 `## 版本史`（39 页），内容逐字保留 | 完成 |
| R12-P4 | 版本史移到页末（35 页）/ 保留页首（6 页，含失效警告） | 完成 |
| R12-P5 | 稽核发现 4 处自己在 R12-P1/P2 中丢失的事实，全部找回 | 完成 |
| R12-P6 | 四条常设规则 + 引用块结构规则写入本文件；放置规则写入 `_coverage/00-corpus-maintenance.md` | 完成 |

### 两条新的常设规则（v1.5.0 轮确立）

1. **新增面不进台账，只进正文。** 台账（`render.json`/`claims.json`）记的是"现值断言"，靠 git tag 解析；新包（如 v1.5.0 的 `packages/schema`）或新子路径（`chord/next`）**没有旧断言可失效**，所以重钉时必然是 0 stale——这不代表没变化。新面必须在正文写，台账不必为它新增条目。本轮实测：v1.5.0 增量 211k 行，三台账盲跑只 stale 85 条（22.8%），因为绝大部分增量落在新面。
2. **引文含版本号的，截断到版本号之前，再用 `expect` 断言版本。** 例：`"@earendil-works/pi-schema": "1.5.0"` 这类版本 pin 若整句入引文，每次 release 都会 stale。改用 `locator: {kind: "pin", key: "...", at: "1.5.0"}`（不写 `at` 则只校验"该 key 存在且有版本值"），正文引文写到冒号为止。v1.5.0 轮把 `E101` 的三处行内版本引文全部转成了 pin 源。

### 四条新的常设规则（版本号归并轮确立）

这一轮的目标是消除"每次 bump 改上百个文件的同一串字符"，而这轮自己也犯了同类错误——消噪的动作本身制造了新的丢失。以下四条都来自实际事故。

1. **版本号只在两处声明。** `_digested/README.md` 的基线块 + 各语料 `_evidence/corpus.json` 的 `baseline.tag`。页首横幅、正文"当前基线"一律不许出现；`check-prose.mjs` 已加守卫（`_digested/_evidence/tools/check-prose.mjs:63`，只拦"当前基线/本页基线"，不拦研究溯源）。
2. **删版本号时按标识符集合比对，不按行文本比对。** 删一个 `v1.5.0` 看起来安全——句子还在；同一句里的 commit hash、轮次编号、成组细节会跟着一起没。本轮四例真实丢失全靠这个办法抓回来：`source` export 条件、`PLANNING.md:476` 等 6 个标识符、"标注约定"整段、两个 `_change_log` 链接。做法：改前改后各抽**反引号标识符 / 3 位以上数字 / 文件路径**三个集合，差集非空就人工确认。
3. **改标题前先查入站锚点。** `grep -rn '#<slug>'`。本轮把 `### 参数 schema：…（v1.5.0）` 去掉版本号，立刻断了 6 处入站链接；`### v1.5.0 的四组重写` 断了 4 处。两个标题已还原——**带入站锚点的标题不改名**，需要去版本号时改引用方，别改被引方。
4. **不要把成组内容"压缩成表格"。** 表格看起来更整齐，但容易丢具体标识符。`integration/07-chord-and-facets.md` 的五段增补被我转成两列表格后丢了 `Ref`/`chord/sqlite`/`MutableReplicatedState` 等，已整块还原为原文。要降噪就原样沉降到 `## 版本史` 下，不改写。

**版本史的位置：** 纯增量记录移到页末；含"整页已失效/整体作废"警告的留在页首——读者落到失效页必须**先**看到警告，不能让他滑到底才知道。（本轮 35 页移到页末，6 页保留页首。）

**批量清理时不得动脚本没碰过的行。** 尤其引用块里的空行与单独 `>`：它们在 Markdown 里是**结构**不是空白。以下为 `marked` 实测输出：

| 写法 | 渲染结果 |
|---|---|
| `> 段一` + `> 段二`（紧邻） | 一个块，**一个段落**，软换行 |
| `> 段一` + `>` + `> 段二` | 一个块，**两个段落** ← 这才是“同块内分段” |
| `> 段一` + 空行 + `>` + 空行 + `> 段二` | **三个块**，中间空块 |
| `> 段一` + 空行 + `> 段二` | **两个独立块** |

本轮两次踩坑，两次都已回滚（核查确认那些符号在改动前就存在，是有意的分组）：① 把 72 个文件里既有的单 `>` 行当空行删了；② 用 `>` 反向替换了 24 处引用块内空行。lint 的 MD028（blockquote 内空行）是 **advisory，不要“修”**。

脚本层面的硬规则：**只删自己刚刚清空的那一行**。删之前记录该行原内容，删之后比对全文——变动行数必须等于预期数，否则整体回滚后重做。

**上游合并后必须重跑模型数据生成：** `packages/ai/src/providers/data/` 被 gitignore（`.gitignore:11`），`git merge` 不会刷新它。不跑 `npm --prefix packages/ai run hydrate-model-data`（=`node catalog/generate.ts --strict --data-only`）会导致 `tsc --noEmit` 报模型 id 不存在（本轮实测：`gpt-6.1-terra` 从 44 个 openai 模型里消失，测试文件 TS2345）。

## P3：extension 语料逐页清单

按锚点密度排序（括号内为 `#L` 数）：

- [x] `sdlc-reference/07-release-and-recovery.md`（48）→ E023–E033
- [x] `sdlc-reference/04-ci-matrix.md`（33）→ E034–E041
- [x] `sdlc-reference/05-testing-layers.md`（28）→ E042–E047
- [x] `sdlc-reference/03-check-pipeline.md`（26）→ E048–E056
- [x] `sdlc-reference/02-issue-diagnosis-and-session-import.md`（25）→ E065–E071
- [x] `sdlc-reference/01-contribution-gates.md`（24）→ E057–E064
- [x] `sdlc-reference/06-review-and-human-role.md`（23）→ E072–E082
- [x] `repo-harness/04-extension-points-map.md`（20）→ E083–E087
- [x] `repo-harness/05-session-inspectability.md`（17）→ E088–E091
- [x] `repo-harness/02-prompts-as-procedural-contracts.md`（15）→ E092–E099
- [ ] `repo-harness/00-index.md`（11）
- [x] `repo-harness/07-monorepo-taxonomy.md`（11）→ E100–E105
- [x] `repo-harness/03-repo-skills.md`（10）→ E106–E110
- [x] `repo-harness/06-scope-discipline-and-cost-contracts.md`（9）→ E111–E114
- [x] `extension-development-model/02-terms-and-mental-models.md`（11）→ E115–E121
- [ ] `extension-development-model/01-new-extension-repository.md`（9）
- [ ] `extension-development-model/00-index.md`（8）
- [ ] 其余无锚点页：清版本句与 `_evidence` 指针

每页步骤：

1. `node _digested/_evidence/tools/migrate-anchors.mjs <page> --tag v1.4.0 --repo . > /tmp/candidates.json`
2. 审阅候选，合并同段锚点，写 `claim`（一句中文），必要时改 `locator.kind`。
3. 写入 `_pi_.../_evidence/claims.json`（续号）。
4. 改写正文：`[..](#L..)` → ``[E###]`（指向 render.md 的对应标题）`；删除版本与行数断言。
5. `node _digested/_evidence/tools/render-evidence.mjs --corpus _pi_...`
6. `node _digested/_evidence/tools/verify-evidence.mjs --corpus _pi_... --repo .`
7. `cd _pi_... && node verify.mjs`
8. 提交（单页或小批）。

## P3.5：FAQ 清单

- [ ] `12_pi_philosophy/sdlc_evidence.md`（232）
- [ ] `12_pi_philosophy/structure_quality_evidence.md`（105）
- [ ] `12_pi_philosophy/review.md`（34）
- [ ] `13_recorded_session_snapshots/answer.md`（13）
- [ ] `13_recorded_session_snapshots/research.md`（11）
- [ ] `12_pi_philosophy/research.md`（9）
- 其余 68 页：只清基线句与失效锚点。

FAQ 正文引用：``[E###]`（指向 FAQ render 的对应标题）`；render 输出到 `_digested/_evidence/render/faq.md`。

## P4：流程与 lint

- `verify.mjs` 增加规则：正文（`_evidence/` 与 archive 区块除外）出现 `#L\d` 或 `v\d+\.\d+\.\d+` 即失败。
- `_coverage/00-corpus-maintenance.md` 的同步步骤改为：改 `corpus.json` → 跑 evidence → 只修台账。
- 新增稳定性检查：对比两个 tag 下同一语料的正文 diff；正文 diff 非空时要求写明被证伪的 claim。

## P5：度量

在重构后的语料上重放 v1.2.0→v1.4.0：

- 目标：extension 正文 diff ≤5 文件 / ≤50 行；FAQ 正文 diff 0（仅台账/附录变化）。
- 记录实测值到本文件。

## 注意

- 不要删除证据；短引文保留在台账，长引文转述。
- archive 区块（`<!-- archive -->` 标记）豁免 lint。
- 台账 id 每语料独立编号；render 按页分组，标题 `### E###` 以便 `#e###` 跳转。
