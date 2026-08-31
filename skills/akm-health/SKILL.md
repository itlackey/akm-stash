---
name: akm-health
description: Produce well-formatted markdown health reports for the akm improve pipeline, interpret metrics, troubleshoot issues, and tune pipeline behavior. Use when the user asks for a health report, wants to understand improve metrics, diagnose slow/silent/failing runs, or tune consolidation and distillation.
updated: 2026-08-31
---

# akm Health Reporting

This skill produces structured markdown health reports from `akm health` output,
explains what each metric means, and guides troubleshooting when numbers are off.

## Commands to gather data

```bash
# 24h rollup — standard health check
akm health --since 24h --format json

# Trend comparison — current 24h vs prior 24h
akm health --since 24h --window-compare 24h --format json

# Per-run breakdown — one row per improve run
akm health --since 24h --group-by run --format json

# 7-day view for weekly review
akm health --since 7d --window-compare 7d --format json

# Explicit windows for incident investigation
akm health \
  --windows 'name=before,since=<ISO>,until=<ISO>' \
  --windows 'name=after,since=<ISO>' \
  --format json
```

The result envelope is `schemaVersion: 3`. Task/engine telemetry lives under
`.metrics`; pipeline metrics live under `.improve`. Optional `.runs`, `.windows`,
`.deltas`, and `.report` appear only for their corresponding request modes.
The `advisories` array can also contain `plugin-version` entries. Report the
installed/available Claude plugin versions and treat `stale: true` or
`admitted: false` as actionable warnings; the latter means the installed
plugin has disabled itself because its AKM compatibility range excludes the
running CLI.

## Report sections

Produce reports in this order. Include all sections — skip a section only if its
data source returned nothing.

### 1. Summary

```md
## AKM Health Report — <WINDOW>

| | |
|---|---|
| **Status** | pass / warn / fail |
| **Window** | <since> |
| **Runs** | <improve.invoked> invoked / <improve.completed> completed |
| **Generated** | YYYY-MM-DD HH:MM UTC |
```

### 2. System checks

List hard checks. Surface any non-passing checks as **blocking issues**.

```md
## System Checks

| Check | Status | Note |
|---|---|---|
| state-db-schema | ✅ pass | |
| state-db-round-trip | ✅ pass | 9 ms |
| default-engine | ✅ pass | configured engine available |
| task-history-read | ✅ pass | 96 rows |
| plugin-version | ✅ pass | installed plugin admits this CLI |
```

### 3. Improve pipeline

```md
## Improve Pipeline

| Metric | Value | Signal |
|---|---|---|
| Runs invoked | 48 | |
| Runs completed | 48 | 100% — ✅ |
| Skipped (no new signal) | 112 272 | normal |
| Skipped (strategy filtered) | 16 538 | normal |
| Planned refs | 4 | |
| Coverage gap count | 0 | |
```

### 4. Consolidation quality

This is the highest-value section. High `judgedNoAction` or unusual `skipReasons`
histograms are the primary tuning targets.

```md
## Consolidation

| Metric | Value | Signal |
|---|---|---|
| Processed | 10 126 | |
| Promoted | 59 | good |
| Merged | 7 | |
| Deleted | 8 | |
| Contradicted | 290 | |
| **judgedNoAction** | 6 311 | ⚠️ 62% — see troubleshooting |
| Failed chunk memories | 300 | |
| Failed chunks / total | 6 / 296 | 2% — acceptable |
| Duration | 6 150 s | ⚠️ slow — see latency |

### Skip reasons

| Reason | Count | Action |
|---|---|---|
| dedup_pending_proposal | 853 | normal — proposals in flight |
| merge_missing_description | 901 | ⚠️ add descriptions to memories |
| merge_participant_blocked | 397 | check hot-capture memories |
| captureMode_hot_refused | 423 | normal if recent sessions active |
| merge_content_too_short | 220 | normal — thin memories |
| promote_pending_proposal_exists | 157 | normal |
| promote_source_too_small | 40 | normal |
```

### 5. Reflect and distill

```md
## Reflect

| Metric | Value |
|---|---|
| ok | 2 |
| cooldown | 2 |
| failed | 0 |
| guardRejected | 0 |
| skippedByReason | (empty — all ran or hit cooldown) |

## Distill

| Metric | Value | Signal |
|---|---|---|
| queued | 0 | |
| skipped (no new signal) | 112 272 | normal |
| skipped (type-filter) | 4 | normal |
| llmFailed | 0 | ✅ |
| qualityRejected | 0 | |
```

### 6. Memory inference

```md
## Memory Inference

| Metric | Value | Signal |
|---|---|---|
| Considered | 1 360 | |
| Cache hits | 1 301 | 96% — ✅ efficient |
| Fresh attempts | 59 | |
| Written (new .derived) | 29 | |
| Split parents | 29 | |
| skippedNoFacts | 0 | |
| **yieldRate** | 0.49 | acceptable (>0.3 = healthy) |
| Duration | 97 s | ✅ fast |
```

### 7. Graph extraction

```md
## Graph Extraction

| Metric | Value | Signal |
|---|---|---|
| Extracted files | 2 | |
| Entities | 64 | |
| Relations | 49 | |
| Cache hit rate | 0% | cold run |
| Truncations | 1 | ⚠️ one doc too large |
| Failures | 0 | ✅ |
| Duration | 564 s | see latency |
```

### 8. Wall-time and latency

```md
## Latency

### Overall (per run)

| | ms |
|---|---|
| Median | 201 677 |
| P95 | 449 232 |
| Min | 93 405 |
| Max | 595 616 |

### By phase

| Phase | Median ms | P95 ms | Total ms |
|---|---|---|---|
| Consolidation | 102 119 | 368 629 | 6 150 063 |
| Graph extraction | 9 795 | 26 977 | 564 003 |
| Memory inference | 30 | 4 983 | 97 417 |
```

### 9. Trend (window comparison)

```md
## Trend: current 24h vs prior 24h

| Metric | Prior | Current | Δ |
|---|---|---|---|
| Runs completed | — | 48 | — |
| Consolidation promoted | — | 59 | — |
| Memory inference written | — | 29 | — |
| judgedNoAction rate | — | 62% | — |
| Median wall time | — | 201 677 ms | — |
```

Fill from `windows[0]` vs `windows[1]` and the `deltas` map in the JSON output.

### 10. Recommendations

```md
## Recommendations

1. **[critical/warn/info]** <finding> — <one-line fix>
2. ...
```

Use `references/troubleshooting.md` to classify findings and propose fixes.

---

## Threshold reference

See `references/metrics-reference.md` for the complete field glossary and
signal thresholds (healthy / warn / critical) for every metric.

## Troubleshooting

See `references/troubleshooting.md` for the full playbook covering:
- high `judgedNoAction`
- `merge_missing_description` accumulation
- slow consolidation
- low memory inference yield
- graph extraction truncations/failures
- `akm proposal extract` finding nothing

### JNA rate changes — deep diagnosis

When `judgedNoAction` changes significantly between windows, use
`references/jna-diagnosis.md` for the full diagnostic methodology:

1. **Establish the delta** — `akm health --since 8h --window-compare 8h`
2. **Per-run breakdown** — `akm health --since 48h --group-by run` to find whether
   the change is spread or concentrated, and to pin the inflection timestamp
3. **Three-signal discriminator** to distinguish:
   - **Hypothesis A** (pool saturation) — JNA rising gradually, no inflection, guard skips flat
   - **Hypothesis B** (cohort shift, most common) — JNA jumps at a specific timestamp, guard skips drop in parallel, wall time drops
   - **Hypothesis C** (LLM degradation) — JNA rises but guard skips stay flat or rise, wall time unchanged
4. **Resolution** differs per hypothesis — never reduce pool size without ruling out B first

The key discriminator: if guard skips (skipReasons totals) drop **at the same
inflection** as JNA rises, it is Hypothesis B (cohort shift), not an LLM failure.
Pool size reduction would be the wrong fix.

## Output rules

- Use actual numbers from the JSON, never vague estimates.
- Mark ✅ / ⚠️ / 🔴 based on thresholds in `references/metrics-reference.md`.
- Include the exact commands used so the report is reproducible.
- If `--window-compare` data is absent, note it rather than leaving the trend section blank.
- End every report with the commands used and the timestamp.
