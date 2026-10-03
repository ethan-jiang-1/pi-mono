# 工程化、自动化测试与防坑避险

当扩展从临时脚本走向生产维护时，必须解决**自动化测试**、**运行时陷阱防范**与**包化分发（Package）**三大工程命题。

---

## 一、自动化测试：使用 Harness 与 Faux Provider

为扩展编写测试时，**严禁使用真实模型 API 或消耗付费 Token**。
Pi 官方提供了测试套件机制，基于 `test/suite/harness.ts` 与虚拟模型（Faux Provider）模拟对话交互。测试代码均已通过真实类型系统编译检验。

### 最小测试用例示例

```typescript
// test/my-extension.test.ts
import { describe, it, expect, afterEach } from "vitest";
import { fauxAssistantMessage } from "@earendil-works/pi-ai";
import { createHarness, type Harness } from "../test/suite/harness.ts";
import myExtension from "../src/my-extension.ts";

describe("my-extension 测试套件", () => {
    const harnesses: Harness[] = [];

    afterEach(() => {
        while (harnesses.length > 0) {
            harnesses.pop()?.cleanup();
        }
    });

    it("扩展能挂载事件并在工具调用时触发逻辑", async () => {
        const eventsCaptured: string[] = [];

        const harness = await createHarness({
            extensionFactories: [
                myExtension,
                (pi) => {
                    // 辅助观测扩展行为的测试探针
                    pi.on("tool_call", async (event) => {
                        eventsCaptured.push(event.toolName);
                    });
                }
            ]
        });
        harnesses.push(harness);

        // 使用 fauxAssistantMessage 预设虚拟模型响应步骤
        harness.setResponses([
            fauxAssistantMessage("测试完成")
        ]);

        // 发送测试消息驱动 Agent 循环
        await harness.session.prompt("执行测试");

        expect(harness.session.messages.length).toBeGreaterThan(0);
    });
});
```

运行单测命令（遵守仓库规范）：
```bash
node "$(git rev-parse --show-toplevel)/node_modules/vitest/dist/cli.js" --run test/my-extension.test.ts
```

---

## 二、三大核心运行时陷阱与防御

源自 `_digested/extensions/03-Patterns/3.3_safety_guards.md` 的实战经验：

### 1. 废弃上下文陷阱（Stale Context Guard）

- **现象**：在异步定时器或长连接回调中，闭包持久持有了事件传入的 `ctx`。此时如果用户在终端触发了 `/tree` 分支跳转或会话切换，旧 `ctx` 对应的 Session 已经变为过去式。
- **后果**：向无效会话写入消息、抛出 `StaleSessionError`。
- **防御准则**：
  - 不要在长生命周期单例中永久缓存 `ctx`；
  - 必须通过 `pi.on(...)` 每一轮最新下发的上下文获取状态；
  - 必须通过 `ctx.sessionManager.getEntries()` 动态查询当前生效分支的历史记录。

### 2. 失败阻断陷阱（Fail-Closed 纪律）

- **机制**：Pi 的 `tool_call` 接缝是 **Fail-closed** 的。如果在 `tool_call` 监听器中发生未捕获的运行时异常（例如对未定义属性直接解构调用抛出 `TypeError`），**整轮 Agent 循环会被无条件中断**。
- **防御准则**：
  - 在监听器入口处先严格检查 `event.toolName`；
  - 严密防护参数可选链（如 `event.input?.command`）；
  - 拦截工具应返回 `{ block: true, reason: "..." }`，而不是直接抛异常；仅在真正遇到不可恢复的致命系统错误时才抛错。

### 3. 同名覆盖冲突（Same-name Override）

- **机制**：Pi 允许扩展用 `registerTool("read", ...)` 覆盖内置的 `read` 工具。
- **后果**：多个扩展如果注册了同名工具或同名 Command，**先加载的胜出，后加载的会被静默忽略或报错**。
- **防御准则**：
  - 自定义工具和命令尽量使用带有命名空间的前缀（如 `mycorp_query_db`，`/gate-status`）；
  - 仅在明确要增强原有工具（如为 `bash` 增加全局审计日志）时才覆写同名工具。

---

## 三、从单文件扩展升级为 Pi Package

当你的扩展出现以下需求时，应升级为标准的 **Pi Package**：
1. **引入了第三方 npm 依赖**（如 `axios`、`@octokit/rest`、`postgres` 等）；
2. **多资源打包**：除了可执行的 TypeScript 代码，还需要附带专用的 `skills/`、`prompts/` 模板或 `themes/`；
3. **团队/跨项目复用与分发**：需要通过 `pi install` 命令一键安装。

### 标准 Package 目录结构

```text
my-pi-package/
├── package.json          # 声明 "pi" manifest 配置
├── README.md
├── src/
│   ├── index.ts          # 扩展导出入口
│   └── helper.ts
├── skills/               # 附带的 Prompt 技能
│   └── code-audit.md
└── prompts/              # 附带的 Prompt 模板
    └── review-pr.md
```

### `package.json` 中的 `"pi"` 字段声明

```json
{
  "name": "@my-scope/my-pi-package",
  "version": "1.0.0",
  "keywords": ["pi-package"],
  "dependencies": {
    "axios": "^1.6.0"
  },
  "pi": {
    "extensions": ["./dist/index.js"],
    "skills": ["./skills"],
    "prompts": ["./prompts"]
  }
}
```

> **详细机制参见**：
> - [`_faq_on_digested/08_extension_vs_package/`](../08_extension_vs_package/answer.md)
> - [`_faq_on_digested/09_package_ecosystem/`](../09_package_ecosystem/answer.md)
