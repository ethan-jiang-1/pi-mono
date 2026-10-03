# 05 — 长任务与代理网关典范：`pi-background-tasks`（月下载 108K）深度解剖

`pi-background-tasks`（作者：Ismail Salikhodjaev，版本 2.6.9）是 Pi 生态中**工程规范最严苛、对 Coding Agent 最友好**的代表性项目。它不仅解决了终端长耗时命令与后台执行的核心痛点，其仓库内直接包含专门写给 AI Agent 的治理规范（`BACKGROUND-TASKS-INSTRUCTIONS.md`）和证明 Pi 内部行为的契约测试链（Hook Contract Evidence）。

---

## 一、前后他要做什么（Before & After）

### 痛点前置（Before）
1. **长耗时命令冻结终端**：
   在常规 Pi 会话中，运行一个耗时 15 分钟的构建命令（如 `npm run build`、Docker 镜像打包或长测试套件），会完全阻塞前台交互，开发者只能干等，无法在同会话中进行其他文件查阅或讨论。
2. **后台进程失控与“孤儿”泄漏**：
   如果简单粗暴地在 `bash` 工具中使用 `&` 后台运行命令，Pi 无法获知子进程的状态、无法实时抓取日志、更无法在用户中断会话时可靠杀死子进程。
3. **不可逆副作用风险**：
   委派子任务时，若子代理随意执行了不可逆的写入操作，可能损坏宿主环境。

### 解决方案（After）
`pi-background-tasks` 在系统级构建了**持久化后台任务与受控委派沙箱**：
- **持久化后台 Shell 运行（`bg_run`）**：在受控 PTY/管道中启动命令，立即向模型返回 Task ID，前台不卡顿。
- **全生命周期轮询与干预**：提供 `bg_status`（查进度）、`bg_logs`（按行/字节拉日志）、`bg_kill`（可靠杀进程）和 `bg_result`（原子取结果）。
- **只读受控委派代理（`bg_delegate`）**：启动子代理进行只读探索（降权为仅可调用 `read`、`grep`、`find`、`ls`），探索完成将产物哈希落盘后回传。
- **多模型融合评测（Fusion Workflows）**：支持将同一个棘手问题同时分发给不同的底层模型，通过 Evaluator/Merger 自动汇总优选解法。

---

## 二、影响面是什么（Impact & Blast Radius）

| 维度 | 影响面与实现方式 |
|---|---|
| **Agent Loop** | 赋予 Agent “异步轮询与后台调度”心智。Agent 可以先下发长命令，接着思考或查阅代码，稍后再通过 `bg_status` 查看是否结束。 |
| **文件系统与持久化** | 严格规范任务运行时目录：`.pi/tasks/<session-id>-<pid>/`。所有的标准输出、错误流、元数据与退出码均作为物理文件持久化并附带校验哈希。 |
| **Token 预算** | **极高效率控制**。通过 `bg_logs` 支持偏移量分页拉取（`offset` / `limit`），避免长命令数万行日志无脑灌入上下文。 |
| **进程安全与回收** | 采用系统级信号追踪。在 Pi 退出或子任务超时时，使用进程组（Process Group）强制 SIGTERM/SIGKILL，杜绝僵尸进程。 |

---

## 三、利用了派的什么能力（Pi Capabilities Exploited）

1. **多入口复合加载（Multi-entrypoint Extensions）**：
   在 `package.json` 的 `pi.extensions` 中按严格时序声明两个入口：
   `dist/extensions/anthropic-attribution.js` 先加载（规避模型调用风控），随后加载 `dist/extensions/background-tasks.js`。
2. **注册面（Register Surface）**：
   - 注册母体工具集：`bg_run`、`bg_status`、`bg_logs`、`bg_kill`、`bg_result`、`bg_delegate`；
   - 注册子代理降权工具集：在派生子实例时，只给子代理注入只读检查工具；
   - 注册 `/bg`、`/tasks` slash 命令用于人工可视化查看任务列表。
3. **深入底层 Hook 契约（Hook Contract）**：
   深入利用了 Pi 的 `context`（模型请求前拦截）与 `tool_result`（结果落盘前改写）接缝，在子代理试图越权时强行 abort 并抹除敏感数据。

---

## 四、自身做了什么能力（Self-Provided Capabilities）

1. **PTY 伪终端与流式持久化引擎（`core/durable-fs.ts`）**：
   实现了一套带原子锁与哈希校验的文件持久层，命令的所有 stdout/stderr 实时刷盘，支持多进程安全读取。
2. **父子代理权能天花板（Capability Ceiling）**：
   在 `src/delegate-child-extension.ts` 中构建了硬核安全护栏：子代理即便收到模型越权调用写工具的指令，也会在扩展层被直接拦截阻断。
3. **真实 Hook 行为固化证据链（Hook Contract Evidence）**：
   不仅是写代码，还在仓库中维护了 `pi-hook-contract-evidence.json`，在每次构建时运行实测，确保上游 Pi 的事件派发机制未发生语义漂移。

---

## 五、核心思想与代码逻辑结构（Architecture & Code Structure）

### 1. 物理目录与模块分工

```text
pi-background-tasks/
├── package.json              # 极度严苛的构建、测试与门禁脚本声明
├── BACKGROUND-TASKS-INSTRUCTIONS.md # 【面向 AI Agent 的强制驾驶网关】
├── TESTING.md                # 测试方法论与测试命令总则
├── TEST_PLAN.md              # 完整的全场景功能覆盖矩阵
│
├── extensions/               # Pi 加载入口点
│   ├── background-tasks.ts   # 主扩展导出
│   ├── delegate-child.ts     # 降权子代理扩展入口
│   └── anthropic-attribution.ts # 认证前置扩展
│
├── src/                      # 核心业务实现
│   ├── extension.ts          # bg_* 系列工具的主调度器
│   ├── delegate-extension.ts # bg_delegate 派生控制器
│   ├── delegate-child-extension.ts # 子代理安全防护层
│   └── core/
│       ├── extension-api.ts  # 内部事件总线 (EventBus v1)
│       ├── durable-fs.ts     # 任务输出落盘与原子读写
│       └── pi-launch.ts      # 子 Pi 进程解析与启动参数组装
│
└── docs/                     # 完备的子系统设计文档与契约映射
```

---

### 2. 核心执行流转时序（后台执行与安全获取）

```
Agent 发起长任务: bg_run({ command: "cargo build --release" })
    │
    ▼
[src/extension.ts]
    │  ├─ 1. 在 .pi/tasks/ 下创建任务工作区 (task-987)
    │  ├─ 2. 派生独立子进程，将 stdout/stderr 重定向至 durable 日志文件
    │  └─ 3. 立即返回 AgentToolResult: { taskId: "task-987", status: "running" }
    ▼
Agent 继续处理其他事务（不阻塞终端）
    │
    ══════════════════════════════════════════════════════════════════
[数分钟后，Agent 决定检查任务]
    │
    ▼
Agent 发起查询: bg_status({ taskId: "task-987" })
    │
    ▼
[src/extension.ts]
    │  ├─ 读取 task-987 的状态文件
    │  ├─ [仍在线] ──► 返回: { status: "running", elapsedMs: 182000 }
    │  └─ [已结束] ──► 返回: { status: "completed", exitCode: 0, outputBytes: 45020 }
    ▼
Agent 决定查看尾部日志: bg_logs({ taskId: "task-987", tailLines: 50 })
    │
    ▼
从 durable 文件中截取末尾 50 行纯净输出返回给模型
```

---

## 六、测试资产与自动化测试考量（Testing Assets & Strategy）

### 1. 深度剖析：为什么必须设立 Hook 契约证据比对（`test:hook-contract`）？
在后台任务这种重度依赖宿主底层事件（`turn_start`, `agent_settled`, `context`）的插件中，最大的隐形杀手是**上游宿主框架（Pi-mono）的微小行为突变**。
- **历史真实血泪现场**：
  在 Pi 早期版本中，扩展开发者普遍假设：“如果在 `context` 钩子中抛出异常，宿主就会中止（Abort）即将发出的网络请求”。
  但当作者使用**脚本化虚拟 Provider（Scripted Provider）**进行物理实测时，赫然发现：**Pi 宿主为了鲁棒性，吞掉了 context 钩子里的异常，并继续把网络请求发了出去！**
  如果插件误以为 throw 能阻断请求，就会导致敏感长任务在未鉴权的情况下泄漏数据。
- **解法：字节级契约证据锁（`pi-hook-contract-evidence.json`）**：
  - 测试套件每次使用固定脚本的离线虚拟 Provider 完整驱动一轮 Pi Agent 循环；
  - 将所有事件的触发顺序、传参结构、返回值影响完整序列化为 JSON 证据文件；
  - 测试断言直接拿运行时证据与仓库中固化的 `pi-hook-contract-evidence.json` 进行**字节级对齐比对**。
  - **杜绝 Coding Agent 的自欺欺人**：如果上游行为发生了变化，测试立即报红；并且 CI 明文禁止 Agent 随意修改 `evidence.json`，彻底剥夺了 Agent“改测试来迎合 Bug”的投机路径。

### 2. 本案采取的 LLM 伪装思路：确定性脚本化 Provider（Deterministic Scripted Provider）
`pi-background-tasks` 是全生态唯一将 **LLM 虚拟化** 做到极致的代表。它不通过网络拦截，而是直接在 Pi 的 Provider 注册层插桩，实现了一个 `DeterministicScriptedProvider`：

```typescript
// tests/scripted-provider/scripted-provider.ts
export class DeterministicScriptedProvider implements ProviderAPI {
  private scriptQueue: ScriptedTurn[] = [];

  enqueueTurn(turn: ScriptedTurn) {
    this.scriptQueue.push(turn);
  }

  // 伪装 streamComplete 接口
  async *streamComplete(messages: Message[], options: ProviderOptions) {
    const nextTurn = this.scriptQueue.shift();
    if (!nextTurn) throw new Error("Script queue exhausted unexpectedly");

    // 1. 模拟 LLM 吐出工具调用帧
    if (nextTurn.type === "tool_call") {
      yield {
        type: "tool_call_chunk",
        toolCall: { id: "call-1", name: "bg_delegate", input: nextTurn.input }
      };
      return;
    }

    // 2. 模拟 LLM 总结文本帧
    yield { type: "text_chunk", text: nextTurn.responseMessage };
  }
}
```

- **Mock 的核心设计思路**：
  1. **驱动真实的 Pi Agent 循环**：宿主代码不改一行，依然走完所有会话历史加载、提示词拼装与钩子分发；
  2. **剧本化编排**：用例预先塞入：`Turn 1 -> 发起 bg_delegate 调用`；`Turn 2 -> 接收工具执行结果并返回完成`；
  3. **捕获契约事实（Characterisation）**：在假模型和真宿主的交互中，完整记录 `context` 钩子是否在 `streamComplete` 前执行、异常是否被捕获。这种思路把“大模型的不确定性”剥离得干干净净，只留下宿主与插件契约的纯净物理断言。

### 3. 七重门禁流水线（Default Gate Pipeline）
运行 `npm test` 自动串联执行严格的分层校验：
`typecheck` -> `test:type-safety` -> `test:unit` -> `test:sdk` -> `test:rpc` -> `test:component` -> `test:package` -> `test:hook-contract`。
全链路在无真实 LLM、无网络、纯本地伪终端的受控环境下，数十秒内完成严密自证。

---

## 七、面向 Coding Agent 的友好度（Coding-Agent Friendliness / DX for AI）

### 1. 失效现场还原：Mandatory Agent Gateway 诞生记
为什么这个仓库会诞生全生态唯一的 `BACKGROUND-TASKS-INSTRUCTIONS.md`？
- **故障 Trace（AI 代理的“愚蠢重构”灾难）**：
  1. 人类开发者给 Claude Code / Cursor / Pi 下达指令：“优化后台任务的状态轮询性能”；
  2. Coding Agent 阅读了代码，发现系统同时在 `turn_start` 和 `agent_settled` 两个地方检查任务状态；
  3. Agent 凭借预训练中的“代码去重（DRY 原则）”偏见，认为这是“低效冗余代码”，直接删除了 `agent_settled` 的备用轮询网关，并把双环合并为一个简单的全局 `setInterval`；
  4. 结果灾难发生：Node.js 单线程里的 `setInterval` 导致终端 UI 在模型流式输出时产生严重卡顿，且任务完成事件在 Agent 思考结束前再也无法及时投递！
- **解法必然性**：作者被迫在仓库根目录建立了专属的 **Mandatory Agent Gateway**，在首行以极其严厉的语气写道：
  > *"This gateway is for AI agents maintaining this package. Read this file BEFORE modifying any code. Rule 1: No self-certification. Rule 2: Do NOT merge the dual polling loops — they serve distinct lifecycle boundaries."*
  这份说明书以绝对权威的方式，彻底降服了 Coding Agent 的盲目重构冲动。

### 2. Coding Agent 维护友好度综合评级

| 考量维度 | 评级 | 真实表现与底层机理 |
|---|---|---|
| **Agent 专属指引** | 行业标杆 (S) | **全生态唯一提供 `BACKGROUND-TASKS-INSTRUCTIONS.md` 的项目**。规定了严格的“修改前必读顺序”、“硬性纪律”与“禁用的工具”，消灭了 AI 代理盲目重构带来的回归 Bug。 |
| **确定性与无自证** | 极佳 (A+) | 明文规定“代码是运行时的最高权威，文档服从代码；严禁自证（No self-certification）”，必须通过 `docs:verify:attestations` 进行机器断言。 |
| **错误自愈与诊断** | 极佳 (A+) | 包含 `docs/operations/troubleshooting.md`，每个报错都有对应的症状定位（Symptom Triage），Agent 读到报错即可直接按表索骥自我修复。 |
| **测试执行速度** | 优秀 (A) | 将离线 SDK 测试与重型 PTY 测试严格解耦，单测在毫秒级跑完，极大提升 Agent 编码反馈回路。 |

