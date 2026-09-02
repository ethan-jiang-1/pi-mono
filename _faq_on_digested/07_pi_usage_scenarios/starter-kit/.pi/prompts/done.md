---
description: Finish the current task end-to-end: verify, report, then commit explicit paths only
argument-hint: "[instructions]"
---
Wrap up the current task. Additional instructions: $ARGUMENTS

Determine context from the conversation history first, then in order:

1. Run the project's verification command from AGENTS.md (fallback: the repo's own check script). If anything fails, fix the root cause and rerun until green. Never suppress errors, weaken types, skip tests, or delete failing tests to get there.
2. Summarize the change in 2-4 sentences: what changed, key file paths, and the verification evidence (commands run + result).
3. Commit: stage ONLY files you changed in this session, with explicit paths (`git add <path1> <path2>`; never `git add -A` or `git add .`). Write a concise, informative commit message. Never use `--no-verify`.
4. Stop after committing. Do not push unless I explicitly asked in this conversation or in $ARGUMENTS. Do not open PRs.

If there is nothing to commit (no changes this session), say so and stop at step 2.
