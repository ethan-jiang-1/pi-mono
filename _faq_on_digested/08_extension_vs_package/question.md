# 08 — pi 里为什么同时有 Extension 和 Package 两个概念？区别是什么？

## 问题

翻 pi 文档时，Extension 和 Pi Package 是两篇并列的文档：

- `packages/coding-agent/docs/extensions.md`
- `packages/coding-agent/docs/packages.md`

但两边都在说"装扩展"：`pi install npm:xxx` 装的是 package，`~/.pi/agent/extensions/` 放的是 extension；settings.json 里又有并列的两个键 `packages` 和 `extensions`。CLI 的 `--extension / -e` 既能传本地 `.ts`，也能传 `npm:`/`git:` 源。

于是产生困惑：

1. 既然 package 里装的也主要是 extension，为什么还要单独造一个 "package" 概念？
2. settings 里 `packages` 和 `extensions` 是不是同一个东西的两种写法？把本地目录写进 `extensions` 会不会也变成 package？
3. 一个 package 到底等于几个 extension？

## 背景约束

- 研究基线：pi-mono v0.85.1，本仓库 commit `bec2f968`（HEAD）。
- 主要证据来自源码，而不是文档措辞：
  - `packages/coding-agent/src/core/package-manager.ts`
  - `packages/coding-agent/src/core/resource-loader.ts`
  - `packages/coding-agent/src/core/pi-manifest.ts`
  - `packages/coding-agent/src/core/settings-manager.ts`
