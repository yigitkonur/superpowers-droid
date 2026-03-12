# superpowers-droid

> structured agentic workflows for [Factory Droid](https://www.factory.ai/). fork of [obra/superpowers](https://github.com/obra/superpowers).

## install

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/yigitkonur/superpowers-droid/main/install.sh)"
```

or with flags:

```bash
npx superpowers-droid install --user       # all sessions
npx superpowers-droid install --project    # this project only
npx superpowers-droid uninstall --user
npx superpowers-droid status
```

the installer uses droid's native plugin system when available (`droid plugin install`), falls back to git clone + AGENTS.md injection. safe to re-run.

[installation guide →](docs/droid/06-installation.md)

## what this is

[superpowers](https://github.com/obra/superpowers) is a skill-based development workflow by [@obra](https://github.com/obra). 14 composable skills enforce design-before-code, TDD, two-stage review, and evidence-based verification. the original targets Claude Code.

this fork ports everything to Factory Droid, replacing tool names and adding droid-native capabilities:

```
claude code                          factory droid
───────────                          ─────────────
Bash                             →   Execute
Write                            →   Create
WebFetch                         →   FetchUrl
Task (subagent)                  →   Task (same)
CLAUDE.md                        →   AGENTS.md
1 generic agent                  →   5 tool-restricted droids
no reasoning control             →   reasoningEffort: high/medium
manual git worktree              →   droid --worktree
no subagent completion hook      →   SubagentStop hook
gh pr create                     →   Create-PR tool
```

[why this fork →](docs/droid/01-why-this-fork.md)

## how it works

skills auto-activate when your task matches their description. you don't invoke them — droid checks before every response.

```
user: "build a login page"
     │
     ▼
 brainstorming ──→ questions, alternatives, spec doc
     │
     ▼
 writing-plans ──→ 2-5 min tasks with file paths
     │
     ▼
 using-git-worktrees ──→ droid --worktree login
     │
     ▼
 subagent-driven-development
     │
     ├──→ implementer droid ──→ builds, tests, commits
     │         │
     │    spec-reviewer droid ──→ "matches spec?" (read-only)
     │         │
     │    code-quality-reviewer ──→ "well built?" (read-only)
     │
     ▼
 finishing-a-development-branch ──→ Create-PR
```

[architecture →](docs/droid/02-architecture.md)

## vs native droid

droid ships with a `Task` tool for dispatching sub-agents. superpowers adds the workflow on top:

| | native `Task` only | with superpowers |
|---|---|---|
| design phase | none | socratic brainstorming → spec |
| task granularity | "build the feature" | 2-5 minute steps |
| review | optional, full-access | mandatory, two-stage, read-only |
| test discipline | suggested | enforced RED-GREEN-REFACTOR |
| completion claims | trust the agent | evidence required (fresh test run) |
| debugging | guess and retry | 4-phase root cause investigation |

[full comparison →](docs/droid/05-vs-native-subagents.md)

## skills

14 composable skills, auto-activating:

| skill | when | what |
|---|---|---|
| `brainstorming` | creative work | socratic design → spec document |
| `writing-plans` | spec approved | 2-5 min tasks with exact paths |
| `using-git-worktrees` | plan ready | `droid --worktree` isolation |
| `subagent-driven-development` | plan ready | fresh droid per task + two-stage review |
| `executing-plans` | plan ready (alt) | single-session with checkpoints |
| `test-driven-development` | implementation | RED → GREEN → REFACTOR |
| `systematic-debugging` | bug found | 4-phase root cause analysis |
| `requesting-code-review` | task complete | dispatch reviewer droid |
| `receiving-code-review` | PR feedback | rigorous technical response |
| `verification-before-completion` | claiming "done" | evidence before assertions |
| `finishing-a-development-branch` | all tasks done | merge / PR / keep / discard |
| `dispatching-parallel-agents` | 2+ independent tasks | concurrent droid dispatch |
| `writing-skills` | creating skills | TDD for documentation |
| `using-superpowers` | every session | routing layer |

[skills reference →](docs/droid/03-skills-reference.md)

## droids

5 tool-restricted agent definitions — reviewers cannot modify code:

| droid | tools | reasoning | role |
|---|---|---|---|
| `implementer` | full | medium | builds tasks, writes tests, commits |
| `spec-reviewer` | read-only | high | does the code match the spec? |
| `code-quality-reviewer` | read-only | high | is it well-built? |
| `code-reviewer` | read-only | high | final review against plan |
| `plan-reviewer` | read-only | high | is the plan feasible? |

`tools: read-only` restricts to `Read`, `Grep`, `Glob`, `LS` only.

[droids reference →](docs/droid/04-droids-reference.md)

## iron laws

1. no production code without a failing test first
2. no fixes without root cause investigation
3. no "done" without running verification fresh

## known limitations

two upstream primitives have no droid equivalent:

| missing | impact | workaround |
|---|---|---|
| `Skill` tool | can't invoke skills by tool name | auto-activation by description. browse with `/skills`. |
| `EnterPlanMode` | no dedicated plan-mode UI | `brainstorming` skill triggers automatically |

everything else maps 1:1. see [architecture →](docs/droid/02-architecture.md) for the full table.

## docs

| doc | content |
|---|---|
| [01-why-this-fork](docs/droid/01-why-this-fork.md) | motivation, changelog |
| [02-architecture](docs/droid/02-architecture.md) | system design, tool mapping, file layout |
| [03-skills-reference](docs/droid/03-skills-reference.md) | all 14 skills with triggers |
| [04-droids-reference](docs/droid/04-droids-reference.md) | all 5 droids with frontmatter |
| [05-vs-native-subagents](docs/droid/05-vs-native-subagents.md) | superpowers vs raw `Task` tool |
| [06-installation](docs/droid/06-installation.md) | install, uninstall, configuration |

## also available for

- [superpowers-codex](https://github.com/yigitkonur/superpowers-codex) — same 14 skills for OpenAI Codex CLI
- [obra/superpowers](https://github.com/obra/superpowers) — the original, for Claude Code

## credits

built on [superpowers](https://github.com/obra/superpowers) by [@obra](https://github.com/obra) (Jesse Vincent). MIT license.
