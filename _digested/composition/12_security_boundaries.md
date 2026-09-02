# 12. 安全边界与隔离策略

## 用户问题

Pi YOLO 默认——agent 在终端里全权操作。这听上去很危险。"全权"意味着什么？我真的能安全地用它吗？

## 四档隔离

**核心判断**（来自 `_digested/harness/02-Boundaries/2.1_no_sandbox.md`）：

Pi 没有内置沙箱。你只有 YOLO 全权和工具白名单两个内置机制。其余的都是"你自己加的"——容器、VM、bwrap——它们和 pi 无关，只是你在运行 pi 之前就把环境准备好了。

从最松到最严：

| 档位 | 配置 | 保护范围 | 配置成本 | 日常成本 |
|------|------|---------|---------|---------|
| 0 | YOLO 默认 | 无 | 0 | 0 |
| 1 | 工具白名单 | 限制 agent 可调用的内置工具 | 零（一行 settings.json） | 零 |
| 2 | bwrap / 容器 | OS 级文件系统隔离 | ~10 分钟配一次 | 容器管理开销 |
| 3 | 专用 VM / 一次性环境 | 完全硬件隔离 | ~30 分钟配一次 | VM 管理 |

### 档位 0：YOLO 默认

代理可以：
- 读、写、删除、执行任何文件
- 运行任何命令（包括 `rm -rf`、`git push`、`curl` 到生产 API）
- 修改系统配置
- 访问密钥和凭证

**什么情况下安全**：这台机器上没有敏感数据、没有生产凭证、不是生产 CI。

**什么情况下不安全**：这台机器上有密钥、有生产数据库访问权限、是共享机器。

### 档位 1：工具白名单

`settings.json` 或 `--tools` 限制 agent 可调用的工具。

```bash
pi --tools read,grep,find,ls   # 只读模式
pi --tools bash                 # 只能跑命令不能写文件
pi --no-tools                   # 纯对话，无工具
```

**工具白名单可以做到的事**：
- 只读模式：agent 只能读文件（不能改、不能执行）
- 执行模式：agent 只能跑 bash（不能读项目文件？不能——`bash cat` 不算"bash 工具"吗？这是 pi 工具系统的一个粗糙边界：白名单管的是"是否允许调用 bash 工具"，不是"bash 允许跑什么命令"）

### 档位 2：bwrap / 容器

Bwrap（`@trim21/personal-pi-extensions`，v0.84.4，39.2K/月）给 bash 工具加 bwrap 包装：

```bash
bwrap --ro-bind /workspace /workspace \
      --proc /proc \
      --dev /dev \
      bash
```

或者直接在容器里跑 pi：

```bash
docker run -it --rm -v $(pwd):/workspace pi bash
```

**容器可以做到的事**：
- 文件系统只读绑定（agent 只能读不能写）
- 网络隔离（agent 不能 curl）
- 进程隔离（agent 不能访问宿主机进程）
- 持久性控制（exit 即销毁）

### 档位 3：专用 VM / 一次性环境

社区实践（`_faq_on_digested/07/06_field_usage.md` C5）：

> "Run this in a VM, container, or disposable environment."
> "Treat this like giving a very fast junior operator shell access."

典型做法：
- 一次性 VM（Terraform 创建，用完销毁）
- CI 环境（GitHub Actions runner，每次干净）
- 非敏感研究仓库（Simon Willison 模式）

## 安全模型的核心哲学

Pi 的安全模型不是"保护你"，是**让你自己决定她保护边界**。

这话意味着：
- 没有内置的弹窗问"可以运行这个命令吗"
- 没有内置的文件删除确认
- 没有内置的网络限制

它给的是：工具白名单（简单隔离）→ bwrap（OS 隔离）→ 容器/VM（硬件隔离）。你选哪一档。

**芒特格**（来自 `_faq_on_digested/07/06_field_usage.md` C5）：

> "Permission guard is not a security boundary. It's a safety net for honest mistakes, not a jail."

## 推荐的降权配置

```bash
# 探索阶段（只读）
pi --tools read,grep,find,ls "理解 auth 模块"

# 计划阶段（只读 + 写 PLAN.md）
pi --tools read,grep,find,ls,write "把方案写成 PLAN.md"

# 实现阶段（全工具）
pi "实现 PLAN.md"

# 敏感操作（容器内全工具）
docker run -v $(pwd):/workspace pi "deploy to staging"
```

## 锚点

- `harness/02-Boundaries/2.1_no_sandbox.md`（无内置沙箱的分析）
- `_faq_on_digested/07/06_field_usage.md` C5（YOLO + 隔离是共识）
- `@trim21/personal-pi-extensions`：bwrap 扩展源码
- `packages/coding-agent/docs/containerization.md`

## 最小例证

**例证 1（白名单降权）**：启动 `pi --tools read,grep,find,ls` → 对 pi 说"改这个文件" → agent 回复"I don't have the write tool to modify files"。证明白名单有效。

**例证 2（容器隔离）**：`docker run -v $(pwd):/workspace:ro pi "find /workspace -type f"` → agent 可以读但不能改。`rm /workspace/foo.ts` → Permission denied。