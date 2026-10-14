# 同步摘要 v1.2.0

**范围**: `98d2e1947` → `06a466935`（release tag `v1.2.0`）
**合入**: `7757c6707`（`ethan` 分支，merge tag `v1.2.0`，**零冲突**）
**验证**: `npm install --ignore-scripts` 后 `npm run check` **exit 0**（biome 1464 文件 / pinned-deps / runtime-deps / ts-imports / entry-graphs / install-lock / tsc / browser-smoke）
**取证**: 3 路并行 subagent，全部落到 v1.2.0 工作树逐条核验
**Discovery 记录**: [0009-v1.0.3-to-v1.2.0.md](0009-v1.0.3-to-v1.2.0.md)

## 一句话

v1.2.0 是**结构性拆除 + 能力下沉**的一版：删掉 experimental server/client/protocol 三层，chord 从 facet/service 重写为 typed host runtime，durable 从"任务运行时"扩张为"工具执行内核"（嵌套调用、结构化输出、内建 codemode、Storage 失败语义反转），并把配置 schema 正式发布到 `pi.dev/schemas`。

## 四个必须先建立的判断

### 1. 三层 seam 的文档锚点整条注销

`packages/client`、`packages/protocol`、`packages/server` **删除且不再发布**（`packages/` 13 → 11）。
全库真实残留引用为 **0**——包括源码、package.json、脚本、CI。

影响面最大：`_digested/` 里 0002–0008 各轮关于"server/client/protocol 分层"的叙述线**失去上游对应物**。协议线（`PROTOCOL_VERSION = 8`、RPC）的锚点无法刷新行号解决，只能注销或改写为历史注记。

> **易误改**：`packages/coding-agent/test/mcp-conformance/baseline.json` 里 26 处 `pi-client` 是 conformance 套件自己的 **check 标签**（`README.md:17` 定义），不是被删包引用。按字面 grep 去"修"是错的。

### 2. codemode 有两份平行实现，不是"下移到 durable"

| | 位置 | 依赖 |
|---|---|---|
| coding-agent | `src/extensions/codemode/` | `@earendil-works/pi-codemode` |
| durable | `src/codemode/`（v1.2.0 新增） | 同左，但自带 journal 确定性重放 |

两者并存。coding-agent **没有**改用 `pi-durable/codemode`。另注意 coding-agent 的 **`src/tools/` 目录整体消失**。

### 3. durable 的 Storage 失败语义反转（本轮最重的 Breaking）

任何 `Storage` 方法（**含读**）抛错，现在**使 Session 失败并自行关闭**：
- `SessionFailed`（`cause` 是原错误），其后所有调用与 pending wait 都以它 reject
- watch/事件流以 `session_failed` 结束，运行中任务收到 abort signal，`onReport` 收到一次错误
- **不重试**；storage 自身的瞬时失败由 storage 自己重试
- `StorageRejected` **已删除**；非法请求抛新的 `StorageRequestError`，只失败那一次调用

配套 README 新增 Errors 节（三条规则）。

### 4. `--tools` 的 `+`/`-` 语义**在 v1.2.0 内**（#10785 不在）

`+name`/`-name` 增量条目由 in-tag 的 `ddaa0a034` 引入，**同一提交**把 `usesDefaultTools` 改为 `(options.tools === undefined || toolModifiers !== undefined) && !options.noTools` 并新增 `defaultToolModifiers`。

所以"带 `+`/`-` 的列表不再抑制从 transcript 恢复工具"**属于 v1.2.0**。但单独成 issue 的 [#10785](https://github.com/earendil-works/pi/issues/10785)/#10887 是 **post-tag**——文档描述该行为时**不要引用 issue 号**。

（`_restoreToolsFromTranscript` 与 `_usesDefaultTools` 自 v1.0.3 就存在；本提交改的是门控条件。）

## 其它要点

- **chord 重写**：facet/service runtime → typed host runtime。`defineService`/`createFacetHost`/`createRemoteServiceBinding`/`createStaticFacetLoader`/`combineFacetLoaders` 与 `./bundler` 全删；依赖 `esbuild` → `typebox`。首次有 `CHANGELOG.md` 与 `docs/`（guide/spec/tutorial）。
- **durable 新增**：`api.executeTool()` 嵌套调用（`NestedCallDoc` 任务域文档、`pi.live.nestedTools`）、`ToolExecutionResult.content` → **`output`** + `structuredOutput`/`structuredOutputSchema`、`callers`/`deferred` + `@earendil-works/pi-durable/tool-search`（BM25，默认 8 条）、`abandonOnRestart`、images 子系统（Photon WASM，`/images/node` 走 worker 线程）、`documentRetentionMs`（默认十分钟）、`ScanOrder`。
- **`bash`/`powershell` 非零退出改返回 error result（带 `exit_code`）而非 throw。**
- **`pi.tool` version 2** + v1 迁移；`ToolTaskInput`/`ToolTaskResult` 变 tagged union。
- **codemode 包**：三种 sandbox（Remote + Cloudflare DO / Inline / Base）、`sandbox.start()` 确定性重放、`/portable` 入口。删除 `MCP_TYPESCRIPT_PREAMBLE`、`mcpStructuredContentSchema()`。
- **env 包**：PTY（四个 daemon op + `openTerminal()`/`RemoteTerminal`，**仅 Unix**，Windows 由 daemon 返回 `ENOTSUP`）、`listFiles` 真实实现 + 旧 daemon `not_supported` 回落、`LocalExecutionEnv`（本机也走 daemon）、惰性 `sshConnection`。
- **tui Breaking**：`Terminal.setProgramStatus()` 必需（OSC 7501）；cursor 改零宽 APC 标记（TUI 外须 `stripTerminalSequences()`）。
- **mcp Breaking**：`structuredContent` → `unknown`。
- **ai Breaking**：`StreamFunction` 返回 `AssistantMessageEventStream`。
- **配置 schema 发布**：`https://pi.dev/schemas/{models,settings,keybindings,theme}.schema.json`。**只有严格校验，无 `vars` 迁移代码。**

## 三类文档失效（不止一种）

升级后 `_digested` / `_faq_on_digested` 的失效**不是同一种**，处置方式也不同：

| 类型 | 样本 | 处置 |
|---|---|---|
| **结论过时** | `packages/{client,protocol,server}` 删除，12 个正文文件的协议栈叙述失去对象 | 注销叙述线，改写为历史注记 |
| **证据链断裂（脚本）** | `scripts/coding-agent-consumer.mjs` 删除，6 处相对链接指向空文件 | 换名 + 重述机制 |
| **一手依据消失且无替代** | `packages/chord/PLANNING.md` 删除（chord2 重写），`review.md` 6 处链接失效，整段"工作包/完成定义/交错点"论证无替代文档 | **收窄结论**并显式标注证据基础变更 |

第三类最隐蔽——它无法靠核对锚点发现（锚点在 v1.0.3 是准确的），必须比对 tag 间的文件存亡。

## 两个版本基线陷阱

| 含义 | commit | 差异 |
|---|---|---|
| 真正的 `v1.0.3` tag | `d78dc83d6` | `.github/workflows/durable-env.yml` |
| 本轮区间起点 | `98d2e1947`（v1.0.3+23） | `env.yml`（**已改名**） |

写"v1.0.3 时如何"必须用 `git ls-tree v1.0.3`。用 `git diff 98d2e1947 ...` 的结论去否定"语料 v1.0.3 基线下失效"会得出相反结论——本次 re-pin 勘察中已实际踩到。

## 三份待同步语料

| 语料 | 状态 | 关键动作 |
|---|---|---|
| `_digested/` | **已同步** | README 基线 + 包表 13 → 11 行；三包叙述注销；`architecture-next/durable-and-storage.md`、`chord.md`、`server-and-experimental-services.md`、`orchestration/04-codemode.md` 重写 |
| `_faq_on_digested/` | **已同步** | README 基线；01/02/06/07/08/12 六篇追加 sync-0009 增量 |
| `_pi_extension_agent_ready_development/` | **已 re-pin** | 外链基线 `v1.0.3` → `v1.2.0`（`verify.mjs` 的 `PINNED_EXTERNAL`）；26 个漂移源文件复核、21 处内容性失效锚点更正。见 [勘察报告](../../_pi_extension_agent_ready_development/_coverage/01-repin-v1.2.0-survey.md) |

**执行顺序说明**：`_pi_extension_agent_ready_development/` 原定只做"re-pin + 最小 prose 修正"，实际执行已扩展到全部 prose 修正（成本低于预期）。三个目录的基线声明现均为 `v1.2.0` / `06a466935`。

## post-tag 未纳入

`v1.2.0..3daa20280` 共 22 commit，本轮**不追**。清单见 0009 的"post-tag 未纳入"节（pinned 内部依赖 #10865、`--tools` resume 修复 #10785/#10887、chord 流控、codemode worker 生命周期、`sessionShareDestination`、若干 ai 修复、`docs/nvidia-rtx-llama-cpp.md`）。
