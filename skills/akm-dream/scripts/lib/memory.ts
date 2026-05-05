/**
 * Memory parsing helpers.
 *
 * akm stores memories as plain markdown under `<stash>/memories/`,
 * optionally with YAML frontmatter. We extract frontmatter, scan for
 * relative-date phrases, count internal refs, and surface "this looks
 * stale" signals — all without an LLM.
 *
 * Keep this file dependency-free. Bun has YAML support via Bun.YAML
 * (newer versions) but we hand-parse a tiny subset of frontmatter so
 * this works on older Bun versions too.
 */

export interface MemoryFrontmatter {
  title?: string;
  description?: string;
  tags?: string[];
  created?: string;
  updated?: string;
  [key: string]: unknown;
}

export interface ParsedMemory {
  frontmatter: MemoryFrontmatter;
  body: string;
  hasFrontmatter: boolean;
}

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/;

/**
 * Parse a memory markdown file into frontmatter + body.
 * Tolerant: returns the whole file as body if frontmatter is missing
 * or malformed.
 */
export function parseMemory(text: string): ParsedMemory {
  const match = text.match(FRONTMATTER_RE);
  if (!match) {
    return { frontmatter: {}, body: text, hasFrontmatter: false };
  }
  const frontmatter = parseSimpleYaml(match[1] ?? "");
  const body = text.slice(match[0].length);
  return { frontmatter, body, hasFrontmatter: true };
}

/**
 * Parse a small subset of YAML. We only support:
 *   key: value                 (string or number)
 *   key: [a, b, c]             (inline array of strings)
 *   key:                       (followed by "  - item" lines)
 *     - item
 * That's enough for typical akm memory frontmatter. Anything fancier
 * is left as a string and the consumer can ignore it.
 */
function parseSimpleYaml(src: string): MemoryFrontmatter {
  const result: MemoryFrontmatter = {};
  const lines = src.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (!line.trim() || line.trim().startsWith("#")) {
      i++;
      continue;
    }
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) {
      i++;
      continue;
    }
    const key = m[1] as string;
    const raw = (m[2] ?? "").trim();
    if (!raw) {
      // multi-line list
      const items: string[] = [];
      i++;
      while (
        i < lines.length &&
        ((lines[i] ?? "").startsWith("  - ") || (lines[i] ?? "").startsWith("- "))
      ) {
        const value = (lines[i] ?? "").replace(/^\s*-\s*/, "").trim();
        items.push(stripQuotes(value));
        i++;
      }
      result[key] = items;
    } else if (raw.startsWith("[") && raw.endsWith("]")) {
      result[key] = raw
        .slice(1, -1)
        .split(",")
        .map((s) => stripQuotes(s.trim()))
        .filter(Boolean);
      i++;
    } else {
      result[key] = stripQuotes(raw);
      i++;
    }
  }
  return result;
}

function stripQuotes(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

// ---------- Stale-signal detection ----------

const RELATIVE_DATE_PATTERNS: RegExp[] = [
  /\byesterday\b/i,
  /\btoday\b/i,
  /\btomorrow\b/i,
  /\blast (week|month|year|night|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\bnext (week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\bthis (morning|afternoon|evening|week|month|year)\b/i,
  /\b(a few|several|many|some) (days|weeks|months|hours|minutes) ago\b/i,
  /\b\d+ (days|weeks|months|hours|minutes) ago\b/i,
  /\brecently\b/i,
  /\bthe other day\b/i,
];

export interface MemorySignals {
  relativeDates: string[]; // matched phrases
  internalRefs: string[]; // memory:foo / skill:bar / etc. refs found in body
  externalUrls: string[]; // bare http(s) URLs
  approxAgeDays: number | null;
}

export function scanMemorySignals(parsed: ParsedMemory): MemorySignals {
  const text = parsed.body;
  const relativeDates: string[] = [];
  for (const re of RELATIVE_DATE_PATTERNS) {
    const m = text.match(re);
    if (m) relativeDates.push(m[0]);
  }

  const refRe = /\b(skill|command|agent|knowledge|workflow|memory|script|vault|wiki|lesson):[a-zA-Z0-9._\/-]+/g;
  const internalRefs = Array.from(new Set(text.match(refRe) ?? []));

  const urlRe = /https?:\/\/[^\s)>\]]+/g;
  const externalUrls = Array.from(new Set(text.match(urlRe) ?? []));

  const created = parsed.frontmatter.created;
  const updated = parsed.frontmatter.updated;
  let approxAgeDays: number | null = null;
  const ts = updated ?? created;
  if (typeof ts === "string") {
    const parsedDate = Date.parse(ts);
    if (!Number.isNaN(parsedDate)) {
      approxAgeDays = Math.floor(
        (Date.now() - parsedDate) / (1000 * 60 * 60 * 24),
      );
    }
  }

  return { relativeDates, internalRefs, externalUrls, approxAgeDays };
}

// ---------- Slug helpers ----------

/** Slugify a string into something safe for an akm memory `--name`. */
export function slugify(s: string, maxLen = 64): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen);
}

/** Today's date as YYYY-MM-DD, used to rewrite relative dates. */
export function today(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
