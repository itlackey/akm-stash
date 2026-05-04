---
description: Bootstrap a coding agent so it can discover, install, search, and improve akm assets in the current environment.
tags: [onboarding, akm]
params:
  host: Host agent or tool being onboarded
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
`lessons/`.

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
Install this repo as a source and reindex.

```bash
akm add github:itlackey/akm-stash
akm index
akm show skill:akm-quickstart
akm show knowledge:akm-cli-reference
```

### Completion Criteria
- `skill:akm-quickstart` is retrievable.
- `knowledge:akm-cli-reference` is retrievable.

## Step: Learn the v0.7.0 asset lifecycle
Step ID: learn-lifecycle

### Instructions
Review how v0.7.0 handles feedback, lessons, and proposals. Inspect
`knowledge:akm-proposals-and-lessons`, then verify the proposal queue commands
exist with `akm proposal list`.

### Completion Criteria
- The operator understands `feedback`, `distill`, and `proposal` basics.
- `akm proposal list` runs successfully.

## Step: Smoke test discovery
Step ID: smoke-test

### Instructions
Run a quick search-and-show flow:

```bash
akm curate "code review"
akm search "proposal queue" --type knowledge --source both
akm show knowledge:akm-proposals-and-lessons --detail=agent
```

### Completion Criteria
- Search returns results.
- `akm show` returns readable content.
