# 03-Memory: 上下文管理与记忆压缩

本节拆解 pi-mono 如何在有限的 LLM context window 内管理日益增长的对话历史。四篇文档覆盖从"什么时候该压缩"到"压缩什么"到"怎么算 token"到"树的记忆结构"的完整链路。

## 文件索引

| 文件 | 标题 | 核心关注点 |
|------|------|-----------|
| 3.1 | Compaction | 自动压缩的决策、分割、摘要生成、分回合处理 |
| 3.2 | Branch Summary | 分支导航时的自动摘要生成、collectEntriesForBranchSummary |
| 3.3 | Token Estimation | 双层 token 估算策略（provider 上报 + chars/4 启发式） |
| 3.4 | Session Tree | 树形对话结构如何支撑记忆保留、分叉、导航与上下文重建 |

## 核心问题链

```
上下文什么时候满了？
  → 3.3 (Token Estimation: estimateContextTokens / shouldCompact)

满了怎么裁？
  → 3.1 (Compaction: findCutPoint → prepareCompaction → compact)

裁完后模型还懂上下文吗？
  → 3.1 (SUMMARIZATION_PROMPT 结构化格式)
  → 3.4 (buildSessionContext 中 compaction 边界的处理)

用户切换分支后怎么让模型知道"刚才发生了什么"？
  → 3.2 (Branch Summary: collectEntriesForBranchSummary → generateBranchSummary)

整个对话历史究竟怎么存的，为啥能随便跳转？
  → 3.4 (Session Tree: append-only tree + LeafEntry + moveTo)
```

## 与 Runtime 的关系

Memory 系统与 02-Runtime 紧密耦合：

- **Compaction 决策时机：** AgentSession 在 `agent_end` 后调用 `_checkCompaction()`，检查是否需要 auto-compaction。
- **transformContext 钩子：** Runtime 的 `AgentLoopConfig.transformContext` 是另一个上下文裁剪的插入点（AgentMessage 级别，在 LLM 转换之前）。
- **Session 树 vs Runtime 队列：** Runtime 的双循环（2.1）和双队列（2.6）产生消息 → Session 树（3.4）持久化所有消息和状态变化 → Compaction（3.1）在树路径上做截断。
