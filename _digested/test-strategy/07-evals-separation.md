# 07 — 确定性回归与模型评测的分轨工程学：packages/evals 的物理隔离设计

> **源码锚点**：
> - 评测包独立配置：`packages/evals/package.json`
> - 专用评测运行配置：`packages/evals/vitest.evals.config.ts`（超时 300 秒、串行单进程）
> - 自身单测配置：`packages/evals/vitest.test.config.ts`

---

## 一、软件工程中的“确定性鸿沟”

在传统软件中，测试的结果是非黑即白的二值逻辑（Boolean）：要么通过，要么失败。
但在大语言模型（LLM）介入后，系统引入了**概率性与非确定性（Probabilistic Non-determinism）**：
- 相同的提示词，在温度为 0 的情况下也可能因服务端的 GPU 浮点调度产生微小字符差异；
- 模型的推理能力不是用“通过/不通过”来衡量，而是用“解决率（Pass@k）”、“语义相关度打分（0.0 ~ 1.0）”或“Token 成本与耗时分布”来衡量的。

如果一个团队将“模型能力评测（Evals）”与“代码回归测试（Regression Tests）”混为一谈，就会坠入灾难性的**“确定性鸿沟”**：
- CI 构建耗时从 30 秒飙升到 40 分钟；
- 外部模型 API 偶发 502 导致主干构建经常翻红；
- 负责修 Bug 的工程师和 Coding Agent 无法判断红线究竟是自己的代码 Bug 还是模型又变笨了，最终被迫跳过测试。

Pi-mono 在架构层面上确立了极其清晰的治理典范：**测试与评测的绝对物理分轨（The Grand Physical Divide）**。

---

## 二、packages/evals 的物理隔离架构

Pi-mono 将所有与模型效果评测相关的逻辑，完整封装在一个私有的独立子包 `packages/evals` 中，与日常工程开发形成多维隔离：

```
                    ┌─────────────────────────────────────────┐
                    │               pi-mono                   │
                    └────────────────────┬────────────────────┘
                                         │
         ┌───────────────────────────────┴───────────────────────────────┐
         ▼ (日常研发车道)                                                  ▼ (独立评测车道)
 ┌───────────────────────────────┐                               ┌───────────────────────────────┐
 │ 基础子包 (agent/tui/durable)   │                               │ packages/evals                │
 ├───────────────────────────────┤                               ├───────────────────────────────┤
 │- vitest.config.ts             │                               │- vitest.evals.config.ts       │
 │- 匹配: **/*.test.ts           │                               │- 匹配: evals/**/*.eval.ts     │
 │- 超时: 5000ms                 │                               │- 超时: 300,000ms (5分钟)      │
 │- 模型: Faux Provider (0 Token)│                               │- 模型: 真实付费模型 API       │
 │- 触发: 每次 git commit, PR    │                               │- 触发: 定期任务 / 版本发布基线│
 └───────────────────────────────┘                               └───────────────────────────────┘
```

### 1. 文件形态分流（File Suffix Isolation）
- **常规测试**：后缀为 `*.test.ts`，由根目录 `./test.sh` 递归调度，严禁发起网络请求；
- **能力评测**：后缀严格限定为 `*.eval.ts`（如 `docs.eval.ts`），常规测试流水线直接忽略。

### 2. 执行引擎参数的极端差异
查看 `packages/evals/vitest.evals.config.ts` 可以发现其针对 LLM 评测特性的深度调优：
```typescript
const evalConfig = defineConfig({
  test: {
    watch: false,
    passWithNoTests: false,
    pool: "forks",
    maxWorkers: 1,           // 严格单进程串行，防止瞬间打爆 LLM 提供商的并发速率限制 (Rate Limit)
    fileParallelism: false,  // 禁止文件并行
    projects: [
      {
        name: "host",
        include: ["evals/**/*.eval.ts"],
        testTimeout: 300_000, // 超时时间放宽至 300 秒 (5分钟)，容忍深度思考模型的漫长推理
        hookTimeout: 300_000,
      },
    ],
  },
});
```

### 3. “自举”测试验证（Testing the Evals）
有趣的是，`packages/evals` 自身作为一个包，其内部维护的评测执行器、评分器（Autoevals）代码本身也需要保证质量。因此它独立配置了：
```json
"test": "vitest run --config vitest.test.config.ts"
```
用 100% 确定性的单测来测试评测工具自身，再次体现了严密的代码质量自洽。

---

## 三、确定性测试与评测的黄金法则对照表

| 维度 | 常规代码回归测试（Unit / Harness） | 模型能力评测（Evals） |
|---|---|---|
| **核心标的** | **代码契约（Contract）**：接口是否抛错、状态机是否跃迁 | **模型智能（Intelligence）**：任务是否解决、回答质量评分 |
| **判定标准** | **绝对布尔值**：`expect(status).toBe(0)` | **概率分布**：平均得分、Pass@1、相对基线增益（Delta） |
| **执行频率** | **高频**：Coding Agent 每做一次微小修改即跑一次（毫秒级） | **低频**：夜间巡检、Prompt 重构时、大版本升级前（数十小时） |
| **网络与成本** | **100% 离线，0 费用**（Faux Provider） | **全在线，按 Token 扣费**（Anthropic / OpenAI API） |
| **CI 门禁约束** | **阻断门（Blocker）**：挂一个测试禁止合并代码 | **参考门（Advisory）**：观察统计分数波动，不卡日常修复 PR |

---

## 四、对 Coding Agent 与架构设计的终极启示

1. **不要让大模型去修大模型的概率波动**：
   如果把评测塞入 Coding Agent 的日常自愈流水线，Agent 修复一个死循环任务可能由于大模型评分偶然掉了 0.05 分而陷入困惑，继而产生剧烈的代码倒退；
2. **两套体系，各司其职**：
   - 用最冷酷的确定性沙箱（`test.sh` + `harness.ts`）守住代码和架构的底线；
   - 用独立隔离的评测系统（`packages/evals`）观察大模型理解力的长周期演进。
