# 10i. 第八根轴：进程 / 环境轴

> 本篇 2026-09-10 追加（基线 v0.85.1）。前七条轴（10a-10g）切的是"往哪个口子挂能力"；本篇切的是另一个问题——"**这段代码跑在哪个进程 / 环境**"。

## 用户问题

我能不能不把 agent、UI、server 权威都塞在一个进程里？durable agent 跑在 worker 里、UI 跑在客户端、server 另有一份权威状态——这种时候"扩展"这个概念还成立吗？

## 第八根轴是什么

前七条轴（见 [README](./README.md)）有一个**共同前提**：代码跑在**同一个进程**里、是**一份代码**、共享**一个 `pi` 对象**。第八根轴把这个前提拿掉了。

**轴 8（进程 / 环境轴）：把同一个 feature 的实现按 host 拆成多份，每份跑在它所属的进程 / 环境里，靠 shared service ID + wire contract 连接。**

它是 v0.85 随第 11 个包 `packages/chord` 一起进来的（facet 插件）。机制的完整描述与术语碰撞见 [`extensions/02-Expansion/2.5_second_axis_facets.md`](../../extensions/02-Expansion/2.5_second_axis_facets.md)。

## 为什么它不能被塞进前七轴

**它不是轴 2（事件钩子）的子集。** facet 之间不通过内存事件总线通信——它们可能在不同进程里，靠的是 service token 与 wire contract（RPC 调用与 replicated state），而不是 `pi.on(...)`。

**它不是轴 5（UI 注入）的子集。** 轴 5 是"改我所在这份 UI"；轴 8 说的是"UI 这一半根本跑在另一个进程 / 环境里"。

**它不是轴 6（持久化）的子集。** 轴 6 是"把扩展状态绑进 session 树"；轴 8 问的是"**哪一份代码**持有 durable 状态"——答案可能是 worker 进程，而 UI 只是它的一个远程观察者。

**它不是轴 7（provider 注册）的子集。** 轴 7 是往当前运行时注册一个模型后端；轴 8 是说"这个 feature 的每个 host 只加载自己那份 bundle"。

## 与前七轴的关系：横切，不是并列

| | 轴 1-7 | 轴 8 |
|---|---|---|
| 切什么 | 能力挂到循环的哪个口子 | 代码跑在哪个进程 / 环境 |
| 作用范围 | 一个扩展文件内的一条条接线 | 跨进程 / 跨 bundle 的整体切分 |
| 与对方的关系 | 七条彼此正交 | **与前七条都正交且横切**：一个 facet 化的 feature，它的每一份 bundle 内部仍然在用"注册命令 / 挂事件钩子 / 注入 UI"这些动作，只是分别发生在不同 host 里 |

换句话说：**第八根轴不给七条轴加第八种"动作"，而是给它们加了一个"标签维度"**——同一个动作，现在要回答"这段代码跑在哪"。

## 现状与状态（引用前必须分清）

和第二条扩展轴一样，**轴 8 目前是实验路径，不是可用的部署选项**：

- **运行时在**：`packages/chord`（第 11 个包，零 Pi 依赖，由 `packages/chord/test/boundary.test.ts` 自动守住边界）；
- **活证据在**：`packages/coding-agent/examples/plugins/pi-example-plugin/`（`src/contract.ts` / `src/session.ts` / `src/tui.ts`）；
- **但它只在 repo checkout + `PI_EXPERIMENTAL=1` 下可用**，**不在 npm 包和 standalone binary 里**（v0.85.0 曾把整个 experimental 远程栈打进 npm 包，#9132；v0.85.1 已把相关依赖降为 `devDependencies` 并排除 `dist/experimental`）；
- **被引为"设计"的文档是规格不是现状**：`packages/agent/docs/mobile-handoff/02-plugins/01-facets/facets.md` 自称 supersede `plugins.md`，但 `peer` service mode、`definePeerService`、静态 `uses`/`provides` manifest 在 chord 里**全部没有实现**（chord 的 `ServiceMode` 只有 `"singleton" | "keyed"`，`packages/chord/src/types.ts:60`）。`mobile-handoff/README.md:22` 自己写着 "Three units ship working code. Four are specifications. Do not assume a doc describes something that exists."

## 对配置决策的意义

对绝大多数人，**轴 8 现在还不该出现在配置里**——因为它还没有可安装的产品面。本框架把它列成第八根轴，是为了：

1. 让"七条轴"的地图**在结构上完整**——当 facet 路径成熟时，读者不会把它误当成"轴 2 的一种用法"；
2. 让"极简核 + 靠扩展长能力"的判断**更有解释力**——facet 是这个判断的加强版（连 `Context` 都外挂给了应用中立的 `chord`，见 `packages/agent/src/harness/context.ts`）；
3. 给未来的配置问题留坐标：一旦它可用，"这一层的权威放 server、那一层放 session worker"会变成一个新的配置决策点。

## 锚点

- `packages/chord/src/types.ts:60`（`ServiceMode`）、`:206`（`FacetEnvironment`）、`:227`（`setup(env)`）
- `packages/chord/src/api.ts:19/66/70/84/88`：`createFacetHost` / `defineFacet` / `defineService` / `createRemoteServiceBinding` / `replicatedState`
- `packages/coding-agent/examples/plugins/pi-example-plugin/`：活证据
- `packages/agent/src/harness/context.ts`：chord 的 `Context`/`ContextKey` 已进非实验源码
- [`extensions/02-Expansion/2.5_second_axis_facets.md`](../../extensions/02-Expansion/2.5_second_axis_facets.md)：机制、术语碰撞、规格 vs 现状
- [`composition/10_extension_axes/README.md`](./README.md)：前七轴总览
- [`composition/12_security_boundaries.md`](../12_security_boundaries.md)：facet 投递路径的隔离方案（规格 + PoC）

## 最小例证

**例证 1（八轴 ≠ 七轴的又一次使用）**：README 的例证 2 里，`plan-mode` 用了 5 条轴，但全部在**一个扩展文件、一个进程**里。`pi-example-plugin` 只做了一件事（TUI 里的 `/hello` 调一个远程 greeting service），却把代码放进了**两个进程**——让它成立的是轴 8，不是轴 1/2/5 的又一次使用。

**例证 2（横切而非并列）**：`pi-example-plugin` 的 TUI 那份 bundle 里仍然要"注册一个 `/hello` 命令"（轴 1）。所以轴 8 不是替代轴 1，而是给轴 1 加上"跑在哪个进程"的标签。

**例证 3（状态决定配置）**：不需要配任何东西——因为目前没有可安装的产品面。看到别处把 facet 描述成"pi 的扩展方式之一"时，先回去看那篇文档标的是规格还是现状。
