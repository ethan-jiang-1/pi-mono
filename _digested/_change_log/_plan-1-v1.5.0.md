# 同步计划 0011：v1.4.0 → v1.5.0（含语料处置）

**日期**: 2026-11-02
**目标 tag**: `v1.5.0` = `f9a263655`（2026-11-02）
**当前基线**: `v1.4.0` = `4a080252f`（本仓库 `ethan` = `b59c258dc`，`v1.4.0-119`，merge-base 正好是 `v1.4.0` tag）
**Discovery 记录**: `0011-v1.4.0-to-v1.5.0.md`（本计划的输入，先于执行产出）
**摘要**: `_summary-v1.5.0.md`

> **基线口径**：钉 release tag `v1.5.0`，**不追 main tip**。`upstream/main` 在 tag 之后还有 **270** 个 commit（`085c84e98`），其中含正在进行的 p2 web UI 重构、`detail` 设置、`watchEvents` 后续调整——追 tip 会让本轮结论在下一轮全部作废。post-tag 内容单列一节，不进基线。

---

## 0. 一句话结论：这一轮的"大"不在 breaking 数量，而在结构

v1.5.0 是单 minor，308 commit，但 diff 是上一轮（v1.2.0→v1.4.0，跨两个 minor、144 commit、477 文件 +33,481/−10,733）的 **4~6 倍**：

| 指标 | v1.2.0→v1.4.0 | v1.4.0→v1.5.0 | 倍数 |
|---|---|---|---|
| commits | 144（跨 2 个 minor） | **308**（1 个 minor） | 2.1× |
| 文件 | 477 | **1,578** | 3.3× |
| 行 | +33,481 / −10,733 | **+211,745 / −14,707** | 6.3× / 1.4× |

**"加"远大于"减"**（增量是删量的 14 倍）——这与 1.0.0（大收缩）、1.2.0（删三包）形态相反。原因唯一：`packages/schema` 首发 + chord v2 五个 slice + durable 的 watch/commit 重写，三者都是**新增面**，不是替换面。

四个结构性变化，按对其他部分的影响力排序：

1. **新增第 12 个包 `packages/schema`（`@earendil-works/pi-schema`）** —— 259 文件 +41,224/−0。它是 v1.5.0 里**唯一零删除的包**，也是唯一"从第一行就是新的"的东西。
2. **TypeBox 全线退场，ai/agent/durable/chord/coding-agent 五包同时换校验底座** —— 这是本轮唯一的**跨包横切 breaking**，也是唯一会打到**扩展作者**的 breaking。
3. **chord 变成双运行时**：v1（现役，`@earendil-works/chord`）+ v2（`@earendil-works/chord/next`，**首次获得正式入口**）。chord 一个包 150 commit、+119,331/−762，其中 `src/next` + `src/next-node` 是 **188 文件 +36,221/−0 的纯新增**。
4. **durable 的一次性重写**：`Storage.commit()` → `commitSeries`、watch 语义整体换形、`watchEvents()` 删除、进度写入 deferred。34 条 Breaking（占全仓 41 条的 83%）。

---

## 1. 变化面到底有多大（按包，可核验）

| 包 | commits | 文件 | 行 | Breaking | 性质 |
|---|---|---|---|---|---|
| `chord` | **150** | 625 | +119,331/−762 | 7 | v2 五个 slice 纯新增（next/next-node 188 文件 +36,221/−0）+ v1 换 pi-schema + watch 语义重写 |
| `coding-agent` | 87 | 191 | +9,365/−1,673 | 1 | 流式性能、扩展 changelog、MCP OAuth CIMD、`pi update` 包装、大量 fix |
| `durable` | 43 | 205 | +29,208/−5,496 | **34** | Storage 批量提交、watch 换形、`watchEvents` 删除、deferred progress、`runFailure` |
| `ai` | 32 | 191 | +9,204/−5,257 | 4 | 去 TypeBox、`StreamingJsonParser`、`totalFromProvider`、catalog 生成改 models.dev v2 |
| `tui` | 23 | 32 | +1,005/−143 | 0 | Markdown block 复用、`capturesViewportInput`、Kitty/F 键/控制字符修复 |
| `env` | 11 | 14 | +479/−68 | 1 | `RemoteWatcher` → `stop()`、`FileChange` tagged、daemon 信号处置 |
| `mcp` | 7 | 7 | +63/−10 | 0 | OAuth URL 协议校验（安全修复） |
| `agent` | 7 | 12 | +229/−82 | 1 | `AgentTool` 参数改 JSON Schema / pi-schema `Static` |
| `schema` | 6 | **259** | **+41,224/−0** | 0 | **新包** |
| `telemetry` | 5 | 2 | +11/−3 | 0 | export `source` condition |
| `evals` | 5 | 12 | +198/−79 | 0 | 跟随 schema 调整 |
| `codemode` | 5 | 3 | +11/−6 | 0 | README |

包数量 11 → **12**；12 个包全部 `1.5.0`。

**注意 `schema` 的 6 commit / 259 文件**这个比值：它不是"6 个增量提交"，是一个**从单 commit 落地的整包**（`fab2c5353` 之后 consecutive slice 式堆完 builder/compiler/coerce/formats/bench）。不要把它的提交数当规模指标。

---

## 2. 五个必须先建立的判断（决定文档怎么写）

### 2.1 `pi-schema` 是"低层依赖"，不是"新增能力"

`packages/schema` 的定位要看三件事：

- **chord 的 `package.json` 已把 `@earendil-works/pi-schema: 1.5.0` 列为常规 dependency**，`typebox` 从 dependencies 消失；`packages/chord/docs/spec.md` 里"不依赖其它 Pi 包"的表述在 v1.4.0 就已经自相矛盾（依赖 telemetry），v1.5.0 之后错误扩大一倍。
- `packages/schema/src/formats/typebox/` **直接搬了 TypeBox 的 format 实现**（`LICENSES/typebox-LICENSE` 在包里）——这是"接管"而不是"并列"。
- `coerce` 的语义被明确定义为"**TypeBox 1.3.27 的 `Value.Convert` 规则超集**"。也就是说 pi-schema 的目标就是**替掉 TypeBox 并多给一点**，不是共存。

**文档含义**：`_digested/agent/01-Anatomy/1.3_Tool_Registry.md` 这类"工具参数是 TypeBox schema"的表述要改成"JSON Schema + pi-schema 编译"，并把 `Type.Refine()` 不跑、codec 不解码、`Format.Set()` 不生效这三条**行为差异**写进去（它们不是 API 改名，是**静默语义变化**）。扩展作者最容易踩这个。

### 2.2 TypeBox 的退场是**对扩展作者部分兼容**的，写错就会误伤读者

`packages/coding-agent/docs/extensions.md:172-184` 有一节 `### Tool parameter schemas and TypeBox`，明确：

- 扩展**仍然**可以从 `@earendil-works/pi-ai` import `Type`/`Static`/`TSchema`——coding-agent 把它映射到 pi-ai 的 compat entry + 内置的 TypeBox。
- 内置工具工厂（`createReadTool()` 等）返回 `TypeBoxAgentTool<typeof schema>`，`params` 仍按 TypeBox 类型化。
- 但**校验**走 pi-schema，所以 JSON Schema 之外的 TypeBox 特性失效。

所以正确表述是三层，缺一层就会误导：

| 层 | v1.5.0 状态 |
|---|---|
| 扩展源码写法 | TypeBox import 仍可用（经 coding-agent 的 compat 映射） |
| 参数校验 | 一律 pi-schema（`compile(schema, { coerce: true }).parse()`），JSON Schema 之外特性不生效 |
| 新代码建议 | pi-schema builders（`obj`/`str`/`num`），`obj` **默认 closed**，要多属性需 `{ open: true }` |

**这是本轮唯一需要"改写法但不强制改写法"的地方**，语料里必须说清，否则读者会二选一选错。

### 2.3 chord 是**双运行时并存**，不是升级

`@earendil-works/chord/next` 在 v1.4.0 是"experimental、未导出"；v1.5.0 **首次有 package export**（`packages/chord/package.json` 的 `./next`，标注 experimental）。同时 v1（`@earendil-works/chord`）**继续是现役运行时**，而且 v1 自己也在本轮大改：

- v1 换 pi-schema（`contract.ts`、`Format.Set()` 自定义 format 丢弃而标准 format 仍校验）；
- v1 的 watch 语义整体重写：`retired` 变 change 字段、`WatchCall` 变 tagged union（`{kind:"value"|"failed"}`）、`WatchEnd` 按 `kind` 而非 `reason`、`Watch.cancel()`→`abort()`、`Watch.retire()` 删除；
- v1 加 `delta` 的 `PendingOps`/`ownedSlice`/`appendText`、`ChordStore.commitSeries`。

v2 的体量：`src/next` 156 文件 + `src/next-node` 32 文件，`docs/next/` **44 文件**（`design.md` 2,554 行、`decisions.md` 2,957 行、`slices.md` 230 行），`test/next/examples/` **144 个可运行示例**。

**文档含义**：v1.4.0 的 `architecture-next/chord.md` 是"v1.4.0 现状"页。v1.5.0 之后这一页**没有失效，但不再完整**——它描述的是现役 v1 运行时。v2 需要**独立成页**，且必须以 `docs/next/design.md` 为准，不能从 `src/next` 反推（设计文档与代码同等权威，且 decisions.md 记录了"为什么不是另一种做法"）。

**v2 的五个新面必须覆盖**：plugins（`src/next-node/plugins`，esbuild 构建 + `vm.Script` 求值 + mapStack + 热 reload + 跨插件按名导入）、registries（`defineRegistry`/`contribute`/`self.registry`）、HTTP（`src/next-node/http`，Web 标准 `fetch` handler + CSP nonce + 签 cookies）、workers（`createWorkers`/`workerMain`）、store（`commitSeries`、document histories `none|latest|rewindable`）。`esbuild` 与 `ws` 是**optional peer dependency**——这条要说，否则读者会以为 chord 变重了。

### 2.4 durable 的 34 条 Breaking 有**一条主线**，不是 34 件独立的事

不要按 changelog 顺序写。按因果分组，实际是四组：

1. **提交模型**：`Storage.commit(writes, adopt, ctx)` → `commit(batches, receive, ctx)` 返回 `{stored, refused?}`；`commitSeries`；`commitWrites()` 供测试播种；`mintId()` 契约收窄。**自定义 Storage 实现必须迁移**，changelog 给了迁移前后对照代码。
2. **观察模型**：`watchEvents()` 及 `AgentEvent*`/`SnapshotEvent`/`MessageChange`/`ToolEventCall` **整套删除**（spec §9.4 一并删）。替代是"渲染状态而不是拼装事件"——`ConversationView` 变成 transcript 的**窗口**（`ConversationWindow`，`min` 50 / `max` 100），`Conversation.entries()` 提供分页，`ConversationTranscript` 做客户端合并。同时 `documentState()`/`viewState()`/`taskGraph()` 三个 state getter 删除，`subscribeCommits()` → `observeCommits()`，`Observer<T>` 换 watch 形状。
3. **watch 换形**：跟随 chord v1 的新 watch 形状（`WatchHandle`/`WatchCall`/`WatchEnd`），外加"retired 变 flag 而不是 end""同一地址的新文档在同一条 watch 上到达""listener 忙时的帧折叠（append 合并、set 取最后、超 10,000 回退整根替换）"。
4. **持久化时机**：partial answer / running tool output 的提交 **deferred**（`settings.progress.persistWithinMs` 默认 1,000 ms）。**这是语义取舍**：SQLite 事务少 ~5.7×、长回答 27×，代价是崩溃最多丢 ~1 秒流式内容（原来 ~100 ms）。`subscribeCommits` 监听者若在展示进度，应改用 `watchDoc`/`Conversation.watch`。

另外四条零散但会打到读者的：crash-loop 不再 park 而直接结束（`restart_limit` 语义变了）、`pi.live` 非空（`runFailure` 留存）、`RunFailureReason` 新增 `nothing_to_answer`/`turn_limit`/`interrupted`、`afterTool` 对**每个**工具结果都跑（含错误结果与未提供的工具调用）。

### 2.5 模型目录换了生成源，**投递契约这次没变**

v1.4.0 引入了 `MINIMUM_PI_VERSION` + `check-model-catalog-compat.mjs`（投递契约）。v1.5.0 变的是**生成方式**：`scripts/generate-models.ts` 里的 per-provider 规则搬到 `packages/ai/catalog/`（57 文件：`build.ts`、`define.ts`、`families/*.ts`），数据源改 **models.dev v2**。

行为后果两条，都要写：realtime / image-only 模型（`gpt-realtime-2.1`、`gemini-3.1-flash-live-preview`、`gemini-3.1-flash-lite-image`）**不再作为 chat 模型提供**；新增 `chat-latest`、`gpt-5.6-cyber`、`gemini-robotics-er-2-preview`。默认 OpenAI 模型 `gpt-5.5` → `gpt-6.1-sol`（含 ChatGPT 登录后无选择时）。

同时 `AGENTS.md` 的规则从"改 `scripts/generate-models.ts`"改成"改 `packages/ai/catalog/` 的定义（见其 README）再重新生成"——**语料里的仓库规则引文要跟着改**。

---

## 3. 对三个语料的机械勘察（已实测，不是估计）

用 `_digested/_evidence/tools/verify-evidence.mjs` 把每个语料的台账对 `v1.5.0` 盲跑一遍（当前全部对 `v1.4.0` 是 0 stale）：

| 语料 | 台账条目 | 来源数 | **盲跑 v1.5.0 的 stale** | stale 率 |
|---|---|---|---|---|
| `_digested` | 34 | 34 | **2** | 5.9% |
| `_faq_on_digested` | 213 | 213 | **51** | 23.9% |
| `_pi_extension_agent_ready_development` | 126 | 360 | **32** | 25.4% |
| 合计 | 373 | 607 | **85** | 22.8% |

**这是本轮最重要的量化结论**：v1.5.0 的 211k 行增量**几乎没有打穿台账**。原因：

- 台账来源高度集中在**稳定的治理面**（`AGENTS.md`、`.github/workflows/*`、`scripts/check-*.mjs`、`packages/*/package.json`、`docs/extensions.md`），而本轮的主体增量在 `packages/schema`（全新）和 `packages/chord/src/next*`（全新）——**新增面没有旧台账可失效**。
- `docs/extensions.md` 只改了 TypeBox 一节 + 生命周期措辞，引文大面积存活。

失效原因分布（逐条核验过）：

| 原因 | 条数 | 典型 |
|---|---|---|
| `AGENTS.md` 规则改写（`npm run build` 语义、catalog 路径、changelog 规则） | 3 | E004、E022（digested）、E042/E043（faq） |
| `.github/workflows/ci.yml` 结构变（+73 行，新增 preview-packages 等） | 8 | E034/E048/E059/E061/E093/E122 |
| `docs/extensions.md` 标题/段落位移 | 6 | E083/E084/E117/E119/E125/E126 |
| `package.json` 版本 pin 从 `1.4.0`→`1.5.0`（**引文含版本号**） | 2 | E101（chord/durable 的 `pi-telemetry`/`chord` pin） |
| `scripts/check-entry-graphs.mjs` 预算与注释改写 | 4 | E129–E132 |
| `package-lock.json` 引擎/依赖块位移 | 2 | E086/E084 |
| `.pi/extensions/import-repro.ts` 注释改写 | 1 | E090 |
| `packages/evals` README/package.json | 3 | E041/E047/E079/E080 |

**槽点**：`E101` 这类"引文里带版本号"的条目**每个版本都会 stale**。这是台账设计缺陷，见 §5.4。

---

## 4. 升级执行顺序（代码先行，文档跟上）

依赖关系决定了顺序不能乱：**代码必须先到 v1.5.0，台账才能对 `v1.5.0` 校验**。所以代码同步在前，Discovery 记录与语料在中间，语料执行在后。

### P0 代码同步（0.5 天）—— **已完成**

```sh
git fetch upstream --tags
git switch ethan
git merge --no-ff v1.5.0 -m "Merge tag 'v1.5.0' into ethan"
```

**实测结果（2026-11-02）**：merge commit `82fa18e67`，**零冲突**；`git describe` = `v1.5.0-120-g82fa18e67`；`packages/` 12 个（含 `schema`）；三个语料目录在 merge 中**零改动**；`npm install --ignore-scripts` 成功（+9/−55/changed 32，0 vulnerabilities，`@earendil-works/pi-schema` 已可解析）。合并后三个台账对 `v1.4.0` 仍 0 stale，`verify.mjs` 44 文件全绿，`verify.test.mjs` 通过。

> **lockfile 注意**：`npm install` 会顺手删掉 30 处 `"libc"` 字段（本机 npm 版本把 esbuild 平台包的 `libc` 元数据丢掉了，与 v1.5.0 无关——tag 的 lockfile 里是有的）。用 `git checkout -- package-lock.json` 还原，不要让这个噪音进提交。

预期：**必须零冲突**。依据——`git diff --name-only v1.4.0 ethan -- packages` 为空，本地 119 commit 里 106 个是 `docs:` 且全部落在 `_digested/` `_faq_on_digested/` `_pi_extension_agent_ready_development/`，上游不改这三个目录（它们在 upstream 不存在，是本地专有语料）。若出现冲突，**只解自己改过的文件**，冲突落在非语料文件就 abort 并上报。

合并后立刻做三件核验：

1. `git ls-tree --name-only HEAD packages/` 应有 **12** 个包，含 `schema`。
2. `git describe --tags` 应报 `v1.5.0-<n>-g<sha>`。
3. `npm install --ignore-scripts` hydrate（本轮新增 `esbuild`/`ws` 作为 chord 的 optional peer，lockfile 有 72 行变动，**必须重装**）。跑完记得还原 lockfile 的 `libc` 噪音（见上）。

**不做**：`npm run build` / `npm test` / `npm run check` 全量跑（除非你要求）。理由：`AGENTS.md` 明确 check 需先 hydrate 模型数据，且本轮 `_digested` 的验证不依赖仓库构建。若要验证代码合并健康度，最小代价是 `npm run check` 单跑一次并只记结论。

### P1 Discovery 记录（1 天）

产出 `_digested/_change_log/0011-v1.4.0-to-v1.5.0.md`，结构照 0010：

- 版本跨度、commit 数、diffstat、按包拆解表（§1 的表可直接用，但要复核）；
- 五个判断（§2 的 2.1–2.5，每条都要落回 `git show v1.5.0:<path>:<line>` 级证据）；
- **订正 0010 的既有结论**：0010 说"chord 首次依赖另一个 Pi 包，零 Pi 依赖说法结束"——v1.5.0 之后 chord 依赖 **两个** Pi 包（schema + telemetry），且 `docs/spec.md` 的"no other Pi packages"仍然错，需在 0011 里标为**连续两轮未修的自相矛盾**。
- post-tag 段落（270 commit 不纳入，但要列出会改变结论的项）。

**并发策略**：按上一轮验证过的方式，**5 路并行 subagent** 各查一块（schema+TypeBox / chord v1 与 v2 / durable / ai+coding-agent+tui+agent+mcp+env / 仓库规则与发布工具），全部要求落回工作树逐条核验，禁止从 changelog 转述。

产出 `_digested/_change_log/_summary-v1.5.0.md`，照 0010 的 summary：一句话 + 五个判断 + 其它要点 + 三类文档失效 + 基线陷阱。

### P2 双基线陷阱表（0.25 天，和 P1 合并做）

0010 有两行陷阱表，本轮至少这几行：

| 含义 | 事实 | 差异 |
|---|---|---|
| chord 运行时数量 | v1.4.0 只有一套（协议 4）；v1.5.0 是 **v1 现役 + v2 experimental 并存** | 写"chord 现在是什么"必须指明是哪一套；`./next` 在 v1.4.0 无 export |
| TypeBox 是否还在 | v1.5.0 运行时依赖只剩 `coding-agent` 一家持有 `typebox`（扩展 compat 映射）；`ai`/`schema` 仅在 `devDependencies` | "TypeBox 被删除"是错的；"TypeBox 不再是校验器"才对 |
| `format` 是否校验 | v1.4.0 TypeBox 校验它认识的 format；v1.5.0 `{type:"string",format:"email"}` **仍拒绝** `"nope"`，只有 `Format.Set()` 自定义 format 丢弃 | **不是放松标准 format**（那部分是收紧），属改名+边界变化 |
| chord 依赖 Pi 包数 | v1.4.0：1（telemetry）；v1.5.0：2（+schema） | 0010 的"首次依赖"结论需续写而不是复述 |
| `packages/schema` 的 commit 数 | 6 commit / 259 文件 | 提交数严重低估规模；用文件与行数衡量 |

### P3 语料重钉（1.5 天）

**三个语料并行，顺序按 stale 率从低到高**（先做干净的，建立手感再碰脏的）：

#### P3.1 `_digested`（stale 2 / 34，1.5 小时）

1. 改 `_digested/_evidence/corpus.json` 的 `baseline.tag` → `v1.5.0`、`commit` → `f9a263655`。
2. 修 E001（`package.json` 的 `check` 链引文）与 E002（`tsconfig.json` 的 `include` 引文）——**先 `git show v1.5.0:package.json` 取新原文，再改 quote 与 locator**，不要盲改。
3. `node verify-evidence.mjs --corpus _digested --quiet` → 必须 `0 stale`。
4. 正文 326 处 `v1.4.0` 提及：**只改基线声明句**（`README.md` 顶部块、各页 `> 本页基线：` 横幅、`architecture-next/README.md`），**不改叙述性历史提及**（"v1.4.0 时 5,618 行"这类是时点事实，保留）。`_change_log/` 内的 59 处**一律不动**（发布历史不可变）。

#### P3.2 `_pi_extension_agent_ready_development`（stale 32 / 126，4 小时）

这个语料**自己带 `BASELINE_TAG` 常量**（`verify.mjs:29`），换 tag 是硬编码改动：

1. `verify.mjs` 的 `BASELINE_TAG = "v1.4.0"` → `"v1.5.0"`；`_evidence/corpus.json` 同步。
2. **543 处 `v1.4.0` 外链全部替换**（369 条在上一轮是外链 tag，本轮应该更多）。写一个一次性脚本，形如：
   ```sh
   grep -rl 'v1\.4\.0' _pi_extension_agent_ready_development --include=*.md \
     | xargs sed -i '' 's|tree/v1\.4\.0|tree/v1.5.0|g; s|blob/v1\.4\.0|blob/v1.5.0|g'
   ```
   只替换 URL 里的 tag 段，**不替换正文叙述里的版本号**。改完跑 `node verify.mjs`，外链正则只允许 `v1.5.0`。
3. 修 32 条 stale（原因是 §3 的表）。**逐条按新原文重取**，禁止猜。
4. 内容层失效（不走台账，要人读）：
   - `repo-harness/01-agent-entry-rules.md`：`npm run build` 规则反转（现在是"需要构建产物时就跑"，禁的是用它做类型检查）。
   - `repo-harness/07-monorepo-taxonomy.md`：包数 11 → 12，新增 `schema`；`pi-schema` 与 TypeBox 的关系要按 §2.2 三层写。
   - `sdlc-reference/03-check-pipeline.md`、`04-ci-matrix.md`：`ci.yml` +73 行、新增 `preview-packages.yml`（117 行）。
   - `extension-development-model/02-terms-and-mental-models.md`：TypeBox 词条必须改成"JSON Schema 经 pi-schema 校验；TypeBox 仅作可选写法"。
5. 新增 `_coverage/03-repin-v1.5.0-survey.md`，格式照 `02-repin-v1.4.0-survey.md`（机械勘察表 + 内容层失效表 + 未处理 + 验证）。

#### P3.3 `_faq_on_digested`（stale 51 / 213，5 小时）

stale 率最高，且 41 条集中在两个文件：`12_pi_philosophy/sdlc_evidence.md` 与 `structure_quality_evidence.md`。

1. `_faq_on_digested/_evidence/corpus.json` → `v1.5.0`。
2. 修 51 条 stale，**按文件分组批量修**（同一文件的 ci.yml/package.json 引文一起重取）。
3. **这一轮必须顺手修 §5.4 的缺陷**（版本号进引文）：`E101` 类条目改写成"引文截断到版本号之前 + 新增 `expect` 断言版本"，否则下一轮还会 stale。
4. 正文 431 处 `v1.4.0`：同样只改基线声明句与对外链接 tag。
5. 154 处正文 `#L` 行锚：这个语料**还在 P3.5 未完成状态**（见 `_digested/_evidence/PLAN.md`）。本轮**不做全量迁移**，只修 stale 涉及的页，其余记录在案。

#### P3.4 `_pi_extension_agent_ready_development` 的可独立发行性（不可破坏）

该语料声明"复制本目录即可独立使用"。所以：

- **不能**在它的正文里新增指向 `_digested/` 的链接（现在没有，保持没有）。
- 它的 `_evidence/` 必须自包含（现在就是）。
- 本轮新增的 pi-schema / chord v2 内容**若属于扩展开发范畴**才进这个语料；`schema` 包的内部机制不属于，只写"扩展怎么写参数 schema"。

### P4 语料内容层新增（不靠台账，纯写作，2 天）

这是本轮真正的工作量——**盲跑 stale 率低不等于内容没过时**（0010 的教训：「链接能解析」不等于「锚点仍指向原文」）。以下新增/重写在 §3 的机械勘察里**完全不可见**：

| 位置 | 处置 | 理由 |
|---|---|---|
| `_digested/architecture-next/chord-v2.md` | **新建**，以 `packages/chord/docs/next/design.md` 为准 | v2 首次有 export，144 个可运行示例可引用；v1 页保留 |
| `_digested/architecture-next/chord.md` | **重写横幅 + 加一节"v1 vs v2 分界"** | 现页说"v1.4.0 现状"，现在要标明"这是现役 v1 运行时；v2 见 chord-v2.md" |
| `_digested/architecture-next/README.md` | 三面 → 四面表加 chord v2 行；"experimental 定性"段落重写 | v2 带 experimental 标注 |
| `_digested/agent/01-Anatomy/1.3_Tool_Registry.md` | 重写参数 schema 一节（§2.2 三层） | 当前写 TypeBox，已过时 |
| `_digested/agent/01-Anatomy/1.4_Extension_System.md`、`04-Harness/4.4_Extension_Runner.md` | TypeBox 提及改写法 + 行为差异表 | 静默语义变化最容易误伤 |
| `_digested/extensions/02-Expansion/2.2_register_surface.md`、`2.5_second_axis_facets.md` | 同上 | |
| `_digested/extensions/04-Ecosystem/1_package_protocol.md` | 扩展包 changelog 机制（`pi.changelogPath` / `collapseChangelog`）是新的 | v1.5.0 新增能力 |
| `_digested/orchestration/07-durable-tasks.md` | **重写**：34 条 breaking 归四组（§2.4）；`watchEvents` 删除是受众面最大的变化 | 当前页有 20 处 `v1.4.0` |
| `_digested/architecture-next/durable-and-storage.md` | 同上，侧重 Storage 批量提交与 deferred progress | |
| `_digested/test-strategy/03-faux-provider-and-harness.md` | faux provider 现在流式输出 tool-call 参数 partial | 影响所有测试写法 |
| `_digested/agent/05-Infra/5.1_AI_API_Layer.md` | `StreamingJsonParser` / `ToolCallArgumentsStream` / `totalFromProvider` / `responseModel` | |
| `_digested/agent/02-Runtime/2.3_LLM_Bridge.md` | 流式参数增量解析（性能主线） | |
| `_digested/harness/*`（`5.x` 系列） | `npm run build` 规则反转、catalog 路径、chord v2 的 Code Style 新章 | `AGENTS.md` +21 行 |
| `_digested/composition/8_settings_json.md` | `progress.persistWithinMs`、`oauth.clientRegistration`、`selfUpdateCommand`、`collapseChangelog` | 四个新设置项 |
| `_digested/integration/07-chord-and-facets.md` | 加 v1/v2 分界指引 | |
| `_faq_on_digested/04_root_entry_doc_design.md`、`05_root_entry_doc_navigation.md` | 若根 README 变了要跟 | v1.5.0 根 README 未见大改，低优先 |

### P5 流程与工具（0.5 天）

1. `_digested/_evidence/PLAN.md`：更新状态表（P3.5 / P4 未完成项要如实标注），把本轮的两个**新增常设规则**写进去：
   - 新增面（全新包 / 全新子路径）**不进台账**，由内容层页覆盖——台账只跟踪**既有断言是否失效**。这是 §3 那个 22.8% 数字的直接推论。
   - 引文含版本号（`"@earendil-works/pi-telemetry": "1.4.0"`）必须**截断引文 + 加 `expect`**，否则每轮必 stale。
2. `_pi_extension_agent_ready_development/_coverage/00-corpus-maintenance.md`：加 0016 条（本轮），记录 v1.5.0 基线。
3. `_digested/README.md` 顶部基线块：改成 v1.5.0，上一基线降为 v1.4.0，历轮记录追加 0011。

### P6 全量验证（0.5 天）

```sh
# 三个语料台账
node _digested/_evidence/tools/verify-evidence.mjs --corpus _digested --quiet
node _digested/_evidence/tools/verify-evidence.mjs --corpus _faq_on_digested --quiet
node _digested/_evidence/tools/verify-evidence.mjs --corpus _pi_extension_agent_ready_development --quiet

# 结构（extension 语料自带，读者可用）
cd _pi_extension_agent_ready_development && node verify.mjs && node --test verify.test.mjs

# _digested 与 FAQ 的相对链接（文件存在性 + fragment）
# 需要现成脚本；若没有，先写一个或用 0010 用过的方式跑一遍
```

**验收标准**（全部必须满足）：

| 检查 | 目标 |
|---|---|
| 三个台账对 `v1.5.0` | 0 stale |
| `verify.mjs` 外链 tag | 只允许 `v1.5.0`，0 越界 |
| `_digested` 相对链接 | 984 条全部可解析，fragment 逐条核对（**不只查文件存在性**，0010 的教训） |
| `_faq_on_digested` 相对链接 | 844 条同上 |
| 正文裸 `#L` 行锚 | `_digested` 维持现状（9 处已有），`_faq` 不定量强制（P3.5 未完成） |
| 基线声明一致性 | `README` / 各页横幅 / 三个 `corpus.json` / `verify.mjs` 常量全部 `v1.5.0` 且互不矛盾 |

### 时间表

| 阶段 | 内容 | 预估 |
|---|---|---|
| P0 | 代码合并 + hydrate | 0.5 d |
| P1 | Discovery 0011（5 路并行 subagent） | 1 d |
| P2 | 双基线陷阱表（并入 P1） | 0.25 d |
| P3 | 三语料重钉（并行） | 1.5 d |
| P4 | 内容层新增/重写（16 处） | 2 d |
| P5 | 流程与工具 | 0.5 d |
| P6 | 全量验证 | 0.5 d |
| **合计** | | **约 6 天** |

对比 0010 轮：那一轮也是约 6 天，但**当时 stale 未知、靠人读发现 20 条失效**。本轮因为有了台账，85 条失效**开工前就是已知数**，P3 从"探索"降级为"执行"；代价是 P4 的内容层工作量上升（因为本轮新增面大）。

---

## 5. 风险与已知陷阱

### 5.1 不要在 P0 之后立刻跑 `npm run check`

本轮 `AGENTS.md` 自己改了规则：`npm run check` 是"首选检查"，`npm run build` 是"需要 `dist/` 时跑"。而 `schema` 是新包、`esbuild`/`ws` 是新 optional peer，冷启动下 check 可能因为 hydrate 顺序失败。**先 `npm install --ignore-scripts`，再按需 build，最后 check。**

### 5.2 `pi.live` / watch 的 breaking 会打到**本语料的示例代码**

`_digested` 与 `_faq` 里有大量 durable 代码片段（`watch.start(async (value, ops, ctx) => ...)`）。这些在 v1.5.0 全部失效：

```ts
// v1.4.0
watch.start(async (value, ops, ctx) => ...)
// v1.5.0
watch.start(async (call, ctx) => { if (call.kind === "failed") return; const { value, ops } = call; ... })
```

**逐片段核对**，不能只改叙述。搜索模式：`watch.start(`、`subscribeCommits(`、`documentState(`、`viewState(`、`taskGraph(`、`watchEvents(`、`Storage.commit(`。

### 5.3 不要把 chord v2 的 `docs/next/` 当"正式文档"引用而忽略 `decisions.md`

`design.md`（2,554 行）描述**是什么**，`decisions.md`（2,957 行）描述**为什么不是另一种做法**。语料的价值恰好在后者——只引 design 会写出"这是唯一做法"的错误印象。

### 5.4 台账设计的已知缺陷（本轮修）

引文里带版本号（`"@earendil-works/pi-telemetry": "1.4.0"`）导致**每个版本必 stale**。修法：引文截到版本号之前 + 用 `expect` 字段单独断言版本值。`_pi_extension_agent_ready_development/_evidence/claims.json` 已有 3 个 `expect` 条目，说明机制存在但没推广。

### 5.5 post-tag 270 commit 会诱使人"顺手追 tip"

**不做**。列进 0011 的 post-tag 段落即可。已知会改变结论的：preview 包发布流程、`Watchable`、只读 Harness、p2 web UI（`detail` 设置、插件化 tool UI）、`edit` 保留行尾、`grep` glob 相对路径。下一轮（0012）再处理。

### 5.6 FAQ 的 P3.5 未完成状态不要在本轮偷偷"完成"

`_evidence/PLAN.md` 记着 FAQ 六个热点页共 404 个 `#L` 未迁移。本轮只修 stale 涉及页，**不要顺手大改**——那会把"基线升级"和"台账迁移"两件事混在一个 diff 里，失去可回滚性。

---

## 6. 本轮明确不做

- 追 `upstream/main` tip（270 commit）。
- `_faq_on_digested` 的 P3.5 全量 `#L` 迁移。
- `_digested` 存量锚点债务的全量清理（0010 已清 20 条，剩余未量化，单独立项）。
- 任何 `packages/` 下的代码修改（本轮纯同步 + 文档）。
- 改 `_change_log/` 里已发布的 0001–0010 与各 `_summary`（发布历史不可变）。
- 为 chord v2 的 144 个示例做逐条语料化（只挑 3–5 个代表性示例进正文）。
