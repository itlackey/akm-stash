#!/usr/bin/env bun
/**
 * forget.ts — delete a single memory.
 *
 * akm 0.4.x does not yet expose a `forget` or `rm` verb for individual
 * assets (the locked v1 CLI surface is search/show/add/remove/...,
 * where `remove` deletes a SOURCE, not an asset). Until the native
 * command exists, we provide this small shim so the dream pipeline
 * can prune contradicted memories.
 *
 * Safety rules — every one of these is non-negotiable:
 *
 *   1. The ref MUST resolve to type `memory`. Refuse anything else.
 *   2. The resolved path MUST live inside `<stash>/memories/`. We
 *      compute that prefix from `akm config path --all`, never trust
 *      the path returned by `akm show` blindly.
 *   3. The resolved path MUST exist on disk. We don't try to "clean
 *      up" stale index entries — that's `akm index`'s job.
 *   4. `--dry-run` is the safe default for unattended use.
 *
 * Usage:
 *   bun run scripts/forget.ts memory:release-process
 *   bun run scripts/forget.ts memory:release-process --dry-run
 */

import { existsSync, unlinkSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { getStashDir, indexStash, showMemory } from "./lib/akm.ts";
import { isInside, memoriesDir } from "./lib/paths.ts";

interface ForgetResult {
  ok: boolean;
  ref: string;
  path?: string;
  removed: boolean;
  reason?: string;
}

export async function forget(
  ref: string,
  options: { dryRun?: boolean; skipIndex?: boolean } = {},
): Promise<ForgetResult> {
  if (!ref.startsWith("memory:")) {
    return {
      ok: false,
      ref,
      removed: false,
      reason: `ref must be a memory: got ${ref}`,
    };
  }

  const stashDir = await getStashDir();
  const memDir = resolve(memoriesDir(stashDir));

  const m = await showMemory(ref);
  if (!m || !m.path) {
    return {
      ok: false,
      ref,
      removed: false,
      reason: "memory not found",
    };
  }

  const target = resolve(m.path);

  if (!isInside(memDir, target)) {
    return {
      ok: false,
      ref,
      path: target,
      removed: false,
      reason: `refusing to delete: ${target} is outside ${memDir}`,
    };
  }

  if (!existsSync(target)) {
    return {
      ok: false,
      ref,
      path: target,
      removed: false,
      reason: "file does not exist on disk",
    };
  }

  if (options.dryRun) {
    return {
      ok: true,
      ref,
      path: target,
      removed: false,
      reason: "dry-run",
    };
  }

  // Memory files are single .md files — but if a future memory format
  // ever uses a directory, rmSync handles both safely.
  try {
    const stat = (await import("node:fs")).statSync(target);
    if (stat.isDirectory()) {
      rmSync(target, { recursive: true, force: true });
    } else {
      unlinkSync(target);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      ref,
      path: target,
      removed: false,
      reason: `unlink failed: ${msg}`,
    };
  }

  if (!options.skipIndex) {
    // Rebuild the FTS5 index so subsequent searches don't return the
    // ghost entry. This is cheap (incremental) on a single-file delete.
    try {
      await indexStash(false);
    } catch {
      // non-fatal — the user can run `akm index` themselves
    }
  }

  return { ok: true, ref, path: target, removed: true };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const ref = argv.find((a) => !a.startsWith("--"));
  const dryRun = argv.includes("--dry-run");
  const skipIndex = argv.includes("--skip-index");
  if (!ref) {
    console.error(
      "usage: bun run scripts/forget.ts <ref> [--dry-run] [--skip-index]",
    );
    process.exit(2);
  }
  forget(ref, { dryRun, skipIndex })
    .then((r) => {
      console.log(JSON.stringify(r, null, 2));
      if (!r.ok) process.exit(1);
    })
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`forget failed: ${msg}`);
      process.exit(1);
    });
}
