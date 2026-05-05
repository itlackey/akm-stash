import { describe, expect, test } from "bun:test";
import { renderIndex, type Entry } from "../scripts/phase4-prune.ts";

describe("phase4 renderIndex", () => {
  test("reports dropped refs when the index exceeds the line budget", () => {
    const entries: Entry[] = Array.from({ length: 220 }, (_, index) => ({
      ref: `memory:item-${index + 1}`,
      name: `item-${index + 1}`,
      description: `Description ${index + 1}`,
      tags: ["alpha"],
      ageDays: index,
    }));

    const result = renderIndex(entries);

    expect(result.includedRefs.length).toBeLessThan(entries.length);
    expect(result.droppedRefs.length).toBe(entries.length - result.includedRefs.length);
    expect(result.droppedRefs[0]).toMatch(/^memory:item-/);
  });

  test("keeps all refs when content stays within the line budget", () => {
    const entries: Entry[] = [
      {
        ref: "memory:release-process",
        name: "release-process",
        description: "Release workflow note",
        tags: ["release"],
        ageDays: 0,
      },
      {
        ref: "memory:ci-pipeline",
        name: "ci-pipeline",
        description: "CI behavior",
        tags: ["release"],
        ageDays: 1,
      },
    ];

    const result = renderIndex(entries);

    expect(result.includedRefs).toEqual(["memory:release-process", "memory:ci-pipeline"]);
    expect(result.droppedRefs).toEqual([]);
    expect(result.content).toContain("memory:release-process");
  });
});
