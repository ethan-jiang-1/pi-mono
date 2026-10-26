# 06 评审与人的角色：理解义务、审阅缓冲与反推测性抽象

pi-mono 把评审拆成两类东西：一类是**可交给自动检查的规则**（见 [01](01-contribution-gates.md)、[03](03-check-pipeline.md)、[04](04-ci-matrix.md)），另一类是**明确保留给人的判断**。本章只看第二类：仓库怎样表述「人必须理解自己的代码」、用什么手段节省维护者的审阅时间，以及哪些设计原则被写成 agent 可执行的程序。以下全部对照 tag `v1.4.0` 核对。

## The One Rule：理解义务不可外包

`CONTRIBUTING.md` 把整份贡献指南的立场压缩成一条规则（**主仓要求**）：

> ## The One Rule
>
> **You must understand your code.** If you cannot explain what your changes do and how they interact with the rest of the system, your PR will be closed.
>
> Using AI to write code is fine. Submitting AI-generated slop without understanding it is not.

—— [CONTRIBUTING.md](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md#L13-L17)

三句话各做一件事：设定门槛（无法解释交互即关闭）、显式允许 AI 参与写作、把被拒的对象限定为「不理解却提交」。同页紧接的 agent 入口要求把理解义务落到可执行位置——agent 必须从仓库根运行以自动拾取 `AGENTS.md`，并遵守该文件（[CONTRIBUTING.md](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md#L19)）。

FAQ 里同一立场有更直接的一次表述（**主仓要求**）：

> ### Why not let AI triage everything?
>
> AI can help group duplicates, summarize reports, and spot missing information. It is not trusted to make final maintainer decisions. Polished AI-generated issues can still be wrong, misleading, or expensive to investigate. Human review remains the final gate.

—— [CONTRIBUTING.md](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md#L91-L93)

## 审阅缓冲：默认关闭、静默关闭与封禁

`CONTRIBUTING.md` 的自我描述是 "This guide exists to save both sides time."（[L3](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md#L3)）——文档的用途被写成省时间，不是写规范。这份立场在制度上有四处可见形态：

1. **默认关闭而非默认排队**：新贡献者 issue/PR 自动关闭，维护者按自己的节奏重开够格的（[01 页](01-contribution-gates.md)）。FAQ 给出理由是 issue 量超过维护者能实时负责的量（[L79-L81](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md#L79-L81)）。
2. **无回复是允许的结果**："A reply is maintenance work too."，低信号、重复、不合指南的 issue 可以无讨论直接关闭（[L87-L89](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md#L87-L89)）。
3. **周末降级为显式规则**：周五到周日的 issue 不保证被审（[L25](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md#L25)、[L83-L85](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md#L83-L85)）。
4. **封禁写在制度里**而不是留给个案裁量：忽略该文档两次、或用 agent 刷 tracker、或经自动化提交大量 issue，账号永久封禁（[L50-L54](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md#L50-L54)）。

`AGENTS.md` 也有对应的一条语调规则，把「不要热闹」写进 agent 合同（**主仓要求**）：`No fluff or cheerful filler text`、`Technical prose only, be direct`（[AGENTS.md](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md#L5-L8)）。

## 反推测性抽象：写成 agent 可执行的程序

`deslop.md` 是七个 prompt 中唯一以「删减」为目标的（见卷三 [prompts 页](../repo-harness/02-prompts-as-procedural-contracts.md)）。它把评审中最难言传的一条判断——「这是真需要的复杂度还是想象出来的」——写成可执行条款（**主仓要求**，约束在该仓运行 `/deslop` 的 agent）：

> - Remove speculative flexibility, configuration, extension points, and generic machinery that have no current requirement.
> - Remove speculative defensive programming inside trusted code. Validate at real trust boundaries; rely on types and established invariants internally.
> - Do not keep fallback behavior for states that should be impossible. Prefer fixing the invariant or type model.

—— [deslop.md](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/prompts/deslop.md#L19-L21)

相配套的约束是「清晰代码不得被新抽象取代」与「不得为简化而削弱测试」：

> - Do not replace clear code with a new abstraction solely to reduce line count.
> - Do not weaken tests to permit simplification. Update tests only when an approved behavior change or a cleaner equivalent structure requires it.

—— [deslop.md](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/prompts/deslop.md#L54-L55)

`AGENTS.md` 的对应条款更短，直接给出三条**代码质量**硬规则（[AGENTS.md](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md#L15-L20)）：读完整文件再做广泛改动、非必要不用 `any`、只有一个调用点的单行 helper 要内联。**Inline single-line helpers that have only one call site** 与 deslop 的「内联遮蔽行为的 trivial helper、wrapper 与直通层」（[deslop.md L17](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/prompts/deslop.md#L17)）是相近判据的两种表述：前者限定单行且仅一个调用点，后者按「是否遮蔽行为」判断。

## 覆盖与额外的边界约定

两条容易被忽略但影响评审结论的约定：

- **改动旧代码要问**。`AGENTS.md`：`Always ask before removing functionality or code that appears intentional.`（[AGENTS.md](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md#L25)）
- **不保留向后兼容，除非用户要求**。`AGENTS.md`：`Do not preserve backward compatibility unless the user asks for it.`（[AGENTS.md](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md#L26)）

第二条对理解「主仓的兼容面在哪」很关键：兼容不是默认义务，所以「没保留兼容」在 pi-mono 语境下不等于缺陷；真正的兼容面是显式声明的那几处（协议、持久化格式、扩展点），而不是「任何旧行为」。

## 人的判断在哪里不可替代

四类决定没有任何脚本或 workflow 代做（对照 [03](03-check-pipeline.md)、[04](04-ci-matrix.md) 的可执行检查清单）：

1. **issue/PR 是否够格**：gate 工作流只执行「默认关闭 + 是否在批准文件里」；「够不够格」由维护者重开时判定（[01 页](01-contribution-gates.md)）。
2. **技术上是否正确**：`npm run check`、`npm test`、MCP conformance 都不做设计判断或可行性判断。
3. **抽象是否该存在**：deslop 的判据给了标准，但「这条分支是否属于不可达状态」「这个扩展点是否有真实消费者」仍需人确认；deslop 自己规定重大删除必须先问（见下节）。
4. **发布风险是否接受**：release skill 明写 smoke 失败是 blocker "unless the user explicitly accepts the risk"，即风险接受是人的显式决定（见 [07 页](07-release-and-recovery.md)）。

## 什么时候人必须先说话

两处把「停下来问人」写成硬性前置条件，而不是建议：

- **重大删除的审批门**。deslop 定义了什么算 significant（用户可见行为、公开 API/持久化格式/协议/兼容性、校验与安全、看似刻意的扩展点、有测试或文档覆盖的功能、用途不确定的代码），并要求逐条解释「删什么、为什么多余、影响什么、替代是什么、我的建议」后等待显式批准；独立的决定不得打包成一次批准（[deslop.md](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/prompts/deslop.md#L27-L48)）。
- **规则与用户指令冲突**。`AGENTS.md` 末节：冲突时必须先请求显式确认，之后再执行用户指令（[AGENTS.md](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md#L123-L125)）。

## 计划与长期设计的位置

比「我将改哪些文件」更大的设计讨论不放在 issue 区，而是指向 RFC（**主仓要求**）：

> Earendil uses RFCs to discuss larger changes. Not all of them are public, but quite a few are.

—— [CONTRIBUTING.md](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md#L99-L102)

RFC 索引位于 `rfc.earendil.com/keyword/pi/`。

同时 `CONTRIBUTING.md` 的 Philosophy 段规定核心保持最小、不属于核心的能力应做成扩展、膨胀核心的 PR 大概率被拒；扩展 hook 点也要先讨论，避免不可维护的膨胀与复杂交互（[L5-L11](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md#L5-L11)）。即：**方案层面的人判断发生在 RFC 与哲学条款，而不是在 PR 评审里首次出现**。

## 报告与收尾的固定形状

`/wr` 把「怎样算收尾完」写成有序步骤（**主仓要求**）：更新 `[Unreleased]` changelog、必要时只发一条最终评论并以固定免责行结尾、只提交本会话改过的文件、单一 issue 时带 `closes #<issue>`、当前分支非 `main` 就停下先问、然后 push、再按 close 事件显式关闭 issue（[wr.md](https://github.com/earendil-works/pi/blob/v1.4.0/.pi/prompts/wr.md#L12-L35)）。AI 评论的免责行在 `AGENTS.md` 中作为通用要求重复一次（[AGENTS.md](https://github.com/earendil-works/pi/blob/v1.4.0/AGENTS.md#L92)）。评审者据此能机械分辨哪条评论是 agent 产出。

## 反例

- **One Rule 没有检查器**。没有脚本能判定「你是否理解自己的代码」；它只能在人被问到时暴露。gate 通过、CI 绿、changelog 齐，都不构成满足 One Rule 的证据。
- **deslop 的条款不是全仓强制**。它是按需调用的 prompt，不会在每次提交时运行；把它的判据当 lint 规则会超出证据。
- **「不保留后向兼容」不是对用户的承诺**：它约束主仓内部改法，不表示已发布产物可以破坏其声明的兼容面（发布与产物形态见 [07 页](07-release-and-recovery.md)）。
- **自动检查与人判断是两条线**：本章描述的「人的角色」不因自动检查变强而缩小；`CONTRIBUTING.md` 明确不把最终决定交给 AI（[L91-L93](https://github.com/earendil-works/pi/blob/v1.4.0/CONTRIBUTING.md#L91-L93)）。

**扩展仓建议**：可移用三条——(a) 把「提交者必须能解释改动」写成仓库文件里的显式门槛；(b) 用缓冲管理审阅节奏（默认关闭、允许无回复、把封禁条件写清楚），而不是靠提醒；(c) 把「拒绝推测性抽象」写成可复查判据并配一条「重大删除先问」的审批门。具体门槛值与是否自动化属**仓库自定**。
