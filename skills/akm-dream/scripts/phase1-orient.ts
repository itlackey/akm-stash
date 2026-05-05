#!/usr/bin/env bun
/**
 * Phase 1 — Orient.
 *
 * Inventory every memory currently in the stash. Output is JSON on stdout
 * and is intended to be redirected to a file the agent can read in phase 3.
 *
 * For each memory we report:
 *   - ref, name, file path, byte size, age (days since updated)
 *   - frontmatter presence and tags
 *   - relative-date phrase matches ("yesterday", "last week", ...)
 *   - internal refs the body links to
 *   - whether it's currently linked from MEMORY.md
 *
 * We also report the state of MEMORY.md itself: line count, broken
 * links, and whether it's over the 200-line startup-load threshold.
 *
 * This phase walks `<stash>/memories/` directly instead of relying on
 * `akm search`, because current akm search output is optimized for
 * retrieval/ranking rather than deterministic full-stash inventory.
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { getStashDir } from "./lib/akm.ts";
import { loadMemoryInventory } from "./lib/inventory.ts";
import {
  parseMemory,
  scanMemorySignals,
  type MemorySignals,
} from "./lib/memory.ts";
import { memoryIndexPath } from "./lib/paths.ts";

interface MemoryReport {
  ref: string;
  name: string;
  path: string | null;
  sizeBytes: number | null;
  ageDays: number | null;
  hasFrontmatter: boolean;
  tags: string[];
  signals: MemorySignals;
  linkedFromIndex: boolean;
}

interface IndexReport {
  exists: boolean;
  path: string;
  lineCount: number;
  overLineLimit: boolean;
  brokenLinks: string[];
  refsLinked: string[];
}

interface OrientReport {
  generatedAt: string;
  stashDir: string;
  memoryCount: number;
  index: IndexReport;
  memories: MemoryReport[];
}

const LINE_LIMIT = 200;

function ageDaysFromMtime(path: string): number | null {
  try {
    const s = statSync(path);
    return Math.floor((Date.now() - s.mtimeMs) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function inspectIndex(path: string, knownRefs: Set<string>): IndexReport {
  if (!existsSync(path)) {
    return {
      exists: false,
      path,
      lineCount: 0,
      overLineLimit: false,
      brokenLinks: [],
      refsLinked: [],
    };
  }
  const text = readFileSync(path, "utf8");
  const lines = text.split("\n");
  const refRe = /\b(memory):[a-zA-Z0-9._\/-]+/g;
  const found = Array.from(new Set(text.match(refRe) ?? []));
  const brokenLinks = found.filter((r) => !knownRefs.has(r));
  return {
    exists: true,
    path,
    lineCount: lines.length,
    overLineLimit: lines.length > LINE_LIMIT,
    brokenLinks,
    refsLinked: found,
  };
}

async function buildReport(): Promise<OrientReport> {
  const stashDir = await getStashDir();
  const memories = loadMemoryInventory(stashDir);

  const memoryReports: MemoryReport[] = [];
  const knownRefs = new Set<string>();

  for (const m of memories) {
    const path = m.path;
    const parsed = parseMemory(m.content);
    const signals = scanMemorySignals(parsed);
    const tags = Array.isArray(parsed.frontmatter.tags) ? (parsed.frontmatter.tags as string[]) : m.tags;

    const ageDays = ageDaysFromMtime(path);
    const sizeBytes = existsSync(path) ? statSync(path).size : m.sizeBytes;

    knownRefs.add(m.ref);
    memoryReports.push({
      ref: m.ref,
      name: m.name,
      path,
      sizeBytes,
      ageDays,
      hasFrontmatter: parsed.hasFrontmatter,
      tags,
      signals,
      linkedFromIndex: false, // filled in below
    });
  }

  const indexReport = inspectIndex(memoryIndexPath(stashDir), knownRefs);
  const linked = new Set(indexReport.refsLinked);
  for (const r of memoryReports) {
    r.linkedFromIndex = linked.has(r.ref);
  }

  return {
    generatedAt: new Date().toISOString(),
    stashDir,
    memoryCount: memoryReports.length,
    index: indexReport,
    memories: memoryReports,
  };
}

if (import.meta.main) {
  buildReport()
    .then((r) => {
      console.log(JSON.stringify(r, null, 2));
    })
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`phase1-orient failed: ${msg}`);
      process.exit(1);
    });
}

export { buildReport };
export type { OrientReport, MemoryReport, IndexReport };
