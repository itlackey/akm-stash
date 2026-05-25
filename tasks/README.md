# tasks/

Scheduled prompts (cron-style) run by the local akm scheduler. Each YAML
file declares a schedule, a prompt, and execution metadata.

See [`knowledge:akm-stash-structure`](../knowledge/akm-stash-structure.md)
for the task schema. To enable scheduling locally, see `akm tasks --help`.

Browse the full set with:

```bash
akm search --type task
```
