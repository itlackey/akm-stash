---
name: publish-akm-stash
description: Use when the user wants to publish a new akm stash so it appears in the official registry and remains useful to agents using akm-cli v0.7.0.
---

# Publish an akm Stash

This skill walks an agent through turning a directory of assets into a
searchable, installable stash.

## 1. Lay out the stash

Use conventional directories when possible:

```text
my-stash/
  README.md
  LICENSE
  akm.json
  scripts/
  skills/<name>/SKILL.md
  commands/
  agents/
  knowledge/
  workflows/
  lessons/
  memories/
  vaults/
  wikis/
```

## 2. Write search-friendly metadata

- Give every skill, command, agent, workflow, and lesson a trigger-sentence
  `description`.
- Add a root `akm.json` when you want stash-level metadata.
- Add `.stash.json` inside asset directories when filenames/frontmatter alone do
  not give enough search signal.
- For benchmark or fixture content, teach **how** to do the work, not the exact
  answer to a single verifier.

## 3. Pick a publish path

### npm package

Add `"akm-stash"` to `keywords` in `package.json` and publish.

### GitHub topic

Add the `akm-stash` topic and keep the repo public, documented, and licensed.

### Manual registry entry or override

Open a PR against [itlackey/akm-registry](https://github.com/itlackey/akm-registry)
when you need a curated manual entry or metadata override.

## 4. Verify listing and installability

```bash
akm registry search <your-stash>
akm add <your-ref>
akm index
akm show <ref-from-your-stash>
```

## 5. Release hygiene

- Tag releases so users can pin a known-good version.
- Keep README copy oriented to agents, not marketing.
- Ship `.env.example` files instead of real secrets.
- Review proposal-generated changes before release; do not publish draft
  `quality: "proposed"` content as if it were final.
