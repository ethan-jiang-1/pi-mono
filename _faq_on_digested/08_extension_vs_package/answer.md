# 08 — Extension vs Package

> 基线：pi-mono v0.85.1（upstream tag `d981de122`，本仓库 merge `e3aa42f46`）。结论以源码为准。
>
> 本篇是结论。**看不懂就直接看 [`examples.md`](examples.md)**——同一套机制用四个例子从头走一遍。

## 三个词各指一层

- **Extension**：运行时对象。pi 启动时真正执行的那段 TS 代码。
- **Package**：分发容器。npm 包 / git 仓库 / 本地目录。
- **Source**：配置里"去哪找资源"的一条记录。

关键：**pi 运行时里没有 package 对象。** 包只活在 settings 的一行字符串和磁盘的一个目录里；它只做两件事——把资源弄到本地，然后告诉 loader 哪些路径可以加载。下游只看路径，不看来源。

## 一句话

**Extension 是运行时单位（一段可执行 TS 代码），Package 是分发单位（一个可以从 npm/git 拉下来的资源包）。** 两者不是同一层的两个名字，而是"被加载的东西"和"装着它的盒子"。一个 package 里有 **0..N 个 extension**，外加 skills / prompts / themes。

所以文档并没有重复：`extensions.md` 讲怎么写代码，`packages.md` 讲怎么把代码（和其他资源）打包发出去、装进来。

## 对照表

| | Extension | Pi Package |
|---|---|---|
| 本质 | 一个导出了 default factory 的 `.ts`/`.js` 模块 | 一个 npm 包 / git 仓库 / 本地目录 |
| 入口约定 | `export default function (pi: ExtensionAPI)` | `package.json` 的 `pi` 字段，或约定的 `extensions/ skills/ prompts/ themes/` 目录 |
| 内容 | 只有代码：tools、commands、events、UI | extension 代码 + skills + prompt templates + themes 的集合 |
| 数量关系 | 组成 package 的元素之一 | 可含多个 extension，也可 0 个（纯 skill 包合法） |
| 从哪来 | `~/.pi/agent/extensions/`、`.pi/extensions/`、settings `extensions`、CLI `-e`、API `extensionFactories` | `pi install npm:...` / `git:...` / 本地目录；settings `packages` |
| 生命周期 | 加载 / 执行 / `/reload` 重载 | 还有 install / remove / update、pin ref、npm install deps、lockfile |
| 元数据 | `sourceInfo: {source, scope, origin}` | 同上，但 `origin: "package"` |
| 优先级 | `origin: "top-level"`，rank 0–3 | `origin: "package"`，rank 4（最低，先让本地覆盖） |
| 信任门控 | 项目本地 extension 需 trusted | 项目本地 package 需 trusted（且安装时也要） |

## 源码级判据：一个 source 到底是 extension 还是 package？

`DefaultPackageManager.resolve()`（`package-manager.ts:912`）分两轮收集：

1. `settings.packages` → `resolvePackageSources()` → 每个源走 `collectPackageResources()`（`:2153`）。
2. `settings.extensions / skills / prompts / themes` → `resolveLocalEntries()`（`:2329`）。

关键分支在 `resolveLocalExtensionSource()`（`:1327`）：

```ts
if (stats.isFile())  → addResource(accumulator.extensions, resolved, ...)   // 单个 extension
if (stats.isDirectory()) → collectPackageResources(dir, ...)                // 按 package 规则
                           如果返回 false（目录里啥都没有）→ 仍按单个 extension 处理
```

再看 `collectPackageResources()` 的返回条件：有 `pi` manifest 或存在约定目录才返回 `true`，否则 `false`（`:2174`–`:2201`）。

于是规则可以精确表述为：

- 源是**文件** → 就是一个 extension，不可能是 package。
- 源是**目录** → 按 package 规则解析：先看 `package.json` 的 `pi` 字段，没有再看是否有 `extensions/` `skills/` `prompts/` `themes/` 目录；一个都没有才退化成"单个 extension"。

注意 `collectPackageResources` 里 **manifest 分支只要 `package.json` 有 `pi` 字段就返回 true**，哪怕四类资源都是空数组——这时它就是一个"合法但不贡献任何资源"的 package。而仅仅有一个普通 `package.json`（没有 `pi` 字段、也没有约定目录）不足以让它成为 package。

## 具体 trace

### A. 写进 `extensions` 的目录，会被当 package 处理

```json
{ "extensions": ["./my-ext"] }
```

`my-ext/` 里有 `package.json` 的 `pi` 字段 → 输出的不只是 extension，还会带出 skills/prompts/themes。也就是说：**`extensions` 这个键名描述的是"这轮要注入哪些资源源"，目录源其实按 package 规则展开。** 名字有历史包袱，别被字面骗了。

### B. 写进 `packages` 的本地文件，退化成 extension

```json
{ "packages": ["./foo.ts"] }
```

走 `resolveLocalExtensionSource` 的 `isFile()` 分支 → 只产生一个 extension。所以 `packages` 与 `extensions` 的差别不在"键名决定类型"，而在于：`packages` 会额外做安装/更新/pin/依赖处理（npm、git），`extensions` 只做本地路径解析。

### C. `pi -e npm:@foo/bar`

CLI 的 `--extension` 参数走 `resolveExtensionSources(sources, {temporary: true})`（`resource-loader.ts:405`），底层仍是 `resolvePackageSources()`。**所以 `-e` 接受的是 package 源，临时装到 temp 目录只对本次运行生效。** 名字叫 extension，行为是 package。

### D. 一个 package 里的多个 extension

```json
{ "pi": { "extensions": ["./extensions/a.ts", "./extensions/b.ts"] } }
```

两个文件各自被 `loadExtensionsCached()` 加载成两个独立 `Extension` 对象，各自有独立的 tools/commands 注册表。重名 tool/flag 不合并，`detectExtensionConflicts()`（`resource-loader.ts:1060`）把它们记成诊断，先加载的赢。这也是为什么"冲突"和 `/reload` 语义是按 extension 而非按 package 计算的。

## 为什么必须分成两个概念

因为三件事各自独立变化：

1. **代码形态**与**分发形态**松耦合。同一个 extension 可以从 `~/.pi/agent/extensions/foo.ts` 直接加载，也可以被 npm 包分发；调用方看到的运行时对象完全一样。
2. **资源种类**比代码多。skills、prompt templates、themes 都不是可执行模块（skill 是 `SKILL.md`，theme 是 `.json`），它们没有 `ExtensionAPI`，但同样需要"打包分享"。如果只有 extension 概念，这些资源就没法成套分发。
3. **安装生命周期**只对远程源成立。本地 `.ts` 不需要 install/update/dedupe/pin；npm/git 需要。用 `packages` 键承载这部分，才能让 `pi update --extensions`、lockfile、`autoload` delta 这些机制有明确作用域。

反过来说：把所有东西都叫 package 也不行——`~/.pi/agent/extensions/snake.ts` 这种"就是丢一个文件进去"的用法是 pi 的默认体验，给它套上 package manifest 是多余的仪式。

## 常见误解纠正

- **"package 就是 extension 的别名"**：package 是容器，extension 是内容；纯 skills 包不含任何 extension 也完全合法。
- **"`packages` 和 `extensions` 是同一个列表的两种写法"**：前者触发安装/更新/pin 语义，后者是纯本地路径；但两者最终都汇入同一个 `ResolvedPaths`，所以从"加载了什么"看确实同源。
- **"一个 package 就是一个 extension"**：1:N 关系，`:2153` 的 manifest/约定目录分支会展开出多个 extension。
- **"`pi install` 装的是 extension"**：装的是 package；它可能一个 extension 都没有。
- **"`-e` 只能传本地文件"**：`-e npm:@foo/bar` 是官方用法，走的是 package 安装路径，只是 scope 为 `temporary`。

## 引用

- `packages/coding-agent/src/core/package-manager.ts@d981de122`（`resolve:912`、`resolvePackageSources:1251`、`resolveLocalExtensionSource:1327`、`collectPackageResources:2153`、`resolveLocalEntries:2329`、`resourcePrecedenceRank:188`）
- `packages/coding-agent/src/core/resource-loader.ts@d981de122`（`reload:388`、`loadFinalExtensionSet:574`、`detectExtensionConflicts:1060`）
- `packages/coding-agent/src/core/pi-manifest.ts@d981de122`
- `packages/coding-agent/src/core/settings-manager.ts@d981de122`（`PackageSource:82`、`Settings.packages:119`、`Settings.extensions:120`）
- `packages/coding-agent/docs/packages.md`、`docs/extensions.md`
- 相关：[`07_pi_usage_scenarios/05_package_ecosystem.md`](../07_pi_usage_scenarios/05_package_ecosystem.md)、[`06_pi_vs_dsh/03_mechanism_table.md`](../06_pi_vs_dsh/03_mechanism_table.md)

## v1.0.0 注记（2026-10-02 同步后）

三层模型（Extension/Package/Source）**继续成立**，v1.0.0 给了两个新样本：

- **官方内置扩展有了机器名 `builtin:<name>`**（v0.99.0 起，取代 `<inline:name>`），出现在错误、诊断、RPC source info 中；`--no-extensions` 现在会**连带关闭内置扩展**（含 MCP/codemode/tool-search/llama.cpp），想留需 `-e builtin:<name>` 显式加载（4259686d9）。
- **"包 + 内置扩展消费"的新组合样本**：官方 `packages/mcp`（MCP 客户端）与 `packages/codemode`（QuickJS 沙箱）是独立 npm 包，由 coding-agent 内置扩展消费——即"一个 capability 可以拆成独立库 + 内置扩展两层"。详见 `_digested/harness/02-Boundaries/2.2`（v1.0.0 重写版）与 `_digested/extensions/04-Ecosystem/`。

## v1.0.3 后注记（2026-10-06 sync-0008 同步）

**二分法新增第三形态样本：官方库包。** v1.0.3 之后 main 上新增的 `@earendil-works/pi-env`（`packages/env`，Unreleased，`package.json` 版本号 1.0.3 但尚未随任何 release 发布）是 `@earendil-works` 官方 monorepo npm 包（依赖方向是 **env → durable**，durable 不依赖 env），但**不是 Pi Package**：`package.json` 无 `pi` 字段、没有 `extensions/`/`skills/` 等约定目录（对照上文判据——两者都没有就不进 package 解析层）、不进 `settings.packages`、不被 `pi install`。它是 Durable 宿主 `import` 的**库依赖**（实现 durable 的 `ExecutionEnv` 接口）。与 v1.0.0 注记里 `packages/mcp`/`packages/codemode` 的"库 + 内置扩展消费"同族但更纯——连消费它的内置扩展都没有。"Extension 是运行时单位、Package 是分发单位"的二分法由此多出一个干净的对照样：**官方库包**（library dependency，走 npm import，对 pi 的资源解析/package-manager 完全不可见）vs **pi package**（分发容器，走 `pi install`/lockfile/`origin: "package"` 生命周期）。判据不受影响——pi-env 恰好反证了"仅有普通 `package.json` 不足以成为 package"这条规则。

**v1.2.0 更新（sync-0009）**：上一段的两处时间性描述已过时——

- **不再是 Unreleased**：`packages/env` 在 v1.2.0 的 `package.json` 版本号为 **`1.2.0`**，随 release 正式发布（`3b. env-daemons` 进 `build-binaries.yml` 的发布链）。
- **"monorepo 内没有任何消费者"仍然成立**：v1.2.0 时 repo 内依赖 `pi-env` 的仍只有它自己。它依旧是"官方库包"这一形态最干净的样——比 `mcp`/`codemode` 更纯，因为连消费它的内置扩展都没有。
- 二分法判据**不受影响**：这仍是"仅有普通 `package.json` 不足以成为 pi package"的反证。
