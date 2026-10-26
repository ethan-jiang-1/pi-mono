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

  ```text
  If you use an agent, run it from the `pi` root directory so it picks up `AGENTS.md` automatically. Your agent must follow the rules and guidelines in that file.
  ```

核验：`v1.4.0`

### E002

提问先答后改；散文直接、简洁、无套话

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Conversational Style`，提示行 8

  ```text
  - Technical prose only, be direct
  ```

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Conversational Style`，提示行 12

  ```text
  - When the user asks a question, answer it first before making edits or running implementation commands.
  ```

核验：`v1.4.0`

### E003

改代码后跑 npm run check，全量输出、不允许只截尾；check 不跑测试

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Commands`，提示行 32

  ```text
  - After code changes (not docs): `npm run check` (full output, no tail). Fix all errors, warnings, and infos before committing. Does not run tests.
  ```

核验：`v1.4.0`

### E004

未经用户请求不得运行 npm run build 或 npm test

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Commands`，提示行 33

  ```text
  - Never run `npm run build` or `npm test` unless requested by the user.
  ```

核验：`v1.4.0`

### E005

不得直接跑全量 vitest（含 e2e）；非 e2e 用 ./test.sh，或从包根跑单文件

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Commands`，提示行 34

  ```text
  - Never run the full vitest suite directly: it includes e2e tests that activate when endpoint/auth env vars are present. For all non-e2e tests, run `./test.sh` from the repo root. Otherwise run specific tests from the package root:
  ```

核验：`v1.4.0`

### E006

coding-agent test/suite 必须用 test/suite/harness.ts + faux provider，禁止真实 key

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Commands`，提示行 38

  ```text
  - For `packages/coding-agent/test/suite/`, use `test/suite/harness.ts` + the faux provider. No real provider APIs, keys, or paid tokens.
  ```

核验：`v1.4.0`

### E007

修 issue 的回归测试旁必须写 issue 号注释

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Commands`，提示行 39

  ```text
  - When regressions tests for fixing a github issue, add a comment with the github issue number next to the test.
  ```

核验：`v1.4.0`

### E008

临时脚本写入 /tmp 文件再跑，不内嵌多行脚本

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Commands`，提示行 40

  ```text
  - For ad-hoc scripts, `write` them to a temp file (e.g. `/tmp`), run, edit if needed, remove when done. Don't embed multi-line scripts in `bash` commands.
  ```

核验：`v1.4.0`

### E009

直接 registry 依赖（含内部 workspace 包）必须精确版本

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Dependency and Install Security`，提示行 45

  ```text
  - Treat npm dep and lockfile changes as reviewed code. Direct registry deps, including internal workspace deps, stay pinned to exact versions.
  ```

核验：`v1.4.0`

### E010

本地用 npm install --ignore-scripts 水合，CI 用 npm ci；不得擅自跑 lifecycle 脚本

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Dependency and Install Security`，提示行 47

  ```text
  - Hydrate/update locally with `npm install --ignore-scripts`; clean/CI-style with `npm ci --ignore-scripts`. Don't run lifecycle scripts unless the user asks.
  ```

核验：`v1.4.0`

### E011

带安装脚本的新依赖须评审并进显式 allowlist；lockfile 提交被 pre-commit 拦截

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Dependency and Install Security`，提示行 49

  ```text
  - If `packages/coding-agent/install-lock/` needs regen, run `node scripts/generate-coding-agent-install-lock.mjs` (verify with `--check` or `npm run check`). New deps with lifecycle scripts require review and an explicit allowlist entry in that script; never add one silently.
  ```

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Dependency and Install Security`，提示行 50

  ```text
  - Pre-commit blocks lockfile commits unless `PI_ALLOW_LOCKFILE_CHANGE=1`. Don't bypass unless the user wants the lockfile change committed.
  ```

核验：`v1.4.0`

### E012

除非用户要求，否则不提交

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Git`，提示行 41

  ```text
  - Never commit unless the user asks.
  ```

核验：`v1.4.0`

### E013

只提交本次自己改的文件；显式暂存路径，禁止 git add -A/.

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Git`，提示行 58

  ```text
  - Only commit files YOU changed in THIS session.
  ```

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Git`，提示行 59

  ```text
  - Stage explicit paths (`git add <path1> <path2>`); never `git add -A` / `git add .`.
  ```

核验：`v1.4.0`

### E014

禁止 reset --hard、checkout .、clean -fd、stash 与 --no-verify；永不 force push

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Git`，提示行 66

  ```text
  - `git reset --hard`, `git checkout .`, `git clean -fd`, `git stash`, `git add -A`, `git add .`, `git commit --no-verify`.
  ```

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Git`，提示行 72

  ```text
  - Never force push.
  ```

核验：`v1.4.0`

### E015

commit message 格式固定为 {feat,fix,docs}[(scope)]: <message>

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Git`，提示行 62

  ```text
  - Message format: `{feat,fix,docs}[(ai,tui,agent,coding-agent)]: <commit message> (optionally multiple lines)`. Message is informative and concise.
  ```

核验：`v1.4.0`

### E016

pi 的核保持最小；不属于核的功能应做成扩展，膨胀核的 PR 会被拒

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Philosophy`，提示行 7

  ```text
  First things first: **pi's core is minimal**.
  ```

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Philosophy`，提示行 9

  ```text
  If your feature does not belong in the core, it should be an extension. PRs that bloat the core will likely be rejected.
  ```

核验：`v1.4.0`

### E017

提交者必须理解自己的代码；不理解而提交 AI 产物会被关闭

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `The One Rule`，提示行 15

  ```text
  **You must understand your code.** If you cannot explain what your changes do and how they interact with the rest of the system, your PR will be closed.
  ```

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `The One Rule`，提示行 17

  ```text
  Using AI to write code is fine. Submitting AI-generated slop without understanding it is not.
  ```

核验：`v1.4.0`

### E018

新贡献者的 issue 与 PR 默认自动关闭

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Contribution Gate`，提示行 23

  ```text
  All issues and PRs from new contributors are auto-closed by default.
  ```

核验：`v1.4.0`

### E019

lgtmi/lgtm 解锁贡献资格，命令须在回复开头或结尾；只有 lgtm 允许开 PR

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Contribution Gate`，提示行 31

  ```text
  - `lgtmi`: your future issues will not be auto-closed
  ```

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Contribution Gate`，提示行 32

  ```text
  - `lgtm`: your future issues and PRs will not be auto-closed
  ```

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Contribution Gate`，提示行 34

  ```text
  The command must be at the start of the reply (optionally after one or more `@username` mentions) or at the end. `lgtmi` does not grant rights to submit PRs. Only `lgtm` grants rights to submit PRs.
  ```

核验：`v1.4.0`

### E020

开 PR 前必须已获 lgtm；npm run check 与 ./test.sh 都必须通过

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Before Submitting a PR`，提示行 58

  ```text
  Do not open a PR unless you have already been approved by a maintainer using `lgtm` in the command position described above.
  ```

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Before Submitting a PR`，提示行 63

  ```text
  npm run check
  ```

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Before Submitting a PR`，提示行 67

  ```text
  Both must pass.
  ```

核验：`v1.4.0`

### E021

贡献者不得改 CHANGELOG.md，条目由维护者添加

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — heading: `Before Submitting a PR`，提示行 69

  ```text
  Do not edit `CHANGELOG.md`. Changelog entries are added by maintainers.
  ```

核验：`v1.4.0`

### E022

生成模型数据目录被 gitignore：不得暂存，也不要从 git 历史里找

- [`AGENTS.md`](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md) — heading: `Code Quality`，提示行 28

  ```text
  - Never modify `packages/ai/src/models.generated.ts` directly; update `packages/ai/scripts/generate-models.ts` instead, then regenerate. Including the resulting `models.generated.ts` diff is always OK, even if regeneration includes unrelated upstream model metadata changes. The generated model data in `packages/ai/src/providers/data/` is gitignored: never stage it, and don't look for it in git history.
  ```

核验：`v1.4.0`

## sdlc-reference/07-release-and-recovery.md

### E023

lockstep 版本：所有包同一版本、一起发布；sync-versions 与 publish 各断言一次

- [`.pi/skills/release.md`](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/skills/release.md) — text: `**Lockstep versioning**: all packages share one version; every release updates all together. `patch` = fixes + additions, `minor` = breaking changes. No major releases.`，提示行 10

  ```text
  **Lockstep versioning**: all packages share one version; every release updates all together. `patch` = fixes + additions, `minor` = breaking changes. No major releases.
  ```

- [`scripts/sync-versions.js`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/sync-versions.js) — text: `const versions = new Set(publishedPackages.map((pkg) => pkg.data.version));`，提示行 29

  ```text
  const versions = new Set(publishedPackages.map((pkg) => pkg.data.version));
  ```

- [`scripts/publish.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish.mjs) — text: `const versions = ［...new Set(packages.map((pkg) => pkg.version))］;`，提示行 33

  ```text
  const versions = [...new Set(packages.map((pkg) => pkg.version))];
  ```

- [`package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/package.json) — text: `"version:patch": "npm version patch --workspaces --no-git-tag-version --no-workspaces-update && node scripts/sync-versions.js && npm install --package-lock-only --ignore-scripts",`，提示行 43

  ```text
  "version:patch": "npm version patch --workspaces --no-git-tag-version --no-workspaces-update && node scripts/sync-versions.js && npm install --package-lock-only --ignore-scripts",
  ```

核验：`v1.4.0`

### E024

两个发布入口：release:local 只做仓外 tarball smoke；真实发布推 main 与 tag

- [`scripts/local-release.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/local-release.mjs) — text: `import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";`，提示行 4

  ```text
  import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
  ```

- [`.pi/skills/release.md`](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/skills/release.md) — text: `3. **Run the release script**:`，提示行 37

  ```text
  3. **Run the release script**:
  ```

核验：`v1.4.0`

### E025

发布前：先审 changelog、仓外本地 smoke、再跑发布脚本

- [`.pi/skills/release.md`](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/skills/release.md) — text: `1. **Update CHANGELOGs**: ask the user whether they ran the `/cl` prompt on the latest commit on `main`. If not, they must run `/cl` first to audit and update each package's `［Unreleased］` section before releasing.`，提示行 12

  ```text
  1. **Update CHANGELOGs**: ask the user whether they ran the `/cl` prompt on the latest commit on `main`. If not, they must run `/cl` first to audit and update each package's `[Unreleased]` section before releasing.
  ```

- [`.pi/skills/release.md`](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/skills/release.md) — text: `2. **Local smoke test**: build an unpublished release and smoke test from outside the repo (so it can't resolve workspace files):`，提示行 14

  ```text
  2. **Local smoke test**: build an unpublished release and smoke test from outside the repo (so it can't resolve workspace files):
  ```

核验：`v1.4.0`

### E026

release.mjs 的十步：干净树 → npm 注册 → catalog pin+build → bump → changelog → 产物 → 检查 → commit/tag → 下周期段 → push

- [`scripts/release.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/release.mjs) — text: `* 1. Check for uncommitted changes`，提示行 10

  ```text
  * 1. Check for uncommitted changes
  ```

- [`scripts/release.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/release.mjs) — text: `// 1. Check for uncommitted changes`，提示行 258

  ```text
  // 1. Check for uncommitted changes
  ```

- [`scripts/release.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/release.mjs) — text: `function assertPackagesAreRegisteredWithNpm() {`，提示行 57

  ```text
  function assertPackagesAreRegisteredWithNpm() {
  ```

- [`scripts/release.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/release.mjs) — text: `// Pin and verify the Nix model catalog before modifying versions, so the pin`，提示行 271

  ```text
  // Pin and verify the Nix model catalog before modifying versions, so the pin
  ```

- [`scripts/release.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/release.mjs) — text: `function bumpOrSetVersion(target) {`，提示行 186

  ```text
  function bumpOrSetVersion(target) {
  ```

- [`scripts/release.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/release.mjs) — text: `function updateChangelogsForRelease(version) {`，提示行 217

  ```text
  function updateChangelogsForRelease(version) {
  ```

- [`scripts/release.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/release.mjs) — text: `// 5. Regenerate release artifacts`，提示行 286

  ```text
  // 5. Regenerate release artifacts
  ```

- [`scripts/release.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/release.mjs) — text: `// 6. Run checks and tests`，提示行 293

  ```text
  // 6. Run checks and tests
  ```

- [`scripts/release.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/release.mjs) — text: `function stageChangedFiles() {`，提示行 176

  ```text
  function stageChangedFiles() {
  ```

- [`scripts/release.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/release.mjs) — text: `function addUnreleasedSection() {`，提示行 238

  ```text
  function addUnreleasedSection() {
  ```

- [`scripts/release.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/release.mjs) — text: `run("git push origin main");`，提示行 336

  ```text
  run("git push origin main");
  ```

核验：`v1.4.0`

### E027

tag 推出后不得重跑 release 脚本

- [`.pi/skills/release.md`](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/skills/release.md) — text: `The release script pins the newest published model catalog for Nix (`nix/model-catalog.json`) and builds the checkout with it as the Nix build does (it fails if that catalog predates main's model changes; publish one first), bumps all package versions, updates changelogs, regenerates release artifacts, runs `npm run check`, commits `Release vX.Y.Z`, tags `vX.Y.Z`, adds fresh `## ［Unreleased］` changelog sections, commits `Add ［Unreleased］ section for next cycle`, then pushes `main` and the tag. Do not rerun the release script after a tag was pushed.`，提示行 46

  ```text
  The release script pins the newest published model catalog for Nix (`nix/model-catalog.json`) and builds the checkout with it as the Nix build does (it fails if that catalog predates main's model changes; publish one first), bumps all package versions, updates changelogs, regenerates release artifacts, runs `npm run check`, commits `Release vX.Y.Z`, tags `vX.Y.Z`, adds fresh `## [Unreleased]` changelog sections, commits `Add [Unreleased] section for next cycle`, then pushes `main` and the tag. Do not rerun the release script after a tag was pushed.
  ```

核验：`v1.4.0`

### E028

公开放最后：二进制先入 draft，后续失败由 cleanup 删除草稿

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `description: 'Source ref to build/publish (defaults to tag; use only for release recovery)'`，提示行 14

  ```text
  description: 'Source ref to build/publish (defaults to tag; use only for release recovery)'
  ```

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `# Keep the public GitHub Release publication last. Binary assets are staged in`，提示行 25

  ```text
  # Keep the public GitHub Release publication last. Binary assets are staged in
  ```

核验：`v1.4.0`

### E029

六个阶段 + 并行 3b env-daemons；publish-npm 的 needs 含两者

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `build:`，提示行 27

  ```text
  build:
  ```

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `smoke-test-binaries:`，提示行 131

  ```text
  smoke-test-binaries:
  ```

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `stage-github-release:`，提示行 210

  ```text
  stage-github-release:
  ```

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `# The pi-env daemon for every remote system @earendil-works/pi-env supports; the npm package ships them all.`，提示行 304

  ```text
  # The pi-env daemon for every remote system @earendil-works/pi-env supports; the npm package ships them all.
  ```

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `publish-npm:`，提示行 312

  ```text
  publish-npm:
  ```

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `announce-pi-dev-release:`，提示行 389

  ```text
  announce-pi-dev-release:
  ```

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `publish-github-release:`，提示行 430

  ```text
  publish-github-release:
  ```

核验：`v1.4.0`

### E030

公告：逐包校验 npm 版本与 tarball；release record 与 installer 用 if-none-match；latest 指针乐观锁且不降级

- [`scripts/publish-release-announcement.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish-release-announcement.mjs) — text: `for (const pkg of packages) {`，提示行 272

  ```text
  for (const pkg of packages) {
  ```

- [`scripts/publish-release-announcement.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish-release-announcement.mjs) — text: `async function resolvePackageFromNpm(pkg) {`，提示行 70

  ```text
  async function resolvePackageFromNpm(pkg) {
  ```

- [`scripts/publish-release-announcement.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish-release-announcement.mjs) — text: `export async function advanceLatestRelease(version, readLatest, writeLatest) {`，提示行 254

  ```text
  export async function advanceLatestRelease(version, readLatest, writeLatest) {
  ```

- [`scripts/publish-release-announcement.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish-release-announcement.mjs) — text: `const current = await readLatest();`，提示行 256

  ```text
  const current = await readLatest();
  ```

- [`scripts/publish-release-announcement.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish-release-announcement.mjs) — text: `"public, max-age=31536000, immutable",`，提示行 297

  ```text
  "public, max-age=31536000, immutable",
  ```

- [`scripts/publish-release-announcement.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish-release-announcement.mjs) — text: `"no-store",`，提示行 346

  ```text
  "no-store",
  ```

核验：`v1.4.0`

### E031

Nix 线：tag 构建要求版本等于 tag；stable 只 fast-forward 不回退

- [`.github/workflows/nix.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/nix.yml) — text: `build:`，提示行 87

  ```text
  build:
  ```

核验：`v1.4.0`

### E032

三处幂等：npm 已发布则跳过；公告对象 if-none-match；草稿 Release 由 cleanup job 兜底

- [`scripts/publish.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish.mjs) — text: `function isPublished(name, version) {`，提示行 13

  ```text
  function isPublished(name, version) {
  ```

- [`scripts/publish.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish.mjs) — text: `if (pkg.published) {`，提示行 50

  ```text
  if (pkg.published) {
  ```

- [`scripts/publish.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish.mjs) — text: `const args = ［"publish", pkg.tarballPath, "--access", "public", "--provenance", "--ignore-scripts"］;`，提示行 54

  ```text
  const args = ["publish", pkg.tarballPath, "--access", "public", "--provenance", "--ignore-scripts"];
  ```

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `cleanup-draft-github-release:`，提示行 460

  ```text
  cleanup-draft-github-release:
  ```

核验：`v1.4.0`

### E033

恢复动作：修好重跑失败 job，不重跑 release；Nix 的 tag 不能修，source_ref 仅供恢复

- [`.pi/skills/release.md`](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/skills/release.md) — text: `6. **If CI publish or announcement fails**: inspect the failed job. The publish helper is idempotent and skips package versions already present on npm; the announcement job rechecks availability before updating the R2 marker. Rerun the failed job or workflow after fixing CI or transient npm issues. Do not rerun `npm run release:patch` or `npm run release:minor` for the same version.`，提示行 52

  ```text
  6. **If CI publish or announcement fails**: inspect the failed job. The publish helper is idempotent and skips package versions already present on npm; the announcement job rechecks availability before updating the R2 marker. Rerun the failed job or workflow after fixing CI or transient npm issues. Do not rerun `npm run release:patch` or `npm run release:minor` for the same version.
  ```

- [`.pi/skills/release.md`](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/skills/release.md) — text: `5. **CI builds the Nix release**: the tag push also triggers `.github/workflows/nix.yml`, which builds the tagged flake on Linux and macOS and then fast-forwards the `stable` branch to the release commit. `nix run github:earendil-works/pi/stable` runs the latest release. If the Nix build fails, `stable` stays on the previous release; the tag cannot be fixed, so fix `main` and ship the fix in the next release.`，提示行 50

  ```text
  5. **CI builds the Nix release**: the tag push also triggers `.github/workflows/nix.yml`, which builds the tagged flake on Linux and macOS and then fast-forwards the `stable` branch to the release commit. `nix run github:earendil-works/pi/stable` runs the latest release. If the Nix build fails, `stable` stays on the previous release; the tag cannot be fixed, so fix `main` and ship the fix in the next release.
  ```

- [`.github/workflows/build-binaries.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/build-binaries.yml) — text: `description: 'Source ref to build/publish (defaults to tag; use only for release recovery)'`，提示行 14

  ```text
  description: 'Source ref to build/publish (defaults to tag; use only for release recovery)'
  ```

核验：`v1.4.0`

## sdlc-reference/04-ci-matrix.md

### E034

主 CI 触发 push/PR main；build-check-test 依次 build、check、env daemon 构建、npm test

- [`.github/workflows/ci.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/ci.yml) — text: `on:`，提示行 3

  ```text
  on:
  ```

- [`.github/workflows/ci.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/ci.yml) — text: `build-check-test:`，提示行 14

  ```text
  build-check-test:
  ```

- [`.github/workflows/ci.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/ci.yml) — text: `- name: Build the pi-env daemon`，提示行 41

  ```text
  - name: Build the pi-env daemon
  ```

核验：`v1.4.0`

### E035

mcp-conformance 是独立 job，用官方 conformance 套件对 baseline.json 锁协议兼容

- [`.github/workflows/ci.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/ci.yml) — text: `mcp-conformance:`，提示行 47

  ```text
  mcp-conformance:
  ```

- [`.github/workflows/ci.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/ci.yml) — text: `# Runs pi's MCP client from source against the pinned official conformance suite and fails on`，提示行 62

  ```text
  # Runs pi's MCP client from source against the pinned official conformance suite and fails on
  ```

核验：`v1.4.0`

### E036

根 npm test = 脚本单测 + 各 workspace test；evals 的普通单测在 CI 内，真实模型 eval 不在

- [`package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/package.json) — text: `"test": "npm run test:scripts && npm run test --workspaces --if-present",`，提示行 40

  ```text
  "test": "npm run test:scripts && npm run test --workspaces --if-present",
  ```

- [`packages/evals/package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/evals/package.json) — text: `"test": "vitest run --config vitest.test.config.ts"`，提示行 11

  ```text
  "test": "vitest run --config vitest.test.config.ts"
  ```

- [`packages/evals/package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/evals/package.json) — text: `"eval": "npm run eval:host && npm run eval:docs --",`，提示行 8

  ```text
  "eval": "npm run eval:host && npm run eval:docs --",
  ```

核验：`v1.4.0`

### E037

env.yml 路径门控的 PR 检查，四个 job：daemons / check / release-daemons（六平台）/ tests（五 OS）

- [`.github/workflows/env.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/env.yml) — text: `on:`，提示行 6

  ```text
  on:
  ```

- [`.github/workflows/env.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/env.yml) — text: `check:`，提示行 25

  ```text
  check:
  ```

- [`.github/workflows/env.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/env.yml) — text: `if (missing.length || unexpected.length) { console.error({ missing, unexpected }); process.exit(1); }`，提示行 70

  ```text
  if (missing.length || unexpected.length) { console.error({ missing, unexpected }); process.exit(1); }
  ```

- [`.github/workflows/env.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/env.yml) — text: `tests:`，提示行 128

  ```text
  tests:
  ```

- [`.github/workflows/env-daemons.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/env-daemons.yml) — text: `name: pi-env daemons`，提示行 1

  ```text
  name: pi-env daemons
  ```

核验：`v1.4.0`

### E038

nix.yml 五类触发；pin 刷新按 provider/type/api 判 stale；三系统 build；stable fast-forward；bot 回写 pin

- [`.github/workflows/nix.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/nix.yml) — text: `on:`，提示行 16

  ```text
  on:
  ```

- [`.github/workflows/nix.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/nix.yml) — text: `- name: Refresh the model catalog pin if stale`，提示行 68

  ```text
  - name: Refresh the model catalog pin if stale
  ```

- [`.github/workflows/nix.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/nix.yml) — text: `build:`，提示行 87

  ```text
  build:
  ```

- [`.github/workflows/nix.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/nix.yml) — text: `update-stable:`，提示行 136

  ```text
  update-stable:
  ```

- [`.github/workflows/nix.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/nix.yml) — text: `commit-pin:`，提示行 154

  ```text
  commit-pin:
  ```

核验：`v1.4.0`

### E039

npm-audit 每日/手动运行，production-only，moderate 及以上未接受即失败

- [`.github/workflows/npm-audit.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/npm-audit.yml) — text: `on:`，提示行 3

  ```text
  on:
  ```

- [`.github/workflows/npm-audit.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/npm-audit.yml) — text: `- name: Install dependencies without lifecycle scripts`，提示行 24

  ```text
  - name: Install dependencies without lifecycle scripts
  ```

- [`scripts/npm-audit.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/npm-audit.mjs) — text: `// Runs `npm audit --omit=dev` and fails on advisories at or above the audit`，提示行 1

  ```text
  // Runs `npm audit --omit=dev` and fails on advisories at or above the audit
  ```

- [`scripts/npm-audit.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/npm-audit.mjs) — text: `for (const id of Object.keys(acceptedAdvisories)) {`，提示行 69

  ```text
  for (const id of Object.keys(acceptedAdvisories)) {
  ```

核验：`v1.4.0`

### E040

模型目录数据链：generate 校验并做兼容检查；publish 有窗口限制；脚本拒绝不一致目录、用 SHA-256 作 revision、已当前则跳过

- [`.github/workflows/publish-model-catalog.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/publish-model-catalog.yml) — text: `on:`，提示行 3

  ```text
  on:
  ```

- [`.github/workflows/publish-model-catalog.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/publish-model-catalog.yml) — text: `generate:`，提示行 41

  ```text
  generate:
  ```

- [`.github/workflows/publish-model-catalog.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/publish-model-catalog.yml) — text: `# The compatibility check reads the latest release's source from its git tag.`，提示行 52

  ```text
  # The compatibility check reads the latest release's source from its git tag.
  ```

- [`.github/workflows/publish-model-catalog.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/publish-model-catalog.yml) — text: `publish:`，提示行 83

  ```text
  publish:
  ```

- [`.github/workflows/publish-model-catalog.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/publish-model-catalog.yml) — text: `- name: Check publication window`，提示行 119

  ```text
  - name: Check publication window
  ```

- [`scripts/publish-model-catalog.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish-model-catalog.mjs) — text: `const JSON_CONTENT_TYPE = "application/json; charset=utf-8";`，提示行 28

  ```text
  const JSON_CONTENT_TYPE = "application/json; charset=utf-8";
  ```

- [`scripts/publish-model-catalog.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish-model-catalog.mjs) — text: `const providersDir = join(inputDir, "providers");`，提示行 88

  ```text
  const providersDir = join(inputDir, "providers");
  ```

- [`scripts/publish-model-catalog.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish-model-catalog.mjs) — text: `const digest = createHash("sha256").update(allModelsBytes).digest("hex");`，提示行 160

  ```text
  const digest = createHash("sha256").update(allModelsBytes).digest("hex");
  ```

- [`scripts/publish-model-catalog.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/publish-model-catalog.mjs) — text: `...bundle.providerIds.flatMap((providerId) => ［`，提示行 307

  ```text
  ...bundle.providerIds.flatMap((providerId) => [
  ```

核验：`v1.4.0`

### E041

真实模型评估（eval/eval:host/eval:docs）需要 PI_PROVIDER/PI_MODEL，不在主 CI 命令内

- [`packages/evals/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/evals/README.md) — text: `Host evals (smoke, documentation audit) and documentation-lift evals need `PI_PROVIDER` and `PI_MODEL`.`，提示行 24

  ```text
  Host evals (smoke, documentation audit) and documentation-lift evals need `PI_PROVIDER` and `PI_MODEL`.
  ```

核验：`v1.4.0`

## sdlc-reference/05-testing-layers.md

### E042

test.sh 构造隔离 home/npm 配置，只删带 marker 的 pi-test.* 目录，用 env -i 白名单跑测试

- [`test.sh`](https://github.com/earendil-works/pi/blob/v1.4.0/test.sh) — text: `# Isolate user resources, credentials, temporary files, and tool configuration.`，提示行 4

  ```text
  # Isolate user resources, credentials, temporary files, and tool configuration.
  ```

- [`test.sh`](https://github.com/earendil-works/pi/blob/v1.4.0/test.sh) — text: `# Only remove the marked directory created above, never an unverified path.`，提示行 15

  ```text
  # Only remove the marked directory created above, never an unverified path.
  ```

- [`test.sh`](https://github.com/earendil-works/pi/blob/v1.4.0/test.sh) — text: `# Start from an empty environment and allow only required platform and test settings.`，提示行 39

  ```text
  # Start from an empty environment and allow only required platform and test settings.
  ```

- [`test.sh`](https://github.com/earendil-works/pi/blob/v1.4.0/test.sh) — text: `# Preserve CI detection only for runner behavior and test reporting.`，提示行 77

  ```text
  # Preserve CI detection only for runner behavior and test reporting.
  ```

- [`test.sh`](https://github.com/earendil-works/pi/blob/v1.4.0/test.sh) — text: `env -i "${test_env［@］}" npm test`，提示行 84

  ```text
  env -i "${test_env[@]}" npm test
  ```

核验：`v1.4.0`

### E043

suite 规则：用 harness.ts 与 faux provider，不用真实 key/网络，保持 CI 安全

- [`packages/coding-agent/test/suite/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/suite/README.md) — text: `- Use `test/suite/harness.ts``，提示行 6

  ```text
  - Use `test/suite/harness.ts`
  ```

- [`packages/coding-agent/test/suite/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/suite/README.md) — text: `- Do not use real provider APIs, real API keys, network calls, or paid tokens`，提示行 8

  ```text
  - Do not use real provider APIs, real API keys, network calls, or paid tokens
  ```

核验：`v1.4.0`

### E044

harness 用假 provider + 假 key，但 Agent/AgentSession 是真实实现，资源加载默认替身，响应脚本化、事件收集

- [`packages/coding-agent/test/suite/harness.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/suite/harness.ts) — text: `const fauxProvider: FauxProviderRegistration = registerFauxProvider({`，提示行 153

  ```text
  const fauxProvider: FauxProviderRegistration = registerFauxProvider({
  ```

- [`packages/coding-agent/test/suite/harness.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/suite/harness.ts) — text: `await authStorage.modify(model.provider, async () => ({ type: "api_key", key: "faux-key" }));`，提示行 168

  ```text
  await authStorage.modify(model.provider, async () => ({ type: "api_key", key: "faux-key" }));
  ```

- [`packages/coding-agent/test/suite/harness.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/suite/harness.ts) — text: `const agent = new Agent({`，提示行 195

  ```text
  const agent = new Agent({
  ```

- [`packages/coding-agent/test/suite/harness.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/suite/harness.ts) — text: `? await createTestExtensionsResult(options.extensionFactories, tempDir)`，提示行 229

  ```text
  ? await createTestExtensionsResult(options.extensionFactories, tempDir)
  ```

- [`packages/coding-agent/test/suite/harness.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/suite/harness.ts) — text: `session.subscribe((event) => {`，提示行 250

  ```text
  session.subscribe((event) => {
  ```

- [`packages/coding-agent/test/suite/harness.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/suite/harness.ts) — text: `setResponses: fauxProvider.setResponses,`，提示行 262

  ```text
  setResponses: fauxProvider.setResponses,
  ```

- [`packages/coding-agent/test/suite/harness.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/suite/harness.ts) — text: `return events.filter((event): event is Extract<AgentSessionEvent, { type: T }> => event.type === type);`，提示行 267

  ```text
  return events.filter((event): event is Extract<AgentSessionEvent, { type: T }> => event.type === type);
  ```

核验：`v1.4.0`

### E045

faux provider 经 pi-ai 的 ./compat 子路径公开导出，宿主 harness 自身也这样导入

- [`packages/ai/package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/package.json) — text: `"./compat": {`，提示行 22

  ```text
  "./compat": {
  ```

- [`packages/ai/src/compat.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/src/compat.ts) — text: `export function registerFauxProvider(options: RegisterFauxProviderOptions = {}): FauxProviderRegistration {`，提示行 162

  ```text
  export function registerFauxProvider(options: RegisterFauxProviderOptions = {}): FauxProviderRegistration {
  ```

- [`packages/ai/src/compat.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/ai/src/compat.ts) — text: `export function streamSimple<TApi extends Api>(`，提示行 278

  ```text
  export function streamSimple<TApi extends Api>(
  ```

- [`packages/coding-agent/test/suite/harness.ts`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/test/suite/harness.ts) — text: `import { registerFauxProvider, streamSimple } from "@earendil-works/pi-ai/compat";`，提示行 18

  ```text
  import { registerFauxProvider, streamSimple } from "@earendil-works/pi-ai/compat";
  ```

核验：`v1.4.0`

### E046

release smoke 标准：Node 与 Bun 各跑一次真实 prompt 并等模型回复，启动不算通过

- [`.pi/skills/interactive-testing.md`](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/skills/interactive-testing.md) — text: `For release smoke tests, start the tmux session with `-c /tmp` and replace `./pi-test.sh` with the absolute path to the release binary. Test both Node and Bun binaries separately, submit a prompt, and wait for the model reply; startup alone is not a passing smoke test.`，提示行 19

  ```text
  For release smoke tests, start the tmux session with `-c /tmp` and replace `./pi-test.sh` with the absolute path to the release binary. Test both Node and Bun binaries separately, submit a prompt, and wait for the model reply; startup alone is not a passing smoke test.
  ```

核验：`v1.4.0`

### E047

evals 文档评估：Docker 配对 with/without docs，两臂各一分数才计入 lift，需要 PI_PROVIDER/PI_MODEL，单次不能证明稳定性

- [`packages/evals/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/evals/README.md) — text: `- `*.docs.eval.ts` is a documentation-lift eval. `eval:docs` runs each case in isolated `without_docs` and `with_docs` containers and reports lift.`，提示行 9

  ```text
  - `*.docs.eval.ts` is a documentation-lift eval. `eval:docs` runs each case in isolated `without_docs` and `with_docs` containers and reports lift.
  ```

- [`packages/evals/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/evals/README.md) — text: ``without_docs` omits the coding-agent `README.md`, `CHANGELOG.md`, `docs/`, and `examples/`, then removes the Pi documentation-routing section from the default system prompt.`，提示行 84

  ```text
  `without_docs` omits the coding-agent `README.md`, `CHANGELOG.md`, `docs/`, and `examples/`, then removes the Pi documentation-routing section from the default system prompt.
  ```

- [`packages/evals/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/evals/README.md) — text: `1. Mounts the repository ephemerally for a Docker build, packs the current workspace packages using the repository's consumer-install machinery, then creates separate `without_docs` and `with_docs` images from the staged runtime.`，提示行 73

  ```text
  1. Mounts the repository ephemerally for a Docker build, packs the current workspace packages using the repository's consumer-install machinery, then creates separate `without_docs` and `with_docs` images from the staged runtime.
  ```

- [`packages/evals/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/evals/README.md) — text: `A pair contributes to pass-rate lift only when both arms produce exactly one score. Missing, duplicate, skipped, pending, unscored, or errored arms block the pair. If any pair in an eval set is blocked, headline pass rates are withheld. Missing telemetry remains unavailable rather than being treated as zero.`，提示行 103

  ```text
  A pair contributes to pass-rate lift only when both arms produce exactly one score. Missing, duplicate, skipped, pending, unscored, or errored arms block the pair. If any pair in an eval set is blocked, headline pass rates are withheld. Missing telemetry remains unavailable rather than being treated as zero.
  ```

- [`packages/evals/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/evals/README.md) — text: `Documentation evals allow only `read`, `write`, `edit`, `grep`, `find`, and `ls` by default. They do not expose shell or web-search tools. Provider traffic still requires container network access, so Docker alone cannot prove that arbitrary code written by an agent never uses the network.`，提示行 90

  ```text
  Documentation evals allow only `read`, `write`, `edit`, `grep`, `find`, and `ls` by default. They do not expose shell or web-search tools. Provider traffic still requires container network access, so Docker alone cannot prove that arbitrary code written by an agent never uses the network.
  ```

- [`packages/evals/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/evals/README.md) — text: `Host evals (smoke, documentation audit) and documentation-lift evals need `PI_PROVIDER` and `PI_MODEL`.`，提示行 24

  ```text
  Host evals (smoke, documentation audit) and documentation-lift evals need `PI_PROVIDER` and `PI_MODEL`.
  ```

- [`packages/evals/README.md`](https://github.com/earendil-works/pi/blob/v1.4.0/packages/evals/README.md) — text: `The report flags no lift, negative deltas, saturated controls or treatments, and observed flakiness. One repetition cannot establish stability.`，提示行 105

  ```text
  The report flags no lift, negative deltas, saturated controls or treatments, and observed flakiness. One repetition cannot establish stability.
  ```

核验：`v1.4.0`

## sdlc-reference/03-check-pipeline.md

### E048

check 链：biome（--write，warning 即失败）→ pinned-deps → runtime-deps → ts-imports → entry-graphs → install-lock → tsc → browser-smoke

- [`package.json`](https://github.com/earendil-works/pi/blob/v1.4.0/package.json) — text: `"check": "node scripts/biome-check.mjs --write && npm run check:pinned-deps && npm run check:runtime-deps && npm run check:ts-imports && npm run check:entry-graphs && npm run check:install-lock:coding-agent && tsc --noEmit && npm run check:browser-smoke",`，提示行 21

  ```text
  "check": "node scripts/biome-check.mjs --write && npm run check:pinned-deps && npm run check:runtime-deps && npm run check:ts-imports && npm run check:entry-graphs && npm run check:install-lock:coding-agent && tsc --noEmit && npm run check:browser-smoke",
  ```

核验：`v1.4.0`

### E049

pinned-deps：所有直接 registry 依赖（含内部包）必须 exact，非 registry specifier 跳过

- [`scripts/check-pinned-deps.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-pinned-deps.mjs) — text: `for (const ［name, specifier］ of Object.entries(dependencies)) {`，提示行 47

  ```text
  for (const [name, specifier] of Object.entries(dependencies)) {
  ```

- [`scripts/check-pinned-deps.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-pinned-deps.mjs) — text: `function isNonRegistrySpecifier(specifier) {`，提示行 24

  ```text
  function isNonRegistrySpecifier(specifier) {
  ```

- [`scripts/check-pinned-deps.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-pinned-deps.mjs) — text: `function getVersionSpecifier(specifier) {`，提示行 28

  ```text
  function getVersionSpecifier(specifier) {
  ```

核验：`v1.4.0`

### E050

runtime-deps：检查公开 workspace 包 src 的静态 import/export/require，要求依赖已声明

- [`scripts/check-runtime-deps.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-runtime-deps.mjs) — text: `function checkSource(source, manifest) {`，提示行 26

  ```text
  function checkSource(source, manifest) {
  ```

核验：`v1.4.0`

### E051

ts-imports：禁止 .ts 源码里相对 .js 说明符

- [`scripts/check-ts-relative-imports.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-ts-relative-imports.mjs) — text: `function isRelativeJavaScriptSpecifier(specifier) {`，提示行 37

  ```text
  function isRelativeJavaScriptSpecifier(specifier) {
  ```

- [`scripts/check-ts-relative-imports.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-ts-relative-imports.mjs) — text: `if (failures.length > 0) {`，提示行 101

  ```text
  if (failures.length > 0) {
  ```

核验：`v1.4.0`

### E052

entry-graphs：入口即成本合同；按入口给 maxFiles/forbid/allow 预算，只计 value import

- [`scripts/check-entry-graphs.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-entry-graphs.mjs) — text: `* Entry points are cost contracts.`，提示行 3

  ```text
  * Entry points are cost contracts.
  ```

- [`scripts/check-entry-graphs.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-entry-graphs.mjs) — text: `* Only value imports count. `import type` / `export type` are erased before Node sees them.`，提示行 11

  ```text
  * Only value imports count. `import type` / `export type` are erased before Node sees them.
  ```

- [`scripts/check-entry-graphs.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-entry-graphs.mjs) — text: `"./models": {`，提示行 38

  ```text
  "./models": {
  ```

核验：`v1.4.0`

### E053

install-lock --check：重生成并逐字比对；带 install script 的包须在显式 allowlist

- [`scripts/generate-coding-agent-install-lock.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/generate-coding-agent-install-lock.mjs) — text: `const allowedInstallScriptPackages = new Map(［`，提示行 17

  ```text
  const allowedInstallScriptPackages = new Map([
  ```

- [`scripts/generate-coding-agent-install-lock.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/generate-coding-agent-install-lock.mjs) — text: `if (!packageName || !entry.version) {`，提示行 320

  ```text
  if (!packageName || !entry.version) {
  ```

核验：`v1.4.0`

### E054

browser-smoke：用 esbuild 打浏览器目标，断言包含中立入口且不含 node adapter/被禁依赖

- [`scripts/check-browser-smoke.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-browser-smoke.mjs) — text: `for (const expectedInput of ［`，提示行 66

  ```text
  for (const expectedInput of [
  ```

- [`scripts/check-browser-smoke.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-browser-smoke.mjs) — text: `for (const forbiddenInput of ［`，提示行 100

  ```text
  for (const forbiddenInput of [
  ```

核验：`v1.4.0`

### E055

pre-commit：无条件 lockfile gate + npm run check；仅命中前端/依赖路径时加跑 browser smoke；随后重暂存

- [`.husky/pre-commit`](https://github.com/earendil-works/pi/blob/v1.4.0/.husky/pre-commit) — text: `node scripts/check-lockfile-commit.mjs`，提示行 6

  ```text
  node scripts/check-lockfile-commit.mjs
  ```

- [`.husky/pre-commit`](https://github.com/earendil-works/pi/blob/v1.4.0/.husky/pre-commit) — text: `RUN_BROWSER_SMOKE=0`，提示行 37

  ```text
  RUN_BROWSER_SMOKE=0
  ```

- [`.husky/pre-commit`](https://github.com/earendil-works/pi/blob/v1.4.0/.husky/pre-commit) — text: `# Restage files that were previously staged and may have been modified by formatting`，提示行 56

  ```text
  # Restage files that were previously staged and may have been modified by formatting
  ```

核验：`v1.4.0`

### E056

lockfile gate：PI_ALLOW_LOCKFILE_CHANGE 放行、仅 workspace 元数据放行，其余失败并打印人工审查清单

- [`scripts/check-lockfile-commit.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-lockfile-commit.mjs) — text: `const stagedFiles = git(［"diff", "--cached", "--name-only"］)`，提示行 77

  ```text
  const stagedFiles = git(["diff", "--cached", "--name-only"])
  ```

- [`scripts/check-lockfile-commit.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-lockfile-commit.mjs) — text: `const allowValue = process.env.PI_ALLOW_LOCKFILE_CHANGE;`，提示行 5

  ```text
  const allowValue = process.env.PI_ALLOW_LOCKFILE_CHANGE;
  ```

- [`scripts/check-lockfile-commit.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-lockfile-commit.mjs) — text: `if (allowed) {`，提示行 86

  ```text
  if (allowed) {
  ```

- [`scripts/check-lockfile-commit.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-lockfile-commit.mjs) — text: `const changes = getLockfilePackageChanges();`，提示行 91

  ```text
  const changes = getLockfilePackageChanges();
  ```

- [`scripts/check-lockfile-commit.mjs`](https://github.com/earendil-works/pi/blob/v1.4.0/scripts/check-lockfile-commit.mjs) — text: `console.error("Review lockfile changes before committing:");`，提示行 99

  ```text
  console.error("Review lockfile changes before committing:");
  ```

核验：`v1.4.0`

## sdlc-reference/01-contribution-gates.md

### E057

新贡献者 issue/PR 默认自动关闭；维护者用 lgtmi/lgtm 恢复资格，命令须在回复首或尾

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `All issues and PRs from new contributors are auto-closed by default.`，提示行 23

  ```text
  All issues and PRs from new contributors are auto-closed by default.
  ```

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `Maintainers review auto-closed issues daily and reopen worthwhile ones. Issues that do not meet the quality bar below will not be reopened or receive a reply.`，提示行 27

  ```text
  Maintainers review auto-closed issues daily and reopen worthwhile ones. Issues that do not meet the quality bar below will not be reopened or receive a reply.
  ```

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `- `lgtmi`: your future issues will not be auto-closed`，提示行 31

  ```text
  - `lgtmi`: your future issues will not be auto-closed
  ```

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `The command must be at the start of the reply (optionally after one or more `@username` mentions) or at the end. `lgtmi` does not grant rights to submit PRs. Only `lgtm` grants rights to submit PRs.`，提示行 34

  ```text
  The command must be at the start of the reply (optionally after one or more `@username` mentions) or at the end. `lgtmi` does not grant rights to submit PRs. Only `lgtm` grants rights to submit PRs.
  ```

核验：`v1.4.0`

### E058

issue 质量门槛：用模板、短而具体、值得读

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `If you open an issue, you must use one of the two GitHub issue templates.`，提示行 38

  ```text
  If you open an issue, you must use one of the two GitHub issue templates.
  ```

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `If you open an issue, keep it short, concrete, and worth reading.`，提示行 40

  ```text
  If you open an issue, keep it short, concrete, and worth reading.
  ```

核验：`v1.4.0`

### E059

PR 前置：已获 lgtm；npm run check 与 ./test.sh 都通过；不改 CHANGELOG

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `Do not open a PR unless you have already been approved by a maintainer using `lgtm` in the command position described above.`，提示行 58

  ```text
  Do not open a PR unless you have already been approved by a maintainer using `lgtm` in the command position described above.
  ```

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `npm run check`，提示行 63

  ```text
  npm run check
  ```

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `Both must pass.`，提示行 67

  ```text
  Both must pass.
  ```

- [`CONTRIBUTING.md`](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md) — text: `Do not edit `CHANGELOG.md`. Changelog entries are added by maintainers.`，提示行 69

  ```text
  Do not edit `CHANGELOG.md`. Changelog entries are added by maintainers.
  ```

核验：`v1.4.0`

### E060

issue-gate 只在 opened 触发；受信 bot/协作者/批准文件放行，其余加 untriaged 并以 not_planned 关闭

- [`.github/workflows/issue-gate.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/issue-gate.yml) — text: `types: ［opened］`，提示行 5

  ```text
  types: [opened]
  ```

- [`.github/workflows/issue-gate.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/issue-gate.yml) — text: `const TRUSTED_BOT_AUTHORS = new Set(［'dependabot［bot］', 'sentry［bot］', 'claude［bot］'］);`，提示行 20

  ```text
  const TRUSTED_BOT_AUTHORS = new Set(['dependabot[bot]', 'sentry[bot]', 'claude[bot]']);
  ```

- [`.github/workflows/issue-gate.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/issue-gate.yml) — text: `const permission = await getPermission(issueAuthor);`，提示行 84

  ```text
  const permission = await getPermission(issueAuthor);
  ```

- [`.github/workflows/issue-gate.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/issue-gate.yml) — text: `const approvedContent = await getTextFile(APPROVED_FILE);`，提示行 90

  ```text
  const approvedContent = await getTextFile(APPROVED_FILE);
  ```

- [`.github/workflows/issue-gate.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/issue-gate.yml) — text: `const message = ［`，提示行 99

  ```text
  const message = [
  ```

核验：`v1.4.0`

### E061

untriaged 标签由 issue-triage-labels 维护：重开/标记时清理，last-read 前进时关闭未处理项

- [`.github/workflows/issue-triage-labels.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/issue-triage-labels.yml) — text: `const UNTRIAGED_LABEL = 'untriaged';`，提示行 17

  ```text
  const UNTRIAGED_LABEL = 'untriaged';
  ```

- [`.github/workflows/issue-triage-labels.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/issue-triage-labels.yml) — text: `state_reason: 'not_planned',`，提示行 165

  ```text
  state_reason: 'not_planned',
  ```

核验：`v1.4.0`

### E062

pr-gate 只在 pull_request_target opened 触发；批准文件需 capability 恰为 pr，否则关闭 PR

- [`.github/workflows/pr-gate.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/pr-gate.yml) — text: `types: ［opened］`，提示行 5

  ```text
  types: [opened]
  ```

- [`.github/workflows/pr-gate.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/pr-gate.yml) — text: `const permission = await getPermission(prAuthor);`，提示行 101

  ```text
  const permission = await getPermission(prAuthor);
  ```

- [`.github/workflows/pr-gate.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/pr-gate.yml) — text: `const approvedContent = await getTextFile(APPROVED_FILE);`，提示行 107

  ```text
  const approvedContent = await getTextFile(APPROVED_FILE);
  ```

- [`.github/workflows/pr-gate.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/pr-gate.yml) — text: `console.log(`${prAuthor} is not approved, closing PR`);`，提示行 116

  ```text
  console.log(`${prAuthor} is not approved, closing PR`);
  ```

核验：`v1.4.0`

### E063

approve-contributor 在 issue_comment created 生效；评论者需写权限，lgtm→pr、lgtmi→issue，已有 pr 不降级，随后 bot 提交批准文件

- [`.github/workflows/approve-contributor.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/approve-contributor.yml) — text: `const approvalAtStartPattern = /^［\s.］*(?:@［A-Za-z0-9］(?:［A-Za-z0-9-］{0,37}［A-Za-z0-9］)?(?:\s*,\s*|［.:］\s*|\s+))*(lgtmi|lgtm)(?=$|［\s］|［^\p{L}\p{N}_\s］)/iu;`，提示行 33

  ```text
  const approvalAtStartPattern = /^[\s.]*(?:@[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?(?:\s*,\s*|[.:]\s*|\s+))*(lgtmi|lgtm)(?=$|[\s]|[^\p{L}\p{N}_\s])/iu;
  ```

- [`.github/workflows/approve-contributor.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/approve-contributor.yml) — text: `const { data: permissionLevel } = await github.rest.repos.getCollaboratorPermissionLevel({`，提示行 46

  ```text
  const { data: permissionLevel } = await github.rest.repos.getCollaboratorPermissionLevel({
  ```

- [`.github/workflows/approve-contributor.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/approve-contributor.yml) — text: `const content = fs.readFileSync(APPROVED_FILE, 'utf8');`，提示行 133

  ```text
  const content = fs.readFileSync(APPROVED_FILE, 'utf8');
  ```

- [`.github/workflows/approve-contributor.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/approve-contributor.yml) — text: `for (const username of approvalTargets) {`，提示行 140

  ```text
  for (const username of approvalTargets) {
  ```

- [`.github/workflows/approve-contributor.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/workflows/approve-contributor.yml) — text: `- name: Commit and push`，提示行 176

  ```text
  - name: Commit and push
  ```

核验：`v1.4.0`

### E064

四类 issue 模板：bug 要求 pi -ne 预验证与最小复现，contribution 是 PR 前置，package-report 走独立入口，config 关闭空白 issue

- [`.github/ISSUE_TEMPLATE/bug.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/ISSUE_TEMPLATE/bug.yml) — text: `**Important:** before reporting an issue in core, please validate first with `pi -ne` that this is not caused by an extension you loaded.`，提示行 14

  ```text
  **Important:** before reporting an issue in core, please validate first with `pi -ne` that this is not caused by an extension you loaded.
  ```

- [`.github/ISSUE_TEMPLATE/bug.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/ISSUE_TEMPLATE/bug.yml) — text: `description: Minimal steps to trigger the bug.`，提示行 28

  ```text
  description: Minimal steps to trigger the bug.
  ```

- [`.github/ISSUE_TEMPLATE/contribution.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/ISSUE_TEMPLATE/contribution.yml) — text: `description: Propose a change or feature (required for new contributors before submitting a PR)`，提示行 2

  ```text
  description: Propose a change or feature (required for new contributors before submitting a PR)
  ```

- [`.github/ISSUE_TEMPLATE/package-report.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/ISSUE_TEMPLATE/package-report.yml) — text: `description: Report a problematic Pi package listed on pi.dev`，提示行 2

  ```text
  description: Report a problematic Pi package listed on pi.dev
  ```

- [`.github/ISSUE_TEMPLATE/config.yml`](https://github.com/earendil-works/pi/blob/v1.4.0/.github/ISSUE_TEMPLATE/config.yml) — text: `blank_issues_enabled: false`，提示行 1

  ```text
  blank_issues_enabled: false
  ```

核验：`v1.4.0`
