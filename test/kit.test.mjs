import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    if (n === ".git" || n === "node_modules") return [];
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

function frontmatter(file) {
  const m = readFileSync(file, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert.ok(m, `${file}: no frontmatter`);
  const fields = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
  }
  return fields;
}

const market = readJson(join(ROOT, ".claude-plugin/marketplace.json"));
const pluginDirs = readdirSync(join(ROOT, "plugins")).filter((n) =>
  statSync(join(ROOT, "plugins", n)).isDirectory());

test("every JSON file parses", () => {
  const files = walk(ROOT).filter((p) => p.endsWith(".json"));
  assert.ok(files.length > 0);
  for (const f of files) assert.doesNotThrow(() => readJson(f), f);
});

test("marketplace lists every plugin dir, versions agree with plugin.json", () => {
  assert.ok(market.name && market.owner?.name && Array.isArray(market.plugins));
  const listed = market.plugins.map((p) => p.name).sort();
  assert.deepEqual(listed, [...pluginDirs].sort());
  for (const entry of market.plugins) {
    assert.equal(entry.source, `./plugins/${entry.name}`);
    assert.ok(entry.description, `${entry.name}: no description`);
    const manifest = readJson(join(ROOT, "plugins", entry.name, ".claude-plugin/plugin.json"));
    assert.equal(manifest.name, entry.name);
    assert.match(manifest.version ?? "", /^\d+\.\d+\.\d+$/, `${entry.name}: no semver version`);
    assert.ok(manifest.description && manifest.author?.name, `${entry.name}: description/author`);
    // plugin.json wins over the entry; an entry version may only repeat it.
    if (entry.version !== undefined) assert.equal(entry.version, manifest.version);
  }
});

test("skills and agents have name + description, kebab-case, matching folder", () => {
  let count = 0;
  for (const plugin of pluginDirs) {
    const skillsDir = join(ROOT, "plugins", plugin, "skills");
    for (const s of existsSync(skillsDir) ? readdirSync(skillsDir) : []) {
      const fm = frontmatter(join(skillsDir, s, "SKILL.md"));
      assert.match(s, KEBAB);
      assert.equal(fm.name, s, `${plugin}/${s}: name must match folder`);
      assert.ok(fm.description, `${plugin}/${s}: no description`);
      count++;
    }
    const agentsDir = join(ROOT, "plugins", plugin, "agents");
    for (const a of existsSync(agentsDir) ? readdirSync(agentsDir) : []) {
      const fm = frontmatter(join(agentsDir, a));
      assert.match(fm.name ?? "", KEBAB);
      assert.equal(fm.name, basename(a, ".md"));
      assert.ok(fm.description, `${a}: no description`);
      count++;
    }
  }
  assert.equal(count, 10);
});

for (const kit of ["ru-kit", "en-kit"]) {
  test(`${kit} code-reviewer agent is read-only`, () => {
    const fm = frontmatter(join(ROOT, `plugins/${kit}/agents/code-reviewer.md`));
    assert.deepEqual(fm.tools.split(",").map((t) => t.trim()), ["Read", "Grep", "Glob"]);
  });
}

test("every ru-* plugin has an en-* twin with the same parts", () => {
  const parts = (plugin) => {
    const dir = join(ROOT, "plugins", plugin);
    const ls = (sub) => (existsSync(join(dir, sub)) ? readdirSync(join(dir, sub)).length : 0);
    const hooks = join(dir, "hooks/hooks.json");
    const events = existsSync(hooks) ? Object.keys(readJson(hooks).hooks) : [];
    return { skills: ls("skills"), agents: readdirSync(dir).includes("agents") ? readdirSync(join(dir, "agents")) : [], events };
  };
  const ru = pluginDirs.filter((n) => n.startsWith("ru-"));
  assert.equal(ru.length, 3);
  for (const plugin of ru) assert.deepEqual(parts(plugin.replace(/^ru-/, "en-")), parts(plugin), plugin);
});

test("every hook command points at a script that exists", () => {
  for (const plugin of pluginDirs) {
    const f = join(ROOT, "plugins", plugin, "hooks/hooks.json");
    if (!existsSync(f)) continue;
    for (const groups of Object.values(readJson(f).hooks))
      for (const g of groups)
        for (const h of g.hooks) {
          const m = h.command.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^"]+)"/);
          assert.ok(m, `${plugin}: quote "\${CLAUDE_PLUGIN_ROOT}/..." in ${h.command}`);
          assert.ok(existsSync(join(ROOT, "plugins", plugin, m[1])), `${plugin}: missing ${m[1]}`);
        }
  }
});

const runGuard = (stdin, guard = "ru-guard") =>
  spawnSync(process.execPath, [join(ROOT, `plugins/${guard}/hooks/guard-files.mjs`)], { input: stdin, encoding: "utf8" });
const preToolUse = (file_path, tool_name = "Edit") => JSON.stringify({
  hook_event_name: "PreToolUse", tool_name, cwd: "/tmp/proj",
  tool_input: { file_path, old_string: "a", new_string: "b" },
});

for (const [guard, blocked] of [["ru-guard", /заблокирована/], ["en-guard", /is blocked/]]) {
  for (const p of [".env", ".env.local", "package-lock.json", "/tmp/proj/.env.production",
    "C:\\proj\\pnpm-lock.yaml", "/tmp/proj/yarn.lock"]) {
    test(`${guard} blocks ${p}`, () => {
      const r = runGuard(preToolUse(p, "Write"), guard);
      assert.equal(r.status, 2);
      assert.ok(r.stderr.trim().length > 0);
      assert.match(r.stderr, blocked);
    });
  }

  for (const p of ["src/app.js", "/tmp/proj/.env.example", "/tmp/proj/docs/env.md", "/tmp/proj/package.json"]) {
    test(`${guard} allows ${p}`, () => {
      const r = runGuard(preToolUse(p), guard);
      assert.equal(r.status, 0);
      assert.equal(r.stderr, "");
    });
  }

  for (const [label, stdin] of [["malformed JSON", "{not json"], ["empty stdin", ""],
    ["no tool_input", "{}"], ["JSON null", "null"], ["non-string path", '{"tool_input":{"file_path":42}}']]) {
    test(`${guard} passes on ${label}`, () => assert.equal(runGuard(stdin, guard).status, 0));
  }
}

test("en-* plugins have no Russian text", () => {
  for (const plugin of pluginDirs.filter((n) => n.startsWith("en-")))
    for (const f of walk(join(ROOT, "plugins", plugin)))
      assert.doesNotMatch(readFileSync(f, "utf8"), /[А-Яа-яЁё]/, f);
});

for (const plugin of ["ru-notify", "en-notify"]) {
  test(`${plugin} hook exits 0 on any input`, () => {
    const notify = join(ROOT, `plugins/${plugin}/hooks/notify.mjs`);
    // A malformed payload is the case that must never break a session; we don't
    // fire a real notification from the test suite with a valid one.
    const r = spawnSync(process.execPath, [notify], { input: "{bad", encoding: "utf8", env: { PATH: "" } });
    assert.equal(r.status, 0);
  });
}
