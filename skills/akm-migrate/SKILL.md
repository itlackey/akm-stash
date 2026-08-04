---
name: akm-migrate
description: Guide an agent through verifying and completing an akm upgrade — reading migration notes, running config and storage migrations, updating stash assets that reference deprecated commands, and confirming the system is healthy. Use after `akm upgrade` or after manually installing a new akm version.
updated: 2026-08-04
---

# akm Migration Guide

This skill walks through every step needed after upgrading akm. Migrations in
akm operate at four distinct layers — read the release notes, migrate config,
migrate storage, then verify stash assets and system health.

---

## Step 1 — Determine what version you upgraded from and to

```bash
akm --version
akm migrate status
```

If you don't know the previous version, `akm migrate status` reports the
current config/database classification and, once an `apply` has run at least
once, points at the verified recovery run it created — that run's
`configVersion` shows the pre-upgrade version. Do not hand-inspect or copy
files under the data directory directly; treat `akm migrate status` /
`akm-migrate restore` as the source of truth for backup state.

---

## Step 2 — Read the migration notes for the new version

```bash
# Replace X.Y.Z with the version you upgraded TO
akm help migrate X.Y.Z

# Or: get notes for the latest installed version
akm help migrate latest
```

Read the output carefully. It lists:
- Automatic storage migrations that ran during upgrade
- Manual steps the operator must take
- Removed commands and flags
- Changed command behavior
- DB schema changes and what data was rebuilt

For major version transitions (e.g. 0.7 → 0.8), also read the longform guide:

```bash
# Available longform guides are listed here:
akm help migrate
```

---

## Step 3 — Run the config and database migration

**Config no longer auto-migrates on every invocation as of 0.9.0.** Migration
is an explicit coordinator step: `akm migrate` inspects and applies config
plus durable-database (`state.db`) migration as one installation lifecycle.
Normal commands refuse an old, future, or divergent durable schema instead of
silently migrating it as a side effect.

```bash
# Read-only status check first — exits nonzero when apply is blocked
akm migrate status

# Preview against a prepared target config, without writing
akm migrate apply --config ./prepared-config.json --dry-run

# Apply
akm migrate apply --config ./prepared-config.json
```

`--config` is required when the active config is legacy or absent; when the
active config is already current, `apply` safely uses it as the target with
no `--config` needed. Apply is idempotent and creates a semantically verified
recovery run before changing any artifact — it refuses before that backup if
managed handles, maintenance activities, mutation locks, or a workflow claim
are live.

**Crossing 0.8 → 0.9 specifically:** the installed 0.8 binary does not know
the 0.9 migration protocol. Before running anything else: create an
independent filesystem backup, prepare a valid 0.9 config, install or stage
the 0.9 binary, then invoke that **new** binary with `akm migrate apply
--config <prepared-0.9-config>`. Do not use an 0.8 `akm upgrade
--migration-config` flow — 0.8 code cannot enforce the safeguards 0.9
introduced.

If `akm migrate status` reports `blocked`, stop: preserve the reported backup
run and resolve the named artifact or active-operation error before retrying
`apply`.

If `akm migrate status` reports `ready`/`current`, your config and database
were already up to date.

---

## Step 4 — Run the storage migration (if needed)

Some version upgrades also move files in the stash directory. This is a
separate step from `akm migrate` — it is the standalone `akm-migrate` tool's
`storage` subcommand:

```bash
# Preview storage migration (no changes written)
akm-migrate storage --dry-run

# Apply storage migration
akm-migrate storage --yes
```

The most common storage migration is the non-destructive `vaults/` → `env/`
copy needed when crossing into 0.9.0 from an older stash that still stores
`.env` files only under `vaults/`. If the command reports nothing to do, your
stash does not need a storage migration.

After any storage migration, rebuild the search index — indexing does not
migrate config or durable schemas, so run it only **after** migration status
reports `current`:

```bash
akm index
```

---

## Step 5 — Update stash assets for deprecated commands

After reading the migration notes, scan your stash for assets that reference
removed or renamed commands. Check `references/breaking-changes.md` for the
specific patterns to look for in your target version.

### Scan for deprecated patterns

```bash
BUNDLE_DIR="$(akm info --format json | jq -r .bundleDir)"

# Find assets mentioning retired commands or the old type:name ref grammar
# (adjust patterns per version — see references/breaking-changes.md)
grep -rn "akm vault\|akm reflect\|akm distill\|akm extract\|akm tasks \|akm add \|akm list\b\|akm init\b\|akm propose \|akm remove\b\|akm update\b\|akm save\b\|akm events\b\|akm wiki\|akm accept\|akm proposals\b\|akm proposal drain\|--auto-accept\|--profile " \
  "$BUNDLE_DIR" --include="*.md" --include="*.yml" -l

grep -rnoE '\b(skill|knowledge|memory|workflow|command|agent|script|env|secret|lesson|task|vault|wiki):[a-zA-Z0-9_/-]+' \
  "$BUNDLE_DIR" --include="*.md" --include="*.yml"

# Find task assets that use the old .md extension (must be .yml) or lack `version: 2`
find "$BUNDLE_DIR/tasks" -name "*.md" 2>/dev/null
grep -rL '^version: 2' "$BUNDLE_DIR/tasks" --include="*.yml" 2>/dev/null
```

For each file that matches:
1. Open it with `akm show <ref>` to read the full content
2. Apply the replacement from `references/breaking-changes.md`
3. Write the corrected version with `akm remember` (for memories) or direct
   file edit + `akm index` (for other asset types)

### Common asset updates

**Task files must be `.yml` and begin with `version: 2`** (only version-2
task YAML is discovered as of 0.9.0; a v1 file, including one with no
`version` key, is diagnosed by `sync`/`doctor` but never rewritten or
executed):

```bash
# Rename any .md task files to .yml — read the content first and convert
# to pure YAML with a leading `version: 2` key
find "$BUNDLE_DIR/tasks" -name "*.md" -exec echo "Needs renaming: {}" \;
```

**Update stash skills and commands that call deprecated CLI verbs:**

```bash
# Use akm lint to find structural issues, then grep for stale refs directly —
# akm lint does not have a dedicated "stale-command" rule; the CLI itself
# fails a retired command with UNKNOWN_COMMAND and a replacement hint, which
# is the fastest way to confirm a fix (run the command, expect it to succeed).
akm lint --format json | jq '.flagged[]'
akm lint --type workflows --format json | jq '.flagged[]'   # invalid-workflow-structure findings
```

---

## Step 6 — Rebuild and verify

```bash
# Rebuild the full search index
akm index --full

# Run one improve cycle to repopulate graph data (needed after schema changes)
akm improve --dry-run   # preview first
akm improve             # apply

# Verify runtime health
akm health
```

`akm health` reports:
- `state.db` schema and round-trip integrity
- Agent engine configuration
- Task history backing
- Recent improve pipeline metrics

All hard checks should show `status: "pass"`. Any `warn` or `fail` is a
post-upgrade issue to resolve before using the system in production.

---

## Step 7 — Verify proposals and lessons are accessible

```bash
# Check pending proposals survived the upgrade
akm proposal list --status pending

# Check lessons are indexed
akm search --type lesson --limit 5

# Check the configured default engine is still valid
akm config get defaults.engine
akm info
```

---

## Step 8 — Confirm with a smoke test

```bash
# Basic discovery
akm curate "test query after upgrade"

# Confirm a known asset is still reachable
akm show skills/akm-quickstart
```

If these succeed, the upgrade is complete.

---

## Rollback

If something went wrong and you need to revert, use the standalone
`akm-migrate` tool's `restore` subcommand rather than hand-copying files —
`apply` already created a verified recovery run before it touched anything:

```bash
# List available backup runs for a target version
akm migrate status

# Restore is explicit and destructive — it creates and verifies a rescue
# backup of the CURRENT (post-attempt) state before replacing anything:
akm-migrate restore --for 0.9.0 --run <backup-run-id> --confirm
```

There is no `akm db` command and no ad hoc `scripts/migrations/restore-data-dir.sh`
helper — `akm-migrate restore` is the one supported path back to a prior
backup run, for both config and the durable databases (`state.db`/`index.db`/
`logs.db`) together.

---

## Reference

See `references/breaking-changes.md` for a per-version quick reference of
what to check in stash assets after each major release.
