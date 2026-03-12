# why this fork exists

[obra/superpowers](https://github.com/obra/superpowers) by [@obra](https://github.com/obra) is a
complete software development workflow for coding agents — TDD, debugging, subagent-driven
development, brainstorming, and code review, all orchestrated through composable skills.

The original targets **Claude Code** and its plugin system. This fork adapts superpowers for
**[Factory Droid](https://www.factory.ai/)** — a coding CLI that shares the same agent architecture
but exposes capabilities Claude Code doesn't have.

## what Factory Droid adds

| Capability | Claude Code | Factory Droid |
|------------|-------------|---------------|
| Tool restrictions per agent | Not supported | `tools: read-only` in frontmatter |
| Reasoning depth control | Not supported | `reasoningEffort: low\|medium\|high` |
| Native worktree isolation | Not available | `droid --worktree feature-name` |
| Guided PR creation | Must use `gh` CLI | Built-in `Create-PR` tool |
| Structured user prompts | Free-text only | `AskUser` tool with choices |
| After-completion hooks | Not available | `SubagentStop` hook event |
| Agent definitions | `agents/*.md` | `droids/*.md` with metadata |

## what changed in this fork

### structural

- `.claude-plugin/` → `.factory-plugin/` (Droid plugin manifest)
- `agents/` → `droids/` with `tools`, `reasoningEffort`, and `model` frontmatter
- Removed: `.cursor-plugin/`, `.codex/`, `.opencode/`, `gemini-extension.json`
- Removed: deprecated `commands/` directory
- Removed: Claude Code / Codex / OpenCode / Gemini specific tests and docs

### droids (new)

Five tool-restricted droid definitions replace the single generic `code-reviewer` agent:

| Droid | Tools | Reasoning | Role |
|-------|-------|-----------|------|
| `code-reviewer` | read-only | high | Final review against plan |
| `spec-reviewer` | read-only | high | Verify impl matches spec |
| `code-quality-reviewer` | read-only | high | Check quality after spec passes |
| `plan-reviewer` | read-only | high | Review plans before execution |
| `implementer` | full | medium | Execute tasks from plan |

### hooks

- `SessionStart` — updated for `DROID_PLUGIN_ROOT` detection
- `SubagentStop` — **new** — auto-injects review workflow reminder after any droid completes

### skills (all 14)

Every skill updated:
- Tool name references canonicalized (see [02-architecture.md](02-architecture.md))
- "Claude Code" → "Factory Droid" where appropriate
- "agent/subagent" → "droid" in context-appropriate locations
- `CLAUDE.md` → `AGENTS.md` for config references
- `finishing-a-development-branch` — enhanced with `Create-PR` tool
- `using-git-worktrees` — enhanced with native `droid --worktree`
- `using-superpowers` — rewritten for Droid skill auto-activation

### installer

New interactive Node.js installer with:
- User-level or project-level install
- Idempotent (safe for re-installs)
- Clean uninstall
- macOS one-liner support

---

also ported to codex cli: [superpowers-codex](https://github.com/yigitkonur/superpowers-codex)
