# 深度案例 07: @plannotator/pi-extension —— 人机协同评审与富视觉交互范式 (Visual Human-in-the-Loop & Annotation UI)

> **定位**: 生态最高星/最具代表性的交互式人机协同扩展 (Monthly Installs: 58K+)  
> **包名**: `@plannotator/pi-extension` (作者: backnotprop)  
> **源码坐标**: `~/.pi/agent/npm/node_modules/@plannotator/pi-extension/`  
> **核心标签**: Plan Mode 状态机、内置轻量 Web 服务器、浏览器双向标注流、Write 拦截熔断门、Prompt 缓存无损注入

---

## 1. 前后他要做什么 (Before & After Intent / Problem & Solution)

### Before (没有 Plannotator 时的割裂与失控)
在纯命令行/TUI 终端中，Agent 执行复杂任务往往面临两个极端的困境：
1. **失控狂奔 (Unchecked Autonomous Execution)**: Agent 产生了一个不切实际的方案（例如重构了核心数据库模型或误删了关键配置），直接在几秒钟内通过 `edit`/`write` 篡改了十几个文件，用户回过神来时局面已不可收拾。
2. **纯文本评审体验极差 (TUI Plan Review Fatigue)**: 原生终端如果要让用户评审长达数百行的方案或大型代码 Diff，用户只能在终端里反复翻页、上下滚动。终端文本缺乏上下文高亮、行内点选评论、折叠与富媒体渲染，用户很难提出精确到具体段落的结构化批注。

### After (引入 Plannotator 后的可视化协同中枢)
Plannotator 在 Pi 中建立了一套**人机共生、视觉驱动的双向审核流水线**：
1. **规划与执行双态隔离 (Plan Mode State Machine)**: 引入独立的 `planning` 模式。在规划阶段，Agent 被硬性限制只允许读代码与撰写 Markdown 方案，严禁修改任何生产源代码。
2. **零依赖浏览器富 UI 瞬时唤起 (Loopback Web UI)**: 当 Agent 完成方案并调用 `plannotator_submit_plan` 时，扩展瞬间在本地随机端口拉起内嵌 HTTP/WebSocket 服务，并在默认浏览器弹出一个极富交互感的批注工作台（基于 `@pierre/diffs` 和 `@plannotator/webtui`）。
3. **行内所见即所得批注 (WYSWYG Annotation & Approval)**: 用户可以在浏览器中划词选中方案段落、添加批注、修改步骤、单点拒绝或整体 Approve。
4. **结构化反馈回灌模型 (Markdown Feedback Re-injection)**: 用户点击提交后，Web 端批注通过 WebSocket 传回 Node 进程，由 Turndown 引擎转换为标准的 Markdown 批注列表，作为高优先级消息推送给 Agent 继续迭代。
5. **执行期清单追踪 (Execution Checklist Tracking)**: 一旦方案被批准进入 `executing` 模式，扩展自动解析方案中的 `[ ]` 任务清单，在每轮执行开始前向 Agent 同步 `[DONE:n]` 状态进度。

---

## 2. 影响面是什么 (Impact & Blast Radius)

Plannotator 跨越了 Node.js 进程、本地网络端口、操作系统默认浏览器以及 Pi 的多轮对话历史：

```
[Agent Planning] 
      │
      ├── 1. Tool Call Gate (pi.on("tool_call")) ──> [Block all non-MD writes]
      ├── 2. plannotator_submit_plan Tool Call
      │            │
      │            ▼
      ├── 3. Ephemeral Loopback Server (HTTP/WS on 127.0.0.1:RandomPort)
      ├── 4. OS Browser Launch (xdg-open / open / start)
      │            │ (Human reviews & annotates visually in browser)
      │            ▼
      ├── 5. WebSocket Ingestion & HTML-to-Markdown Transpilation
      └── 6. Conversation Suffix Injection (before_agent_start framing)
```

| 维度 | 影响面细节与控制约束 |
|---|---|
| **工具调用与写操作拦截 (Write Sandboxing)** | 在 `phase === "planning"` 期间，扩展深度挂载 `pi.on("tool_call")`。如果 Agent 试图调用 `write` 或 `edit` 修改非 `.md` / `.mdx` 文件，扩展直接返回 `{ block: true, reason: "..." }`，在系统调用前实行物理阻断。 |
| **Token 预算与 Prompt 缓存友善度** | **绝不修改 System Prompt**: Plannotator 绝不通过覆盖系统提示词来注入规则（那会彻底击穿 LLM 的 Prompt Cache）。它通过 `pi.on("before_agent_start")` 注入 `display: false` 的轻量级对话后缀消息（Framing），最大程度保留前缀命中率。 |
| **网络与操作系统端口** | 1. 严格绑定环回接口 `127.0.0.1`，分配随机未占用端口，拒绝跨网段暴露。<br/>2. 浏览器会话结束后，WebSocket 心跳超时或连接断开会自动触发服务端口安全回收，杜绝孤儿进程占用。 |
| **项目信任机制 (Project Trust)** | 严格遵循 Pi 0.79+ 的信任模型。非信任模式下，不加载用户项目根目录下的 `.pi/plannotator.json` 自定义偏好设置。 |

---

## 3. 利用了派的什么能力 (Pi Capabilities Exploited)

Plannotator 展现了 Pi 扩展作为「跨介质全功能协同应用」的无限潜力：

### (1) 生命周期钩子与状态同步
- `pi.on("tool_call")`: **方案期写操作熔断**。若处于规划阶段且修改非文档文件，直接拦截。
- `pi.on("before_agent_start")`: **阶段指引注入**。向 Agent 递送当前处于 `planning` 还是 `executing` 的角色预期，并在方案获批后注入当前待办清单的未完成项。
- `pi.on("turn_end")` / `pi.on("agent_end")`: **轮次收尾检查**。监测 Agent 是否完成了当前任务，或者是否需要唤起二次评审。
- `pi.on("session_compact")` / `pi.on("session_tree")`: **跨分支与压缩持久化**。当会话发生上下文压缩或树形分支跳转时，利用 `current-pi-session.ts` 恢复 Plan 状态机指针。
- `pi.on("resources_discover")`: **动态 Skill 发现**。按需向 Pi 的技能体系暴露 `plannotator` 核心技能。

### (2) 扩展工具注册 (`pi.registerTool`)
- `plannotator_submit_plan`: Agent 核心交付接口。Agent 编写完计划文件后调用该工具传入路径，触发浏览器评审流；该工具会进入异步挂起等待状态，直到人类在浏览器端点击「批准」或「驳回带批注」。

### (3) 交互式命令与快捷键 (`pi.registerCommand`, `pi.registerShortcut`)
- `/plannotator-plan-mode`: 命令行切换规划模式。
- `pi.registerShortcut(Key.ctrlAlt("p"))`: 为终端用户绑定热键 `Ctrl+Alt+P`，随时一键启动或退出规划模式。
- `/plannotator-review`: 对未提交的 Git Diff 唤起浏览器评审。
- `/plannotator-annotate`: 对指定 Markdown 文本唤起浏览器批注。
- `/plannotator-last`: 对 Agent 最近的一条 Assistant 消息调出评审界面。

---

## 4. 他自身做了什么能力 (Self-Provided Capabilities)

Plannotator 在扩展内部封装了一个完整的现代微 Web 应用体系：

```
                    ┌─────────────────────────────────────────┐
                    │      Plannotator Extension Core         │
                    └────────────────────┬────────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         ▼                               ▼                               ▼
 ┌───────────────┐               ┌───────────────┐               ┌───────────────┐
 │ Plan State    │               │ Local Web     │               │ Annotation    │
 │ Machine       │               │ Server & RPC  │               │ Transpiler    │
 ├───────────────┤               ├───────────────┤               ├───────────────┤
 │- Idle         │               │- Node HTTP/WS │               │- Turndown     │
 │- Planning     │               │- Singlefile   │               │- GFM Plugin   │
 │- Executing    │               │  HTML Bundle  │               │- Pierre/diffs │
 │- Write Guard  │               │- Port Lease   │               │- Parse5 DOM   │
 └───────────────┘               └───────────────┘               └───────────────┘
```

### 1. 单文件嵌入式 Web SPA (`plannotator.html`, `review-editor.html`)
Plannotator 将复杂的 Web 前端（包含 Diff 高亮器、富文本编辑器、标注气泡框、WebSocket 客户端）预打包为单文件 HTML 资产（各十余兆，内联所有 JS/CSS/WASM/字体），彻底摆脱外部静态 CDN 依赖，在完全离线无网的环境下依然秒开。

### 2. Markdown <-> 富文本标注双向转译 (Annotation Transpiler)
人类在 Web 页面中通过富文本或所见即所得方式所做的涂改与评论，被扩展通过 `parse5` 和 `@joplin/turndown-plugin-gfm` 精准还原为结构化的标准 GitHub Flavored Markdown 引用块，使得 LLM 能像阅读自然对话一样理解批注：
```markdown
> [Line 42]: `db.execute("DROP TABLE users")`
**Reviewer Comment**: Do not drop the table! Use soft-delete column `deleted_at` instead.
```

### 3. Checklist 任务追踪解析引擎 (`generated/checklist.ts`)
扩展内置了状态驱动的清单解析器，能自动识别 Markdown 格式的待办项（`- [ ]`, `- [x]`），并在 Agent 执行每一步后动态更新方案原文件，确保任务进度单调递增。

---

## 5. 核心思想的代码逻辑结构 (Architecture & Code Logic Flow)

### 目录结构组织 (Folder Taxonomy)
```
apps/pi-extension/
├── index.ts                     # 扩展主入口 (Lifecycle, Tools, Commands, Hotkeys)
├── config.ts                    # 配置加载器与阶段 Profile 渲染
├── current-pi-session.ts        # 会话标识追踪与多会话隔离
├── assistant-message.ts         # 历史助理消息提取与快照捕获
├── plannotator-events.ts        # 内部事件分发总线与评审状态流
├── plannotator-browser.ts       # 浏览器启动子进程管理 (open/xdg-open)
├── server.ts                    # 本地 Node HTTP / WebSocket 静态资源分发
├── server/                      # WebSocket 通信协议处理与消息分发
├── todo-providers/              # 与不同待办管理工具的适配桥
├── generated/                   # 预生成的 Checklist 解析器与 Prompt 模版
├── plannotator.html             # 预编译方案评审独立 Web 应用
└── review-editor.html           # 预编译 Diff 代码审查独立 Web 应用
```

### 方案提审与评审运行时序列图 (Runtime Sequence Flow)

```mermaid
sequenceDiagram
    autonumber
    participant Agent as Coding Agent
    participant Ext as Plannotator Extension
    participant Svr as Ephemeral Web Server
    participant UI as Default Browser (SPA)
    participant Human as User / Reviewer

    Agent->>Ext: plannotator_submit_plan(path: "plan.md")
    Ext->>Svr: startServer(planContent)
    Svr-->>Ext: Listen on 127.0.0.1:49215
    Ext->>UI: spawnBrowser("http://127.0.0.1:49215")
    UI->>Svr: WebSocket Connect
    Svr-->>UI: Deliver Plan Markdown & Session ID
    Human->>UI: Highlight line 24 & add comment "Add rollback plan"
    Human->>UI: Click "Request Changes"
    UI->>Svr: WS: sendAction({ type: "deny", annotations: [...] })
    Svr->>Ext: resolvePromise(denyPayload)
    Svr->>Svr: Close WebSocket & Terminate Port
    Ext->>Ext: Transpile Annotations to GFM Markdown
    Ext-->>Agent: Tool Result: Plan denied with feedback: <markdown>
    Agent->>Agent: Revise plan.md based on comments
```

---

## 6. 测试资产与自动化测试考量 (Testing Assets & Strategy)

作为一个集成了浏览器、WebSocket 和复杂文件写操作拦截的混合扩展，Plannotator 的测试策略展现了高度的工程克制：

### 1. 深度剖析：为什么绝不能在 CI 中启动真实浏览器（Playwright / Puppeteer）？
在很多 Web 扩展开发者的惯性思维中，测试网页评审就应该启动无头 Chrome，用 Playwright 模拟鼠标点击“批准”。但在面向 Coding Agent 的生产研发中，这是巨大的反模式：
- **浏览器进程启动的高延迟与资源黑洞**：在 GitHub Actions 或本地 Linux Docker 中启动 Chromium 往往需要 5~10 秒，吃掉 500MB 内存，并且在缺乏 X11/Wayland 显示服务的环境中极易由于 GPU 渲染报错导致偶发崩溃（Flaky）。
- **解法：无头 WebSocket 帧级仿真（Headless Frame Emulation）**：
  Plannotator 将 Web 渲染层与核心会话协议完全解耦：
  - 测试套件直接对 `server.ts` 开启轻量 WebSocket 客户端连接；
  - 仅用纯 JavaScript 脚本向服务端发送标准的 JSON Action 帧（如 `{ type: "approve", planPath: "plan.md" }`）；
  - 断言服务端接收后能否在 5ms 内正确解挂（Resolve）`plannotator_submit_plan` 的 Promise，并让状态机准确切换为 `executing`；
  - 全套 30 个状态机与通信用例在 **120ms** 内全绿跑完，零环境污染。

### 2. 状态机不变量测试 (State-Machine Invariant Testing)
针对 `idle` -> `planning` -> `executing` -> `idle` 的异常跃迁路径进行暴力覆盖：
- 规划期突发异常中断后重启会话；
- 执行期方案文件被外部 Git 操作覆盖；
- 确保在任何异常情况下，`pi.on("tool_call")` 的写操作阻断锁不会发生「死锁无法解除」或「误阻断正常编辑」。

### 3. Turndown Markdown 往返一致性测试 (Roundtrip Fidelity)
针对富文本标注的转译，维护了一整套复杂的 HTML -> Markdown 样本库，验证多级列表、代码块、内联高亮、表格在经过用户划词涂抹后，生成的批注 Markdown 绝对不会出现语法破坏或逃逸。

---

## 7. 面向 Coding Agent 的友好度 (Coding-Agent Friendliness / DX for AI)

Plannotator 对 Coding Agent 极为温柔且体贴，几乎所有交互都经过了严谨的 Agent 人机工程学设计：

### 1. 失效现场还原：修改 systemPrompt 击穿 KV 缓存的惨剧
为什么 Plannotator 严禁用修改 `systemPrompt` 的方式同步任务清单？
- **故障 Trace**：
  1. 早期版本为了让 Agent 时刻看清待办进度，在每个 turn 结束时，把最新的清单状态动态拼接到全局 `systemPrompt` 开头；
  2. 现代大模型（Claude 3.5/3.7, DeepSeek V3）普遍采用**前缀匹配（Prefix Matching）**的 KV Cache 机制；
  3. 由于系统提示词每一轮都在动态变化，**底层 API 的 KV 缓存命中率瞬间从 98% 暴跌至 0%**！
  4. 灾难性后果：Agent 每一轮对话的首字响应延迟（TTFT）从 300 毫秒飙升至 4.5 秒，API 计费成本直线上涨 800%！
- **解法必然性**：
  Plannotator 改用 `before_agent_start` 钩子，将动态任务进度以 `customType: "plannotator-framing"`、`display: false` 的轻量消息追加在**对话的最末尾（Conversation Suffix）**。系统提示词与历史前缀 100% 保持只读稳定，实现了 **0 缓存破坏（Zero Cache Busting）**！

### 2. 结构化错误指引与写操作熔断门
在 `planning` 模式下，当失控的 Agent 试图调用 `edit` 修改生产代码时，拦截器绝不仅返回生硬的拒绝，而是给出极具指引性的自愈引导：
```
Plannotator: during planning, writes are limited to markdown files (.md, .mdx) inside the working directory. 
Blocked: src/core/auth.ts. 
Next Step: Write your proposed changes into your plan markdown file first, then call plannotator_submit_plan.
```
这种引导语能让大模型在下一轮自然修正调用，不会陷入反复尝试写文件的无意义循环。

### 3. 透明的完成度语义 ([DONE:n] Markers)
在方案执行阶段，Agent 只需要在其回复或思考中自然标注任务完成标记，扩展便能自动在后台对齐进度，无需 Agent 频繁调用繁琐的状态报告工具。


---

## 小结

`@plannotator/pi-extension` 代表了 AI 编程助手领域最高水准的**交互体验升级 (UX Paradigm Shift)**：它跳脱了纯终端字符流的桎梏，利用本地 Web 技术打造了一套安全、高带宽、符合人类直觉的评审中枢，同时通过极度克制的 Prompt 管理和文件拦截机制，为 Coding Agent 提供了坚实可靠的安全护栏。
