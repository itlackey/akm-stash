---
description: Use when an agent needs the 0.10.261130 proposal queue, quality values, and lesson lifecycle explained clearly.
tags: [akm, proposals, lessons]
quality: curated
updated: 2026-11-23
---

# akm Proposals, Quality, and Lessons

> **Version target:** akm-cli 0.10.261130

akm keeps a proposal-first self-improvement loop: generators (`improve`,
`proposal extract`, `proposal new`) write proposals to a queue rather than to
live assets. A proposal becomes live when it is accepted: by a person with
`akm proposal accept`, or by `akm improve` / `akm proposal drain --promote` for
proposals whose quality judge passed on their current content. Everything else
stays `pending`. Every accept commits to a git-backed bundle and `akm proposal
revert` undoes it.

## The proposal loop

1. **Create a draft**
   - `akm improve <ref> --task "..."` for improving an existing asset (also
     handles lesson distillation from repeated feedback).
   - `akm improve <type>` for broad improvement passes over one asset type.
   - `akm proposal new <type> <name> --task "..."` for drafting a new asset.
2. **Inspect the draft**
   - `akm proposal list`
   - `akm proposal show <id>`
   - `akm proposal diff <id>` (accepts a UUID, a UUID prefix, or an asset ref)
3. **Decide**
   - `akm proposal accept <id>` validates and promotes the change.
   - `akm proposal reject <id> --reason "..."` archives it;
     `akm proposal reopen <id>` puts a rejected proposal back to `pending`.
4. **Roll back if needed**
   - `akm proposal revert <id>` undoes a previously accepted proposal
     (full id or ref only — no UUID prefix, no batch revert).

Everything lives under `akm proposal <verb>` or `akm improve`; there are no
flat verbs such as `akm accept` or `akm reject`. A bare `akm proposal` runs
`akm proposal list`.

## Draining the backlog (automated)

The per-id review loop above is for deciding individual drafts. To keep the
**standing pending backlog** from growing, akm has a built-in deterministic
drainer — you no longer need a manual agent session for routine queue
cleanup:

- `akm proposal drain --dry-run` previews accept/reject/defer decisions; add
  `--promote --yes` to apply them. One rule decides: a proposal whose quality
  judge passed on its current content is accepted, an empty diff is rejected,
  and everything else (reflect or distill proposals deferred for review,
  proactive-lane proposals) waits for a person. `--max-accepts N` and
  `--older-than D` bound a run.
- The `processes.triage` improve process runs the same drain as a **pre-pass
  inside `akm improve`**, before reflect/distill; it is on in the `default`
  strategy.
- For bulk per-generator decisions outside the drain policy, `akm proposal
  accept --generator <name> -y` / `akm proposal reject --generator <name>
  --reason "..." -y` accept or reject every pending proposal from one
  generator (e.g. `reflect`, `distill`, `extract`).

See `knowledge/akm-cli-reference` (the `akm proposal drain` section) and
`knowledge/akm-improve-and-extract` (the triage pre-pass) for full flags and
config. For hands-on review of individual drafts, use `akm proposal show
<id>` / `akm proposal diff <id>` then `akm proposal accept|reject`; the
drain is for routine, unattended cleanup of what a judge already passed.

## Quality values

akm search hits can carry a `quality` field.

| Value | Meaning |
|---|---|
| `curated` | Human-authored or manually curated content. |
| `generated` | Machine-generated content that is already live. |
| `proposed` | Draft content in the proposal queue. |

Default search excludes `quality: "proposed"`. Use
`akm search <query> --include quality=proposed` when you are intentionally
reviewing draft material.

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
single benchmark answer, it should not live in the bundle. There is no
dedicated lessons command: use `akm search --type lesson` to enumerate
lessons.

## Good operator habits

- Record feedback with reasons so `akm improve` has useful input.
- Read the proposal diff before accepting.
- Promote only changes that improve a real workflow, not just wording churn.
- Keep lessons focused on a repeated pattern or failure mode.
