# 11. 五层递进决策框架总览

## 用户问题

从裸 pi 到一个完整配置好的项目，有标准路径吗？每层应该先做哪件事？怎么判断"我该在下一层投资了"？

## 五层框架

| 层 | 名称 | 配置什么 | token 成本 | 维护成本 |
|----|------|---------|-----------|---------|
| 0 | 裸运行 | 什么都不配 | 0 | 0 |
| 1 | 项目常识 | AGENTS.md（事实） | ~50-200 token / 会话 | 每次 agent 踩坑时加一条 |
| 2 | 固定工作流 | prompt template（流程） | ~50-200 token / 每次调用 | 写一次，几乎不变 |
| 3 | 运行时能力 | extensions / packages | 看 token 审计 | 包上游活跃度 |
| 4 | 个人纪律 | 全局 AGENTS.md | ~20-50 token / 会话 | 跨项目不变 |

**核心规则**：每一层的**投资门槛**是"你不配它就会痛"。不痛不加。

## 决策树

```
开始：你的项目
    │
    ├─ 你只跑一次？───────────────────── 层 0 裸运行
    │
    ├─ agent 反复踩同样的坑？
    │   yes → 层 1：AGENTS.md
    │           │
    │           ├─ agent 还在踩坑？
    │           │   yes → 加一条规则到 AGENTS.md
    │           │   no  ↓
    │           │
    │           ├─ 你有每周重复的任务（审查/发布/分析）？
    │           │   yes → 层 2：prompt template
    │           │   no  ↓
    │           │
    │           ├─ 你需要运行时能力？
    │           │   ├─ 可以"让 pi 自己写"？──→ 让它写
    │           │   ├─ 需要装包？
    │           │   │   → 读 README → 算 token 价 → cherry-pick
    │           │   └─ 需要自己写 extension？
    │           │       → 选轴 → 写 50-200 行
    │           │   no  ↓
    │           │
    │           └─ 你的个人纪律跨项目不变？
    │               yes → 层 4：全局 AGENTS.md
    │               no  → 停在这里（你有项目管理边界）
    │
    └─ 最高指导原则：
        不加你不知道为什么不加的东西
        不加你还没有痛过的东西
        优先让 pi 自己写，其次装包，最末自己写
```

## 五层的 token 总预算参考

| 配置组合 | 约 token | 场景 |
|---------|---------|------|
| 裸 pi（层 0） | 5.3k | 一次性问答 |
| + AGENTS.md（层 1，20 行） | 5.4k | 个人项目 |
| + 5 个 prompt template（层 2） | 5.3k（启动无成本；调用时 +50-200/template） | 团队项目 |
| + 3 个轻量扩展（层 3） | 5.5-6k（看事件注入量） | 带工作流支持的项目 |
| + 全局 AGENTS.md（层 4，10 行） | 5.6k | 全项目统一 |
| + 10 个全局 skill | 6-7k（只有 `<available_skills>` 目录增长） | 重度用户 |
| + 20 个全局 skill（`skills` 数组引用） | 8-10k（skill 目录描述有 token 成本） | 全量复用 Claude Code 技能 |

**关键数字**：裸 pi 约 5.3k token（`_faq_on_digested/07/06_field_usage.md` C3）。每加一条 AGENTS.md 行约 5-10 token。每个 skill 在目录里增加 ~30-50 token（name + description）。层 2 和层 3 的 prompt/extension 只在调用时才有额外 token 成本。

## 各层的详细文件

| 篇号 | 文件 | 说清楚什么 |
|------|------|-----------|
| 11a | [11a_layer0_bare.md](11a_layer0_bare.md) | 什么时候裸 pi 就够了、什么时候不够 |
| 11b | [11b_layer1_project_facts.md](11b_layer1_project_facts.md) | 怎么判断一条规则该不该加进 AGENTS.md |
| 11c | [11c_layer2_workflow.md](11c_layer2_workflow.md) | 怎么判断一个流程该不该写成 prompt template |
| 11d | [11d_layer3_runtime.md](11d_layer3_runtime.md) | 怎么判断一个能力该不该装包/写 extension |
| 11e | [11e_layer4_personal_rules.md](11e_layer4_personal_rules.md) | 全局 AGENTS.md 的跨项目规则判断 |

## 锚点

- `11a-e` 各篇的锚点各自独立
- 核心约束链：`1_core_philosophy.md`

## 最小例证

**例证 1（不加你不知道为什么不加）**：看到社区推荐 "装 pi-lens、装 pi-subagents、装 rpiv-todo" 就一口气装 5 个 → 启动 hello-world 程序需要 20k token（社区实测数字）。**先跑裸 pi，痛了再加。**

**例证 2（痛了再加的验证信号）**：Agent 改完代码后说"做完了"但测试没跑。你纠正它"跑测试"。第二次它又不跑。第三次它又不跑。→ 层 1 信号：加 "After code changes, run npm run check" 到 AGENTS.md。痛两次就够了，第三次才加说明你忍耐力太高。