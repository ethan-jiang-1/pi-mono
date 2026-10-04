# 10 — Extension Repo 测试策略搭建指南：从 DSH 插件测试政策到 pi 生态

> **本篇自足**：没读过 DSH 的源政策也能照做。源政策是 DSH 仓（DeepSeek Harness，另一个 agent 产品的仓库，非 pi-mono）的插件测试三件套：`08-plugin-testing.md`（政策）、`09`（实战）、`10`（检查单）；本篇把它移植成"今后建 pi extension repo 时怎么搭测试策略"。回答三件事：**①源政策的设计方法**（构思层——它为什么长这样）；**②移植到 pi 时什么平移、什么反转、什么新增**；**③照什么搭**（文档结构、harness 车道、证据阶梯、检查单）。机制以 pi-mono `v1.0.0` 实测为准，文内锚点全部核验过。[08 篇](08-extension-testing-playbook.md)讲"单个扩展怎么测"，本篇讲"整个 extension repo 的测试策略怎么定"，互补不重复。
>
> **名词速览**（本篇用到的 pi 机制）：**ExtensionAPI**——扩展工厂收到的注册接口（`pi.registerTool/on/...`）；**扩展**——default export 一个工厂 `(pi: ExtensionAPI) => void` 的 TS/JS 模块，由 pi 用 jiti（免构建的 TS 加载器）从扩展目录直接加载；**AgentSession**——pi 的会话对象，持有模型、工具、转录与扩展运行时；**脚本化模型**——按剧本吐响应、不发真请求的模型替身（pi 仓内叫 faux provider）；**台阶**——证据的递进层级（本篇第四节）；**车道**——测试的执行方式分级（本篇第六节 A/B/C）。

---

## 一、源政策的设计方法（构思层）

DSH 三件套的价值不在具体条款，而在**条款的生成方法**。提炼出六条设计原理：

| # | 原理 | 源政策的体现 |
|---|---|---|
| 1 | **证据按"事故成本"排阶梯，不按测试学概念排** | 台阶一（导出守卫）一行断言，却挡住过最贵的生产事故；REAL composition 最贵，放最后且只测"组装语义"，不重复测行为 |
| 2 | **组合的形状跟着"承诺"走** | 不按文件数抄样板——工具插件承诺行为+Config，provider 承诺可选性+拓扑，guard 承诺"什么时不做"；先写承诺，再挑组合 |
| 3 | **只 stand-in 最外层包装**（keep everything downstream real） | 挂真依赖服务，只把 parent Agent 换成带真 Session 的假体；断言从注册后的真入口进，不直调插件导出的函数 |
| 4 | **每个 stand-in 写明自己证明不了什么** | 测试文件头注释自述意图；README 带已知限制节；mock 不自欺清单 |
| 5 | **组装语义与发布形态两级分离** | 进程内真 Loader boot（快，断言 Config 与拓扑）/ 子进程 smoke（慢，断言发布形态与可选性）分工，互不重复 |
| 6 | **检查单自足** | 计划时三问 → 写测试时对表 → PR 清单 → CI 车道 → 反例清单，没读过其他篇也能照做 |

**搭自己策略时先回答四个问题**（这是构思框架，不是清单；pi 侧的答案在第三、四节给出）：

- **Q1 事故从哪来？** 你的生态里，"最便宜能挡最贵事故"的那一行断言是什么？（每个生态答案不同——DSH 是 default export，pi 不是，见三.1）
- **Q2 扩展按承诺分几类？** 每类的承诺用一句话说出来，测试组合从承诺推出。
- **Q3 栈里哪层是"最外层包装"？** 它是唯一允许的 stand-in；其余必须是发货代码。
- **Q4 组装的"真入口"是什么？** 手工拼装为什么不算证据？真加载器读真目录/真配置的那条路怎么进测试？

---

## 二、机制映射表（DSH → pi）

| DSH 机制 | pi 对应 | 移植判断 |
|---|---|---|
| 插件 = npm 包，named exports `name`/`inject`/`Config`/`apply`，**禁 default export** | 扩展 = TS/JS 文件或目录，**default export factory** `(pi: ExtensionAPI) => void`，jiti 直载 | **反转**（见三.1） |
| Loader + `cordis.yml`（每行一个插件 + config 块） | extensions 目录 discovery（user/project/explicit）+ pi packages manifest | 平移：装配由"声明式 YAML"变"目录约定 + manifest"，真加载路径同样可测 |
| fiber：dispose 即撤销该插件全部贡献（HMR 机制基础） | `ctx.reload()` 替换整个 extension runtime；`session_shutdown` 清理；取消/session 替换/进程退出收敛同一路径 | **面更宽**（见三.3）：pi 侧生命周期测试是"清理幂等矩阵"，不止 dispose 一个动作 |
| registry 贡献（ToolRuntime/命令/投影），注册必须可撤销 | `pi.register*()` + `pi.on()`（返回 unsubscribe；tools 不可注销，用 `exposure: "hidden"` 撤回） | 平移 + 一条 pi 特有约束：不可注销的工具要测"撤回"路径 |
| MockAdapter 脚本化模型（唯一常见 mock） | 仓内：faux provider（`@earendil-works/pi-ai/compat`）；公开 API：`pi.registerProvider()` 注册脚本化 provider | 平移：mock 白名单精神一致——网络/时钟才可 mock，模型永远脚本化 |
| ctx 服务栈 + 全真 harness（AgentLoop + LLM + Session + 工具） | `AgentSession` 全栈 + `test/suite/harness.ts`（仓内参考实现，**未随包导出**） | 平移，但有分发含义（见六.2）：外部 repo 自带薄 harness，参考实现抄仓内 |
| `unwrapExports` round-trip 导出守卫 | default export 是函数 + 跨加载行为一致（见三.1） | **反转**（见三.1） |
| 快照录制回放（210 场景无 key 复验 model-visible 面） | 脚本化模型驱动全真会话，断言持久化分支（`sessionManager.getBranch()`）里的转录 | 平移：pi 没有独立快照子系统，转录断言直接落在 session 条目上，效果等价 |
| host/client 双 face + i18n 门 | 四模式矩阵：`tui` / `rpc` / `json` / `print`；`ctx.hasUI` 门控 | **新增**（见三.4）：pi 扩展直接活在四种模式里，这是 DSH 政策没有的维度 |

---

## 三、四个移植要点（反转与新增）

### 1. 导出守卫方向反转

DSH 的事故形态是"多写了一个 `export default`"；pi 的形态**就是** default export factory，所以守卫不能照抄。pi 侧真正便宜的断言是两条：

```ts
import ext from "../src/index.ts";

it("default export is a factory", () => {
  expect(typeof ext).toBe("function");
});

it("factory behaves identically across loads", async () => {
  // captureRegistrations：车道 A 记录器（约 30 行）——捕获 register*/on 的调用并记下注册集
  expect(captureRegistrations(ext)).toEqual(captureRegistrations(ext));
});
```

第二条为什么必要：pi 的扩展模块可能被多次加载（reload 换 runtime、factory 有缓存机制），**模块里任何可变状态只会在其中一种模式下表现正确**——两次加载的注册集必须一致，这一条把"模块级累积状态"这类隐患在台阶①就挡掉。

**诚实声明**（原理 4）："factory 内不起 timer/socket/process"是 pi 文档明令的契约，但**不是一两行断言能挡住的**——它归代码评审与反例清单管，策略里不许假装它是被测试保证的。

### 2. "真 Loader 读真 cordis.yml" 的 pi 对应

手工 `ctx.plugin()` 在 DSH 不算组装证据；pi 侧的对位反例是**只用 `loadExtensionFromFactory()` 充当加载证据**——它跳过了 discovery、jiti 解析、目录约定和 package.json 依赖。两级照搬：

- **进程内**：真 `loadExtensions([extPath], cwd)` 对着一个真的临时 extensions 目录（含 `package.json`、可能的 pi manifest）跑，断言 `{ extensions, errors, runtime }` 的拓扑——锚点 `test/extensions-discovery.test.ts:538`；
- **子进程 smoke**：发布/安装形态（pi packages）用极简 driver 加载后向 stdout 打 JSON 拓扑再断言；可选依赖缺席时不 probe（DSH `PATH: ''` 的对位：比如 git 缺席时 git 类扩展不得起子进程）。

### 3. 生命周期面更宽：清理幂等矩阵

DSH 的 HMR-safety 只有一个动作（dispose fiber）。pi 的文档明说"取消、reload、session 替换、进程退出会收敛到同一条清理路径"，所以 pi 侧的台阶三展开成**矩阵**：

| 动作 | 断言 | 锚点 |
|---|---|---|
| `session_shutdown` | 资源归还，连调两次不炸（幂等） | pi 文档"Keep cleanup idempotent" |
| `ctx.reload()` | 旧 handler 不再收到事件（事件总线监听被移除） | `regressions/7193-event-bus-lifecycle.test.ts`（"removes extension-owned event-bus listeners on reload and dispose"） |
| session 替换 | 旧 ctx 上的调用被拒/失效 | `regressions/2860-replaced-session-context.test.ts` |
| handler 自移除 | `pi.on` 返回的 unsubscribe 生效且不误伤相邻 handler | `extensions-runner.test.ts:1231`（"allows self-removal without skipping neighboring handlers"） |

### 4. pi 特有：四模式矩阵

扩展同时活在 `tui`/`rpc`/`json`/`print` 四种模式：交互/通知在 `ctx.hasUI` 时才可用，custom 组件只在 tui 可用，json/print 无 UI。**策略条款：行为与渲染分离是可测断言**——每个有 UI 交互的扩展，至少一个用例在无 UI 假体（`createTestUiContext` 默认全 no-op）下走完主路径，证明功能不依赖渲染。这是 DSH 政策里没有、pi 生态必须新增的一条。

---

## 四、pi 版五阶证据阶梯（对表）

| 台阶 | pi 侧最小证据 | 挡的事故 | 锚点 |
|---|---|---|---|
| ① factory 形态守卫 | default export 是函数；跨加载行为一致（三.1） | 加载即坏；reload 后行为漂移 | 仓内无统一固化——**这正是新 repo 要补的第一条** |
| ② 行为 spec | 真 `AgentSession` + 脚本化模型，经 `session.prompt()` 真入口驱动，断言 `session.messages` / 注册表状态；UI 用 `createTestUiContext` | 行为错误；绕过真入口的假绿 | `test/suite/agent-session-tool-orchestration.test.ts` |
| ③ 清理幂等矩阵 | 三.3 的四行动作各一断言 | 长会话/热重载下的慢性泄漏 | `regressions/7193`、`regressions/2860`、`extensions-runner.test.ts:1231` |
| ④ REAL composition | 进程内真 `loadExtensions` 读真临时目录；可选升级：子进程 driver smoke | 单测绿但装配坏；可选依赖缺席时误启动 | `extensions-discovery.test.ts:538`；子进程形态抄 DSH `subagent-codex` |
| ⑤ 转录断言 | model-visible 改动（新工具声明、system prompt delta、`appendEntry`）在持久分支有条目 | model-visible 面静默漂移 | orchestration test L109–112（`nestedCalls` 随分支持久化的断言写法） |

每阶都能说出它挡的事故类型，说不出就砍掉——这是原理 1 在 pi 侧的推演方式。

**行为 spec 可抄骨架**（pi-mono 仓内车道写法；外部 repo 用 SDK 等价拼装，见 6.2）：

```ts
import { fauxAssistantMessage, fauxToolCall } from "@earendil-works/pi-ai";
import { createHarness, getToolResult, type Harness } from "./harness.ts"; // 仓内参考实现

const harness = await createHarness({
  initialActiveToolNames: [],
  extensionFactories: [myExtension],           // 被测扩展（default export 工厂）
});
await harness.session.bindExtensions({});
harness.setResponses([
  fauxAssistantMessage([fauxToolCall("my_tool", { path: "a.txt" })], { stopReason: "toolUse" }),
  fauxAssistantMessage("done"),
]);
await harness.session.prompt("go");            // 真 agent loop + 真工具分发

const result = getToolResult(harness, "my_tool");
expect(result.content).toEqual([{ type: "text", text: "..." }]);   // 断言结构化结果，非输出关键词
```

---

## 五、按承诺挑组合（六类扩展）

| 扩展类型 | 承诺（一句话） | 必抄组合 |
|---|---|---|
| **tool**（`registerTool`） | 行为、参数校验、exposure/annotations 语义 | 台阶 ②+④+⑤；exposure 用 `getActiveToolNames()`/`getCallableToolNames()` 断言（orchestration test L78–82 的写法） |
| **guard/permission**（`tool_call` 拦截、路径保护、确认门） | **什么时"不"拦** | 先写负例矩阵（透传/不触发/放行），再写触发分支；并发语义一例：pi 同批工具调用**并行**，guard 不得假设兄弟调用存在（pi 文档明令）；自移除一例（三.3 第四行） |
| **provider/可选依赖** | 缺席时不 probe 不启动；在场时拓扑正确 | 台阶 ④ 子进程 smoke + `PATH: ''` 类比 + 拓扑 JSON 逐项断言 |
| **UI/widget/命令渲染** | 模式降级正确、文案随 locale | 三.4 模式矩阵 + `createTestUiContext` 收集器断言 `notify`/`setWidget` 调用 |
| **LLM-backed**（嵌套模型调用） | 对脚本化模型工作；取消/超时路径正确 | 脚本 provider + signal 取消 reject 传播 + 坏 JSON 各一例；真模型验证归 evals 车道或手动，CI 一律 faux（pi-mono 根 AGENTS.md 红线，不同于 DSH 的 with-key e2e 成对） |
| **event-transform**（`input`/`context`/`message_end`/`before_agent_start`） | 不改写时透传无损 | 负例（返回 undefined 透传）+ 改写分支 + "transcript delta 被记录"（⑤） |

**移植纪律**（原理 2）：换扩展名、工具名、事件类型三个标识符，组合形状不变；先写承诺再挑文件，不按文件数抄。

---

## 六、repo 搭建蓝图

### 6.1 文档结构（对位 DSH 三件套）

```
docs/testing/
  01-strategy.md      # 五阶阶梯 + 名词表（对位 DSH 08）
  02-playbook.md      # 六类组合解剖 + 可抄骨架（对位 DSH 09，锚点指向本 repo 真扩展）
  03-checklist.md     # 自足 PR 检查单 + 反例清单 + CI 车道（对位 DSH 10）
test/
  harness.ts          # 共享薄 harness（放 vitest include 之外，只被测试 import）
extensions/<name>/
  index.ts
  test/               # 每个扩展一组 spec，按承诺对表
```

### 6.2 harness 三车道（关键工程决策）

| 车道 | 用什么 | 适用 | 成本 |
|---|---|---|---|
| A 契约 | 薄记录器（约 30 行）：捕获 `register*`/`on` 的参数，之后手动触发被捕获的 handler | **只限纯逻辑 handler**：event 进、返回值出，无会话状态 | ~1ms |
| B 进程内真会话 | 公开 SDK：`createAgentSession` + `DefaultResourceLoader`（`extensionFactories`，见 `examples/sdk/06-extensions.ts`）+ 脚本化 provider（一个测试夹具扩展调 `pi.registerProvider()`，见 `examples/sdk/02-custom-model.ts` 与 `docs/custom-provider.md`） | 集成证据的唯一来源：真 agent loop、真工具分发、真转录 | ~10ms/会话 |
| C 子进程 smoke | spawn `pi --extension driver`（或安装形态），断言 stdout JSON | 发布形态、可选性、跨扩展命名冲突 | ~秒级 |

**分发事实**（决策依据）：pi 的测试 harness 在 `packages/coding-agent/test/` 内，**未随包导出**（package.json `exports` 只有 `.`/`rpc-entry`/`client`/`experimental/plugin`）。外部 repo 拿不到现成 harness，必须自带薄层——车道 B 用公开 SDK 拼（两个官方例子就是拼块），仓内 `test/suite/harness.ts` 是抄写模板而非可 import 的依赖。车道 A 的 mock-API 风格在 pi 仓内大量存在（`plan-mode-extension.test.ts` 等），**收口条款：它只许测纯逻辑 handler，集成证据必须出自车道 B**——这是把 DSH"hand-built 充当组装证据不算数"投影到 pi 的现存双风格上。

### 6.3 CI 车道与检查单要点

- 单测进 CI（pi-mono 仓内惯例是 `./test.sh`；外部 repo 用自己的 CI 入口脚本等价实现）；**faux-only 红线**：车道 A/B 零网络零 key，脚本化模型是唯一常见 mock（网络/时钟才可 mock）；
- 检查单三问（对位 DSH 10"计划时"）：会动 model-visible 面吗（→⑤）？会发布安装形态吗（→④-C）？有可选依赖吗（→④-C 缺席分支）？
- 每个 PR 的最小证据 = 台阶对表答得上"样板在哪、我的对应文件在哪"，答不上的行就是缺口。

---

## 七、反例清单（前四条明文拒绝，后三条是 pi 生态实际会踩的坑）

1. **whole-`ExtensionAPI` mock 充当集成证据**——车道 A 只许测纯逻辑 handler；对 agent loop、工具分发、转录的断言必须经车道 B。
2. **对模型输出做关键词探测**——"a keyword probe on the agent's own output lets a cheating agent pass"；断言 session 条目、工具结果结构、持久分支、文件系统等外部事实。
3. **factory 内起 timer/socket/process**——pi 文档明令；评审条款，别假装有测试兜底（三.1）。
4. **手工拼 ctx / 单独 `loadExtensionFromFactory` 充当组装证据**——同 DSH 反例 1 的 pi 对位（三.2）。
5. **只在 tui 模式测**——四模式矩阵缺行（三.4）。
6. **真 API key / 真 token 进测试**——pi-mono 根 AGENTS.md 红线，脚本化模型之外一律禁止。
7. **为凑绿 sleep / 弱化断言 / 改归一化器**——掩盖性修法，逐条拒绝。

---

## 八、最小例证（验证这套策略不是空话）

1. **五阶对表可执行**：在 pi-mono 仓内拿一个真实扩展（`examples/extensions/todo.ts` 是现成对象）逐阶写一遍——①三.1 两条断言、②上节骨架的真入口用例、③三.3 矩阵四行、④临时目录 `loadExtensions`、⑤`getBranch()` 转录条目；跑通即证明阶梯可落地，然后把骨架（harness.ts + 检查单）平移到 extension repo。
2. **车道 B 可行性有官方例子**：`packages/coding-agent/examples/sdk/06-extensions.ts`（SDK 带扩展）+ `02-custom-model.ts`（自定义模型即脚本化 provider）——外部 repo 薄 harness 的两个拼块都有官方参考，本篇已核验文件存在。
3. **反例可检索**：政策原文条款都有出处（本篇第三节、第七节各条对应的 pi-mono 源文件与 DSH 篇目）。
