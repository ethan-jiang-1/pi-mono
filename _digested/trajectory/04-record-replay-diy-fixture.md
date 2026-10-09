# 04 · 录制回放：Pi 缺的那一层，与一条已实测的 DIY 通路

## 一句话

**DSH 的"录制会话快照 → 入库 → 无 key 回放比对"机制，Pi 没有；但组成它的三个件——轨迹载体、宿主注入缝、从持久化结算推导模型脚本——Pi 全都有，本篇用一段原型把它们接通并跑绿。** 通路成立后，值不值得用、什么触发条件下用，直接借用 DSH #05 的判断，不必重新发明。

外部对照基线：DSH `_faq_on_digested/21_recorded-session-snapshots`（基线 DSH `187ad35d`、npm `dsh-llm-replay@0.2.0-rc.2`）。本篇不重复其取证，只引用结论。

## DSH 那层机制到底买什么（一段话回顾）

真跑一次会话，把持久化轨迹提交进仓；回放器从 assistant 结算**推导**模型脚本，无 key 重放整轮；用途三件：trajectory 回归基线、bug 复现（固定流之后仍复现的才是产品 bug）、model-visible 钉住。它自己承认的上限：**变更探测器，不是正确性 oracle**（DSH 四篇 postmortem 只有一篇把它当组装回归 pin）；搬不出去的是语料治理（几百场景的配额与守卫制度），搬得出去的是机制。

## Pi 侧的三件现成材料

| 件 | Pi 的对应物 | 状态 |
|---|---|---|
| 轨迹载体 | session JSONL：model-visible 状态在 system message 里，assistant 结算完整落盘 | 已消化（[01](01-model-visible-invariant.md)、[02](02-session-jsonl-anatomy.md)） |
| 宿主注入缝 | `createHarness({ sessionManager: SessionManager.open(path) })`，注释明言支持 resume | 已有（[harness.ts:122-123](../../packages/coding-agent/test/suite/harness.ts#L122-L123)） |
| 脚本推导 | assistant 结算（content blocks + stopReason + toolCall id）→ `FauxResponseStep[]` | **需要自己写**（DSH llm-replay 的 Pi 版核心） |

断言点对应：DSH 的 `request/header` pin ↔ Pi 的 `before_provider_request`（payload 可整体断言/替换，[extensions/types.ts:879-883](../../packages/coding-agent/src/core/extensions/types.ts#L879-L883)）与 `before_provider_headers`。

## 原型：录制 → 推导 → 无 key 续跑 → 重放一致（实测通过）

下面是完整原型（vitest + suite harness，faux 驱动，无任何真实 API；已在本工作树跑绿后删除，按需复刻）：

```ts
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AgentTool } from "@earendil-works/pi-agent-core";
import { fauxAssistantMessage, fauxToolCall, getCurrentTools } from "@earendil-works/pi-ai";
import type { FauxContentBlock, FauxResponseStep } from "@earendil-works/pi-ai/compat";
import { Type } from "typebox";
import { describe, expect, it } from "vitest";
import { SessionManager } from "../src/core/session-manager.ts";
import { createHarness, getAssistantTexts, getMessageText } from "./suite/harness.ts";

const readTool: AgentTool = {
  name: "read", label: "Read", description: "Read a file",
  parameters: Type.Object({ path: Type.String() }),
  execute: async (_id, args: { path: string }) => ({
    content: [{ type: "text", text: `${args.path} => hello` }], details: {},
  }),
};

// 核心：从落盘的 assistant 结算推导模型脚本（DSH llm-replay 的 Pi 版）
function deriveFauxSteps(entries: Array<Record<string, unknown>>): FauxResponseStep[] {
  const settlements = entries.filter(
    (e) => e.type === "message" && (e as { message?: { role?: string } }).message?.role === "assistant",
  ) as Array<{ message: { content: FauxContentBlock[]; stopReason: string } }>;
  return settlements.map(({ message }) =>
    fauxAssistantMessage(
      message.content.map((b) =>
        b.type === "toolCall" ? fauxToolCall(b.name, b.arguments, { id: b.id }) : b),
      { stopReason: message.stopReason as "stop" },
    ));
}

describe("trajectory record -> derive -> replay (research prototype)", () => {
  it("records a session file, derives the model script from persisted settlements, and resumes key-free", async () => {
    const workDir = await mkdtemp(join(tmpdir(), "pi-traj-proto-"));
    const sessionsDir = join(workDir, "sessions");
    mkdirSync(sessionsDir, { recursive: true });
    writeFileSync(join(workDir, "note.txt"), "hello");
    try {
      // ---- Phase 1: 录制——真 AgentSession 循环落盘 ----
      const recorder = await createHarness({
        sessionManager: SessionManager.create(workDir, sessionsDir), tools: [readTool],
      });
      recorder.setResponses([
        fauxAssistantMessage([fauxToolCall("read", { path: "note.txt" })], { stopReason: "toolUse" }),
        fauxAssistantMessage("note says hello"),
      ]);
      await recorder.session.prompt("read note.txt and tell me what it says");
      recorder.cleanup();

      const recordedPath = join(sessionsDir, readdirSync(sessionsDir).find((f) => f.endsWith(".jsonl"))!);
      const entries = readFileSync(recordedPath, "utf8").trim().split("\n")
        .map((line) => JSON.parse(line) as Record<string, unknown>);
      const roles = entries.map((e) =>
        e.type === "message" ? (e as { message: { role: string } }).message.role : e.type as string);
      // 落盘形态实测：["session","system","user","assistant","toolResult","assistant"]
      expect(entries[0]).toMatchObject({ type: "session", version: 3 });
      const systemEntry = entries.find((e) => e.type === "message" &&
        (e as { message: { role: string } }).message.role === "system") as {
        message: { toolsAdded?: Array<{ name: string }>; sections?: Record<string, string> } };
      expect(systemEntry.message.toolsAdded?.map((t) => t.name)).toContain("read");
      expect(Object.keys(systemEntry.message.sections ?? {}).length).toBeGreaterThan(0);
      expect(roles.filter((r) => r === "assistant")).toHaveLength(2);
      expect(roles).toContain("toolResult");

      // ---- Phase 2: 推导——只用文件重建模型脚本，逐块 deep-equal ----
      const derived = deriveFauxSteps(entries);
      const recordedSettlements = entries.filter(
        (e) => e.type === "message" && (e as { message?: { role?: string } }).message?.role === "assistant",
      ) as Array<{ message: { content: unknown; stopReason: string } }>;
      for (const [i, step] of derived.entries()) {
        const rebuilt = step as { content: unknown; stopReason: string };
        expect(rebuilt.content).toEqual(recordedSettlements[i]!.message.content);
        expect(rebuilt.stopReason).toBe(recordedSettlements[i]!.message.stopReason);
      }

      // ---- Phase 3: 续跑——新 harness 打开录制文件，无 key 再走一轮 ----
      const resumed = await createHarness({ sessionManager: SessionManager.open(recordedPath) });
      // 与 SDK resume 相同的装配（sdk.ts:200 -> initialState.messages, sdk.ts:399）
      resumed.session.agent.state.messages = resumed.sessionManager.buildSessionContext().messages;
      const before = resumed.session.messages.length;
      resumed.setResponses([fauxAssistantMessage("resumed and still key-free")]);
      await resumed.session.prompt("one more turn");
      // 历史来自文件，不是内存
      expect(resumed.session.messages.some((m) => m.role === "toolResult" && m.toolName === "read")).toBe(true);
      // 跨上下文 resume 会追加 patch 型 system message（新 cwd => 新 sections）：
      // 不变量是「重放轨迹得到当前状态」，不是「只有一条 system message」
      expect(resumed.session.messages.filter((m) => m.role === "system")).toHaveLength(2);
      expect(getCurrentTools(resumed.session.messages).map((t) => t.name)).toContain("read");
      expect(resumed.session.messages.length).toBeGreaterThan(before + 1);
      expect(getAssistantTexts(resumed)).toContain("resumed and still key-free");
      resumed.cleanup();

      // ---- Phase 4: 长大后的文件重新折叠，仍是一致轨迹 ----
      const regrown = await createHarness({ sessionManager: SessionManager.open(recordedPath) });
      const refolded = regrown.sessionManager.buildSessionContext().messages;
      expect(refolded.filter((m) => m.role === "system")).toHaveLength(2);
      expect(refolded.some((m) => m.role === "toolResult" && m.toolName === "read")).toBe(true);
      expect(getMessageText(refolded.at(-1)!)).toBe("resumed and still key-free");
      regrown.cleanup();
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  });
});
```

运行结果（本工作树）：

```
RUN  v4.1.11  Test Files  1 passed (1)   Tests  1 passed (1)
TRAJECTORY_ROLES: ["session","system","user","assistant","toolResult","assistant"]
```

## 原型过程里确认的两个事实（比通路本身更有价值）

1. **resume 的装配责任在 SDK/应用层，不在 AgentSession。** `AgentSession` 构造函数只从 transcript 恢复工具（[agent-session.ts:509-513](../../packages/coding-agent/src/core/agent-session.ts#L509-L513) `_restoreToolsFromTranscript`），消息态必须由调用方从 `buildSessionContext()` 灌入（生产路径 [sdk.ts:200](../../packages/coding-agent/src/core/sdk.ts#L200) → `initialState.messages`，:399；运行时对齐见 `_refreshFinalizedContext`，:926-932）。原型第一版漏了这行，`session.messages` 为空——这本身就是对"轨迹是事实源、运行态是派生物"纪律的一次现场验证：**派生状态永远从持久事实重新折叠**（[orchestration/06](../orchestration/06-session-plane.md) 的说法）。
2. **跨上下文 resume 会追加 patch 型 system message。** 续跑宿主的 cwd/资源与录制时不同 → 新 prompt sections ≠ 重放出的旧 sections → `declareToolChanges`/prompt patch 机制往轨迹里**追加一条** system message，文件变成 base + patch 两条。不变量的正确表述由此精确化：**"重放轨迹得到当前状态"，而不是"轨迹里只有一条 system message"。** 这正是 [01](01-model-visible-invariant.md) 边界节那条实测的出处。

## 适配真实录制（未实测，列为风险清单）

原型用 faux 录制（无 key 环境下的合法替身）。接**真实会话**文件时有三处摩擦，通路不变、适配要做：

1. **模型重映射**：`model_change` / assistant 结算里的 `provider`/`model` 指向真实 provider，resume 的模型恢复（[sdk.ts:209-222](../../packages/coding-agent/src/core/sdk.ts#L209-L222)）找不到 faux 注册项。两条路：入口把 entries 的模型字段改写为 faux（推导时顺手做），或在测试注册表里注册同名模型但 api 指向 faux。
2. **噪声清洗**：Pi 没有 DSH 的 `{{session:1}}` tokenize / scrub 基建；`cwd`、时间戳、uuid 都是原样字节。夹具入库前要自己决定 projected（抹平包络）/ complete（原始）的形态，并接受 diff 噪声归自己管。
3. **隐私**：真实会话可能含凭据与私有代码；bug-report 通道拿到的 `session.jsonl` 入库前要过 scrub——这一步 DSH 有制度，Pi 侧完全归 DIY 者。

## 该不该建：触发条件直接借 DSH #05

- **默认不建**。Pi 的 faux + harness + round-trip 合同测试已覆盖"作者想到的"回归面，且毫秒级、零维护语料的成本。
- **触发条件到了再建**（DSH #05 的 L4 台阶判据）：出现过"单测全绿但真实装配坏了"的事故；某条真实回归需要跨进程复现；扩展的行为合同复杂到行为 spec 写不动，需要一条固定轨迹当基线。
- **建的时候**：一个目录一条轨迹；断言点用 `before_provider_request`（钉组装面）+ 折叠后消息序列（钉轨迹面）；**不要抄** DSH 的语料治理（配额、世代委员会、corpus policy）——那服务"一个仓维护几百场景"的规模，extension 仓照抄只会得到一套没人维护的制度（DSH 21 原判断，在 Pi 生态同样成立）。

## 与相邻层的分工

- 想理解轨迹本身：[01](01-model-visible-invariant.md)、[02](02-session-jsonl-anatomy.md)。
- 想理解为什么剧本必须手写、四类失败怎么注入：[03](03-faux-and-deterministic-loop.md)。
- 想给 extension repo 定整体测试策略（证据阶梯、承诺组合）：[test-strategy/10](../test-strategy/10-extension-repo-test-strategy.md)，本篇是其 trajectory 夹具层的落地件。
- 研究过程与判断修正的原始记录：[`_faq_on_digested/13_recorded_session_snapshots/`](../../_faq_on_digested/13_recorded_session_snapshots/question.md)。
