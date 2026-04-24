# akm Stash Structure

akm classifies assets by **file extension and content**, not by directory
name. You *can* put a shell script anywhere and it will still be recognized as
a `script`. But conventional directories sharply improve indexing confidence
and make stashes legible to humans.

## Canonical layout

```
my-stash/
├── README.md                         # orient humans and agents
├── LICENSE
├── package.json                      # optional (needed for npm publish)
├── scripts/                          # script:<filename>
│   ├── deploy.sh
│   └── backup.ts
├── skills/                           # skill:<dirname>
│   ├── review-pr/
│   │   └── SKILL.md
│   └── triage-issue/
│       └── SKILL.md
├── commands/                         # command:<filename-stem>
│   ├── summarize-diff.md
│   └── release-notes.md
├── agents/                           # agent:<filename-stem>
│   ├── code-reviewer.md
│   └── security-auditor.md
├── knowledge/                        # knowledge:<filename-stem>
│   ├── api-reference.md
│   └── runbook.md
├── workflows/                        # workflow:<filename-stem>   (v0.5.0+)
│   └── release.md
├── wikis/                            # wiki:<dirname>             (v0.5.0+)
│   └── engineering/
│       ├── index.md
│       └── adrs/0001-auth.md
└── vaults/                           # vault:<filename-stem>      (v0.5.0+)
    └── prod.env.example              # NEVER commit real secrets
```

Only include the directories you actually need. An empty `skills/` is fine
but adds no value.

## Asset file conventions

### SKILL.md (skill assets)

```markdown
---
name: review-pr
description: Use when reviewing a pull request — summarizes diff, checks for common bugs, and suggests test additions.
---

# Review a Pull Request

## When to use
...

## Steps
...
```

The `description` is a *trigger sentence* the dispatching agent reads. Write
it as "Use when …", not as a title.

### Agent files

```markdown
---
name: code-reviewer
description: Reviews TypeScript pull requests for correctness, security, and style.
model: claude-sonnet-4-6
tools: [Read, Grep, Glob, Bash]
---

You are a senior TypeScript reviewer...
```

### Command files (prompt templates)

```markdown
---
name: summarize-diff
description: Summarize a git diff for release notes.
args:
  - name: since
    description: Git ref to diff from
    default: HEAD~1
---

Summarize the following diff for release notes:

{{ git diff {{args.since}}..HEAD }}
```

Placeholders resolve from CLI flags, stdin, or inline shell expansions
depending on the host plugin.

### Workflow files (v0.5.0+)

```markdown
---
name: release
description: Cut, verify, and publish a release.
steps:
  - id: bump-version
    run: npm version minor
  - id: changelog
    command: summarize-diff
  - id: publish
    run: npm publish
    requires: [bump-version, changelog]
---

# Release workflow
...
```

State is tracked by `akm workflow start|next|complete`.


## Publishing metadata

Pick at least one:

**`package.json` (npm path)**
```json
{
  "name": "@your-org/my-stash",
  "keywords": ["akm-stash"],
  "files": ["skills", "commands", "agents", "knowledge", "workflows", "README.md"]
}
```

**GitHub topics (repo path)**
Add `akm-stash` to the repo's topics.

**Manual entry (curated path)**
Open a PR to `itlackey/akm-registry` updating `manual-entries.json`.

## Rules of thumb

- One concept per asset. Split a 600-line SKILL.md into two skills.
- Agent-facing copy, not marketing copy. Trigger sentences > taglines.
- Pin versions via git tags; consumers will pin via `ref#tag`.
- Keep secrets out of `vaults/`. Ship `.env.example` with key names only.
- Prefer workflows over mega-scripts once a procedure has more than ~3 steps
  or branching — stateful runs are easier for agents to resume.
