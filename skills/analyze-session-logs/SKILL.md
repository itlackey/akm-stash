---
name: analyze-session-logs
description: Use when an agent needs one skill to cluster repeated patterns and editorial-judge which session-log signals deserve to become akm proposals. For raw scanning and detection of opencode/claude/akm logs, `akm improve` now ingests them natively (`src/integrations/session-logs/providers/`) — this skill is for the editorial layer above that.
updated: 2026-05-24
---

# Analyze Session Logs

This skill turns mixed agent logs into prioritized proposal candidates. The raw
scan-and-detect work is now handled by `akm improve` natively (via the session-
log providers it ships); this skill's value is the **editorial judgment**:
clustering repeated patterns, picking the right proposal target, and writing
the briefs the agent (or `akm propose` / `akm improve --task`) will submit.

## When to use

- You want one repeatable skill that turns harvested session signals into ranked,
  ready-to-submit proposal briefs.
- You need to choose between Lesson / Skill / Workflow / Agent / Knowledge as the
  proposal target for a given pattern.
- You want a parser contract that can grow to cover other agent tools later.

## What's native vs. what this skill adds

`akm improve` natively (as of akm-cli 0.8) walks supported session logs
(opencode, Claude, akm feedback/proposal events) and feeds normalized records
into the improvement loop. So you typically don't need to write your own
scanner — call `akm improve --dry-run` against a ref and inspect the candidates.

This skill is for what comes next:

- Clustering repeated mistakes / wins across sessions.
- Choosing the right proposal target (lesson vs. skill vs. workflow vs. agent).
- Writing strong `--task` briefs that capture evidence.
- Filtering against existing proposals to avoid duplicates.

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

### 1. Source the candidates from `akm improve` first

In most cases, `akm improve` already harvests session logs natively:

```bash
akm improve --dry-run                 # all refs
akm improve <ref> --dry-run           # focused on one asset
```

The session-log providers (`src/integrations/session-logs/providers/{claude-code,opencode}`)
detect and normalize logs into the same candidate shape this skill expects.
Inspect `<stash>/.akm/runs/<run-id>/improve-result.json` for the parsed records.

Only fall back to a custom scan when you need a source the native providers
don't yet cover (and consider filing an issue against akm-cli to add it).

### 2. Bound any custom scan tightly

If you do need to scan beyond `akm improve`'s native providers, collect:

- one or more root directories,
- a time window such as `since=7d` or an ISO timestamp,
- optional tool filters (`opencode`, `claude`, `akm`),
- a file cap so large home directories stay tractable.

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

If the insight updates an existing asset, prefer `akm improve <ref> --task "..."`
instead of drafting a brand-new asset. The same `akm improve <ref>` flow is
also the right path when repeated feedback should be distilled into a lesson.

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
akm improve <ref> --task "<brief from harvested evidence>"
```

For repeated feedback on one asset:

```bash
akm improve <ref>
```

If the run is exploratory, stop after generating the briefs and mark them as a
dry run instead of writing to the queue.

### 10. Hand off to proposal review

Finish with:

```bash
akm proposals
akm show proposal <id>
akm diff <id>
```

Then use `skill:manage-akm-proposals` or `command:akm-review-proposal` to
accept or reject the strongest submissions.

Use `references/session-log-harvest.md` for sample config, scheduling examples, and
example normalized output.
