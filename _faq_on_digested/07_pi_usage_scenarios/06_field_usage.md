# 篇六:社区实战——"人们到底怎么用 pi"(作者、官方、HN、dotfiles)

> 证据来源(2026-09-02 深挖):Mario Zechner 2025-11-30 之后的全部博文、pi.dev 官方材料(/news.xml、/docs、/packages)、HN 三条主讨论串(lazypi / oh-my-pi / issue-534,经 hn.algolia API)、已核实的社区仓库(dotfiles / 技能包 / tmux 编排 / 运维扩展)。每条注明来源;文末列出被证伪材料。

## A. 作者本人怎么用(2025-12-22《Year in Review 2025》)

1. **单 agent + 人在环,不用 agent 大军。**"I could never get armies of agents to work for me at all, apart from maybe research tasks. Having them write large amounts of code has so far been a recipe for disaster."([Year in Review 2025](https://mariozechner.at/posts/2025-12-22-year-in-review-2025/))
2. **强制检查优于上下文诊断。**不用把 LSP 诊断喂给模型,而是把类型检查/lint 设成 commit hook 强制它自己修:"far more effective at making the agent fix its errors, without filling up your context window with possibly irrelevant LSP diagnostics."(注意:这与 05 篇 pi-lens 的流行度形成张力——作者路线是 hook 强制,不往上下文里塞诊断。)
3. **CLI over MCP,一路走到黑。**能力都做成小 CLI(gmcli/gccli/gdcli/lsp-cli),让 agent 用 bash 链式组合;"MCP server outputs can only be transformed, filtered, or composed by the LLM inside its context… compared to the composability… of chaining multiple commands via its bash tool"。他最终弃用了全部 MCP server。
4. **pi 是每日主力,跨 provider 用**:Copilot 订阅 + Claude Max + Cerebras + OpenRouter + 本地模型,会话中途换模型、全程成本跟踪;核心立场:"the models are really effective if you give them just a minimal set of tools: read, write, edit, bash. Anything else… should be an extension of this minimal core and not a built-in thing."
5. **信息加工的教科书案例**(他教语言学妻子的工作流):18,000+ 行 Excel 标注,让 agent 搭一条**小脚本流水线**(Excel→CSV → 列拆分 → 过滤 → 分析 → 统计 → 可视化),每段 file-in/file-out;"she cannot judge the Python code… But she can judge the outputs of each individual pipeline stage"。后来发现源库 10 个数据点错了,改上游后重跑三段脚本即完成修复——**可复现性就是信息加工的质量门**。他的结论:"they're really only effective in the hands of domain experts"(领域专家判断产出,不判代码)。
6. **本地优先的会话观**([Armin is wrong](https://mariozechner.at/posts/2025-11-22-armin-is-wrong/)):正确的、可恢复的东西(消息、工具结果)必须存在你自己这边;provider 的缓存/thinking 痕迹是可弃的派生态。pi 的 session 文件格式正好是这个立场的实现。

## B. 官方材料的现状

pi.dev 有 `/news.xml`(纯 release notes)、`/docs/latest`、`/packages`,**没有官方"recommended setup"页**——事实标准活在社区里(05、06 两篇就是这些事实标准的整理)。首页标语倒是点题:"There are many agent harnesses, but this one is yours."

## C. 社区沉淀的具体机制(全部核实到原文)

### C1. 换掉系统提示:"讨论优先"模式
[esc.sh](https://blog.esc.sh/claude-code-to-pi/) 把 pi ~500 token 的默认提示换成 thinking-partner 提示:"You are a thinking partner… You do NOT jump to writing code… Default mode: Discussion… Don't touch anything." 动机值得记住:CC 在你第一句话前就注入 ~20k token 的产品逻辑,"Your instructions… are competing with thousands of tokens of product logic — and they're losing";**pi 的极简提示让你的规则真正有约束力**(同款模型 Opus 4.6 对照)。

### C2. `.scratch/` + `n2c:` 标注回路(被抄得最多的具体工作流)
同一来源:每仓库一个 gitignored 的 `.scratch/`(`research/`、`plans/`、`reviews/`、`sessions/`,按日期命名;值得留的移 `docs/`)。流:讨论 → agent 写计划文件 → **人真的去读**,在行间写 `n2c:`(note to Claude,如 "n2c: This assumption is wrong")→ agent 逐条回应标注 → 定稿 → 执行。讨论、计划、人审三步都是真的,不是仪式。

### C3. 上下文纪律:≤200k 硬顶,100–150k 就交接
"Even with models that support 1M token context windows, I never push past 200k"(引 [context rot 研究](https://www.trychroma.com/research/context-rot))。到 100–150k token 跑 `/continue`:agent 把相关状态总结进 `.scratch/sessions/` 文件、清空上下文、带着文件开新会话——"Same trajectory, clean slate." 配套:split-fork(右侧新 pane 带同上下文做支线探索)、btw(顺手一问不打断主线)。HN 侧呼应:lazypi 的 hello-world 要 20k token,"My minimal setup required 5.3k";superpowers "front-load 22k tokens before you even hit send"——**每个 skill/扩展都有 token 价格,要审计**。

### C4. 自扩展是头号 idiom(Armin Ronacher)
["Pi: The Minimal Agent Within OpenClaw"](https://lucumr.pocoo.org/2026/1/31/pi/):"if you want the agent to do something that it doesn't do yet, you don't go and download an extension or a skill… You ask the agent to extend itself." 他让 pi 给自己写的扩展:`/answer`(把上一轮回答里的问题抽成输入框)、`/todos`(`.pi/todos` markdown,人和 agent 都能操作)、`/review`(**利用会话是树**:分支出全新上下文做评审,再把修复带回主枝——"it makes little sense to throw unfinished work at humans before an agent has reviewed it first")、`/control`(一个 pi 给另一个 pi 发 prompt,最简多代理)、`/files`(列出本会话碰过的文件)。skills 全部自造、用完即弃;"currently the only additional tool that I'm loading into my context" 是一个 todo 工具——**工具预算极低,能力长在 skill 和 UI 上**。

### C5. YOLO + 隔离是共识
[Clawd](https://github.com/MansoorMajeed/Clawd):"Run this in a VM, container, or disposable environment";其 permission-guard "is not a security boundary — it's a safety net for honest mistakes, not a jail"。[krisconstable](https://krisconstable.com/start-with-pidev/):别在日用机上跑;"Treat this like giving a very fast junior operator shell access";不交原始凭证;长期最佳是专用硬件。esc.sh 用专用 VM + 备份。

### C6. tmux 是编排层
[pi-agent-hub](https://github.com/masta-g3/pi-agent-hub):4 个 live 会话槽 + hub 管理的 git worktree + 注意力分级驾驶舱(NEEDS YOU / HEALTH / ACTIVE / QUIET)。[pi-tmux](https://github.com/offline-ant/pi-tmux):给 agent `tmux-send/capture` 等工具,信号量锁协调 pane;`/supervise`:主 agent 干活、监督 agent 只负责纠偏和执行 **">78% context handoff rule"**,且"主 agent 不知道自己被监督"。

### C7. 运维与 headless 管道
[pi-hosts](https://github.com/hunvreus/pi-hosts):命名 SSH 主机 + 主机事实缓存 + 风险分级 + JSONL 审计;实测 "check docker version on web-1":**5.1s / 2 turns / 1,968 tokens,对比裸跑 19.6s / 6 turns / 4,403**。minitask:串行跑多条 `pi -p` 问答——headless 批处理的标准形态(02 篇场景 B/C 的社区印证)。

### C8. 包卫生
[pi-kit](https://github.com/butttons/pi-kit):settings.json 里按包 cherry-pick 资源(`extensions/skills/themes` 可 `[]` 全关、`!pattern` 排除),装完 `pi config` 逐个开关;`alias pi='pi update --extensions && command pi'` 启动前更新;第三方扩展"装一个有用的,改成我要的样子,然后 pin 住"。

### C9. dotfiles 精选(看别人的 `.pi/` 是本生态的学习方式)
- [pi-kit](https://github.com/butttons/pi-kit):safe-delete(拦截 `rm` 误伤/`git clean -fdx`/`dd`)、fold(`/fold` 把历史折叠成哨兵+"Full dumps are impossible by construction")、context-usage(footer 显示 token/缓存命中/成本)、lazy-agents(AGENTS.md 按需加载,进哪个目录读哪个)、handoff、session-recall(`/recall` 检索历史会话)。
- [Clawd](https://github.com/MansoorMajeed/Clawd):可安装的"有主见包"(22 skills:`/plan` `/debug` `/review` `/ship` `/retro` `/commit` 等;亮点 `/irreversible-action-checklist`——破坏性动作的五道门;`/improve-skill`——分析会话记录改进 skill 本身)。"The workflow prompt is the soul of this thing — fork it and make it yours."
- [romiluz13/pi-agent-skills](https://github.com/romiluz13/pi-agent-skills):让 pi 回答"pi 自己怎么用"的 11 个 skill,引用强制锚定 `pi-mono` 真实路径、断链即验证失败,带 evals——**问 pi 问题先给它装这个**。
- 发行版路线:[oh-my-pi](https://github.com/can1357/oh-my-pi)(fork:60+ provider、31 内置工具、LSP、浏览器——"重量级发行版")与 lazypi(一键配置,被 HN 批评上下文膨胀)。HN 的增量采纳路径:"先用纯 pi 玩一阵,再决定真正需要什么,逐步加。"

### C10. HN 上的反方观点(值得记)
- "极简是方法":"Pi makes you think about what you're doing with it on purpose";新模型足够聪明,"suffocating their context with dozens of MCPs and skills isn't necessary like it used to be"。
- 但也有重度派:"The agent and the harness is more important than the model on normal tasks… oh-my-pi + MCP + LSP + tons of skills. Without that it's almost useless."(两种路线并存,按任务选)
- **DX beats AGENTS.md**:"I have little to none (AGENTS.md) and am successful… I put some major work into the 'Developer Experience' of my code base — I think that works better than any markdown instructions ever will";呼应 Mario 的 commit-hook 强制检查。反方:"My CLAUDE.md is maybe 30 lines. I only add something if it repeatedly does something that annoys me."(两条其实同向:检查机制 > 长散文)
- 自建 > 下载:"I made my own subagent implementation in a couple of hours using Pi itself. It aligns with my needs better than any existing plugin."
- 供应链警惕:Armin 在 lazypi 串里回应"会用官方/认证插件机制解决";有用户干脆只信 MCP + 进程级沙箱。**装第三方包 = 执行第三方代码**,review 再装。
- 已知糙边:`~/.pi` 不分 XDG(config 和 cache 混放),issue 已 WONTFIX。

### C11. 中文材料
[阿里云开发者社区分析](https://developer.aliyun.com/article/1759683)(2026-09-01):pi 适合三类人——跨 provider 控模型/成本的、把 agent 嵌进脚本/CI/终端/内部工具的、以及"靠扩展调试 agent 行为"的人;开放的对价:"越开放,越需要自己承担插件审查、权限隔离和密钥保护"。另有社区中文书 [ZhangHanDong/pi-book](https://github.com/ZhangHanDong/pi-book)。

## D. 被证伪 / 存疑的材料(别引)

- scavio.dev "Minimal Pi Workflows" 用 `~/.pi-agent/workflows/*.yaml` + `trigger:/search` ——**与 pi 任何真实机制都对不上**(pi 用 TS 扩展/skill,无 YAML workflow),疑似 AI 生成的 SEO 内容。
- krisconstable quickstart 装的是改名前的 `@mariozechner/pi-coding-agent`(现为 `@earendil-works/pi-coding-agent` / `pi.dev/install.sh`)。

## E. 六条横贯主题

1. 极简核心 + **让 agent 自扩展**是专家主流;下载的包要 cherry-pick、pin、审 token 价。
2. 讨论 → 计划文件 → `n2c:` 人审 → 执行 → **新上下文评审**,是被复制最多的具体工作流(esc.sh、Clawd、Armin 的 /review,全都建立在 pi 的会话树上)。
3. 上下文纪律:≤200k;100–150k 就 `/continue`;给每个 skill 标 token 价。
4. tmux 做编排:per-project 会话、锁协调、监督者模式。
5. YOLO + 隔离:VM/容器/专用机;guardrail 是安全网不是边界。
6. **DX > AGENTS.md**:强制检查(commit hook/CI)比长指令散文有效——与 #2 的"指令文件要短"互为表里。

## 引用

全部原文链接:[Year in Review 2025](https://mariozechner.at/posts/2025-12-22-year-in-review-2025/) · [Armin is wrong](https://mariozechner.at/posts/2025-11-22-armin-is-wrong/) · [lucumr.pocoo.org Pi 文](https://lucumr.pocoo.org/2026/1/31/pi/) · [esc.sh](https://blog.esc.sh/claude-code-to-pi/) · [krisconstable](https://krisconstable.com/start-with-pidev/) · [HN 48847407](https://news.ycombinator.com/item?id=48847407) · [HN 48994611](https://news.ycombinator.com/item?id=48994611) · [HN 49328206](https://news.ycombinator.com/item?id=49328206) · [pi-kit](https://github.com/butttons/pi-kit) · [Clawd](https://github.com/MansoorMajeed/Clawd) · [badlogic/pi-skills](https://github.com/badlogic/pi-skills) · [pi-hosts](https://github.com/hunvreus/pi-hosts) · [pi-agent-hub](https://github.com/masta-g3/pi-agent-hub) · [pi-tmux](https://github.com/offline-ant/pi-tmux) · [romiluz13/pi-agent-skills](https://github.com/romiluz13/pi-agent-skills) · [oh-my-pi](https://github.com/can1357/oh-my-pi) · [shaftoe/awesome-pi-coding-agent](https://github.com/shaftoe/awesome-pi-coding-agent) · [thevibeworks/awesome-pi-agent](https://github.com/thevibeworks/awesome-pi-agent) · [阿里云分析](https://developer.aliyun.com/article/1759683) · [pi-book](https://github.com/ZhangHanDong/pi-book)
