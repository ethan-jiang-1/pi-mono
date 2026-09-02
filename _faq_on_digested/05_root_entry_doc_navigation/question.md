# 问题：Pi 跑起来之后，根入口文档是怎么被消费的？

## 背景

[`04_root_entry_doc_design`](../04_root_entry_doc_design/question.md) 回答了**静态一半**：Pi 静态层几乎没有"画地图"，它把地图委托给了运行时。但"委托给运行时"不等于"模型真的走对了路"——system prompt 是谁组装、什么时候进上下文？模型读完入口，用哪个工具去读下一份文档？上下文超预算了谁回收？这些才是"按图索骥"真正落空与否的地方。

本问题回答**动态一半**：Pi 一旦跑起来，根入口文档在运行时实际经历了什么。

（对照基线：DSH 那边的同款问题在 `deepseek-harness/_faq_on_digested/05_root-entry-doc-navigation`，答案是"注入(push) + 导航(pull) + 回收(recycle)"三件机器执行的事。本问题问 Pi 的运行时是同样三件，还是别的。）

## 要回答的问题

1. system prompt 是怎么进模型上下文的？是模型"主动读"，还是运行时"注入"？什么时候、由谁组装？
2. 模型的"Available tools"和"Guidelines"段落是怎么来的？是手写死文本还是运行时聚合？
3. 模型怎么按需走图？用哪些工具、什么时候拉取 docs 或 skill？
4. 项目上下文（`AGENTS.md`/`CLAUDE.md`）是怎么进上下文的？推还是拉？
5. skills 怎么被拉取？闸门在哪？
6. 上下文超预算 / 长任务时怎么回收？
7. 运行时这套机制与静态设计（04）是什么关系？

## 证据边界

- 运行时机制引用 pi-mono 源码：`packages/coding-agent/src/core/system-prompt.ts`、`agent-session.ts`、`resource-loader.ts`、`skills.ts`、`packages/agent/src/harness/compaction/`。
- 静态设计（docs 随包、无架构地图、AGENTS.md 厚规则）只引用 04 的结论，不重证。
- 当前源码基线：pi-mono `v0.84.4`（upstream tag `b79e4cc83`，已 merge 进本仓库）。
