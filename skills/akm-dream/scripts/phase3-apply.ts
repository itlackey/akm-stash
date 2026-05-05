#!/usr/bin/env bun

import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { forget, type ForgetResult } from "./forget.ts";
import { getStashDir, rememberMemory, showMemory, type MemoryShow } from "./lib/akm.ts";
import { parseMemory, today } from "./lib/memory.ts";
import { dreamRunsDir } from "./lib/paths.ts";
import { loadDreamState } from "./lib/state.ts";
import type { PlanCandidate, PlanEvidence, PlanReport } from "./phase3-plan.ts";

interface ApplyJournalEntry {
  ts: string;
  candidateId: string;
  operation: PlanCandidate["operation"];
  targetRef?: string;
  status: "applied" | "skipped" | "dry-run" | "failed";
  reason?: string;
}

interface ApplySummary {
  created: number;
  updated: number;
  merged: number;
  deleted: number;
  skipped: number;
  failed: number;
}

interface ApplyResult {
  ok: boolean;
  runId: string;
  applyMode: "dry-run" | "apply-approved";
  summary: ApplySummary;
  actionsPath?: string;
  resultPath?: string;
}

interface ApplyOptions {
  dryRun: boolean;
  applyApproved: boolean;
  includeUnapproved: boolean;
  noDelete: boolean;
  maxDeletes: number;
  allowProtected: boolean;
  actionsPath?: string;
  resultPath?: string;
  now?: string;
}

interface ApplyAdapters {
  showMemory: (ref: string) => Promise<MemoryShow | null>;
  rememberMemory: (name: string, content: string, force?: boolean) => Promise<{ ref: string }>;
  forgetMemory: (ref: string, options: { dryRun?: boolean; skipIndex?: boolean }) => Promise<ForgetResult>;
}

const defaultAdapters: ApplyAdapters = {
  showMemory,
  rememberMemory,
  forgetMemory: forget,
};

function parseArgs(): { planPath?: string } & ApplyOptions {
  const argv = process.argv.slice(2);
  const take = (flag: string): string | undefined => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  return {
    planPath: take("--plan"),
    dryRun: argv.includes("--dry-run") || !argv.includes("--apply-approved"),
    applyApproved: argv.includes("--apply-approved"),
    includeUnapproved: argv.includes("--include-unapproved"),
    noDelete: argv.includes("--no-delete"),
    maxDeletes: Number.parseInt(take("--max-deletes") ?? "0", 10) || 0,
    allowProtected: argv.includes("--allow-protected"),
    actionsPath: take("--actions"),
    resultPath: take("--result"),
  };
}

function marker(candidate: PlanCandidate): string {
  return `<!-- akm-dream:${candidate.id} -->`;
}

function yamlScalar(value: unknown): string {
  const text = String(value ?? "").replace(/"/g, '\\"');
  return `"${text}"`;
}

function renderFrontmatter(frontmatter: Record<string, unknown>): string {
  const lines: string[] = ["---"];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map((item) => yamlScalar(item)).join(", ")}]`);
      continue;
    }
    lines.push(`${key}: ${yamlScalar(value)}`);
  }
  lines.push("---", "");
  return lines.join("\n");
}

function evidenceLines(evidence: PlanEvidence[]): string[] {
  return evidence.map((item) => {
    const location = item.line ? `${item.source}:${item.line}` : item.source;
    return `- [${item.kind}] ${location} :: ${item.excerpt}`;
  });
}

function buildCreateContent(candidate: PlanCandidate, date: string): string {
  const description = candidate.proposedDescription ?? `Created by akm-dream from ${candidate.evidence.length} signal(s).`;
  const frontmatter = renderFrontmatter({
    description,
    created: date,
    updated: date,
  });
  const body = [
    marker(candidate),
    `# ${candidate.proposedName ?? candidate.targetName ?? "memory"}`,
    "",
    description,
    "",
    "## Evidence",
    ...evidenceLines(candidate.evidence),
    "",
  ].join("\n");
  return `${frontmatter}${body}`;
}

function buildUpdatedContent(existingContent: string, candidate: PlanCandidate, date: string): string {
  if (existingContent.includes(marker(candidate))) return existingContent;
  const parsed = parseMemory(existingContent);
  const frontmatter = {
    ...parsed.frontmatter,
    description:
      typeof parsed.frontmatter.description === "string" && parsed.frontmatter.description.trim()
        ? parsed.frontmatter.description
        : candidate.proposedDescription,
    created: parsed.frontmatter.created ?? date,
    updated: date,
  } satisfies Record<string, unknown>;
  const existingBody = parsed.body.trim();
  const addition = [
    marker(candidate),
    `## Dream Update ${date}`,
    "",
    candidate.rationale,
    "",
    "### Evidence",
    ...evidenceLines(candidate.evidence),
  ].join("\n");
  const body = [existingBody, addition].filter(Boolean).join("\n\n");
  return `${renderFrontmatter(frontmatter)}${body}\n`;
}

async function mergeContent(
  target: MemoryShow,
  sources: MemoryShow[],
  candidate: PlanCandidate,
  date: string,
): Promise<string> {
  const base = buildUpdatedContent(target.content ?? "", candidate, date).trimEnd();
  const block = [
    "",
    `## Consolidated Sources ${date}`,
    "",
    ...sources.flatMap((source) => [
      `### ${source.ref ?? source.name}`,
      "",
      `${(source.content ?? "").trim()}`,
      "",
    ]),
  ].join("\n");
  return `${base}${block}`.trimEnd() + "\n";
}

function logAction(
  actions: ApplyJournalEntry[],
  action: ApplyJournalEntry,
  actionsPath?: string,
): void {
  actions.push(action);
  if (actionsPath) appendFileSync(actionsPath, `${JSON.stringify(action)}\n`);
}

function shouldApply(candidate: PlanCandidate, options: ApplyOptions): { apply: boolean; reason?: string } {
  if (candidate.operation === "skip") {
    return { apply: false, reason: "planner marked candidate as skip" };
  }
  if (!candidate.approved && !options.includeUnapproved) {
    return { apply: false, reason: "candidate requires review" };
  }
  if (candidate.protected && !options.allowProtected) {
    return { apply: false, reason: `protected candidate (${candidate.protectionReasons.join(", ")})` };
  }
  if ((candidate.operation === "delete" || candidate.operation === "merge-into") && options.noDelete) {
    return { apply: false, reason: "deletes disabled by --no-delete" };
  }
  return { apply: true };
}

async function applyPlan(
  plan: PlanReport,
  options: ApplyOptions,
  adapters: ApplyAdapters = defaultAdapters,
): Promise<ApplyResult> {
  const actions: ApplyJournalEntry[] = [];
  const summary: ApplySummary = {
    created: 0,
    updated: 0,
    merged: 0,
    deleted: 0,
    skipped: 0,
    failed: 0,
  };
  const date = options.now ?? today();
  let deletesUsed = 0;

  if (options.actionsPath) writeFileSync(options.actionsPath, "");

  for (const candidate of plan.candidates) {
    const decision = shouldApply(candidate, options);
    if (!decision.apply) {
      summary.skipped += 1;
      logAction(
        actions,
        {
          ts: new Date().toISOString(),
          candidateId: candidate.id,
          operation: candidate.operation,
          targetRef: candidate.targetRef,
          status: "skipped",
          reason: decision.reason,
        },
        options.actionsPath,
      );
      continue;
    }

    const deleteCost = candidate.operation === "merge-into" ? candidate.sourceRefs?.length ?? 0 : candidate.operation === "delete" ? 1 : 0;
    if (deleteCost > 0 && deletesUsed + deleteCost > options.maxDeletes) {
      summary.skipped += 1;
      logAction(
        actions,
        {
          ts: new Date().toISOString(),
          candidateId: candidate.id,
          operation: candidate.operation,
          targetRef: candidate.targetRef,
          status: "skipped",
          reason: `delete budget exceeded (${deletesUsed}/${options.maxDeletes})`,
        },
        options.actionsPath,
      );
      continue;
    }

    const status = options.dryRun ? "dry-run" : "applied";

    try {
      if (candidate.operation === "create") {
        const content = buildCreateContent(candidate, date);
        if (!options.dryRun) {
          await adapters.rememberMemory(candidate.proposedName ?? candidate.targetName ?? candidate.id, content, true);
        }
        summary.created += 1;
      } else if (candidate.operation === "update") {
        if (!candidate.targetRef) throw new Error("update candidate missing targetRef");
        const current = await adapters.showMemory(candidate.targetRef);
        if (!current) throw new Error(`memory not found: ${candidate.targetRef}`);
        const content = buildUpdatedContent(current.content ?? "", candidate, date);
        if (!options.dryRun) {
          await adapters.rememberMemory(current.name, content, true);
        }
        summary.updated += 1;
      } else if (candidate.operation === "merge-into") {
        if (!candidate.targetRef) throw new Error("merge candidate missing targetRef");
        if (!candidate.sourceRefs?.length) throw new Error("merge candidate missing sourceRefs");
        const target = await adapters.showMemory(candidate.targetRef);
        if (!target) throw new Error(`memory not found: ${candidate.targetRef}`);
        const sources = await Promise.all(candidate.sourceRefs.map((ref) => adapters.showMemory(ref)));
        if (sources.some((source) => !source)) {
          throw new Error(`merge source missing for ${candidate.id}`);
        }
        const content = await mergeContent(target, sources as MemoryShow[], candidate, date);
        if (!options.dryRun) {
          await adapters.rememberMemory(target.name, content, true);
          for (const ref of candidate.sourceRefs) {
            const result = await adapters.forgetMemory(ref, { dryRun: false, skipIndex: true });
            if (!result.ok) throw new Error(result.reason ?? `failed to delete ${ref}`);
          }
        }
        deletesUsed += candidate.sourceRefs.length;
        summary.merged += 1;
        summary.deleted += candidate.sourceRefs.length;
      } else if (candidate.operation === "delete") {
        if (!candidate.targetRef) throw new Error("delete candidate missing targetRef");
        if (!options.dryRun) {
          const result = await adapters.forgetMemory(candidate.targetRef, { dryRun: false, skipIndex: true });
          if (!result.ok) throw new Error(result.reason ?? `failed to delete ${candidate.targetRef}`);
        }
        deletesUsed += 1;
        summary.deleted += 1;
      }

      logAction(
        actions,
        {
          ts: new Date().toISOString(),
          candidateId: candidate.id,
          operation: candidate.operation,
          targetRef: candidate.targetRef,
          status,
        },
        options.actionsPath,
      );
    } catch (error) {
      summary.failed += 1;
      logAction(
        actions,
        {
          ts: new Date().toISOString(),
          candidateId: candidate.id,
          operation: candidate.operation,
          targetRef: candidate.targetRef,
          status: "failed",
          reason: error instanceof Error ? error.message : String(error),
        },
        options.actionsPath,
      );
    }
  }

  const result: ApplyResult = {
    ok: summary.failed === 0,
    runId: plan.runId,
    applyMode: options.dryRun ? "dry-run" : "apply-approved",
    summary,
    actionsPath: options.actionsPath,
    resultPath: options.resultPath,
  };

  if (options.resultPath) {
    writeFileSync(options.resultPath, `${JSON.stringify(result, null, 2)}\n`);
  }

  return result;
}

function readPlan(filePath: string): PlanReport {
  return JSON.parse(readFileSync(filePath, "utf8")) as PlanReport;
}

function latestRunDir(stashDir: string): string {
  const state = loadDreamState(stashDir);
  const runId = state?.activeRunId ?? state?.lastRunId;
  if (!runId) {
    throw new Error(`no dream run recorded under ${dreamRunsDir(stashDir)}`);
  }
  return join(dreamRunsDir(stashDir), runId);
}

async function resolvePlanPath(planPath?: string): Promise<string> {
  if (planPath) return planPath;
  const stashDir = await getStashDir();
  return join(latestRunDir(stashDir), "plan.json");
}

function renderApplySummary(result: ApplyResult): string {
  const lines = [
    "# Dream Apply Summary",
    "",
    `Run: \`${result.runId}\``,
    `Mode: \`${result.applyMode}\``,
    `Status: ${result.ok ? "ok" : "failed"}`,
    "",
    "## Counts",
    "",
    `- created: ${result.summary.created}`,
    `- updated: ${result.summary.updated}`,
    `- merged: ${result.summary.merged}`,
    `- deleted: ${result.summary.deleted}`,
    `- skipped: ${result.summary.skipped}`,
    `- failed: ${result.summary.failed}`,
    "",
  ];
  return lines.join("\n");
}

if (import.meta.main) {
  const args = parseArgs();
  resolvePlanPath(args.planPath)
    .then((planPath) => {
      const planDir = join(planPath, "..");
      const actionsPath = args.actionsPath ?? join(planDir, "actions.jsonl");
      const resultPath = args.resultPath ?? join(planDir, "result.json");
      return applyPlan(readPlan(planPath), { ...args, actionsPath, resultPath }).then((result) => ({
        result,
        resultPath,
      }));
    })
    .then(({ result, resultPath }) => {
      const summaryPath = join(join(resultPath, ".."), "summary.md");
      writeFileSync(summaryPath, `${renderApplySummary(result)}\n`);
      console.log(JSON.stringify(result, null, 2));
      if (!result.ok) process.exit(1);
    })
    .catch((error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`phase3-apply failed: ${msg}`);
      process.exit(1);
    });
}

export { applyPlan, buildCreateContent, buildUpdatedContent };
export { renderApplySummary };
export type { ApplyAdapters, ApplyJournalEntry, ApplyOptions, ApplyResult, ApplySummary };
