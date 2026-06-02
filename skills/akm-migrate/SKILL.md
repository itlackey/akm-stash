---
name: akm-migrate
description: Guide an agent through verifying and completing an akm upgrade — reading migration notes, running config and storage migrations, updating stash assets that reference deprecated commands, and confirming the system is healthy. Use after `akm upgrade` or after manually installing a new akm version.
updated: 2026-06-01
---

# akm Migration Guide

This skill walks through every step needed after upgrading akm. Migrations in
akm operate at four distinct layers — read the release notes, migrate config,
migrate storage, then verify stash assets and system health.

---

## Step 1 — Determine what version you upgraded from and to

```bash
akm --version
```

If you don't know the previous version, check the config backup directory:

```bash
ls ~/.cache/akm/config-backups/
```

The backup filenames contain timestamps. The most recent backup before today
is the pre-upgrade config and shows the old version via `configVersion` inside
it.

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

## Step 3 — Run the config migration

akm auto-migrates config on every invocation, but running it explicitly lets
you preview and confirm the changes:

```bash
# Preview changes without writing
akm migrate --dry-run --diff

# Apply the migration
akm migrate
```

**What it does:** renames deprecated config keys, moves fields to their new
locations (e.g. `agent.default` → `defaults.agent`), removes keys that no
longer exist, and sets `configVersion` to the current version.

If `akm migrate` reports no changes, your config was already up to date.

---

## Step 4 — Run the storage migration (if needed)

Some version upgrades also move files in the stash directory. Check whether
a storage migration is needed:

```bash
# Preview storage migration (no changes written)
akm-migrate-storage --dry-run

# Apply storage migration
akm-migrate-storage --yes
```

The most common storage migration is `vaults/` → `env/` (introduced in 0.8.0).
If the command is not found, your version does not include a storage migration.

After any storage migration, rebuild the search index:

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
# Find assets mentioning deprecated commands (adjust patterns per version)
grep -r "akm vault\|akm reflect\|akm distill\|akm index --enrich\|--for-agent\|proposal list\|proposal show\|proposal diff\|proposal accept\|proposal reject" \
  "$(akm config get stashDir)" --include="*.md" --include="*.yml" -l

# Find task assets that use the old .md extension (must be .yml)
find "$(akm config get stashDir)/tasks" -name "*.md" 2>/dev/null
```

For each file that matches:
1. Open it with `akm show <ref>` to read the full content
2. Apply the replacement from `references/breaking-changes.md`
3. Write the corrected version with `akm remember` (for memories) or direct
   file edit + `akm index` (for other asset types)

### Common asset updates

**Task files must be `.yml`** (enforced from 0.8.0):

```bash
# Rename any .md task files to .yml — read the content first and convert
# the frontmatter-based format to pure YAML
find "$(akm config get stashDir)/tasks" -name "*.md" -exec echo "Needs renaming: {}" \;
```

**Update stash skills and commands that call deprecated CLI verbs:**

```bash
# Use akm lint to find stale refs in your stash assets
akm lint --format json | jq '.issues[] | select(.rule == "stale-command" or .rule == "missing-ref")'
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
- Agent profile configuration
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

# Check the configured agent profile is still valid
akm config get defaults.agent
akm info | grep -A5 "agent"
```

---

## Step 8 — Confirm with a smoke test

```bash
# Basic discovery
akm curate "test query after upgrade"

# Confirm a known asset is still reachable
akm show skill:akm-quickstart
```

If these succeed, the upgrade is complete.

---

## Rollback

If something went wrong and you need to revert:

```bash
# Restore the pre-upgrade config from backup
ls ~/.cache/akm/config-backups/
cp ~/.cache/akm/config-backups/config-<timestamp>.json ~/.config/akm/config.json

# Restore the pre-upgrade data directory (only if DB was corrupted)
# First: stop any running akm processes
# Then:
akm db backups   # list available backups
bash scripts/migrations/restore-data-dir.sh <backup-path> ~/.local/share/akm
```

The data directory backup is written automatically by akm before any
destructive DB schema upgrade. Backups live at:
`~/.local/share/akm/backups/<timestamp>-pre-v<version>/`

---

## Reference

See `references/breaking-changes.md` for a per-version quick reference of
what to check in stash assets after each major release.
