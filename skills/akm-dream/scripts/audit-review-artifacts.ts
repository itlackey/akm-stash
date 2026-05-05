#!/usr/bin/env bun

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createRunReport,
  recordArtifact,
  reportArtifacts,
  reviewChecklistPath,
  runReportPath,
  updateCheckpoint,
  updateSummary,
  writeRunArtifacts,
} from "./lib/run-report.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function main(): void {
  const workDir = mkdtempSync(path.join(os.tmpdir(), "akm-dream-review-audit-"));
  const stashDir = workDir;
  try {
    let report = createRunReport({
      runId: "dream-audit",
      mode: "full",
      stashDir,
    });
    const artifacts = reportArtifacts(report);
    report = recordArtifact(report, {
      phase: "phase1-orient",
      label: "Phase 1 orient report",
      path: artifacts.orientPath,
      kind: "json",
    });
    report = recordArtifact(report, {
      phase: "phase2-gather",
      label: "Phase 2 signal report",
      path: artifacts.signalPath,
      kind: "json",
    });
    report = updateCheckpoint(report, "phase1-orient", { state: "completed" });
    report = updateCheckpoint(report, "phase2-gather", { state: "completed" });
    report = updateCheckpoint(report, "phase3-review", {
      state: "ready-for-review",
      notes: ["Awaiting operator approval before phase 4."],
    });
    report = updateSummary(report, {
      memoryCount: 5,
      signalCount: 2,
    });
    writeRunArtifacts(report);
    writeFileSync(artifacts.orientPath, "{}\n");
    writeFileSync(artifacts.signalPath, "{}\n");

    const reportPath = runReportPath(report.stateDir);
    const checklistPath = reviewChecklistPath(report.stateDir);

    assert(existsSync(reportPath), "run-report.json was not written");
    assert(existsSync(checklistPath), "review-checklist.md was not written");

    const persisted = JSON.parse(readFileSync(reportPath, "utf8")) as {
      checkpoints: Array<{ phase: string; state: string; approvalRequired: boolean }>;
      artifacts: Array<{ path: string }>;
      summary: { memoryCount: number; signalCount: number };
    };

    const phase3 = persisted.checkpoints.find((checkpoint) => checkpoint.phase === "phase3-review");
    assert(phase3?.state === "ready-for-review", "phase3 review gate state incorrect");
    assert(phase3?.approvalRequired === true, "phase3 review gate should require approval");
    assert(persisted.artifacts.length >= 2, "expected orient and signal artifacts to be recorded");
    assert(persisted.summary.memoryCount === 5, "memory count summary incorrect");
    assert(persisted.summary.signalCount === 2, "signal count summary incorrect");

    const checklist = readFileSync(checklistPath, "utf8");
    assert(checklist.includes("Dream Review Checklist"), "checklist title missing");
    assert(checklist.includes("Approval required before next phase: yes"), "approval language missing");

    console.log(
      JSON.stringify(
        {
          ok: true,
          checks: [
            "run-report-written",
            "review-checklist-written",
            "phase3-approval-gate",
            "artifact-registration",
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

main();
