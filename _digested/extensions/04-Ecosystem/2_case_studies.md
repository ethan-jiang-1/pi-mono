# 2. 头部包解剖：生态怎么用 pi 的接缝

> 两个下载量最高的社区包（pi.dev 2026-09-21 快照）逐个拆开，对照 [02-Expansion](../02-Expansion/) 的轴看"生态包到底由哪些接缝拼成"。数据源：两个包的官方 README（2026-09-21 版）；行为细节以各包文档为准，pi 侧机制锚点为 v0.86.1 工作树。

## 共同结论（先说）

拆完两个包，最大发现不是某个功能，而是一个**形状规律**：

1. **没有单轴包**。头部包都是 3-4 条轴的组合：注册工具（2.2）+ 自定义 UI（2.3）+ 自定义命令 + 捆绑 skill（2.5）+ 包协议（1）。
2. **context 经济学是第一设计驱动力**。两个包的 README 开篇都在算 token 账，不是功能账。
3. **包与包开始互操作**：跨包引用走 pi 的事件总线和声明式 frontmatter，不走代码 import——包边界与模块边界分离。

## 案例 1：pi-mcp-adapter（MCP 桥，~2.4K/月）

**解决的问题**：一个 MCP server 的工具定义能烧掉 10k+ token，"接几个 server，对话还没开始 context 就烧掉一半"（README "Why This Exists"，引 pi 作者 Mario Zechner 的 [why you might not need MCP](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/)）。

**核心设计——代理工具模式**：不给模型几百个工具定义，只注册**一个 `mcp` 工具（约 200 token）**，模型通过它 search/describe/call 按需发现真实工具；server 默认 **lazy**（首次调用才连接），元数据缓存到磁盘使搜索无需连接（README "How It Works"）。这是 2.2 注册轴上"工具"概念的再抽象——**注册的不是能力，是能力的目录**。

**用到哪些接缝**：

| 接缝（02-Expansion 轴） | 在包里的形态 |
|------|------|
| 注册工具（2.2） | `mcp` 代理工具；`directTools` 三态（`true` 全量直通 / 数组挑选 / `"search"` 搜索激活制——直通工具先"休眠"，搜索命中才激活，且不计入 75 工具告警） |
| 自定义命令（2.2 判断三） | `/mcp`、`/mcp setup`、`/mcp reconnect <server>`、`/mcp-auth` 等全套命令面 |
| 自定义渲染（2.3） | 紧凑自渲染结果行（替代 pi 的 boxed 行，`settings.toolResultRendering` 可回退） |
| 事件系统（2.1） | **跨扩展协作不走 import**：其他扩展在 `session_start` 时向共享事件总线 emit `pi-mcp-adapter:runtime-register:v1` 事件注册 MCP server（版本化事件名 + 同步 result 回写）；状态订阅走 `MCP_STATUS_EVENT` 只读快照 |
| 捆绑 skill（2.5） | `mcp-scripting` skill，**manual-only**（不进模型自动 context，`/skill:mcp-scripting` 显式触发）——工具教模型用自己 |
| UI 深度（2.3） | MCP UI 标准的工具内嵌 iframe + `triggerTurn()` 双向对话（UI 发消息唤醒 agent） |
| SDK 面（integration/） | `createMcpAdapter({ config })` 供宿主进程内嵌 |

**互操作证据**：subagent 前frontmatter 可写 `mcp:server-name` 请求直通工具；pi 包可用 `pi.mcp` manifest 声明自带 MCP server；Agent Plugins 与 Claude plugin 目录可选导入——**一个包桥接了三个生态的包格式**。

## 案例 2：pi-subagents（子代理，~1.1K/月）

**解决的问题**：core 故意不做 subagent（[01-Core/1.2](../../01-Core/1.2_skipped_features.md)），这个包把它做成产品级：委派、并行、后台、可观测。

**用到哪些接缝**：

| 接缝 | 形态 |
|------|------|
| 注册工具（2.2） | 单个 `subagent` 工具（和 MCP adapter 同款"单工具面"哲学） |
| **声明式 agent 定义（2.5 的延伸）** | 7 个内置 agent（scout/researcher/evidence-auditor/worker/reviewer/oracle/delegate）全是 `.md` frontmatter；用户可覆盖内置、自定义 agent，frontmatter 里可声明 tools/extensions/skills 甚至 `mcp:server-name` |
| 进程模型 | 前台子代理跑在**父 pi 进程内的 session**；后台跑在 **detached runner 进程**（复用宿主 SDK，官方 0.86.1 standalone 版经嵌入式 SDK 加载同一 runner） |
| 自定义 UI（2.3） | FleetView 常驻面板 + `/subagents-fleet` 实时检查器（浏览子会话、读 transcript、steer、停跑） |
| 持久化（2.4） | mission 记录、delivery receipts、定时/循环任务、生命周期 artifacts |
| 组合与护栏 | 递归守卫、`maxSubagentSpawnsPerRun`（默认 64）+ 会话级 spawn 预算；watchdog 对抗式审查（可选） |

**互操作证据**：`researcher`/`evidence-auditor` agent 的 frontmatter 声明"需要 pi-web-access 装在子代理里"——**包文档里明确写着对另一个社区包的依赖**；与 pi-mcp-adapter 的 `mcp:` frontmatter 协议互相成就。

## 从两个案例回看 pi 的生态主张

1. **"单工具面 + 目录发现"成为头部包的共同范式**（mcp 代理工具、subagent 委派工具）——pi 的 context 极简默认（~500 token system prompt）逼着生态把"能力注入"做成"能力索引"。
2. **声明式 frontmatter 是生态的粘合剂**：agent 定义、mcp server 引用、skill 捆绑全部走 `.md`/manifest，跨包组合不需要写胶水代码。
3. **UI 与后台不是扩展的禁区**：FleetView、detached runner、native 窗口（MCP UI/Glimpse）说明 2.3/2.4 两轴撑得起产品级形态——这正是"core 不做 subagent 但生态做得出来"的完整证据链。

## 数据时效

下载量与功能形态为 2026-09-21 快照（两包迭代都很活跃：pi-subagents 版本号 0.70.x、pi-mcp-adapter 2.34.x）。机制结论锚在两包 README 与 pi v0.86.1 源码；包侧行为以各包文档为准。
