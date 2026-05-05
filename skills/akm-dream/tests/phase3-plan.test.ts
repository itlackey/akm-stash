import { describe, expect, test } from "bun:test";
import { buildPlan } from "../scripts/phase3-plan.ts";
import type { OrientReport } from "../scripts/phase1-orient.ts";
import type { SignalReport } from "../scripts/phase2-gather.ts";

function baseOrient(): OrientReport {
  return {
    generatedAt: "2026-05-05T00:00:00.000Z",
    stashDir: "/tmp/stash",
    memoryCount: 3,
    index: {
      exists: true,
      path: "/tmp/stash/memories/MEMORY.md",
      lineCount: 10,
      overLineLimit: false,
      brokenLinks: [],
      refsLinked: ["memory:release-process"],
    },
    memories: [
      {
        ref: "memory:release-process",
        name: "release-process",
        description: "Release process uses bun publish.",
        path: "/tmp/stash/memories/release-process.md",
        sizeBytes: 200,
        ageDays: 2,
        hasFrontmatter: true,
        tags: ["release"],
        signals: { relativeDates: [], internalRefs: [], externalUrls: [], approxAgeDays: 2 },
        linkedFromIndex: true,
      },
      {
        ref: "memory:release/process",
        name: "release/process",
        description: "Release process uses bun publish.",
        path: "/tmp/stash/memories/release/process.md",
        sizeBytes: 180,
        ageDays: 30,
        hasFrontmatter: true,
        tags: ["release"],
        signals: { relativeDates: [], internalRefs: [], externalUrls: [], approxAgeDays: 30 },
        linkedFromIndex: false,
      },
      {
        ref: "memory:legacy-deploy",
        name: "legacy-deploy",
        description: "Old deployment notes.",
        path: "/tmp/stash/memories/legacy-deploy.md",
        sizeBytes: 120,
        ageDays: 400,
        hasFrontmatter: true,
        tags: ["legacy"],
        signals: { relativeDates: ["last year"], internalRefs: [], externalUrls: [], approxAgeDays: 400 },
        linkedFromIndex: false,
      },
    ],
  };
}

describe("buildPlan", () => {
  test("produces update, merge, and stale-delete candidates deterministically", () => {
    const orient = baseOrient();
    const signal: SignalReport = {
      generatedAt: "2026-05-05T00:00:01.000Z",
      scannedSources: [],
      signalCount: 1,
      signals: [
        {
          source: "daily-log",
          file: "/tmp/stash/logs/2026/05/2026-05-05.md",
          line: 12,
          matchedPattern: "explicit-decision",
          excerpt: "We decided memory:release-process uses bun publish going forward.",
        },
      ],
    };

    const plan = buildPlan(orient, signal, { runId: "dream-test" });

    expect(plan.runId).toBe("dream-test");
    expect(plan.summary.operations.update).toBe(1);
    expect(plan.summary.operations["merge-into"]).toBe(1);
    expect(plan.summary.operations.delete).toBe(1);

    const update = plan.candidates.find((candidate) => candidate.operation === "update");
    expect(update?.targetRef).toBe("memory:release-process");
    expect(update?.approved).toBe(false);

    const merge = plan.candidates.find((candidate) => candidate.operation === "merge-into");
    expect(merge?.targetRef).toBe("memory:release-process");
    expect(merge?.sourceRefs).toEqual(["memory:release/process"]);

    const deletion = plan.candidates.find((candidate) => candidate.operation === "delete");
    expect(deletion?.targetRef).toBe("memory:legacy-deploy");
    expect(deletion?.approved).toBe(false);
  });

  test("marks contradiction-driven updates as review required", () => {
    const orient = baseOrient();
    const signal: SignalReport = {
      generatedAt: "2026-05-05T00:00:01.000Z",
      scannedSources: [],
      signalCount: 1,
      signals: [
        {
          source: "claude-transcript",
          file: "session.jsonl",
          line: 30,
          matchedPattern: "user-correction",
          excerpt: "Actually that's wrong: memory:release-process no longer uses npm publish.",
        },
      ],
    };

    const plan = buildPlan(orient, signal, { runId: "dream-test" });
    const update = plan.candidates.find((candidate) => candidate.operation === "update");

    expect(update?.targetRef).toBe("memory:release-process");
    expect(update?.indicators.contradiction).toBe(true);
    expect(update?.approved).toBe(false);
  });
});
