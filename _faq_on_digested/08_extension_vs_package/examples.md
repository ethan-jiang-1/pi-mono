# 08 附篇：把 Extension / Package 讲明白（例子驱动版）

> 基线 pi-mono v0.85.1，commit `bec2f968`。行号都指向该 commit。

主篇 `answer.md` 给的是结论。这篇换一种讲法：先把"谁是谁"定义成一句话，再用四个例子把同一套机制走一遍。看完应该能自己回答"我这个场景算 extension 还是 package"。

## 0. 三个词，各指一层

| 词 | 它是什么 | 你能对它做什么 |
|---|---|---|
| **Extension（扩展）** | 运行时对象。pi 启动时真正执行的那段 TS 代码 | 写它、`/reload` 它、在启动头里看它的名字 |
| **Package（包）** | 分发容器。npm 包 / git 仓库 / 本地目录 | `pi install` 它、`pi update` 它、`pi list` 它 |
| **Source（源）** | 配置里描述"去哪找资源"的一条记录 | 写进 settings 的 `packages` 或 `extensions` |

关键点：**pi 运行时里没有 "package" 这个对象。** 你永远拿不到一个"包实例"。包只活在两个地方——settings 里的一行字符串，和磁盘上的一个目录。它做的事只有一件：**把资源弄到本地，然后告诉 loader "这些路径可以加载"**。

打个比方：package 是快递箱，extension 是箱子里的电器；source 是运单。运行的是电器，但你从运单才知道它从哪来、该不该更新。

## 1. 四个例子

四个例子的共同终点：`DefaultResourceLoader` 拿到一串路径，`loadExtensionsCached()` 把 `.ts` 文件执行成 `Extension` 对象。区别只在"路径怎么来的"。

### 例 1：丢一个文件——只有 extension，没有 package

```bash
mkdir -p ~/.pi/agent/extensions
cat > ~/.pi/agent/extensions/snake.ts <<'EOF'
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
export default function (pi: ExtensionAPI) { /* ... */ }
EOF
```

磁盘：

```
~/.pi/agent/extensions/
└── snake.ts
```

发生了什么（`addAutoDiscoveredResources` → `collectAutoExtensionEntries` → `addResource`）：

| 路径 | 类型 | metadata |
|---|---|---|
| `.../extensions/snake.ts` | extension | `{source:"auto", scope:"user", origin:"top-level"}` |

运行时：`extensions[]` 里多一个 `Extension`。**全程没有 package。** 这就是 pi 的默认体验——不需要 `package.json`，不需要 manifest，不需要安装。

### 例 2：目录里放四类资源——一个"本地包"，但没走 npm

```bash
mkdir -p ~/.pi/agent/extensions/my-kit/{extensions,skills,go, prompts,themes}
```

磁盘：

```
~/.pi/agent/extensions/my-kit/
├── extensions/
│   ├── a.ts
│   └── b.ts
├── skills/
│   └── go/SKILL.md
├── prompts/
│   └── review.md
└── themes/
    └── dark.json
```

**注意：因为它在 `~/.pi/agent/extensions/` 下，例 1 的自动发现会把它扫成 extension 吗？不会。** `collectAutoExtensionEntries` 对子目录调用 `resolveExtensionEntries()`（`package-manager.ts:557`），只看 `index.ts`、`index.js` 或 `package.json` 的 `pi.extensions`——`my-kit/` 三者都没有，于是这个目录被**整个跳过**，里面的 skills/prompts/themes 也一个都看不见。

要让它生效，得显式声明一处。两条写法，结果一样：

```jsonc
// 写法 A：写进 packages（本地路径不需要安装）
{ "packages": ["./my-kit"] }

// 写法 B：写进 extensions
{ "extensions": ["./my-kit"] }
```

两条都走 `resolveLocalExtensionSource`（`:1327`）→ `collectPackageResources`（`:2153`）→ 按约定目录展开成四类资源。**但 metadata 不同**：

| 写法 | 每个资源的 metadata |
|---|---|
| `packages` | `{source:"./my-kit", scope:"user", origin:"package"}` |
| `extensions` | `{source:"local", scope:"user", origin:"top-level"}` |

这个差异在碰撞时有用：`resourcePrecedenceRank()`（`:188`）给 `origin:"package"` 固定 rank 4，本地资源 rank 0–3。**同名冲突时本地永远赢。**

### 例 3：npm 包——真正的 package，1 个包 N 个扩展

```bash
pi install npm:pi-mcp-adapter
```

`~/.pi/agent/settings.json` 多一行，磁盘多一个目录：

```jsonc
{ "packages": ["npm:pi-mcp-adapter"] }
```

```
~/.pi/agent/npm/node_modules/pi-mcp-adapter/   ← 安装根目录（:2031, :2072）
├── package.json          ← 里面可能有 pi 字段
├── extensions/
│   ├── index.ts          ← 扩展 1
│   └── panel.ts          ← 扩展 2
└── skills/
    └── setup/SKILL.md
```

发生了什么：`resolvePackageSources`（`:1251`）解析出 `npm` 源 → 计算安装路径 `getNpmInstallPath`（`:2085`）→ 不存在就 `npm install` 到该路径 → `collectPackageResources` 展开。

运行时结果：

- `extensions[]` 里多 **2 个** `Extension`（`index.ts`、`panel.ts` 各自独立）
- `skills[]` 里多 1 个 skill
- metadata 全部是 `{source:"npm:pi-mcp-adapter", scope:"user", origin:"package"}`

**这就是 1:N 的现场**：装了一个包，加载了两个扩展。`pi list` 列出的是这一个包（`listConfiguredPackages`，`:977`），`/reload` 重载的是那两个扩展。

### 例 4：SDK 内联——连文件都没有

```ts
createAgentSession({
  extensionFactories: [
    (pi) => { pi.registerTool({ /* ... */ }); },
  ],
});
```

路径形如 `<inline:1>`，`loadExtensionFromFactory()` 直接执行函数对象（`resource-loader.ts:946`）。**没有文件、没有 package、没有 source，但照样是一个 Extension。** 这证明 extension 的本质是"实现了 ExtensionAPI 的一个对象"，不是"一个文件"。

## 2. 把四个例子叠成一张图

```
                 输入源                          解析层                        运行时层
  ┌───────────────────────────────┐   ┌──────────────────────────┐   ┌────────────────────┐
  │ settings.packages             │   │ resolvePackageSources    │   │                    │
  │   npm:foo@1.2.3  ──install──► │──►│  (会安装/更新/pin/装依赖) │──►│  Extension 对象 ×N │
  │   git:host/repo@v1 ─clone──►  │   │  collectPackageResources │   │  Skill    ×N       │
  │   ./local-dir                 │   │                          │   │  Prompt   ×N       │
  ├───────────────────────────────┤   ├──────────────────────────┤   │  Theme    ×N       │
  │ settings.extensions/skills/…  │   │ resolveLocalEntries      │──►│                    │
  │   ./file.ts / ./dir           │   │  (纯本地路径，不安装)     │   │  ↓ 再交给           │
  ├───────────────────────────────┤   ├──────────────────────────┤   │  loadExtensionsCached│
  │ 自动发现                      │   │ addAutoDiscoveredResources│──►│  loadSkills / …     │
  │   ~/.pi/agent/extensions/*    │   │                          │   │                    │
  │   .pi/extensions/*            │   │                          │   │                    │
  ├───────────────────────────────┤   ├──────────────────────────┤   │                    │
  │ CLI -e / SDK factories        │   │ resolveExtensionSources   │──►│                    │
  └───────────────────────────────┘   └──────────────────────────┘   └────────────────────┘
```

三件事从这张图直接读出来：

1. **"package" 只是最上面那一格**（settings.packages + `-e` 传远程源）。它比其他源多做一步"安装"。
2. 四条入口最终汇成同一个 `ResolvedPaths`，所以下游完全不需要知道来源。
3. 运行时只看得到右下角那一列——**没有任何地方存着"package 对象"**。

## 3. 判据：给任何一条资源看它的身份证

`ResolvedResource`（`:74`）的固定格式：

```ts
{ path: string, enabled: boolean, metadata: { source, scope, origin, baseDir? } }
```

| 场景 | source | scope | origin | 谁决定的 |
|---|---|---|---|---|
| `~/.pi/agent/extensions/snake.ts` | `auto` | `user` | `top-level` | 自动发现 |
| `.pi/extensions/snake.ts` | `auto` | `project` | `top-level` | 自动发现 |
| settings `extensions: ["./a.ts"]` | `local` | user/project | `top-level` | 配置 |
| settings `packages: ["./kit"]` | `./kit` | user/project | **`package`** | 配置 |
| `pi install npm:foo` | `npm:foo` | user/project | **`package`** | 安装器 |
| `pi -e ./x.ts` | `cli` | `temporary` | `top-level` | CLI |
| SDK `extensionFactories` | `temporary` | `temporary` | `top-level` | API |

**判断"它是不是 package 资源"的唯一字段就是 `origin: "package"`。** 看文件名、看目录结构、看它是不是 `.ts` 都判断不出来。

## 4. 最容易混的一个 case：同一个目录，两种声明

```jsonc
{
  "packages": ["./my-kit"],
  "extensions": ["./my-kit"]   // 同一路径又写一遍
}
```

`resolve()` 里 **packages 先处理**（`:928`），之后才处理 `extensions`（`:933`）。而 `addResource`（`:2555`）是 `if (!map.has(path))`——先到先得。

结果：`./my-kit` 按 **package** 语义展开（四类资源都有，`origin:"package"`），`extensions` 里那条同路径记录被静默忽略。

如果只写 `extensions: ["./my-kit"]` 呢？走 `resolveLocalEntries` → `collectFilesFromPaths` → `collectResourceFiles(dir, "extensions")`（`:571`）——**只收 extension**，`my-kit/` 里的 skills/prompts/themes 会被丢掉。

**同一个目录，写进哪个键，加载结果不同。** 这是 `extensions` 这个键名最有欺骗性的地方：它描述的是"要注入的资源源"，目录源其实按 package 规则展开，但只展开 extensions 这一类。

## 5. 决策树：我该用哪个

```
我要分享/安装的东西……
├─ 就是一段本地代码，只我自己用
│    → 文件丢进 ~/.pi/agent/extensions/ 或 .pi/extensions/     （例 1）
│
├─ 是多文件 + 需要 npm 依赖，但只我自己用
│    → ~/.pi/agent/extensions/my-ext/ 放 index.ts + package.json （自动发现认 index.ts）
│
├─ 除代码外还有 skills / prompts / themes，要成套
│    ├─ 不需要发到远程
│    │    → settings.packages 写本地目录 ./kit                （例 2）
│    └─ 要给别人用
│         → 加 package.json 的 pi 字段 + pi-package keyword，
│           然后 pi install npm:… 或 git:…                    （例 3）
│
├─ 只想临时试一下
│    → pi -e npm:foo 或 pi -e ./foo.ts                        （例 4 同族，scope=temporary）
│
└─ 是程序化构造（SDK / 测试）
     → extensionFactories: [...]                              （例 4）
```

## 6. 五个常见误解

| 误解 | 事实 | 证据 |
|---|---|---|
| package 是 extension 的别名 | 1 个包可含 0..N 个扩展；纯 skill 包不含任何扩展 | `collectPackageResources:2153` |
| settings 里 `packages` 和 `extensions` 是同一列表 | 前者带安装/更新/pin；后者只解析本地路径，且只展开成自己的资源类型 | `resolve:912`、`resolveLocalEntries:2329` |
| 把目录写进 `extensions` 就等于声明了 package | 同目录两种写法结果不同：`extensions` 只收 extension | `collectResourceFiles:645` |
| `pi install` 装的是扩展 | 装的是包；`pi list` 列包，`/reload` 重载扩展 | `listConfiguredPackages:977` |
| `-e` 只能传本地文件 | `-e npm:@foo/bar` 是官方用法，走完整包安装，scope 为 temporary | `resource-loader.ts:405` |

## 7. 为什么非得分两层

不是命名冗余，是三个约束逼出来的：

1. **资源种类多于可执行代码。** skill 是 `SKILL.md`、theme 是 `.json`，它们没有 `ExtensionAPI`，装不进 extension 概念里，但同样需要成套分发。package 是唯一能同时装四类的东西。
2. **只有远程源需要生命周期。** 本地 `.ts` 不需要 install/update/lockfile/pin。这些机制必须有一个明确的作用域，`packages` 就是这个作用域。
3. **来源信息必须可追溯。** 你装了两个包，都提供了叫 `search` 的 tool，pi 得能告诉你是谁跟谁冲突。`origin`+`source` 承担这件事，也是 `pi config` 能按来源展示/开关资源的基础。

## 8. 源码索引

- `packages/coding-agent/src/core/package-manager.ts@bec2f968`
  - `ResolvedResource:74`、`PackageManager:112`、`resourcePrecedenceRank:188`
  - `resolve:912`、`resolveExtensionSources:966`、`listConfiguredPackages:977`
  - `resolvePackageSources:1251`、`resolveLocalExtensionSource:1327`
  - `getNpmInstallPath:2085`、`getGitInstallPath:2094`、`collectPackageResources:2153`
  - `resolveLocalEntries:2329`、`addAutoDiscoveredResources:2352`、`collectFilesFromPaths:2518`、`addResource:2555`
  - `resolveExtensionEntries:557`、`collectAutoExtensionEntries:587`、`collectResourceFiles:645`
- `packages/coding-agent/src/core/resource-loader.ts@bec2f968`（`reload:388`、`loadFinalExtensionSet:574`、`loadExtensionFactories:946`、`detectExtensionConflicts:1060`）
- `packages/coding-agent/src/core/pi-manifest.ts@bec2f968`
- `packages/coding-agent/src/core/settings-manager.ts@bec2f968`（`PackageSource:82`、`packages:119`、`extensions:120`）
- `packages/coding-agent/docs/packages.md`、`docs/extensions.md`
