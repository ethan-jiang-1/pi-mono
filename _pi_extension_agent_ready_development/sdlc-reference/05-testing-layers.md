# 05 测试分层：每层能证明什么、不能证明什么

pi-mono 的测试不是一个套件而是四层机制：运行隔离（test.sh）、确定性单测（faux provider harness）、真实交互 smoke（tmux 技能）、真实模型行为评估（evals 配对比较）。层的边界与层的内容同等重要。以下全部对照 tag `v1.0.3` 核对。

## 第一层：test.sh——环境隔离，不是 OS sandbox

`./test.sh` 在执行根 `npm test` 前构造隔离环境（[test.sh](https://github.com/earendil-works/pi/blob/v1.0.3/test.sh#L4-L13)）：`mktemp` 建临时根，下设独立 `home`、`tmp`、`cache/npm` 与 npm userconfig/globalconfig，并放置 ownership marker（`.pi-test-owned`）。清理函数**只删除**「路径匹配 `pi-test.*` 模式且含 marker 且非符号链接」的目录，否则拒绝删除并报错（[L15-L36](https://github.com/earendil-works/pi/blob/v1.0.3/test.sh#L15-L36)）——防止把临时变量污染成任意路径后误删。

环境重建是「清零 + 白名单」：`env -i` 从空环境开始，只放行 `PATH`/`PWD`、指向临时目录的 `HOME`/`TMPDIR`/`XDG_*`、Git 禁用系统与全局配置、npm 指向临时配置、`PI_NO_LOCAL_LLM=1` 等（[L39-L64](https://github.com/earendil-works/pi/blob/v1.0.3/test.sh#L39-L64)）；Windows 必需继承变量与 `CI`/`GITHUB_ACTIONS` 检测单独放行（[L66-L76](https://github.com/earendil-works/pi/blob/v1.0.3/test.sh#L66-L76)）。最后 `env -i "${test_env[@]}" npm test`（[L78-L79](https://github.com/earendil-works/pi/blob/v1.0.3/test.sh#L78-L79)）。

**不能证明什么**：这是测试脚本的进程环境隔离——防的是「测试偷读开发者凭据、home 配置或真实 LLM」。它不是产品运行时的 OS sandbox，也不限制被测代码的文件系统访问范围；输出行 "Running tests without API keys in isolated home" 说的是环境，不是权限。

## 第二层：coding-agent 测试套件——真实组件 + faux provider

`packages/coding-agent/test/suite/` 的规则（**主仓要求**）：

> - Use `test/suite/harness.ts`
> - Use the faux provider from `packages/ai/src/providers/faux.ts`
> - Do not use real provider APIs, real API keys, network calls, or paid tokens
> - Keep these tests CI-safe and deterministic

—— [suite/README.md](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/test/suite/README.md#L5-L10)

`harness.ts` 的做法（[L150-L244](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/test/suite/harness.ts#L150-L244)）：`registerFauxProvider()` 注册假 provider（[L152-L155](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/test/suite/harness.ts#L152-L155)）；session/settings/auth 全部用 in-memory 实现，auth 写入假 key `"faux-key"`（[L161-L167](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/test/suite/harness.ts#L161-L167)）；**Agent 与 AgentSession 是真实实现**——真实 `Agent`（`streamFn` 指到 `streamSimple`）走真实的 payload/context 转换与 extension runner 钩子（[L193-L225](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/test/suite/harness.ts#L193-L225)），真实 `AgentSession` 挂真实 model runtime 与 ResourceLoader（[L229-L244](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/test/suite/harness.ts#L229-L244)）；模型回复由 `setResponses`/`appendResponses` 预设脚本化（[L259-L261](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/test/suite/harness.ts#L259-L261)），事件被订阅收集供断言（[L246-L249](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/test/suite/harness.ts#L246-L249)）；`cleanup` 释放 session 并注销 provider（[L267-L273](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/test/suite/harness.ts#L267-L273)）。

**能证明**：AgentSession 生命周期、事件序列、extension 钩子、工具调用编排等核心逻辑在脚本化模型行为下的正确性；确定性、可重复、无网络。
**不能证明**：真实模型输出质量、真实 provider API 的兼容性、网络层行为；faux 响应是测试自己写的，模型侧回归（prompt/解析变化）不在此层暴露。

**faux provider 是公开可复用的**（**运行时事实**）：`@earendil-works/pi-ai` 的 exports map 含 `./compat` 子路径（[packages/ai/package.json](https://github.com/earendil-works/pi/blob/v1.0.3/packages/ai/package.json#L22-L25)）；`packages/ai/src/compat.ts` 导出 `registerFauxProvider`（[compat.ts](https://github.com/earendil-works/pi/blob/v1.0.3/packages/ai/src/compat.ts#L162)）并经 `export * from "./api/*.lazy.ts"` 转发各 API 的 `streamSimple`（[compat.ts](https://github.com/earendil-works/pi/blob/v1.0.3/packages/ai/src/compat.ts#L13-L22)）；主仓 harness 自己就是从 `@earendil-works/pi-ai/compat` 导入这两个符号（[harness.ts](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/test/suite/harness.ts#L18)）。独立扩展仓可以用同一模式测自己的 extension：真实 `AgentSession`/`ResourceLoader` + faux provider，不碰真实 API。这是**扩展仓建议**中最直接可移用的一层。

## 第三层：交互 smoke——「启动不算通过」

`.pi/skills/interactive-testing.md` 给出 tmux 控制终端的工作流（[interactive-testing.md](https://github.com/earendil-works/pi/blob/v1.0.3/.pi/skills/interactive-testing.md#L10-L17)），并规定 release smoke 的通过标准（**主仓要求**）：

> For release smoke tests, start the tmux session with `-c /tmp` and replace `./pi-test.sh` with the absolute path to the release binary. Test both Node and Bun binaries separately, submit a prompt, and wait for the model reply; startup alone is not a passing smoke test.

—— [interactive-testing.md](https://github.com/earendil-works/pi/blob/v1.0.3/.pi/skills/interactive-testing.md#L19)

即交互层 smoke 必须包含一次真实 prompt 与真实模型回复；只验证进程能启动、能渲染不算通过。这一层**要用**真实 provider（与第二层互补），因此有费用与非确定性，被放到发布前人工/半自动环节（[07 页](07-release-and-recovery.md)）而不是普通 CI。

**不能证明什么**：一条 prompt 得到回复不证明全部交互功能（主题、编辑器、快捷键）正常；它是最小的「端到端活着」证据。

## 第四层：evals——配对行为评估（主仓机制）

`packages/evals` 用 `vitest-evals` 做真实模型行为评估（**主仓机制**，非普通 CI）。文档评估是配对比较：

> `*.docs.eval.ts` is a documentation-lift eval. `eval:docs` runs each case in isolated `without_docs` and `with_docs` containers and reports lift.

—— [evals/README.md](https://github.com/earendil-works/pi/blob/v1.0.3/packages/evals/README.md#L9)

两个 Docker 变体装**相同的本地 workspace tarball**，`without_docs` 只删去 coding-agent 的 `README.md`、`CHANGELOG.md`、`docs/`、`examples/` 与默认 system prompt 中的文档路由段（[L84-L88](https://github.com/earendil-works/pi/blob/v1.0.3/packages/evals/README.md#L84-L88)）；runner 先计划全部 `(case, variant, model, runNumber)` 任务再逐臂执行，配对要求两臂各恰好产出一个分数，任何 pair 被阻塞就扣发总体 lift 并以非零退出（[L73-L78](https://github.com/earendil-works/pi/blob/v1.0.3/packages/evals/README.md#L73-L78)、[L103-L105](https://github.com/earendil-works/pi/blob/v1.0.3/packages/evals/README.md#L103-L105)）。文档评估默认只暴露 `read`/`write`/`edit`/`grep`/`find`/`ls` 工具，不暴露 shell 与 web search；README 同时声明 Docker 网络隔离不能证明 agent 写的代码绝不上网（[L90](https://github.com/earendil-works/pi/blob/v1.0.3/packages/evals/README.md#L90)）。全部评估需要 `PI_PROVIDER`/`PI_MODEL`（[L24-L27](https://github.com/earendil-works/pi/blob/v1.0.3/packages/evals/README.md#L24-L27)）。

**能证明**：在受控配对下「文档存在与否」对任务通过率的方向性影响。
**不能证明**：单次运行的稳定性（README 明言 "One repetition cannot establish stability"，[L105](https://github.com/earendil-works/pi/blob/v1.0.3/packages/evals/README.md#L105)）；也不随普通 CI 运行（[04 页](04-ci-matrix.md)）。

## 分层小结

| 层 | 手段 | 证明 | 不证明 |
|---|---|---|---|
| test.sh | 清零环境 + 白名单 | 测试不消费真实凭据/home | 不是运行时 sandbox |
| suite + faux provider | 真实组件 + 脚本化模型 | 核心逻辑确定性回归 | 模型侧质量、网络层 |
| 交互 smoke | tmux + 真实模型 | 端到端最小存活 | 全部交互功能 |
| evals | Docker 配对 + 真实模型 | 文档/变更的行为影响 | 单次稳定性、CI 门禁 |

独立扩展仓**不自动拥有**以上任何一层；但第二层的 faux provider 模式因 `pi-ai/compat` 公开导出而可直接复用，第三层的「真实回复才算通过」标准可作为交互扩展 smoke 的最低线。哪些层需要复刻是**仓库自定**。
