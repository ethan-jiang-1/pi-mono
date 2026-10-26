# 术语与心智模型

本页解释卷内使用的 Pi 词汇，全部依据 `v1.4.0` 的文档与源码；标注（本语料命名）的条目是本语料自己的命名。按主题分组；跨卷链接供深入，不构成前置顺序。

## 一、运行时的三个层次

| 词 | 含义 | 边界 |
|---|---|---|
| agent core（`pi-agent-core`） | Agent 循环、工具调用、状态管理的最小运行时 | 不含 CLI、资源发现、UI |
| coding-agent（`pi-coding-agent`） | 交互 CLI 与 SDK：`AgentSession`、`SessionManager`、`ResourceLoader`、内置工具 | 扩展运行在这一层，不在 agent core |
| 扩展运行时 | 加载扩展 factory、派发事件、管理注册表（`/reload` 命令触发重载，[slash-commands.md L49](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/slash-commands.md#L49)） | reload 会替换整个扩展运行时，旧运行时的状态不可复用 |

`createAgentSession()` 创建的会话拥有一段对话、模型与工具、排队消息、压缩状态和扩展运行时；`dispose()` 中止工作并使扩展上下文失效（运行时事实，见 [SDK 文档](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/sdk.md#L26-L60)）。Pi 官方的架构总览见 [How Pi Works](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/how-pi-works.md#L3)：会话协调模型请求、工具执行、上下文组装与会话存储；interactive、print、JSON、RPC 与 SDK 各界面共用同一套 agent 与会话机制（[L33-L39](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/how-pi-works.md#L33-L39)）。

## 二、资源类型：扩展、skill、prompt template、package

- **扩展**：TypeScript 模块，默认导出接收 `ExtensionAPI` 的 factory。承载需要执行代码的能力：工具、命令、事件处理器、provider、MCP server、虚拟模型、渲染。运行在 Pi 进程内，拥有与用户相同的操作系统权限——只加载信任来源（运行时事实）。
- **skill**：含 `SKILL.md` 的目录（可移植形态）；skills 目录根下的单个 Markdown 文件也被接受（[skills.md L63](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/skills.md#L63)），pi-mono 自用的四个 skill 就是单文件形态。启动时只把 name、description 与路径加进系统提示；任务匹配时模型才读完整指令。可捆绑 scripts/references/assets。`description` 决定路由，要同时写「做什么」和「何时用」。`/skill:name` 强制加载；`disable-model-invocation` 关闭自动选择（运行时事实，见 [Skills 文档](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/skills.md)）。
- **prompt template**：Markdown 文件变成 `/` 命令；文件名即命令名。支持位置参数与默认值展开。没有执行行为（运行时事实，见 [Prompt Templates 文档](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/prompt-templates.md)）。
- **package**：把上述资源（加 themes）作为一个单位经 npm/git/本地路径分发。约定目录或 `pi` manifest；经 `pi install` 写入 settings；npm 包用 `pi-package` keyword 进 gallery（运行时事实，见 [Packages 文档](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/packages.md)）。

判别口径：需要可执行行为 → 扩展；需要领域方法+配套文件 → skill；固定提示命令 → template；多资源一体分发 → package。

## 三、发现、位置与信任

- **agent dir**：个人资源在 `~/.pi/agent/`（extensions/skills/prompts/themes 子目录）；项目资源在仓库 `.pi/` 下，project trust 授予后才加载。
- **ResourceLoader**：负责发现与加载资源。SDK 允许整体替换（host 完全自持资源存储时）。
- **project trust**：项目扩展、skills、templates、packages 可以指示模型运行程序或改文件，所以信任授予前不加载。评审第三方 package 源码与项目 package 声明是使用者的责任（运行时事实）。
- **host 提供包**：`@earendil-works/pi-ai`、`@earendil-works/pi-agent-core`、`@earendil-works/pi-coding-agent`、`@earendil-works/pi-tui`、`typebox` 由 Pi 提供给扩展和 skills，声明在 `peerDependencies` 用 `"*"`。

## 四、事件与生命周期

一次 run 的顺序：输入 → `before_agent_start` → 模型/消息/工具事件 → `agent_end`。自动重试、恢复、压缩、排队工作可在 `agent_end` 后继续；`agent_before_settle` 是最后的可行动边界（可追加条目并请求一次继续）；`agent_settled` 最终且仅通知。宿主要知道「不会自动继续了」应等 `agent_settled`（运行时事实，见 [Extensions 的生命周期节](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/extensions.md#L52-L67)）。

handler 按扩展加载与注册顺序运行；不同事件的能力不同（通知、变换、替换、取消），用声明类型而不是猜测返回值的作用。压缩前另有 `session_before_compact` 钩子：扩展可提供自定义摘要（条目记 `fromHook: true`）并把生成摘要的 LLM `usage` 计入会话统计（运行时事实，见 [Compaction 文档](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/compaction.md#L296)）。

## 五、工具词汇

- **exposure**：模型触达工具的方式。`direct`（默认，声明且可调用）、`model-only`（声明不可调用）、`codemode`（注册即可被 codemode 脚本调用，不声明）、`deferred`（可被 tool_search 找到激活）、`hidden`（注册但不可达，用于收回）。
- **active set**：声明给模型的工具集合；`pi.setActiveTools()` 动态切换，名字必须已注册。
- **annotations**：MCP 语义的工具提示（readOnly/destructive/idempotent/openWorld），未被验证，供权限类扩展决策。
- **嵌套执行**：`ctx.executeTool()` 经过与模型调用相同的校验与事件，id 由 Pi 派生，不进 transcript；调用方工具自行上报结果与 usage。

## 六、会话词汇

- **SessionManager**：拥有持久化或内存中的条目树与活动叶子。分支改变叶子而不删除废弃分支——废弃分支代表替代历史，重建分支敏感状态用 `getBranch()`，不要重放全部文件条目（运行时事实，见 [SDK 的会话存储节](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/sdk.md#L26-L60)与 [Extensions 的状态节](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/extensions.md#L348)）。
- **session JSONL**：持久化合同，记录消息、prompt/工具声明变化、压缩等事实。账本可检查，但不等于逐字节网络记录或重放保证。
- **内建接续命令**：`--continue`/`--resume` 与 `/resume`/`/new` 选择会话；`/tree` 在会话内移动、`/fork` 从早先消息开出新会话、`/clone` 复制当前分支为新会话；`/import <path>` 导入并续接一个 JSONL 会话文件；`/export`/`/share` 导出 HTML/JSONL 或上传取回查看链接（运行时事实，见 [Sessions 文档](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/sessions.md)与 [Slash Commands 文档](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/slash-commands.md#L38-L39)；完整命令表见卷三 05 页）。
- **steer / followUp**：会话流式中发送消息必须显式选择插入当前 run（steer）或跟随其后（followUp）；不选择会被拒绝而不是猜测。

## 七、模式与 UI

扩展在 interactive、RPC、JSON、print 四种模式加载。interactive 提供完整终端 UI；RPC 可转发对话框与通知但不能转发自定义终端组件；JSON 与 print 无 UI。`ctx.mode === "tui"` 守卫终端专属行为，`ctx.hasUI` 判断交互能力；工具与事件行为应独立于渲染（运行时事实）。RPC 模式下对话框与通知经 extension UI 子协议请求/应答（此时 `ctx.mode === "rpc"`、`ctx.hasUI` 为 true），`custom()` 等终端专属方法不可用（[RPC Extension UI 文档](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/rpc-extension-ui.md#L12-L25)）。

## 八、验证词汇

- **faux provider**：`@earendil-works/pi-ai/compat` 导出的脚本化 provider，为断言事件顺序与状态合同提供确定响应，不碰真实 API、key、网络。
- **真实交互验证**（本语料命名）：启动 Pi、提交真实 prompt、收到真实回复；「仅启动不算通过」的标准来自主仓 release smoke 条款（见卷二 05 页）。
- **干净安装验证**（本语料命名）：在干净 agent dir 安装 package 后复验可观察行为；机制来自 `pi install` 与 settings 的资源过滤。
- **MCP conformance**：pi-mono 对 MCP 客户端按 pinned 官方套件做的回归检查，属于主仓机制。

## 九、本语料自己的词

- **完成度阶梯**：本语料对 Pi 机制归纳的七级交付区分（见[总览](./00-index.md#pi-native-完成度阶梯)），不是 Pi 文档中的术语。
- **资源判别**：按 Pi 文档开头的判别句选择资源类型，是本语料的综合。
- **四类陈述**：运行时事实／主仓要求／扩展仓建议／仓库自定，见根 [README](../README.md)。
- **交付判断**：本语料对「外部结果、影响面、验证结果与未验证项的交付记录」的命名（阶梯第 7 级、变更路径第 7 步）；Pi 文档无此术语，最近的原生锚点是 release skill 的 smoke 通过标准与主仓验证义务。
- **Pi-native**：本语料的组织用词，意为「从 Pi 一手机制归纳」，用于区分语料综合与 Pi 官方定义，不是 Pi 术语。
- **验证分层**：本语料对验证方式按观察对象分工的归纳（[总览](./00-index.md)第 5 步）；Pi 原生的对应物是主仓的四层测试（卷二 05 页）。
- **会话账本**：本语料对 session JSONL「可读、可分支、可续接的工作记录」属性的比喻；Pi 的正式词是 session/session file。
- **程序性合同 / 会话可检视性**：卷三两页的标题视角命名（prompts 作为可版本化的工作合同、会话作为可检视的工作记录），是分析透镜而非 Pi 术语。
