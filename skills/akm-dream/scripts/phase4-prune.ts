#!/usr/bin/env bun
/**
 * Phase 4 — Prune and rebuild the index.
 *
 * Regenerates `<stash>/memories/MEMORY.md` from the current state of
 * the memories directory. The output is an INDEX, not a dump:
 *
 *   - One line per memory: `- [name](memory:name) — short description`
 *   - Description is read from the memory's frontmatter `description`
 *     field, or falls back to the first non-frontmatter sentence.
 *   - Sections are organized by tag, then alphabetical.
 *   - Total length capped at 200 lines (the auto-dream startup-load
 *     threshold). Excess entries are dropped from the index but the
 *     underlying memory files stay where they are.
 *
 * After rewriting the index, calls `akm index` to refresh the FTS5
 * search index so the next `akm search` reflects the new state.
 *
 * Pass `--dry-run` to preview the new index without writing it.
 */

import { existsSync, statSync, writeFileSync } from "node:fs";
import { getStashDir, indexStash } from "./lib/akm.ts";
import { loadMemoryInventory } from "./lib/inventory.ts";
import { parseMemory } from "./lib/memory.ts";
import { memoryIndexPath } from "./lib/paths.ts";

const LINE_LIMIT = 200;
const HEADER_LINES = 4; // reserved for title + blurb + spacing

interface Entry {
  ref: string;
  name: string;
  description: string;
  tags: string[];
  ageDays: number; // smaller = newer; used for tie-breaking
}

interface RenderIndexResult {
  content: string;
  includedRefs: string[];
  droppedRefs: string[];
}

function firstSentence(body: string): string {
  // Strip headings, code fences, blank lines.
  const cleaned = body
    .replace(/```[\s\S]*?```/g, " ") // code fences
    .replace(/^#+\s+.*$/gm, " ") // headings
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  const m = cleaned.match(/^([^.!?]{0,200}[.!?])/);
  return (m ? m[1] : cleaned.slice(0, 160)).trim();
}

function descriptionFor(content: string): string {
  const parsed = parseMemory(content);
  const fmDesc = parsed.frontmatter.description;
  if (typeof fmDesc === "string" && fmDesc.trim()) return fmDesc.trim();
  return firstSentence(parsed.body);
}

function ageDaysFor(path: string | undefined): number {
  if (!path || !existsSync(path)) return Number.MAX_SAFE_INTEGER;
  try {
    const s = statSync(path);
    return Math.floor((Date.now() - s.mtimeMs) / (1000 * 60 * 60 * 24));
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

async function buildEntries(): Promise<Entry[]> {
  const stashDir = await getStashDir();
  const memories = loadMemoryInventory(stashDir);
  const entries: Entry[] = [];
  for (const m of memories) {
    const body = m.content;
    const parsed = parseMemory(body);
    const tags = Array.isArray(parsed.frontmatter.tags)
      ? (parsed.frontmatter.tags as string[]).filter(Boolean)
      : [];
    entries.push({
      ref: m.ref,
      name: m.name,
      description: descriptionFor(body) || (m.description ?? ""),
      tags: tags.length ? tags : ["uncategorized"],
      ageDays: ageDaysFor(m.path),
    });
  }
  return entries;
}

function renderIndex(entries: Entry[]): RenderIndexResult {
  // Group by primary tag (first one in frontmatter; fallback to "uncategorized").
  const byTag = new Map<string, Entry[]>();
  for (const e of entries) {
    const tag = e.tags[0] ?? "uncategorized";
    if (!byTag.has(tag)) byTag.set(tag, []);
    (byTag.get(tag) as Entry[]).push(e);
  }

  // Within each tag: newest-first (lower ageDays first), then alpha.
  for (const list of byTag.values()) {
    list.sort((a, b) => {
      if (a.ageDays !== b.ageDays) return a.ageDays - b.ageDays;
      return a.name.localeCompare(b.name);
    });
  }

  // Order tags: most-populated first, then alpha.
  const tags = Array.from(byTag.keys()).sort((a, b) => {
    const sizeDiff =
      (byTag.get(b) ?? []).length - (byTag.get(a) ?? []).length;
    if (sizeDiff !== 0) return sizeDiff;
    return a.localeCompare(b);
  });

  const today = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    "# MEMORY.md",
    "",
    `_Index of akm memories — regenerated ${today} by akm-dream._`,
    "",
  ];
  const includedRefs: string[] = [];
  const droppedRefs: string[] = [];
  const noteDroppedFrom = (startTagIndex: number, startEntryIndex = 0): void => {
    for (let tagIndex = startTagIndex; tagIndex < tags.length; tagIndex += 1) {
      const tagEntries = byTag.get(tags[tagIndex] as string) ?? [];
      for (const entry of tagEntries.slice(tagIndex === startTagIndex ? startEntryIndex : 0)) {
        droppedRefs.push(entry.ref);
      }
    }
  };

  let allowed = LINE_LIMIT - HEADER_LINES;
  for (let tagIndex = 0; tagIndex < tags.length; tagIndex += 1) {
    const tag = tags[tagIndex] as string;
    if (allowed <= 2) {
      noteDroppedFrom(tagIndex);
      break;
    }
    lines.push(`## ${tag}`);
    lines.push("");
    allowed -= 2;
    const tagEntries = byTag.get(tag) ?? [];
    for (let entryIndex = 0; entryIndex < tagEntries.length; entryIndex += 1) {
      const e = tagEntries[entryIndex] as Entry;
      if (allowed <= 1) {
        noteDroppedFrom(tagIndex, entryIndex);
        allowed = 0;
        break;
      }
      const desc = e.description ? ` — ${e.description}` : "";
      lines.push(`- \`${e.ref}\`${desc}`);
      includedRefs.push(e.ref);
      allowed--;
    }
    if (allowed <= 1) break;
    lines.push("");
    allowed--;
  }

  // Trim trailing blanks.
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  lines.push("");
  return {
    content: lines.join("\n"),
    includedRefs,
    droppedRefs,
  };
}

async function run(opts: { dryRun: boolean; skipIndex: boolean }): Promise<void> {
  const stashDir = await getStashDir();
  const indexPath = memoryIndexPath(stashDir);
  const entries = await buildEntries();
  const rendered = renderIndex(entries);
  const newIndex = rendered.content;

  if (opts.dryRun) {
    console.error(
      `[dry-run] would write ${newIndex.split("\n").length} lines to ${indexPath}`,
    );
    process.stdout.write(newIndex);
    return;
  }

  writeFileSync(indexPath, newIndex);
  const lineCount = newIndex.split("\n").length;
  console.error(
    `phase4-prune: wrote ${entries.length} entries / ${lineCount} lines to ${indexPath}`,
  );

  if (!opts.skipIndex) {
    console.error("phase4-prune: refreshing akm FTS5 index...");
    await indexStash(false);
    console.error("phase4-prune: index refreshed.");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        indexPath,
        entryCount: entries.length,
        includedEntryCount: rendered.includedRefs.length,
        droppedEntryCount: rendered.droppedRefs.length,
        droppedRefs: rendered.droppedRefs,
        lineCount,
        overLimit: lineCount > LINE_LIMIT,
        indexRefreshed: !opts.skipIndex,
      },
      null,
      2,
    ),
  );
}

if (import.meta.main) {
  const args = new Set(process.argv.slice(2));
  run({ dryRun: args.has("--dry-run"), skipIndex: args.has("--skip-index") }).catch(
    (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`phase4-prune failed: ${msg}`);
      process.exit(1);
    },
  );
}

export { buildEntries, renderIndex };
export type { Entry, RenderIndexResult };
