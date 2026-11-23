---
description: Use when an agent is authoring or reorganizing a bundle and needs the 0.10.261130 directory, command, task, and lesson conventions.
tags: [akm, stash, structure]
quality: curated
updated: 2026-11-23
---

# AKM Bundle Structure

> **Version target:** akm-cli 0.10.261130

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
├── rules/*.md
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
below.

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

Command assets are prompt templates. akm's portable placeholder is the literal
`$ARGUMENTS`; `akm run commands/<name> --arguments "<text>"` substitutes it:

```markdown
---
description: Use when you want a compact shortlist of akm assets for a task.
---

Need: $ARGUMENTS
```

`$ARGUMENTS` is the full argument string. akm does not expand positional
`$1` / `$2` or `$ARGUMENTS[N]`; leave them out of commands meant for `akm run`
and describe the argument shape in plain words. Favor plain language
instructions over clever templating.

### Agents

```markdown
---
description: akm specialist for reviewing stash quality
model: claude-sonnet-4.6
tools: [Read, Grep, Glob, Bash]
---
```

`model` and `tools` are hints for the host agent, not strict requirements.

### Workflows (Deprecated)

Workflow assets (`workflows/*.md`, with `params` and `steps` in frontmatter)
still work in 0.10.x and are removed in 0.11, where tasks with ordered steps
replace them. Do not author new ones: write a task instead. `akm migrate apply
workflows/<name>.md` writes `tasks/<name>.yml` from an existing workflow file
and leaves the original in place.

### LLM Wiki bundles

A Karpathy-style LLM wiki (`schema.md` rulebook + agent-authored `pages/`)
is a **bundle format**, not an AKM-native asset type or directory. Install one with `akm bundle add <source>` like any other
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

Task assets are stored under `tasks/` as pure YAML (`tasks/<id>.yml`): no
markdown frontmatter delimiters or body section. Author **task source v5**
(Experimental in 0.10; 0.11 refuses `version: 4`). A task is a list of akm
commands run in order:

```yaml
# tasks/<id>.yml
version: 5-beta.1
description: "Use when a nightly extract + improve pass should run without hand-built cron notes."
tags: [scheduled, improve, extract]
timeout: 30m
schedule:
  - cron: "0 9 * * *"
steps:
  - name: extract
    exec: akm proposal extract --auto --since 24h
  - name: improve
    exec: akm improve --no-sync --no-push
```

A step is exactly one of `run: <ref>` (`akm run`), `exec: <command>` (`akm
exec`), or `prompt: <text>` (a prompt sent to an agent), plus that command's
options (`env`, `secret`, `cwd`, `timeout`, `max-retries`, `inherit`, and
`harness`, `connection`, `model` for agent steps). `inputs:` declares the
task's flags and `${name}` fills an input or an earlier step's result into
`prompt:`, `arguments:` or `args:`. A task that is one command has no `steps:`.
`lock: true` allows one run at a time.

Task source v4 (`version: 4`, with one `uses:` or `run:` target) is unchanged in
0.10.x; `akm migrate apply <task-file>` converts it to v5.

Add a task with `akm import <file> --type task`, schedule it with `akm task
enable <ref>`, and run it with `akm run <bundle>//tasks/<id>`. Inspect it with
`akm search --type task` / `akm show tasks/<id>`, validate it with `akm lint
<file> --type tasks`, and preview it with `akm doctor explain <ref>`. Reconcile
schedules with `akm doctor scheduler sync --dry-run` (add `--prune` to preview
orphaned entries). There is no task list/show/remove command.

### Metadata guidance

Prefer inline metadata in frontmatter and file-local headers. Do not rely on `.stash.json`
sidecars.

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
