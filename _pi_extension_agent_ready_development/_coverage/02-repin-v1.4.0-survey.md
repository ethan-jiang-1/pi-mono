# re-pin v1.4.0 勘察（0015 轮）

**基线变更**：`v1.2.0`（`06a466935`）→ **`v1.4.0`**（`4a080252f`），跨 v1.3.0（`71023aec1`）。上游区间 144 commit、477 文件、+33,481/−10,733。
**Discovery**：`_digested/_change_log/0010-v1.2.0-to-v1.4.0.md`（语料外路径，按约定不建链接）。

## 机械勘察

| 项 | 结果 |
|---|---|
| 语料 Markdown 文件 | 31 |
| 外链 | 369 条（79 个不同的上游路径） |
| 外链 tag 替换 | 369 条全部由 `v1.2.0` → `v1.4.0`（`verify.mjs` 的 `BASELINE_TAG` 同步） |
| 上游路径在 v1.4.0 的存在性 | **全部存在**（0 删除/改名） |
| `#L` 行号越界 | **0**（逐条对 `git show v1.4.0:<path>` 的行数校验） |
| 区间内被改且被语料引用的文件 | **23** 个——`docs/{extensions,compaction,cli,settings,sessions,codemode,custom-provider}.md`、`AGENTS.md`、`.pi/skills/release.md`、`scripts/{check-entry-graphs,check-pinned-deps,publish-model-catalog,release,sync-versions}.mjs/js`、`package.json`、`test.sh`、`.github/workflows/{nix,publish-model-catalog}.yml`、`packages/{chord,durable}/README.md`、`packages/evals/package.json`、`packages/coding-agent/test/suite/harness.ts` |

**结论**：本轮没有 0009 那种"被删包/被删文档导致的结构性死链"。失效全部是**引文内容与行号**，`verify.mjs` 的结构检查管不到。

## 内容层失效（逐条已改）

| 页 | 问题 | 处置 |
|---|---|---|
| `repo-harness/01` | AGENTS.md 的 pinned-deps 引文还是 "Direct external deps" | 换成 "Direct **registry** deps, including internal workspace deps"；补"内部包不再豁免" |
| `repo-harness/03`、`00-index`、`README`、术语页 | "三个 skill" | 四个（+`github-work`），并补它的 skill→prompt 路由合同 |
| `repo-harness/07` | chord "不依赖任何其它 Pi workspace 包" | v1.4.0 依赖 `pi-telemetry`；底座关系改为 telemetry 横切 |
| `sdlc-reference/03` | pinned-deps 的"内部包例外"；entry-graphs 预算 15；`check` 首项写成 biome 直调 | 例外删除；预算 20 + `allow`；首项改为 `node scripts/biome-check.mjs --write` |
| `repo-harness/06` | entry-graphs 预算 15 / 62 | 20 / 73；补 `allow` 概念 |
| `sdlc-reference/07` | release 第 3 步"`--if-stale` 刷新 pin"；release.mjs 12 处行号 | 改为"pin 最新目录 + hydrate + build:offline"；行号整体下移（最大 +43） |
| `sdlc-reference/04` | nix.yml 5 处行号；publish-model-catalog 缺兼容检查步骤 | 行号 +1；补 `check:model-catalog-compat` 与 `fetch-depth: 0` |
| `_coverage/00` | 基线仍 v1.2.0 | v1.4.0；`@ v1.2.0` 证据表标注为时点快照 |

## 未处理（明确不属本轮）

- 旧错已随本轮修掉两条：`sdlc-reference/03` 的 biome 引文、`repo-harness/06` 的 62 预算；另删除了"`repo-harness/00:23` 把 CONTRIBUTING 句子标成 AGENTS.md"这条——复核后该句确实在 `AGENTS.md:54`，不是错。
- `_digested` 内与 v1.4.0 无关的存量锚点债务。
- post-tag 的 68 个 commit（preview 包、`Watchable`、只读 Harness 等）。

## 验证

- `node verify.mjs`：40 文件、全部规则通过。
- `node --test verify.test.mjs`：通过。
- 外链 tag 与行号：见上表；`verify.mjs` 不核对远端内容，这一层靠本页的逐条复核。
