---
name: claude-md-review
description: Audits a CLAUDE.md for what actually degrades Claude Code's work - vague rules, unnamed files, stale facts, bloat and conflicts. Use when asked to review, improve or shrink a CLAUDE.md, or when Claude keeps "forgetting" instructions and rediscovering the project every session.
argument-hint: "[path to CLAUDE.md, defaults to ./CLAUDE.md]"
allowed-tools: Read, Glob, Grep
---

# CLAUDE.md review

Audit this file: $ARGUMENTS (if no path is given, use `./CLAUDE.md`).

The premise: `CLAUDE.md` loads into context in every session, so every line either earns its place or costs tokens on every turn. Most "the model isn't following instructions" problems are problems with the instructions.

## Steps

1. Read the file. If the project has nested `**/CLAUDE.md` files or a `~/.claude/CLAUDE.md`, take them into account too: they also end up in context.
2. Score each dimension below and quote the specific lines that fail.
3. Output the report in the format at the bottom. Propose ready rewrites, not "be more specific".

## What to check

**Specificity** - the most important one.
- Flag rules nobody can check: "write clean code", "follow best practices", "be careful".
- Every rule should be checkable by reading a diff. "Split functions longer than 40 lines" is checkable; "keep functions short" is not.

**Named anchors.**
- Rules about "the config", "our API layer" or "the usual pattern" force a search every time. Replace them with real paths: `src/config/env.ts`, `src/api/client.ts`.
- Check that every path, command and file mentioned still exists. List the dead ones: a `CLAUDE.md` that points at a deleted file misleads.

**Staleness.**
- Versions, model names and commands that no longer match the repository.
- Instructions for a framework, script or folder that is gone.
- Cross-check the build, test and lint commands against `package.json`, `Makefile`, `pyproject.toml` or the equivalent: a wrong test command is worse than none.

**Bloat.**
- Anything Claude can learn from the code itself: file trees, dependency lists, retellings of what a function does. Claude can read the repository.
- Long procedures for a rare task: they belong in a skill, which loads only when it is used.
- Generic advice that is true of any project and says nothing about this one.

**Conflicts.**
- Rules that contradict each other or what the code actually does. Show both sides and ask which wins.
- Precedence surprises: a nested `CLAUDE.md` or `~/.claude/CLAUDE.md` overriding what the author expects.

**What's missing** (if absent):
- How to run the tests, the build and the linter - everything needed to verify a change.
- Non-obvious constraints: a folder that must not be touched, a generated file, a required migration step.
- Conventions that are surprising and not visible from a quick read of the code.

## Report format

```
## CLAUDE.md review - <path> (<N> lines)

**Verdict:** <one sentence>

### Blocking
- L<n>: <quoted line> -> <ready rewrite>

### Worth fixing
- L<n>: <quoted line> -> <ready rewrite>

### Delete (costs context in every session, earns nothing)
- L<n>-<m>: <what and why>

### Missing
- <gap> -> <line worth adding>

**Size after edits:** about <N> lines (was <M>)
```

## Rules

- Quote real line numbers and real text. Never invent a finding to fill a section.
- If a section has no findings, write `None.` A clean file is a valid result.
- Prefer deleting to rewriting. The best `CLAUDE.md` is short enough that people read it.
- Don't edit the file unless you are asked to. Report first.
