---
description: Review uncommitted changes for bugs and scope, with a verdict
argument-hint: "[focus]"
---
Review the uncommitted changes in this repository: `git status`, `git diff`, `git diff --cached` (include relevant untracked files). Read every touched file in full around the changed regions before judging.

Focus: ${1:-correctness and scope}

For each finding:
- Quote the exact file and line range.
- Classify exactly one of: bug / regression-risk / scope-creep / style.
- bug and regression-risk must include a concrete failure scenario (input -> wrong outcome).
- Only report findings that affect correctness, the stated task, or repo rules from AGENTS.md. Skip style preferences and hypothetical edge cases that cannot happen.

End with a verdict paragraph: "safe to commit" or "needs fixes first:" followed by the numbered list of blocking findings. If there are no findings, say so explicitly instead of inventing any.
