# 03-Discipline — 开发纪律：core-minimal 哲学、一条规则、贡献门与自动化

> 本节回答 `harness/` 的第三个问题：**作为 coding harness，pi 开发上有没有策略和纪律。** 结论先行：有，而且纪律不是事后补的，是从哲学一路落到规则、自动化、发布流程的完整体系。

## 本节的立场

pi 是一个**同时防两类人**的项目：防"想往 core 塞功能"的贡献者，也防"把 AI 生成的 slop 灌进来"的 agent 使用者。它的纪律体系的独特之处是——**它自己就是被 agent 开发的**（`AGENTS.md` 的存在本身就是证据），所以它的规则必须写到"agent 能精确执行"的程度。

## 篇章

| 篇 | 评的是什么 | 一句话结论 |
|---|---|---|
| [3.1_core_minimal.md](./3.1_core_minimal.md) | core-minimal 哲学 | 它是 [01-Architecture](../01-Architecture/README.md) 三层接缝存在的**原因**——纪律和架构互为因果 |
| [3.2_one_rule_ai.md](./3.2_one_rule_ai.md) | "一条规则"（你必须理解你的代码） | 把 AI 协作的责任从工具钉回人 |
| [3.3_contribution_gate.md](./3.3_contribution_gate.md) | 贡献门（auto-close + lgtm/lgtmi） | 一套针对 AI 时代 tracker 洪水的治理模型，被自动化强制 |
| [3.4_engineering_rules.md](./3.4_engineering_rules.md) | AGENTS.md 规则 + check + 测试 harness | 规则写到 agent 能精确执行的程度，且用 faux provider 自测 coding agent |

## 写作定调（本节专属，叠加在 `../README.md` 之上）

- **纪律的评价标准是"是否被强制"**：口头的纪律不算数，落进 workflow / `npm run check` / 自动化才算。每篇要落到"哪一环是自动化强制的"。
- **区分"规则"和"规则的执行机制"**：`CONTRIBUTING.md`/`AGENTS.md` 是规则，workflow/check/测试是执行机制，两者要分开评。
- 机制回指 `../../agent/`；与 [01-Architecture](../01-Architecture/README.md) 的"纪律→架构因果链"（见 3.1）互相印证。
