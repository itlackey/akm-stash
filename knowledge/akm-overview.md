# akm Overview for Agents

> **Version target:** akm-cli v0.7.0 (2026-05-04)

**akm** is a CLI package manager for AI-agent assets.
It gives coding assistants (Claude Code, OpenCode, Codex, Cursor, Copilot,
Qwen, etc.) a unified way to discover, install, run, and improve the skills,
commands, agents, knowledge, workflows, wikis, vaults, memories, and lessons
they need.

Canonical repo: <https://github.com/itlackey/akm>
Official registry: <https://github.com/itlackey/akm-registry>

> **Terminology.** akm uses both:
>
> - **working stash** — the local editable directory (default `~/akm`).
> - **stash** — a shareable directory of assets published to GitHub, npm, git,
>   a website source, or another provider.

## The three moving parts

| Concept | What it is | Default location |
|---|---|---|
| **Working stash** | Personal writable asset directory. | `~/akm` |
| **Source** | Place assets come from (filesystem, git/GitHub, npm, website, provider). | configured via `akm add` |
| **Registry** | Discovery index of published stashes you do not already have installed. | `itlackey/akm-registry` |

A published stash is just a shareable directory of assets. akm classifies by
file extension and content, but conventional directories (`skills/`,
`commands/`, `knowledge/`, etc.) improve indexing confidence and maintainability.

## Asset types

| Type | One-liner | Typical file |
|---|---|---|
| `script` | Executable automation. | `scripts/deploy.sh` |
| `skill` | Step-by-step instructions an agent follows. | `skills/release/SKILL.md` |
| `command` | Prompt template with placeholders. | `commands/review-stash.md` |
| `agent` | Specialized subagent prompt. | `agents/security-reviewer.md` |
| `knowledge` | Reference docs with navigation. | `knowledge/api-reference.md` |
| `workflow` | Structured stateful procedure. | `workflows/release.md` |
| `wiki` | Multi-page knowledge base. | `wikis/engineering/index.md` |
| `vault` | Environment key-value pairs; secrets masked. | `vaults/prod.env` |
| `memory` | Context fragments recalled from external systems. | `memories/team-notes.md` |
| `lesson` | Distilled guidance learned from feedback or reflection. | `lessons/search-ranking.md` |

## Ref format

Every asset is addressed by a **ref**:

```text
[origin//]type:name[#version]
```

Examples:

- `skill:review-pr`
- `workflow:publish-stash`
- `github:itlackey/akm-stash//knowledge:akm-cli-reference`
- `npm:@acme/stash//lesson:docker-healthchecks`

Use `akm show <ref>` to inspect an asset. Use `akm run <ref>` for runnable
asset types such as commands, agents, workflows, and scripts.

## What's new in v0.7.0

- **Proposal queue.** `akm reflect`, `akm propose`, and `akm distill` write to a
  durable queue; `akm proposal *` lists, diffs, accepts, and rejects proposals
  before they touch the live stash.
- **`lesson` asset type.** Lessons are first-class assets stored under
  `lessons/` and are normally produced by distillation from feedback.
- **Quality states.** Search hits can carry `quality` such as `generated`,
  `curated`, or `proposed`. Proposed content is excluded from default search
  unless you pass `--include-proposed`.
- **Agent-friendly output.** `--detail=agent` is the preferred way to ask for
  compact action-ready output; `--for-agent` is only a deprecated alias.
- **Scoped search and show.** `akm search --filter key=value` and
  `akm show --scope key=value` let agents work with multi-tenant or
  per-run content safely.
- **Bench support.** `akm-bench` adds paired utility benchmarking and a shared
  fixture-stash format for measuring whether akm assets actually help agents.

## Essential commands at a glance

```bash
akm setup
akm search "deploy"
akm show skill:review-pr --detail=agent
akm add github:owner/repo
akm workflow start workflow:release
akm feedback skill:review-pr --negative --reason "too generic"
akm distill skill:review-pr
akm proposal list
```

## Where to go next

- Install or clone a stash → `skill:install-akm-stash`
- Publish a stash → `skill:publish-akm-stash`
- Review proposals → `skill:manage-akm-proposals`
- Distill feedback into lessons → `skill:distill-feedback-into-lessons`
- Understand fixture and corpus layout → `knowledge:akm-benchmark-fixtures`
- Full command list → `knowledge:akm-cli-reference`
