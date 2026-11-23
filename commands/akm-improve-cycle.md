---
name: akm-improve-cycle
type: command
description: "Use when you need to run the full extract → improve → review cycle for the current stash. The argument is the mode (dry-run | live), optionally followed by a scope (an asset ref or type)."
updated: 2026-11-23
---

Run the full akm improvement cycle for the current stash.

Arguments: $ARGUMENTS

The first word is the mode (dry-run | live — default: live). An optional
second word is the scope (an asset ref or type — default: whole stash).

## 1. Check pipeline health

```bash
akm doctor
```

Report the last improve run times, pending proposal count, and any
warnings. Stop if `akm doctor` exits 1 (a failure); exit 4 is a warning to
report.

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
references"). `akm improve` accepts and commits the proposals whose quality
check passed and leaves the rest `pending`; step 4 reviews what remains.

## 4. Review pending proposals

```bash
akm proposal list --status pending --format json
```

For each pending proposal, run `akm proposal show <id>` and `akm proposal diff <id>`,
then either `akm proposal accept <id>` or `akm proposal reject <id> --reason "..."`.

For a large backlog, drain the deterministic slice first instead of reviewing
every entry by hand:

```bash
akm proposal drain --dry-run            # preview
akm proposal drain --promote --yes      # apply
```

Then review only what the drain left pending. (The `default` improve strategy
already runs this drain as a pre-pass in step 3.)

Skip this step when mode is `dry-run` — nothing was written to review yet.

## 5. Summarize

Report:
- Pending proposal count before and after.
- Whether any proposals were drained or accepted.
- Next recommended command (e.g. `akm proposal diff <id>` for the first remaining draft).
