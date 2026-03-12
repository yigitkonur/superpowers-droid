# Skills Reference

All 14 skills, their triggers, and how they connect.

## Workflow skills (ordered pipeline)

| # | Skill | Activates when | What it does |
|---|-------|---------------|--------------|
| 1 | `brainstorming` | Creative work detected | Socratic design refinement: asks questions, explores alternatives, presents design in sections for approval |
| 2 | `writing-plans` | Design approved | Breaks work into 2–5 minute tasks with file paths, code, and verification steps |
| 3 | `using-git-worktrees` | Plan ready for execution | Creates isolated branch+workspace; prefers `droid --worktree` |
| 4 | `subagent-driven-development` | Plan ready, same session | Dispatches implementer → spec-reviewer → code-quality-reviewer per task |
| 4b | `executing-plans` | Plan ready, separate session | Batch execution with human checkpoints every 3 tasks |
| 5 | `test-driven-development` | Implementation in progress | RED → GREEN → REFACTOR. No production code without failing test |
| 6 | `requesting-code-review` | Task or feature complete | Dispatches code-reviewer droid, categorizes issues by severity |
| 7 | `verification-before-completion` | About to claim "done" | Run tests fresh, read output, then claim. Evidence before assertions |
| 8 | `finishing-a-development-branch` | All tasks complete | Verify tests → present 4 options: merge / PR / keep / discard |

## Support skills

| Skill | Activates when | What it does |
|-------|---------------|--------------|
| `systematic-debugging` | Bug, test failure, or unexpected behavior | 4-phase root cause: observe → hypothesize → test → fix |
| `dispatching-parallel-agents` | 2+ independent tasks, no shared state | Concurrent droid dispatch with coordination |
| `receiving-code-review` | PR feedback arrives | Technical rigor in responding to review — verify before accepting |
| `using-superpowers` | Every conversation start | Routing layer: checks all skills against current task |
| `writing-skills` | Creating or editing skills | Skill authoring best practices and testing methodology |

## Skill activation flow

```
User message received
        │
        ▼
  Does any skill match?
   │              │
   │ yes          │ no
   ▼              ▼
 Load skill     Respond
 content        normally
   │
   ▼
 Announce:
 "Using [skill]
  to [purpose]"
   │
   ▼
 Has checklist?
  │         │
  │ yes     │ no
  ▼         ▼
 Create    Follow
 TodoWrite skill
 per item  directly
```

## Skill dependencies

```
brainstorming
    └──→ writing-plans
            └──→ using-git-worktrees
                    └──→ subagent-driven-development
                    │       ├──→ test-driven-development
                    │       ├──→ requesting-code-review
                    │       └──→ verification-before-completion
                    │
                    └──→ executing-plans (alternative)
                            ├──→ test-driven-development
                            ├──→ requesting-code-review
                            └──→ verification-before-completion
                                        │
                                        ▼
                              finishing-a-development-branch
```

## Iron laws

These are enforced across all skills — no exceptions:

1. **TDD** — No production code without a failing test first. Code written before test = delete it.
2. **Root Cause First** — No fixes without Phase 1 investigation. 3+ failed fixes = escalate.
3. **Evidence Before Claims** — No "done" / "fixed" / "passing" without running verification fresh.
