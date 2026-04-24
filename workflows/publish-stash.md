---
name: publish-stash
description: End-to-end workflow to take a local directory of agent assets and publish it as a discoverable akm stash, including npm/GitHub metadata, manual registry entry, and post-release verification.
steps:
  - id: prepare-layout
    title: Prepare canonical stash layout
  - id: write-metadata
    title: Write asset frontmatter and stash manifest
    requires: [prepare-layout]
  - id: choose-path
    title: Choose publishing path (npm / GitHub topic / manual PR)
    requires: [write-metadata]
  - id: release
    title: Tag, release, and wait for registry rebuild
    requires: [choose-path]
  - id: verify
    title: Verify installability from a clean machine
    requires: [release]
---

# Publish an akm Stash

This workflow assumes you already have a directory of assets that works when
loaded manually. Its goal is to make that directory **installable by any akm
user via `akm add`** and **discoverable via `akm search`**.

## Step 1 — Prepare canonical stash layout

Move files into the conventional subdirectories so the akm indexer rates them
with high confidence. Keep only the directories you actually need.

```
my-stash/
├── README.md
├── LICENSE
├── scripts/
├── skills/<name>/SKILL.md
├── commands/
├── agents/
├── knowledge/
├── workflows/
├── wikis/<name>/
└── vaults/*.env.example     # never commit real secrets
```

**Done when:** `akm add ./my-stash --name local-test && akm search <stash-term>`
returns each of your assets.

## Step 2 — Write asset frontmatter and stash manifest

For every skill, agent, command, and workflow, add YAML frontmatter with a
`name` and a *trigger-sentence* `description`. See
`knowledge:akm-stash-structure` for templates.

Optional but recommended: a root `akm.json` (preferred) or `stash.json`
manifest with `name`, `description`, `tags`, and `assetTypes`. The legacy
`kit.json` name is still accepted.

**Done when:** `akm show <ref>` prints meaningful metadata for each asset.

## Step 3 — Choose publishing path

Pick one (or more — they compose):

- **npm keyword path.** Add `"keywords": ["akm-stash"]` to `package.json` and
  `npm publish --access public`.
- **GitHub topic path.** Push to a public repo and add the `akm-stash` topic
  on the repo's About panel.
- **Manual-entry path.** Open a PR to
  [`itlackey/akm-registry`](https://github.com/itlackey/akm-registry) adding
  an object to `manual-entries.json`. Required fields: `id`, `name`, `ref`,
  `source`. Use this to override auto-discovered metadata or list non-npm /
  non-GitHub stashes.

> Legacy `akm-kit` and `agentikit` keywords/topics are still honored by the
> registry auto-discovery during the migration window.

**Done when:** the publish path's prerequisites (package published, topic
added, or PR merged) are in place.

## Step 4 — Tag, release, and wait for registry rebuild

Tag a release so consumers can pin:

```bash
git tag v0.1.0 && git push --tags
# or for npm:
npm version patch && npm publish
```

The official registry rebuilds its index on a schedule. For a faster path,
the manual PR from Step 3 takes effect as soon as it merges.

**Done when:** `akm registry search <your-stash>` returns your stash from a
machine that doesn't have your local source registered.

## Step 5 — Verify installability from a clean machine

On a fresh working stash (or a throwaway container):

```bash
akm setup
akm registry search <your-stash>
akm add <your-ref>          # e.g. github:your-org/your-stash or npm:@your-org/your-stash
akm index
akm show <a-ref-from-your-stash>
akm run <a-runnable-ref>    # if applicable
```

**Done when:** every advertised asset is retrievable and (for runnable
assets) executes without undocumented environment requirements.

## Post-launch checklist

- [ ] README oriented to agents (trigger sentences, not marketing).
- [ ] License chosen and present at the repo root.
- [ ] `.env.example` (not real secrets) in `vaults/`.
- [ ] At least one consumer outside your org has `akm add`-ed the stash.
- [ ] Feedback channel linked (issues, discussions, etc.).
