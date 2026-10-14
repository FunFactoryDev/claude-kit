# claude-kit

**English:** the same plugins in English are `en-kit`, `en-guard` and `en-notify` — see [English plugins](#english-plugins-en-).

Маркетплейс плагинов для Claude Code от **FunFactoryDev**, фабрики веселья для разработчиков: мы делаем проекты, потому что это весело. Здесь собраны русскоязычные скиллы, агент-ревьюер и защитные хуки для тех, кто проходит бесплатный курс [zero2claude.ru](https://zero2claude.ru).

Плагинов три, и они независимы: можешь взять только скиллы, только защиту или всё сразу. Те же плагины на английском — `en-kit`, `en-guard` и `en-notify`, о них [в конце](#english-plugins-en-).

| Плагин | Что внутри | Запускает код на твоей машине |
|---|---|---|
| `ru-kit` | скиллы `five-whys`, `tdd`, `review-ru`, `claude-md-review` и агент `code-reviewer` | нет (только инструкции для Claude) |
| `ru-guard` | хук, который не даёт Claude править `.env` и lock-файлы | да, `node` перед каждой правкой файла |
| `ru-notify` | хук, который показывает уведомление на рабочем столе | да, `node` на каждое уведомление Claude Code |

## Установка

В сессии Claude Code:

```
/plugin marketplace add FunFactoryDev/claude-kit
/plugin install ru-kit@claude-kit
```

Остальные плагины ставятся так же:

```
/plugin install ru-guard@claude-kit
/plugin install ru-notify@claude-kit
```

`/plugin install` открывает карточку плагина, установку подтверждаешь там. После установки перезапусти Claude Code или набери `/reload-plugins`.

То же самое из терминала, без сессии:

```bash
claude plugin marketplace add FunFactoryDev/claude-kit
claude plugin install ru-kit@claude-kit
```

Обновиться до новой версии: `claude plugin update ru-kit@claude-kit`.

## ru-kit: скиллы и агент

У плагина каждый скилл получает префикс `ru-kit:`. Claude может и сам вызвать скилл, если твоя просьба совпадает с его описанием (кроме `tdd`: его запускаешь только ты).

### `/ru-kit:five-whys` - корень проблемы

Спрашивает «почему?» по цепочке, пока не дойдёт до причины, которую можно исправить. Опирается на код, тесты, логи и историю git, а догадки помечает. Файлы не меняет.

```
/ru-kit:five-whys тесты падают только в CI, а локально проходят
```

### `/ru-kit:tdd` - красный, зелёный, рефакторинг

Делает фичу по одному поведению за раз: сначала падающий тест, потом минимальный код, потом чистка, и после каждого шага прогоняет тесты. Правит код и тесты с обычными запросами разрешений. Запускается только вручную.

```
/ru-kit:tdd функция slugify превращает «Привет, мир» в privet-mir
```

### `/ru-kit:review-ru` - ревью текущего диффа

Перед запуском подставляет в себя вывод `git status --short` и `git diff HEAD` и делает ревью по-русски: корректность, безопасность, читаемость, с файлом и строкой для каждой находки. Можно указать, на что смотреть внимательнее. Файлы не меняет. Скилл заранее разрешает только команды `git diff` и `git status`.

```
/ru-kit:review-ru безопасность
```

Нужен git-репозиторий хотя бы с одним коммитом: если `git diff HEAD` падает, Claude Code прерывает скилл с ошибкой `Shell command failed`.

### `/ru-kit:claude-md-review` - аудит CLAUDE.md

Проверяет `CLAUDE.md` на расплывчатые правила, ссылки на несуществующие файлы, устаревшие команды, раздутость и противоречия. Выдаёт отчёт с номерами строк и готовыми заменами, сам файл не трогает. Заранее разрешает только чтение и поиск (`Read`, `Glob`, `Grep`).

```
/ru-kit:claude-md-review
/ru-kit:claude-md-review apps/web/CLAUDE.md
```

### Агент `code-reviewer`

Субагент для ревью в отдельном контексте. Инструменты: только `Read`, `Grep` и `Glob`, так что он может читать и искать, но не может править файлы и запускать команды. Отчёт: «Исправить обязательно», «Стоит исправить», «На подумать».

```
@agent-ru-kit:code-reviewer проверь src/auth/login.ts и его тесты
```

Или словами: «Попроси агента code-reviewer посмотреть мои изменения в src/auth». Git он запустить не может, поэтому назови ему файлы или вставь дифф.

## ru-guard: защита .env и lock-файлов

Перед каждым вызовом `Edit`, `Write` (и `MultiEdit` в старых версиях) хук смотрит на имя файла. Если это `.env`, `.env.*` или lock-файл, вызов блокируется (код выхода 2), а Claude получает причину по-русски и предлагает другой путь.

- **Блокируются:** `.env`, `.env.local`, `.env.production` и любые другие `.env.*`; `package-lock.json`, `npm-shrinkwrap.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lock`, `bun.lockb`, `deno.lock`, `Cargo.lock`, `poetry.lock`, `uv.lock`, `Pipfile.lock`, `Gemfile.lock`, `composer.lock`, `go.sum`, `flake.lock`.
- **Разрешены:** шаблоны без секретов `.env.example`, `.env.sample`, `.env.template`, `.env.dist`, и все остальные файлы.
- **Не ловит:** команды в терминале (`Bash`), например `echo X >> .env`. Это защита от случайной правки, а не песочница. Чтобы Claude не читал `.env`, добавь в настройки правило `"permissions": { "deny": ["Read(.env)"] }`.
- Если на вход пришло что-то непонятное (битый JSON, нет пути), хук молча пропускает вызов: он никогда не ломает сессию.

Что видит Claude при блокировке:

```
ru-guard: правка .env.local заблокирована. В .env-файлах лежат секреты. Не меняй этот файл; ...
```

## ru-notify: уведомление на рабочем столе

Когда Claude Code ждёт тебя (просит разрешение или закончил и ждёт ответа), хук показывает системное уведомление с текстом от Claude Code. На macOS через `osascript`, на Linux через `notify-send`, если он установлен. На других системах ничего не делает и не мешает.

## Как выключить плагин

- В сессии: `/plugin`, выбери плагин и отключи его.
- Из терминала: `claude plugin disable ru-notify@claude-kit` (обратно: `claude plugin enable ...`).
- Через настройки: в `~/.claude/settings.json` (или в `.claude/settings.local.json` проекта) поставь `false`:

```json
{
  "enabledPlugins": {
    "ru-notify@claude-kit": false
  }
}
```

Удалить совсем: `claude plugin uninstall ru-notify@claude-kit`. Убрать маркетплейс вместе со всеми его плагинами: `claude plugin marketplace remove claude-kit`.

## Безопасность

**Прочитай хуки перед установкой: они выполняются с твоими правами.** Хук плагина работает вне песочницы, как любая программа, которую ты запускаешь сам. Вот всё, что запускают плагины этого репозитория:

| Плагин | Когда | Команда | Что делает |
|---|---|---|---|
| `ru-guard` | перед каждым `Edit`, `Write`, `MultiEdit` | `node "${CLAUDE_PLUGIN_ROOT}/hooks/guard-files.mjs"` | читает JSON из stdin, смотрит на `tool_input.file_path`, выходит с кодом 0 или 2. Без сети, ничего не пишет на диск. [Исходник](plugins/ru-guard/hooks/guard-files.mjs) |
| `ru-notify` | на каждое уведомление Claude Code | `node "${CLAUDE_PLUGIN_ROOT}/hooks/notify.mjs"` | запускает `osascript` (macOS) или `notify-send` (Linux) с заголовком и текстом уведомления как отдельными аргументами, без shell. Без сети, ничего не пишет на диск. [Исходник](plugins/ru-notify/hooks/notify.mjs) |
| `ru-kit` | - | ничего | только Markdown-инструкции для Claude. Скилл `review-ru` при вызове подставляет вывод `git status --short` и `git diff HEAD` |

Обнови плагин - перечитай хуки: новая версия выполняется с теми же правами.

## Для разработчиков

```bash
npm test                                   # без зависимостей, node --test
claude plugin validate .                   # маркетплейс
claude plugin validate --strict plugins/ru-kit
```

Тесты проверяют, что все JSON-файлы парсятся, маркетплейс перечисляет каждую папку в `plugins/` и версии совпадают с `plugin.json`, у каждого скилла и агента есть `name` и `description` в kebab-case под имя папки, а хук `ru-guard` блокирует `.env`, `.env.local`, `package-lock.json` (код 2 и текст в stderr), пропускает `src/app.js` и не падает на битом входе.

Попробовать плагин без установки: `claude --plugin-dir ./plugins/ru-kit`.

## Учись дальше

- Практикум на GitHub: [FunFactoryDev/claude-code-praktikum](https://github.com/FunFactoryDev/claude-code-praktikum)
- Урок про плагины: [zero2claude.ru/learn/claude-code-pro/2-3-plaginy](https://zero2claude.ru/learn/claude-code-pro/2-3-plaginy)
- Урок про общий набор для команды: [zero2claude.ru/learn/claude-code-pro/5-3-obshchiy-nabor](https://zero2claude.ru/learn/claude-code-pro/5-3-obshchiy-nabor)

## Благодарности и лицензия

Скиллы `five-whys`, `tdd`, `claude-md-review` и агент `code-reviewer` переведены и адаптированы из репозитория [wesammustafa/Claude-Code-Everything-You-Need-to-Know](https://github.com/wesammustafa/Claude-Code-Everything-You-Need-to-Know) (MIT, Copyright (c) 2025 Wesam Abousaid). Оттуда же взяты идеи хуков и формат маркетплейса. Спасибо автору.

Лицензия: [MIT](LICENSE), Copyright (c) 2026 FunFactoryDev. Текст лицензии исходного репозитория сохранён в том же файле.

---

## English plugins (en-*)

The same three plugins, with English texts, for learners of the free course [zero2vibecode.com](https://zero2vibecode.com). They are independent of each other and of the `ru-*` plugins: take only the skills, only the guard, or everything.

| Plugin | What is inside | Runs code on your machine |
|---|---|---|
| `en-kit` | skills `five-whys`, `tdd`, `review-diff`, `claude-md-review` and the `code-reviewer` agent | no (instructions for Claude only) |
| `en-guard` | a hook that keeps Claude from editing `.env` files and lockfiles | yes, `node` before every file edit |
| `en-notify` | a hook that shows a desktop notification | yes, `node` on every Claude Code notification |

### Install

In a Claude Code session:

```
/plugin marketplace add FunFactoryDev/claude-kit
/plugin install en-kit@claude-kit
/plugin install en-guard@claude-kit
/plugin install en-notify@claude-kit
```

`/plugin install` opens the plugin's card, where you confirm the install. Afterwards, restart Claude Code or type `/reload-plugins`.

The same from the terminal, without a session:

```bash
claude plugin marketplace add FunFactoryDev/claude-kit
claude plugin install en-kit@claude-kit
```

Update to a new version: `claude plugin update en-kit@claude-kit`.

### en-kit: skills and an agent

Every skill from a plugin gets the `en-kit:` prefix. Claude can also call a skill on its own when your request matches its description (except `tdd`: only you start that one).

- **`/en-kit:five-whys`** — finds the root cause by asking "why?" down the chain, from the code, tests, logs and git history; guesses are marked as guesses. Changes no files.
  ```
  /en-kit:five-whys the tests fail only in CI and pass locally
  ```
- **`/en-kit:tdd`** — builds a feature one behavior at a time: a failing test, the smallest code that passes it, then cleanup, running the tests after every step. Edits code and tests with your usual permission prompts. Manual start only.
  ```
  /en-kit:tdd slugify turns "Hello, world" into hello-world
  ```
- **`/en-kit:review-diff`** — pulls in the output of `git status --short` and `git diff HEAD` before it runs and reviews the changes for correctness, security and readability, with a file and line for each finding. You can name a focus. Changes no files; it pre-approves only `git diff` and `git status`.
  ```
  /en-kit:review-diff security
  ```
  It needs a git repository with at least one commit: if `git diff HEAD` fails, Claude Code aborts the skill with `Shell command failed`.
- **`/en-kit:claude-md-review`** — checks `CLAUDE.md` for vague rules, links to files that do not exist, stale commands, bloat and conflicts, and reports line numbers with ready rewrites. It does not touch the file and pre-approves only `Read`, `Glob` and `Grep`.
  ```
  /en-kit:claude-md-review
  /en-kit:claude-md-review apps/web/CLAUDE.md
  ```
- **The `code-reviewer` agent** — a subagent that reviews in its own context. Its only tools are `Read`, `Grep` and `Glob`: it can read and search, but cannot edit files or run commands. Report sections: Must fix, Should fix, Consider.
  ```
  @agent-en-kit:code-reviewer review src/auth/login.ts and its tests
  ```
  Or in words: "Ask the code-reviewer agent to look at my changes in src/auth". It cannot run git, so name the files or paste the diff.

### en-guard: protect .env and lockfiles

Before every `Edit` and `Write` call (and `MultiEdit` in older versions), the hook looks at the file name. If it is `.env`, `.env.*` or a lockfile, the call is blocked (exit code 2) and Claude gets the reason and suggests another way.

- **Blocked:** `.env`, `.env.local`, `.env.production` and any other `.env.*`; `package-lock.json`, `npm-shrinkwrap.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lock`, `bun.lockb`, `deno.lock`, `Cargo.lock`, `poetry.lock`, `uv.lock`, `Pipfile.lock`, `Gemfile.lock`, `composer.lock`, `go.sum`, `flake.lock`.
- **Allowed:** secret-free templates `.env.example`, `.env.sample`, `.env.template`, `.env.dist`, and every other file.
- **Not caught:** terminal commands (`Bash`), such as `echo X >> .env`. This guards against an accidental edit; it is not a sandbox. To keep Claude from reading `.env`, add `"permissions": { "deny": ["Read(.env)"] }` to your settings.
- On input it does not understand (broken JSON, no path), the hook lets the call through silently: it never breaks a session.

What Claude sees when an edit is blocked:

```
en-guard: editing .env.local is blocked. .env files hold secrets. Leave this file alone; ...
```

### en-notify: a desktop notification

When Claude Code is waiting for you (asking for permission, or done and waiting for a reply), the hook shows a system notification with Claude Code's text: on macOS through `osascript`, on Linux through `notify-send` if it is installed. Elsewhere it does nothing and stays out of the way.

### Turning a plugin off

- In a session: `/plugin`, pick the plugin and disable it.
- From the terminal: `claude plugin disable en-notify@claude-kit` (back on: `claude plugin enable ...`).
- In settings: set it to `false` in `~/.claude/settings.json` (or in the project's `.claude/settings.local.json`):

```json
{
  "enabledPlugins": {
    "en-notify@claude-kit": false
  }
}
```

Remove it completely: `claude plugin uninstall en-notify@claude-kit`. Remove the marketplace with all its plugins: `claude plugin marketplace remove claude-kit`.

### Safety

**Read the hooks before you install: they run with your permissions.** A plugin hook runs outside the sandbox, like any program you start yourself. This is everything the English plugins run:

| Plugin | When | Command | What it does |
|---|---|---|---|
| `en-guard` | before every `Edit`, `Write`, `MultiEdit` | `node "${CLAUDE_PLUGIN_ROOT}/hooks/guard-files.mjs"` | reads JSON from stdin, looks at `tool_input.file_path`, exits with code 0 or 2. No network, writes nothing to disk. [Source](plugins/en-guard/hooks/guard-files.mjs) |
| `en-notify` | on every Claude Code notification | `node "${CLAUDE_PLUGIN_ROOT}/hooks/notify.mjs"` | runs `osascript` (macOS) or `notify-send` (Linux) with the title and text as separate arguments, no shell. No network, writes nothing to disk. [Source](plugins/en-notify/hooks/notify.mjs) |
| `en-kit` | - | nothing | Markdown instructions for Claude only. The `review-diff` skill pulls in `git status --short` and `git diff HEAD` when you call it |

When you update a plugin, read its hooks again: the new version runs with the same permissions.

### For developers

```bash
npm test                                   # no dependencies, node --test
claude plugin validate --strict .          # the marketplace
claude plugin validate --strict plugins/en-kit
```

The tests also check that every `ru-*` plugin has an `en-*` twin with the same parts, that the `en-*` plugins contain no Russian text, and that `en-guard` blocks and allows the same files as `ru-guard`.

Try a plugin without installing it: `claude --plugin-dir ./plugins/en-kit`.

### Keep learning

- The practicum on GitHub: [FunFactoryDev/claude-code-practicum](https://github.com/FunFactoryDev/claude-code-practicum)
- The lesson on plugins: [zero2vibecode.com/learn/claude-code-pro/2-3-plugins](https://zero2vibecode.com/learn/claude-code-pro/2-3-plugins)
- The lesson on a shared kit for the team: [zero2vibecode.com/learn/claude-code-pro/5-3-team-marketplace](https://zero2vibecode.com/learn/claude-code-pro/5-3-team-marketplace)

The skills `five-whys`, `tdd`, `claude-md-review` and the `code-reviewer` agent are adapted from [wesammustafa/Claude-Code-Everything-You-Need-to-Know](https://github.com/wesammustafa/Claude-Code-Everything-You-Need-to-Know) (MIT, Copyright (c) 2025 Wesam Abousaid). License: [MIT](LICENSE).
