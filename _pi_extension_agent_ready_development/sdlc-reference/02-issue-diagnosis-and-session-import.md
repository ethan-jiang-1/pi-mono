# 02 issue 诊断与 session 接续

pi-mono 把「诊断一个 issue」定义成两份合同：agent 侧行为合同（`.pi/prompts/is.md`）与执行环境合同（`.github/workflows/issue-analysis.yml`），中间用 session 导出/导入打通「CI 里跑过、本地接着干」。基线与逐条证据见 `../_evidence/render.md`。

## `/is` 的独立诊断合同

`.pi/prompts/is.md` 是主仓的 issue 分析 prompt。它的核心条款（**主仓要求**，约束在该仓运行 `/is` 的 agent）：

> 3. Do not trust analysis written in the issue. Independently verify behavior and derive your own analysis from the code and execution path.
>
> 4. **For bugs**:
>    - Ignore any root cause analysis in the issue (likely wrong)
>    - Read all related code files in full (no truncation)
>    - Trace the code path and identify the actual root cause
>    - Propose a fix
>
> 5. **For feature requests**:
>    - Do not trust implementation proposals in the issue without verification
>    - Read all related code files in full (no truncation)
>    - Propose the most concise implementation approach
>    - List affected files and changes needed
>
> Do NOT implement unless explicitly asked. Analyze and propose only.

[E065](../_evidence/render.md#e065)

另有两条操作性约束：分析开始前给 issue 加 `inprogress` 标签并 assign 给本地 `gh` 用户，**但 CI 环境下（`CI=true`）两个动作都不做**；完整读取 issue 及全部评论与关联 issue/PR（该行是条目 2 本身，紧随其后的 那段代码围栏 是它引用的 `gh issue view --json ...` 代码围栏，不是一个独立的约束）。配套的 `remove-inprogress-on-close.yml` 在 issue 关闭事件上自动摘除 `inprogress` 标签，避免标签状态泄漏。

[E066](../_evidence/render.md#e066)

「只提议不实现」是诊断合同与实现合同的边界：`/is` 的产出是根因与修复提案，不是补丁。

## CI 执行链：issue-analysis.yml

触发方式：给 issue 加 `pi-analyze` 标签，或 staff 成员评论 `@issuron analyze`（可带 `#run-on-linux/windows/mac` 选择 runner，注释见 ）。

[E067](../_evidence/render.md#e067)

**授权链**（authorize job）要求两条独立证据同时成立：触发者必须是 `earendil-works/staff` 的 active 成员（用 org 只读 token 查 org membership API），且对本仓具有 `admin` 或 `write` 权限。任何一条不满足即失败——标签触发路径同时移除 `pi-analyze` 标签（评论触发路径尚无标签可移除）；org token 未配置时直接拒绝运行。

[E068](../_evidence/render.md#e068)

**analyze job** 的关键步骤：

1. 创建高熵工作目录 `pi-ci-<32 位十六进制随机>` 并 checkout 到其中——目录名全局唯一，使 session 中记录的 cwd 成为可识别、可重写的字符串。
2. 安装 Node 22、系统依赖（fd、ripgrep）与 `npm ci --ignore-scripts`、`npm run build`。
3. 从 `pi-analyze` environment 的 secret 写出专用 `auth.json`；注释明确要求该登录专用于此工作流，因为 OpenAI Codex 每次刷新都轮换 refresh token，与开发机共享会导致互相失效。
4. 以 `node packages/coding-agent/src/cli.ts -p --approve --session-dir <临时目录> --model openai-codex/gpt-5.5 --thinking high "/is <issue URL>"` 运行真实模型诊断（，模型与 thinking 档位是环境变量 ）。即：CI 里跑的就是 pi CLI 本身（以 `-p` 非交互模式运行），`/is` 作为 prompt 输入。
5. 把 session `.jsonl` 用 `pi --export` 转成 HTML，两个文件一起上传为 **secret gist**，并生成 `https://pi.dev/session/#<gist-id>` 分享 URL。
6. 回评论：分析摘要（取最后一条 assistant 消息，截断到 55000 字符）+ gist 链接 + `pi "/ir <gist-id>"` 本地接续指令。
7. 失败时也尽力导出部分 session 并评论失败原因；最后无论成败都移除 `pi-analyze` 标签。刷新后的 `auth.json` 会被写回 secret，避免凭据过期。

[E069](../_evidence/render.md#e069)

## `/ir`：导入与 cwd 重写

`.pi/extensions/import-repro.ts` 注册 `/ir` 命令（**运行时事实**，主仓自用扩展，也是 ExtensionAPI 用法的实物样本）。接受的引用形式：gist ID、gist URL、`pi.dev/session/#` 分享 URL、issue URL、本地 `.html`/`.jsonl` 文件。传 issue URL 时扫描该 issue 评论中 `github-actions[bot]` 发的最后一个 gist 链接。

导入动作：取 session 头部的 cwd，把整个 JSONL 中该 cwd 的各种拼写变体（含 Windows 盘符与 MSYS 形式）以及任何以该高熵目录名结尾的 Windows 风格路径替换为本地 `sessionManager.getCwd()`；写入当前 session 目录并 `switchSession` 切换过去；目标文件已存在时先确认覆盖；跨平台接续（如 Windows session 导入 Unix 机器）插入一条说明性消息。

[E070](../_evidence/render.md#e070)

## `scripts/issues/`：本地 triage 工具（历史，v1.5.1 已删除）

> `scripts/issues/` 已于 v1.5.1 整体删除（25 文件 −1,293；变更史见 `_digested/_change_log/0012-v1.5.0-to-v1.5.1.md`，语料外路径不建链接）。它在 v1.2.0–v1.5.0 期间是开发者本机对整个 issue inbox 的批量 triage 工具：每个 issue 一个 pi-durable 会话（`scripts/` 下少见的 durable 真实消费者），15 个 `categories/*.md` 定义分类，环境变量控制模型/并发/端口。批量 triage 现由仓库 workflows（`issue-analysis.yml` 等）承担；它曾是 durable 真实用法的样本这一价值，已由 `apps/p3` 与 `packages/durable/test/examples/`（示例 38–46）承接。

## 边界：导入不等于重放

**不能证明什么**：

- 导入 ≠ 确定性重放。`/ir` 只搬运对话历史与 cwd 字符串；session 中 agent 读过的文件内容、执行过的命令结果不会重放。本地代码已漂移时，历史结论需要重新验证。
- 导入 ≠ 环境恢复。CI runner 上安装的系统依赖、`PI_AUTH_JSON` 凭据、高熵目录之外的任何环境状态都不随之而来；接续者要自己补齐。
- gist 是 secret gist 但内容仍含完整诊断对话（含代码片段、路径）；分享 URL 的可见性由 GitHub gist 权限决定，pi 不额外加密。
- `@issuron analyze` 的授权链同时要求 org 成员与仓库写权限——这不是「任何被 lgtm 的贡献者都能触发」的机制；它比 [01 页](01-contribution-gates.md)的 gate 门槛高。

**扩展仓建议**：独立扩展仓想复用「CI 诊断 + 本地接续」时，可仿照的高层模式是：诊断 session 存到可引用位置（gist 或仓内 artifact），接续命令只做引用解析与 cwd 重写。`/is` 合同的四要素（不信 issue 分析、完整读代码、只提议不实现、CI 下不碰标签）可作为诊断 prompt 的起点，但具体条目是**仓库自定**。
