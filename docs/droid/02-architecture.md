# Architecture

## How superpowers works

Skills auto-activate based on task context. A `SessionStart` hook injects routing
instructions, and each skill declares when it should fire via its `description` field.

```
┌──────────────────────────────────────────────────────────────────┐
│                        DROID SESSION                             │
│                                                                  │
│  SessionStart hook                                               │
│  └─→ Injects using-superpowers skill context                    │
│      └─→ Every task is checked against skill descriptions       │
│                                                                  │
│  User says: "Build a login page"                                │
│  └─→ brainstorming activates (creative work detected)           │
│      └─→ Design approved                                        │
│          └─→ writing-plans activates                             │
│              └─→ Plan approved                                   │
│                  └─→ using-git-worktrees activates               │
│                      └─→ Worktree ready                          │
│                          └─→ subagent-driven-development         │
│                              └─→ Per task:                       │
│                                  ├─→ implementer droid           │
│                                  ├─→ spec-reviewer droid         │
│                                  ├─→ code-quality-reviewer droid │
│                                  └─→ SubagentStop hook fires     │
│                                                                  │
│  All tasks done                                                  │
│  └─→ finishing-a-development-branch activates                    │
│      └─→ Tests pass → Create-PR / Merge / Keep / Discard        │
└──────────────────────────────────────────────────────────────────┘
```

## Original vs. this fork

```
ORIGINAL (Claude Code)                  THIS FORK (Factory Droid)
══════════════════════                  ═════════════════════════

┌─────────────────────┐                ┌─────────────────────────┐
│    code-reviewer    │                │  code-reviewer          │
│    (full tools)     │                │  (read-only, high)      │
│                     │                ├─────────────────────────┤
│  Single generic     │                │  spec-reviewer          │
│  agent definition   │                │  (read-only, high)      │
│                     │                ├─────────────────────────┤
│  No tool            │                │  code-quality-reviewer  │
│  restrictions       │                │  (read-only, high)      │
│                     │                ├─────────────────────────┤
│  No reasoning       │                │  plan-reviewer          │
│  control            │                │  (read-only, high)      │
│                     │                ├─────────────────────────┤
└─────────────────────┘                │  implementer            │
                                       │  (full tools, medium)   │
                                       └─────────────────────────┘

┌─────────────────────┐                ┌─────────────────────────┐
│  Hooks:             │                │  Hooks:                 │
│  · SessionStart     │                │  · SessionStart         │
│                     │                │  · SubagentStop (new)   │
└─────────────────────┘                └─────────────────────────┘

┌─────────────────────┐                ┌─────────────────────────┐
│  Worktrees:         │                │  Worktrees:             │
│  · Manual git       │                │  · droid --worktree     │
│    commands only    │                │  · Manual fallback      │
└─────────────────────┘                └─────────────────────────┘

┌─────────────────────┐                ┌─────────────────────────┐
│  PR creation:       │                │  PR creation:           │
│  · gh pr create     │                │  · Create-PR tool       │
│                     │                │  · gh fallback          │
└─────────────────────┘                └─────────────────────────┘
```

## Tool name mapping

Skills reference Claude Code tool names as the canonical form. In Droid:

| Skill references | Droid equivalent | Notes |
|-----------------|------------------|-------|
| `Bash` | `Execute` | Run shell commands |
| `Write` | `Create` | Create new files |
| `WebFetch` | `FetchUrl` | Fetch URLs |
| `Read` | `Read` | Same |
| `Edit` | `Edit` | Same |
| `Glob` | `Glob` | Same |
| `Grep` | `Grep` | Same |
| `Task` | `Task` | Dispatch droids |
| `TodoWrite` | `TodoWrite` | Auto-included for every droid |

Droid-only tools: `LS`, `ApplyPatch`, `AskUser`, `Create-PR`.

### Missing primitives (no Droid equivalent)

| Claude Code primitive | Droid status | Workaround |
|---|---|---|
| `Skill` tool (explicit invocation) | Not available | Skills auto-activate via description matching; `/skills` to browse |
| `EnterPlanMode` tool | Not available | `brainstorming` skill activates automatically for creative work |

## Droid lifecycle per task

```
          implementer droid
          ┌──────────────────┐
          │ 1. Read task spec │
          │ 2. Ask questions  │◄── controller answers
          │ 3. Implement      │
          │ 4. Write tests    │
          │ 5. Self-review    │
          │ 6. Commit         │
          │ 7. Report status  │
          └────────┬─────────┘
                   │
        ┌──────────▼──────────┐
        │ SubagentStop hook   │──→ reminds review workflow
        └──────────┬──────────┘
                   │
          spec-reviewer droid
          ┌──────────────────┐
          │ tools: read-only │
          │                  │
          │ Verify impl      │
          │ matches spec     │
          │ exactly           │
          └────────┬─────────┘
                   │
                   ▼
            ✅ pass ──→ code-quality-reviewer droid
            ❌ fail ──→ implementer fixes → re-review
                        ┌──────────────────┐
                        │ tools: read-only │
                        │                  │
                        │ Check quality,   │
                        │ testing, security│
                        └────────┬─────────┘
                                 │
                                 ▼
                          ✅ approved ──→ next task
                          ❌ issues  ──→ implementer fixes
```

## File layout

```
~/.factory/plugins/cache/superpowers-droid/superpowers/<hash>/
# (or ~/.factory/superpowers-droid/ for manual installs)
├── .factory-plugin/
│   ├── plugin.json              # Droid plugin manifest
│   └── marketplace.json         # Marketplace definition
├── .claude-plugin/
│   └── marketplace.json         # Backward-compatible marketplace
├── droids/
│   ├── code-reviewer.md         # read-only, high reasoning
│   ├── spec-reviewer.md         # read-only, high reasoning
│   ├── code-quality-reviewer.md # read-only, high reasoning
│   ├── plan-reviewer.md         # read-only, high reasoning
│   └── implementer.md           # full tools, medium reasoning
├── hooks/
│   ├── hooks.json               # Hook event → script mapping
│   ├── run-hook.cmd             # Cross-platform hook runner
│   ├── session-start            # SessionStart: inject skill context
│   └── subagent-stop            # SubagentStop: review reminder
├── skills/
│   ├── brainstorming/
│   ├── dispatching-parallel-agents/
│   ├── executing-plans/
│   ├── finishing-a-development-branch/
│   ├── receiving-code-review/
│   ├── requesting-code-review/
│   ├── subagent-driven-development/
│   ├── systematic-debugging/
│   ├── test-driven-development/
│   ├── using-git-worktrees/
│   ├── using-superpowers/
│   ├── verification-before-completion/
│   ├── writing-plans/
│   └── writing-skills/
├── scripts/
│   └── install.mjs              # Interactive Node.js installer
├── docs/
│   └── droid/                   # Documentation
├── install.sh                   # One-liner wrapper
└── README.md
```
