# 13. Token 预算审计

## 用户问题

Pi 的 token 是实时收费的。每加一个配置、一个扩展、一个 skill，都在增加每个会话的 token 消耗。但很少有人真的算过"我的配置花了多少 token"。怎么审计？

## 基准

| 状态 | token 消耗 | 来源 |
|------|-----------|------|
| 裸 pi 启动 | ~5.3k | `_faq_on_digested/07/06_field_usage.md` C3（社区实测） |
| 平均每个 assistant turn | ~2-5k（输出）+ ~10-30k（输入） | 因模型和任务差异巨大 |
| CC 产品逻辑 | ~20k（第一句话前已注入） | 同上来源的对比 |

**5.3k 是你们的预算基准**——每个新配置都要在这个基准上叠加。

## 每类配置的 token 成本

### AGENTS.md

```
计算：~8 token / 行（英文），~12 token / 行（中文）

30 行 AGENTS.md ≈ 300-360 token
```

### Prompt template

```
只在 /命令 调用时注入，不每次都付。

每次调用 ≈ 50-200 token（取决于 prompt 长度）
```

### Skill

```
只在 agent 主动 read 时才加载。

每个 skill 在 <available_skills> 目录里的描述 ≈ 30-50 token（name + description）
如果 settings 的 skills 数组引用 37 个技能，目录描述 ≈ 1100-1850 token
但真正的 skill 正文（2000 token）只在 agent 决定 read 时才加载
```

### Extension

```
token 成本取决于它挂载的事件和在事件中注入的内容：

- before_agent_start 注入 200 token 的指令 → 每次 agent 启动 +200 token
- tool_call 不注入任何内容 → 0 token
- agent_end 不注入任何内容 → 0 token
- UI widget／notify 不注入 prompt → 0 token

总则：事件本身不消耗 token，只有你在事件 handler 中注入到 prompt 的内容才消耗。
```

### settings.json 的工具白名单

```
从 4 个默认工具扩展到 7 个（+grep/find/ls） → ~50 token（工具描述增加）
tools 白名单本身不消耗额外 token，只是 agent 的工具选择面增大。
```

## 审计方法

### 方法 1：观察 `/compact` 后的 token 量

```bash
/compact  # 压缩后查看剩余 token 数
```

压缩后的 token 量 ≈ 你的配置层的最小子集（裸 5.3k + AGENTS.md + skill 目录）。

### 方法 2：逐个排除比较

1. 裸 pi 启动 → 记下感觉（响应速度、token 用量）
2. 加 AGENTS.md → 感觉变化
3. 加一个 extension → 感觉变化
4. 加 settings `skills` 数组 → 感觉变化

每个步骤你都能感受到"这次对话启动了多久"的变化。

### 方法 3：装 tps 扩展（监控每个 agent turn 的 token 用量）

```typescript
pi.on("agent_end", (event, ctx) => {
    const tokens = extractTokens(event.messages);
    ctx.ui.notify(`out ${tokens.output.toLocaleString()} tok`, "info");
});
```

没有任何配置能替代**你自己观察到的 token 消耗变化**。

## 常见陷阱

| 陷阱 | 症状 | 修复 |
|------|------|------|
| 装了 10 个 skill 但只用 3 个 | 启动变慢 | `skills` 数组只引用你用的目录，或定向加载 |
| 全局 AGENTS.md 写了 100 行 | 每个会话都付 100 行的 token | 剪到 30 行 |
| extension 在 `before_agent_start` 里注入了 500 token | agent 第一个回复变慢 | 移到 `tool_call`（不注入）或做按需 |
| `skills` 数组引了整个 `~/.claude/skills`（37 个） | 目录描述 1100+ token | 把常用的几个拷贝到 `.pi/skills/`，不用引用全目录 |
| 装了重 pack（bigpowers，73-81 个 skill） | 目录描述 2000+ token | cherry-pick 你需要的 skill 文件，别全装 |

## 锚点

- `_faq_on_digested/07/06_field_usage.md` C3（5.3k 裸基准、20k hello-world）
- pi-mono `.pi/extensions/tps.ts`（token 监控 extension）
- `_faq_on_digested/07/05_package_ecosystem.md`（头部包的下载量参考，但不是 token 量参考）

## 最小例证

**例证 1（5.3k → 20k）**：裸 pi 启动 → 约 5.3k。加 `"skills": ["~/.claude/skills"]`（37 个技能）→ 启动后 system prompt 多了 ~1100 token 的 skill 目录描述。再加 5 个 AGENTS.md 规则 → +50 token。再加一个 `before_agent_start` 扩展注入 500 token → +500 token。总计 ~7k。如果装的不是纯描述 skill 而是 bigpowers（73-81 skill）→ ~2000+ token。**5.3k 到 7k 是合理的；5.3k 到 20k 是过度配置。**

**例证 2（审计你自己的 token）**：`/compact` 后看 token 量 → token 量就是你配置层的"不可压缩基线"。如果 > 10k，检查 settings.json 的 `skills` 数组和 AGENTS.md 长度。