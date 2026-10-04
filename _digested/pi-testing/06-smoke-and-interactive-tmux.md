# 06 — 二进制本地 SSE 桩与 Tmux 受控交互测试：端到端冒烟工程学

> **源码锚点**：
> - 独立二进制 SSE 冒烟测试：`scripts/smoke-test-codemode-binary.mjs`（179 行）
> - 终端交互式冒烟规程：`.pi/skills/interactive-testing.md`
> - 发布流程前置检查：`AGENTS.md`（"Testing pi Interactive Mode with tmux"）

---

## 一、发布期的“最后一公里”挑战

在现代 Agent 研发中，即便所有的 TypeScript 单测和 Harness 集成测试全部通过，发布独立的发布产物（Standalone Binary，如通过 pkg、Bun compile 或 Sea 打包的单文件二进制）时，仍然存在三大致命盲区：

1. **二进制打包漏包（Bundling Amnesia）**：打包工具可能遗漏了某个非 JS 资产（如 QuickJS 的 `.wasm` 文件、原生 C++ 绑定 `.node` 或默认主题配置）；
2. **多进程与沙箱通信故障**：打包成单文件后，二进制内部通过 `worker_threads` 启动子工作线程可能因路径重定向失败；
3. **真实 TTY 交互崩溃**：在未接入真正终端驱动的情况下，单纯的无头单元测试无法验证交互界面的按键响应与光标恢复。

Pi-mono 通过两套精巧的冒烟体系化解了上述难题：**本地微型 SSE HTTP 桩测试** 与 **基于 tmux 的受控终端屏显录制测试**。

---

## 二、解密 smoke-test-codemode-binary.mjs：本地微型 SSE 仿真服务器

Pi v1.0.0 引入了 `codemode`（在独立的 QuickJS 沙箱中执行模型编写的代码）。为了测试编译后的独立可执行二进制文件是否能正常工作，`smoke-test-codemode-binary.mjs` 展现了令人叹为观止的测试微架构设计：

```
[smoke-test 启动]
       │
       ├── 1. Node 本地起原生 HTTP 服务: listen(0, "127.0.0.1") (随机可用端口)
       ├── 2. mkdtemp 构造临时运行目录
       │
       ▼
[子进程: spawn(piBinary, ["--model", "custom:http://127.0.0.1:port", ...])]
       │
       ▼ 向本地 HTTP 发起 POST /chat/completions
[本地微型 SSE 服务]
       │
       ├─► Request 1: 吐出 Server-Sent Events (SSE) 流:
       │     data: { tool_calls: [{ name: "codemode", arguments: { code: 'text("PI_CODEMODE_WORKER_OK")' } }] }
       │     data: [DONE]
       ▼
[piBinary 执行 QuickJS Worker]
       │
       ▼ 将执行产物带回 Request 2: POST /chat/completions (带回 tool_result)
[本地微型 SSE 服务]
       │
       ├─► 检查 Payload 是否包含标记: "PI_CODEMODE_WORKER_OK"
       ├─► 若包含 ──► 返回最终 SSE: { content: "PI_CODEMODE_BINARY_SMOKE_OK" }
       └─► 若缺失 ──► 返回最终 SSE: { content: "PI_CODEMODE_BINARY_SMOKE_FAILED" }
       ▼
[smoke-test 断言]
       └─► 断言二进制退出码为 0，且终端输出包含 SUCCESS 标记
```

### 为什么这种设计极度优越？
1. **零外部网络开销**：在测试独立的打包二进制时，根本不需要连接真正的 OpenAI 或 Anthropic API，本地随机端口自建的 HTTP 桩就是最完美的兼容网关；
2. **协议级闭环断言**：它完整穿透了：**二进制加载 -> 配置解析 -> HTTP 客户端通信 -> 接收 SSE 流 -> 调度 Worker 线程 -> QuickJS 沙箱求值 -> 工具结果回传 -> 进程正常退出** 的全生命链路。

---

## 三、解密 tmux 受控交互测试（Interactive Testing with tmux）

在发布正式 Release 版本前，Pi-mono 在 `.pi/skills/interactive-testing.md` 中强制规定了基于 `tmux` 的交互冒烟流程。

### 1. 受控无头终端编排
```bash
# 1. 创建固定尺寸 (80x24) 的隔离 tmux 会话
tmux new-session -d -s pi-test -x 80 -y 24

# 2. 注入启动命令 (指定 release 二进制绝对路径)
tmux send-keys -t pi-test "./pi-test.sh" Enter

# 3. 稍候启动并捕获第一屏字符
sleep 3 && tmux capture-pane -t pi-test -p

# 4. 模拟输入真实 prompt 并回车
tmux send-keys -t pi-test "your prompt here" Enter

# 5. 模拟特殊功能键 (如 Escape, Ctrl+O, Ctrl+P)
tmux send-keys -t pi-test Escape

# 6. 回收会话
tmux kill-session -t pi-test
```

### 2. 发布验收规范的冷酷铁律
文档明确告诫：
> *"For release smoke tests, start the tmux session with `-c /tmp` and replace `./pi-test.sh` with the absolute path to the release binary. Test both Node and Bun binaries separately, submit a prompt, and wait for the model reply; startup alone is not a passing smoke test."*

- **不能在源码目录测**：必须在 `/tmp` 这种与代码库完全无关的孤立目录下启动二进制，暴露可能存在的“相对路径硬编码”缺陷；
- **Node 与 Bun 产物分别实测**：防止不同 JS 引擎在系统绑定上的细微差异；
- **必须等待完整回复**：“仅仅能启动”不代表通过冒烟，必须完成从敲击回车到模型回复渲染收官的完整闭环。

---

## 四、对现代 Agentic 工程的启示

1. **本地协议桩是解决端到端测试的终极钥匙**：
   无论上游大模型协议多么复杂，在本地自建一个 50 行的 SSE 流式端点，就能将原本极其昂贵、不可控的外部依赖转化为秒级自洽的本地验证；
2. **受控虚拟终端是纯字符应用验收的最简方案**：
   通过轻量级的 `tmux send-keys` 与 `capture-pane`，在操作系统层面对进程输入敲键与捕获最终屏显字符，是验证 ANSI 兼容性与交互完整性最鲁棒的利器。
