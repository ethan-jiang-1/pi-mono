# FAQ on Digested · 基于消化材料的二次研究

这个目录不是面向学习者的 FAQ。这里的每一个问题是我们在阅读消化材料、翻源码的过程中**自己产生的困惑**，答案需要跨越多个 `_digested/` 条目、甚至结合源码才能综合出来。

简单说：**一子目录 = 一个探究过的问题，答案是自己综合出来的，不是从某一份材料里直接抄的。**

> **当前研究基线**：涉及运行时行为的结论以 pi-mono **`v1.4.0`（upstream tag `4a080252f`）** 为准；旧版本仅用于变更史解释，不能替代当前源码验证。**sync-0010 增量**：chord 在 v1.3.0 完成第二次收口（`Ref`/placement/async get/协议 4），v1.4.0 加 `Context.telemetry` 与 `chord/sqlite`；durable 加 `sleeping` 状态（`TaskRuntime.sleep()` 删除）与 SQLite schema v2（不可回退）、crash-loop guard、IndexedDB、telemetry；telemetry 升为 ai/chord/durable 共用横切层；模型目录改为服务已发布客户端、发布前做兼容检查；client identity 统一 UA/attribution。详见 [`../_digested/_change_log/0010-v1.2.0-to-v1.4.0.md`](../_digested/_change_log/0010-v1.2.0-to-v1.4.0.md)。（上一基线：`v1.2.0`，tag `06a466935`。）（上一基线：`v1.0.3`，tag `d78dc83d6`，工作树锚点 `98d2e1947`，2026-10-06 随 sync-0008 merge `fad4b11bd` 进本仓库。）**sync-0009 增量**：`packages/{client,protocol,server}` 三包与 `coding-agent/src/experimental/` 服务栈整体删除、`chord2` 重写、`packages/env` 由 Unreleased 转入 release、tools 修饰符 `+name`/`-name`、`chord/PLANNING.md` 删除。经 0009 取证，本目录受影响篇目已逐条核对并更新（01/02/03/06/07/08/12），其余各篇未受影响。**另经 0010 覆盖矩阵复核**：01/02/03 三篇的残余缺口已全部落地（01 补 llama.cpp 原生决策模型与 OpenRouter 按 key 目录、02 补 `showHardwareCursor` 语义变更与 shifted symbol 匹配、03 补 `RefreshModelsContext.baseUrl` 与区域 endpoint），04 篇的行数断言已按 v1.2.0 重核；并订正 01 篇此前一条错误结论（本区间**模型目录零新增**，不存在新模型条目）——变更明细见 [`_digested/_change_log/0009-v1.0.3-to-v1.2.0.md`](../_digested/_change_log/0009-v1.0.3-to-v1.2.0.md) 的影响评估。**注意**：v0.85.x–1.0.0 的研究债务已在 sync-0007 执行轮清偿（06/09 等篇含 v1.0.0 更正）；sync-0008 增量（azure 改名、Home/End 键位、`--tools` MCP 语义、pi-env 成包等）已更新 01/02/03 并给 07/08 补注，其余各篇经 0008 取证逐条核对未受影响——变更明细见 [`_digested/_change_log/0008-v1.0.0-to-v1.0.3.md`](../_digested/_change_log/0008-v1.0.0-to-v1.0.3.md) 的影响评估。

> **新增研究的独立锚点**：第 12 篇理念 FAQ 核对到 `cb18c7cbc89d5becbb4ea2e490a6e7ad0e989f04`，与上述全库研究基线区分；其它篇不因此被视为已全量同步。

## 和 `_digested/` 的区别

| | `_digested/` | `_faq_on_digested/` |
|---|---|---|
| 读者 | 第一次研究 pi-mono 的人 | 我自己（产出者） |
| 答案来源 | 源码消化 + 整理 | 跨多份消化材料 + 源码的综合推断 |
| 本质 | 文档 | 研究过程的归档 |
| 粒度 | 按主题分 section | 一个问题一个子目录 |

## 目录结构

```
_faq_on_digested/
├── README.md
├── <NN_question-slug>/
│   ├── question.md        # 问题描述 + 背景
│   ├── answer.md          # 答案 / 分析 / 结论
│   └── research.md        # 可选：一手证据账本与复核边界
```

## 命名约定

- `NN_` 数字前缀按创建时间排序
- slug 用英文，简短描述问题主题

## 已有问题

- [`01_model_switching/`](01_model_switching/question.md) — pi-mono TUI 里怎么换模型？Ctrl+P 背后发生了什么？
- [`02_tui_keybindings/`](02_tui_keybindings/question.md) — pi-mono TUI 有哪些快捷键？分别干什么？
- [`03_third_party_provider_baseurl/`](03_third_party_provider_baseurl/question.md) — 第三方中转模型怎么挂才不和官方 DeepSeek 冲突？（模型身份、同名 upsert、deepseek.com 魔法探测失效）
- [`04_root_entry_doc_design/`](04_root_entry_doc_design/question.md) — Pi 根入口文档的**静态设计**：这张地图怎么画？（Pi 静态层几乎没画地图，把它委托给运行时）
- [`05_root_entry_doc_navigation/`](05_root_entry_doc_navigation/question.md) — Pi 跑起来之后根入口文档怎么被**动态消费**？（注入 buildSystemPrompt + read 拉取 + compaction 回收）
- [`06_pi_vs_dsh/`](06_pi_vs_dsh/question.md) — pi vs DSH：两个"很灵活"的 harness，共性、差异、优缺点？——可扩展性 vs 可组合性
- [`07_pi_usage_scenarios/`](07_pi_usage_scenarios/question.md) — Pi"只是命令行"是不是能力有限？正常/合理用法有哪些？（三路深挖修订版：CC/Codex 映射、本机审计、包生态、社区实战、2026 跨 harness 新实践、三层组装 starter kit）
- [`08_extension_vs_package/`](08_extension_vs_package/question.md) — Extension 和 Package 到底是什么区别？（两篇并列文档、两套安装路径、settings 里并列的两个键）
- [`09_package_ecosystem/`](09_package_ecosystem/question.md) — pi 包生态全景：规模、集中度、品类、空位（5412 包快照 + 选装菜单）
- [`10_getting_started_first_extension/`](10_getting_started_first_extension/question.md) — 如何在 Pi 底下开发第一个插件/扩展？按诉求性质怎么选型与落地最合理？（性质推荐矩阵、三秒调试循环、五类模板、多轴门禁实战与工程避坑）
- [`11_production_extension_repo_archetypes/`](11_production_extension_repo_archetypes/question.md) — 真实世界头部 Pi 扩展的工程架构与 Repo 组织解剖（866K 标杆逐案深度拆解：前后诉求、影响面、利用能力与代码逻辑结构）
- [`12_pi_philosophy/`](12_pi_philosophy/question.md) — Pi 自己的理念是什么？（作者原生动机、核心纪律、上下文/会话/宿主选择、人的理解责任与自动恢复边界）
- [`13_recorded_session_snapshots/`](13_recorded_session_snapshots/question.md) — Pi 里有没有 DSH「录制会话快照」的思想？（不变量同根实现两极：transcript 即请求源 vs request/header 录制；faux 全 authored 但四类失败覆盖三类半；轨迹资产的 DIY 夹具路径。**已升级**为 [`_digested/trajectory/`](../_digested/trajectory/README.md)，本目录保留研究过程归档）

## 引用规范

引用 `_digested/` 中的材料时使用相对路径：

```markdown
_digested/agent/01-Anatomy/1.1_Agent_Info.md
_digested/integration/03-runtime-api.md
```

引用源码时标注 commit hash 或 tag，避免链接随时间失效。
