---
name: akm-health
description: Produce well-formatted markdown health reports for the akm improve pipeline, interpret metrics, troubleshoot issues, and tune pipeline behavior. Use when the user asks for a health report, wants to understand improve metrics, diagnose slow/silent/failing runs, or tune consolidation and distillation.
updated: 2026-11-23
---

# akm Health Reporting

This skill produces structured markdown health reports from `akm doctor` output,
explains what each metric means, and guides troubleshooting when numbers are off.

## Commands to gather data

```bash
# 24h rollup — standard health check
akm doctor --since 24h --format json

# Trend comparison — current 24h vs prior 24h
akm doctor --since 24h --window-compare 24h --format json

# Per-run breakdown — one row per improve run
akm doctor --since 24h --group-by run --format json

# 7-day view for weekly review
akm doctor --since 7d --window-compare 7d --format json

# Explicit windows for incident investigation
akm doctor \
  --windows 'name=before,since=<ISO>,until=<ISO>' \
  --windows 'name=after,since=<ISO>' \
  --format json
```

The result envelope is `schemaVersion: 3`. Task and connection telemetry lives under
`.metrics`; pipeline metrics live under `.improve`. Optional `.runs`, `.windows`,
`.deltas`, and `.report` appear only for their corresponding request modes.
The `advisories` array also holds the plugin advisories (`plugin-version`,
`codex-plugin-version`, `opencode-plugin-version`, `opencode-v2-plugin-version`),
`cli-version`, `scheduler-binary` and `opencode-major`. Report any that is `warn`: a plugin whose bundled
akm-cli differs from the running CLI is fixed by `akm upgrade` (plugin ahead) or by updating the plugin
once its channel publishes a matching build (plugin behind). `unknown` means the lookup did not run;
`--no-probe` skips the network lookups.

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
| connections-and-harnesses | ✅ pass | all connections answer |
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
| Accepted proposals | 4 | |
| Distinct refs touched | 4 | |
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
| rejected | 0 |
| skippedByReason | (empty — all ran or hit cooldown) |

## Distill

| Metric | Value | Signal |
|---|---|---|
| queued | 0 | |
| skipped (no new signal) | 112 272 | normal |
| skipped (type-filter) | 4 | normal |
| llmFailed | 0 | ✅ |
| judgeRejected | 0 | |
| validatorRejected | 0 | |
```

### 6. Memory inference

```md
## Memory Inference

| Metric | Value | Signal |
|---|---|---|
| Considered | 1 360 | |
| Fresh attempts | 59 | |
| Written (new .derived) | 29 | |
| noChange | 1 272 | restraint, not failure |
| skippedNoFacts | 0 | |
| **yieldRate** | 0.49 | acceptable (>0.3 = healthy) |
| Duration | 97 s | ✅ fast |
```

### 7. Wall-time and latency

```md
## Latency

### Overall (per run)

| | ms |
|---|---|
| Median (`wallTime.medianMs`) | 201 677 |
| P95 (`wallTime.p95Ms`) | 449 232 |
```

### 8. Trend (window comparison)

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

### 9. Recommendations

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
- `akm proposal extract` finding nothing

### JNA rate changes — deep diagnosis

When `judgedNoAction` changes significantly between windows, use
`references/jna-diagnosis.md` for the full diagnostic methodology:

1. **Establish the delta** — `akm doctor --since 8h --window-compare 8h`
2. **Per-run breakdown** — `akm doctor --since 48h --group-by run` to find whether
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
