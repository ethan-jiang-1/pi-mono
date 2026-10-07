# v1.0.0 → v1.0.3 变更总结

**日期**: 2026-10-06
**范围**: `7fbbd5f4a`(v1.0.0+2) → `98d2e1947`(v1.0.3+23)（79 commits，291 文件 +17,127/−4,908，10-01 → 10-05，4 天）
**标签**: v1.0.1 / v1.0.2 / v1.0.3 三个 release（三天三 patch）；upstream main 领先 23 个未发布 commit（pi-env 整包在其中）
**本轮特殊性**: 第七次同步，1.0.0 大收缩后的第一个纯建设周期（净 +12,219）。详细取证见 [`0008-v1.0.0-to-v1.0.3.md`](./0008-v1.0.0-to-v1.0.3.md)。

---

## 一句话

v1.0.0 定形后官方用四天补齐了执行环境这层：durable 的 ExecutionEnv 从"够 bash 用"扩成带 conformance 的跨平台契约（argv exec / watch / 输出窗口），pi-env 在 v1.0.3 发布当天下午单日成包把它送上 SSH 远端（Rust daemon + 语义等价合同）；工具选择语义纠偏（`--tools` 选声明面、exposure 管可达面、`--no-mcp`）、codemode 沙箱 lockdown、azure provider 改名（唯一 release Breaking）、shrinkwrap 删除（0007 预测兑现）。

---

## Breaking 清单

### 明示（Breaking Changes 段）

1. **ai v1.0.3**：provider `azure-openai-responses` → `azure` + 双 API dispatch（Foundry Chat Completions 可用）；auth.json/models.json/settings.json 键迁移（coding-agent 1.0.3 的 Breaking 段记录同一改名的用户侧迁移）
2. **durable v1.0.3**：FileSystem +openBinaryReader/openDirReader、BinaryReader +scanLines、FileSystem +watch、exec argv + onOutput info（四条接口义务，自定义环境实现者必须跟进）
3. **mcp v1.0.1**：`clientMetadataUrl` → `clientMetadataDocument` 回调（CIMD 选择性启用）

### 记了但降级在 Changed/Fixed

fullscreen Home/End 键位（tui Changed）；`--tools` 的 MCP 语义变化（coding-agent Fixed——但同时改 SDK `createAgentSession({tools})` 行为，无迁移提示，本轮唯一可议归档）

### 完全没记（de facto）

无重大漏记——对比 0007 轮（durable 16 条被重置、chord 零记录），本轮记录质量显著改善；durable 自 1.0.1 起恢复逐版本规范记录。残留仅为空版本段噪音（mcp/codemode 1.0.2/1.0.3、durable 1.0.1）。

---

## 六大主题

### 1. pi-env：SSH 远程执行环境（post-v1.0.3，Unreleased）

- Mario Zechner 12 提交单日成包：TS 客户端（Connection 帧协议 / RemoteExecutionEnv / RemoteWatcher / ssh bootstrap）+ Rust daemon（~3.1k 行、3 个 pinned 依赖）
- 语义等价合同：RemoteExecutionEnv 结果 == NodeExecutionEnv 跑在同一远端机器，conformance + differential 双测试锁定
- 供应链纪律：daemon 按 SHA-256 命名部署 + 每次启动前验证；ssh 零转发 + host key 带外确认；8 目标交叉构建随 npm 包发布；npm pack 清单 CI 校验 + release 构建逐 OS 实测
- Windows 全走 PowerShell（base64 行上传、文件索引身份、ENOTDIR 合成、默认轮询）；monorepo 内零消费者；coding-agent ssh 扩展路线不受影响

### 2. durable ExecutionEnv 大扩（v1.0.3，4 条接口 Breaking）

- argv exec（数组直接 spawn 不经 shell）；输出窗口 window/skipped（省略量精确报告，被省略文本永不进保留尾部）；scanLines + BOM 语义修正；FileSystem.watch
- NodeFileWatcher 设计：原生事件只触发 rescan、变化 = 快照差分；Windows 强制轮询 / macOS FSEvents 500ms settle / 覆盖五修三连补
- pi.provider 持久 UUIDv7 session 身份（v1.0.2，prompt-cache 亲和，fork 拿新身份）；powershell 工具（Unreleased，与 bash 同构 argv exec，不进 CodingTools）
- env-conformance 套件（511 行）成为第二条 conformance 线，被 pi-env 消费

### 3. 工具选择语义重做 + hidden tools 修复（Unreleased）

- `--tools` 不再移除 MCP 工具：allowlist 选声明面、exposure 管可达面；`*` pattern；`--no-mcp`；`mcp__` 前缀触发过滤切换
- hiddenDeclarations 的 prompt 泄漏修复：rules/列表基于 declaredTools，skills hint 第三态 "indirect"，guidelines 迁入 codemode 声明（ToolLoadout.getPromptGuidelines）
- 五档 exposure 枚举本身无变化

### 4. azure 改名 + 模型/认证增量（ai 17 实质提交）

- azure-openai-responses → azure，一个 provider 挂两 API（azureStreams lazyStream 包装是 provider 层新模式）；samplingParamsByThinkingLevel 三层合并
- 重试两面增量（at capacity、HTTP/2 pending stream cancel——请求从未发出故可安全重放）；OAuth 刷新取消不再丢 rotated token；ChatGPT 端口占用即失败
- 目录：Clef 分类器、AI Gateway Claude 横线 ID、Together DeepSeek-V4-Pro-0813、Bedrock 分层计价、Nix 目录 pin；无退役模型

### 5. MCP 面补齐 + codemode 加固

- CIMD 选择性启用（v1.0.1 breaking）、DCR application_type（OIDC 服务器视缺省为 web client 拒 loopback）、项目 mcp.json override（第三种条目形态）、registerToolRenderer、shutdown AbortController
- codemode：lockdown 冻结 built-ins（patch 原型会劫持序列化桥致宿主崩，双侧修复）+ 输出封顶 16Mi/100k + image 落盘 0o600 + read 返回 image block

### 6. 分发换轨 + TUI 修复

- 删除 npm-shrinkwrap（#5653，0007 预测兑现）→ pi.dev installer install-lock；Nix flake + stable 分支（指向 v1.0.3）；README 重写为用户入口；npm-audit.mjs 显式豁免
- fullscreen Home/End 归编辑器、transcript 顶/底改 Ctrl+Home/End；多行 token 语法着色；WezTerm/Kitty 图像修复 + setImageTranscoder
- 其余 7 包零行为变化；PROTOCOL_VERSION 仍 8；tui-plan.md 删除（布局系统落地后的清理）

---

## 对 _digested 的影响一览

- **大改**：`_digested/README.md`（基线 + 包表 14 行）、`architecture-next/durable-and-storage.md`（新增 ExecutionEnv 章）、`architecture-next/README.md`
- **局部更新**：agent/ 5 篇（5.1、5.2、1.3、1.4、4.3）、composition/ 4 篇、orchestration/ 4 篇、integration/ 2 篇、harness/ 4 篇（含 2.2、1.1、05 三篇）、test-strategy/ 4 篇 + 2 SVG
- **FAQ**：01/02/03 更新，07/08 补注，README 基线刷新
- 机械化："shrinkwrap" 字面引用替换（install-lock）
