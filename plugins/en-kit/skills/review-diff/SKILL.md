---
name: review-diff
description: Reviews the current uncommitted changes for correctness, security and readability, with a file and line for every finding. Use when the user asks to review their changes, review the diff, or look over the code before a commit.
argument-hint: "[what to look at most closely]"
allowed-tools: Bash(git diff *), Bash(git status *)
---

## Changed files

!`git status --short`

## Diff

!`git diff HEAD`

## Task

Review the changes above. If the user named a focus, look at it most closely: $ARGUMENTS

If the diff is empty, say so and stop. Read new files that are not in the diff (marked `??` in the status) separately.

Check:

- **Correctness**: logic errors, unhandled errors and edge cases, off-by-one mistakes, changed behavior without a test.
- **Security**: keys, tokens and passwords in code or config; user input used without validation; SQL and shell commands built from strings; risky file permissions.
- **Readability**: names that mislead, duplicated code, dead code, functions that are too long.

Group your findings as Must fix, Should fix and Consider. For each one give the file and line, the problem and a concrete fix. If you find nothing, say so and list what you checked.

Don't change any files: report only. No praise and no summary of the diff.
