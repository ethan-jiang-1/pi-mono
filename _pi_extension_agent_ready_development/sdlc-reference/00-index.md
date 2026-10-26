# 00 索引：按问题选页

本页回答两个问题：遇到具体问题读哪页；从 v1.4.0 一手机制看，pi-mono 在研发流程上表现出哪三条组织立场。全部机制事实独立依据 [`earendil-works/pi`](https://github.com/earendil-works/pi/tree/v1.4.0) tag `v1.4.0`（commit `4a080252f`）的一手来源（workflows、scripts、`package.json`、`CONTRIBUTING.md`、`.pi/` 内容），不依赖二手分析。

## 按问题选页

| 页 | 适用问题 | 新手可暂忽略 |
|---|---|---|
| [01-contribution-gates.md](01-contribution-gates.md) | 我想给 pi-mono 报 issue/提 PR，准入条件是什么？gate 工作流实际检查什么？`lgtmi`/`lgtm` 差别？ | 只开发自己扩展仓、不参与 pi-mono 时可整页暂缓 |
| [02-issue-diagnosis-and-session-import.md](02-issue-diagnosis-and-session-import.md) | `/is` 诊断合同是什么？CI 里怎么跑 pi？session 怎么导出并本地接续？ | issue-analysis 的授权链细节；先掌握 `/is` 与 `/ir` 的行为即可 |
| [03-check-pipeline.md](03-check-pipeline.md) | `npm run check` 每项检查什么、不检查什么？pre-commit 何时跑 browser smoke？ | entry graph 预算、runtime-deps 的解析细节 |
| [04-ci-matrix.md](04-ci-matrix.md) | 普通 PR CI 跑什么？哪些检查被分流到别的触发器？ | Nix、模型目录发布窗口等专门工作流细节 |
| [05-testing-layers.md](05-testing-layers.md) | 每层测试能证明/不能证明什么？独立仓怎么复用 faux provider 模式？ | evals 的 Docker 配对细节 |
| [06-review-and-human-role.md](06-review-and-human-role.md) | 「理解自己的代码」怎么执行？维护者时间怎么被保护？ | RFC 索引的具体条目 |
| [07-release-and-recovery.md](07-release-and-recovery.md) | 发布前/中/后各步骤实际做什么？失败后怎么恢复、什么不能回滚？ | 发布恢复分支；先读 lockstep 与 tag 管线主干 |
| [08-applicability-boundary.md](08-applicability-boundary.md) | 哪些主仓机制不随使用 Pi 继承？扩展仓必须自己决定什么？ | 无——首次参与扩展开发即应通读 |

各页自成一体；只查一个精确条件时直接跳页，再沿页内链接回到机制出处。

## 三条组织立场（从 v1.4.0 一手机制归纳）

以下是本卷对 tag 版本可观察机制的综合归纳（**扩展仓建议**层面的解读，非 Pi 官方声明的方法论）。

### (a) agent 是一等参与者

主仓不只允许 agent 参与，还为其定义了可执行的角色合同：`.pi/prompts/is.md` 规定诊断 agent 的行为边界（不信 issue 内分析、完整读代码、只提议不实现、CI 下不加 `inprogress` 标签）；`.github/workflows/issue-analysis.yml` 在 CI 中以真实模型运行 `pi /is`、导出 session 到 secret gist，并给出 `/ir` 本地接续指令；`.pi/extensions/import-repro.ts` 把跨机器接续实现为 cwd 重写；`.github/workflows/remove-inprogress-on-close.yml` 保证 issue 关闭时清理 `inprogress` 标签。关键证据：、issue-analysis.yml 的、与、。详见 [02 页](02-issue-diagnosis-and-session-import.md)。

### (b) 可机械判断的规则接入可执行检查

凡是能写成确定条件的规则，主仓把它放进脚本或 workflow，而不是留在文档里：贡献资格由三个 gate 工作流自动执行（[01 页](01-contribution-gates.md)）；依赖 pin、运行时 import、入口图预算、类型检查、browser smoke 组成一条 `check` 命令（[03 页](03-check-pipeline.md)）；MCP 协议兼容有独立 CI job 对 pinned conformance suite 回归（[04 页](04-ci-matrix.md)）；lockfile 变更在本地 hook 被拦截并要求显式豁免变量（[03 页](03-check-pipeline.md)）。检查何时触发、分流到哪里，与检查内容本身同等重要。

### (c) 每类事实有权威维护位置

| 事实 | v1.4.0 上的权威位置 |
|---|---|
| 贡献者资格（谁可发 issue/PR） | `.github/APPROVED_CONTRIBUTORS`，由  在维护者 `lgtmi`/`lgtm` 评论后自动改写，以 `github-actions[bot]` 身份提交 |
| coding-agent 安装依赖树 | `packages/coding-agent/install-lock/`，由生成器校验（[03 页](03-check-pipeline.md)） |
| Nix 模型目录 pin | `nix/model-catalog.json`（ 注释声明 tag 不可改 pin） |
| 每包变更记录 | `packages/*/CHANGELOG.md` 的 `[Unreleased]` 段，贡献者不得编辑（位置与段落结构见 ；编辑禁令见 ） |
| MCP 兼容基线 | `packages/coding-agent/test/mcp-conformance/baseline.json` |

[E123](../_evidence/render.md#e123)
| 已发布版本与 latest 指针 | npm registry 与 R2 上的 `releases/v1/latest.json`（[07 页](07-release-and-recovery.md)） |

一条事实只在一个位置维护，其它地方引用或派生；这使「谁改了什么」可以机械审计。

## 本卷的独立性与边界

- 本卷不引用 `_faq_on_digested/` 等二手研究目录作为证据来源；一切引用回到 v1.4.0 的文件与行号。
- 工作树 HEAD 与 tag 的机制漂移（workflow 改名/拆分、CI 步骤增删）在 [README](README.md) 的证据基线一节声明；正文不使用 HEAD 现状描述机制。
- 本卷描述 pi-mono 的制度（**主仓要求**），不构成对扩展仓的约束；移用判断见 [08 页](08-applicability-boundary.md)。
