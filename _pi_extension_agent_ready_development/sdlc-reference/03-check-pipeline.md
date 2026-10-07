# 03 check 管线：`npm run check` 的实际组成与本地 hook

**主仓要求**：本章描述 pi-mono 自己的检查管线。独立扩展仓可以借鉴「每条规则对应一个可执行检查」的组织方式，但具体检查项是**仓库自定**。以下全部对照 tag `v1.0.3` 的根 `package.json` 与脚本核对。

## check 命令的逐项组成

> "check": "biome check --write --error-on-warnings . && npm run check:pinned-deps && npm run check:runtime-deps && npm run check:ts-imports && npm run check:entry-graphs && npm run check:install-lock:coding-agent && tsc --noEmit && npm run check:browser-smoke"

—— [package.json](https://github.com/earendil-works/pi/blob/v1.0.3/package.json#L20)

按顺序逐项（脚本实体见 [package.json](https://github.com/earendil-works/pi/blob/v1.0.3/package.json#L21-L27) 的各 `check:*` 定义）：

1. **biome**：`biome check --write --error-on-warnings .`——格式化 + lint，warning 即失败（不只是 error）。注意 `--write` 意味着它会改写文件，而非只报告。
2. **check:pinned-deps**：`scripts/check-pinned-deps.mjs`。递归收集所有 `package.json`（忽略 `.git`/`dist`/`node_modules`），要求 `dependencies`/`devDependencies`/`optionalDependencies` 中的外部 registry 依赖使用 exact semver（[L52-L56](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/check-pinned-deps.mjs#L52-L56)）。明确例外：内部 workspace 包（`@earendil-works/pi-*` 前缀与 `@earendil-works/chord`）与 `workspace:`/`file:`/`git+` 等非 registry specifier 跳过（[L25-L31](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/check-pinned-deps.mjs#L25-L31)）。所以「所有直接依赖 exact」实际是「所有**外部 registry** 直接依赖 exact」，内部包用 `^` 范围是设计内的。
3. **check:runtime-deps**：`scripts/check-runtime-deps.mjs`。只检查**公开 workspace 包**的 `src`（[L83-L93](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/check-runtime-deps.mjs#L83-L93)）：静态解析 import/export/动态 `import()`/`require`/`require.resolve` 的模块说明符（[L45-L80](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/check-runtime-deps.mjs#L45-L80)），要求引用的包在 `package.json` 的 dependencies/optionalDependencies/peerDependencies 中声明（[L26-L43](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/check-runtime-deps.mjs#L26-L43)）；同时拒绝「被 build 配置排除却被导入」的源文件，包括 type-only import（[L111-L121](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/check-runtime-deps.mjs#L111-L121)）。
4. **check:ts-imports**：`scripts/check-ts-relative-imports.mjs`。禁止非声明 `.ts` 文件中的相对 `.js` 说明符（`./foo.js`），覆盖 import/export/动态 import/import type（[L37-L38](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/check-ts-relative-imports.mjs#L37-L38)、[L101-L105](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/check-ts-relative-imports.mjs#L101-L105)）。这是「TS 源码直接以 `.ts` 运行（Node strip-only）」路线的配套约束：模块解析不带 `.js` 后缀。
5. **check:entry-graphs**：`scripts/check-entry-graphs.mjs`。文件头注释直说目的：

   > Entry points are cost contracts.
   >
   > A package's `exports` map is the only place that says which modules are public, and one stray `export *` can silently make a narrow entry drag an entire barrel: importing a 1-file pure function through a barrel costs ~37 MB of evaluated module graph, and nothing fails until someone measures a process. This walks the value-import graph of every declared entry point and enforces a budget per entry, so that regression fails at commit time instead.

   —— [check-entry-graphs.mjs](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/check-entry-graphs.mjs#L3-L12)

   预算表逐入口声明允许的图（如 `packages/ai` 的 `./models` 上限 15 个文件且禁入 `providers/`、`models.generated.ts`、`index.ts` 等五处，[L36-L51](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/check-entry-graphs.mjs#L36-L51)）；只有 value import 计数，type import 在运行前被擦除（[L11](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/check-entry-graphs.mjs#L11)）。
6. **check:install-lock:coding-agent**：`scripts/generate-coding-agent-install-lock.mjs --check`。重新生成 `packages/coding-agent/install-lock/` 并逐字比对：lockfile 必须是 v3、内部包版本一致、无 local/link/dev/extraneous 条目、带 install script 的包必须在显式 allowlist（当前只有 `@google/genai@2.21.0`、`esbuild@0.28.2`、`protobufjs@7.6.6`，各带原因注释，[L17-L21](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/generate-coding-agent-install-lock.mjs#L17-L21)），未知 install script 使校验失败（[L320-L339](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/generate-coding-agent-install-lock.mjs#L320-L339)）。
7. **tsc --noEmit**：根 TypeScript 项目类型检查。
8. **check:browser-smoke**：`scripts/check-browser-smoke.mjs`。用 esbuild 以 `platform: "browser"` 打包三个 smoke entry：durable 浏览器包必须包含其运行时中立的公共入口（根入口与 env、storage 各模块入口）且**不得**包含任何 `node.ts` adapter（[L66-L86](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/check-browser-smoke.mjs#L66-L86)）；agent 的 selective-provider 包不得把 `packages/ai/src/compat.ts`、`models.generated.ts`、`providers/all.ts` 拉进图（[L100-L109](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/check-browser-smoke.mjs#L100-L109)）。它验证的是**模块图形态**，不在浏览器里运行任何东西。

`check` 不是「所有测试」（测试见 [05 页](05-testing-layers.md)），也不验证构建产物（发布前的产物验证见 [07 页](07-release-and-recovery.md)）。

## pre-commit：条件触发

`.husky/pre-commit`（启用 husky 的本地 commit 才生效）按序执行（[.husky/pre-commit](https://github.com/earendil-works/pi/blob/v1.0.3/.husky/pre-commit#L6-L17)）：

1. 无条件跑 `node scripts/check-lockfile-commit.mjs`（见下节）；
2. 无条件跑 `npm run check`；
3. **仅当** staged 文件命中 `packages/ai/*`、`packages/web-ui/*`、`package.json`、`package-lock.json` 时，额外跑 `npm run check:browser-smoke`（[L19-L36](https://github.com/earendil-works/pi/blob/v1.0.3/.husky/pre-commit#L19-L36)）；
4. 把此前 staged 的文件（可能被 biome 改写）重新 `git add`（[L38-L43](https://github.com/earendil-works/pi/blob/v1.0.3/.husky/pre-commit#L38-L43)）。

注意：普通 CI 不调用这个 hook——CI 里 browser smoke 永远随 `check` 执行（第 8 项），hook 的条件化只是为本地省时间。

## lockfile gate 的人工豁免面

`scripts/check-lockfile-commit.mjs` 只在 staged 文件含 `package-lock.json` 时工作（[L77-L84](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/check-lockfile-commit.mjs#L77-L84)）。三条出路：

- 环境变量 `PI_ALLOW_LOCKFILE_CHANGE` 为 `1`/`true`/`yes` 直接放行（[L5-L6](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/check-lockfile-commit.mjs#L5-L6)、[L86-L89](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/check-lockfile-commit.mjs#L86-L89)）；
- 差异仅涉及 `packages/` 下的 workspace 元数据时放行（[L91-L95](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/check-lockfile-commit.mjs#L91-L95)）；
- 其余失败，并打印人工审查清单：

> Review lockfile changes before committing:
>   - confirm every new/updated package is intentional
>   - confirm npm age gates were active for resolution
>   - review any new lifecycle scripts in the dependency tree
>   - regenerate/check coding-agent install lock if release deps changed
>
> If this lockfile change is intentional, commit with:
>   PI_ALLOW_LOCKFILE_CHANGE=1 git commit ...

—— [check-lockfile-commit.mjs](https://github.com/earendil-works/pi/blob/v1.0.3/scripts/check-lockfile-commit.mjs#L99-L120)

## 边界与反例

- **本地 hook 不是 CI 必检**。`check-lockfile-commit.mjs` 需要 staged index 才有意义，CI 不跑它；`PI_ALLOW_LOCKFILE_CHANGE` 是有意的人工豁免面，不能描述为不可绕过的供应链门禁。CI 侧的 lockfile 保证来自 `npm ci --ignore-scripts` 与 install-lock 的 `--check`（[04 页](04-ci-matrix.md)）。
- pinned-deps 检查**不**约束内部 workspace 依赖的版本范围，也不检查传递依赖；`^1.0.3` 的内部依赖与 exact 的外部依赖并存是常态而非违规。
- runtime-deps 只看**静态可解析**的说明符；运行时用变量拼接的动态 import、外部服务的运行时行为、依赖的安全性都不在它的证明范围内。
- browser-smoke 证明「浏览器目标下模块图可打包且不含 Node 专用代码」，不证明打包产物在真实浏览器里功能正确。
- 全部检查都是**主仓要求**；`npm run check` 通过是提 PR 的必要条件（[01 页](01-contribution-gates.md)），但不构成维护者技术评审的替代。

**扩展仓建议**：可移用的原则是「每个行为变化要有能在其回归时失败的最小检查」——每条规则一个脚本、脚本可独立运行、串成一个命令。具体选哪些规则（pin、入口预算、adapter 分离）取决于扩展仓的架构，属**仓库自定**。
