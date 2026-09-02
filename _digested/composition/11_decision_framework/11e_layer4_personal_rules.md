# 11e. 层 4：个人纪律——全局 AGENTS.md

## 什么时候加

**加**：你有些规则在所有项目里都一样——语言偏好、git 纪律、检查习惯。
**不加**：你的习惯每个项目不一样，或你根本还没有习惯（先用裸 pi 探索）。

## 典型内容

```
# Global rules
- Reply in 中文; technical prose only, no filler.
- Never commit unless I explicitly ask.
- Commit only files you changed in this session; stage explicit paths.
- After code changes, run the project's check command from its AGENTS.md.
- Read files in full before editing files you have not inspected.
```

10-20 行。不是项目 AGENTS.md 的替代品——项目 AGENTS.md 放这个项目自己的构建命令、代码风格。全局层放**你的**规则。

## 什么时候不该加全局纪律

**场景**：你管理多个项目，每个项目的 git 纪律不同。
- 项目 A 要求"auto-commit after tests pass"
- 项目 B 要求"never auto-commit"

全局 AGENTS.md 说"never commit unless I ask" → 项目 A 的规则在冲突。全局 AGENTS.md 和项目 AGENTS.md 同时出现在 system prompt 里，agent 看到两个约束——**没有机械式的覆盖规则**。

**替代方案**：全局层只放无争议的线（语言偏好）。项目特定纪律放项目 AGENTS.md。

## 锚点

- `3_global_layer.md`（全局层设计的完整分析）
- `5_agents_md.md`（AGENTS.md 设计艺术）

## 最小例证

**例证**：全局 AGENTS.md 写 "Reply in 中文"。然后开任何项目 → agent 主动用中文回复。不开任何项目，一条全局规则生效于所有场景。