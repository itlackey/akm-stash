---
name: akm-review-proposal
type: command
description: Use when you need to evaluate an akm proposal before accepting or rejecting it. The first argument is the proposal id.
updated: 2026-05-23
---

Review akm proposal `$1` and decide whether it should become live.

1. Run:

```bash
akm show "proposal:$1"
akm diff "$1"
```

2. Evaluate the proposal on five axes:
   - correctness against the current task or workflow,
   - reusability beyond one narrow verifier,
   - metadata quality (`description`, and `when_to_use` for lessons),
   - searchability and clarity,
   - regression risk versus the current live asset.

3. Respond with:

```text
Decision: Accept | Reject
Why: <one short paragraph>
Follow-up: <single next akm command>
```

Reject anything that leaks answers, weakens safety, or is too vague to be
useful.
