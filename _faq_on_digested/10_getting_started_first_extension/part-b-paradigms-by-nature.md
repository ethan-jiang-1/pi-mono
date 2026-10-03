# Part B：五大性质的代码模板与最小活例

根据扩展的诉求性质，直接选用对应的范式模板。以下代码均已通过真实类型系统编译检验。

---

## 范式 1：行为守卫型（Guards / Safety）

**适用场景**：敏感路径防写入、危险命令二次确认、提交前强制代码检查。
**核心原则**：**Fail-closed（失败阻断）**。守卫必须在宿主层拦截，不能把安全责任交给大模型自我约束。

```typescript
// .pi/extensions/dangerous-command-guard.ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
    const dangerousPatterns = [/\brm\s+(-rf?|--recursive)/i, /\bsudo\b/i, /\b(chmod|chown)\b.*777/i];

    // 监听工具调用接缝 (tool_call)
    pi.on("tool_call", async (event, ctx) => {
        // 仅拦截 bash 工具
        if (event.toolName !== "bash") return undefined;

        const command = String(event.input?.command || "");
        const isDangerous = dangerousPatterns.some((pattern) => pattern.test(command));

        if (isDangerous) {
            if (!ctx.hasUI) {
                // 非交互模式（如脚本或管道），默认阻断
                return { block: true, reason: "高危命令在非交互模式下被自动阻断" };
            }

            // 在终端弹出交互式选择框
            const choice = await ctx.ui.select(
                `检测到高风险命令:\n\n  ${command}\n\n是否允许执行?`,
                ["Yes", "No"]
            );

            if (choice !== "Yes") {
                // 返回阻断结果，阻断本轮执行，并将理由反馈给模型
                return { block: true, reason: "用户已明确拒绝执行该命令" };
            }
        }

        return undefined;
    });
}
```

> **要点**：
> - 挂在 `pi.on("tool_call")` 接缝上；
> - 阻断时返回 `{ block: true, reason: "..." }`，错误信息作为结果回传给 Agent，促使其调整策略；
> - 零命令、零 UI 状态栏污染，只做静默守卫。

---

## 范式 2：工具能力型（Capabilities / Custom Tools）

**适用场景**：给 Agent 新增专属能力（查库、调业务微服务接口、复杂数学计算）。
**核心原则**：**严格 Schema + 输出长度防御截断 + execute 接口规范（必须含 details 字段）**。

```typescript
// .pi/extensions/query-service-tool.ts
import { Type } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
    pi.registerTool({
        name: "query_database_schema",
        label: "Query DB Schema",
        description: "查询内部业务数据库的指定表结构定义与索引。当需要编写 SQL 或分析表关联时使用。",
        // 严格入参验证，拒绝宽松类型
        parameters: Type.Object({
            tableName: Type.String({ description: "目标表名称，如 users, orders" }),
            includeIndexes: Type.Optional(Type.Boolean({ description: "是否包含索引详情，默认 false" }))
        }),
        async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
            try {
                // 模拟外部请求调用
                const schemaInfo = await fetchTableSchema(params.tableName, params.includeIndexes);

                // 核心防护：输出过长时必须截断，防止塞爆模型上下文
                const MAX_LENGTH = 15000;
                const safeOutput = schemaInfo.length > MAX_LENGTH
                    ? schemaInfo.slice(0, MAX_LENGTH) + "\n...[警告: 输出已截断，请缩小查询范围]"
                    : schemaInfo;

                return {
                    content: [{ type: "text", text: safeOutput }],
                    details: { tableName: params.tableName, truncated: schemaInfo.length > MAX_LENGTH }
                };
            } catch (err: any) {
                return {
                    content: [{ type: "text", text: `查询失败: ${err.message}` }],
                    details: { error: err.message }
                };
            }
        }
    });
}

async function fetchTableSchema(name: string, _idx?: boolean): Promise<string> {
    return `Table ${name}: id (bigint), status (varchar), created_at (timestamp)...`;
}
```

> **什么时候手写 Tool，什么时候用 MCP？**
> - 如果外部服务已经提供了标准的 MCP（Model Context Protocol）stdio/HTTP 服务，**直接在 `settings.json` 的 `mcpServers` 里声明接入，无需写任何 TypeScript 代码**。
> - 仅在需要高度定制本地逻辑、精细控制报错格式或与 Pi 运行时深度整合时手写 `registerTool`。

---

## 范式 3：交互与感知型（Presentation / TUI）

**适用场景**：在底部状态栏显示系统信息、添加快捷命令、桌面推送通知。
**核心原则**：**纯单向投影，不产生决策副作用**。

```typescript
// .pi/extensions/status-and-notify.ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
    // 1. 注册 Slash 命令手动触发
    pi.registerCommand("status-check", {
        description: "展示当前环境状态并在状态栏更新",
        handler: async (_args, ctx) => {
            const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
            
            // setStatus 接收 (key, text)
            ctx.ui.setStatus("heap", `Heap: ${memoryUsage} MB`);
            ctx.ui.notify("已刷新内存监控指标", "info");
        }
    });

    // 2. 监听 Agent 结束事件，完成后发出提示
    pi.on("agent_end", async (_event, ctx) => {
        ctx.ui.notify("Agent 本轮工作已完成，请检视结果", "info");
    });
}
```

---

## 范式 4：模式工作流型（Workflow / State Machine）

**适用场景**：为 Agent 引入全新工作流（例如：只读探索模式、计划制定模式）。
**核心原则**：**工具降权（`setActiveTools(toolNames)`）+ 状态持久化（`appendEntry` 与 `sessionManager.getEntries`）**。

```typescript
// .pi/extensions/readonly-explore.ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

interface ModeState {
    isReadOnly: boolean;
}

export default function (pi: ExtensionAPI) {
    let state: ModeState = { isReadOnly: false };
    let toolsBeforeReadOnly: string[] | undefined;

    // 跨分支/会话持久化与状态恢复
    pi.on("session_start", async (_event, ctx) => {
        // 从历史持久化日志中重建状态
        const entries = ctx.sessionManager.getEntries();
        const lastEntry = entries
            .filter((e: any) => e.type === "custom" && e.customType === "readonly-mode")
            .pop() as { data?: ModeState } | undefined;

        if (lastEntry?.data) {
            state = lastEntry.data;
            applyToolState();
            ctx.ui.setStatus("mode", state.isReadOnly ? "MODE: READONLY-EXPLORE" : undefined);
        }
    });

    function applyToolState() {
        if (state.isReadOnly) {
            if (toolsBeforeReadOnly === undefined) {
                toolsBeforeReadOnly = pi.getActiveTools();
            }
            // 工具降权：过滤掉破坏性写工具，只保留只读探索工具
            pi.setActiveTools(["read", "grep", "find", "ls"]);
        } else {
            // 恢复进入只读模式前记录的工具集（或当前全部工具）
            pi.setActiveTools(toolsBeforeReadOnly ?? pi.getAllTools().map((t) => t.name));
            toolsBeforeReadOnly = undefined;
        }
    }

    // 注册切换命令
    pi.registerCommand("explore-mode", {
        description: "切换 只读探索模式 / 正常写入模式",
        handler: async (_args, ctx) => {
            state.isReadOnly = !state.isReadOnly;
            applyToolState();

            // 关键：状态落盘，保证 /tree 会话分支跳跃时状态依然精确可查
            pi.appendEntry("readonly-mode", state);

            ctx.ui.setStatus("mode", state.isReadOnly ? "MODE: READONLY-EXPLORE" : undefined);
            ctx.ui.notify(
                state.isReadOnly ? "已进入只读探索模式（写工具已禁用）" : "已恢复正常可写模式",
                "info"
            );
        }
    });
}
```

---

## 范式 5：纯流程知识型（Declarative / Zero-code）

**适用场景**：项目构建排错规范、PR 审查 SOP。
**实现方式**：零代码，纯 Markdown。

创建文件 `.pi/skills/code-review/SKILL.md`：

```markdown
---
name: code-review
description: 项目代码审查 SOP。在用户要求审查 PR 或改动时遵循。
allowed-tools:
  - read
  - grep
  - find
---

# 项目代码审查流程

当执行代码审查时，按以下规范进行：

1. **依赖与锁文件**：检查是否误改了 package-lock.json。
2. **TypeScript 纪律**：严禁出现 `any`，检查是否有未导出的类型。
3. **测试覆盖**：改动逻辑必须伴随单元测试改动。
4. **输出格式**：
   - [Blocker] 阻断级缺陷
   - [Suggestion] 优化建议
   - [Praise] 代码亮点
```

> **判据**：凡是“告诉 Agent 应该按照什么顺序思考、看哪些文件、输出什么格式”的需求，**一律写成 Skill**，不要为此编写 TypeScript 代码。
