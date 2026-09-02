# 10f. 轴 6：跨会话持久化

## 用户问题

Agent 运行在一个 session 里。`/new` 开新 session，旧 session 的历史就没了。但有些状态（"这个任务做到第几步了""今天已经花了多少 token"）需要跨会话活着。怎么做到？

## 是什么

`pi.appendEntry(namespace, data)` 把数据写入当前 session，持久化到磁盘。

读取方式：`on("session_start")` 事件触发时通过 `sessionManager.getEntries()` 遍历之前的 entry 恢复状态。

## 典型模式

```typescript
// 写入持久状态
pi.registerCommand("progress", {
    description: "Record current progress",
    handler: async (args, _ctx) => {
        pi.appendEntry("my-tracker", {
            step: args,
            timestamp: Date.now(),
        });
    },
});

// 启动时恢复状态
pi.on("session_start", async (_event, ctx) => {
    const entries = ctx.sessionManager.getEntries();
    const lastProgress = entries
        .filter(e => e.type === "extension" && e.namespace === "my-tracker")
        .pop();
    if (lastProgress) {
        ctx.ui.notify(`Resuming from step: ${lastProgress.data.step}`, "info");
    }
});
```

## 为什么需要它

Pi 没有内置的"持久化状态"概念。Session 是会话层的，compact 会压缩中间消息但保留 `appendEntry` 的内容。这是 plan-mode 的进度跟踪、todo 状态、token 统计的底层机制。

**和文件的区别**：

| | `appendEntry` | TODO.md 文件 |
|---|-------------|-------------|
| 存储位置 | session JSONL 文件 | 磁盘 Markdown 文件 |
| 读写方式 | 代码（extension 内） | 代码或人直接编辑 |
| 可见性 | 只有 extension 能读 | 人/agent/其他工具都能读 |
| 抗 compaction | 是（entry 保留） | 是（文件在磁盘） |

**选择判据**：如果状态只需要 extension 能读（如 plan-mode 的步骤索引），用 `appendEntry`。如果需要人和 agent 都能读能改，用文件（TODO.md、PROGRESS.md）。

## 锚点

- `packages/coding-agent/src/core/extensions/types.ts`：`appendEntry` 签名
- `packages/coding-agent/examples/extensions/plan-mode/index.ts`：步骤跟踪的持久化实现
- `extensions/02-Expansion/2.4_persistence.md`：持久化的扩充思路

## 最小例证

**例证 1（持久化的生存性）**：在会话 1 里调用 `/progress step1`（`appendEntry` 写进去）。`/new` 开新会话。在 `session_start` 事件里读旧 entries → 看到 "step1"。状态跨会话存活。

**例证 2（compaction 不丢 entry）**：长会话累积 100k token → 触发自动 compaction（中间消息被压缩成摘要）。`appendEntry` 的内容在 compaction 后仍在 session 文件中。