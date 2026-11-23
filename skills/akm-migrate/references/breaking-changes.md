---
description: "What akm 0.10 removed or changed relative to 0.9.15 and later: config keys, improve strategies, workflow features, asset tool restrictions, and the connections and harnesses config. Use when updating authored assets, config or machine consumers after an upgrade."
tags: [akm, migration, 0.10, compatibility, config, improve]
updated: 2026-11-23
---

# akm 0.10 Migration Reference

Source of truth: `docs/migration/v0.9-to-v0.10.md` and `STABILITY.md` in the
akm repository. The commands to run are in `SKILL.md`.

## Config

- `engines` and `defaults` become `connections` and `harnesses`. A connection is
  an OpenAI-compatible endpoint (`endpoint`, `apiKey`, `models`,
  `contextLength`, `timeoutMs`, `concurrency`). A harness is an agent program
  you already have (`platform`, `bin`, `args`, `workspace`, `agent`,
  `timeoutMs`, `models`). The entry named `default`, or the only entry, is the
  default. With neither configured, model features and agent work are off and
  `akm setup` is the fix.
- Where a process runs is set by `improve.connection` and `improve.harness`.
- API keys live in `credentials.json` or an environment variable
  (`"apiKey": "$NAME"`), never in `config.json`.
- `secret://name` and `${secret:NAME}` still load with a warning; write
  `${secrets/NAME}` in env files and scripts.
- A config still in the `stashDir` / `sources[]` / `installed[]` layout fails
  to load; run `akm migrate apply` under akm 0.9.x first.
- Removed keys load with one unknown-key warning and are ignored; `apply`
  drops them: `consolidate.antiCollapse`, `consolidate.p90ChunkSecondsDefault`,
  `consolidate.minPoolSize`, `distill.fidelityCheck`, `reflect.lowValueFilter`,
  `improve.salience.outcomeWeightEnabled`, `improve.salience.salienceThreshold`,
  `distill.limit`, `memoryInference.cls`, `proactiveMaintenance.limit`,
  `triage.policy`, top-level `execution.allowedTools`, `defaults.llm`,
  `defaults.agent`, `defaults.improve`.
- Config key `extends` is deprecated, removed in 0.11.

## Improve

| Removed strategy | Use |
|---|---|
| `quick`, `reflect-distill`, `thorough`, `proactive-maintenance` | `default` |
| `catchup` | `consolidate` |

A reflect-only replacement is a user strategy that sets `enabled: false` for
`distill`, `consolidate`, `memoryInference`, `triage`, `validation` and
`proactiveMaintenance` under `improve.strategies.<name>.processes`.

`akm improve` (default strategy) accepts and commits proposals a quality judge
stamped as passing, up to 200 a run; it never accepts proactive-lane proposals,
uncertain verdicts or distill lessons. On a git-backed bundle a live run
syncs before it plans (`--no-sync`, `--no-push` skip it). Uncertain reflect
verdicts scoring 3.5 or more become pending proposals.

## Assets

- Agents, commands and tasks no longer restrict an agent's tools: `tools:` and
  `allowed-tools:` are not read (a task's `tools:` warns). Define a restricted
  agent in the harness itself and select it with the harness's `agent`.
- `engine:` on commands, agents, workflows and task sources is rewritten to
  `connection:` or `harness:` by `akm migrate apply`.

## Workflows

Workflows are deprecated (removed in 0.11); convert with
`akm migrate apply workflows/<name>.md`. 0.10 already removed the YAML
workflow format (a `.yml` under `workflows/` is skipped at index time),
top-level `outputs:`, `route` steps and `unit.isolation: worktree`. Child
workflows are a Markdown step with
`unit: { workflow: workflows/<name>, with: {...} }`. A param's `default:` is
now applied.

## Plugins

A 0.9 plugin passes `--shape agent`, which 0.10 rejects; a 0.10 plugin passes
`--detail agent`, which 0.9 rejects. Move CLI and plugins together:
`akm upgrade` updates both, and `akm doctor` reports a plugin whose bundled
akm-cli differs from the running CLI.
