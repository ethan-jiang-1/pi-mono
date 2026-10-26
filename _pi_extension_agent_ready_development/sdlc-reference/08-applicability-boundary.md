# 08 适用边界：什么不随使用 Pi 继承

前七页描述的是 pi-mono 主仓的机制。这一页回答最后一个问题：一个独立扩展仓读到这些之后，哪些是它必须自己决定的，哪些是可以在弱化形式下借用的原则。结论只有一句可执行的话：**使用 Pi 不等于加入 pi-mono 的治理**。

## 不继承的清单

以下机制全部属于 pi-mono 主仓，扩展仓不因依赖 Pi 包、不因使用同一个 CLI 而获得或受约束（逐条对应前七页）：

| 机制 | 为什么不继承 | 详见 |
|---|---|---|
| issue/PR 默认自动关闭、`lgtmi`/`lgtm` 解锁、`.github/APPROVED_CONTRIBUTORS` | 这是维护者带宽下的流量策略；扩展仓的贡献者规模与风险面不同 | [01](01-contribution-gates.md) |
| `@issuron analyze` 的 CI 诊断链（org 成员 + 仓库写权限双重授权、专用 auth.json、secret gist） | 依赖 pi-mono 自己的组织成员、environment secret 与专用登录 | [02](02-issue-diagnosis-and-session-import.md) |
| `npm run check` 的具体条目（pinned-deps、entry-graphs 预算、browser-smoke、install-lock 等） | 每条都针对 pi-mono 的包结构、浏览器目标与发布形态 | [03](03-check-pipeline.md) |
| 主 CI 的 `build-check-test` 与 `mcp-conformance` 两个 job、env 工作流的六平台 daemon 矩阵、Nix/audit/模型目录工作流 | 触发器与检查范围由主仓的事件与路径设计决定 | [04](04-ci-matrix.md) |
| `test/suite/` 的 CI-safe 规则、bash 隔离环境、evals 的 Docker 配对 | 规则本身写给主仓测试；扩展仓要用需自建同等约束 | [05](05-testing-layers.md) |
| The One Rule 的具体措辞与「两次违规即封禁」 | 门槛值与处罚由各仓自己定 | [06](06-review-and-human-role.md) |
| lockstep 版本、`release.mjs` 十步、六平台二进制、npm trusted publishing、R2 公告、`stable` 分支 | 依赖主仓的包清单、平台承诺、npm 组织、R2 凭据与 Nix flake | [07](07-release-and-recovery.md) |
| `AGENTS.md`、`.pi/prompts/`、`.pi/skills/` 的具体内容 | 它们是该仓的工作程序；扩展仓可写自己的同名文件 | 卷三 [repo-harness](../repo-harness/README.md) |

上表不是「这些机制不好」，而是「它们的作用域是仓库」。把主仓制度写进扩展仓文档、冒充 Pi 的要求，会同时误导贡献者和维护者。

## 继承清单（真正的运行时合同）

少数东西是 **Pi 层面的**，任何使用 Pi 的仓库都受其约束，与 pi-mono 主仓无关（**运行时事实**）：

| 合同 | 内容 | 依据 |
|---|---|---|
| 扩展生命周期 | factory 只做注册；长命资源从 `session_start` 或按需启动；清理放幂等 `session_shutdown` | Extensions 文档 |
| 事件边界 | run 从 `before_agent_start` 到 `agent_end`；`agent_before_settle` 是最后可行动边界；`agent_settled` 只通知 | Extensions 文档 |
| package 依赖划分 | host 提供的包（`@earendil-works/pi-ai`、`@earendil-works/pi-agent-core`、`@earendil-works/pi-coding-agent`、`@earendil-works/pi-tui`、`typebox`）放 `peerDependencies` 用 `"*"`，不得放 `dependencies` |  |

[E124](../_evidence/render.md#e124)
| 工具不可注销 | 只能以 `exposure: "hidden"` 重注册收回；`terminate: true` 需要同批已完成工具一致同意 | Extensions 文档 |
| 模式差异 | JSON/print 无 UI；RPC 不转发自定义终端组件；用 `ctx.mode`/`ctx.hasUI` 守卫 | Extensions 文档 |
| 会话文件格式 | 带树结构的 JSONL；导出/导入是搬运历史，不是重放（见[02 页](02-issue-diagnosis-and-session-import.md)的 `/ir` 边界） |  |

区别判据很简单：**换成任何 Pi 用户都成立的是运行时合同；只有在这个仓库工作才成立的是主仓要求。**正文中的「主仓要求」标注就是给这条判据用的。

## 扩展仓必须自己决定的事

以下没有 Pi 提供的默认答案（**仓库自定**）：

1. **公开接口与兼容面**。`AGENTS.md` 的「不保留向后兼容，除非用户要求」只是主仓内部规则；扩展仓一旦有外部用户，兼容面、弃用策略与版本语义必须自己声明。
2. **入口合同**。谁来提交工具、事件或 provider；用不用模板区分 bug 与功能请求；是否自动关闭低质量输入。
3. **验证义务**。哪些行为变化必须配可失败的检查；是否复刻打包安装验证；是否做真实模型 smoke。Pi 不提供第三方扩展的托管评估（[05 页](05-testing-layers.md)）。
4. **发布形态与版本策略**。npm、git、本地路径；单包还是多包；是否锁步；是否需要平台二进制。
5. **评审与发布的人判断点**。谁有权接受风险、谁能在没有外部批准的情况下发版。
6. **成本边界**。是否有入口预算、上下文预算或依赖数量约束（[03 页](03-check-pipeline.md) 的 entry-graph 思路可借用，阈值自己定）。

## 可借用的原则（弱化形式）

前七页中真正可迁移的是**判据与形状**，不是门槛值或完整工作流：

- **每类事实有权威维护位置**（[00 页](00-index.md)）：每条规则只有一个权威位置，其它地方引用。扩展仓可从「兼容面写在哪」「版本从哪读」开始。
- **每个行为变化配一条能在其回归时失败的最小检查**（[03 页](03-check-pipeline.md)）：不必复制八项 check，先做到「这条新行为若被改坏，有一条命令会红」。
- **按变更路径分流重检查**（[04 页](04-ci-matrix.md)）：普通提交跑快检查，涉及发布面/平台面的路径才触发重检查。
- **分层测试按观察对象分工**（[05 页](05-testing-layers.md)）：用 `@earendil-works/pi-ai/compat` 的 faux provider 测扩展逻辑，把真实模型留给交互 smoke——这是本卷里最直接可移用的一层。
- **审阅用缓冲、体积用预算**（[06 页](06-review-and-human-role.md)）：默认关闭低质量输入、允许无回复、把封禁/关闭条件写清楚而不是靠提醒。
- **幂等代替回滚**（[07 页](07-release-and-recovery.md)）：不可变产物 + 只前进的 latest 指针 + 已存在即跳过，让失败后的动作是「重跑」。
- **理解义务显式化**（[06 页](06-review-and-human-role.md)）：把「提交者必须能解释改动」写进仓库文件。

每条借用都可以只取一半：例如只保留「重跑幂等」而不引入 R2，或只用 faux provider 而不建 evals。

## 判据：这条主仓机制要不要移用

移用前逐个问：

1. **它防的是我这类仓库的真实失败吗？** entry-graph 预算防的是大包误拖图；单文件扩展没有这个失败面。
2. **它的成本谁付？** 五 OS 矩阵要求维护者能修五个平台的失败；没有这个能力时，矩阵只会长期变红。
3. **它需要我缺的凭据或组织关系吗？** 双重授权诊断链依赖组织 membership、专用登录与 environment secret。
4. **移用后哪条事实变成两份？** 若扩展仓文档复制了 Pi 的运行时合同，Pi 升级时会出现两处不一致的权威。
5. **失败时它给的是机制还是提醒？** 机制能在提交时红；提醒只会被忽略。

五个问题里有两个答不上来，就先只借用原则，不复制机制。

## 反例

- **「Pi 用它自己的 gate，所以我的扩展仓也该有」**：不成立。gate 针对的是该 tracker 的流量，不是 Pi 生态的准入。使用 Pi 与向 pi-mono 提 PR 是两件独立的事。
- **「主仓这么写，所以这是 Pi 的推荐做法」**：不成立。本卷通篇标注了「主仓要求」与「扩展仓建议」的差别；主仓多数机制没有对外效力。
- **「运行时合同可以按仓库改」**：也不成立。生命周期、依赖划分、模式差异是不可协商的运行时事实；违反它们的扩展会在并发、无头模式或干净安装时失败，与仓库制度无关。
- **「借鉴等于复制」**：不等于。借原则的收益来自把判据适配到自己的失败面；照抄门槛值通常会把别人的带宽假设搬成自己的长期红灯。
- **「本卷的三条立场是 Pi 的方法论」**：不是。那是对 `v1.4.0` 可观察机制的综合归纳，属**扩展仓建议**；Pi 没有声明采用任何统一开发方法名。

## 下一步

- 想在独立仓里落地：从 [新仓起步](../extension-development-model/01-new-extension-repository.md) 开始。
- 想核对某条主仓事实的精确条件：回到 [00 索引](00-index.md) 按问题选页。
- 想了解主仓自身怎样组织 agent：见 [repo-harness](../repo-harness/README.md)。
