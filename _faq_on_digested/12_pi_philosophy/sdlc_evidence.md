# Pi SDLC 证据账本：需求准入、实施、质量、供应链与发布恢复

## 0. 范围、证据等级与阅读边界

- **核对工作树**：`0834f00835992629a6f84d9498e7ea427049981c`。本文只使用仓库内文档、工作流、脚本、清单和测试代码；不把 `_digested/` 的二手分析当作事实来源，也不推断作者未写出的意图。
- **证据等级**：
  - **文档宣称**：`CONTRIBUTING.md`、`AGENTS.md`、`.pi/skills/release.md` 等写出的规则。
  - **代码自动执行**：工作流、hook、脚本中可观察的条件、命令和失败行为。
  - **审阅推断**：将前两类证据连接起来的工程结论；不等同于作者意图或跨版本保证。
- 本次**没有运行** build、test、install、audit、release 或发布命令；以下是静态审阅的配置与代码事实。
- 现有理念专题主要解释核心最小、可扩展、上下文控制、可观察和责任边界；本账本补出其没有系统展开的研发治理和交付闭环。它不否定现有专题中已核实的运行时边界。

## 1. 需求与贡献准入：从公开规则到自动门禁

### 1.1 文档宣称

`CONTRIBUTING.md` 明确把核心最小化作为贡献哲学：不属于 core 的能力应成为 extension，膨胀 core 的 PR 可能被拒，新增 hook 也要讨论其维护和交互成本（**文档宣称**：[`CONTRIBUTING.md#L5-L11`](../../CONTRIBUTING.md#L5-L11)）。贡献者必须理解自己的代码；使用 AI 可以，但提交自己不能解释的生成代码会被关闭（**文档宣称**：[`CONTRIBUTING.md#L13-L19`](../../CONTRIBUTING.md#L13-L19)）。

新贡献者的 issue/PR 默认自动关闭，维护者通过 `lgtmi`（issue）或 `lgtm`（issue+PR）批准；只有 `lgtm` 给 PR 提交权（**文档宣称**：[`CONTRIBUTING.md#L21-L34`](../../CONTRIBUTING.md#L21-L34)）。issue 还必须使用模板、短而具体、说明影响和复现/实现意图（**文档宣称**：[`CONTRIBUTING.md#L36-L48`](../../CONTRIBUTING.md#L36-L48)）。

提交 PR 前文档要求已获维护者 `lgtm`，并且 `npm run check` 与 `./test.sh` 都通过；贡献者不得编辑 `CHANGELOG.md`（**文档宣称**：[`CONTRIBUTING.md#L56-L71`](../../CONTRIBUTING.md#L56-L71)）。

### 1.2 代码自动执行与触发条件

- **Issue gate**：`.github/workflows/issue-gate.yml` 只在 `issues: opened` 触发（[`issue-gate.yml#L3-L5`](../../.github/workflows/issue-gate.yml#L3-L5)）。工作流先跳过三个受信 bot，再接受 repo `admin/maintain/write` 协作者；否则从默认分支读取 `.github/APPROVED_CONTRIBUTORS`，只有 capability 为 `issue` 或 `pr` 的用户名放行，其余评论、加 `untriaged` 标签并关闭为 `not_planned`（[`issue-gate.yml#L18-L26`](../../.github/workflows/issue-gate.yml#L18-L26)、[`issue-gate.yml#L84-L97`](../../.github/workflows/issue-gate.yml#L84-L97)、[`issue-gate.yml#L99-L129`](../../.github/workflows/issue-gate.yml#L99-L129)）。
- **PR gate**：`.github/workflows/pr-gate.yml` 只在 `pull_request_target` 的 `opened` 事件触发（[`pr-gate.yml#L3-L5`](../../.github/workflows/pr-gate.yml#L3-L5)），不是每次 push/update 都重新执行。它允许受信 bot、具 `admin/maintain/write` 权限的协作者，或默认分支批准文件中的 `pr` capability；否则评论并关闭 PR（[`pr-gate.yml#L19-L29`](../../.github/workflows/pr-gate.yml#L19-L29)、[`pr-gate.yml#L101-L128`](../../.github/workflows/pr-gate.yml#L101-L128)）。
- **批准写入**：`approve-contributor.yml` 在 issue comment 创建时触发（[`approve-contributor.yml#L3-L5`](../../.github/workflows/approve-contributor.yml#L3-L5)）；只有评论者具有 `admin/maintain/write`，且评论在开头或结尾匹配 `lgtmi`/`lgtm`，才改变 `.github/APPROVED_CONTRIBUTORS`，随后 bot commit/push（[`approve-contributor.yml#L27-L60`](../../.github/workflows/approve-contributor.yml#L27-L60)、[`approve-contributor.yml#L133-L183`](../../.github/workflows/approve-contributor.yml#L133-L183)）。

### 1.3 触发边界、反例和质量含义

- **代码事实**：PR gate 的触发器是 `opened`，所以它不是“每个 PR 更新都检查批准状态”的自动门禁；这里不能推断历史运行是否每次成功，也不能推断 GitHub 分支保护是否另有 required check（仓库文件没有提供该设置）。
- **代码事实**：gate 做贡献者资格关闭，不做需求技术可行性、复现质量或设计审查；这些仍由维护者后续 reopen/review 处理。工作流自身没有读取 issue template，也没有执行 `npm run check`（[`issue-gate.yml#L43-L55`](../../.github/workflows/issue-gate.yml#L43-L55)、[`pr-gate.yml#L44-L56`](../../.github/workflows/pr-gate.yml#L44-L56)）。
- **反例**：issue/PR 通过资格 gate 不代表 CI 已通过；CI 是另一个工作流且有不同触发器。将 `lgtm` 理解为代码质量批准会超出证据。
- **审阅推断**：需求入口被设计成“维护者筛选优先于开放 tracker”，而不是自动化需求验收系统；现有理念专题若只写“人承担理解责任”，会遗漏该具体准入机制及其事件触发边界。

## 2. 实施规则：哪些是文字合同，哪些有机器门禁

### 2.1 文档合同

`AGENTS.md` 要求读文件后再做宽泛改动、避免猜外部 API、只使用可擦除 TypeScript 语法、代码修改后跑 `npm run check`，并明确不得未经请求运行 `npm run build` 或 `npm test`（**文档宣称**：[`AGENTS.md#L15-L28`](../../AGENTS.md#L15-L28)、[`AGENTS.md#L30-L41`](../../AGENTS.md#L30-L41)）。依赖规则要求直接 **registry** 依赖（含内部 workspace 包）exact version、安装使用 `--ignore-scripts`，lockfile 变化需审查；新增带 lifecycle script 的依赖必须进入显式 allowlist（**文档宣称**：[`AGENTS.md#L43-L50`](../../AGENTS.md#L43-L50)）。

### 2.2 `npm run check` 的真实组成

根 `package.json` 把 `check` 定义为：Biome 自动写格式并在 warning 时失败；随后 pinned dependency、runtime dependency、TS 相对导入、entry graph、coding-agent install-lock 检查、`tsc --noEmit` 和 browser smoke（[`package.json#L20-L27`](../../package.json#L20-L27)）。这不是“所有测试”或“构建产物验证”。

- `check-pinned-deps.mjs` 递归读取 package.json，忽略 `.git/dist/node_modules`，对 dependencies/devDependencies/optionalDependencies 中的**直接 registry** spec 要求 exact semver——**自 v1.3.0 起含内部 Pi 包**（v1.2.0 及更早会跳过内部包名）；非 registry specifier（`workspace:`/`file:`/`link:`/`portal:`/`git+`/`https:` 等）跳过，`npm:` alias 取别名目标校验（[`scripts/check-pinned-deps.mjs#L4-L7`](../../scripts/check-pinned-deps.mjs#L4-L7)、[`scripts/check-pinned-deps.mjs#L24-L34`](../../scripts/check-pinned-deps.mjs#L24-L34)、[`scripts/check-pinned-deps.mjs#L40-L59`](../../scripts/check-pinned-deps.mjs#L40-L59)）。
- `check-runtime-deps.mjs` 只检查 public workspace packages 的 `src`，解析静态 import/export/require/import()，验证运行时包依赖声明，并拒绝被 build config 排除却被导入的源码（[`scripts/check-runtime-deps.mjs#L26-L43`](../../scripts/check-runtime-deps.mjs#L26-L43)、[`scripts/check-runtime-deps.mjs#L45-L80`](../../scripts/check-runtime-deps.mjs#L45-L80)、[`scripts/check-runtime-deps.mjs#L83-L123`](../../scripts/check-runtime-deps.mjs#L83-L123)）。它不证明动态字符串、外部服务、运行时行为或依赖安全。
- install-lock check 重新生成并逐字比较 `packages/coding-agent/install-lock`；生成器要求 lockfile v3、内部包版本一致、无 local/link/dev/extraneous entries，且 install scripts 只能来自 allowlist；还要求存在 platform-specific optional deps（[`scripts/generate-coding-agent-install-lock.mjs#L278-L375`](../../scripts/generate-coding-agent-install-lock.mjs#L278-L375)、[`scripts/generate-coding-agent-install-lock.mjs#L429-L447`](../../scripts/generate-coding-agent-install-lock.mjs#L429-L447)）。
- pre-commit 在任何 commit 先跑 lockfile gate 和 `npm run check`；只有 staged 文件包含 `packages/ai/*`、`packages/web-ui/*`、`package.json` 或 `package-lock.json` 时才额外跑 browser smoke（[`.husky/pre-commit#L3-L17`](../../.husky/pre-commit#L3-L17)、[`.husky/pre-commit#L19-L35`](../../.husky/pre-commit#L19-L35)）。这里的“自动执行”仅适用于启用该 hook 的本地 commit；CI workflow 不调用 `.husky/pre-commit`。

### 2.3 lockfile gate 的质量边界

`check-lockfile-commit.mjs` 只在 staged `package-lock.json` 时工作；`PI_ALLOW_LOCKFILE_CHANGE=1/true/yes` 直接放行，若差异仅为 `packages/` workspace 元数据也放行，否则失败并要求人工审查新增/更新包、npm age gate、lifecycle scripts 和 install lock（[`scripts/check-lockfile-commit.mjs#L5-L6`](../../scripts/check-lockfile-commit.mjs#L5-L6)、[`scripts/check-lockfile-commit.mjs#L77-L103`](../../scripts/check-lockfile-commit.mjs#L77-L103)、[`scripts/check-lockfile-commit.mjs#L117-L120`](../../scripts/check-lockfile-commit.mjs#L117-L120)）。

- **反例**：lockfile gate 是本地 pre-commit 行为，不是 CI 中独立的 required check；CI 使用 `npm ci --ignore-scripts` 后跑 `npm run check`，而 `check-lockfile-commit` 需要 staged index，因而普通 CI 不会通过这个脚本验证 commit intent（CI 命令见 [`ci.yml#L32-L45`](../../.github/workflows/ci.yml#L32-L45)）。
- **审阅推断**：仓库把“审查 lockfile 的责任”部分交给维护者和 hook，而不是完全自动化；`PI_ALLOW_LOCKFILE_CHANGE` 是有意的人工豁免面，不能表述为不可绕过的供应链门禁。

## 3. 测试与 CI：实际跑什么，没有跑什么

### 3.1 普通 CI 的实际检查

主 CI 在 push `main` 或面向 `main` 的 PR 触发（[`ci.yml#L3-L7`](../../.github/workflows/ci.yml#L3-L7)）。单个 Linux job 依次执行：Node 22、系统依赖安装、`npm ci --ignore-scripts`、`npm run build`、`npm run check`、env daemon 构建、`npm test`（[`ci.yml#L14-L45`](../../.github/workflows/ci.yml#L14-L45)）。根 `test` 运行 `scripts/*.test.mjs`/`*.test.ts`，再运行所有 workspace 的 `test` 脚本（[`package.json#L38-L40`](../../package.json#L38-L40)）。多数 workspace 的 `test` 是 `vitest --run`；TUI 是限定 glob 的 Node test（例如 [`packages/agent/package.json#L19-L23`](../../packages/agent/package.json#L19-L23)、[`packages/coding-agent/package.json#L39-L47`](../../packages/coding-agent/package.json#L39-L47)、[`packages/tui/package.json#L7-L14`](../../packages/tui/package.json#L7-L14)）。

另一个 CI job 单独运行 MCP conformance，且 workflow 中说明它对 pinned official suite 和仓库 baseline 做回归检查（[`ci.yml#L47-L65`](../../.github/workflows/ci.yml#L47-L65)）。这说明协议兼容是独立质量边界，不应被“npm test 已覆盖”概括。

`test.sh` 在执行根 `npm test` 前构造临时隔离 home/cache/config，清空环境，只保留必要平台变量和 CI 标记，禁止 API key 场景，并在退出时只删除带 ownership marker 的临时目录（[`test.sh#L4-L37`](../../test.sh#L4-L37)、[`test.sh#L39-L64`](../../test.sh#L39-L79)）。这是**测试脚本的隔离机制**，不是产品运行时的 OS sandbox。

### 3.2 专门工作流的实际检查

- `.github/workflows/env.yml` 只在 durable/env 相关路径变更、对应 push/PR、手动运行时触发（[`env.yml#L6-L13`](../../.github/workflows/env.yml#L6-L13)）。它在 Linux 跑 build/check/package file-list；多平台 daemon release artifact 测试；五 OS matrix 上跑 Rust fmt、clippy `-D warnings`、cargo test、durable env 测试、pi-env 测试和 Windows SSH 外部测试（[`env.yml#L25-L72`](../../.github/workflows/env.yml#L25-L72)、[`env.yml#L74-L127`](../../.github/workflows/env.yml#L74-L127)、[`env.yml#L128-L200`](../../.github/workflows/env.yml#L128-L200)）。因此这些跨平台和 Rust 检查不在普通 CI 的 Linux `npm test` 里，但在特定路径触发的 workflow 中存在。
- `.github/workflows/nix.yml` 对 Nix/lock/package/model-catalog 相关 PR 路径、tag、workflow_run、schedule 或手动运行触发（[`nix.yml#L15-L40`](../../.github/workflows/nix.yml#L15-L40)），执行 `nix flake check --all-systems --no-build`（仅 x86_64-linux）、三系统 `nix build` 和 `pi --version/--help` smoke；tag 成功后 fast-forward `stable`（[`nix.yml#L120-L151`](../../.github/workflows/nix.yml#L120-L151)）。
- `.github/workflows/npm-audit.yml` 只按工作日程或手动触发，不是每个 PR 的普通 CI job（[`npm-audit.yml#L3-L6`](../../.github/workflows/npm-audit.yml#L3-L6)）。它用 `npm ci --ignore-scripts --no-audit --no-fund`，再运行 production-only audit 和 registry signature verification（[`npm-audit.yml#L24-L31`](../../.github/workflows/npm-audit.yml#L24-L31)）。`scripts/npm-audit.mjs` 对 moderate 及以上未接受 advisory 失败；已接受 advisory 必须匹配包名，旧豁免会 warning（[`scripts/npm-audit.mjs#L9-L21`](../../scripts/npm-audit.mjs#L9-L21)、[`scripts/npm-audit.mjs#L43-L83`](../../scripts/npm-audit.mjs#L43-L83)）。

### 3.3 明确没有从配置中看到的检查

- **没有看到**普通 PR 主 CI 调用 `npm run eval`、`npm run eval:host` 或文档行为 eval。Evals package 需要 `PI_PROVIDER` 和 `PI_MODEL`，`eval` 脚本分别运行 host 与 docs comparison（[`packages/evals/README.md#L22-L35`](../../packages/evals/README.md#L22-L35)、[`packages/evals/package.json#L6-L12`](../../packages/evals/package.json#L6-L12)）；主 CI 的命令清单没有它们（[`ci.yml#L32-L45`](../../.github/workflows/ci.yml#L32-L45)）。因此不能把行为评估或文档 lift 当作每次合并门禁。
- **没有看到**普通 CI 调用 `.husky/pre-commit`、`check-lockfile-commit.mjs`、Nix build、跨 OS env matrix、release binary smoke 或 npm consumer install；这些分别属于本地 hook、专门 workflow 或 tag workflow。
- **没有看到**普通 CI 对所有发布平台二进制做运行时验证。tag workflow 才在 Ubuntu/macOS/Windows smoke-test 当前平台 binary，并只执行 `--help`、`--version`、codemode smoke（[`build-binaries.yml#L131-L208`](../../.github/workflows/build-binaries.yml#L131-L208)）。
- **反例**：`npm test` 运行 workspace 的测试脚本，但 package-level `test` 的存在并不证明每种构建产物、npm tarball、Nix artifact 或外部 provider 都被测试；CI command graph 本身没有这样的保证。
- **审阅推断**：当前质量系统是分层、路径/事件条件化的，不是单一“全仓检查”按钮。专题若只写“可观察和可检查”，遗漏了检查何时触发、哪些检查被分流，会高估质量覆盖。

## 4. 依赖供应链：固定、解析、安装脚本和发布消费端

### 4.1 直接依赖与 lockfile

AGENTS 明确要求 direct external deps exact pin（[`AGENTS.md#L43-L50`](../../AGENTS.md#L43-L50)）。代码检查器跳过内部 workspace 包和非 registry specifier，因此“所有直接依赖 exact”实际含有明确例外（[`scripts/check-pinned-deps.mjs#L25-L39`](../../scripts/check-pinned-deps.mjs#L25-L39)、[`scripts/check-pinned-deps.mjs#L48-L56`](../../scripts/check-pinned-deps.mjs#L48-L56)）。例如 `packages/coding-agent` 的内部 `@earendil-works/pi-*` 依赖使用 `^1.0.3`，而外部 `undici` 等使用 exact（[`packages/coding-agent/package.json#L49-L72`](../../packages/coding-agent/package.json#L49-L72)）；这不是违规，而是检查器设计出的 workspace 版本策略。

`package-lock.json` 为 lockfile v3，registry entries 带 `resolved` 和 `integrity`（[`package-lock.json#L1-L6`](../../package-lock.json#L1-L6)、[`package-lock.json#L31-L42`](../../package-lock.json#L31-L42)）。所核查的 CI 及 packed consumer 安装路径都带 `--ignore-scripts`，降低安装时执行第三方 lifecycle 的范围（例如 [`ci.yml#L32-L34`](../../.github/workflows/ci.yml#L32-L34)、[`scripts/local-package-install.mjs`](../../scripts/local-package-install.mjs)）。但这不等于源码静态安全或 npm registry 永久不可变。

### 4.2 install-lock 与脚本 allowlist

coding-agent 安装锁从根 lockfile 提取生产依赖，删除 dev/devOptional/extraneous/link 元数据，并验证依赖可解析、exact spec 一致、platform optional entry 存在；带 install script 的包必须在 `allowedInstallScriptPackages` 中（[`scripts/generate-coding-agent-install-lock.mjs#L84-L115`](../../scripts/generate-coding-agent-install-lock.mjs#L84-L115)、[`scripts/generate-coding-agent-install-lock.mjs#L278-L375`](../../scripts/generate-coding-agent-install-lock.mjs#L278-L375)）。当前 allowlist 只列 `@google/genai@2.21.0`、`esbuild@0.28.2`、`protobufjs@7.6.6`，并且每个有原因；未知 install script 会使生成校验失败（[`scripts/generate-coding-agent-install-lock.mjs#L17-L21`](../../scripts/generate-coding-agent-install-lock.mjs#L17-L21)、[`scripts/generate-coding-agent-install-lock.mjs#L320-L339`](../../scripts/generate-coding-agent-install-lock.mjs#L320-L339)）。

### 4.3 发布包的消费端验证

`scripts/check-package-install.mjs` 产 artifact set 后逐包建隔离消费者：`package-artifacts.mjs` 的 `produceArtifactSet()` 真实 `npm pack` 全部公开发布包，`local-package-install.mjs` 的 `installConsumer()` 在临时目录生成只以该包为 direct dependency、用 `file:` 指向本地 tarball 的 `package.json`，再跑 `npm install --omit=dev`（[`scripts/check-package-install.mjs`](../../scripts/check-package-install.mjs)、[`scripts/local-package-install.mjs`](../../scripts/local-package-install.mjs)）。随后 `coding-agent-smoke.mjs` 以外部第三方视角验证 SDK exports、CLI version 与隐藏 subpath（[`scripts/coding-agent-smoke.mjs`](../../scripts/coding-agent-smoke.mjs)）。

> 该脚本此前名为 `coding-agent-consumer.mjs`，且曾断言 `pi-client`/`pi-protocol`/`pi-server` 不出现在安装树、coding-agent 发布包中不含 `dist/client` 与 `dist/experimental`。v1.2.0 删除了这三个包与那些 dev-only 目录，断言失去对象；脚本拆为上述四个模块，隔离粒度从"一个消费者装全部包"改为"每包一个消费者"。

这项验证在 release script 本地流程中执行（[`scripts/release.mjs#L251-L266`](../../scripts/release.mjs#L251-L266)），在 tag 的 `publish-npm` job 中也执行（[`build-binaries.yml#L363-L376`](../../.github/workflows/build-binaries.yml#L363-L376)），但不在普通 PR 的主 CI 步骤中出现（[`ci.yml#L35-L45`](../../.github/workflows/ci.yml#L35-L45)）。

## 5. 发布前、发布中与发布后

### 5.1 发布前合同和实际脚本

发布技能文档宣称 lockstep versioning：所有 package 同版本，patch 用于 fixes/additions，minor 用于 breaking changes，不做 major；先问 changelog `/cl` 审计，再做 repo 外 local smoke、release script、tag CI（**文档宣称**：[`.pi/skills/release.md#L8-L16`](../../.pi/skills/release.md#L8-L16)）。local smoke 的目标是 Node/Bun 包和 binary 在 repo 外启动、列模型、interactive 启动并完成真实 prompt（**文档宣称**：[`.pi/skills/release.md#L14-L35`](../../.pi/skills/release.md#L14-L35)）。

`release.mjs` 自动拒绝 dirty worktree，逐个查询公开 workspace 包是否已在 npm 注册，刷新 Nix catalog pin，bump/sync 版本，刷新 lockfile 并 `npm ci --ignore-scripts`，更新 changelog，生成模型/安装锁，然后执行 check、offline build、`./test.sh` 和 packed consumer check（[`scripts/release.mjs#L215-L266`](../../scripts/release.mjs#L215-L266)）。随后它 stage/commit/tag，添加下一周期 `[Unreleased]`，再 push main 和 tag（[`scripts/release.mjs#L268-L292`](../../scripts/release.mjs#L268-L292)）。

这里有一个重要质量边界：release script 的注释和技能文档写“跑 checks and tests”，但实际还依赖可用的 npm、模型数据、构建工具、凭据/网络和 git push；代码没有在 tag 前验证 GitHub Actions 全部成功，此流程不通过改写 tag 修复 Nix pin，按规则应发下一版本（Nix 文档明确说 tag pin 固定：[`nix.yml#L3-L13`](../../.github/workflows/nix.yml#L3-L13)、[`nix.yml#L67-L83`](../../.github/workflows/nix.yml#L67-L83)）。

### 5.2 Tag 发布管线实际执行

`build-binaries.yml` 由 `v*` tag 或手动 recovery dispatch 触发；手动参数允许指定 `tag` 和可选 `source_ref`，注释明确 recovery 用途（[`build-binaries.yml#L3-L16`](../../.github/workflows/build-binaries.yml#L3-L16)）。它从 source archive 构建六平台 binary，生成 release notes/install lock 资产和 SHA256SUMS（[`build-binaries.yml#L52-L121`](../../.github/workflows/build-binaries.yml#L52-L121)），多平台 smoke 后创建 draft GitHub Release，并校验资产集合与 SHA256（[`build-binaries.yml#L210-L301`](../../.github/workflows/build-binaries.yml#L210-L301)）。

`publish-npm` 需 draft stage 和所有 env daemon 成功，使用 `npm-publish` environment 的 OIDC `id-token` 权限；CI 安装依赖、build/check/test、pack consumer，然后调用 `node scripts/publish.mjs`（[`build-binaries.yml#L312-L384`](../../.github/workflows/build-binaries.yml#L312-L384)）。`publish.mjs` 要求 public workspace lockstep version，先检查每个 package 是否已发布、对每个做 `npm pack --dry-run --ignore-scripts`，已发布版本跳过，未发布版本用 `npm publish --access public --provenance --ignore-scripts`，所以发布 helper 对重复执行具有逐包幂等性（[`scripts/publish.mjs#L13-L28`](../../scripts/publish.mjs#L13-L28)）。

发布公告 job 在 npm publish 成功后，逐个通过 npm registry API 验证精确版本、tarball HEAD 和 `dist.integrity`，最长重试 10 分钟（[`scripts/publish-release-announcement.mjs#L70-L126`](../../scripts/publish-release-announcement.mjs#L70-L126)）。它还验证 installer package/lock 版本与 coding-agent 一致，再用 R2 immutable release records 和条件写入 latest pointer，防止旧版本覆盖新版本（[`scripts/publish-release-announcement.mjs#L224-L240`](../../scripts/publish-release-announcement.mjs#L224-L240)、[`scripts/publish-release-announcement.mjs#L254-L266`](../../scripts/publish-release-announcement.mjs#L254-L374)）。最后才把 GitHub draft release 改为公开（[`build-binaries.yml#L427-L455`](../../.github/workflows/build-binaries.yml#L427-L455)）。

### 5.3 失败恢复与反例

- **draft release failure**：cleanup job 使用 `always()`；只要 stage、npm、announcement 或 public release 任一失败，且 draft stage 没被 skip，就删除仍为 draft 的 GitHub Release（[`build-binaries.yml#L457-L481`](../../.github/workflows/build-binaries.yml#L457-L481)）。这避免留下半发布的 draft，但不撤销已经成功发布到 npm 或 R2 的 immutable objects。
- **npm/announcement failure**：技能文档要求检查失败 job，重跑失败 job/workflow；不得对同一版本再次运行 `release:patch/minor`。理由由代码支持：publish helper 对已存在版本跳过，announcement 的 release records 和 latest pointer 有幂等/条件写入（**文档宣称 + 代码支持**：[`.pi/skills/release.md#L44-L50`](../../.pi/skills/release.md#L44-L50)、[`scripts/publish.mjs#L44-L53`](../../scripts/publish.mjs#L44-L53)、[`scripts/publish-release-announcement.mjs#L291-L329`](../../scripts/publish-release-announcement.mjs#L291-L329)）。
- **Nix failure**：tag 的 stable fast-forward 依赖 build 成功；失败时 `update-stable` 不会成功，stable 继续指向旧 release。代码没有删除或重写 tag 的回滚步骤，技能文档要求下一版本修复（[`nix.yml#L135-L151`](../../.github/workflows/nix.yml#L135-L151)、[`.pi/skills/release.md#L47-L50`](../../.pi/skills/release.md#L47-L50)）。
- **public GitHub release 已存在**：stage job 明确拒绝修改非-draft release；这保护公开资产不可变，但也意味着 recovery 必须选择正确 `source_ref`/重跑具体 job，不能简单重新 stage 同一公开 release（[`build-binaries.yml#L279-L293`](../../.github/workflows/build-binaries.yml#L279-L293)）。
- **审阅推断**：发布恢复是“重试幂等步骤 + 条件指针更新 + 保持旧 stable”，不是全局 rollback。仓库没有证据表明 npm 包、R2 immutable records、GitHub tag 或已执行外部副作用可以被完整回滚；把“恢复”写成 rollback 会越过代码边界。

## 6. 独立模型目录数据发布链

模型目录不是 npm 代码发布的同一条链。`publish-model-catalog.yml` 既由 CI 成功后的 `workflow_run`、工作日 schedule、相关 PR 路径和手动 dispatch 触发，又把 generate/validate artifact 与 production publish 分成两个 job；manual publish 必须显式 `inputs.publish=true`（[`publish-model-catalog.yml#L1-L33`](../../.github/workflows/publish-model-catalog.yml#L1-L33)、[`publish-model-catalog.yml#L38-L75`](../../.github/workflows/publish-model-catalog.yml#L74-L88)）。

生成 job 做 `npm ci --ignore-scripts`、生成 JSON、`check:model-catalog`、**`check:model-catalog-compat`（v1.4.0 新增，用最新 release 的 pi-ai 对目录跑 tsc）** 并上传 artifact（[`publish-model-catalog.yml#L41-L81`](../../.github/workflows/publish-model-catalog.yml#L39-L71)）。发布脚本拒绝缺少 anthropic/openai/openrouter、provider shard 不一致、重复 model identity、chat projection 不一致或 chat model 数少于 500；以 full catalog SHA-256 作为 revision（[`scripts/publish-model-catalog.mjs#L25-L34`](../../scripts/publish-model-catalog.mjs#L85-L175)）。它先上传 revision immutable objects，最后上传 no-store index；已有相同 revision 时不上传，失败不会伪装为成功（[`scripts/publish-model-catalog.mjs#L290-L324`](../../scripts/publish-model-catalog.mjs#L290-L329)）。

- **重要边界**：生产模型目录发布操作不由普通 `npm run check` 或 `npm test` 触发；其发布是 workflow/schedule/manual 条件化的数据供应链。这不表示发布脚本没有单元测试。
- **审阅推断**：若理念专题只讨论代码扩展和 release tag，会漏掉“代码发布后由独立数据目录改变运行时可见模型”的交付面；它至少应记录 source commit、revision、最低客户端版本和 provider/model-count 校验。

## 7. 对现有理念专题的具体遗漏清单

以下是由上面一手证据支持的、可操作的遗漏，不是对作者意图的推断：

1. **需求准入机制**：已有专题谈人的理解责任，但没有记录 issue/PR 默认 auto-close、`lgtmi/lgtm` capability、批准文件和 gate 的事件触发边界（[`CONTRIBUTING.md#L21-L34`](../../CONTRIBUTING.md#L21-L34)、[`issue-gate.yml#L3-L5`](../../.github/workflows/issue-gate.yml#L3-L5)、[`pr-gate.yml#L3-L5`](../../.github/workflows/pr-gate.yml#L3-L5)）。
2. **实施规则可执行化**：已有专题谈 core minimal，却没有把 `check` 拆为格式/warning、直接依赖 pin、runtime import、entry graph、install lock、TS 和 browser smoke，也没有记录 lockfile gate 的人工豁免（[`package.json#L20-L27`](../../package.json#L20-L27)、[`check-lockfile-commit.mjs#L77-L120`](../../scripts/check-lockfile-commit.mjs#L77-L120)）。
3. **CI 覆盖矩阵**：不能用“CI 通过”替代“所有质量面通过”。普通 CI 跑 Linux build/check/test；MCP、env 多平台、Nix、npm audit、binary/consumer smoke、真实模型行为 eval 由不同触发器分流。没有看到普通 CI 调用 `npm run eval`、`eval:host` 或 `eval:docs`；但 `packages/evals` 自身的普通 `test` 脚本仍会随 workspace test 运行（[`ci.yml#L13-L65`](../../.github/workflows/ci.yml#L13-L65)、[`package.json#L38-L40`](../../package.json#L38-L40)、[`packages/evals/package.json#L6-L12`](../../packages/evals/package.json#L6-L12)、[`packages/evals/README.md#L22-L35`](../../packages/evals/README.md#L22-L35)）。
4. **供应链质量边界**：exact direct pin、lockfile integrity、ignore-scripts、install-script allowlist 和 production consumer install 是不同控制，任一不能代替其他；内部 workspace `^` 依赖和 `PI_ALLOW_LOCKFILE_CHANGE` 是明确反例（[`scripts/check-pinned-deps.mjs#L25-L56`](../../scripts/check-pinned-deps.mjs#L25-L56)、[`scripts/generate-coding-agent-install-lock.mjs#L320-L339`](../../scripts/generate-coding-agent-install-lock.mjs#L320-L339)、[`packages/coding-agent/package.json#L49-L72`](../../packages/coding-agent/package.json#L49-L72)）。
5. **发布后闭环**：现有专题若只写 release 是 tag→CI，会漏 npm 精确可用性重试、R2 latest 条件更新、GitHub draft publication、Nix stable fast-forward、draft cleanup 及“不可完整 rollback”的反例（[`build-binaries.yml#L312-L384`](../../.github/workflows/build-binaries.yml#L312-L384)、[`build-binaries.yml#L427-L481`](../../.github/workflows/build-binaries.yml#L427-L481)、[`scripts/publish-release-announcement.mjs#L105-L126`](../../scripts/publish-release-announcement.mjs#L105-L126)）。
6. **代码之外的数据交付**：模型目录有独立 revision、schema/minimum client/provider/count 校验和发布窗口，不应被代码版本发布的叙述吞并（[`scripts/publish-model-catalog.mjs#L25-L34`](../../scripts/publish-model-catalog.mjs#L85-L175)、[`publish-model-catalog.yml#L74-L147`](../../.github/workflows/publish-model-catalog.yml#L74-L147)）。

## 8. 结论：可复核的 SDLC 画像

- **需求/贡献准入**：文档定义质量和维护者批准门槛，GitHub Actions 在 issue opened / PR opened / maintainer comment 等事件上自动关闭、放行或写入批准名单；这不是技术需求验收器。
- **实施**：核心最小是文档层范围纪律；可机器验证的实现合同集中在 `npm run check`、lock/install 检查、TypeScript 和图约束，仍有人工解释责任和显式豁免。
- **测试/CI**：主链是 Linux build/check/test；协议、Rust/env、多平台 Nix、audit、发布消费端、binary 和 evals 各自有独立触发条件。必须报告“实际跑了什么”和“未从配置看到什么”，不能把所有 workflow 的能力合并成每次 PR 都执行。
- **供应链**：registry lockfile integrity、exact direct pin、无脚本安装、install-script allowlist、production consumer install、npm audit/signature 是互补控制；它们都保留人工/时序/registry 风险边界。
- **发布/恢复**：发布技能要求先做 repo 外 local smoke；release 脚本自动执行 check、offline build、test 和 packed consumer。tag 后 CI 分阶段生成资产、跨平台 smoke、npm OIDC publish、npm availability verification、R2 announcement、GitHub release publication；失败恢复依靠重跑幂等 job、条件写指针、保留旧 stable 和删除 draft，不是全局回滚。
- **对理念的补充**：Pi 的“可控、可观察、可扩展”在研发流程中还意味着准入资格、可执行门禁、分流触发器、供应链证据和发布后状态指针；这些是当前仓库可见的机制事实，不能简化为没有证据的作者动机。
