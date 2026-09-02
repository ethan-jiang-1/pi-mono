# 附录 B：包生态的选定方法

## 用户问题

Pi.dev/packages 上有 5600+ 包。怎么选？哪个真的有用？哪个包装了但一年也用不上？

## 选包的判据（按优先级）

### 1. 明确需求 > 看到别人推

**规则**：不要因为"大家都在装"就装。装一个包的前提是**你已经在裸 pi 上受够了这个痛**。

"受够了"的三种信号：

| 信号 | 对应的包 | 下载量（2026-09） |
|------|---------|-----------------|
| "想要在终端里搜网页" | pi-web-access | 401.1K/月 |
| "Agent 没有第二意见，不能自查" | pi-subagents | 362.5K/月 |
| "Compaction 后 TODO 状态全丢" | @juicesharp/rpiv-todo | 98.9K/月 |
| "Agent 盲写代码没有编辑器反馈" | pi-lens | 60.1K/月 |

**如果你还没有这个痛，别装。**

### 2. Token 价 > 功能特点

裸 pi ~5.3k token。包注入到 prompt 的内容越多，每次会话的成本越高。

估算方法：

```
包 = extension（事件注入量）+ skill（目录描述 token）+ prompt templates（按需注入）

- before_agent_start 注入 > 500 token → 每个会话都付这个钱
- 不挂钩子 / 挂 tool_call（不注入内容）→ token 成本接近零
- skills 在目录描述里 ~30-50 token / skill
```

**检查一个包 token 成本的方法**：读 README → 它注册了什么事件？挂到了 `before_agent_start`？注入了多少 token？

### 3. 樱桃摘取 > 全量安装

如果一个包有 20 个文件/能力，你只需要其中 2 个：

```bash
# 装
pi install npm:some-heavy-package

# 然后 cherry-pick
cp .pi/extensions/heavy-package/useful-one.ts ~/.pi/agent/extensions/
cp .pi/skills/heavy-package/useful-skill.md ~/.pi/agent/skills/

# 然后 pin 你需要的版本，或者从原始包解耦
```

`pi-kit`（`_faq_on_digested/07/06_field_usage.md` C8）的做法：`settings.json` 里按包 cherry-pick 资源，extensions/skills/themes 可 `[]` 全关或 `!pattern` 排除。

### 4. 活跃度 > 下载量

一个包的月下载量大不等于它还在维护。选包时检查：

- GitHub 最近的 commit 时间
- 最近 release 时间
- README 有没有写清楚 v0.84.x 兼容性
- 有没有 CHANGELOG 或 release notes

### 5. 信任 > 功能

第三方包 = 执行第三方代码。打包的人可以去写任何文件、读任何密钥、发任何请求。

| 安全级别 | 做法 |
|---------|------|
| 最低 | 只看 README 就安装 |
| 中等 | 读主要文件结构 + 检查 hooks |
| 较高 | 读完整源码（至少 ~200 行的事件注册逻辑） |
| 最高 | 自己写（50-200 行，完全可控） |

**官方"认证插件"机制在准备中**（`_faq_on_digested/07/06_field_usage.md` C10 Armin 回应）。

## 常见的选包陷阱

| 陷阱 | 症状 | 修复 |
|------|------|------|
| 按下载量排序 | 下载量高的包不一定适合你 | 从实际痛点出发 |
| 一口气装 10 个 | "pi 太慢了"——不是 pi 慢，是 10 个包 20k token | 层 3 决策：痛了再加 |
| 看了别人 dotfiles 全抄 | 别人的工作流和你不一样 | 摸清楚每个文件干什么再 cherry-pick |
| 不审计 token 价就装 | 裸 pi 5.3k → 装了 5 个包 15k | 装前读事件注入量 |

## 推荐的"装包前 checklist"

1. 我的哪个痛点需要这个包解决？
2. 能否让 pi 自己写（自扩展优先）？如果不能，
3. 这个包注入多少 token 到每个会话的 system prompt？
4. 我能不能只 cherry-pick 它的某个能力？
5. 它的上游活跃吗？v0.84.x 兼容吗？
6. 我信任它的源码吗？还是我自己写更安心？

## 锚点

- `_faq_on_digested/07/05_package_ecosystem.md`（头部 18 包的逐个核查，两个成套组合推荐）
- `_faq_on_digested/07/06_field_usage.md` C8（pi-kit cherry-pick 做法）
- `_faq_on_digested/07/06_field_usage.md` C10（供应链警惕）

## 最小例证

**例证 1（正确的装包时机）**：第 5 次问 pi "帮我搜一下这个 API 的文档"但 pi 没有 web 工具 → 装 `pi-web-access`。不是第一面就装。

**例证 2（cherry-pick）**：装了 bigpowers（73-81 skill），但只需要它的 `review` skill → 把 `review.md` 拷贝到 `.pi/skills/`，然后 `pi config bigpowers.skills off` 或 `!review` 排除。不把 73 个 skill 全扔进 `<available_skills>` 目录。