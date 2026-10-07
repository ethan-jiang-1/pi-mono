# 9. 文件即 UI：PLAN.md、TODO.md、PROGRESS.md 的用法

## 用户问题

Pi coding-agent 不将 plan mode 与 TODO 作为统一核心工作流；文件是作者推荐的一种可见状态载体，也可以使用示例扩展或 package。哪些场景文件有优势，哪些场景需要额外交互与状态管理？

## 哲学与合同边界

[核心哲学](1_core_philosophy.md)强调“可见、可调整的工作资料”，**不是“不替你管理状态”**。当前 `SessionManager` 自动持久化会话，程序也会压缩和重试；见 [SDK 会话合同](../../packages/coding-agent/docs/sdk.md#sessionmanager-api)。

文件的价值是人可以直接编辑、版本化，agent 可以重新读取。磁盘上的修改不会自动更新已经发给模型的上下文。以下是可选模式，不是 Pi 内置的统一计划合同；相关概念局部复核到 `cb18c7cbc89d5becbb4ea2e490a6e7ad0e989f04`，后面的历史 UI 行号保留原基线。

## 三种常见模式

### 模式 1：PLAN.md（替代内置 plan mode）

**做什么**：agent 在开始实现之前写一份 PLAN.md，人读、人改、人批准后再执行。

**文件方案的优势**：直接编辑、git 版本化、跨会话共享；但具体内置/扩展 plan mode 也可能持久化或使用文件，不能一概说它们只有内存状态。作者的历史理由见 [设计自述](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)。

| 维度 | 文件方案的能力 | 需要补充的机制 |
|---|---|---|
| 人审 | 编辑计划内容 | 谁批准、何时执行仍需显式规则 |
| 版本化 | 可纳入 git | 文件本身不强制提交或审查 |
| 跨会话 | 文件留在磁盘，可重新读取 | 模型不会自动知道未读的新状态 |
| 多 agent | 可读同一资料 | 并发更新需要冲突与协调策略 |

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

**做什么**：任务清单文件可由 agent 和人共同维护。这是作者推荐的一种可见状态方式，不排斥扩展使用会话 custom entry 或工具结果 details。

**持久性优势，不是自动 token 优势**：compaction 不删除磁盘文件；agent 仍需重新读取并支付 token。扩展状态是否丢失取决于其恢复实现，不能由单个 package 的诉求推出所有内置 TODO 都会丢状态。

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

**来源**：Anthropic 官方白皮书"Effective harnesses for long-running agents"（[跨 harness 用法研究](../../_faq_on_digested/07_pi_usage_scenarios/07_cross_harness.md) #3）：initializer agent 写 feature 清单（`passes: false`）+ init 脚本 + progress 文件 + 初始 commit。

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

社区经过验证的最完整模式（[实践案例](../../_faq_on_digested/07_pi_usage_scenarios/06_field_usage.md) C2，esc.sh）：

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

1. **通知**：文件本身没有通知机制，需要 watcher、UI 或主动读取。
2. **冲突**：人和 agent 同时编辑可能互相覆盖；git 不会自动阻止工作树中的并发写，内置/扩展状态也不一定有锁。
3. **屏幕空间**：TUI widget 可能比切换编辑器方便，取决于具体交互设计。
4. **确认**：文件本身不强制等人批准；必须另加命令、事件或流程约束。

所以社区里出现了两个方向的中间方案：

- **实时 TODO widget（抗 compaction）**：`@juicesharp/rpiv-todo`（98.9K/月）——TODO.md 文件的 TUI 覆盖层，在 compaction 和 reload 后存活。
- **交互式计划审查**：`plannotator`（52.7K/月）——在浏览器里打开计划文件，你划线批注，反馈回传 agent。文件 + UI 的结合。

这两条路径说明：**文件模式和内置 UI 之间不是二选一——文件是持久层，UI 是交互层。** TODO.md 在磁盘上，rpiv-todo 在 TUI 里展示它；PLAN.md 在磁盘上，plannotator 在浏览器里批注它。

## 会话文件的 UI 面（v0.85.x–0.86.x 更新）

> **警示（v0.85.x–0.86.x，见 `_change_log/0006`）**：会话列表与查找行为在本周期有明显变化，涉及 session picker、`--continue`、精确 ID 查找三个入口。

**session picker 渐进加载（硬事实）**：`listSessions()` 新增 `onProgress` 回调（`session-manager.ts:854`、`:876`）——目录扫描按文件 mtime 降序排（`:667-668`），边读 transcript 边增量发布 partial 结果，`signal` 可取消剩余读取；UI 侧（`session-selector.ts`）随之增量渲染。效果是 `--resume` 打开 picker 时**最新的会话先出现**，不必等整个目录读完。

**`--continue` 与精确 ID 查找**：`readSessionHeader()`（`session-manager.ts:596`）只读文件头部就能判断一个文件是不是目标 session。`--continue` 沿 mtime 序读到**第一个（即最新）匹配 cwd 的 header 就停**，不再继续扫；给定精确 session ID 的查找同样只对每个候选文件读 header（#9601），不碰 transcript 正文。大 session 目录下两者的启动成本从"全目录正文扫描"降到"header 序列扫描"。

**`/bug` 与 crashes.json（新 UI 面）**：`/bug [description]`（`interactive-mode.ts:3085`）打包环境/model/provider/extension/settings 元数据（secrets 逐一 redact）+ 诊断 + 可选 transcript，上传 Radius gateway 或导出 zip，报告 id 以 `pi.bug-report` custom entry 记进 session。崩溃写入 `~/.pi/agent/crashes.json`（`crash-log.ts:20`，最多 5 条、7 天过期），下次启动一次性通告并随下份报告自动附带。这是"文件即 UI"哲学的边界示例：**诊断面不走用户可编辑的文件**——crashes.json 是机器写的崩溃 ring buffer，不是共享状态文件。

## 锚点

- [场景手册](../../_faq_on_digested/07_pi_usage_scenarios/02_scenario_playbook.md) A2（PLAN.md 标准流程）
- [实践案例](../../_faq_on_digested/07_pi_usage_scenarios/06_field_usage.md) C2（`.scratch/` + `n2c:` 标注回路）
- [跨 harness 用法研究](../../_faq_on_digested/07_pi_usage_scenarios/07_cross_harness.md) #7（长任务配方）
- [生态研究](../../_faq_on_digested/07_pi_usage_scenarios/05_package_ecosystem.md)（rpiv-todo、plannotator）
- `packages/coding-agent/src/core/session-manager.ts`：mtime 排序（L667-668）、`readSessionHeader`（L596）、`listSessions` 渐进回调（L854/L876）
- `packages/coding-agent/src/modes/interactive/interactive-mode.ts`：`/bug` 入口（L3085）
- `packages/coding-agent/src/core/crash-log.ts`：`~/.pi/agent/crashes.json`（L20）
- `packages/coding-agent/src/core/bug-report.ts`：redact 与 `pi.bug-report` custom entry

## 最小例证

**例证 1（跨会话存活）**：会话 1 里 agent 写了 TODO.md（"fix login bug"）。`/new` 开新会话。agent：读 TODO.md → "你有 fix login bug 要做"。文件在磁盘上，不随会话结束消失。

**例证 2（人和 agent 共享）**：agent 写 PLAN.md 步骤 1-5。你删掉步骤 3 并写入"改成这样做"。agent 下回合读 PLAN.md 看到你的修改，按新方案执行。**文件即 UI 的核心理念：人和 agent 在同一份文件上操作，不需要 UI 中间层。**

**例证 3（compaction 与文件）**：任务清单在磁盘 → `/compact` 后 agent 可重新读取。保留的是外部资料，不保证它已经位于当前上下文，也不证明其它扩展的状态恢复一定失败。