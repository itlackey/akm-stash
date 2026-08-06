---
description: Step-by-step methodology for diagnosing judgedNoAction (JNA) rate changes in akm consolidation. Covers the three root-cause hypotheses, cross-signal discrimination, inflection-point detection, and resolution for each cause.
tags: [akm-health, judgedNoAction, consolidation, diagnosis, tuning]
updated: 2026-08-04
---

# Diagnosing judgedNoAction (JNA) Changes

`consolidation.judgedNoAction` counts memories the consolidation LLM processed
but proposed **no action for** (no merge, delete, promote, or contradict). A high
JNA rate is not always a bug — in a mature stash with well-consolidated memories,
it is expected and correct. The diagnostic task is to determine *why* it changed.

## Quick reference

| JNA rate | Signal |
|---|---|
| < 50% | ✅ healthy — LLM finding plenty to do |
| 50–70% | ⚠️ watch — normal for mature stash, verify trend |
| 70–85% | ⚠️ elevated — diagnose with steps below |
| > 85% | 🔴 investigate immediately |

---

## Step 1 — Establish the baseline and delta

```bash
# Current window vs prior (same duration)
akm health --since 8h --window-compare 8h --format json

# Extract the key numbers
akm health --since 8h --window-compare 8h --format json | python3 -c "
import sys, json
d = json.load(sys.stdin)
for w in d['windows']:
    c = w['improve']['consolidation']
    rate = round(c['judgedNoAction']/c['processed']*100, 1) if c['processed'] else 0
    print(f\"{w['name']:8} | processed={c['processed']:5} | JNA={c['judgedNoAction']:5} ({rate}%) | promoted={c['promoted']} | wall={w['improve']['wallTime']['medianMs']//1000}s\")
"
```

Record: prior rate, current rate, delta in percentage points, and direction.

A delta of > 10 pp within one 8h window warrants full diagnosis.

---

## Step 2 — Run the per-run breakdown

This is the most important diagnostic step. It reveals whether the change is
**spread across all runs** (cohort shift) or **concentrated in specific runs**
(transient or structural issue).

```bash
akm health --since 48h --detail per-run --format json | python3 -c "
import sys, json
d = json.load(sys.stdin)
runs = sorted(d['runs'], key=lambda r: r.get('completedAt',''))
print(f\"{'completedAt':26} {'runId':8} {'JNA%':6} {'promoted':8} {'processed':9} {'wallS':6} {'chunks':10}\")
for r in runs:
    c = r.get('consolidation', {})
    proc = c.get('processed', 0)
    jna = round(c.get('judgedNoAction',0)/proc*100,1) if proc else 0
    wt = r.get('wallTime', r.get('wallTimeMs', 0))
    if isinstance(wt, dict): wt = wt.get('medianMs', 0)
    chunks = f\"{c.get('failedChunks',0)}/{c.get('totalChunks',0)}\"
    print(f\"{r.get('completedAt','?'):26} {r['runId'][:8]:8} {jna:5.1f}% {c.get('promoted',0):8} {proc:9} {wt//1000:6} {chunks:10}\")
"
```

**What to look for:**
- If JNA is elevated uniformly across all runs → cohort shift (Hypothesis B)
- If JNA is elevated in a block of runs starting at a specific timestamp → inflection event
- If JNA spikes in one or two runs then returns to baseline → transient (Hypothesis C, likely API)
- If JNA correlates with short wall time and low promoted → correct behaviour on consolidated memories

---

## Step 3 — Identify the inflection point

Sort the per-run output by `completedAt` and find where the rolling 4-run average
of JNA crossed the elevated threshold and stayed there.

```bash
akm health --since 48h --detail per-run --format json | python3 -c "
import sys, json
from collections import deque
d = json.load(sys.stdin)
runs = sorted(d['runs'], key=lambda r: r.get('completedAt',''))
window = deque(maxlen=4)
for r in runs:
    c = r.get('consolidation', {})
    proc = c.get('processed', 0)
    jna_rate = c.get('judgedNoAction',0)/proc if proc else 0
    window.append(jna_rate)
    avg = sum(window)/len(window)
    flag = ' <-- INFLECTION' if avg > 0.70 and len(window)==4 and sum(list(window)[:-1])/3 < 0.65 else ''
    print(f\"{r.get('completedAt','?'):26} {jna_rate*100:5.1f}%  4-run-avg={avg*100:5.1f}%{flag}\")
"
```

Note the timestamp of the first run where the 4-run average crossed 70% and stayed there.
This pins the inflection — now correlate it with other events.

---

## Step 4 — Apply the three-signal discriminator

Three signals distinguish the three root-cause hypotheses without needing access
to internal state. Run this against the inflection boundary:

### Signal A — Guard skip count vs JNA (the key discriminator)

`judgedNoAction` = LLM proposed **nothing**.
`skipReasons` counts = LLM proposed something, but a **guard rejected it**.

These are mechanically independent. Their relationship at the inflection tells you everything:

| Guard skips direction | JNA direction | Interpretation |
|---|---|---|
| ↓ drop | ↑ rise | **Cohort shift** — fewer structural defects to reject AND fewer proposals to make. Same root cause. |
| ↑ rise | ↑ rise | **LLM degradation** — LLM making more (bad) proposals that get rejected AND missing valid ones. |
| → flat | ↑ rise | **Pool saturation** — same cohort, LLM correctly doing less because there's less to do. |
| ↓ drop | → flat | **Guard tuning effect** — a specific guard fixed, unrelated to JNA. |

```bash
# Extract guard skips per run around the inflection
akm health --since 24h --detail per-run --format json | python3 -c "
import sys, json
d = json.load(sys.stdin)
for r in sorted(d['runs'], key=lambda r: r.get('completedAt','')):
    c = r.get('consolidation', {})
    proc = c.get('processed', 0)
    jna = round(c.get('judgedNoAction',0)/proc*100, 1) if proc else 0
    total_skips = sum(c.get('skipReasons',{}).values())
    print(f\"{r.get('completedAt','?'):26}  JNA={jna:5.1f}%  guardSkips={total_skips:5}\")
"
```

**Observed example (2026-06-01):** Guard skips dropped from 87→49/run average at
the same inflection where JNA rose from 54%→69%. Conclusion: cohort shift, not
LLM degradation.

### Signal B — Wall time correlation

JNA and wall time should be inversely correlated. When JNA rises (LLM proposing
less), the LLM spends less time generating proposals → wall time should drop.

```bash
akm health --since 24h --detail per-run --format json | python3 -c "
import sys, json
d = json.load(sys.stdin)
for r in sorted(d['runs'], key=lambda r: r.get('completedAt','')):
    c = r.get('consolidation', {})
    proc = c.get('processed', 0)
    jna = round(c.get('judgedNoAction',0)/proc*100, 1) if proc else 0
    dur = c.get('durationMs', 0) // 1000
    print(f\"{r.get('completedAt','?'):26}  JNA={jna:5.1f}%  consolidation_dur={dur:4}s\")
"
```

| Wall time direction | Interpretation |
|---|---|
| ↓ drops with JNA ↑ | LLM correctly proposing less — confirms cohort shift or saturation |
| → stays flat with JNA ↑ | LLM calling with same effort but quality dropped — suggests Hypothesis C |
| ↑ rises with JNA ↑ | Timeouts or retries on a bad cohort — investigate `failedChunks` |

### Signal C — Memory pool composition check

Did a burst of `.derived` files or a sudden pool growth cause the shift?

```bash
# Check pool composition trend
akm health --since 8h --window-compare 8h --format json | python3 -c "
import sys, json
d = json.load(sys.stdin)
for w in d['windows']:
    ms = w['improve'].get('memorySummary', {})
    eligible = ms.get('eligible', 0)
    derived = ms.get('derived', 0)
    ratio = round(derived/eligible*100, 1) if eligible else 0
    print(f\"{w['name']:8} eligible={eligible} derived={derived} ({ratio}% derived)\")
"
```

If the derived/eligible ratio is **stable** across the inflection, the pool
composition didn't change — the sampler just rotated into a different slice.
If the ratio **jumped**, a burst of `.derived` file writes changed what the
sampler sees.

---

## Step 5 — Map to hypothesis and resolution

### Hypothesis A — Pool saturation (correct behaviour)

**Signals:** JNA high and rising gradually over weeks, guard skips also falling
gradually, promoted/merged still > 0 (LLM not completely failing), wall time
trending down. No specific inflection timestamp.

**Interpretation:** The stash is maturing. Most memories are correctly consolidated.
This is expected as the stash ages.

**Actions:**
1. Verify `consolidated.promoted` is still > 0 across the window. If so, consolidation
   is working — just doing less per run.
2. No config change needed. Monitor weekly rather than daily.
3. If promoted drops to 0 for > 3 consecutive days, consider reducing pool size
   to force fresher memories into the sample.

### Hypothesis B — Pool composition shift (most common cause of sudden spikes)

**Signals:** JNA jumps > 10 pp in a single 8h window, inflection pinned to a
specific timestamp, guard skips drop in parallel, wall time drops.

**Interpretation:** The consolidation sampler rotated into a cohort of memories
that are structurally clean and already consolidated. The LLM is correct — no
action needed on those memories. The high JNA rate will resolve as the sampler
cycles back to fresher memories.

**Actions:**
1. Check `dedup_pending_proposal` count. If high (> 40/run), the proposal queue
   is backing up and blocking consolidation on memories that have pending proposals.
   Clear reviewed proposals to unlock them:
   ```bash
   akm proposal drain --policy personal-stash --max-diff-lines 15 --dry-run   # preview
   akm proposal drain --policy personal-stash --max-diff-lines 15 --promote -y  # accept low-risk ones
   ```
2. Check `merge_missing_description`. If still > 20/run, run the description fix:
   ```bash
   akm improve memory --task "add concise one-line descriptions to memories missing a description frontmatter field" --limit 60
   ```
3. Monitor the next 2h window. If JNA drops below 65%, the sampler rotated back —
   no config change needed.
4. If JNA stays above 75% for > 24h, consider reducing `poolSize` to force
   fresher memories into scope.

### Hypothesis C — LLM behaviour change (rarest, most serious)

**Signals:** JNA rises but guard skips stay flat or rise, wall time stays the
same or rises, `promoted` drops to near-zero, the inflection correlates with an
agent profile change or model update.

**Interpretation:** The LLM is making fewer valid proposals on the same pool. This
could be a model change, API degradation, or prompt drift.

**Actions:**
1. Verify the agent profile is unchanged:
   ```bash
   akm health --since 1h --format json | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['hardChecks'])"
   ```
2. Check `reflect.failed` and `consolidation.failedChunks`. API errors would show here.
3. Run a targeted test on a small set of known-good memories:
   ```bash
   akm improve memories/<known-ref> --dry-run
   ```
4. If model/API is fine, check whether akm was recently upgraded and whether a consolidation
   behavior change was noted in the changelog (`akm --version` to confirm your installed version,
   then review the release notes at https://github.com/itlackey/akm/releases). If the issue
   persists across versions, open a bug report including your `akm health` JSON output.

---

## Step 6 — Verify resolution

After taking action, verify in the next 1–2h window:

```bash
akm health --since 2h --format json | python3 -c "
import sys, json
d = json.load(sys.stdin)
c = d['improve']['consolidation']
proc = c['processed']
jna = round(c['judgedNoAction']/proc*100, 1) if proc else 0
guard_skips = sum(c['skipReasons'].values())
print(f'JNA rate: {jna}%')
print(f'Promoted: {c[\"promoted\"]}')
print(f'Guard skips total: {guard_skips}')
print(f'merge_missing_description: {c[\"skipReasons\"].get(\"merge_missing_description\", 0)}')
print(f'dedup_pending_proposal: {c[\"skipReasons\"].get(\"dedup_pending_proposal\", 0)}')
print(f'failedChunks: {c[\"failedChunks\"]}/{c[\"totalChunks\"]}')
"
```

**Resolution confirmed when:**
- JNA rate drops below 65% for 3 consecutive runs (Hypotheses A/B), OR
- `promoted > 0` is restored and guard skips return to baseline (Hypothesis C)

---

## Worked example — 2026-06-01 spike

**Observation:** JNA rose from 54% (prior 8h) to 68.7% (current 8h) in one window.

**Step 2 — per-run:** 97 runs across 48h showed elevation spread across all 12
runs after 16:40 UTC June 1. Not concentrated.

**Step 3 — inflection:** 4-run rolling average crossed 70% at 16:40 UTC and held.

**Step 4 — discriminators:**
- Guard skips: dropped from 87→49/run at the same inflection. ✅ Cohort shift.
- Wall time: consolidation median halved (144s→64s). ✅ LLM proposing less.
- Pool composition: derived/eligible ratio stable (76%→77%). ✅ No burst.
- Memory inference writes: spread evenly across the full window. ✅ Not the cause.

**Conclusion:** Hypothesis B. Sampler rotated into a cohort of clean, already-
consolidated memories. LLM correctly proposing nothing.

**Actions taken:**
1. `akm improve memory --task "add descriptions..." --limit 60`
   → reduced `merge_missing_description` from 16.6/run to 8/run (52% drop)
2. Identified 415 pending proposals backing up `dedup_pending_proposal`
   → bulk-accept small proposals to unblock consolidation
3. No pool size change — monitoring next window

**Watch:** If JNA stays above 75% for > 24h after proposal queue clears, reduce
`poolSize`.
