---
name: akm-migrate
description: Use when upgrading to akm-cli 0.9.6 and you need to rebuild search scores, reconcile scheduler state, convert legacy task sources, preserve workflow state, or update machine consumers.
updated: 2026-08-31
---

# AKM 0.9.6 Migration Guide

Use this guide after upgrading the executable to 0.9.6. The only required
0.9.2-to-0.9.6 data action is a full index rebuild; scheduler reconciliation
and task-source migration are explicit, reviewable follow-ups. `akm migrate`
is task-source specific — it is not a general config or database migrator.

## 1. Confirm the release and protect active work

```bash
akm --version
akm info
akm workflow list --active
```

If the previous install predates 0.9.2, also read `akm help migrate 0.9.2`.
That is the built-in durable-plan/task-source cutover note; no separate
`akm help migrate 0.9.6` page is shipped.

Workflow plans remain at `irVersion: 5` and `hashVersion: 7` in 0.9.6. A plan
frozen before the 0.9.2 cutover is readable but cannot resume or advance.
Inspect and restart it from current authored source:

```bash
akm workflow status <run-id>
akm workflow abandon <run-id>
akm workflow run <workflow-ref>
```

Do not downgrade below 0.9.2 after the state database has received current
task-history rows. The 0.9.6 upgrade adds no new task-history vocabulary.

## 2. Rebuild the search index once

0.9.5 stopped counting search impressions as utility wins. Scores already
stored by an older install retain that ranking bias until rebuilt, so run:

```bash
akm index --full
```

Search ordering may change; that is expected. The rebuild also repopulates
embeddings using 0.9.6's token-budgeted batches, which skip and report an
oversized document without discarding every other batch.

## 3. Migrate task sources and reconcile scheduler state

Task source v4 remains the authored grammar. AKM 0.9.6 auto-reads a
deterministically convertible v2/v3 source as v4 in memory, emits a one-line
deprecation warning, and does not rewrite it. Use the migrator to make the
upgrade durable and silence that warning:

```bash
akm migrate status
akm migrate apply --dry-run
akm migrate apply
```

Each source is reported as `changed`, `skipped`, or `blocked`. A blocked file
does not stop convertible siblings from migrating; repair it instead of
inventing a force flag. The command has no `--config`, `--diff`, storage, or
restore interface.

Preview scheduler reconciliation before applying it. The first sync after an
upgrade may show many updates because 0.9.5 began reconciling entries that
older ownership checks silently refused:

```bash
akm task sync --dry-run
akm task sync
akm task doctor
```

Then inspect unreachable scheduler entries. `prune` defaults to a zero-write
preview and never targets an entry that still resolves to a live bundle:

```bash
akm task prune
akm task prune --id <binding-id>     # optional narrowed preview
akm task prune --yes                 # remove the printed orphan candidates
```

## 4. Normalize config and machine consumers

Known older `configVersion` documents are upgraded in memory with a warning;
the next `akm config set` or other config write persists the current version.
The 0.9.1-era `extraParams.reasoning_effort`, `temperature`, `maxTokens`, and
`enableThinking` workarounds are likewise lifted to their first-class engine
fields when unambiguous. Conflicting old/new values still fail closed — choose
one value explicitly rather than relying on precedence.

Search consumers may now see additive `matchStage: "exact" | "prefix" |
"relaxed"` on normal/full and agent-shaped local hits. It is absent for
pure-semantic contributions and registry hits. A `searchMode` of
`fts-fallback` means semantic search was attempted live and lexical results
were returned with a sanitized warning.

Task-history `target.kind` is unchanged from 0.9.2: `command`, `shell`,
`script`, `workflow`, or `unknown`. Consumers must not branch on the retired
`prompt` value.

## 5. Verify authored workflows and tasks

Every task lives at `tasks/<id>.yml`, begins with `version: 4`, selects exactly
one target (`uses:` or `run:`), and may omit `schedule:` for manual-only use.
`with:` is valid only for `uses: akm/command`; `enabled` belongs to each
schedule binding. Validate resolution without executing:

```bash
akm task explain tasks/<id>
akm workflow plan workflows/<name>
akm lint --type workflows
```

The workflow source contract and durable plan versions did not change between
0.9.2 and 0.9.6. The 0.9.6 implementation removes unused authoring caps, but
that does not add new syntax to authored files.

## 6. Scan and complete the upgrade

```bash
BUNDLE_DIR="$(akm info --format json | jq -r .bundleDir)"

rg -n --glob '*.md' --glob '*.yml' \
  'akm (vault|reflect|distill|extract|tasks|add|list|remove|update|save|events|wiki|propose|proposals|accept|reject|diff|revert)\b|--auto-accept|--profile |\b(?:skill|knowledge|memory|workflow|command|agent|script|env|secret|lesson|task|vault|wiki):[A-Za-z0-9_/-]+' \
  "$BUNDLE_DIR"

find "$BUNDLE_DIR/tasks" -name '*.md' -print
rg -L '^version: 4$' "$BUNDLE_DIR/tasks" -g '*.yml'

akm lint
akm task sync --dry-run
akm task doctor
akm health --format json
```

Treat a `plugin-version` advisory as actionable: update a stale Claude plugin,
or install one whose declared range admits 0.9.6 if `admitted` is false.

## Completion checklist

- `akm index --full` completed once after the upgrade.
- `akm migrate apply --dry-run` reports no unexplained legacy task sources.
- Every executable task passes `akm task explain`; scheduler reconciliation
  and prune previews contain only understood changes.
- Each workflow passes `akm workflow plan` and `akm lint --type workflows`.
- `akm lint` and `akm health --format json` have no unexplained failures or
  plugin compatibility warnings.
- Search and task-history consumers tolerate the 0.9.6 additive fields and
  current target vocabulary.

See `references/breaking-changes.md` for a compact release delta plus the
historical 0.9.2 and 0.9.0 translation tables.
