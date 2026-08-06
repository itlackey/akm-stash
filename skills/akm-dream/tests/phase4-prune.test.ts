import { describe, expect, test } from "bun:test";
import { renderIndex, type Entry } from "../scripts/phase4-prune.ts";

describe("phase4 renderIndex", () => {
  test("reports dropped refs when the index exceeds the line budget", () => {
    const entries: Entry[] = Array.from({ length: 220 }, (_, index) => ({
      ref: `memories/item-${index + 1}`,
      name: `item-${index + 1}`,
      description: `Description ${index + 1}`,
      tags: ["alpha"],
      ageDays: index,
    }));

    const result = renderIndex(entries);

    expect(result.includedRefs.length).toBeLessThan(entries.length);
    expect(result.droppedRefs.length).toBe(entries.length - result.includedRefs.length);
    expect(result.droppedRefs[0]).toMatch(/^memories\/item-/);
  });

  test("reports all remaining refs when budget runs out after a tag section", () => {
    const entries: Entry[] = [
      ...Array.from({ length: 192 }, (_, index) => ({
        ref: `memories/alpha-${index + 1}`,
        name: `alpha-${index + 1}`,
        description: `Alpha ${index + 1}`,
        tags: ["alpha"],
        ageDays: index,
      })),
      {
        ref: "memories/beta-1",
        name: "beta-1",
        description: "Beta 1",
        tags: ["beta"],
        ageDays: 0,
      },
      {
        ref: "memories/beta-2",
        name: "beta-2",
        description: "Beta 2",
        tags: ["beta"],
        ageDays: 1,
      },
    ];

    const result = renderIndex(entries);

    expect(result.includedRefs).not.toContain("memories/beta-1");
    expect(result.includedRefs).not.toContain("memories/beta-2");
    expect(result.droppedRefs).toEqual(["memories/beta-1", "memories/beta-2"]);
  });

  test("keeps all refs when content stays within the line budget", () => {
    const entries: Entry[] = [
      {
        ref: "memories/release-process",
        name: "release-process",
        description: "Release workflow note",
        tags: ["release"],
        ageDays: 0,
      },
      {
        ref: "memories/ci-pipeline",
        name: "ci-pipeline",
        description: "CI behavior",
        tags: ["release"],
        ageDays: 1,
      },
    ];

    const result = renderIndex(entries);

    expect(result.includedRefs).toEqual(["memories/release-process", "memories/ci-pipeline"]);
    expect(result.droppedRefs).toEqual([]);
    expect(result.content).toContain("memories/release-process");
  });
});
