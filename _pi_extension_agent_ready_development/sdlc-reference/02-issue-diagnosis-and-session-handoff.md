# 02 issue 诊断与 session 交接

pi-mono 把「诊断一个 issue」定义成两份合同：agent 侧行为合同（`.pi/prompts/is.md`）与执行环境合同（`.github/workflows/issue-analysis.yml`），中间用 session 导出/导入打通「CI 里跑过、本地接着干」。以下全部对照 tag `v1.0.3` 核对。

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

—— [is.md](https://github.com/earendil-works/pi/blob/v1.0.3/.pi/prompts/is.md#L14-L28)

另有两条操作性约束：分析开始前给 issue 加 `inprogress` 标签并 assign 给本地 `gh` 用户，**但 CI 环境下（`CI=true`）两个动作都不做**（[is.md](https://github.com/earendil-works/pi/blob/v1.0.3/.pi/prompts/is.md#L9)）；完整读取 issue 及全部评论与关联 issue/PR（[is.md](https://github.com/earendil-works/pi/blob/v1.0.3/.pi/prompts/is.md#L10-L13)）。配套的 `remove-inprogress-on-close.yml` 在 issue 关闭事件上自动摘除 `inprogress` 标签（[remove-inprogress-on-close.yml](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/remove-inprogress-on-close.yml#L3-L31)），避免标签状态泄漏。

「只提议不实现」是诊断合同与实现合同的边界：`/is` 的产出是根因与修复提案，不是补丁。

## CI 执行链：issue-analysis.yml

触发方式（[issue-analysis.yml](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-analysis.yml#L50-L54)）：给 issue 加 `pi-analyze` 标签，或 staff 成员评论 `@issuron analyze`（可带 `#run-on-linux/windows/mac` 选择 runner，注释见 [L1-L10](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-analysis.yml#L1-L10)）。

**授权链**（authorize job）要求两条独立证据同时成立：触发者必须是 `earendil-works/staff` 的 active 成员（用 org 只读 token 查 org membership API，[L180-L222](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-analysis.yml#L180-L222)），且对本仓具有 `admin` 或 `write` 权限（[L224-L235](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-analysis.yml#L224-L235)）。任何一条不满足即移除触发标签并失败；org token 未配置时直接拒绝运行（[L174-L178](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-analysis.yml#L174-L178)）。

**analyze job** 的关键步骤：

1. 创建高熵工作目录 `pi-ci-<32 位十六进制随机>` 并 checkout 到其中（[L267-L278](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-analysis.yml#L267-L278)）——目录名全局唯一，使 session 中记录的 cwd 成为可识别、可重写的字符串。
2. 安装 Node 22、系统依赖（fd、ripgrep）与 `npm ci --ignore-scripts`、`npm run build`。
3. 从 `pi-analyze` environment 的 secret 写出专用 `auth.json`（[L332-L353](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-analysis.yml#L332-L353)）；注释明确要求该登录专用于此工作流，因为 OpenAI Codex 每次刷新都轮换 refresh token，与开发机共享会导致互相失效（[L34-L37](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-analysis.yml#L34-L37)）。
4. 以 `node packages/coding-agent/src/cli.ts -p --approve --session-dir <临时目录> --model openai-codex/gpt-5.5 --thinking high "/is <issue URL>"` 运行真实模型诊断（[L355-L416](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-analysis.yml#L355-L416)，模型与 thinking 档位是环境变量 [L264-L265](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-analysis.yml#L264-L265)）。即：CI 里跑的就是交互式 pi 本身，`/is` 作为 prompt 输入。
5. 把 session `.jsonl` 用 `pi --export` 转成 HTML，两个文件一起上传为 **secret gist**，并生成 `https://pi.dev/session/#<gist-id>` 分享 URL（[L487-L569](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-analysis.yml#L487-L569)）。
6. 回评论：分析摘要（取最后一条 assistant 消息，截断到 55000 字符）+ gist 链接 + `pi "/ir <gist-id>"` 本地接续指令（[L571-L648](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-analysis.yml#L571-L648)）。
7. 失败时也尽力导出部分 session 并评论失败原因；最后无论成败都移除 `pi-analyze` 标签（[L650-L688](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-analysis.yml#L650-L688)）。刷新后的 `auth.json` 会被写回 secret，避免凭据过期（[L418-L485](https://github.com/earendil-works/pi/blob/v1.0.3/.github/workflows/issue-analysis.yml#L418-L485)）。

## `/ir`：导入与 cwd 重写

`.pi/extensions/import-repro.ts` 注册 `/ir` 命令（**运行时事实**，主仓自用扩展，也是 ExtensionAPI 用法的实物样本）。接受的引用形式：gist ID、gist URL、`pi.dev/session/#` 分享 URL、issue URL、本地 `.html`/`.jsonl` 文件（[L58-L78](https://github.com/earendil-works/pi/blob/v1.0.3/.pi/extensions/import-repro.ts#L58-L78)）。传 issue URL 时扫描该 issue 评论中 `github-actions[bot]` 发的最后一个 gist 链接（[L236-L261](https://github.com/earendil-works/pi/blob/v1.0.3/.pi/extensions/import-repro.ts#L236-L261)）。

导入动作（[L283-L345](https://github.com/earendil-works/pi/blob/v1.0.3/.pi/extensions/import-repro.ts#L283-L345)）：取 session 头部的 cwd，把整个 JSONL 中该 cwd 的各种拼写变体（含 Windows 盘符与 MSYS 形式，[L154-L170](https://github.com/earendil-works/pi/blob/v1.0.3/.pi/extensions/import-repro.ts#L154-L170)）替换为本地 `sessionManager.getCwd()`；写入当前 session 目录并 `switchSession` 切换过去；目标文件已存在时先确认覆盖；跨平台接续（如 Windows session 导入 Unix 机器）插入一条说明性消息（[L187-L195](https://github.com/earendil-works/pi/blob/v1.0.3/.pi/extensions/import-repro.ts#L187-L195)）。

## 边界：导入不等于重放

**不能证明什么**：

- 导入 ≠ 确定性重放。`/ir` 只搬运对话历史与 cwd 字符串；session 中 agent 读过的文件内容、执行过的命令结果不会重放。本地代码已漂移时，历史结论需要重新验证。
- 导入 ≠ 环境恢复。CI runner 上安装的系统依赖、`PI_AUTH_JSON` 凭据、高熵目录之外的任何环境状态都不随之而来；接续者要自己补齐。
- gist 是 secret gist 但内容仍含完整诊断对话（含代码片段、路径）；分享 URL 的可见性由 GitHub gist 权限决定，pi 不额外加密。
- `@issuron analyze` 的授权链同时要求 org 成员与仓库写权限——这不是「任何被 lgtm 的贡献者都能触发」的机制；它比 [01 页](01-contribution-gates.md)的 gate 门槛高。

**扩展仓建议**：独立扩展仓想复用「CI 诊断 + 本地接续」时，可仿照的高层模式是：诊断 session 存到可引用位置（gist 或仓内 artifact），接续命令只做引用解析与 cwd 重写。`/is` 合同的四要素（不信 issue 分析、完整读代码、只提议不实现、CI 下不碰标签）可作为诊断 prompt 的起点，但具体条目是**仓库自定**。
