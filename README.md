# Superpowers for Copilot CLI

A complete software development workflow for [GitHub Copilot CLI](https://docs.github.com/en/copilot/github-copilot-in-the-cli), built on composable "skills" that enforce TDD, systematic debugging, design-first development, and subagent-driven execution.

Forked from [obra/superpowers](https://github.com/obra/superpowers) and reimplemented for Copilot CLI's native features: hooks, `task` subagent dispatch, `/fleet` parallel execution, and SQLite-based task tracking.

## How It Works

When you start your Copilot CLI session with this plugin installed, it doesn't just jump into writing code. Instead:

1. It steps back and asks what you're really trying to do (**brainstorming**)
2. It creates a design spec and gets your approval
3. It writes a detailed implementation plan with bite-sized TDD tasks (**writing-plans**)
4. It dispatches subagents per task with two-stage code review (**subagent-driven-development**)
5. It verifies everything works before claiming completion (**verification-before-completion**)

Skills trigger automatically based on context. Your coding agent just has Superpowers.

## Installation

### From Source (Plugin Install)

```bash
# Clone the repository
git clone https://github.com/yigitkonur/superpowers-copilot.git

# Copilot CLI discovers plugins via plugin.json in the repo root
# Point your session to the plugin directory, or symlink it:
ln -s /path/to/superpowers-copilot ~/.copilot-cli/plugins/superpowers
```

### Verify Installation

Start a new Copilot CLI session and ask for something that should trigger a skill:

```
"Help me plan this feature"     → triggers brainstorming
"Let's debug this issue"        → triggers systematic-debugging
"Fix this bug"                  → triggers systematic-debugging + TDD
```

The agent should automatically invoke the relevant superpowers skill.

## The Basic Workflow

1. **brainstorming** — Refines ideas through questions, explores alternatives, presents design for validation
2. **using-git-worktrees** — Creates isolated workspace on new branch, verifies clean test baseline
3. **writing-plans** — Breaks work into bite-sized TDD tasks (2-5 min each) with exact file paths and code
4. **subagent-driven-development** — Dispatches fresh `task` subagent per task with two-stage review
5. **test-driven-development** — RED-GREEN-REFACTOR: failing test → minimal code → refactor
6. **requesting-code-review** — Dispatches code-reviewer agent between tasks
7. **finishing-a-development-branch** — Verifies tests, presents merge/PR/keep/discard options

## Copilot CLI Features

This fork leverages Copilot CLI-specific capabilities:

| Feature | How Superpowers Uses It |
|---------|------------------------|
| **`task` tool** | Subagent dispatch for implementers, reviewers, and spec checkers |
| **`/fleet` command** | Parallel execution of independent tasks with dependency-aware scheduling |
| **Hooks (`hooks.json`)** | Session-start prompt injection, pre-tool-use safety checks, error logging |
| **Prompt hooks** | Context injection that actually works (unlike bash output which is ignored) |
| **SQLite task tracking** | Native task management — ask the agent to track tasks and it creates SQLite |
| **Multi-model subagents** | Assign cheap models for mechanical tasks, capable models for review |
| **Safety hooks** | Blocks force-push to main/master and `git reset --hard` outside worktrees |

## What's Inside

### Skills Library

**Core Workflow**
- **brainstorming** — Socratic design refinement before coding
- **writing-plans** — Detailed implementation plans with TDD structure
- **executing-plans** — Batch execution with checkpoints (no subagents)
- **subagent-driven-development** — Fast iteration with two-stage review

**Testing & Quality**
- **test-driven-development** — RED-GREEN-REFACTOR cycle
- **verification-before-completion** — Evidence before claims
- **requesting-code-review** — Pre-review dispatch to code-reviewer agent
- **receiving-code-review** — Technical evaluation of feedback

**Debugging**
- **systematic-debugging** — 4-phase root cause process
- **dispatching-parallel-agents** — Concurrent investigation of independent failures

**Git & Integration**
- **using-git-worktrees** — Parallel development branches
- **finishing-a-development-branch** — Merge/PR decision workflow

**Meta**
- **writing-skills** — Create new skills with TDD methodology
- **using-superpowers** — Introduction and routing layer

### Agents

- **code-reviewer** — Dispatched as subagent for code quality review

### Hooks

- **session-start** — Legacy detection, session logging
- **pre-tool-use** — Safety: blocks force-push and dangerous git operations
- **error-occurred** — Logs errors for systematic-debugging context
- **prompt hook** — Injects skill awareness into every session

## Three Iron Laws

1. **TDD**: No production code without a failing test first. Code before test = delete it.
2. **Root Cause First**: No fixes without Phase 1 investigation. 3+ failed fixes = escalate.
3. **Evidence Before Claims**: No "done"/"fixed"/"passing" without running verification fresh.

## Project Structure

```
superpowers-copilot/
├── plugin.json              # Copilot CLI plugin manifest
├── hooks.json               # Hook definitions (prompt + command hooks)
├── COPILOT.md               # Project instructions template
├── agents/
│   └── code-reviewer.agent.md
├── hooks/
│   ├── session-start        # Session startup (side effects only)
│   ├── pre-tool-use         # Safety checks (actionable output)
│   ├── error-occurred       # Error logging
│   └── run-hook.cmd         # Cross-platform wrapper
├── skills/
│   ├── using-superpowers/   # Entry point + tool mapping
│   ├── brainstorming/       # Design phase (includes visual companion)
│   ├── writing-plans/       # Planning phase
│   ├── subagent-driven-development/  # Execution with review
│   ├── executing-plans/     # Single-session execution
│   ├── test-driven-development/     # TDD enforcement
│   ├── systematic-debugging/        # Root cause process
│   ├── dispatching-parallel-agents/ # Parallel subagent dispatch
│   ├── requesting-code-review/      # Review dispatch
│   ├── receiving-code-review/       # Review reception
│   ├── verification-before-completion/  # Evidence gates
│   ├── using-git-worktrees/         # Workspace isolation
│   ├── finishing-a-development-branch/  # Completion workflow
│   └── writing-skills/              # Skill creation methodology
└── commands/                # Deprecated slash commands
```

## Contributing

1. Fork the repository
2. Create a branch for your skill
3. Follow the `writing-skills` skill for creating and testing new skills
4. Submit a PR

See `skills/writing-skills/SKILL.md` for the complete guide.

## Credits

Based on [Superpowers](https://github.com/obra/superpowers) by [Jesse Vincent](https://github.com/obra). Original blog post: [Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/).

## License

MIT License — see LICENSE file for details.
