# 04 · codemode:模型写代码编排工具调用

codemode 是 pi 在 v1.0.0 转正的内置工具(`packages/codemode/README.md:5`:"The coding agent uses it for its built-in `codemode` tool"):模型写一段 JS,脚本在 QuickJS-WASM 沙箱里运行,**唯一的能力是调用注入的工具**。它是 pi 阶梯上"代码持有控制流"的那一级——最接近 DSH workflow 的东西,但编排对象是**工具调用**,不是子代理。

## 为什么是这个形状:设计考量

README 开篇第一句就是全部合同:"Runs model-written JavaScript in a QuickJS VM (compiled to WebAssembly) where the only capability is calling injected tools. **Nested tool calls never enter the LLM context; only the script's output and return value do.**"(`packages/codemode/README.md:3`)。

这条合同回答的是扇出型工具工作(批量读文件、聚合多个来源、多步数据变换)的上下文经济学:逐轮委派时,每个中间工具结果都要付一次 LLM 上下文的钱;把循环搬进代码,中间结果留在 VM 里,**只有脚本吐出的 output 和返回值进上下文**。与 DSH workflow 的对照:`agent()` 钩子让脚本扇出子代理(隔离的是整个 agent 上下文);codemode 让脚本扇出工具调用(隔离的是工具结果的上下文)——**同一思想("脚本而不是对话持有循环、分支与中间结果"),作用在更轻的一级**。

## 机制

### 脚本能用什么(封闭清单)

- `tools.<name>(args)`:调用注入工具,参数与结果做 JSON 往返;非法标识符字符转 `_`(`README.md:40`);
- `ALL_TOOLS`:列出全部注入工具的 `{ name, description }`(`:41`);脚本可以**先发现再调用**——这是沙箱内的自省面;
- `text(value)` / `image(...)` / `console.*`:向 `result.output` 追加内容(`:42-44`);
- `store(key, value)` / `load(key)`:跨次执行的 JSON 状态,单值上限 256 Ki、总量 1 Mi(`:65`);
- `exit()`:立即成功结束,保留 output 与 store 写入(`:44`);
- **没有别的**:no timers、`fetch`、`process`、`require`、modules、`WebAssembly`;`eval`/`Function` 只能在同一 VM 里产生更多代码(`:47`)。

### 资源与终止

- `timeoutMs` 默认有期限,`Infinity` 显式免除;**"等一个永远无法 settle 的 promise"会立即失败而不是挂死**——VM 无 timer 无 I/O,宿主能识别这种死态(`:49`);
- `memoryLimitBytes` 封顶 VM 堆,超限在脚本内部抛 `InternalError: out of memory`(`:51`);
- 输出封顶(v1.0.1,#10283):`text()`/`image()`/`console.*` 桥接到宿主的输出也有限额——超过 `MAX_OUTPUT_CHARS`(16 Mi 字符,含 base64 图像数据)或 `MAX_OUTPUT_ITEMS`(10 万条)即以 `RangeError` 失败脚本(`packages/codemode/src/runtime/prelude-source.ts:40-41`)。此前 VM 堆有 `memoryLimitBytes` 但宿主侧留存无限额:一个死循环 `console.log` 能把**宿主进程**内存耗到崩溃;item 上限正是堵"循环打印空串"的绕过。

### 状态语义

`store`/`load` 的持久性由宿主决定:沙箱自己不存,宿主把当前值作为 `options.store` 传入,成功结果报告 `result.storeWrites`(`{ set, delete }`),失败执行报告**无写入**(`:55`)——"失败的脚本不产生状态副作用"是显式合同。这给了宿主(比如未来的会话层)决定把脚本状态记在哪的自由。

### lockdown:built-ins 冻结与桥校验(Unreleased,b223082bb)

"唯一能力是注入工具"的合同此前有一个软肋:prelude 与模型脚本**共享同一套 VM built-ins**,prelude 用 `JSON.stringify` 把返回值、store 写入、错误描述序列化后经 bridge 发给宿主。脚本若改写 `Array.prototype.toJSON` 或整个替换 `globalThis.JSON`,序列化桥即被劫持——prelude 发出的 payload 畸形,宿主在 worker message listener 里同步 `JSON.parse` 抛错,直接变成宿主进程的未捕获异常且 `execute()` 永不 settle(注入工具的调用结果同样经这条桥往返,payload 一坏整条执行链失效,#10444)。

修复落在两侧:

- **VM 侧冻结**:prelude 最前面的 `lockdown()` IIFE(`packages/codemode/src/runtime/prelude-source.ts:56-135`)BFS 遍历 `globalThis` 自有键与从实例够到的 intrinsics,逐个 `Object.freeze`;built-in global 的数据属性改只读不可配置。freeze 的经典坑"override mistake"(原型上只读数据属性会让实例赋值也抛)用 accessor 化化解:`OVERRIDABLE` 集合(`constructor`/`name`/`message`/`toString`/`toLocaleString`/`valueOf`/`toJSON`)与 `Object.prototype` 全部成员转 getter/setter——实例上定义自有属性仍可用(`class MyError extends Error` 里 `this.name = "MyError"` 照常工作),对原型本身赋值抛 `TypeError`。
- **宿主侧校验**:每个 worker payload 经 `parseBridgeJson`/`parseStoreWrites`/`parseScriptError` 严格校验形状,不合法即 `BridgeError`(`packages/codemode/src/runtime/host.ts:54-95`);message listener 包 try/catch,`BridgeError` 以 sandbox 错误收场("Sandbox bridge broken: ... The script may have modified built-ins",`:200-211`);`finish()` 本身不再解析 JSON,返回值在 finish 之前解码完毕——"worker 消息 = 可信输入"的假设废除。

这对 :9 "中间结果留在 VM 里"的可靠性边界是实质加固:脚本不能再借原型改写污染序列化桥。但它不触及进程边界——冻结的是 **VM 能力面**,注入工具仍以宿主权限执行("无进程级隔离"结论保留,见下节)。

### 图像:输出落盘与读图返回 image block(coding-agent 侧)

- **出**:`image()` 的输出此前无法再次引用——脚本不能写文件、`write` 工具只收文本。v1.0.3 起 codemode 结果里的每个 image item 在截断**之后**统一落盘,前面插入 `[Image saved to <path> (…)]` 文本标签(`saveImages`,`packages/coding-agent/src/extensions/codemode/execute.ts:281-313`;截断后执行,路径永不与图片分离);输出文件统一经 `src/utils/output-files.ts` 创建,权限 **0o600**、`wx` flag 防符号链接抢占,写盘失败降级为标签文本而非丢结果(#10310)。
- **进**:`tools.read()` 读图片文件返回 image block 而非 resize 提示文本——read 工具新增 outputSchema(`string | {type:"image", data, mimeType, note}` 联合,`packages/coding-agent/src/core/tools/read.ts:33`),结果包成 `structuredContent`(`:216`),脚本可直接把它喂给 `image()` 展示(#10251)。
- **guidelines 随声明走**:codemode 的工具声明现在把 prompt guidelines 渲染成 bullet 追加到 description(`toCodemodeDeclaration`,`packages/coding-agent/src/extensions/codemode/tool.ts:160-174`)——隐藏工具的 guidelines 从 system prompt rules 迁到工具声明,脚本自省面(`ALL_TOOLS`)拿到的描述自带使用约束(#10343)。

## 边界与上限

- **编排的是工具,不是 agent**:脚本里没有"起一个子代理"的原语;要委派,得把 subagent 之类做成注入工具(内置组合未提供)。
- **无进程级隔离**:QuickJS 隔离的是 VM 能力面,不是操作系统权限;脚本调用的工具以宿主权限执行——与 pi"无沙箱、边界在进程外"的一贯立场一致([`harness/02-Boundaries/2.1`](../harness/02-Boundaries/2.1_no_sandbox.md))。lockdown 冻结的同样是 VM 能力面(见上),不改变本条结论。
- **一次性执行**:脚本跑完即结束,没有跨 run 的恢复点;`store` 是唯一的跨执行状态,且要宿主配合保存。
- 结果是否进上下文、以什么预算截断,由 coding-agent 的内置工具层决定,不在本包合同内。

## 与相邻原语的关系

- 比 [03](./03-subagent.md) 轻:同一"隔离执行"需求,委派整 agent 用 subagent,聚合工具调用用 codemode;
- MCP server 的工具可以作为注入工具进脚本——`README.md:5` 明说本包可独立用于"remote APIs, MCP servers, application services",与 [05](./05-ecosystem-tools.md) 天然组合;
- DSH 侧的完整对照(脚本如何托管模型写的代码、meta 为何不进脚本头、schema 为何手写子集校验)见 DSH `_digested/orchestration-ladder/01`;pi 侧对应的取舍记录在 codemode 包内(无 pi 依赖、独立可用)。

## 源码入口

| 路径 | 一句话 |
|------|--------|
| `packages/codemode/README.md:3` | 核心合同:唯一能力是注入工具;嵌套调用不进 LLM 上下文 |
| `packages/codemode/README.md:5` | 脚本词汇表与内置 `codemode` 工具 |
| `packages/codemode/README.md:40-47` | 脚本能力封闭清单 |
| `packages/codemode/README.md:49-51` | 超时与内存上限;死态立即失败 |
| `packages/codemode/README.md:55-65` | store/load:宿主持久、失败无写入、容量上限 |
| `packages/codemode/src/runtime/prelude-source.ts:40-41` | 输出封顶常量 MAX_OUTPUT_CHARS / MAX_OUTPUT_ITEMS |
| `packages/codemode/src/runtime/prelude-source.ts:56-135` | lockdown:built-ins 冻结与 OVERRIDABLE accessor 化 |
| `packages/codemode/src/runtime/host.ts:54-95,200-211` | 宿主侧 BridgeError 严格校验与 sandbox 错误收场 |
| `packages/coding-agent/src/extensions/codemode/execute.ts:281-313` | image() 输出落盘与 `[Image saved to ...]` 前置标签 |
| `packages/coding-agent/src/core/tools/read.ts:33,216` | tools.read() 读图返回 image block |
| `packages/coding-agent/src/extensions/codemode/tool.ts:160-174` | 工具声明附 guidelines(toCodemodeDeclaration) |
