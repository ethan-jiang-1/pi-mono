# 问题

我挂了官方的 DeepSeek（provider=`deepseek`，正在用 `deepseek-v4-flash-0731`）。现在还有一个**第三方中转**（micuapi，`https://www.micuapi.ai`），背后跑的可能也是 DeepSeek 系模型，但：

1. 它的 base URL 跟官方不同（`https://api.deepseek.com` ≠ `https://www.micuapi.ai`）。
2. 它 `/v1/models` 暴露的模型 id 是 `deepseek-v4-flash-0731`、`deepseek-v4-pro-0813`——**跟官方 DeepSeek 的模型撞名**（官方也有 `deepseek-v4-flash-0731`）。

我想在 pi-mono 里**同时**挂上官方和第三方，但又不希望它们互相冲突。

## 具体困惑

- pi-mono 里模型的身份到底是什么？"名字相同"到底会不会撞？
- 如果 base URL 不同但模型名一样，要怎么配置才不会互相替换？
- 第三方中转是 OpenAI 兼容协议（`/v1/chat/completions`），但有人提到 `thinkingFormat` 这些要小心——为什么？
- 官方 deepseek 有一些自动探测（`deepseek.com` 魔法），换了 base URL 会不会失效？

## 已知信息

官方 DeepSeek：
- provider id：`deepseek`
- base URL：`https://api.deepseek.com`
- 内置模型（生成目录）：`deepseek-v4-flash`、`deepseek-v4-pro`（含 `deepseek-v4-flash-0731`）

第三方（micuapi，2026-08-18 实测）：
- provider id：自定义（方案 A 里用 `micuapi`）
- base URL：`https://www.micuapi.ai/v1`（OpenAI 兼容，`POST /v1/chat/completions`）
- 模型：`deepseek-v4-flash-0731`、`deepseek-v4-pro-0813`（`GET /v1/models`）
- API key：`sk-...`（newapi 风格）
- 行为：支持 `thinking: { "type": "enabled" }`；返回消息带 `reasoning` + `reasoning_details`；支持 `tool_calls`；`finish_reason` 正常
