---
description: Per-version quick reference of breaking changes that require stash asset updates after an akm upgrade. Use during Step 5 of the akm-migrate skill to identify what to grep for and what to replace.
tags: [akm-migrate, breaking-changes, versions, stash-assets]
updated: 2026-06-02
---

# Breaking Changes — Stash Asset Update Reference

For each version below, the **Scan pattern** is what to grep for in your stash.
The **Replace with** column is the correct equivalent. The **Config change**
column describes config key renames to verify with `akm migrate --dry-run`.

---

## akm 0.9.0

**Full migration guide:** `akm help migrate 0.9.0`
**Longform guide:** `akm help migrate` → `v0.8-to-v0.9.md`

### Removed: `vault` asset type and `akm vault` command

`vault` is fully removed. All `vault:` refs will fail to resolve.

| Scan pattern | Replace with | Notes |
|---|---|---|
| `akm vault list` | `akm env list` | |
| `akm vault show <ref>` | `akm show env:<name>` | |
| `akm vault path <ref>` | `akm env path env:<name>` | |
| `akm vault run <ref>` | `akm env run env:<name> --` | |
| `akm vault load <ref>` | `akm env run env:<name> -- $SHELL` | For interactive shell |
| `akm vault create` | `akm env create` | |
| `akm vault set` | Edit file directly or `akm secret set` | One-value use → secret |
| `vault:<name>` refs | `env:<name>` refs | Update all stash asset bodies |
| `/akm-vault` slash command | `/akm-env` | Update Claude plugin commands |

**Storage check:**

```bash
# Confirm vaults/ was migrated to env/ before upgrading to 0.9.0
ls "$(akm config get stashDir)/env/"
ls "$(akm config get stashDir)/vaults/.migrated"   # marker must exist
```

If `vaults/.migrated` does not exist, run `akm-migrate-storage --yes` first.

**Config changes:** none specific to 0.9.0 vault removal.

### Removed: manual proposal-queue management workflow

The hand-rolled manual proposal-management path — the `manage-akm-proposals`
skill, the `akm-process-proposals` command, and the hourly agent-session cron
task — is **removed**. It is replaced by the deterministic `akm proposal drain`
verb plus the `processes.triage` improve pre-pass (added in 0.8.0-rc.12), which
drain the standing pending backlog without an agent session.

| Removed | Replace with | Notes |
|---|---|---|
| `skill:manage-akm-proposals` (case-by-case queue review) | per-id `akm proposal show|diff|accept|reject`, or `akm proposal drain` for bulk | Built-in CLI; no skill needed |
| `command:akm-process-proposals` (manual queue processing) | `akm proposal drain --policy personal-stash --promote --yes` | Deterministic, one command |
| `tasks/*.yml` with a `prompt:` running `skill:manage-akm-proposals` on a schedule | a `command:` task running `akm proposal drain --policy personal-stash --promote --yes`, or enable `processes.triage` in the improve profile | Deterministic, no agent session |

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
workflow: workflow:my-workflow
---
```

New format (`tasks/<id>.yml`, pure YAML, no `---` delimiters):
```yaml
schedule: "0 2 * * *"
workflow: workflow:my-workflow
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
STASH_DIR="$(akm config get stashDir)"

grep -rn \
  "akm vault\|akm reflect\|akm distill\|akm proposal \|akm index --enrich\|--for-agent\|context-hub\|vault:" \
  "$STASH_DIR" \
  --include="*.md" --include="*.yml" \
  -l

# Show line-level matches for targeted review
grep -rn "akm vault" "$STASH_DIR" --include="*.md" --include="*.yml"
```

After scanning, use `akm lint` to catch structural issues the grep won't find:

```bash
akm lint --format json | jq '.issues[] | {rule, ref, message}'
```

`akm lint` flags: missing `updated` dates, unquoted colons in descriptions,
stale absolute paths, and missing-ref errors (where a `<type>:<name>` ref no
longer resolves).
