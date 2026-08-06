---
description: Use when an agent is authoring or reorganizing a stash and needs the 0.9.0 directory, command, workflow, task, and lesson conventions.
tags: [akm, stash, structure]
quality: curated
updated: 2026-08-04
---

# akm Stash Structure

> **Version target:** akm-cli 0.9.0

akm classifies assets by **file extension and content**, not by directory name.
Conventional directories are still the best default because they improve search
confidence, readability, and benchmark-fixture reuse.

## Canonical layout

```text
my-stash/
├── README.md
├── LICENSE
├── akm.json                         # optional stash-level metadata
├── scripts/
├── skills/<name>/SKILL.md
├── commands/*.md
├── agents/*.md
├── knowledge/*.md
├── workflows/*.md
├── memories/*.md
├── lessons/*.md
├── env/*.env
├── secrets/
└── tasks/*.yml
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

akm 0.9.0 command assets follow the OpenCode-style prompt-template convention:

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

akm 0.9.0 workflows are unified markdown with the orchestration graph in
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
is a first-class **bundle format** in 0.9.0, not an AKM-native asset type or
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
(`tasks/<id>.yml`) — no markdown frontmatter delimiters, no body section.
Only **version-2** task YAML is discovered: the file must begin with
`version: 2`. A v1 file (including one with no `version` key) is diagnosed
by `sync`/`doctor` but is never rewritten or executed.

```yaml
# tasks/<id>.yml
version: 2
schedule: "0 9 * * *"
enabled: true
description: "Use when a nightly AKM extract + improve pass should run without hand-built cron notes."
tags: [scheduled, improve, extract]
# Pick exactly one of `workflow:`, `prompt:`, or `command:`:
workflow: workflows/evolve-assets
# OR an inline agent prompt:
# prompt: |
#   multi-line prompt body
# OR a deterministic shell command:
# command: "akm improve --task \"...\""
```

Pick exactly one of `workflow:`, `prompt:`, or `command:`. Manage tasks with
`akm task add|run|history|sync|doctor` (singular `task`, not `tasks`) — there
is no `task list`/`show`/`remove`/`enable`/`disable`/`init`. Use `akm search
--type task` / `akm show tasks/<id>` to inspect a task; edit the YAML's
`enabled:` field plus `akm task sync` to enable, disable, or (after deleting
the file) remove one.

### Metadata guidance

Prefer inline metadata in frontmatter and file-local headers. Older curated
stashes may still carry `.stash.json` during migration, but 0.9.0-facing
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
