---
schedule: "0 2 * * *"
prompt: inline
description: Use when the stash should run a nightly improvement pass that proposes reusable updates without directly modifying live assets.
tags: [scheduled, improve, proposals]
enabled: true
---

# Task: Nightly improve cycle

Run a non-destructive nightly improvement pass for the current AKM stash.

1. Verify the installed `akm` supports `improve` and `proposals`.
2. Inspect the current queue with `akm proposals --status pending --format json`.
3. Run one whole-stash improve pass:

```bash
akm improve --task "Review the current stash for stale guidance, outdated CLI references, missing task-asset coverage, and reusable improvements. Generate only proposal-queue entries; do not edit live assets directly."
```

4. Check the queue again with `akm proposals --status pending --format json`.
5. Do not accept or reject proposals automatically.
6. Finish with a concise summary that includes:
   - pending proposal count before and after,
   - whether the improve run succeeded,
   - the next review command (`akm proposals` or `akm show proposal <id>`).

If `akm improve` is unavailable in the installed CLI, stop and report that the
environment is on an older AKM version.
