import { describe, expect, test } from "bun:test";
import { isInside } from "../scripts/lib/paths.ts";

describe("isInside", () => {
  test("allows paths within root", () => {
    expect(isInside("/tmp/root", "/tmp/root/memories/a.md")).toBe(true);
  });

  test("rejects traversal outside root", () => {
    expect(isInside("/tmp/root", "/tmp/root/../other/a.md")).toBe(false);
  });
});
