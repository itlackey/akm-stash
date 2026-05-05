import { afterEach, describe, expect, test } from "bun:test";
import path from "node:path";
import { loadMemoryInventory } from "../scripts/lib/inventory.ts";
import { cleanupTempDirs, makeTempDir, writeFile } from "./helpers.ts";

afterEach(() => {
  cleanupTempDirs();
});

describe("loadMemoryInventory", () => {
  test("enumerates memories deterministically from disk", () => {
    const stashDir = makeTempDir("akm-dream-inventory-");
    writeFile(
      path.join(stashDir, "memories", "release", "process.md"),
      "---\ndescription: Release process\ntags: [release, ci]\n---\n\nUse bun publish.\n",
    );
    writeFile(path.join(stashDir, "memories", "MEMORY.md"), "# MEMORY\n");

    const entries = loadMemoryInventory(stashDir);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.name).toBe("release/process");
    expect(entries[0]?.ref).toBe("memory:release/process");
    expect(entries[0]?.description).toBe("Release process");
    expect(entries[0]?.tags).toEqual(["release", "ci"]);
  });
});
