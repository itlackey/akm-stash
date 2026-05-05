import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { memoriesDir } from "./paths.ts";
import { parseMemory } from "./memory.ts";

export interface MemoryInventoryEntry {
  name: string;
  ref: string;
  path: string;
  description?: string;
  tags: string[];
  content: string;
  sizeBytes: number;
  mtimeMs: number;
}

function listMarkdownFiles(root: string, out: string[] = []): string[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(root);
  } catch {
    return out;
  }

  for (const entry of entries) {
    const filePath = join(root, entry);
    let stats: ReturnType<typeof statSync>;
    try {
      stats = statSync(filePath);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      listMarkdownFiles(filePath, out);
      continue;
    }

    if (entry.endsWith(".md") && entry !== "MEMORY.md") {
      out.push(filePath);
    }
  }

  return out;
}

export function loadMemoryInventory(stashDir: string): MemoryInventoryEntry[] {
  const root = memoriesDir(stashDir);
  if (!existsSync(root)) return [];

  return listMarkdownFiles(root)
    .sort((a, b) => a.localeCompare(b))
    .map((path) => {
      const content = readFileSync(path, "utf8");
      const parsed = parseMemory(content);
      const tags = Array.isArray(parsed.frontmatter.tags)
        ? parsed.frontmatter.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
        : [];
      const description =
        typeof parsed.frontmatter.description === "string" && parsed.frontmatter.description.trim().length > 0
          ? parsed.frontmatter.description.trim()
          : undefined;
      const stats = statSync(path);
      const name = path.slice(root.length + 1, -3).replaceAll("\\", "/");
      return {
        name,
        ref: `memory:${name}`,
        path,
        description,
        tags,
        content,
        sizeBytes: stats.size,
        mtimeMs: stats.mtimeMs,
      } satisfies MemoryInventoryEntry;
    });
}
