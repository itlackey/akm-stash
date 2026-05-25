# knowledge/

Reference documents for the akm CLI, stash structure, and adjacent concepts.
Knowledge assets are read-only context — load them with `akm show <ref>` when
an agent needs background, not when it needs to act.

## Suggested reading order

| # | Ref | Read when |
| --- | --- | --- |
| 1 | `knowledge:akm-overview` | First time meeting akm — asset types, the major v0.8.0 surfaces, and how the pieces fit together. |
| 2 | `knowledge:akm-cli-reference` | You know the concepts and need the main commands, flags, and proposal-review flow in one place. |
| 3 | `knowledge:akm-stash-structure` | You're authoring or reorganizing a stash and need the v0.8.0 directory/command/workflow/task/lesson conventions. |
| 4 | `knowledge:akm-proposals-and-lessons` | You're reviewing the proposal queue or distilling lessons and need quality values + lesson lifecycle. |
| 5 | `knowledge:akm-registry-schema` | You're publishing a stash or building a private registry and need the index schema + install metadata fields. |

## Load any asset

```sh
akm show knowledge:akm-overview        # show one
akm search --type knowledge            # browse all
akm curate "publishing a new stash"   # let akm pick relevant ones for a task
```

These five documents are the agent-facing reference set — short, structured,
and version-pinned to akm-cli 0.8.0. They teach *how* rather than answer
specific questions; pair them with `akm search` for task-specific lookups.
