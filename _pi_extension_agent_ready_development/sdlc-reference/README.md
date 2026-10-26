# SDLC Reference：pi-mono 的准入、检查、CI、测试、评审与发布

本卷是面向「独立 Pi 扩展/package 仓作者与 coding agent」语料中的**精确参考层**。读者的问题不是「我该怎样开发」，而是：pi-mono 主仓的准入、检查、CI、测试、评审、发布各环节的精确条件、状态与例外是什么；哪些机制可以移用到独立扩展仓，哪些不随使用 Pi 自动继承。

本卷只回答「在 pi-mono 中事实是什么」。结论如何移用由 [08-applicability-boundary.md](08-applicability-boundary.md) 统一划界；扩展仓自身的开发组织方式见语料卷一（[extension-development-model](../extension-development-model/README.md)），主仓作为 harness 的组织方式见卷三（[repo-harness](../repo-harness/README.md)）。三卷彼此不构成前置阅读顺序。

## 证据基线

一切机制事实对着 [`earendil-works/pi`](https://github.com/earendil-works/pi/tree/v1.4.0) git tag `v1.4.0`（commit `4a080252f`）核对。引用任何 workflow、脚本或 `package.json` 行为时，均以该 tag 的文件版本与行号为准；正文链接钉在 `v1.4.0` 的 blob 路径上。

本卷不运行任何 build、test 或发布命令；全部结论来自对 tag 版本配置与代码的静态核对。需要自行核对时，用 `git show v1.4.0:<路径>` 读取 tag 版本（行号与正文锚点一致），不要直接读工作树文件。

> **基线变更说明**：本卷此前钉 `v1.0.3`（`d78dc83d6`），已在 v1.2.0 同步轮改钉 `v1.2.0`（`06a466935`）。这不是纯改名——相对 v1.0.3，本卷覆盖面有几处实质变化：环境工作流由 `durable-env.yml` 改名为 `env.yml`，**触发器模型从「工作分支」改为「路径门控的 PR」**，job 由 `check`+`env-tests` 变为 `daemons`+`check`+`release-daemons`（五 OS → 六平台）；`ci.yml` 增加 pi-env daemon 构建步骤；`packages/` 由 13 个包减为 11 个（`client`/`protocol`/`server` 删除）；`scripts/coding-agent-consumer.mjs` 被删除，职能拆入 `check-package-install.mjs` 等四个新脚本。逐条差异与处置见 [`_coverage/01-repin-v1.2.0-survey.md`](../_coverage/01-repin-v1.2.0-survey.md)。**0015 轮**（v1.2.0→v1.4.0）的差异见 [`_coverage/02-repin-v1.4.0-survey.md`](../_coverage/02-repin-v1.4.0-survey.md)：pinned-deps 覆盖内部包、skills 3→4、chord 依赖 telemetry、entry-graph 预算 20/73、release 先 pin 模型目录。

> **两个基线 commit 不要混用**：`v1.0.3` tag 是 `d78dc83d6`；`_digested` 同步记录 0009 所用的区间起点 `98d2e1947` 在 v1.0.3 **之后 23 个 commit**，两者的 `packages/` 与 `.github/workflows/` 清单都不一样。写「v1.0.3 时如何」只能用 `git ls-tree v1.0.3`。

## 阅读纪律

正文区分四类陈述，必要时显式标注：

- **运行时事实**：Pi 接口的实际行为（如 `pi -ne` 的含义、`/ir` 命令做什么）。
- **主仓要求**：pi-mono 自身的贡献、检查、发布规则，只在 pi-mono 内有效。
- **扩展仓建议**：本语料归纳、供独立扩展仓选用的做法，不是 Pi 官方方法。
- **仓库自定**：扩展仓自己的选择，Pi 与主仓均不代为决定。

每页都写足「不能证明什么」：gate 通过不代表技术评审通过、CI 绿不代表全部质量面覆盖、发布脚本跑完不代表公告已生效。Pi 没有声明采用任何统一开发方法；本卷不把跨页综合写成 Pi 官方方法名，也不把语料的归纳当成主仓制度。

## 直接内容表

| 页 | 内容 |
|---|---|
| [00-index.md](00-index.md) | 按问题选页的导航表；从 v1.4.0 归纳的三条组织立场 |
| [01-contribution-gates.md](01-contribution-gates.md) | issue/PR 准入工作流、`lgtmi`/`lgtm` 语义、issue 模板前置、triage 标签生命周期、触发边界 |
| [02-issue-diagnosis-and-session-import.md](02-issue-diagnosis-and-session-import.md) | `/is` 诊断合同、issue-analysis CI 授权链、session gist 导出与 `/ir` 本地接续 |
| [03-check-pipeline.md](03-check-pipeline.md) | `npm run check` 的逐项组成、pre-commit 条件触发、lockfile 人工豁免面 |
| [04-ci-matrix.md](04-ci-matrix.md) | 主 CI、环境/Nix/audit/模型目录工作流的触发与内容；「不在普通 PR CI」清单 |
| [05-testing-layers.md](05-testing-layers.md) | test.sh 隔离、faux provider 测试层、交互 smoke 标准、evals 配对评估；各层能证明/不能证明 |
| [06-review-and-human-role.md](06-review-and-human-role.md) | One Rule、审阅缓冲、反推测性抽象原则、RFC 索引、AI 辅助与人的最终判断 |
| [07-release-and-recovery.md](07-release-and-recovery.md) | lockstep 版本、release 脚本实际步骤、tag 发布管线、幂等发布与恢复 |
| [08-applicability-boundary.md](08-applicability-boundary.md) | 哪些主仓治理不随使用 Pi 继承；扩展仓必须自定什么；可借的原则 |
| [figures/](figures/README.md) | 本卷正文使用的 SVG 图示清单（检查分流图） |

主入口是 [00-index.md](00-index.md)；不确定从哪页读起时先看它的导航表，再按问题跳页。查一个精确条件时也可直接翻对应页，每页自成一体并给出回到机制出处的链接。
