---
name: akm-process-proposals
type: command
description: "Review and process all pending proposals in the user's personal akm stash using a built-in rubric: accept what has real content, reject only what is broken/empty/duplicate, and escalate only genuine conflicts that require human judgment. Arguments: $1 = limit (default: process all), $2 = optional generator filter (extract | consolidate | reflect | distill)."
updated: 2026-06-01
---

Review and process pending proposals in the **personal akm stash**. This command
is calibrated for a personal stash where session-extracted project knowledge,
project-specific context, and personal workflow notes are exactly what belongs —
they should be accepted, not rejected for being narrow.

**Limit:** $1 (default: process entire queue — run until empty)
**Generator filter:** $2 (optional — one of: extract, consolidate, reflect, distill)

---

## Phase 1 — Understand the queue

```bash
akm proposal list --status pending --format json
```

Record:
- `totalCount` — total pending proposals
- Breakdown by `source`: extract / consolidate / reflect / distill
- Breakdown by asset `type`: knowledge / memory / lesson / skill / workflow / agent / command

Log at the start:
```
Queue: <totalCount> pending | sources: extract=N consolidate=N reflect=N distill=N
```

If `$2` is supplied, restrict all subsequent steps to that generator only.

---

## Phase 2 — Bulk-accept the safe slices first

Run these in order before doing any individual review. They cover the vast
majority of a healthy queue:

```bash
# 1. Accept ALL extract proposals — session knowledge belongs in personal stash
akm proposal accept --generator extract -y

# 2. Accept reflect proposals with diffs ≤ 80 lines — mostly formatting/wording improvements
akm proposal accept --generator reflect --max-diff-lines 80 -y

# 3. Accept consolidate proposals in escalating diff-size batches
akm proposal accept --generator consolidate --max-diff-lines 20 -y
akm proposal accept --generator consolidate --max-diff-lines 50 -y
akm proposal accept --generator consolidate --max-diff-lines 100 -y
akm proposal accept --generator consolidate --max-diff-lines 200 -y
```

After each command, note how many were accepted. Re-check the queue with:
```bash
akm proposal list --status pending --format json
```

---

## Phase 3 — Review remaining proposals individually

For each remaining proposal:

```bash
akm proposal show <id>
akm proposal diff <id>
```

Then apply the rubric below.

### The personal-stash rubric

#### ACCEPT if the proposal has real content

A proposal passes if:
1. **Has substance** — the diff adds ≥ 5 lines of real content (not just frontmatter).
2. **Has a description** — the proposed asset has a `description:` field in frontmatter. Lessons also need `when_to_use:`.
3. **Not a plain duplicate** — the description is not word-for-word identical to another proposal being accepted in the same batch.

That is the entire acceptance bar for a personal stash. Project-specific content,
session-specific knowledge, and narrow-scope notes are all valuable — that is
the purpose of a personal stash. Do not apply community-stash filters here.

#### REJECT if any of the following are true

- **Empty diff** — `unified` is blank or adds < 5 lines. Nothing to accept.
- **Exact duplicate** — description is word-for-word identical to another proposal in the current batch. Keep the one with more content; reject the other.
- **Factually wrong** — contains a command, flag, or claim that is demonstrably incorrect against the current akm version (e.g. references a removed command like `akm vault`).
- **Broken metadata** — no `description:` field at all. Lessons with no `when_to_use:` should be noted but not automatically rejected — add a note in the report.

```bash
akm proposal reject <id> --reason "<specific criterion: empty-diff | exact-duplicate | factually-wrong | broken-metadata>" -y
```

#### ESCALATE only for genuine conflicts

Do NOT escalate when uncertain. Default to Accept for personal stash content.

Escalate only when:
- The proposal **contradicts a live asset** and it is unclear which is correct (e.g. two memories that make mutually exclusive factual claims about the same system behavior, both plausible).
- The proposal involves **security or credentials** content where the right answer requires domain context you don't have.

Do NOT run any CLI command for escalated proposals — leave them pending.

---

## Phase 4 — Report

```md
## Proposal Processing Report

**Queue at start:** <totalCount>
**Remaining pending:** <N>
**Generator filter:** <$2 or 'all'>

### Results

| Decision | Count |
|---|---|
| Accepted | N |
| Rejected | N |
| Escalated | N |

### Rejected (list each)
- `<id[:8]>` `<ref>` — <criterion: empty-diff | exact-duplicate | factually-wrong | broken-metadata>

### Escalated — requires human review
For each escalated proposal:

---
**`<id>`**
Ref: `<ref>` | Source: `<source>` | Created: `<createdAt>`

**Why escalated:** <which condition — contradiction or security>
**What conflicts:** <live asset ref> says X; proposal says Y
**Suggested resolution:** <one concrete action>
---

### Remaining queue
<N> proposals not yet processed.
To continue: `/akm-process-proposals`
```

---

## Efficiency notes

- For a large queue (> 100), the bulk steps in Phase 2 typically clear 85–95%.
  Only 10–20 proposals usually need individual review.
- After clearing the queue, run `akm index` to ensure all accepted assets are
  searchable immediately.
- Clearing the proposal queue directly improves consolidation quality in the next
  improve cycle — `dedup_pending_proposal` skip-reason counts drop in proportion
  to proposals cleared.
- If the queue grows faster than you can clear it, check `akm health` for
  `consolidation.judgedNoAction` rate — a high rate with many pending proposals
  means the improve cycle is generating redundant proposals that could be tuned.
