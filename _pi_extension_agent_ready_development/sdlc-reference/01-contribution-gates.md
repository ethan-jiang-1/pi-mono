# 01 贡献准入：gate 工作流与文档合同

**主仓要求**：本章全部机制只在 pi-mono 内有效。独立扩展仓不因使用 Pi 继承任何准入 gate（见 [08 页](08-applicability-boundary.md)）。

pi-mono 的需求入口是「维护者筛选优先于开放 tracker」：新贡献者的 issue/PR 默认自动关闭，维护者通过特定命令恢复资格。它由两份东西共同构成——`CONTRIBUTING.md` 的文字合同和三个 GitHub Actions 工作流的自动执行。以下全部对照 tag `v1.0.3` 核对。

## 文档合同：默认关闭与 lgtmi/lgtm

> All issues and PRs from new contributors are auto-closed by default.
>
> Maintainers review auto-closed issues daily and reopen worthwhile ones. Issues that do not meet the quality bar below will not be reopened or receive a reply.
>
> Approval happens through maintainer replies on issues:
>
> - `lgtmi`: your future issues will not be auto-closed
> - `lgtm`: your future issues and PRs will not be auto-closed
>
> The command must be at the start of the reply (optionally after one or more `@username` mentions) or at the end. `lgtmi` does not grant rights to submit PRs. Only `lgtm` grants rights to submit PRs.

—— [CONTRIBUTING.md](https://github.com/earendil-works/pi/blob/v1.0.3/CONTRIBUTING.md#L23-L34)

语义要点：`lgtmi` 只解锁 issue；`lgtm` 同时解锁 issue 和 PR；命令必须出现在回复开头（可前置 `@username` 提及）或结尾，这是 approve 工作流正则匹配的前提。issue 还有独立的质量门槛（用模板、一屏内、自己口吻、说清影响、表明是否自实现，[CONTRIBUTING.md](https://github.com/earendil-works/pi/blob/v1.0.3/CONTRIBUTING.md#L38-L48)）。

PR 的前置条件（**主仓要求**）：

> Do not open a PR unless you have already been approved by a maintainer using `lgtm` in the command position described above.
>
> Before submitting a PR:
>
> ```bash
> npm run check
> ./test.sh
> ```
>
> Both must pass.
>
> Do not edit `CHANGELOG.md`. Changelog entries are added by maintainers.

—— [CONTRIBUTING.md](https://github.com/earendil-works/pi/blob/v1.0.3/CONTRIBUTING.md#L58-L69)

## 三个 gate 工作流的实际行为

### issue-gate.yml

只在 `issues: opened` 触发（[issue-gate.yml](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-gate.yml#L3-L5)）。判定顺序：受信 bot（`dependabot[bot]`、`sentry[bot]`、`claude[bot]`）直接放行（[L25-L28](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-gate.yml#L25-L28)）；协作者权限为 `admin`/`maintain`/`write` 放行（[L84-L88](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-gate.yml#L84-L88)）；否则从**默认分支**读取 `.github/APPROVED_CONTRIBUTORS`，capability 为 `issue` 或 `pr` 的用户放行（[L90-L97](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-gate.yml#L90-L97)）；其余评论说明、加 `untriaged` 标签、以 `not_planned` 关闭（[L99-L129](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-gate.yml#L99-L129)）。

### pr-gate.yml

只在 `pull_request_target` 的 `opened` 事件触发（[pr-gate.yml](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/pr-gate.yml#L3-L5)）。放行条件：受信 bot；`admin`/`maintain`/`write` 协作者（[L101-L105](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/pr-gate.yml#L101-L105)）；批准文件中 capability **恰为 `pr`**（`issue` 不够，[L107-L114](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/pr-gate.yml#L107-L114)）。不满足则评论并关闭 PR（[L116-L128](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/pr-gate.yml#L116-L128)）。

### approve-contributor.yml

在 `issue_comment: created` 触发（[approve-contributor.yml](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/approve-contributor.yml#L3-L5)）。生效条件：评论以 `lgtmi`/`lgtm` 开头或结尾（[L33-L35](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/approve-contributor.yml#L33-L35)），**且**评论者具有 `admin`/`maintain`/`write` 权限（[L45-L61](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/approve-contributor.yml#L45-L61)）。批准对象默认是 issue 作者；评论中 `@` 提及的用户优先（[L133-L136](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/approve-contributor.yml#L133-L136)）。写入时 `lgtmi`→capability `issue`、`lgtm`→`pr`，已有 `pr` 不降级（[L140-L162](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/approve-contributor.yml#L140-L162)）；随后以 `github-actions[bot]` 身份 commit 并 push 批准文件（[L176-L183](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/approve-contributor.yml#L176-L183)）。普通用户评论 `lgtm` 不会改变任何资格。

## bug 模板的前置过滤

issue 模板在 gate 之前就把两类噪音挡在模板层（**主仓要求**）：

> **Important:** before reporting an issue in core, please validate first with `pi -ne` that this is not caused by an extension you loaded.

—— [bug.yml](https://github.com/earendil-works/pi/blob/v1.0.3/.github/ISSUE_TEMPLATE/bug.yml#L14)

`pi -ne` 即 no-extensions 启动（**运行时事实**）：不加载任何扩展地启动 pi，用于区分「核心 bug」与「用户扩展引发的问题」。复现步骤字段要求 "Minimal steps to trigger the bug."（[bug.yml](https://github.com/earendil-works/pi/blob/v1.0.3/.github/ISSUE_TEMPLATE/bug.yml#L26-L30)）——最小复现是模板必填项，不是可选项。

## 触发边界与反例

**gate 检查的是贡献资格，不是质量**。以下反例划清它能证明什么：

- gate 工作流自身不读取 issue 模板、不运行 `npm run check`、不做任何技术可行性或设计判断；issue 内容质量由维护者人工重开时把关。
- `lgtm` 只表示「允许你提 PR」，不是代码质量批准；`lgtmi` 连 PR 权限都不给。把 `lgtm` 理解为「维护者认可了这个方案」超出证据。
- pr-gate 触发器是 `opened`，所以它不是「每次 push 都重新检查批准状态」的门禁；仓库文件中也没有可见的 branch protection required-check 配置来补这个面。PR 打开后追加的提交不重新过 gate。
- gate 通过 ≠ CI 通过：CI 是另一个工作流、另一套触发器（[04 页](04-ci-matrix.md)）。
- `pull_request_target` 以默认分支的 workflow 定义运行并持有写权限 token，pi-mono 用它读取默认分支的批准文件；这也意味着 PR 分支上的改动不影响 gate 判定逻辑本身。

**扩展仓建议**：如果独立扩展仓也面临低质量 issue 泛滥，可参考「默认关闭 + 显式批准 + 批准状态有权威文件」这一组合，但门槛值、命令词、是否自动化都是**仓库自定**；小型扩展仓通常用模板前置过滤即可，不必复制三个工作流。
