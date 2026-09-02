---
name: verify
description: Run the project's full verification loop (typecheck, lint, build, tests), fix root causes of failures, iterate until green, and report evidence. Use before declaring any coding task done.
---

# Verify

Goal: turn "looks done" into "verified done". You are the last check before the change ships.

## Steps

1. Discover the verification commands: read AGENTS.md first; fallback to `package.json` scripts / `Makefile` / CI config. If no check exists at all, say so and stop — do not invent one.
2. Run checks one at a time, in this order: typecheck → lint → build → tests. Wait for each result before the next.
3. On failure: read the FULL error output (no tail-guessing), locate the root cause, apply the smallest correct fix. Weakening types, marking tests skipped, deleting tests, or adding narrow try/catch to silence errors is forbidden.
4. Rerun the failed check after each fix. Iterate until all checks pass or you hit a blocker you cannot fix.
5. Report evidence, always:
   - commands run with their exit codes
   - test summary (passed/failed counts)
   - files you modified while fixing, with one-line reasons

## Rules

- Fix one failure at a time; smallest fix that addresses the root cause.
- If a fix would change public behavior or an API, stop and report instead of proceeding.
- Time-box: if the same failure survives 3 fix attempts, stop and report the exact error, your 3 attempts, and your best hypothesis.
