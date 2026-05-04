---
description: Publish a local directory of agent assets as a searchable akm stash and verify it with current v0.7.0 conventions.
tags: [publish, release]
params:
  ref: Install ref to verify after publishing
---

# Workflow: Publish an akm Stash

## Step: Prepare the layout
Step ID: prepare-layout

### Instructions
Move assets into conventional directories, add `README.md` and `LICENSE`, and
create `akm.json` if you want stash-level metadata.

### Completion Criteria
- The stash has a coherent directory layout.
- Every shipped asset belongs to a clear type.

## Step: Add search-friendly metadata
Step ID: add-metadata

### Instructions
Add trigger-sentence descriptions, directory-level `.stash.json` files where
helpful, and benchmark-safe content that teaches how to solve a class of
problems instead of leaking one exact answer.

### Completion Criteria
- Skills, commands, agents, workflows, and lessons have clear descriptions.
- Asset content is reusable and not answer-leaky.

## Step: Choose the publish path
Step ID: choose-path

### Instructions
Pick npm keywords, GitHub topic discovery, a manual registry entry, or a
combination of those routes.

### Completion Criteria
- The chosen publish path's required metadata is in place.

## Step: Release a version
Step ID: release-version

### Instructions
Create a tag or package release so consumers can pin a known-good version.

### Completion Criteria
- A versioned release exists.

## Step: Verify installability
Step ID: verify-install

### Instructions
From a clean environment, use the install ref from `params.ref` and run:

```bash
akm registry search <ref-from-params>
akm add <ref-from-params>
akm index
akm show <ref-from-your-stash>
```

### Completion Criteria
- The stash can be discovered or directly installed.
- At least one advertised asset is retrievable.
