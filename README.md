# akm-stash

The official akm stash: a curated collection of assets that teach coding
agents how to use [akm](https://github.com/itlackey/akm) effectively on
**akm-cli v0.8.0**.

If akm is the package manager for agent assets, this is the starter stash:
install it once and an akm-aware agent gains practical skills, commands,
knowledge, and workflows for discovery, installation, publishing,
self-improvement, proposal review, and scheduled task authoring.

## What's inside

| Directory | Contents |
|---|---|
| [`agents/`](./agents) | Subagents that specialize in akm tasks (`akm-librarian`). |
| [`commands/`](./commands) | Prompt templates for discovery, stash review, and proposal review. |
| [`knowledge/`](./knowledge) | Reference docs for the CLI, stash structure, the improve+extract pipeline, proposal/lesson lifecycle, and registry schema. |
| [`skills/`](./skills) | Progressive-disclosure skills for bootstrapping, installing, publishing, reviewing proposals, and memory consolidation. |
| [`tasks/`](./tasks) | Scheduled prompt assets for recurring improve and proposal-review checks. |
| [`workflows/`](./workflows) | Runnable playbooks for onboarding, publishing, and evolving assets. |

Every asset is authored for agent consumption: trigger-sentence descriptions,
canonical placement, and content that teaches **how** to use akm without
leaking task-specific answers.

## Install

With akm already on PATH:

```bash
akm add github:itlackey/akm-stash
akm index
```

Then verify:

```bash
akm show skill:akm-quickstart
akm show knowledge:akm-cli-reference
akm search "proposal queue" --type knowledge
```

No akm yet? Install the CLI first — see
[akm-quickstart](./skills/akm-quickstart/SKILL.md) or the
[akm repo](https://github.com/itlackey/akm).

## Recommended entry points for agents

- **Brand-new environment** → run the `onboard-agent` workflow.
- **Need to find the right stash or asset** → dispatch the `akm-librarian`
  subagent or use the `akm-find` command.
- **Publishing a new stash** → follow the `publish-stash` workflow plus the
  `publish-akm-stash` skill.
- **Improving existing assets or distilling repeated feedback** → use
  `akm improve <ref>` plus the `manage-akm-proposals` skill.
- **Harvesting knowledge from session logs** → run `akm extract --auto` then
  review proposals with `akm proposal list`. See `knowledge:akm-improve-and-extract`.
- **Scheduling recurring stash maintenance or harvest runs** → use `akm tasks`
  and model the task file after the examples in `tasks/`.
- **After upgrading akm to a new version** → run the `akm-migrate` skill to read migration notes, apply config and storage migrations, update stash assets for deprecated commands, and verify system health.
- **Need a goal-specific toolkit from all available assets** → run the `akm-curate-stash` skill: describe your goal, and the agent searches every source and registry, compares overlapping assets, and clones the winners into a reviewable directory you can add as a stash or import piecemeal.

## Conventions

- Assets target **akm-cli v0.8.0** and call out version-sensitive behavior.
- Descriptions are written as trigger sentences so host agents can decide when
  to load an asset without reading the whole body.
- For reusable guidance, teach **how**, not one benchmark answer or verifier
  payload.
- Prefer inline metadata in frontmatter or file-local headers; do not rely on
  deprecated `.stash.json` sidecars for new authoring.

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
