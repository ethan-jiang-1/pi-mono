# 9. 文件即 UI：PLAN.md、TODO.md、PROGRESS.md 的用法

## 用户问题

别的 harness 有内置 to-do、内置 plan mode。pi 明确不做这些——推荐用文件替代。但"用文件替代"不是敷衍，是一套设计哲学。哪些场景文件确实比内置 UI 好、哪些场景文件不够？

## 哲学的根

回忆核心约束链（`1_core_philosophy.md`）：

> "做决定" → "不替你管理状态" → **文件就是 UI**

具体展开：如果要让**你和 agent 共享同一个状态**，最通用的做法不是做一个 UI 组件，是写一个文件。你可以在终端里编辑它、在 git 里版本化它、在 IDE 里打开它。agent 用 read 读它、用 edit 改它。同一个文件，两方都可以操作。

## 三种标准模式

### 模式 1：PLAN.md（替代内置 plan mode）

**做什么**：agent 在开始实现之前写一份 PLAN.md，人读、人改、人批准后再执行。

**为什么文件比内置 mode 好**（来自 `_faq_on_digested/07/02_scenario_playbook.md` A2 和 `_digested/extensions/01-Core/1.2_skipped_features.md`）：

| | 内置 plan mode | PLAN.md 文件 |
|---|---------------|-------------|
| 人能直接改吗 | 通过 mode UI（可能只能 approve/reject） | 你在终端里直接编辑文件 |
| 能版本化吗 | 否（在 session 内存里） | 可以 git commit |
| 能跨会话存活吗 | 否（会话结束就没了） | 是（文件在磁盘上） |
| 能和多 agent 共享吗 | 否（仅当前 agent） | 是（其他 agent 可以 read 它） |

**典型流程**：

```bash
# 1. agent 写 PLAN.md
pi -c "explore auth module and write PLAN.md with step-by-step plan"

# 2. 你编辑 PLAN.md（终端里直接改，或 IDE 打开）
vim PLAN.md

# 3. agent 按 PLAN.md 执行
pi -c "implement step 1 from PLAN.md"
```

### 模式 2：TODO.md（替代内置 to-do）

**做什么**：TODO.md 是 agent 和人都能读写的任务清单。pi 的立场是"TO-DO 不应该是隐藏状态，应该是你可见、可改、可提交的文件。"

**token 优势**：内置 to-do 在 compaction 后可能丢失（`_faq_on_digested/07/05_package_ecosystem.md` 中 rpiv-todo 出现的原因——`/reload` 和 compaction 后任务状态丢失）。TODO.md 在磁盘上，compaction 不影响。

**典型流程**：

```bash
# agent 创建 TODO.md
pi -c "create a TODO.md with the remaining tasks"

# 你可以在冲突时编辑
echo "- [x] fix login bug" >> TODO.md

# agent 读 TODO.md 继续
pi -c "work through TODO.md top to bottom"
```

### 模式 3：PROGRESS.md（长任务的状态桥）

**做什么**：长任务（超过一个会话的）用 PROGRESS.md 做上下文交接。初始会话把关键状态写入文件，新会话从文件恢复。

**来源**：Anthropic 官方白皮书"Effective harnesses for long-running agents"（`_faq_on_digested/07/07_cross_harness.md` #3）：initializer agent 写 feature 清单（`passes: false`）+ init 脚本 + progress 文件 + 初始 commit。

**典型流程**：

```bash
# 会话 1：初始化
pi -c "analyze auth module, write FEATURES.md with verification list"

# 会话 2：实现 + 更新 PROGRESS.md
pi -c "implement feature 1 from FEATURES.md, update PROGRESS.md"

# 会话 3：继续
pi -c "read PROGRESS.md and continue with the next uncompleted feature"
```

## 文件模式的系统化：`.scratch/` 目录

社区经过验证的最完整模式（`_faq_on_digested/07/06_field_usage.md` C2，esc.sh）：

```
.scratch/
├── research/     # 调研笔记（按日期命名）
├── plans/        # PLAN.md 变体
├── reviews/      # 审查记录
└── sessions/     # 上下文交接文件（/continue 用的总结）
```

`.scratch/` 被 gitignored（没有 CI 污染），有价值的移进 `docs/`。

## 什么时候文件不够

文件模式的局限：

1. **实时性**：agent 写了 TODO.md，但你可能 10 分钟后才发现。内置 to-do 可以实时通知。
2. **冲突**：人和 agent 同时编辑同一个文件 → git merge 冲突。内置 to-do 有锁机制。
3. **屏幕空间**：TUI 顶部的 widget 比切换到另一个终端编辑文件更快。
4. **交互式确认**：PLAN.md 写好了，你需要确认后才能继续——文件不能自动等你确认。

所以社区里出现了两个方向的中间方案：

- **实时 TODO widget（抗 compaction）**：`@juicesharp/rpiv-todo`（98.9K/月）——TODO.md 文件的 TUI 覆盖层，在 compaction 和 reload 后存活。
- **交互式计划审查**：`plannotator`（52.7K/月）——在浏览器里打开计划文件，你划线批注，反馈回传 agent。文件 + UI 的结合。

这两条路径说明：**文件模式和内置 UI 之间不是二选一——文件是持久层，UI 是交互层。** TODO.md 在磁盘上，rpiv-todo 在 TUI 里展示它；PLAN.md 在磁盘上，plannotator 在浏览器里批注它。

## 锚点

- `_faq_on_digested/07/02_scenario_playbook.md` A2（PLAN.md 标准流程）
- `_faq_on_digested/07/06_field_usage.md` C2（`.scratch/` + `n2c:` 标注回路）
- `_faq_on_digested/07/07_cross_harness.md` #7（长任务配方）
- `_faq_on_digested/07/05_package_ecosystem.md`（rpiv-todo、plannotator）

## 最小例证

**例证 1（跨会话存活）**：会话 1 里 agent 写了 TODO.md（"fix login bug"）。`/new` 开新会话。agent：读 TODO.md → "你有 fix login bug 要做"。文件在磁盘上，不随会话结束消失。

**例证 2（人和 agent 共享）**：agent 写 PLAN.md 步骤 1-5。你删掉步骤 3 并写入"改成这样做"。agent 下回合读 PLAN.md 看到你的修改，按新方案执行。**文件即 UI 的核心理念：人和 agent 在同一份文件上操作，不需要 UI 中间层。**

**例证 3（compaction 不丢状态）**：TODO.md 在磁盘 → `/compact` 后 agent 仍能读 TODO.md。内置 to-do 可能在 compaction 中被抛弃于系统 prompt（rpiv-todo 这个包的存在就是为了解决这个问题）。