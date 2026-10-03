# 02 — 多代理编排基石：`pi-subagents`（月下载 412K，编排赛道第一）深度解剖

`pi-subagents`（作者：Nico Bailon，版本 0.74.0）是 Pi 生态中多代理协同（Sub-agent Delegation & Orchestration）的事实标准。它填补了 Pi 极简核跳过多代理机制的空白，月下载量高达 41.2 万次。

---

## 一、前后他要做什么（Before & After）

### 痛点前置（Before）
1. **单主循环的上下文污染（Context Pollution）**：
   Pi 核心坚持单一 Agent Loop。当处理复杂长任务（如全库重构、深度调研、并发单元测试编写）时，所有探索过程（大段搜索结果、失败的报错、数万行源码读取）全部堆积在主会话中，导致主上下文迅速臃肿，触发频繁且昂贵的 Compaction。
2. **缺乏独立任务委派能力**：
   类似 Claude Code 的子任务委派机制（Sub-agent）是高级工程师的刚需——主 Agent 应该充当“架构师/主管”，将细分任务委派给独立的“专职 Agent”去解决，只接收汇总结果，不弄脏主上下文。
3. **并发与长任务阻塞**：
   在单循环下，运行一个需要 10 分钟的编译检查或测试用例，会彻底冻结当前 TUI 交互。

### 解决方案（After）
`pi-subagents` 在核外构建了完整的**多代理派生、调度与监控运行时**：
- **独立的上下文隔离**：通过派生子进程启动新的 Pi 实例，赋予子代理完全隔离的上下文窗口（Context Window），探索完毕后仅回传精简后的结构化结论。
- **双模态执行（Sync / Async）**：支持同步阻塞等待流式输出，也支持后台异步执行（Async Mode），任务完成后通过事件总线通知主 Agent。
- **环境隔离（Git Worktree 支持）**：支持通过 `worktreeSetupHook` 为子代理分配独立的 Git Worktree，避免多个子代理同时修改同一文件树造成写冲突。
- **可视化的舰队仪表盘（Fleet Status UI）**：在 TUI 底部挂载 Fleet 监控栏，实时显示活跃子代理的状态、耗时与 Token 开销。

---

## 二、影响面是什么（Impact & Blast Radius）

| 维度 | 影响面与实现方式 |
|---|---|
| **Agent Loop** | 注册 `subagent` 工具。主 Agent 调用该工具时，主会话挂起等待（Sync 模式）或启动后台作业追踪器（Async 模式），不阻断用户继续与主 Agent 交互。 |
| **Token 预算** | **极大幅度节省主上下文 Token**。子代理内部读取 50 个文件产生的 100K Token 消耗在子进程内自生自灭，主会话最终只消费子代理总结的 500 Token 报告。 |
| **进程与文件系统** | 采用子进程衍生机制（`child_process.fork` / `spawn`）。传递环境变量 `PI_SUBAGENT_CHILD=1` 防止子代理产生死循环递归生成。支持独立的 Scratch 目录与 Git Worktree 隔离。 |
| **安全与看门狗** | 内置 `watchdog/`（看门狗机制），监控子代理心跳。超时或无响应时强制 Kill 僵尸子进程，并在崩溃时自动收集报错向主会话汇报。 |
| **会话状态** | 引入 `intercom/native-supervisor-channel.ts`，主代理与子代理之间通过专用的持久化条目（`SUPERVISOR_REQUEST` / `SUPERVISOR_REPLY`）交换通信事实，保留在 session 树中。 |

---

## 三、利用了派的什么能力（Pi Capabilities Exploited）

1. **注册面（Register Surface）**：
   - `pi.registerTool`：注册核心 `subagent` 工具，支持模型直接传参：`agent`（指定代理角色）、`task`（任务描述）、`async`（是否后台化）、`tools`（为子代理定制的工具白名单）。
   - `pi.registerCommand`：注册 `/subagents`、`/fleet`、`/subagent-cancel` 等交互命令。
2. **生命周期拦截（Seams）**：
   - 监听 `session_start`：重置后台作业跟踪器（`async-job-tracker.js`），清理遗留孤儿临时目录；
   - 监听 `session_shutdown`：向所有存活的子代理发送 SIGTERM 优雅退出；
   - 监听 `before_agent_start`：动态将当前系统可用的子代理清单（`agents/` 目录中发现的 profiles）注入主 System Prompt 的 Guidelines 中。
3. **UI 槽位与覆盖层（TUI Injection）**：
   - `ctx.ui.setWidget`：在 TUI 顶部或底部挂载 `SubagentFleetStatus` 动态组件，展示各子代理的实时运转状态；
   - 自定义渲染：覆盖 `subagent` 工具的 `renderCall` / `renderResult`，在终端渲染折叠式的子任务进度条与消耗统计。
4. **复合打包协议（Package Manifest）**：
   - 在 `package.json` 的 `"pi"` 字段中，不仅声明了 `extensions: ["./index.js"]`，还复合打包了 `skills: ["./skills"]` 与 `prompts: ["./prompts"]`，实现了代码、提示词规范、模板的开箱即用。

---

## 四、自身做了什么能力（Self-Provided Capabilities）

1. **多代理发现与 Profile 架构（`agents/`）**：
   定义了代理的配置规范（Agent Profile）。支持从项目 `.pi/agents/` 或全局 `~/.pi/agent/agents/` 自动发现专职代理（如 `reviewer`、`researcher`、`debugger`），每个代理拥有绑定的专属提示词、模型偏好和工具权限。
2. **异步作业状态机与结果投递（`runs/background/`）**：
   实现了一套完整的后台作业生命周期管理器：
   - `async-job-tracker.js`：维护 Active / Completed / Failed / Abandoned 状态机；
   - `result-watcher.js`：基于文件锁和事件通知捕获子代理的输出产物；
   - `result-delivery-ownership.js`：保证子代理产出的结果精确只投递一次给主 Agent。
3. **主子双向通信信道（`intercom/`）**：
   实现了 `native-supervisor-channel.ts`，主 Agent 可以向正在运行的子代理发送 steering（纠偏指令），子代理也可向上级反向请示（`ask_supervisor`）。
4. **Git Worktree 隔离驱动器**：
   支持为子代理自动执行 `git worktree add`，在隔离的代码工作副本中执行修改和测试，验证成功后再合并回主工作区。

---

## 五、核心思想与代码逻辑结构（Architecture & Code Structure）

### 1. 物理目录与模块分工

```text
pi-subagents/
├── package.json              # 复合包声明：extensions + skills + prompts
├── index.js                  # 入口守卫：检查 PI_SUBAGENT_CHILD 环境变量防止递归
│
├── src/
│   ├── extension/
│   │   ├── index.js          # Extension 注册中心，挂载工具、命令、事件与看门狗
│   │   └── schemas.js        # subagent 工具的严格入参参数模型 (TypeBox)
│   │
│   ├── agents/               # 子代理 Profile 发现、解析与 Prompt 注入
│   │   ├── agents.js         # 本地与全局 agent profiles 扫描器
│   │   └── advertised-agent-prompt.js # 将可用子代理清单合成为 System Prompt 文本
│   │
│   ├── runs/background/      # 异步后台作业核心引擎
│   │   ├── async-job-tracker.js      # 作业状态机与并发槽位分配
│   │   ├── active-async-capacity.js  # 限制每会话最大并发子代理数量
│   │   └── result-delivery-ownership.js # 产物原子认领机制
│   │
│   ├── intercom/             # 主子代理双向通信协议
│   │   ├── native-supervisor-channel.js # 基于 Session 树的信道通信
│   │   └── supervisor-ui.js  # 终端通信对话块渲染器
│   │
│   ├── watchdog/             # 心跳监听与僵尸进程清理
│   │   └── register-main.js  # 主进程健康巡检看门狗
│   │
│   └── tui/                  # 终端界面与长相层
│       ├── fleet-status.js   # 舰队状态动态 Widget
│       └── render.js         # subagent 工具调用与进度折叠渲染
│
├── skills/                   # 随包分发的 Prompt 技能
├── prompts/                  # 随包分发的 Slash 命令模板（如 /delegate）
└── agents/                   # 内置预设的代理角色模板
```

---

### 2. 核心执行流转时序（主子代理调度闭环）

```
[主 Agent 决策]
    │
    ▼
主 Agent 识别到复杂子任务: "把整个 auth 模块的所有单元测试写出来"
    │
    ▼
调用工具: subagent({ agent: "test-writer", task: "编写 auth 测试", async: true })
    │
    ▼
[pi-subagents 拦截执行]
    │
    ├─► 1. 检查环境变量，读取 agent profile (test-writer 配置)
    ├─► 2. 创建隔离环境 (分配 Worktree 或独立临时工作区)
    ├─► 3. 记录任务至 async-job-tracker (分配 Job ID: job-42)
    ├─► 4. 派生子进程 (child_process.spawn):
    │        设置环境变量: PI_SUBAGENT_CHILD=1, PARENT_JOB_ID=job-42
    │        启动独立子实例: pi -p "编写 auth 测试" --no-session
    │
    ├─► 5. 主线程立即返回: "子任务 job-42 已在后台启动，Fleet 状态栏已更新"
    ▼
主 Agent 继续处理其他用户输入（不冻结）
    │
    ══════════════════════════════════════════════════════════════════
[子代理在独立进程中运行]
    │  ├─ 读文件、跑测试、写代码（消耗 80K Token，不影响主上下文）
    │  └─ 执行完成，将结构化结果写入磁盘产物文件
    ▼
[Watchdog / Result-Watcher 触发]
    │
    ├─► 检测到 job-42 产物就绪，通过 result-delivery-ownership 认领
    ├─► 触发 pi.events 投递内部消息，或通过 follow-up 机制唤醒主 Agent
    ▼
主 Agent 收到纯净报告: "auth 模块 8 个测试已编写全绿，关键改动摘要如下..."
```

---

### 3. 可供 Coding Agent 借鉴的核心工程模式

1. **环境变量防死循环守卫（Subagent Child Guard）**：
   在 `index.js` 开头立即检查：
   ```javascript
   if (process.env.PI_SUBAGENT_CHILD === "1") return;
   ```
   这个三行代码模式彻底避免了“子代理执行命令时又触发了 subagent 扩展，导致指数级 fork 炸弹塞爆宿主机”的灾难。
2. **工作树物理隔离（Worktree Provisioning Pattern）**：
   多个 Agent 在同一个 Git 仓库操作时，同时修改文件会产生竞态。通过在派生前建立独立 Worktree，使得各代理之间不仅上下文逻辑隔离，**磁盘物理状态也完全隔离**，最终只需一次 clean merge。
3. **复合资源分发（Hybrid Manifest Pattern）**：
   在 `package.json` 中将 `extensions`、`skills` 和 `prompts` 打包在一起，使插件安装后既为 Agent 提供了 `subagent` 工具，又为用户提供了 `/fleet` 命令，还为系统注入了委派相关的最佳规范。

---

## 六、测试资产与自动化测试考量（Testing Assets & Strategy）

1. **多进程并发竞争防御（Concurrency & Race Condition Gates）**：
   子代理涉及大量子进程衍生与文件状态同步。测试资产核心测试：
   - 当多个子代理并发写入同一个结果文件时，`result-delivery-ownership.js` 的文件锁抢占逻辑是否原子生效；
   - 当主进程被 `SIGINT` 杀掉时，`watchdog` 是否能在毫秒级回收所有子进程，不留孤儿进程。
2. **离线驱动（Offline Mock Harness）**：
   子代理启动命令（`pi -p ... --no-session`）在测试中被替换为受控的脚本化 CLI 桩程序，模拟子代理的阶段性输出与异常崩溃，测试整个状态机在无需网络与真实大模型的情况下的容灾自愈能力。

---

## 七、面向 Coding Agent 的友好度（Coding-Agent Friendliness / DX for AI）

| 考量维度 | 评级 | 真实表现与分析 |
|---|---|---|
| **模块解耦粒度** | 极佳 (A+) | **模范级的清晰分层**。源码划分为 `agents/`、`runs/`、`intercom/`、`watchdog/`、`tui/` 等专职子目录，单个模块控制在 200~400 行以内，Coding Agent 进行局部阅读和修改时几乎不会发生 Context 溢出。 |
| **防御性边界** | 极高 (A+) | `PI_SUBAGENT_CHILD=1`、`async-retention` 超时释放、`capacity-ceiling` 并发上限，全方位防止失控执行。 |
| **类型契约** | 高 (A) | 在 `src/api/` 下输出了 15 个细分公共契约（`.d.ts`），方便其他插件与子代理通信。 |
| **Agent 指引文档** | 良好 (B) | 包含详尽的 `docs/` 架构说明，且结构自解释性极强。 |

