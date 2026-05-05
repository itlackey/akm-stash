# akm-stash

The **official akm stash** — a curated collection of assets that teach coding
agents how to use [akm](https://github.com/itlackey/akm) effectively on
**akm-cli v0.7.0**.

If akm is the package manager for agent assets, this is the starter stash:
install it once and an akm-aware agent gains practical skills, commands,
knowledge, and workflows for discovery, installation, publishing,
self-improvement, and benchmark-fixture authoring.

## What's inside

| Directory | Contents |
|---|---|
| [`agents/`](./agents) | Subagents that specialize in akm tasks (`akm-librarian`). |
| [`commands/`](./commands) | Prompt templates for discovery, stash review, and proposal review. |
| [`knowledge/`](./knowledge) | Reference docs for the CLI, stash structure, proposal/lesson flow, registry schema, and benchmark fixtures. |
| [`skills/`](./skills) | Progressive-disclosure skills for bootstrapping, installing, publishing, reviewing proposals, and distilling feedback into lessons. |
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
- **Improving assets with v0.7.0 proposal tooling** → use the
  `manage-akm-proposals` and `distill-feedback-into-lessons` skills.
- **Harvesting reusable lessons from session logs** → use the
  `scan-session-logs` and `harvest-session-knowledge` skills plus the
  `harvest-session-knowledge` workflow.
- **Authoring benchmark fixtures or test stashes** → read
  `knowledge:akm-benchmark-fixtures` before writing assets.

## Conventions

- Assets target **akm-cli v0.7.0** and call out version-sensitive behavior.
- Descriptions are written as trigger sentences so host agents can decide when
  to load an asset without reading the whole body.
- Benchmark-oriented guidance follows the v0.7.0 fixture rule: teach **how**,
  never **what**.
- Directory-level `.stash.json` files provide curated metadata to improve
  search quality and agent-facing summaries.

## Feedback

If an asset helps (or misses) during a real task, record it so future proposal
and lesson workflows have useful input:

```bash
akm feedback <ref> --positive
akm feedback <ref> --negative --reason "why it missed"
```

## License

See [LICENSE](./LICENSE).
