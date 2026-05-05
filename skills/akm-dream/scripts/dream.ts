#!/usr/bin/env bun
/**
 * dream.ts — orchestrate the four-phase Auto Dream pipeline.
 *
 * Three modes:
 *
 *   bun run scripts/dream.ts            # full pipeline (phases 1, 2, [pause], 3, 4)
 *   bun run scripts/dream.ts --continue # resume after agent has completed phase 3
 *   bun run scripts/dream.ts --auto     # run phases 1+2+4 only, skip the LLM phase
 *
 * The default flow is the interactive one: the orchestrator runs the
 * deterministic phases (1 and 2), prints the consolidation prompt, and
 * exits zero. The agent — Claude — then reads the JSON outputs in
 * /tmp/akm-dream/, performs phase 3 (merging, deduplicating, deleting),
 * and finally calls this script again with `--continue` to run phase 4.
 *
 * If the installed akm has a native `akm dream` (issue #302), we
 * delegate to it and stay out of the way.
 */

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hasNativeDream, getStashDir, akm } from "./lib/akm.ts";
import { acquireLock, refreshLock, releaseLock, LockHeldError } from "./lib/lock.ts";
import { dreamWorkDir, memoriesDir } from "./lib/paths.ts";
import { buildReport as orient } from "./phase1-orient.ts";
import { buildReport as gather } from "./phase2-gather.ts";

interface RunOptions {
  mode: "full" | "continue" | "auto";
  skipLock: boolean;
  skipBackup: boolean;
}

function parseArgs(): RunOptions {
  const argv = new Set(process.argv.slice(2));
  let mode: RunOptions["mode"] = "full";
  if (argv.has("--continue")) mode = "continue";
  else if (argv.has("--auto")) mode = "auto";
  return {
    mode,
    skipLock: argv.has("--skip-lock"),
    skipBackup: argv.has("--skip-backup"),
  };
}

function ensureWorkDir(): string {
  const dir = dreamWorkDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function dreamSessionId(workDir: string): string {
  const file = join(workDir, "session-id.txt");
  if (process.env.AKM_DREAM_SESSION_ID?.trim()) {
    const id = process.env.AKM_DREAM_SESSION_ID.trim();
    writeFileSync(file, `${id}\n`);
    return id;
  }
  if (existsSync(file)) {
    const id = readFileSync(file, "utf8").trim();
    if (id) return id;
  }
  const id = `dream-${Date.now()}`;
  writeFileSync(file, `${id}\n`);
  return id;
}

async function backupMemories(stashDir: string, workDir: string): Promise<string | null> {
  const source = memoriesDir(stashDir);
  if (!existsSync(source)) return null;
  const backupDir = join(workDir, "backup", "memories");
  try {
    mkdirSync(join(workDir, "backup"), { recursive: true });
    cpSync(source, backupDir, { recursive: true, force: true });
    return backupDir;
  } catch {
    return null;
  }
}

async function runOrientAndGather(workDir: string): Promise<{
  orientPath: string;
  signalPath: string;
}> {
  const orientPath = join(workDir, "orient.json");
  const signalPath = join(workDir, "signal.json");

  console.error("phase 1: orient — inventorying memories...");
  const orientReport = await orient();
  writeFileSync(orientPath, `${JSON.stringify(orientReport, null, 2)}\n`);
  console.error(
    `  → ${orientReport.memoryCount} memories, MEMORY.md ${
      orientReport.index.exists
        ? `${orientReport.index.lineCount} lines${
            orientReport.index.overLineLimit ? " (OVER LIMIT)" : ""
          }`
        : "missing"
    }`,
  );

  console.error("phase 2: gather signal — scanning logs and transcripts...");
  const signalReport = await gather();
  writeFileSync(signalPath, `${JSON.stringify(signalReport, null, 2)}\n`);
  console.error(
    `  → ${signalReport.signalCount} candidate signals across ${signalReport.scannedSources.length} sources`,
  );

  return { orientPath, signalPath };
}

function printConsolidationPrompt(orientPath: string, signalPath: string): void {
  const lines = [
    "",
    "================================================================",
    "phase 3: consolidate (LLM phase — agent action required)",
    "================================================================",
    "",
    `  inventory:  ${orientPath}`,
    `  signal:     ${signalPath}`,
    "",
    "Read both JSON files. For each candidate signal, decide:",
    "  - merge into an existing memory:<name>",
    "  - update an existing memory (correct contradicted fact)",
    "  - create a new memory (only if no good match exists)",
    "  - delete a stale memory (use scripts/forget.ts)",
    "  - skip (signal too thin)",
    "",
    "When ready to apply changes:",
    "  - akm show memory:<name> --format json --detail full   # read first",
    "  - akm remember --name <name> --force <<< '<content>'   # write/overwrite",
    "  - bun run scripts/forget.ts memory:<name>              # delete",
    "",
    "References to load if you want the full prompt:",
    "  references/dream-system-prompt.md",
    "  references/memory-format.md",
    "",
    "When phase 3 is done, finish with:",
    "  bun run scripts/dream.ts --continue",
    "",
  ];
  console.log(lines.join("\n"));
}

async function runPhase4(): Promise<void> {
  console.error("phase 4: prune & rebuild index...");
  // Inline import to keep the dependency surface obvious.
  const { renderIndex, buildEntries } = await import("./phase4-prune.ts");
  const { writeFileSync: write } = await import("node:fs");
  const { memoryIndexPath } = await import("./lib/paths.ts");
  const stashDir = await getStashDir();

  const entries = await buildEntries();
  const newIndex = renderIndex(entries);
  const indexPath = memoryIndexPath(stashDir);
  write(indexPath, newIndex);

  await akm(["index"]);
  console.error(
    `  → wrote ${entries.length} entries to ${indexPath}, refreshed FTS5 index`,
  );
}

async function main(): Promise<void> {
  const opts = parseArgs();

  // Defer to native command if available.
  if (await hasNativeDream()) {
    console.error("akm has a native `dream` command — delegating.");
    const out = await akm<unknown>(["dream", ...process.argv.slice(2)]);
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  const stashDir = await getStashDir();
  const workDir = ensureWorkDir();
  const sessionId = dreamSessionId(workDir);

  const acquireIfNeeded = (phase: string) => {
    if (opts.skipLock) return null;
    try {
      return acquireLock(stashDir, { sessionId, phase });
    } catch (err) {
      if (err instanceof LockHeldError) {
        console.error(`dream lock held: ${err.message}`);
        console.error(
          "If you're resuming the same dream, reuse the existing session. " +
            `Otherwise wait or delete ${stashDir}/.akm-dream.lock after confirming it is stale.`,
        );
        process.exit(75); // EX_TEMPFAIL
      }
      throw err;
    }
  };

  if (opts.mode === "continue") {
    // Phase 1+2 already happened. Just run phase 4.
    acquireIfNeeded("phase4");
    try {
      await runPhase4();
    } finally {
      if (!opts.skipLock) releaseLock(stashDir, sessionId);
    }
    return;
  }

  acquireIfNeeded("phase1");
  try {
    if (!opts.skipBackup) {
      const backupDir = await backupMemories(stashDir, workDir);
      console.error(
        backupDir
          ? `  → pre-dream memory snapshot copied to ${backupDir}`
          : "  → pre-dream memory snapshot skipped",
      );
    }

    const { orientPath, signalPath } = await runOrientAndGather(workDir);

    if (opts.mode === "auto") {
      console.error(
        "phase 3 skipped (--auto). Running phase 4 to prune index...",
      );
      await runPhase4();
      return;
    }

    if (!opts.skipLock) refreshLock(stashDir, { sessionId, phase: "phase3" });
    printConsolidationPrompt(orientPath, signalPath);
  } catch (err) {
    if (!opts.skipLock) releaseLock(stashDir, sessionId);
    throw err;
  }
}

if (import.meta.main) {
  main().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`dream failed: ${msg}`);
    process.exit(1);
  });
}
