# Plan 3：v0.84.4 → v0.86.1 Execution 追踪

**Discovery**: [`0006-v0.84.4-to-v0.86.1.md`](./0006-v0.84.4-to-v0.86.1.md)（2026-09-21，4 路并行取证）
**取证报告**: `/tmp/sync-0006-{agent,coding-agent,ai,newpackages}.md`（临时文件）

## 任务清单

| # | 任务 | 影响来源 | 状态 |
|---|------|----------|------|
| 1 | `_digested/README.md` 基线声明 → v0.86.1；包表 +chord/durable/sqlite-node；"stub" 结论更新 | 0006 | ✅ 2026-09-21 |
| 2 | `agent/04-Harness/4.1` 重写：durable drive runtime（Harness/Lane/driveOperation、SliceNotImplemented、pico3/chord 暴露） | T1/T7 | ✅ 2026-09-21 |
| 3 | `agent/03-Memory/` 3.4/3.5 大改（branch/lanes、format 4、legacy v3、named-branch fork）+ 3.1/3.2 durable structural operation | T2-T5 | ✅ 2026-09-21 |
| 4 | `agent/02-Runtime/` 2.5 重写（OperationState/guarded mutations）+ 2.1/2.4 补 #9548 与 backoff cap | T8 | ✅ 2026-09-21 |
| 5 | `agent/01-Anatomy/` 1.1/1.2（systemPrompt readonly、SystemMessage 入 transcript、EntryProjector） | T8 | ✅ 2026-09-21 |
| 6 | `integration/03` B1/B2 示例修复 + modelRegistry.stream；`04` 事件清单/on() 返回值/cache_warming_decision；`02` #8718+B3；`06` 覆盖表 | coding-agent 报告 | ✅ 2026-09-21 |
| 7 | `extensions/` 2.1（before_agent_start systemPrompt 投影）、2.2（unsubscribe/schema 校验）、2.4（新 entry 类型）、3.3（user_bash fail-closed） | coding-agent 报告 | ✅ 2026-09-21 |
| 8 | `harness/` 4.1（transcript 重放态 + forced prompt 投影）、4.2（strict 采样）+ `composition/` 8（新 settings）、9（session picker//bug）、13（cache warming 成本模型） | coding-agent 报告 | ✅ 2026-09-21 |
| 9 | 新架构面入口：`_digested/architecture-next/`（chord/durable/server/session-backends/pico3 一页纸 + 分篇） | newpackages 报告 | ✅ 2026-09-21 |
| 10 | `agent/05-Infra/` 5.1（TranscriptContext/thinkingLevelMap/retry/session-affinity）、5.2（Meta OAuth）、1.2 锚点 | ai 报告 | ✅ 2026-09-21 |
| 11 | 验收：关键锚点抽查、`on()` 事件计数复核、README 链接 | — | ✅ 2026-09-21 |

## 明确不做（本轮）

- `_faq_on_digested/` 的二次研究更新（等 `_digested/` 稳定后另行一轮）
- pico3 vs pico5 vs runtime 两套 harness 收敛判断（0006 疑点 2，需下一轮取证）
- B2 确切引入 commit 的 bisect（0006 疑点 3）
- 各篇全量行号逐行复核（沿用"以各篇警示为准"惯例）

## 执行记录

- 2026-09-21：merge `b700a07be`（零冲突）→ 4 路取证 → 0006 + _summary → 任务 1 完成；任务 2-10 并行派发（5 个 subagent，文件集互斥）。
- 2026-09-21 二轮审计：changelog 全量比对 + 全锚点自动扫描（36 文档，~450 个锚点逐一验证）。修正：0006 补记 9 条首轮遗漏（`SessionManager.inMemory()` #8980、`ctx.cwd` #8627、RPC abort/manual compaction #8920、Bash-only skills #8552、Jump-to-latest #9080、NO_PROXY #8737、Cerebras #9804、z.ai #9805）+ `fork-policy.ts` :5→:8；4.2 重锚 `_expandSkillCommand` :1481 / `parseSkillBlock` :141；2.3 注记 `create-harness.ts` 已删除（→ `experimental/session-worker.ts:805`）；`composition/`、`harness/`、`_faq_on_digested/` 三处 README 基线 → v0.86.1。复扫通过（仅余 2.3 有意保留的历史锚点，已带注记）。
