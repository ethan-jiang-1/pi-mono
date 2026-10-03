# 01 — 协议适配巨无霸：`pi-mcp-adapter`（月下载 866K，全生态第一）深度解剖

`pi-mcp-adapter`（作者：Nico Bailon，版本 5.0.0）是 Pi 生态中下载量最高、依赖最复杂、也是工程成熟度最高的开源扩展。它占据了全生态近 14% 的下载量，是连接外部 Model Context Protocol (MCP) 服务器的绝对枢纽。

---

## 一、前后他要做什么（Before & After）

### 痛点前置（Before）
1. **官方立场的留白**：Pi 的核心哲学是 Minimal Core（极简核）。官方在 issue #6493 中明确确立了立场：“Pi 核内不做重型外部协议处理，所有媒体/外部协议留给扩展”。因此裸 Pi 无法连接任何现存的 MCP 服务器。
2. **外部生态早已繁荣**：在开发者的日常工作中，GitHub MCP、Postgres MCP、Slack MCP、Filesystem MCP 等标准化工具已经先于 Pi 普及。如果每接入一个服务都要手写一个独立的 Pi Extension，研发成本极其高昂。
3. **“工具爆炸”引发 Token 灾难**：如果简单粗暴地把数十个 MCP 服务器的全部工具 Schema 平铺注入给模型，一次对话的 System Prompt 会暴增 20K~50K Tokens，导致模型推理速度骤降、幻觉倍增且费用昂贵。

### 解决方案（After）
`pi-mcp-adapter` 充当了 Pi 与外部 MCP 世界的**透明智能网关**：
- **零代码接入**：开发者只需在 `~/.pi/agent/mcp.json` 或项目级配置文件中写几个 JSON 声明，即可激活对应的 MCP 服务。
- **Token 经济学优化**：提供“按需发现/延迟代理（Deferred Tool / Namespace Proxy）”与“元数据缓存（Metadata Cache）”，将上百个工具的上下文消耗压缩到几百 Token。
- **全生命周期保护**：统一实现了 OAuth 2.0 PKCE 认证流程、本地 Keyring 凭据管理、交互式安全授权、以及输出截断保护。

---

## 二、影响面是什么（Impact & Blast Radius）

| 维度 | 影响面与实现方式 |
|---|---|
| **Agent Loop** | 在 `tool_call` 拦截接缝中接入。当模型调用 MCP 工具时，插件拦截请求并转译为 JSON-RPC 2.0 请求，转发给底层 STDIO 子进程或 HTTP/SSE 服务，等待响应后再注入回循环。 |
| **Token 预算** | **正向大幅优化**。通过 `metadata-cache.ts` 计算服务配置 Hash，命中缓存时直接复用 schema；通过 `namespace-tools.ts` 提供汇总代理，避免无脑平铺所有工具定义。 |
| **执行权限与安全** | 引入 `project-server-trust.ts` 与 `consent-manager.ts`。项目级配置的 MCP 服务器默认不被信任，必须由用户在终端显式审批确认；同时支持敏感工具执行二次确认。 |
| **进程与资源** | 管理外部子进程生命周期（`cross-spawn`）。在 Pi 会话退出（`session_shutdown`）或异常终止时，由 `runtime-owner.ts` 确保优雅杀死所有残留的 STDIO 守护子进程。 |
| **输出与上下文** | `mcp-output-guard.ts` 严格守住 `DEFAULT_MAX_BYTES`（约 50KB）限制。当 MCP 服务返回巨量数据（如几十万行的 DB 查询结果）时，自动截断并将全文存入临时文件供检索，防止撑爆上下文。 |

---

## 三、利用了派的什么能力（Pi Capabilities Exploited）

`pi-mcp-adapter` 几乎把 Pi 的扩展能力用到了极致：

1. **统一入口与生命周期**：
   - 导出标准的 `export default createMcpAdapter()` 工厂函数；
   - 监听 `session_start`：初始化连接池、读取配置文件、从缓存拉取元数据；
   - 监听 `session_shutdown`：清理网络句柄、断开进程、注销临时文件。
2. **注册面（Register Surface）**：
   - `pi.registerTool`：动态批量注册所有经过校验的 MCP 工具，挂载严格的 TypeBox schema 与 `execute` 回调；
   - `pi.registerCommand`：注册 `/mcp` 调试与配置命令，支持在线检查服务存活状态、查看调用统计；
   - `pi.registerPrompt`：将 MCP 服务端提供的 Prompts 模板动态注册为 Pi 的 slash 命令。
3. **UI 槽位与交互感知**：
   - `ctx.ui.setStatus("mcp", ...)`：在终端 footer 实时更新当前在线的 MCP 服务数量及连接健康度；
   - `ctx.ui.select` / `ctx.ui.confirm`：用于 OAuth 认证确认、项目服务器信任授权弹窗；
   - `tool-result-renderer.ts`：为 MCP 工具调用定制终端富文本渲染器（支持状态折叠、耗时显示）。
4. **扩展间事件总线通信（Inter-Extension Bus）**：
   - 暴露 `pi.events.emit(MCP_RUNTIME_REGISTER_EVENT, ...)`；
   - 允许其他第三方插件在不写配置文件的纯内存状态下，动态向适配器注册内部 MCP 服务。

---

## 四、自身做了什么能力（Self-Provided Capabilities）

为了脱离宿主独立支撑复杂场景，该插件自身实现了重型基础设施：

1. **完整的 MCP 客户端驱动**：
   引入官方 `@modelcontextprotocol/client` 和 `@modelcontextprotocol/core`，完整支持 `stdio`、`sse`、`unix-socket` 三大传输协议。
2. **企业级 OAuth 2.0 PKCE 引擎**：
   包含完整的认证链路（`mcp-auth-flow.ts`、`mcp-callback-server.ts`）。在本地临时启动一个 HTTP 回调服务接收 OAuth Token，并通过 `@napi-rs/keyring` 将 Refresh/Access Token 写入操作系统原生安全钥匙串（macOS Keychain / Windows Credential Manager）。
3. **输出熔断守护器（`mcp-output-guard.ts`）**：
   当工具返回超长内容时，自动使用 `truncateHead` 截断，并在系统临时目录建立文件映射（`fullOutputPath`），向模型发出友好提示：“输出已截断，全文已持久化至 /tmp/pi-mcp-...，请使用 read 或 grep 查看”。
4. **QuickJS WASI 沙箱脚本执行（`quickjs-wasi`）**：
   内置轻量级 WASM JS 引擎，允许用户在沙箱内运行中间过滤脚本（`mcp-code.ts`）。
5. **重型子系统懒加载机制（`lazy-loader.ts`）**：
   通过 `createRetryableLoader(() => import(...))` 实现微内核启动，OAuth、CodeMode、SetupPanel 均在触发对应操作时才动态拉入内存。

---

## 五、核心思想与代码逻辑结构（Architecture & Code Structure）

### 1. 物理目录与模块分工

```text
pi-mcp-adapter/
├── package.json              # 声明 keywords: ["pi-package"] 与 "pi": { "extensions": ["./index.ts"] }
├── index.ts                  # 扩展总入口：初始化各子系统，导出 createMcpAdapter
│
├── [核心驱动层]
│   ├── server-manager.ts     # MCP 客户端生命周期池（管理连接、重试、健康探测）
│   ├── direct-tools.ts       # 将 MCP Tool 转换为 Pi 原生 ToolDefinition 并完成注册
│   ├── namespace-tools.ts    # 延迟加载与代理工具（按命名空间聚合，节省 Token）
│   └── tool-parameters.ts    # JSON Schema 到 TypeBox 参数模型的兼容转换器
│
├── [安全与认证层]
│   ├── project-server-trust.ts # 项目级配置的安全信任门禁与审批逻辑
│   ├── consent-manager.ts    # 交互式调用许可管理器
│   ├── mcp-auth-flow.ts      # OAuth 2.0 PKCE 认证时序驱动
│   ├── mcp-callback-server.ts# 本地接收 OAuth redirect 的临时 HTTP 服务
│   └── secure-keyring.ts     # 系统原生 Keyring 密钥存储抽象
│
├── [优化与防护层]
│   ├── metadata-cache.ts     # Schema 本地持久化缓存，避免每次启动重发探针
│   ├── mcp-output-guard.ts   # 严格防御工具返回过大字符，落盘临时文件
│   └── failure-backoff.ts    # 服务器崩溃指数退避策略，防止死循环轰炸
│
├── [UI 与长相层]
│   ├── tool-result-renderer.ts # 自定义 renderCall / renderResult 折叠输出
│   ├── mcp-panel.ts          # /mcp 交互式仪表盘 TUI 组件
│   └── mcp-status.ts         # Footer 状态条实时指示器
│
└── [沙箱与脚本层]
    ├── mcp-code.ts           # 代码模式与脚本调用支持
    └── mcp-script-wasm.ts    # QuickJS WASI 沙箱隔离环境
```

---

### 2. 核心运行时流转时序（Agent Loop 中的交互链路）

```
[Pi 启动阶段]
    │
    ▼
index.ts (createMcpAdapter)
    │
    ├─► config.ts: 读取全局与项目级配置 (mcp.json)
    ├─► project-server-trust.ts: 校验项目安全性 (未信任则阻断)
    ├─► metadata-cache.ts: 比对配置 Hash
    │     ├─ [Cache Hit] ──► 瞬间从缓存还原 Tool Schemas (0 毫秒等待)
    │     └─ [Cache Miss] ─► 启动 STDIO 子进程探针，拉取 tools/list 并写入缓存
    │
    ▼
direct-tools.ts: 调用 pi.registerTool(...) 完成批量挂载
    │
    ══════════════════════════════════════════════════════════════════
[运行中交互阶段]
    │
    ▼
用户输入 ──► Agent 思考 ──► 决定调用 MCP 工具 (例如 github_create_issue)
    │
    ▼
[Pi 循环接缝: tool_call]
    │  └─► 触发 pi-mcp-adapter 注册的 execute(toolCallId, params, ...)
    │        │
    │        ├─► consent-manager.ts: 检查是否需要用户按键确认
    │        │
    │        ├─► server-manager.ts: 获取/维持对应的 MCP Client 活跃连接
    │        │     └─► 跨进程发送 JSON-RPC 2.0 请求
    │        │
    │        ├─► mcp-output-guard.ts: 拦截服务端原始返回
    │        │     ├─ 数据正常 ──► 直接透传
    │        │     └─ 数据超标 ──► 截断至 50KB，存入 /tmp，追加路径指引
    │        │
    │        └─► 返回 AgentToolResult { content: [...], details: {...} }
    ▼
tool-result-renderer.ts: 在终端呈现折叠后的美化状态块
    │
    ▼
Agent 获取结果 ──► 继续后续思考与任务
```

---

### 3. 可供 Coding Agent 借鉴的核心工程模式

1. **双通道缓存启动（Cache-first Loading）**：
   如果在每次启动时都向 10 个子进程发送 `tools/list`，终端至少卡顿 2 秒。`metadata-cache.ts` 计算配置文件 MD5，配置未变时直接从磁盘 `.cache/mcp-metadata.json` 同步拉起，启动耗时仅需几个毫秒。
2. **大输出文件映射（File-mapped Output Guard）**：
   不直接将报错抛给模型，而是将超长内容落盘为临时文件，返回给模型：“结果已保存至文件，可通过内置的 read 或 grep 工具精确定位”。这样既保护了上下文，又保留了模型进一步探索的线索。
3. **松耦合运行时所有权（Runtime Owner Pattern）**：
   在 `runtime-owner.ts` 中维护所有的子进程 PID 与 AbortSignal。当收到终端中断或 `/reload` 时，统一广播 abort 信号，确保不会在宿主机残留孤儿进程。

---

## 六、测试资产与自动化测试考量（Testing Assets & Strategy）

`pi-mcp-adapter` 包含极其严谨的自动化测试体系，其核心设计理念是**“协议契约至上，零模型依赖，零环境污染”**：

### 1. 深度剖析：为什么必须坚决杜绝真实 LLM 和外部 MCP 服务？
在很多开发者的朴素观念中，测试 MCP 适配器就应该真正启动一个 GitHub MCP 服务或向大模型发一条指令让它调用。但 `pi-mcp-adapter` 严禁这种做法：
- **外部服务的不可靠性（External Flakiness）**：真实 GitHub 或 Slack API 存在网络延迟、凭证过期、速率限制（Rate Limit）。一旦外部服务抖动，CI 挂掉，负责维护的 Coding Agent 就会误以为是自己重构的 JSON-RPC 序列化代码破坏了逻辑，从而在错误的方向上徒劳修改。
- **协议契约解耦（Contract Verification）**：MCP 适配器的本质是**协议转译网桥**。测试的核心标的是“当收到 MCP Server 发来的 `tools/list` 响应时，是否在 2ms 内生成了合规的 TypeBox Schema”。这一行为是纯确定性的。
- **毫秒级执行保证 Agent 自我反馈环**：套件采用内存模拟的 JSON-RPC 双向流（In-Memory Mock Process），整个套件数百个测试在 1.2 秒内跑完。毫秒级的反馈让 Coding Agent 在修复一个 edge-case bug 时能够即时运行验证。

### 2. 测试分层与资产矩阵
- `test:vitest`：针对核心状态机、Schema 转译器、Hash 缓存的高速单元测试；
- `test:oauth`：OAuth 2.0 PKCE 全链路集成测试，通过模拟 HTTP 本地监听器测试授权码交换、刷新轮换与超时回退；
- `test:conformance`（`conformance/run.sh`）：运行标准 MCP 规范兼容性测试套件；
- `test:public-exports`：验证对其他插件暴露的公用 TypeScript 类型与 API。

### 3. 无侵入隔离策略（Zero Token & Zero OS Side-effects）
- **内存钥匙串模拟（Memory Keyring Mock）**：通过 `PI_MCP_ADAPTER_TEST_AUTH_STORE=memory` 环境变量，在测试中将系统原生 Keyring 替换为内存 Map，避免自动化测试污染开发者的真实系统钥匙串（macOS Keychain / Linux SecretService）；
- **离线沙箱断言（Offline STDIO Pipes）**：对 MCP 工具调用和结果包装全部使用 Node.js 内存 Stream（`PassThrough`）进行 STDIO 管道断言，实现零网络、零 Token 消耗。

---

## 七、面向 Coding Agent 的友好度（Coding-Agent Friendliness / DX for AI）

### 1. 失效现场还原：Output-Guard 诞生背后的血泪教训
在没有 `output-guard.ts` 之前，发生过典型的**上下文毒化灾难（Context Poisoning Disaster）**：
- **故障 Trace**：Agent 调用了一个看似普通的数据库查询工具 `query_db({ sql: "SELECT * FROM audit_logs" })`。外部 MCP 服务不加节制地吐出了 15MB、包含 80,000 行记录的原始 JSON。
- **连锁反应**：
  1. 15MB 文本瞬间占满了整个 Context Window（128K/200K Tokens 瞬间耗尽）；
  2. 宿主 Pi 被迫紧急触发激进的上下文截断（Session Compaction）；
  3. 截断算法清除了前序对话中人类下达的核心约束与代码规范；
  4. Agent 在下一轮对话中彻底失忆，开始胡言乱语甚至反复报错崩溃。
- **解法必然性**：`mcp-output-guard.ts` 设立了物理断路器：任何超过 50KB 的输出被强制落盘到 `/tmp/pi-mcp-output-xxx.json`，只向模型返回前 50 行摘要与文件读取指引。这道减压阀彻底消除了外部工具摧毁 Agent 认知上下文的可能。

### 2. Coding Agent 维护友好度综合评级

| 考量维度 | 评级 | 真实表现与底层机理 |
|---|---|---|
| **类型完备度** | 极高 (A+) | 全量 TypeScript 严格模式，所有 MCP 请求与响应均有精确 Schema，Agent 能够根据类型系统的编译报错自动完成 90% 的自愈。 |
| **就地测试闭环** | 高 (A) | 提供明确细分的测试命令（如单独跑 `npm run test:oauth`），Agent 可以在修改单一模块后进行秒级验证，不需要猜测全局脚本。 |
| **模块解耦粒度** | 中 (B) | 采用扁平目录结构（根目录下 40+ 个 TS 文件），单个文件（如 `index.ts` 达 2300 行）过于庞大，对 Context Window 较小的 Agent 带来一定的注意力分散压力。 |
| **Agent 操作指引** | 缺乏 (C) | 尚未设立专用的 `AGENTS.md`，主要依靠人类视角的 `README.md` 与清晰的 `package.json` scripts。未来的自研插件应补充显式的不变量说明。 |


