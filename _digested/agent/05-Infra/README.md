# 05-Infra：AI 基础设施层

## 一句话定位

`packages/ai` 是 pi-mono 的 LLM 抽象层。v0.83.0 中它经历了最大的架构重构：从 provider 定义与 API 实现混在一起的单一 `providers/` 目录，拆分为三层——`api/`（wire-protocol streaming）、`providers/`（model catalog）、`auth/`（credential resolution）。理解这三层的边界是理解 pi-mono 如何支持多 provider 的关键。

## 专题分工

| 文件 | 回答什么问题 |
|------|-------------|
| [5.1_AI_API_Layer.md](./5.1_AI_API_Layer.md) | 每个 API adapter 的 stream 合约是什么？lazy loading 怎么做到零启动成本？`streamSimple` 和 `stream` 的区别？ |
| [5.2_AI_Auth_Subsystem.md](./5.2_AI_Auth_Subsystem.md) | auth 怎么从 util 升级为一阶子系统？CredentialStore 的并发模型？OAuth flow 的 PKCE + device-code 架构？`ModelRuntime` 对外部集成意味着什么？ |

## 推荐阅读顺序

1. 先读 [2.3_LLM_Bridge.md](../02-Runtime/2.3_LLM_Bridge.md) 回顾 v0.75.3 时代的 LLM 桥接层
2. 再读 [5.1_AI_API_Layer.md](./5.1_AI_API_Layer.md) 理解新架构
3. 最后读 [5.2_AI_Auth_Subsystem.md](./5.2_AI_Auth_Subsystem.md) 理解 credential 生命周期

## 边界

- 不逐文件解释 31 个 API adapter 的实现细节——只讲架构模式和合约
- 不讲每个 provider 的 model catalog——那是 `providers/` 的数据，不是机制
- 不讲 TUI 中的 OAuth login UI——只讲 auth 子系统的接口和 pipeline
