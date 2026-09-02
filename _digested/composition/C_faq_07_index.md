# 附录 C：`composition/` 与 `_faq_on_digested/07_pi_usage_scenarios/` 的对应关系

本表记录 `composition/` 各篇与 `_faq_on_digested/07_pi_usage_scenarios/` 各文档的对应关系。`composition/` 是消化产物（面向任何想理解 pi 配置的人），`07/` 是问答（基于消化的二次研究）。

## 对应映射

| `composition/` 文件 | 对应 `07/` 来源 | 关系 |
|--------------------|----------------|------|
| README（本文档的索引） | `07/question.md` + `07/answer.md` | 问题定义 + 总论 |
| 1_core_philosophy.md | `07/01_capability_map.md`（哲学对比表）、`07/06_field_usage.md` E 横贯主题 | 从差旅映射提升为约束链 |
| 2_config_loading_chain.md | `07/04_local_audit.md`（全局层为空的事实）、`07/03_starter_kit.md`（三层加载链） | 结合本机实证和官方文档写成的加载机制 |
| 3_global_layer.md | `07/04_local_audit.md`（全局层全审计） | 本机审计的实践指导版 |
| 4_project_layer.md | `07/03_starter_kit.md`（组装三层）、本仓库 `.pi/`（实例分析） | 实例 + 原则 |
| 5_agents_md.md | `07/answer.md` 反模式和 AGENTS.md 建议 | 原则的深化 |
| 6_prompt_templates.md | `07/03_starter_kit.md` 的 prompts 实例 | 实例 + 设计原则 |
| 7_skills.md | `07/03_starter_kit.md` 第一层（接线）、`07/05_package_ecosystem.md` | 技能发现和复用 |
| 8_settings_json.md | `07/04_local_audit.md`（settings.json 审计） | 配置项全解 |
| 9_session_and_file_ui.md | `07/02_scenario_playbook.md`（PLAN.md 流程）、`07/06_field_usage.md` C2（`.scratch/`） | 文件即 UI 的通用模式 |
| 10 系列（七条轴） | `07/05_package_ecosystem.md`（包的 extension 能力） | 从包生态反推的轴分类 |
| 11 系列（决策框架） | `07/answer.md` 行动清单 + 反模式 | 行动清单的系统化 |
| 12_security_boundaries.md | `07/06_field_usage.md` C5（YOLO + 隔离共识） | 隔离档位的系统化 |
| 13_token_budget_audit.md | `07/06_field_usage.md` C3（5.3k 裸基准） | token 审计的系统化 |
| 14_community_patterns.md | `07/06_field_usage.md`（全部社区模式） | 社区模式的归类和验证等级 |
| A_migration_from_other_harness.md | `07/01_capability_map.md`（CC 16 条映射表） | 迁移实践的缩小版 |
| B_package_selection_guide.md | `07/05_package_ecosystem.md`（头部包核查表） | 选包的方法论 |

## 位置关系

```
_digested/                           _faq_on_digested/
  composition/        ← 消化 →         07_pi_usage_scenarios/
    README.md                         question.md（问题定义）
    1-14 篇 + 附录 A-C                answer.md（总论）
                                        01-07 篇（三路深挖实证）
```

`composition/` 把 `07/` 中的实证材料（本机审计、包生态、社区模式、跨 harness 最佳实践）消化成了可操作的配置决策系统。`07/` 保留了原始证据和问答上下文，`composition/` 是"消化后该怎么用"的系统化产出。

## 创建时间

2026-09-03。`composition/` 为 `_digested/` 的新增维度，基于 `07/` 全部七篇三路深挖材料。