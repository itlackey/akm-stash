import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { akm, hasNativeDream } from "../scripts/lib/akm.ts";
import { cleanupTempDirs, makeTempDir, writeFile } from "./helpers.ts";

const originalAkmBin = process.env.AKM_BIN;

beforeEach(() => {
  delete process.env.AKM_BIN;
});

afterEach(() => {
  if (originalAkmBin === undefined) delete process.env.AKM_BIN;
  else process.env.AKM_BIN = originalAkmBin;
  cleanupTempDirs();
});

describe("akm wrapper", () => {
  test("throws on structured error envelopes", async () => {
    const dir = makeTempDir("akm-dream-wrapper-");
    const fakeAkm = path.join(dir, "fake-akm");
    writeFile(
      fakeAkm,
      "#!/usr/bin/env bash\nprintf '%s' '{\"ok\":false,\"error\":\"boom\",\"hint\":\"do better\"}'\n",
    );
    fs.chmodSync(fakeAkm, 0o755);
    process.env.AKM_BIN = fakeAkm;

    await expect(akm(["info"])).rejects.toThrow("boom");
  });

  test("native dream detection probes help output", async () => {
    const dir = makeTempDir("akm-dream-wrapper-");
    const fakeAkm = path.join(dir, "fake-akm");
    writeFile(
      fakeAkm,
      "#!/usr/bin/env bash\nif [ \"$1\" = \"--help\" ]; then\n  printf '%s\n' '  dream    Run dream pipeline'\nelse\n  printf '%s' '{}'\nfi\n",
    );
    fs.chmodSync(fakeAkm, 0o755);
    process.env.AKM_BIN = fakeAkm;

    await expect(hasNativeDream()).resolves.toBe(true);
  });
});
