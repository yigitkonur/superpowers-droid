# Copilot CLI Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your Copilot CLI equivalent:

| Skill references | Copilot CLI equivalent |
|---|---|
| `Task` tool (dispatch subagent) | `task` tool (same concept — isolated context subagent) |
| Multiple `Task` calls (parallel) | `/fleet` command or multiple `task` calls |
| `TodoWrite` (task tracking) | Track tasks natively — create a checklist, use SQLite, or markdown |
| `Skill` tool (invoke a skill) | `/skill-name` slash command or auto-invocation via description match |
| `Read` (file reading) | `view` |
| `Write` (file creation) | `create` |
| `Edit` (file editing) | `edit` |
| `Bash` (run commands) | `bash` |
| `Glob` (file patterns) | `glob` |
| `Grep` (content search) | `grep` or `rg` |
| `WebFetch` (web requests) | `web_fetch` |
| `EnterPlanMode` | N/A — use the brainstorming skill instead |

## Subagent dispatch

Copilot CLI has native subagent support via the `task` tool:

- Each subagent runs in its own **isolated context window**
- Custom agents can be targeted: `copilot --agent code-reviewer --prompt "..."`
- For parallel execution, use `/fleet` which decomposes tasks and runs subagents concurrently
- Subagents can use different models: "Use GPT-5.4 to implement, Use Claude to review"

## Task tracking

Copilot CLI does not have a rigid `TodoWrite` tool. Instead:

- Track tasks using your preferred method (markdown checklists, SQLite DB, or session state)
- The agent will autonomously create and manage task tracking when asked
- `/fleet` internally uses SQLite for dependency-aware task management
- For complex multi-step plans, create a SQLite database for nested, dependency-aware tracking

## Fleet command

`/fleet` enables parallel sub-agent execution:

1. Breaks complex requests into independent subtasks
2. Assesses inter-task dependencies
3. Assigns each subtask to a subagent (can target custom agents)
4. Runs subagents concurrently with isolated contexts
5. Aggregates results and resolves remaining dependencies
