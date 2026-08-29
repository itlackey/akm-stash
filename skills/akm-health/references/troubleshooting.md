---
description: Decision tree and fix playbook for common akm improve pipeline issues. Use when a health report shows anomalies and you need to identify root causes and apply fixes.
tags: [akm-health, troubleshooting, tuning, improve]
updated: 2026-08-29
---

# akm Health Troubleshooting Playbook

Work through the numbered issues top-to-bottom — earlier items often explain
later ones.

---

## 1. Hard check failing

**Symptom:** Any `hardChecks` entry with `status != "pass"`.

| Check | Fix |
|---|---|
| `state-db-schema` | Do not attempt ad hoc database edits. Read `akm help migrate 0.9.2`; when it names an exceptional pre-release ledger, follow its `akm upgrade --force` recovery procedure. |
| `state-db-round-trip` | Disk full or permissions issue. Check `df -h` and the path in evidence. |
| `default-engine` / `default-llm-engine` / `configured-engines` | Run `akm setup` to configure an engine, then correct the named engine, model map, or credential binding from the check evidence. |
| `task-log-backing` | Log files were deleted. Safe to ignore if intentional; otherwise check backup. |
| `active-runs` | A run is stuck. Kill the process, then clean the stale run: `akm task doctor`. |

---

## 2. Consolidation: high or changing `judgedNoAction` rate

**Symptom:** `consolidation.judgedNoAction / consolidation.processed > 0.5`, or a
jump of > 10 pp between windows.

> **For any significant JNA change, follow the full diagnostic in
> `jna-diagnosis.md` before taking action.** The three root causes require
> different fixes — applying the wrong one (e.g. reducing pool size when the
> real cause is a cohort shift) wastes config budget and doesn't help.

### Quick triage (do this first)

```bash
# Step 1 — delta
akm health --since 8h --window-compare 8h --format json

# Step 2 — per-run to find spread vs concentrated
akm health --since 48h --group-by run --format json
```

**If JNA is elevated uniformly across all recent runs with no specific inflection:**
→ Likely pool saturation (Hypothesis A). Monitor; only act if `promoted` drops to 0.

**If JNA jumped at a specific timestamp and guard skips dropped in parallel:**
→ Cohort shift (Hypothesis B). Fix the proposal backlog and missing descriptions first.
Do NOT reduce pool size yet.

**If JNA rose but guard skips stayed flat and wall time didn't drop:**
→ LLM degradation (Hypothesis C). Check engine configuration, API health, `reflect.failed`.

### The key discriminating signal

`judgedNoAction` = LLM proposed **nothing**.
`skipReasons` counts = LLM proposed something, guard **rejected it**.

These are mechanically independent. If guard skips drop at the same time JNA
rises, the root cause is the same for both — a cohort shift, not an LLM failure.
See `jna-diagnosis.md` §4 for the full three-signal discriminator.

### Most common fixes (by hypothesis)

**Hypothesis B (cohort shift — most common sudden spike):**
```bash
# 1. Clear proposal backlog (dedup_pending_proposal is blocking consolidation)
akm proposal drain --policy personal-stash --max-diff-lines 15 --dry-run   # preview
akm proposal drain --policy personal-stash --max-diff-lines 15 --promote -y  # accept low-risk proposals

# 2. Fix missing descriptions (reduces merge_missing_description guard hits)
akm improve memory --task "add concise one-line descriptions to memories missing a description frontmatter field" --limit 60
```

**Hypothesis A (pool saturation — gradual rise over weeks):**
```json
// ~/.config/akm/config.json — only after ruling out B
"improve.strategies.default.processes.consolidate.poolSize": 500
```

**Hypothesis C (LLM degradation):**
```bash
akm health --since 1h --format json   # check engine-related hard checks
akm improve memories/<known-ref> --dry-run  # targeted test on known-good memory
```

---

## 3. Consolidation: high `merge_missing_description`

**Symptom:** `consolidation.skipReasons.merge_missing_description` is consistently large (> 10% of `processed`).

The consolidation LLM wants to merge memories but the target lacks a `description` field in frontmatter, which the guard requires as a safety check.

**Fix — automated:**
```bash
akm improve memory --task "add concise one-line descriptions to memories that are missing a description frontmatter field" --limit 50
akm proposal list --status pending   # review the resulting proposals; nothing auto-promotes
```

**Fix — manual:** For each memory missing a description, add:
```yaml
---
description: One-line summary for MEMORY.md index.
---
```

**Verify:** Re-run `akm health --since 24h` and check `merge_missing_description` drops in the next consolidation run.

---

## 4. Slow consolidation (`durationMs` high)

**Symptom:** `consolidation.durationMs > 600000` (10 min) or `wallTime.p95Ms` is much larger than median.

### 4a. Pool is too large
`consolidation.processed > 10000` with few promotions → the run is processing
many memories that shouldn't be in scope.

**Fix:** Reduce `poolSize` in config (see §2b above).

### 4b. Chunk failures causing retries
`consolidation.failedChunks > 0` → failed chunks may be timing out on retry.

**Fix:**
```bash
# Check which runs had failures
akm health --since 7d --group-by run --format json | \
  jq '.runs[] | select(.consolidation.failedChunks > 0) | {id, completedAt, failedChunks: .consolidation.failedChunks}'
```
If failures cluster around a time window, correlate with API rate limits or
model availability. Consider reducing chunk size in config.

### 4c. Memory pool has very large files
Graph extraction and consolidation both slow down on large markdown files.

**Fix:**
```bash
# Find oversized memories
find <stash>/memories -name "*.md" -size +50k -ls
```
Trim or split any memory over ~50 KB.

---

## 5. Low memory inference yield (`yieldRate < 0.3`)

**Symptom:** `memoryInference.yieldRate < 0.3` over multiple runs.

### 5a. Pool is saturated (expected for mature stash)
**Check:** `memoryInference.skippedChildExists` is high relative to `considered`.
This is normal — `.derived.md` siblings already exist for most memories.

**Fix:** No action needed. The yield rate naturally drops as the stash matures.
Watch for whether `written > 0` on recent memories after new sessions.

### 5b. No fresh memories in the pool
**Check:** `freshAttempts == 0` or very low.
**Fix:** Run `akm proposal extract --auto` to harvest recent session knowledge, then re-run improve. Fresh memories (no `.derived.md`) will be eligible.

### 5c. LLM finding no facts (`skippedNoFacts` high)
**Check:** `memoryInference.skippedNoFacts > 10`.
**Fix:** Check whether memories in the pool are thin (very short content). Thin memories rarely have extractable facts. Focus `akm remember` on substantive facts rather than brief notes.

---

## 6. Graph extraction truncations or failures

**Symptom:** `graphExtraction.truncations > 0` or `graphExtraction.failures > 0`.

### 6a. Document too large (truncations)
The extraction LLM hit its context window on one or more files.

**Identify:**
```bash
akm health --since 24h --group-by run --format json | \
  jq '.runs[] | select(.graphExtraction.truncations > 0) | {id, truncations: .graphExtraction.truncations}'
```

**Fix:** Find the large files and split them. Knowledge documents and memories
over ~50 KB are candidates. Run `akm lint` to identify unusually large assets.

### 6b. API failures
**Check:** `graphExtraction.failures > 0`.
**Fix:** Check engine configuration (`akm health` hard checks). If the engine
is healthy, check API rate limits or model availability in the
configured LLM provider. A single transient failure is acceptable; persistent
failures need investigation.

---

## 7. Distill never running

**Symptom:** `distill.queued == 0` across many runs, `configDisabled > 0`.

**Check:**
```bash
akm config get improve.strategies.default.processes.distill.enabled
```

If `false` or absent:
```bash
akm config set improve.strategies.default.processes.distill.enabled true
```

If distill is enabled but `queued` is still 0 after multiple runs, check `skippedByReason.no new signal since last proposal` — this means distillation is being skipped because there are no new signals to distill from. Ensure `akm proposal extract --auto` is running regularly to provide fresh session signals.

---

## 8. Reflect: high `skippedByReason.type-filter`

**Symptom:** `reflect.skippedByReason.type-filter` is consistently high.

The active profile is excluding asset types that have signal waiting for reflect.

**Check:**
```bash
akm config get improve.strategies.default.processes.reflect.assetTypes
```

**Fix:** Add the types with accumulated signal to the `assetTypes` list, or remove the filter entirely to allow all types.

---

## 9. `akm proposal extract` finding nothing

**Symptom:** `akm proposal extract --auto --dry-run` returns no candidates.

**Check options:**

1. **Window too narrow:**
   ```bash
   akm proposal extract --auto --since 7d --dry-run
   ```
   Extend the window to find older unprocessed sessions.

2. **Sessions already processed:**
   ```bash
   akm proposal extract --type claude --force --dry-run
   ```
   `--force` re-processes already-seen sessions. If candidates appear, they were
   previously extracted. No action needed.

3. **Wrong harness:**
   ```bash
   akm proposal extract --type opencode --dry-run   # if using OpenCode
   akm proposal extract --type claude --dry-run  # if using Claude Code
   ```

4. **Session location override:**
   ```bash
   akm proposal extract --type claude --location <path> --dry-run
   ```
   Use if session files are not in the default location.

---

## 10. Periodic health degradation (trend regression)

**Symptom:** `--window-compare` shows `pctChange < -10` on key metrics (a
regression greater than 10%; `pctChange` uses percent units, not a 0–1 ratio).

Run a targeted investigation:

```bash
# Find the run where it went wrong
akm health --since 7d --group-by run --format json | \
  jq '[.runs[] | {id, completedAt, wallTimeMs, promoted: .consolidation.promoted}] | sort_by(.completedAt)'

# Compare explicit windows across the regression boundary
akm health \
  --windows 'name=before,since=<ISO-before>,until=<ISO-regression>' \
  --windows 'name=after,since=<ISO-regression>' \
  --format json | jq '.windows, .deltas'
```

Common regression causes:
- Config change that disabled a process or reduced pool size
- Memory pool grew past the efficient range (many new memories added quickly)
- Model / API change affecting LLM output quality
- Accumulated `captureMode: hot` memories that should now be reviewed

---

## Quick-reference: metric → probable cause → fix

| Metric anomaly | Probable cause | First fix |
|---|---|---|
| `judgedNoAction` jumps > 10 pp in one window | Cohort shift (B) or LLM degradation (C) — diagnose first | Run `jna-diagnosis.md` steps before acting |
| `judgedNoAction` > 70%, rising gradually over weeks | Pool saturation (A) | Reduce `poolSize` only after ruling out B |
| `judgedNoAction` high, guard skips also dropped | Cohort shift (B) — LLM correct | Clear proposal backlog, fix missing descriptions |
| `judgedNoAction` high, guard skips flat, wall time flat | LLM degradation (C) | Check engine configuration + API health |
| `merge_missing_description` large | Memories lack frontmatter | `akm improve memory --task "add descriptions"` |
| `consolidation.failedChunks` > 5% | API errors or oversized chunks | Check engine configuration, reduce chunk size |
| `memoryInference.yieldRate` < 0.1 | Pool saturated or no fresh memories | Run `akm proposal extract --auto` |
| `graphExtraction.truncations` > 0 | Oversized files | Find and split large assets |
| `graphExtraction.failures` > 1 | API / model issue | Check engine configuration + LLM provider |
| `distill.queued == 0` for weeks | Distill disabled or no signal | Enable distill; run `akm proposal extract` |
| `reflect.cooldown` always high | Cooldown too long for cadence | Reduce cooldown in config |
| `wallTime.p95` >> `median` | Outlier chunks or API latency | Check `failedChunks`; inspect large memories |
| `hardChecks` failing | Infrastructure issue | Fix before interpreting any other metrics |
