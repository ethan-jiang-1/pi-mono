# 共性：同一条河的两种渡法

> 结论先行：pi 和 DSH 的真正共性不是"都灵活"，而是**都把可变部分和不可变部分用 seam 切开，并承认没有免费的灵活性**。差异只在于把哪一层设成不可变。

## 共性 1：都在"稳定锚点 ↔ 可变面"之间切一刀

| | pi | DSH |
|---|---|---|
| 不可变锚点 | 稳定核心（loop + 7 工具 + 统一扩展口） | 组合内核（Cordis 五原语为基础；`new Context()` 硬编码根，Loader 由 `boot()` 安装） |
| 可变面 | 扩展口（能力从核里长出） | 插件树（能力由节点拼出） |
| 边界声明 | `CONTRIBUTING.md` Philosophy 节："pi's core is minimal … If your feature does not belong in the core, it should be an extension." | `docs/architecture.md` L13："There is no privileged core to patch"，但 DSH 自己的消化材料承认：**"核心没有消失，而是下沉成了组合内核（composition kernel）"**（`/Users/bowhead/deepseek-harness/_digested/harness-idea/07-boundaries-costs-fit.md` L115-119） |

两边都诚实记账了代价：

- pi：`_digested/harness/01-Architecture/1.2_single_injection.md` 判断三——统一注入点的代价是生态锁定（无 MCP/ACP）+ 单点大接口。
- DSH：`/Users/bowhead/deepseek-harness/_digested/harness-idea/07-boundaries-costs-fit.md` L97-111 整节《诚实成本：灵活性不是免费的》——静态代码≠实际系统、动态依赖放大因果链、可逆≠事务、插件化≠安全、元框架成为新核心、外置维护税。

## 共性 2：都把"注册"当作能力的原子动作

| | pi | DSH |
|---|---|---|
| 动作 | `pi.registerTool()` / `pi.on(...)` | `ctx.plugin(plugin)` / `ctx.effect(...)` |
| 语义 | 往宿主的扩展系统挂一个对象 | 往插件树挂一个节点（fiber 管生命周期，卸载回收 effect） |

两者都不是"改核心"，而是"往运行时挂东西"。DSH 更彻底：注册即 effect，卸载自动回收。

## 共性 3：都主张"正确路径靠机制不靠自觉"

- pi：core-minimal 纪律（`_digested/harness/03-Discipline/3.1_core_minimal.md`）+ 工具自述与定义同源（`harness/04-Self-Description/4.2`）。
- DSH：paved road（正确路径是阻力最小路径）+ 门禁自身被负例测试（`/Users/bowhead/deepseek-harness/_digested/harness-idea/03-paved-road.md`）+ 运行时 invariant。

两边都把"怎么做对"从"读者自觉"挪到"系统机制"。

## 共性 4：都承认"一切皆插件/靠扩展"有边界

- pi：`harness/02-Boundaries/` 四条短板（无沙箱 / 无 MCP-ACP / AgentLane 半成品 / 无版本契约）。
- DSH：`harness-idea/07` 自己把边界讲完——核心下沉为组合内核，不是消失；self-modification 是 opt-in、bash-equivalent trust，不作安全边界。

**一句话：两者都不是"无限灵活"，是在某一层设了绝对稳定的锚，然后在锚之外拼命开放。**