/**
 * Thin wrapper around the akm CLI.
 *
 * Why a wrapper rather than calling akm inline everywhere: the dream
 * pipeline runs the same handful of commands repeatedly, and we want
 * one place to deal with timeout, missing-binary, JSON-envelope errors,
 * and local verification against a checked-out akm CLI.
 */

export interface AkmEnvelope<T> {
  ok?: boolean;
  error?: string;
  hint?: string;
  code?: string;
  // Result payload varies by command.
  [key: string]: unknown;
  data?: T;
}

export interface MemoryShow {
  type: "memory";
  name: string;
  ref?: string;
  description?: string;
  content?: string;
  path?: string;
  origin?: string;
  editable?: boolean;
}

export interface FeedbackEvent {
  eventType: string;
  ref?: string;
  ts: string;
  metadata?: {
    signal?: string;
    note?: string;
    [key: string]: unknown;
  };
}

export class AkmError extends Error {
  public readonly payload?: Record<string, unknown>;

  constructor(
    message: string,
    public readonly stderr: string,
    public readonly exitCode: number,
    payload?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AkmError";
    this.payload = payload;
  }
}

export class AkmMissingError extends Error {
  constructor() {
    super(
      "akm CLI not found on PATH. Install with `bun i -g akm-cli` or " +
        "`curl -fsSL https://raw.githubusercontent.com/itlackey/akm/main/install.sh | bash`.",
    );
    this.name = "AkmMissingError";
  }
}

function resolveAkmCommand(): string[] {
  const configured = process.env.AKM_BIN?.trim();
  if (!configured) return ["akm"];
  if (configured.endsWith(".ts") || configured.endsWith(".js") || configured.endsWith(".mjs")) {
    return ["bun", configured];
  }
  return [configured];
}

function formatAkmInvocation(args: string[]): string {
  return [...resolveAkmCommand(), ...args].join(" ");
}

function stripAnsi(text: string): string {
  return text.replace(/\u001b\[[0-9;]*m/g, "");
}

function asEnvelope(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function extractEnvelopeError(payload: unknown): string | null {
  const envelope = asEnvelope(payload);
  if (!envelope) return null;
  if (envelope.ok === false && typeof envelope.error === "string") {
    return envelope.error;
  }
  if (typeof envelope.error === "string" && envelope.error.trim()) {
    return envelope.error;
  }
  return null;
}

export async function runAkmRaw(
  args: string[],
  options: { stdin?: string; cwd?: string; timeoutMs?: number } = {},
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const command = [...resolveAkmCommand(), ...args];
  const proc = Bun.spawn(command, {
    stdin: options.stdin ? "pipe" : "ignore",
    stdout: "pipe",
    stderr: "pipe",
    cwd: options.cwd,
  });

  if (options.stdin && proc.stdin) {
    proc.stdin.write(options.stdin);
    proc.stdin.end();
  }

  const timeoutMs = options.timeoutMs ?? 60_000;
  const timer = setTimeout(() => proc.kill(), timeoutMs);

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  clearTimeout(timer);

  if (exitCode !== 0) {
    if (/command not found|ENOENT/.test(stderr) || exitCode === 127) {
      throw new AkmMissingError();
    }
    throw new AkmError(
      `${formatAkmInvocation(args)} exited ${exitCode}`,
      stderr,
      exitCode,
    );
  }

  return { stdout, stderr, exitCode };
}

/**
 * Run an akm subcommand and return parsed JSON.
 *
 * `stdin` is optional — `akm remember` and `akm import` accept piped
 * markdown for longer entries.
 */
export async function akm<T = unknown>(
  args: string[],
  options: { stdin?: string; cwd?: string; timeoutMs?: number } = {},
): Promise<T> {
  const { stdout } = await runAkmRaw(args, options);

  if (!stdout.trim()) {
    return {} as T;
  }

  try {
    const parsed = JSON.parse(stdout) as T;
    const error = extractEnvelopeError(parsed);
    if (error) {
      const envelope = asEnvelope(parsed) ?? undefined;
      const hint = envelope && typeof envelope.hint === "string" ? ` Hint: ${envelope.hint}` : "";
      throw new AkmError(
        `${formatAkmInvocation(args)} returned an error envelope: ${error}${hint}`,
        stdout,
        0,
        envelope,
      );
    }
    return parsed;
  } catch (err) {
    if (err instanceof AkmError) throw err;
    throw new AkmError(
      `${formatAkmInvocation(args)} returned non-JSON output`,
      stdout,
      0,
    );
  }
}

/**
 * Streaming variant for `--format jsonl` output. Yields one parsed
 * object per line.
 */
export async function* akmStream<T = unknown>(
  args: string[],
  options: { cwd?: string } = {},
): AsyncGenerator<T> {
  const command = [...resolveAkmCommand(), ...args, "--format", "jsonl"];
  const proc = Bun.spawn(command, {
    stdout: "pipe",
    stderr: "pipe",
    cwd: options.cwd,
  });

  const decoder = new TextDecoder();
  let buf = "";
  for await (const chunk of proc.stdout) {
    buf += decoder.decode(chunk as Uint8Array, { stream: true });
    let nl = buf.indexOf("\n");
    while (nl !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line) yield JSON.parse(line) as T;
      nl = buf.indexOf("\n");
    }
  }
  if (buf.trim()) yield JSON.parse(buf) as T;

  const exit = await proc.exited;
  if (exit !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new AkmError(`${formatAkmInvocation(args)} exited ${exit}`, stderr, exit);
  }
}

// ---------- Higher-level helpers used by the dream phases ----------

/** Load a single memory's content. */
export async function showMemory(ref: string): Promise<MemoryShow | null> {
  try {
    return await akm<MemoryShow>([
      "show",
      ref,
      "--format",
      "json",
      "--detail",
      "full",
    ]);
  } catch (err) {
    if (err instanceof AkmError && /not found/i.test(err.stderr)) return null;
    throw err;
  }
}

/** Write or overwrite a memory. Pipes long content via stdin. */
export async function rememberMemory(
  name: string,
  content: string,
  force = true,
): Promise<{ ref: string }> {
  const args = ["remember", "--name", name];
  if (force) args.push("--force");
  return await akm<{ ref: string }>(args, { stdin: content });
}

/** Resolve the working stash directory via `akm config path --all`. */
export async function getStashDir(): Promise<string> {
  const out = await akm<{ stash?: string; config?: string; cache?: string; index?: string }>([
    "config",
    "path",
    "--all",
    "--format",
    "json",
  ]);
  const dir = out.stash ?? null;
  if (!dir) {
    throw new Error(
      "Could not resolve stash directory from `akm config path --all`. Run `akm setup` first.",
    );
  }
  return dir;
}

/** Rebuild the search index. */
export async function indexStash(verbose = false): Promise<unknown> {
  const args = ["index", "--format", "json"];
  if (verbose) args.push("--verbose");
  return await akm(args);
}

/** Read recent feedback events from akm's append-only event stream. */
export async function listFeedbackEvents(limit = 50): Promise<FeedbackEvent[]> {
  const result = await akm<{ events?: FeedbackEvent[] }>([
    "events",
    "list",
    "--type",
    "feedback",
    "--detail",
    "full",
    "--format",
    "json",
  ]);
  const events = result.events ?? [];
  return events.slice(-limit).reverse();
}
