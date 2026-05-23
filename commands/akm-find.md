---
name: akm-find
type: command
description: Use when you need a compact ranked shortlist of akm assets for a task. The first argument is the need; the optional second argument is an asset type filter.
updated: 2026-05-23
---

You are helping choose the best akm asset for this need.

Need: $1
Optional asset type filter: $2

1. Start with `akm curate "$1"`.
2. If the first pass is weak or a type filter was supplied, use raw search to
   deepen: `akm search "$1" --source both --limit 20` and add `--type "$2"`
   when a second argument is available.
3. Rank the best candidates by:
   - how specifically the description matches the need,
   - whether the asset looks official, well-maintained, or high quality,
   - how actionable the next step is for the caller.
4. Output a shortlist in this format:

```text
1. <ref> — <one-line why it fits>
2. <ref> — <one-line why it fits>
3. <ref> — <one-line why it fits>
```

5. End with exactly one suggested next command, usually `akm show <ref>`,
   `akm add <source>`, or `akm clone <ref>`.

Do not install anything without confirmation.
