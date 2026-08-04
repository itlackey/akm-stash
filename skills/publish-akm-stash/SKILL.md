---
name: publish-akm-stash
description: Use when the user wants to publish a new akm stash so it appears in the official registry and remains useful to agents using akm-cli 0.9.0.
updated: 2026-08-04
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
  tasks/
  memories/
  env/
  secrets/
```

An LLM wiki (`schema.md` + `pages/`) publishes as its own bundle, not a
`wikis/` directory inside this layout — there is no dedicated `wiki` asset
type in 0.9.0.

## 2. Write search-friendly metadata

- Give every skill, command, agent, workflow, and lesson a trigger-sentence
  `description`.
- Add a root `akm.json` when you want stash-level metadata.
- For benchmark or fixture content, teach **how** to do the work, not the exact
  answer to a single verifier.

Prefer inline metadata in frontmatter and file-local comments. Treat
`.stash.json` as legacy compatibility content rather than the default authoring
path on 0.9.0.

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
- If you ship `workflows/`, verify each one uses the 0.9.0 frontmatter
  `steps:` contract (`akm lint --type workflows` must be clean) — the retired
  0.8.0 `## Step: <title>` / `Step ID:` heading format fails to index.
- If you ship `tasks/`, verify they use the current YAML task format
  (`tasks/<id>.yml`) beginning with `version: 2`, with `schedule:` and
  exactly one of `workflow:`, `prompt:`, or `command:` — and the `akm task`
  CLI, not older experimental examples. Only version-2 task files are
  discovered; a v1 file (or one missing `version:`) is diagnosed but never
  executed.
