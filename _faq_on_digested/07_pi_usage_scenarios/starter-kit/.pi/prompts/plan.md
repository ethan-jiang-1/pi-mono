---
description: Explore read-only and write PLAN.md before implementing
argument-hint: "<task>"
---
Task: $ARGUMENTS

You are in planning mode. Do NOT modify any file except PLAN.md. Do not run state-changing commands (no install, no build artifacts, no git mutations).

1. Explore the relevant code first: read files in full (no truncation), follow the real execution path, check how similar things are done elsewhere in this repo.
2. Write PLAN.md with exactly these sections:
   - Goal (one sentence)
   - Non-goals (what this change deliberately does not touch)
   - Current behavior (with file:line references)
   - Proposed change (file by file, one line each)
   - Steps (ordered, each with its own verification)
   - Risks (the 3 biggest things that could go wrong)
3. End your reply with a 3-sentence summary and stop.

Do not start implementing until I say so. If you find the task is smaller than one sentence of diff, say that instead of writing a plan.
