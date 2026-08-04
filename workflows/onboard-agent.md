---
type: workflow
description: Bootstrap a coding agent so it can discover, install, search, and improve akm assets in the current environment.
tags: [onboarding, akm]
params:
  host: { type: string, description: Host agent or tool being onboarded }
updated: 2026-08-04
steps:
  - id: install-cli
  - id: init-bundle
    inputs: [steps.install-cli.output]
  - id: wire-plugin
  - id: load-core-assets
    inputs: [steps.init-bundle.output]
  - id: learn-lifecycle
    inputs: [steps.load-core-assets.output]
  - id: configure-extract
  - id: smoke-test
    inputs: [steps.load-core-assets.output, steps.configure-extract.output]
---

# Workflow: Onboard an agent onto akm

Bootstraps a coding agent (named by the `host` parameter) from zero to a
working akm installation with the official onboarding bundle loaded, so
later skills and workflows can run without setup errors.

## install-cli

Install `akm-cli` with the package manager already in use (`bun add -g
akm-cli`, `npm install -g akm-cli`, or `pnpm add -g akm-cli`), or use the
standalone installer from the akm repository. Verify with `akm --version` and
`akm info`.

Verify:
- `akm --version` succeeds.
- `akm info` succeeds.

## init-bundle

Run `akm setup` for the guided flow (config, bundle dir, providers,
registries, and initial index in one pass), or `akm bundle create && akm
index` for a direct, non-interactive scaffold. Confirm the bundle contains
the standard asset directories, including `lessons/` and room for `tasks/`
if you plan scheduled automation.

Verify:
- The working bundle exists.
- `akm index` succeeds.

## wire-plugin

Install the appropriate plugin or prompt snippet for the host agent named by
the `host` parameter so it can call `akm` from inside a task.

Verify:
- The host agent can execute an `akm` command.

## load-core-assets

Install the official akm onboarding bundle as a source and reindex, using
the bundle attached to this unit from the prior step.

```bash
akm bundle add github:itlackey/akm-stash
akm index
akm show skills/akm-quickstart
akm show knowledge/akm-cli-reference
```

Verify:
- `skills/akm-quickstart` is retrievable.
- `knowledge/akm-cli-reference` is retrievable.

## learn-lifecycle

Review how 0.9.0 handles feedback, improvement, and the proposal queue,
using the bundle assets attached to this unit as context. Inspect
`knowledge/akm-proposals-and-lessons` and `knowledge/akm-improve-and-extract`,
then verify the proposal queue commands exist with `akm proposal list`.

There is no separate `reflect`, `distill`, `propose`, or `extract` verb —
`akm improve <ref>` covers reflection and lesson distillation, `akm proposal
new` drafts a brand-new asset, and `akm proposal extract` harvests session
knowledge.

Verify:
- The operator understands `feedback`, `improve`, `proposal extract`,
  `proposal new`, and proposal-review basics.
- `akm proposal list` runs successfully.

## configure-extract

Wire `akm proposal extract` so the improvement loop has fresh signals from
each session. Determine which harness produces the agent's session files and
do a dry-run pass:

```bash
# For Claude Code sessions:
akm proposal extract --type claude-code --dry-run

# For OpenCode sessions:
akm proposal extract --type opencode --dry-run

# Auto-detect all available harnesses:
akm proposal extract --auto --dry-run
```

Review the candidate list. When satisfied, run without `--dry-run` to queue
proposals from the most recent sessions. For recurring harvesting, schedule
`akm proposal extract --auto` as a task instead of polling by hand — there is
no `--watch`/`--debounce-ms` daemon mode.

Verify:
- `akm proposal extract --auto --dry-run` runs without errors.
- The operator knows which harness to use for their agent.

## smoke-test

Run a quick search-and-show flow over the assets loaded in `load-core-assets`
and the extraction wiring from `configure-extract`:

```bash
akm curate "code review"
akm search "proposal queue" --type knowledge --from all
akm show knowledge/akm-proposals-and-lessons --shape agent
akm health
```

Verify:
- Search returns results.
- `akm show` returns readable content.
- `akm health` reports no critical errors.
