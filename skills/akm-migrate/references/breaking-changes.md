---
description: Per-version quick reference of breaking changes that require stash asset updates after an akm upgrade. Use during Step 5 of the akm-migrate skill to identify what to grep for and what to replace.
tags: [akm-migrate, breaking-changes, versions, stash-assets]
updated: 2026-08-04
---

# Breaking Changes — Stash Asset Update Reference

For each version below, the **Scan pattern** is what to grep for in your stash.
The **Replace with** column is the correct equivalent. The **Config change**
column describes config key renames to verify with `akm migrate status`.

---

## akm 0.9.0

**Full rename table:** `akm help migrate 0.9.0`
**Longform guide:** `akm help migrate` → `v0.8-to-v0.9.md`

0.9.0 is a hard-break command-surface overhaul — retired spellings fail with
`UNKNOWN_COMMAND` and a replacement hint, and there are no compatibility
aliases anywhere in this section.

### Ref grammar: `type:name` → `[bundle//]conceptId`

The colon grammar is gone with no alias — a `type:name` ref now fails to
resolve. Subdir pluralization is not mechanical; derive it per type:

| Old ref | New ref |
|---|---|
| `skill:<name>` | `skills/<name>` |
| `command:<name>` | `commands/<name>` |
| `agent:<name>` | `agents/<name>` |
| `knowledge:<name>` | `knowledge/<name>` |
| `workflow:<name>` | `workflows/<name>` |
| `script:<name>` | `scripts/<name>` |
| `memory:<name>` | `memories/<name>` |
| `env:<name>` | `env/<name>` (unchanged subdir) |
| `secret:<name>` | `secrets/<name>` |
| `lesson:<name>` | `lessons/<name>` |
| `task:<name>` | `tasks/<name>` |
| `instruction:<name>` | `instructions/<name>` |
| `vault:<name>` | gone — see below |
| `origin//type:name` | `bundle//conceptId` (e.g. `github:owner/repo//knowledge/guide`) |

### Command-surface overhaul (selected renames — full table in `akm help migrate 0.9.0`)

| Scan pattern | Replace with | Notes |
|---|---|---|
| `akm init` | `akm bundle create` | |
| `akm add <source>` | `akm bundle add <source>` | |
| `akm list` | `akm bundle list` | |
| `akm remove <source>` | `akm bundle remove <source>` | |
| `akm update` | `akm bundle update` | To update akm itself, use `akm upgrade` |
| `akm tasks <sub>` | `akm task <sub>` | Singular group; `list`/`show`/`remove`/`init`/`enable`/`disable` are gone |
| `akm extract` | `akm proposal extract` | |
| `akm propose` | `akm proposal new` | |
| `akm reflect` / `akm distill` | `akm improve <ref>` | Folded into improve |
| `akm proposals` / `akm accept` / `akm reject` / `akm diff` / `akm revert` | `akm proposal list\|accept\|reject\|diff\|revert` | Bare `akm proposal` (no verb) is now a usage error |
| `akm log list` | `akm log` | Now a single command |
| `akm registry search <q>` | `akm search <q> --from registry` | |
| `akm workflow template` | `akm workflow create --print` | |
| `akm workflow validate` | `akm lint --type workflows` | Add `--fail-on-flagged` for CI gates |
| `akm config show` | `akm config list` | |
| `akm improve --profile <name>` | `akm improve --strategy <name>` | Config moved `profiles.improve.<name>` → `improve.strategies.<name>` |
| `akm improve --auto-accept <n\|safe\|false>` | (removed, no replacement flag) | `improve` never auto-promotes in 0.9.0 — every proposal lands `pending`; adjudicate with `akm proposal accept`/`reject` or `akm proposal drain` |
| `akm workflow start\|next\|complete` | `akm workflow run <ref>` for execution, `akm workflow status <ref>` for inspection | External-driver `brief`/`report` protocol is also gone |
| `akm history` | `akm log --ref <ref>` | |
| `akm mv` | move the file, then `akm index` + `akm lint` | Optional `bun scripts/rekey-asset-ref.ts <old-ref> <new-ref>` from a source checkout carries ranking signal |
| `akm log tail` | poll `akm log --since @offset:<id>` | Durable cursor, no daemon |
| `akm workflow watch` | `akm log --run <run-id>` | |
| `akm env set` / `akm env unset` | edit the `.env` file directly | akm loads it as-is |
| `akm config validate` | (removed) | Config is validated on every load |
| `akm task enable` / `akm task disable` | edit `enabled:` in the task YAML, then `akm task sync` | |
| `akm task init` | `akm setup` | Seeds the default schedules |

### Removed: `vault` asset type and `akm vault` command

`vault` is fully removed. All `vault:` refs fail to resolve.

| Scan pattern | Replace with | Notes |
|---|---|---|
| `akm vault list` | `akm env list` (whole `.env` group) or `akm secret list` (single value) | |
| `akm vault show <ref>` | `akm show env/<name>` | |
| `akm vault path <ref>` | `akm env path env/<name>` | |
| `akm vault run <ref>` | `akm env run env/<name> --` | |
| `akm vault load <ref>` | `akm env run env/<name> -- $SHELL` | For interactive shell |
| `akm vault create` | `akm env create` | |
| `akm vault set` | Edit the `.env` file directly, or `akm secret set` | One-value use → secret |
| `vault:<name>` refs | `env/<name>` refs | Update all stash asset bodies |
| `/akm-vault` slash command | `/akm-env` | Update Claude plugin commands |

**Storage check:**

```bash
BUNDLE_DIR="$(akm info --format json | jq -r .bundleDir)"
# Confirm vaults/ was migrated to env/ before relying on 0.9.0 behavior
ls "$BUNDLE_DIR/env/"
akm-migrate storage --dry-run   # reports whether a copy is still needed
```

If a copy is still needed, run `akm-migrate storage --yes` first.

**Config changes:** `stashDir`/`sources`/`installed`/`wikiName` (flat keys) →
`bundles`/`defaultBundle`; `AKM_STASH_DIR` env var → `AKM_BUNDLE_DIR`. `akm
migrate apply` handles the rewrite; it never guesses profile-to-engine
mappings, so review `engines`/`defaults` by hand afterward.

### Removed: `akm wiki` command family and `wiki` asset type

The Karpathy-style LLM wiki structure (`schema.md` + `pages/`) is now a
first-class **bundle format** recognized directly by `akm index`/`search`/
`show` — no dedicated verb surface.

| Scan pattern | Replace with | Notes |
|---|---|---|
| `akm wiki list\|ingest\|register\|lint` | `akm bundle add <source>` then `akm search`/`akm show` | Install like any other source |
| `wiki:<name>` refs | `bundle//pages/<slug>` refs | Copy the ref from search output |

### Removed: manual proposal-queue management workflow

The hand-rolled manual proposal-management path — the `manage-akm-proposals`
skill, the `akm-process-proposals` command, and the hourly agent-session cron
task — is **removed**. It is replaced by the deterministic `akm proposal drain`
verb plus the `processes.triage` improve strategy pre-pass, which drain the
standing pending backlog without an agent session.

| Removed | Replace with | Notes |
|---|---|---|
| `skills/manage-akm-proposals` (case-by-case queue review) | per-id `akm proposal show\|diff\|accept\|reject`, or `akm proposal drain` for bulk | Built-in CLI; no skill needed |
| `commands/akm-process-proposals` (manual queue processing) | `akm proposal drain --policy personal-stash --promote --yes` | Deterministic, one command |
| `tasks/*.yml` with a `prompt:` running `skills/manage-akm-proposals` on a schedule | a `command:` task running `akm proposal drain --policy personal-stash --promote --yes`, or enable `processes.triage` in the improve strategy | Deterministic, no agent session; task file must begin with `version: 2` |

### Migration itself is now explicit

| Scan pattern | Replace with | Notes |
|---|---|---|
| `akm migrate --dry-run --diff` / bare `akm migrate` | `akm migrate status` then `akm migrate apply --config <path> [--dry-run]` | Config no longer auto-migrates as a side effect of a normal command |
| `akm-migrate-storage` | `akm-migrate storage` | Space, not a hyphenated command name |
| Hand-copying config/data-dir backups | `akm-migrate restore --for <version> --run <backup-run-id> --confirm` | The one supported restore path |

---

## akm 0.8.0

**Full migration guide:** `akm help migrate 0.8.0`
**Longform guide:** `akm help migrate` → `v0.7-to-v0.8.md`

### Removed: `reflect`, `distill`, `proposal *` subcommands

The old self-improvement CLI was replaced by `akm improve` and the proposal queue.

| Scan pattern | Replace with | Notes |
|---|---|---|
| `akm reflect` | `akm improve <ref>` | |
| `akm distill` | `akm improve <ref>` | Distillation is now part of improve |
| `akm proposals` | `akm proposal list` | bare `akm proposal` also lists |
| `akm show proposal <id>` | `akm proposal show <id>` | |
| `akm diff <id>` | `akm proposal diff <id>` | now under the `proposal` noun |
| `akm accept <id>` | `akm proposal accept <id>` | bulk `--generator <g>` form needs `-y`/`--yes` |
| `akm reject <id>` | `akm proposal reject <id> --reason "..."` | Reason is required |
| `akm revert <id>` | `akm proposal revert <id>` | |
| `akm index --enrich` | `akm improve` | Memory inference moved to improve |
| `akm index --re-enrich` | `akm improve` | |
| `--for-agent` flag | `--shape agent` | also `--detail summary\|agent` → `--shape summary\|agent`; `--detail` is now verbosity (`brief\|normal\|full`) |
| `--source` (on `accept`/`reject`/`history`) | `--generator` | unchanged on `search`/`curate`/`graph`/`remember` |
| `akm save` | `akm sync` | `sync` = commit + optional push; adds `--no-push` |
| `akm enable <component>` | `akm config enable <component>` | also `akm disable` → `akm config disable` |
| `akm events` | `akm log` | `log` is primary; `history` is asset-scoped |
| `akm feedback --note <text>` | `akm feedback --reason <text>` | |
| `akm enable context-hub` | (removed) | No replacement |
| `akm disable context-hub` | (removed) | No replacement |
| `akm improve --format` | (removed) | Use `--json-to-stdout` for legacy JSON |
| `akm search` (no query) | `akm search <query>` | No-query now fails |

### Task file format: `.md` → `.yml`

```bash
# Scan for old-format task files
find "$(akm config get stashDir)/tasks" -name "*.md" 2>/dev/null
```

Each `tasks/*.md` file must be converted to a pure YAML `tasks/*.yml` file.
The `.md` format is warned and silently skipped — tasks will not run.

Old format (`.md` with frontmatter):
```markdown
---
schedule: "0 2 * * *"
workflow: workflows/my-workflow
---
```

New format (`tasks/<id>.yml`, pure YAML, no `---` delimiters):
```yaml
schedule: "0 2 * * *"
workflow: workflows/my-workflow
description: "What this task does"
enabled: true
```

### Config key renames (handled by `akm migrate`)

| Old key | New key |
|---|---|
| `agent.default` | `defaults.agent` |
| `agent.profiles.*` | `profiles.agent.*` |
| `improve.autoAccept` | `profiles.improve.default.autoAccept` |
| `stashes[]` (old array form) | `sources[]` |

Run `akm migrate --dry-run --diff` to see the exact changes for your config.

### Storage migration required: `vaults/` → `env/`

```bash
akm-migrate-storage --dry-run   # preview
akm-migrate-storage --yes       # apply
akm index                        # rebuild after migration
```

### Post-upgrade: rebuild graph data

After the DB schema upgrade (v12 → v13), graph tables are dropped and
repopulated on the next improve cycle:

```bash
akm improve   # triggers graph extraction
akm health    # verify graph data repopulated
```

---

## akm 0.7.0

**Full migration guide:** `akm help migrate 0.7.0`

### Renamed: `stashes[]` → `sources[]`

| Scan pattern | Replace with |
|---|---|
| `"stashes":` in config | `"sources":` |
| `akm add --kind stash` | `akm add` (kind inferred) |

Config migration handles this automatically via `akm migrate`.

### Removed: `openviking` source provider

Any stash registered as an `openviking` source must be removed:

```bash
akm list   # look for sources with kind=openviking
akm remove <id>
```

---

## How to run the full scan

```bash
# Run against all stash assets at once
BUNDLE_DIR="$(akm info --format json | jq -r .bundleDir)"

grep -rn \
  "akm vault\|akm reflect\|akm distill\|akm extract\|akm tasks \|akm add \|akm proposals\b\|akm accept\b\|akm reject\b\|akm diff\b\|akm revert\b\|--auto-accept\|--profile \|context-hub\|akm-migrate-storage" \
  "$BUNDLE_DIR" \
  --include="*.md" --include="*.yml" \
  -l

grep -rnoE '\b(skill|knowledge|memory|workflow|command|agent|script|env|secret|lesson|task|vault|wiki):[a-zA-Z0-9_/-]+' \
  "$BUNDLE_DIR" --include="*.md" --include="*.yml"

# Show line-level matches for targeted review
grep -rn "akm vault" "$BUNDLE_DIR" --include="*.md" --include="*.yml"
```

After scanning, use `akm lint` to catch structural issues the grep won't find
(it exits 0 regardless of findings — read `summary.flagged` or pass
`--fail-on-flagged`):

```bash
akm lint --format json | jq '.flagged[]'
akm lint --type workflows --format json | jq '.flagged[]'
```

`akm lint` flags: missing `updated` dates, unquoted colons in descriptions,
stale absolute paths, and missing-ref errors (where a `<type>:<name>` ref no
longer resolves).
