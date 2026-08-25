# FAQ《06_pi_vs_dsh》DSH 侧断言逐条核对清单

> 核对人：reviewer-dsh（任务 t2）。DSH 基线 `0.1.1-rc.1` / commit `528c682e…`。
> 核实对象：`/Users/bowhead/deepseek-harness/_digested/` 下 system/、composition/、cordis-runtime/、capability-seams/、session-and-loop/、harness-idea/；数字型断言另查实际仓库 `vendor/README.md`、`docs/testing.md`、`.agents/notes/`。
> 说明：对"已确认"，给出依据文件与行号（针对对应 md 源）。
> 状态：本清单为核对记录；下文"存疑/需注意项"与"修正建议"所列问题均已落入 FAQ 正文（01/02/03/04 已修订），清单保留原始表述未再回改。

---

## 1. 无特权核心 + 组合内核；`new Context()` 硬编码根；`boot()` 先装 Loader

结论：**已确认**。

| FAQ 表述 | FAQ 位置 | 依据 |
|---|---|---|
| "There is no privileged core to patch"（architecture.md L13） | 01_common L11 | 实际库 `docs/architecture.md:13` 逐字一致 |
| 核心没有消失，下沉成组合内核 composition kernel | 01_common L11 | `_digested/harness-idea/07-boundaries-costs-fit.md` L115-118："核心没有消失，而是从 Agent 业务逻辑下沉成了**组合内核（composition kernel）**" |
| `new Context()` 硬编码根 Fiber/Reflect/Registry/Events/Logger | 01_common L9、03表 L10 | `_digested/system/00-map.md` L28："`new Context()` 直接建立 root Fiber、服务反射、插件注册表、事件服务和日志器；`boot()` 随后安装 Loader" |
| boot() 先装 Loader | 03表 L10 | system/00-map L28 + `composition/01-boot-时序.md` L51-62（`new Context()` → `plugin(Loader)` → `mountRootInclude`） |

措辞细节：FAQ 03表把"五原语 + Loader/Boot"并列为组合内核；严格说组合内核是 Cordis 运行时基础，Loader 由 `boot()` 安装、不属于 `new Context()` 的根。不影响结论，仅在措辞更精确时可注明"Loader 由 boot 安装"。

---

## 2. 五原语 + 注册即 effect + fiber 卸载回收 + inject PENDING→激活

结论：**已确认**。

- 五原语 = Plugin / Context / inject / Events / Effects：`cordis-runtime/00-map.md` L13-19 表，以及 `cordis-runtime/01` 全篇。
- 插件以 fiber 管生命周期（`ctx.plugin` 为一次调用建 fiber）：`01` L12-15 段。
- 注册即 effect：`ctx.effect` 拉起的 disposer 逆序回收；`ctx.on` 也是 effect（fiber 卸载撤监听）：`01` 的 Effects 段 L58-66；`harness-idea/00-map.md` L52 "注册即效果"。
- inject 缺服务 → 状态 `PENDING`/`INACTIVE`，服务齐 → `LOADING` + `_reload` 激活：`01` 的 inject 段 L38-45（fiber 状态机）。
- 服务被替换（uid 变）会让依赖方卸载重载：`01` L44。

FAQ "注册即 effect、fiber 卸载回收、inject 缺服务 PENDING→激活" 全部成立。

---

## 3. 插件形态 name / inject / Config / apply，禁 default export

结论：**已确认**。

`cordis-runtime/01` L28（函数插件产品合同原文）：
> "named export `name` / `inject` / `Config` / `apply`，**不要 default export**。Loader 碰到 default 会丢掉函数插件的 namespace，见 `docs/postmortem/0001-acp-default-export-drops-inject.md`。"

FAQ 03表 "插件：带 name/inject/Config/apply 的 Cordis 插件" 准确。

---

## 4. capability seam：Definition/Provider/Consumer 三角色；一次 bash 从 tool 到 sandbox

结论：**已确认**。

- seam 是完整能力，三角色齐全才叫 seam：`capability-seams/00-map.md` L22-24、L5；`capability-seams/01` L37-38。
- Definition 是 Cordis `Service` 抽象类，非 `interface`：`capability-seams/01` L13。
- Consumer 只 inject Definition，不依赖具体 Provider：`capability-seams/01` L23-24、L47-50。
- 一次 bash：model tool/call → `tools/pre-execute` → `ctx.shell.resolve` → `ctx.sandbox.confine` → `ctx.subprocess.spawn`：`capability-seams/02` L9-17 全文。
- `ctx.sandbox` 只在 spawn 前包 argv，不迁移 `ctx.fs`，也不是完整远程世界：`02` L17、L24-26；`00` L29-31。

FAQ 及 03表 "Definition/Provider/Consumer 三角色落地一次 bash 链路" 准确。

---

## 5. 换后端换 bundle/profile patch 两行、Consumer 不动（E2B）、HMR 坏配置保留旧树

结论：**已确认**。

- 换 E2B：把 local 的 subprocess/fs 行换成 e2b 那两行（外加共享 owner），tool 源码不动；要改的是 bundle/profile patch，不是 Consumer：`capability-seams/01` L28-53。
- patch 按 id 整份替换 config 或 insert，无深合并：`composition/00-map.md` L23-25。
- dump 与 boot 共用 `applyEntryPatches`/`entryListSchema`：`composition/02` 全篇。
- HMR 候选失败保留上一棵好树（事务回滚）：`composition/03-user-patch-hmr.md` L19-27、L53-77；`cordis-runtime/04` L8-10；vendor/README 修改 清单 第 8 条。
- patch 顺序 = bundle → profile → home → `--patch`：`composition/00` L16-21、`01` L34-39。

FAQ "换 E2B 只替换 profile/bundle patch 两行声明，Consumer 全不动" 与源一致。

---

## 6. 会话级隔离 isolate realm

结论：**已确认**。

依据：`composition/00` L49-50 "`cordis:group` 与 Include 一起注册，使 provider 和 Consumer 可同一 `isolate` realm；agent preset 的服务隔离依赖它"；`harness-idea/05-08` L51 等多处；`harness-idea/00` 术语表 "isolate（可隔离）"。

FAQ "isolate realm 会话级服务隔离" 准确。

---

## 7. model-visible ⟺ logged 硬不变量；loop 每次重建请求比对 fail

结论：**已确认**。

- session log 是模型可重建来源；"模型可见 ⟺ 已记录"：`session-and-loop/00-map.md` L5-L7。
- invariant 断言：每个可重建请求直接 fail：`harness-idea/00-map.md` 判断二 L97-102：loop 在每次 `llm/stream` 上独立重建请求并与日志比对，不一致直接 fail，源码在 `packages/core/agent-loop/src/invariant.ts`。
- waveform / `llm/stream` 是扩展点：`system/00-map` L49 等。

FAQ 02_差异 L18 表述一致。仅一点可补：该判断出自 harness-idea"判断型"专题，不进 `_coverage` 机制核验矩阵（`harness-idea/00` L119）；属于 digest 判断层 + 源码落点的确信，非独立第三方核验。可作为" 采信级别：高（有源码文件）"处理，无需改文。

---

## 8. 动态可读性：`--dump-config` / `cordis_inspect` / 生成目录

结论：**已确认**（含一个可选补标）。

- `--dump-config`：`composition/02-dump-与boot-保真.md` 全篇；dump 与 boot 共用 `applyEntryPatches`、`entryListSchema`、空根。`harness-idea/05-dynamic-legibility.md` L7-11。
- 生成目录（tool/config/persistence/event-producer-consumer/module-graph/capability-seams/cordis-api）：`harness-idea/05` L13-15。
- `cordis_inspect` 只读 sections plugins/services/tools/api/events/temporary：`harness-idea/05` L17-25。

可选注意：`cordis_inspect`/`cordis_mount` 只在显式启用 `dsh-tool-cordis` 的组合里可用，是 **opt-in 开发工具、非产品默认**（`harness-idea/05` L30、L38）。FAQ 把 `cordis_inspect` 列为 DSH 动态可读性的一处代表，建议补"opt-in"提醒，否则读者可能以为默认就有。

---

## 9. 参与阶梯 L0-L3

结论：**已确认**。

- L0 配置 / L1 扩展点 / L2 seam / L3 loop：`harness-idea/04-participation-paths.md` L9-20（"四层阶梯"表，L13/L14/L15/L20 分别对应 L0/L1/L2/L3）。FAQ 04 及表格"L0 → L3 四层参与阶梯" 准确。

---

## 10. DSH 硬伤（harness-idea/07 诚实成本，逐条对照）

| FAQ 硬伤 | FAQ 来源 | harness-idea/07 依据 |
|---|---|---|
| 静态代码 ≠ 实际系统；`--dump-config` 是排障第一证据 | 04 硬伤1 | 07 L100-100（诚实成本 L97-111 表） |
| 动态依赖放大因果链；排障要查 fiber epoch 与一致 | 04 硬伤1 | 07 L104；另 `cordis/01` 显示 inject 由服务 uid 触发重载（epoch 由依赖 fiber uid 拼接） |
| 可逆 ≠ 事务（effect 不能补偿网络/txn/IO） | 04 硬伤2 | 07 L105 |
| 插件化 ≠ 安全（inject 挡不住 import Node API） | 04 / 01，L37等 | 07 L106；对应"self-modification 是 opt-in、bash-equivalent trust" |
| **元框架 vendor 成新核心**：本地修改 18 条 | 04 硬伤2 | 07 L107；实测 `vendor/README.md` L33-50 恰好列了 **18 项 Local modifications** ✓ |
| 性能无量化，open question | 04 硬伤4 | 07 L108 |
| **外置维护税**：1486 个 note + 数十门禁 + 100% coverage | 04 硬伤3 | 07 L99 L109；实测 `.agents/notes/**/*.md` 恰 **1486** 个 ✓；`scripts/` 下 `verify-*` 门禁数十个（约 40+）✓；`docs/testing.md` L10 "per-file 100% coverage on `packages/*/*/src`" ✓ |

FAQ 硬伤全部与 07 逐条吻合，实测数字（18、1486、100%）全部复现。

---

## 11. 适用判据："主要复杂度是组合关系才值得学 dsh"

结论：**已确认**。

`harness-idea/07-boundaries-costs-fit.md` L129：
> "如果你的主要复杂度是**组合关系**，dsh 的形状值得学；如果只是想要一个清晰的 loop + 扩展 API，先学它的外置纪律，不必搬它的运行时做法。"

FAQ answer L15 -- 16 / 01 引用一致。FAQ 判断 pi 恰属"后者"是 FAQ 自身论证，不在本次 DSH 侧核算范围。

---

## 存疑 / 需注意项（不构成事实错；均已落入 FAQ 正文）

1. **`cordis_inspect`/`cordis_mount` 是否为默认**：FAQ把 `cordis_inspect` 列进动态可读性，未标注它是 opt-in、非产品默认。建议在 04/03 表补一句。
2. **`dsh-base` 默认层与"DSH 无默认值"**：03 表"DSH 默认值=无（全靠插件树跟 profile 指定）"。DSH 有 `dsh-base` 作为每个 profile 的第一层，提供默认组合基线；因此"无默认值"措辞略夸张。建议改为"默认由 bundle/profile 组合提供，不内置单一工具集"。
3. **第 7 点的"硬不变量"出处层级**：是 harness-idea 判断（附源码路径），非独立第三方核验；可信度高但仍属自证。可在标注注明。
4. **"运行时装卸插件"**：04 优势 1"运行时装卸、self-modification"。这是 opt-in `dsh-tool-cordis` 的能力（`harness-idea/05`），且 FAQ 已承认"插件化≠安全、self-modification 是 opt-in"，表述与源一致，无需改。
5. **"new Context() 硬编码根"括到 Loader/Boot**：见第 1 点，纯措辞。

---

## 总评

**FAQ《06_pi_vs_dsh》对 DSH 侧的知识准确性：高。** 全部 11 个重点核查点与 DSH 消化材料逐句吻合；数字型断言（vendor 本地修改 18 条、1486 note 文件、verify-* 门禁数十、per-file 100% coverage）全部实测复现。未发现事实性错误或不实曲解；仅 3-5 处边界措辞或"默认/opt-in"标注不够精细，均不改变结论。

### 修正建议（按优先级；均已落入 FAQ 正文，此处仅存记录）

1. `cord_inspect` / `cord_mount` 是 opt-in，非产品默认——可在 04/03 表动态可读性一栏加注。
2. 03表"DSH 默认值=无"措辞：DSH 有 `dsh-base` 默认层，建议改为"默认由 bundle/profile 组合提供，不内置单一工具集"。
3. 02/03 把 `model-visible ⟺ logged` 标注为"harness-idea 判断结论（有源码 invariant.ts 落点）"，口径更诚实。
4. 第 1 条可附一句"Loader 由 `boot()` 安装，不属 `new Context()` 根"的精确措辞。
5. （超纲）pi 侧断言与"核心没有消失"的 pi/DSH 对照内容不在本任务，如需可另行核对 pi 侧。

其余所有 DSH 断言均可原样保留。