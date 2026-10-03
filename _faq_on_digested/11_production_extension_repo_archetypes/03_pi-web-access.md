# 03 — 外部能力聚合巨头：`pi-web-access`（月下载 404K）深度解剖

`pi-web-access`（作者：Nico Bailon，版本 0.35.0）是 Pi 生态中最常用的外部数据与网络感知扩展，月下载量超 40 万次。它为裸 Pi 补齐了网络检索、网页内容抽取、PDF 解析和 GitHub 仓库抓取等关键感知链路。

---

## 一、前后他要做什么（Before & After）

### 痛点前置（Before）
1. **裸 Pi 处于“断网盲盒”状态**：
   Pi 核心坚持极简，默认不提供 `web_search` 或 `fetch_url` 工具。Agent 如果需要查阅最新的库文档、GitHub issue 或公网排错方案，只能依赖内置的 `bash` 工具手写 `curl` 命令。
2. **Raw HTML 塞爆上下文**：
   直接用 `curl` 抓取的网页通常充斥着冗余的 HTML 标签、CSS、广告和 JavaScript，几万行杂质文本瞬间挤占大量 Token，且模型难以提取核心内容。
3. **企业级内网穿透风险（SSRF 攻击）**：
   如果允许 Agent 任意请求 URL，当模型产生幻觉或受到 Prompt 注入攻击时，可能被诱导请求 `http://169.254.169.254`（云厂商元数据接口）或内网管理后台，造成敏感凭据泄露。

### 解决方案（After）
`pi-web-access` 构建了一个**具备安全清洗能力的“全能网络网关”**：
- **全网聚合搜索引擎**：无缝聚合超过 25 种主流搜索后端（Tavily、Brave、Jina、Firecrawl、Exa、Perplexity、DuckDuckGo 等），支持多 Key 自动故障轮换与降级回退。
- **智能排版与语义抽取**：集成 `@mozilla/readability`、`linkedom` 与 `turndown`，抓取网页后自动提取正文并清洗为整洁的 Markdown。
- **本地 PDF 与多媒体解析**：内置 `unpdf` 无头解析引擎，Agent 无需外部依赖即可直接读懂 PDF 论文与架构图。
- **硬核 SSRF 防护网**：强制进行内网 IP 过滤，阻断所有对本地回环（`127.0.0.1`）、内网保留段（`10.0.0.0/8`、`192.168.0.0/16`）及云元数据地址的请求。

---

## 二、影响面是什么（Impact & Blast Radius）

| 维度 | 影响面与实现方式 |
|---|---|
| **Agent Loop** | 注册 `web_search` 与 `fetch_url`。Agent 在循环中自主调用；工具内部完成并发网络请求、多源回退与 Markdown 清洗后返回纯净正文。 |
| **Token 预算** | **高质量信息提纯**。通过 Readability 算法过滤 80%~90% 的页面噪音标签；同时配合输出截断机制，单次网页抽取被严格限制在有效长度内。 |
| **网络与安全** | `ssrf-protection.ts` 在所有网络请求前解析域名真实 DNS，禁止任何私有 IP 地址的建立连接，构筑安全沙箱。 |
| **凭据管理** | 搜索 Key 不写入 git，统一从 `~/.pi/agent/web-search.json` 或环境变量读取，支持动态多 Key 轮询。 |

---

## 三、利用了派的什么能力（Pi Capabilities Exploited）

1. **注册面（Register Surface）**：
   - `pi.registerTool`：注册 `web_search`（入参含 `query`, `count`, `domain_filter`）与 `fetch_url`（入参含 `url`, `extract_mode`）。
   - `pi.registerCommand`：注册 `/web` 交互式命令，允许用户在终端手动测试搜索连通性。
2. **长相层（Presentation）**：
   - 覆盖工具的 `renderCall` / `renderResult`，在终端渲染清晰的搜索结果预览卡片（标题、来源域名、正文摘要）。
3. **分发打包机制（`package.json.pi`）**：
   - 采用编译打包发布模式：`"pi": { "extensions": ["./dist"] }`，通过 esbuild 将依赖打包进单文件发布产物，避免下游环境缺失 Node.js 扩展依赖。

---

## 四、自身做了什么能力（Self-Provided Capabilities）

1. **25+ 搜索服务商弹性适配层**：
   为每个搜索引擎实现独立的驱动模块（`tavily.ts`、`brave.ts`、`jina-search.ts` 等），统一标准化为 `SearchResult { title, url, snippet }` 格式。
2. **Mozilla Readability 纯净正文清洗流**：
   基于 `linkedom`（轻量级 DOM 虚拟实现）运行 `@mozilla/readability`，将现代单页应用与富文本网站脱水提纯，再经由 `turndown` 输出语义化 Markdown。
3. **内网 IP 穿透防御器（`ssrf-protection.ts`）**：
   对目标 URL 进行严格的地址解析，阻断任何试图探测内部端口或读取云密钥的行为。
4. **并发控制与 Rate Limit 规避**：
   引入 `p-limit`，限制对同一主机的并发抽取速率，内置指数退避重试，避免被远端服务器 Ban IP。

---

## 五、核心思想与代码逻辑结构（Architecture & Code Structure）

### 1. 物理目录与模块分工

```text
pi-web-access/
├── package.json              # 依赖声明与打包构建脚本
├── index.ts                  # 扩展入口，负责工具注册与配置分发
│
├── [安全防御层]
│   └── ssrf-protection.ts    # DNS 解析与私有 IP / 云元数据黑名单拦截器
│
├── [搜索引擎适配器 (25+ Drivers)]
│   ├── tavily.ts             # Tavily AI Search 驱动
│   ├── brave.ts              # Brave Search API 驱动与速率限制
│   ├── jina-search.ts        # Jina DeepSearch 驱动
│   ├── firecrawl.ts          # Firecrawl 动态爬虫驱动
│   └── duckduckgo.ts         # 零 API Key 降级驱动
│
├── [正文与文件抽取层]
│   ├── extract.ts            # Readability + Turndown 清洗管线
│   ├── pdf-extract.ts        # unpdf 本地 PDF 二进制解析
│   └── github-extract.ts     # GitHub API / 仓库文件原生抓取
│
└── [UI 与工具层]
    ├── render-search-error.ts# 搜索失败时的降级提示卡片
    └── storage.ts            # 网页快照的本地磁盘缓存机制
```

---

### 2. 核心运行时流转时序（网页清洗与安全流水线）

```
Agent 发起调用: fetch_url("https://example.com/api-doc")
    │
    ▼
[ssrf-protection.ts]
    │  ├─ 解析 DNS 记录获取目标 IP
    │  └─ 校验是否为私网段 (127.0.0.1, 10.x, 192.168.x, 169.254.x)
    │        ├─ [私有 IP] ──► 抛错并阻断请求 (安全拦截)
    │        └─ [合规 IP] ──► 放行请求
    ▼
[undici: HTTP/HTTPS 请求]
    │  └─ 获取原始网页响应 (HTML / PDF / JSON)
    ▼
[语义清洗管线]
    │  ├─ 若为 PDF ──► 路由至 pdf-extract.ts (本地提取纯文本)
    │  └─ 若为 HTML ──► linkedom 构建轻量 DOM
    │                     └─► @mozilla/readability 剥离广告/导航/脚本
    │                           └─► turndown 输出为干净 Markdown
    ▼
[长度防御守护]
    │  ├─ 内容 < 15KB ──► 直接返回
    │  └─ 内容 > 15KB ──► 按章节截断并提示，存入 local storage
    ▼
回传 AgentToolResult ──► 进入 Agent 下一轮推理
```

---

## 六、测试资产与自动化测试考量（Testing Assets & Strategy）

1. **环境隔离测试模式（`test/isolate-env.mjs`）**：
   在 `package.json` 中配置 `"test": "node --import ./test/isolate-env.mjs --test"`。测试启动前清空外部网络环境变量，确保单元测试不走公网流量。
2. **SSRF 防御完备矩阵**：
   拥有完整的黑名单用例集，测试 IPv4、IPv6、八进制 IP、重定向穿透等变异形式是否均能被 `ssrf-protection.ts` 坚固阻断。
3. **HTML 夹具快照（Fixture Replay）**：
   收集了大量典型的糟糕 HTML 页面（充满广告、弹窗、反爬乱码的真实网页 Snapshot），测试 Readability 抽取器的提取纯净度与容错能力。

---

## 七、面向 Coding Agent 的友好度（Coding-Agent Friendliness / DX for AI）

| 考量维度 | 评级 | 真实表现与分析 |
|---|---|---|
| **单一职责解耦** | 极佳 (A+) | **每个搜索引擎都是一个独立的 `.ts` 文件**。Coding Agent 若要新增一个新的搜索后端（如新增国内某大模型搜索），只需复制一个已有驱动并实现标准接口，**零连带耦合**。 |
| **构建与发布规范** | 高 (A) | 包含独立的 `scripts/build.js`，将所有外部重型 CJS 依赖（如 turndown、linkedom）打进 `dist/`，Agent 运行 `npm run build` 即可交付。 |
| **排障友好度** | 高 (A) | 当远端搜索失败时，返回详细的结构化错误报告（`render-search-error.ts`），告诉 Agent 究竟是 Token 用尽、域名超期还是网络超时，方便 Agent 自主换路重试。 |
| **Agent 指引文档** | 中 (B) | 缺乏专属 `AGENTS.md`，但代码内部注释与错误提示极具指导性。 |
