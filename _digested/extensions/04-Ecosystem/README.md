# 04-Ecosystem：极简核长出来的生态——现状、治理与发展

> **数据快照**：2026-09-21（pi.dev/packages 显示 **5372 个包**）。生态数据时效性极强，数字只代表快照当天；机制与治理结构相对稳定。
>
> 本篇回答的问题与前三子目录不同：01-Core 讲"核有多小"、02-Expansion 讲"怎么扩"、03-Patterns 讲"套路怎么成立"，本篇讲**按这套思路长出来的生态现在长什么样、upstream 管不管、往哪儿发展**。

## 一句话结论

upstream 的治理边界画得很清楚：**管协议，不管内容**。包格式、安装器、目录聚合（pi.dev/packages）、举报通道是官方建的"公路系统"；但 npm 上自由发布、无审批、无质量分层、安全完全免责。生态侧已经用 5300+ 包把 core 故意留白的功能全部补齐——而且经常是多个竞争实现并存的自由市场形态。

## 官方基建（协议层，upstream 真正管的）

以下全部是 `packages/coding-agent/docs/packages.md` + `README.md` 可验证的硬事实：

| 机制 | 内容 | 锚点 |
|------|------|------|
| 包格式 | extension/skill/prompt template/theme 四类资源，`package.json` 的 `pi` manifest 或约定目录 | docs/packages.md:118-160 |
| 分发渠道 | `pi install npm:@foo/bar@1.0.0` / `git:github.com/user/repo@v1` / 裸 URL / 本地路径；版本化 spec 被 pin | docs/packages.md:13-18 |
| 安装位置 | 用户级 `~/.pi/agent/npm/`，项目级 `.pi/npm/`（项目包随 project trust 自动装） | docs/packages.md:31-33 |
| 试用 | `pi -e npm:@foo/bar` 临时安装，仅当次运行有效 | docs/packages.md:38-41 |
| **官方目录** | npm keyword **`pi-package`** → 自动出现在 [pi.dev/packages](https://pi.dev/packages) 画廊（Most downloads / Recently published 排序），可附 video/image 预览 | docs/packages.md:118/137-142 |
| 治理通道 | 每个包页有 `report` 链接 → upstream 仓库的 `package-report.yml` issue 模板 + `package-report` label——**举报驱动下架，不是审批准入** | pi.dev/packages 每个包卡片 |
| 安全立场 | 明文警告"包以**完全系统权限**运行；安装前自审源码"——责任转移给用户 | docs/packages.md:8-9 |
| 标准兼容 | skills 遵循 [Agent Skills 标准](https://agentskills.io)（跨 harness 的开放标准），不发明私有格式 | README.md:358 |
| 社区广场 | 官方 Discord（README:7 badge） | README.md:7 |

**判断**：这套基建和 CONTRIBUTING 的"core 不膨胀"是同一哲学的两面——core 端用纪律挡住功能进入，生态端用自由协议让功能绕到核外长出来。upstream 不扮演应用商店审核员。

## 生态现状快照（2026-09-21，5372 包）

### 发布节奏

pi.dev/packages 的 "Recently published" 以**分钟级**刷新（抓取时最近 8 个包发布于 11-18 分钟前）。这不是死目录，是活跃的日常发布流。

### 分类盘点（按 pi.dev 下载量代表性取样）

**core 留白功能的"市场补位"**——最有说服力的一类，直接验证 01-Core 的"故意不做"：

- **subagents**：`pi-subagents`（nicopreme97）、`@tintinweb/pi-subagents`（Claude Code 式并行舰队+live widget）、`@kontextmind/kxm`（多 agent 编排+仪表盘）——core 不做 subagent，市场给了至少 3 个竞争实现
- **plan/todo/goal**：`@plannotator/pi-extension`（交互式 plan 评审）、`@juicesharp/rpiv-todo`（活过 /reload 和 compaction 的 todo overlay）、`pi-goal-x`（目标规划+独立完成审计）
- **permission/护栏**：`@gotgenes/pi-permission-system`、（另有官方 examples 的 permission-gate.ts/protected-paths.ts 蓝本）

**核外能力增量**：

- **MCP 桥**：`pi-mcp-adapter`（把 MCP 服务器接进 pi，下载量最大的类别之一）
- **web 能力**：`pi-web-access`（搜索/抓页/克隆仓库/PDF/YouTube）
- **context 工程**：`billion-context`（29K/mo，context 压缩代理，"数十亿 token 过一个窗口"）、`context-mode`（宣称省 98% context）
- **代码智能**：`pi-lens`（LSP/linter/类型检查实时反馈）
- **observability**：`@langfuse/pi-observability-plugin`（trace 到 Langfuse）
- **provider 桥**：`pi-claude-bridge`（Claude Code Agent SDK 当 provider）、`pi-opencode-zen`、`pi-provider-antigravity`——05-Infra 的 provider 抽象被社区反向利用
- **skills 包**：`bigpowers`（73 个 skill 的方法论合集）、`@dietrichgebert/ponytail`（"懒惰资深工程师模式"）
- **UI/长相**：`@reedchan/statusline`、`pi-powerline-footer`（对应 examples 的 footer/header 轴）
- **产品级嵌入**（library-first 的活证据）：`@companion-ai/feynman`（98K/mo，基于 pi 的研究 agent 产品）、`pi-anywhere`（Cloudflare Tunnel 移动端 Web 聊天）

**中文社区存在感**：`pi-zai-usage`（智谱 GLM/Z.ai 配额显示，中文 README）——生态不是纯英文圈。

### 社区组织（upstream 之外的）

- [shaftoe/awesome-pi-coding-agent](https://github.com/shaftoe/awesome-pi-coding-agent)：**自动发现 + LLM 策展、每日更新**的目录——策展本身也被自动化了
- [thevibeworks/awesome-pi-agent](https://github.com/thevibeworks/awesome-pi-agent)：人工策展切片（extensions/skills/frontends/forks）
- [arhen/pi-extensions](https://github.com/arhen/pi-extensions)：社区扩展 monorepo + `pi-toolset` 安装器——出现"第三方包管理器"包官方包管理器的苗头
- 无中心化"扩展委员会"：治理靠 npm 分布式 + 举报 + awesome 列表自发策展

## 治理模式：协议治理，不内容治理

与常见 harness 生态对比着看更清楚（这节是**解释**，不是硬事实）：

- **准入**：无审批、无签名、无最低质量门槛。发 npm + 打 `pi-package` keyword 即上架官方目录。目录本质是 **npm 搜索的皮**（pi.dev 抓取聚合），不是审核制商店。
- **下架**：report issue 模板 → 人工处理。被动响应制。
- **安全**：明文把"review before install"责任推给用户；配套的机制层护栏是 03-Patterns/3.3 的 `user_bash` fail-closed、project trust 闸门、`--extension` 临时试用——**机制给护栏，内容不背书**。
- **激励相容**：core 拒绝膨胀 PR（CONTRIBUTING 开篇），迫使功能作者走包发布——官方目录的 5300+ 包在相当程度上是被 core 的纪律"挤"出来的。

## 发展方向（可观察的趋势，非预言）

1. **core 留白 → 市场补位 → 竞争收敛**：subagents/todo/plan 都在走"多实现并存 → 靠下载量自然头部化"的路径；upstream 至今没有把任何一个收编回 core 的迹象。
2. **pi 自身成为包的运行底座**：feynman 这类"基于 pi 的产品"意味着 library-first（integration/）和 extension 生态正在合流——嵌入者直接复用生态。
3. **分发渠道分层**：官方 npm 目录 → awesome 列表 → 社区安装器（pi-toolset），出现了二手策展/分发层。
4. **跨 harness 标准采纳**：skills 遵循 agentskills.io——生态在主动对齐开放标准而非锁死用户。

## 与其他子目录的钩子

- 为什么生态能长出来：[`02-Expansion/`](../02-Expansion/)（四条扩充轴是生态的"地基"）
- 为什么敢装第三方代码：[`03-Patterns/3.3_safety_guards.md`](../03-Patterns/3.3_safety_guards.md)（fail-closed 护栏）
- core 为什么留白：[`01-Core/`](../01-Core/)；配套立场引文见本目录 README
- 用户侧怎么配：[`composition/14_community_patterns.md`](../../composition/14_community_patterns.md)（社区验证的配置模式，与本篇互补——那里讲"怎么配"，这里讲"有什么、谁管"）

## 数据时效警示

5372、下载量、竞争格局均为 2026-09-21 快照。机制结论（包格式/installer/keyword 目录/举报制）锚定 docs/packages.md 与 README.md，随 upstream 演进以 [`_change_log/`](../../_change_log/) 为准。
