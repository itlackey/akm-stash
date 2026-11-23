# akm-stash

The official akm stash: a curated collection of assets that teach coding
agents how to use [akm](https://github.com/itlackey/akm) effectively, for
**akm-cli 0.10.261130**.

If akm is the package manager for agent assets, this is the starter stash:
install it once and an akm-aware agent gains practical skills, commands,
knowledge, and tasks for discovery, installation, publishing,
self-improvement, proposal review, and scheduled task authoring.

## What's inside

| Directory | Contents |
|---|---|
| [`agents/`](./agents) | Subagents that specialize in akm tasks (`akm-librarian`). |
| [`commands/`](./commands) | Prompt templates for discovery, stash review, and proposal review. |
| [`knowledge/`](./knowledge) | Reference docs for the CLI, stash structure, the improve+extract pipeline, proposal/lesson lifecycle, and registry schema. |
| [`skills/`](./skills) | Progressive-disclosure skills for bootstrapping, installing, publishing, migrating, curating, health reporting, and memory consolidation. |
| [`tasks/`](./tasks) | Runnable and schedulable tasks for onboarding, publishing, evolving assets, and recurring improve and proposal-review checks. |

Every asset is authored for agent consumption: trigger-sentence descriptions,
canonical placement, and content that teaches **how** to use akm without
leaking task-specific answers.

## Install

With akm already on PATH:

```bash
akm bundle add github:itlackey/akm-stash
akm index
```

Then verify:

```bash
akm show skills/akm-quickstart
akm show knowledge/akm-cli-reference
akm search "proposal queue" --type knowledge
```

No akm yet? Install the CLI first — see
[akm-quickstart](./skills/akm-quickstart/SKILL.md) or the
[akm repo](https://github.com/itlackey/akm).

## Recommended entry points for agents

- **Brand-new environment** → run the `onboard-agent` task.
- **Need to find the right stash or asset** → dispatch the `akm-librarian`
  subagent or use the `akm-find` command.
- **Publishing a new stash** → run the `publish-stash` task plus the
  `publish-akm-stash` skill.
- **Improving existing assets or distilling repeated feedback** → run
  `akm improve <ref>`.
- **Draining the pending proposal backlog** → run `akm proposal drain --dry-run`
  to preview (a bare drain only stages; add `--promote --yes` to accept). The
  `default` improve strategy already runs the same drain as a pre-pass inside
  `akm improve`. For case-by-case judgment on individual drafts, use `akm
  proposal show <id>` / `akm proposal diff <id>` then `akm proposal
  accept|reject`. See `knowledge/akm-improve-and-extract`.
- **Harvesting knowledge from session logs** → run `akm proposal extract
  --auto` then review proposals with `akm proposal list`. See
  `knowledge/akm-improve-and-extract`.
- **Scheduling recurring stash maintenance or harvest runs** → model a task
  file after the examples in `tasks/`, add it with `akm import <file> --type
  task`, and schedule it with `akm task enable <ref>`.
- **After upgrading akm** → run the `akm-migrate` skill to replace removed improve strategies, move deprecated commands to their replacements, and reconcile scheduler rows.
- **Need a goal-specific toolkit from all available assets** → run the `akm-curate-stash` skill: describe your goal, and the agent searches every source and registry, compares overlapping assets, and imports the winners into a reviewable directory you can add as a stash or import piecemeal.
- **Improve runs are slow, silent, or producing odd numbers** → run the
  `akm-health` skill to turn `akm doctor` output into a readable report and
  work through the troubleshooting tree.
- **Memories have drifted or grown messy** → run the `akm-dream` skill for a
  staged, reviewable consolidation and prune pass.
- **Exploring ways to improve a specific AKM process** → use
  [`akm-autoresearch`](./skills/akm-autoresearch/SKILL.md) for developer-directed
  experiments with akm-eval and a reproducible research handoff.
- **Implementing and delivering a defined AKM or akm-eval change** → use
  [`akm-measured-improvement`](./skills/akm-measured-improvement/SKILL.md) for
  process-specific measurement, bounded implementation tuning, and acceptance
  plus applicable rollout as the definition of done. Valid research evidence
  carries forward.

## Conventions

- Onboarding assets target **akm-cli 0.10.261130** and teach the current
  commands (`akm run`, `akm doctor`, `akm import --asset-ref`); commands
  Deprecated in 0.10 are named only as things to move off. The research and
  measured-improvement skills apply across AKM processes and verify commands
  against selected checkouts.
- Descriptions are written as trigger sentences so host agents can decide when
  to load an asset without reading the whole body.
- For reusable guidance, teach **how**, not one benchmark answer or verifier
  payload.
- Prefer inline metadata in frontmatter or file-local headers; do not rely on
  `.stash.json` sidecars.

## Feedback

If an asset helps (or misses) during a real task, record it so future proposal
and lesson workflows have useful input:

```bash
akm feedback <ref> --positive
akm feedback <ref> --negative --reason "why it missed"
```

## License

MPL-2.0 — see [LICENSE](./LICENSE).

MPL-2.0 is file-scoped copyleft: you can include individual assets in
proprietary stashes or workflows, but modifications to a covered file must
stay under MPL-2.0. This keeps the stash open while letting downstream users
layer private assets alongside it.
