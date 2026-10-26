# 03 check 管线：`npm run check` 的实际组成与本地 hook

**主仓要求**：本章描述 pi-mono 自己的检查管线。独立扩展仓可以借鉴「每条规则对应一个可执行检查」的组织方式，但具体检查项是**仓库自定**。基线与逐条证据见 `../_evidence/render.md`。

## check 命令的逐项组成

> "check": "node scripts/biome-check.mjs --write && npm run check:pinned-deps && npm run check:runtime-deps && npm run check:ts-imports && npm run check:entry-graphs && npm run check:install-lock:coding-agent && tsc --noEmit && npm run check:browser-smoke"


按顺序逐项（脚本实体见  的各 `check:*` 定义）：

[E048](../_evidence/render.md#e048)

1. **biome**：`biome check --write --error-on-warnings .`——格式化 + lint，warning 即失败（不只是 error）。注意 `--write` 意味着它会改写文件，而非只报告。
2. **check:pinned-deps**：`scripts/check-pinned-deps.mjs`。递归收集所有 `package.json`（忽略 `.git`/`dist`/`node_modules`），要求 `dependencies`/`devDependencies`/`optionalDependencies` 中的**直接 registry** 依赖使用 exact semver。**v1.3.0 起内部包的豁免已删除**：`@earendil-works/pi-*` 与 chord 只要是 registry spec 也必须 exact；只有 `workspace:`/`file:`/`link:`/`portal:`/`git+`/`https:` 等非 registry specifier 跳过，`npm:` alias 取别名目标校验。

[E049](../_evidence/render.md#e049)
3. **check:runtime-deps**：`scripts/check-runtime-deps.mjs`。只检查**公开 workspace 包**的 `src`：静态解析 import/export/动态 `import()`/`require`/`require.resolve` 的模块说明符，要求引用的包在 `package.json` 的 dependencies/optionalDependencies/peerDependencies 中声明；同时拒绝「被 build 配置排除却被导入」的源文件，包括 type-only import。

[E050](../_evidence/render.md#e050)
4. **check:ts-imports**：`scripts/check-ts-relative-imports.mjs`。禁止非声明 `.ts` 文件中的相对 `.js` 说明符（`./foo.js`），覆盖 import/export/动态 import/import type。这是「TS 源码直接以 `.ts` 运行（Node strip-only）」路线的配套约束：模块解析不带 `.js` 后缀。

[E051](../_evidence/render.md#e051)
5. **check:entry-graphs**：`scripts/check-entry-graphs.mjs`。文件头注释直说目的：

[E052](../_evidence/render.md#e052)

   > Entry points are cost contracts.
   >
   > A package's `exports` map is the only place that says which modules are public, and one stray `export *` can silently make a narrow entry drag an entire barrel: importing a 1-file pure function through a barrel costs ~37 MB of evaluated module graph, and nothing fails until someone measures a process. This walks the value-import graph of every declared entry point and enforces a budget per entry, so that regression fails at commit time instead.

   
   预算表逐入口声明允许的图（`packages/ai` 的 `./models` 现行上限 **20** 个文件、禁入 `providers/`、`models.generated.ts`、`index.ts` 等，并新增 `allow: ["packages/telemetry/src/index.ts"]` 例外，）；只有 value import 计数，type import 在运行前被擦除。
6. **check:install-lock:coding-agent**：`scripts/generate-coding-agent-install-lock.mjs --check`。重新生成 `packages/coding-agent/install-lock/` 并逐字比对：lockfile 必须是 v3、内部包版本一致、无 local/link/dev/extraneous 条目、带 install script 的包必须在显式 allowlist（只有两条：`@google/genai@2.21.0` 与 `protobufjs@7.6.6`，各带原因注释；`esbuild` 不在其中，旧文写它是错的，），未知 install script 使校验失败。

[E053](../_evidence/render.md#e053)
7. **tsc --noEmit**：根 TypeScript 项目类型检查。
8. **check:browser-smoke**：`scripts/check-browser-smoke.mjs`。用 esbuild 以 `platform: "browser"` 打包三个 smoke entry：durable 浏览器包必须包含其运行时中立的公共入口（根入口与 env、storage 各模块入口）且**不得**包含任何 `node.ts` adapter；agent 的 selective-provider 包不得把 `packages/ai/src/compat.ts`、`models.generated.ts`、`providers/all.ts` 拉进图。它验证的是**模块图形态**，不在浏览器里运行任何东西。

[E054](../_evidence/render.md#e054)

`check` 不是「所有测试」（测试见 [05 页](05-testing-layers.md)），也不验证构建产物（发布前的产物验证见 [07 页](07-release-and-recovery.md)）。

## pre-commit：条件触发

`.husky/pre-commit`（启用 husky 的本地 commit 才生效）按序执行：

1. 无条件跑 `node scripts/check-lockfile-commit.mjs`（见下节）；
2. 无条件跑 `npm run check`；
3. **仅当** staged 文件命中 `packages/ai/*`、`packages/web-ui/*`、`package.json`、`package-lock.json` 时，额外跑 `npm run check:browser-smoke`；
4. 把此前 staged 的文件（可能被 biome 改写）重新 `git add`。

[E055](../_evidence/render.md#e055)

注意：普通 CI 不调用这个 hook——CI 里 browser smoke 永远随 `check` 执行（第 8 项），hook 的条件化只是为本地省时间。

## lockfile gate 的人工豁免面

`scripts/check-lockfile-commit.mjs` 只在 staged 文件含 `package-lock.json` 时工作。三条出路：

[E056](../_evidence/render.md#e056)

- 环境变量 `PI_ALLOW_LOCKFILE_CHANGE` 为 `1`/`true`/`yes` 直接放行；
- 差异仅涉及 `packages/` 下的 workspace 元数据时放行；
- 其余失败，并打印人工审查清单：

> Review lockfile changes before committing:
>   - confirm every new/updated package is intentional
>   - confirm npm age gates were active for resolution
>   - review any new lifecycle scripts in the dependency tree
>   - regenerate/check coding-agent install lock if release deps changed
>
> If this lockfile change is intentional, commit with:
>   PI_ALLOW_LOCKFILE_CHANGE=1 git commit ...

—— （引文省略了清单与结尾提示之间条件性打印的包版本变化摘要）

## 边界与反例

- **本地 hook 不是 CI 必检**。`check-lockfile-commit.mjs` 需要 staged index 才有意义，CI 不跑它；`PI_ALLOW_LOCKFILE_CHANGE` 是有意的人工豁免面，不能描述为不可绕过的供应链门禁。CI 侧的 lockfile 保证来自 `npm ci --ignore-scripts` 与 install-lock 的 `--check`（[04 页](04-ci-matrix.md)）。
- pinned-deps 检查**约束全部 registry 依赖（含内部 workspace 包）**，但不检查传递依赖。现行仓库内已无 `^` 内部依赖（`sync-versions.js` 同步精确版本）。
- runtime-deps 只看**静态可解析**的说明符；运行时用变量拼接的动态 import、外部服务的运行时行为、依赖的安全性都不在它的证明范围内。
- browser-smoke 证明「浏览器目标下模块图可打包且不含 Node 专用代码」，不证明打包产物在真实浏览器里功能正确。
- 全部检查都是**主仓要求**；`npm run check` 通过是提 PR 的必要条件（[01 页](01-contribution-gates.md)），但不构成维护者技术评审的替代。

**扩展仓建议**：可移用的原则是「每个行为变化要有能在其回归时失败的最小检查」——每条规则一个脚本、脚本可独立运行、串成一个命令。具体选哪些规则（pin、入口预算、adapter 分离）取决于扩展仓的架构，属**仓库自定**。
