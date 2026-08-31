---
name: akm-improve-cycle
type: command
description: "Use when you need to run the full extract → improve → review cycle for the current stash. Arguments: mode (dry-run | live), scope (optional asset ref or type)."
updated: 2026-08-31
---

Run the full akm improvement cycle for the current stash.

Mode: $1 (dry-run | live — default: live)
Scope: $2 (optional asset ref or type — default: whole stash)

## 1. Check pipeline health

```bash
akm health --format json
```

Report the last improve run times, pending proposal count, and any
warnings. Stop if a critical error is reported.

## 2. Extract knowledge from recent sessions

```bash
akm proposal extract --auto --since 24h
```

Queue proposals from Claude Code and OpenCode sessions from the last 24 hours.
Add `--dry-run` when mode is `dry-run`.

## 3. Run the improve pass

```bash
akm improve
```

Add `--dry-run` when mode is `dry-run`. When a scope argument is provided,
append it: `akm improve <scope>`.

Add `--task "..."` when there is a specific area to target (e.g. "update CLI
references for 0.9.7"). `akm improve` never auto-promotes — every generated
proposal lands `pending` regardless of mode; step 4 below is always required.

## 4. Review pending proposals

```bash
akm proposal list --status pending --format json
```

For each pending proposal, run `akm proposal show <id>` and `akm proposal diff <id>`,
then either `akm proposal accept <id>` or `akm proposal reject <id> --reason "..."`.

For a large backlog, drain the deterministic slice first instead of reviewing
every entry by hand:

```bash
akm proposal drain --policy personal-stash --dry-run            # preview
akm proposal drain --policy personal-stash --promote --yes      # apply
```

Then review only what the policy left pending. (Enabling `processes.triage` in
the improve strategy folds this drain into step 3 automatically.)

Skip this step when mode is `dry-run` — nothing was written to review yet.

## 5. Summarize

Report:
- Pending proposal count before and after.
- Whether any proposals were drained or accepted.
- Next recommended command (e.g. `akm proposal diff <id>` for the first remaining draft).
