---
name: harvest-session-knowledge
description: Use when normalized session-log evidence should be deduplicated, prioritized, and submitted to the akm proposal queue.
---

# Harvest Session Knowledge

This skill turns normalized session evidence into queue-ready lessons, skills,
workflows, or agents.

## When to use

- `skill:scan-session-logs` already produced usable records.
- Repeated mistakes or wins show up across multiple sessions.
- You want to package discoveries for akm review instead of keeping ad hoc notes.

## Steps

### 1. Group by pattern, not by file

Cluster records by the repeated thing that matters:

- same failure mode,
- same successful repair sequence,
- same missing reference or checklist,
- same delegation boundary that suggests a dedicated agent.

Require multiple pieces of evidence unless one record is exceptionally strong.

### 2. Score for relevance and uniqueness

Prioritize items that are:

- recent,
- repeated,
- grounded in explicit user or akm feedback,
- not already covered by a live asset or an open proposal.

Deprioritize one-off environment noise and duplicated summaries.

### 3. Choose the right proposal target

Use this mapping:

- **Lesson** — repeated mistake, warning, or durable heuristic.
- **Skill** — reusable procedure that solves the same class of task.
- **Workflow** — ordered multi-step process with clear checkpoints.
- **Agent** — recurring delegation boundary or specialist reviewer role.
- **Knowledge** — durable reference material or format/schema explanation.

If the insight updates an existing asset, prefer `akm reflect <ref> --task "..."`
instead of drafting a brand-new asset. If repeated feedback is about one live
asset, use `akm distill <ref>`.

### 4. Build queue-ready proposal briefs

For each candidate, capture:

- short title,
- proposed asset type,
- why it is new or better,
- supporting sessions or feedback refs,
- concrete behaviors to keep or avoid.

Each brief should be strong enough to become the `--task` text for a proposal.

### 5. Submit or dry-run

Use:

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

### 6. Hand off to proposal review

Finish with:

```bash
akm proposal list
akm proposal show <id>
akm proposal diff <id>
```

Then use `skill:manage-akm-proposals` or `command:akm-review-proposal` to
accept or reject the strongest submissions.
