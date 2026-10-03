# 04 — TUI 交互体验标杆：`@juicesharp/rpiv-*` 套件（月下载 300K+）深度解剖

`@juicesharp/rpiv-*` 套件（作者：juicesharp，包括 `rpiv-ask-user-question` 与 `rpiv-todo`）是 Pi 生态中以 **“Claude Code 经典交互体验移植”** 为核心目标的标杆扩展。它们以精湛的 TUI 覆盖层设计、跨会话压缩（Compaction）的状态存活能力著称。

---

## 一、前后他要做什么（Before & After）

### 痛点前置（Before）
1. **模型在歧义时瞎猜**：
   裸 Pi 中，模型如果遇到需求不明确（如：“用哪种认证方案？”），只能输出一段纯文本询问，等待用户下一轮打字输入，无法弹出结构化的多选单或表单，交互成本极高。
2. **长线 Todo 在会话压缩后被遗忘**：
   复杂工程任务中，模型往往会在对话中列出 10 条步骤。然而当 Token 达到上限触发 Pi 的 `/compact` 压缩时，过往的历史 Todo 被高度总结压缩，导致模型后半程“忘记执行到哪一步”，丢失执行上下文。
3. **缺少常驻且不晃眼的看板**：
   开发者需要实时了解当前 Agent 的推进状态，而不是每次都往上翻滚终端看聊天记录。

### 解决方案（After）
`rpiv-*` 套件将 CC（Claude Code）的交互原语无缝搬入了 Pi：
- **`rpiv-ask-user-question`**：为模型提供结构化问答工具。模型调用该工具时，TUI 弹出带有选项的单选/多选弹窗，并在末尾自动追加 `Type something...` 自定义输入行。
- **`rpiv-todo`**：提供常驻的实时覆盖层（Live Overlay）。更关键的是，**该覆盖层能够在 `/reload` 热重载和 `/compact` 会话压缩后完美重建存活**，真正做到长任务状态不丢。

---

## 二、影响面是什么（Impact & Blast Radius）

| 维度 | 影响面与实现方式 |
|---|---|
| **Agent Loop** | 挂载 `ask_user_question` 与 `todo` 工具。当模型调用 `ask_user_question` 时，Agent 循环阻塞挂起，等待终端人类工程师按键选择，随后将结构化答案作为工具结果回传。 |
| **状态持久化与回放** | **教科书级的 Session 状态回放**。`state/replay.ts` 监听 `session_start`，主动解析当前分支历史中所有 `todo` 工具的 `details`，按 Redux Reducer 状态机重新执行一遍，无缝还原当前精确的任务看板。 |
| **TUI 界面层** | 使用 `todo-overlay.ts` 实现高性能覆盖层。在用户键入（Terminal Input）时自动支持快捷键折叠/展开，不遮挡正常的代码输出。 |
| **多语言本地化** | 内置 i18n 桥接器（`state/i18n-bridge.ts`），支持动态无缝挂载各国语言包（`locales/*.json`）。 |

---

## 三、利用了派的什么能力（Pi Capabilities Exploited）

1. **会话历史检索与重放（`sessionManager.getEntries`）**：
   深入利用了 Pi 的会话树（Session Tree）模型，依靠工具结果的 `details` 字段承载状态，避免引入外部数据库。
2. **UI 覆盖层与按键监听（TUI Primitives）**：
   - 调用 `ctx.ui.onTerminalInput` 捕获局部快捷键（如切换 Todo 显示）；
   - 使用 `@earendil-works/pi-tui` 的底层组件库构建高响应度的交互式弹窗。
3. **注册面（Register Surface）**：
   - 注册 `todo` 工具让模型自主更新进度（`pending` -> `in_progress` -> `completed`）；
   - 注册 `/todos` slash 命令供用户手动调出看板。

---

## 四、自身做了什么能力（Self-Provided Capabilities）

1. **不可变状态机与 Reducer（`state/store.ts` & `state-reducer.ts`）**：
   在插件内部实现了一套类似 Redux 的单向数据流架构，所有 Todo 的增删改查均作为 Action 由纯函数 Reducer 处理，确保任务图（Task Graph）状态严密无副作用。
2. **状态自愈与分支重放引擎（`state/replay.ts`）**：
   当用户在 Pi 终端中使用 `/tree` 跳转到过去的某个节点时，`replayFromBranch` 会自动剔除废弃分支上的 Todo，精确投影当前时间节点的状态。
3. **软可选 Peer 依赖加载机制（Dynamic Peer Loader）**：
   通过 `try { await import("@juicesharp/rpiv-i18n/loader") } catch {}` 实现优雅降级。当用户仅独立安装 `rpiv-todo` 时，降级使用内联英文文本正常运行，绝不报错崩溃。

---

## 五、核心思想与代码逻辑结构（Architecture & Code Structure）

### 1. 物理目录与模块分工（Monorepo Package 结构）

```text
packages/rpiv-todo/
├── package.json              # 声明 keywords 与 pi.extensions
├── index.ts                  # 扩展入口，负责状态预热与生命周期绑定
├── config.ts                 # 快捷键与折叠策略配置
├── todo.ts                   # todo 工具定义与 /todos 命令注册
├── todo-overlay.ts           # TUI 覆盖层组件实现
│
├── state/                    # Redux 风格状态层
│   ├── store.ts              # 集中式状态存储
│   ├── state-reducer.ts      # 纯函数状态转移机
│   ├── replay.ts             # 会话分支扫描与状态重放引擎
│   ├── selectors.ts          # 派生数据查询器
│   └── task-graph.ts         # 任务依赖图与拓扑排序
│
├── tool/                     # 工具入参与出参封包
│   ├── sanitize.ts           # 输入参数清洗与防御
│   └── types.ts              # TypeBox Schema 定义
│
├── locales/                  # 国际化语言包 (en, zh-CN, ja 等)
└── view/                     # ANSI 字符美化与对齐
```

---

### 2. 状态重放时序（如何活过 Compaction 与 /reload）

```
用户触发 /compact 或 /reload
    │
    ▼
Pi 运行时销毁旧上下文 ──► 重新加载扩展模块 ──► 触发 session_start 事件
    │
    ▼
[state/replay.ts: replayFromBranch]
    │
    ├─► 1. 调用 ctx.sessionManager.getEntries()
    │
    ├─► 2. 过滤所有属于当前有效分支历史的条目
    │        条目特征: entry.type === "message" && role === "toolResult" && toolName === "todo"
    │
    ├─► 3. 提取每次调用产生的不可变细节: entry.details.action
    │
    ├─► 4. 循环调用 stateReducer(currentState, action):
    │        Action 1: ADD_TASK { id: 1, title: "设计数据库" }
    │        Action 2: UPDATE_STATUS { id: 1, status: "completed" }
    │        Action 3: ADD_TASK { id: 2, title: "编写测试用例" }
    │
    ▼
还原最新完整任务图 (Task Graph State)
    │
    ▼
[todo-overlay.ts] 重新将 Todo 挂载至 TUI 视图顶部 (无缝恢复，用户无感)
```

---

## 六、测试资产与自动化测试考量（Testing Assets & Strategy）

1. **纯函数单测覆盖（State Reducer Unit Tests）**：
   由于核心业务逻辑完全与 UI 和 Pi 宿主解耦，`state-reducer.test.ts` 能够在零 Mock 的情况下对各种极端任务序列（如空状态更新、循环依赖任务）进行毫秒级纯逻辑断言。
2. **分支回溯场景测试（Branch Replay Simulation）**：
   构造多组复杂的 Mock Session Entries（包含分叉、回滚、Compaction 摘要记录），断言 `replayFromBranch` 是否能精准滤除非活跃分支的脏数据。

---

## 七、面向 Coding Agent 的友好度（Coding-Agent Friendliness / DX for AI）

| 考量维度 | 评级 | 真实表现与分析 |
|---|---|---|
| **架构规范性** | 极佳 (A+) | **整个生态中架构最优雅的代表**。采用成熟的 Redux 状态分层，输入清洗（`sanitize.ts`）、状态管理（`state/`）与视图呈现（`view/`）界限分明，非常符合 AI Agent 的认知模式。 |
| **可恢复性设计** | 极佳 (A+) | 不把任何关键状态留在内存单例里，全部依靠 Session 树的纯事件回放，天然对 Agent 的非确定性调用免疫。 |
| **软依赖容错** | 高 (A) | 对外围包（如 i18n）全部采用 try-catch 动态 import 降级，避免 Agent 在不完全安装依赖时跑飞。 |
| **Agent 指引文档** | 良好 (B) | 包含非常详实的类型定义与 JSDoc 注释。 |
