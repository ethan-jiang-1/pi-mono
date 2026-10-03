# Part A：零仪式极速开发循环

在很多框架中，开发一个插件需要配置 `tsconfig.json`、设置打包工具（Rollup / Webpack）、配置本地软链（npm link）并反复重启进程。

**在 Pi 中，扩展开发是“零仪式”的**：
Pi 内置了基于 `jiti` 的实时 TypeScript 模块加载器，支持直接加载未编译的 `.ts` 源码，并提供了运行时热重载机制。

---

## 1. 核心心智：无需编译，一个 `.ts` 即插件

任何一个导出了默认工厂函数的 TypeScript 文件，就是一个合法的 Pi 扩展：

```typescript
// my-first-ext.ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
    pi.registerCommand("ping", {
        description: "测试扩展是否存活",
        handler: async (_args, ctx) => {
            ctx.ui.notify("pong! 扩展正常运行", "info");
        },
    });
}
```

你不需要 `npm run build`，也不需要给它专门建一个 `package.json`。

---

## 2. 三秒极速调试循环（The 3-Second Loop）

### 第一步：临时挂载运行

使用 CLI 的 `-e`（`--extension`）参数，把你的源码文件挂载到 pi 进程中：

```bash
pi -e ./my-first-ext.ts
```

> **提示**：`-e` 属于临时会话加载，不会污染 `~/.pi/` 全局配置或当前项目的配置文件。会话结束即卸载。

### 第二步：修改代码并实时热重载（无需重启）

在编辑器中修改 `my-first-ext.ts` 的逻辑。切换回 Pi 的 TUI 界面，直接输入并回车：

```text
/reload
```

**背后发生了什么**：
1. Pi 的 `ResourceLoader` 清理旧扩展的事件监听器与注册工具；
2. 清除 `jiti` 的模块缓存并重新读取磁盘上的最新代码；
3. 重新执行工厂函数并重新挂载接缝；
4. **当前的会话上下文（Session Context）、对话历史、正在进行的分支完整保留**。

你无需退出终端再重新启动 `pi`，极大地降低了迭代心智负担。

---

## 3. 故障排查与排障利器

### 排除干扰：`--no-extensions`

当发现某个工具行为异常，怀疑是某个扩展引起冲突时，运行：

```bash
pi --no-extensions
```

这将跳过项目级、用户全局级以及内置扩展，启动纯净的最小核，用于对比基准行为。

### 开启调试日志：`PI_DEBUG=1`

如果扩展未生效，可使用调试模式启动：

```bash
PI_DEBUG=1 pi -e ./my-first-ext.ts
```

控制台会打印扩展的发现路径、加载时序、两阶段注册（`registerTool`/`registerCommand`）与事件触发日志。

### 输出调试信息：`console.error` vs `ctx.ui.notify`

在扩展内部调试时：
- `console.error(...)`：直接输出到 stderr，不会破坏 TUI 渲染流，适合打印数据结构；
- `ctx.ui.notify("消息", "info" | "warning" | "error")`：在 TUI 右下角或顶部弹出非侵入式通知，适合观察运行状态。

---

## 4. 扩展生命周期的就位路径

当你完成原型开发，决定持久生效时，按作用域放入对应目录：

1. **仅在当前项目生效**：
   移动至 `./.pi/extensions/my-first-ext.ts`（可纳入项目 git 仓库）。
2. **在当前机器所有项目生效**：
   移动至 `~/.pi/agent/extensions/my-first-ext.ts`。
3. **分发给团队或开源社区**：
   升级为 Pi Package（参见 [engineering-and-testing.md](engineering-and-testing.md)）。
