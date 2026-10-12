// ru-guard: blocks Claude's Edit/Write on .env files and lockfiles.
// Runs: PreToolUse, matcher Edit|Write|MultiEdit (hooks/hooks.json).
// Reads the hook JSON from stdin, looks only at tool_input.file_path.
// Exit 2 + stderr = the call is blocked and Claude sees the reason.
// Anything unexpected (bad JSON, no path) = exit 0: never break a session.
// Side effects: none. No network, no files written. Requires: Node.
import { readFileSync } from "node:fs";

const LOCKFILES = new Set([
  "package-lock.json", "npm-shrinkwrap.json", "yarn.lock", "pnpm-lock.yaml",
  "bun.lock", "bun.lockb", "deno.lock", "Cargo.lock", "poetry.lock", "uv.lock",
  "Pipfile.lock", "Gemfile.lock", "composer.lock", "go.sum", "flake.lock",
]);
// Templates hold no secrets and are meant to be edited.
const ENV_TEMPLATES = new Set([".env.example", ".env.sample", ".env.template", ".env.dist"]);

function blockReason(filePath) {
  const name = String(filePath).replace(/\\/g, "/").split("/").pop();
  if ((name === ".env" || name.startsWith(".env.")) && !ENV_TEMPLATES.has(name)) {
    return `ru-guard: правка ${name} заблокирована. В .env-файлах лежат секреты. Не меняй этот файл; если нужна новая переменная, попроси пользователя добавить её самому или допиши её в .env.example.`;
  }
  if (LOCKFILES.has(name)) {
    return `ru-guard: правка ${name} заблокирована. Lock-файл генерирует менеджер пакетов. Не редактируй его руками: предложи пользователю команду установки (например, npm install), и файл обновится сам.`;
  }
  return null;
}

let filePath;
try {
  filePath = JSON.parse(readFileSync(0, "utf8"))?.tool_input?.file_path;
} catch {
  process.exit(0);
}
const reason = typeof filePath === "string" && filePath ? blockReason(filePath) : null;
if (reason) {
  process.stderr.write(reason + "\n");
  process.exit(2);
}
process.exit(0);
