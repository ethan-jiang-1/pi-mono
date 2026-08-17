# FAQ on Digested · 基于消化材料的二次研究

这个目录不是面向学习者的 FAQ。这里的每一个问题是我们在阅读消化材料、翻源码的过程中**自己产生的困惑**，答案需要跨越多个 `_digested/` 条目、甚至结合源码才能综合出来。

简单说：**一子目录 = 一个探究过的问题，答案是自己综合出来的，不是从某一份材料里直接抄的。**

> **当前研究基线**：涉及运行时行为的结论以 pi-mono `v0.84.2+8`（upstream commit `d3ab2af9`，已 merge 进本仓库）为准；旧版本仅用于变更史解释，不能替代当前源码验证。

## 和 `_digested/` 的区别

| | `_digested/` | `_faq_on_digested/` |
|---|---|---|
| 读者 | 第一次研究 pi-mono 的人 | 我自己（产出者） |
| 答案来源 | 源码消化 + 整理 | 跨多份消化材料 + 源码的综合推断 |
| 本质 | 文档 | 研究过程的归档 |
| 粒度 | 按主题分 section | 一个问题一个子目录 |

## 目录结构

```
_faq_on_digested/
├── README.md
├── <NN_question-slug>/
│   ├── question.md        # 问题描述 + 背景
│   └── answer.md          # 答案 / 分析 / 结论
```

## 命名约定

- `NN_` 数字前缀按创建时间排序
- slug 用英文，简短描述问题主题

## 已有问题

- [`01_model_switching/`](01_model_switching/question.md) — pi-mono TUI 里怎么换模型？Ctrl+P 背后发生了什么？
- [`02_tui_keybindings/`](02_tui_keybindings/question.md) — pi-mono TUI 有哪些快捷键？分别干什么？

## 引用规范

引用 `_digested/` 中的材料时使用相对路径：

```markdown
_digested/agent/01-Anatomy/1.1_Agent_Info.md
_digested/integration/03-runtime-api.md
```

引用源码时标注 commit hash 或 tag，避免链接随时间失效。
