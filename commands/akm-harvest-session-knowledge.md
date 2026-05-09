---
description: Use when you need to gather context and kick off session-log harvesting. Arguments: roots, since-window, tool-filter, and mode.
---

You are starting a session-log knowledge harvest.

Roots: $1
Since window: $2
Tool filter: $3
Mode: $4

1. Gather context before doing any extraction:
   - expand the requested roots and note missing directories,
   - inspect `akm proposals` for overlapping pending work,
   - identify which supported log families are actually present.
2. Use `skill:analyze-session-logs` to normalize opencode, Claude, and akm
   evidence from the requested scope and identify the strongest proposal
   candidates.
3. Use `akm workflow` with `workflow:harvest-session-knowledge` with the supplied parameters to
   cluster patterns, remove duplicates, and either:
   - stop at queue-ready briefs when mode is `dry-run`, or
   - submit proposals when mode is `live`.
4. Respond with exactly this kickoff format:

```text
Kickoff:
- Roots: <expanded roots>
- Since: <resolved window>
- Tools: <detected and requested tools>
- Mode: <dry-run|live>
- Queue overlap: <none or short note>
- Next: <single next akm command or workflow step>
```

Prefer the smallest viable scan that still captures repeated evidence.
