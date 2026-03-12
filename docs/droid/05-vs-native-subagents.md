# Superpowers vs. Droid's Native Sub-Agent System

Factory Droid has a built-in `Task` tool for dispatching sub-agents. This document
explains why superpowers adds value on top of it.

## What Droid gives you natively

```
┌─────────────────────────────────────┐
│         Droid Task Tool             │
│                                     │
│  • Dispatch sub-agents (droids)     │
│  • Tool restrictions per droid      │
│  • reasoningEffort control          │
│  • TodoWrite for task tracking      │
│  • SubagentStop hook on completion  │
│                                     │
│  You get: raw machinery             │
│  You don't get: workflow            │
└─────────────────────────────────────┘
```

The `Task` tool is an **execution primitive**. It dispatches a droid, waits for
results, and returns output. It doesn't tell you:

- When to dispatch a droid vs. do the work yourself
- What review stages to run and in what order
- How to structure tasks so droids succeed
- When to escalate vs. retry
- How to maintain quality across a multi-task implementation

## What superpowers adds

```
┌─────────────────────────────────────┐
│       Superpowers Skills            │
│                                     │
│  • When to use which droid          │
│  • Two-stage review protocol        │
│  • Spec compliance before quality   │
│  • Escalation paths (BLOCKED, etc.) │
│  • TDD enforcement                  │
│  • Evidence-before-claims rule      │
│  • Worktree isolation protocol      │
│  • Task decomposition methodology   │
│  • Brainstorming-first workflow     │
│                                     │
│  You get: proven development        │
│           process on top of         │
│           raw machinery             │
└─────────────────────────────────────┘
```

## Side-by-side comparison

```
Native Droid only                    With Superpowers
────────────────                     ────────────────

User: "Build auth"                   User: "Build auth"
   │                                    │
   ▼                                    ▼
Droid starts coding                  brainstorming skill activates
immediately                          → Questions, alternatives, design doc
   │                                    │
   ▼                                    ▼
Maybe writes tests,                  writing-plans creates detailed tasks
maybe doesn't                        → 2-5 min each, with file paths
   │                                    │
   ▼                                    ▼
Runs into issues                     using-git-worktrees isolates work
halfway through                      → droid --worktree auth
   │                                    │
   ▼                                    ▼
Tries to fix,                        subagent-driven-development
context gets polluted                → Fresh implementer per task
   │                                → spec-reviewer catches gaps
   ▼                                → code-quality-reviewer checks quality
Claims "done"                        → SubagentStop hook reminds workflow
(maybe it is,                           │
 maybe it isn't)                        ▼
                                     verification-before-completion
                                     → Run tests fresh, read output
                                        │
                                        ▼
                                     finishing-a-development-branch
                                     → Tests pass → Create-PR
```

## Key differences

| Aspect | Native only | With superpowers |
|--------|------------|-----------------|
| Design phase | None — jumps to code | Brainstorming with Socratic questioning |
| Task planning | Ad-hoc | Structured 2-5 min tasks with specs |
| Isolation | Manual | Native `droid --worktree` |
| Implementation | Single long-running context | Fresh droid per task (no pollution) |
| Review | Optional, unstructured | Mandatory two-stage: spec → quality |
| Review tools | Full access (could modify code) | Read-only (can only analyze) |
| Test discipline | Suggested | Enforced (RED-GREEN-REFACTOR) |
| Completion claims | Trust agent's word | Evidence required (fresh test run) |
| Escalation | None | BLOCKED / NEEDS_CONTEXT status codes |
| Quality gates | None | Must pass spec + quality before next task |

## When superpowers matters most

- **Multi-task features** — Without workflow discipline, context pollution causes
  later tasks to fail or deviate.
- **Team projects** — The review chain catches issues before they compound.
  Read-only reviewers can't accidentally "fix" things.
- **Production code** — TDD + verification-before-completion means you can trust
  the output.

## When native is enough

- **One-off scripts** — Quick tasks that don't need review or testing discipline.
- **Exploration** — Research tasks where you're reading, not writing.
- **Simple fixes** — Single-file, obvious bugs with clear solutions.
