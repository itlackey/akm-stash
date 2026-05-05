import { describe, expect, test } from "bun:test";
import {
  completeRun,
  createRunReport,
  recordArtifact,
  renderReviewChecklist,
  updateCheckpoint,
  updateSummary,
} from "../scripts/lib/run-report.ts";

describe("run report", () => {
  test("creates explicit staged review checkpoints", () => {
    const report = createRunReport({
      runId: "dream-123",
      mode: "full",
      stashDir: "/tmp/stash",
    });

    expect(report.checkpoints.map((checkpoint) => checkpoint.phase)).toEqual([
      "phase1-orient",
      "phase2-gather",
      "phase3-plan",
      "phase3-review",
      "phase4-prune",
    ]);
    expect(
      report.checkpoints.find((checkpoint) => checkpoint.phase === "phase3-review")
        ?.approvalRequired,
    ).toBe(true);
  });

  test("tracks artifacts, approval, and completion state", () => {
    let report = createRunReport({
      runId: "dream-123",
      mode: "full",
      stashDir: "/tmp/stash",
    });

    report = recordArtifact(report, {
      phase: "phase1-orient",
      label: "Orient output",
      path: "/tmp/stash/.akm-dream/orient.json",
      kind: "json",
    });
    report = updateCheckpoint(report, "phase3-review", {
      state: "approved",
      notes: ["Reviewed deletes before continuing."],
    });
    report = updateSummary(report, {
      memoryCount: 12,
      signalCount: 4,
      phase4DroppedCount: 1,
    });
    report = completeRun(report);

    expect(report.artifacts).toHaveLength(1);
    expect(
      report.checkpoints.find((checkpoint) => checkpoint.phase === "phase3-review")?.state,
    ).toBe("approved");
    expect(report.summary.phase4DroppedCount).toBe(1);
    expect(report.completedAt).not.toBeNull();
  });

  test("renders the review checklist with approval guidance", () => {
    const report = createRunReport({
      runId: "dream-123",
      mode: "full",
      stashDir: "/tmp/stash",
    });

    const markdown = renderReviewChecklist(report);

    expect(markdown).toContain("# Dream Review Checklist");
    expect(markdown).toContain("phase3-review");
    expect(markdown).toContain("Approval required before next phase: yes");
    expect(markdown).toContain("--continue");
  });
});
