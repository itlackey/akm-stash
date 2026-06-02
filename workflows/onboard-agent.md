---
description: Bootstrap a coding agent so it can discover, install, search, and improve akm assets in the current environment.
tags: [onboarding, akm]
params:
  host: Host agent or tool being onboarded
updated: 2026-05-09
---

# Workflow: Onboard an agent onto akm

## Step: Install the CLI
Step ID: install-cli

### Instructions
Install `akm-cli` with the package manager already in use, or use the
standalone installer from the akm repository. Verify with `akm --version` and
`akm info`.

### Completion Criteria
- `akm --version` succeeds.
- `akm info` succeeds.

## Step: Initialize the working stash
Step ID: init-stash

### Instructions
Run `akm setup` for the guided flow, or `akm init && akm index` for a direct
setup. Confirm the stash contains the standard asset directories, including
`lessons/` and room for `tasks/` if you plan scheduled automation.

### Completion Criteria
- The working stash exists.
- `akm index` succeeds.

## Step: Wire the host agent integration
Step ID: wire-plugin

### Instructions
Install the appropriate plugin or prompt snippet for the host agent so it can
call `akm` from inside a task.

### Completion Criteria
- The host agent can execute an `akm` command.

## Step: Load the official onboarding stash
Step ID: load-core-assets

### Instructions
Install the official akm community stash as a source and reindex.

```bash
akm add github:itlackey/akm-stash
akm index
akm show skill:akm-quickstart
akm show knowledge:akm-cli-reference
```

### Completion Criteria
- `skill:akm-quickstart` is retrievable.
- `knowledge:akm-cli-reference` is retrievable.

## Step: Learn the v0.8.0 improvement lifecycle
Step ID: learn-lifecycle

### Instructions
Review how v0.8.0 handles feedback, improvement, lessons, and proposals.
Inspect `knowledge:akm-proposals-and-lessons` and `knowledge:akm-improve-and-extract`,
then verify the proposal queue commands exist with `akm proposal list`.

### Completion Criteria
- The operator understands `feedback`, `improve`, `extract`, `propose`, and proposal-review basics.
- `akm proposal list` runs successfully.

## Step: Configure session knowledge extraction
Step ID: configure-extract

### Instructions
Wire `akm extract` so the improvement loop has fresh signals from each session.
Determine which harness produces the agent's session files and do a dry-run pass:

```bash
# For Claude Code sessions:
akm extract --type claude-code --dry-run

# For OpenCode sessions:
akm extract --type opencode --dry-run

# Auto-detect all available harnesses:
akm extract --auto --dry-run
```

Review the candidate list. When satisfied, run without `--dry-run` to queue
proposals from the most recent sessions.

### Completion Criteria
- `akm extract --auto --dry-run` runs without errors.
- The operator knows which harness to use for their agent.

## Step: Smoke test discovery
Step ID: smoke-test

### Instructions
Run a quick search-and-show flow:

```bash
akm curate "code review"
akm search "proposal queue" --type knowledge --source both
akm show knowledge:akm-proposals-and-lessons --shape agent
akm health
```

### Completion Criteria
- Search returns results.
- `akm show` returns readable content.
- `akm health` reports no critical errors.
