# 01-Anatomy：静态结构总览

> **⚠️ v0.84.2 基线（2026-08-17）**：本节正文基于 v0.75.3 编写，v0.83.0/v0.84.0 有重大 API 演进，各篇以警示标注为准（`Session_v4` 见 3.5，`AgentLane` 骨架见 4.1）。

## 目录范围

聚焦 pi-mono Agent 系统的静态结构：Agent 身份与配置、消息类型体系、工具注册链、扩展系统。

## 章节索引

- [1.1_Agent_Info.md](./1.1_Agent_Info.md): Agent 身份、AgentLoopConfig 钩子体系、Agent 类的公开 API
- [1.2_Message_Graph.md](./1.2_Message_Graph.md): AgentMessage 联合类型、声明合并扩展、convertToLlm 转换桥
- [1.3_Tool_Registry.md](./1.3_Tool_Registry.md): Tool / AgentTool / ToolDefinition 三层类型、工具允许列表、执行模式
- [1.4_Extension_System.md](./1.4_Extension_System.md): jiti 加载、ExtensionRunner 事件扇出、运行时 provider 注册

## 按问题读

- 想看"Agent 是什么、怎么配置"：[1.1_Agent_Info.md](./1.1_Agent_Info.md)
- 想看"消息怎么流经系统"：[1.2_Message_Graph.md](./1.2_Message_Graph.md)
- 想看"工具为什么有三层包装、allowlisting 怎么工作"：[1.3_Tool_Registry.md](./1.3_Tool_Registry.md)
- 想看"扩展怎么注入能力、事件怎么扇出"：[1.4_Extension_System.md](./1.4_Extension_System.md)

## 建议顺序

`1.1 -> 1.2 -> 1.3 -> 1.4`
