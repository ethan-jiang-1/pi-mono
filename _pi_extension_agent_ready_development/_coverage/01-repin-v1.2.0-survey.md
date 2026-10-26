# 扩展语料 re-pin 勘察：v1.0.3 → v1.2.0

**日期**: 2026-10-13
**对象**: `_pi_extension_agent_ready_development/`
**当前基线**: tag `v1.0.3`（`d78dc83d6`，见 `_coverage/00-corpus-maintenance.md`）
**目标基线**: tag `v1.2.0`（`06a466935`）
**结论**: **不能做机械 tag 替换**。外链可批量改，但行号锚点有 21 处实质失效、另有 1 个文件被改名，必须逐条复核后才改。

## 硬约束

`verify.mjs:26` 的 `PINNED_EXTERNAL` 只接受 `https://github.com/earendil-works/pi/{blob,tree}/v1.0.3/...`。
`verify.mjs:161` 对任何其它外链报错。因此**基线一旦改为 v1.2.0，全部 362 条外链必须同步改写**，否则 verify 直接失败。
`_coverage/00-corpus-maintenance.md:47` 明确了这条规则的存在，:7 说明了 re-pin 的义务是"逐条复核并改写过时结论，不能只替换链接"。

## 量化

| 项 | 数 |
|---|---|
| 外链总数（全部钉 v1.0.3） | 362 |
| 其中带行号锚点 | 347 |
| 含外链的文件 | 24 |
| 引用的上游文件（去重） | 78 |
| 在 v1.2.0 **仍然存在**的引用文件 | 77 |
| 在 v1.2.0 **已不存在**的引用文件 | 1 |
| 在 v1.0.3→v1.2.0 之间**内容有变**的引用文件 | 26 |
| 锚点**超出** v1.2.0 文件行数（结构性失效） | 6 |
| 锚点所引 v1.0.3 文本在 v1.2.0 中**完全找不到**（内容性失效） | 21 |

## 失效类型 A：文件已删除/改名（1 个文件，3 处锚点）

`.github/workflows/durable-env.yml` → **`env.yml`**（`env-daemons.yml` 两版都有，非新增）。
v1.2.0 的 workflow 清单比 v1.0.3 tag 多一个文件（13 vs 12）。

受影响：`sdlc-reference/04-ci-matrix.md` 的 `L3-L7`、`L14-L43`、`L45-L66`。

> ### 重要陷阱：两个不同的"v1.0.3"
>
> 本仓库里存在**两个**可作为基线的 commit，改名发生的区间不同，极易得出相反结论：
>
> | 含义 | commit | `.github/workflows/` 里的 env 文件 |
> |---|---|---|
> | **真正的 `v1.0.3` tag**（本语料的基线） | `d78dc83d6` | `durable-env.yml` |
> | `_digested/_change_log/0009` 用的区间起点 | `98d2e1947` | `env.yml`（**已改名**） |
>
> `v1.0.3` 是 `98d2e1947` 的祖先，两者相隔 **23 个 commit**；改名就发生在这 23 个里。
>
> 后果：用 `git diff <base> <target>` 去核对 `durable-env.yml` 是否存在时，**如果 `<base>` 取了 `98d2e1947`，diff 会（正确地）显示没有改名**，因为起点里它已经叫 `env.yml` 了。据此会错误地判定"语料里的 `durable-env.yml` 链接没问题"。本次取证中确实出现了这个误判。
>
> **rules**：核对语料外链的存活，必须以 **`git ls-tree v1.0.3`**（tag）为准，不能用 `0009` 的区间起点 `98d2e1947`。两者的 `.github/workflows/` 清单不同（`durable-env.yml`→`env.yml` 的改名就发生在这 23 个 commit 内）。
>
> **勿把两处清单差异混为一谈**：`packages/` 的差异是**另一回事**——`98d2e1947` 仍有 `client`/`protocol`/`server` 三包（**14** 个包），三包删除（`7472cda0d`）**不是** `98d2e1947` 的祖先，它发生在 **`98d2e1947`→`v1.2.0`** 区间内，**不在**上面那 23 个 commit 里。故：改名看 `d78dc83d6` vs `98d2e1947`（包数相同），三包删除看 `98d2e1947` vs `v1.2.0`（14 → 11）。
>
> **且勿把两处清单差异混为一谈**：`packages/` 的差异是**另一回事**——`98d2e1947` 仍有 `client`/`protocol`/`server` 三包（**14** 个包），三包删除（`7472cda0d`）**不是** `98d2e1947` 的祖先，发生在 **`98d2e1947`→`v1.2.0`** 区间内，不在上面那 23 个 commit 里。故：改名看 `d78dc83d6` vs `98d2e1947`（差 0 个包），三包删除看 `98d2e1947` vs `v1.2.0`（差 3 个包，14 → 11）。

> 语料 `_coverage/00-corpus-maintenance.md:27-30` 已经把这次改名记为"已知基线漂移"（HEAD 相对 v1.0.3）。re-pin 后这些漂移注记**本身过期**——它们描述的正是新基线，需要改写或删除。

## 失效类型 B：锚点超出文件长度（3 处，`scripts/publish.mjs`）

`scripts/publish.mjs` 从 3529 字节缩到 2781 字节（110 行 → 64 行），三处锚点 `L50-L68` / `L69-L72` / `L85-L108` 全部越界。
受影响：`sdlc-reference/07-release-and-recovery.md`。

## 失效类型 C：锚点在范围内但内容已变（21 处，风险最高）

这些锚点不会让 verify 失败，也不会越界——**但引用的原文已经不在那个位置，甚至完全不在文件里**。这类失效最危险，因为它静默通过所有自动检查。

按文件分组：

| 文件 | 失效锚点数 | 说明 |
|---|---|---|
| `sdlc-reference/07-release-and-recovery.md` | 7 | `scripts/publish.mjs`(×3)、`scripts/local-release.mjs`、`scripts/release.mjs`、`.pi/skills/release.md`、`.github/workflows/build-binaries.yml` |
| `sdlc-reference/03-check-pipeline.md` | 5 | `package.json`(×2)、`scripts/check-runtime-deps.mjs`、`scripts/check-entry-graphs.mjs`、`scripts/generate-coding-agent-install-lock.mjs` |
| `repo-harness/07-monorepo-taxonomy.md` | 3 | `README.md`(×2)、`packages/chord/README.md` |
| `repo-harness/04-extension-points-map.md` | 2 | `packages/coding-agent/docs/extensions.md`(×2) |
| `sdlc-reference/04-ci-matrix.md` | 1 | `.github/workflows/ci.yml` |
| `sdlc-reference/01-contribution-gates.md` | 1 | `.github/workflows/issue-triage-labels.yml` |
| `repo-harness/06-scope-discipline-and-cost-contracts.md` | 1 | `scripts/check-entry-graphs.mjs` |
| `repo-harness/02-terms-and-mental-models.md` | 1 | `packages/coding-agent/docs/extensions.md` |

**聚集规律**：失效集中在 `sdlc-reference/` 的 **check 管线 / CI 矩阵 / 发布恢复**三页，以及 `repo-harness/` 的**扩展点地图 / 分类学**两页。这正是上游 v1.2.0 改动最密的区域（durable 重写、codemode 位置、release 脚本、workflows）。

## 内容漂移最大的引用文件（re-pin 时优先读）

| 文件 | 字节变化 |
|---|---|
| `packages/durable/README.md` | 36,200 → **52,291**（+16K，新增 Errors 节等） |
| `packages/chord/README.md` | 13,070 → **7,505**（−5.5K，runtime 重写） |
| `scripts/local-release.mjs` | 9,283 → 6,925 |
| `packages/coding-agent/docs/extensions.md` | 19,852 → 21,516 |
| `packages/coding-agent/docs/cli.md` | 15,194 → 16,951 |
| `packages/coding-agent/docs/codemode.md` | 12,268 → 14,011 |
| `README.md` | 9,211 → 10,635 |
| `scripts/check-entry-graphs.mjs` | 5,566 → 6,676 |
| `scripts/publish.mjs` | 3,529 → 2,781 |

## 机制结论层面（不只是锚点）

re-pin 不只是补链接。v1.2.0 相对 v1.0.3 有几处会**改变语料论断本身**：

1. **`packages/` 清单 13 → 11**：`client`/`protocol`/`server` 三包删除。语料卷三 `07-monorepo-taxonomy.md` 若按包清单分类，结论需重写。
2. **chord 定位变了**：facet/service runtime → typed host runtime，`esbuild` → `typebox`，首次有 CHANGELOG 与 `docs/`。语料若以 chord 为例讲"未发布/无文档的包"，该例失效。
3. **codemode 位置**：coding-agent 的 `src/tools/` 目录整体消失，codemode 移到 `src/extensions/codemode/`；durable 另有平行实现。语料若引 `src/tools/` 路径，全部失效。
4. **`--tools` 语义**：`+name`/`-name` 增量条目（1.1.0）。语料若讲 `--tools` 是替换语义，需改。
5. **配置 schema 发布**：`https://pi.dev/schemas/*.schema.json` 成为新的一手来源；theme schema 校验收紧。
6. **`ExtensionAPI` 面**：`before_agent_start` 变 union（按 `messageType`）、`reachesTools`、`ToolNamespace.aliases`。卷一与卷三扩展点地图必受影响。
7. **`env.yml` 改名 + `env-daemons.yml` 新增**，`ci.yml` 新增 daemon 构建步骤。

## 建议执行顺序

1. 先改 `_coverage/00-corpus-maintenance.md`：基线 → `v1.2.0`(`06a466935`)，"已知基线漂移"节整体重写（原内容描述的就是新基线），"本轮已核验的证据范围"表按 v1.2.0 重核，历轮记录加 **0006** 条。
2. 改 `verify.mjs:26` 的 `PINNED_EXTERNAL` → `v1\.2\.0`，以及 `verify.mjs:9-10` 的注释。
3. 批量改写 362 条外链的 tag 段（机械）。
4. **逐条复核 21 处内容性失效锚点** + 6 处结构性失效锚点（人工，按上表三页两页优先）。
5. 复核 26 个内容有变文件里被引用的**英文引文**是否逐字仍成立——语料的规则是"关键规则以 blockquote 摘录仓库原文"，引文失配比行号失配更严重。
6. 处理上节"机制结论层面"7 条对正文论断的影响。
7. 运行 `node verify.mjs` 与 `node verify.test.mjs`。

> `verify.test.mjs` 会断言"非 pin tag 的外链被拒绝"，因此第 2 步与第 3 步必须同一轮完成，否则测试与语料互相矛盾。
