---
description: Current AKM 0.9.6 upgrade contract, plus clearly historical 0.9.2 source/plan and 0.9.0 rename tables. Use when updating authored assets or machine consumers after an upgrade.
tags: [akm, migration, 0.9.6, compatibility, tasks, workflows, search]
updated: 2026-08-31
---

# AKM 0.9.6 Migration Reference

This page starts with the 0.9.2-to-0.9.6 delta. The later 0.9.2 and 0.9.0
tables are historical translation help for older installations, not alternate
syntax for new assets.

## 0.9.6: required and recommended upgrade work

| Area | 0.9.6 action |
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

## 0.9.6: additive machine-readable output

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

## 0.9.6: task read shim and scheduler recovery

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

## 0.9.6: config compatibility

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
