# 1. 包协议：生态的"公路系统"（官方基建详解）

> 本篇是 04-Ecosystem 总览中"官方基建"的展开——`pi install` 到 `pi.dev` 目录之间的**完整协议细节**。全部硬事实，锚点在 `packages/coding-agent/docs/packages.md`（下称 packages.md），行号对应 v0.86.1 工作树。

## 一句话

一个 pi 包 = npm/git/本地路径上的一个目录 + `package.json` 里的 `pi` manifest（或约定目录），装进用户级或项目级 settings，pi 启动时发现并加载其中的四类资源。协议的全部设计都围绕两个词：**可 pin（可复现）** 和 **可隔离（不互相污染）**。

## 三种 source，三种信任与更新模型

| Source | 例 | 存储位置 | 更新语义 |
|--------|-----|----------|----------|
| **npm** | `npm:@foo/bar@1.0.0` | `~/.pi/agent/npm/`（项目级 `.pi/npm/`） | **版本化 spec 被 pin**，`pi update --all` 不动它（packages.md:63）；裸 `npm:pkg` 才随 update 走 |
| **git** | `git:github.com/user/repo@v1` | `~/.pi/agent/git/<host>/<path>` | refs 是 pinned tag/commit，update 只 **reconcile** 到配置的 ref 不前移（:90）；要升级必须显式 `pi install git:...@new-ref`；reconcile 改变 checkout 时 reset+clean+重跑 `npm install`（:93） |
| **本地路径** | `./relative/pkg` | 不复制，直接引用 | 相对路径**相对 settings 文件解析**——项目 settings 里的相对包随仓库走（:107-110） |

细节点：

- npm 查询/安装可整体包进 wrapper（`npmCommand: ["mise", "exec", "node@20", "--", "npm"]`）——版本管理器场景一等公民（packages.md:66-72）。
- git source 的 SSH 走 `~/.ssh/config`；CI 用 `GIT_TERMINAL_PROMPT=0` fail-fast（packages.md:89）。
- 本地路径指向**单个文件**时按单 extension 加载，目录才按包规则（packages.md:107-110）。

## manifest 与发现

`pi` manifest 四个数组（`extensions`/`skills`/`prompts`/`themes`），支持 glob 与 `!` 排除，正 glob 按字典序发现（packages.md:118-133）。没有 manifest 就按约定目录 auto-discover：`extensions/` 收 `.ts`/`.js`、`skills/` 递归找 `SKILL.md`、`prompts/` 收 `.md`、`themes/` 收 `.json`（:160-165）。声明式资源轴的细节见 [2.5](../02-Expansion/2.5_declarative_resources.md)。

画廊元数据是 manifest 的一部分：`pi-package` keyword 上 [pi.dev/packages](https://pi.dev/packages)，`video`（MP4，桌面悬停自动播放）/`image` 字段加预览，video 优先（packages.md:135-154）。

## 依赖规则：隔离是显式设计

- 第三方运行时依赖 → `dependencies`；pi 从 npm/git 装包时**自动跑 `npm install`**（packages.md:169）。
- **pi 核心包**（`@earendil-works/pi-ai`/`pi-agent-core`/`pi-coding-agent`/`pi-tui`/`typebox`）→ 必须放 `peerDependencies` 且 range 为 `"*"`，**不许打包**——由宿主统一供版本（packages.md:171）。
- **依赖其他 pi 包** → `dependencies` + `bundledDependencies`，并通过 `node_modules/...` 路径引用其资源（packages.md:173-186）。
- 底层保证："Pi loads packages with separate module roots, so separate installs do not collide or share modules"（packages.md:173）——每个包独立模块根，同名依赖不同版本共存。

这条规则解释了生态里一个常见形态：大包（如 pi-mcp-adapter）把子能力打包进自己的 tarball 而不要求用户装一堆前置包。

## 过滤、启停与作用域

- settings 里可以用对象形式**只加载包的一部分**：`{ source: "npm:my-package", extensions: ["extensions/*.ts", "!extensions/legacy.ts"] }`（packages.md:190-200，Package Filtering）。
- 资源可 enable/disable（TOC :15）。
- 作用域：`pi install` 默认写**用户** settings（`~/.pi/agent/settings.json`），`-l` 写项目 `.pi/settings.json`——项目 settings 可提交给团队，项目被 trust 后 pi 启动时自动补装缺失包（packages.md:43）。

## 安全立场（协议不背书内容）

packages.md:20 的警告是协议层最硬的一句：

> Pi packages run with **full system access**. Extensions execute arbitrary code, and skills can instruct the model to perform any action including running executables. **Review source code before installing third-party packages.**

协议层给的缓解全是**用户侧**的：`pi -e` 临时试用（packages.md:45-47）、project trust 闸门、版本 pin。没有签名、没有沙箱承诺、没有审核。机制层的真实护栏在扩展系统内部（`user_bash` fail-closed 等，见 [03-Patterns/3.3](../../03-Patterns/3.3_safety_guards.md)）。

## 为什么这套协议重要（解释）

对照 5300+ 包的生态规模回看，协议的三个选择各自喂养了一种生态行为：

1. **npm 即分发**：零新基建——作者用现成的版本/CI/下载统计，目录（pi.dev）只是 npm 的聚合视图。
2. **pin + reconcile 分离**：团队可复现（pin），升级可预期（显式 move ref），这是"项目 settings 提交进仓库"能成立的前提。
3. **独立模块根**：包可以自由捆绑依赖甚至嵌套其他 pi 包，"装 A 顺手装了 A 依赖的 B"成为默认体验——生态包之间互操作的摩擦被协议抹平。
