# tasks/

Scheduled task definitions run by the local akm scheduler. Each YAML file
declares a schedule plus exactly one target: a workflow, prompt, or command.

See [`knowledge:akm-stash-structure`](../knowledge/akm-stash-structure.md)
for the task schema. To enable scheduling locally, see `akm tasks --help`.

Browse the full set with:

```bash
akm tasks list
```
