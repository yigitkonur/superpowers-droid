# Superpowers Workflow — Mandatory

You have the **superpowers** plugin installed. You MUST follow the Superpowers skill pipeline for all non-trivial work. This is not optional.

## Mandatory Skill Usage

Before responding to ANY task, invoke the `superpowers:using-superpowers` skill. This is your routing layer — it determines which skill applies.

### Pipeline (follow in order)

1. **Design phase** — For any feature, component, modification, or creative work:
   - Invoke `superpowers:brainstorming` BEFORE writing any code
   - Do NOT skip this even if the task "seems simple"

2. **Planning phase** — After design is approved:
   - Invoke `superpowers:writing-plans` to create a structured implementation plan
   - Plans go to `docs/superpowers/plans/`

3. **Isolation** — Before any implementation:
   - Invoke `superpowers:using-git-worktrees` to create an isolated worktree

4. **Execution** — To implement the plan:
   - Invoke `superpowers:subagent-driven-development` (preferred — uses two-stage review via `task` tool)
   - For parallel independent tasks, use `/fleet` to decompose and dispatch automatically
   - Fallback: `superpowers:executing-plans` (single-session, no subagents)

5. **Testing discipline** — All implementation code:
   - Invoke `superpowers:test-driven-development` — RED → GREEN → REFACTOR
   - No production code without a failing test first

6. **Debugging** — For any bug, test failure, or unexpected behavior:
   - Invoke `superpowers:systematic-debugging` BEFORE proposing fixes
   - Complete Phase 1 (root cause) before any fix attempt

7. **Review** — After completing work:
   - Invoke `superpowers:requesting-code-review` to dispatch the code-reviewer agent

8. **Verification** — Before claiming "done", "fixed", or "passing":
   - Invoke `superpowers:verification-before-completion`
   - Run the verification command fresh, read full output, THEN claim

9. **Finishing** — When all work is complete:
   - Invoke `superpowers:finishing-a-development-branch`
   - Tests must pass → present 4 options (merge/PR/keep/discard)

### Other Skills (invoke when relevant)

- `superpowers:receiving-code-review` — When PR feedback arrives
- `superpowers:dispatching-parallel-agents` — 2+ independent failures, no shared state
- `superpowers:writing-skills` — When creating or editing skills

## Iron Laws (zero exceptions)

1. **TDD**: No production code without a failing test first. Code before test = delete it.
2. **Root Cause First**: No fixes without Phase 1 investigation. 3+ failed fixes = escalate.
3. **Evidence Before Claims**: No "done"/"fixed"/"passing" without running verification fresh.

## Copilot CLI Features

- **Subagent dispatch**: Use the `task` tool for isolated subagent execution
- **Parallel execution**: Use `/fleet` to decompose complex tasks into concurrent subagents
- **Task tracking**: Create task tracking natively (SQLite, markdown checklists, or any method)
- **Multi-model**: Assign different models to different subagents based on task complexity
- **Safety hooks**: Pre-tool-use hooks block force-push to main and dangerous git operations

## Anti-Patterns (DO NOT)

- Do NOT skip brainstorming because "it's just a small change"
- Do NOT write code before writing a failing test
- Do NOT claim completion without running tests and reading output
- Do NOT trust subagent completion reports without verifying the diff
- Do NOT propose fixes before investigating root cause
