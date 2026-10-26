# 语料重构执行计划（claim-first + 证据台账）

目标：正文只写论断，版本坐标进台账；版本升级只改台账，不改正文。

## 已定方案

- 共享台账：`_digested/_evidence/`（`_digested` 与 `_faq_on_digested` 共用；FAQ 先保留自己的条目，不依赖 `_digested` 的 claim id）。
- 独立台账：`_pi_extension_agent_ready_development/_evidence/`（该语料要求可整目录拷走）。
- `_digested`：不做全量迁移，只"新增止血 + 增量改写"；新行禁止裸 `path:NNN`。
- 正文写法：`[E###](../_evidence/render.md#e###)`；不写 `#L`、不写版本号、不写行数。
- 校验：`verify-evidence.mjs`（维护者，需 git tag）；`verify.mjs`（读者，离线结构校验）。

## 状态

计划文件位置：`_digested/_evidence/PLAN.md`（不在 extension 语料内，避免 verify.mjs 把示例锚点当真链接）。

| 阶段 | 内容 | 状态 |
|---|---|---|
| P0 | 提交 v1.4.0 同步为回滚点（`c5a3938a7`） | 完成 |
| P1 | schema、verifier、renderer、migrate 工具、共享台账骨架 | 完成 |
| P2 | 试点 `repo-harness/01`：22 条 / 32 源，v1.4.0 全绿 | 完成 |
| P3 | extension 语料其余 28 页迁移 | 进行中 |
| P3.5 | FAQ 六个热点页（404 锚点）迁移 | 待开始 |
| P4 | 流程切换 + lint（正文禁 `#L`/版本） | 待开始 |
| P5 | v1.2.0→v1.4.0 重放度量 | 待开始 |

## P3：extension 语料逐页清单

按锚点密度排序（括号内为 `#L` 数）：

- [x] `sdlc-reference/07-release-and-recovery.md`（48）→ E023–E033
- [ ] `sdlc-reference/04-ci-matrix.md`（33）
- [ ] `sdlc-reference/05-testing-layers.md`（28）
- [ ] `sdlc-reference/03-check-pipeline.md`（26）
- [ ] `sdlc-reference/02-issue-diagnosis-and-session-import.md`（25）
- [ ] `sdlc-reference/01-contribution-gates.md`（24）
- [ ] `sdlc-reference/06-review-and-human-role.md`（23）
- [ ] `repo-harness/04-extension-points-map.md`（20）
- [ ] `repo-harness/05-session-inspectability.md`（17）
- [ ] `repo-harness/02-prompts-as-procedural-contracts.md`（15）
- [ ] `repo-harness/00-index.md`（11）
- [ ] `repo-harness/07-monorepo-taxonomy.md`（11）
- [ ] `repo-harness/03-repo-skills.md`（10）
- [ ] `repo-harness/06-scope-discipline-and-cost-contracts.md`（9）
- [ ] `extension-development-model/02-terms-and-mental-models.md`（11）
- [ ] `extension-development-model/01-new-extension-repository.md`（9）
- [ ] `extension-development-model/00-index.md`（8）
- [ ] 其余无锚点页：清版本句与 `_evidence` 指针

每页步骤：

1. `node _digested/_evidence/tools/migrate-anchors.mjs <page> --tag v1.4.0 --repo . > /tmp/candidates.json`
2. 审阅候选，合并同段锚点，写 `claim`（一句中文），必要时改 `locator.kind`。
3. 写入 `_pi_.../_evidence/claims.json`（续号）。
4. 改写正文：`[..](#L..)` → `[E###](../_evidence/render.md#e###)`；删除版本与行数断言。
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

FAQ 正文引用：`[E###](../../_digested/_evidence/render/faq.md#e###)`；render 输出到 `_digested/_evidence/render/faq.md`。

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
