# 7 · 方法与数据附录

## 7.1 数据来源

| 来源 | 内容 | 时间 |
|---|---|---|
| pi.dev/packages 全量分页抓取 | 109 页 × 50 条 = 5412 包：名称/描述/作者/月下载/类型/最近更新 | 2026-09-11 |
| GitHub API | earendil-works/pi stars/forks/issues、issue 检索 | 2026-09-11 |
| pi.dev/news + /docs/latest | 0.80→0.85.1 release notes、扩展/包文档 | 2026-09 |
| awesome-pi-agent（thevibeworks）raw README | 策展层交叉验证 | 2026-09 |
| 社区 writeup ~10 篇（EN/CN/JP） | 情绪/痛点/流行组合 | 2026-05→09 |

## 7.2 抓取方法

- 分页端点：`https://pi.dev/packages?page=N`（默认按月下载降序；`?page=1` 302 到根页面，从 N=2 起抓，第 1 页从缓存 HTML 解析）。
- 解析：每张卡片取 `data-package-name/types/path` + `packages-meta` 三个 span（作者、月下载、更新时间）。月下载形如 "866.3K"，K=千、M=百万；无 meta 的包（多为刚发布/零下载）记 0。
- 原始数据：`/tmp/pipkg/full_1.json`、`full_61.json`、合并后 `all.json`（会话临时区，未入库）。

## 7.3 分类方法与局限

- 关键词正则多标签匹配（name+desc），17 个品类，取首个命中为主类。类别间有重叠（一个包可命中多类），主类口径用于看结构。
- 已知误差：pi-web-access 因描述含 "Parallel" 被误入编排类；pi-goal-x 因 "auditor" 被误入审查类；feynman 被归 web 类。**各品类代表包已人工校正**，占比数字有 ±2% 量级误差，不影响结构结论。
- "未分类" 946 个（17%）：命名/描述无特征的小包，多为 bundle 或垂直工具。

## 7.4 数字口径说明

- "5412 包"是 pi.dev gallery 索引数；npm 上 `pi-package` keyword 实际 ~5890（issue #6991 报告索引滞后）。两口径差 ~8%。
- 月下载取自 catalog 卡片（页脚 `/mo`），与 npm 官方 downloads API 可能有出入，用于相对比较而非绝对精确。
- 更新时间为"x分钟/x天/x月前"相对值，桶边界有截断误差。
- 5 月的 "~2143 包" 来自 [Implicator.ai](https://www.implicator.ai/pi-is-not-a-claude-code-rival-it-is-a-harness-rebellion/)（2026-05-06），7 月末 "~5890" 来自 issue #6991 的 npm 检索，非同一口径，趋势方向可信、精确倍数不可信。

## 7.5 社区调研说明

- Discord 内容不可程序化抓取，社区情绪来自 GitHub issues/Discussions + 被媒体转述的 Reddit 帖（r/LocalLLM、r/ClaudeCode、XDA）+ X 上作者/用户发言的转述。
- 本目录基线：pi-mono v0.85.1（见根 [README.md](../README.md)）。包生态数字全部标注快照日期，生态变化以周为单位，引用时请核对时效。
