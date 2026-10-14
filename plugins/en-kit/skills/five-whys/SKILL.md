---
name: five-whys
description: Finds the root cause of a bug, failure or recurring problem by asking "why" until the answer is a cause you can fix. Use when the user asks why something keeps happening, or wants the root cause rather than a quick fix.
argument-hint: "[problem]"
---

Find the root cause of this problem: $ARGUMENTS

If no problem is given, ask for one in a single sentence, then stop.

1. Restate the problem as a symptom someone can observe: what happens, where and when.
2. Ask "Why does this happen?" Answer from evidence: the code, tests, logs and git history. Mark any answer you can't back with evidence as a guess.
3. Ask "Why?" of that answer, and keep going until the answer is a cause the team can change. That often takes about five rounds; stop sooner if you get there, and say so if you need more.
4. Check the chain backwards: each cause must explain the step before it.
5. Report the chain as a numbered list, the root cause in one sentence, then one fix for the root cause and one for the symptom.

Don't change any files. Propose the fixes and let the user decide.
