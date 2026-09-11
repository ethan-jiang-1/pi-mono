# Q09: pi 包生态（pi.dev/packages）到底长什么样？

## 问题

pi 的包目录（https://pi.dev/packages）已经有 5000+ 包。这个生态：

1. **分布**：多少包、多少作者、月下载量、按类型（extension/skill/theme/prompt/bundle）和按类别的分布是什么？
2. **突出者**：哪些包是头部？哪些是"必须装"的？哪些是"必须做/必须有"的能力（生态里公认缺它不行）？
3. **分类**：社区自发形成了哪些品类？每类的代表是什么？
4. **趋势**：大家集中在卷什么？生态处在什么阶段？
5. **社区**：Discord / awesome 列表 / fork（oh-my-pi 等）在干什么？

## 方法

- 全量抓取 pi.dev/packages 的 109 页分页（默认按月下载排序），5412 个包的名称、描述、作者、月下载、类型、最近更新时间。
- 关键词规则对 name+desc 做多标签分类（一个包可进多类，取前两个标签计主分布）。
- 交叉验证：awesome-pi-agent（thevibeworks）、awesome-pi-coding-agent（shaftoe）、官方 /news 发布史、社区讨论（Discord/Reddit/HN）。
- 数据快照：2026-09-11，pi 0.85.1 时代。
