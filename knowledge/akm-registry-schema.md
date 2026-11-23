---
description: Use when an agent needs the current registry index schema and install metadata fields for published bundles.
tags: [akm, registry, schema]
quality: curated
updated: 2026-11-23
---

# akm Registry Index Schema

> **Version target:** akm-cli 0.10.261130 accepts registry index versions 2 and 3.

The official registry publishes a static `index.json`. akm fetches and caches
that file, then searches it for matching stashes with `akm search --from
registry`. Registries discover *stashes* (installable source bundles); the
schema's own field names (`stashes[]`) remain legacy terminology even though the
CLI noun for an installed source is now "bundle."

## Top-level shape

```json
{
  "version": 3,
  "updatedAt": "2026-05-04T00:00:00Z",
  "stashes": []
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `version` | `2` or `3` | yes | Both share this format; akm warns once about any other version. |
| `updatedAt` | ISO 8601 string | yes | Registry build timestamp. |
| `stashes` | array | yes | Published stash entries. |

## Stash object

```json
{
  "id": "github:your-org/your-stash",
  "name": "Your Stash",
  "ref": "your-org/your-stash",
  "source": "github",
  "description": "Use when you need deployment and release automation assets.",
  "homepage": "https://github.com/your-org/your-stash",
  "tags": ["deploy", "release"],
  "assetTypes": ["skill", "task"],
  "author": "your-org",
  "license": "MPL-2.0"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Canonical form `<source>:<ref>`. |
| `name` | string | yes | Display name. |
| `ref` | string | yes | Install reference. |
| `source` | enum | yes | `github` \| `npm` \| `git` \| `local`. Registry-provided `git` entries are discoverable but not installable. |
| `description` | string | recommended | Primary search/rerank signal. |
| `homepage` | URL | recommended | Human-readable docs. |
| `tags` | string[] | recommended | Lowercase search keywords. |
| `assetTypes` | string[] | recommended | Any of `script`, `skill`, `command`, `agent`, `knowledge`, `instruction`, `rule`, `workflow`, `env`, `secret`, `memory`, `lesson`, `task`, `session`, `fact` (AKM's own `KNOWN_TYPES`), or a foreign/adapter-owned type (e.g. an `llm-wiki` page kind). Not a strict validation gate — an unrecognized type still round-trips. |
| `author` | string | optional | User or org. |
| `license` | SPDX string | recommended | Surfaced before install. |

## Notes

- Use the `stashes[]` array only.
- There is no registry-level `curated` flag. Prefer richer descriptions, tags,
  and per-asset metadata.
- Search-hit `quality` such as `curated` or `proposed` is an **asset-level**
  concept, not a stash-level registry boolean.
- The Karpathy-style LLM wiki structure (`schema.md` + `pages/`) is a
  **bundle format**: its page kinds are foreign types in `assetTypes`/`assets`
  entries, not an AKM-owned `wiki` type. A wiki bundle is installed and
  searched like any other source.
- Install a discovered stash with `akm bundle add <ref>`.
- To be listed in the official registry, give the npm package the `akm-stash`
  keyword or the GitHub repo the `akm-stash` topic, or add a manual entry.

## Minimum viable entry

```json
{
  "id": "github:your-org/your-stash",
  "name": "Your Stash",
  "ref": "your-org/your-stash",
  "source": "github"
}
```

Everything else improves discovery and install confidence.
