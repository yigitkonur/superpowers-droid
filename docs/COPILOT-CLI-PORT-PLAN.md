# Superpowers for Copilot CLI — Port Plan

## Project: `superpowers-copilot`
**Fork of:** [obra/superpowers](https://github.com/obra/superpowers) v5.0.1
**Target:** GitHub Copilot CLI native plugin
**Author:** Yigit Konur ([@yigitkonur](https://github.com/yigitkonur))

---

## Executive Summary

Port the complete obra/superpowers skill framework to GitHub Copilot CLI as a first-class plugin. Copilot CLI's plugin system is nearly identical to Claude Code's — same `plugin.json`, same `SKILL.md` format, same hooks system (actually a superset). The `task` tool provides direct subagent dispatch, and `/fleet` enables parallel execution. TodoWrite is replaced by Copilot CLI's native SQLite-based task tracking.

**Conversion feasibility: 100%** — every feature has a direct or superior equivalent.

---

## Architecture Mapping

### Plugin Manifest

| Original (Claude Code) | Target (Copilot CLI) | Change |
|---|---|---|
| `.claude-plugin/plugin.json` | `plugin.json` at root (Copilot also searches `.claude-plugin/plugin.json`) | Move to root, add `commands` field |

**New `plugin.json` schema:**
```json
{
  "name": "superpowers",
  "description": "Agentic skills framework for Copilot CLI: TDD, debugging, collaboration patterns, and proven development workflows",
  "version": "1.0.0",
  "author": {
    "name": "Yigit Konur",
    "email": "yigit@konur.dev"
  },
  "homepage": "https://github.com/yigitkonur/superpowers-copilot",
  "repository": "https://github.com/yigitkonur/superpowers-copilot",
  "license": "MIT",
  "keywords": ["skills", "tdd", "debugging", "collaboration", "best-practices", "workflows", "copilot-cli"],
  "agents": "agents/",
  "skills": "skills/",
  "commands": "commands/",
  "hooks": "hooks.json",
  "mcpServers": ".mcp.json"
}
```

### Tool Mapping (Claude Code → Copilot CLI)

| Claude Code Tool | Copilot CLI Tool | Notes |
|---|---|---|
| `Read` | `view` | Identical function |
| `Write` | `create` | Identical function |
| `Edit` | `edit` | Identical function |
| `Bash` | `bash` | Identical |
| `Glob` | `glob` | Identical |
| `Grep` | `grep` / `rg` | Both available |
| `Task` (subagent) | `task` | Built-in! Direct equivalent |
| `TodoWrite` | Native SQLite task tracking | Agent creates DB autonomously when told to track work |
| `Skill` tool | `/skill-name` or auto-invocation | Skills load via description match or slash command |
| `WebFetch` | `web_fetch` | Identical |
| `EnterPlanMode` | N/A | Superpowers already replaces this with brainstorming |

### Hooks Mapping

| Claude Code Hook | Copilot CLI Hook | Change Required |
|---|---|---|
| `SessionStart` (custom matcher format) | `sessionStart` (standard format) | Restructure JSON |
| N/A | `sessionEnd` | **NEW** — can add cleanup logic |
| N/A | `userPromptSubmitted` | **NEW** — can add prompt logging |
| `PreToolUse` | `preToolUse` | Same concept |
| `PostToolUse` | `postToolUse` | Same concept |
| N/A | `errorOccurred` | **NEW** — can add error handling |

**Copilot CLI exclusive feature: Prompt hooks**
```json
{
  "sessionStart": [
    { "type": "prompt", "prompt": "/using-superpowers" }
  ]
}
```
This auto-submits the `/using-superpowers` skill on session start — no bash script needed for context injection!

### Agent Files

| Original | Target | Change |
|---|---|---|
| `agents/code-reviewer.md` | `agents/code-reviewer.agent.md` | Rename + add `tools` field to frontmatter |

**New agent frontmatter format:**
```yaml
---
name: code-reviewer
description: |
  Use this agent when a major project step has been completed...
tools: ["view", "bash", "glob", "grep"]
---
```

### Subagent Dispatch

| Feature | Claude Code | Copilot CLI |
|---|---|---|
| Single subagent | `Task` tool | `task` tool |
| Parallel subagents | Multiple `Task` calls | `/fleet` command + `task` tool |
| Subagent isolation | Own context window | Own context window |
| Custom agent as subagent | `Agent` tool with `subagent_type` | `--agent <name>` or inference from description |

### TodoWrite Replacement Strategy

Copilot CLI has no `TodoWrite` tool, but this is **not a gap** — it's an opportunity:

1. **Copilot CLI naturally creates SQLite task databases** when asked to track work
2. The `/fleet` command uses "a sqlite database per session" for dependency-aware task tracking
3. Third-party tools like `td` (marcus/td) provide full SQLite-backed task management

**Strategy:** Replace all `TodoWrite` references in skills with generic language:
- "Create TodoWrite" → "Create a task checklist to track progress"
- "Mark task complete in TodoWrite" → "Mark the task complete in your tracking system"
- "Use TodoWrite to create todos" → "Track each checklist item"

The agent will autonomously decide the best tracking method (SQLite, markdown, or built-in session state).

---

## File-by-File Change List

### Phase 1: Plugin Structure (create/move)

| # | Task | Files | Effort |
|---|---|---|---|
| 1.1 | Create root `plugin.json` | `plugin.json` (new) | 5 min |
| 1.2 | Remove Claude Code plugin dir | Delete `.claude-plugin/` | 1 min |
| 1.3 | Remove Cursor plugin dir | Delete `.cursor-plugin/` | 1 min |
| 1.4 | Remove Codex config dir | Delete `.codex/` | 1 min |
| 1.5 | Remove OpenCode config dir | Delete `.opencode/` | 1 min |
| 1.6 | Remove Gemini config | Delete `gemini-extension.json`, `GEMINI.md` | 1 min |
| 1.7 | Create `.copilot-plugin/` fallback | `.copilot-plugin/plugin.json` (symlink or copy) | 2 min |

### Phase 2: Hooks (rewrite)

| # | Task | Files | Effort |
|---|---|---|---|
| 2.1 | Rewrite `hooks.json` to Copilot format | `hooks.json` (rewrite) | 5 min |
| 2.2 | Rewrite `session-start` script for Copilot env vars | `hooks/session-start` (modify) | 10 min |
| 2.3 | Update `run-hook.cmd` for Copilot env detection | `hooks/run-hook.cmd` (modify) | 5 min |
| 2.4 | Add `sessionEnd` hook for cleanup | `hooks/session-end` (new) | 5 min |
| 2.5 | Add `errorOccurred` hook for debugging aid | `hooks/error-occurred` (new) | 5 min |
| 2.6 | **Add prompt hook** for auto-skill-load | `hooks.json` (add prompt entry) | 2 min |

### Phase 3: Agents (rename + enhance)

| # | Task | Files | Effort |
|---|---|---|---|
| 3.1 | Rename agent file | `agents/code-reviewer.md` → `agents/code-reviewer.agent.md` | 1 min |
| 3.2 | Add `tools` field to agent frontmatter | `agents/code-reviewer.agent.md` | 2 min |

### Phase 4: Tool Reference (create)

| # | Task | Files | Effort |
|---|---|---|---|
| 4.1 | Create Copilot CLI tool mapping | `skills/using-superpowers/references/copilot-tools.md` (new) | 10 min |
| 4.2 | Update `using-superpowers` SKILL.md to reference copilot-tools.md | `skills/using-superpowers/SKILL.md` | 5 min |

### Phase 5: Skill Updates (find & replace across all 14 skills)

| # | Task | Files Affected | Effort |
|---|---|---|---|
| 5.1 | Replace `TodoWrite` → generic task tracking language | 4 files: `using-superpowers/SKILL.md`, `subagent-driven-development/SKILL.md`, `executing-plans/SKILL.md`, `writing-skills/SKILL.md` | 15 min |
| 5.2 | Replace `Skill` tool references → `/skill-name` or auto-invocation | 2 files: `using-superpowers/SKILL.md`, skill cross-references | 10 min |
| 5.3 | Replace `EnterPlanMode` references | 1 file: `using-superpowers/SKILL.md` | 2 min |
| 5.4 | Replace `Task` tool references → `task` tool | 5 files: subagent prompts, dispatching-parallel-agents, requesting-code-review | 10 min |
| 5.5 | Replace `superpowers:skill-name` cross-references → `superpowers/skill-name` | All skills with cross-references | 10 min |
| 5.6 | Add `/fleet` guidance to `dispatching-parallel-agents` | 1 file | 5 min |
| 5.7 | Update `writing-skills/persuasion-principles.md` TodoWrite refs | 1 file | 2 min |

### Phase 6: Copilot-Specific Enhancements

| # | Task | Files | Effort |
|---|---|---|---|
| 6.1 | Add `/fleet` integration to `dispatching-parallel-agents` skill | SKILL.md | 10 min |
| 6.2 | Add model selection guidance (GPT-5.4, Claude, etc.) to subagent skills | `subagent-driven-development/SKILL.md` | 5 min |
| 6.3 | Add autopilot mode guidance to execution skills | `executing-plans/SKILL.md` | 5 min |
| 6.4 | Create `COPILOT.md` for platform-specific instructions | `COPILOT.md` (new) | 10 min |
| 6.5 | Add `preToolUse` hook for safety checks (optional) | `hooks/pre-tool-use` (new) | 10 min |

### Phase 7: Documentation & Distribution

| # | Task | Files | Effort |
|---|---|---|---|
| 7.1 | Rewrite README.md for Copilot CLI audience | `README.md` | 30 min |
| 7.2 | Create INSTALL.md | `INSTALL.md` (new) | 10 min |
| 7.3 | Create marketplace manifest | `.github/plugin/marketplace.json` (new) | 5 min |
| 7.4 | Clean up: remove Claude/Codex/OpenCode/Gemini references from docs/ | `docs/` | 10 min |
| 7.5 | Update RELEASE-NOTES.md | `RELEASE-NOTES.md` | 5 min |
| 7.6 | Remove `skills/using-superpowers/references/codex-tools.md` | Delete | 1 min |
| 7.7 | Remove `skills/using-superpowers/references/gemini-tools.md` | Delete | 1 min |

### Phase 8: Testing

| # | Task | Files | Effort |
|---|---|---|---|
| 8.1 | Test plugin install via `copilot plugin install` | Manual | 5 min |
| 8.2 | Verify all 14 skills load via `/skills list` | Manual | 5 min |
| 8.3 | Test `sessionStart` hook fires correctly | Manual | 5 min |
| 8.4 | Test agent dispatch via `task` tool | Manual | 10 min |
| 8.5 | Test `/fleet` parallel execution | Manual | 10 min |
| 8.6 | Test skill auto-invocation from description matching | Manual | 10 min |

---

## New `hooks.json` (Complete)

```json
{
  "version": 1,
  "hooks": {
    "sessionStart": [
      {
        "type": "command",
        "bash": "./hooks/session-start",
        "powershell": "./hooks/run-hook.cmd session-start",
        "cwd": ".",
        "timeoutSec": 10
      },
      {
        "type": "prompt",
        "prompt": "You have superpowers skills installed. Before responding to any task, check if a skill applies. Use /skills list to see available skills."
      }
    ],
    "sessionEnd": [
      {
        "type": "command",
        "bash": "./hooks/session-end",
        "powershell": "./hooks/run-hook.cmd session-end",
        "cwd": ".",
        "timeoutSec": 5
      }
    ],
    "errorOccurred": [
      {
        "type": "command",
        "bash": "./hooks/error-occurred",
        "powershell": "./hooks/run-hook.cmd error-occurred",
        "cwd": ".",
        "timeoutSec": 5
      }
    ]
  }
}
```

## New Copilot CLI Tool Mapping (`copilot-tools.md`)

```markdown
# Copilot CLI Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your Copilot CLI equivalent:

| Skill references | Copilot CLI equivalent |
|---|---|
| `Task` tool (dispatch subagent) | `task` tool |
| Multiple `Task` calls (parallel) | `/fleet` command or multiple `task` calls |
| `TodoWrite` (task tracking) | Track tasks natively (agent manages via SQLite or markdown) |
| `Skill` tool (invoke a skill) | `/skill-name` slash command or auto-invocation via description match |
| `Read` (file reading) | `view` |
| `Write` (file creation) | `create` |
| `Edit` (file editing) | `edit` |
| `Bash` (run commands) | `bash` |
| `Glob` (file patterns) | `glob` |
| `Grep` (content search) | `grep` or `rg` |
| `WebFetch` (web requests) | `web_fetch` |
| `EnterPlanMode` | N/A — use brainstorming skill instead |

## Subagent dispatch

Copilot CLI has native subagent support via the `task` tool:
- Each subagent runs in its own isolated context window
- Custom agents can be targeted: `copilot --agent code-reviewer --prompt "..."`
- For parallel execution, use `/fleet` which decomposes tasks and runs subagents concurrently

## Task tracking

Copilot CLI does not have a `TodoWrite` tool. Instead:
- Track tasks using your preferred method (markdown checklists, SQLite, or session state)
- The agent will autonomously create and manage task tracking when asked
- `/fleet` internally uses SQLite for dependency-aware task management
```

---

## Total Estimated Effort

| Phase | Tasks | Time |
|---|---|---|
| 1. Plugin Structure | 7 | ~12 min |
| 2. Hooks | 6 | ~32 min |
| 3. Agents | 2 | ~3 min |
| 4. Tool Reference | 2 | ~15 min |
| 5. Skill Updates | 7 | ~54 min |
| 6. Copilot Enhancements | 5 | ~40 min |
| 7. Documentation | 7 | ~62 min |
| 8. Testing | 6 | ~45 min |
| **TOTAL** | **42 tasks** | **~4.5 hours** |

---

## Copilot-Specific Advantages Over Claude Code Version

| Feature | Claude Code | Copilot CLI Port |
|---|---|---|
| Session start skill injection | Bash script + JSON output | **Prompt hook** — zero-script auto-invocation |
| Parallel agent dispatch | Manual `Task` calls | **`/fleet`** — built-in decomposition + parallel execution |
| Error handling hook | Not available | **`errorOccurred`** — automatic error context capture |
| Session end cleanup | Not available | **`sessionEnd`** — worktree cleanup, stats logging |
| Model selection in subagents | Single model | **Multi-model** — "Use GPT-5.4 for X, Use Claude for Y" |
| Autopilot mode | Not available | **Autopilot** — hands-free execution with `/fleet` |
| Plugin manifest search | `.claude-plugin/` only | Searches `plugin.json`, `.github/plugin/`, AND `.claude-plugin/` |
| Todo tracking | `TodoWrite` (rigid) | **Native SQLite** (flexible, dependency-aware, nested) |
| Prompt logging hook | Not available | **`userPromptSubmitted`** — can log/audit prompts |
