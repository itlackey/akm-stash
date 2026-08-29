---
description: Current AKM 0.9.2 migration contract, plus a clearly historical 0.9.0 rename table. Use when updating authored assets or machine consumers after an upgrade.
tags: [akm, migration, 0.9.2, compatibility, tasks, workflows]
updated: 2026-08-29
---

# AKM 0.9.2 Migration Reference

This page is organized around the **current 0.9.2 contract**. The 0.9.0 table
near the end is historical translation help only; do not copy its retired
syntax into newly authored assets.

## 0.9.2: task source v4 is mandatory

Only `tasks/<id>.yml` files with `version: 4` execute. A task selects exactly
one of `uses:` or `run:`; scheduling is optional and `enabled` belongs to
each `schedule:` entry. The v3 `akm:` options bag and `on:` trigger block
are gone. Execution settings such as `timeout`, `engine`, `model`,
`redact`, `maxSteps`, and `maxRetries` are top-level keys.

```yaml
# Retired v2 source
version: 2
schedule: "@daily"
enabled: false
prompt: Review the bundle.
timeoutMs: 300000

# Current v4 source
version: 4
uses: akm/command
with:
  content: Review the bundle.
schedule:
  - cron: "@daily"
    enabled: false
timeout: 5m
```

| Retired form | 0.9.2 replacement |
|---|---|
| v2/v3 task source | `akm migrate apply --dry-run`, review every result, then `akm migrate apply` |
| `workflow:`, `prompt:`, or `command:` selector | `uses:` or `run:` |
| v3 `akm.schedule` / `on.schedule` | optional top-level `schedule:` string or list |
| document-level `enabled:` | `schedule: [{cron, enabled}]` |
| `timeoutMs:` in a task | top-level `timeout:` (integer milliseconds or `Nm`/`Nh`/`Nd`) |
| arbitrary `with:` | only `uses: akm/command`; declare `inputs:` for other targets |
| GitHub Action-shaped `uses:` | manually rewrite as `commands/`, `scripts/`, `workflows/`, or `akm/command` |

The migrator is task-source specific. It has no `--config`, `--diff`,
storage, or restore interface. It reports each source as `changed`,
`skipped`, or `blocked`; a blocked task needs a human decision rather than a
forced rewrite.

## 0.9.2: workflow source and plan cutover

Workflow runs freeze `irVersion: 5` plans with `hashVersion: 7`. Older stored
plans can be inspected, listed, and abandoned, but cannot resume, advance,
complete, or run. Recover by abandoning the old run and starting a fresh run
from current source:

```bash
akm workflow status <old-run-id>
akm workflow abandon <old-run-id>
akm workflow run workflows/<name>
```

Markdown workflows and single-job GitHub-shaped YAML workflows are peer source
forms. YAML must be `.yml`; multi-job YAML and `inherit_env` are rejected.
Use named environment bindings and `pass_env` instead. Check an authored
workflow without publishing a run:

```bash
akm workflow plan workflows/<name>
akm lint --type workflows
```

Markdown workflow frontmatter retains ordered `steps:`; each declared unit
has one matching `## <step-id>` body heading. The document H1 must not use
the retired `# Workflow:` prefix. A task-composed workflow step binds the
task's declared inputs with its own `with:`; `with:` on commands or scripts
is rejected rather than silently ignored.

## 0.9.2: task history and JSON consumers

`akm task history` and `akm task run --format json` use this stable
`target.kind` vocabulary:

| 0.9.1 row value | 0.9.2 value | Meaning |
|---|---|---|
| `prompt` | `command` | Agent/LLM command dispatch |
| `command` | `shell` or `script` | Native shell or script execution |
| `workflow` | `workflow` | Workflow execution |
| unrecognized | `unknown` | Unclassifiable historical row |

0.9.2 maps older rows into this vocabulary when reading them. New rows carry a
`targetVocab` marker, so do not downgrade below 0.9.2 after it writes a given
`state.db`.

## 0.9.2: ref, locator, and JSON-output boundaries

Generic asset refs are `[bundle-slug//]conceptId[#fragment]`, such as a
bundle-qualified knowledge ref written `<bundle-slug>//knowledge/<asset>` or
`skills/code-review`. Use them with
`show`, workflow/task source, and search-result handling. A source locator
such as `github:owner/repo` or `npm:@scope/pkg` belongs to
`akm bundle add`, not a generic asset ref.

`akm clone` is the deliberate exception: it accepts a supported source
locator plus `//conceptId`, for example
`akm clone github:owner/repo//skills/deploy`. Do not generalize that exception
to `akm show` or workflow/task fields. `akm show` resolves the local index
only; registry search results must be reviewed at their returned source or
homepage until installed intentionally.

`akm workflow create --format json` returns `bundleDir`, not the retired
`stashDir`.

## 0.9.2: health and improve configuration

`akm health --format json` returns `schemaVersion: 3`. Its task/engine
telemetry is under `metrics` (not `runtime`); improve rollups are under
`improve`. Per-run output uses `--group-by run`, not `--detail per-run`;
window deltas have `{from, to, pctChange}`.

`improve.strategies.<name>.processes.triage.judgment` accepts a boolean or a
strict object with only `enabled`, `engine`, `model`, `timeoutMs`, and
`llm`. The retired `judgment.mode` is invalid:

```json
{
  "improve": {
    "strategies": {
      "default": {
        "processes": {
          "triage": {
            "judgment": { "enabled": true, "timeoutMs": 600000 }
          }
        }
      }
    }
  }
}
```

## Historical 0.9.0 rename table

These were 0.9.0 changes and remain useful when translating old bundle text.
They are historical facts, not an alternative to the 0.9.2 requirements above.

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

akm migrate apply --dry-run
akm lint
akm task doctor
akm health --format json
```
