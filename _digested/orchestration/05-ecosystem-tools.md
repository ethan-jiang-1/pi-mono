# 05 · 外部工具生态:MCP 接入

pi 的编排阶梯需要外部能力时,入口是 MCP:v1.0.0 起官方采纳(`packages/mcp` 独立客户端 + coding-agent 内置扩展),外部 server 的工具被适配成 `AgentTool` 后,与内置工具、扩展工具同场竞争——**对模型可见面而言,MCP 工具就是普通工具**,因此阶梯上每一级(双队列、codemode 脚本、subagent 的工具收缩)都天然覆盖它。

## 为什么是这个形状:设计考量

`packages/mcp/README.md:3`:"A small, standalone Model Context Protocol client. It does not depend on the official MCP SDK or other pi packages." 独立无依赖意味着:pi 不把 MCP 做成运行时概念,而是做成**一个适配器包 + 一个内置扩展**——MCP server 是进程外的工具来源,接入即获得工具,不获得编排语义。这与 DSH 的对照一致:两边的 MCP 都解决"消费外部工具生态",不解决"谁调度谁"([`_faq_on_digested/06_pi_vs_dsh/answer.md`](../../_faq_on_digested/06_pi_vs_dsh/answer.md) v1.0.0 更正节)。

## 机制

- **传输中立**:核心 client + stdio 与 Streamable HTTP 两种传输 + 内存测试传输(`README.md:3-5`,用法示例 `:7-24`);
- **工具适配**:`toLlmContent(result)` 把 `CallToolResult` 转成 pi-ai 的文本/图像内容——文本与图像透传、内嵌资源解包、音频/二进制/资源链接变成短文本占位;只有 `structuredContent` 的结果直接转 JSON(README "Tools for an LLM" 节,`:30`);再包一层即得 `AgentTool`,进 [01](./01-loop.md) 的工具结算合同(校验、before/after 钩子、isError 语义全部适用);
- **内置扩展**:coding-agent 侧把 server 配置与生命周期接进会话(采纳前后边界评价见 [`harness/02-Boundaries/2.2`](../harness/02-Boundaries/2.2_no_interop_protocol.md) v1.0.0 重写版)。

## 边界与上限

- MCP 带来的是**工具**,不是代理:server 不能发起 turn、不能注入消息;推进者仍然是模型与用户(统一维度矩阵里的"外部工具"行)。
- 工具质量参差是生态事实:pi 侧没有 harness 级的 MCP 工具审计或预算;`beforeToolCall` 钩子是宿主做准入的天然位置(如 permission-gate 示例扩展的模式)。
- 无沙箱立场延伸到 MCP:stdio server 以用户权限运行;信任边界靠项目信任与人工确认,不在协议层([`harness/02-Boundaries/2.1`](../harness/02-Boundaries/2.1_no_sandbox.md))。

## 与相邻原语的关系

- codemode 是 MCP 工具的高吞吐消费方:把 server 工具注入沙箱,批量调用不付逐轮上下文([04](./04-codemode.md));
- subagent 的 `--tools` 参数可以把某个 MCP 工具的可用性收缩到特定子代理([03](./03-subagent.md));
- durable 侧把 MCP 工具接进持久会话的 ToolRegistration 面([07](./07-durable-tasks.md))。

## 源码入口

| 路径 | 一句话 |
|------|--------|
| `packages/mcp/README.md:3-5` | 独立客户端、传输清单 |
| `packages/mcp/README.md:30`(Tools for an LLM 节) | `toLlmContent` 适配合同 |
| `packages/coding-agent/src/core/mcp-servers.ts` | coding-agent 侧 server 配置入口(存在性锚点) |
