---
description: Use when an agent needs the v0.8.0 proposal queue, quality values, and lesson lifecycle explained clearly.
tags: [akm, proposals, lessons]
quality: curated
updated: 2026-06-02
---

# akm Proposals, Quality, and Lessons

> **Version target:** akm-cli v0.8.0

akm v0.8.0 keeps a safe self-improvement loop: agents can suggest changes, but
nothing touches the live stash until a proposal is reviewed and accepted.

## The proposal loop

1. **Create a draft**
   - `akm improve <ref> --task "..."` for improving an existing asset.
   - `akm improve <type>` for broad improvement passes over one asset type.
   - `akm propose <type> <name> --task "..."` for drafting a new asset.
   - `akm improve <ref>` again when repeated feedback should be distilled into a lesson proposal.
2. **Inspect the draft**
   - `akm proposal list`
   - `akm proposal show <id>`
   - `akm proposal diff <id>` (accepts a UUID or UUID prefix)
3. **Decide**
   - `akm proposal accept <id>` validates and promotes the change.
   - `akm proposal reject <id> --reason "..."` archives it.
4. **Roll back if needed**
   - `akm proposal revert <id>` undoes a previously accepted proposal
     (per-id only — there is no batch revert).

## Draining the backlog (automated, v0.8.0-rc.12+)

The per-id review loop above is for deciding individual drafts. To keep the
**standing pending backlog** from growing, akm has a built-in deterministic
drainer — you no longer need a manual agent session for routine queue cleanup:

- `akm proposal drain --policy personal-stash --dry-run` previews
  accept/reject/defer decisions; add `--promote --yes` to apply them. Presets:
  `personal-stash`, `conservative`, `manual`, or `--policy <path>`.
- Enabling `processes.triage` in an improve profile runs the same drain as a
  **pre-pass inside `akm improve`**, before reflect/distill.

See `knowledge:akm-cli-reference` (the `akm proposal drain` section) and
`knowledge:akm-improve-and-extract` (the triage pre-pass) for full flags and
config. The manual `manage-akm-proposals` skill / `akm-process-proposals`
command still work for hands-on review, but the drainer is now the recommended
path for routine, unattended cleanup.

## Quality values

akm search hits can carry a `quality` field.

| Value | Meaning |
|---|---|
| `curated` | Human-authored or manually curated content. |
| `generated` | Machine-generated content that is already live. |
| `proposed` | Draft content in the proposal queue. |

Default search excludes `quality: "proposed"`. Use
`akm search <query> --include-proposed` when you are intentionally reviewing
draft material.

## Lessons

A lesson is a first-class asset stored under `lessons/`. Lessons are
meant to capture reusable guidance learned from repeated wins or misses.

Typical lesson frontmatter:

```yaml
---
description: Use when repeated feedback shows the agent misses docker-compose healthcheck patterns.
when_to_use: You have multiple related failures and want a compact corrective note.
quality: curated
---
```

Lessons should be short, specific, and reusable. If a lesson only applies to a
single benchmark answer, it should not live in the stash.

## Good operator habits

- Record feedback with reasons so `akm improve` has useful input.
- Read the proposal diff before accepting.
- Promote only changes that improve a real workflow, not just wording churn.
- Keep lessons focused on a repeated pattern or failure mode.
