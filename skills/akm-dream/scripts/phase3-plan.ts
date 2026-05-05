#!/usr/bin/env bun

import { readFileSync, writeFileSync } from "node:fs";
import type { OrientReport, MemoryReport } from "./phase1-orient.ts";
import type { Signal, SignalReport } from "./phase2-gather.ts";
import { slugify } from "./lib/memory.ts";

type PlanOperation = "create" | "update" | "merge-into" | "delete" | "skip";

interface PlanEvidence {
  kind: "signal" | "memory";
  source: string;
  excerpt: string;
  line?: number;
  ref?: string;
}

interface PlanIndicators {
  contradiction: boolean;
  duplicate: boolean;
  stale: boolean;
}

interface PlanCandidate {
  id: string;
  operation: PlanOperation;
  targetRef?: string;
  targetName?: string;
  sourceRefs?: string[];
  proposedName?: string;
  proposedDescription?: string;
  approved: boolean;
  confidence: number;
  rationale: string;
  protected: boolean;
  protectionReasons: string[];
  indicators: PlanIndicators;
  evidence: PlanEvidence[];
}

interface PlanSummary {
  candidateCount: number;
  approvedCount: number;
  protectedCount: number;
  destructiveCount: number;
  operations: Record<PlanOperation, number>;
}

interface PlanReport {
  generatedAt: string;
  runId: string;
  planVersion: number;
  inputs: {
    stashDir: string;
    memoryCount: number;
    signalCount: number;
  };
  summary: PlanSummary;
  candidates: PlanCandidate[];
}

interface PlanOptions {
  runId?: string;
}

const STOPWORDS = new Set([
  "about",
  "actually",
  "after",
  "again",
  "also",
  "always",
  "because",
  "before",
  "being",
  "chose",
  "decided",
  "decision",
  "from",
  "going",
  "have",
  "into",
  "just",
  "last",
  "lets",
  "memory",
  "more",
  "never",
  "remember",
  "save",
  "should",
  "that",
  "their",
  "them",
  "there",
  "this",
  "those",
  "through",
  "today",
  "update",
  "using",
  "very",
  "were",
  "what",
  "when",
  "with",
  "would",
  "wrong",
]);

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function normalizeComparable(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_#]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      normalizeComparable(text)
        .split(" ")
        .filter((token) => token.length >= 3 && !STOPWORDS.has(token)),
    ),
  );
}

function compactExcerpt(text: string, max = 180): string {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length <= max ? compact : `${compact.slice(0, max - 3)}...`;
}

function memoryProtectionReasons(memory: MemoryReport): string[] {
  const reasons: string[] = [];
  if (memory.linkedFromIndex) reasons.push("linked-from-index");
  if (memory.tags.some((tag) => /^(canonical|protected|policy)$/i.test(tag))) {
    reasons.push("protected-tag");
  }
  if (memory.signals.internalRefs.some((ref) => !ref.startsWith("memory:"))) {
    reasons.push("references-non-memory-assets");
  }
  return reasons;
}

function candidateId(operation: PlanOperation, key: string): string {
  return `${operation}:${key}`;
}

function explicitMemoryRefs(signal: Signal): string[] {
  return Array.from(
    new Set(signal.excerpt.match(/\bmemory:[a-zA-Z0-9._\/-]+/g) ?? []),
  );
}

function signalBaseConfidence(signal: Signal): number {
  switch (signal.matchedPattern) {
    case "convention":
    case "permanence":
      return 0.88;
    case "explicit-decision":
      return 0.82;
    case "save-to-memory":
    case "akm-remember":
      return 0.78;
    case "user-correction":
      return 0.68;
    default:
      return 0.6;
  }
}

function memoryMatchScore(memory: MemoryReport, signal: Signal): number {
  const signalText = normalizeComparable(signal.excerpt);
  const nameText = normalizeComparable(memory.name.replaceAll("/", " "));
  const descText = normalizeComparable(memory.description ?? "");
  let score = 0;

  if (nameText && signalText.includes(nameText)) score += 4;
  if (descText && descText.length >= 12 && signalText.includes(descText)) score += 5;

  const signalTokens = new Set(tokenize(signal.excerpt));
  const memoryTokens = tokenize(`${memory.name.replaceAll("/", " ")} ${memory.description ?? ""}`);
  for (const token of memoryTokens) {
    if (signalTokens.has(token)) score += 1;
  }

  return score;
}

function bestSignalMatch(
  signal: Signal,
  memories: MemoryReport[],
): { memory: MemoryReport; confidence: number } | null {
  const ranked = memories
    .map((memory) => ({ memory, score: memoryMatchScore(memory, signal) }))
    .filter((entry) => entry.score >= 2)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return a.memory.ref.localeCompare(b.memory.ref);
    });

  const best = ranked[0];
  if (!best) return null;
  const runnerUp = ranked[1];
  if (runnerUp && best.score === runnerUp.score) return null;
  const confidence = clampConfidence(signalBaseConfidence(signal) + Math.min(best.score, 5) * 0.04);
  return { memory: best.memory, confidence };
}

function deriveCreateName(signal: Signal): string {
  const explicit = explicitMemoryRefs(signal)[0];
  if (explicit) return explicit.replace(/^memory:/, "");

  const tokens = tokenize(signal.excerpt).slice(0, 6);
  const name = slugify(tokens.join("-"));
  if (name) return name;
  return slugify(`${signal.matchedPattern}-${signal.line || 0}`);
}

function duplicateKey(memory: MemoryReport): string {
  const source = memory.description?.trim() || memory.name.replaceAll("/", " ");
  return normalizeComparable(source);
}

function canonicalMemory(memories: MemoryReport[]): MemoryReport {
  return [...memories].sort((a, b) => {
    const aProtected = memoryProtectionReasons(a).length > 0 ? 1 : 0;
    const bProtected = memoryProtectionReasons(b).length > 0 ? 1 : 0;
    if (aProtected !== bProtected) return bProtected - aProtected;
    if (a.linkedFromIndex !== b.linkedFromIndex) return Number(b.linkedFromIndex) - Number(a.linkedFromIndex);
    const aAge = a.ageDays ?? Number.MAX_SAFE_INTEGER;
    const bAge = b.ageDays ?? Number.MAX_SAFE_INTEGER;
    if (aAge !== bAge) return aAge - bAge;
    if (a.name.length !== b.name.length) return a.name.length - b.name.length;
    return a.ref.localeCompare(b.ref);
  })[0] as MemoryReport;
}

function staleConfidence(memory: MemoryReport): number {
  const age = memory.ageDays ?? memory.signals.approxAgeDays ?? 0;
  if (age >= 365) return 0.74;
  if (age >= 180 && memory.signals.relativeDates.length > 0) return 0.62;
  return 0.52;
}

function candidateSortKey(candidate: PlanCandidate): string {
  const order = {
    update: 0,
    create: 1,
    "merge-into": 2,
    delete: 3,
    skip: 4,
  } satisfies Record<PlanOperation, number>;
  return `${String(order[candidate.operation]).padStart(2, "0")}:${candidate.targetRef ?? candidate.proposedName ?? candidate.id}`;
}

function finalizeSummary(candidates: PlanCandidate[]): PlanSummary {
  const operations: Record<PlanOperation, number> = {
    create: 0,
    update: 0,
    "merge-into": 0,
    delete: 0,
    skip: 0,
  };
  for (const candidate of candidates) {
    operations[candidate.operation] += 1;
  }
  return {
    candidateCount: candidates.length,
    approvedCount: candidates.filter((candidate) => candidate.approved).length,
    protectedCount: candidates.filter((candidate) => candidate.protected).length,
    destructiveCount: candidates.filter(
      (candidate) => candidate.operation === "delete" || candidate.operation === "merge-into",
    ).length,
    operations,
  };
}

function buildDuplicateCandidates(memories: MemoryReport[]): PlanCandidate[] {
  const groups = new Map<string, MemoryReport[]>();
  for (const memory of memories) {
    const key = duplicateKey(memory);
    if (key.length < 12) continue;
    if (!groups.has(key)) groups.set(key, []);
    (groups.get(key) as MemoryReport[]).push(memory);
  }

  const candidates: PlanCandidate[] = [];
  for (const [key, group] of groups.entries()) {
    if (group.length < 2) continue;
    const canonical = canonicalMemory(group);
    for (const memory of group) {
      if (memory.ref === canonical.ref) continue;
      const protectionReasons = Array.from(
        new Set([...memoryProtectionReasons(canonical), ...memoryProtectionReasons(memory)]),
      );
      candidates.push({
        id: candidateId("merge-into", `${canonical.ref}:${memory.ref}`),
        operation: "merge-into",
        targetRef: canonical.ref,
        sourceRefs: [memory.ref],
        targetName: canonical.name,
        approved: false,
        confidence: clampConfidence(memory.description === canonical.description ? 0.84 : 0.7),
        rationale: `Merge duplicate memory ${memory.ref} into ${canonical.ref}; both share the same deterministic description/name signature (${key}).`,
        protected: protectionReasons.length > 0,
        protectionReasons,
        indicators: {
          contradiction: false,
          duplicate: true,
          stale: false,
        },
        evidence: [
          {
            kind: "memory",
            source: memory.path ?? memory.ref,
            ref: memory.ref,
            excerpt: compactExcerpt(memory.description ?? memory.name),
          },
          {
            kind: "memory",
            source: canonical.path ?? canonical.ref,
            ref: canonical.ref,
            excerpt: compactExcerpt(canonical.description ?? canonical.name),
          },
        ],
      });
    }
  }
  return candidates;
}

function buildStaleCandidates(memories: MemoryReport[]): PlanCandidate[] {
  return memories
    .filter((memory) => {
      const age = memory.ageDays ?? memory.signals.approxAgeDays ?? 0;
      return age >= 180 && !memory.linkedFromIndex && memory.signals.internalRefs.length === 0;
    })
    .map((memory) => {
      const protectionReasons = memoryProtectionReasons(memory);
      return {
        id: candidateId("delete", memory.ref),
        operation: "delete",
        targetRef: memory.ref,
        targetName: memory.name,
        approved: false,
        confidence: staleConfidence(memory),
        rationale: `Delete stale memory ${memory.ref}; it is old, unindexed, and not linked to other memories.`,
        protected: protectionReasons.length > 0,
        protectionReasons,
        indicators: {
          contradiction: false,
          duplicate: false,
          stale: true,
        },
        evidence: [
          {
            kind: "memory",
            source: memory.path ?? memory.ref,
            ref: memory.ref,
            excerpt: compactExcerpt(
              `${memory.description ?? memory.name} | age=${String(memory.ageDays ?? memory.signals.approxAgeDays ?? "unknown")}d | relative-dates=${memory.signals.relativeDates.join(", ") || "none"}`,
            ),
          },
        ],
      } satisfies PlanCandidate;
    });
}

function addSignalCandidate(
  candidateMap: Map<string, PlanCandidate>,
  candidate: Omit<PlanCandidate, "evidence">,
  evidence: PlanEvidence,
): void {
  const existing = candidateMap.get(candidate.id);
  if (!existing) {
    candidateMap.set(candidate.id, {
      ...candidate,
      evidence: [evidence],
    });
    return;
  }

  if (!existing.evidence.some((item) => item.source === evidence.source && item.line === evidence.line && item.excerpt === evidence.excerpt)) {
    existing.evidence.push(evidence);
  }
  existing.confidence = clampConfidence(Math.max(existing.confidence, candidate.confidence));
  existing.approved = existing.approved || candidate.approved;
}

function buildSignalCandidates(orient: OrientReport, signalReport: SignalReport): PlanCandidate[] {
  const memories = orient.memories;
  const byRef = new Map(memories.map((memory) => [memory.ref, memory]));
  const candidateMap = new Map<string, PlanCandidate>();

  signalReport.signals.forEach((signal, index) => {
    const evidence: PlanEvidence = {
      kind: "signal",
      source: signal.file,
      line: signal.line,
      excerpt: compactExcerpt(signal.excerpt),
    };

    const refs = explicitMemoryRefs(signal).filter((ref) => byRef.has(ref));
    const explicitTarget = refs[0] ? (byRef.get(refs[0]) as MemoryReport) : null;
    const fuzzyTarget = explicitTarget ? null : bestSignalMatch(signal, memories);
    const target = explicitTarget ?? fuzzyTarget?.memory ?? null;
    const protectionReasons = target ? memoryProtectionReasons(target) : [];
    const contradiction = signal.matchedPattern === "user-correction";

    if (target) {
      const confidence = explicitTarget
        ? clampConfidence(signalBaseConfidence(signal) + 0.16)
        : (fuzzyTarget?.confidence ?? signalBaseConfidence(signal));
      addSignalCandidate(
        candidateMap,
        {
          id: candidateId("update", target.ref),
          operation: "update",
          targetRef: target.ref,
          targetName: target.name,
          proposedDescription: target.description ?? compactExcerpt(signal.excerpt, 120),
          approved: !contradiction && protectionReasons.length === 0 && confidence >= 0.78,
          confidence,
          rationale: contradiction
            ? `Update ${target.ref} because a recent signal explicitly contradicts its current state.`
            : `Update ${target.ref} because recent signals match its existing name/description.`,
          protected: protectionReasons.length > 0,
          protectionReasons,
          indicators: {
            contradiction,
            duplicate: false,
            stale: false,
          },
        },
        evidence,
      );
      return;
    }

    const proposedName = deriveCreateName(signal);
    if (proposedName) {
      const confidence = signalBaseConfidence(signal);
      addSignalCandidate(
        candidateMap,
        {
          id: candidateId("create", proposedName),
          operation: "create",
          proposedName,
          targetName: proposedName,
          proposedDescription: compactExcerpt(signal.excerpt, 120),
          approved: confidence >= 0.78,
          confidence,
          rationale: "Create a new memory because the signal carries durable information and did not match any existing memory deterministically.",
          protected: false,
          protectionReasons: [],
          indicators: {
            contradiction,
            duplicate: false,
            stale: false,
          },
        },
        evidence,
      );
      return;
    }

    candidateMap.set(candidateId("skip", String(index)), {
      id: candidateId("skip", String(index)),
      operation: "skip",
      approved: false,
      confidence: 0.2,
      rationale: `Skip signal ${index + 1}; no deterministic match or stable memory name was available.`,
      protected: false,
      protectionReasons: [],
      indicators: {
        contradiction,
        duplicate: false,
        stale: false,
      },
      evidence: [evidence],
    });
  });

  return Array.from(candidateMap.values());
}

function dedupeCandidates(candidates: PlanCandidate[]): PlanCandidate[] {
  const seenDeletes = new Set<string>();
  return candidates.filter((candidate) => {
    if (candidate.operation !== "delete" || !candidate.targetRef) return true;
    if (seenDeletes.has(candidate.targetRef)) return false;
    seenDeletes.add(candidate.targetRef);
    return true;
  });
}

function buildPlan(orient: OrientReport, signalReport: SignalReport, options: PlanOptions = {}): PlanReport {
  const runId = options.runId ?? `dream-${Date.now()}`;
  const candidates = dedupeCandidates([
    ...buildSignalCandidates(orient, signalReport),
    ...buildDuplicateCandidates(orient.memories),
    ...buildStaleCandidates(orient.memories),
  ]).sort((a, b) => candidateSortKey(a).localeCompare(candidateSortKey(b)));

  return {
    generatedAt: new Date().toISOString(),
    runId,
    planVersion: 1,
    inputs: {
      stashDir: orient.stashDir,
      memoryCount: orient.memoryCount,
      signalCount: signalReport.signalCount,
    },
    summary: finalizeSummary(candidates),
    candidates,
  };
}

function parseArgs(): {
  orientPath?: string;
  signalPath?: string;
  outPath?: string;
  runId?: string;
} {
  const argv = process.argv.slice(2);
  const take = (flag: string): string | undefined => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  return {
    orientPath: take("--orient"),
    signalPath: take("--signal"),
    outPath: take("--out"),
    runId: take("--run-id") ?? process.env.AKM_DREAM_SESSION_ID?.trim(),
  };
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

if (import.meta.main) {
  const args = parseArgs();
  if (!args.orientPath || !args.signalPath) {
    console.error("phase3-plan requires --orient <path> and --signal <path>");
    process.exit(2);
  }
  const plan = buildPlan(
    readJsonFile<OrientReport>(args.orientPath),
    readJsonFile<SignalReport>(args.signalPath),
    { runId: args.runId },
  );
  const output = `${JSON.stringify(plan, null, 2)}\n`;
  if (args.outPath) {
    writeFileSync(args.outPath, output);
  } else {
    process.stdout.write(output);
  }
}

export { buildPlan };
export type { PlanCandidate, PlanEvidence, PlanIndicators, PlanOperation, PlanReport, PlanSummary };
