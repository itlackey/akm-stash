import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  dreamRunArtifactPath,
  dreamRunBackupDir,
  dreamRunDir,
  dreamRunMetadataPath,
  dreamRunsDir,
  dreamStateDir,
  dreamStatePath,
} from "./paths.ts";

export type DreamPhase =
  | "phase1-orient"
  | "phase2-gather"
  | "phase3-plan"
  | "phase3-review"
  | "phase4-prune"
  | "complete"
  | "failed";

export interface DreamRunRecord {
  runId: string;
  stashDir: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  phase: DreamPhase;
  status: "running" | "waiting" | "complete" | "failed";
  mode: "full" | "continue" | "auto";
  backupDir: string | null;
  artifacts: {
    orientPath: string;
    signalPath: string;
    reviewChecklistPath: string;
    runReportPath: string;
    phase4ResultPath: string;
    planPath: string;
    actionsPath: string;
    resultPath: string;
    summaryPath: string;
  };
}

export interface DreamStateRecord {
  stashDir: string;
  activeRunId: string | null;
  lastRunId: string | null;
  updatedAt: string;
}

interface StartRunOptions {
  sessionId: string;
  mode: DreamRunRecord["mode"];
  phase?: DreamPhase;
  runId?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function ensureDreamStateDir(stashDir: string): string {
  const dir = dreamStateDir(stashDir);
  mkdirSync(dir, { recursive: true });
  mkdirSync(dreamRunsDir(stashDir), { recursive: true });
  return dir;
}

export function buildDreamRunRecord(
  stashDir: string,
  options: StartRunOptions,
): DreamRunRecord {
  const runId = options.runId ?? `dream-${Date.now()}`;
  const createdAt = nowIso();
  return {
    runId,
    stashDir,
    sessionId: options.sessionId,
    createdAt,
    updatedAt: createdAt,
    phase: options.phase ?? "phase1-orient",
    status: "running",
    mode: options.mode,
    backupDir: null,
    artifacts: {
      orientPath: dreamRunArtifactPath(stashDir, runId, "orient.json"),
      signalPath: dreamRunArtifactPath(stashDir, runId, "signal.json"),
      reviewChecklistPath: dreamRunArtifactPath(stashDir, runId, "review-checklist.md"),
      runReportPath: dreamRunArtifactPath(stashDir, runId, "run-report.json"),
      phase4ResultPath: dreamRunArtifactPath(stashDir, runId, "phase4-result.json"),
      planPath: dreamRunArtifactPath(stashDir, runId, "plan.json"),
      actionsPath: dreamRunArtifactPath(stashDir, runId, "actions.jsonl"),
      resultPath: dreamRunArtifactPath(stashDir, runId, "result.json"),
      summaryPath: dreamRunArtifactPath(stashDir, runId, "summary.md"),
    },
  };
}

export function loadDreamState(stashDir: string): DreamStateRecord | null {
  return readJson<DreamStateRecord>(dreamStatePath(stashDir));
}

export function saveDreamState(stashDir: string, state: DreamStateRecord): DreamStateRecord {
  ensureDreamStateDir(stashDir);
  const nextState: DreamStateRecord = {
    ...state,
    stashDir,
    updatedAt: nowIso(),
  };
  writeJson(dreamStatePath(stashDir), nextState);
  return nextState;
}

export function loadDreamRun(stashDir: string, runId: string): DreamRunRecord | null {
  return readJson<DreamRunRecord>(dreamRunMetadataPath(stashDir, runId));
}

export function saveDreamRun(stashDir: string, run: DreamRunRecord): DreamRunRecord {
  ensureDreamStateDir(stashDir);
  mkdirSync(dreamRunDir(stashDir, run.runId), { recursive: true });
  const nextRun: DreamRunRecord = {
    ...run,
    stashDir,
    updatedAt: nowIso(),
  };
  writeJson(dreamRunMetadataPath(stashDir, run.runId), nextRun);
  return nextRun;
}

export function startDreamRun(stashDir: string, options: StartRunOptions): DreamRunRecord {
  const run = saveDreamRun(stashDir, buildDreamRunRecord(stashDir, options));
  saveDreamState(stashDir, {
    stashDir,
    activeRunId: run.runId,
    lastRunId: run.runId,
    updatedAt: run.updatedAt,
  });
  return run;
}

export function updateDreamRun(
  stashDir: string,
  run: DreamRunRecord,
  patch: Partial<Omit<DreamRunRecord, "runId" | "stashDir" | "artifacts">> & {
    artifacts?: Partial<DreamRunRecord["artifacts"]>;
  },
): DreamRunRecord {
  const nextRun = saveDreamRun(stashDir, {
    ...run,
    ...patch,
    artifacts: patch.artifacts ? { ...run.artifacts, ...patch.artifacts } : run.artifacts,
  });
  const prevState = loadDreamState(stashDir);
  saveDreamState(stashDir, {
    stashDir,
    activeRunId:
      nextRun.status === "running" || nextRun.status === "waiting"
        ? nextRun.runId
        : prevState?.activeRunId === nextRun.runId
          ? null
          : prevState?.activeRunId ?? null,
    lastRunId: nextRun.runId,
    updatedAt: nextRun.updatedAt,
  });
  return nextRun;
}

export function resolveDreamRun(
  stashDir: string,
  sessionId: string,
): DreamRunRecord | null {
  const state = loadDreamState(stashDir);
  if (state?.activeRunId) {
    const active = loadDreamRun(stashDir, state.activeRunId);
    if (active?.sessionId === sessionId) return active;
  }
  if (state?.lastRunId) {
    const last = loadDreamRun(stashDir, state.lastRunId);
    if (last?.sessionId === sessionId) return last;
  }
  return null;
}

export function completeDreamRun(
  stashDir: string,
  run: DreamRunRecord,
  status: DreamRunRecord["status"],
  phase: DreamPhase,
): DreamRunRecord {
  return updateDreamRun(stashDir, run, { status, phase });
}

export function ensureDreamRunDirs(stashDir: string, runId: string): string {
  ensureDreamStateDir(stashDir);
  const dir = dreamRunDir(stashDir, runId);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function ensureDreamRunBackupDir(stashDir: string, runId: string): string {
  const dir = dreamRunBackupDir(stashDir, runId);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function dreamRunLabel(run: Pick<DreamRunRecord, "runId" | "phase" | "status">): string {
  return `${run.runId} (${run.phase}, ${run.status})`;
}

export function backupMemoriesPath(stashDir: string, runId: string): string {
  return join(ensureDreamRunBackupDir(stashDir, runId), "memories");
}
