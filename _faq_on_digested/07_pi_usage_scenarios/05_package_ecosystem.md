# 篇五:包生态深挖——"缺的功能"已经有 5600 个包在解决

> 证据来源:pi.dev/packages 目录全量爬取(2026-09-02,5,626 个包,含月下载量)、npm registry API、约 18 个包的 GitHub README 逐个核对。下载量为爬取时刻快照,变化很快。

## 机制一句话

`pi install npm:<包>` 重启后生效;一个包可同时贡献 extensions(工具/命令/事件/UI)、skills、prompt templates、themes。不需要任何"应用商店"之外的仪式。

## 下载榜头部(全部核到 README 级)

| 包 | 加了什么 | 解决裸 pi 的什么短板 | 安装 | 月下载 |
|---|---|---|---|---|
| [pi-mcp-adapter](https://github.com/nicobailon/pi-mcp-adapter) | 单个 ~200 token 的 `mcp` 代理工具 + `/mcp` 面板,MCP server 懒启动 | 无 MCP——且不付 Mario 批评的"每 server 上万 token 工具定义"税;`/mcp setup` 可直接导入 Cursor/CC/Codex 的配置 | `pi install npm:pi-mcp-adapter` | 761.4K |
| [pi-web-access](https://github.com/nicobailon/pi-web-access) | `web_search`(~20 家引擎回退链)、网页抓取、GitHub 克隆、PDF 抽取、YouTube/本地视频理解 | 完全离线;零配置可用(keyless Exa,登录过 Codex 还能复用其鉴权) | `pi install npm:pi-web-access` | 401.1K |
| [pi-subagents](https://github.com/nicobailon/pi-subagents) | `subagent` 工具:内置 scout / researcher / worker / reviewer / oracle / delegate 角色,并行、后台、`/council` 辩论模式 | 单上下文:不能委派、不能自查、不能并行审 | `pi install npm:pi-subagents` | 362.5K |
| [@companion-ai/feynman](https://github.com/companion-inc/feynman) | 基于 pi + alphaXiv 的完整研究型 agent(论文检索、带出处的报告);也可只装其 skills 库 | "研究/信息加工"整栈一键 | `pi install npm:@companion-ai/feynman` | 296.7K |
| [@juicesharp/rpiv-ask-user-question](https://github.com/juicesharp/rpiv-mono) | 结构化提问工具:模型拿不准时给你带类型选项的问卷,而不是自由发挥瞎猜 | 模糊需求下瞎猜 | `pi install npm:@juicesharp/rpiv-ask-user-question` | 117.3K |
| [pi-background-tasks](https://github.com/ismailsaleekh/pi-background-tasks) | `bg_run` 持久后台任务、`bg_delegate` 只读子代理、Fusion 多模型(3 候选+盲评+合并)工作流 | 长任务阻塞会话;单模型无交叉验证 | `pi install npm:pi-background-tasks` | 107.1K |
| [@juicesharp/rpiv-todo](https://github.com/juicesharp/rpiv-mono) | 实时 todo 覆盖层,**在 /reload 和 compaction 后存活** | 压缩/重载丢任务状态 | `pi install npm:@juicesharp/rpiv-todo` | 98.9K |
| [pi-lens](https://github.com/apmantza/pi-lens) | 每次 write/edit 自动跑 LSP 诊断、linter、类型检查、ast-grep 结构规则、secrets 扫描;符号搜索工具;read-guard/git-guard | 裸 pi 写代码是"盲写"——除非模型记得,否则没有编译器反馈 | `pi install npm:pi-lens` | 60.1K |
| [@plannotator/pi-extension](https://github.com/backnotprop/plannotator) | 计划/代码在浏览器里打开,你划线批注,反馈回传 agent | 终端里审计划只能纯文本 | `pi install npm:@plannotator/pi-extension` | 52.7K |
| [@narumitw/pi-goal](https://github.com/narumiruna/pi-extensions) | 自主 `/goal` 单目标完成模式 | 回合结束就停,无持久目标回路 | `pi install npm:@narumitw/pi-goal` | 49.9K |
| [@dietrichgebert/ponytail](https://github.com/DietrichGebert/ponytail) | "懒惰资深工程师"skill:最小代码倾向(作者基准:代码量 -54%、成本 -20%) | agent 过度工程 | `pi install npm:@dietrichgebert/ponytail` | 49.5K |
| [@tintinweb/pi-subagents](https://github.com/tintinweb/pi-subagents) | CC 风格 `Agent` 工具 + JS `SubagentWorkflow`(`agent()/parallel()/pipeline()`),Fleet UI,可原样跑 CC workflow 脚本 | 更重的编排需求 | `pi install npm:@tintinweb/pi-subagents` | 47.9K |
| [pi-simplify](https://github.com/MattDevy/pi-extensions) | `/simplify`:只对改动行做清晰度/一致性清理并跑测试验证 | 功能后堆积 | `pi install npm:pi-simplify` | 41.4K |
| [@trim21/personal-pi-extensions](https://github.com/trim21/pi-extensions) | bwrap 沙箱(allow-all/workspace-write/readonly)+ 工作区写保护 + opencode 风格 edit/todo | bash 裸奔、无 OS 级隔离(注意:个人项目,作者声明不保证兼容) | `pi install npm:@trim21/personal-pi-extensions` | 39.2K |
| [pi-goal-x](https://github.com/tmonk/pi-goal-x) | 目标持久化 `.pi/goals/`、验证契约、**独立 auditor agent 复核完成度**、Sisyphus 有序目标、自动续跑 | 长目标随会话死;自我评分不可靠 | `pi install npm:pi-goal-x` | 37.3K |
| [pi-memory](https://github.com/jayzeng/pi-memory) | 6 个记忆工具,markdown 存 `~/.pi/agent/memory/`(可 git);可选 qmd 语义检索 | 跨会话失忆 | `pi install npm:pi-memory` | 37.1K |
| [bigpowers](https://github.com/danielvm-git/bigpowers) | 73-81 个 skill:规定动作的 6 阶段垂直切片 SDLC,硬质量门,`specs/state.yaml` 驾驶舱 | agent 没有工程纪律 | `pi install npm:bigpowers` | 34.9K |
| [@quintinshaw/pi-dynamic-workflows](https://github.com/quintinshaw/pi-dynamic-workflows) | 写 JS workflow 编排上百个隔离子代理(模型路由/成本核算/git-worktree 隔离),`/deep-research` | 单上下文做不了全库审计/多视角评审/溯源研究 | `pi install npm:@quintinshaw/pi-dynamic-workflows` | 34.4K |

## 两个"成套"组合(综合自上述已核实的包能力;是本篇综合,不是某篇官方推荐)

**(a)软件开发栈**:pi-lens(反馈回路)→ pi-subagents(reviewer/oracle 第二意见)→ rpiv-todo(任务状态抗压缩)→ rpiv-ask-user-question(需求澄清)→ pi-simplify(收尾清理)→ pi-mcp-adapter(要接 MCP 时)。方法论层二选一:bigpowers(要纪律)或 ponytail(要克制)。不放心就加 @trim21/personal-pi-extensions(bwrap)。

**(b)研究/信息加工栈**:pi-web-access(搜索/抓取/PDF/视频)→ pi-subagents 的 researcher/oracle(溯源与复核)→ @quintinshaw/pi-dynamic-workflows 的 `/deep-research`(多路扇出+出处核查)→ pi-memory 或 @remnic/plugin-pi(发现沉淀,后者是跨 harness 共享记忆库)。整栈替代品:@companion-ai/feynman。

## 没有"官方 starter pack",但有一圈事实标准

- 策展列表:[awesome-pi](https://github.com/Blue-B/awesome-pi)、[awesome-pi-agent](https://github.com/thevibeworks/awesome-pi-agent)(正文未抓到,存在性已核实)
- [narumitw 的日套件 README](https://github.com/narumiruna/pi-extensions) 本身就是一份"个人推荐配置"文档(pi-btw/pi-accounts/pi-usage/pi-starship/pi-sync……偏人体工学)
- 个人预设包:[mitsupi](https://github.com/mitsuhido/agent-stuff)(Armin Ronacher 的 pi 配置)、[bdsqqq/dots](https://github.com/bdsqqq/dots)、[bestony-pi-preset](https://github.com/bestony/bestony)、spences10/my-pi 等——"看别人的 `.pi/`"是本生态的学习方式

## 与 07 其他篇的对账

- 01 篇映射表里"内置 → 包"的每一条,这里都有具体货号;差距清单(产品化审批、官方托管编排)在包生态里也只有社区缓解(@gotgenes/pi-permission-system 30.2K/月、pi-web-ui),没有官方件——与"pi 主动不做"的判断一致。
- [Anthropic 的验证阶梯](https://code.claude.com/docs/en/best-practices)(prompt 内点名检查 → /goal → Stop hook → 验证 subagent)在 pi 生态的对应物:prompt 内点名(裸 pi 就行)→ pi-goal-x / @narumitw/pi-goal → hooks 用 extension `on()` 事件自写 → pi-subagents 的 reviewer/oracle。四阶全有货。

## 引用

- [pi.dev/packages](https://pi.dev/packages)(2026-09-02 爬取快照,5,626 包)
- 各包 GitHub README / npm 页(见表中链接);月下载量为目录快照
- [Mario Zechner: What if you don't need MCP](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/)(pi-mcp-adapter 的设计动机对照)
- 未核实项:awesome-pi 两列表正文、plannotator 的 pi 侧配置键、context-mode 的知识库初始化步骤(其 ELv2 许可也与本榜其余 MIT/ISC 不同,选用注意)
