---
name: akm-find
type: command
description: Use when you need a compact ranked shortlist of akm assets for a task. The first argument is the need; the optional second argument is an asset type filter.
updated: 2026-08-29
---

You are helping choose the best akm asset for this need.

Need: $1
Optional asset type filter: $2

1. Start with `akm curate "$1"`.
2. If the first pass is weak or a type filter was supplied, use raw search to
   deepen: `akm search "$1" --from all --limit 20` and add `--type "$2"`
   when a second argument is available.
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
   <install-ref>` action. Only suggest `akm clone <ref>` for a valid local ref
   (or an explicit source-locator clone ref returned by AKM), never for a
   synthesized registry ref.

Do not install anything without confirmation.
