---
name: publish-akm-stash
description: Use when the user wants to publish a new akm bundle so it appears in the official registry and remains useful to agents using akm-cli 0.9.6.
updated: 2026-08-31
---

# Publish an AKM Bundle

This skill walks an agent through turning a directory of assets into a
searchable, installable bundle.

## 1. Lay out the stash

Use conventional directories when possible (add `instructions/`, `facts/`, and
`sessions/` when the bundle needs those asset types):

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
  tasks/
  memories/
  env/
  secrets/
```

An LLM wiki (`schema.md` + `pages/`) publishes as its own bundle, not a
`wikis/` directory inside this layout — there is no dedicated `wiki` asset
type in 0.9.6.

## 2. Write search-friendly metadata

- Give every skill, command, agent, workflow, and lesson a trigger-sentence
  `description`.
- Add a root `akm.json` when you want stash-level metadata.
- For benchmark or fixture content, teach **how** to do the work, not the exact
  answer to a single verifier.

Prefer inline metadata in frontmatter and file-local comments. Treat
`.stash.json` as legacy compatibility content rather than the default authoring
path on 0.9.6.

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
akm search <your-stash> --from registry
akm bundle add <your-ref>
akm index
akm show <ref-from-your-stash>
```

## 5. Release hygiene

- Tag releases so users can pin a known-good version.
- Keep README copy oriented to agents, not marketing.
- Ship `.env.example` files instead of real secrets.
- Review proposal-generated changes before release; do not publish draft
  `quality: "proposed"` content as if it were final.
- If you ship `workflows/`, verify each one uses the 0.9.6 frontmatter
  `steps:` contract (`akm lint --type workflows` must be clean) — the retired
  0.8.0 `## Step: <title>` / `Step ID:` heading format fails to index.
- If you ship `tasks/`, verify they use strict task source v4
  (`tasks/<id>.yml`, `version: 4`) with exactly one of `uses:` or `run:`.
  Scheduling is optional, and `enabled` belongs to each `schedule:` binding.
  `with:` is only valid for `uses: akm/command`. Run `akm migrate apply
  --dry-run` for any v2/v3 source, then `akm lint --type tasks`, `akm task
  explain <ref>`, and `akm task sync` before release.
