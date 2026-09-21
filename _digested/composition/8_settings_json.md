# 8. `settings.json` 配置全解

## 用户问题

`settings.json` 是 pi 启动时读取的中心配置文件。但它的可配置项散落在多个 docs 文件里，没有一个地方把它们全部列出来。哪些必须配、哪些可选配、哪些配错了会有问题？

## 位置

- 全局：`~/.pi/agent/settings.json`
- 项目层：无项目级 `settings.json`（项目层只有 prompts/skills/extensions 目录）

**设置项只在全局层配置**，所有项目共享同一份。

## 配置项清单

### 核心运行配置

```json
{
  "defaultProvider": "deepseek",
  "defaultModel": "deepseek-v4-flash",
  "thinking": "high",
  "tools": ["read", "bash", "edit", "write", "grep", "find", "ls"]
}
```

| 键 | 类型 | 作用 | 默认值 | 备注 |
|---|------|------|--------|------|
| `defaultProvider` | string | 默认 LLM 提供商 | 无（首次启动选） | 可用 `Ctrl+P` 运行时切换 |
| `defaultModel` | string | 默认模型 ID | 无 | 可以是自定义模型名 |
| `thinking` | string | 思考模式 | `"normal"` | `"off"`/`"normal"`/`"high"`/`"xhigh"`/`"max"` |
| `tools` | string[] | 默认工具白名单 | 4 个（read/bash/edit/write） | `--tools` CLI 可重写 |

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
  "theme": "catppuccin-mocha",
  "mode": "interactive"
}
```

| 键 | 类型 | 作用 | 默认值 | 备注 |
|---|------|------|--------|------|
| `theme` | string | TUI 主题 | 内置默认 | 可用主题列表见 `packages/tui/` |
| `mode` | string | 默认运行模式 | `"interactive"` | 可选 `"print"`（`-p`）、`"json"`、`"rpc"` |

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
| `cacheWarming` | string | prompt cache 预热模式 | `"streaming"` | `"off"`/`"streaming"`/`"idle"`（`settings-manager.ts:77`、`:157`）。**global-only**——每次刷新是一次真实付费请求，不提供项目级覆盖 |
| `compaction.reserveTokens` | number | 压缩预留 token | `16384` | |
| `compaction.keepRecentTokens` | number | 压缩保留最近消息 token | `20000` | |
| `compaction.modelOverrides` | Record | 按 `"provider/modelId"` 键覆盖上面两项 | `{}` | `settings-manager.ts:27` 声明、`:872` 读取（按当前 modelKey 查 override，未命中回落全局默认）；不同模型上下文窗口差异大时按模型调预算 |
| `compat.allowedFallbackModels` | — | Bedrock/Anthropic 兼容层：声明允许的 fallback 模型 | 无 | `packages/ai/src/types.ts:839`（#9294）；为空/缺省时调用方必须省略 `fallbacks` 字段（Anthropic 对无许可 fallback 目标的模型拒绝该字段） |

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

pi 不读项目层的 `settings.json`。所有设置项都在全局 `~/.pi/agent/settings.json`。如果你需要某个配置不同项目用不同的值，目前只能靠 CLI 层覆盖——这是 pi 配置系统的一个已知缺口。

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
  "thinking": "high",
  "tools": ["read", "bash", "edit", "write", "grep", "find", "ls"],
  "skills": ["~/.claude/skills"]
}
```

这配了四样：模型 + 思考模式 + 工具集 + 技能复用。每一项都可以通过 CLI 层覆盖。

## 锚点

- 本机审计的 settings：`~/.pi/agent/settings.json`（只有 `defaultProvider` / `defaultModel` / `thinking` / 主题）
- `packages/coding-agent/docs/usage.md`（settings 的 CLI 参数对照表）
- `packages/coding-agent/docs/skills.md`（"Using Skills from Other Harnesses" 的官方做法——`skills` 数组）
- `packages/coding-agent/src/core/settings-manager.ts`：`CACHE_WARMING_MODES`（L77）、`cacheWarming`（L157）、`CompactionSettings.modelOverrides`（L27）、override 读取（L872）
- `packages/ai/src/types.ts`：`allowedFallbackModels`（L839）
- `packages/coding-agent/src/core/cache-warmer.ts`：成本模型常量与刷新时机（L20、L26、L29）
- 官方 docs：`packages/coding-agent/docs/settings.md`（`#cache-warming` 小节）

## 最小例证

**例证 1（skills 数组的效果）**：在 `settings.json` 加 `"skills": ["~/.claude/skills"]` → 不需要拷贝文件，37 个技能直接出现在 pi 的 `/skill:` 补全中。

**例证 2（tools 白名单的效果）**：设置 `"tools": ["read", "grep", "find", "ls"]` 但不要 `bash` → agent 只能读文件和搜索，不能执行命令。配合 `--tools` CLI 可临时恢复。