# superpowers-droid

> A [Factory Droid](https://www.factory.ai/) fork of [@obra](https://github.com/obra)'s [superpowers](https://github.com/obra/superpowers) — the composable skills framework that turns coding agents into disciplined engineers.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/yigitkonur/superpowers-droid/main/install.sh)"
```

The installer is interactive — it checks prerequisites, asks user-level vs. project-level, and shows each step. Safe to re-run. [Details →](docs/droid/06-installation.md)

---

## Why this fork

[Superpowers](https://github.com/obra/superpowers) by [@obra](https://github.com/obra) is a complete development workflow for coding agents: brainstorming → planning → TDD → code review → verification, all orchestrated through composable skills that auto-activate based on context.

The original targets **Claude Code**. This fork adapts it for **Factory Droid**, which exposes capabilities Claude Code doesn't have:

```
CLAUDE CODE (original)                   FACTORY DROID (this fork)
══════════════════════                   ═════════════════════════

  1 generic agent                          5 specialized droids
  (full tool access)                       (tool-restricted)

  ┌──────────────────┐                    ┌──────────────────────┐
  │  code-reviewer   │                    │  code-reviewer       │
  │  can read files  │                    │  tools: read-only    │
  │  can edit files  │◄── problem         │  reasoningEffort: hi │
  │  can run code    │                    ├──────────────────────┤
  │  can delete files│                    │  spec-reviewer       │
  └──────────────────┘                    │  tools: read-only    │
                                          ├──────────────────────┤
  No reasoning control                    │  code-quality-rev.   │
  No worktree flag                        │  tools: read-only    │
  No SubagentStop hook                    ├──────────────────────┤
  No Create-PR tool                       │  plan-reviewer       │
                                          │  tools: read-only    │
                                          ├──────────────────────┤
                                          │  implementer         │
                                          │  tools: full         │
                                          │  reasoningEffort: med│
                                          └──────────────────────┘

                                          + droid --worktree
                                          + SubagentStop hook
                                          + Create-PR tool
```

[Full changelog →](docs/droid/01-why-this-fork.md)

## How it works

Skills auto-activate when your task matches their trigger. You don't invoke them manually — the agent checks for applicable skills before every response.

```
User: "Build a login page"
     │
     ▼
 brainstorming ──→ Questions, alternatives, design doc
     │
     ▼
 writing-plans ──→ Detailed tasks (2-5 min each, with file paths)
     │
     ▼
 using-git-worktrees ──→ droid --worktree login
     │
     ▼
 subagent-driven-development
     │
     ├──→ implementer droid ──→ builds task, writes tests, commits
     │         │
     │    spec-reviewer droid ──→ "does it match the spec?" (read-only)
     │         │
     │    code-quality-reviewer ──→ "is it well-built?" (read-only)
     │         │
     │    SubagentStop hook ──→ reminds review workflow
     │
     ▼ (repeat per task)
 finishing-a-development-branch ──→ tests pass → Create-PR
```

[Architecture details →](docs/droid/02-architecture.md)

## What's different from Droid's native sub-agents

Droid's built-in `Task` tool dispatches sub-agents. Superpowers adds the **workflow** on top:

| | Native `Task` only | With superpowers |
|---|---|---|
| Design phase | None | Socratic brainstorming |
| Task planning | Ad-hoc | Structured 2-5 min tasks |
| Review | Optional | Mandatory two-stage (spec → quality) |
| Reviewer tools | Full access | `read-only` — can't accidentally modify |
| Test discipline | Suggested | Enforced RED-GREEN-REFACTOR |
| Completion claims | Trust agent's word | Evidence required (fresh test run) |

[Detailed comparison →](docs/droid/05-vs-native-subagents.md)

## Install / uninstall

**One-liner** (macOS):

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/yigitkonur/superpowers-droid/main/install.sh)"
```

**Uninstall:**

```bash
node ~/.factory/superpowers-droid/scripts/install.mjs --uninstall
```

**Manual:**

```bash
git clone https://github.com/yigitkonur/superpowers-droid ~/.factory/superpowers-droid
chmod +x ~/.factory/superpowers-droid/hooks/*
```

The Node.js installer is interactive, shows progress per step, and is idempotent — safe for re-installs with update/reinstall/cancel options.

[Installation guide →](docs/droid/06-installation.md)

## Skills

14 composable skills, auto-activating based on context:

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `brainstorming` | Creative work | Socratic design refinement |
| `writing-plans` | Design approved | Detailed implementation tasks |
| `using-git-worktrees` | Plan ready | Isolated workspace (`droid --worktree`) |
| `subagent-driven-development` | Plan ready | Fresh droid per task + two-stage review |
| `executing-plans` | Plan ready (alt) | Batch execution with human checkpoints |
| `test-driven-development` | Implementation | RED → GREEN → REFACTOR |
| `systematic-debugging` | Bug found | 4-phase root cause analysis |
| `requesting-code-review` | Task complete | Dispatch reviewer droid |
| `receiving-code-review` | PR feedback | Rigorous response to review |
| `verification-before-completion` | Claiming "done" | Evidence before assertions |
| `finishing-a-development-branch` | All tasks done | Merge / PR / keep / discard |
| `dispatching-parallel-agents` | 2+ independent tasks | Concurrent droid dispatch |
| `writing-skills` | Creating skills | Authoring best practices |
| `using-superpowers` | Every session | Routing layer |

[Skills reference →](docs/droid/03-skills-reference.md)

## Droids

5 tool-restricted agent definitions:

| Droid | `tools` | `reasoningEffort` | Role |
|-------|---------|-------------------|------|
| `code-reviewer` | `read-only` | `high` | Final review against plan |
| `spec-reviewer` | `read-only` | `high` | Verify impl matches spec |
| `code-quality-reviewer` | `read-only` | `high` | Quality after spec passes |
| `plan-reviewer` | `read-only` | `high` | Review plans before execution |
| `implementer` | full | `medium` | Execute individual tasks |

Reviewers **cannot modify code** — `tools: read-only` restricts them to `Read`, `Grep`, `Glob`, `LS`.

[Droids reference →](docs/droid/04-droids-reference.md)

## Documentation

| Doc | Content |
|-----|---------|
| [docs/droid/01-why-this-fork.md](docs/droid/01-why-this-fork.md) | Motivation, full changelog |
| [docs/droid/02-architecture.md](docs/droid/02-architecture.md) | System design, file layout, tool mapping |
| [docs/droid/03-skills-reference.md](docs/droid/03-skills-reference.md) | All 14 skills with triggers and dependencies |
| [docs/droid/04-droids-reference.md](docs/droid/04-droids-reference.md) | All 5 droids with frontmatter and behavior |
| [docs/droid/05-vs-native-subagents.md](docs/droid/05-vs-native-subagents.md) | Superpowers vs. Droid's built-in `Task` tool |
| [docs/droid/06-installation.md](docs/droid/06-installation.md) | Install, uninstall, re-install, configuration |

## Credits

Built on [superpowers](https://github.com/obra/superpowers) by [@obra](https://github.com/obra) (Jesse Vincent).

Read the original blog post: [Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/)

## License

MIT — see [LICENSE](LICENSE)
