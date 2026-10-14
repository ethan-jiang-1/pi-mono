# 答案：pi-mono TUI 快捷键

## 一句话

pi-mono 的 TUI 是自研 terminal 渲染器（`packages/tui`，依赖仅 `get-east-asian-width` + `marked`，无 react/ink）渲染的一个终端应用，它是 SDK 的 **consumer**——所有 TUI 操作最终都调 `AgentSession` 的方法。快捷键定义在 `packages/coding-agent/src/core/keybindings.ts`，可以通过 `~/.pi/agent/keybindings.json` 自定义。

---

## TUI 和 SDK 的关系

```
┌─────────────────────────────────┐
│ TUI (自研渲染器)              │  ← 终端用户看到的
│   interactive-mode.ts           │
│   └─ 快捷键 → AgentSession 方法 │
├─────────────────────────────────┤
│ AgentSession (SDK)              │  ← 核心 runtime
│   prompt / steer / setModel ... │
├─────────────────────────────────┤
│ Agent + AgentHarness + Tools    │  ← agent 内核
└─────────────────────────────────┘
```

TUI 只是一个参考实现。**所有快捷键能做到的事，SDK/RPC 都有等价方法。**

---

## 完整快捷键列表

定义在 `packages/coding-agent/src/core/keybindings.ts`。

### 核心操作

| 快捷键 | 动作 | 说明 |
|--------|------|------|
| `Escape` | 取消/中断 | 中断当前 agent run |
| `Ctrl+C` | 清空编辑器 | `app.clear`，只清空编辑器（**不复制**——复制是 `Ctrl+X`，见下） |
| `Ctrl+D` | 退出 | 编辑器为空时退出 pi |

### 模型和思考

| 快捷键 | 动作 |
|--------|------|
| `Ctrl+P` | 轮换到下一个模型 |
| `Shift+Ctrl+P` | 轮换到上一个模型 |
| `Ctrl+L` | 打开模型选择器 |
| `Ctrl+T` | 折叠/展开 thinking block |
| `Shift+Tab` | 轮换 thinking level（off→minimal→low→medium→high→xhigh→max） |
| `Ctrl+S` | 把当前 thinking level 存为全局默认（`app.thinking.save`，只在 `/thinking` 选择器里生效） |

### 工具和输出

| 快捷键 | 动作 |
|--------|------|
| `Ctrl+O` | 折叠/展开工具输出 |

### 消息操作

| 快捷键 | 动作 | key 名 |
|--------|------|--------|
| `Ctrl+X` | 复制最后一条 assistant 消息；v0.84.4 起全屏下有活动选区时**优先复制选区** | `app.message.copy` |
| `Ctrl+G` | 用外部编辑器打开当前消息 | `app.editor.external` |
| `Alt+Enter`（Windows `Ctrl+Q`） | follow-up（新起一轮对话） | `app.message.followUp` |
| `Alt+↑`（Windows `Alt+Q`） | 取回队列中的消息 | `app.message.dequeue` |
| `Ctrl+V` | 粘贴剪贴板图片 | `app.clipboard.pasteImage` |

### Session 管理

**注意：`app.session.new` / `tree` / `fork` / `resume` 目前没有默认键绑定**（`defaultKeys: []`，只能通过 keybindings.json 或命令面板触发）。实际被占用的是：

| 快捷键 | 动作 | key 名 |
|--------|------|--------|
| `Ctrl+N` | 切换命名过滤器 | `app.session.toggleNamedFilter` |
| `Ctrl+R` | 重命名 session | `app.session.rename` |
| `Ctrl+S` | 切换 session 排序方式 | `app.session.toggleSort` |
| `Ctrl+G` | 外部编辑器 | `app.editor.external` |

### Session 树内快捷键

| 快捷键 | 动作 |
|--------|------|
| `↑` / `↓` | 上下移动 |
| `→` / `←` | 展开/折叠节点 |
| `Space` | 选中/取消 |
| `Enter` | 切换到选中 session |
| `/` | 搜索过滤 |

### 模型选择器内快捷键

| 快捷键 | 动作 |
|--------|------|
| `Space` | 选中/取消（用于 Ctrl+P 轮换列表） |
| `Ctrl+S` | 保存当前选择 |
| `Ctrl+A` | 全选 |
| `Ctrl+X` | 清除所有选择 |
| `Ctrl+P` | 切换 provider 分组（`app.models.toggleProvider`） |
| `Alt+↑` / `Alt+↓` | 调整顺序（`app.models.reorderUp/Down`） |

**注意：`Ctrl+S` 在三个上下文里语义不同**——session 列表里是 `app.session.toggleSort`（切换排序），`/model` 选择器里是 `app.models.save`（把选中项存为全局默认模型），`/thinking` 选择器里是 `app.thinking.save`（把当前 thinking level 存为全局默认）。三者都默认绑定 `ctrl+s`（`keybindings.ts:20,104-106`；官方口径 `docs/keybindings.md:154-156`），互不冲突只因为各自只在对应 UI 里响应。v0.85.1 还专门修过这两个保存键的可配置性（`packages/coding-agent/CHANGELOG.md:16`："Fixed configurable save keybindings in the model and thinking selectors"）。

> 除 `app.*` 之外还有一层 `tui.*` 命名空间：它来自独立包 `packages/tui/src/keybindings.ts`（`TUI_KEYBINDINGS`），coding-agent 通过 `KEYBINDINGS = { ...TUI_KEYBINDINGS, ... }` 合并并覆盖少数平台差异。例如 `tui.altScreen.bottom`（v0.85.0 新增时为 `end`，由 `tui-alt-screen.ts:764` 消费）——**v1.0.3 起已改绑 `ctrl+end`**（`packages/tui/src/keybindings.ts:208-209`，消费点 `tui-alt-screen.ts:782-786`），见下方 v1.0.3 注记。完整键位表以 `packages/coding-agent/docs/keybindings.md` 为准。

### 匹配层：shifted 符号（v1.2.0 新增能力）

**用户可见结论**：v1.2.0 起，keybindings.json 里可以**按产出的字符**写符号键——`+`、`ctrl++` 这类写法能匹配上；`shift+=` 这种**物理键**写法同时保留。**这不是新增了默认快捷键**：默认键位表（`packages/coding-agent/src/core/keybindings.ts` 与 `packages/tui/src/keybindings.ts`）里**没有任何符号键**，所以不要读成"新增了 shift+1/! 之类"。

**要解决的问题**：Kitty keyboard protocol（flag 4，alternate keys）下终端能同时报三个 codepoint（`packages/tui/src/keys.ts:605-610`）：

```
\x1b[<codepoint>:<shifted>;<mod>u
\x1b[<codepoint>:<shifted>:<base>;<mod>u
```

按下 `Shift+=` 时终端报的是"物理键 `=`（61）+ shifted `+`（43）+ Shift 修饰位"，而用户写的是产出的字符 `+`。旧逻辑要求 codepoint 与修饰位**同时**相等，于是 `+` 谁也匹配不上：既不是 codepoint 43，`shift+=` 又多了 Shift 位。

**v1.2.0 的解法**是把匹配拆成顺序两试（`matchesKittySequence`，`keys.ts:669-702`）：

1. **physical match**：codepoint 与全部修饰位相等 → 保住 `shift+=` 写法；
2. **logical match**：对 `parsed.shiftedKey` 调 `getLogicalShiftedSymbolCandidate()`（`keys.ts:372-381`），**消费掉隐式 Shift** 但保留 Ctrl/Alt/Super → 让 `+` / `ctrl++` 成立。

源码注释（`keys.ts:685-687`）：

> Logical match: Kitty reports symbols such as "+" as Shift plus the physical "=" key. Bindings name the produced symbol, so consume that implicit Shift while preserving Ctrl, Alt, and Super. The physical "shift+=" spelling remains valid through the match above.

**两套符号集合，范围不同（易错点）**：

| 终端路径 | 集合 | 覆盖 |
|---|---|---|
| Kitty / CSI-u | `SYMBOL_KEYS`（`keys.ts:258-290`） | 宽：`` ` - = [ ] \ ; ' , . / ! @ # $ % ^ & * ( ) _ + \| ~ { } : < > ? `` |
| xterm `modifyOtherKeys`（`\x1b[27;<mod>;<code>~`） | `SHIFTED_SYMBOL_KEYS`（`keys.ts:292`） | **窄**：仅 `~!@#$%^&*()_+\|{}:<>?` |

窄集合是刻意的：只对"按 Shift 才产出"的字符做逻辑匹配，避免把 `-`、`/` 这类未按 Shift 的字符也误当 shifted。v1.2.0 同时删掉了 `matchesPrintableModifyOtherKeys` 里两道旧早退（`expectedModifier === 0` 与 `parsed.modifier !== expectedModifier` 直接 return false），这正是让 `parseKey("+")`/`matchesKey("+","+")` 在 xterm 下能工作的原因。

**与 keybindings 的关系**：`matchesKey()` 是绑定匹配入口，上面两条 logical match 就加在它里面；`parseKey()`（key-name 出口，`keys.ts:1292-1311`）用同一个 helper，保证"报出来的名字"与"能匹配的绑定"一致——否则 `+` 会以 `shift+=` 之名出现却绑不上。v1.2.0 新增测试直接锁定：`keys.test.ts:137-145`（`matchesKey("\x1b[61:43;2u","+") === true`、`=== "shift+="` 也为 true、`ctrl++` 同理）、`:275-278`、`:612-616`。

**版本归属要点（half-new）**：
- `getLogicalShiftedSymbolCandidate`（logical match 本体）**是 v1.2.0 新增**（`7f9e1198f`，`git tag --contains` 仅 `v1.2.0`）。
- 相邻的 `normalizeShiftedLetterIdentityCodepoint`（`keys.ts:364-370`，把 Shift+A 压回小写 a-z 让 `shift+E` 一致匹配）**不是** v1.2.0 新增——它来自 `6b55d6859`（首个 tag `v0.68.0`，修 xterm shifted 输入）。
- 编辑器侧对应注释在 `packages/tui/src/components/editor.ts:218`（2473 行）。

**未验证边界**：`!` 是否能经 `modifyOtherKeys` 的 logical match 匹配到（`!` 不在 `SHIFTED_SYMBOL_KEYS` 内，据此推断为**否**，仅 Kitty 路径经 `SYMBOL_KEYS` 生效）——该点未跑测试确认。

---

## 复制/显示行为（v0.84.4 起，v0.85.1 仍成立）

- **`fullscreenCopyOnSelect`** setting（默认 `true`）：全屏模式下拖选释放即复制（OSC 52）。关闭后 `Ctrl+X`（`app.message.copy`，handler 在 `interactive-mode.ts:2895-2897`，帮助文本在 `:6326`）在有活动选区时优先复制选区，否则复制最后一条 assistant 消息
- **终端能力覆盖**：settings `terminal.hyperlinks/images/trueColor` + env `PI_HYPERLINKS` / `PI_TRUE_COLOR` / `PI_IMAGE_PROTOCOL`（优先级 settings > env > 自动检测，#8665）

---

## 自定义快捷键

编辑 `~/.pi/agent/keybindings.json`：

```json
{
  "keybindings": {
    "app.model.cycleForward": {
      "keys": "ctrl+shift+right"
    },
    "app.interrupt": {
      "keys": "ctrl+g"
    }
  }
}
```

`key` 名称来自 `AppKeybindings` 接口（`keybindings.ts:14-58`）。设为空数组 `[]` 可禁用该快捷键。

---

## 架构要点

- **TUI 用自研渲染器**（`packages/tui` 的 tokenizer/布局，依赖仅 `get-east-asian-width` + `marked`，无 react/ink），源码在 `packages/coding-agent/src/modes/interactive/`
- **TUI 是 SDK consumer**——它创建 `AgentSession`、订阅事件、通过快捷键调 session 方法
- **TUI 组件**：assistant message 渲染、diff 预览、session 选择器、模型选择器、thinking 选择器、OAuth 登录对话框等
- **启动方式**：直接 `node dist/cli.js`（不给 `--mode` 时就是默认的 interactive/TUI 模式）；`--mode` 只接受 `"text" | "json" | "rpc"`（`packages/coding-agent/src/cli/args.ts:11,96-99`），**没有** `--mode interactive` 这种写法
- **没有 HTTP server**。TUI 直接跑在进程内，所有状态在内存中

---

---

## v1.0.0 注记（2026-10-02 同步，未逐项重验本篇其余结论）

- **fullscreen 成为默认 TUI 模式**（1.0.0 头条；`settings-manager.ts:184`、`:1348-1350`）：键位本身不受影响，但部分交互的前提变了——全屏选区复制、`tui.altScreen.*` 键位、跳到底部指示器等现在默认处于 fullscreen 路径。逃生舱：setting `tuiMode: "regular"` 或 `--tui-mode regular`（`args.ts:326`）。（sync-0008 补注：fullscreen 路径正是 v1.0.3 Home/End 键位重排的触发前提，`tui.altScreen.top`/`bottom` 的具体键值已改 Ctrl+Home/End，见下方 v1.0.3 注记。）
- **`fullscreenWheelScrollLines` 滚轮加速**（v1.0.0 新增，默认 `"auto"`，1-100；`settings-manager.ts:188`、`:1389-1396`）：fullscreen 下按 burst/gesture 加速滚轮（上限 6 行/事件；darwin 本地终端视为已加速不叠加，tui 侧 `wheel-scroll.ts`）。仅 fullscreen 有效（`settings-manager.ts:185-188`）。
- **slash 补全去前导空白**（#10218）：以空白开头的输入也会进入 `/` 补全流程（`packages/tui/src/autocomplete.ts:338-380`，`trimStart()` 后判断前缀）；程序化消费者注意返回的 `prefix` 不再含前导空白。
- **默认主题 system**（0.99.0）：无 `theme` 设置时从终端 OSC 10/11/4 取色推导（`theme-controller.ts:174-177`、`system-theme.ts:35`）；`--use-theme`/settings 覆盖不变。

## v1.0.3 注记（2026-10-06 sync-0008 同步，未逐项重验本篇其余结论）

- **fullscreen 下 Home/End 键位重排**（`6100fe5a8`，closes #10314，v1.0.3）：上文 "`tui.altScreen.bottom` = `end`" 的结论**已过时**——`tui.altScreen.top`/`bottom` 现绑 `ctrl+home`/`ctrl+end`（`packages/tui/src/keybindings.ts:208-209`，消费点 `packages/tui/src/tui-alt-screen.ts:782-786`），裸 `home`/`end` 在 fullscreen 下归编辑器（`cursorLineStart`/`cursorLineEnd` 只留裸键 + `ctrl+a`/`ctrl+e`，`keybindings.ts:98-102`；官方口径 `packages/coding-agent/docs/keybindings.md:117-118`）。根因：fullscreen（v1.0.0 起默认）下 `TuiAltScreen` 的输入层在把按键路由给焦点编辑器之前先逐个匹配 `tui.altScreen.*` 并 `consume: true` 吞掉，而旧默认键 `top`=Home、`bottom`=End 与编辑器同名绑定撞车，altScreen 层先赢——fullscreen 里按 Home/End 永远滚 transcript，光标跳不到行首/行尾，只剩 Ctrl+A/E 可用。修复是纯默认键位重排、不动路由代码：两层默认集合从此不相交，裸 Home/End 在任何 UI 模式都归编辑器，transcript 顶/底改 Ctrl+Home/End；用户 keybindings.json 的显式覆盖不受影响。这是 v1.0.3 CHANGELOG 里 tui 唯一的 Changed 条目。
- **OAuth 登录屏也响应复制键**（`ced72c2f0`，v1.0.1）：`Ctrl+X`（`app.message.copy`）的复制能力扩展到 OAuth 登录屏——`/login` 与 `/mcp` 的登录屏现在显示复制提示并用 OSC 52 复制登录 URL（SSH 下可用；新组件 `packages/coding-agent/src/modes/interactive/components/auth-url.ts:22`），`/mcp login` 在 TUI 中改用登录屏而非通知。

## v1.2.0 增量：远程剪贴板与终端程序状态

两个都跟"终端能力协商"有关，且都带环境变量开关。

**`PI_CLIPBOARD_OSC52=1`——让复制到达远程客户端**

pi 在 SSH 下本来就会用 OSC 52 把复制内容送到终端。而在**检测不到远程会话**的场景（从另一台机器 attach 的 multiplexer、远端 IDE daemon），这条路径不会触发。设 `PI_CLIPBOARD_OSC52=1` 后，pi 在本地剪贴板写入**之后**，再**额外**用 OSC 52 发一次（`docs/environment-variables.md:91`）：

> Set to `1` to also send copied text to the terminal with OSC 52 after the local clipboard write, as Pi does over SSH. Use it when a remote client reaches Pi without SSH variables, such as a multiplexer attached from another machine or a remote IDE daemon

注意语义是"**额外再发一次**"，不是"改走 OSC 52"——本地写入照常发生。

**`PI_PROGRAM_STATUS`——让终端/面板知道 pi 在干什么**

v1.2.0 新增 OSC 7501 程序状态上报：支持的终端与 agent dashboard 能看到 pi 当前是 working / blocked（等对话框或登录）/ done / failed。默认**先问终端是否支持**，得到确认才上报；`PI_PROGRAM_STATUS=1` 跳过询问总是上报，`=0` 关闭（`docs/environment-variables.md:93`）。

两点边界：

- 上报内容**不含** prompt 或模型输出（`docs/terminal-setup.md:233`）。
- **tmux 与 screen 不转发**该序列（同上）——所以在 multiplexer 里需要显式设 `1`，且外层终端要支持。

**对 TUI 实现者是 Breaking**：`Terminal` 接口新增了**必需**方法 `setProgramStatus()`（`packages/tui/src/terminal.ts:125`），另有 `packages/tui/src/program-status.ts`（`PROGRAM_STATUS_QUERY` / `formatProgramStatus` / `isProgramStatusReply`，含 2048 字节上限）。自定义 `Terminal` 实现必须补这个方法。

**`showHardwareCursor`——设置是旧的，语义是 v1.2.0 新的（重要）**

`showHardwareCursor` 控制终端**硬件光标（真实光标）是否可见**。它**不是** v1.2.0 新增的设置（引入于 `673916f63`，首个 tag `v0.49.0`），但它的**行为在 v1.2.0 被改了**，且这正是 v1.2.0 的 Changed 条目之一：

> Changed the `showHardwareCursor` setting to use only the terminal cursor instead of also drawing Pi's reverse-video cursor（`packages/coding-agent/CHANGELOG.md:30`）

> Changed `showHardwareCursor` to show only the terminal cursor: focused `Editor` and `Input` components no longer draw a reverse-video cursor when it is enabled. This avoids terminals that extend edge cell colors into the window padding stretching the drawn cursor at the first or last column（`packages/tui/CHANGELOG.md:15`，含 Breaking Changes）

引入该语义变更的 commit 是 `1cedd3272`（`git tag --contains` 仅 `v1.2.0`）。**对使用者的含义**：任何"开了 `showHardwareCursor` 后编辑区还会看到一个反色方块光标"的旧描述在 v1.2.0 已不成立——现在**只剩终端真实光标**。旧的实现注释仍留在 `packages/tui/src/tui.ts:1473-1477`。

精确行为（三层）：

- **默认 `false`**，两条独立证据：`packages/tui/src/tui.ts:519`（`private showHardwareCursor = false;`）与 `docs/settings.md:104`（`| showHardwareCursor | boolean | false | Use the terminal cursor instead of Pi's drawn cursor. Pi still positions it for input methods. |`）。注意 schema 里**没有** `default:` 字段（`settings-schema.ts:376-378` 是 `Type.Optional(Type.Boolean({ description: "Show the terminal cursor while still positioning it for IME." }))`，对比邻近的 `autocompleteMaxVisible` `:370-375` 有 `default: SETTINGS_DEFAULTS.autocompleteMaxVisible`）——默认值由运行时兜底。
- **env 判定是严格 `=== "1"`**（`packages/coding-agent/src/core/settings-manager.ts:1363-1365`：`return this.settings.showHardwareCursor ?? process.env.PI_HARDWARE_CURSOR === "1";`）。settings 优先（`??`），未设置时才看 env；只有字符串 `"1"` 算开启，`true`/`yes`/`0` 都算 false——**与 `PI_TELEMETRY` 那种宽松解析不同**。文档也只承诺 `1`（`docs/environment-variables.md:90`）。这个 `??` 优先级与上文 :108 讲的"终端能力覆盖（settings > env > 自动检测）"是同一套顺序。
- **无论开关如何，pi 始终把光标定位到编辑区插入点**（IME 候选窗跟随）——这正是 `673916f63` 当初加它的原因（"while still positioning it for IME support"）。开启时用 `\x1b[?25h` 显示真实光标并**丢弃**焦点组件画的那格反色假光标；关闭时隐藏真实光标、改由 TUI 把假光标渲染成反色（`\x1b[7m`）。两条渲染路径**各自**实现该开关：`tui-alt-screen.ts:1774` 与 `tui-main-screen.ts:650`；假光标解析在 `tui.ts:1478-1485`（`resolveFakeCursors`）。
- **只管光标**，与全屏/alt-screen 无关——那是另一个设置 `tuiMode`（`settings-manager.ts:1241-1243`）。
- **交互式设置选择器里有**（`settings-selector.ts:809-815`，label "Show hardware cursor"，插在 skill-commands 之后），回调 `:946-948` → `interactive-mode.ts:5079-5081`（`setShowHardwareCursor` + `ui.setShowHardwareCursor`），**即刻生效无需重启**。

## 引用

- 源码：`packages/coding-agent/src/core/keybindings.ts` — 完整快捷键定义
- 源码：`packages/coding-agent/src/modes/interactive/interactive-mode.ts` — TUI 主逻辑
- 源码：`packages/coding-agent/src/modes/interactive/components/` — TUI 组件目录
- `_digested/`：[agent/04-Harness/README.md(../../_digested/agent/04-Harness/README.md) — AgentHarness 和工具
- `_digested/`：[integration/02-advanced.md(../../_digested/integration/02-advanced.md) — TUI vs SDK 架构关系
