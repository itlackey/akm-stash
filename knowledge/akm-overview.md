---
description: Use when an agent needs a quick conceptual overview of akm, its asset types, and the major 0.9.7 surfaces.
tags: [akm, overview, concepts]
quality: curated
updated: 2026-08-31
refs: []
---

# akm Overview for Agents

> **Version target:** akm-cli 0.9.7

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
| `workflow` | Structured, stateful, steps-driven procedure. | `workflows/release.md` |
| `env` | Group of related config/credential values for an app or service. | `env/prod.env` |
| `secret` | Single whole-file secret (token, key, cert). | `secrets/deploy-key` |
| `memory` | Context fragments recalled from external systems. | `memories/team-notes.md` |
| `lesson` | Distilled guidance learned from feedback or reflection. | `lessons/search-ranking.md` |
| `task` | Scheduled prompt, command, or workflow execution. | `tasks/daily-review.yml` |
| `instruction` | Plain reference doc, same shape as knowledge. | `instructions/deploy-notes.md` |
| `session` | Generated session-extraction record. | `sessions/claude/<id>.md` |
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
- `official-stash//knowledge/akm-cli-reference`
- `acme-stash//lessons/docker-healthchecks`

The pre-0.9.0 colon grammar (a type name, a colon, then the asset name) was
retired with no compatibility alias — a colon-style ref fails to resolve. The short,
bundle-omitted form is input sugar: it resolves against the default bundle,
then installation-priority order. Source locators such as
`github:itlackey/akm-stash` and `npm:@acme/stash` belong to `akm bundle add`;
only `akm clone` accepts a source locator plus `//conceptId`. Use `akm show
<ref>` to inspect a locally indexed asset.
Use `akm workflow run <ref>` for workflow runs and `akm task run <id>` for
scheduled task assets.

## 0.9.7 execution and authoring rules

- **Task source v4 only.** A task is `tasks/<id>.yml` with `version: 4`,
  exactly one `uses:` or `run:` target, optional `schedule:`, and per-binding
  `enabled`. Deterministically convertible v2/v3 sources are read through an
  in-memory v4 shim with a warning; migrate them on disk with `akm migrate
  apply --dry-run` then `akm migrate apply`.
- **Durable workflow plan v5.** Workflow runs freeze `irVersion: 5` and
  `hashVersion: 7`. Older plans remain inspectable but must be abandoned and
  restarted from current source; `akm workflow plan <ref>` validates a fresh
  freeze without publishing a run.
- **Task history vocabulary.** JSON `target.kind` is `command`, `shell`,
  `script`, `workflow`, or `unknown`; downstream consumers must not branch on
  the retired `prompt` value.
- **Current ref and registry boundaries.** Generic refs use
  `[bundle-slug//]conceptId`; registry discovery is separate from the local
  index, so a registry hit is inspected at its source/homepage until installed.
- **Health schema v3.** `akm health` returns task/engine telemetry in
  `metrics` and improve telemetry in `improve`; per-run output uses
  `--group-by run`. It also reports installed Claude plugin versions and warns
  when the plugin is stale or its declared AKM range excludes the running CLI.
- **Search match provenance.** Normal/full and agent-shaped local hits may
  include `matchStage` (`exact`, `prefix`, or `relaxed`). A `searchMode` of
  `fts-fallback` means semantic search failed live for that query and AKM used
  lexical results instead.
- **Packed curation.** `akm curate <query> --pack <tokens>` returns ranked
  local assets' content in one combined budget. It drops lower-ranked whole
  assets first, resolves fragments like `akm show`, and never packs registry
  hits.
- **Website manifests.** Adding an origin-root website probes `/llms.txt`
  and uses its same-origin links as the crawl frontier when present.
- **Scheduler recovery.** `akm task sync --dry-run` previews reconciliation;
  `akm task prune` previews entries whose descriptor or bundle disappeared,
  and `akm task prune --yes` removes only those computed orphans.
- **Reference repair.** Lint validates legacy `type:slug` xrefs and resolves
  derived memories plus prune tombstones. After reviewing `akm lint`, use
  `akm lint --prune-dangling-edges` only to drop genuinely missing belief
  edges.
- **Improve presets.** `frequent` and `memory-focus` are removed.
  `thorough` and `catchup` can run judged, capped triage drains, with
  promotion gated by `experimental.improveAutonomy`.

## Essential commands at a glance

```bash
akm setup
akm search "deploy"
akm curate "plan a safe deployment" --pack 8000 --format json
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
  feedback into lesson proposals natively in akm-cli 0.9.7)
- Harvest session knowledge → `akm proposal extract --auto` then `akm
  proposal list`
- Tune the improve pipeline → `knowledge/akm-improve-and-extract`
- Full command list → `knowledge/akm-cli-reference`
