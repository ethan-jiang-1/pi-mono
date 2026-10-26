# 证据台账（FAQ）

本目录保存 `_faq_on_digested/` 的证据坐标。

- `corpus.json`：基线（repo / tag / commit）。
- `claims.json`：台账，每条含 id、page、claim、sources（path + locator + quote）。
- `render.md`：由工具生成，是唯一携带 tag URL 与引文的文件。

正文引用写成方括号标记（如 `E012`），链接指向本目录 render 文件的对应标题。

命令：

```sh
node _digested/_evidence/tools/render-evidence.mjs --corpus _faq_on_digested
node _digested/_evidence/tools/verify-evidence.mjs --corpus _faq_on_digested --repo .
```
