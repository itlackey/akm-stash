---
description: Use when an agent needs a quick conceptual overview of akm, its asset types, and the major v0.8.0 surfaces.
tags: [akm, overview, concepts]
quality: curated
updated: 2026-05-23
refs: []
---

# akm Overview for Agents

> **Version target:** akm-cli v0.8.0 (2026-05-09)

**akm** is a CLI package manager for AI-agent assets.
It gives coding assistants (Claude Code, OpenCode, Codex, Cursor, Copilot,
Qwen, etc.) a unified way to discover, install, run, and improve the skills,
commands, agents, knowledge, workflows, wikis, vaults, memories, lessons, and
tasks they need.

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
| `task` | Scheduled prompt or workflow execution. | `tasks/daily-review.yml` |

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

## What's new in v0.8.0

- **Improvement surface redesign.** `akm improve` replaces the public
  `reflect` and `distill` split for updates and lesson distillation.
- **Proposal review renames.** `akm proposals`, `akm show proposal:<id>`,
  `akm diff <id>`, `akm accept`, and `akm reject` replace the older
  `akm proposal *` subcommands. `akm diff` accepts a UUID, a UUID prefix,
  or a `proposal:<id>` ref positionally.
- **Task assets.** `tasks/<id>.yml` is now a first-class asset type for
  scheduled workflow or prompt execution through `akm tasks`. Each task
  picks exactly one target: `workflow:`, `prompt:`, or `command:`.
- **Belief-aware memory cleanup.** Improvement runs can prune or consolidate
  memory more safely before proposing durable updates.
- **Quality states.** Search hits can carry `quality` such as `generated`,
  `curated`, or `proposed`. Proposed content is excluded from default search
  unless you pass `--include-proposed`.

## Essential commands at a glance

```bash
akm setup
akm search "deploy"
akm show skill:review-pr --detail=agent
akm add github:owner/repo
akm workflow start workflow:release
akm feedback skill:review-pr --negative --reason "too generic"
akm improve skill:review-pr
akm proposals
akm tasks list
```

## Where to go next

- Install or clone a stash → `skill:install-akm-stash`
- Publish a stash → `skill:publish-akm-stash`
- Review proposals → `skill:manage-akm-proposals`
- Turn repeated feedback into reusable lessons → `akm improve <ref>` (the
  improvement loop natively distills feedback into lesson proposals as of
  akm-cli 0.8)
- Full command list → `knowledge:akm-cli-reference`
