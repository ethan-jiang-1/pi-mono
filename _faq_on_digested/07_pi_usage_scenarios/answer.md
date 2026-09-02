# 总论:一句话判断 + "我应该做什么"清单

> 本文件是 `07_pi_usage_scenarios/` 的收束。论证与场景细节回 [01_capability_map.md](01_capability_map.md)、[02_scenario_playbook.md](02_scenario_playbook.md)。

## 一句话判断

**"Pi 只是命令行,所以能力有限"是个伪前提——命令行是 pi 唯一的外壳,但不是它的能力边界。它的能力和 Claude Code / Codex 基本同构,差别在默认值哲学:CC/Codex 替你把工作流设施配好,pi 把设施留成口子让你自己长。所以正确的问题不是"pi 能不能",而是"我这个工作流里,哪些环节值得花 30 分钟组装一次"。**

组装清单:AGENTS.md(全局 + 项目)→ 一条能自己跑的验证命令 → 重复 prompt 变模板、重复流程变 skill → 按需装包。做完之后,pi 的日常用法和 Claude Code 官方教程里写的几乎一样——而且 skills 生态是互通的。

**不想从零写?直接拷 [starter-kit/](starter-kit/)(用法见 [03_starter_kit.md](03_starter_kit.md))**:一份 AGENTS.md 模板 + 三个 prompt 模板(`/plan`、`/review`、`/done`)+ 一个 verify skill,拷进项目根、过一次 trust、启动即生效。

## 我应该做什么(按优先级)

1. **写两份 AGENTS.md**(全局 `~/.pi/agent/AGENTS.md` + 项目根)。只放"没有它会出错"的内容:构建/测试命令、风格红线、仓库礼仪。所有最佳实践里杠杆最大的一条;臃肿版本会被整体忽略。
2. **保证存在一条模型能自己跑的验证命令**,写进 AGENTS.md。没有验证回路,一切无人值守都是赌博(CC 第一原则,原样适用)。
3. **说过第二遍的话 → `.pi/prompts/*.md`;做过第二遍的流程 → skill。**别家(Claude Code / Codex)的 skills 目录可以直接挂进来复用。
4. **感觉缺功能,先查 [pi.dev/packages](https://pi.dev/packages)(5637 个)**:todo → rpiv-todo;subagent → pi-subagents;web 搜索/抓取 → pi-web-access;MCP → pi-mcp-adapter;计划审查 UI → plannotator。再没有,就让 pi 照着 `examples/extensions/` 给你写一个。
5. **按任务降权**:探索用 `--tools read,grep,find,ls`;纯文本加工用 `--no-tools`;跑敏感目录就容器化(`docs/containerization.md`:Docker / gondolin)。
6. **会话卫生**:一个会话一件事;换题 `/new`;走错 `/tree` 回溯;方案并行 `/fork`;context 满 `/compact`。

## 反模式(从 CC 平移 + pi 特有)

| 反模式 | 症状 | 解法 |
|---|---|---|
| 厨房水槽会话 | 一个会话塞多个不相关任务 | `/new` |
| 反复纠正不灵 | 同一个错纠两次还在 | 停手:改 AGENTS.md 或换更好的初始 prompt;`/tree` 从错误前重来 |
| AGENTS.md 膨胀 | 规则被模型忽略 | 删:只留"不写会错"的 |
| 无验证回路就放手 | 结果 plausible 但错 | 先补检查,再谈自动化 |
| 把 pi 当 chatbot | 只打字,不 `@file`、不 `!command` | 至少喂文件和命令输出;纯问答加 `--no-tools` 又快又稳 |
| 裸 YOLO 跑敏感目录 | 密钥/生产环境暴露、prompt 注入 | 容器化或工具白名单;要逐条审批的产品体验就直接用 CC |
| 期望开箱全家桶 | 装完就用,结论"什么都没有" | 记住 pi 的模型:默认 4 工具,其余长在口子上(见 01 篇映射表) |

## 什么时候不用 pi

- 团队要**统一的、零组装的受控环境**:权限弹窗、合规审计、官方 subagent/MCP/IDE 集成 → Claude Code / Codex 更合适。
- 你不想维护任何配置文件,只做标准编码 → CC/Codex 的默认值更省心。
- 一句话:**CC/Codex 卖"机器替你做默认决定",pi 卖"你做决定、机器无条件执行"。**要前者别装 pi;要后者,pi 是当前形态最极、最可预期的。

## 与 06 篇的衔接

本篇处理的"能力有限"观感,正是 [06_pi_vs_dsh](../06_pi_vs_dsh/question.md) 那个判断(core-minimal 纪律)在用户侧的投影:pi 把复杂度从"产品默认值"挪到"用户组装"。06/04_strengths_weaknesses.md 给 pi 记的硬伤("开箱寒酸、生态锁定、单点大接口")从用户视角看就是本篇的问题本身;而它的对价——可预期(系统提示/工具集不随版本漂移)、可观测(全程见它读了什么跑了什么)、可自组(五条生长线)——正是日常使用里实际收到的部分。

## 引用

网络(2026-09-02 抓取):

- [Best practices for Claude Code — Anthropic](https://www.anthropic.com/engineering/claude-code-best-practices):验证回路、explore→plan→code→commit、CLAUDE.md 写法、headless `-p`、多会话/worktree、writer-reviewer、fan-out、adversarial review、常见失败模式
- [What I learned building an opinionated and minimal coding agent — Mario Zechner](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/):极简系统提示(<1000 token)、四工具论、YOLO 默认、明确不做 to-do/plan mode/MCP/subagent/background bash 的理由、PLAN.md/TODO.md 替代方案
- [What if you don't need MCP — Mario Zechner](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/):CLI + 脚本 over MCP 的信息加工哲学、MCP 的 context 成本
- [pi.dev/packages](https://pi.dev/packages):包生态快照(5637 个;下载榜:pi-mcp-adapter 761K/月、pi-web-access 401K/月、pi-subagents 362K/月、@companion-ai/feynman 296K/月…)

仓库(基线 v0.84.4 / `b79e4cc83`):

- `packages/coding-agent/docs/usage.md`:CLI 全表、`-p` + stdin 管道、`--tools` 白名单、消息队列、`@file`、`!command`、会话命令
- `packages/coding-agent/docs/quickstart.md` L77-84:默认四工具
- `packages/coding-agent/src/core/tools/index.ts:95`:8 个内置工具名单
- `packages/coding-agent/docs/skills.md`、`prompt-templates.md`、`json.md`、`containerization.md`
- `packages/coding-agent/examples/extensions/`:plan-mode、todo、git-checkpoint、structured-output、permission-gate、subagent、gondolin 等
- `.pi/prompts/`(本仓库):wr/pr/sa/cl/is,模板用法的活例

消化材料:

- `_digested/extensions/01-Core/1.1_minimal_core.md`、`1.2_skipped_features.md`:哪些不做、为什么
- `_digested/agent/04-Harness/4.2_Skills.md`:skills 接线机制
- `_digested/integration/03-runtime-api.md`、`05-recipes.md`:SDK/RPC 集成
- `_faq_on_digested/06_pi_vs_dsh/answer.md`、`04_strengths_weaknesses.md`:默认组合宽度差异、pi 硬伤记账
