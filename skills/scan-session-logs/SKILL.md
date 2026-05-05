---
name: scan-session-logs
description: Use when an agent needs to scan user directories for opencode, Claude, or akm logs, normalize format variations, and extract reusable signals.
---

# Scan Session Logs

This skill turns mixed session logs into one evidence format that later
workflows can rank and submit.

## When to use

- A user directory contains opencode, Claude, and akm traces.
- You need reusable mistakes, wins, metrics, or feedback from recent sessions.
- You want an extension-friendly parser contract for another agent tool.

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

### 2. Detect the format before parsing

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

### 4. Use an extension-friendly parser contract

For each new tool parser, add only three pieces:

1. **Detector** — how to recognize candidate files.
2. **Mapper** — how raw fields become the canonical harvest record.
3. **Preserver** — which unmatched fields stay under `extras`.

That keeps new parsers additive and avoids rewriting downstream scoring logic.

### 5. Emit evidence-rich output

Produce either JSONL or a compact table that includes:

- the normalized record,
- the raw source path,
- a one-line explanation of why the item is worth harvesting.

Use `knowledge:session-log-harvest` for sample config, parser heuristics, and
example normalized output.
