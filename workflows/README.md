# workflows/

Multi-step playbooks an agent can resume across turns. Workflows have
explicit steps, transitions, and completion criteria — heavier than a
[`command`](../commands) and more linear than a [`skill`](../skills).

Run a workflow with the appropriate ref, for example:

```bash
akm workflow next workflow:onboard-agent
```

Browse the full set with:

```bash
akm search --type workflow
```
