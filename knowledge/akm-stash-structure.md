---
description: Use when an agent is authoring or reorganizing a stash and needs the v0.8.0 directory, command, workflow, task, and lesson conventions.
tags: [akm, stash, structure]
quality: curated
updated: 2026-05-23
---

# akm Stash Structure

> **Version target:** akm-cli v0.8.0

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
├── vaults/*.env.example
├── wikis/<name>/*.md
└── tasks/*.yml
```

Use only the directories you need, but prefer this layout when you can.

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

akm v0.8.0 command assets follow the OpenCode-style prompt-template convention:

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

akm v0.8.0 workflows are structured markdown, not frontmatter step arrays:

```markdown
---
description: Cut and verify a release
tags: [release]
params:
  version: Version to publish
---

# Workflow: Publish a release

## Step: Validate inputs
Step ID: validate-inputs

### Instructions
Check the version, changelog, and release target.

### Completion Criteria
- Version is confirmed.
- Release notes exist.
```

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

Task assets are first-class 0.8.0 assets stored under `tasks/` as YAML
(`tasks/<id>.yml`). The file is pure YAML — no markdown frontmatter
delimiters, no body section. Legacy `.md` task files are warned and
silently skipped by the loader.

```yaml
# tasks/<id>.yml
schedule: "0 9 * * *"
enabled: true
description: "Use when a daily AKM harvest should run without hand-built cron notes."
tags: [scheduled, harvest]
# Pick exactly one of `workflow:`, `prompt:`, or `command:`:
workflow: workflow:harvest-session-knowledge
# OR an inline agent prompt:
# prompt: |
#   multi-line prompt body
# OR a deterministic shell command:
# command: "akm improve --task \"...\""
```

Pick exactly one of `workflow:`, `prompt:`, or `command:`. Manage tasks with
`akm tasks add|list|show|run|history|enable|disable|remove|sync|doctor`.

### Metadata guidance

Prefer inline metadata in frontmatter and file-local headers. Older curated
stashes may still carry `.stash.json` during migration, but 0.8.0-facing assets
should not rely on it as the primary authoring contract.

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
