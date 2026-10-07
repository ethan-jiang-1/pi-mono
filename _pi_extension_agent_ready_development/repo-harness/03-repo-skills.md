# 仓库 skills：按需加载的专家程序

`v1.0.3` 的 `.pi/skills/` 下有三个 skill：`add-llm-provider`、`interactive-testing`、`release`。与 prompt template（纯指令文本）不同，skill 是「指令 + 约定配套资产」的目录形态；pi-mono 的这三个是单文件 Markdown skill，各自封装一项跨多文件、跨阶段、高出错成本的专家流程。以下为对 `v1.0.3` 内容的检视；它们是主仓为自己维护的流程（主仓要求/仓库自定），机制本身是运行时事实。

## 机制：描述决定路由

skill 的加载分两级（运行时事实）：启动时只有名字、描述与路径进入系统提示，完整指令按需读取：

> At startup, Pi scans configured skill locations and adds each skill’s name, description, and path to the system prompt. It does not add the full instructions.
>
> — [skills.md L43](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/docs/skills.md#L43)

路由质量取决于描述的写法（运行时事实）：

> The description determines when the model considers loading the skill. State both what the skill does and when it applies.
>
> — [skills.md L37](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/docs/skills.md#L37)

三个 skill 的描述都同时写了「做什么」与「何时用」：`add-llm-provider` 点明覆盖类型、实现、懒注册、模型生成、测试矩阵、coding-agent 接线与文档；`interactive-testing` 点明 tmux 受控终端与 release smoke；`release` 点明准备、本地 smoke、发布与「失败 CI 或公告」的恢复场景——恢复场景入描述意味着失败时的续接也是该 skill 的路由目标。

## `add-llm-provider`：跨层有序检查单

新增一个 LLM provider 触及两个包、约七个层面，skill 把顺序显式化（主仓要求）：

> A new provider touches multiple files. Work through these steps in order.
>
> — [`.pi/skills/add-llm-provider.md` L8](https://github.com/earendil-works/pi/blob/v1.0.3/.pi/skills/add-llm-provider.md#L8)

步骤链是：核心类型（`Api` 联合、options 接口、`ApiOptionsMap`、`KnownProvider`）→ provider 实现（`stream*` 事件标准化）→ 子路径导出与**懒注册**（`register-builtins.ts` 用 lazy loader 包装，禁止静态导入）→ 模型生成脚本 → 测试矩阵 → coding-agent 接线（默认模型、登录显示名、env 文档、README、`docs/providers.md`）→ 文档与 changelog。

测试矩阵是检查单里最「专家」的部分（主仓要求）：除至少一个代表模型的 `stream.test.ts` 外，还要加入 `tokens`、`abort`、`empty`、`context-overflow`、`unicode-surrogate`、`tool-call-without-result`、`image-tool-result`、`total-tokens` 各测试，以及：

> For `cross-provider-handoff.test.ts`, add at least one provider/model pair. If the provider exposes multiple model families (e.g. GPT and Claude), add at least one pair per family.
>
> — [add-llm-provider.md L43](https://github.com/earendil-works/pi/blob/v1.0.3/.pi/skills/add-llm-provider.md#L43)

这条矩阵把「流式、中止、空响应、上下文溢出、Unicode 代理对、孤儿 tool call、图片结果、token 计量、跨 provider 移交」定义为 provider 完整性的固定观察面——一个新 provider 不跑完这些就不算接好。

## `interactive-testing`：受控终端与真实验证

该 skill 给出 tmux 配方：后台起 80×24 会话、`send-keys` 发提示与特殊键、`capture-pane` 读屏、`kill-session` 收尾。release smoke 的条款（主仓要求）：

> For release smoke tests, start the tmux session with `-c /tmp` and replace `./pi-test.sh` with the absolute path to the release binary. Test both Node and Bun binaries separately, submit a prompt, and wait for the model reply; startup alone is not a passing smoke test.
>
> — [`.pi/skills/interactive-testing.md` L19](https://github.com/earendil-works/pi/blob/v1.0.3/.pi/skills/interactive-testing.md#L19)

三个边界值得注意：从 `/tmp` 起步（避免 release 二进制偶然解析到仓库内的工作区文件）；Node 与 Bun 两种二进制分开测（同一份逻辑、两种运行时）；**必须提交 prompt 并等到真实模型回复**——启动成功不算 smoke 通过，这防止「能开机」冒充「能用」。

## `release`：lockstep、repo 外 smoke 与失败恢复

release skill 固定了版本纪律与验证顺序（主仓要求）：

> **Lockstep versioning**: all packages share one version; every release updates all together. `patch` = fixes + additions, `minor` = breaking changes. No major releases.
>
> — [`.pi/skills/release.md` L10](https://github.com/earendil-works/pi/blob/v1.0.3/.pi/skills/release.md#L10)

流程为：先确认跑过 `/cl`（changelog 审计，见 [02](./02-prompts-as-procedural-contracts.md)）→ 在仓库外做本地 smoke——「build an unpublished release and smoke test from outside the repo (so it can't resolve workspace files)」（[release.md L14](https://github.com/earendil-works/pi/blob/v1.0.3/.pi/skills/release.md#L14)）→ 跑 release 脚本（版本、changelog、`npm run check`、提交、tag、推送一条龙，且「tag 推送后不得重跑 release 脚本」，[release.md L44](https://github.com/earendil-works/pi/blob/v1.0.3/.pi/skills/release.md#L44)）→ CI 经 npm trusted publishing 发布并验证 → Nix 构建并 fast-forward `stable`。失败恢复纪律是幂等重试失败任务而不是重跑发布：

> Do not rerun `npm run release:patch` or `npm run release:minor` for the same version.
>
> — [release.md L50](https://github.com/earendil-works/pi/blob/v1.0.3/.pi/skills/release.md#L50)

交互 smoke 未过是 release blocker，除非用户显式接受风险（[release.md L33](https://github.com/earendil-works/pi/blob/v1.0.3/.pi/skills/release.md#L33)）——把「带风险的例外」也写成必须显式声明的决定。

## 观点

观点（扩展仓建议，本语料归纳）：skill 的本质是把「专家程序」（有序步骤 + 固定观察面 + 边界条款）放进仓库、按需加载。它和 prompt 的分工不是长短，而是知识类型：prompt 定义一次任务的行为合同，skill 沉淀一类工作的可复用方法与配套约定（脚本、测试矩阵、恢复路径）。描述决定路由意味着 skill 的第一句话是接口：写不清「何时适用」，内容再好也到不了模型手里。扩展仓在为多步骤流程建 skill 时，最值得复制的是 add-llm-provider 的测试矩阵式完整性清单与 release 的失败恢复条款。
