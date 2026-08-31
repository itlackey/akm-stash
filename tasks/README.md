# tasks/

Scheduled task definitions run directly or through the local akm scheduler.
Each file uses strict task source v4 (`version: 4`), declares exactly one
target (`uses:` or `run:`), and may declare one or more optional schedule
bindings. Scheduler enablement is per binding (`schedule[].enabled`), not a
document-level field.

See [`knowledge/akm-stash-structure`](../knowledge/akm-stash-structure.md)
for the task schema. Migrate v2/v3 task files with `akm migrate apply --dry-run`
followed by `akm migrate apply`; to reconcile schedule bindings, see
`akm task sync --dry-run` and `akm task --help`. Use `akm task prune` only for
installed entries whose scheduler context or owning bundle no longer resolves;
it previews by default and requires `--yes` to remove candidates.

Browse the full set with:

```bash
akm search --type task
```
