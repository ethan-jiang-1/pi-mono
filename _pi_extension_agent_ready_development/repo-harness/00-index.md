# Repo Harness 总览：pi-mono 为什么对 coding agent 可参与

## 本卷回答什么

一个 coding agent 第一次进入 pi-mono，不需要口头交接、不需要读聊天记录，就能知道：规则在哪里（`AGENTS.md` 自动进入上下文）、每类工作怎么做（`.pi/prompts/` 与 `.pi/skills/` 是文件）、做过什么（会话是可读的 JSONL 账本）、哪些路不能走（贡献门槛与成本合同都是显式的）。本卷解释这套组织的各个部件，并区分「pi-mono 就是这样」与「你的扩展仓可以借用什么」。

这是对 `v1.2.0` 一手材料的描述与归纳，不是 Pi 宣布的官方方法。pi-mono 自身没有声明采用任何命名的开发方法论；以下三条组织立场是本语料从规则、prompts、skills 与工作流文件中归纳的可观察模式（扩展仓建议层面的综合，供借鉴与批判）。

## 三条组织立场

### 立场一：规则写给没来过的 agent

pi-mono 的规则假设读者是零上下文到达的 agent：规则集中在仓库根的 `AGENTS.md`，且仓库明确要求 agent 从仓库根运行以便自动拾取它（主仓要求）：

> If you use an agent, run it from the `pi` root directory so it picks up `AGENTS.md` automatically. Your agent must follow the rules and guidelines in that file.
>
> — [CONTRIBUTING.md](https://github.com/earendil-works/pi/blob/v1.2.0/CONTRIBUTING.md#L19)

同一假设贯穿 git 规则：仓库不假设工作树是单人独占的，而是直接把「多个 agent 并发修改不同文件」写进制度（主仓要求）：

> Multiple pi sessions may be running in this cwd at the same time, each modifying different files.
>
> — [AGENTS.md](https://github.com/earendil-works/pi/blob/v1.2.0/AGENTS.md#L54)

规则文件同时约束人与 agent：`CONTRIBUTING.md` 对 AI 生成代码的态度是「可以用，但必须理解」（[The One Rule](https://github.com/earendil-works/pi/blob/v1.2.0/CONTRIBUTING.md#L15)）。这立场的可借鉴内核是：把「新协作者需要知道的一切」放进仓库文件，而不是放进人的记忆或群聊历史（扩展仓建议）。

### 立场二：程序化知识放进仓库

「怎么做一次 issue 分析」「怎么发一个 release」在多数仓库里是维护者的隐性经验；在 pi-mono 里它们是仓库内的文件——七个 prompts（[02](./02-prompts-as-procedural-contracts.md)）和三个 skills（[03](./03-repo-skills.md)），任何会话按需加载。同时，工作历史本身也是仓库外的可检视账本：会话以带树结构的 JSONL 持久化，CI 分析会话能被 `/ir` 导入本地续接（[05](./05-session-inspectability.md)）。

这立场的可借鉴内核是：把反复执行的工作流程写成 prompt/skill 文件、把工作记录写成可机读格式，让程序性知识随仓库版本化，而不是随人员流失（扩展仓建议）。

### 立场三：门槛与成本显式化

pi-mono 把「谁能进来、进什么、成本多少」全部显式化：新贡献者的 issue 与 PR 默认自动关闭，须经维护者 `lgtm` 解锁（[01](./01-agent-entry-rules.md)）；不属于核心的能力应做成扩展，膨胀核心的 PR 可能被拒（[06](./06-scope-discipline-and-cost-contracts.md)）；连「这个入口会拖进多大的模块图」都被脚本定义为预算（[06](./06-scope-discipline-and-cost-contracts.md)）。模糊的社会性约束（「请保持核心精简」）被转写为可检查、可拒绝的边界。

这立场的可借鉴内核是：把维护带宽、代码体积与上下文开销当作真实成本，用制度而不是提醒来控制（扩展仓建议）。

## 部件地图：仓库里什么在哪里

本卷的七个页面各自检视仓库的一组部件；从部件反查页面：

| 仓库部件（`v1.2.0` 路径） | 角色 | 页面 |
|---|---|---|
| `AGENTS.md`、`CONTRIBUTING.md` | agent 入口合同与贡献门槛 | [01](./01-agent-entry-rules.md) |
| `.pi/prompts/`（is/pr/wr/deslop/sa/cl） | 六类工作流的行为边界 | [02](./02-prompts-as-procedural-contracts.md) |
| `.pi/skills/`（add-llm-provider/interactive-testing/release） | 三项专家程序 | [03](./03-repo-skills.md) |
| `packages/coding-agent/docs/`（其中九篇可变性面文档） | 可变性面的官方定义 | [04](./04-extension-points-map.md) |
| `packages/coding-agent/docs/session-format.md`、`docs/sessions.md`、`docs/slash-commands.md`、`.pi/extensions/import-repro.ts` | 会话账本与续接 | [05](./05-session-inspectability.md) |
| `scripts/check-entry-graphs.mjs`、贡献门槛 | 范围纪律与成本合同 | [06](./06-scope-discipline-and-cost-contracts.md) |
| `packages/`（11 个包） | 依赖面与发布面 | [07](./07-monorepo-taxonomy.md) |

仓库还有第四类 `.pi/` 资产——`.pi/extensions/` 下的四个运行时扩展（`import-repro`、`prompt-url-widget`、`redraws`、`tps`）——它们不在本卷单独立页，其中注册 `/ir` 的 `import-repro` 在 [05](./05-session-inspectability.md) 中作为会话续接机制检视。

## 按任务选页

| 你要做的事 | 先看 | 补充 |
|---|---|---|
| 让 agent 进入我的仓库干活 | [Agent 入口规则](./01-agent-entry-rules.md) | [06](./06-scope-discipline-and-cost-contracts.md) 的成本视角 |
| 组织 issue 分析 / PR 审查 / 收尾提交 | [Prompts 即程序性合同](./02-prompts-as-procedural-contracts.md) | [01](./01-agent-entry-rules.md) 的命令与 git 纪律 |
| 封装一项多步骤专家流程 | [仓库 skills](./03-repo-skills.md) | [04](./04-extension-points-map.md) 的资源判别 |
| 决定一个能力做成扩展还是 skill | [扩展点地图](./04-extension-points-map.md) | [06](./06-scope-discipline-and-cost-contracts.md) 的范围纪律 |
| 让工作过程可复查、可移交 | [会话可检视性](./05-session-inspectability.md) | [02](./02-prompts-as-procedural-contracts.md) 的 `/is`、`/pr` |
| 控制仓库膨胀与维护负担 | [范围纪律与成本合同](./06-scope-discipline-and-cost-contracts.md) | [01](./01-agent-entry-rules.md) 的贡献门槛 |
| 理解依赖面与宿主提供的包 | [Monorepo 分类](./07-monorepo-taxonomy.md) | [04](./04-extension-points-map.md) 的 package 分发 |

## 不能证明什么

本卷能证明：`v1.2.0` 时点这些文件的内容与结构如此。本卷不能证明：这些机制在 pi-mono 之外被实际执行；它们是深思熟虑的设计还是演化沉淀；它们对 pi-mono 的可维护性产生了可测量的收益。引用 `.pi/`、`AGENTS.md`、`CONTRIBUTING.md`、`README.md` 与多数 docs 时，`v1.2.0` 与当前工作树内容一致；例外见各页标注。
