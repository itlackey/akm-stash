# akm Proposals, Quality, and Lessons

> **Version target:** akm-cli v0.7.0

akm v0.7.0 adds a safe self-improvement loop: agents can suggest changes, but
nothing touches the live stash until a proposal is reviewed and accepted.

## The proposal loop

1. **Create a draft**
   - `akm reflect <ref> --task "..."` for improving an existing asset.
   - `akm propose <type> <name> --task "..."` for drafting a new asset.
   - `akm distill <ref>` for turning feedback into a lesson proposal.
2. **Inspect the draft**
   - `akm proposal list`
   - `akm proposal show <id>`
   - `akm proposal diff <id>`
3. **Decide**
   - `akm proposal accept <id>` validates and promotes the change.
   - `akm proposal reject <id> --reason "..."` archives it.

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

A **lesson** is a first-class v0.7.0 asset stored under `lessons/`. Lessons are
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

- Record feedback with reasons so distillation has useful input.
- Read the proposal diff before accepting.
- Promote only changes that improve a real workflow, not just wording churn.
- Keep lessons focused on a repeated pattern or failure mode.
