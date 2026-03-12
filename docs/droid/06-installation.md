# installation

## quick install (macOS)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/yigitkonur/superpowers-droid/main/install.sh)"
```

The installer is interactive — it will ask where to install and show progress for each step.

## how the installer works

When the Droid CLI is available (recommended), the installer uses the **plugin system**:

1. Registers the superpowers-droid marketplace:
   `droid plugin marketplace add https://github.com/yigitkonur/superpowers-droid.git`
2. Installs the plugin:
   `droid plugin install superpowers@superpowers-droid --scope user`
3. Appends a superpowers workflow block to `AGENTS.md`

The plugin is cached at `~/.factory/plugins/cache/superpowers-droid/superpowers/<hash>/`.

When Droid CLI is **not** available, falls back to:
1. `git clone` to `~/.factory/superpowers-droid/`
2. `AGENTS.md` injection for skill routing

## install options

### user-level (recommended)

Available in all Droid sessions across all projects:

```bash
# interactive
node scripts/install.mjs

# non-interactive
node scripts/install.mjs --user
```

### project-level

Available only in the current project:

```bash
node scripts/install.mjs --project
```

### manual

```bash
git clone https://github.com/yigitkonur/superpowers-droid ~/.factory/superpowers-droid
chmod +x ~/.factory/superpowers-droid/hooks/*
```

Note: manual installs require adding a routing block to your AGENTS.md (see Configuration below).

## uninstall

```bash
# interactive
node scripts/install.mjs --uninstall

# non-interactive
node scripts/install.mjs --uninstall --user
node scripts/install.mjs --uninstall --project
```

The uninstaller:
1. Removes the plugin via `droid plugin uninstall` (or removes cloned directory for manual installs)
2. Removes the marketplace registration
3. Cleans the superpowers block from `AGENTS.md` (preserves other content)

## re-install safety

The installer is idempotent. Running it again when superpowers is already installed
will either auto-update (non-interactive mode) or prompt:

```
? Superpowers is already installed. What would you like to do?
  → 1. Update — pull latest changes
    2. Reinstall — remove and install fresh
    3. Cancel — do nothing
```

No data loss on double-install.

**Safety guard**: The installer will refuse to delete directories that contain the
running script or match the current working directory.

## verify installation

Check plugin status:

```bash
droid plugin list
# Should show: superpowers@superpowers-droid  [user]  <hash>
```

Start a new Droid session:

```bash
droid
```

Browse available skills:

```
/skills
```

Try triggering a skill:

```
Help me plan a new feature
```

The `brainstorming` skill should activate automatically.

## prerequisites

| Tool | Required | Notes |
|------|----------|-------|
| `git` | Yes | For cloning the repo |
| `node` | Yes (>=18) | For the interactive installer |
| `droid` | Recommended | Plugin system install; falls back to manual clone without it |

## updating

With plugin system install:
```bash
droid plugin update superpowers@superpowers-droid
```

With manual install:
```bash
cd ~/.factory/superpowers-droid && git pull
```

Or re-run the installer — it will detect the existing install and offer to update.

## configuration

### AGENTS.md

The installer adds a superpowers routing block to `~/.factory/AGENTS.md` (user-level)
or `./AGENTS.md` (project-level). This tells Droid to check for applicable skills.

If you prefer manual control, add this to your AGENTS.md:

```markdown
<!-- superpowers:start -->
## Superpowers Workflow

Before responding to ANY task, check for applicable superpowers skills.
Skills auto-activate when your task matches their description, or browse
with `/skills`.
<!-- superpowers:end -->
```

The sentinel comments (`<!-- superpowers:start/end -->`) are required for clean uninstall.

### hooks

Hooks are configured in `hooks/hooks.json` and reference `DROID_PLUGIN_ROOT`:

- **SessionStart** — Fires on session start/resume/clear/compact
- **SubagentStop** — Fires when any dispatched droid completes

Both hooks inject context via `hookSpecificOutput.additionalContext`.
