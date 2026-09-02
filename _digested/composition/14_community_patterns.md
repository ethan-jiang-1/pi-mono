# 14. 社区验证的配置模式

## 用户问题

上面五层框架和七条轴是"结构上能做的事"。但社区里真正被多人验证的配置模式有哪些？哪些是"听起来不错但实际没人用"的？

## 模式 1：讨论优先模式

**来源**：esc.sh、Armin（`_faq_on_digested/07/06_field_usage.md` C1、C4）

**做法**：把 pi 的 ~500 token 的默认 system prompt 换成"thinking partner——默认只讨论，不动文件不跑命令，除非明确要求"。

```typescript
pi.on("before_agent_start", async (event, ctx) => {
    event.setActiveTools(["read", "grep", "find", "ls"]);
    return {
        message: "You are a thinking partner. Default: Discussion. Don't touch anything unless asked.",
    };
});
```

**为什么有效**：Pi 的极简 system prompt 让你的规则真正有约束力。CC 在你说第一句话前已注入 ~20k token 的产品逻辑——你的约束要和 20k 竞争注意力。Pi 的 ~500 token 约束几乎没有竞争。

**验证人数**：esc.sh（1 篇博文）+ Armin（1 篇博文）+ 多处引用。不算"大量"，但模式逻辑被多人认同。

## 模式 2：`.scratch/` + `n2c:` 标注回路

**来源**：esc.sh（`_faq_on_digested/07/06_field_usage.md` C2）

**做法**：

```
.scratch/
├── research/     # 调研笔记（按日期命名）
├── plans/        # PLAN.md 变体
├── reviews/      # 审查记录
└── sessions/     # 上下文交接文件

流程：
1. 讨论 → 
2. agent 写计划文件 → 
3. 你读文件，在行间写 "n2c: This assumption is wrong" → 
4. agent 逐条回应标注 → 
5. 定稿 → 执行
```

**为什么有效**：它把"计划"从 agent 单方面输出变成**人 agent 共同编辑的对话**。"n2c:"（note to Claude）是清晰的标注格式，人和 agent 都能理解。

**验证人数**：仅 esc.sh 详细记录。但模式本身（计划文件 + 人审 + 标注）是多种实践的共性。

## 模式 3：自扩展优先

**来源**：Armin（`_faq_on_digested/07/06_field_usage.md` C4）

**做法**：

> "If you want the agent to do something that it doesn't do yet, you don't go and download an extension or a skill. You ask the agent to extend itself."

具体：
1. 对话中说"帮我把这个审查流程写成一个 skill"
2. Pi 在 `.pi/skills/` 下生成一个 Markdown 文件
3. 你编辑它调整细节
4. 结束。不需要装包、不需要搜 npm。

**验证人数**：Armin 的完整文章 + 多处引用。自扩展是 pi 生态的"头号 idiom"。

## 模式 4：DX > AGENTS.md

**来源**：Mario + HN 高赞评论（`_faq_on_digested/07/06_field_usage.md` E6、C10）

**做法**：不要把类型检查/lint 诊断写进 AGENTS.md 或上下文中——把它做成 commit hook/CI 强制，让 agent 自己修。

**为什么有效**：把"检查"做成机制（agent 不修就不能提交）比写成规则（"修了再提交"）更有效。Mario 的原话：

> "far more effective at making the agent fix its errors, without filling up your context window with possibly irrelevant LSP diagnostics."

**这条和"写 AGENTS.md"的关系**：不是替代，是互补。AGENTS.md 写"不写会错的事实"，DX 做"不修过不去"的机制。**检查机制 > 长散文。**

## 模式 5：上下文交接（/continue 式）

**来源**：社区共识（`_faq_on_digested/07/06_field_usage.md` C3、`07_cross_harness.md` #7）

**做法**：
1. 到 100-150k token 时，停止
2. 让 agent 把相关状态总结进 `.scratch/sessions/` 文件
3. 清空上下文、带着文件开新会话
4. 新会话读取文件继续

```bash
# 会话 1 末尾
pi -c "summarize current state into .scratch/sessions/auth-refactor.md"

# 会话 2 开头
pi -c "read .scratch/sessions/auth-refactor.md and continue"
```

**token 上限**：≤ 200k 硬顶（参考 context rot 研究的死亡拐点）。100-150k 就交接。

## 模式 6：tmux 编排

**来源**：pi-agent-hub、pi-tmux（`_faq_on_digested/07/06_field_usage.md` C6）

**做法**：用 tmux pane 做多会话编排。

- pi-agent-hub：4 个 live 会话槽 + git worktree + 注意力分级驾驶舱（NEEDS YOU / HEALTH / ACTIVE / QUIET）
- pi-tmux：`/supervise` 监督者模式——主 agent 干活、监督 agent 只纠偏，主 agent "不知道自己被监督"

**为什么有效**：Pi 本身没有多会话编排。Tmux 是"已经在你终端里的编排工具"，pi 不需要再做一套。

## 模式 7：信息加工 = 小脚本流水线

**来源**：Mario 的实证案例（`_faq_on_digested/07/06_field_usage.md` A5）

**做法**：18,000 行数据不用 agent 一次处理完——让它搭一条 file-in/file-out 的脚本链（转换 → 拆分 → 过滤 → 分析 → 统计 → 可视化）。每段独立运行、独立验证。上游改错后重跑对应段即可。

**为什么有效**：可复现性 = 质量门（与 `_handbook_for_information_work` 的"可审查交付物"同构）。

## 八横贯主题

1. **极简核心 + 自扩展** 是专家主流。下载的包要 cherry-pick、pin、审计 token 价。
2. **讨论 → 计划文件 → 人审 → 执行 → 新上下文评审** 是被复制最多的具体工作流——全部建立在 pi 的会话树上。
3. **上下文纪律 ≤ 200k，100-150k 就交接**。给每个 skill 标 token 价。
4. **tmux 做编排**：per-project 会话、锁协调、监督者模式。
5. **YOLO + 隔离**：VM/容器/专用机；guardrail 是安全网不是边界。
6. **DX > AGENTS.md**：强制检查（commit hook/CI）比长指令散文有效。
7. **信息加工适合 pi**：Unix 管道形态（`-p` + stdin/stdout）比 CC 还顺手。
8. **包卫生**：装一个、改一个、pin 一个。启动前更新。

## 锚点

- `_faq_on_digested/07/06_field_usage.md`（全部社区来源）
- `_faq_on_digested/07/07_cross_harness.md`（跨 harness 新实践）

## 最小例证

**例证 1（自扩展）**：对话说"帮我写一个 skill，审查 git diff 并输出 Good/Bad/Ugly/Tests" → pi 在 `.pi/skills/` 下生成文件。不需要手写。

**例证 2（DX > AGENTS.md）**：把 `npm run check` 设成 pre-commit hook → agent commit 时 hook 拦截失败 → agent 自动修复然后提交。你不需要在 AGENTS.md 里写"跑测试"——机制强制它做。