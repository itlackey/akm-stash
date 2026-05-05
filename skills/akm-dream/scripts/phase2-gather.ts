#!/usr/bin/env bun
/**
 * Phase 2 — Gather signal.
 *
 * Find candidate facts that should be promoted into akm memories. We
 * scan, in priority order:
 *
 *   1. Daily logs at <stash>/logs/YYYY/MM/YYYY-MM-DD.md (most recent first).
 *   2. Claude Code session transcripts at ~/.claude/projects/<project>/*.jsonl
 *      — using narrow grep, never reading whole files.
 *   3. OpenCode session logs (if installed).
 *
 * We deliberately don't try to be clever about ranking — the agent
 * does that during phase 3. Our job is to surface high-recall candidate
 * lines with enough surrounding context to be intelligible.
 */

import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { join } from "node:path";
import { getStashDir, listFeedbackEvents } from "./lib/akm.ts";
import { dailyLogsDir, findSignalLocations } from "./lib/paths.ts";

interface Signal {
  source: "daily-log" | "akm-feedback" | "claude-transcript" | "opencode" | "stdin";
  file: string;
  line: number;
  matchedPattern: string;
  excerpt: string; // ~200 chars of surrounding text
  age?: { mtime: string; ageDays: number };
}

interface SignalReport {
  generatedAt: string;
  scannedSources: { kind: string; path: string | null; fileCount: number }[];
  signalCount: number;
  signals: Signal[];
}

// Patterns that consistently indicate "this is worth remembering".
// Kept narrow on purpose — broad patterns produce too much noise.
const SAVE_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "save-to-memory", re: /\b(save (this|that|to memory)|remember (this|that))\b/i },
  { name: "akm-remember", re: /\bakm remember\b/i },
  { name: "explicit-decision", re: /\b(we (decided|agreed|chose|switched|moved)|decision:)\b/i },
  { name: "user-correction", re: /\b(actually,? that('s| is) wrong|no,? that('s| is) wrong|let'?s not|nope,? )\b/i },
  { name: "permanence", re: /\b(from now on|going forward|never again|always remember)\b/i },
  { name: "won't-do", re: /\b(do not|don't) (do|use|run) /i },
  { name: "convention", re: /\b(convention|policy|standard):\s/i },
];

// Hard cap so phase 2 finishes quickly even on huge transcripts.
const MAX_SIGNALS_PER_FILE = 25;
const MAX_SIGNALS_TOTAL = 500;

function* listFiles(
  root: string,
  predicate: (name: string) => boolean,
  depth = 0,
): Generator<string> {
  if (depth > 6) return; // avoid runaway recursion
  let entries: string[] = [];
  try {
    entries = readdirSync(root);
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(root, e);
    let s: ReturnType<typeof statSync> | null = null;
    try {
      s = statSync(p);
    } catch {
      continue;
    }
    if (s.isDirectory()) {
      yield* listFiles(p, predicate, depth + 1);
    } else if (predicate(e)) {
      yield p;
    }
  }
}

function scanFile(
  file: string,
  source: Signal["source"],
  total: { count: number },
): Signal[] {
  if (total.count >= MAX_SIGNALS_TOTAL) return [];
  let text = "";
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return [];
  }
  const lines = text.split("\n");
  const out: Signal[] = [];
  let mtime = "";
  let ageDays = 0;
  try {
    const s = statSync(file);
    mtime = new Date(s.mtimeMs).toISOString();
    ageDays = Math.floor((Date.now() - s.mtimeMs) / (1000 * 60 * 60 * 24));
  } catch {
    // ignore — age is optional
  }

  for (let i = 0; i < lines.length; i++) {
    if (out.length >= MAX_SIGNALS_PER_FILE) break;
    if (total.count >= MAX_SIGNALS_TOTAL) break;
    const line = lines[i] ?? "";
    for (const { name, re } of SAVE_PATTERNS) {
      if (re.test(line)) {
        const start = Math.max(0, line.search(re) - 60);
        const excerpt = line.slice(start, start + 240).replace(/\s+/g, " ");
        out.push({
          source,
          file,
          line: i + 1,
          matchedPattern: name,
          excerpt,
          age: mtime ? { mtime, ageDays } : undefined,
        });
        total.count++;
        break;
      }
    }
  }
  return out;
}

async function scanFeedback(total: { count: number }): Promise<Signal[]> {
  if (total.count >= MAX_SIGNALS_TOTAL) return [];
  const events = await listFeedbackEvents(100);
  const signals: Signal[] = [];
  for (const event of events) {
    if (signals.length >= MAX_SIGNALS_PER_FILE || total.count >= MAX_SIGNALS_TOTAL) break;
    const signal = typeof event.metadata?.signal === "string" ? event.metadata.signal : "unknown";
    const note = typeof event.metadata?.note === "string" ? event.metadata.note : "";
    signals.push({
      source: "akm-feedback",
      file: "akm events list --type feedback",
      line: 0,
      matchedPattern: `feedback-${signal}`,
      excerpt: `${event.ref ?? "(unknown ref)"}${note ? ` — ${note}` : ""}`,
      age: event.ts
        ? {
            mtime: event.ts,
            ageDays: Math.max(0, Math.floor((Date.now() - Date.parse(event.ts)) / (1000 * 60 * 60 * 24))),
          }
        : undefined,
    });
    total.count++;
  }
  return signals;
}

async function buildReport(): Promise<SignalReport> {
  const stashDir = await getStashDir();
  const locs = findSignalLocations();
  const totals = { count: 0 };
  const signals: Signal[] = [];
  const scannedSources: SignalReport["scannedSources"] = [];

  // 1. Daily logs in the stash.
  const logsDir = dailyLogsDir(stashDir);
  if (logsDir) {
    const files = Array.from(listFiles(logsDir, (n) => n.endsWith(".md")))
      .sort()
      .reverse() // newest first by lexical date
      .slice(0, 30); // last ~30 logs is plenty
    scannedSources.push({
      kind: "daily-log",
      path: logsDir,
      fileCount: files.length,
    });
    for (const f of files) {
      signals.push(...scanFile(f, "daily-log", totals));
    }
  } else {
    scannedSources.push({ kind: "daily-log", path: null, fileCount: 0 });
  }

  // 2. Recent AKM feedback events.
  const feedbackSignals = await scanFeedback(totals);
  scannedSources.push({
    kind: "akm-feedback",
    path: "akm events list --type feedback",
    fileCount: feedbackSignals.length,
  });
  signals.push(...feedbackSignals);

  // 3. Claude Code transcripts (most recent files only).
  if (locs.claudeProjects) {
    const files = Array.from(
      listFiles(locs.claudeProjects, (n) => n.endsWith(".jsonl")),
    )
      .map((f) => {
        try {
          return { f, m: statSync(f).mtimeMs };
        } catch {
          return { f, m: 0 };
        }
      })
      .sort((a, b) => b.m - a.m)
      .slice(0, 10) // only the 10 newest sessions
      .map((x) => x.f);
    scannedSources.push({
      kind: "claude-transcript",
      path: locs.claudeProjects,
      fileCount: files.length,
    });
    for (const f of files) {
      signals.push(...scanFile(f, "claude-transcript", totals));
    }
  } else {
    scannedSources.push({
      kind: "claude-transcript",
      path: null,
      fileCount: 0,
    });
  }

  // 4. OpenCode (best-effort).
  if (locs.opencodeSessions) {
    const files = Array.from(
      listFiles(
        locs.opencodeSessions,
        (n) => n.endsWith(".jsonl") || n.endsWith(".md"),
      ),
    ).slice(0, 10);
    scannedSources.push({
      kind: "opencode",
      path: locs.opencodeSessions,
      fileCount: files.length,
    });
    for (const f of files) {
      signals.push(...scanFile(f, "opencode", totals));
    }
  } else {
    scannedSources.push({ kind: "opencode", path: null, fileCount: 0 });
  }

  return {
    generatedAt: new Date().toISOString(),
    scannedSources,
    signalCount: signals.length,
    signals,
  };
}

if (import.meta.main) {
  buildReport()
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`phase2-gather failed: ${msg}`);
      process.exit(1);
    });
}

export { buildReport };
export type { Signal, SignalReport };
