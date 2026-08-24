# 答案：Pi 静态层几乎没有"画地图"——它把地图委托给了运行时

## 一句话结论

Pi 没有像 DSH 那样在静态层把"地图"画出来（薄内核页表 + tier + 预算 + 机器检查）。Pi 的静态层是**故意少画地图**：根 `AGENTS.md` 是厚规则不是地图、没有 root `architecture.md`、没有 tier taxonomy、没有字数预算、没有链接门禁。它唯一显眼的静态选择是**把地图交给运行时**——`README.md:24` 那句 *"you can also ask the agent to explain itself"*，以及 docs 随 npm 包分发（不在 repo 根）。

（这是**静态**结论：它说的是"图"本身长什么样。图在运行时怎么被组装、被走完、超预算怎么收，见 [`05_root_entry_doc_navigation`](../05_root_entry_doc_navigation/answer.md)。）

---

## 根入口的分工（Pi 静态层）

| 文件 | 读者 | 职责 | 不做什么 |
|---|---|---|---|
| `README.md` | 人（首次用户/贡献者） | 产品、3 个关键包、权限与容器化、开发命令、供应链、OSS 分享 | 不承载 agent 规则；**没有**"README 对人 / AGENTS 对模型"的分流语句 |
| `AGENTS.md` | coding agent（也给人） | 169 行 standing orders：Style / Code Quality / Commands / Git / Release… | **不写布局地图**、不写总模型、不写教程 |
| `CONTRIBUTING.md` | 贡献者 | core-minimal 哲学、一条规则、贡献门 | 不承载 agent 日常工作规则 |
| （无 root `docs/`） | — | Pi 的 docs 在 `packages/coding-agent/docs/`（30+ 篇） | 没有 root `architecture.md` |
| （无 root `CLAUDE.md`） | — | 只有 `.claude/settings.local.json`（本地设置） | 不像 DSH 把 CLAUDE.md symlink 到 AGENTS.md |
| `SECURITY.md` | 人 | 安全披露流程 | — |
| package README | 用/改某包的人或 agent | **API 参考**（如 `packages/agent/README.md` 513 行：Quick Start / Event Flow / Options / Methods） | 不是"合同"，是教程式参考 |

**关键观察**：`README.md:50` 写的是 AGENTS.md *"for both humans and agents"*——Pi 把人和模型混为一谈，没有 DSH 的两入口分流。

---

## 静态层的"缺失清单"（这是 Pi 静态设计最诚实的一面）

Pi 静态层**没有**的东西，恰好是 DSH 静态层的核心：

| DSH 静态层有 | Pi 静态层 |
|---|---|
| 根 `AGENTS.md` = 薄内核页表（总模型 + 布局 + 命令 + 链接 home） | 根 `AGENTS.md` = 169 行厚规则，无布局、无总模型（"core minimal" 在 `CONTRIBUTING.md`） |
| root `docs/architecture.md` 统一架构地图 | 无；架构知识散在 `packages/coding-agent/docs/` 各篇 |
| tier taxonomy（一个事实一个家） | 无显式 taxonomy |
| 常驻层字数预算（≤1600 words，relocate→condense→raise） | 无预算，规则只会加不删（熵增风险） |
| `verify-md-links` / `verify-doc-budgets` 机器检查 | 无（`scripts/` 里只有 build/release/lockfile/model-catalog） |
| `CLAUDE.md` symlink → `AGENTS.md` | 无 CLAUDE.md |

**一个具体后果**：`README.md` 的 "All Packages" 表只列了 5 个包（telemetry/ai/agent/coding-agent/tui），漏掉 experimental 的 protocol/client/server/evals 和 infra 的 session-backends。没有机器检查，这种"地图漂移"不会被 CI 发现——这正是"静态层不保证地图不坏"的直接证据。

---

## 静态层唯一显眼的两个选择

1. **docs 随包分发**（`packages/coding-agent/package.json` 的 `files` 含 `docs`、`examples`）：文档不活在 repo 根的 `docs/`，而是跟着 npm 包走。这是静态层为运行时铺的路——文档的位置决定了它"运行时够得着"（见 05）。
2. **"ask the agent to explain itself"**（`README.md:24`）：把"文档在哪"这个问题，从静态层推给运行时（agent 自述）。

这两个选择的共同点是：**Pi 不在静态层承诺"地图"，而是把"地图"这个责任整体移交到运行时。**

---

## 独特且可迁移的静态判断

1. **如果你的 harness 是 library-first，地图不该跟着 repo 走，该跟着包走**：嵌入方拿到的不是"你的 repo"，是"你的 npm 包"；docs 必须打进包（`files`），静态层才有意义。
2. **package README 定位成"API 参考"而非"合同"**：`agent/README.md` 513 行把事件序列、选项、方法都写全了——这是"给 SDK 使用者的参考"，不是 DSH 式的"短合同"。两种定位各有取舍。
3. **诚实面对"不画地图"的代价**：Pi 用"少画地图"换了"少维护一份 architecture.md + taxonomy + 门禁"，但代价是地图会漂移（All Packages 漏包）且无人发现。这是可迁移的教训，不是可迁移的优点。

---

## 引用

- `README.md`：L11（auto-close 提示）、L24（"ask the agent to explain itself"）、L26-35（All Packages 表，只列 5 个）、L50（AGENTS.md "for both humans and agents"）
- `AGENTS.md`（根）：169 行，无 repository layout 节、无 core-minimal 总模型
- `CONTRIBUTING.md`：开篇 "pi's core is minimal" + "The One Rule"
- `packages/agent/README.md`：513 行 API 参考（Quick Start / Event Flow / Options / Methods）
- `packages/coding-agent/package.json`：`files` 含 `docs`、`examples`
- `scripts/`（根）：无 verify-md-links / doc-budget
- 运行时消费（另一半）：[`05_root_entry_doc_navigation`](../05_root_entry_doc_navigation/answer.md)
