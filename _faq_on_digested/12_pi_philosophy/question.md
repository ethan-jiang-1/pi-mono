# 问题：Pi 自己的理念是什么？

## 背景

在对照其它 agent harness 时，一个问题被凸显出来：Pi 不能只用功能清单描述。它为什么坚持极简核心？为什么把 plan mode、sub-agent 等能力放到扩展与 package？为什么同时提供 TUI、RPC 和 SDK？这些选择之间是否有一条自己的约束链？

本 FAQ 由外部对照触发，但答案从 Pi 作者自述、当前 README、源码与贡献规则建立论证。既有 `_digested/` 仅提供二手导航；外部项目不是 Pi 理念的证据。

## 要回答的问题

1. Pi 的原生动机有哪些，它们如何共同约束设计？
2. `minimal`、`extensible`、`make your own`、`library-first` 之间是什么关系，而不是四句并列口号？
3. Pi 的理念如何落到核心、扩展、宿主、配置、会话和失败反馈？
4. Pi 的代价是什么：哪些复杂度被交给用户、宿主和生态？
5. `_digested/` 当前是否已经为这套判断提供足够好的研究支撑，怎样让研究者不必自行拼接证据？

## 证据边界

- 当前行为核对到源码锚点 `cb18c7cbc89d5becbb4ea2e490a6e7ad0e989f04`；它不等于 [既有全库消化基线](../../_digested/README.md)，本次也不是全库版本同步。
- 作者自述用于确认历史动机，当前源码/docs用于确认行为；二手分析不充当作者意图证据。“理念”是可复核的解释，不是官方逐字宣言，也不证明所有设计都来自同一个原因。
- 本 FAQ 的目标是提炼 Pi 的设计判断，不是提出一份新的产品路线图。

## 阅读顺序

1. [`answer.md`](answer.md)：原生动机、设计取舍、责任边界与代价。
2. [`research.md`](research.md)：按主张核对 Pi 的一手证据。
3. [`_digested/composition/15_pi_philosophy_evidence_map.md`](../../_digested/composition/15_pi_philosophy_evidence_map.md)：看理念主张与现有消化材料、源码锚点的对应关系。
