# 答案：Pi 静态层没画的地图，运行时把它组装并走完

## 一句话结论

静态设计（04）说 Pi 把地图"委托给运行时"。运行时确实兑现了，但兑现方式不是靠模型自觉，而是靠 `buildSystemPrompt()` 这一个组装点，把"按图索骥"拆成三件机器执行的事：

1. **注入（push）**：`buildSystemPrompt()` 在每次会话组装 system prompt——自报家门 + `Available tools` + `Guidelines` + 文档地图 + `<project_context>` + `<available_skills>` + cwd。项目上下文（`AGENTS.md`/`CLAUDE.md`）由 `resource-loader` 向上遍历**推**进 prompt，不是模型主动读。
2. **导航（pull）**：不在注入里的内容（docs 正文、skill 正文），由模型用 `read` 工具按文档地图**拉**取——文档地图明确写 "read only when the user asks about pi itself"。
3. **回收（recycle）**：超预算由 compaction 压缩回收，skills 被"能读文件的工具"闸住——`read` 或 `bash` 都没有时整块不生成（不给空承诺）。

所以 Pi 的"按图索骥"在**运行时才成立**：静态层没有的架构地图，运行时用"文档地图 + 随包 docs + read 工具"补了回来。

---

## 三个机制各管一段

### 1. 注入（push）：`buildSystemPrompt()` 组装

`packages/coding-agent/src/core/system-prompt.ts` 的 `buildSystemPrompt()`（L28）按顺序拼：

| 段 | 来源 | 性质 |
|---|---|---|
| 自报家门（L127） | 写死的身份句 *"operating inside pi, a coding agent harness"* | 静态 |
| `Available tools`（L80-84） | 从**工具定义**的 `promptSnippet` 聚合，只列有 snippet 的工具 | **动态聚合**（工具集变了自动变） |
| `Guidelines`（L86-125） | 工具的 `promptGuidelines` + 条件准则 + 固定准则 | 动态聚合 |
| 文档地图（L137-144） | 写死的按主题映射（extensions→`docs/extensions.md`…） | 静态，但指向随包路径 |
| `<project_context>`（L152-157） | `resource-loader.loadProjectContextFiles` 注入 `AGENTS.md`/`CLAUDE.md` | **推**（向上遍历 + 去重） |
| `<available_skills>`（L161-162） | `skills` 目录，**只要 `read` 或 `bash` 之一可用**就生成；生成时按可用工具切换措辞（有 `read` 用 read，只有 `bash` 用 bash） | 闸门 |
| cwd（L165） | 当前工作目录 | 静态 |

**关键**：注入不是模型"主动读根 README/AGENTS"，而是 `AgentSession._rebuildSystemPrompt()`（`agent-session.ts:1065`）在会话时调 `buildSystemPrompt()` 组装，然后作为 system prompt 发给 LLM。`AGENTS.md` 作为项目上下文被 `resource-loader` 从 cwd 向上遍历**推**进 prompt——模型不用自己去找它。

### 2. 导航（pull）：模型用 `read` 工具按地图走

注入里只有"地图"（路径 + 主题映射），没有 docs 正文。模型按需用 `read` 工具拉：

- **docs 正文**：文档地图（`system-prompt.ts:137-144`）写了 "read only when the user asks about pi itself"，并给逐主题路径。模型被问 pi 自身时才 read `docs/extensions.md` 等——docs 随包（04 的 `files`），read 读的是本机文件。
- **skill 正文**：`<available_skills>` 只给 name/description/location 目录，模型决定用时用 `read`（或只有 `bash` 时用 `bash`）读 `SKILL.md` 全文（机制见 [`_digested/agent/04-Harness/4.2_Skills.md`](../../_digested/agent/04-Harness/4.2_Skills.md)）。
- **工具自述**：这是唯一"不用拉"的——工具的 `promptSnippet`/`promptGuidelines` 挂在工具定义上（同源），`buildSystemPrompt` 直接从定义聚合进 prompt，`Available tools` 永不漂移（见 [`_digested/harness/04-Self-Description/4.2_tool_prompt_contract.md`](../../_digested/harness/04-Self-Description/4.2_tool_prompt_contract.md)）。

### 3. 回收（recycle）：compaction + skill 文件读闸门

- **compaction**：手动 `/compact` 或自动（threshold / overflow）压缩上下文，回收超预算（`packages/agent/src/harness/compaction/`）。
- **skill 文件读闸门**：只要 `read` 或 `bash` 之一可用就生成 `<available_skills>`（`system-prompt.ts:45-46,161-162`）；两者都没有时整块不生成——不给模型一个"能看列表但读不了"的空承诺。生成时会按可用工具切措辞（`skills.ts:355,363-366`：有 `read` 说 "Use the read tool…"，只有 `bash` 说 "Use bash to load a skill's file…"）。这是 v0.85.1 修的（CHANGELOG "Fixed skills being unavailable when Bash is the only enabled tool"），此前闸门只认 `read`。
- **工具闸门**：`Available tools` 只列有 `promptSnippet` 的工具，无 snippet 的工具仍可用但不上 prompt（`system-prompt.ts:80-84`）。

---

## 静态层 ↔ 运行时层 的对应

| 04 的静态层 | 05 的运行时机制 |
|---|---|
| docs 随包（`files`） | 文档地图指向随包路径，read 可达 |
| 无 root `architecture.md` | 文档地图是唯一路由（按主题，不按架构） |
| 工具定义带 `promptSnippet` | `Available tools` 动态聚合（同源，不漂移） |
| 根 `AGENTS.md` 厚规则 | `resource-loader` 注入 `<project_context>`（推） |
| `SKILL.md` 在 skills 目录 | `<available_skills>` 目录 + 读闸门（`read` 或 `bash` 可用才生成，拉） |
| 无字数预算 | compaction + token 估算回收 |

**静态层缺的东西，运行时用机制补了**：缺架构地图 → 文档地图兜底；缺工具列表 → 同源聚合；缺预算 → compaction 回收。这是 Pi 和 DSH 最本质的区别：**DSH 把地图画在静态层、运行时走它；Pi 把地图画在运行时、静态层只铺路（随包 + 自述入口）。**

---

## 与静态设计（04）的关系

一句话：**04 说"Pi 不画地图"，05 说"Pi 的地图在运行时"。** 两者不矛盾，是同一件事的两半——Pi 的"按图索骥"不是一个静态文档，而是一个运行时过程（组装 → 走图 → 回收）。这也是为什么 04 里那句 "ask the agent to explain itself" 能成立：因为 agent 确实在运行时被注入了足够的地图，能回答"自己是谁、文档在哪"。

---

## 引用

- `packages/coding-agent/src/core/system-prompt.ts`：`buildSystemPrompt`（L28）、自报家门（L127）、文档地图（L137-144）、`Available tools`（L80-84）、skills 闸门（L45-46,161-162）
- `packages/coding-agent/src/core/agent-session.ts`：`_rebuildSystemPrompt`（L1065）
- `packages/coding-agent/src/core/resource-loader.ts`：`loadProjectContextFiles`（L119）、`loadContextFileFromDir`（L71）
- `packages/coding-agent/src/core/skills.ts`：`formatSkillsForPrompt`（L355，签名 `(skills, fileReadTool: "read" | "bash" = "read")`）
- `packages/agent/src/harness/compaction/`：compaction 回收
- `_digested/`：[`harness/04-Self-Description/4.1_system_prompt_self.md`](../../_digested/harness/04-Self-Description/4.1_system_prompt_self.md)、[`4.2_tool_prompt_contract.md`](../../_digested/harness/04-Self-Description/4.2_tool_prompt_contract.md)、[`agent/04-Harness/4.2_Skills.md`](../../_digested/agent/04-Harness/4.2_Skills.md)
- 静态设计（另一半）：[`04_root_entry_doc_design`](../04_root_entry_doc_design/answer.md)
