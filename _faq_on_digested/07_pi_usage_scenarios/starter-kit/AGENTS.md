<!-- pi starter kit: 拷到项目根后,把注释和占位符按你的项目改掉。
     原则:只放"没有它会出错"的内容。臃肿的 AGENTS.md 会被模型整体忽略。 -->

# <项目名>

<一段话:这个项目是什么,给一个新工程师看的第一段。>

## Commands

- `npm run check` — typecheck + lint;任何代码改动后必须全绿
- `npm test` — 单元测试;跑单个测试:`node "$(git rev-parse --show-toplevel)/node_modules/vitest/dist/cli.js" --run test/<file>.test.ts`
- `npm run dev` — 启动开发服务器(http://localhost:3000)

<!-- 换成你项目真实的验证命令;模型要靠它自查工作。没有检查命令就先补一条。 -->

## Code style

- TypeScript strict;不用 `any`(除非别无选择并注释原因)
- 顶层 import;不用内联动态 import
- 命名/格式以仓库现有代码为准;改动最小化,不顺手重排

## Workflow rules

- Never commit unless I explicitly ask.
- Commit only files you changed in this session; stage explicit paths, never `git add -A` / `git add .`
- After code changes, run the check command above and fix all errors/warnings before claiming done.
- Read files in full before editing files you have not inspected.
- Do not remove or downgrade existing functionality to make errors go away; fix the root cause.
- If a task is ambiguous or touches multiple modules, write the approach into PLAN.md and wait for my confirmation before implementing.

## Gotchas

<!-- 只写"不踩不知道"的坑,例如: -->
- tests/e2e 会在有真实 API key 环境变量时激活;平时不要跑全量 suite,用 ./test.sh
