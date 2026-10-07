# 语料维护：基线、证据范围与重审

## 钉定基线

- 仓库：`earendil-works/pi`
- 基线：release tag `v1.0.3`，commit `d78dc83d6`（`Release v1.0.3`）。
- 这是本轮核验版本，不是永久前提。Pi 处于活跃开发期，接口与主仓制度都会演进；更新版本时应逐条复核并改写过时结论，不能只替换链接。

## 本轮已核验的证据范围

以下来源在本轮挖取时逐项对 tag 核验过存在性与内容：

| 来源 | 核验内容 |
|---|---|
| `packages/coding-agent/docs/` @ v1.0.3 | extensions.md（274 行）、packages.md、skills.md、prompt-templates.md、sdk.md、session-format.md 及其余文档清单；与 HEAD 逐文件 diff |
| `.pi/` @ v1.0.3 | 六个 prompts（is/pr/wr/deslop/sa/cl）、三个 skills（add-llm-provider/interactive-testing/release）、四个 extensions（import-repro/prompt-url-widget/redraws/tps） |
| `.github/workflows/` @ v1.0.3 | 12 个工作流的存在性与触发条件（ci、durable-env、nix、npm-audit、issue-gate、pr-gate、approve-contributor、issue-analysis、build-binaries、publish-model-catalog、issue-triage-labels、remove-inprogress-on-close） |
| `packages/` @ v1.0.3 | 13 个包的清单与角色 |
| `scripts/` @ v1.0.3 | check 管线脚本的存在性（check-entry-graphs、check-runtime-deps、check-pinned-deps、check-lockfile-commit、generate-coding-agent-install-lock、coding-agent-consumer 等） |
| `packages/ai` 导出面 | exports map 含 `./compat`；`registerFauxProvider`、`streamSimple` 从 compat 导出（独立扩展仓可复用确定性测试的关键事实） |
| `packages/coding-agent/test/suite/` @ v1.0.3 | faux harness 与回归测试的组装方式，作为证据分层的参考实现 |

## 已知基线漂移（HEAD 相对 v1.0.3）

语料撰写时工作树 HEAD 在 v1.0.3 之后。已发现的机制漂移，re-pin 时逐条复核：

- 工作流改名与拆分：v1.0.3 为 `.github/workflows/durable-env.yml`（`durable-env-*` 分支/手动触发，check + 五 OS matrix，无 daemon 构建、无 Rust 步骤）；HEAD 已改名 `env.yml`（改为路径触发）并拆出可复用的 `env-daemons.yml`。
- `ci.yml`：HEAD 在 Check 与 Test 之间新增 "Build the pi-env daemon" 步骤，tag 无。
- `build-binaries.yml`：HEAD 新增 env-daemons job，publish-npm 的 needs 从仅 stage-github-release 扩为 [stage-github-release, env-daemons]。
- 根 `package.json`：HEAD 的 build 链插入 `packages/env`；check 脚本组成 tag 与 HEAD 一致。
- `extensions.md` 的 `prepareLoadout` 段落有一行文档扩写（v1.0.3 之后），不影响本语料引用的其它行号锚点；`mcp.md`、`codemode.md` 也有小幅文档修改（见卷三 04 页漂移注记）。
- 其余被引文件（三个 gate 工作流、nix/npm-audit/publish-model-catalog/issue-analysis、CONTRIBUTING、`.pi/` 内容、test.sh、全部 check/release/publish 脚本、测试套件、evals）tag 与 HEAD 逐字节一致（由并行研究逐文件核对）。

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

- 正文结构规则由 [`verify.mjs`](../verify.mjs) 强制：严格 UTF-8、恰好一个结尾换行、语料内相对链接与锚点有效、外链只指向 `v1.0.3` 的 Pi 仓库路径、每个目录有 README、SVG 图示的固有尺寸与无障碍元数据、图示与正文引用双向完整。
- 每卷的图示由该卷自己的 `figures/README.md` 清单管理（文件与正文 owner 对应），不跨卷共享图。
- 陈述四分类（运行时事实／主仓要求／扩展仓建议／仓库自定）由正文维护，机器不可校验。

## 验证要求

- 修改本目录内容后，在语料目录运行 `node verify.mjs`（或从仓库根运行 `node _pi_extension_agent_ready_development/verify.mjs`）。
- 修改验证规则后运行 `node verify.test.mjs` 确认接受与拒绝条件仍然成立。
- 证据复核（对 tag 重核事实）与结构验证是两件事：后者通过不代表事实仍然准确。

## 历轮记录

- **0001**（初始轮）：钉定 `v1.0.3`。建立三卷结构（扩展开发模型 / SDLC Reference / Development Harness）、`_coverage` 与 verify 自举。卷一三页与根 README 由主研究产出；卷二（准入、诊断接续、check 管线、CI 矩阵、测试分层、评审、发布恢复、适用边界）与卷三（agent 入口规则、prompts、skills、扩展点地图、会话可检查性、范围纪律与成本合同、分类学）由并行研究对 tag 核验产出。卷二共审计 196 个行号锚点，修正 6 处错锚。
- **0002**（审阅与图示轮）：全语料系统性审阅（结构、逻辑、自洽）；概念对齐——以 Pi 原生词（resource、cost contracts、core is minimal、review buffer）替换外部语料来源的组织词，卷三 06 页由「铺装路」重构为「范围纪律与成本合同」；新增七张 SVG 图示（每卷 figures/README.md 清单管理），verify 扩展 SVG 规则与图示引用完整性检查，verify.test 增补图示负例。
