---
description: Use when an agent is authoring or reorganizing a bundle and needs the 0.9.6 directory, command, workflow, task, and lesson conventions.
tags: [akm, stash, structure]
quality: curated
updated: 2026-08-31
---

# AKM Bundle Structure

> **Version target:** akm-cli 0.9.6

akm classifies assets by **file extension and content**, not by directory name.
Conventional directories are still the best default because they improve search
confidence, readability, and benchmark-fixture reuse.

## Canonical layout

```text
my-stash/
├── README.md
├── LICENSE
├── akm.json                         # optional bundle-level metadata
├── scripts/
├── skills/<name>/SKILL.md
├── commands/*.md
├── agents/*.md
├── knowledge/*.md
├── instructions/*.md
├── workflows/*.md
├── memories/*.md
├── lessons/*.md
├── env/*.env
├── secrets/
├── tasks/*.yml
├── sessions/<harness>/*.md
└── facts/*.md
```

Use only the directories you need, but prefer this layout when you can. An
LLM wiki (`schema.md` + `pages/`) is a separate first-class **bundle
format**, not a directory inside an AKM-native stash — see the LLM Wiki note
under Workflows below.

## Asset file conventions

### Skills

```markdown
---
name: review-pr
description: Use when reviewing a pull request and you want a repeatable checklist for correctness, security, and follow-up tests.
---

# Review a Pull Request
```

The `description` is a trigger sentence. Write “Use when …”, not a title.

### Commands

akm 0.9.6 command assets follow the OpenCode-style prompt-template convention:

```markdown
---
description: Use when you want a compact shortlist of akm assets for a task.
---

Need: $1
Optional type filter: $2
```

Use `$ARGUMENTS` for the full argument string or `$1` / `$2` / `$3` for
positional arguments. Favor plain language instructions over clever templating.

### Agents

```markdown
---
description: akm specialist for reviewing stash quality
model: claude-sonnet-4.6
tools: [Read, Grep, Glob, Bash]
---
```

`model` and `tools` are hints for the host agent, not strict requirements.

### Workflows

akm 0.9.6 workflows are unified markdown with the orchestration graph in
frontmatter and step instructions in the body — the retired 0.8.0
`## Step: <title>` / `Step ID:` / `### Instructions` / `### Completion
Criteria` heading contract fails `akm lint --type workflows` with
`invalid-workflow-structure` and is skipped by `akm index`:

```markdown
---
type: workflow
description: Cut and verify a release
tags: [release]
params:
  version: { type: string, description: Version to publish }
steps:
  - id: validate-inputs
---

# Publish a release

## validate-inputs

Check the version, changelog, and release target, using the `version`
parameter.

### gate

- Version is confirmed.
- Release notes exist.
```

Every `## <step-id>` heading must match a declared `steps[].id` exactly. An
optional `### gate` sub-heading carries the step's completion rubric —
evaluated fail-closed by `workflow.judgeEngine` when non-empty; omitted or
empty skips validation. Run `akm workflow create <name> --print` for a
starter template, and `akm lint --type workflows` to validate before
running. See `knowledge/akm-cli-reference` for the full contract.

### LLM Wiki bundles

A Karpathy-style LLM wiki (`schema.md` rulebook + agent-authored `pages/`)
is a first-class **bundle format** in 0.9.6, not an AKM-native asset type or
directory. Install one with `akm bundle add <source>` like any other
source; akm's LLM Wiki adapter recognizes it automatically and its pages
resolve to `bundle//pages/<slug>` refs. There is no `akm wiki` command
family and no `wiki:` asset type.

### Lessons

Lessons are first-class assets stored under `lessons/`:

```markdown
---
description: Use when repeated feedback shows an agent misses docker healthcheck syntax.
when_to_use: A task repeatedly fails because the agent forgets healthcheck patterns.
quality: curated
---

# Docker healthcheck lesson
```

`quality` is commonly `generated`, `curated`, or `proposed`.

### Tasks

Task assets are first-class assets stored under `tasks/` as pure YAML
(`tasks/<id>.yml`) — no markdown frontmatter delimiters or body section.
Only **task source v4** should be authored: the file must begin with `version: 4`.
AKM 0.9.6 can read a deterministically convertible v2/v3 file through an
in-memory v4 shim, but warns without rewriting it. Convert it durably with
`akm migrate apply --dry-run` followed by `akm migrate apply`.

```yaml
# tasks/<id>.yml
version: 4
name: nightly-improve
description: "Use when a nightly AKM extract + improve pass should run without hand-built cron notes."
tags: [scheduled, improve, extract]
# Pick exactly one of `uses:` or `run:`.
uses: akm/command
with:
  content: Review the bundle and queue improvement proposals only.
schedule:
  - cron: "0 9 * * *"
    enabled: true
timeout: 30m
```

Pick exactly one of `uses:` or `run:`. `uses:` accepts `akm/command` or a
canonical `commands/`, `scripts/`, or `workflows/` ref; `with:` is legal only
with `akm/command`. Scheduling is optional; enablement belongs to an individual
`schedule:` entry, not the document. Manage tasks with
`akm task add|run|explain|history|sync|doctor|prune` (singular `task`, not `tasks`) —
there is no task list/show/remove/enable/disable/init command. Use `akm search
--type task` / `akm show tasks/<id>` to inspect a locally indexed task, and edit
the YAML plus `akm task sync` to reconcile schedules. Use `akm task sync
--dry-run` for a zero-write preview; use `akm task prune` to preview unreachable
scheduler entries whose descriptor or owning bundle no longer resolves.

### Metadata guidance

Prefer inline metadata in frontmatter and file-local headers. Older curated
bundles may still carry `.stash.json` during migration, but 0.9.6-facing
assets should not rely on it as the primary authoring contract.

## Asset quality rules

These are especially important for reusable official stashes:

- **Teach HOW, not WHAT.** Document syntax, schemas, patterns, and decision
  rules. Do not hard-code task answers or verifier outputs into assets.
- **Prefer small reusable assets.** A focused skill or lesson is easier for
  agents to retrieve and apply than a giant omnibus document.
- **Use trigger-sentence descriptions.** Agents often decide what to load based
  only on description text.
- **Keep examples realistic but general.** Show one pattern that transfers to
  many tasks.
- **Add stash-level metadata.** `akm.json` and `README.md` improve discovery,
  especially for third-party consumption.

## Publishing metadata

At minimum, choose one of:

- `package.json` with `"keywords": ["akm-stash"]`
- GitHub topic `akm-stash`
- manual registry entry / override in `itlackey/akm-registry`

Version your stash with tags or package releases so users can pin known-good
content.
