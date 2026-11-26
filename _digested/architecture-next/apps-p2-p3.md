# apps 层：p2（Pi Mobile）与 p3（Pi Roam）

> `apps/` 目录 **v1.5.1 首次出现**（`apps/p2` + `apps/p3`），v1.6.0 加入 `apps/p2-mac`。根 `package.json` 的 workspaces 含 `apps/*`，但它们**不计入 `_digested` 的"包数"**（12 个 `packages/*` 是 npm 发布面；apps 是 private 应用）。AGENTS.md 为三者各有专节：p2 插件代码（先读 `apps/p2/docs/plugin-practices.md`）、p2 Web UI（加载 `.pi/skills/p2-ui.md`）、p3（先读 `apps/p3/docs/README.md` 再按序读五篇指南）。

## p2：Pi Durable UI（自托管，EXPERIMENTAL 原型）

`apps/p2/README.md` 顶部 WARNING 原文定性：**prototype，"It will be gone soon"，数据格式与 API 无通知即变**。它是"独立 Chord 插件拼成的自托管 Pi Durable UI"：

- **权限模型**：owner 在 server 与 workers 上有完整 agent + shell 控制权——**没有服务端文件系统隔离**；访客下载的 TUI facet 在访客自己机器上的锁定 worker 里跑（chord `startTerminal` 的沙箱：无 fs/terminal/process/network/SQLite）。
- **跑起来**：`npm install --ignore-scripts` → `npm run hydrate:model-data` → `cd apps/p2 && npm start`；打开 `http://127.0.0.1:8788`，粘贴启动打印的 sign-in token。`PORT` 换端口，`P2_DATA_DIR` 换数据目录（默认 `~/.pi/p2`），`P2_FAKE=1` 用 fake provider 演示。
- **结构**（893 个 `.ts/.tsx`）：`plugins/`（独立插件）、`src/hosts/server.ts`（宿主）、`src/web`（UI）、`voice-server/`、`test/`、`third-party/`。
- **测试约定**（AGENTS.md Commands 节）：apps/p2 **在根 check 与根测试之外**；改动后跑 `cd apps/p2 && npm run check`，套件 `cd apps/p2 && npm test`（TUI 测试要 Node 26，浏览器测试要 `CHROMIUM_BIN`）。
- **CI**：`.github/workflows/p2-cloud-bundle.yml`（v1.5.1 新增）、`p2-mac-nightly.yml`（v1.6.0 新增）。
- **workflow 模式**（`docs/workflows.md`）：code mode 脚本用 `tools.agent` 编排一次性 agent——fan-out + 对抗验证、draft + judge、fix until check passes、search until nothing new。

**每个 release 都在大改**：落地时 884 文件 +163k（v1.5.1）；v1.5.2 +7.5k/−446；v1.6.0 +44k/−9.4k；v1.6.1 +3.6k/−1.2k。引用 p2 实现细节必须带版本；研究 chord v2 的"真实用法"时它只作参考实现（p3 明确说它是灵感来源、**绝不是拷贝来源**）。

## p3：Pi Roam（方向，"one Pi per person"）

`apps/p3/docs/README.md` 定性：**人自己机器上的 server、每 session 一个 worker 进程、其余全是插件**，构建于 chord（v2）+ durable。这是 pi 产品形态的**终点方向**，包规划在 Linear（一包一 issue），仓库内留五篇强制顺序指南：

1. `process.md`——包从 Linear issue 到 nightly 的流程与红线；
2. `chord-practices.md`——p3 怎么拼、插件怎么建在 chord 上、犯过的错与修法；
3. `testing.md`——测试分层与命令；
4. `performance.md`——预算、测法、陷阱；
5. `names.md`——一名一物（代码/契约/文本统一用词）。

**结构**（v1.6.1 时 118 个 `.ts`）：`plugins/`（`control`、`runner`、`sessions`（model plugin）、`sign-in`）、`src/api/v1/`（插件 import 的 `@earendil-works/p3/v1`、`/v1/server`、`/v1/worker` 三个出口）、`src/`（`bin.ts` 即 `p3` 命令、`server.ts`、`worker.ts`、`supervisor.ts`、数据目录 `files.ts`/`pi.ts`/`records.ts`）、`test/`（自带 harness `support.ts`/`until.ts` 与测试插件根）、`bench/`（每 slice/package 一个 benchmark）。

**历史与深度材料**：`docs/decisions.md`（Mario 截至分包的决策，后条胜前条）、`docs/slices/`（分包前 26 个 slice 的 brief；slice 1 base-and-sessions 与 slice 26 release 有 walkthrough 带真实代码）、`docs/archive/`（旧设计，不作为构建参考）。深挖时按需读 chord 的 `docs/design.md`（§3 hosts、§6 objects/admission、§§9-11 documents/tables/queries、§17 registries、§21 reload、§23 HTTP/workers/surfaces）与 `plugin-authoring.md`。

**体量轨迹**：v1.5.1 落地 32 文件 +21k（骨架与文档）；v1.6.0 +38k/181 文件（主体）；v1.6.1 +4.2k。AGENTS.md 的 "Working on p3 (Pi Roam) packages" 一节规定动工前先读 `docs/README.md` 再按序读五篇指南**全文**。

## p2-mac：原生壳 spike（Swift）

v1.6.0 新增，README 自标 **"(spike)"**：AppKit + WKWebView、macOS 14+、零依赖（`Package.swift` + `Makefile`）。两个部分：**菜单栏项**找到或启动本地 p2 server；**窗口**用 WKWebView 展示 p2 Web UI，以本地 owner 身份自动登录（无需粘 token）。规划文件是 session artifact `pi-desktop-plan`。CI：`p2-mac-nightly.yml`。

## 三者的关系（不要误解）

- **p3 是方向，p2 是将被替换的原型**——但 p2 在每个 release 仍在大量重写，"快死了所以不用看"是错的；
- 研究分工：**chord v2 怎么被真实使用看 p3**（它是 chord + durable 的 reference application，工程结构完整：guides/slices/bench）；**chord v2 的插件式 Web UI 形态看 p2**；
- 三者都在 chord v2 app kit（`startServer`/`startWorker`/sessions/facets）上构建；apps 与 `packages/*` 的边界：前者是应用，后者是库；
- post-tag（v1.6.1 之后，0016 处理）已知动向：p2 经 Radius 的短时效分享邀请、`reload_plugins` 按名修复、chord 持有对象内存减半。

## 锚点

- `apps/p2/README.md`（EXPERIMENTAL WARNING + Run）、`apps/p2/DEV.md`、`apps/p2/docs/p2-notes.md`、`docs/workflows.md`、`docs/plugin-practices.md`
- `apps/p3/docs/README.md`（五指南顺序）、`docs/{decisions,slices/,archive/}`、`bench/`
- `apps/p2-mac/README.md`（spike 定性）、`Package.swift`
- `.pi/skills/p2-ui.md`（v1.5.1 新增，122 行）；`.github/workflows/{p2-cloud-bundle,p2-mac-nightly}.yml`
- AGENTS.md 三节：Writing p2 plugin code / Working on p3 (Pi Roam) packages / Building p2's web UI
