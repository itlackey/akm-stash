---
description: Review user-directory session logs, extract high-signal lessons, and submit the best findings to the akm proposal queue.
tags: [harvest, logs, proposals, automation]
params:
  roots: Comma-separated directories to scan
  since: Relative window or ISO timestamp
  tools: Optional comma-separated tool filter such as opencode,claude,akm
  maxFiles: Optional cap on scanned files
  dryRun: true to stop before queue submission
updated: 2026-05-23
---

# Workflow: Harvest knowledge from session logs

## Step: Capture scope and queue context
Step ID: capture-context

### Instructions
Expand `params.roots`, note any missing directories, and record the harvest
window from `params.since`. Before extracting anything, inspect the current
proposal queue with `akm proposals` so repeated discoveries can be filtered
out early.

### Completion Criteria
- The scan roots and time window are explicit.
- Existing open proposals have been checked for overlap.

## Step: Scan and normalize supported logs
Step ID: scan-logs

### Instructions
Prefer the native scan: `akm improve --dry-run` runs the session-log providers
(opencode, claude-code) and emits normalized candidate records into
`<stash>/.akm/runs/<run-id>/improve-result.json`. Inspect that artifact first.

Fall back to `skill:analyze-session-logs` for any source the native providers
don't yet cover, or when you want to scan a custom root directory tree that
isn't `~/.claude`, `~/.local/share/opencode`, or akm state.

### Completion Criteria
- Native improve candidates (or custom-scanned records) are normalized with source paths attached.

## Step: Distill repeated patterns
Step ID: distill-patterns

### Instructions
Continue with `skill:analyze-session-logs` to cluster repeated mistakes,
successful strategies, explicit feedback, and missing references. Prefer
evidence that appears in more than one session or is backed by strong user/akm
feedback.

### Completion Criteria
- Candidate lessons, skills, workflows, agents, or knowledge assets were identified.
- Each candidate has supporting evidence.

## Step: Filter and prioritize
Step ID: prioritize

### Instructions
Remove duplicates, low-signal noise, and ideas already covered by the live stash
or open proposals. Rank the remaining candidates by reuse potential, clarity,
and expected impact.

### Completion Criteria
- The shortlist is relevant and non-duplicative.
- Each remaining candidate has a preferred asset type.

## Step: Submit proposals or stop at dry run
Step ID: submit

### Instructions
If `params.dryRun` is `true`, emit queue-ready briefs only. Otherwise, submit
the strongest items with `akm propose` for net-new assets or `akm improve`
for updates and feedback-backed lesson distillation.

### Completion Criteria
- Dry runs produced queue-ready briefs, or
- Live runs created proposal-queue entries.

## Step: Review and schedule the next harvest
Step ID: review-and-schedule

### Instructions
Review submitted proposals with `akm show proposal <id>` and
`akm diff <id>` (accepts UUID or prefix), then decide whether to accept or reject them. For
recurring runs, store the chosen roots and filters in a small config file and
schedule the kickoff command with `akm tasks add`, cron, a systemd timer, or
the host agent's own recurring task runner.

### Completion Criteria
- Submitted proposals were reviewed or queued for review.
- A repeatable schedule or configuration path is documented.
