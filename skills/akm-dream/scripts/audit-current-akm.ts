#!/usr/bin/env bun

import { fileURLToPath } from "node:url";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const akmCli = process.env.AKM_AUDIT_CLI?.trim() || path.resolve(scriptDir, "..", "..", "..", "..", "akm", "src", "cli.ts");

function runCli(args: string[], options: { stashDir: string; input?: string }) {
  const xdgConfig = path.join(options.stashDir, "xdg-config");
  const xdgCache = path.join(options.stashDir, "xdg-cache");
  mkdirSync(xdgConfig, { recursive: true });
  mkdirSync(xdgCache, { recursive: true });
  return spawnSync("bun", [akmCli, ...args], {
    encoding: "utf8",
    input: options.input,
    timeout: 30_000,
    env: {
      ...process.env,
      AKM_STASH_DIR: options.stashDir,
      XDG_CONFIG_HOME: xdgConfig,
      XDG_CACHE_HOME: xdgCache,
    },
  });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function main(): void {
  const stashDir = mkdtempSync(path.join(os.tmpdir(), "akm-dream-audit-"));
  try {
    mkdirSync(path.join(stashDir, "memories"), { recursive: true });
    writeFileSync(
      path.join(stashDir, "memories", "release-process.md"),
      "---\ndescription: Release process note\ntags: [release]\n---\n\nWe switched to bun publish.\n",
      "utf8",
    );

    let result = runCli(["index", "--full"], { stashDir });
    assert(result.status === 0, `index failed: ${result.stderr}`);

    result = runCli(["search", "release", "--type", "memory", "--source", "stash", "--detail", "normal", "--format", "json"], {
      stashDir,
    });
    assert(result.status === 0, `search failed: ${result.stderr}`);
    const search = JSON.parse(result.stdout) as { hits: Array<Record<string, unknown>> };
    assert(search.hits.length === 1, "expected one memory hit from search");
    assert(search.hits[0]?.ref === undefined, "detail=normal unexpectedly exposed ref");

    result = runCli(["config", "path", "--all", "--format", "json"], { stashDir });
    assert(result.status === 0, `config path failed: ${result.stderr}`);
    const paths = JSON.parse(result.stdout) as Record<string, unknown>;
    assert(typeof paths.stash === "string", "config path --all did not return flat stash key");

    result = runCli(["remember", "--name", "stdin-probe", "--force"], {
      stashDir,
      input: "hello from stdin\n",
    });
    assert(result.status === 0, `remember stdin failed: ${result.stderr}`);
    const remembered = JSON.parse(result.stdout) as Record<string, unknown>;
    assert(remembered.ref === "memory:stdin-probe", "remember stdin did not create expected ref");

    result = runCli(["feedback", "memory:release-process", "--negative", "--note", "stale"], { stashDir });
    assert(result.status === 0, `feedback failed: ${result.stderr}`);

    result = runCli(["events", "list", "--type", "feedback", "--detail", "full", "--format", "json"], { stashDir });
    assert(result.status === 0, `events list failed: ${result.stderr}`);
    const events = JSON.parse(result.stdout) as { events?: Array<Record<string, unknown>> };
    assert(Array.isArray(events.events) && events.events.length > 0, "feedback event not found in events list");

    result = runCli(["info", "--format", "json"], { stashDir });
    assert(result.status === 0, `info failed: ${result.stderr}`);
    const info = JSON.parse(result.stdout) as Record<string, unknown>;
    assert(!("commands" in info), "info unexpectedly exposed commands list");

    console.log(
      JSON.stringify(
        {
          ok: true,
          auditedCli: akmCli,
          checks: [
            "search-normal-shape",
            "config-path-shape",
            "remember-stdin",
            "feedback-events",
            "info-shape",
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    rmSync(stashDir, { recursive: true, force: true });
  }
}

main();
