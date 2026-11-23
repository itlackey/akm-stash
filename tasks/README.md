# tasks/

Task definitions run directly (`akm run <bundle>//tasks/<id>`) or on a schedule
through the local akm scheduler. A task is a pure-YAML file with a `version:`
first line:

- `version: 5-beta.1` (task source v5, Experimental): a list of akm commands
  (`run:`, `exec:`, `prompt:`) run in order, with `inputs:`, `${name}` results,
  and `lock: true` for one run at a time. A failed run resumes with `akm run
  <task> --resume`.
- `version: 4`: one `uses:` or `run:` target plus optional `schedule:` entries.
  Unchanged through 0.10.x; `akm migrate apply <task-file>` converts it to v5.

Add a task with `akm import <file> --type task`, schedule it with `akm task
enable <ref>`, and reconcile the OS scheduler with `akm doctor scheduler sync
--dry-run` (then without `--dry-run`). Use `akm doctor scheduler sync --prune`
only to preview installed entries whose owning bundle no longer resolves; it
needs `--yes` to remove them.

See [`knowledge/akm-stash-structure`](../knowledge/akm-stash-structure.md)
for the task schema. Check a file with `akm lint <file> --type tasks` and
preview what it would run with `akm doctor explain <ref>`.

Browse the full set with:

```bash
akm search --type task
```
