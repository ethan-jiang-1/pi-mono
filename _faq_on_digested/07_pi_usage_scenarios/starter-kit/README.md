# pi starter kit(最小可用组装)

一套可直接拷贝的最小文件组合:拷进你的项目,启动 pi 就"配好了"。

## 拷贝

```bash
# 1. 项目 AGENTS.md(必须按你的项目改:命令、风格、纪律)
cp AGENTS.md /path/to/your-project/

# 2. .pi/ 目录(prompts + skills)
cp -R .pi /path/to/your-project/

# 3. 启动
cd /path/to/your-project && pi
# 首次启动会问是否信任本项目(project trust),交互里选信任;
# 之后可用 /trust 保存决定,项目 .pi/ 资源从此自动加载。
```

## 启动后验证 pi 看到了

1. 启动 header 应列出 context files(你的 AGENTS.md)、prompt templates、skills。
2. 输入 `/` — 自动补全里应出现 `plan`、`review`、`done`。
3. 对它说"用 verify skill 检查一遍"或 `/skill:verify` — 应开始跑检查命令。

## 各文件职责

| 文件 | 作用 |
|---|---|
| `AGENTS.md` | 项目常识:命令、风格、纪律。**用前必改**,占位内容写在注释里 |
| `.pi/prompts/plan.md` | `/plan <任务>` — 只读探索,把方案写进 PLAN.md,不动代码 |
| `.pi/prompts/review.md` | `/review [重点]` — 审查未提交改动,按 bug/风险/超范围 分类,给 verdict |
| `.pi/prompts/done.md` | `/done [说明]` — 跑验证→修到绿→commit(只加自己改的文件,显式路径) |
| `.pi/skills/verify.md` | verify skill — 项目检查回路(发现命令→按序跑→修根因→出示证据) |

## 可选增强(按需,不要一次全装)

```bash
pi install npm:@juicesharp/rpiv-todo   # to-do 覆盖层(模型可见、可更新)
pi install npm:pi-subagents            # 子代理委派/编排
pi install npm:pi-web-access           # 网页搜索与抓取
```

## 设计依据

- AGENTS.md 只放"没有它会出错"的内容——臃肿会被模型整体忽略(Claude Code 官方对 CLAUDE.md 的原则,同样适用)。
- 每个 prompt template 都带 `description` + `argument-hint`,参数用 `$ARGUMENTS`/`$@`。
- verify skill 是纯 Markdown 单文件(`.pi/skills/` 下带 frontmatter 的根级 `.md` 即被发现,无需脚本)。
- 全部护栏写进文字约束(永不 `git add -A`、不压错误、不动别的分支),因为 pi 默认 YOLO 全权——纪律要自己写下来。
