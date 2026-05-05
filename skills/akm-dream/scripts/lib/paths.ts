/**
 * Path-resolution helpers.
 *
 * Different agents store their session transcripts in different places.
 * The dream pipeline knows how to find the most common ones; users can
 * point at others via env vars.
 */

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative, resolve } from "node:path";

const DREAM_STATE_DIRNAME = ".akm-dream";

export interface SignalLocations {
  claudeProjects: string | null;
  opencodeSessions: string | null;
  codexSessions: string | null;
  cursorSessions: string | null;
}

/**
 * Resolve every place we might find raw signal that hasn't been
 * promoted into an akm memory yet.
 */
export function findSignalLocations(): SignalLocations {
  const home = homedir();
  const candidate = (rel: string): string | null => {
    const p = join(home, rel);
    return existsSync(p) ? p : null;
  };
  return {
    claudeProjects: process.env.CLAUDE_PROJECTS_DIR
      ? existsSync(process.env.CLAUDE_PROJECTS_DIR)
        ? process.env.CLAUDE_PROJECTS_DIR
        : null
      : candidate(".claude/projects"),
    opencodeSessions:
      process.env.OPENCODE_DIR && existsSync(process.env.OPENCODE_DIR)
        ? process.env.OPENCODE_DIR
        : candidate(".local/share/opencode/sessions") ??
          candidate(".local/share/opencode"),
    codexSessions: candidate(".codex/sessions") ?? candidate(".codex/history"),
    cursorSessions: candidate(".cursor/logs"),
  };
}

/** Path to the daily-log directory inside a stash, if it exists. */
export function dailyLogsDir(stashDir: string): string | null {
  const p = join(stashDir, "logs");
  return existsSync(p) ? p : null;
}

/** Path to the memories directory inside a stash. */
export function memoriesDir(stashDir: string): string {
  return join(stashDir, "memories");
}

/** Path to the MEMORY.md index file inside a stash. */
export function memoryIndexPath(stashDir: string): string {
  return join(memoriesDir(stashDir), "MEMORY.md");
}

/** Path to the stash-local directory we use for dream artifacts. */
export function dreamStateDir(stashDir: string): string {
  return join(stashDir, DREAM_STATE_DIRNAME);
}

/** Path to the top-level dream state file inside a stash. */
export function dreamStatePath(stashDir: string): string {
  return join(dreamStateDir(stashDir), "state.json");
}

/** Path to the directory containing all dream runs for a stash. */
export function dreamRunsDir(stashDir: string): string {
  return join(dreamStateDir(stashDir), "runs");
}

/** Path to a specific dream run directory. */
export function dreamRunDir(stashDir: string, runId: string): string {
  return join(dreamRunsDir(stashDir), runId);
}

/** Path to a specific dream run artifact file. */
export function dreamRunArtifactPath(
  stashDir: string,
  runId: string,
  fileName: string,
): string {
  return join(dreamRunDir(stashDir, runId), fileName);
}

/** Path to the per-run dream metadata file. */
export function dreamRunMetadataPath(stashDir: string, runId: string): string {
  return dreamRunArtifactPath(stashDir, runId, "run.json");
}

/** Path to the per-run backup directory. */
export function dreamRunBackupDir(stashDir: string, runId: string): string {
  return join(dreamRunDir(stashDir, runId), "backup");
}

/**
 * Refuse to operate on anything outside the stash. Returns true when
 * `target` is contained within `root`. Path containment is computed
 * with normalized absolute paths to defeat `..` traversal.
 */
export function isInside(root: string, target: string): boolean {
  const absRoot = resolve(root);
  const absTarget = resolve(target);
  const rel = relative(absRoot, absTarget);
  return rel === "" || (!rel.startsWith("..") && rel !== ".." && !rel.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`));
}
