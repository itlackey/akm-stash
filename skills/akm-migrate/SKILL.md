---
name: akm-migrate
description: Use when upgrading to akm-cli 0.9.2 and you need to preserve active-workflow state, convert retired task-v2/v3 sources to task source v4, update stale bundle guidance, and verify the result.
updated: 2026-08-29
---

# AKM 0.9.2 Migration Guide

Use this guide after upgrading the executable to 0.9.2. It concentrates on
the migrations this release actually exposes: task sources, durable workflow
plans, and task-history consumers. \`akm migrate\` is **not** a general config
or database migration command.

## 1. Read the release guidance and secure work in progress

\`\`\`bash
akm --version
akm help migrate 0.9.2
akm workflow list --active
\`\`\`

Before changing task source, commit or otherwise snapshot the authored bundle.
Complete active workflows where practical. A plan frozen before 0.9.2 uses an
older IR and cannot resume, advance, complete, or run under 0.9.2; it remains
readable and can be abandoned:

\`\`\`bash
akm workflow status <run-id>
akm workflow abandon <run-id>
akm workflow run <workflow-ref>
\`\`\`

Do not downgrade below 0.9.2 after this version has written task history to a
given \`state.db\`: new history metadata is intentionally unreadable by older
versions. A normal 0.9.1-to-0.9.2 state-database upgrade is additive and
automatic. Follow \`akm help migrate 0.9.2\` if the executable reports an
exceptional pre-release ledger that requires \`akm upgrade --force\`.

## 2. Preview and apply task-source migration

Task source v4 is the only executable grammar in 0.9.2. The wrapped
\`akm migrate\` command runs task-v2 → v3 and v3 → v4 in sequence, backing up
and validating each replacement atomically.

\`\`\`bash
# Read-only plan: inspect changed, skipped, and blocked files.
akm migrate status
akm migrate apply --dry-run

# After resolving every blocked source, apply the same plan.
akm migrate apply
\`\`\`

Do not add obsolete \`--config\`, \`--diff\`, storage, or restore flags: they are
not part of the 0.9.2 \`akm migrate\` interface. A \`blocked\` entry is deliberate;
read its reason, repair the authored source, and preview again rather than
forcing a partial conversion.

## 3. Repair or author task source v4 deliberately

Every task lives at \`tasks/<id>.yml\`, begins with \`version: 4\`, selects exactly
one target (\`uses:\` or \`run:\`), and may omit \`schedule:\` for a manual-only
task. \`with:\` is valid only for \`uses: akm/command\`; other executable refs use
typed \`inputs:\` when needed. \`enabled\` is per schedule binding, while execution
controls such as \`timeout\`, \`engine\`, and \`redact\` are top-level keys.

\`\`\`yaml
version: 4
name: Nightly review
uses: akm/command
with:
  content: Review the bundle and queue improvement proposals only.
schedule:
  - cron: "0 4 * * *"
    enabled: true
timeout: 30m
\`\`\`

For ambiguous v2/v3 sources, use \`references/breaking-changes.md\`. Typical
manual fixes are an old argv array with no safe shell equivalent, a removed
GitHub Action-shaped \`uses:\` locator, a \`with:\` block on a non-command target,
or two competing legacy schedule forms. Validate resolution without running:

\`\`\`bash
akm task explain tasks/nightly-review
akm task sync
akm task doctor
\`\`\`

## 4. Update authored workflows and task-history consumers

0.9.2 workflow runs freeze \`irVersion: 5\` and \`hashVersion: 7\`. Markdown and
single-job GitHub-shaped YAML workflows are peer source forms; a YAML workflow
must be \`.yml\`, and \`inherit_env\` is rejected in favor of explicit named
environment bindings and \`pass_env\`. Use the read-only planner before a run:

\`\`\`bash
akm workflow plan workflows/release
akm lint --type workflows
\`\`\`

Update API consumers of \`akm task history\` or \`akm task run --format json\`:
\`target.kind\` now uses \`command\`, \`shell\`, \`script\`, \`workflow\`, or \`unknown\`.
The retired agent/LLM value \`prompt\` maps to \`command\`; the old shared native
\`command\` value split into \`shell\` and \`script\`. Existing rows are projected
through the new vocabulary by 0.9.2.

## 5. Scan and verify the bundle

\`\`\`bash
BUNDLE_DIR="$(akm info --format json | jq -r .bundleDir)"

# Review potentially retired command/ref forms; refine the list for your source.
rg -n --glob '*.md' --glob '*.yml' \
  'akm (vault|reflect|distill|extract|tasks|add|list|remove|update|save|events|wiki|propose|proposals|accept|reject|diff|revert)\b|--auto-accept|--profile |\b(?:skill|knowledge|memory|workflow|command|agent|script|env|secret|lesson|task|vault|wiki):[A-Za-z0-9_/-]+' \
  "$BUNDLE_DIR"

# Task sources must be .yml and v4; inspect any matches before changing them.
find "$BUNDLE_DIR/tasks" -name '*.md' -print
rg -L '^version: 4$' "$BUNDLE_DIR/tasks" -g '*.yml'

akm index --full
akm lint
akm task sync
akm task doctor
akm health --format json
\`\`\`

\`akm show\` is for locally indexed assets. Search registry candidates with
\`akm search <query> --from registry\`; inspect their returned source/homepage
read-only until you intentionally install a source.

## Completion checklist

- \`akm migrate apply --dry-run\` reports no unresolved legacy task sources.
- Every executable task passes \`akm task explain\`; scheduler bindings reconcile
  with \`akm task sync\`.
- Each workflow passes \`akm workflow plan\` and \`akm lint --type workflows\`.
- \`akm lint\` and \`akm health --format json\` have no unexplained failures.
- Any downstream task-history parser accepts the 0.9.2 target vocabulary.

See \`references/breaking-changes.md\` for a concise current contract and a
clearly marked historical 0.9.0 rename table.
