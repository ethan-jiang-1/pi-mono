# v0.84.3 → v0.84.4 变更总结

**日期**: 2026-09-01
**范围**: `4e58f324f`(v0.84.3) → `b79e4cc83`(v0.84.4)（41 commits，112 文件 +2786/-378，~4 天）
**标签**: v0.84.4（2026-08-28 发布；main 在 v0.84.4 后另有 11 个未发布 commit）
**本轮特殊性**：第四次 catch-up，**fix-heavy 维护版本**——唯一 breaking 是 agent-loop `prepareNextTurn` 时序重排；一处同版本内自我回退（tool_choice 守卫）；一处上轮文档笔误更正（`on()` 重载 34→实为 31，现 33）。

---

## 一句话

v0.84.4 把 compaction / turn 边界的正确性补齐：摘要不再强制禁工具（v0.84.3 的 toolChoice 被撤回）、截断的 summary 不再落盘、阈值压缩挪到"工具结果之后、下一 assistant 响应之前"（为此 `prepareNextTurn` 时序 breaking 重排）；配以 RPC `clear_queue`、扩展 ui_prompt 事件、ai 层流式稳健性修复和一批 TUI 体验 setting。

---

## 六大主题

### 1. compaction / turn 边界（唯一 breaking）

- `prepareNextTurn` / `prepareNextTurnWithContext` 只在循环确认继续（`shouldStopAfterTurn` 之后）、下一 turn 开始前运行；final turn 不再触发（`agent-loop.ts:176-198`）——收尾工作移到 `agent_end`
- `AgentSession._compactBeforeNextAssistantResponse()`（agent-session.ts:543）：工具结果追加后、下一 assistant 请求前做阈值压缩，同一 run 内完成；run 终止且无排队消息时跳过（#8782）
- 新导出 `getSummarizationFailure()`（coding-agent 侧 compaction.ts:545）：`error` 与 `length` 截断的 summary 一律拒绝，不再当 checkpoint（#7048）
- **v0.84.3 的 `toolChoice: "none"` 被移除**（#8649/#8638）；摘要中 toolCall 块的拒绝保留。注意它在 **coding-agent 侧** `core/compaction/`（1012 行），与 agent 侧 `harness/compaction/`（848 行，本轮未动）是两个同名文件
- prepare 期间补轮询一次 steering（仅当先前为空，agent-loop.ts:191-195）

### 2. RPC / 公共 API

- 新 RPC 命令 **`clear_queue`**（rpc-types.ts:26/:125、`AgentSession.clearQueue()` :1588、`RpcClient.clearQueue()` :226）：Esc 交互"清队列→abort→文本还原编辑器"（#8432）
- 扩展事件 **`ui_prompt_start` / `ui_prompt_end`**（#8355）：`UIPromptKind` 五种（types.ts:745-762）；runner 包装 5 个阻塞式 UI 方法，嵌套合并、`queueMicrotask` 发射不阻塞 prompt；`on()` 重载 31→**33**
- 导出 `detectSupportedImageMimeTypeFromFile`（index.ts:421）；~~ToolExecution*Event 导出（#6847）~~ 实为**空 commit**，v0.84.3 已导出

### 3. session / turn 行为

- 运行中 custom message（`triggerTurn: false`）延迟到 `turn_end` 后追加（`_pendingCustomMessages` :332，flush :722/:1533），不再插进 tool call/result 之间（#8537）
- 切 thinking 可见性原地更新组件，保留运行中 Bash 的部分输出（#8611）
- session 文件末行无换行时读入后自动补 `\n` 修复（session-manager.ts:555，#8345）
- Windows taskkill 用 System32 绝对路径 + error 事件消费，PATH 缺失不再崩（#6596）

### 4. settings / model 持久化细化

- `persist: true` 且带非空 `--models` scope 时，同时把 model 追加进 scope 与 enabledModels（`_addPersistedDefaultToNonEmptyScope`，:1679）——v0.84.3 的"persist 才写全局"语义不变
- 新 TUI setting：`fullscreenCopyOnSelect`（默认 true）、`terminal.hyperlinks/images/trueColor` + `PI_*` env 覆盖（settings > env > 自动检测，#8665）

### 5. ai 层稳健性

- Mistral 分片 key 改 `toolCall.index ?? callId`（:696），无 id 续片不再分裂（#8387）
- reasoning_details 相邻 delta 拼接（:259）+ `thinkingSignature` 流结束一次序列化（:431/:695），消除 O(n²)（#8605/#8671）
- tool_choice：#8607 的"无 tools 就省略"守卫被 6b36eb592 回退——ai 层无条件透传（:851），调用方自省
- OpenRouter reasoning controls 由元数据推导 `thinkingLevelMap`（mandatory → 禁止关闭，#8614）；目录：`deepseek-v4-flash-vision-exp`、Cloudflare `workers-ai/*`、glm-5.3 价格修正

### 6. TUI / 打包

- 主屏渲染 1 MiB 分块（`BoundedTerminalWriter`），修整帧超 V8 string 上限崩溃（#8028）
- 全屏选词 `-`/`/` 不切断（#8676）；@ 补全直接子项保底 + 深度排序（#8669）
- bundle 脚本加 `https-proxy-agent` 具名导出插件（#8723）；CI Windows ZIP 用 Expand-Archive

---

## 本轮对 `_digested/` 的更新（2026-09-01）

- **merge**：v0.84.4 进 ethan（`f9a1cf489`，零冲突）
- **agent/**：2.1 prepareNextTurn 时序重写 + 重锚；2.6 steering 二次轮询；3.1/3.2 toolChoice 纠错 + 两个 compaction.ts 澄清 + getSummarizationFailure/between-turn 压缩；1.4/4.4 ui_prompt 事件 + runner 重锚；5.1 四处 ADD + tool_choice 纠错；5.2 无需动；4.1 无需动（骨架零变更）
- **integration/**：03 `clear_queue` + persist-to-scope + ~15 处重锚；04 ui_prompt 事件 + custom message 延迟追加；06 TUI parity/模型行扩充；02 行为备注
- **extensions/、harness/**：事件清单 +2、`on()` 33；harness/1.1/1.2/2.2 计数与锚点更正（34→33 @ L1252）
- **`_digested/README.md` / `_faq_on_digested/README.md`**：基线声明 → v0.84.4
- **遗留缺口**（沿用）：`agent/src/search/`、`coding-agent/src/extensions/`（llama.cpp）、`ai/src/compat/`、telemetry 专题、agent/ 各篇行号逐篇复核

---

## 相关文件

- Sync record：[`0005-v0.84.3-to-v0.84.4.md`](./0005-v0.84.3-to-v0.84.4.md)
