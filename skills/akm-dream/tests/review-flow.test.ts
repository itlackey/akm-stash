import { afterEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { applyPlan } from "../scripts/phase3-apply.ts";
import { createRunReport, recordArtifact, updateCheckpoint, writeRunArtifacts } from "../scripts/lib/run-report.ts";
import { readJson } from "./helpers.ts";
import { cleanupTempDirs, makeTempDir, writeFile } from "./helpers.ts";
import type { PlanReport } from "../scripts/phase3-plan.ts";
import { buildDreamRunRecord, completeDreamRun, loadDreamRun, saveDreamRun, saveDreamState } from "../scripts/lib/state.ts";

afterEach(() => {
  cleanupTempDirs();
});

describe("review/apply flow", () => {
  test("approved apply emits durable actions/result/summary artifacts", async () => {
    const stashDir = makeTempDir("akm-dream-review-flow-");
    const runDir = path.join(stashDir, ".akm-dream", "runs", "dream-1");
    const planPath = path.join(runDir, "plan.json");
    const actionsPath = path.join(runDir, "actions.jsonl");
    const resultPath = path.join(runDir, "result.json");
    const summaryPath = path.join(runDir, "summary.md");

    const plan: PlanReport = {
      generatedAt: "2026-05-05T00:00:00.000Z",
      runId: "dream-1",
      planVersion: 1,
      inputs: { stashDir, memoryCount: 0, signalCount: 1 },
      summary: {
        candidateCount: 1,
        approvedCount: 1,
        protectedCount: 0,
        destructiveCount: 0,
        operations: { create: 1, update: 0, "merge-into": 0, delete: 0, skip: 0 },
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
          rationale: "Create policy memory.",
          protected: false,
          protectionReasons: [],
          indicators: { contradiction: false, duplicate: false, stale: false },
          evidence: [
            { kind: "signal", source: "signal.json", line: 1, excerpt: "Always run release smoke tests." },
          ],
        },
      ],
    };
    writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`);

    let report = createRunReport({
      runId: "dream-1",
      mode: "full",
      stashDir,
    });
    report = recordArtifact(report, {
      phase: "phase3-plan",
      label: "Phase 3 plan",
      path: planPath,
      kind: "json",
    });
    report = updateCheckpoint(report, "phase3-review", { state: "approved" });
    writeRunArtifacts(report);

    const result = await applyPlan(
      plan,
      {
        dryRun: false,
        applyApproved: true,
        includeUnapproved: false,
        noDelete: false,
        maxDeletes: 1,
        allowProtected: false,
        actionsPath,
        resultPath,
        now: "2026-05-05",
      },
      {
        showMemory: async () => null,
        rememberMemory: async () => ({ ref: "memory:new-policy" }),
        forgetMemory: async () => ({ ok: true, ref: "memory:noop", removed: false, reason: "noop" }),
      },
    );

    writeFile(summaryPath, `# Dream Apply Summary\n\ncreated: ${result.summary.created}\n`);

    expect(result.ok).toBe(true);
    expect(readJson<{ summary: { created: number } }>(resultPath).summary.created).toBe(1);
    expect(Bun.file(actionsPath).size).toBeGreaterThan(0);
    expect(Bun.file(summaryPath).size).toBeGreaterThan(0);
  });

  test("completed runs are not valid continue targets", () => {
    const stashDir = makeTempDir("akm-dream-stale-continue-");
    const run = buildDreamRunRecord(stashDir, {
      sessionId: "dream-1",
      mode: "full",
      runId: "dream-1",
      phase: "phase3-review",
    });
    const completed = completeDreamRun(stashDir, run, "complete", "complete");
    saveDreamRun(stashDir, completed);
    saveDreamState(stashDir, {
      stashDir,
      activeRunId: null,
      lastRunId: completed.runId,
      updatedAt: completed.updatedAt,
    });

    const persisted = loadDreamRun(stashDir, completed.runId);
    expect(persisted?.status).toBe("complete");
    expect(persisted?.phase).toBe("complete");
    expect(persisted?.status === "waiting" && persisted.phase === "phase3-review").toBe(false);
    expect(fs.existsSync(path.join(stashDir, ".akm-dream", "state.json"))).toBe(true);
  });
});
