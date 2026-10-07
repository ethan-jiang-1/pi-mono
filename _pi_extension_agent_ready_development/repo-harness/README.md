# Repo Harness · pi-mono 作为开发 harness 的专题卷

## 本卷定位

这卷是语料的专题层：回答「pi-mono 这个仓库自身怎样让 coding agent 可参与开发」。它逐项检视该仓库在 `v1.0.3` 的入口规则、`.pi/` 内的 prompts 与 skills、扩展点文档、会话格式与成本防线，说明一个仓库怎样把自己组织成 coding agent 的运行环境——卷名 repo-harness 指的就是「仓库作为开发 harness」这一视角。

本卷回答两类问题：一是描述性的（pi-mono 实际怎么做），二是借鉴性的（独立扩展仓能从中借用哪些原则）。所有机制属于 pi-mono 主仓，不会因为使用 Pi 就自动适用于外部仓；借鉴部分均标注为扩展仓建议，是本语料的归纳，不是 Pi 官方方法。

## 证据基线

一切机制事实对着 [`earendil-works/pi`](https://github.com/earendil-works/pi/tree/v1.0.3) tag `v1.0.3`（commit `d78dc83d6`）核对。关键规则以 blockquote 摘录仓库原文，并附该 tag 的钉版链接（行号锚点以 tag 实际行号为准）。当前工作树的 HEAD 在该 tag 之后，个别文件已漂移；本卷不引用工作树版本。需要自行核对时使用：

```sh
git show v1.0.3:<path>
```

## 主入口

先读[本卷总览](./00-index.md)：它说明本卷回答什么、按任务选页的导航，以及从一手材料归纳的三条组织立场。之后按任务进入具体页面，不需要顺序通读。

## 直接内容表

| 页面 | 回答什么 | 关键一手来源 |
|---|---|---|
| [Agent 入口规则](./01-agent-entry-rules.md) | 一个没来过的 agent 进入 pi-mono 后受哪些规则约束？ | `AGENTS.md`、`CONTRIBUTING.md` |
| [Prompts 即程序性合同](./02-prompts-as-procedural-contracts.md) | `.pi/prompts/` 六个 prompt 各自划定的行为边界是什么？ | `.pi/prompts/is/pr/wr/deslop/sa/cl.md` |
| [仓库 skills](./03-repo-skills.md) | 三个 skill 怎样封装跨多文件、跨阶段的专家程序？ | `.pi/skills/add-llm-provider/interactive-testing/release.md` |
| [扩展点地图](./04-extension-points-map.md) | Pi 的可变性面有哪些，何时选哪种载体？ | `docs/extensions.md` 等九篇文档 |
| [会话可检视性](./05-session-inspectability.md) | 会话文件合同与 `/ir` 如何让工作可复查、可续接？ | `docs/session-format.md`、`.pi/extensions/import-repro.ts` |
| [铺装路与成本](./06-paved-road-and-costs.md) | 仓库怎样把正确路径做便宜、把偏离做显式？ | `CONTRIBUTING.md`、`scripts/check-entry-graphs.mjs` |
| [Monorepo 分类](./07-monorepo-taxonomy.md) | `packages/` 下各包扮演什么角色，与扩展作者何干？ | 根 `README.md` 包表、各包 `README.md` |

## 陈述类别

正文必要时区分四类陈述：**运行时事实**（Pi 接口的实际行为）、**主仓要求**（pi-mono 自身的贡献、测试与发布规则）、**扩展仓建议**（本语料归纳的做法）、**仓库自定**（外部扩展仓的组织选择）。主仓要求不构成扩展仓义务；运行时事实则是所有 Pi 用户共享的合同。

## 引用与核对约定

关键规则以 Markdown blockquote 摘录仓库英文原文，随后给出钉版链接（`blob/v1.0.3` 路径加 `#L` 行号锚点，行号以 `git show v1.0.3:<path>` 的实际行号为准）。语料内链接一律相对路径且目标存在；外部链接只指向该 tag 的 Pi 仓库路径。核对任一引用：

```sh
git show v1.0.3:<path> | sed -n '<N>p'
```

## 本卷不做什么

本卷不复制 Pi 的 API 文档：需要 `ExtensionAPI` 签名、事件清单或示例代码时，直接读 [extensions.md](https://github.com/earendil-works/pi/blob/v1.0.3/packages/coding-agent/docs/extensions.md) 与其它官方文档，本卷只讲它们在「仓库作为 harness」里的角色。本卷也不把 pi-mono 的贡献制度（auto-close、`lgtm`、lockstep 发布）推荐为扩展仓制度——那是主仓在自身流量与维护者带宽下的选择，扩展仓应按自己的规模自定（仓库自定）。更长的计划与设计讨论见主仓指向的 RFC 索引（`rfc.earendil.com/keyword/pi/`），其内容不属于本卷证据链。

## 与其它卷的关系

本卷只依赖 `v1.0.3` 一手来源，不依赖语料其它卷。扩展开发的概念载体与完整开发闭环见[扩展开发模型](../extension-development-model/README.md)；语料整体定位见[语料根 README](../README.md)。
