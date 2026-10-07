# 新仓起步：从最小扩展到 package 交付

这条路径从零建到第一笔完整交付。每一步都标注它覆盖完成度阶梯的哪一级（见[总览](./00-index.md#pi-native-完成度阶梯)）。命令与合同依据 Pi `v1.0.3` 的 [Extensions](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/docs/extensions.md)、[Packages](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/docs/packages.md)、[Skills](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/docs/skills.md) 文档与 SDK 示例。

## 1. 最小扩展（阶梯 1）

创建 `hello.ts`：

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("hello", {
    description: "Show a greeting",
    handler: async (name, ctx) => {
      ctx.ui.notify(`Hello, ${name || "world"}!`, "info`);
    },
  });
}
```

开发期直接加载：

```bash
pi --extension ./hello.ts
```

Pi 用 `jiti` 加载本地 TypeScript 扩展，不需要单独编译步骤（运行时事实）。跑 `/hello` 有输出，覆盖阶梯 1：文件被加载、factory 执行、命令注册。

## 2. 落位与信任边界

固定使用时放入 agent dir：个人的放 `~/.pi/agent/extensions/`，项目的放仓库内 `.pi/extensions/`。项目资源在 project trust 授予前不加载——这是安全边界，不是缺陷；交付验证时确认你的包在两种位置的行为预期（运行时事实，见 [Extensions 的加载位置](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/docs/extensions.md#L40-L50)）。

小扩展用单文件，多文件实现用含 `index.ts` 的目录；npm 依赖放旁边的 `package.json`。

## 3. 加一个工具（阶梯 2-3）

工具定义 name、model-facing description、TypeBox 参数 schema 和 `execute()`；结果必须有模型可见的 `content` 和用于渲染/状态重建的 `details`（没有结构化数据时 `details: undefined`）。三个容易做错的合同（运行时事实，见 [Extensions 的工具节](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/docs/extensions.md#L129-L150)）：

- 抛出 `execute()` 产生失败的工具结果；返回对象不会自动标记为错误。要让模型看到错误而程序调用者仍收到数据，用 `isError: true`。
- 嵌套模型调用的 `usage` 要并入结果，会话统计才准确。
- 改文件的工具用 `withFileMutationQueue()` 包住完整的读-改-写；有可变共享内存状态的工具声明 sequential 执行。

验证第 3 级：启动 Pi，给一个会触发该工具的真实 prompt，确认工具真实执行并返回。仅启动 Pi 看到工具出现在列表里，只覆盖第 2 级。

## 4. 确定性证据（阶梯 4）

为扩展写不依赖真实 API 的语义测试。Pi 的发布包提供了所需的部件：`@earendil-works/pi-ai/compat` 导出 faux provider（`registerFauxProvider`、`streamSimple`），SDK 的 `createAgentSession` 允许注入 `modelRuntime`、`resourceLoader` 与 in-memory `SessionManager`（运行时事实，见 [SDK 文档](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/docs/sdk.md#L96-L118)）。

pi-mono 的测试套件是参考实现：真实 `AgentSession` + 真实 ResourceLoader 发现路径 + 脚本化 provider 响应，断言公开事件序列（例如自动重试后恰好一次 `agent_settled` 且 `isIdle()` 为 true）。在 [test/suite/harness.ts](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/test/suite/harness.ts) 读它的组装方式，在自己的仓库用发布的包复刻同样的分层。

扩展仓建议：每个行为变化配一条「回归时会失败」的最小断言。断言目标选公开事件与工具结果形状，不选内部私有状态。

## 5. 组成 package（阶梯 6 的前置）

一个 package 是普通目录或 npm 包，把 extensions、skills、prompt templates、themes 作为一个单位分发（运行时事实，见 [Packages 文档](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/docs/packages.md#L3-L5)）。最简形态用约定目录：

```text
my-pi-package/
├── package.json
├── extensions/
├── skills/
├── prompts/
└── themes/
```

资源放在别处或需要过滤时用 `pi` manifest 显式声明。三条声明合同：

- host 提供的包（`@earendil-works/pi-ai`、`pi-agent-core`、`pi-coding-agent`、`pi-tui`、`typebox`）放 `peerDependencies` 用 `"*"`，不要打包进产物。
- 扩展 import 的其它运行时包放 `dependencies`；Pi 安装 npm/git 源时会一并安装。
- npm 包加 `pi-package` keyword 才能被 package gallery 发现。

## 6. 干净安装验证（阶梯 6）

在干净 agent dir（或临时 HOME）安装并复验：

```bash
pi install ./my-pi-package     # 或 npm:/git: 源
pi list
```

然后用一个真实 prompt 复验第 3 级行为，`pi config` 确认资源被发现与启用。开发目录能跑不证明声明完整：漏掉的 manifest 条目、错误的依赖位置、依赖 undeclared import 的模块，都只在干净安装时暴露。settings 的对象形式可以按资源类型过滤包内容，用户会这样裁剪你的包——交付前至少试一次「只留 extensions、关掉 skills」的组合。

## 7. 交付判断（阶梯 7）

交付记录回答四件事：

1. 外部结果：用户现在能做什么之前做不到的事。
2. 影响面：哪个载体的哪些文件变了。
3. 验证：实际运行的命令与结果（faux 断言、真实会话、干净安装各覆盖哪级）。
4. 未验证项：明确列出（例如跨 provider 行为、多版本兼容、非 TUI 模式）。

一份能解释当前用法的 README 与这份记录一起构成第一笔完整交付。此后新参与者应能从当前仓库回答「现在是什么、什么固定住它、怎样证明装出来可用」。

## 常见弯路

- 在 factory 里启动 watcher/计时器，导致无头模式或只加载不开会话的调用泄漏资源。
- 把 host 包放进 `dependencies` 并打包，触发重复类与注册表警告。
- 只在交互模式测试；JSON/print 模式下 `ctx.ui` 调用失败。
- 用 `agent_end` 判断完成；自动重试与排队工作可能仍在进行，等待 `agent_settled` 或用 `waitForIdle()`。
- 假设工具能注销；只能以 `exposure: "hidden"` 重注册收回。

## 相关入口

- [术语与心智模型](./02-terms-and-mental-models.md)：本页出现的扩展运行时、发现、信任词汇。
- [总览](./00-index.md)：四层区分、完成度阶梯与闭环。
- [SDLC Reference](../sdlc-reference/00-index.md)：需要核对 Pi 主仓某条精确规则时查阅。
