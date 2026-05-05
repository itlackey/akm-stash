---
name: analyze-session-logs
description: Use when an agent needs one skill to scan supported session logs, normalize the evidence, and prepare queue-ready akm proposals.
---

# Analyze Session Logs

This skill turns mixed agent logs into prioritized proposal candidates without
splitting the work across multiple similarly named skills.

## When to use

- A user directory contains opencode, Claude, or akm traces that may contain
  reusable wins, mistakes, or feedback.
- You need one repeatable skill that both normalizes the evidence and ranks the
  strongest findings.
- You want a parser contract that can grow to cover other agent tools later.

## Canonical harvest record

Every parsed item should normalize to:

```json
{
  "tool": "opencode|claude|akm|other",
  "session_id": "stable id or derived filename",
  "timestamp": "latest relevant ISO-8601 time",
  "task": "what the session tried to do",
  "outcome": "success|partial|failure|unknown",
  "metrics": {
    "turns": 0,
    "tool_calls": 0,
    "files_touched": 0,
    "duration_ms": 0
  },
  "wins": ["repeatable successful strategy"],
  "mistakes": ["error, regression, or dead end"],
  "feedback": ["explicit user or akm feedback"],
  "artifacts": ["assets, files, commands, or refs mentioned"],
  "source_path": "/absolute/path/to/log",
  "extras": {}
}
```

Keep unknown source-specific fields inside `extras` instead of dropping them.

## Steps

### 1. Bound the scan first

Collect:

- one or more root directories,
- a time window such as `since=7d` or an ISO timestamp,
- optional tool filters (`opencode`, `claude`, `akm`),
- a file cap so large home directories stay tractable.

Prefer recent, writable user areas before broad filesystem scans.

### 2. Detect the source format before parsing

Use filename, parent directory, and light content checks together:

| Source | Common clues | Extract first |
|---|---|---|
| opencode | `opencode`, `sessions`, `.jsonl`, tool/event records | task, tool calls, retries, errors, timings |
| Claude | `claude`, `.claude`, transcript markdown/json/jsonl | user ask, assistant plan, tool traces, final result |
| akm | `feedback`, `proposal`, `metrics`, `akm`, stash state dirs | asset refs, positive/negative feedback, proposal outcomes |

If a file does not match confidently, tag it as `other` and preserve the raw
path for later parser additions.

### 3. Normalize variations, not just happy paths

- Merge multiline transcript blocks into one session summary.
- Treat missing timestamps or ids as recoverable; derive them from filenames or
  surrounding directory names when needed.
- Capture both explicit failures (`error`, `traceback`, rejected proposal) and
  soft misses (looping retries, user correction, abandoned plan).
- Record positive evidence too: repeated successful command sequences,
  user-approved fixes, and assets that resolved the task quickly.

### 4. Keep the parser contract extension-friendly

For each new tool parser, add only three pieces:

1. **Detector** — how to recognize candidate files.
2. **Mapper** — how raw fields become the canonical harvest record.
3. **Preserver** — which unmatched fields stay under `extras`.

That keeps new parsers additive and avoids rewriting downstream scoring logic.

### 5. Cluster repeated patterns

Group normalized records by the repeated thing that matters:

- same failure mode,
- same successful repair sequence,
- same missing reference or checklist,
- same delegation boundary that suggests a dedicated agent.

Require multiple pieces of evidence unless one record is exceptionally strong.

### 6. Score for relevance and uniqueness

Prioritize items that are:

- recent,
- repeated,
- grounded in explicit user or akm feedback,
- not already covered by a live asset or an open proposal.

Deprioritize one-off environment noise and duplicated summaries.

### 7. Choose the right proposal target

Use this mapping:

- **Lesson** — repeated mistake, warning, or durable heuristic.
- **Skill** — reusable procedure that solves the same class of task.
- **Workflow** — ordered multi-step process with clear checkpoints.
- **Agent** — recurring delegation boundary or specialist reviewer role.
- **Knowledge** — durable reference material or format/schema explanation.

If the insight updates an existing asset, prefer `akm reflect <ref> --task "..."`
instead of drafting a brand-new asset. If repeated feedback is about one live
asset, use `akm distill <ref>`.

### 8. Build queue-ready proposal briefs

For each candidate, capture:

- short title,
- proposed asset type,
- why it is new or better,
- supporting sessions or feedback refs,
- concrete behaviors to keep or avoid.

Each brief should be strong enough to become the `--task` text for a proposal.

### 9. Submit or dry-run

For new assets:

```bash
akm propose <type> <name> --task "<brief from harvested evidence>"
```

For updates:

```bash
akm reflect <ref> --task "<brief from harvested evidence>"
```

For repeated feedback on one asset:

```bash
akm distill <ref>
```

If the run is exploratory, stop after generating the briefs and mark them as a
dry run instead of writing to the queue.

### 10. Hand off to proposal review

Finish with:

```bash
akm proposal list
akm proposal show <id>
akm proposal diff <id>
```

Then use `skill:manage-akm-proposals` or `command:akm-review-proposal` to
accept or reject the strongest submissions.

Use `knowledge:session-log-harvest` for sample config, scheduling examples, and
example normalized output.
