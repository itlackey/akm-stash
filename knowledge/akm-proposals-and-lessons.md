---
description: Use when an agent needs the 0.9.6 proposal queue, quality values, and lesson lifecycle explained clearly.
tags: [akm, proposals, lessons]
quality: curated
updated: 2026-08-31
---

# akm Proposals, Quality, and Lessons

> **Version target:** akm-cli 0.9.6

akm keeps a safe self-improvement loop: agents can suggest changes, but
nothing touches the live bundle until a proposal is reviewed and accepted.
There is no confidence gate anywhere in this loop — `akm improve` always
writes to the queue, never directly to a live asset.

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
   - `akm proposal reject <id> --reason "..."` archives it.
4. **Roll back if needed**
   - `akm proposal revert <id>` undoes a previously accepted proposal
     (full id or ref only — no UUID prefix, no batch revert).

There is no bare `akm proposal` (no verb) — it is a usage error in 0.9.6;
name the subcommand. There are also no flat verbs (`akm proposals`, `akm
extract`, `akm propose`, `akm accept`, `akm reject`, `akm diff`, `akm
revert`, `akm reflect`, `akm distill`) — everything lives under `akm
proposal <verb>` or `akm improve`.

## Draining the backlog (automated)

The per-id review loop above is for deciding individual drafts. To keep the
**standing pending backlog** from growing, akm has a built-in deterministic
drainer — you no longer need a manual agent session for routine queue
cleanup:

- `akm proposal drain --policy personal-stash --dry-run` previews
  accept/reject/defer decisions; add `--promote --yes` to apply them. Presets:
  `personal-stash`, `conservative`, `manual`, or `--policy <path>`.
- Enabling `processes.triage` in an improve strategy runs the same drain as a
  **pre-pass inside `akm improve`**, before reflect/distill.
- For bulk per-generator decisions outside the drain policy, `akm proposal
  accept --generator <name> -y` / `akm proposal reject --generator <name>
  --reason "..." -y` accept or reject every pending proposal from one
  generator (e.g. `reflect`, `distill`, `extract`).

See `knowledge/akm-cli-reference` (the `akm proposal drain` section) and
`knowledge/akm-improve-and-extract` (the triage pre-pass) for full flags and
config. For hands-on review of individual drafts, use `akm proposal show
<id>` / `akm proposal diff <id>` then `akm proposal accept|reject`; the
drainer is the recommended path for routine, unattended cleanup.

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
single benchmark answer, it should not live in the bundle. There is no
dedicated `akm lessons coverage`/`strength` command — lesson strength is
indexed automatically; use `akm search --type lesson` to enumerate lessons.

## Good operator habits

- Record feedback with reasons so `akm improve` has useful input.
- Read the proposal diff before accepting.
- Promote only changes that improve a real workflow, not just wording churn.
- Keep lessons focused on a repeated pattern or failure mode.
