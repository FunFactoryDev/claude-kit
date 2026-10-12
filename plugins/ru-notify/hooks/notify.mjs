// ru-notify: shows a desktop notification for every Claude Code notification
// (a permission prompt that waits, Claude idle and waiting for you, ...).
// Runs: Notification hook, all notification types (hooks/hooks.json).
// macOS: osascript. Linux: notify-send, if installed. Anywhere else: nothing.
// Text goes in as separate arguments (no shell), so a message can't inject code.
// Always exits 0 and never prints: a failed notification must not break a session.
// Side effects: one notification on this computer. Nothing is logged or sent.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

try {
  let input = {};
  try {
    input = JSON.parse(readFileSync(0, "utf8")) ?? {};
  } catch {}
  const title = String(input.title || "Claude Code");
  const message = String(input.message || "Claude Code ждёт тебя");
  const opts = { stdio: "ignore", timeout: 5000 };
  if (process.platform === "darwin") {
    spawnSync("osascript", [
      "-e", "on run argv",
      "-e", "display notification (item 2 of argv) with title (item 1 of argv)",
      "-e", "end run",
      title, message,
    ], opts);
  } else if (process.platform === "linux") {
    spawnSync("notify-send", [title, message], opts);
  }
} catch {}
process.exit(0);
