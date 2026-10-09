# 问题：Pi 里有没有 DSH「录制会话快照」的思想？

## 背景

读 DSH 的 `_faq_on_digested/21_recorded-session-snapshots` 时冒出来的困惑。DSH 那套东西是：真跑一次会话 → 把持久化的 `session.jsonl` 提交进仓 → 以后在无 key 的 CI 里回放、逐字节比对；用途是 trajectory 回归基线、bug 复现、model-visible 钉住，背后有一条不变量 **`model-visible ⟺ logged`**（任何到达模型请求的东西都必须能从会话日志重建）。

第一印象是「Pi 没有这套东西」——它的测试全靠 faux provider 手写剧本，仓库里也没有任何录制语料入库。但这个印象可能把「机制」和「思想」混为一谈了：DSH 21 号 FAQ 自己的记法就是「机制可以拿，制度不要抄」。所以真正要问的是三层：

- **不变量层面**：`model-visible ⟺ logged` 在 Pi 里有没有等价物？以什么形式实现？
- **测试策略层面**：faux provider + harness 在 DSH 的 `recorded` / `authored` 词汇里处在哪个位置？覆盖面差多少？
- **资产层面**：Pi 的 session JSONL 离「可入库的 trajectory 夹具」差几步？能不能 DIY 出 DSH 的那层价值？

## 要回答的问题

1. DSH #21 的思想剥到底层是什么？哪些是机制、哪些是纪律？
2. `model-visible ⟺ logged` 在 Pi 里的实现形式是什么？和 DSH 录制 `request/header` 相比，谁更强、各付什么代价？
3. faux provider 的表达力边界在哪？DSH `replay.override.json` 的四类失败（pre-2xx 抛 / post-2xx 抛 / 取消挂起 / 注入重试）faux 覆盖了几类？
4. Pi 的 session JSONL 作为轨迹资产有哪些官方通道（open/fork/export/import/share/bug-report）？为什么它不是测试语料？
5. 给 Pi 侧 extension 开发者的 DIY 路径长什么样？两个仓互相能借什么？「辅助 AI coding agent 做对东西」的元思想是什么？

## 证据边界

- Pi 侧行号核对到本仓工作树 `6401d578bfd855765d4afd2908fd883a144da5ad`（2026-10-08，`v1.0.3-107-g6401d578b`）。这是本篇的独立锚点（同 12 号先例），与 README 声明的 v1.0.3 全库基线区分；经抽查未观察到行为冲突。
- DSH 侧不重新取证，只引用其已发布的 `_faq_on_digested/21`（该篇自报基线：DSH 工作树 `187ad35d`、npm `dsh-llm-replay@0.2.0-rc.2`）。
- faux/harness 的能力清单是源码实测；DIY 转换器（session.jsonl → faux 脚本）只做了通路论证，没有落地成代码，风险单列，见 [research.md](research.md) 的「证据薄弱处」。

## 阅读顺序

1. [`answer.md`](answer.md)：四层结论、DSH↔Pi 对照表、DIY 路径、元思想。
2. [`research.md`](research.md)：逐条主张的证据账本与薄弱处。
3. **升级记录（2026-10-09）**：本问题已升级为 `_digested/` 的一手消化专题 [`_digested/trajectory/`](../../_digested/trajectory/README.md)（README + 4 篇 + 总览图）。DIY 通路已在本仓工作树实测跑通（录制 → 从落盘结算推导 faux 脚本 → 无 key 续跑 → 重放一致），原型代码与两个过程中的新发现见 [`trajectory/04`](../../_digested/trajectory/04-record-replay-diy-fixture.md)。本目录保留为研究过程归档；机制细节与实测证据以 trajectory/ 为准。
