---
name: publish-akm-stash
description: Use when the user wants to publish a new akm stash so it appears in the official registry — covers repo layout, required metadata, the three listing paths (npm keyword, GitHub topic, manual PR), and release verification.
---

# Publish an akm Stash

This skill walks an agent through turning a directory of assets into a
discoverable stash listed by the official akm registry.

## When to use

- "Make this folder of skills into an akm stash"
- "Publish my stash to the akm registry"
- "Add our repo to the akm index"

## 1. Lay out the stash

akm classifies assets by file extension and content, not by directory name,
but conventional directories sharply improve indexing confidence. Use them:

```
my-stash/
  README.md
  package.json            # optional, required only if publishing to npm
  scripts/                # *.sh *.ts *.py etc.
  skills/<name>/SKILL.md  # each skill in its own directory
  commands/*.md           # prompt templates
  agents/*.md             # system prompts with frontmatter
  knowledge/*.md          # reference docs
  workflows/*.md          # multi-step procedures (v0.5.0+)
  wikis/<name>/*.md       # multi-wiki knowledge bases (v0.5.0+)
  vaults/*.env            # secret env files (v0.5.0+, never commit real secrets)
```

Only include the directories you actually use — empty directories are fine
but add noise.

## 2. Write asset metadata

Every skill, agent, and command should begin with YAML frontmatter:

```markdown
---
name: deploy-to-fly
description: Use when deploying a Node service to Fly.io — runs flyctl, tails logs, and verifies health.
---

# Deploy to Fly.io
...
```

The `description` is what agents read to decide whether to invoke the asset,
so write it as a *trigger sentence*, not a title.

## 3. Pick a publish path

### Path A — npm package (keyword discovery)

In `package.json`:

```json
{
  "name": "@your-org/your-stash",
  "version": "0.1.0",
  "description": "Deployment skills and workflows",
  "keywords": ["akm-stash"],
  "files": ["skills", "commands", "agents", "knowledge", "workflows", "README.md"]
}
```

Publish: `npm publish --access public`. The official registry will pick it up
on its next `akm registry build-index` run.

### Path B — GitHub topic (repo discovery)

On the repo's **About** panel, add the `akm-stash` topic.
Make sure the repo has a clear README and a license. No other metadata is
required.

### Path C — Manual entry (curated addition or override)

Open a PR against [itlackey/akm-registry](https://github.com/itlackey/akm-registry)
adding an object to `manual-entries.json`:

```json
{
  "id": "github:your-org/your-stash",
  "name": "Your Stash",
  "ref": "your-org/your-stash",
  "source": "github",
  "description": "One-line, agent-facing description",
  "homepage": "https://github.com/your-org/your-stash",
  "tags": ["deploy", "fly"],
  "assetTypes": ["skill", "workflow"],
  "author": "your-org",
  "license": "MIT",
  "curated": true
}
```

Required fields: `id`, `name`, `ref`, `source`. Use Path C when you need to
override auto-discovered metadata or list assets that aren't on npm/GitHub.

## 4. Verify listing

After the registry rebuilds:

```bash
akm registry search <your-stash-name>
akm add <your-ref>
akm show <a-ref-from-your-stash>
```

## 5. Release hygiene

- Pin versions via git tags (`v0.1.0`) or npm semver so consumers can pin.
- Keep `README.md` oriented to agents: describe asset triggers, not marketing.
- For breaking changes, bump the major version and note migration in the
  release notes — the registry does not enforce semver, consumers do.
- Do **not** commit real secrets into `vaults/` — ship `.env.example` files
  and document the keys consumers must provide.
