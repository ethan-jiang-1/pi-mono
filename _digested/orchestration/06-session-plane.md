# 06 · 会话平面:append-only 树、分支与恢复

pi 的编排时间平面是**会话文件**:`SessionManager` 把会话存成 append-only 的 JSONL 树。这一页只讲它作为编排原语的四个事实:树结构、分支语义、状态重建惯例、以及 steer/followUp 的用户入口。压缩与 memory 的机制细节归 [`agent/03-Memory/`](../agent/03-Memory/)。

## 为什么是这个形状:设计考量

类 docstring 一句话定位(`core/session-manager.ts:977-986`):"Manages conversation sessions as append-only trees stored in JSONL files. Each session entry has an id and parentId forming a tree structure. The 'leaf' pointer tracks the current position. Appending creates a child of the current leaf. **Branching moves the leaf to an earlier entry, allowing new branches without modifying history.**"

**树而不是线性日志**,换来的是:历史不可变(append-only),而"当前进度"只是一个指针。对编排的含义是——**重试、改道、回滚到某个决策点,都是移动指针,不是改写历史**;配合 todo 的"状态存 toolResult details 随 branch 重建"([02](./02-extension-seam.md) 样本一),分支后的编排状态自动正确。pi 没有任务级 rollback 命令(DSH 也没有,见其 orchestration-ladder 09 页的核对),它有的是**会话级的时间指针**。

## 机制

### 树与分支

- 条目带 `id`/`parentId`,当前路径 = root 到 leaf(`:977-986`);
- `getBranch(fromId?)` 返回活动分支(`:1469`);扩展的 `ctx.sessionManager.getBranch()` 即由此而来(todo 重建用它,`todo.ts:118`);
- 分支摘要(`branch_summary` 条目,`:107`)与 compaction 摘要共同构成"长会话的路径解析"(buildSessionContext 处理"compaction and branch summaries along the path",`:517`)。

### 恢复

恢复 = 换一个会话文件并重放树(`:1024` 附近 "Switch to a different session file (used for resume and branching")。恢复重建的是**事实层**(条目、扩展 custom entry、todo/plan 状态),不重建运行态:双队列里的未投递消息、进行中的 run 都不复活([01](./01-loop.md) 边界节、[02](./02-extension-seam.md) 边界节)。plan-mode 的 resume 重扫"最后一个执行标记之后的消息"重建 `[DONE:n]` 进度(`plan-mode/index.ts:359-383`)是这套惯例的完整示范:**派生状态永远从持久事实重新折叠,而不是单独持久化一份会漂移的副本**。

### steer/followUp 的用户入口

`AgentSession` 把内核双队列包成带输入处理的入口(`core/agent-session.ts`):

- `steer()`/`followUp()` 方法,含技能命令与 prompt 模板展开,扩展命令报错(`:2156-2191`);
- 流式期间的 `sendUserMessage` 必须声明 `streamingBehavior: "steer" | "followUp"`(`:303-304`),否则排队失败(`:1965-1969`)——**语义选择强制显式**;
- 待投递消息进 UI 队列显示,投递后移除(`:377-380`、`:1020-1021`)。

## 边界与上限

- **时间平面是人驱动的**:分支、恢复、`--resume` 都由用户发起;pi 没有 DSH schedule 那样的 wall-clock 触发器,也没有 goal driver 那样的 idle 续轮器——"接下来该做什么"的自动推进不在这一层。
- 会话是**进程内单例**(SessionManager 打开一个文件):同一会话文件被两个进程同时写不是受支持场景;多会话并行编排要走 SDK 多实例或 durable(experimental)。
- 树给的是**指针级回滚**,不是内容级回滚:分支后,工作区里的文件改动不会被撤销(文件系统不在会话树里;git-checkpoint 等防护是另一个扩展的事)。

## 与相邻原语的关系

- todo/plan-mode 的状态重建消费 `getBranch()`([02](./02-extension-seam.md));
- durable 把同样的"事实先行"纪律做成存储合同:先 commit 再展示([07](./07-durable-tasks.md));
- subagent 默认 `--no-session` 不消费这层([03](./03-subagent.md))——委派结果不进父会话树,只有工具结果进。

## 源码入口

| 路径 | 一句话 |
|------|--------|
| `packages/coding-agent/src/core/session-manager.ts:977-986` | append-only 树 + leaf 指针 + 分支不改历史 |
| `packages/coding-agent/src/core/session-manager.ts:1469` | `getBranch` |
| `packages/coding-agent/src/core/session-manager.ts:517,107` | 路径解析处理 compaction 与 branch summary |
| `packages/coding-agent/src/core/agent-session.ts:2156-2191` | steer/followUp 用户入口 |
| `packages/coding-agent/src/core/agent-session.ts:303-304,1965-1969` | streamingBehavior 强制显式 |
| `packages/coding-agent/examples/extensions/plan-mode/index.ts:359-383` | resume 重扫重建派生状态 |
