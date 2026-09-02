# 11d. 层 3：运行时能力——extensions / packages

## 什么时候加

**加**：你有需要运行时能力的场景——事件钩子、UI 操作、工具拦截、跨会话持久化。
**不加**：层 1（AGENTS.md）+ 层 2（prompt template）已经够用。

## 三选一的决策

| 选项 | 什么时候选 | 成本 |
|------|----------|------|
| 让 pi 自己写扩展/skill | 你描述一次需求后 | 对话时间（几乎为零） |
| 装第三方包 | 你已经有明确需求 + 社区有成熟实现 | token 成本 + 包信任（执行第三方代码） |
| 自己写 extension | 场景太定制、没有现成包 | 50-200 行 TS，维护责任 |

**社区共识的优先级**（来自 `_faq_on_digested/07/06_field_usage.md` C4 和 C10）：

> **自扩展 > 装包 > 自己写**
>
> pi 自扩展（让 pi 写）→ 发现不够用 → 搜社区包 → 还是不够 → 自己写 extension

## 装包前的安全检查

第三方包 = 执行第三方代码。装前必做：

1. **读 README**，看它挂载了哪些事件（`before_agent_start` 注入多少 token？ `tool_call` 拦截了哪些工具？）
2. **算 token 价**（裸启动 5.3k 是对照基准，它加了 500 token 还是 5000？）
3. **cherry-pick 能力，不全量装**（如果包有 20 个文件，你可能只需要其中一个——pin 它，拆出来只放需要的）
4. **审源码**（如果是 GitHub 可见的开源包，至少有 README + 主要文件的结构）

**安装后管理**：`pi config` 逐个开关（`pi-kit` 的做法），`alias pi='pi update --extensions && command pi'` 启动前更新。

## 自己写 extension 的最小路径

1. 确定需要哪条轴（几乎总是轴 1 命令 + 轴 2 事件 + 轴 5 UI 中的几个）
2. 从 `examples/extensions/` 找最接近的示例，拷成骨架
3. 改 handler 逻辑
4. 测试（`.pi/extensions/` 下放文件 → 重启 pi → 调 `/命令` 看效果）

多数有用的 extension 在 50-200 行之间。

## 锚点

- `10_extension_overview.md`（七条轴总览）
- `10a-h` 各篇（每条轴的细节）
- `_faq_on_digested/07/05_package_ecosystem.md`（头部包的 token 价参考）
- `_faq_on_digested/07/06_field_usage.md` C8（pi-kit 的 cherry-pick 做法）

## 最小例证

**例证 1（自扩展）**：对话中说"帮我把这个审查流程写成一个 skill，放在 `.pi/skills/` 下"——pi 会写一个带 frontmatter 和步骤的 Markdown 文件。不需要手写。

**例证 2（装包）**：`pi install npm:pi-web-access` → 重启后 agent 有了 `web_search` 工具。不需要配 API key（keyless Exa）。40 秒从"没有 web"到"有 web 搜索"。