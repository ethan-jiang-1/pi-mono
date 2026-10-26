# 扩展点地图：Pi 的可变性面

Pi 把「可以改什么」集中定义在 `packages/coding-agent/docs/` 下：`extensions.md`、`skills.md`、`prompt-templates.md`、`themes.md`、`mcp.md`、`codemode.md`、`custom-provider.md`、`virtual-models.md`、`packages.md`。本页给出这张地图的全貌与资源类型判别。**除特别标注外均为运行时事实**——它们对所有 Pi 用户与扩展作者同等有效，与 pi-mono 自身的贡献制度无关。

本页引用基线 tag 的文件版本；这些文件在基线之后仍有改动，见文末漂移注记。

## 首要判别：需要什么就用什么

三种主要资源类型的判别写在各自文档首段：

> Use one when a workflow needs tools, commands, event handlers, model providers, session state, or terminal UI rather than instructions alone.
>
> — （扩展：需要可执行行为）

> Use a skill when a workflow needs more context than a prompt template but does not need a new executable integration point. Skills can bundle scripts, references, and assets alongside their instructions.
>
> — （skill：需要指令与配套资产，但不需要新执行点）

> Use one when you want to reuse the same prompt without adding executable behavior or a larger set of supporting instructions.
>
> — （prompt template：固定命令，无执行行为）

简化为一条判别链：需要可执行行为 → 扩展；需要指令 + 资产 → skill；只是固定命令 → prompt template。错配不违反任何检查，但会付出维护与上下文成本。

[E083](../_evidence/render.md#e083)

## 扩展的集成点表

`extensions.md` 的「Choose an integration point」表把扩展的可注册能力列全：

| 能力 | 主 API |
|---|---|
| 观察或修改生命周期行为 | `pi.on()` |
| 添加模型可调用操作（工具） | `pi.registerTool()` |
| 添加 `/` 命令 | `pi.registerCommand()` |
| 添加快捷键或 CLI flag | `pi.registerShortcut()` / `pi.registerFlag()` |
| 发送用户或自定义消息 | `pi.sendUserMessage()` / `pi.sendMessage()` |
| 持久化非上下文会话数据 | `pi.appendEntry()` |
| 切换活动工具、模型、思考级别 | `pi` 上的会话控制方法 |
| 添加模型 provider | `pi.registerProvider()` |
| 添加 MCP server | `pi.registerMcpServer()` |
| 按请求路由到模型 | `pi.registerVirtualModel()` |
| 添加终端渲染 | 渲染器注册与 `ctx.ui` |
| 与其它扩展通信 | `pi.events` |

工具带 exposure 机制（`direct`/`model-only`/`codemode`/`deferred`/`hidden`）与 MCP 语义的 annotations；扩展与 Pi 同进程、同 OS 权限运行，「只加载你信任的来源」是文档的明文前提。

表中未展开的机制面还有：工具 `namespace` 分组、编排工具调整模型可见工具集的 `prepareLoadout()`与跨工具渲染器 `pi.registerToolRenderer()`；快捷键的用户侧配置面是 named actions（如 `app.session.new`），可在用户配置中重绑、`/hotkeys` 查看当前绑定。签名与示例以 extensions.md 为权威，本页不复制。

[E084](../_evidence/render.md#e084)

## 四个专题扩展面

- **MCP**：Pi 以 stdio 或 streamable HTTP 连接 Model Context Protocol server 并把其工具与资源交给模型；扩展也可用 `pi.registerMcpServer()` 注册会话级 server。
- **Codemode**：`codemode` 工具让模型写 JavaScript 脚本调用 Pi 的其它工具与非 LLM 模型，只有脚本输出回到模型；脚本跑在无 Node API 的 QuickJS 沙箱里。
- **自定义 provider**：当模型服务需要自定义认证、模型发现、请求处理或流式处理时用 provider 扩展；服务已说受支持的 API 时改 `models.json` 即可。文档要求「选最小的集成」。
- **虚拟模型**：一个可选模型按请求挑选物理模型，用于按任务、成本或会话状态路由；路由状态可持久化到会话分支。

[E085](../_evidence/render.md#e085)

## Themes 与 packages

Themes 控制 interactive 模式与 HTML 导出的配色，是最轻的可变性面：一个 JSON palette，无行为。packages 是分发单位：

> Pi packages install and distribute extensions, skills, prompt templates, and themes as one unit.
>
> —

package 即普通目录或 npm 包，可从 npm、git 或本地路径安装；宿主向扩展与 skills 提供五个包（见 [07](./07-monorepo-taxonomy.md)）。对扩展作者而言，package 不是第五种能力，而是前四种资源加上主题的**运输容器**。

[E086](../_evidence/render.md#e086)

## 边界：核心不内建权限系统

Pi 的可变性面有意不含的一块是权限系统（运行时事实）：

> Pi does not include a built-in permission system for restricting filesystem, process, network, or credential access. By default, it runs with the permissions of the user and process that launched it.
>
> —

OS 级隔离属于运行环境而非扩展 API。配套的专文有三篇： 把模型生成的命令与代码按不可信对待，并明说 project trust 控制资源加载、但不使内容或其后果变安全； 给出隔离模式——可整体隔离 Pi 进程，或只把选定工具路由进隔离环境（README 的 Permissions & Containerization 节给出三种模式）；仓库根的  定义安全边界口径——本地用户账户与 Pi 进程同信任域，依赖该前提已有写入能力的报告不算漏洞——并要求用户只安装可信扩展、加载可信 skills、只在可信仓库里用 pi。权限**确认**可以由扩展实现——`extensions.md` 给出用 `tool_call` 事件加 annotations 判断哪些调用要人工确认的示例——但那是扩展提供的行为，不是核心内建承诺。

[E087](../_evidence/render.md#e087)

## 漂移注记

本页此前钉 `v1.0.3`，并记录过四个文件相对该 tag 的改动。基线已移到 `v1.4.0`（经 `v1.2.0`）：v1.0.3→v1.2.0 的改动已包含在基线内；v1.2.0→v1.4.0 的改动（`extensions.md` 生命周期章重写、新增 `models-configuration.md` 与 `nvidia-rtx-llama-cpp.md`、`tui.md` +70）见文末漂移注记。本页引用与行号锚点均已按 `v1.4.0` 重算，原先的漂移注记作废。

`v1.0.3` → `v1.2.0` 之间 `packages/coding-agent/docs/` 有 **17 个文件**被修改（`docs.json` 与文件清单未变）。与本页地图直接相关的：

- `extensions.md`（+11/−?）：`before_agent_start` 的返回值改为 union、`reachesTools` 与 `ToolNamespace.aliases`。
- `mcp.md`：`--tools`/`--exclude-tools` 对 `mcp__` 模式与 `--no-mcp` 的说明。
- `codemode.md`（+33）：`read` 工具在 codemode 中解析为图片块；工具集与 `--tools` 增量语义联动。
- `cli.md`（+26）：工具选择一节新增 `mcp__` 模式与 `--no-mcp`，并引入 `+name`/`-name` 增量条目。
- `providers.md`（+47）、`llama-cpp.md`、`models.md`、`settings.md`、`themes.md`、`message-types.md`、`compaction.md`、`terminal-setup.md`、`keybindings.md`、`environment-variables.md`、`json.md`、`tui.md`、`cli-integration.md`：各自的小幅更新。

引用这些文件时以基线 tag 为准（`_evidence/corpus.json`）；工作树 HEAD 在基线之后仍有改动。
