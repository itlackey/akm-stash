# akm Benchmark Fixture Format

> **Version target:** akm-bench v1 in akm-cli v0.7.0

This document summarizes the shared fixture format used by `akm-bench` and by
related unit tests. Use it when authoring reusable evaluation stashes or task
corpora.

## Shared fixture stash layout

Reusable fixture stashes live under a shared directory and use normal stash
layout plus a manifest:

```text
tests/fixtures/stashes/<name>/
  MANIFEST.json
  skills/
  commands/
  agents/
  knowledge/
  workflows/
  lessons/
```

Example `MANIFEST.json`:

```json
{
  "name": "docker-homelab",
  "description": "Curated assets for docker-compose homelab management.",
  "purpose": "Used by benchmark tasks and ranking tests for docker-related queries.",
  "assets": { "skill": 1, "knowledge": 4, "lesson": 1 },
  "consumers": [
    "tests/fixtures/bench/tasks/docker-homelab/*",
    "tests/ranking-regression.test.ts"
  ]
}
```

The manifest exists so future maintainers know what depends on the fixture.

## Task directory layout

Each task lives at `tests/fixtures/bench/tasks/<domain>/<task-id>/`.

```text
<task-id>/
  task.yaml
  workspace/
  verify.sh
```

Example `task.yaml`:

```yaml
id: docker-homelab/redis-healthcheck
title: Add a healthcheck to the Redis service
domain: docker-homelab
difficulty: easy
slice: eval
gold_ref: skill:docker-homelab
stash: docker-homelab
verifier: script
budget:
  tokens: 30000
  wallMs: 120000
```

## Quality rule: teach HOW, never WHAT

Fixture assets must teach syntax, schema, patterns, trade-offs, and examples.
They must **not** leak verifier answers or task-specific values.

- **Good:** “Use `redis-cli ping` as a common Redis healthcheck example.”
- **Bad:** “For `redis-healthcheck`, add exactly this YAML block to pass the
  verifier.”

If an asset contains the benchmark answer instead of transferable guidance, it
is not a good fixture.

## Reuse and drift control

- Reference fixture stashes by name from tasks instead of duplicating assets.
- Keep one source of truth for shared domain content.
- Treat fixture changes as benchmark-significant; baseline comparisons should
  not silently mix old and new fixture content.

## Checklist for high-value fixtures

- Trigger-sentence descriptions on skills, commands, agents, and lessons.
- `MANIFEST.json` with purpose, asset counts, and known consumers.
- Generalizable guidance rather than answer leakage.
- Realistic examples and vocabulary from the domain.
- Small, composable assets that are easy for agents to retrieve.
