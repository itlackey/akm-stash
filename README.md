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
| [`knowledge/`](./knowledge) | Reference docs for the CLI, stash structure, the 0.8 improvement flow, task assets, and registry schema. |
| [`skills/`](./skills) | Progressive-disclosure skills for bootstrapping, installing, publishing, reviewing proposals, harvesting logs, and improving assets. |
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
- **Harvesting reusable lessons from session logs** → use the
  `analyze-session-logs` skill, the `akm-harvest-session-knowledge` command,
  and the `harvest-session-knowledge` workflow.
- **Scheduling recurring stash maintenance or harvest runs** → use `akm tasks`
  and model the task file after `knowledge:akm-stash-structure`.

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

See [LICENSE](./LICENSE).
