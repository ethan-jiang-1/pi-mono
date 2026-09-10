# 总论：一句话判断 + 适用场景

> 本文件是 `06_pi_vs_dsh/` 的收束。要完整论证回 01-04。

## 一句话判断

**"哪一个更灵活"是伪命题——它俩是同一个问题（能力以什么形态存在）的两个极端答案：**

- **pi 的答案**："灵活 = 能力强而稳定"。核心稳定，扩展口少而深，把"能力"当作可长出去的可替换单元（lego）。它的灵活是**可扩展性**。
- **DSH 的答案**："灵活 = 运行时本身可组合"。无特权核心，把"能力"当作树上的节点，可装卸、隔离、交换（积木厂）。它的灵活是**可组合性**。

两者都承认这是个取舍，不是免费午餐：

- pi 消化材料 `harness/01-Architecture/1.2`：押"深可扩展 + 低认知成本"（判断四的结论），代价是"生态锁定（无 MCP/ACP）+ 单点大接口"（判断三记账的代价）。
- DSH 消化材料 `harness-idea/07`：**"如果你的主要复杂度是组合关系，dsh 的形状值得学；如果只想要清晰的 loop + 扩展 API，先学它的外置纪律，不必搬它的运行时做法。"**
- 而 pi 恰好属于后者——单态、清晰 loop、扩展口。

## 适用场景

| 场景 | 选谁 | 理由 |
|---|---|---|
| IDE 插件、嵌入别的 app、库里嵌 agent（library-first） | **pi** | `createAgentSession()` 进程内 SDK；一条扩展口；默认能力开箱可用 |
| 单一产品内环 + 扩展 API | **pi** | 组合压力小，DSH 的运行时复杂度不划算 |
| 多宿主（CLI/Web/ACP/JSON-RPC 复用同一 runtime spine） | **DSH** | 一个 spine 起多棵树，profile per surface |
| 多 provider、会话级隔离、运行时装卸、第三方生态 | **DSH** | 组合压力大到值得付学习成本与复杂度税 |
| 想"机器可检查"的参与契约（门禁/负例测试/不变量） | **DSH** | visible ⟺ logged、dump-config、生成目录 |
| 想要一个安静稳定的内核 + 熟人生态自用扩展 | **pi** | core-minimal 纪律 + 护栏写在 host |

> 补充（[05_out_of_box.md](05_out_of_box.md)）：上表比的是"选谁"。若只看"开箱能不能直接写代码"：DSH 赢在**默认组合宽**（standard preset 整队挂载，paved road 落到配置层），pi 的开箱是裸 loop + 4 工具（core-minimal 落到配置层，配置要自己拼）。这是默认 outfit 的差异，不是运行时能力差异——`sdk-minimal` profile 的 DSH 同样"没配置好"，拼齐 examples 的 pi 同样不话唠。

## 挖到底的那句话

> **两个 harness 都认为"扩展（插件）是参与的一等公民，不是附加功能"；分歧只在"谁扩、扩在哪"。pi 让核心（稳定 loop）决定扩展的资格；DSH 让组合内核（五原语为基础，Loader 由 `boot()` 安装）决定扩展的资格。**
> 这是认真读了两边消化材料后最推不翻的一点：它们共享同一条河的两岸，只是渡法不同。

## 交叉一课（DSH 可迁移给 pi 的）

DSH 的 `harness-idea/07`（L129）给了一条可迁移给 pi 的判据：**"如果只想要一个清晰的 loop + 扩展 API，先学它的外置纪律，不必搬它的运行时做法。"** pi 的静态层已经部分走在这条路上（docs 随包、README 自述入口），但还缺：机器检查（verify links / doc budgets）、运行时自省工具。若要补强 pi 的"harness 化"，这三个点是最短路径。

## 引用

- pi 侧：`_digested/harness/01-Architecture/1.1-1.4`、`harness/02-Boundaries/`、`extensions/01-Core/1.2`（基线 `v0.85.1` / `d981de122`）
- DSH 侧：`/Users/bowhead/deepseek-harness/_digested/harness-idea/07-boundaries-costs-fit.md`（基线 `0.1.1-rc.1` / `528c682e…`）、`harness-idea/00-map.md`