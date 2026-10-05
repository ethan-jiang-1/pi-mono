# 05 · 外部工具生态:MCP 接入

pi 的编排阶梯需要外部能力时,入口是 MCP:v1.0.0 起官方采纳(`packages/mcp` 独立客户端 + coding-agent 内置扩展),外部 server 的工具被适配成 `AgentTool` 后,与内置工具、扩展工具同场竞争——**对模型可见面而言,MCP 工具就是普通工具**,因此阶梯上每一级(双队列、codemode 脚本、subagent 的工具收缩)都天然覆盖它。v1.0.3 后须补一层限定(Unreleased,04b97ef00):**声明面上不再完全同权**——`--tools` 白名单下未命中的 MCP 工具保持注册但**永不直接声明给模型**,仅经 codemode 注入与 tool_search 间接可达(注册与声明两分支见 `_isAllowedTool`/`_isActivatable`,`packages/coding-agent/src/core/agent-session.ts:1523-1539`);一句话:`--tools` 选的是声明面,MCP 工具的可达面由 exposure 决定,allowlist 不再顺手砍掉。

## 为什么是这个形状:设计考量

`packages/mcp/README.md:3`:"A small, standalone Model Context Protocol client. It does not depend on the official MCP SDK or other pi packages." 独立无依赖意味着:pi 不把 MCP 做成运行时概念,而是做成**一个适配器包 + 一个内置扩展**——MCP server 是进程外的工具来源,接入即获得工具,不获得编排语义。这与 DSH 的对照一致:两边的 MCP 都解决"消费外部工具生态",不解决"谁调度谁"([`_faq_on_digested/06_pi_vs_dsh/answer.md`](../../_faq_on_digested/06_pi_vs_dsh/answer.md) v1.0.0 更正节)。

## 机制

- **传输中立**:核心 client + stdio 与 Streamable HTTP 两种传输 + 内存测试传输(`README.md:3-5`,用法示例 `:7-24`);
- **工具适配**:`toLlmContent(result)` 把 `CallToolResult` 转成 pi-ai 的文本/图像内容——文本与图像透传、内嵌资源解包、音频/二进制/资源链接变成短文本占位;只有 `structuredContent` 的结果直接转 JSON(README "Tools for an LLM" 节,`:30`);再包一层即得 `AgentTool`,进 [01](./01-loop.md) 的工具结算合同(校验、before/after 钩子、isError 语义全部适用);
- **内置扩展**:coding-agent 侧把 server 配置与生命周期接进会话(采纳前后边界评价见 [`harness/02-Boundaries/2.2`](../harness/02-Boundaries/2.2_no_interop_protocol.md) v1.0.0 重写版)。
- **项目 override**(v1.0.1,#10277):`.pi/mcp.json` 里没有 `command`/`url`/`type` 的条目被识别为 override,只允许改 `enabled`/`exposure`/`toolExposure` 三键,其余字段继承全局定义(`config.ts:74-77`,合并逻辑 `:108-118`)——项目条目从此有第三种形态:同名不再是"整体替换全局条目",而是"选择性覆盖"(含项目自己配不了的凭据仍留在全局)。
- **渲染接管**(v1.0.1,#10285):扩展 API 新增 `pi.registerToolRenderer((toolName, next) => renderers)`(`packages/coding-agent/src/core/extensions/types.ts:1685`),解析器按扩展加载顺序运行、可为**未注册**的工具选渲染器——MCP 扩展用它匹配 `mcp__(.+?)__(.+)`,恢复的会话里 server 未连上的工具调用不再整段展开渲染。
- **关闭语义**(Unreleased,#10249):`McpServerConnection` 的 `closed` 布尔改为 `AbortController`(`packages/coding-agent/src/extensions/mcp/runtime.ts:175`),`close()` abort 信号、取消重试等待并 `await` 在途连接(`:480`)——session 关闭时正在连接的 server 不再挂到超时。
- **OAuth 增量**(一句带过):Client ID Metadata Document 改为选择性启用(coding-agent 侧 `oauth.clientRegistration: "cimd"`,v1.0.1 #10302),DCR 请求体按 MCP SEP-837 从 redirect_uris 推导 `application_type`(Unreleased,#10493);细节见 [`harness/02-Boundaries/2.2`](../harness/02-Boundaries/2.2_no_interop_protocol.md)。

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
| `packages/coding-agent/src/core/mcp-servers.ts` | coding-agent 侧 server 配置与工具名语义入口(不再是单纯存在性锚点):现导出 `createToolNameMatcher`(`:21`,含 `*` 的条目编译为全锚定正则、其余走 Set,`--tools`/`--exclude-tools` 与 `toolExposure` 共用同一套 pattern 语法)、`isMcpToolName`(`:39`,`mcp__` 前缀**或** `list_mcp_resources` 等 resource 工具)、`LIST_MCP_RESOURCES_TOOL` 等 resource-tool 常量(`:28`) |
