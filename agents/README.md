# agents/

Subagent system prompts that specialize in akm tasks. Loaded by host agents
(Claude Code, OpenCode, etc.) via `akm agent <ref>` or platform-specific
dispatch.

Each file is a single agent definition with frontmatter (`name`, `description`,
`when_to_use`, optional `tools` and `model` hints) followed by the system
prompt body.

Browse the full set with:

```bash
akm search --type agent
```

See [`knowledge:akm-stash-structure`](../knowledge/akm-stash-structure.md) for
authoring conventions.
