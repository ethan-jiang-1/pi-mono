# Part C：复杂实战：多轴协同的审查门禁工作流

在实际工程中，严肃的功能往往不是单一范式，而是**多条正交轴在同一个生命周期内的协同**。

本节实现一个企业级常用功能：**安全审查与执行门禁（Audit Gate & Plan Mode）**。代码均已通过真实类型系统编译检验。

---

## 1. 业务目标与轴的组合设计

我们要实现这样一个工作流：
1. 用户输入 `/gate` 进入安全门禁模式；
2. **工具降权**：Agent 只能进行只读探索（只能用 `read`/`grep`/`find`/`ls` 及审批工具），禁止写入代码或执行 bash 命令；
3. **指令改写**：在 Agent 开始思考前，自动向 Prompt 注入“当前处于审查阶段，必须先制定修改计划并提交审批”的约束；
4. **自定义工具**：注册一个专用工具 `submit_plan_for_approval`，供 Agent 提交结构化计划；
5. **UI 状态感知**：在 TUI 底部显示 `[GATE: LOCKED - PLAN ONLY]` 状态条；
6. **状态持久化**：计划与状态落盘，保证会话分支切换（`/tree`）时不丢状态；
7. 用户在终端审批通过后，恢复全量写权限执行改动。

### 正交轴使用表

| 动作 | 涉及的扩展轴 | 具体 API |
|---|---|---|
| 触发门禁 | 轴 1：注册命令 | `pi.registerCommand("gate", ...)` |
| 注入计划约束 | 轴 2：循环接缝拦截 | `pi.on("before_agent_start", ...)` |
| 禁止越权工具 | 轴 4：运行时工具降权 | `pi.setActiveTools(toolNames: string[])` |
| 提交计划审批 | 轴 2.2：注册工具面 | `pi.registerTool({ name: "submit_plan_for_approval", ... })` |
| 状态栏显示 | 轴 5：UI 呈现 | `ctx.ui.setStatus(...)` 与 `ctx.ui.confirm(...)` |
| 状态跨分支存活 | 轴 6：会话持久化 | `pi.appendEntry("audit-gate", ...)` 与 `sessionManager.getEntries()` 重建 |

---

## 2. 完整实现代码

```typescript
// .pi/extensions/audit-gate.ts
import { Type } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

interface GateState {
    active: boolean;
    planApproved: boolean;
    submittedPlan?: string;
}

export default function (pi: ExtensionAPI) {
    let state: GateState = { active: false, planApproved: false };
    let toolsBeforeGate: string[] | undefined;

    // 1. 轴 6：跨分支恢复状态（处理 /tree 回溯）
    pi.on("session_start", async (_event, ctx) => {
        const entries = ctx.sessionManager.getEntries();
        const lastEntry = entries
            .filter((e: any) => e.type === "custom" && e.customType === "audit-gate")
            .pop() as { data?: GateState } | undefined;

        if (lastEntry?.data) {
            state = lastEntry.data;
            syncRuntimeState(ctx.ui);
        }
    });

    function syncRuntimeState(ui?: any) {
        if (state.active && !state.planApproved) {
            if (toolsBeforeGate === undefined) {
                toolsBeforeGate = pi.getActiveTools();
            }
            // 轴 4：降权为只读工具集及审批工具
            pi.setActiveTools(["read", "grep", "find", "ls", "submit_plan_for_approval"]);
            if (ui) ui.setStatus("gate", "[GATE: LOCKED - PLAN ONLY]");
        } else {
            // 恢复全量工具
            pi.setActiveTools(toolsBeforeGate ?? pi.getAllTools().map((t) => t.name));
            toolsBeforeGate = undefined;
            if (ui) ui.setStatus("gate", state.active ? "[GATE: APPROVED]" : undefined);
        }
    }

    // 2. 轴 1：注册控制命令
    pi.registerCommand("gate", {
        description: "启用或解除安全审查门禁",
        handler: async (args, ctx) => {
            if (args === "off") {
                state = { active: false, planApproved: false };
                ctx.ui.notify("已解除安全门禁", "info");
            } else {
                state = { active: true, planApproved: false };
                ctx.ui.notify("已启用安全审查门禁：必须先提交计划并通过审批！", "warning");
            }
            syncRuntimeState(ctx.ui);
            pi.appendEntry("audit-gate", state);
        }
    });

    // 3. 轴 2：在循环开始前注入强制约束
    pi.on("before_agent_start", async (event) => {
        if (state.active && !state.planApproved) {
            return {
                systemPrompt: `${event.systemPrompt}\n\n[重要纪律] 当前处于审查门禁中。你只能阅读文件，严禁直接改动代码。分析完成后，必须调用 submit_plan_for_approval 提交方案。`
            };
        }
        return undefined;
    });

    // 4. 轴 2.2：注册提交计划的审批专用工具
    pi.registerTool({
        name: "submit_plan_for_approval",
        label: "Submit Plan",
        description: "向人类工程师提交代码变更计划以获取写入授权",
        parameters: Type.Object({
            summary: Type.String({ description: "改动概览" }),
            affectedFiles: Type.Array(Type.String(), { description: "将要修改的文件路径列表" }),
            steps: Type.Array(Type.String(), { description: "具体的实施步骤" })
        }),
        async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
            if (!state.active) {
                return {
                    content: [{ type: "text", text: "门禁未启用，无需审批，请直接操作。" }],
                    details: { active: false }
                };
            }

            // 轴 5：弹出交互式审批弹窗
            const promptText = `Agent 提交了修改计划:\n\n概览: ${params.summary}\n涉及文件: ${params.affectedFiles.join(", ")}\n步骤:\n` +
                params.steps.map((s, i) => `  ${i + 1}. ${s}`).join("\n");

            const approved = await ctx.ui.confirm("代码变更计划审批", promptText);

            if (approved) {
                state.planApproved = true;
                state.submittedPlan = JSON.stringify(params);
                syncRuntimeState(ctx.ui);
                pi.appendEntry("audit-gate", state);
                return {
                    content: [{ type: "text", text: "计划审批通过！写权限已解锁，你可以开始修改文件并运行测试。" }],
                    details: { approved: true, plan: params }
                };
            } else {
                return {
                    content: [{ type: "text", text: "计划被人类工程师拒绝，请重新评估或向用户询问细节。" }],
                    details: { approved: false }
                };
            }
        }
    });
}
```

---

## 3. 运行时执行流与时序全景

下图展示该插件在 Pi 循环中的实际介入过程：

```
用户输入: "修掉 auth 里的 token 过期 bug"
    │
    ▼
[Pi 循环接缝: before_agent_start]
    │  └─► audit-gate 插件注入: "[重要纪律] 当前处于门禁，必须先调 submit_plan_for_approval"
    ▼
LLM 生成决策 (第一轮思考)
    │  └─► 调用 read("auth.ts")
    ▼
[Pi 循环接缝: tool_call]
    │  └─► setActiveTools 校验: "read" 工具在白名单中，允许调用
    ▼
执行 read("auth.ts") → 结果回传 LLM
    │
    ▼
LLM 生成决策 (第二轮思考)
    │  └─► 尝试调用 submit_plan_for_approval({ summary, affectedFiles, steps })
    ▼
[Pi 循环接缝: tool_call]
    │  └─► 触发 submit_plan_for_approval execute
    │        └─► ctx.ui.confirm() 弹窗等待用户确认
    │              ├─ [拒绝] ──► 返回拒绝信息，写权限保持锁定
    │              └─ [批准] ──► 解锁写权限 + appendEntry 持久化 + 恢复全量工具
    ▼
LLM 获取审批通过结果 → 进入第三轮执行 → 调用 edit 修改代码并运行测试
```

---

## 4. 三问裁决验证

检验上述设计的合理性：

1. **每条轴有没有独立存在的理由？**
   - 轴 1 提供用户显式控制入口；
   - 轴 2 约束模型行为意图；
   - 轴 4 硬限制工具（防止模型幻觉偷跑写入）；
   - 轴 2.2 提供闭环触发机制；
   - 轴 6 保证会话分支切换时不跳回锁定或失真状态。
   各司其职，无冗余轴。
2. **各条轴会不会冲突？**
   - 状态由全局 `GateState` 单一权威源管理，`syncRuntimeState` 统一调度工具切换与 UI 渲染，无状态冲突。
3. **去掉某条轴，功能是否严重退化？**
   - 去掉轴 4（工具降权），模型可能跳过审批直接调 `edit` 改写文件；
   - 去掉轴 6（持久化），用户使用 `/tree` 跳回历史节点时，审批状态会发生幽灵重置。
   因此该组合是经过充分验证的最小完备闭环。
