# Evaluation selection and recipes

Use the checked-out [akm-eval README](https://github.com/itlackey/akm-eval),
[compatibility notes](https://github.com/itlackey/akm-eval/blob/main/COMPATIBILITY.md),
and each runner's `--help` as the current interface. The recipes here were
checked against akm-eval `99ca952abe92e41b46f028db00956affea089868` on
2026-10-20; they are not evidence that a later AKM build has the same behavior.

## Select by behavior

| Change | Existing measurements | Important failure cases |
|---|---|---|
| Search, filters, ranking, recall defaults | `evals/retrieval`; `benchmarks/skillret` when capability ranking is affected | Eligible hits beyond candidate cutoffs; negative/unanswerable queries; current/historical evidence; all-required-evidence recall |
| Session extraction and source evidence | `evals/extract` and AKM integration tests | Evidence after acceptance, indexing, and retrieval; missing sources; incorrect claims |
| Consolidation and retirement | `evals/consolidate`, pair and pool modes | Unique claims throughout long notes; cross-scope notes; queued decisions; failed judgments; proposed/staged/accepted retirements |
| Reflection, distillation, promotion, autonomous maintenance | Relevant `evals/reflect`, `distill`, `promotion`, `judge-gate`, `nightly`, or `bakeoff` | Correct repairs; unchanged valid content; unsupported additions; rejected/failed operations |
| Long-term memory retrieval and answers | `benchmarks/longmemeval` | All evidence sessions, current facts, abstention, answer quality, tokens and timing |
| Agent task usefulness | `evals/agent-ab`; `benchmarks/terminal-bench` when representative | Actual AKM use, task success, equal treatment where intended, errors, tokens and timing |
| Links, persistence, scope, authoring, recovery | Existing AKM unit/integration tests, plus affected eval cases | Supported syntax; code examples; incremental/full logical equivalence; evidence/scope preservation; interruptions |

Extend existing cases and shared helpers before creating a suite or orchestrator.
For lifecycle gaps, exercise capture, proposal acceptance, improvement, and
retrieval in sequence. Add only the missing integration coverage. LongMemEval's
raw-session retrieval does not establish the complete memory lifecycle.

## Prepare a run

1. Read repository instructions and the current AKM stability/architecture docs.
2. Identify baseline and candidate builds; separate checkouts are convenient
   when both must remain available. Use committed or recorded working-tree
   fingerprints so an edited build is distinguishable from its base commit.
3. Choose cases and scoring before tuning; retain relevant negative cases.
4. Start with a small pilot. Confirm effective settings and errors in its banner
   and saved summary before a larger collection. Select concurrency and timeouts
   for the actual endpoint instead of copying another machine's values.

### Consolidation preflight

Do this once per selected runner/build/configuration; update the existing change
record when the treatment changes. The mode details below were checked against
akm-eval `99ca952` on 2026-10-21; the checked-out runner remains authoritative.

1. From that akm-eval checkout, inspect `evals/consolidate/run --help` and
   `evals/consolidate/run --pool --help`, its README, and compatibility notes.
   Confirm the AKM command/version, runtime/dependencies, selected model route,
   and actual result directories. Source examples use a CLI command for `--akm`.
2. Choose the correct mode before copying flags:

   | Pair mode | Pool mode in the checked runner |
   |---|---|
   | Supports `--cases DIR`, `--limit N`, and `--concurrency N`; each pair has its own sandbox. | One shared public pool; rejects custom/all corpora, `--cases`, and `--limit`; no concurrency option. |
   | `--timeout-ms` limits commands, with shorter index/list caps. | `--timeout-ms` is AKM's improve budget; the harness has additional kill slack. |

3. Verify effective configuration from the pilot summary and, when necessary,
   the existing collector's config builder: strategy, selected process/engine,
   model/provider, sampling/thinking, config patch, embedder, and timeouts.
   Nonempty `.env` values can override shell settings. Patches must target the
   selected strategy; relative patch paths are from the harness root in this
   runner. Do not assume a copied config key or product default takes effect.
4. Match embedding conditions: the checked runner uses deterministic word-hash
   pairing by default and the real embedder with `--semantic`. Run these as
   separate treatments; deterministic pairing does not make LLM judgments
   deterministic. Verify the reported embedder and cases actually paired/judged.
5. Run the appropriate existing contract smoke, then a small model-backed
   pair pilot containing short/long notes, safe duplicates, and unique claims.
   Use `--cases` for a small explicit mixed set when public `--limit` cannot
   select it. Confirm model calls, usable verdicts, errors, denominators, and
   expected scoring fields before a full run. A never-paired or all-error run
   does not establish safety. Contract smoke tests compatibility, not quality.
6. Verify what is measured: the pair scorer counts retirement **proposals**;
   staging is separate. It does not by itself exercise accepted deletion or
   restoration. Use existing isolated AKM acceptance/archive/revert tests for
   those paths and retain separate results. Then compare the affected full
   short-note collection and relevant long-note fixtures; a tail-claim fix must
   not be accepted solely on the newly added cases.

Use existing help, pilots, summaries, and tests; do not add a preflight service
or another config schema. Do not print credentials or raw private session data.

Prefer the existing [Docker guide](https://github.com/itlackey/akm-eval/blob/main/docker/README.md)
for repeatable environments. A source build must be mounted with matching
runtime dependencies; Git worktrees also need their referenced Git directory
available. Use a dedicated runner work folder. Record the image digest and
checkout revision when they matter. Native development needs Bun and the
selected AKM checkout's dependencies.

The commands below run from an akm-eval checkout with the required dependencies.
Set these paths to actual checkouts:

```bash
cd /absolute/path/to/akm-eval
AKM_BASE=/absolute/path/to/akm-baseline
AKM_CANDIDATE=/absolute/path/to/akm-candidate

scripts/smoke/run --contract --only retrieval \
  --akm "bun '$AKM_CANDIDATE/src/cli.ts'"

evals/retrieval/run --akm "bun '$AKM_BASE/src/cli.ts'" \
  --label change-name-baseline
evals/retrieval/run --akm "bun '$AKM_CANDIDATE/src/cli.ts'" \
  --label change-name-candidate

evals/retrieval/run --akm "bun '$AKM_CANDIDATE/src/cli.ts'" \
  --semantic --limit 5 --label change-name-semantic-pilot
```

The inner single quotes preserve spaces in ordinary checkout paths for the
runner's command parser; for paths containing a single quote, follow its documented
quoting rules or use a checkout path without that character. Do not use shell
`eval` to execute an AKM command string.

Run smoke for other affected process runners using `--only`, or the complete
contract smoke when appropriate. It uses stub replies to test compatibility,
not model quality. It skips agent A/B, Terminal-Bench, LongMemEval, and SkillRet.
Dataset/agent benchmarks need their own pilots.

For full hybrid comparisons, run both builds with `--semantic` and remove the
pilot limit. Retrieval `--semantic` collects keyword and semantic columns; it
does not mean semantic-only. A limit restricts questions, not the size of the
library that must be embedded. `--cases DIR` selects an independently authored
retrieval collection with `queries.jsonl`, `qrels.jsonl`, and `library/`; consult
the retrieval README for bundle mappings and formats.

Model-backed examples, after configuring an endpoint and model:

```bash
evals/extract/run --akm "bun '$AKM_CANDIDATE/src/cli.ts'" \
  --model configured-model --limit 5 --label change-name-extract-pilot
evals/consolidate/run --akm "bun '$AKM_CANDIDATE/src/cli.ts'" \
  --model configured-model --label change-name-pairs
evals/consolidate/run --akm "bun '$AKM_CANDIDATE/src/cli.ts'" \
  --model configured-model --pool --label change-name-pool
benchmarks/longmemeval/run --akm "bun '$AKM_CANDIDATE/src/cli.ts'" \
  --retrieval-only --limit 5 --label change-name-memory-pilot
```

Run the same affected collection on the baseline when no usable baseline
artifact exists. Consolidation's default deterministic embedder and `--semantic`
exercise different pairing conditions: compare like modes and test real
embedding behavior when relevant. Pool mode has different supported flags from
pair mode; check help rather than appending every shared option.

Agent A/B and Terminal-Bench take `--akm` as a **checkout directory or package
specification**, not the CLI command above. They require Docker/Harbor and a
reachable tool-calling model endpoint; consult their own guides. Agent A/B's
documented OpenAI provider setup requires the Responses API. Never substitute
a CLI command string for its checkout argument.

## Understand what actually ran

- `.env` nonempty settings can override shell settings. Inspect effective
  settings rather than assuming the shell selected the endpoint or model.
- Evals create isolated AKM configurations. Running without `--semantic` does
  not by itself test the product's shipped defaults. For default changes,
  inspect the sandbox setup and deliberately exercise the real defaults through
  an existing config override or a small relevant scenario.
- Semantic quality runs can use longer embedding timeouts than normal AKM
  queries. Check actual search mode and fallback; measure production-default
  latency separately. Local embedding inference still consumes time/resources
  even when no answer/judge model is called.
- Separate cold indexing/model setup, warm querying, answer time, and total
  elapsed time. Report tokens/cost where available; do not infer a dollar saving
  from tokens alone.
- Inspect completion, errors, timeouts, excluded judgments, and denominators.
  Partial runs remain useful observations, but do not establish full acceptance.
- Metadata confidence and an automated `verified` stamp are not calibrated
  factual truth. Judge supported claims and preservation of source evidence.

## Compare and tune with existing tools

Find actual result folders in each run's output. Retrieval writes separate
`-library` and `-books` folders; compare corresponding collections:

```bash
scripts/compare/run /absolute/path/to/baseline-library \
  /absolute/path/to/candidate-library
```

The report shows metrics, settings changes, and incomplete-run warnings. Inspect
them; do not add a mandatory matching-hash or manifest-enforcement layer. AKM
builds should differ. Model/config differences can be the intended treatment;
state whether the result isolates code or evaluates the whole new experience.

When an algorithm surfaces unjudged hits, pool results from both variants,
review them under one relevance rubric without favoring either ranking, and
update labels. The existing `evals/retrieval/label --from RESULTS_DIR` can invoke
a judge endpoint; use it with the intended endpoint and data-sharing scope.
Then explicitly rescore saved outputs on both sides:

```bash
scripts/rescore/run /absolute/path/to/baseline-library \
  /absolute/path/to/candidate-library
scripts/compare/run /absolute/path/to/baseline-library-rescored \
  /absolute/path/to/candidate-library-rescored
```

Use `--cases DIR` for a custom corpus when required. Comparison never updates
labels or rescores. Keep original raw outputs. If changing akm-eval itself,
test collection and scoring separately: update that eval's measurement/scoring
version and `MEASUREMENT_CHANGELOG.md` when appropriate under its existing rules.
Do not report a rescoring change as an AKM quality improvement.

Use per-case failures to choose the next smallest change. Keep the final
held-out cases out of parameter selection; once used for tuning, they are no
longer held out. Do not adjust labels to reward a favored implementation.
Prefer independently validated critical cases over a universal score threshold.
Agent A/B measures its particular task/control design; comparative claims about
KiwiFS or plain files require equivalent access and tasks actually tested.

## Decide whether to iterate or submit

Before tuning, use the change record to define a worthwhile improvement in the
user job, blocking invariants/tests, tolerable tradeoffs, and a small final
validation set. A defect fix can succeed through demonstrated correctness; a
simplification can succeed through maintained behavior with less machinery.
Neither needs an unrelated score increase. Do not loosen criteria after seeing
a disappointing result just to accept the first patch.

### Order competing outcomes

Write an ordered scorecard before the first candidate, including acceptable
regressions and relevant absolute cost limits. For consolidation, use this
starting order unless the task gives a different priority:

1. **Claim/evidence preservation and scope integrity.** Apply the defined hard
   tests and safety limits first. Record unsafe proposals, unsafe staged
   retirements, accepted changes, and successful recovery separately; restoration
   does not excuse an unsafe action. A higher average cannot offset a blocker.
2. **Useful safe recall.** Measure safe-retirement opportunities retained or
   missed, including existing short notes and new long-note cases. Retiring
   nothing is not a useful win. Report per-case/length/relation regressions.
3. **Safe automatic staging.** Assess safe staged coverage separately from
   proposal recall, with unsafe staging constrained by the integrity criteria.
   Do not increase unattended acceptance simply to improve this number.
4. **Cost and operational fit.** Compare calls/tokens, latency, context failures,
   and runtime/memory where relevant. Cost breaks ties among useful candidates;
   a required operational ceiling is a blocker regardless of this default order.

State how a correctness gain can justify a bounded recall loss, or why that loss
would defeat this task. Choose using the ordered criteria, not whichever metric
looks best afterward. "Evaluations pass" means the required deterministic
checks and graded acceptance criteria are met; it does not mean exit code zero,
perfect model accuracy, or improvement in every metric.

### Check variation before further prompt tuning

Before changing a prompt because of a model-score gain/loss, compare unchanged
baseline and candidate behavior on the same small, decision-relevant pilot.
Use at least two observations of each (existing comparable runs count); the
usual first check is one additional run per build with the existing `--repeat`
or separate labels. Inspect per-case flips and the range, not only a mean.
Keep cases, model route, sampling, embedder, and other non-treatment settings
fixed; check served-model identity and errors. Temperature zero is not proof of
repeatability. Do not repeat deterministic tests or a full collection when the
small pilot answers the variation question.

If the apparent difference is within the observed variation or changes sign,
do not edit wording to chase it. Resolve a concrete failing case/test, prefer
the simpler candidate when the intended outcomes are equivalent, or report
inconclusive quality within the bounded claim. Two observations are a diagnostic,
not a statistical guarantee. A clear input/path defect or deterministic failure
can justify the next fix without waiting for repeats; variation never excuses
an integrity blocker. Further repeats need a specific decision question and
must fit the recorded run budget. This check does not require new statistics
or experiment infrastructure.

### Classify a regression before reacting

Inspect the affected cases, their baseline behavior, the final content/output,
and the comparison's settings, labels, errors, and denominators. Classify each
negative signal in the existing change record:

- **Blocker:** a required test/invariant fails, a critical existing job breaks,
  an agreed limit is exceeded, or a material degradation defeats the intended
  benefit. Claim loss, cross-scope writes, and retirement from incomplete
  evidence cannot be traded for a higher average score.
- **Bounded tradeoff:** a real, understood regression with limited impact,
  outweighed by the demonstrated benefit and permitted by the task's criteria.
  Record affected cases, magnitude/frequency, severity, and why it is tolerable.
- **Uncertain signal:** a possible regression, variance, incomplete judging, or
  measurement mismatch. Perform the smallest check that can change the
  decision: inspect/rescore the saved case, add a targeted test, or repeat a
  model-backed comparison when variation matters. A comparable baseline failure
  is not a newly introduced regression. Do not call an unconfirmed suspicion a
  fact, or use uncertainty to dismiss a credible integrity failure.

A material unexplained negative signal blocks acceptance. A bounded possible
soft regression may remain as a disclosed risk when the available evidence is
enough to judge the net benefit; it does not require endless full reruns. Do
not hide a regression in an aggregate or classify it as noise without evidence.

### Use the result to choose the next action

| Observation | Action |
|---|---|
| First candidate meets the intended benefit, required checks, and tradeoff criteria | Complete the remaining final checks and submit; alternatives are not mandatory. |
| First patch passes its new test, but the relevant primary outcome worsens and a material regression remains | Investigate failed cases and try the next smallest justified variant; do not accept on unit tests alone. |
| Aggregate score rises, but a defined claim-preservation or scope test fails | Fix the blocker or discard the variant; the average does not compensate. |
| Intended benefit is worthwhile, required checks pass, and one bounded secondary regression remains | Record the tradeoff, complete final validation, and submit. Do not optimize indefinitely to remove every soft regression. |
| A correctness fix lowers a secondary ranking metric slightly | Review the affected cases and task criteria; submit if the net benefit is supported and no blocker remains. |
| A metric changes slightly and model variation could reverse the decision | Perform a targeted comparable repeat; if evidence remains insufficient, report that limit rather than claiming a win. |
| Equal useful behavior is achieved with less code and no blocking regression | Accept the simplification when that is the intended benefit. |
| A later experiment is worse than the saved acceptable candidate | Discard it and restore the saved candidate; validate the actual selected build. |

### Stop when the decision is supported

Use a maximum of **three candidate variants total by default**, including the
first solution, unless the task explicitly sets another budget. Count material
prompt/code/config/model treatment changes even if they are reverted, called
small tweaks, or pursued under a different hypothesis. Baseline collection,
unchanged-build repeats, and harness repairs are not new product variants, but
their runs/time/cost still consume the separate evaluation budget. Record those
limits and reserve enough for calibration and final validation before tuning;
do not use repeats as an unbounded alternative to new variants.

Name the hypothesis and acceptance question before each candidate. Stop as soon
as one qualifies; three attempts are not mandatory. At the candidate cap, stop
creating variants and use the reserved validation runs on the best acceptable
candidate. At the run/time/cost cap, stop running evaluations; any still-missing
validation or unresolved blocker means **needs iteration**, with the exact gap
and next justified step. An unresolved blocker does not authorize a fourth
variant or a reset of either budget. Record any explicitly authorized larger
budget; do not create an approval workflow or silently extend the task. Missing
validation is not a waived requirement or a claim that the change is ready.

As soon as a candidate demonstrates the intended worthwhile benefit, satisfies
blocking criteria, and has understood tolerable tradeoffs, stop searching for
variants. Run only the remaining planned final checks on the selected build.
Reuse completed evidence for that same build when valid. Reopen tuning if those
checks reveal a blocker or overturn the claimed benefit, not merely because
another parameter value or a higher possible score exists.

Choose among variants already evaluated; prefer the simpler implementation
when their useful outcomes are equivalent. The best acceptable candidate means
the best supported choice so far, not a requirement to find the global optimum.

If final cases guide another change, they become development cases; use fresh
independent final cases where that generalization claim matters. Once final
validation supports acceptance, submit the best acceptable candidate and state
why it is good enough to ship within scope. Record optional optimization as a
bounded follow-up when worthwhile, rather than expanding the current task.
Proceed through the existing rollout checklist separately; submission is not
completed deployment. No additional scoring service, configuration knobs,
experiment scheduler, or approval gate is needed for these decisions.

## Starting hypotheses from the 0.10 review

Reproduce these on the selected build before treating them as open defects:
full-body retirement assessment instead of a fixed 12,000-character cutoff;
evidence surviving extraction acceptance; scope-preserving consolidation;
eligibility before search candidate limits; improved current/historical recall
defaults; correct link parsing; and useful abstention/evidence coverage.

The historical inspection used AKM
[`bf072cd`](https://github.com/itlackey/akm/tree/bf072cd5c56fce0dc93d25f79a3b465ba911ee22).
It is a reproducibility reference, not a requirement to keep that implementation
or freeze today's defects into the skill. Rename preservation, stable identity,
broad wiki authoring, and hosted team architecture remain deferred for this plan.
