# Droids Reference

Droids are tool-restricted agent definitions in `droids/*.md`. Each has frontmatter
controlling its capabilities.

## Frontmatter fields

| Field | Values | Effect |
|-------|--------|--------|
| `tools` | `read-only` | Restricts to `Read`, `LS`, `Grep`, `Glob` only |
| `reasoningEffort` | `low` / `medium` / `high` | Controls depth of analysis |
| `model` | `inherit` / specific model | Which model to use |

## Droid definitions

### `code-reviewer`

```yaml
tools: read-only
reasoningEffort: high
```

**Role:** Final code review against the original plan after all tasks complete.

**Dispatched by:** `requesting-code-review` skill, `subagent-driven-development` (final step).

**What it checks:**
- Plan alignment — deviations from planned approach
- Code quality — patterns, error handling, naming, maintainability
- Architecture — SOLID, separation of concerns, scalability
- Test coverage and quality
- Security vulnerabilities

**Output:** Strengths, Issues (Critical / Important / Minor), Assessment.

**Key constraint:** Cannot modify code. Read-only tools ensure it can only analyze and report.

---

### `spec-reviewer`

```yaml
tools: read-only
reasoningEffort: high
```

**Role:** Verify an implementation matches its specification exactly — nothing more, nothing less.

**Dispatched by:** `subagent-driven-development` after each implementer completes.

**What it checks:**
- Missing requirements the implementer skipped
- Extra features that weren't requested
- Misinterpretations of the spec

**Output:** `✅ Spec compliant` or `❌ Issues found` with file:line references.

**Key behavior:** Does NOT trust the implementer's self-report. Reads actual code independently.

---

### `code-quality-reviewer`

```yaml
tools: read-only
reasoningEffort: high
```

**Role:** Review code quality AFTER spec compliance has been confirmed.

**Dispatched by:** `subagent-driven-development` after spec-reviewer passes.

**What it checks:**
- Clean code, naming, error handling
- File responsibilities and decomposition
- Test quality (behavioral, not mock-heavy)
- Security and performance patterns
- New file sizes and growth

**Output:** Strengths, Issues (Critical / Important / Minor), Assessment (Approved / Needs fixes).

---

### `plan-reviewer`

```yaml
tools: read-only
reasoningEffort: high
```

**Role:** Review implementation plans before execution begins.

**Dispatched by:** Optionally after `writing-plans` completes.

**What it checks:**
- Completeness against requirements
- Task ordering and dependency correctness
- Feasibility and task sizing
- Clarity for implementer droids

**Output:** Assessment (Ready / Needs revision), Issues, Suggestions.

---

### `implementer`

```yaml
tools: (full — no restrictions)
reasoningEffort: medium
```

**Role:** Execute individual tasks from a plan. Given a task spec + context, implements
the feature end-to-end.

**Dispatched by:** `subagent-driven-development` for each task.

**What it does:**
1. Asks clarifying questions (if needed)
2. Implements exactly what the task specifies
3. Writes tests (TDD if required)
4. Self-reviews before reporting
5. Commits work
6. Reports status: `DONE` / `DONE_WITH_CONCERNS` / `BLOCKED` / `NEEDS_CONTEXT`

**Key behavior:** Will escalate (`BLOCKED`) rather than produce uncertain work. Medium
reasoning keeps it fast for straightforward tasks.

## Review chain

```
implementer ──→ spec-reviewer ──→ code-quality-reviewer
                     │                    │
                     │ ❌ issues          │ ❌ issues
                     ▼                    ▼
              implementer fixes    implementer fixes
                     │                    │
                     ▼                    ▼
              spec-reviewer       code-quality-reviewer
              (re-review)         (re-review)
```

The chain always runs in this order. Code quality review never starts before
spec compliance passes.
