# 8. `settings.json` 配置全解

## 用户问题

`settings.json` 是 pi 启动时读取的中心配置文件。但它的可配置项散落在多个 docs 文件里，没有一个地方把它们全部列出来。哪些必须配、哪些可选配、哪些配错了会有问题？

## 位置

- 全局：`~/.pi/agent/settings.json`
- 项目层：**有**项目级 `.pi/settings.json`（`docs/configuration.md:30` 列为 Project-level settings；项目值覆盖 agent-dir 值，`docs/settings.md:2`）

**设置项分两层**：agent-dir（`<agent-dir>/settings.json`）与项目层（`.pi/settings.json`）。项目值**覆盖** agent-dir 值，资源列表则**合并**（`docs/settings.md:2`）。少数键被限定只能写在 agent-dir（如 `defaultProjectTrust`，`settings.md:36`）。

## 编辑器补全：`$schema` 与发布的 JSON Schema（v1.2.0 新增）

v1.2.0 起 pi **发布**了四份配置 JSON Schema，放在 `https://pi.dev/schemas/` 下，供编辑器做校验与补全：

| Schema URL | 对应文件 |
|---|---|
| `https://pi.dev/schemas/settings.schema.json` | `settings.json` |
| `https://pi.dev/schemas/models.schema.json` | `models.json` |
| `https://pi.dev/schemas/keybindings.schema.json` | keybindings 配置 |
| `https://pi.dev/schemas/theme.schema.json` | theme 配置 |

用法：在配置文件顶层加一行 `$schema`（`docs/settings.md:5` 的官方原文：*"Add `"$schema": "https://pi.dev/schemas/settings.schema.json"` to `settings.json` for editor validation and completion."*）：

```json
{
  "$schema": "https://pi.dev/schemas/settings.schema.json",
  "defaultThinkingLevel": "high"
}
```

**硬事实**：

- 四份 schema 是**从 TypeScript 源码生成**的，不是手写：schema 文件头部自带 `"$comment": "This file is generated from TypeScript source. Do not edit it manually; run npm run generate:schemas."`（`packages/coding-agent/schemas/settings.schema.json:4`）。
- 生成器在 `packages/coding-agent/scripts/generate-schemas.ts`，入口 `npm run generate:schemas`（`packages/coding-agent/package.json:39`，注意该脚本经 `src/experimental/source-resolver.ts` 加载——这是 `src/experimental/` 在 v1.2.0 **唯一存活**的文件）。
- schema 采用 JSON Schema draft 2020-12（`$schema: "https://json-schema.org/draft/2020-12/schema"`），`$id` 即上表的发布 URL。
- 四份文件的仓库位置：`packages/coding-agent/schemas/{settings,models,keybindings,theme}.schema.json`。
- 源码侧的对应实现：`src/core/settings-schema.ts`（键与类型的单一事实源）、`src/core/settings-defaults.ts`（默认值）、`src/core/keybindings-schema.ts`、`src/core/key-id-schema.ts`、`src/modes/interactive/theme/theme-schema.ts` + `theme-tokens.ts`。

**为什么重要**：schema 同时是**键名的权威清单**。本页下文若与 `settings.schema.json` 的键冲突，以 schema 为准——它是生成的，而本页是人写的。

## 配置项清单

### 核心运行配置

```json
{
  "defaultProvider": "deepseek",
  "defaultModel": "deepseek-v4-flash",
  "defaultThinkingLevel": "high",
  "defaultTools": ["read", "bash", "edit", "write", "grep", "find", "ls"]
}
```

| 键 | 类型 | 作用 | 默认值 | 备注 |
|---|------|------|--------|------|
| `defaultProvider` | string | 默认 LLM 提供商 | 无（首次启动选） | 可用 `Ctrl+P` 运行时切换 |
| `defaultModel` | string | 默认模型 ID | 无 | 可以是自定义模型名 |
| `thinking` | string | 思考模式 | `"normal"` | `"off"`/`"normal"`/`"high"`/`"xhigh"`/`"max"` |
| `defaultTools` | string[] | 启动时启用的内置工具 | `["read","bash","edit","write"]`（v1.2.0 为 `DEFAULT_TOOL_NAMES`，`settings-manager.ts:85`（v1.4.0）；v1.0.3 时在 `:215`） | settings.json 的实际键名是 **`defaultTools`**（旧文写的 `tools` 不是有效键；CLI flag 才是 `--tools`）。v1.0.0 起支持 **`+name`/`-name` 增量项**：只含增量项的列表在继承/默认集上增删，含普通工具名的列表整体替换。**注意**：这些具名函数在 v1.0.3 基线**就已存在**（当时为 `isToolModifier` `:217`、`mergeDefaultTools` `:225`、`resolveDefaultTools` `:236`），v1.2.0 的新变化只是把 `isToolModifier`/`applyToolModifiers` **导出**、并抽出 `applyToolModifiers`——**不是**新增五个符号。**v1.2.0 真正新增的是 CLI 侧行为**：`--tools` 也开始接受 `+name`/`-name`（`ddaa0a034`，`docs/settings.md:56`），此前基线文档明确写着 "`--tools` does not accept `+name` or `-name`"（v1.0.3 时字段 `:168`、合并 `:225-234`、解析 `:236-250`；v1.2.0 的**行号**为 `DEFAULT_TOOL_NAMES` `:85`、`isToolModifier` `:88`、`applyToolModifiers` `:110`、`mergeDefaultTools` `:126`、`resolveDefaultTools` `:137`（v1.4.0））；`/reload` 会启用新加入的工具（0.99.2），`--tools`/`--no-tools` 仍可覆盖。v1.0.3+ 口径同步：CLI `--tools`/`--exclude-tools` 现支持 `*` pattern，且 `--tools` 不再移除 MCP 工具（除非条目以 `mcp__` 开头） |

### 技能与扩展配置

```json
{
  "skills": ["~/.claude/skills", "~/.codex/skills"],
  "promptTemplates": ["/extra/prompts"],
  "extensions": ["/extra/extensions"]
}
```

| 键 | 类型 | 作用 | 默认值 | 备注 |
|---|------|------|--------|------|
| `skills` | string[] | 额外技能搜索路径 | `[]` | 可引用其他 harness 的技能目录 |
| `promptTemplates` | string[] | 额外 prompt 搜索路径 | `[]` | 极少用（全局 prompts/ 和项目 prompts/ 已经覆盖） |
| `extensions` | string[] | 额外扩展搜索路径 | `[]` | 极少用 |

### UI 配置

```json
{
  "theme": "system",
  "tuiMode": "fullscreen",
  "quietStartup": false,
  "fullscreenWheelScrollLines": "auto"
}
```

| 键 | 类型 | 作用 | 默认值 | 备注 |
|---|------|------|--------|------|
| `theme` | string | TUI 主题 | **`"system"`**（v1.0.0 翻转：从终端 OSC 10/11/4 取色推导，`theme-controller.ts:174-177`、`system-theme.ts:35`） | 设具体主题名则覆盖 |
| `mode` | string | 默认运行模式 | `"interactive"` | 可选 `"print"`（`-p`）、`"json"`、`"rpc"` |
| `tuiMode` | string | TUI 形态 | **`"fullscreen"`**（v1.0.0 翻转，原默认 regular；`settings-manager.ts:184` 注释、`:1348-1350` `getTuiMode()` 未设置即 fullscreen） | 逃生舱：`"regular"` 或 `--tui-mode regular`（`args.ts:326`）恢复普通滚动回终端 |
| `quietStartup` | boolean \| `"header"` | 安静启动 | `false` | v1.0.0 新增 `"header"` 档（类型 `settings-manager.ts:112`，字段 `:150`，getter `:1089-1092`）：保留 header（logo/版本/按键提示），仅隐藏模型 scope 行与已加载资源列表（`interactive-mode.ts:1394-1402`）；`true` 仍全部隐藏；`--verbose` 始终显示 |
| `fullscreenWheelScrollLines` | number \| `"auto"` | fullscreen 模式滚轮每次滚动的行数（1-100） | `"auto"`（v1.0.0 新增；按 burst/gesture 加速，上限 6 行/事件；darwin 本地终端视为已被系统加速、不再叠加） | 字段 `settings-manager.ts:188`、getter `:1389-1396`；**仅 fullscreen 模式有效**——fullscreen 系设置（`fullscreenExitOutput`/`fullscreenScrollbar`/`fullscreenCopyOnSelect`/本键）在 regular 模式下无效果（`:185-188`） |

### Provider 与认证（间接）

Provider 认证不在 `settings.json` 里——它在以下位置：

| 凭证类型 | 位置 |
|----------|------|
| 环境变量 | `ANTHROPIC_API_KEY`、`OPENAI_API_KEY`、`DEEPSEEK_API_KEY` 等 |
| `auth.json` | `~/.pi/agent/auth.json`（login 命令写入） |
| 自定义模型 | `~/.pi/agent/models.json`、`models-store.json` |

`settings.json` 只负责选默认 provider 和 model，不负责存凭证。

### 高级配置

```json
{
  "maxTurns": 100,
  "compactAtTokens": 32000,
  "telemetry": false
}
```

| 键 | 类型 | 作用 | 默认值 | 备注 |
|---|------|------|--------|------|
| `maxTurns` | number | 会话最大 turn 数 | 无限制 | 达到后自动停止 |
| `compactAtTokens` | number | 触发自动压缩的 token 阈值 | 内置默认 | 也在运行时 `/compact` 手动触发的范围 |
| `telemetry` | boolean | 是否发送遥测 | `false` | |

### 成本控制配置（v0.86.0 新增）

```json
{
  "cacheWarming": "streaming",
  "compaction": {
    "reserveTokens": 16384,
    "keepRecentTokens": 20000,
    "modelOverrides": {
      "anthropic/claude-opus-4": { "reserveTokens": 32768, "keepRecentTokens": 40000 }
    }
  }
}
```

| 键 | 类型 | 作用 | 默认值 | 备注 |
|---|------|------|--------|------|
| `cacheWarming` | string | prompt cache 预热模式 | `"streaming"` | `"off"`/`"streaming"`/`"idle"`（`settings-manager.ts:82`、`:182`，v1.0.0 行号）。**global-only**——每次刷新是一次真实付费请求，不提供项目级覆盖 |
| `compaction.reserveTokens` | number | **只决定自动压缩何时开始**（v1.4.0 起不再限制摘要输出；摘要改用模型输出上限） | `16384` | `docs/compaction.md:35`；`generateSummary` 的参数已改名 `_reserveTokens` 并注明 Unused（`core/compaction/compaction.ts:648`） |
| `compaction.keepRecentTokens` | number | 压缩保留最近消息 token | `20000` | |
| `compaction.modelOverrides` | Record | 按 `"provider/modelId"` 键覆盖上面两项 | `{}` | `settings-manager.ts:32` 声明、`:940` 读取（按当前 modelKey 查 override，未命中回落全局默认，v1.0.0 行号）；不同模型上下文窗口差异大时按模型调预算 |
| `compat.allowedFallbackModels` | — | Bedrock/Anthropic 兼容层：声明允许的 fallback 模型 | 无 | **`packages/ai/src/providers/compat-schema.ts:485`**（v1.2.0 迁出；v1.0.3 时为 `ai/src/types.ts:839`）（#9294）；为空/缺省时调用方必须省略 `fallbacks` 字段（Anthropic 对无许可 fallback 目标的模型拒绝该字段） |


### 会话与分享（v1.3.0 新增）

| 键 | 类型 | 含义 | 默认 | 说明 |
|---|---|---|---|---|
| `sessionShareDestination` | `"auto" \| "gist" \| "radius"` | `/share` 上传到哪 | `"auto"` | `auto`：有 Radius 认证走 Radius，否则私有 gist；`radius`：不回退，未登录要求先 `/login radius`；`gist`：跳过 Radius。schema `core/settings-schema.ts:224-230`、分派 `modes/interactive/session-share.ts:69-77`。**setter 只写 global 层** |

cache warming 的成本模型（何时值得刷）见 [13_token_budget_audit.md](./13_token_budget_audit.md)。

## 常见错误

**错误 1：`skills` 数组写成了字符串（不是数组）**

```json
// 错误
{ "skills": "~/.claude/skills" }

// 正确
{ "skills": ["~/.claude/skills"] }
```

**错误 2：项目 `.pi/settings.json`**

pi **读**项目层的 `.pi/settings.json`，且项目值覆盖 agent-dir 值（`docs/configuration.md:30`、`docs/settings.md:2`）。若某配置需要按项目区分，直接写项目层即可，不必靠 CLI 覆盖。

**错误 3：在 settings 里配凭证**

```json
// 错误
{ "apiKey": "sk-xxx" }
// API key 在 settings.json 里不会被读到
```

**错误 4：配了 `defaultModel` 但没配 `defaultProvider`**

如果 `defaultProvider` 不存在，`defaultModel` 不会被正确解析。应该同时配：

```json
{
  "defaultProvider": "deepseek",
  "defaultModel": "deepseek-v4-flash"
}
```

## 推荐配置（最少推荐）

```json
{
  "defaultProvider": "deepseek",
  "defaultModel": "deepseek-v4-flash",
  "defaultThinkingLevel": "high",
  "defaultTools": ["read", "bash", "edit", "write", "grep", "find", "ls"],
  "skills": ["~/.claude/skills"]
}
```

这配了四样：模型 + 思考模式 + 工具集 + 技能复用。每一项都可以通过 CLI 层覆盖。

## 锚点

- 本机审计的 settings：`~/.pi/agent/settings.json`（只有 `defaultProvider` / `defaultModel` / `defaultThinkingLevel` / 主题（`thinking` 不是有效键））
- `packages/coding-agent/docs/usage.md`（settings 的 CLI 参数对照表）
- `packages/coding-agent/docs/skills.md`（"Using Skills from Other Harnesses" 的官方做法——`skills` 数组）
- `packages/coding-agent/src/core/settings-manager.ts`：`CACHE_WARMING_MODES`（**v1.4.0：L54**；v1.0.0 时为 L82）、`cacheWarming` 读取（**L929**）、`CompactionSettings.modelOverrides`（schema **L22**）、override 读取按名检索。文件 1533→1428→**1443** 行（v1.4.0）
- v1.0.0 键锚点（均已对照当前工作树核实）：`QuietStartup` 类型（**v1.2.0：于 `settings-schema.ts:465` 定义**，`:20`/`:42` 处 import）、`quietStartup` getter（**`settings-manager.ts:996-998`**）、`getQuietStartup()`（**`:996`**）、`tuiMode` getter（**`:1256-1257`**）、`getTuiMode()`（**`:1256`**）、`fullscreenWheelScrollLines`（**`:1299`**）（v1.4.0）、`getFullscreenWheelScrollLines()`（`:1389-1396`）、`defaultTools` 字段（`:168`）与 `+name/-name` 合并/解析（`:225-250`）、`DEFAULT_TOOL_NAMES`（`:215`）；`--tui-mode` 帮助文本（`cli/args.ts:326`）
- **`packages/ai/src/providers/compat-schema.ts`：`allowedFallbackModels`（L485）**——v1.2.0 已不在 `ai/src/types.ts`（该文件 1172→893 行，类型外迁）
- `packages/coding-agent/src/core/cache-warmer.ts`：成本模型常量与刷新时机（L20、L26、L29）
- 官方 docs：`packages/coding-agent/docs/settings.md`（`#cache-warming` 小节）

## 最小例证

**例证 1（skills 数组的效果）**：在 `settings.json` 加 `"skills": ["~/.claude/skills"]` → 不需要拷贝文件，37 个技能直接出现在 pi 的 `/skill:` 补全中。

**例证 2（defaultTools 白名单的效果）**：设置 `"defaultTools": ["read", "grep", "find", "ls"]` 但不要 `bash` → agent 只能读文件和搜索，不能执行命令。配合 `--tools` CLI 可临时恢复；v1.0.0 起也可以用增量写法 `"defaultTools": ["+codemode"]` 在默认 4 个之上追加而不整列替换。