# 02-Expansion — 扩充的四条轴

> 本节回答 `extensions/` 的核心问题：**核那么小，能力是怎么长出来的。** 读完 `examples/extensions/` 70+ 个示例，可以归纳成四条扩充轴——不是按 README 的九类（Lifecycle / Tools / UI / Git / …）切，而是按"扩充发生在循环的哪里、注入的是什么"切。前者是目录排版，后者才是扩充思路。

## 四条轴

扩充不是"随便加东西"，而是**沿着循环的既定接缝、以四种不同的动作展开**：

| 轴 | 动作 | 一句话 |
|---|---|---|
| [2.1 循环接缝](./2.1_loop_seams.md) | **拦截 / 改写** 循环里流动的东西 | 在输入、上下文、provider 请求、工具调用、结果、compaction 这些既定节点上，改写或阻断 |
| [2.2 注册面](./2.2_register_surface.md) | **往循环里加东西** | 注册新工具、命令、快捷键、CLI flag、provider、skill/prompt/theme 资源 |
| [2.3 长相](./2.3_presentation.md) | **改变循环的显示** | 覆盖工具渲染、消息/条目渲染、footer/header/editor/overlay |
| [2.4 持久化](./2.4_persistence.md) | **让扩充活过重启与分支** | 用 `details` / `appendEntry` / session 树重建，把扩展状态绑进 session |

## 为什么这四条轴能把 70+ 示例装下

对照几个示例验证一下：

- `permission-gate.ts` → 2.1（`tool_call` 拦截阻断）
- `todo.ts` → 2.2（注册工具）+ 2.4（状态持久化）+ 2.3（自定义渲染）
- `minimal-mode.ts` → 2.3（只改渲染）+ 2.2（同名覆盖工具）
- `custom-provider-anthropic/` → 2.2（注册 provider）
- `dynamic-resources/` → 2.2（注册 skill/prompt/theme）
- `ssh.ts` → 2.2（`operations` 接口换后端）+ 2.1（`before_agent_start` 改 system prompt）
- `plan-mode/` → 四条全占（这是它成为"最完整示例"的原因）

**一个扩展几乎总是占多条轴**——这正说明扩充是"循环上的一组正交动作"，而不是"选一种插件类型"。

## 写作定调

- 每条轴都要回答：**为什么这类扩充不能并进核、必须走扩展**。
- 机制（事件扇出怎么实现、`emit*` 怎么合并）回指 `../../agent/`，本节只讲"这条轴让作者能做什么、示例里怎么做的"。
- 每个示例锚点给出**它用了哪个具体 API**，不停在"它演示了 X"。
