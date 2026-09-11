# 3 · 突出包：必装清单与样本解读

> 按"装它的理由"分三档。下载数为 2026-09-11 月下载。

## 3.1 基础设施级 —— pi 的"默认套装"雏形

这批包补的是核心刻意留下的洞。装 pi 不装它们，体验是不完整的。

### pi-mcp-adapter —— 866K/月，全生态第一

**干什么**：把任意 MCP server 的工具适配成 pi 原生工具，重点做 token 效率（工具描述压缩、按需加载）。
**为什么是第一**：pi 官方明确不做 MCP（issue #6493 的官方立场"媒体/协议处理留给扩展"），但 MCP 服务器生态已经先于 pi 存在。pi-mcp-adapter 是这条必经之路上的收费站——**单包占全生态 14% 下载**。
**启示**：找"官方不做 + 生态必经"的位置，是 pi 包创业的第一公式。

### pi-subagents —— 412K/月

**干什么**：单代理委托 + 脚本化多代理工作流（nicopreme 出品）。
**为什么**：CC 的 subagent 体验是用户迁移的对照物。pi 核心只有单循环，编排是第一个要补的大洞。同类还有 @tintinweb/pi-subagents（48K，CC 复刻路线）和 @quintinshaw/pi-dynamic-workflows（40K，百级扇出+成本核算路线）——**一个洞三个补法，说明需求真实且未收敛**。

### pi-web-access —— 404K/月

**干什么**：搜索/URL 抓取/GitHub 克隆/PDF 抽取/YouTube 理解/本地视频分析，聚合十几个搜索后端（OpenAI、Brave、Tavily、Firecrawl、Jina…）。
**为什么**：联网是编码 agent 的刚需，pi 核心零联网。它是"外挂全家桶"式打法——一个包覆盖整条 web 链路。

### @companion-ai/feynman —— 352K/月

**干什么**：科研向 CLI agent，pi 内核 + alphaXiv。
**为什么重要**：它不是"给 pi 装的包"，而是**"用 pi 造的产品"**。证明 pi 的定位（极简可组合内核）成立：有人把它当 Vue 用，而不是当 VS Code 用。

### @juicesharp/rpiv-* —— 152K + 134K + 11K/月

**干什么**：`ask-user-question`（结构化提问：模型不再瞎猜，给你带类型的选项）、`rpiv-todo`（模型 todo 的 live 覆盖层，/reload 和 compaction 后仍在）、`rpiv-voice`（本地语音输入）。
**为什么**：这是**CC 体验移植**路线的标准样本——把 CC 的交互原语逐一搬过来。rpiv-todo 的技术点是"覆盖层在 compaction 后存活"，说明作者理解 pi 会话机制的细节。

### pi-background-tasks —— 108K/月

**干什么**：持久后台 shell 任务、只读委派 agent、本地 attested Pi 运行。
**为什么**：长任务（构建、测试、训练）不能堵住主对话。后台化是"agent 跑得久"的前提件。

### pi-lens —— 75K/月

**干什么**：实时代码反馈回灌——LSP、lint、formatter、类型检查、结构分析。agent 编辑后立刻看到诊断。
**为什么**：补的是 agent 的"感官"。没有它，agent 要等跑测试才知道写坏了；有它，反馈回路从"分钟"缩到"秒"。**这是把 IDE 的反馈环移植进 TUI**，思路在所有 agent harness 里都会赢。

### billion-context / context-mode —— 73K + 74K/月

**干什么**：两个都是"上下文经济学"产物。billion-context 是通用压缩代理（任何能设 base URL 的 agent 都能用）；context-mode 是 intent 驱动的检索 + FTS5 知识库。
**为什么**：token 预算是长任务的第一约束。这条赛道还没收敛，但两个 7 万级包证明需求在。

### bigpowers —— 62K/月

**干什么**：73 个 agent skill，"17 年工程纪律的处方化"。
**为什么**：唯一的 skill 单体头部。它证明 skill 路线的天花板和瓶颈：内容能传播，但没有技术护城河。

### @gotgenes/pi-permission-system —— 39K/月

**干什么**：权限强制——agent 动手前先过许可。
**为什么**：官方把信任决策做成了扩展事件（project_trust），但没做策略引擎。这个包占了"pi 的权限层"心智位。同类 cc-safety-net（27K，跨 agent）证明需求跨 harness。

## 3.2 场景级 —— 按需安装的头部

| 包 | 下载 | 场景 |
|---|---|---|
| @narumitw/pi-usage | 24K | 看用量/DeepSeek 余额（API 计费用户刚需） |
| pi-provider-litellm | 26K | 把 LiteLLM 代理当 provider（多模型路由用户的标配） |
| pi-claude-bridge | 29K | 把 Claude Code 当 pi 的模型（白嫖 CC 订阅的算力） |
| @plannotator/pi-extension | 58K | 交互式 plan 审查/标注/PR review（团队协作场景） |
| pi-powerline-footer | 28K | 状态栏美化（TUI 颜值党） |
| @llblab/pi-telegram | 17K | 手机遥控 agent（远程场景） |
| @raindrop-ai/pi-agent | 28K | 自动追踪 pi 会话（被观测厂商认领） |
| confluence-cli | 33K | 企业文档读写（企业场景入口） |

## 3.3 研究样本 —— 不一定要装，但值得读源码

- **pi-fabric**（22K，monotykamary）——"可编程工具和 agent 运行时"，在 pi 上再架一层运行时，是研究 pi 扩展 API 极限的好样本。
- **@quintinshaw/pi-dynamic-workflows**（40K）——百级子代理扇出 + token/cost 记账 + git-worktree 隔离 + /workflows TUI + /deep-research。研究"编排器该长什么样"的最佳参考。
- **DoomPi 套件**（@agimon-ai/*，7 包 87K）——typed lifecycle contracts、leader-key 菜单、telemetry、log-sink。**一个人造了一个"pi 上的框架"**，证明扩展 API 够宽，也证明生态开始需要框架层。
- **pi-doom**（badlogic，149）——作者亲自写的玩具：在终端里跑 DOOM。功能不重要，重要的是它是官方给的"扩展点能有多野"的示范。
- **@trim21/personal-pi-extensions**（44K，版本号 0.1.527！）——一天发十几个版本的极端迭代速度，研究"包开发节奏"的活标本。

## 3.4 反面观察：谁不在头部

- **官方的包**：badlogic/earendil-works 在目录里只有 pi-doom（149）、pi-gitlab-duo（107）、pi-radius（838）等零星存在。**官方把 UX 层全部让给社区**，自己只做内核和示范。
- **CC 的"旗舰"能力**：permissions 弹窗、plan mode、background tasks 在 pi 里都只是包，且没有官方版。用户从 CC 迁来时会发现"体验靠拼装"——这是 pi 的设计立场，也是包生态存在的理由。
