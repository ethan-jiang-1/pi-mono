# 08 — Pi 扩展测试实战指南：如何用 Pi 的测试哲学检验你的 Extension

> **源码锚点**：
> - 官方轻量契约测试范例：`packages/coding-agent/test/plan-mode-extension.test.ts`
> - 官方全生命周期 Harness 测试范例：`packages/coding-agent/test/test-harness.test.ts`、`packages/coding-agent/test/suite/agent-session-model-extension.test.ts`
> - 扩展工厂与运行时接口：`packages/coding-agent/src/core/extensions/index.ts`、`types.ts`
> - UI 上下文无头测试替身：`packages/coding-agent/test/suite/harness.ts`（`createTestUiContext`）

---

## 一、为什么扩展测试是生态质量的“生死线”？

在开发 Pi 的扩展（Extension）时，大量开发者常常陷入一个痛苦的恶性循环：
1. **纯手工人肉回归**：写完一段扩展代码，必须启动真实的终端应用 `pi`，手动敲入自定义命令、手动输入提示词、手动观察控制台输出；
2. **测试成本极度昂贵**：为了验证一个拦截逻辑，频繁直连外部付费模型 API，不仅执行缓慢、偶发超时，而且消耗大量 API 配额；
3. **CI 流水线无法落地**：因为扩展调用了终端 UI（`ctx.ui.confirm`、`ctx.ui.select`），在无头 CI（如 GitHub Actions）中由于没有真实 TTY 设备，测试进程直接挂死或超时退出；
4. **宿主污染与脏数据**：测试时随意在当前目录写文件、改 Git 状态，多次测试后本地环境一片狼藉。

Pi-mono 自身在维护数十个内置与示例扩展（见 `packages/coding-agent/examples/extensions/`）时，摸索出了一套成熟且工业级的**扩展测试工程范式**：
**“两级断言网格（契约单测 + 会话仿真）+ 零 Token 零网络沙箱”**。

通过借鉴 Pi 自身的测试基建，扩展开发者可以在不花一分钱、不发一次网络请求、耗时不到 100 毫秒的前提下，对扩展进行工业级的自动化测试覆盖。

---

## 二、模式 A：轻量级契约单元测试（Contract Mocking Pattern）

### 适用场景
- 验证自定义斜杠命令（`/my-command`）的参数解析与执行流；
- 验证快捷键（Keyboard Shortcuts）注册；
- 验证单点生命周期事件（如 `agent_end`、`session_shutdown`）；
- 验证状态开关（Flags）与激活工具列表切换（`setActiveTools`）。
- **执行速度**：1~2 毫秒 / 用例。

### 核心思想：最小 Mock API 注入
扩展的入口本质上是一个工厂函数：`(pi: ExtensionAPI) => void | Promise<void>`。
因此，我们可以直接用测试替身（Test Doubles）模拟 `ExtensionAPI`，在纯内存中捕获扩展注册的 Handler 并主动触发它。

### 实战代码模板（选自 `packages/coding-agent/test/plan-mode-extension.test.ts` 原型）

```typescript
import { describe, expect, it, vi } from "vitest";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
// 引入你要测试的扩展入口
import myExtension from "../src/index.ts";

function setupExtensionTest() {
  const commands = new Map<string, (args: string, ctx: ExtensionContext) => Promise<void> | void>();
  const eventHandlers = new Map<string, Array<(event: any, ctx: ExtensionContext) => Promise<any>>>();
  
  // 间谍函数 (Spies) 记录扩展的对外副作用
  const sendMessage = vi.fn();
  const sendUserMessage = vi.fn();
  let activeTools = ["read", "bash", "edit", "write"];

  // 构造轻量级 ExtensionAPI Mock
  const api = {
    registerCommand(name: string, command: { handler: any }) {
      commands.set(name, command.handler);
    },
    on(event: string, handler: any) {
      const list = eventHandlers.get(event) ?? [];
      list.push(handler);
      eventHandlers.set(event, list);
    },
    setActiveTools: vi.fn((tools: string[]) => {
      activeTools = [...tools];
    }),
    getActiveTools: vi.fn(() => [...activeTools]),
    sendMessage,
    sendUserMessage,
  } as unknown as ExtensionAPI;

  // 构造无头 ExtensionContext (UI 替身)
  const ctx = {
    ui: {
      confirm: vi.fn(async () => true), // 自动模拟用户点击确认
      select: vi.fn(async () => "option-1"),
      notify: vi.fn(),
    },
  } as unknown as ExtensionContext;

  // 执行扩展初始化
  myExtension(api);

  return { commands, eventHandlers, api, ctx, sendMessage };
}

describe("MyExtension Contract Tests", () => {
  it("registers slash command correctly and executes handler", async () => {
    const { commands, ctx, sendMessage } = setupExtensionTest();

    // 1. 断言命令已注册
    expect(commands.has("my-cmd")).toBe(true);

    // 2. 模拟用户触发命令
    const handler = commands.get("my-cmd")!;
    await handler("foo=bar", ctx);

    // 3. 断言扩展的行为
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining("Success") })
    );
  });
});
```

---

## 三、模式 B：基于 Harness 的会话状态机集成测试（Harness Integration Pattern）

### 适用场景
- 扩展需要深度介入 **Agentic Loop**（如通过 `tool_call` 拦截模型调用、通过 `before_provider_request` 动态修改 System Prompt）；
- 扩展需要测试多轮对话中的上下文持久化与历史压缩（`before_compact`）；
- 扩展注入了自定义的 LLM 工具（`registerTool`），需要验证模型调用该工具的全链路。
- **执行速度**：10~20 毫秒 / 完整会话。

### 核心思想：真宿主 + 伪模型 + 真实插件挂载
使用 Pi 提供的 `createHarnessWithExtensions`（或 `createHarness`），拉起一个完整的内存态 `AgentSession`。此时整个状态机运转是**真实**的（包括事件广播、权限拦截门、上下文折叠），唯独大模型由 `fauxProvider` 驱动。

### 实战代码模板（基于 `packages/coding-agent/test/test-harness.test.ts` 原型）

```typescript
import { describe, expect, it } from "vitest";
import { 
  createHarnessWithExtensions, 
  type Harness 
} from "@earendil-works/pi-coding-agent/test-harness";
import { 
  fauxAssistantMessage, 
  fauxToolCall 
} from "@earendil-works/pi-ai";
import { mySecurityGuardExtension } from "../src/guard-extension.ts";

describe("Security Guard Extension Loop Test", () => {
  let harness: Harness;

  afterEach(() => {
    harness?.cleanup(); // 自动清理临时沙箱目录与 Session
  });

  it("intercepts destructive tool call deterministically", async () => {
    // 1. 组装测试全景，将扩展挂载进 AgentSession
    harness = await createHarnessWithExtensions({
      extensionFactories: [
        {
          path: "<test-security-guard>",
          factory: (pi) => {
            // 挂载你的扩展逻辑
            mySecurityGuardExtension(pi);
          },
        },
      ],
      responses: [
        // 轮次 1：虚拟模型试图执行破坏性 bash 命令 rm -rf /
        fauxAssistantMessage([
          fauxToolCall("bash", { command: "rm -rf /" })
        ], { stopReason: "toolUse" }),
        // 轮次 2：被扩展拦截后，模型给出道歉回复
        fauxAssistantMessage("操作被插件策略拒绝，已终止。"),
      ],
    });

    // 2. 发起指令，驱动全真 Agent 循环
    await harness.session.prompt("帮我清理磁盘");

    // 3. 断言状态机结果
    // 扩展应该在 tool_call 阶段将高危命令阻断
    const toolResults = harness.session.messages.filter(m => m.role === "toolResult");
    expect(toolResults.length).toBe(1);
    expect(toolResults[0].content).toContain("Blocked by security policy");

    // 4. 验证会话收敛
    const assistantTexts = harness.session.messages
      .filter(m => m.role === "assistant")
      .map(m => m.content);
    expect(JSON.stringify(assistantTexts)).toContain("操作被插件策略拒绝");
  });
});
```

---

## 四、UI 与人机交互的无头测试技巧

当扩展需要调用 UI 弹窗与用户进行复杂交互时，绝不要试图在测试中启动 TUI 界面。
Pi 提供了无头 UI 替身工具：`createTestUiContext`（`packages/coding-agent/test/suite/harness.ts:75`）。

```typescript
import { createTestUiContext } from "@earendil-works/pi-coding-agent/test/suite/harness";

it("handles user rejection gracefully", async () => {
  // 注入用户点击“取消”的假动作
  const ui = createTestUiContext({
    confirm: async () => false, // 模拟用户点了 Cancel
    select: async (title, options) => options[0], // 模拟用户选择了第一项
    input: async () => "custom input text", // 模拟用户输入
  });

  const ctx = { ui } as ExtensionContext;
  
  // 执行你的交互命令
  await myInteractiveCommand(ctx);

  // 断言扩展在用户取消时优雅退出，没有误触发后续危险操作
  expect(ui.notify).toHaveBeenCalledWith(expect.stringContaining("Action cancelled"));
});
```

---

## 五、编写高品质 Pi 扩展测试的五大铁律

为了确保扩展能长期稳定地运行在 Pi 生态中，请严格遵守以下五条纪律：

1. **绝对离线原则（Zero External Calls）**：
   单元测试与集成测试中严禁调用外部大模型 API，严禁向外网发送真实 HTTP 请求。所有网络请求用本地桩或 Faux Provider 替代；
2. **工作区隔离原则（Hermetic Tempdir）**：
   如果扩展涉及读写磁盘文件，必须在 `harness.tempDir` 构造的临时目录中操作，并在 `afterEach` 中通过 `harness.cleanup()` 销毁，绝不修改当前开发工程；
3. **测试错误边界（Error Resilience）**：
   必须编写包含 `throw new Error()` 的测试用例。测试当你的扩展内部抛出未捕获异常时，宿主会话是依然能够继续响应用户，还是整个进程被带崩；
4. **生命周期收敛验证（Lifecycle Cleanup）**：
   如果扩展启动了后台 `setInterval`、长驻子进程或 WebSocket 链接，必须监听 `session_shutdown` 事件予以清理，并在测试中验证资源句柄是否被彻底归还；
5. **Token 预算敏感性测试（Context Footprint）**：
   如果扩展监听了 `context` 事件向 System Prompt 注入内容，断言注入的文本长度不得超过预期预算，防止无节制地吞噬用户的模型上下文窗口。
