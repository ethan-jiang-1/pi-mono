# Pi 扩展 Agent-ready 开发

本语料面向独立开发 Pi 扩展与 Pi package 的仓库，说明怎样沿用 Pi 的原生机制组织意图、实现、验证与交付判断。目标不是复制 pi-mono 主仓库的内部治理，而是让扩展作者复用 Pi 可验证的扩展点、组合方式和测试形态。

本目录是一套可独立使用的语料。三卷分别解释扩展开发模型、pi-mono 的精确流程机制和仓库自身作为开发 harness 的组织方式；每卷均以 Pi 仓库 `earendil-works/pi` 固定 release tag `v1.2.0` 的源码、文档、规则、prompts、skills、workflows 为一手来源，不依赖其它研究材料。Pi 没有声明采用一套统一开发方法，本语料不把综合模型写成官方方法。

## 目标读者与适用边界

目标读者是在独立仓库中开发 Pi 扩展、skills、prompt templates、themes 或 package 的 owner 与 coding agent。读者应能从最小扩展入口开始，逐步建立自己的源码、package 声明、测试结果、安装验证和交付记录。

**适用边界**：独立扩展仓可以使用 Pi 的扩展运行时、`ExtensionAPI` 合同、skills/prompts/packages 组合、faux provider 测试模式与安装验证方式。pi-mono 主仓库的贡献准入（`lgtm`/`lgtmi`）、CI 矩阵、发布管线与维护者评审属于主仓治理，不会因为使用 Pi 就自动适用于扩展仓；扩展仓应为自己的公开接口、用户可见行为、版本兼容和发布方式指定权威维护位置与验证路径。

正文区分四类陈述：**运行时事实**描述 Pi 接口的实际行为；**主仓要求**说明 pi-mono 自身的贡献、测试与发布规则；**扩展仓建议**是本语料归纳的开发做法；**仓库自定**包括外部扩展仓的组织、审批与发布选择。主仓要求不会因使用 Pi 自动成为外部仓库制度。

## 独立使用与发行

复制本目录的全部内容并保留相对目录结构，即可独立阅读和验证；不需要 pi-mono 的其它研究目录。必要术语在卷一[术语页](./extension-development-model/02-terms-and-mental-models.md)解释。核对一手事实需要访问 tag `v1.2.0` 的 Pi 仓库；离线核对可另备该版本的 checkout。

独立读者建议先看[新仓起步](./extension-development-model/01-new-extension-repository.md)，遇到陌生词查[术语页](./extension-development-model/02-terms-and-mental-models.md)，再按问题选择另外两卷。

## 三卷入口

| 路径 | 扩展仓读者的问题 | 使用方式 |
|---|---|---|
| [扩展开发模型](./extension-development-model/README.md) | 新建独立扩展仓后如何起步并组织一次变更？ | 先看[新仓起步](./extension-development-model/01-new-extension-repository.md)，再按问题深入 |
| [SDLC Reference](./sdlc-reference/README.md) | pi-mono 的精确条件、状态和例外是什么？哪些可移用？ | 按问题查阅，并遵守适用边界 |
| [Development Harness](./repo-harness/README.md) | pi-mono 仓库自身怎样组织 agent 参与？能借鉴什么原则？ | 按参与任务查阅 |

三卷各有 README 与入口页，只依赖 `v1.2.0` 一手来源，彼此不构成前置阅读顺序。

## 理解从哪里来

本语料对 Pi 的全部理解只从 [`earendil-works/pi`](https://github.com/earendil-works/pi/tree/v1.2.0) tag `v1.2.0` 的一手内容挖出：源码、`packages/coding-agent/docs/`、`AGENTS.md`、`CONTRIBUTING.md`、`.pi/`、`.github/` 与该 tag 的发布产物形态。目录外链接只指向该 tag，因此可以独立发行，同时保留回到原始证据的路径。

具体做法：结论在正文讲清楚，关键规则以 Markdown blockquote 摘录仓库原文，并给出该 tag 的可核对链接；仓库没有声明的制度一律表述为「可观察机制的综合」。Pi 处于活跃开发期，接口与主仓制度都会演进；更新基线时应逐条复核并改写过时结论，不能只替换链接。基线与重审记录由[维护页](./_coverage/00-corpus-maintenance.md)拥有。

## 目录：每个子目录为什么存在

| 路径 | 为什么要有它 | 什么时候需要改它 |
|---|---|---|
| [`extension-development-model/`](./extension-development-model/README.md) | 独立扩展仓怎样组合 Pi 的扩展点、验证与交付判断 | Pi 扩展运行时合同、资源发现或 package 规则变化时复核 |
| [`sdlc-reference/`](./sdlc-reference/README.md) | 查阅 pi-mono 的精确条件与例外，判断哪些适用于扩展仓 | 任何一手事实变化（workflows、check、CI、发布）都按 `_coverage` 的重审触发路径改对应页 |
| [`repo-harness/`](./repo-harness/README.md) | 查找 pi-mono 的 agent 入口规则、prompts、skills 与扩展点地图 | 仓库机制清单变化时改（AGENTS 规则、`.pi/` 内容、扩展点面） |
| [`_coverage/`](./_coverage/README.md) | 钉了哪个版本、哪些来源核过、上游什么变化要触发重审 | 每轮挖取/re-pin/改名都留一条带日期的记录 |
| [`verify.mjs`](./verify.mjs) | 语料的结构规则（严格 UTF-8、结尾换行、相对链接与锚点、钉版外链、目录 README、SVG 图示元数据与引用完整性）用可执行脚本强制 | 只在结构规则本身变化时改；同步检查负例 |
| [`verify.test.mjs`](./verify.test.mjs) | 在临时复制的语料副本中测试接受和拒绝条件 | 修改链接或结构约束时更新对应负例 |

## 验证

修改本目录后，使用支持 ESM 与 Unicode 正则的 Node.js（Node 22）运行。位于本目录时：

```sh
node verify.mjs
```

位于仓库根目录时：

```sh
node _pi_extension_agent_ready_development/verify.mjs
```

脚本仅使用 Node 内置模块，不依赖 npm、宿主脚本、Git 或网络；它按自身文件位置定位语料，不按当前工作目录猜路径。该命令检查严格 UTF-8、单个结尾换行、Markdown 相对链接与锚点、目录 README、外链只指向 `v1.2.0` 的 Pi 仓库路径，以及 SVG 图示的固有尺寸、无障碍元数据与正文引用完整性（每个图示必须被正文引用，正文引用的图示必须存在）。它不核对远端来源内容，也不证明语义准确。

修改验证规则后，在本目录运行 `node verify.test.mjs`。测试把语料复制到独立临时目录，确认有效副本通过，而越界外链、缺失锚点、缺失结尾换行、缺无障碍元数据的图示与未被引用的图示被真实入口拒绝。
