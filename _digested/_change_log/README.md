# Change Log — upstream 同步记录

本目录记录每次从 upstream（[earendil-works/pi](https://github.com/earendil-works/pi)）同步到本地后的变更摘要。每条记录包含：

- 版本跨度（from → to）
- commit hash 范围
- commit 数量
- 核心变更归类
- 变更意义解读
- 对 `_digested/` 各子目录的影响评估

## 目录结构

```
_change_log/
  README.md
  0001-baseline-v0.75.3.md    # 初始基线：_digested/ 建立时的源码快照
  ...
```

编号递增；文件名简洁描述版本跨度。

## 与 `_digested/` 其他子目录的关系

`_change_log/` 是 `_digested/` 与 upstream 源码之间的版本历史桥梁。每次 upstream 发布新版本后：

1. **Discovery**：阅读 upstream diff、release notes、PR，写一条 sync record（`NNNN-v<from>-to-v<to>.md`），包含按领域拆解和影响评估
2. **Execution**：根据影响评估更新 `_digested/` 内受影响的专题文档，必要时创建 `_plan-N-*.md` 追踪进度

`_digested/README.md` 的顶部声明当前源码基线；正文中的机制结论描述当前 release，旧行为只记录在本目录的 sync record 中。
