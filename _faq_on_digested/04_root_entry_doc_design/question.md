# 问题：Pi 根入口文档的静态设计——这张地图是怎么画出来的？

## 背景

一个 coding agent 第一次进入仓库，最先接触的通常不是代码，而是根 `README.md`、`AGENTS.md` / `CLAUDE.md` 和它们链出去的文档。很多仓库在这里有两类失败：**入口太厚**（试图讲完一切，模型读不完或抓不住主线）或**入口太薄**（只有礼貌性概述，真正的地图散落在 wiki/issue/代码注释里）。

本问题只回答**静态一半**：Pi 作为仓库，是怎么**设计**根入口文档与文档组织的——地图是怎么画出来的、为什么这么画、怎么保证地图不坏。**跑起来之后这些文档怎么被消费**（谁注入、模型怎么走、超预算怎么收），是另一个问题，见 [`05_root_entry_doc_navigation`](../05_root_entry_doc_navigation/question.md)。

（对照基线：DSH 那边的同款问题在 `deepseek-harness/_faq_on_digested/04_root-entry-doc-design`，结论是"根 AGENTS 是薄地图 + 一个事实一个家 + 预算 + 机器检查"。本问题问的是 Pi 走了同一条路还是另一条路。）

## 要回答的问题

1. 根 `README.md`、根 `AGENTS.md`、`CONTRIBUTING.md` 各自扮演什么角色？Pi 有没有"README 对人 / AGENTS 对模型"的显式分流？
2. Pi 有没有 root `docs/`、root `CLAUDE.md`？docs 在静态层住在哪（位置、随包与否）？
3. Pi 的"地图"在静态层长什么样？有没有 `architecture.md`、有没有 tier taxonomy、有没有字数预算、有没有机器检查？
4. `README.md` 的 "All Packages" 表为什么只列了 5 个包？这暴露了静态地图的什么性质？
5. package README 在静态分工里是什么（API 参考？合同？）？
6. 有哪些独特且可迁移的**静态**设计判断？

## 证据边界

- 结论只引用 pi-mono 官方文件：根 `README.md`、根 `AGENTS.md`、`CONTRIBUTING.md`、`packages/coding-agent/docs/`、package README、`packages/coding-agent/package.json`（`files`）。
- 运行时的加载/导航机制（`buildSystemPrompt`、`resource-loader`、`read` 工具、compaction）不属于本问题，归 [`05_root_entry_doc_navigation`](../05_root_entry_doc_navigation/question.md)。
- 当前源码基线：pi-mono `v0.85.1`（upstream tag `d981de122`，已 merge 进本仓库）。
