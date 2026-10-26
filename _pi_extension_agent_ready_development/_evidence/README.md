# 证据台账

本目录保存 `_pi_extension_agent_ready_development/` 的证据坐标，让正文可以只写论断、不写版本与行号。

- `corpus.json`：基线（repo / tag / commit）。
- `claims.json`：台账。每条 `id` 对应正文的 `[E###]`，`sources` 用 `heading`/`symbol`/`text` 定位，并附原文引文；不存行号。
- `render.md`：由 `claims.json` 生成的证据附录，是唯一携带 tag URL 与引文的文件。

维护命令（在仓库根运行）：

```sh
node _digested/_evidence/tools/verify-evidence.mjs --corpus _pi_extension_agent_ready_development --repo .
node _digested/_evidence/tools/render-evidence.mjs --corpus _pi_extension_agent_ready_development
```

升级基线时只改 `corpus.json` 与 `claims.json`，正文不应变化。
