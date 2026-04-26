# akm-stash

The **official akm stash** — a curated collection of akm assets that teach
coding agents (Claude Code, OpenCode, Codex, Cursor, Copilot, Qwen, etc.)
how to use [akm](https://github.com/itlackey/akm) effectively.

If akm is the package manager for agent assets, this is the
"getting started" stash: install it once and any akm-aware agent gains the
skills, commands, knowledge, and workflows it needs to discover, install,
publish, and reason about other stashes.

## What's inside

| Directory | Contents |
|---|---|
| [`agents/`](./agents) | Subagents that specialize in akm tasks (`akm-librarian`). |
| [`commands/`](./commands) | Prompt templates for common akm operations (`akm-find`, `akm-review-stash`). |
| [`knowledge/`](./knowledge) | Reference documents an agent can cite: CLI reference, overview, registry schema, stash structure. |
| [`skills/`](./skills) | Progressive-disclosure skills for bootstrapping (`akm-quickstart`), installing (`install-akm-stash`), and publishing (`publish-akm-stash`). |
| [`workflows/`](./workflows) | Multi-step playbooks: `onboard-agent`, `publish-stash`. |

Every asset is authored to the akm spec — frontmatter with `name` and a
trigger-style `description`, canonical directory placement, and content
written for agent consumption.

## Install

With akm already on PATH:

```bash
akm add github:itlackey/akm-stash
akm index
```

Then verify:

```bash
akm search "akm"          # stash assets should appear
akm show skill:akm-quickstart
```

No akm yet? Install the CLI first — see
[akm-quickstart](./skills/akm-quickstart/SKILL.md) or the
[akm repo](https://github.com/itlackey/akm).

## Recommended entry points for agents

- **Brand-new environment** → run the `onboard-agent` workflow.
- **"Is there a stash for X?"** → dispatch the `akm-librarian` subagent or
  use the `akm-find` command.
- **Publishing your own stash** → follow the `publish-stash` workflow plus
  the `publish-akm-stash` skill.
- **Vetting a third-party stash before install** → use the
  `akm-review-stash` command.

## Conventions

- Assets use the canonical akm layout (see
  [`knowledge/akm-stash-structure.md`](./knowledge/akm-stash-structure.md)).
- Descriptions are written as trigger sentences so host agents can decide
  when to load the asset without reading the body.
- Knowledge docs are pinned to a specific akm version in their header so
  out-of-date references are easy to spot.

## Feedback

If an asset helps (or misses) during a real task, record it so future
sessions inherit the signal:

```bash
akm feedback <ref> --positive
akm feedback <ref> --negative --note "why it missed"
```

## License

See [LICENSE](./LICENSE).
