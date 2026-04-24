# akm Registry Index Schema

The official registry publishes a static `index.json` (version 2). The akm
CLI fetches and caches that file, then searches it for matching stashes. This
document describes the schema an agent or author needs to produce valid
entries — whether via auto-discovery (npm/GitHub) or a manual PR.

Schema file: [`scripts/registry-index.schema.json`](../scripts/registry-index.schema.json)

## Top-level shape

```json
{
  "version": 2,
  "updatedAt": "2026-04-24T00:00:00Z",
  "kits": []
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `version` | `2` | yes | Consumers reject unknown versions. |
| `updatedAt` | ISO 8601 string | yes | Set by the build. |
| `kits` | array of Stash | yes | Wire-format name retained; semantically each element is a published stash. Order is not semantically meaningful. |

## Stash object (each element of `kits`)

```json
{
  "id": "github:your-org/your-stash",
  "name": "Your Stash Name",
  "ref": "your-org/your-stash",
  "source": "github",
  "description": "One-line, agent-facing description.",
  "homepage": "https://github.com/your-org/your-stash",
  "tags": ["deploy", "review"],
  "assetTypes": ["script", "skill", "workflow"],
  "assets": [
    {
      "type": "skill",
      "name": "deploy-to-fly",
      "description": "Deploy a Node service to Fly.io."
    }
  ],
  "author": "your-org",
  "license": "MIT",
  "curated": true
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Stable unique ID. Canonical form `<source>:<ref>` (e.g. `github:owner/repo`, `npm:@scope/pkg`). |
| `name` | string | yes | Display name. |
| `ref` | string | yes | Install reference. For `source: github`, use `owner/repo`. For `source: npm`, use the package name. |
| `source` | enum | yes | `github` \| `npm` \| `git` \| `url` \| `local`. |
| `description` | string | recommended | First thing agents read — write as a trigger sentence. |
| `homepage` | URL | recommended | Human-visitable docs. |
| `tags` | string[] | recommended | Lowercase, kebab-case. Used for filter and rerank. |
| `assetTypes` | string[] | recommended | Subset of `script`, `skill`, `command`, `agent`, `knowledge`, `workflow`, `wiki`, `vault`, `memory`. Drives type filters in `akm search`. |
| `assets` | Asset[] | optional | Enumerate individual assets for finer-grained search. v2 only. |
| `author` | string | optional | Org or user. |
| `license` | SPDX string | recommended | Consumers surface this before install. |
| `curated` | boolean | optional | `true` means the entry came from `manual-entries.json` and overrides auto-discovery. |

## Asset object (inside `stash.assets`)

```json
{
  "type": "skill",
  "name": "deploy-to-fly",
  "description": "Deploy a Node service to Fly.io.",
  "tags": ["deploy", "fly"]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | yes | One of the nine asset types above. |
| `name` | string | yes | Identifier *within* the stash (filename stem for most types; directory name for skills and wikis). |
| `description` | string | recommended | One line. |
| `tags` | string[] | optional | Additional filter keywords. |

## Minimum viable manual entry

```json
{
  "id": "github:your-org/your-stash",
  "name": "Your Stash",
  "ref": "your-org/your-stash",
  "source": "github"
}
```

Required fields only: `id`, `name`, `ref`, `source`. Everything else improves
discovery — add as much as you can truthfully supply.
