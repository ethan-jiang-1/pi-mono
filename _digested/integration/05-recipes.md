# 05 Recipes：按产品形态选接法

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
import { createAgentSession } from "pi-mono/coding-agent"

// 每个用户 session 一个 AgentSession
const agent = await createAgentSession({
  cwd: projectPath,
  model: userModel,
})

// 事件 → 前端
agent.on("event", (event) => {
  sendToRenderer(event)
})

// 前端命令 → agent
onRendererMessage("prompt", async (text) => {
  await agent.prompt(text)
})

onRendererMessage("abort", async () => {
  await agent.abort()
})
```

### 关键点

- **权限弹窗**：在 `beforeToolCall` hook 中实现。当 tool 需要确认时，先不执行，推送到前端展示确认对话框，等待用户决策后继续。
- **多 session**：每个用户或每个项目一个 AgentSession 实例。
- **重连**：前端断连重建时，调 `agent.getMessages()` 和 `agent.getState()` 恢复上下文。

## Recipe 2：CLI 脚本 / CI Pipeline

### 场景

你在 CI pipeline 中跑 pi-mono 做自动代码审查、自动修 bug、自动生成 changelog。只需要结果，不需要交互。

### 推荐接法

**RPC 子进程 + 超时控制**

```bash
#!/bin/bash
# 启动 agent
node dist/cli.js --mode rpc --provider anthropic --model claude-sonnet-4-6 &
AGENT_PID=$!

# 发送任务
echo '{"type":"prompt","message":"review this PR and report issues"}' 

# 等待完成
wait $AGENT_PID
```

更稳健的做法是用 RpcClient：

```ts
import { RpcClient } from "pi-mono/coding-agent/rpc"

const client = new RpcClient({
  cwd: "/path/to/repo",
  provider: "anthropic",
  model: "claude-sonnet-4-6",
})

client.on("event", (event) => {
  if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta)
  }
})

// 发送 prompt 并等待完成
const result = await client.prompt("review the code for security issues")
console.log("Done:", result.messageId)

client.close()
```

### 关键点

- **超时**：设置合理的超时时间，避免 CI job 卡死。
- **非交互**：agent 模式下权限应该设为宽松（允许所有工具）或用 hook 自动拒绝高风险操作。
- **输出格式**：如果需要机器可读输出，用 `get_last_assistant_text` 或解析事件流中的 `message_update` delta 事件，自己构建 JSON 输出。
- **exit code**：基于 agent 是否成功完成任务来决定 exit 0 还是 1。

## Recipe 3：本地后台任务 / Supervisor

### 场景

你有一个常驻的后台进程，管理多个 pi-mono agent 实例。每个实例看一个项目或一个分支，定时巡检或响应事件。

### 推荐接法

**RPC 子进程（每个 agent 一个进程）+ supervisor 管理生命周期**

```ts
import { RpcClient } from "pi-mono/coding-agent/rpc"

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

  async runTask(prompt: string) {
    this.status = "running"
    try {
      await this.client.prompt(prompt)
    } finally {
      this.status = "idle"
    }
  }

  async shutdown() {
    this.client.close()
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
- **健康检查**：如果 agent 进程僵死或超时，kill 并 restart。
- **队列**：通过 `steering_mode` 和 `follow_up_mode` 控制并发。

## Recipe 4：IDE 插件（VS Code / JetBrains）

### 场景

你的 IDE 插件需要一个 AI coding 助手。用户可以在侧边栏聊天、内联编辑、看到 diff 预览。

### 推荐接法

**SDK in-process（VS Code extension 的 Node 进程）**

IDE 插件的扩展进程本身就是 Node 环境，SDK 可以直接在里面运行：

```ts
// VS Code extension
import * as vscode from "vscode"
import { createAgentSession } from "pi-mono/coding-agent"

export function activate(context: vscode.ExtensionContext) {
  const agent = await createAgentSession({
    cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd(),
    model: resolveModelFromConfig(),
  })

  // 事件 → VS Code UI
  agent.on("event", (event) => {
    if (event.type === "message_update") {
      chatPanel.applyDelta(event.assistantMessageEvent)
    }
    if (event.type === "tool_execution_end" && event.toolName === "edit") {
      // 触发 diff 预览
      diffPanel.showDiff(event.result)
    }
  })

  // 注册 VS Code 命令
  vscode.commands.registerCommand("pi.prompt", async () => {
    const text = await vscode.window.showInputBox({ prompt: "What should I do?" })
    if (text) await agent.prompt(text)
  })

  vscode.commands.registerCommand("pi.abort", () => agent.abort())
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
        self.send({"type": "prompt", "message": message})
        while True:
            resp = self.read_response()
            if resp["type"] == "event":
                yield resp["event"]
            elif resp["type"] == "ended":
                break

    def close(self):
        self.process.terminate()
```

### 关键点

- **JSONL 成帧**：只用 `\n` 分割，不要用 Python 的 `splitlines()`（它会把 JSON 字符串内的 `\n` 也分割）。
- **编码**：stdin/stdout 使用 UTF-8。
- **进程管理**：确保 agent 进程在宿主退出时被 kill。
- **超时**：设置读写超时，避免卡死。

## 各 Recipe 对比

| Recipe | 集成方式 | 事件通道 | 权限模型 | 进程模型 |
|---|---|---|---|---|
| Web App | SDK in-process | EventEmitter + IPC/WS | hook 阻断 + 前端弹窗 | 主进程内 |
| CLI/CI | RPC 子进程 | JSONL stdout | 宽松/自动拒绝 | 子进程 |
| 后台 Supervisor | RPC 子进程 | JSONL stdout | hook 阻断 | 每 worker 一进程 |
| IDE 插件 | SDK in-process | EventEmitter | hook 阻断 + IDE 对话框 | 扩展进程内 |
| 非 JS 语言 | RPC 子进程 | JSONL stdout | 宽松/自建交互 | 子进程 |

## 进阶组合

- **多 agent 协作**：spawn 多个 RPC 子进程，通过 supervisor 分配任务。
- **Session 持久化**：通过 `SessionManager` 的本地 JSONL 文件实现重启恢复。
- **自定义工具**：SDK 路线通过 `customTools` 注入业务工具；RPC 路线上自定义工具需要修改 coding-agent 打包。

## 常见陷阱

1. **promise 不等于完成**：`session.prompt()` 返回后 agent 可能还在运行工具。等 `agent_settled` 事件（SDK）或 `ended` 消息（RPC）。
2. **多次同时 prompt**：Agent 有队列模式控制，默认 steering 串行化。如果需要同时处理多个 prompt，用多个 AgentSession 实例。
3. **cwd 不一致**：Agent 的 cwd 决定了它能看到哪些文件。确保 cwd 和宿主预期的项目根目录一致。
4. **进程不清理**：RPC 子进程在宿主退出时必须 kill。用 `process.on("exit", ...)` 注册清理。
