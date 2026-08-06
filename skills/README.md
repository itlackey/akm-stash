# skills/

Progressive-disclosure skills. Each skill is a directory containing a
`SKILL.md` (the entry point) plus optional `references/`, `assets/`, and
helper files. Skills teach a host agent **how** to accomplish a task and
load deeper material only when needed.

Start here:

- [`akm-quickstart/`](./akm-quickstart) — bootstrap akm in a new environment.
- [`install-akm-stash/`](./install-akm-stash) — pull a stash into the working
  directory.
- [`akm-migrate/`](./akm-migrate) — verify and complete an akm version upgrade.
- [`akm-curate-stash/`](./akm-curate-stash) — build a goal-specific mini-stash by discovering and cloning the best assets from all sources.
- [`publish-akm-stash/`](./publish-akm-stash) — turn a directory of assets into
  a searchable, installable stash.
- [`akm-health/`](./akm-health) — report on improve-pipeline metrics and
  troubleshoot slow, silent, or failing runs.
- [`akm-dream/`](./akm-dream) — consolidate and prune memories through staged
  review gates.

Browse the full set with:

```bash
akm search --type skill
```
