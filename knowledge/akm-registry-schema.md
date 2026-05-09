---
description: Use when an agent needs the current registry index schema and install metadata fields for published stashes.
tags: [akm, registry, schema]
quality: curated
---

# akm Registry Index Schema

> **Version target:** akm registry schema v3, used by akm-cli v0.8.0

The official registry publishes a static `index.json`. akm fetches and caches
that file, then searches it for matching stashes.

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
| `assetTypes` | string[] | recommended | Any of `script`, `skill`, `command`, `agent`, `knowledge`, `workflow`, `wiki`, `vault`, `memory`, `lesson`. |
| `author` | string | optional | User or org. |
| `license` | SPDX string | recommended | Surfaced before install. |

## Notes for v0.8.0 users

- The old `kits[]` top-level array is long gone; use `stashes[]` only.
- The legacy registry boolean `curated` is no longer part of the current
  surface. Prefer richer descriptions, tags, and per-asset metadata instead of
  relying on a single curation flag.
- Search-hit `quality` such as `curated` or `proposed` is an **asset-level**
  concept in akm v0.8.0, not a stash-level registry boolean.

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
