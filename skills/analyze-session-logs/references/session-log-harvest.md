# Session Log Harvest Reference

Use this reference when you need a repeatable way to scan session logs, map
tool-specific formats into one schema, and submit only the best findings to the
akm proposal queue.

## Supported inputs

| Source | Typical locations or clues | High-value signals |
|---|---|---|
| opencode | paths containing `opencode`, `session`, `.json`, `.jsonl` | tool-call success/failure, retries, timings, command sequences |
| Claude | paths containing `claude`, `.claude`, transcript markdown/json/jsonl | task statement, plan quality, tool usage, final outcome, user corrections |
| akm feedback and metrics | paths containing `akm`, `feedback`, `proposal`, `metrics` | positive/negative asset feedback, improve candidates, proposal outcomes |

The parser should rely on both path hints and light content inspection so a
minor filename variation does not break harvesting.

## Normalization contract

Every parser should emit the canonical harvest record described in
`skill:analyze-session-logs`.

To support a new tool cleanly, add:

1. a detector for candidate files,
2. a mapper into canonical fields,
3. an `extras` bucket for unmatched source-specific data.

Downstream ranking should only depend on canonical fields so parser additions
stay easy and low risk.

## Recommended harvest configuration

```yaml
roots:
  - $HOME/.local/share/opencode
  - $HOME/.claude
  - $HOME/.local/state/akm
since: 7d
tools:
  - opencode
  - claude
  - akm
maxFiles: 500
dryRun: true
dedupeWindow: 30d
```

Keep the first run narrow. Expand roots or time windows only after the
normalized output looks clean.

## Scheduling

Use `akm tasks` (akm-cli 0.8+) for recurring harvest runs — it's the
purpose-built scheduling surface and handles dry-run modes, queue overlap, and
follow-up feedback uniformly:

```bash
akm tasks add harvest-session-knowledge \
  --schedule "15 3 * * *" \
  --workflow workflow:harvest-session-knowledge \
  --params '{"roots":"$HOME/.claude,$HOME/.local/state/akm","since":"7d","tools":"claude,akm","dryRun":true}'
```

Use dry runs by default for scheduled jobs; promote to live submission only
after duplicates are under control.

## Example normalized output

```json
{
  "tool": "claude",
  "session_id": "claude-2026-05-03-issue-412",
  "timestamp": "2026-05-03T18:42:11Z",
  "task": "repair failing release workflow",
  "outcome": "partial",
  "metrics": {
    "turns": 18,
    "tool_calls": 6,
    "files_touched": 4,
    "duration_ms": 1260000
  },
  "wins": [
    "Checked pending proposals before drafting a new workflow"
  ],
  "mistakes": [
    "Repeatedly retried the same CI command without reading the first failing log"
  ],
  "feedback": [
    "User asked for smaller, more surgical changes after the first draft"
  ],
  "artifacts": [
    "workflow:publish-stash",
    "skill:manage-akm-proposals"
  ],
  "source_path": "$HOME/.claude/projects/issue-412/transcript.jsonl",
  "extras": {
    "branch": "fix/release-workflow"
  }
}
```

## Example harvest-to-proposal flow

1. Scan and normalize records with `skill:analyze-session-logs`.
2. Cluster repeated misses such as "agents skip proposal-queue review before
   drafting changes."
3. Package the best finding:

   ```bash
   akm propose workflow review-proposals-first --task "Multiple recent session logs show agents drafting changes before checking open proposal-queue work. Create a short workflow that checks queue state first, cites the supporting sessions, and prevents duplicate drafts."
   ```

4. Review it:

   ```bash
   akm proposals
   akm show proposal <id>
   akm diff <id>
   ```

5. Accept only if the proposal is reusable, evidence-backed, and not already
   covered by the live stash.
