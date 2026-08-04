---
description: Use when an agent needs a quick conceptual overview of akm, its asset types, and the major 0.9.0 surfaces.
tags: [akm, overview, concepts]
quality: curated
updated: 2026-08-04
refs: []
---

# akm Overview for Agents

> **Version target:** akm-cli 0.9.0

**akm** is a CLI package manager for AI-agent assets.
It gives coding assistants (Claude Code, OpenCode, Codex, Cursor, Copilot,
Qwen, etc.) a unified way to discover, install, run, and improve the skills,
commands, agents, knowledge, workflows, LLM wikis, env configs, secrets, memories,
lessons, and tasks they need.

Canonical repo: <https://github.com/itlackey/akm>
Official registry: <https://github.com/itlackey/akm-registry>

> **Terminology.** "Stash" as a noun was retired in 0.9.0 in favor of
> **bundle** everywhere — env vars, config keys, and JSON fields all say
> `bundle` now:
>
> - **working bundle** — the local editable directory (default `~/akm`).
> - **bundle** — a shareable directory of assets published to GitHub, npm,
>   git, a website source, or another provider. Registries still discover and
>   list them as "stashes" in some legacy naming (e.g. the registry index's
>   `stashes[]` array), but the CLI noun is `bundle`.

## The three moving parts

| Concept | What it is | Default location |
|---|---|---|
| **Working bundle** | Personal writable asset directory. | `~/akm` |
| **Source** | Place assets come from (filesystem, git/GitHub, npm, website, provider). | configured via `akm bundle add` |
| **Registry** | Discovery index of published bundles you do not already have installed. | `itlackey/akm-registry` |

A published bundle is just a shareable directory of assets. akm classifies by
file extension, content, and (0.9.0) a per-format bundle adapter, but
conventional directories (`skills/`, `commands/`, `knowledge/`, etc.) improve
indexing confidence and maintainability.

## Asset types

| Type | One-liner | Typical file |
|---|---|---|
| `script` | Executable automation. | `scripts/deploy.sh` |
| `skill` | Step-by-step instructions an agent follows. | `skills/release/SKILL.md` |
| `command` | Prompt template with placeholders. | `commands/review-stash.md` |
| `agent` | Specialized subagent prompt. | `agents/security-reviewer.md` |
| `knowledge` | Reference docs with navigation. | `knowledge/api-reference.md` |
| `workflow` | Structured, stateful, steps-driven procedure. | `workflows/release.md` |
| `env` | Group of related config/credential values for an app or service. | `env/prod.env` |
| `secret` | Single whole-file secret (token, key, cert). | `secrets/deploy-key` |
| `memory` | Context fragments recalled from external systems. | `memories/team-notes.md` |
| `lesson` | Distilled guidance learned from feedback or reflection. | `lessons/search-ranking.md` |
| `task` | Scheduled prompt, command, or workflow execution. | `tasks/daily-review.yml` |
| `instruction` | Plain reference doc, same shape as knowledge. | `instructions/deploy-notes.md` |
| `session` | Generated session-extraction record. | `sessions/claude-code/<id>.md` |
| `fact` | Durable bundle-level semantic knowledge. | `facts/team-timezone.md` |

The legacy `vault` type and the `akm wiki` command family are both gone. An
LLM wiki (Karpathy-style `schema.md` + `pages/`) is a first-class **bundle
format**, recognized and indexed automatically — there is no dedicated `wiki`
asset type or verb group.

## Ref format

Every asset is addressed by a **ref** in the `[bundle//]conceptId` grammar —
a subdir-qualified concept id, with an optional `bundle//` installation
prefix and an optional `#fragment`:

```text
[bundle//]<subdir>/<name>[#fragment]
```

Examples:

- `skills/review-pr`
- `workflows/publish-stash`
- `github:itlackey/akm-stash//knowledge/akm-cli-reference`
- `npm:@acme/stash//lessons/docker-healthchecks`

The pre-0.9.0 colon grammar (a type name, a colon, then the asset name) was
retired with no compatibility alias — a colon-style ref fails to resolve. The short,
bundle-omitted form is input sugar: it resolves against the default bundle,
then installation-priority order. Use `akm show <ref>` to inspect an asset.
Use `akm workflow run <ref>` for workflow runs and `akm task run <id>` for
scheduled task assets.

## What's new in 0.9.0

- **Command-surface overhaul (hard break, no aliases).** `akm init` →
  `akm bundle create`; `akm add`/`list`/`remove`/`update` → `akm bundle
  add`/`list`/`remove`/`update`; `akm tasks` → `akm task`; `akm extract` →
  `akm proposal extract`; `akm propose` → `akm proposal new`. Retired
  spellings fail fast with an `UNKNOWN_COMMAND` error and a replacement hint.
- **Ref grammar overhaul.** `type:name` → `[bundle//]conceptId`
  (`skills/code-review`, `memories/vpn-note`, `env/prod`).
- **`vault` is gone.** Use `env/<name>` for a whole `.env` group and
  `secrets/<name>` for a single sensitive value.
- **`akm wiki` is gone.** The Karpathy-style LLM wiki structure is now a
  bundle format recognized directly by `akm index`/`search`/`show`.
- **No confidence-based auto-accept.** `akm improve` never promotes a
  proposal on its own — every generated proposal lands `pending` and is
  adjudicated with `akm proposal accept`/`reject`, or drained in bulk with
  `akm proposal drain`.
- **Profiles are strategies.** `akm improve --profile <name>` is now
  `akm improve --strategy <name>`; strategy presets live under
  `improve.strategies.<name>` in config (was `profiles.improve.<name>`).
- **Proposal review is a noun group.** `akm proposal list`, `show`, `diff`,
  `accept`, `reject`, `revert`, `extract`, and `drain` are the canonical
  proposal-queue commands. Bare `akm proposal` is now a usage error — name
  the verb.
- **Task assets require `version: 2`.** `tasks/<id>.yml` is pure YAML; only
  version-2 task files are discovered. Each task picks exactly one target:
  `workflow:`, `prompt:`, or `command:`.
- **Migration is explicit.** `akm migrate status` / `akm migrate apply` and
  the standalone `akm-migrate` tool (`storage`, `restore`) replace implicit
  config auto-migration.
- **Quality states.** Search hits can carry `quality` such as `generated`,
  `curated`, or `proposed`. Proposed content is excluded from default search
  unless you pass `--include-proposed`.

## Essential commands at a glance

```bash
akm setup
akm search "deploy"
akm show skills/review-pr --shape agent
akm bundle add github:owner/repo
akm workflow run workflows/release
akm feedback skills/review-pr --negative --reason "too generic"
akm proposal extract --auto
akm improve skills/review-pr
akm proposal list
akm health
akm search --type task
```

## Where to go next

- Install or clone a bundle → `skills/install-akm-stash`
- Publish a bundle → `skills/publish-akm-stash`
- Review proposals (case-by-case) → `akm proposal show <id>` / `akm proposal
  diff <id>`, then `akm proposal accept|reject`
- Drain the pending backlog (automated) → `akm proposal drain --policy
  personal-stash` or the `processes.triage` improve strategy pre-pass
- Turn repeated feedback into reusable lessons → `akm improve <ref>` (distills
  feedback into lesson proposals natively in akm-cli 0.9)
- Harvest session knowledge → `akm proposal extract --auto` then `akm
  proposal list`
- Tune the improve pipeline → `knowledge/akm-improve-and-extract`
- Full command list → `knowledge/akm-cli-reference`
