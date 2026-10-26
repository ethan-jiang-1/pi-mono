# 证据台账（共享层）

`_digested/` 与 `_faq_on_digested/` 共用的证据台账。目的：把"论断"与"源码坐标"分开，使版本升级只改台账、不改正文。

## 结构

```
_digested/_evidence/
  corpus.json           # 基线：repo / tag / commit
  claims.json           # 共享台账（entries[]）
  render/faq.md         # 生成的证据附录（FAQ 正文的 [E###] 指向这里）
  tools/
    verify-evidence.mjs # 对 tag 校验 path / locator / quote
    render-evidence.mjs # 从 claims.json 生成 render
    migrate-anchors.mjs # 把页面里的 #L 链接转成候选条目草稿
```

`_pi_extension_agent_ready_development/_evidence/` 是独立的一套（该语料承诺可整目录拷走），格式相同，用同一组工具跑。

## 条目格式

```json
{
  "id": "E012",
  "page": "12_pi_philosophy/sdlc_evidence.md",
  "claim": "发布脚本先 pin 最新模型目录再构建",
  "checkedAt": "v1.4.0",
  "sources": [
    {
      "path": "scripts/release.mjs",
      "locator": { "kind": "symbol", "value": "pinAndBuildWithNewestModelCatalog" },
      "quote": "…",
      "hintLine": 97,
      "volatility": "high"
    }
  ]
}
```

- `locator.kind`：`heading`（Markdown 小节标题包含）、`symbol`（源码子串）、`text`（任意子串）、`regex`；`expect: "absent"` 表示该路径在该 tag 已删除。
- 机器不使用 `hintLine`，它只给人读。
- `quote` 必填于机制/数字断言；方法学断言可以只有 locator。

## 正文写法

- 一句或一段一个标记：`[E012](../_evidence/render.md#e012)`。
- 不写 `#L`、不写版本号、不写行数；需要提版本时只出现在 baseline、对比句或 archive 区块。
- 引用规则时用小节名（`AGENTS.md § Commands`），链接交给附录。

## 校验

```sh
node _digested/_evidence/tools/verify-evidence.mjs --corpus _digested --repo .
node _digested/_evidence/tools/verify-evidence.mjs --corpus _faq_on_digested --repo .
node _digested/_evidence/tools/verify-evidence.mjs --corpus _pi_extension_agent_ready_development --repo .
```

`verify-evidence` 需要本地有 Pi 的 git 历史（用 `git show <tag>:<path>`），读者不需要跑；读者只需跑各语料的 `verify.mjs` 检查结构与相对链接。

## 升级基线的步骤

1. 解压/检出新的 tag；在 `corpus.json` 改 `baseline`。
2. 跑 `verify-evidence`：失败项 = 该 tag 里 locator 或引文变了，逐条改 `claims.json`。
3. 跑 `render-evidence` 重生成附录。
4. 正文只在"某条 claim 被证伪"时才改；单纯坐标移动不应产生正文 diff。
