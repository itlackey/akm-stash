---
type: workflow
description: Publish a local directory of agent assets as a searchable akm bundle and verify it with current 0.9.0 conventions.
tags: [publish, release]
params:
  ref: { type: string, description: Install ref to verify after publishing }
updated: 2026-08-04
steps:
  - id: prepare-layout
  - id: add-metadata
    inputs: [steps.prepare-layout.output]
  - id: choose-path
  - id: release-version
    inputs: [steps.choose-path.output]
  - id: verify-install
    inputs: [steps.release-version.output]
---

# Workflow: Publish an akm Bundle

## prepare-layout

Move assets into conventional directories, add `README.md` and `LICENSE`,
and create `akm.json` if you want bundle-level metadata.

Verify:
- The bundle has a coherent directory layout.
- Every shipped asset belongs to a clear type.

## add-metadata

Add trigger-sentence descriptions, inline metadata in frontmatter or
file-local headers, and reusable content that teaches how to solve a class
of problems instead of leaking one exact answer, to the layout attached to
this unit from the prior step.

Verify:
- Skills, commands, agents, workflows, and lessons have clear descriptions.
- Asset content is reusable and not answer-leaky.

## choose-path

Pick npm keywords, GitHub topic discovery, a manual registry entry, or a
combination of those routes.

Verify:
- The chosen publish path's required metadata is in place.

## release-version

Create a tag or package release so consumers can pin a known-good version,
using the publish path chosen in the prior step.

Verify:
- A versioned release exists.

## verify-install

From a clean environment, use the install ref from the `ref` parameter,
building on the release from the prior step:

```bash
akm search "<ref-from-params>" --from registry
akm bundle add <ref-from-params>
akm index
akm show <ref-from-your-bundle>
```

Verify:
- The bundle can be discovered or directly installed.
- At least one advertised asset is retrievable.
