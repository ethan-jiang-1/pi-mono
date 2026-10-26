# Agent 入口规则：AGENTS.md 与 CONTRIBUTING.md

pi-mono 对没来过的 coding agent 的全部入口合同由两个文件承担：根目录 `AGENTS.md`（开发规则，人与 agent 共用）与 `CONTRIBUTING.md`（贡献哲学与门槛）。本页逐条检视现行内容；证据坐标见 `../_evidence/render.md`。**以下除标注外均为主仓要求**——它们只在 pi-mono 内有效；独立扩展仓需要自定等价物，本页在每组末尾给出建议（扩展仓建议，本语料归纳）。

## 规则的入口约定

仓库要求 agent 从仓库根运行，使 `AGENTS.md` 被自动拾取，并明确「你的 agent 必须遵守该文件的规则与指南」（[E001](../_evidence/render.md#e001)）。规则同时要求用户提问先答后改、技术散文、直接简洁（[E002](../_evidence/render.md#e002)）——风格条款与行为条款写在同一份文件里。

## 命令纪律

主仓对 agent 能跑什么命令划了硬边界：

> After code changes (not docs): `npm run check` (full output, no tail). Fix all errors, warnings, and infos before committing. Does not run tests.
>
> — AGENTS.md（[E003](../_evidence/render.md#e003)）

> Never run `npm run build` or `npm test` unless requested by the user.
>
> — AGENTS.md（[E004](../_evidence/render.md#e004)）

要点：`check` 是 lint/格式/类型检查且**不跑测试**；全量 vitest 套件含 e2e（存在 endpoint/auth 环境变量时激活），非 e2e 测试用根目录 `./test.sh`，或从包根跑单个测试文件（[E005](../_evidence/render.md#e005)）。测试本身的边界：

> For `packages/coding-agent/test/suite/`, use `test/suite/harness.ts` + the faux provider. No real provider APIs, keys, or paid tokens.
>
> — AGENTS.md（[E006](../_evidence/render.md#e006)）

> When regressions tests for fixing a github issue, add a comment with the github issue number next to the test.
>
> — AGENTS.md（[E007](../_evidence/render.md#e007)）

临时脚本不允许内嵌在命令里，必须写成 `/tmp` 下的文件、跑完删除（[E008](../_evidence/render.md#e008)）。faux provider 让 agent 的测试验证不消耗付费 token，这是「agent 可持续参与」的经济前提之一。

**扩展仓建议**：自定一份「agent 命令白名单/黑名单」——明确哪个检查命令是安全的、哪些命令（build、发布、付费 API）必须用户显式请求，并规定 ad-hoc 脚本的存放位置与生命周期。

## 依赖与安装安全

主仓把依赖与 lockfile 变化当作受评审代码（主仓要求）：

> Treat npm dep and lockfile changes as reviewed code. Direct **registry** deps, **including internal workspace deps**, stay pinned to exact versions.
>
> — AGENTS.md（[E009](../_evidence/render.md#e009)）

> Hydrate/update locally with `npm install --ignore-scripts`; clean/CI-style with `npm ci --ignore-scripts`. Don't run lifecycle scripts unless the user asks.
>
> — AGENTS.md（[E010](../_evidence/render.md#e010)）

带生命周期脚本的新依赖必须经评审并加入 install-lock 生成脚本的显式 allowlist，「绝不悄悄加入」（[E011](../_evidence/render.md#e011)）。lockfile 提交被 pre-commit 拦截，除非设置 `PI_ALLOW_LOCKFILE_CHANGE=1` 且用户想提交（[E011](../_evidence/render.md#e011)）。这些是运行时事实层面的 hook 行为与主仓要求的组合；对 agent 的含义是：依赖变更天然属于「须人确认」类别。

**规则已收紧**：规则从「外部依赖」扩到「所有 registry 依赖（含内部 workspace 包）」；`scripts/check-pinned-deps.mjs` 已删掉内部包豁免，仓库内实测无 `^`。另有一条与模型相关的规则：生成数据目录 `packages/ai/src/providers/data/` 已 gitignore，「never stage it, and don't look for it in git history」（[E022](../_evidence/render.md#e022)）。

**扩展仓建议**：至少固定两件事——registry 依赖 exact pin 策略（含内部包），以及「agent 不得自行新增带安装脚本的依赖」的规则；扩展仓若向用户分发 package，依赖面就是攻击面（见 [07](./07-monorepo-taxonomy.md)）。

## Git 多会话规则

提交本身是须用户显式请求的动作（主仓要求）：

> Never commit unless the user asks.
>
> — AGENTS.md（[E012](../_evidence/render.md#e012)）

主仓直接假设多个 pi 会话在同一工作树并发工作，因此 git 操作被限制在「只碰自己的文件」：

> Only commit files YOU changed in THIS session.
>
> — AGENTS.md（[E013](../_evidence/render.md#e013)）

> Stage explicit paths (`git add <path1> <path2>`); never `git add -A` / `git add .`.
>
> — AGENTS.md（[E013](../_evidence/render.md#e013)）

一批命令被绝对禁止，因为它们会毁掉其它会话的工作或绕过检查（[E014](../_evidence/render.md#e014)）：`git reset --hard`、`git checkout .`、`git clean -fd`、`git stash`、`git add -A`、`git add .`、`git commit --no-verify`；此外永不 force push（[E014](../_evidence/render.md#e014)）。rebase 冲突只允许解决自己改过的文件，否则中止并询问用户。commit message 格式固定为 `{feat,fix,docs}[(ai,tui,agent,coding-agent)]: <message>`（[E015](../_evidence/render.md#e015)）。

**扩展仓建议**：即使只有单会话，显式路径暂存与禁用 stash/reset 仍值得保留——它们防的是「agent 顺手清掉了用户未保存的工作」这类不可逆事故；多 agent 并发则让这些规则从谨慎变为必需。

## 贡献哲学与门槛

`CONTRIBUTING.md` 的哲学段定义了核心范围纪律（主仓要求，详见 [06](./06-scope-discipline-and-cost-contracts.md)）：

> First things first: **pi's core is minimal**.
>
> — CONTRIBUTING.md（[E016](../_evidence/render.md#e016)）

> If your feature does not belong in the core, it should be an extension. PRs that bloat the core will likely be rejected.
>
> — CONTRIBUTING.md（[E016](../_evidence/render.md#e016)）

The One Rule 把理解义务放在提交者身上：

> **You must understand your code.** If you cannot explain what your changes do and how they interact with the rest of the system, your PR will be closed.
>
> — CONTRIBUTING.md（[E017](../_evidence/render.md#e017)）

> Using AI to write code is fine. Submitting AI-generated slop without understanding it is not.
>
> — CONTRIBUTING.md（[E017](../_evidence/render.md#e017)）

贡献门槛是缓冲式的：新贡献者的 issue 与 PR 默认自动关闭（[E018](../_evidence/render.md#e018)）；维护者在 issue 上回复 `lgtmi`（解锁后续 issue）或 `lgtm`（解锁 issue 与 PR），命令必须在回复开头或结尾（[E019](../_evidence/render.md#e019)）。开 PR 前必须已获 `lgtm`；提交前 `npm run check` 与 `./test.sh` 都必须通过（[E020](../_evidence/render.md#e020)）；贡献者不得改 `CHANGELOG.md`，条目由维护者合并时添加（[E021](../_evidence/render.md#e021)）。这些是 pi-mono 应对 issue 量的自保制度（其 FAQ 明说 auto-close 是给维护者审阅缓冲），不是对贡献者的通用要求。

**扩展仓建议**：扩展仓通常没有同样的流量压力，可自定更轻的门槛；但「理解义务 + 自动检查全过再提交」这一组合是任何仓都可直接沿用的最小内核（仓库自定范围）。
