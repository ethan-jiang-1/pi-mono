# 02 · 载体：session JSONL 的完整形态与轨迹资产通道

## 一句话

**一条会话就是一个 append-only 的 JSONL 树文件；它是轨迹（trajectory）的载体——记模型可见状态（system message）、完整对话往返（user/assistant/toolResult）、以及所有影响上下文的宿主决策（模型切换、压缩、分支、上下文改写）。** 本篇只讲"文件里有什么、怎么演化、作为资产怎么流动"；树结构与编排语义归 [orchestration/06](../orchestration/06-session-plane.md)，压缩机制归 [agent/03-Memory/3.1](../agent/03-Memory/3.1_Compaction.md)。

## 实测：一条最小轨迹的落盘形态

用 harness + faux provider 跑一轮「读文件 → 总结」，落盘文件（`~/.pi/agent/sessions/…/session.jsonl` 或自定义目录）逐行展开：

```text
session        ← header：version: 3、id（uuidv7）、cwd、时间戳
system         ← 首轮请求：全部 prompt sections + toolsAdded（完整工具声明）
user           ← "read note.txt and tell me what it says"
assistant      ← toolUse：toolCall 块（read {path:…}）
toolResult     ← 工具输出（read 的返回文本）
assistant      ← 总结文本，stopReason: "stop"
```

6 行完成一次闭环。**system 行就是 [01](01-model-visible-invariant.md) 那条不变量的落盘形态**：工具 schema 完整在内，prompt 按 sections 分键。这是工作树原型实测的 `roles` 序列：`["session","system","user","assistant","toolResult","assistant"]`。

## 条目类型全表（`session-manager.ts:43-197`）

| type | 进模型上下文 | 记什么 |
|---|---|---|
| `session`（header） | — | 版本、id、cwd；分叉会话带 `parentSession` |
| `message` | ✓ | role ∈ system / user / assistant / toolResult 的 `AgentMessage`；system 行带 `sections` patch 与 `toolsAdded`/`toolsRemoved` |
| `thinking_level_change` | 经 settings 折叠 | thinking 级别变化 |
| `model_change` | 经 settings 折叠 | provider + modelId；**resume 时从这里恢复模型选择**（[E018](../_evidence/render.md#e018)） |
| `usage` | ✗（注释明言"不参与 LLM context"） | 按模型归因的 usage（cache-warmer 等写入） |
| `compaction` | ✓（特殊：checkpoint + summary） | 摘要、`firstKeptEntryId`、`tokensBefore`、完整 prompt/tool checkpoint |
| `branch_summary` | ✓ | 从别的分支回来的摘要 |
| `custom` | ✗ | 扩展的状态条目（如 todo/plan 状态），不进上下文 |
| `label` | ✗ | 给某个 entry 打标签（分支时折叠处理） |
| `session_info` | ✗ | 会话命名 |
| `custom_message` | ✓ | 扩展注入的自定义消息（折为 user 角色，见 [E019](../_evidence/render.md#e019)） |
| `context_edit` | ✓（改写目标行） | 分支局部的上下文改写：替换/删除某条已落盘消息的内容 |

进上下文的折叠规则集中在两处：`sessionEntryToContextMessages()`（逐条投影）与 `buildSessionProjection()`（沿叶路径 + 压缩感知 + context_edit 改写，[E020](../_evidence/render.md#e020)）。`convertToLlm()`（[E021](../_evidence/render.md#e021)）再做 AgentMessage → provider Message 的最后一跳：bashExecution/custom/branchSummary/compactionSummary 都折成 user 文本，system/user/assistant/toolResult 原样透传。

## 版本与迁移：旧轨迹永不作废

- 当前写入版本：`CURRENT_SESSION_VERSION = 3`（[E022](../_evidence/render.md#e022)），header 里 `version` 字段即它。
- 载入时就地内存迁移：v1→v2 补 `id`/`parentId` 树结构，v2→v3 把 `hookMessage` 角色改名 `custom`（[E023](../_evidence/render.md#e023)）；`docs/session-format.md`："Existing sessions are automatically migrated to the current version (v3) when loaded."
- **与 DSH 同一个设计判断**：DSH 的回放器把旧世代夹具在内存迁移到当前版本再重放——录制资产不因格式升级作废。两边都选择了"迁移器"而不是"归档器"。

## 不要与 durable session 混淆

仓库里有两套"会话持久化"，[`_digested/README.md`](../README.md) 与 [agent/03-Memory/3.5](../agent/03-Memory/3.5_Session_v4.md) 都强调过分界：

| | coding-agent JSONL 会话（本篇对象） | durable session（experimental 线） |
|---|---|---|
| 形态 | append-only JSONL 树 + 投影函数 | records（conversation/entry/task/submission）+ documents + 单调 seq |
| 状态 | v3，生产路径 | 独立实验内核（chord replicated state） |
| "replay" 语义 | 轨迹重放 = 上下文求值 | task checkpoint 重放 = 崩溃恢复（`replay: "safe" | "unsafe"` 是**工具**恢复语义） |

另外两个同词不同义的地方也顺带钉住：`cache-warmer` 的 `isReplayable`（[E024](../_evidence/render.md#e024)）指"用单 token 上限重放请求以暖缓存"；`packages/evals` 的 transcript 重放指"把轨迹作为 prompt 喂真 provider 做评测"（[test-strategy/07](../test-strategy/07-evals-separation.md)）。本专题的"回放"专指轨迹 → 上下文/脚本的重放。

## 轨迹资产的官方通道

Pi 把这份轨迹当作**一等运行时资产**，全链路官方支持：

| 通道 | 入口 | 锚点 |
|---|---|---|
| 打开/续跑 | `SessionManager.open(path)` / `continueRecent` | [E025](../_evidence/render.md#e025) |
| 分叉 | `forkFrom()`（复制树到新文件，指针语义归 orchestration/06） | :1815 |
| 导出 | `/export` 输出 jsonl（或 html） | [E026](../_evidence/render.md#e026) |
| 导入 | `/import <path.jsonl>` 换入当前会话 | [E027](../_evidence/render.md#e027) |
| 分享 | TUI 内 share 打包 jsonl | [E028](../_evidence/render.md#e028) |
| 诊断 | bug-report 自动把 `session.jsonl` 打进诊断包 | [E029](../_evidence/render.md#e029) |
| 评测 | evals 把 transcript 重放为真 provider 的 prompt | [E030](../_evidence/render.md#e030) |

## 它还不是测试语料

反证口径（工作树 grep 实测）：`packages/coding-agent/test` 与 `packages/agent/test` 里没有任何以录制会话文件为夹具的测试（`session.jsonl` 只出现在 `/import` 参数解析与启动传路径的测试里）；vitest snapshot 只用在个别 UI 面（`interactive-mode-status.test.ts`）。**轨迹可移植 ≠ 轨迹可回归**：仓库没有"录制入库 → 无 key 回放 → 比对"的机制。这一层的缺口与 DIY 通路是 [04](04-record-replay-diy-fixture.md) 的主题。
