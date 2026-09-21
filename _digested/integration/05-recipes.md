# 05 Recipes：按产品形态选接法

> 本文已对照 v0.86.1 复核。代码示例中的 API 均按 `@earendil-works/pi-coding-agent`（SDK/RPC）与 `@earendil-works/pi-ai`（模型对象）逐一核对。

## 这张表解决什么问题

不同产品形态对 agent runtime 的需求完全不同。Web App 需要 server 包装，CLI 工具需要流式输出，IDE 插件需要深度嵌入，CI 需要一次性执行和 JSON 输出。

本文给每种形态一个**最小可行方案**。不追求完整，追求能跑。

## Recipe 1：Web App（Electron / Tauri / 自建 server）

### 场景

你有一个桌面或 Web 应用，想要一个 AI coding 助手面板。用户输入 prompt，看到 agent 的流式文本和工具卡片，可以确认权限。

### 推荐接法

**SDK in-process + 自建传输层**

```
┌─────────────────────────────────────────┐
│ 前端 (React/Vue/Svelte)                 │
│   - 聊天面板                            │
│   - 工具卡片                            │
│   - 权限弹窗                            │
└──────────────┬──────────────────────────┘
               │ IPC / WebSocket / HTTP
┌──────────────┴──────────────────────────┐
│ 后端 (Node/Bun - Electron主进程/Tauri后端) │
│   - createAgentSession()                │
│   - 事件订阅 → 推送给前端               │
│   - 前端命令 → session.prompt()          │
└──────────────────────────────────────────┘
```

### 核心代码（后端）

```ts
import { createAgentSession } from "@earendil-works/pi-coding-agent"
import { getBuiltinModel } from "@earendil-works/pi-ai/providers/all"

// 每个用户 session 一个 AgentSession
// 注意：createAgentSession 返回 { session, extensionsResult, modelFallbackMessage? }，
// 要解构出 session；model 是 Model 对象（getBuiltinModel(provider, modelId)），不是字符串
const { session } = await createAgentSession({
  cwd: projectPath,
  model: getBuiltinModel("anthropic", "claude-sonnet-4-6"),
})

// 事件 → 前端（subscribe 返回取消函数；没有 .on("event") 这种 EventEmitter API）
session.subscribe((event) => {
  sendToRenderer(event)
})

// 前端命令 → agent
onRendererMessage("prompt", async (text) => {
  await session.prompt(text)
})

onRendererMessage("abort", async () => {
  await session.abort()
})
```

### 关键点

- **权限弹窗**：在 `beforeToolCall` hook（pi-agent-core `AgentOptions`/`AgentLoopConfig`）中实现。当 tool 需要确认时，先不执行，推送到前端展示确认对话框，等待用户决策后继续。
- **多 session**：每个用户或每个项目一个 AgentSession 实例。
- **重连**：前端断连重建时，用 `session.messages` 和 `session.state` getter（不是 `getMessages()`/`getState()` 方法）恢复上下文；`session.getSessionStats()` 给 token 统计。收尾时调 `session.dispose()`。

## Recipe 2：CLI 脚本 / CI Pipeline

### 场景

你在 CI pipeline 中跑 pi-mono 做自动代码审查、自动修 bug、自动生成 changelog。只需要结果，不需要交互。

### 推荐接法

**RPC 子进程 + 超时控制**

```bash
#!/bin/bash
# 启动 agent（stdin 必须保持连接，命令从 stdin 写入）
mkfifo /tmp/pi-in
node dist/cli.js --mode rpc --provider anthropic --model claude-sonnet-4-6 < /tmp/pi-in > /tmp/pi-out &
AGENT_PID=$!
exec 3> /tmp/pi-in   # 保持 FIFO 打开

# 发送任务
echo '{"type":"prompt","message":"review this PR and report issues"}' >&3

# 轮询 /tmp/pi-out，看到 {"type":"event","event":{"type":"agent_settled"}} 即完成
# （stdout 每行要么是命令应答 {"type":"response",...}，要么是带外层 {"type":"event",...} 的事件行）
kill $AGENT_PID
```

更稳健的做法是用 RpcClient（从包根导出，构造参数 `{ cliPath?, cwd?, env?, provider?, model?, args? }`）：

```ts
import { RpcClient } from "@earendil-works/pi-coding-agent"

const client = new RpcClient({
  cwd: "/path/to/repo",
  provider: "anthropic",
  model: "claude-sonnet-4-6",
})

await client.start() // 必须：spawn `node dist/cli.js --mode rpc ...`

const unsubscribe = client.onEvent((event) => {
  // RpcClient.onEvent 拿到的已是剥掉外层 {"type":"event",...} 的 JsonAgentSessionEvent
  if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta)
  }
})

// prompt() 只负责发送（返回 void）；promptAndWait() 发送并收集事件直到 agent_settled
const events = await client.promptAndWait("review the code for security issues", undefined, 120_000)
unsubscribe()

// 拿最终文本走 RPC 命令，而不是解析事件流
const text = await client.getLastAssistantText() // get_last_assistant_text

await client.stop() // 不是 close()
```

### 关键点

- **超时**：`promptAndWait`/`waitForIdle`/`collectEvents` 默认 60s 超时；每个命令的响应另有 30s 超时。CI 里按任务时长显式传 timeout。
- **非交互**：agent 模式下权限应该设为宽松（允许所有工具）或用 hook 自动拒绝高风险操作。
- **输出格式**：如果需要机器可读输出，用 `getLastAssistantText()`（`get_last_assistant_text` 命令）或解析事件流中的 `message_update` delta 事件，自己构建 JSON 输出。
- **exit code**：基于 agent 是否成功完成任务来决定 exit 0 还是 1。

## Recipe 3：本地后台任务 / Supervisor

### 场景

你有一个常驻的后台进程，管理多个 pi-mono agent 实例。每个实例看一个项目或一个分支，定时巡检或响应事件。

### 推荐接法

**RPC 子进程（每个 agent 一个进程）+ supervisor 管理生命周期**

```ts
import { RpcClient } from "@earendil-works/pi-coding-agent"

class AgentWorker {
  private client: RpcClient
  private status: "idle" | "running" = "idle"

  constructor(private repoPath: string) {
    this.client = new RpcClient({
      cwd: repoPath,
      provider: "anthropic",
      model: "claude-haiku-4-5",
    })
  }

  async start() {
    await this.client.start()
  }

  async runTask(prompt: string) {
    this.status = "running"
    try {
      // prompt() 发送后立即返回；等待完成用 waitForIdle()（监听 agent_settled 事件）
      await this.client.prompt(prompt)
      await this.client.waitForIdle(5 * 60_000)
    } finally {
      this.status = "idle"
    }
  }

  async shutdown() {
    await this.client.stop()
  }
}

// Supervisor
const workers = new Map<string, AgentWorker>()

async function dispatchTask(repo: string, task: string) {
  if (!workers.has(repo)) {
    workers.set(repo, new AgentWorker(repo))
  }
  const worker = workers.get(repo)!
  if (worker.status === "idle") {
    await worker.runTask(task)
  }
}
```

### 关键点

- **进程隔离**：每个 agent 独立进程，一个崩溃不影响其他。
- **资源控制**：限制并发 agent 数，避免资源耗尽。
- **健康检查**：如果 agent 进程僵死或超时，kill 并 restart（`RpcClient` 会把子进程退出码汇成 error 抛给 pending 请求）。
- **队列**：通过 `setSteeringMode`/`setFollowUpMode`（命令 `set_steering_mode`/`set_follow_up_mode`，取值 `"all" | "one-at-a-time"`）控制并发。

## Recipe 4：IDE 插件（VS Code / JetBrains）

### 场景

你的 IDE 插件需要一个 AI coding 助手。用户可以在侧边栏聊天、内联编辑、看到 diff 预览。

### 推荐接法

**SDK in-process（VS Code extension 的 Node 进程）**

IDE 插件的扩展进程本身就是 Node 环境，SDK 可以直接在里面运行：

```ts
// VS Code extension
import * as vscode from "vscode"
import { createAgentSession } from "@earendil-works/pi-coding-agent"

export async function activate(context: vscode.ExtensionContext) {
  // createAgentSession 返回 { session, ... }，需解构
  const { session } = await createAgentSession({
    cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd(),
    model: resolveModelFromConfig(), // Model 对象
  })

  // 事件 → VS Code UI（subscribe，不是 .on("event")）
  session.subscribe((event) => {
    if (event.type === "message_update") {
      chatPanel.applyDelta(event.assistantMessageEvent)
    }
    if (event.type === "tool_execution_end" && event.toolName === "edit") {
      // 触发 diff 预览（event: { toolCallId, toolName, result, isError }）
      diffPanel.showDiff(event.result)
    }
  })

  // 注册 VS Code 命令
  vscode.commands.registerCommand("pi.prompt", async () => {
    const text = await vscode.window.showInputBox({ prompt: "What should I do?" })
    if (text) await session.prompt(text)
  })

  vscode.commands.registerCommand("pi.abort", () => session.abort())
}
```

### 关键点

- **cwd**：设为 VS Code workspace 根目录，让 agent 有正确的文件访问上下文。
- **权限**：在 `beforeToolCall` 中集成 IDE 的确认对话框。
- **Diff**：`edit` 和 `write` 工具完成后，用 VS Code 的 DiffEditor 展示变更。
- **配置**：从 VS Code settings 读 provider/apiKey/model 配置。

## Recipe 5：非 JS/TS 语言集成（Python / Go / Rust）

### 场景

你的后端是 Python/Go/Rust，想调用 pi-mono 做代码分析或自动修复。

### 推荐接法

**RPC 子进程 + JSONL 协议**

在 Python 中实现：

```python
import subprocess
import json

class PiAgent:
    def __init__(self, cwd=".", provider="anthropic", model="claude-sonnet-4-6"):
        self.process = subprocess.Popen(
            ["node", "dist/cli.js", "--mode", "rpc",
             "--provider", provider, "--model", model],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            cwd=cwd,
            text=True,
        )

    def send(self, command: dict) -> None:
        line = json.dumps(command) + "\n"
        self.process.stdin.write(line)
        self.process.stdin.flush()

    def read_response(self) -> dict:
        line = self.process.stdout.readline()
        return json.loads(line)

    def prompt(self, message: str):
        # v0.84.2 协议（rpc-types.ts / rpc-mode.ts）：
        #   stdout 上混合两类行——事件行和命令应答行
        #   事件行：{"type":"event","event":{...AgentSessionEvent（message_update 已裁成纯 delta）...}}
        #   应答行：{"id":..., "type":"response","command":...,"success":true/false,"data":...}
        #           （prompt 的 preflight 成功也会先发一条 success 应答，表示"已接受"）
        # 一轮 prompt 的完成信号是 type=="event" 且 event.type=="agent_settled"
        self.send({"type": "prompt", "message": message})
        while True:
            line = self.read_response()
            if line.get("type") == "event" and line["event"]["type"] == "agent_settled":
                break
            if line.get("type") == "response":
                continue  # 命令应答，流式场景可忽略
            yield line

    def close(self):
        self.process.terminate()
```

### 关键点

- **JSONL 成帧**：只用 `\n` 分割，不要用 Python 的 `splitlines()`（它会把 U+2028/U+2029 等 Unicode 行分隔符也当作换行，而它们在 JSON 字符串里合法——这正是 `jsonl.ts` 不用 Node readline 的原因）。
- **编码**：stdin/stdout 使用 UTF-8。
- **进程管理**：确保 agent 进程在宿主退出时被 kill。
- **超时**：设置读写超时，避免卡死。
- **其他路径**：多客户端/远程场景可评估 experimental 的 `@earendil-works/pi-client` + `pi-server`（CBOR framing，见 `integration/02-advanced.md`）；不想手写成帧的话，把 `rpc-client.ts` 的 JSONL 语义移植过去即可。

## 各 Recipe 对比

| Recipe | 集成方式 | 事件通道 | 权限模型 | 进程模型 |
|---|---|---|---|---|
| Web App | SDK in-process | `session.subscribe` + IPC/WS | hook 阻断 + 前端弹窗 | 主进程内 |
| CLI/CI | RPC 子进程 | JSONL stdout | 宽松/自动拒绝 | 子进程 |
| 后台 Supervisor | RPC 子进程 | JSONL stdout | hook 阻断 | 每 worker 一进程 |
| IDE 插件 | SDK in-process | `session.subscribe` | hook 阻断 + IDE 对话框 | 扩展进程内 |
| 非 JS 语言 | RPC 子进程 | JSONL stdout | 宽松/自建交互 | 子进程 |

## 进阶组合

- **多 agent 协作**：spawn 多个 RPC 子进程，通过 supervisor 分配任务。
- **Session 持久化**：通过 `SessionManager` 的本地 JSONL 文件实现重启恢复。
- **自定义工具**：SDK 路线通过 `createAgentSession({ customTools })` 注入业务工具；RPC 路线上子进程不接受 customTools，需把工具做成 extension/skill 装进 agent 侧（`~/.pi/agent` 或项目 `.pi/`）再走 RPC。

## 常见陷阱

1. **promise 不等于完成**：`session.prompt()`（SDK）与 `client.prompt()`（RPC）都在消息入队/发送后立即返回，agent 可能还在运行工具。SDK 等 `session.waitForIdle()` 或 `agent_settled` 事件；RPC 用 `client.waitForIdle()`/`promptAndWait()`——协议里没有 `ended` 消息。
2. **多次同时 prompt**：Agent 有队列模式控制，默认 steering `one-at-a-time`（串行）。如果需要同时处理多个 prompt，用多个 AgentSession/RpcClient 实例。
3. **cwd 不一致**：Agent 的 cwd 决定了它能看到哪些文件。确保 cwd 和宿主预期的项目根目录一致。
4. **进程不清理**：RPC 子进程在宿主退出时必须 kill（`await client.stop()`；异常路径用 `process.on("exit", ...)` 兜底）。SDK 侧对应 `session.dispose()`。
5. **自定义 provider（v0.86.0 起）**：pi-ai 的 provider 输入已改为 branded `TranscriptContext`（#9548）——自定义 `StreamFunction` 不能再读 `context.systemPrompt`/`context.tools`，必须用 `getCurrentSystemPrompt()`/`getCurrentTools()` 从 `context.messages` 重放；`ToolCall.arguments`/`ToolResultMessage.details` 只接受 JSON 兼容值。详见 03 的警示与 [`packages/ai/README.md`](../../packages/ai/README.md)。扩展侧想调已配置的模型，直接用 `ctx.modelRegistry.stream()/streamSimple()`（#8964），不用自己管 key。
6. **报障渠道（v0.86.0 起）**：pi 自带 `/bug [description]`（interactive mode）打包 redact 后的环境/model/extension 元数据生成报告（zip 或上传 Radius gateway），崩溃记入 `~/.pi/agent/crashes.json` 并在下次启动通告。宿主集成遇到问题需要用户提交诊断信息时，可提示走这条路径；自建 harness 的等价物需自己实现。
