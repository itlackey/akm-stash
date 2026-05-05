import { afterEach, describe, expect, test } from "bun:test";
import { acquireLock, refreshLock, releaseLock, LockHeldError } from "../scripts/lib/lock.ts";
import { cleanupTempDirs, makeTempDir } from "./helpers.ts";

afterEach(() => {
  cleanupTempDirs();
});

describe("dream lock", () => {
  test("same session can resume and refresh the lock", () => {
    const stashDir = makeTempDir("akm-dream-lock-");
    const first = acquireLock(stashDir, { sessionId: "session-1", phase: "phase1" });
    const resumed = refreshLock(stashDir, { sessionId: "session-1", phase: "phase3" });
    expect(resumed.sessionId).toBe(first.sessionId);
    expect(resumed.phase).toBe("phase3");
    releaseLock(stashDir, "session-1");
  });

  test("different session is blocked while lock is active", () => {
    const stashDir = makeTempDir("akm-dream-lock-");
    acquireLock(stashDir, { sessionId: "session-1", phase: "phase1" });
    expect(() => acquireLock(stashDir, { sessionId: "session-2", phase: "phase1" })).toThrow(LockHeldError);
    releaseLock(stashDir, "session-1");
  });
});
