---
description: Current AKM 0.9.7 upgrade contract, plus conditional pre-0.9.6 work and clearly historical 0.9.2 source/plan and 0.9.0 rename tables. Use when updating authored assets or machine consumers after an upgrade.
tags: [akm, migration, 0.9.7, compatibility, tasks, workflows, search]
updated: 2026-08-31
---

# AKM 0.9.7 Migration Reference

This page starts with the 0.9.6-to-0.9.7 delta. The 0.9.6 section is
conditional work for installations that skipped that release; the later 0.9.2
and 0.9.0 tables are historical translation help, not alternate syntax for new
assets.

## 0.9.7: required and recommended upgrade work

| Area | 0.9.7 action |
|---|---|
| Data and authored schemas | No required database migration, index rebuild, task rewrite, workflow rewrite, or plan-version change from 0.9.6. |
| Improve strategies | Replace removed built-ins `frequent` and `memory-focus`. A custom strategy with either name now merges over `default`, so make inherited behavior explicit. |
| Reference integrity | Run `akm lint`. Review newly validated `type:slug` xrefs and genuinely dangling belief edges. Use `--prune-dangling-edges` only after review; it is intentionally not part of `--fix`. |
| Scheduler | Run `akm task sync --dry-run`. Pre-0.9.2 crontab rows without a scheduler marker can now be recognized and reconciled. |
| Plugin integration | Install a plugin whose declared range admits 0.9.7; inspect `akm health` for a `plugin-version` advisory. |

## 0.9.7: packed curation and website ingestion

`akm curate --pack <tokens>` resolves ranked local hits through the same
content path as `akm show` and returns:

```json
[
  { "ref": "skills/release", "tokens": 2100, "content": "..." }
]
```

The budget covers the combined content. Whole lower-ranked assets are dropped
before truncation; only a highest-ranked asset that alone exceeds the budget
is truncated. JSON mode is the bare array above; text mode concatenates
`## <ref>` sections. A fragment ref packs only that section. Registry hits
are omitted from packed output; use ordinary curate output for their install
guidance.

`akm bundle add https://example.com/` now probes the origin root's
`llms.txt`. When present, its same-origin links become the crawl frontier.
Off-origin entries are dropped. A specific-page URL, or an origin without the
file, keeps the existing crawler behavior; `llms-full.txt` is not read.

## 0.9.7: improve strategy changes

The built-in set is:

`default`, `quick`, `thorough`, `graph-refresh`, `consolidate`,
`catchup`, `reflect-distill`, and `proactive-maintenance`.

`frequent` and `memory-focus` were removed. The shipped hourly task now
uses `reflect-distill`. `thorough` now explicitly carries default's process
matrix and, like `catchup`, uses judged promotion to drain pending proposals.
Their accept caps are 25 and 100 respectively; both use
`maxDiffLines: 200`. Unless `experimental.improveAutonomy` is enabled, the
autonomy gate demotes promotion to queue mode, so the default behavior remains
review-only.

## 0.9.7: lint, index, and task recovery

- A memory archived by AKM's prune flow leaves a tombstone under
  `.akm/memory-cleanup/archive/`; `supersededBy` and `contradictedBy`
  references to it now resolve as existing.
- `akm lint --prune-dangling-edges` drops only belief edges whose target has
  neither a live file nor a tombstone. It does not remove ordinary `xrefs`.
  If the final edge is removed, review any now-unsupported `beliefState`.
- Legacy `type:slug` xrefs are now validated, and refs to
  `<name>.derived.md` memories resolve.
- A corrupt derived `index.db` is removed with its WAL/SHM sidecars and
  rebuilt automatically. `state.db` is never removed by this recovery.
- `akm task sync` accepts truly immutable package-local launchers and
  reconciles pre-0.9.2 cron rows. Writable project/`npx` installs remain
  ineligible.
- A blocked v2/v3 task conversion now reports the actual blocking reason
  instead of pointing back to a migration command that cannot resolve it.

## Conditional pre-0.9.6 upgrade work

| Area | Action when upgrading from before 0.9.6 |
|---|---|
| Runtime | npm-compatible installs require Node.js 22 or newer. Bun and the standalone binary remain supported. |
| Search scores | Run `akm index --full` once. Pre-0.9.5 search impressions inflated utility scores; only a full rebuild removes that stored bias. |
| Embeddings | The full rebuild uses token-budgeted remote batches. One oversized document is skipped and reported instead of discarding every batch. |
| Scheduler | Run `akm task sync --dry-run`, review the backlog, then `akm task sync`. A large first reconcile can be legitimate work older ownership checks refused. |
| Orphaned scheduler state | Run `akm task prune` for a zero-write preview. Use `--yes` only after review; a live entry cannot be pruned even when named with `--id`. |
| Plugin integration | Inspect `akm health` for `plugin-version`. Update when the installed plugin is stale or its `versionRange` does not admit the running CLI. |

AKM 0.9.6 also fixes lint exclusions for bundle directories literally named
`.cache` or `registry`, reconciles duplicate bundle registrations that resolve
to the same content root, and preserves native PowerShell exit-code fidelity.
Those fixes require no authored syntax change.

### 0.9.6 additive machine-readable output

Local search hits at `--detail normal`, `--detail full`, and `--shape agent`
may carry:

```json
{ "matchStage": "exact" }
```

The vocabulary is `exact`, `prefix`, or `relaxed`. The field is omitted for a
hit with no lexical component and for registry hits. This is additive and did
not bump the search schema. Consumers should tolerate absence and unknown
future values rather than making the field required.

`searchMode: "fts-fallback"` means AKM attempted semantic search for this
query, the live attempt failed, and lexical results were returned with a
sanitized warning. A failed semantic probe is no longer cached as a 24-hour
block, so consumers should evaluate each response rather than persisting a
failure verdict of their own.

### 0.9.6 task read shim and scheduler recovery

Task source v4 remains the authored grammar. A deterministically convertible
v2/v3 document is now planned to v4 in memory, with a deprecation warning and
no file write. `akm migrate apply` remains the durable rewrite path. A source
that genuinely cannot convert still fails with an actionable task-source
error.

`akm task sync` now reconciles every source that compiled even when another
source failed. Its result reports the failed sources separately. `--dry-run`
previews adds, updates, and removals without scheduler writes and exits nonzero
when removals are pending.

`akm task prune` is deliberately narrower than sync: it finds installed
entries whose scheduler context is corrupt/missing or whose owning bundle no
longer exists. Default mode is a preview; `--yes` applies the printed plan;
`--id a,b` narrows it and refuses any id that is not a current orphan.

### 0.9.6 config compatibility

Known older `configVersion` shapes are upgraded in memory with a one-line
warning; the next config-mutating command persists the current version. An
unknown, newer, or malformed version still fails closed.

For a 0.9.1-era engine config, these `extraParams` keys are lifted to their
first-class equivalents when no conflicting first-class value exists:

| Legacy `extraParams` key | First-class engine field |
|---|---|
| `reasoning_effort` | `reasoningEffort` |
| `temperature` | `temperature` |
| `maxtokens` / `maxTokens` | `maxTokens` |
| `enablethinking` / `enableThinking` | `enableThinking` |

If old and new values disagree, choose one explicitly; AKM refuses to guess.
The persisted `supportsJsonSchema` field remains an explicit override, while
automatic capability detection is now attempt-then-fallback for each process
instead of a stale on-disk verdict.

## Historical 0.9.2 task-source and workflow cutover

These rules were introduced by 0.9.2 and remain the current authored contract.
Only `tasks/<id>.yml` with `version: 4` should be committed. A task selects one
of `uses:` or `run:`; scheduling is optional and `enabled` belongs to each
schedule entry.

| Retired pre-0.9.2 form | Current replacement |
|---|---|
| v2/v3 task source | `akm migrate apply --dry-run`, review, then `akm migrate apply` |
| `workflow:`, `prompt:`, or `command:` selector | `uses:` or `run:` |
| v3 `akm.schedule` / `on.schedule` | optional top-level `schedule:` string or list |
| document-level `enabled:` | `schedule: [{cron, enabled}]` |
| `timeoutMs:` in a task | top-level `timeout:` (integer milliseconds or `Nm`/`Nh`/`Nd`) |
| arbitrary `with:` | only `uses: akm/command`; declare typed `inputs:` for supported composition |
| GitHub Action-shaped `uses:` | rewrite as `commands/`, `scripts/`, `workflows/`, or `akm/command` |

Workflow runs still freeze `irVersion: 5` plans with `hashVersion: 7`. Plans
from before that cutover can be inspected, listed, and abandoned but cannot
resume or advance. Markdown frontmatter keeps ordered `steps:` and each unit
has one matching `## <step-id>` body heading. YAML workflows must be `.yml`;
multi-job YAML and `inherit_env` are rejected.

Task-history output still uses `target.kind` values `command`, `shell`,
`script`, `workflow`, and `unknown`. Historical `prompt` rows are projected as
`command`; historical native `command` rows project as `shell`.

## Historical 0.9.0 rename table

| Retired pre-0.9 command/form | Current spelling |
|---|---|
| `akm add/list/remove/update` | `akm bundle add/list/remove/update` |
| `akm save` | `akm sync` |
| `akm extract` | `akm proposal extract` |
| `akm propose` | `akm proposal new` |
| `akm proposals` | `akm proposal list` |
| `akm accept/reject/diff/revert` | `akm proposal accept/reject/diff/revert` |
| `akm reflect` / `akm distill` | `akm improve` |
| `akm improve --profile <name>` | `akm improve --strategy <name>` |
| `akm vault ...` | `akm env ...` or `akm secret ...`, depending on the data |
| `type:name` ref grammar | `[bundle//]conceptId` |
| frontmatter-free `## Step:` workflow | unified source with `steps:` plus exact `## <step-id>` sections |

## Focused audit commands

```bash
BUNDLE_DIR="$(akm info --format json | jq -r .bundleDir)"

rg -n --glob '*.md' --glob '*.yml' \
  'akm (vault|reflect|distill|extract|tasks|add|list|remove|update|save|events|wiki|propose|proposals|accept|reject|diff|revert)\b|--auto-accept|--profile |\b(?:skill|knowledge|memory|workflow|command|agent|script|env|secret|lesson|task|vault|wiki):[A-Za-z0-9_/-]+' \
  "$BUNDLE_DIR"

rg -n '^(version: (2|3)|akm:|on:|enabled:|timeoutMs:|prompt:|workflow:|command:)' \
  "$BUNDLE_DIR/tasks" -g '*.yml'
rg -n '^# Workflow:' "$BUNDLE_DIR/workflows" -g '*.md'

akm index --full
akm migrate apply --dry-run
akm lint
akm task sync --dry-run
akm task prune
akm task doctor
akm health --format json
```
