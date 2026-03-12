# Factory Droid Tool Mapping

Skills use Claude Code tool names as the canonical reference. When you encounter these in a skill, use your Droid equivalent:

| Skill references | Droid equivalent |
|-----------------|------------------|
| `Bash` (run commands) | `Execute` |
| `Write` (create files) | `Create` |
| `WebFetch` (fetch URLs) | `FetchUrl` |
| `Read` (read files) | `Read` (same) |
| `Edit` (edit files) | `Edit` (same) |
| `Glob` (file patterns) | `Glob` (same) |
| `Grep` (search content) | `Grep` (same) |
| `Task` (dispatch subagent) | `Task` (same — dispatches custom droids) |
| `TodoWrite` (task tracking) | `TodoWrite` (same — auto-included for every droid) |
| `WebSearch` (web search) | `WebSearch` (same) |
| `Skill` tool (invoke a skill) | Skills auto-activate or use `/skill-name` slash command |
| Multiple `Task` calls (parallel) | Multiple `Task` calls with different `subagent_type` droids |

## Droid-exclusive tools (not in Claude Code)

| Tool | Purpose |
|------|---------|
| `LS` | List directory contents |
| `ApplyPatch` | Apply unified diffs (auto-included with Edit for OpenAI models) |
| `AskUser` | Interactive questionnaire with structured choices |
| `Create-PR` | Guided pull request creation workflow |

## Custom droid tool restrictions

Droids support a `tools` frontmatter field to restrict which tools a subagent can use:

| Category | Tools included |
|----------|---------------|
| `read-only` | `Read`, `LS`, `Grep`, `Glob` |
| `edit` | `Create`, `Edit`, `ApplyPatch` |
| `execute` | `Execute` |
| `web` | `WebSearch`, `FetchUrl` |

Example: `tools: read-only` makes a reviewer droid that can analyze but never modify code.

## Droid-exclusive features

- `reasoningEffort: low|medium|high` — per-droid reasoning depth control
- `--worktree [name]` flag — native git worktree isolation
- `/skills` command — browse, enable/disable skills interactively
- `/create-skill` command — scaffold new skills from CLI
- `SubagentStop` hook — auto-trigger logic when a sub-droid completes
- `SessionEnd` hook — cleanup when session ends
- `Missions` (`droid exec --mission`) — non-interactive plan execution
