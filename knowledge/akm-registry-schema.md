---
description: Use when an agent needs the current registry index schema and install metadata fields for published stashes.
tags: [akm, registry, schema]
quality: curated
updated: 2026-08-04
---

# akm Registry Index Schema

> **Version target:** akm registry schema v3, used by akm-cli 0.9.0

The official registry publishes a static `index.json`. akm fetches and caches
that file, then searches it for matching stashes with `akm search --from
registry`. Registries discover *stashes* (installable source bundles); the
schema's own field names (`stashes[]`) are unchanged in 0.9.0 even though the
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
| `version` | `3` | yes | Consumers reject unknown versions. |
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
  "assetTypes": ["skill", "workflow"],
  "author": "your-org",
  "license": "MPL-2.0"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Canonical form `<source>:<ref>`. |
| `name` | string | yes | Display name. |
| `ref` | string | yes | Install reference. |
| `source` | enum | yes | `github` \| `npm` \| `git` \| `url` \| `local`. |
| `description` | string | recommended | Primary search/rerank signal. |
| `homepage` | URL | recommended | Human-readable docs. |
| `tags` | string[] | recommended | Lowercase search keywords. |
| `assetTypes` | string[] | recommended | Any of `script`, `skill`, `command`, `agent`, `knowledge`, `instruction`, `workflow`, `env`, `secret`, `memory`, `lesson`, `task`, `session`, `fact` (AKM's own `KNOWN_TYPES`), or a foreign/adapter-owned type (e.g. an `llm-wiki` page kind). Not a strict validation gate — an unrecognized type still round-trips. |
| `author` | string | optional | User or org. |
| `license` | SPDX string | recommended | Surfaced before install. |

## Notes for 0.9.0 users

- The old `kits[]` top-level array is long gone; use `stashes[]` only.
- The legacy registry boolean `curated` is no longer part of the current
  surface. Prefer richer descriptions, tags, and per-asset metadata instead of
  relying on a single curation flag.
- Search-hit `quality` such as `curated` or `proposed` is an **asset-level**
  concept, not a stash-level registry boolean.
- `wiki` was retired as an AKM-owned asset type in 0.9.0. The Karpathy-style
  LLM wiki structure (`schema.md` + `pages/`) is now a first-class **bundle
  format** — its page kinds are foreign types in `assetTypes`/`assets`
  entries, not an AKM-owned `wiki` type. There is no dedicated `akm wiki`
  command family; a wiki bundle is installed and searched like any other
  source.
- Install a discovered stash with `akm bundle add <ref>` (the retired `akm
  add` spelling moved under the `bundle` group in 0.9.0).

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
