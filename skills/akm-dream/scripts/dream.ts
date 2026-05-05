#!/usr/bin/env bun
/**
 * dream.ts — orchestrate the four-phase Auto Dream pipeline.
 *
 * Three modes:
 *
 *   bun run scripts/dream.ts            # full pipeline (phases 1, 2, [pause], 4)
 *   bun run scripts/dream.ts --continue # resume after agent has completed phase 3
 *   bun run scripts/dream.ts --auto     # run phases 1+2+4 only, skip the LLM phase
 *
 * The default flow is the interactive one: the orchestrator runs the
 * deterministic phases (1 and 2), prints the consolidation prompt, and
 * exits zero. The agent then reads the JSON outputs in
 * `<stash>/.akm-dream/runs/<run-id>/`, performs phase 3
 * (merging, deduplicating, deleting), and finally calls this script
 * again with `--continue` to run phase 4.
 */

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getStashDir, akm } from "./lib/akm.ts";
import { acquireLock, refreshLock, releaseLock, LockHeldError } from "./lib/lock.ts";
import { memoriesDir } from "./lib/paths.ts";
import {
  completeRun,
  createRunReport,
  loadRunReport,
  recordArtifact,
  reportArtifacts,
  syncArtifactToStateDir,
  updateCheckpoint,
  updateSummary,
  writeRunArtifacts,
  type DreamRunReport,
} from "./lib/run-report.ts";
import {
  backupMemoriesPath,
  completeDreamRun,
  ensureDreamRunDirs,
  loadDreamRun,
  loadDreamState,
  startDreamRun,
  updateDreamRun,
  type DreamRunRecord,
} from "./lib/state.ts";
import { buildReport as orient } from "./phase1-orient.ts";
import { buildReport as gather } from "./phase2-gather.ts";
import { buildPlan } from "./phase3-plan.ts";
import { applyPlan, renderApplySummary } from "./phase3-apply.ts";

interface RunOptions {
  mode: "full" | "continue" | "auto";
  skipLock: boolean;
  skipBackup: boolean;
  planOnly: boolean;
  dryRun: boolean;
}

interface ContinueContext {
  run: DreamRunRecord;
  sessionId: string;
  stashDir: string;
}

interface Phase4RunResult {
  entryCount: number;
  includedEntryCount: number;
  droppedEntryCount: number;
  droppedRefs: string[];
  indexPath: string;
  lineCount: number;
  indexRefreshed: boolean;
}

interface Phase3RunResult {
  ok: boolean;
  actionsPath: string;
  resultPath: string;
  summaryPath: string;
  summary: {
    created: number;
    updated: number;
    merged: number;
    deleted: number;
    skipped: number;
    failed: number;
  };
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
    planOnly: argv.has("--plan-only"),
    dryRun: argv.has("--dry-run"),
  };
}

function dreamSessionId(): string {
  return process.env.AKM_DREAM_SESSION_ID?.trim() || `dream-${Date.now()}`;
}

async function backupMemories(stashDir: string, backupDir: string): Promise<string | null> {
  const source = memoriesDir(stashDir);
  if (!existsSync(source)) return null;
  try {
    mkdirSync(join(backupDir, ".."), { recursive: true });
    cpSync(source, backupDir, { recursive: true, force: true });
    return backupDir;
  } catch {
    return null;
  }
}

async function runOrientAndGather(workDir: string): Promise<{
  orientPath: string;
  signalPath: string;
  planPath: string;
  memoryCount: number;
  signalCount: number;
  approvedCandidateCount: number;
}> {
  const orientPath = join(workDir, "orient.json");
  const signalPath = join(workDir, "signal.json");
  const planPath = join(workDir, "plan.json");

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

  console.error("phase 3a: plan — building deterministic candidate plan...");
  const planReport = buildPlan(orientReport, signalReport, { runId: process.env.AKM_DREAM_SESSION_ID?.trim() });
  writeFileSync(planPath, `${JSON.stringify(planReport, null, 2)}\n`);
  console.error(
    `  → ${planReport.summary.candidateCount} candidates (${planReport.summary.approvedCount} auto-approvable)`,
  );

  return {
    orientPath,
    signalPath,
    planPath,
    memoryCount: orientReport.memoryCount,
    signalCount: signalReport.signalCount,
    approvedCandidateCount: planReport.summary.approvedCount,
  };
}

function printConsolidationPrompt(
  orientPath: string,
  signalPath: string,
  planPath: string,
  reviewChecklistPath: string,
  runReportPath: string,
): void {
  const lines = [
    "",
    "================================================================",
    "phase 3: consolidate (review plan + controlled apply)",
    "================================================================",
    "",
    `  inventory:  ${orientPath}`,
    `  signal:     ${signalPath}`,
    `  plan:       ${planPath}`,
    `  checklist:  ${reviewChecklistPath}`,
    `  run report: ${runReportPath}`,
    "",
    "Review plan.json first. Preview or apply via the executor:",
    `  - bun run scripts/phase3-apply.ts --plan "${planPath}" --dry-run`,
    `  - bun run scripts/phase3-apply.ts --plan "${planPath}" --apply-approved`,
    `  - bun run scripts/phase3-apply.ts --plan "${planPath}" --apply-approved --include-unapproved --max-deletes 3`,
    "",
    "References to load if you want the full prompt:",
    "  references/dream-system-prompt.md",
    "  references/memory-format.md",
    "  references/review-flow.md",
    "",
    "Do not continue until the review checklist is satisfied.",
    "When phase 3 is done, finish with:",
    "  bun run scripts/dream.ts --continue",
    "",
  ];
  console.log(lines.join("\n"));
}

async function runPhase4(): Promise<Phase4RunResult> {
  console.error("phase 4: prune & rebuild index...");
  // Inline import to keep the dependency surface obvious.
  const { renderIndex, buildEntries } = await import("./phase4-prune.ts");
  const { writeFileSync: write } = await import("node:fs");
  const { memoryIndexPath } = await import("./lib/paths.ts");
  const stashDir = await getStashDir();

  const entries = await buildEntries();
  const rendered = renderIndex(entries);
  const newIndex = rendered.content;
  const indexPath = memoryIndexPath(stashDir);
  write(indexPath, newIndex);

  await akm(["index"]);
  console.error(
    `  → wrote ${entries.length} entries to ${indexPath}, refreshed FTS5 index`,
  );

  return {
    entryCount: entries.length,
    includedEntryCount: rendered.includedRefs.length,
    droppedEntryCount: rendered.droppedRefs.length,
    droppedRefs: rendered.droppedRefs,
    indexPath,
    lineCount: newIndex.split("\n").length,
    indexRefreshed: true,
  };
}

async function runPhase3Apply(report: DreamRunReport): Promise<Phase3RunResult> {
  const artifacts = reportArtifacts(report);
  if (existsSync(artifacts.resultPath) && existsSync(artifacts.actionsPath)) {
    const persisted = JSON.parse(readFileSync(artifacts.resultPath, "utf8")) as {
      ok: boolean;
      summary: Phase3RunResult["summary"];
    };
    return {
      ok: persisted.ok,
      actionsPath: artifacts.actionsPath,
      resultPath: artifacts.resultPath,
      summaryPath: artifacts.summaryPath,
      summary: persisted.summary,
    };
  }
  const plan = JSON.parse(readFileSync(artifacts.planPath, "utf8")) as import("./phase3-plan.ts").PlanReport;
  const result = await applyPlan(plan, {
    dryRun: false,
    applyApproved: true,
    includeUnapproved: false,
    noDelete: false,
    maxDeletes: 3,
    allowProtected: false,
    actionsPath: artifacts.actionsPath,
    resultPath: artifacts.resultPath,
  });
  writeFileSync(artifacts.summaryPath, `${renderApplySummary(result)}\n`);
  return {
    ok: result.ok,
    actionsPath: artifacts.actionsPath,
    resultPath: artifacts.resultPath,
    summaryPath: artifacts.summaryPath,
    summary: result.summary,
  };
}

function resolveContinueRun(stashDir: string): ContinueContext {
  const state = loadDreamState(stashDir);
  const runId = state?.activeRunId ?? state?.lastRunId;
  if (!runId) {
    throw new Error("no existing dream run found to continue");
  }
  const run = loadDreamRun(stashDir, runId);
  if (!run) {
    throw new Error(`dream run metadata missing for ${runId}`);
  }
  if (run.phase !== "phase3-review" || run.status !== "waiting") {
    throw new Error(
      `run ${run.runId} is not resumable (current phase=${run.phase}, status=${run.status})`,
    );
  }
  return { run, sessionId: run.sessionId, stashDir };
}

function initializeRunReport(
  workDir: string,
  stashDir: string,
  runId: string,
  mode: DreamRunRecord["mode"],
): DreamRunReport {
  const existing = loadRunReport(workDir);
  if (existing && existing.runId === runId) {
    return existing;
  }
  const report = createRunReport({
    runId,
    mode,
    stashDir,
  });
  writeRunArtifacts(report);
  return report;
}

async function main(): Promise<void> {
  const opts = parseArgs();

  const stashDir = await getStashDir();
  let run: DreamRunRecord | null = null;
  let sessionId = process.env.AKM_DREAM_SESSION_ID?.trim() || "";

  if (opts.mode === "continue") {
    const resolved = resolveContinueRun(stashDir);
    run = resolved.run;
    sessionId = resolved.sessionId;
  } else {
    sessionId = dreamSessionId();
  }

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

  const initialPhase = opts.mode === "continue" ? "phase3-review" : "phase1";
  acquireIfNeeded(initialPhase);

  if (!run) {
    run = startDreamRun(stashDir, {
      sessionId,
      mode: opts.mode,
      runId: sessionId,
    });
  }

  const workDir = ensureDreamRunDirs(stashDir, run.runId);
  let report = initializeRunReport(workDir, stashDir, run.runId, run.mode);

  if (opts.mode === "continue") {
    // Phase 1+2 already happened. Apply reviewed phase 3 plan, then run phase 4.
    try {
      if (run.status !== "waiting" || run.phase !== "phase3-review") {
        throw new Error(
          `run ${run.runId} is not waiting for approval (current phase=${run.phase}, status=${run.status})`,
        );
      }

      run = updateDreamRun(stashDir, run, { phase: "phase3-review", status: "running" });
      report = updateCheckpoint(report, "phase3-review", {
        state: "approved",
        notes: [
          "Operator resumed the run with --continue after reviewing the consolidation changes.",
        ],
      });
      writeRunArtifacts(report);

      const phase3Result = await runPhase3Apply(report);
      report = recordArtifact(report, {
        phase: "phase3-review",
        label: "Phase 3 actions log",
        path: phase3Result.actionsPath,
        kind: "json",
      });
      report = recordArtifact(report, {
        phase: "phase3-review",
        label: "Phase 3 result",
        path: phase3Result.resultPath,
        kind: "json",
      });
      report = recordArtifact(report, {
        phase: "phase3-review",
        label: "Phase 3 summary",
        path: phase3Result.summaryPath,
        kind: "markdown",
      });
      report = updateCheckpoint(report, "phase3-review", {
        state: phase3Result.ok ? "completed" : "approved",
        notes: [
          `Applied approved consolidation plan: created=${phase3Result.summary.created}, updated=${phase3Result.summary.updated}, merged=${phase3Result.summary.merged}, deleted=${phase3Result.summary.deleted}, skipped=${phase3Result.summary.skipped}, failed=${phase3Result.summary.failed}`,
        ],
      });
      writeRunArtifacts(report);

      if (!phase3Result.ok) {
        run = completeDreamRun(stashDir, run, "failed", "failed");
        throw new Error("phase 3 apply failed; see result.json and actions.jsonl for details");
      }

      run = updateDreamRun(stashDir, run, { phase: "phase4-prune", status: "running" });

      const phase4Result = await runPhase4();
      const phase4Path = reportArtifacts(report).phase4ResultPath;
      writeFileSync(phase4Path, `${JSON.stringify(phase4Result, null, 2)}\n`);
      report = recordArtifact(report, {
        phase: "phase4-prune",
        label: "Phase 4 result",
        path: phase4Path,
        kind: "json",
      });
      report = updateSummary(report, {
        phase4IncludedCount: phase4Result.includedEntryCount,
        phase4DroppedCount: phase4Result.droppedEntryCount,
        indexRefreshed: phase4Result.indexRefreshed,
      });
      report = updateCheckpoint(report, "phase4-prune", {
        state: "completed",
        notes: phase4Result.droppedRefs.length
          ? [
              `Dropped refs from MEMORY.md due to budget: ${phase4Result.droppedRefs.join(", ")}`,
            ]
          : ["No refs were dropped from MEMORY.md during phase 4."],
      });
      report = completeRun(report);
      writeRunArtifacts(report);
      run = completeDreamRun(stashDir, run, "complete", "complete");
    } catch (err) {
      run = completeDreamRun(stashDir, run, "failed", "failed");
      throw err;
    } finally {
      if (!opts.skipLock) releaseLock(stashDir, sessionId);
    }
    return;
  }

  try {
    if (!opts.skipBackup) {
      const backupDir = await backupMemories(stashDir, backupMemoriesPath(stashDir, run.runId));
      if (backupDir) {
        run = updateDreamRun(stashDir, run, { backupDir });
        report = recordArtifact(report, {
          phase: "backup",
          label: "Pre-dream memories backup",
          path: backupDir,
          kind: "directory",
        });
        writeRunArtifacts(report);
      }
      console.error(
        backupDir
          ? `  → pre-dream memory snapshot copied to ${backupDir}`
          : "  → pre-dream memory snapshot skipped",
      );
    }

    const { orientPath, signalPath, planPath, memoryCount, signalCount, approvedCandidateCount } = await runOrientAndGather(workDir);
    const durableOrientPath = syncArtifactToStateDir(report, "orient.json");
    const durableSignalPath = syncArtifactToStateDir(report, "signal.json");
    const durablePlanPath = syncArtifactToStateDir(report, "plan.json");
    report = recordArtifact(report, {
      phase: "phase1-orient",
      label: "Phase 1 orient report",
      path: durableOrientPath,
      kind: "json",
    });
    report = updateCheckpoint(report, "phase1-orient", {
      state: "completed",
    });
    report = recordArtifact(report, {
      phase: "phase2-gather",
      label: "Phase 2 signal report",
      path: durableSignalPath,
      kind: "json",
    });
    report = updateCheckpoint(report, "phase2-gather", {
      state: "completed",
    });
    report = recordArtifact(report, {
      phase: "phase3-plan",
      label: "Phase 3 deterministic plan",
      path: durablePlanPath,
      kind: "json",
    });
    report = updateCheckpoint(report, "phase3-plan", {
      state: "completed",
      notes: [`${approvedCandidateCount} candidates are marked auto-approvable by the planner.`],
    });
    report = updateSummary(report, { memoryCount, signalCount });
    writeRunArtifacts(report);

    if (opts.planOnly || opts.dryRun) {
      run = updateDreamRun(stashDir, run, { phase: "phase3-review", status: "waiting" });
      report = updateCheckpoint(report, "phase3-review", {
        state: "ready-for-review",
        notes: [
          opts.planOnly
            ? "Run stopped after deterministic planning (--plan-only)."
            : "Run stopped after deterministic planning (--dry-run).",
        ],
      });
      writeRunArtifacts(report);
      console.error(`phase 3 plan ready at ${planPath}`);
      if (!opts.skipLock) releaseLock(stashDir, sessionId);
      return;
    }

    if (opts.mode === "auto") {
      console.error(
        "phase 3 skipped (--auto). Running phase 4 to prune index...",
      );
      run = updateDreamRun(stashDir, run, { phase: "phase4-prune", status: "running" });
      report = updateCheckpoint(report, "phase3-review", {
        state: "skipped",
        notes: ["Phase 3 review was intentionally skipped because --auto was used."],
      });
      writeRunArtifacts(report);

      const phase4Result = await runPhase4();
      const phase4Path = reportArtifacts(report).phase4ResultPath;
      writeFileSync(phase4Path, `${JSON.stringify(phase4Result, null, 2)}\n`);
      report = recordArtifact(report, {
        phase: "phase4-prune",
        label: "Phase 4 result",
        path: phase4Path,
        kind: "json",
      });
      report = updateSummary(report, {
        phase4IncludedCount: phase4Result.includedEntryCount,
        phase4DroppedCount: phase4Result.droppedEntryCount,
        indexRefreshed: phase4Result.indexRefreshed,
      });
      report = updateCheckpoint(report, "phase4-prune", {
        state: "completed",
        notes: phase4Result.droppedRefs.length
          ? [
              `Dropped refs from MEMORY.md due to budget: ${phase4Result.droppedRefs.join(", ")}`,
            ]
          : ["No refs were dropped from MEMORY.md during phase 4."],
      });
      report = completeRun(report);
      writeRunArtifacts(report);
      run = completeDreamRun(stashDir, run, "complete", "complete");
      return;
    }

    if (!opts.skipLock) refreshLock(stashDir, { sessionId, phase: "phase3" });
    run = updateDreamRun(stashDir, run, { phase: "phase3-review", status: "waiting" });
    report = recordArtifact(report, {
      phase: "phase3-review",
      label: "Phase 3 review checklist",
      path: reportArtifacts(report).reviewChecklistPath,
      kind: "markdown",
    });
    report = updateCheckpoint(report, "phase3-review", {
      state: "ready-for-review",
      notes: [
        "Review and approve consolidation actions before running --continue.",
      ],
    });
    writeRunArtifacts(report);
    printConsolidationPrompt(
      durableOrientPath,
      durableSignalPath,
      durablePlanPath,
      reportArtifacts(report).reviewChecklistPath,
      reportArtifacts(report).runReportPath,
    );
  } catch (err) {
    run = completeDreamRun(stashDir, run, "failed", "failed");
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
