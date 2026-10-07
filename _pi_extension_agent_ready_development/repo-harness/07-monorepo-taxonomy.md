# Monorepo 分类：`packages/` 的角色表

`v1.0.3` 的 `packages/` 下有 13 个包。根 `README.md` 的包表列出其中 7 个（[README.md L76-L84](https://github.com/earendil-works/pi/blob/v1.0.3/README.md#L76-L84)），其余 6 个（client、protocol、server、codemode、mcp、evals）存在于仓库但不进该表。全部包在 `v1.0.3` 共享同一版本号 `1.0.3`（lockstep，见 [03](./03-repo-skills.md)）。本页角色描述依据根 README 包表与各包 README 首部；对扩展作者的意义在文末。

## 七个 README 表列包

| 包 | 角色 | 依据 |
|---|---|---|
| `@earendil-works/chord` | 独立的应用组装运行时：服务、复制状态、RPC 与插件。**非 Pi 包**——不依赖任何其它 Pi workspace 包，可被无关应用使用 | [README 包表](https://github.com/earendil-works/pi/blob/v1.0.3/README.md#L78)、[chord README](https://github.com/earendil-works/pi/blob/v1.0.3/packages/chord/README.md#L3-L7) |
| `@earendil-works/pi-telemetry` | 厂商中立的 telemetry 合同：回调式 `TelemetryContext`/`TelemetrySpan`、参考适配器、类型化 schema | [README 包表](https://github.com/earendil-works/pi/blob/v1.0.3/README.md#L79) |
| `@earendil-works/pi-ai` | 统一多 provider LLM API（OpenAI、Anthropic、Google 等），带认证解析、token/成本追踪与会话内移交 | [README 包表](https://github.com/earendil-works/pi/blob/v1.0.3/README.md#L80) |
| `@earendil-works/pi-durable` | 持久会话、任务与文档运行时；实验性，版本间可不通知地变 API。进程中途死亡后重开存储即可续接 | [README 包表](https://github.com/earendil-works/pi/blob/v1.0.3/README.md#L81)、[durable README](https://github.com/earendil-works/pi/blob/v1.0.3/packages/durable/README.md#L3-L5) |
| `@earendil-works/pi-agent-core` | 带 tool 执行与事件流的有状态 agent 运行时，构建于 pi-ai 之上 | [README 包表](https://github.com/earendil-works/pi/blob/v1.0.3/README.md#L82) |
| `@earendil-works/pi-coding-agent` | 交互式 coding agent CLI——用户实际安装的 Pi 本体；本卷引用的 `docs/`、扩展运行时与 skills/prompts 机制都在此包 | [README 包表](https://github.com/earendil-works/pi/blob/v1.0.3/README.md#L83) |
| `@earendil-works/pi-tui` | 极简终端 UI 库：差分渲染与同步输出，无闪烁交互 CLI | [README 包表](https://github.com/earendil-works/pi/blob/v1.0.3/README.md#L84) |

依赖方向自下而上堆叠：ai 是 provider 抽象层；agent-core 在其上加 agent 循环；coding-agent 组装 CLI 与扩展运行时；tui 被 coding-agent 用于交互模式；chord 与 telemetry 是相对独立的底座（durable 构建于 chord 与 pi-ai 之上）。

## 六个不在 README 表里的包

依据各包 README 首部：

| 包 | 角色 | 状态 |
|---|---|---|
| `@earendil-works/pi-codemode` | 在 QuickJS（编译为 WebAssembly）里运行模型写的 JavaScript，唯一能力是调用注入的工具；coding-agent 内建 `codemode` 工具用它实现。无 Pi 依赖，可独立使用 | 发布包 |
| `@earendil-works/pi-mcp` | 小而独立的 MCP 客户端：传输中立核心、stdio 与 Streamable HTTP 传输、内存测试传输；不依赖官方 MCP SDK 或其它 pi 包 | 发布包 |
| `@earendil-works/pi-protocol` | 实验性 Pi 服务协议：运行时中立的路由信封、CBOR 编码与字节流分帧 | 发布包（实验性） |
| `@earendil-works/pi-client` | 该实验协议的传输中立客户端 | 发布包（实验性） |
| `@earendil-works/pi-server` | 实验性本地 server：把客户端路由到应用托管的持久 Session | 发布包（实验性） |
| `@earendil-works/pi-evals` | **私有评估包**（`package.json` 标 `"private": true`）：基于 `vitest-evals` 的行为评估，含文档提升（documentation-lift）对比实验——`without_docs` 与 `with_docs` 两种 Docker 镜像成对运行并报告通过率差 | 不发布 |

evals 包值得单独一提：它把「文档有没有用」变成可测量的对象——去掉 coding-agent 的 README/CHANGELOG/docs/examples 后 agent 任务通过率掉多少。这是 pi-mono 对「文档是给 agent 读的」这一命题的投资（主仓自定实践；本卷不评估其结论）。

## 发布面与私有面

`v1.0.3` 时点：13 个包中 12 个是公开 npm 发布包，唯一私有的是 evals。protocol/client/server 三件套自我标注为 experimental（API 变化不另行通知），它们与 durable 一起构成「实验面」，与稳定的核心栈（ai/agent-core/coding-agent/tui）区分开。

分层看，13 个包分四类角色：

| 类别 | 包 | 与 Pi 本体的关系 |
|---|---|---|
| 独立底座 | chord、telemetry、codemode、mcp、protocol、client、server | 不依赖 Pi 核心栈（或仅作实验集成），可独立使用 |
| 核心栈 | ai、agent-core、coding-agent、tui | Pi 运行时主体，逐层堆叠 |
| 实验运行时 | durable | 构建于 chord + ai 之上的持久化 agent harness |
| 内部质量 | evals | 私有，测量文档与行为，不发布 |

「README 包表只列七个」本身是个信号：表的口径是「Pi CLI 及其支撑库」，实验协议三件套与 codemode/mcp 虽是发布包，但被排除在主叙述之外；扩展作者从 README 得到的依赖面印象需要用 `packages.md` 的宿主提供清单校正。

## 核对方法

各包角色与发布状态可按下述方式对 `v1.0.3` 复核：

```sh
git show v1.0.3:README.md            # 包表
git show v1.0.3:packages/<pkg>/README.md
git show v1.0.3:packages/<pkg>/package.json | grep -E '"(name|version|private)"'
```

`v1.0.3` 时点全部包版本号为 `1.0.3`、除 evals 外无 `"private": true`；包集合此后可能增删，引用时以 tag 为准。

## 对扩展作者的意义

- **依赖面**：扩展能 import 的稳定面主要是 `pi-coding-agent` 的 `ExtensionAPI` 与 `pi-ai` 的类型（provider 扩展）；durable/protocol/server 属实验面，扩展仓若依赖它们要自担 API 漂移风险（扩展仓建议）。
- **宿主提供包清单**：Pi 向扩展与 skills 提供五个包，扩展作者须把它们声明为 `peerDependencies` 且不打包（运行时事实，[packages.md L80-L88](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/docs/packages.md#L80-L88)）：`@earendil-works/pi-ai`、`@earendil-works/pi-agent-core`、`@earendil-works/pi-coding-agent`、`@earendil-works/pi-tui`、`typebox`。注意宿主提供清单与 README 包表不是一回事：chord、telemetry、durable 不在宿主提供清单里，扩展要用需自带。
- **lockstep 的含义**：所有公开包同版本同时升级，扩展作者面对的宿主版本面因此是单一坐标（`pi-coding-agent` 的版本即全部提供包的版本），不必各自追踪五个包的兼容矩阵（运行时事实带来的简化）。
