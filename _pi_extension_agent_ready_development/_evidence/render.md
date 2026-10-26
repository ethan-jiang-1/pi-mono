# 证据附录（生成物）

由 `_evidence/claims.json` 生成，基线 `v1.4.0`。**不要手改**；改台账后重新运行：

```sh
node _digested/_evidence/tools/render-evidence.mjs --corpus <语料目录>
```

正文的 `[E###]` 指向本文件的对应标题。每条记录给出符号/小节定位、原文引文与核验版本；
行号仅作为人读提示，机器校验不使用行号。

## repo-harness/01-agent-entry-rules.md

### E001

agent 必须从仓库根运行，才会自动拾取 AGENTS.md 并遵守其规则

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `The One Rule`，提示行 19

  > If you use an agent, run it from the `pi` root directory so it picks up `AGENTS.md` automatically. Your agent must follow the rules and guidelines in that file.

核验：`v1.4.0`

### E002

提问先答后改；散文直接、简洁、无套话

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Conversational Style`，提示行 8

  > - Technical prose only, be direct

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Conversational Style`，提示行 12

  > - When the user asks a question, answer it first before making edits or running implementation commands.

核验：`v1.4.0`

### E003

改代码后跑 npm run check，全量输出、不允许只截尾；check 不跑测试

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Commands`，提示行 32

  > - After code changes (not docs): `npm run check` (full output, no tail). Fix all errors, warnings, and infos before committing. Does not run tests.

核验：`v1.4.0`

### E004

未经用户请求不得运行 npm run build 或 npm test

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Commands`，提示行 33

  > - Never run `npm run build` or `npm test` unless requested by the user.

核验：`v1.4.0`

### E005

不得直接跑全量 vitest（含 e2e）；非 e2e 用 ./test.sh，或从包根跑单文件

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Commands`，提示行 34

  > - Never run the full vitest suite directly: it includes e2e tests that activate when endpoint/auth env vars are present. For all non-e2e tests, run `./test.sh` from the repo root. Otherwise run specific tests from the package root:

核验：`v1.4.0`

### E006

coding-agent test/suite 必须用 test/suite/harness.ts + faux provider，禁止真实 key

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Commands`，提示行 38

  > - For `packages/coding-agent/test/suite/`, use `test/suite/harness.ts` + the faux provider. No real provider APIs, keys, or paid tokens.

核验：`v1.4.0`

### E007

修 issue 的回归测试旁必须写 issue 号注释

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Commands`，提示行 39

  > - When regressions tests for fixing a github issue, add a comment with the github issue number next to the test.

核验：`v1.4.0`

### E008

临时脚本写入 /tmp 文件再跑，不内嵌多行脚本

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Commands`，提示行 40

  > - For ad-hoc scripts, `write` them to a temp file (e.g. `/tmp`), run, edit if needed, remove when done. Don't embed multi-line scripts in `bash` commands.

核验：`v1.4.0`

### E009

直接 registry 依赖（含内部 workspace 包）必须精确版本

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Dependency and Install Security`，提示行 45

  > - Treat npm dep and lockfile changes as reviewed code. Direct registry deps, including internal workspace deps, stay pinned to exact versions.

核验：`v1.4.0`

### E010

本地用 npm install --ignore-scripts 水合，CI 用 npm ci；不得擅自跑 lifecycle 脚本

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Dependency and Install Security`，提示行 47

  > - Hydrate/update locally with `npm install --ignore-scripts`; clean/CI-style with `npm ci --ignore-scripts`. Don't run lifecycle scripts unless the user asks.

核验：`v1.4.0`

### E011

带安装脚本的新依赖须评审并进显式 allowlist；lockfile 提交被 pre-commit 拦截

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Dependency and Install Security`，提示行 49

  > - If `packages/coding-agent/install-lock/` needs regen, run `node scripts/generate-coding-agent-install-lock.mjs` (verify with `--check` or `npm run check`). New deps with lifecycle scripts require review and an explicit allowlist entry in that script; never add one silently.

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Dependency and Install Security`，提示行 50

  > - Pre-commit blocks lockfile commits unless `PI_ALLOW_LOCKFILE_CHANGE=1`. Don't bypass unless the user wants the lockfile change committed.

核验：`v1.4.0`

### E012

除非用户要求，否则不提交

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Git`，提示行 41

  > - Never commit unless the user asks.

核验：`v1.4.0`

### E013

只提交本次自己改的文件；显式暂存路径，禁止 git add -A/.

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Git`，提示行 58

  > - Only commit files YOU changed in THIS session.

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Git`，提示行 59

  > - Stage explicit paths (`git add <path1> <path2>`); never `git add -A` / `git add .`.

核验：`v1.4.0`

### E014

禁止 reset --hard、checkout .、clean -fd、stash 与 --no-verify；永不 force push

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Git`，提示行 66

  > - `git reset --hard`, `git checkout .`, `git clean -fd`, `git stash`, `git add -A`, `git add .`, `git commit --no-verify`.

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Git`，提示行 72

  > - Never force push.

核验：`v1.4.0`

### E015

commit message 格式固定为 {feat,fix,docs}[(scope)]: <message>

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Git`，提示行 62

  > - Message format: `{feat,fix,docs}[(ai,tui,agent,coding-agent)]: <commit message> (optionally multiple lines)`. Message is informative and concise.

核验：`v1.4.0`

### E016

pi 的核保持最小；不属于核的功能应做成扩展，膨胀核的 PR 会被拒

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Philosophy`，提示行 7

  > First things first: **pi's core is minimal**.

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Philosophy`，提示行 9

  > If your feature does not belong in the core, it should be an extension. PRs that bloat the core will likely be rejected.

核验：`v1.4.0`

### E017

提交者必须理解自己的代码；不理解而提交 AI 产物会被关闭

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `The One Rule`，提示行 15

  > **You must understand your code.** If you cannot explain what your changes do and how they interact with the rest of the system, your PR will be closed.

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `The One Rule`，提示行 17

  > Using AI to write code is fine. Submitting AI-generated slop without understanding it is not.

核验：`v1.4.0`

### E018

新贡献者的 issue 与 PR 默认自动关闭

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Contribution Gate`，提示行 23

  > All issues and PRs from new contributors are auto-closed by default.

核验：`v1.4.0`

### E019

lgtmi/lgtm 解锁贡献资格，命令须在回复开头或结尾；只有 lgtm 允许开 PR

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Contribution Gate`，提示行 31

  > - `lgtmi`: your future issues will not be auto-closed

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Contribution Gate`，提示行 32

  > - `lgtm`: your future issues and PRs will not be auto-closed

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Contribution Gate`，提示行 34

  > The command must be at the start of the reply (optionally after one or more `@username` mentions) or at the end. `lgtmi` does not grant rights to submit PRs. Only `lgtm` grants rights to submit PRs.

核验：`v1.4.0`

### E020

开 PR 前必须已获 lgtm；npm run check 与 ./test.sh 都必须通过

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Before Submitting a PR`，提示行 58

  > Do not open a PR unless you have already been approved by a maintainer using `lgtm` in the command position described above.

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Before Submitting a PR`，提示行 63

  > npm run check

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Before Submitting a PR`，提示行 67

  > Both must pass.

核验：`v1.4.0`

### E021

贡献者不得改 CHANGELOG.md，条目由维护者添加

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Before Submitting a PR`，提示行 69

  > Do not edit `CHANGELOG.md`. Changelog entries are added by maintainers.

核验：`v1.4.0`

### E022

生成模型数据目录被 gitignore：不得暂存，也不要从 git 历史里找

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Code Quality`，提示行 28

  > - Never modify `packages/ai/src/models.generated.ts` directly; update `packages/ai/scripts/generate-models.ts` instead, then regenerate. Including the resulting `models.generated.ts` diff is always OK, even if regeneration includes unrelated upstream model metadata changes. The generated model data in `packages/ai/src/providers/data/` is gitignored: never stage it, and don't look for it in git history.

核验：`v1.4.0`
