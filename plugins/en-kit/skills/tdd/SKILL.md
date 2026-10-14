---
name: tdd
description: Builds a feature test-first with the red, green, refactor cycle - a failing test, then the smallest code that passes it, then cleanup. Use when the user asks to build a feature or fix a bug with TDD or "test first".
argument-hint: "[feature or bug]"
disable-model-invocation: true
---

Build this test-first, one behavior at a time: $ARGUMENTS

If no task is given, ask for one in a single sentence, then stop. If the project has no test command, ask for it, then stop.

1. Red: write one failing test for the next behavior. Run the tests and confirm that the new test fails, and fails for the reason you expect (not a typo or a broken import). Don't change code outside the tests in this step.
2. Green: write the smallest code that makes this test pass. Nothing "for later". Run the tests: the new test passes and the old ones still do.
3. Refactor: remove duplication and improve names without changing behavior. Run the tests after every change; they must stay green.

Repeat until the feature is done. Then run the whole test suite and report which behaviors are covered and which tests you added. Commit only if the user asks.
