# 同步摘要 v1.5.0

**范围**: `4a080252f`（release tag `v1.4.0`）→ `f9a263655`（**release tag `v1.5.0`**，11-02）
**合入**: `82fa18e67`（`ethan` 分支，merge tag `v1.5.0`，**零冲突**，merge-base 正好是 `v1.4.0` tag）
**提交数量**: **308**；**1,578 文件，+211,745/−14,707**；`packages/` **11 → 12**（新增 `schema`），全部 `1.5.0`
**取证**: 主 agent 在 v1.5.0 工作树逐条核验 + 三个语料台账机器重钉
**Discovery 记录**: [0011-v1.4.0-to-v1.5.0.md](0011-v1.4.0-to-v1.5.0.md)
**执行计划**: [_plan-1-v1.5.0.md](_plan-1-v1.5.0.md)

## 一句话

v1.5.0 的"大"不在 breaking 数量，而在**结构形态**：diff 是上一轮（跨两个 minor）的 4~6 倍，而增量是删量的 **14 倍**——因为主体是三个**纯新增面**（全新 `packages/schema`、chord v2 五个 slice、durable 的观察/提交模型重写），不是替换面。

## 五个必须先建立的判断

### 1. `pi-schema` 是低层依赖，不是新增能力

`packages/schema` 259 文件 +41,224/−0，是全仓唯一零删除的包。它**接管**了 TypeBox：`src/formats/typebox/` 直接搬了 TypeBox 的 format 实现，`LICENSES/typebox-LICENSE` 在包里，`coerce` 明确定义为 TypeBox 1.3.27 `Value.Convert` 的**超集**。API 只有两个入口（`.` 与 `./formats`），核心是 `compile(schema, options?)` → `Validator`（`check` / `errors`），`{ coerce: true }` → `CoercingValidator`（另有 `coerce` / `parse`）。

### 2. TypeBox 退场对扩展作者**部分兼容**

三层，缺一层就误导：

| 层 | v1.5.0 |
|---|---|
| 扩展源码写法 | 仍可从 `pi-ai` import `Type`/`Static`/`TSchema`（coding-agent 的 compat 映射 + 内置 TypeBox）；内置工具工厂返回 `TypeBoxAgentTool` |
| 参数校验 | 一律 pi-schema，JSON Schema 之外的 TypeBox 特性**不生效** |
| 新代码建议 | pi-schema builders；`obj` 默认 **closed**，开放需 `{ open: true }` |

**静默语义变化**（不是改名，是行为）：`Format.Set()` 自定义 format 丢弃（**标准 format 仍校验**，`format:"email"` 仍拒 `"nope"`）；`Type.Refine()` 不跑；`BigInt`/`Undefined`/`Void` 拒绝一切 JSON；codec 不解码；`Format.Set()` 不检查；属性名按名字不按正则；悬空 `$ref` 只拒绝该位置。反向放宽：纯 JSON Schema 工具（含 MCP）现在**也**获得强制转换。错误文案换成 `- path: missing` / `- limit: expected number, got string`。

### 3. chord 是**双运行时并存**，不是升级

`./next` 在 v1.5.0 **首次出现**于 exports。同时 v1 自身大改：换 pi-schema（fingerprint 不变）、watch 语义整体重写（`retired` 变 change 字段、`WatchCall` 变 tagged union、`WatchEnd` 按 `kind`、`cancel()`→`abort()`、`retire()` 删除、新增 `endAfterDelivery()`）、`traceIn` 参数顺序改、新增 `runCounted()`。

v2 体量：`src/next` **146** 文件 + `src/next-node` **29** 文件；`docs/next/` **33 篇**（`design.md` 2,554 行 / `decisions.md` 2,957 行 / `slices.md` 230 行）；`test/next/examples/` 144 文件 / **46 个编号示例****。`esbuild` 与 `ws` 都是 **optional peer**。五个新面：plugins（esbuild + `vm.Script` + 热 reload + 按名导入）、registries、HTTP（Web 标准 fetch handler + CSP nonce）、workers、store（`commitSeries`、document histories）。

### 4. durable 的 34 条 Breaking 是**一条主线的四组**

占全仓 41 条 Breaking 的 83%。

- **(A) 提交模型**：`Storage.commit(writes, adopt, ctx)` → `commit(batches, receive, ctx): Promise<CommitResult>`，`CommitResult = { stored, refused? }`；每个 batch 独立原子提交、各自 seq；第一个被拒的 batch 不入库而其前的入库；其他失败整体 reject 视为未知结果；另有 `publishing()`、`mintId()` 收窄、`commitSeries`、`commitWrites()`。
- **(B) 观察模型**：`watchEvents()` 及 `AgentEvent*`/`SnapshotEvent`/`MessageChange`/`ToolEventCall` **整套删除**（全仓仅剩一处注释提到它）。替代是"渲染状态"：`ConversationView` 变 transcript **窗口**（`min` 50 / `max` 2×min）、`Conversation.entries()` 分页、`ConversationTranscript` 合并、`Conversation.context()` 给模型视角；三个 state getter 删除改 `watchDoc()`/`Conversation.watch()`/`watchTaskGraph()`；`subscribeCommits()`→`observeCommits()`。
- **(C) watch 换形**：跟随 chord v1 的新形状；`retired` 变字段；同地址新文档在同一条 watch 到达；listener 忙时折叠（append 合并、set 取最后、超 10,000 退化为整根替换）；`FileSystem.watch()` 的 change 改名 `FileChange`。
- **(D) 持久化时机**：partial answer / 运行中工具输出 **deferred**，最迟 `settings.progress.persistWithinMs`（默认 **1,000 ms**）。SQLite 事务少 ~5.7×、长回答 27×、CPU 约 −25%；代价是**崩溃最多丢约 1 秒流式内容**（原 ~100 ms）。

零散：restart-limited 任务**不再 park 而直接结束**；`pi.live` 无答案结束时不再为空（保留 `runFailure`，新增 `nothing_to_answer`/`turn_limit`/`interrupted`）；`pi.live.run` 新增必需 `turns`；`afterTool` 对每个工具结果都跑（含错误与未提供工具，后者带 `unoffered`）；`CompactionStatus.reason`→`trigger`；`TaskInspection.state` 的 `ready`→`pending`；多个类型 tagged by `kind`；新增 `StoreStorage`。

### 5. 模型目录换了**生成源**，投递契约没变

`scripts/generate-models.ts` **已删除**，改为 `packages/ai/catalog/`（57 文件，`build.ts`/`define.ts`/`families/*`），数据源改 **models.dev v2**；`AGENTS.md:28` 规则同步改。`MINIMUM_PI_VERSION` 与 `check-model-catalog-compat.mjs` 的投递机制在 v1.4.0 已建立，本轮未再改。行为：realtime/image-only 模型（`gpt-realtime-2.1` 等）不再作为 chat 模型；新增 `chat-latest`/`gpt-5.6-cyber`/`gemini-robotics-er-2-preview`；默认 OpenAI 模型 `gpt-5.5`→`gpt-6.1-sol`。

## 其它要点

- **ai**：`StreamingJsonParser` + `ToolCallArgumentsStream` 取代每 delta 全量重解析（90 KB `write` 峰值由 ~140 MB 降下）；`Usage.cost.totalFromProvider`、`responseModel`；`appendGrammarToolInputJsonDelta()` 收 delta 而非累积。
- **coding-agent**：扩展包 changelog（`pi.changelogPath`/`collapseChangelog`）；`PI_SELF_UPDATE_COMMAND`/`selfUpdateCommand`；`pi.exec()` 的 `maxBuffer`/`truncated`（上限 256 MiB）；MCP OAuth 默认 Client ID Metadata Document（`oauth.clientRegistration:"auto"`，`"dcr"` 强制动态注册）；多项安全修复（OAuth URL 只收 http/https、终端控制字符、glob DoS）。
- **tui**：`Markdown` 按 block 复用（主题切换必须调 `invalidate()`）；`Component.capturesViewportInput`；`getSelectPageIndex()`；`replaceControlCharacters()`；`fuzzyMatch` 也评分连续匹配。
- **env**：`RemoteWatcher.close()`→`stop()`，change 变 tagged；daemon 在 SIGTERM/SIGINT/SIGHUP 时先杀进程组。
- **仓库规则**：`AGENTS.md` +18/−3——catalog 路径、**`npm run build` 规则反转**（需要 `dist/` 时跑；不要用它做类型检查）、changelog 措辞、**新增 `## Chord v2 Code Style`**（8 条）。
- **CI**：`build-check-test` **拆分**为 `build-check`（build→打包 preview→check）与并行 `test` 矩阵；新增 `preview-packages.yml`（117 行）+ `scripts/preview-packages.mjs`；根 `check` 链新增 `tsc --noEmit -p packages/coding-agent/examples/tsconfig.json`；根 `tsconfig.json` include 新增 `packages/ai/catalog/**/*`。

## 三类文档失效（本轮都出现了）

| 类型 | 样本 | 处置 |
|---|---|---|
| **结论整体过时** | `architecture-next/chord.md` 只描述现役 v1；v2 首次 export 且体量巨大 | 新建 `chord-v2.md`；chord.md 加 v1/v2 分界 |
| **证据链断裂（结构性）** | `docs/extensions.md` 由约 130 行**重写回完整指南**（`85c2ee3e7`），章节整体重排；旧标题 `## Understand the runtime lifecycle` / `## Choose an integration point` / `### Tools` 全部消失 | 台账机器发现 6 条；`<a id>` 锚点垫片仍在 |
| **一手依据变化（静默语义）** | `Format.Set()` 自定义 format 丢弃（标准 format 仍校验）、`Refine()` 不跑、codec 不解码、`watch.start` 换签名、`Storage.commit` 换签名 | 不改名只改行为，**台账抓不到**，必须逐条写进正文 |

## 双基线陷阱表

| 含义 | 事实 | 差异 |
|---|---|---|
| chord 运行时数量 | v1.4.0 一套（协议 4）；v1.5.0 v1 现役 + v2 experimental **并存** | 写"chord 是什么"必须指明哪一套；`./next` 在 v1.4.0 无 export |
| TypeBox 是否还在 | 运行时依赖只剩 `coding-agent` 一家（`typebox 1.3.27`，扩展 compat 映射）；`ai`/`schema` 仅在 `devDependencies` | "TypeBox 被删除"错；"TypeBox 不再是校验器"对 |
| `format` 是否校验 | v1.4.0 TypeBox 校验它认识的 format；v1.5.0 标准 format **仍校验**、自定义 `Format.Set()` format 丢弃 | **不是放松标准 format**（那部分是收紧），属改名+边界变化 |
| chord 依赖 Pi 包数 | v1.4.0：1（telemetry）；v1.5.0：**2**（+schema） | 0010 的"首次依赖"需续写而非复述 |
| `packages/schema` 规模 | 6 commit / 259 文件 / +41,224 行 | 提交数严重低估规模 |
| durable 的 `retired` | v1.4.0 是 end 原因；v1.5.0 是 **change 字段** | "watch 结束"与"文档退休"是两件事 |

## 台账重钉结果（实测）

| 语料 | 条目 | 盲跑 stale | 重钉后 |
|---|---|---|---|
| `_digested` | 34 | 2（5.9%） | **0** |
| `_faq_on_digested` | 213 | 51（23.9%） | **0** |
| `_pi_extension_agent_ready_development` | 126 | 32（25.4%） | **0** |

**关键结论**：211k 行增量**几乎没有打穿台账**，因为增量主体是全新包/全新子路径——新增面没有旧断言可失效。这条已写入 `_evidence/PLAN.md` 的常设规则。

> `E101`（引文含版本号）每轮必 stale。已给 verifier 增加 `pin` locator（按 key 读版本、忽略具体值、可选 `at` 断言），并附负例测试。
