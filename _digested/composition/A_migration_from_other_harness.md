# 附录 A：从其他 Harness 迁移（CC / Codex → Pi）

## 哲学差异

这不是工具迁移，是**设计哲学迁移**。

| | CC / Codex | Pi |
|---|-----------|-----|
| 默认值哲学 | 替你配好全家桶 | 留口子让你自己长 |
| 权限模型 | 逐条审批弹窗 | YOLO 默认，隔离你自选 |
| 工作流 | 内置 plan mode / to-do / subagent | 文件（PLAN.md / TODO.md）或扩展 |
| 上下文控制 | ~20k token 产品逻辑内置 | ~500 token 极简 harness |
| 配置入口 | 界面 UI + CLAUDE.md | 文件系统（AGENTS.md / prompts / skills / extensions） |

## 配置映射

| 你在 CC 里有的 | 在 pi 里的等价物 | 做什么 |
|----------------|-----------------|--------|
| CLAUDE.md | AGENTS.md（pi 也读 CLAUDE.md） | 零改动——pi 自动读取 CLAUDE.md |
| Skills | Skills（同标准，settings `skills` 数组引用） | 一行 settings 就能复用 37 个 CC 技能 |
| Plan mode | prompt template `/plan` 或 PLAN.md 文件 | 更轻量的替代 |
| Subagent | pi-subagents 包 / tmux 双会话 | 更灵活的替代 |
| Checkpoints | `/tree` + git-checkpoint 扩展 | 会话树 + 手动 checkpoint |
| Hooks | extensions（pi.on 事件系统） | 更底层的 API，功能更强 |
| MCP | pi-mcp-adapter 包 / CLI over MCP philosophy | 适配器或完全跳过 MCP |
| Permission prompts | 工具白名单 / bwrap / 容器 | 更硬的隔离（无"可以吗"弹窗） |
| To-do | TODO.md 文件 / @juicesharp/rpiv-todo | 文件或轻量包 |
| Multi-session | 多终端 + git worktree | 一模一样的 Unix 做法 |
| CLAUDE.md /init | 无等价物（pi 不自动生成 AGENTS.md） | 需要手写或从 starter-kit 拷 |

**最直接的迁移路径**：

1. 保持项目根 `CLAUDE.md` 不动（pi 自动读）
2. `settings.json` 加 `"skills": ["~/.claude/skills"]` — 37 个 CC 技能立即可用
3. CC 的 CLAUDE.md 如果 > 100 行 → 考虑拆（pi 的上下文纪律更严）
4. 如果有 MCP server → 装 `pi-mcp-adapter`，它能直接导入 CC 的 `.mcp.json`

## 迁移的实际体感

CC 用户到 pi 的第一个冲击是"什么都没有"——没有 to-do、没有 plan 按钮、没有弹窗问你"可以吗"。这不是缺失，是**默认值密度的变化**。CC 把密度拉到最大（什么都有），pi 拉到最小（什么都不管你）。

对应方式：不要一口气装 10 个扩展来"补回感觉"。先裸跑、承认"不适应是正常的"、根据实际痛处逐步加东西。

## 锚点

- `_faq_on_digested/07/01_capability_map.md`（CC 16 条最佳实践 → pi 逐条映射表）
- `_faq_on_digested/07/07_cross_harness.md` #5（AGENTS.md 跨 harness 标准）
- `_faq_on_digested/07/06_field_usage.md` C1（esc.sh 的 CC→pi 迁移博文）

## 最小例证

**例证 1（CLAUDE.md 零迁移）**：保持项目根 CLAUDE.md 不变 → pi 自动读到它并注入 `<project_context>`。不需要改名、不需要改内容。

**例证 2（技能零迁移）**：`settings.json` 加 `"skills": ["~/.claude/skills"]` → pi 的 `/skill:` 补全出现所有 CC 技能。不拷贝、不改写、不开第二个技能管理流程。