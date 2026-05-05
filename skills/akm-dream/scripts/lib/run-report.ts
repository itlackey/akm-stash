import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import {
  dreamRunArtifactPath,
  dreamRunDir,
} from "./paths.ts";

export type DreamRunMode = "full" | "continue" | "auto";
export type DreamPhase =
  | "phase1-orient"
  | "phase2-gather"
  | "phase3-plan"
  | "phase3-review"
  | "phase4-prune";
export type DreamArtifactKind = "json" | "markdown" | "directory";
export type DreamCheckpointState =
  | "pending"
  | "ready-for-review"
  | "approved"
  | "completed"
  | "skipped";

export interface DreamRunArtifact {
  phase: DreamPhase | "backup";
  label: string;
  path: string;
  kind: DreamArtifactKind;
}

export interface DreamCheckpoint {
  phase: DreamPhase;
  state: DreamCheckpointState;
  approvalRequired: boolean;
  requiredArtifacts: string[];
  validationFocus: string[];
  notes: string[];
  reviewedAt: string | null;
}

export interface DreamRunSummary {
  memoryCount: number;
  signalCount: number;
  phase4IncludedCount: number;
  phase4DroppedCount: number;
  indexRefreshed: boolean;
}

export interface DreamRunReport {
  schemaVersion: "1.0.0";
  runId: string;
  mode: DreamRunMode;
  stashDir: string;
  stateDir: string;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  checkpoints: DreamCheckpoint[];
  artifacts: DreamRunArtifact[];
  summary: DreamRunSummary;
}

const RUN_REPORT_FILENAME = "run-report.json";
const REVIEW_CHECKLIST_FILENAME = "review-checklist.md";

function nowIso(): string {
  return new Date().toISOString();
}

function defaultCheckpoints(): DreamCheckpoint[] {
  return [
    {
      phase: "phase1-orient",
      state: "pending",
      approvalRequired: false,
      requiredArtifacts: ["orient.json"],
      validationFocus: [
        "Confirm inventory coverage and broken MEMORY.md links.",
        "Check whether protected or canonical refs appear at risk.",
      ],
      notes: [],
      reviewedAt: null,
    },
    {
      phase: "phase2-gather",
      state: "pending",
      approvalRequired: false,
      requiredArtifacts: ["signal.json"],
      validationFocus: [
        "Confirm signals are recent and specific enough to act on.",
        "Flag noisy transcript matches before consolidation starts.",
      ],
      notes: [],
      reviewedAt: null,
    },
    {
      phase: "phase3-plan",
      state: "pending",
      approvalRequired: false,
      requiredArtifacts: ["plan.json"],
      validationFocus: [
        "Inspect deterministic create/update/merge/delete candidates before review.",
        "Confirm protected refs and delete thresholds are surfaced clearly.",
      ],
      notes: [],
      reviewedAt: null,
    },
    {
      phase: "phase3-review",
      state: "pending",
      approvalRequired: true,
      requiredArtifacts: ["orient.json", "signal.json", "plan.json", "review-checklist.md"],
      validationFocus: [
        "Review every merge, delete, and contradiction fix before finalizing.",
        "Require explicit approval before phase 4 rewrites MEMORY.md and reindexes.",
      ],
      notes: [],
      reviewedAt: null,
    },
    {
      phase: "phase4-prune",
      state: "pending",
      approvalRequired: false,
      requiredArtifacts: ["phase4-result.json"],
      validationFocus: [
        "Verify MEMORY.md output stayed within budget.",
        "Inspect any dropped refs before considering the run complete.",
      ],
      notes: [],
      reviewedAt: null,
    },
  ];
}

export function runReportPath(workDir: string): string {
  return join(workDir, RUN_REPORT_FILENAME);
}

export function reviewChecklistPath(workDir: string): string {
  return join(workDir, REVIEW_CHECKLIST_FILENAME);
}

export function createRunReport(options: {
  runId: string;
  mode: DreamRunMode;
  stashDir: string;
}): DreamRunReport {
  const ts = nowIso();
  const stateDir = dreamRunDir(options.stashDir, options.runId);
  return {
    schemaVersion: "1.0.0",
    runId: options.runId,
    mode: options.mode,
    stashDir: options.stashDir,
    stateDir,
    startedAt: ts,
    updatedAt: ts,
    completedAt: null,
    checkpoints: defaultCheckpoints(),
    artifacts: [],
    summary: {
      memoryCount: 0,
      signalCount: 0,
      phase4IncludedCount: 0,
      phase4DroppedCount: 0,
      indexRefreshed: false,
    },
  };
}

export function loadRunReport(stateDir: string): DreamRunReport | null {
  const file = runReportPath(stateDir);
  if (!existsSync(file)) return null;
  const raw = readFileSync(file, "utf8");
  return JSON.parse(raw) as DreamRunReport;
}

export function recordArtifact(
  report: DreamRunReport,
  artifact: DreamRunArtifact,
): DreamRunReport {
  const artifacts = report.artifacts.filter(
    (existing) => !(existing.phase === artifact.phase && existing.path === artifact.path),
  );
  artifacts.push(artifact);
  return {
    ...report,
    updatedAt: nowIso(),
    artifacts,
  };
}

export function updateCheckpoint(
  report: DreamRunReport,
  phase: DreamPhase,
  changes: Partial<Omit<DreamCheckpoint, "phase">>,
): DreamRunReport {
  return {
    ...report,
    updatedAt: nowIso(),
    checkpoints: report.checkpoints.map((checkpoint) =>
      checkpoint.phase === phase
        ? {
            ...checkpoint,
            ...changes,
            reviewedAt:
              changes.state === "approved" || changes.state === "completed"
                ? nowIso()
                : changes.reviewedAt ?? checkpoint.reviewedAt,
          }
        : checkpoint,
    ),
  };
}

export function updateSummary(
  report: DreamRunReport,
  changes: Partial<DreamRunSummary>,
): DreamRunReport {
  return {
    ...report,
    updatedAt: nowIso(),
    summary: {
      ...report.summary,
      ...changes,
    },
  };
}

export function completeRun(report: DreamRunReport): DreamRunReport {
  const ts = nowIso();
  return {
    ...report,
    updatedAt: ts,
    completedAt: ts,
  };
}

export function renderReviewChecklist(report: DreamRunReport): string {
  const lines = [
    "# Dream Review Checklist",
    "",
    `Run: \`${report.runId}\``,
    `Mode: \`${report.mode}\``,
    `State dir: \`${report.stateDir}\``,
    "",
    "Use this checklist before advancing between phases.",
    "",
  ];

  for (const checkpoint of report.checkpoints) {
    lines.push(`## ${checkpoint.phase}`);
    lines.push("");
    lines.push(`- State: \`${checkpoint.state}\``);
    lines.push(
      `- Approval required before next phase: ${checkpoint.approvalRequired ? "yes" : "no"}`,
    );
    lines.push(
      `- Required artifacts: ${checkpoint.requiredArtifacts.map((name) => `\`${name}\``).join(", ")}`,
    );
    for (const item of checkpoint.validationFocus) {
      lines.push(`- [ ] ${item}`);
    }
    for (const note of checkpoint.notes) {
      lines.push(`- Note: ${note}`);
    }
    lines.push("");
  }

  lines.push(
    "Resuming with `bun run scripts/dream.ts --continue` records explicit approval that phase 3 review is complete.",
  );
  lines.push("");
  return lines.join("\n");
}

export function writeRunArtifacts(report: DreamRunReport): void {
  mkdirSync(report.stateDir, { recursive: true });

  const runReport = `${JSON.stringify(report, null, 2)}\n`;
  const reviewChecklist = renderReviewChecklist(report);

  writeFileSync(reportArtifacts(report).runReportPath, runReport);
  writeFileSync(reportArtifacts(report).reviewChecklistPath, reviewChecklist);
}

export function reportArtifacts(report: Pick<DreamRunReport, "stashDir" | "runId">): {
  runDir: string;
  runReportPath: string;
  reviewChecklistPath: string;
  orientPath: string;
  signalPath: string;
  phase4ResultPath: string;
  planPath: string;
  actionsPath: string;
  resultPath: string;
  summaryPath: string;
} {
  return {
    runDir: dreamRunDir(report.stashDir, report.runId),
    runReportPath: dreamRunArtifactPath(report.stashDir, report.runId, "run-report.json"),
    reviewChecklistPath: dreamRunArtifactPath(report.stashDir, report.runId, "review-checklist.md"),
    orientPath: dreamRunArtifactPath(report.stashDir, report.runId, "orient.json"),
    signalPath: dreamRunArtifactPath(report.stashDir, report.runId, "signal.json"),
    phase4ResultPath: dreamRunArtifactPath(report.stashDir, report.runId, "phase4-result.json"),
    planPath: dreamRunArtifactPath(report.stashDir, report.runId, "plan.json"),
    actionsPath: dreamRunArtifactPath(report.stashDir, report.runId, "actions.jsonl"),
    resultPath: dreamRunArtifactPath(report.stashDir, report.runId, "result.json"),
    summaryPath: dreamRunArtifactPath(report.stashDir, report.runId, "summary.md"),
  };
}

export function syncArtifactToStateDir(
  report: Pick<DreamRunReport, "stashDir" | "runId" | "stateDir">,
  fileName: string,
): string {
  const source = join(report.stateDir, fileName);
  const target = dreamRunArtifactPath(report.stashDir, report.runId, fileName);
  if (source === target) return target;
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  return target;
}
