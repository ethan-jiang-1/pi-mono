# 机制对照表：六个维度的逐项对比

> 这张表是 01（共性）和 02（差异）的压缩版，用于快速查阅。证据锚点：
> - pi：`_digested/harness/01-Architecture/{1.1,1.2,1.3,1.4}`、`_digested/harness/02-Boundaries/`、`_digested/extensions/`（`01-Core/1.2`、`02-Expansion/`）、`_digested/agent/01-Anatomy/1.4`（源码或引用统一以 `v0.84.3` / `4e58f324f` 为基线）。
> - DSH：`/Users/bowhead/deepseek-harness/_digested/` 的 `system/00-map.md`、`cordis-runtime/00-map.md`、`composition/00-map.md`、`capability-seams/00-map.md`、`harness-idea/07-boundaries-costs-fit.md`（基线 `528c682e…`）。

| 维度 | pi | DSH |
|---|---|---|
| **定位** | library-first 的可嵌入 agent SDK | 多面（CLI/Web/ACP/JSON-RPC 复用一套 runtime spine）的 agent harness |
| **核心形态** | 稳定核心（loop + 7 工具 + 统一扩展口） | 组合内核（Cordis 五原语为基础；`new Context()` 硬编码根，Loader 由 `boot()` 安装） |
| **扩展单元** | `extension`：`export default (pi) => {...}` 工厂 | `plugin`：带 `name/inject/Config/apply` 的 Cordis 插件 |
| **生命周期** | 两阶段绑定（`bindCore` stub→真实）、stale `invalidate`、权限钩子 fail-close | fiber 管生命周期、effect 卸载回收、inject 依赖 PENDING→激活 |
| **接缝设计** | 三层接缝：operations（1 方法）→ tool（~8 字段）→ extension（33 事件 + ~20 方法） | capability seam：Definition / Provider / Consumer 三角色 |
| **换后端** | 换 adapter：如 `BashOperations` 换 `ssh.ts`（一个扩展委托全部工具） | 换 bundle/profile patch 两行声明，Consumer 全不动（E2B 例子） |
| **隔离** | 全局共享进程，无扩展级沙箱 | isolate realm 会话级服务隔离（插件化 ≠ 安全，同进程 import Node API 挡不住） |
| **动态可读性** | 无（运行时组装，无自省工具） | `--dump-config` / 生成目录；`cordis_inspect` 是 opt-in 开发工具（须启用 `dsh-tool-cordis`，非产品默认） |
| **扩展分发** | 本地目录 → npm 包 / `pi install`，`pi -e` 一次性试跑，manifest 4 字段 | 插件即 npm 包（无人格分裂），组合进 patch 层 |
| **工作流** | plan-mode / subagent 都是 example（核只给积木） | 工作流即插件组合（preset 等） |
| **默认值** | 高（7 工具，可再装扩展） | 默认由 bundle/profile 组合提供（`dsh-base` 为每 profile 打底层），不内置单一工具集 |
| **边界短板** | 无沙箱 / 无 MCP-ACP / AgentLane 半成品 / 无版本契约（四短板） | 元框架 vendor 是硬抵押 / 性能无量化 open question / 外置维护税（1486 notes 等） |

## 一句话对比表

> "pi 是**玩积木**，DSH 是**造积木**。" —— 一个把能力组合成产品，另一个把"组合"本身当成运行时的产品。