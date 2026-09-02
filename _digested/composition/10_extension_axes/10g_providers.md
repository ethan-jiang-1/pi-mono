# 10g. 轴 7：注册模型提供商

## 用户问题

Pi 内置了主流 provider（Anthropic、OpenAI、DeepSeek 等）。但如果你有一个自定义中转、私有部署、或未内置的提供商，怎么加？

## 是什么

`pi.registerProvider(config)` 运行时注册一个新的 LLM provider。

```typescript
pi.registerProvider({
    name: "my-custom-provider",
    api: "openai-completions",  // 兼容的 API 类型
    baseUrl: "https://my-gateway.example.com/v1",
    models: ["my-model-v1", "my-model-v2"],
});
```

## 什么时候需要用

| 场景 | 解法 | 工作量 |
|------|------|--------|
| 官方 provider 已内置 | 直接用 `Ctrl+P` 选择 | 0 |
| 第三方中转（兼容 OpenAI API） | `registerProvider` 注册 | ~10 行 |
| 私有部署（兼容 OpenAI API） | `registerProvider` 注册 | ~10 行 |
| 私有部署（自定义协议） | 完整 provider 实现（`packages/ai/src/providers/`） | ~300 行 |
| 临时用一下 | `models.json` + `models-store.json` 手动配 | 取决于模型 |

## 和 models.json 的关系

对于简单的模型配置，不需要写 extension。`.pi/agent/models.json` 里配基础 URL 和模型列表就够了——前提是 provider 类型和 API 协议兼容已内置的。见 `_faq_on_digested/07/03_third_party_provider_baseurl/`。

`registerProvider` 比 `models.json` 更强：它允许注册一个全新的 provider 类型，不只是改 base URL。

## 锚点

- `packages/coding-agent/src/core/extensions/types.ts`：`registerProvider` 签名
- 本仓库 `.pi/skills/add-llm-provider.md`：完整的跨 7 子系统 provider 注册 checklist
- `_faq_on_digested/07/03_third_party_provider_baseurl/`：第三方中转的存在方法（模型身份保障）

## 最小例证

**例证 1（10 行私有中转）**：

```typescript
export default function (pi: ExtensionAPI) {
    pi.registerProvider({
        name: "my-gateway",
        api: "openai-completions",
        baseUrl: "http://localhost:8080/v1",
        models: ["my-model"],
    });
}
```

放在 `.pi/extensions/my-gateway.ts` → 启动 pi → `Ctrl+P` 出现 "my-gateway/my-model"。10 行。