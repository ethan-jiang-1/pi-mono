# 4 · 趋势：生态在卷什么

## 4.1 第一驱动力：移植 Claude Code 体验

**现象**：rpiv-*（todo、ask-user-question）、pi-subagents、pi-plan-mode、pi-dynamic-workflows、skill 系统——CC 有什么交互原语，pi 生态就长什么。

**为什么成立**：pi 的极简内核（<1000 token 系统提示、read/write/edit/bash 四工具）留出了完整的 UX 表层，任何 CC 原语都能在 pi 里重新实现。社区自我定位是 ["Vim of coding agents"](https://dev.to/terminalblog/pi-is-the-vim-of-coding-agents-and-that-s-exactly-the-point-416m)：可定制是卖点。

**对应生态结构**：这是"体验层"创业——比"又一个 MCP server"的窗口大得多，因为 CC 的每个原语背后都是一类包（todo→覆盖层，ask→表单，subagent→编排）。

## 4.2 编排内卷：从"单机多任务"到"多 agent 组网"

三代表现：

1. **数量**：编排类 685 包，是第二大品类。
2. **形态升级**：单委托（pi-subagents）→ 脚本工作流（pi-foreground-chains）→ 百级扇出+成本核算+worktree 隔离（pi-dynamic-workflows）→ 组网通信（pi-intercom/pi-messenger）→ 看板观测（pi-kanban、doompi-ui）。
3. **框架化**：DoomPi 用 typed contracts 把扩展生命周期类型化——编排器之间开始互相定义协议。

**判断**：编排是"人人都能写"的品类，头部（412K）和第 5 名（40K）差一个数量级，但长尾仍在疯狂入场。赢家条件：成本核算 + 隔离 + 可观测三件套齐全（pi-dynamic-workflows 最接近）。

## 4.3 上下文经济学：所有人在跟 token 预算搏斗

三个战场的证据：

- **压缩**：billion-context（73K，代理改写流）、pi-compact-transcript（紧凑转录）、pi-custom-compaction。
- **懒加载**：官方 0.80.7/0.80.9 连续给 cache 友好的动态工具加载开路（kimi-deferred-tools 协议进核心），包侧 pi-mcp-adapter 的 token 效率是主打卖点。
- **计量**：usage 面板 163 个包、官方把工具/压缩用量记入会话统计（0.81）。

**判断**：这是 pi 生态和 CC 生态差异最大的地方——CC 靠自动 compaction 藏起复杂度，pi 把它变成公开战场，让用户选策略。

## 4.4 可观测性被 SaaS 厂商接管

Braintrust（26K）、LangSmith（21K）、Raindrop（28K）全部亲自发 pi extension。含义：

1. pi 被判定为"值得适配的发行渠道"——企业用户在用 pi 跑生产。
2. 这批包全是**低努力高杠杆**：厂商已有 tracing 基建，pi 只是加一个 subscriber。
3. 对个人开发者的信号：给"别的平台"写 pi 适配（数据库、CI、协作工具）是稳赚 niche。

## 4.5 pi 作为内核被产品化

feynman（科研）、pi-web-ui/pi-desktop/Emacs/VSCode/Android（前端矩阵）、@yefengr/remote-pi（PWA 遥控）、Telegram runtime（@llblab）。加上 fork 阵营：oh-my-pi（最大发行版）、pi-rs（Rust 重写）、senpi（意见化 fork）、rho（常驻个人 agent）。

**判断**：pi 在从"终端工具"变成"agent 引擎的 busybox"。这个趋势意味着 pi 的包生态竞争者不是别的 coding agent 的市场（那是 CC 的），而是**"谁都想拥有自己的 agent 内核"**这个更大的池子。

## 4.6 安全是短板，补位在发生但没到头部

permission-system（39K）、cc-safety-net（27K）、bwrap 沙箱、nono（Landlock/Seatbelt）、gondolin（官方 micro-VM）、hermes-memory 的 secret 扫描——全在 1-4 万量级，无垄断。[Implicator](https://www.implicator.ai/pi-is-not-a-claude-code-rival-it-is-a-harness-rebellion/) 直接把供应链风险列为 pi 生态头号隐忧（任意代码执行的包 + 无审计层）。

## 4.7 速度与更替：生态的新陈代谢

- 239 包/24h 更新，454/7 天；抓取当天头部包全部有当天 patch。
- awesome 列表半年换代一次（qualisero 版 2026 年中退役，thevibeworks 接棒）。
- 主仓库 4 个月 45k→104k stars；包系统 4 个月 2.1k→5.4k（索引口径）。
- 命名空间迁移（@mariozechner → @earendil-works）迫使全生态改 import——**并购的代价由生态承担了一次**。

## 4.8 官方路线如何塑造以上一切

官方 0.80→0.85 只做三件事：**模型/认证运行时收敛**（ModelRuntime、OAuth device flow 全家桶）、**扩展面加宽**（registerProvider、~30 事件、ctx.ui.custom）、**TUI 打磨**（全屏/搜索/滚动条）。同时明确拒绝：MCP、subagents、plan mode、包间依赖、monorepo 子目录安装（#4269、#4530 no-action）。

**一句话**：官方负责把"可挂钩的面"变宽，每个新钩子都会在几个月内长出一个包品类（registerProvider → provider 包群、dynamic tool loading → 懒加载包、ui_prompt 事件 → 远程控制包）。
