# composition/ — Pi 的组装哲学与通用配置框架

> **基线**：pi-mono `v0.85.1`（upstream tag `d981de122`，merge `e3aa42f46`；上一版写 v0.84.4）。本维度是 2026-09-03 新增的第六个分析维度，与 [`agent/`](../agent/)（机制解剖）、[`harness/`](../harness/)（平台评价）、[`extensions/`](../extensions/)（扩充思路）、[`integration/`](../integration/)（外部嵌入）、[`_change_log/`](../_change_log/)（版本追踪）并列。
>
> **v0.85.1 变更（2026-09-10）**：① 第四部分从"七条轴"扩为"**八条轴**"——新增 [10i 第八根轴：进程/环境轴](10_extension_axes/10i_process_axis.md)（v0.85 引入的 chord facet 插件轴；切"代码跑在哪个进程/环境"，与轴 1-7 是横切关系，目前是实验路径）。② [12 安全边界](12_security_boundaries.md) 加了 scope 限定："pi 没有内置沙箱"对 `core/extensions` 仍成立，而 facet 投递路径已选定 isolated-vm + 字符串膜（**是规格 + PoC，不是产品**）。③ 本 README 与 10 系列的锚点已按 v0.85.1 工作树复核。
>
> 它的主题不是"怎么运转"，而是"运转起来之后，作为用户应该怎么理解和配置它"。

## 这是什么

已有的四个分析维度说明 pi **作为项目** 的内在质量：

| 维度 | 回答的问题 |
|------|-----------|
| `agent/` | Agent 循环怎么跑？消息、工具、扩展怎么进入循环？ |
| `harness/` | 它作为开源 harness 结构优不优秀、好不好扩展、自描述够不够？ |
| `extensions/` | 核有多小？扩充靠哪几条轴？怎么拼才安全？ |
| `integration/` | 别的宿主怎么把 pi 接进去？ |

但还有一个问题没被上述任何一个回答：

> **我已经理解了 pi 的设计，拿到一个新项目，我应该怎么配置它？每层放什么？什么决定加不加？**

这就是 `composition/` 回答的问题。它不是"再写一篇机制分析"——它是把前四个维度的结论消化成一个人可以操作的**配置决策系统**。

## 文档总览

这个目录的文件按"先理解再操作"的顺序组织，不是按字母。

### 第一部分：哲学基础（理解 pi 的根）

| 文件 | 回答的问题 | 对应已有维度 |
|------|-----------|-------------|
| [1_core_philosophy.md](1_core_philosophy.md) | Pi 的核心设计哲学是什么？少掉的功能是被动缺失还是主动跳过？ | harness/03, extensions/01 |

### 第二部分：配置加载链（pi 发现配置的机制）

| 文件 | 回答的问题 | 对应已有维度 |
|------|-----------|-------------|
| [2_config_loading_chain.md](2_config_loading_chain.md) | 全局层、项目层、CLI 层三层如何叠加？优先级和覆盖规则是什么？ | harness/04/4.4 |
| [3_global_layer.md](3_global_layer.md) | `~/.pi/agent/` 放什么？哪些东西应该全局装、哪些不应该？ | 04_local_audit 实证 |
| [4_project_layer.md](4_project_layer.md) | `.pi/` 目录怎么组织？每个子目录干什么？ | 08 篇实例分析 |

### 第三部分：配置单元（每类配置逐个深挖）

| 篇号 | 文件 | 回答的问题 |
|------|------|-----------|
| 5 | [5_agents_md.md](5_agents_md.md) | AGENTS.md 的设计艺术：放什么、不放什么、多长、覆盖机制 |
| 6 | [6_prompt_templates.md](6_prompt_templates.md) | Prompt template 的格式、参数系统、什么时候用、token 成本 |
| 7 | [7_skills.md](7_skills.md) | Skill 的格式、与 prompt template 的区别（按需加载 vs 每次注入）、跨 harness 共享 |
| 8 | [8_settings_json.md](8_settings_json.md) | `settings.json` 可配置项全解（provider、model、tools、skills、theme） |
| 9 | [9_session_and_file_ui.md](9_session_and_file_ui.md) | Pi 的"文件即 UI"哲学：PLAN.md、TODO.md、PROGRESS.md 等文件的用法 |

### 第四部分：Extension 八条轴（可定制性的完整边界）

> 💡 八条轴的全部文档在 [`10_extension_axes/`](10_extension_axes/README.md) 子目录。

| 篇号 | 文件 | 轴 |
|------|------|----|
| 10 | [10_extension_axes/README.md](10_extension_axes/README.md) | 八条轴总览——前七条是什么、如何组合、与内置工具的关系；第八根轴单列 |
| 10a | [10_extension_axes/10a_commands.md](10_extension_axes/10a_commands.md) | 轴 1：注册 `/command` |
| 10b | [10_extension_axes/10b_event_hooks.md](10_extension_axes/10b_event_hooks.md) | 轴 2：挂事件钩子（36 个事件的分类、使用场景、安全模型） |
| 10c | [10_extension_axes/10c_shortcuts.md](10_extension_axes/10c_shortcuts.md) | 轴 3：快捷键 |
| 10d | [10_extension_axes/10d_toolset_switching.md](10_extension_axes/10d_toolset_switching.md) | 轴 4：运行时切换工具集（只读讨论模式的技术基础） |
| 10e | [10_extension_axes/10e_ui_injection.md](10_extension_axes/10e_ui_injection.md) | 轴 5：注入/修改 TUI（widget、status、notify） |
| 10f | [10_extension_axes/10f_persistence.md](10_extension_axes/10f_persistence.md) | 轴 6：跨会话持久化 |
| 10g | [10_extension_axes/10g_providers.md](10_extension_axes/10g_providers.md) | 轴 7：注册模型提供商 |
| 10h | [10_extension_axes/10h_combinatorics.md](10_extension_axes/10h_combinatorics.md) | 组合使用：一条扩展同时用多轴的真实案例解剖（+ 案例 4：轴 8 不走组合这套算法） |
| 10i | [10_extension_axes/10i_process_axis.md](10_extension_axes/10i_process_axis.md) | **轴 8：进程/环境轴**（v0.85.1 追加）——facet 插件；切"代码跑在哪"，与轴 1-7 横切；目前是实验路径 |

### 第五部分：决策框架（每层加不加的判断方法）

> 💡 五层决策框架的全部文档在 [`11_decision_framework/`](11_decision_framework/README.md) 子目录。

| 篇号 | 文件 | 回答的问题 |
|------|------|-----------|
| 11 | [11_decision_framework/README.md](11_decision_framework/README.md) | 五层递进框架总览 + 完整决策树 |
| 11a | [11_decision_framework/11a_layer0_bare.md](11_decision_framework/11a_layer0_bare.md) | 层 0：裸运行——什么时候裸 pi 就够了，什么信号说明不够了 |
| 11b | [11_decision_framework/11b_layer1_project_facts.md](11_decision_framework/11b_layer1_project_facts.md) | 层 1：AGENTS.md 项目常识 |
| 11c | [11_decision_framework/11c_layer2_workflow.md](11_decision_framework/11c_layer2_workflow.md) | 层 2：Prompt template 固定工作流 |
| 11d | [11_decision_framework/11d_layer3_runtime.md](11_decision_framework/11d_layer3_runtime.md) | 层 3：Extensions / packages 运行时能力 |
| 11e | [11_decision_framework/11e_layer4_personal_rules.md](11_decision_framework/11e_layer4_personal_rules.md) | 层 4：全局 AGENTS.md 个人纪律 |

### 第六部分：边界与审计

| 篇号 | 文件 | 回答的问题 |
|------|------|-----------|
| 12 | [12_security_boundaries.md](12_security_boundaries.md) | YOLO 默认 → 工具白名单 → bwrap → 容器：四档隔离的配置与选择 |
| 13 | [13_token_budget_audit.md](13_token_budget_audit.md) | 每项配置的 token 成本、审计方法、5.3k 裸对照基准 |
| 14 | [14_community_patterns.md](14_community_patterns.md) | 社区验证的配置模式：讨论优先模式、`.scratch/` + `n2c:`、自扩展优先、DX > AGENTS.md |

### 附录

| 文件 | 回答的问题 |
|------|-----------|
| [A_migration_from_other_harness.md](A_migration_from_other_harness.md) | 从 Claude Code / Codex 迁到 pi 的配置映射 |
| [B_package_selection_guide.md](B_package_selection_guide.md) | 包生态的选定方法：token 价审计、活跃度判断、cherry-pick vs 全量 |
| [C_faq_07_index.md](C_faq_07_index.md) | 本篇与 `_faq_on_digested/07_pi_usage_scenarios/` 的对应关系 |

## 与其它维度的关系

| 维度 | 本质 | 本维度的关系 |
|------|------|-------------|
| `harness/03-Discipline/3.1_core_minimal.md` | core-minimal 纪律分析 | 本维度 1 篇以此为起点 |
| `harness/01-Architecture/1.2_single_injection.md` | 统一注入点取舍分析 | 本维度 10 篇的**前七条轴**以此为技术基础（轴 8 不走统一注入点） |
| `harness/04-Self-Description/4.4_context_layers.md` | 三层上下文分层加载 | 本维度 2 篇三层加载链以此为机制依据 |
| `extensions/01-Core/1.2_skipped_features.md` | plan-mode/subagent 故意跳过分析 | 本维度 1 篇"不替你决定工作流"以此为例证 |
| `agent/01-Anatomy/1.4_Extension_System.md` | 扩展系统运转机制 | 本维度 10 篇引用其事件列表，不重复机制 |
| `harness/02-Boundaries/` | 四类边界 | 本维度 12 篇安全边界以此为锚（**已加 scope 限定**：对 `core/extensions` 仍成立） |
| [`extensions/02-Expansion/2.5_second_axis_facets.md`](../extensions/02-Expansion/2.5_second_axis_facets.md) | 第二条扩展轴（facet 插件）的机制与术语碰撞 | 本维度 10i（轴 8）引用其机制，不重复 |
| `packages/agent/docs/mobile-handoff/` | facet / 沙箱的**规格与 PoC** | 本维度 12 篇引用时一律标为"规格 + PoC，不是产品" |
| `_faq_on_digested/07/` | 基于消化的 pi 用法场景问答 | 本维度 C 篇列出对应 |

## 阅读路径

**第一次接触 pi 的人**：1 → 2 → 5 → 6 → 7 → 8 → 11（五层框架总览）→ 11a（决定要不要配）

**已经用了 pi 但想优化的人**：5（AGENTS.md 体检）→ 9（文件即 UI 重新理解）→ 13（token 审计）→ 11 系列（按你现在卡在哪层进入）

**想自己写扩展的人**：10 系列（前七条轴全部要读，特别是 10b 事件钩子和 10h 组合模式；10i 只在关心 facet/进程边界时读）

**从 CC/Codex 迁移过来的人**：A → 1（先理解哲学差异再动手）→ 11 系列

## 写作定调

- `composition/` 是 `_digested/` 里唯一不以"机制分析"为主、而以"用户决策"为主的维度。它不可避免比其它篇更"主观"——但所有主观结论都必须锚定到其它维度的硬事实。
- 每篇的默认顺序：用户问题 → 设计约束链 → 你的决策空间 → 锚点（其它维度或源码）→ 最小例证。
- 不重复其它维度的机制细节，引用即可。引用格式：`harness/03-Discipline/3.1_core_minimal.md`。

## 已知缺口

| 缺口 | 原因 | 优先级 |
|------|------|--------|
| Pi 的社区发行版（oh-my-pi / lazypi）与本框架的兼容性 | 需要更多社区实证 | 中 |
| MCP 接入者的配置坐标 | pi-mcp-adapter 的 token 成本模型未收敛 | 中 |
| 编译/文档生成等 CI 集成配置 | 有场景但没收敛成"决策树 CI 子分支" | 低 |
| 跨用户/跨团队的共享配置模式 | 没有足够实证 | 低 |

## 建立时间

2026-09-03。综合 `_digested/` 全部现有维度 + `_faq_on_digested/07_pi_usage_scenarios/` 三路深挖材料。它把"我会用 pi 了"从直觉升级为可推理的决策系统。