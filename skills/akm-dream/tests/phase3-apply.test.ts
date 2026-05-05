import { describe, expect, mock, test } from "bun:test";
import { applyPlan } from "../scripts/phase3-apply.ts";
import type { PlanReport } from "../scripts/phase3-plan.ts";

function basePlan(): PlanReport {
  return {
    generatedAt: "2026-05-05T00:00:00.000Z",
    runId: "dream-test",
    planVersion: 1,
    inputs: {
      stashDir: "/tmp/stash",
      memoryCount: 1,
      signalCount: 1,
    },
    summary: {
      candidateCount: 2,
      approvedCount: 1,
      protectedCount: 0,
      destructiveCount: 1,
      operations: {
        create: 1,
        update: 0,
        "merge-into": 0,
        delete: 1,
        skip: 0,
      },
    },
    candidates: [
      {
        id: "create:new-policy",
        operation: "create",
        proposedName: "new-policy",
        targetName: "new-policy",
        proposedDescription: "Always run release smoke tests.",
        approved: true,
        confidence: 0.9,
        rationale: "Create a durable policy memory.",
        protected: false,
        protectionReasons: [],
        indicators: {
          contradiction: false,
          duplicate: false,
          stale: false,
        },
        evidence: [
          {
            kind: "signal",
            source: "daily-log.md",
            line: 4,
            excerpt: "Always run release smoke tests before deploy.",
          },
        ],
      },
      {
        id: "delete:memory:old-note",
        operation: "delete",
        targetRef: "memory:old-note",
        targetName: "old-note",
        approved: false,
        confidence: 0.6,
        rationale: "Delete stale memory.",
        protected: false,
        protectionReasons: [],
        indicators: {
          contradiction: false,
          duplicate: false,
          stale: true,
        },
        evidence: [
          {
            kind: "memory",
            source: "old-note.md",
            ref: "memory:old-note",
            excerpt: "Old note.",
          },
        ],
      },
    ],
  };
}

describe("applyPlan", () => {
  test("applies only approved candidates by default", async () => {
    const plan = basePlan();
    const rememberMemory = mock(async () => ({ ref: "memory:new-policy" }));
    const forgetMemory = mock(async () => ({ ok: true, ref: "memory:old-note", removed: true }));

    const result = await applyPlan(
      plan,
      {
        dryRun: false,
        applyApproved: true,
        includeUnapproved: false,
        noDelete: false,
        maxDeletes: 3,
        allowProtected: false,
        now: "2026-05-05",
      },
      {
        showMemory: async () => null,
        rememberMemory,
        forgetMemory,
      },
    );

    expect(result.ok).toBe(true);
    expect(result.summary.created).toBe(1);
    expect(result.summary.deleted).toBe(0);
    expect(result.summary.skipped).toBe(1);
    expect(rememberMemory).toHaveBeenCalledTimes(1);
    expect(forgetMemory).toHaveBeenCalledTimes(0);
  });

  test("enforces delete budget for reviewed destructive actions", async () => {
    const plan = basePlan();
    const forgetMemory = mock(async () => ({ ok: true, ref: "memory:old-note", removed: true }));

    const result = await applyPlan(
      plan,
      {
        dryRun: false,
        applyApproved: true,
        includeUnapproved: true,
        noDelete: false,
        maxDeletes: 0,
        allowProtected: false,
        now: "2026-05-05",
      },
      {
        showMemory: async () => null,
        rememberMemory: async () => ({ ref: "memory:new-policy" }),
        forgetMemory,
      },
    );

    expect(result.summary.deleted).toBe(0);
    expect(result.summary.skipped).toBe(1);
    expect(forgetMemory).toHaveBeenCalledTimes(0);
  });
});
