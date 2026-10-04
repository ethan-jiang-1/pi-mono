# 08 · 选择决策、组合模式与诚实空白

pi 没有"什么时候用哪个原语"的中心路由文本——这句话本身是本页的第一个事实。本页做三件事:登记选择语义实际住在哪;给出跨原语的组合模式;诚实登记官方没说清的空白。

## 选择语义住在哪

| 通道 | 例子 | 与 DSH 的差别 |
|------|------|---------------|
| 工具 description | subagent 工具:"Delegate tasks to specialized subagents with isolated context. Modes: single… parallel… chain…"(`examples/extensions/subagent/index.ts:475-480`) | DSH 每个原语还有独立 `tool:*` prompt 策略节;pi 的策略语义通常只有 description 一段 |
| 范本 README | subagent/plan-mode 的 README 用"什么时候装它"的段落回答选择问题 | pi 把使用哲学放进 examples,不进模型上下文 |
| 系统提示内的工具契约 | 内置工具的 promptSnippet 聚合进 "Available tools"([`harness/04-Self-Description/4.2`](../harness/04-Self-Description/4.2_tool_prompt_contract.md)) | 同 DSH"策略随工具走"的约定,但无强制门禁 |

**路由是单向且局部的**:codemode README 说自己适合"remote APIs, MCP servers, application services"(`packages/codemode/README.md:5`);subagent README 说自己适合隔离上下文的任务——但没有任何文本回答"subagent 还是 codemode 还是直接自己做"。pi 的立场是把这类判断留给模型与用户,把每级的合同写清楚。这是与 DSH 的真实哲学差异:DSH 用组合压力证明路由知识值得中心化整理;pi 用 core-minimal 证明它值得留在现场。

## 实操判据(本目录的推断,非官方文本)

| 任务形状 | 默认选择 | 理由 |
|----------|---------|------|
| 单步、上下文够用 | 直接做 | 无原语开销([01](./01-loop.md)) |
| 多步计划,需要人批准 | plan-mode 扩展 | 计划→批准→执行闭环已是完整范本([02](./02-extension-seam.md)) |
| 上下文内留痕、防遗忘 | todo 扩展 | 状态随 branch,分支安全([02](./02-extension-seam.md)) |
| 聚合大量工具结果,中间值不想进上下文 | codemode | 嵌套调用不进 LLM 上下文([04](./04-codemode.md)) |
| 独立上下文的完整子任务(调研/审查/实现) | subagent 扩展 | 进程级隔离;一次性([03](./03-subagent.md)) |
| 外部工具生态 | MCP 接入 | 适配后与内置工具同权([05](./05-ecosystem-tools.md)) |
| 跨重启、需要 fan-out/fan-in 与崩溃恢复 | durable(experimental) | 唯一的持久任务层([07](./07-durable-tasks.md)) |
| 长会话换方向 / 撤回决策 | 会话分支 | 指针移动,历史不改([06](./06-session-plane.md)) |

## 组合模式(源码支撑)

**A · 计划 → 委派**:plan-mode 产出编号步骤 → 人工批准 → 执行阶段把适合的步骤交给 subagent(codomode/subagent 均可从扩展里以工具身份调用)。支撑事实:执行阶段恢复全量工具面后,subagent/codemode 均在活跃集合内(`plan-mode/index.ts:97-114`)。

**B · codemode × MCP**:把 MCP server 工具注入沙箱,脚本批量调用聚合——codemode README 明说该包可独立用于暴露"MCP servers"给模型脚本(`packages/codemode/README.md:5`)。

**C · todo × 分支重放**:委派/实验前让模型记录 todo;分支回滚后 todo 自动回到那个时点(`todo.ts:4-10`)。

**D · durable 的后台消息回传**:后台 subagent 的答案由 reporter 任务以 follow-up input 投回父会话,requestId 防重启重复发送(`packages/durable/README.md` Abort and Subagents 节,示例 `23`)。

## 诚实空白(官方未说清,登记在案)

1. **无跨原语路由文本**:上述"subagent vs codemode vs 直接做"没有官方判据;选择语义散在各 description/README。
2. **无递归深度预算**:subagent 扩展无 depth 参数,子进程默认加载用户级扩展——递归委派的上限由用户安装范围决定,扩展不设防([03](./03-subagent.md) 边界节)。
3. **无任务级回滚**:分支是会话级指针移动,不撤销工作区文件改动;文件防护是独立扩展(git-checkpoint 等)的事。
4. **无自动推进器**:没有 idle 续轮(goal 式)、没有 wall-clock 触发(schedule 式);"接下来做什么"要么模型自己续,要么用户说话,要么 durable 任务状态机(实验)。
5. **"何时转后台"无统一规则**:subagent 是一次性前台等待;run_in_background 语义只存在于 durable 侧;普通会话内没有后台作业平面。

## 收尾纪律

pi 没有 harness 级收尾规则(DSH 的"最终答案前收 job"式条文不存在);现场能找到的收尾约定都在范本里:subagent 的 50 KB 输出封顶与失败诊断回传(`index.ts:193-202,186-191`)、chain 首败即停(`:587-595`)、plan-mode 完成后清除执行状态防 resume 复活旧计划(`plan-mode/index.ts:264-277`)。**缺省立场是:收尾判断归模型与扩展作者。**

## 与 DSH 的阶梯对照(一段话)

DSH 的阶梯是"原语包的清单"(todo/plan/subagent/workflow/ralph/goal/jobs/schedule/teams,各有独立合同与挂载状态);pi 的阶梯是"一个强单级 + 构造面":内核把所有同上下文编排压成双队列与钩子,把异上下文编排留给扩展、沙箱与实验包。两边的共同点在纪律层:完成证据分层、失败不炸环、状态从持久事实重建。系统性对照见 [`_faq_on_digested/06_pi_vs_dsh/`](../../_faq_on_digested/06_pi_vs_dsh/answer.md),本目录不重复其论证。
