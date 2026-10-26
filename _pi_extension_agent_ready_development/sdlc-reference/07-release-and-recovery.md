# 07 发布与恢复：lockstep 版本、tag 管线与幂等性

pi-mono 的发布不是「一条命令把包推到 npm」，而是一条跨本地脚本与 CI、分阶段顺序执行的管线：本地准备并推 tag，CI 构建并 smoke 产物，再按顺序 stage GitHub Release → 发布 npm → 公告 pi.dev → 公开 GitHub Release（CI 侧分段见[发布后一节](#发布后ci-的六个阶段)），草稿创建之后的任一步失败则删除草稿 Release。恢复能力来自每一步的幂等设计，而不是来自回滚。基线与逐条证据见 `../_evidence/render.md`。

## lockstep 版本与两类发布入口

**锁步版本**（**主仓要求**）：所有包共享同一个版本号，一起发布。

> **Lockstep versioning**: all packages share one version; every release updates all together. `patch` = fixes + additions, `minor` = breaking changes. No major releases.

版本同步有独立校验：`scripts/sync-versions.js` 收集非 private 的 workspace 包，若版本集合大于 1 就直接报错并提示运行 `version:patch/minor/major`；`scripts/publish.mjs` 在发布前再断言一次 lockstep。发布脚本 `release.mjs` 的 bump 步骤是先 `npm version --workspaces --no-git-tag-version` 再跑 `sync-versions.js` 同步内部依赖范围。

[E023](../_evidence/render.md#e023)

需要区分两个发布入口（**主仓要求**）：

| 入口 | 命令 | 是否对外发布 |
|---|---|---|
| 本地预演 | `npm run release:local -- --out <dir> --force` | 否，只在仓外目录安装 tarball 做 smoke |
| 真实发布 | `PI_ALLOW_LOCKFILE_CHANGE=1 npm_config_min_release_age=0 npm run release:patch`（或 `release:minor`） | 是，推 `main` 与 tag 触发 CI 发布 |

`release:local` 由 `scripts/local-release.mjs` 实现，把可发布包逐个 pack 后在仓库外的隔离目录安装，用于验证「用户实际安装的形态」。两个环境变量各有明确理由：`PI_ALLOW_LOCKFILE_CHANGE=1` 是绕过本地 lockfile commit gate 的人工豁免（见 [03 页](03-check-pipeline.md)）；`npm_config_min_release_age=0` 只用于该命令，避免 npm age gate 挡住刚发布不久的 workspace 版本刷新。

[E024](../_evidence/render.md#e024)

## 发布前：本地准备链

`.pi/skills/release.md` 规定发布前必须完成三件事（**主仓要求**）：

1. **changelog 先审**。先问用户是否已在 `main` 最新提交上跑过 `/cl`；没跑过就必须先跑，让它审计并补齐各包 `[Unreleased]`。`/cl` 的审计规则包括跳过 changelog/文档/发布杂务提交、按 `git show --stat` 判定受影响包、以及把影响终端用户的 `ai`/`agent`/`tui` 变更复制到 `coding-agent`。这与贡献者不得编辑 `CHANGELOG.md` 的规则互补：条目由维护者在合并/发布时添加。
2. **仓外本地 smoke**。构建一个未发布 release 并在仓库外目录验证：Node 与 Bun 两种形态各跑 `--help`、`--version`、`--list-models`、一次真实 `-p` prompt，以及一次交互启动并在 tmux 中提交 prompt 等待模型回复。「启动不算通过」这条标准与交互层测试同源（[05 页](05-testing-layers.md)）。失败是发布 blocker，除非用户显式接受风险。
3. **跑发布脚本**（见下节）。

[E025](../_evidence/render.md#e025)

## 发布中：release.mjs 的十个步骤

`scripts/release.mjs` 的文件头把流程列为十步，实际执行顺序与之对应：

1. 检查工作树干净，有未提交改动即退出。
2. **先验证所有公开 workspace 包已在 npm 注册**，再动工作树；缺注册的包直接列出并失败（，调用点 ）。
3. **pin 最新已发布的模型目录并用它构建**（v1.3.0 起，不再是 `--if-stale` 的「顺手刷新」）：`pinAndBuildWithNewestModelCatalog()` 无条件 pin → `hydrateModelCatalogBytes` → `npm run build:offline`；失败会恢复已提交的 pin，并提示「先发布一版目录」（实现 ）。理由：Nix 构建必须用 release 时代最新的模型数据，而 pin 一旦随 tag 落地就不可改。
4. bump 或设置显式版本，并清理 npm version 留下的陈旧 workspace lock 条目、刷新 lockfile、`npm ci --ignore-scripts` 重新水合。
5. 把各包 `[Unreleased]` 替换为 `## [version] - date`。
6. 重生成发布产物：`generate:models`、`check:model-data`、`install-lock:coding-agent`。
7. 跑 `npm run check`、`npm run build:offline`、`./test.sh`、`npm run check:package-install`——即发布前把 CI 的主要检查在本地再走一遍，并额外验证 packed consumer 安装。
8. 暂存改动（含未跟踪文件，用 `git ls-files -m -o -d --exclude-standard`）、提交 `Release vX.Y.Z`、打 tag `vX.Y.Z`。
9. 在每个 changelog 顶部插入新的 `[Unreleased]` 段并单独提交 `Add [Unreleased] section for next cycle`。
10. `git push origin main` 与 `git push origin vX.Y.Z`。

[E026](../_evidence/render.md#e026)

注意第 8–9 步合起来是「两次提交 + 一个 tag」的形状：release commit 携带版本与产物，第二个提交只加下个周期的 `[Unreleased]` 段。release skill 同时给出禁令：**tag 推出去后不要重跑 release 脚本**。

[E027](../_evidence/render.md#e027)

## 发布后：CI 的六个阶段

推 tag 触发 `.github/workflows/build-binaries.yml`（也支持手动 `workflow_dispatch` 并带 `source_ref` 用于发布恢复，）。工作流头部声明了顺序理由（**主仓要求**）：

> Keep the public GitHub Release publication last. Binary assets are staged in a draft release first; cleanup removes the draft if later publishing fails.

[E028](../_evidence/render.md#e028)

| 阶段 | 做什么 | 关键约束 |
|---|---|---|
| 1. build | 用 `create-source-archive.sh` 生成源码归档，从归档（而非工作树）构建六个平台二进制，抽取 release notes，校验 install-lock，组装资产与 `SHA256SUMS` | 构建输入来自归档内容 |
| 2. smoke-test-binaries | Linux/macOS/Windows 三平台各自解包并跑 `--help`、`--version`、codemode binary smoke | 每个平台只测自己那份产物 |
| 3. stage-github-release | 先 `sha256sum -c` 校验，创建 **draft** GitHub Release 并上传资产，再断言实际资产集合与预期逐名一致 | 若 Release 已公开则拒绝改动（`Refusing to mutate a public release`） |
| 3b. env-daemons | 复用 `env-daemons.yml`，为 pi-env 支持的每个平台原生构建 daemon 并上传 artifact | **v1.2.0 新增**；`publish-npm` 由 `needs: stage-github-release` 改为 `needs: [stage-github-release, env-daemons]` |
| 4. publish-npm | 完整 `npm ci --ignore-scripts`、build、check、test、`check:package-install`，下载 pi-env daemon artifact 到 `packages/env/bin` 并逐一断言存在，升级到 npm 11.16.0 后跑 `node scripts/publish.mjs` | 走 npm trusted publishing（OIDC + `npm-publish` environment），无本地 `npm publish`/OTP；npm 包必须带上八个平台的 daemon |
| 5. announce-pi-dev-release | 核对每个包在 npm 上的确切版本与 tarball 可用后，把 release record 与 `latest.json` 写入 R2 | 公告只在此 job 成功后成立 |
| 6. publish-github-release | 最后把 draft 改为公开（`gh release edit --draft=false`） | 直接依赖 stage/publish-npm/announce 三个 job（传递依赖全部前序 job） |

> **表头「六个阶段」的计数口径**：`env-daemons`（3b）是 v1.2.0 新增的并行前置 job，不是独立的顺序阶段——它不进入草稿 Release 的资产集合，只是 `publish-npm` 的第二个 `needs`。阶段总数仍是六个。

[E029](../_evidence/render.md#e029)

第 5 阶段的行为细节值得单列（**主仓要求**）：`publish-release-announcement.mjs` 会遍历所有公开包要求版本恰为发布版本，带重试地校验 npm 元数据与 tarball 可访问，再写 immutable 的 `releases/v1/releases/<version>.json` 与 installer 产物（均带 `if-none-match: *`，已存在时 release record 打印一行、installer 对象静默跳过），最后推进 `latest.json` 指针。指针推进用乐观锁：读当前 ETag，以 `--if-match` 写入，最多 5 次，并且**只在目标版本高于当前版本时前进**（`compareReleaseVersions(...) <= 0` 即返回未推进，）。immutable 对象用 `max-age=31536000`，`latest.json` 用 `no-store`。

[E030](../_evidence/render.md#e030)

并行还有一条 Nix 发布线：tag 触发 `nix.yml` 在三系统 `nix build`，tag 构建要求 `pi --version` 输出恰等于 tag 版本号；全系统成功后 `update-stable` 把 `stable` 分支**非强制 fast-forward** 到 release commit，注释明确「没有 `--force` 时 push 失败，因此 stable 永不回退到更旧的 release」。

[E031](../_evidence/render.md#e031)

## 幂等与恢复：为什么不需要回滚

发布管线的恢复策略是「修好再重跑失败的 job」，而不是回滚已推的 tag 或已发布的包。支撑这一点的是三处显式幂等：

1. **npm 发布可重跑**。`publish.mjs` 对每个包先查 `npm view <name>@<version>`（`isPublished()`，），已发布的包只打印跳过、不进 `npm publish` 循环，未发布的才以 `--provenance --ignore-scripts` 发布。

   > **v1.2.0 改形**：`publish.mjs` 由 **110** 行缩为 64 行（`wc -l` 实测：v0.86.1 / v1.0.0 / v1.0.3 / `98d2e1947` 均为 110 行，v1.2.0 为 64 行；原写 108 行不成立于任何 tag）——打包与 tarball 校验移入 `scripts/package-artifacts.mjs`（`produceArtifactSet()`），`npm` 调用移入 `scripts/npm-command.mjs`（`execNpmSync()`），本脚本只剩编排。因此"已发布则只做 `npm pack --dry-run` 内容校验"这一表述在 v1.2.0 不再准确：内容校验现在由 `package-artifacts.mjs` 承担，`publish.mjs` 只按 `published` 布尔分流。
2. **公告可重跑**。release record 与 installer 对象都用 `if-none-match: *` 写入，已存在时 release record 打印一行、installer 对象静默跳过；`latest.json` 指针用 ETag 条件写并有「不降级」判断（见上节）。
3. **GitHub Release 有草稿中间态**。draft 先建、公开最后做；资产集合不符即失败；失败路径由 `cleanup-draft-github-release` 兜底——该 job 用 `always()` 且仅在 stage-github-release 实际运行过（非 `skipped`）而它自身或任一后续 job 未成功时运行，删除仍是 draft 的 Release——包括 stage 在草稿已创建后失败的情况；构建/smoke 等更早失败使 stage 被跳过（无草稿）时不运行。

[E032](../_evidence/render.md#e032)

恢复动作与禁令（**主仓要求**）：

> **If CI publish or announcement fails**: inspect the failed job. The publish helper is idempotent and skips package versions already present on npm; the announcement job rechecks availability before updating the R2 marker. Rerun the failed job or workflow after fixing CI or transient npm issues. Do not rerun `npm run release:patch` or `npm run release:minor` for the same version.

Nix 线的同类规则不同：**tag 不能修**。若 Nix 构建失败，`stable` 停在上一个 release，修 `main` 并把修复放进下一个 release。手动 `workflow_dispatch` 的 `source_ref` 输入是这条限制的显式出口，注释限定用途为 `use only for release recovery`。

[E033](../_evidence/render.md#e033)

## 权威位置与人工判断

| 事实 | 当前基线上的位置 | 由谁决定 |
|---|---|---|
| 版本号与范围语义 | 各包 `package.json`，靠 `sync-versions.js` 校验 lockstep | 脚本校验 + 维护者选 patch/minor |
| 已发布版本记录 | npm registry 的包元数据与 tarball | CI 写入 |
| 面向用户的最新版本 | R2 `releases/v1/latest.json`（只前进） | `announce-pi-dev-release` job |
| 安装器包与锁 | R2 `installer/v1/...`，源自 `packages/coding-agent/install-lock/` | 生成器 + release 脚本 |
| Nix 可运行版本 | `stable` 分支（fast-forward） | `nix.yml` 的 `update-stable` |
| 发布的公开产物 | GitHub Release（先 draft 后公开） | `build-binaries.yml` 各 job |
| 风险的接受 | release skill 的 smoke 通过标准 | 维护者（"unless the user explicitly accepts the risk"） |

注意最后一行：**管线不替人接受风险**。smoke 未过而发版是显式的人的决定，不是脚本能力。

## 反例

- **「CI 绿」不等于已发布**。npm 发布、公告、GitHub Release 公开、`stable` 前进是四个独立结果；任一失败都使「已发布」不成立（对照 [04 页](04-ci-matrix.md)的「不在普通 PR CI」清单）。
- **重跑不等于重新发布**。重跑成功的 job 会跳过已存在的版本与对象；这既让恢复安全，也意味着重跑不会产生第二份包或改写已 immutable 的 release record。
- **公告顺序有硬保证，不是惯例**：npm 侧的可用性在写 R2 之前被逐包核验，因此 `latest.json` 不会指向 npm 上还拿不到的版本。
- **`latest.json` 只前进**：低版本发布不会把指针拉回去，尝试这样做只会得到"already the latest"一行日志。
- **不要用 `release:local` 代替发布验证**：它在隔离目录安装 tarball，但不推 tag、不触发任何 CI 阶段，也不产生公告。
- **本地 hook 与发布无关**：lockfile commit gate 是 pre-commit hook 的独立步骤、不在 `npm run check` 里（[03 页](03-check-pipeline.md)），CI 发布 job 不执行它。

**扩展仓建议**：可移用四条——(a) 发布前把 CI 主要检查在本地走一遍并额外做一次仓外安装验证；(b) 把「不可变的产物记录」与「可变的 latest 指针」分开，指针只前进并用条件写做并发保护；(c) 让发布步骤幂等（已存在的版本跳过而非报错），从而用重跑代替回滚；(d) 把「产物先草稿、公开放最后」作为默认顺序。lockstep 与是否发布六个平台二进制属**仓库自定**；单包扩展仓通常不需要锁步版本。
