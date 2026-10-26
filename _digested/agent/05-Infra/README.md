# 05-Infra：AI 基础设施层

> **基线：v1.4.0（`4a080252f`）。** 本目录 5.1/5.2 的正文主体仍是 v0.84.2 时代的三层拆分（`api/`/`providers/`/`auth/`），v1.4.0 起另加两个横切面：**client identity**（UA/attribution 统一到 ai，见 5.1）与 **telemetry**（ai/chord/durable 共用的追踪契约，见 5.3）。

## 一句话定位

`packages/ai` 是 pi-mono 的 LLM 抽象层。v0.83.0 中它经历了最大的架构重构：从 provider 定义与 API 实现混在一起的单一 `providers/` 目录，拆分为三层——`api/`（wire-protocol streaming）、`providers/`（model catalog）、`auth/`（credential resolution）。理解这三层的边界是理解 pi-mono 如何支持多 provider 的关键。

## 专题分工

| 文件 | 回答什么问题 |
|------|-------------|
| [5.1_AI_API_Layer.md](./5.1_AI_API_Layer.md) | 每个 API adapter 的 stream 合约是什么？lazy loading 怎么做到零启动成本？`streamSimple` 和 `stream` 的区别？模型数据与 client identity 从哪里来？ |
| [5.2_AI_Auth_Subsystem.md](./5.2_AI_Auth_Subsystem.md) | auth 怎么从 util 升级为一阶子系统？CredentialStore 的并发模型？OAuth flow 的 PKCE + device-code 架构？`ModelRuntime` 对外部集成意味着什么？ |
| [5.3_Telemetry_Layer.md](./5.3_Telemetry_Layer.md) | span/metric/link 的契约是什么？propagation 怎么跨进程？三包各自接哪一层？为什么不能把内容写进属性？ |

## 推荐阅读顺序

1. 先读 [2.3_LLM_Bridge.md](../02-Runtime/2.3_LLM_Bridge.md) 回顾 v0.75.3 时代的 LLM 桥接层
2. 再读 [5.1_AI_API_Layer.md](./5.1_AI_API_Layer.md) 理解新架构
3. 需要追踪 AI 请求或接入宿主 telemetry 时读 [5.3_Telemetry_Layer.md](./5.3_Telemetry_Layer.md)
4. 最后读 [5.2_AI_Auth_Subsystem.md](./5.2_AI_Auth_Subsystem.md) 理解 credential 生命周期

## 边界

- 不逐文件解释 32 个 API adapter 的实现细节——只讲架构模式和合约
- 不讲每个 provider 的 model catalog——那是 `providers/` 的数据，不是机制
- 不讲 TUI 中的 OAuth login UI——只讲 auth 子系统的接口和 pipeline
