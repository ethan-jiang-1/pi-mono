# 02-Boundaries — 扩展的边界：四条短板，以及"吸纳新东西"的真实代价

> 本节回答 `harness/` 的第二个问题：**好不好扩展，边界在哪。** [01-Architecture](../01-Architecture/README.md) 证明了"结构优秀"，本节专门讲**反方向**——哪些能力"理论上能做，但没护栏 / 没契约 / 半成品"，避免高估 pi 的开放度。

## 本节的立场

"结构优秀"和"能安全吸纳陌生人的东西"是两件事。本节用一个统一的分辨器看待每条短板：

**先分清楚"自用扩展"和"吸纳陌生插件"两种诉求，再下结论。** 对前者 pi 已经很成熟；对后者，四条短板各自卡一个环节。

## 篇章

| 篇 | 短板 | 卡住"吸纳陌生东西"的哪个环节 |
|---|---|---|
| [2.1_no_sandbox.md](./2.1_no_sandbox.md) | 无默认沙箱，扩展 = 宿主进程同等权限 | 安全（`pi install` 一个包 ≈ 执行其任意代码） |
| [2.2_no_interop_protocol.md](./2.2_no_interop_protocol.md) | 无 MCP/ACP，生态锁在自家 extension API | 互操作（外部工具不能即插即用） |
| [2.3_agent_lane_skeleton.md](./2.3_agent_lane_skeleton.md) | 内层 harness（AgentLane）是半成品 | 二次开发（library-first 承诺未兑现到 agent 包） |
| [2.4_no_version_contract.md](./2.4_no_version_contract.md) | 无显式 extension API 版本/兼容契约 | 稳定（上游 breaking 演进时第三方静默失效） |

## 写作定调（本节专属，叠加在 `../README.md` 之上）

- **每条短板必做"severity 分层"**：对"自用"是什么级别、对"吸纳陌生人"是什么级别，不能一概而论。
- **每条短板必问"缓解路径"**：pi 有没有留出口（哪怕是 opt-in 的 example）、留了口但为什么不是默认。
- 硬事实（源码可核）与评价（判断）分开标；机制回指 `../../agent/` 与 `../01-Architecture/`。
