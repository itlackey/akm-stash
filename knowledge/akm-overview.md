---
description: Use when an agent needs a quick conceptual overview of akm, its asset types, and the major 0.10.261130 surfaces.
tags: [akm, overview, concepts]
quality: curated
updated: 2026-11-23
refs: []
---

# akm Overview for Agents

> **Version target:** akm-cli 0.10.261130

**akm** is a CLI package manager for AI-agent assets.
It gives coding assistants (Claude Code, OpenCode, Codex, Cursor, Copilot,
Qwen, etc.) a unified way to discover, install, run, and improve the skills,
commands, agents, knowledge, rules, LLM wikis, env configs, secrets, memories,
lessons, and tasks they need.

Canonical repo: <https://github.com/itlackey/akm>
Official registry: <https://github.com/itlackey/akm-registry>

> **Terminology.** The CLI noun is **bundle**; "stash" survives only in
> legacy names such as this repo's name and the registry index's `stashes[]`
> array:
>
> - **working bundle** — the local editable directory (default `~/akm`).
> - **bundle** — a shareable directory of assets published to GitHub, npm,
>   git, a website source, or another provider.

## The three moving parts

| Concept | What it is | Default location |
|---|---|---|
| **Working bundle** | Personal writable asset directory. | `~/akm` |
| **Source** | Place assets come from (filesystem, git/GitHub, npm, website, provider). | configured via `akm bundle add` |
| **Registry** | Discovery index of published bundles you do not already have installed. | `itlackey/akm-registry` |

A published bundle is just a shareable directory of assets. akm classifies by
file extension, content, and a per-format bundle adapter, but
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
| `rule` | Short agent rule, printed by `akm rules`. | `rules/no-force-push.md` |
| `workflow` | Deprecated: steps-driven procedure; tasks replace it in 0.11. | `workflows/release.md` |
| `env` | Group of related config/credential values for an app or service. | `env/prod.env` |
| `secret` | Single whole-file secret (token, key, cert). | `secrets/deploy-key` |
| `memory` | Context fragments recalled from external systems. | `memories/team-notes.md` |
| `lesson` | Distilled guidance learned from feedback or reflection. | `lessons/search-ranking.md` |
| `task` | Scheduled or on-demand list of akm commands, shell lines, or prompts. | `tasks/daily-review.yml` |
| `instruction` | Plain reference doc, same shape as knowledge. | `instructions/deploy-notes.md` |
| `session` | Generated session-extraction record. | `sessions/claude/<id>.md` |
| `fact` | Durable bundle-level semantic knowledge. | `facts/team-timezone.md` |

An LLM wiki (Karpathy-style `schema.md` + `pages/`) is a **bundle format**,
recognized and indexed automatically; it has no asset type or command group of
its own.

## Ref format

Every asset is addressed by a **ref** in the `[bundle//]conceptId` grammar —
a subdir-qualified concept id, with an optional `bundle//` installation
prefix and an optional `#fragment`:

```text
[bundle//]<subdir>/<name>[#fragment]
```

Examples:

- `skills/review-pr`
- `tasks/publish-stash`
- `official-stash//knowledge/akm-cli-reference`
- `acme-stash//lessons/docker-healthchecks`

A colon-style ref (a type name, a colon, then the asset name) does not
resolve. The short, bundle-omitted form is input sugar: it resolves against
the default bundle, then installation-priority order. Source locators such as
`github:itlackey/akm-stash` and `npm:@acme/stash` belong to `akm bundle add`;
only `akm import --asset-ref` accepts a source locator plus `//conceptId`. Use
`akm show <ref>` to inspect a locally indexed asset and `akm run <ref>` to run
an agent, command, script, or task.

## Execution and authoring rules (0.10.261130)

- **Run assets by ref.** `akm run <ref>` runs an agent (`--prompt`), a command
  (`--arguments`), a script, or a task. `akm run --env <ref> --secret
  <ref>:<VAR> scripts/<file>` runs a script with env assets and secrets
  injected. `akm agent`, `akm command run`, `akm task run`, `akm env run` and
  `akm secret run` are Deprecated and go in 0.11.
- **Tasks are the automation unit.** A task is `tasks/<id>.yml`. Task source v5
  (`version: 5-beta.1`, Experimental) is a list of akm commands (`run:`,
  `exec:`, `prompt:`) run in order, with inputs, `${name}` results, a state
  file, and resume at the failed step. Task source v4 (`version: 4`) keeps
  working through 0.10.x. `akm import <file> --type task` adds a task; `akm
  task enable <ref>` schedules it.
- **Workflows are Deprecated.** Tasks replace them in 0.11; `akm migrate apply
  workflows/<name>.md` writes `tasks/<name>.yml`.
- **One doctor.** `akm doctor` is the health check; `akm doctor info`, `log`,
  `metrics`, `explain <ref>` and `scheduler sync` replace `akm health`, `info`,
  `log`, `metrics`, `task explain` and `task sync`.
- **Refs and registries.** Generic refs use `[bundle-slug//]conceptId`;
  registry discovery is separate from the local index, so a registry hit is
  inspected at its source/homepage until installed.
- **Search match provenance.** Normal and full local hits may include
  `matchStage` (`exact`, `prefix`, `relaxed`). A `searchMode` of `fts-fallback`
  means semantic search failed for that query and akm used keyword results.
- **Budgeted reads.** `akm curate <query> --max-tokens <n>` returns ranked
  local assets' content in one combined budget. `akm show <ref> --outline`
  lists a document's sections; `akm show <ref>#<slug>` reads one.
- **Improve is proposal-first.** `akm improve` writes proposals and accepts and
  commits the ones whose quality check passed; the rest wait for `akm proposal
  accept`. Only `default` and `consolidate` are built-in strategies.
- **Reference repair.** After reviewing `akm lint`, use `akm lint
  --prune-dangling-edges` only to drop genuinely missing belief edges.

## Essential commands at a glance

```bash
akm setup
akm search "deploy"
akm curate "plan a safe deployment" --max-tokens 8000
akm show skills/review-pr --outline
akm bundle add github:owner/repo
akm run tasks/release
akm feedback skills/review-pr --negative --reason "too generic"
akm proposal extract --auto
akm improve skills/review-pr
akm proposal list
akm doctor
akm search --type task
```

## Where to go next

- Install a bundle or import one asset → `skills/install-akm-stash`
- Publish a bundle → `skills/publish-akm-stash`
- Review proposals (case-by-case) → `akm proposal show <id>` / `akm proposal
  diff <id>`, then `akm proposal accept|reject`
- Drain the pending backlog (automated) → `akm proposal drain --dry-run`, then
  `--promote --yes`, or the `processes.triage` pre-pass inside `akm improve`
- Turn repeated feedback into reusable lessons → `akm improve <ref>` (distills
  feedback into lesson proposals)
- Harvest session knowledge → `akm proposal extract --auto` then `akm
  proposal list`
- Tune the improve pipeline → `knowledge/akm-improve-and-extract`
- Full command list → `knowledge/akm-cli-reference`
