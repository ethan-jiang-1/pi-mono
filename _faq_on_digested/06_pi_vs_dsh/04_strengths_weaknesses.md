# 各自突出优点与硬伤

## pi 突出优点（DSH 难做到）

1. **易上手**：一个 `pi` 对象、一次认知。三层接缝按"调用频率 × 学习预算"裁剪接口大小（`harness/01-Architecture/1.1` 判断四）——operations 极小（1 方法）、extension 极大（但按需查字典）。DSH 要五原语 + 四层参与阶梯（L0 配置 → L1 扩展点 → L2 seam → L3 loop）。
2. **托管第三方代码的护栏做完了**（`harness/01-Architecture/1.4`）：两阶段绑定（宿主不必迁就扩展的初始化顺序）、stale 保护（丢弃悬空引用而非静默写错 session）、fail-close（权限钩子崩溃=工具被拦，是安全默认值）。这是"进程内跑陌生代码"的整套答案，且写一次覆盖所有能力类型。
3. **分发闭环成熟**（`harness/01-Architecture/1.3`）：本地单 `.ts` → 目录 → manifest → `pi install` → `pi -e` 一次性试跑，全程同一条路径、一套心智，无"本地/发布"两套 SDK 分裂。
4. **默认工作流让用户选**（`extensions/01-Core/1.2`）：plan-mode / subagent 是 example，核只给乐高，不替用户定 workflow。而且 `pi install` 自带包管理，project/global scope 让扩展变成可共享的配置。

## pi 突出硬伤（3 项"吸纳陌生人"三连）

1. **无默认沙箱**：扩展 = 宿主进程同等权限，`pi install` 一个陌生包 ≈ 执行其任意代码（`harness/02-Boundaries/2.1`）。"信任在谁装、不在代码"。
2. **无 MCP/ACP**：生态锁在自家 ExtensionAPI，外部工具要付适配层税（`harness/02-Boundaries/2.2`）。subagent 都是自家 extension 拼的，不是外部协议。
3. **无版本契约**：v0.83→v0.84 就 breaking 过（`AgentEvent` 更名、`AgentHarness` 去泛型化），但扩展无法声明"我需要哪个 API 版本"（`harness/02-Boundaries/2.4`）——升级 pi 后第三方扩展可能静默炸。

## DSH 优势

1. **组合能力**：运行时装卸、换后端整面换（Consumer 不动）、HMR + 坏配置保留旧树、会话级服务隔离、self-modification（harness 检视自己）。
2. **动态可读性**：`--dump-config` / 生成目录是基线能力；`cordis_inspect` 是 opt-in 开发工具（须启用 `dsh-tool-cordis`，非产品默认）——agent 能问运行时，而不是猜源码。
3. **模型可见 ⟺ 已记录**是 machine-checked 不变量（不一致直接 fail），pi 只有文档/设计承诺。（采信口径：属 harness-idea「判断层」结论，有源码 `invariant.ts` 落点。）
4. **规则必可执行**：门禁、负例测试、invariant；"漂移先撞机器，不是先撞读者"。

## DSH 突出硬伤

1. **组合复杂度成为你的复杂度**：静态代码 ≠ 实际系统（最终拓扑看 profile/patch/realm），第一排障证据是 `--dump-config`；动态依赖放大因果链，要查 fiber epoch 与收敛。
2. **元框架 vendor 是硬抵押**：Cordis 被 vendor 进 `vendor/`（本地修改 18 条 + sync 成本），学习成本高（五原语 + 四层参与阶梯）。
3. **外置维护税**：1486 个 note + 数十门禁 + 100% coverage + 根 AGENTS 上下文预算——"可参与性 = 外置程度 ÷ 外置成本"。
4. **性能缺量化**：运行时开销 vs 大规模插件图没有对照基准（开放问题）。

## 谁强谁弱的汇总

| 方面 | 谁强 | 证据 |
|---|---|---|
| 上手/认知成本 | pi | 一个对象、一层阶梯 vs 五语+四层 |
| 稳定 API / 版本承诺 | pi | 核心稳定（但扩展 API 无契约） vs 无特权核心 |
| 运行时装卸/换后端 | DSH | profile patch + Consumer 不感知 |
| 会话级隔离 | DSH | isolate realm |
| 互操作（MCP/ACP） | DSH（多面） | 有 ACP/JSON-RPC 等入口；pi 无 MCP/ACP |
| 机器保证（模型可见） | DSH | visible ⟺ logged 不变量（harness-idea 判断层，源码落点 invariant.ts） |
| 对陌生插件安全 | 两个都烂 | pi 无沙箱；DSH 插件化≠安全 |
| 默认开箱 | pi | 7 工具直接可用；DSH 靠 bundle/profile 组合（`dsh-base` 打底） |
| 分发闭环 | pi 略强 | manifest+install+-e |