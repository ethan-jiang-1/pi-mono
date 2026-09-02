# 篇一:"能力有限"是默认值差异,不是能力差异

## 一句话

Claude Code / Codex 把一整套工作流设施(to-do、plan mode、subagent、MCP、hooks、权限弹窗)**默认注入**给你;pi 把几乎同样的能力面**留成口子**(AGENTS.md、skills、prompt templates、extensions、packages),默认只注入最小集。你在 CC 里"白拿"的每一样,在 pi 里都有对应物——只是要么换了形态(文件 / 扩展 / 包),要么需要你动手装一次。

## 两边的官方哲学对照

| | Claude Code | Codex | pi |
|---|---|---|---|
| 自我定位 | "agentic coding environment,不是 chatbot" | coding agent(本地 + 云) | "expert coding assistant",极简 harness |
| 指导文件 | CLAUDE.md(`/init` 生成) | AGENTS.md | AGENTS.md(兼容读 CLAUDE.md) |
| 权限模型 | permission prompts + allowlist | sandbox 三档 + approval policy | **YOLO 默认,全权** |
| 默认设施 | to-dos、plan mode、subagents、hooks、skills、MCP | plans、sandbox、skills、MCP | 默认只有 4 个工具:`read`/`bash`/`edit`/`write` |
| 设计哲学 | 平台:功能进产品,默认开启 | 平台 | "if I don't need it, it won't be built",能力长在扩展/包上 |

pi 侧出处:Mario 的设计博文(极简系统提示 <1000 token、四工具论、YOLO 默认、明确不做 to-do/plan mode/MCP/subagent/background bash)。CC 侧出处:官方 best practices 页。

pi 默认工具集的源码核对(v0.84.4):`packages/coding-agent/docs/quickstart.md` L77-84——"By default, pi gives the model four tools",只读工具 `grep`/`find`/`ls` 需通过 `--tools` 显式加;全部 8 个内置工具名单见 `packages/coding-agent/src/core/tools/index.ts:95`。

## 映射表:CC 官方最佳实践 → pi 等价物

把 [CC Best practices](https://www.anthropic.com/engineering/claude-code-best-practices) 的建议逐条过:

| # | CC 最佳实践(官方原文) | pi 等价物 | 形态变化 |
|---|---|---|---|
| 1 | 给可验证回路(test/build/screenshot),否则"你就是验证循环" | 相同:AGENTS.md 写明检查命令,YOLO 模式下 pi 自己迭代跑到绿 | 无变化(纯 prompt 层) |
| 2 | Explore → plan → code → commit 四段式 | 无内置 plan mode:① 只读探索 `pi --tools read,grep,find,ls`;② 计划落盘 `PLAN.md`(可跨会话、可进 git、可手改);③ 要交互式计划 UI 就装 plan-mode(example 扩展)或 plannotator 包 | 模式开关 → 文件 + 工具白名单 |
| 3 | prompt 给具体上下文(文件/样例模式/约束) | 相同且更强:`@file` 直接附文件(含图片),`!command` 把命令输出发给模型(`!!` 只跑不发) | 无变化 |
| 4 | 写好 CLAUDE.md(短;命令/风格/工作流;臃肿会被忽略) | 写好 AGENTS.md:pi 启动时读全局 + 父目录链 + 当前目录的 `AGENTS.md` **或** `CLAUDE.md`,目录可用 `AGENTS.override.md` 覆盖 | 换文件名,原则照抄 |
| 5 | 权限管理(allowlist / 逐条审批) | 默认没有审批弹窗;替代:`--tools`/`-xt` 工具白名单、容器化(`docs/containerization.md`:Docker / gondolin micro-VM)、permission-gate 类包 | 产品功能 → 配置 + 扩展 + 隔离 |
| 6 | hooks(事件钩子) | extensions:`on()` 事件系统(v0.84.4 共 36 个事件重载,消化材料复核口径) | 换 API |
| 7 | skills | skills:实现 Agent Skills 标准,`/skill:name` 调用;**可直接挂载 `~/.claude/skills`、`~/.codex/skills` 复用别家 skill** | 几乎无变化,生态互通 |
| 8 | subagents(调查/审查用) | 无内置:pi-subagents(362.5K/月)、@tintinweb/pi-subagents、pi-background-tasks 等包;或 tmux 多会话手动编排 | 内置 → 包 |
| 9 | MCP | 无内置:pi-mcp-adapter(下载榜第一,761.4K/月);或按 Mario 的"CLI over MCP"论直接让 agent 用 CLI / 写脚本 | 内置 → 包或方法论 |
| 10 | 内置 to-dos | 明确不做:推荐 `TODO.md` 文件(模型可读写、你可见);要 UI 装 @juicesharp/rpiv-todo(98.9K/月) | 内置 → 文件/包 |
| 11 | headless:`claude -p` + `--output-format json/stream-json` | `pi -p`(支持 stdin 管道合并进 prompt)、`--mode json`(JSONL 事件流)、`--mode rpc` | 等价,甚至更 Unix |
| 12 | 多会话 + git worktree 并行 | 相同:pi 是普通 CLI,`git worktree` + 多终端各开一个 | 无变化 |
| 13 | writer/reviewer 双会话、adversarial review(新 context 审 diff) | 相同:两个 pi 会话,一个写一个审;新会话无"自恋偏差" | 无变化 |
| 14 | fan-out across files(shell 循环 `-p`) | 相同:`for f in $(cat files.txt); do pi -p "migrate $f"; done` | 无变化 |
| 15 | `/clear` 换任务、防 context 污染、kitchen-sink 会话 | `/new` 换任务;`/compact` 手动压缩;`/fork`、`/clone`、`/tree`(跳回任意历史节点从那里继续)——pi 的会话是树,回溯能力更强 | 等价或更强 |
| 16 | checkpoints / rewind | `/tree` 换分支重写 + git-checkpoint(example 扩展) | 内置 → 会话树 + 扩展 |

证据:pi 侧逐格来自 `packages/coding-agent/docs/`(usage/skills/prompt-templates/json/containerization)与 `examples/extensions/`;CC 侧来自官方 best practices 页;包名与下载量来自 pi.dev/packages 快照(2026-09-02)。

## 映射不上的(真差距)

1. **产品化的逐条审批体验**:CC/Codex 有完整的"每次问你要不要"的产品流程;pi 哲学认为那是 security theater,只提供隔离方案。想要这个体验,pi 不给开箱版本——这是**主动不做**,不是做不了。
2. **官方托管的 subagent / 团队编排 / 云端会话**(CC 的 agents/cloud 系列):pi 没有,只有社区包。
3. **官方 IDE 深度集成**:CC/Codex 有官方 VS Code/JetBrains 插件;pi 的路线是 RPC/SDK 让别人来集成(`_digested/integration/`)。
4. **"零配置即合理"**:CC/Codex 的默认值对新手友好;pi 的默认值对"知道自己要什么"的人友好。零配置的 pi 确实"话少、不管你"——这正是 [06_pi_vs_dsh](../06_pi_vs_dsh/question.md) 说的**默认组合宽度差异**,不是能力上限。

## 小结

"Pi 能力有限"把两个变量混成了一个:**默认注入的能力宽度**(pi 确实窄)和**可达的能力上限**(pi 不窄——AGENTS.md / prompt templates / skills / extensions / packages 五条生长线全通)。CC 官方 16 条主要建议里,过半在 pi 中形态不变或等价,其余有明确的替代物;真正买不到的只有"产品化审批"和"官方托管编排"两样,而这两样恰是 pi 设计上主动放弃的(见 `_digested/extensions/01-Core/1.2_skipped_features.md`)。
