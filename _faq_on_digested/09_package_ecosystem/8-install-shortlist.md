# 8 · 插件安装推荐清单（编号待选）

> **状态（2026-09-11）**：pi 已升级 0.84.1 → 0.85.1；**01–13 已全部安装到全局 pi** 并通过 headless 冒烟测试（扩展加载无报错）；`pi-web-access` 的 Tavily key 已配置到 `~/.pi/agent/web-search.json`（文件不入库），web_search 全链路实测通过。14–20 未装。

> 用途：本机全局 pi 的选装菜单。基于下载量（2026-09-11 快照）+ 社区实证（issue 里晒的真实 settings.json、awesome 列表、writeup）。
> 你的现状：全局 pi 0.84.1（repo 是 0.85.1），默认 provider deepseek / deepseek-v4-flash，**当前未装任何包**。

## 选装表

### P0 —— 基础层（裸 pi 缺的能力，建议全装）

> ✅ 01–07 已装（2026-09-11）

| # | npm 包 | 月下载 | 干什么 | 为什么推荐 | 备注 |
|---|---|---|---|---|---|
| 01 | `pi-mcp-adapter` | 866K | MCP→pi 工具适配 | pi 无内置 MCP；接任意 MCP server 的唯一通道，全生态第一名 | 版本 2.33.0，迭代活跃；装完要配 server 才有用 |
| 02 | `pi-web-access` | 404K | 搜索/抓网页/PDF/YouTube/克隆仓库 | 补上联网，agent 装眼睛 | 需要至少一个搜索后端的 key（Brave/Tavily/OpenAI 均可），装完要配 |
| 03 | `pi-subagents` | 412K | 子代理委托 + 脚本化多代理工作流 | 编排事实标准；issue 里用户真实配置都有它 | 与 17 二选一，别同时装 |
| 04 | `pi-background-tasks` | 108K | 持久后台 shell 任务、只读委派 agent | 长任务（构建/测试）不堵主对话 | — |
| 05 | `@juicesharp/rpiv-todo` | 134K | 模型 todo 的 live 覆盖层 | compaction 后还在，跨 /reload 存活；CC 体验移植最完整的一个 | — |
| 06 | `@juicesharp/rpiv-ask-user-question` | 152K | 模型结构化提问（带类型的选项） | 消灭"模型瞎猜"；和 05 同作者成套 | — |
| 07 | `pi-lens` | 75K | LSP/lint/formatter/类型检查实时回灌 | 编辑后秒级反馈；对本仓（TS monorepo）价值最大 | 会增加每次编辑后的处理量，项目大时有开销 |

### P1 —— 体验/效率层（按口味装）

> ✅ 08–13 已装（2026-09-11）

| # | npm 包 | 月下载 | 干什么 | 为什么推荐 | 备注 |
|---|---|---|---|---|---|
| 08 | `@narumitw/pi-usage` | 24K | 用量/余额面板 | **对口你的 DeepSeek 默认 provider**（原生支持 DeepSeek 余额） | — |
| 09 | `pi-powerline-footer` | 28K | Powerline 状态栏（git 集成 + token 统计） | 社区最流行的颜值件，与 03 同作者 | — |
| 10 | `pi-compact-transcript` | 新包 | 紧凑转录：折叠 thinking、单行工具预览 | 长会话可读性 | 刚发布下载未上榜，属于低风险尝试 |
| 11 | `pi-goal-x` | 57K | /goal 自主目标 + 独立完成审计 | 自主跑长任务时防跑偏，带独立 auditor | — |
| 12 | `@plannotator/pi-extension` | 58K | 交互式 plan 审查/标注/PR review | 动手前先对齐计划；writeup 里口碑好 | — |
| 13 | `pi-simplify` | 40K | 变更代码的可维护性审查 | 和 07 互补：lens 管"对不对"，simplify 管"好不好" | — |

### P2 —— 视需求（安全/研究/场景件）

| # | npm 包 | 月下载 | 干什么 | 为什么推荐 | 备注 |
|---|---|---|---|---|---|
| 14 | `@gotgenes/pi-permission-system` | 39K | 权限强制 | pi 无内置权限弹窗；跑危险项目时装 | 会打断 agent 流，日常可关 |
| 15 | `bigpowers` | 62K | 73 个工程技能包 | 唯一做大的 skill 包；方法论护城河低但免费 | 与项目自带 AGENTS.md 风格可能打架，装后可按项目关 |
| 16 | `@ff-labs/pi-fff` | 36K | 模糊文件/内容搜索 | 大仓库定位快 | — |
| 17 | `@tintinweb/pi-subagents` | 47K | CC 式子代理（并行/live widget/mid-run steering） | 03 的替代品，UI 更花 | 与 03 二选一 |
| 18 | `@llblab/pi-telegram` | 17K | Telegram 遥控 | 手机上盯/指挥家里跑的 agent | 需要 bot token，有暴露面，只在内网/可信环境用 |
| 19 | `billion-context` | 73K | 上下文压缩代理（改写模型流） | 长任务 token 省钱激进方案 | 是独立 proxy，不是普通扩展，设置成本高；研究向 |
| 20 | `@quintinshaw/pi-dynamic-workflows` | 40K | 百级子代理扇出 + 成本核算 + worktree 隔离 | 编排天花板，值得研究 | 重；与 03/17 功能重叠 |

## 预设组合

| 组合 | 编号 | 适合 |
|---|---|---|
| 最小套装 | 01–07 | 日常编码（本仓 TS 开发的合理起点） |
| 均衡套装 | 01–13 | + 用量面板/状态栏/计划审查 |
| 全家桶 | 01–16（03 与 17 二选一） | 想都试试 |

## 安装方式（选定编号后我来执行）

```bash
pi install npm:<包名>        # 写入全局 ~/.pi/agent/settings.json
pi remove npm:<包名>        # 反悔
pi -e npm:<包名>            # 先试用一次，不落盘
```

## 三个提醒

1. **版本**：你的全局 pi 是 0.84.1，repo 已到 0.85.1。建议先 `pi update`（安装器会做原子升级），部分新包用了 0.85 的扩展 API。
2. **安全**：官方文档原话——"包以全系统权限运行，扩展执行任意代码，装前读源码"。P0 清单全部是高下载 + 活跃维护 + 有公开 repo 的包，但装完可以让我把关键包的源码过一遍。
3. **冲突**：03/17/20 三个编排包功能重叠，只装一个；确认要换时先 remove 再装另一个。
