# 扩展开发模型 · 独立扩展仓的综合主卷

## 本卷定位

这卷面向刚创建独立 Pi 扩展仓的 owner 和 coding agent，讲清关键概念、完整变更路径、验证分层与交付判断。读者不需要先通读另外两卷，就能回答「从哪里开始、变更落在哪种资源类型、怎样证明扩展工作、哪些事情仍需自己决定」。

这里综合 Pi 在 `v1.4.0` 的一手机制，不新增官方方法名，也不把 pi-mono 主仓库的贡献制度强加给外部扩展仓。所有机制依据来自该 tag 的源码、文档与示例；其它研究材料不参与本卷的证据链。

## 先看哪一页

| 你的问题 | 页面与重点 |
|---|---|
| 想先看懂整体流程、四层区分与完成度阶梯 | [开发模型总览](./00-index.md) |
| 不熟悉 Pi 术语，想知道扩展、skill、package、faux provider 是什么 | [术语与心智模型](./02-terms-and-mental-models.md) |
| 刚建了扩展仓，想知道先建立什么 | [新仓起步](./01-new-extension-repository.md) |
| 需要核对 Pi 某条规则的准确条件或例外 | [SDLC Reference](../sdlc-reference/README.md)：按问题查阅，不是本卷的必读前置 |
| 想看 pi-mono 自己怎样组织 agent 参与 | [Development Harness](../repo-harness/README.md)：按任务进入，不是必读前置 |

需要具体 API 签名和示例代码时，继续 Pi 的 [Extensions 文档](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/extensions.md) 与 [SDK 文档](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/sdk.md)。本卷不另造未经执行的脚手架命令。
