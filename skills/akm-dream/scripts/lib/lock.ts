/**
 * Lock-file management for the dream pipeline.
 *
 * The auto-dream design from Anthropic guarantees only one consolidation
 * runs at a time, even if two Claude Code instances are open on the
 * same project. We mirror that here: a single file at
 * `<stash>/.akm-dream.lock` containing JSON with the holding process's
 * PID and start time.
 *
 * Stale-lock policy: if the recorded PID is no longer alive *and* the
 * lock is older than 30 minutes, we steal it. This keeps the system
 * self-healing after crashes.
 */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LOCK_FILENAME = ".akm-dream.lock";
const STALE_AFTER_MS = 30 * 60 * 1000;

export interface LockInfo {
  sessionId: string;
  pid: number;
  startedAt: string;
  updatedAt: string;
  phase?: string;
  host: string;
}

export class LockHeldError extends Error {
  constructor(public info: LockInfo) {
    super(
      `dream lock is held by session ${info.sessionId} on ${info.host} since ${info.startedAt}`,
    );
    this.name = "LockHeldError";
  }
}

export function lockPath(stashDir: string): string {
  return join(stashDir, LOCK_FILENAME);
}

function isProcessAlive(pid: number): boolean {
  try {
    // Signal 0 doesn't actually send a signal, just checks existence.
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Try to acquire the dream lock. Throws `LockHeldError` if a fresh,
 * live lock is already in place. Reaps stale locks automatically.
 */
function nowIso(): string {
  return new Date().toISOString();
}

function writeLock(path: string, info: LockInfo): void {
  writeFileSync(path, `${JSON.stringify(info, null, 2)}\n`);
}

export function acquireLock(
  stashDir: string,
  options: { sessionId: string; phase?: string },
): LockInfo {
  const path = lockPath(stashDir);
  if (existsSync(path)) {
    const raw = readFileSync(path, "utf8");
    let parsed: LockInfo | null = null;
    try {
      parsed = JSON.parse(raw) as LockInfo;
    } catch {
      // malformed → treat as stale
    }
    if (parsed) {
      const touchedAt = parsed.updatedAt ?? parsed.startedAt;
      const ageMs = Date.now() - Date.parse(touchedAt);
      const alive = isProcessAlive(parsed.pid);
      if (parsed.sessionId === options.sessionId) {
        const resumed: LockInfo = {
          ...parsed,
          pid: process.pid,
          updatedAt: nowIso(),
          phase: options.phase ?? parsed.phase,
          host: process.env.HOSTNAME ?? parsed.host ?? "unknown",
        };
        writeLock(path, resumed);
        return resumed;
      }
      if (alive || ageMs < STALE_AFTER_MS) {
        throw new LockHeldError(parsed);
      }
    }
    try {
      unlinkSync(path);
    } catch {
      // best-effort
    }
  }

  const info: LockInfo = {
    sessionId: options.sessionId,
    pid: process.pid,
    startedAt: nowIso(),
    updatedAt: nowIso(),
    phase: options.phase,
    host: process.env.HOSTNAME ?? "unknown",
  };
  writeFileSync(path, `${JSON.stringify(info, null, 2)}\n`, { flag: "wx" });
  return info;
}

export function refreshLock(
  stashDir: string,
  options: { sessionId: string; phase?: string },
): LockInfo {
  const path = lockPath(stashDir);
  if (!existsSync(path)) {
    return acquireLock(stashDir, options);
  }
  try {
    const raw = readFileSync(path, "utf8");
    const info = JSON.parse(raw) as LockInfo;
    if (info.sessionId !== options.sessionId) throw new LockHeldError(info);
    const refreshed: LockInfo = {
      ...info,
      pid: process.pid,
      updatedAt: nowIso(),
      phase: options.phase ?? info.phase,
      host: process.env.HOSTNAME ?? info.host ?? "unknown",
    };
    writeLock(path, refreshed);
    return refreshed;
  } catch {
    return acquireLock(stashDir, options);
  }
}

export function releaseLock(stashDir: string, sessionId?: string): void {
  const path = lockPath(stashDir);
  if (!existsSync(path)) return;
  try {
    const raw = readFileSync(path, "utf8");
    const info = JSON.parse(raw) as LockInfo;
    if (!sessionId || info.sessionId === sessionId || info.pid === process.pid) {
      unlinkSync(path);
    }
  } catch {
    try {
      unlinkSync(path);
    } catch {
      // ignore
    }
  }
}

/**
 * Convenience wrapper that auto-releases on completion or error.
 *
 *   await withLock(stash, async () => { ...phases... });
 */
export async function withLock<T>(
  stashDir: string,
  options: { sessionId: string; phase?: string },
  fn: () => Promise<T>,
): Promise<T> {
  acquireLock(stashDir, options);
  try {
    return await fn();
  } finally {
    releaseLock(stashDir, options.sessionId);
  }
}
