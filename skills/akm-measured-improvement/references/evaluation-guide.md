# Evaluation selection and recipes

Use the checked-out [akm-eval README](https://github.com/itlackey/akm-eval),
[compatibility notes](https://github.com/itlackey/akm-eval/blob/main/COMPATIBILITY.md),
and each runner's `--help` as the current interface. The recipes here were
checked against akm-eval `99ca952abe92e41b46f028db00956affea089868` on
2026-10-20; they are not evidence that a later AKM build has the same behavior.

## Select by behavior

Use [process guidance](process-guidance.md) to select the relevant existing
runner/tests, outcome priorities, setup checks, and failure cases. A change can
affect multiple processes; choose measurements for each affected boundary and
one representative integrated path. The command examples below illustrate
invocation patterns, not evaluations required for every change.

Extend existing cases and shared helpers before creating a suite or orchestrator.
When no existing runner measures the behavior, use relevant AKM tests and a
focused operation/integration measurement through existing helpers. Record the
coverage gap and limits rather than claiming an unrelated score validates it.

## Prepare a run

1. Read repository instructions and the current AKM stability/architecture docs.
2. Identify baseline and candidate builds; separate checkouts are convenient
   when both must remain available. Use committed or recorded working-tree
   fingerprints so an edited build is distinguishable from its base commit.
3. Choose cases and scoring before tuning; retain relevant negative cases.
4. Start with a small pilot. Confirm effective settings and errors in its banner
   and saved summary before a larger collection. Select concurrency and timeouts
   for the actual endpoint instead of copying another machine's values.

### Runner and configuration preflight

Do this once per selected runner/build/configuration and apply the relevant
[process setup checks](process-guidance.md). Update the existing record when
the treatment changes; no preflight service or config schema is needed.

1. Read that runner/mode's `--help`, README, and compatibility notes. Confirm
   the tested AKM build, runtime/dependencies, input/corpus format, supported
   flags, timeout meaning, and result location. Check whether `--akm` expects
   a CLI command, checkout directory, or package specification.
2. Verify effective settings from the pilot output/summary and, when necessary,
   the current collector's config builder. Check applicable strategy/process,
   feature switches, models, sampling, embedding, scope/source, and config
   patch. Nonempty `.env` settings may override shell values; confirm patch
   paths and merge behavior rather than assuming copied keys take effect.
3. Select a small pilot that reaches the changed behavior, with positive,
   no-op/negative, and failure cases relevant to its contract. Run existing
   contract smoke when it covers the runner, then verify actual useful work,
   outputs, effects, errors, and denominators. Zero work or all errors is not
   evidence of quality. Stub smoke checks compatibility, not model quality.
4. Establish what each metric observes: intermediate decision, persisted
   artifact, execution result, or downstream user outcome. Verify the other
   affected boundaries with existing tests/measurements before claiming them.
   Compare applicable existing cases as well as the new regression fixtures.

Keep sensitive configuration and private inputs out of published artifacts.

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
evals/reflect/run --akm "bun '$AKM_CANDIDATE/src/cli.ts'" \
  --model configured-model --label change-name-reflect
evals/distill/run --akm "bun '$AKM_CANDIDATE/src/cli.ts'" \
  --model configured-model --label change-name-distill
benchmarks/longmemeval/run --akm "bun '$AKM_CANDIDATE/src/cli.ts'" \
  --retrieval-only --limit 5 --label change-name-memory-pilot
```

Run the same affected collection on the baseline when no usable baseline
artifact exists. Follow the selected process's mode/configuration checks;
compare like conditions and test shipped behavior when the claim requires it.

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
regressions and relevant absolute cost limits. Use the task's priorities and
the applicable [process guidance](process-guidance.md), not a fixed scorecard
for another feature. Required contracts/integrity and operational ceilings are
blockers; rank the primary user benefit, secondary outcomes, and resource cost
within those constraints. State why a secondary loss is tolerable or would
defeat this task. Record each affected stage separately so a good intermediate
score cannot conceal a bad downstream result.

Choose using these criteria, not whichever metric looks best afterward.
"Evaluations pass" means the required deterministic checks and graded
acceptance criteria are met; it does not mean exit code zero,
perfect model accuracy, or improvement in every metric.

### Check variation before further tuning

Before changing a stochastic treatment because of a score gain/loss, compare
unchanged baseline and candidate behavior on the same decision-relevant pilot.
Use at least two observations of each (existing comparable runs count); the
usual first check is one additional run per build with the existing `--repeat`
or separate labels. Inspect per-case flips and the range, not only a mean.
Keep inputs, environment, and non-treatment settings fixed. For model-backed
runs, check model route/served identity, sampling, embedder, and errors;
temperature zero is not proof of repeatability. For timing measurements, hold
the relevant load/cache conditions fixed. Do not repeat deterministic correctness
tests or a full collection when the small pilot answers the variation question.

If the apparent difference is within the observed variation or changes sign,
do not tune parameters or prompts to chase it. Resolve a concrete failing case/test, prefer
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
  benefit. A process's integrity or authorization failure cannot be traded for
  a higher average score.
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
| Aggregate score rises, but a required integrity/contract test fails | Fix the blocker or discard the variant; the average does not compensate. |
| Intended benefit is worthwhile, required checks pass, and one bounded secondary regression remains | Record the tradeoff, complete final validation, and submit. Do not optimize indefinitely to remove every soft regression. |
| A correctness fix lowers a secondary quality metric slightly | Review the affected cases and task criteria; submit if the net benefit is supported and no blocker remains. |
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
