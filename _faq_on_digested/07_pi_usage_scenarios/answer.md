# 总论:一句话判断 + "我应该做什么"清单(v2,2026-09-02 三路深挖后修订)

> 本文件是 `07_pi_usage_scenarios/` 的收束。论证分层回:能力映射 [01](01_capability_map.md)、场景动作 [02](02_scenario_playbook.md)、组装 [03](03_starter_kit.md)、本机实证 [04](04_local_audit.md)、包生态 [05](05_package_ecosystem.md)、社区实战 [06](06_field_usage.md)、跨 harness 新实践 [07](07_cross_harness.md)。

## 一句话判断

**"Pi 只是命令行,所以能力有限"在两层都被证伪了。能力层:它与 CC/Codex 基本同构,差别只是默认值哲学(CC/Codex 替你配好,pi 留口子让你长)——01 篇逐条映射,05 篇显示每个"缺失内置"都有包在补,07 篇显示 2026 年两家官方的新最佳实践大部分在裸 pi 上原样可用。实证层:本机审计(04 篇)找到你体感的真实来源——`~/.pi/agent/` 全局层是空的,而同一台机器上 37 个技能、两本自建手册全在 pi 的扫描路径之外一墙之隔的地方。所以你要做的不是"忍受限制",是接线。**

## 证据链(三足)

1. **映射**:CC 官方 16 条最佳实践 → pi 过半形态不变,其余有替代物;真差距只有"产品化逐条审批"和"官方托管编排"两样,且是 pi 主动不做(01 篇)。
2. **本机**:pi 全局层仅 1 个装饰性扩展;`~/.claude/skills` 37 个;`~/.codex/AGENTS.md` 空文件;skills.sh 官方支持 Pi。差距是纯接线问题(04 篇)。
3. **外部**:包生态 5,626 个、头部包 76 万月下载(05 篇);社区专家共识是"极简核心 + 自扩展 + 上下文纪律 + 隔离",且被验证的具体工作流(discuss→计划文件→n2c 标注→执行→新上下文评审)全部构建在 pi 的会话树上(06 篇)。

## 我应该做什么(按顺序)

0. **接受一个前提**:按 CC 新版官方文档,一切最佳实践都从"context 是最易耗尽的资源"推出(07 篇);pi 的一切用法也围绕它。
1. **接线已有资产**(十分钟,见 03 篇第一层):`npx skills add mattpocock/skills --agent pi -g`,或 settings 加 `"skills": ["~/.claude/skills"]`——别让 37 个技能在墙那边吃灰。
2. **写全局 `~/.pi/agent/AGENTS.md`**(5-10 行个人纪律)+ 项目 AGENTS.md(只放"不写会错"的;AGENTS.md 是唯一跨 harness 标准,CC 现在也读)。**同时记住社区反方共识:DX > 长散文**——把检查做成 commit hook/CI 强制,比写进 AGENTS.md 更有效(Mario 与多条 HN 高赞同证,06 篇 E6)。
3. **保证一条模型能自己跑的验证命令**;按任务降权(探索 `--tools read,grep,find,ls`,纯加工 `--no-tools`,敏感环境容器/bwrap)。
4. **按场景装包,装前审 token 价**(05 篇):开发栈 pi-lens(或按 Mario 用 hook 强制)/rpiv-todo/pi-subagents;研究栈 pi-web-access/pi-memory;问 pi 自身问题先装 romiluz13/pi-agent-skills。
5. **固化说过第二遍的话**:prompt template 或 skill——但优先"让 pi 自己写"("pi can create skills. Ask it.";Armin:自扩展是头号 idiom),下载的第三遍才装。
6. **上下文与会话卫生**:一任务一会话;100–150k token 就交接(`/continue` 式:总结进文件、新会话续);换题 `/new`;回溯 `/tree`;并行用 worktree 隔离;长任务用"initializer + 进度文件 + 每会话留干净可合并状态"配方(07 篇 #7)。

## 反模式(v2)

| 反模式 | 症状 | 解法 |
|---|---|---|
| 厨房水槽会话 | 一会话塞多个不相关任务 | `/new` |
| 反复纠正不灵 | 同一个错纠两次还在 | 改 AGENTS.md/换初始 prompt;`/tree` 回到错误前 |
| AGENTS.md 膨胀 | 规则被忽略(CC 定量:>200 行 / Codex 32KiB 尾部静默丢失) | 删到只剩"不写会错"的;过程移进 skill |
| 无验证回路就放手 | plausible 但错 | 先补检查;要"每次编辑自动查"再上 pi-lens |
| **token 价盲区** | 装 20 个 skill/扩展,hello-world 就 20k token | 逐个审计;裸配置 5.3k 是对照基准(06 篇 C3) |
| **下载即装** | 第三方包 = 执行第三方代码 | cherry-pick + pin + review;官方"认证插件"机制在路上 |
| **agent 大军迷信** | 一开七八个并行 agent 写代码 | Mario:"a recipe for disaster";单 agent 人在环,研究类才并行 |
| **上下文硬撑** | 单会话干到底 | ≤200k 硬顶;100–150k 交接 |
| 裸 YOLO 跑敏感目录 | 密钥/生产暴露 | VM/容器/专用机;guardrail 是安全网不是边界 |
| 期望开箱全家桶 | 装完觉得"什么都没有" | 记住 pi 模型:默认 4 工具,其余长在口子上;要预装配的看发行版路线(oh-my-pi/lazypi)并接受其代价 |

## 什么时候不用 pi

- 团队要**统一、零组装、有审批合规**的环境 → Claude Code / Codex。
- 你不想维护任何配置、只做标准编码 → CC/Codex 默认值更省心。
- 你要预装配的重装体验 → pi 的发行版 fork(oh-my-pi)或一键包(lazypi),但接受上下文膨胀与社区维护风险。
- 一句话:**CC/Codex 卖"机器替你做默认决定",pi 卖"你做决定、机器无条件执行"。**而 2026 年的证据(07 篇)显示:两家官方都在把最佳实践往"短指令文件 + 可运行检查 + 按需 skill + 计划落盘"收敛——这恰好就是 pi 的默认形态。

## 与 06(pi vs DSH)的衔接

"能力有限"的观感 = core-minimal 纪律在用户侧的投影(默认组合宽度窄),本篇用本机审计与生态数据把这句话落成了可执行的接线清单;对价(可预期、可观测、可自组)在 06_field_usage 的作者与社区实践中逐条可见。

## 引用

各章文末已给全量来源(网络快照 2026-09-02)。总入口:CC [best practices(重写版)](https://code.claude.com/docs/en/best-practices)、[agents.md](https://agents.md)、[pi.dev/packages](https://pi.dev/packages)、[Mario Year in Review 2025](https://mariozechner.at/posts/2025-12-22-year-in-review-2025/)、[Armin: Pi, the minimal agent](https://lucumr.pocoo.org/2026/1/31/pi/)、[esc.sh 实测](https://blog.esc.sh/claude-code-to-pi/)、[skills.sh CLI(官方支持 Pi)](https://github.com/vercel-labs/skills)。
