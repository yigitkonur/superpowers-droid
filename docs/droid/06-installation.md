# Installation

## Quick install (macOS)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/yigitkonur/superpowers-droid/main/install.sh)"
```

The installer is interactive — it will ask where to install and show progress for
each step.

## Install options

### User-level (recommended)

Available in all Droid sessions across all projects:

```bash
# interactive
node scripts/install.mjs

# non-interactive
node scripts/install.mjs --user
```

Installs to `~/.factory/superpowers-droid/`.

### Project-level

Available only in the current project:

```bash
node scripts/install.mjs --project
```

Installs to `./.factory/superpowers-droid/`.

### Manual

```bash
git clone https://github.com/yigitkonur/superpowers-droid ~/.factory/superpowers-droid
chmod +x ~/.factory/superpowers-droid/hooks/*
```

## Uninstall

```bash
# interactive
node scripts/install.mjs --uninstall

# non-interactive
node scripts/install.mjs --uninstall --user
node scripts/install.mjs --uninstall --project
```

The uninstaller:
1. Removes the plugin directory
2. Cleans the superpowers block from `AGENTS.md` (if present)
3. Leaves everything else untouched

## Re-install safety

The installer is idempotent. Running it again when superpowers is already installed
will prompt:

```
? Superpowers is already installed. What would you like to do?
  → 1. Update — pull latest changes
    2. Reinstall — remove and install fresh
    3. Cancel — do nothing
```

No data loss on double-install. The **Update** option runs `git pull --ff-only`.
The **Reinstall** option removes the directory completely and clones fresh.

## Verify installation

Start a new Droid session:

```bash
droid
```

The `SessionStart` hook should inject superpowers context. Browse available skills:

```
/skills
```

Try triggering a skill:

```
Help me plan a new feature
```

The `brainstorming` skill should activate automatically.

## Prerequisites

| Tool | Required | Notes |
|------|----------|-------|
| `git` | Yes | For cloning the repo |
| `node` | Yes (>=18) | For the interactive installer |
| `droid` | Recommended | Superpowers installs without it, but won't activate |

## Updating

```bash
cd ~/.factory/superpowers-droid && git pull
```

Or re-run the installer — it will detect the existing install and offer to update.

## Configuration

### AGENTS.md

The installer can add a superpowers routing block to `~/.factory/AGENTS.md`.
This tells Droid to check for applicable skills before every task.

If you prefer manual control, add this to your AGENTS.md:

```markdown
## Superpowers Workflow

Before responding to ANY task, check for applicable superpowers skills.
Skills auto-activate when your task matches their description, or browse
with `/skills`.
```

### Hooks

Hooks are configured in `hooks/hooks.json` and reference `DROID_PLUGIN_ROOT`:

- **SessionStart** — Fires on session start/resume/clear/compact
- **SubagentStop** — Fires when any dispatched droid completes

Both hooks inject context via `hookSpecificOutput.additionalContext`.
