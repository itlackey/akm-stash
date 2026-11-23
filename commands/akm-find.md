---
name: akm-find
type: command
description: Use when you need a compact ranked shortlist of akm assets for a task. The argument is the need, optionally followed by `type=<asset type>`.
updated: 2026-11-23
---

You are helping choose the best akm asset for this need.

Request: $ARGUMENTS

The request is the need, optionally followed by `type=<asset type>`. Call the
need `<need>` below.

1. Start with `akm curate "<need>"`.
2. If the first pass is weak or a type filter was supplied, use raw search to
   deepen: `akm search "<need>" --from all --limit 20` and add `--type
   <asset type>` when a type was given.
3. Rank the best candidates by:
   - how specifically the description matches the need,
   - whether the asset looks official, well-maintained, or high quality,
   - how actionable the next step is for the caller.
4. Keep the response arrays distinct. Local `hits[]` entries have canonical
   refs that can be passed to `akm show`; registry `registryHits[]` entries are
   discovery records and must retain their returned name, source/homepage, and
   offered install action. Never invent a generic ref for a registry hit.
5. Output local matches in this format:

```text
1. <ref> — <one-line why it fits>
2. <ref> — <one-line why it fits>
3. <ref> — <one-line why it fits>
```

Output registry candidates separately:

```text
Registry candidates:
- <returned name> — <one-line why>; install: <offered action>
```

6. End with exactly one suggested next step: `akm show <local-ref>` for a local
   hit, or ask the user to approve the registry hit's offered `akm bundle add
   <install-ref>` action. Only suggest `akm import <ref> --asset-ref` for a
   valid local ref (or an explicit source-locator ref returned by AKM), never
   for a synthesized registry ref.

Do not install anything without confirmation.
