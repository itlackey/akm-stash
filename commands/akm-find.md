---
name: akm-find
description: Compact prompt template for discovering akm assets matching a need. Produces a short ranked shortlist instead of raw search output.
args:
  - name: need
    description: What the agent is trying to accomplish (e.g. "review a TypeScript PR", "deploy a Node app to Fly").
    required: true
  - name: type
    description: Optional asset type filter — script, skill, command, agent, knowledge, workflow, wiki, vault, memory.
---

You are helping choose the best akm asset for this need:

**Need:** {{args.need}}
{{#if args.type}}**Asset type filter:** {{args.type}}{{/if}}

1. Run `akm curate "{{args.need}}"{{#if args.type}} --type {{args.type}}{{/if}}`.
   If it returns nothing useful, fall back to
   `akm search "{{args.need}}"{{#if args.type}} --type {{args.type}}{{/if}} --source both --limit 20`.

2. Rank the top 5 candidates by:
   - how specifically the `description` matches `{{args.need}}` (trigger-sentence fit),
   - whether the stash is `curated: true` or well-known,
   - recency (`updatedAt`) and license compatibility.

3. Output a shortlist in this format:

   ```
   1. <ref>  — <one-line why it fits>
   2. <ref>  — <one-line why it fits>
   3. <ref>  — <one-line why it fits>
   ```

4. End with ONE recommended next command, either:
   - `akm show <ref>` to inspect the top candidate, or
   - `akm add <source>` / `akm clone <ref>` to install it.

Do NOT install anything without user confirmation.
