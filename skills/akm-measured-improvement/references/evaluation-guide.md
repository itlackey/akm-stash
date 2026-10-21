# Measurement and experiment guidance

Select the relevant [process guidance](process-guidance.md) and read the current
[akm-eval documentation](https://github.com/itlackey/akm-eval), runner help, and
compatibility notes. Examples below were checked against `99ca952`; they are
recipes, not a frozen CLI contract. Acceptance and rollout rules live in the
[definition of done](definition-of-done.md), not in a second reporting system.

## Choose validation by the changed boundary

| Changed behavior | Primary evidence | Broader evaluation only when it answers this question |
|---|---|---|
| Parser, serializer, publication/projection path | Deterministic reproduction, identical-input replay, actual persistence/consumer and recovery checks | Did downstream useful behavior change beyond the demonstrated contract? |
| Prompt, model request, extraction/other model decision | Representative model pilots, raw failure review, appropriate broader collections | Does the treatment improve quality across the affected jobs and controls? |
| Retrieval eligibility or ranking | Adversarial eligible-recall cases, representative judged relevance, isolated comparisons and cost | Does the fix preserve useful ranking and acceptable resource use? |
| Storage, UI/API, execution or other deterministic operation | Relevant contract/integration tests and actual effects; controlled operation timing if claimed | Does a representative integrated user job still succeed? |
| Collector/scorer/reporting | Fixture/rescore tests, known-good/bad outputs, live invocation smoke where relevant | Does the changed measurement faithfully observe the selected product behavior? |

A model-based product can have a deterministic changed boundary. For a change
entirely after the model response, capture complete responses once and replay
identical inputs through baseline/candidate assembly, publication, and affected
reads. Include optional fields, empty/invalid results, and representative edge
cases. Record capture provenance and limitations; replay establishes fidelity,
not better model judgment. Broader runs still apply if requests, decisions, or
downstream behavior changed, or the task/repository explicitly requires them.

Review the boundary, test matrix, and initial patch before costly collection;
retain fresh final cases as described in the [workflow](../SKILL.md#3-reproduce-review-and-simplify).
No runner covering the claim means focused existing tests/helpers plus an
explicit coverage limit, not automatic creation of another suite.

## Runner and execution preflight

Do this once per selected runner/build/setup, then update only changed items:

1. **Interface/configuration:** read the mode's help/README and compatibility
   notes. Confirm tested build/dependencies, input format, `--akm` argument type,
   strategy/process and feature switches, supported flags, timeout meaning,
   result path, and applicable models/search modes. Inspect effective settings;
   `.env` values or config merging can override assumptions.
2. **Execution/resources:** use a cheap relevant probe for required local sockets,
   subprocess/native-runtime access, writable temporary/output directories,
   file-descriptor/concurrency headroom, and model/cache availability. Assign
   shared resource ownership before parallel runs. Diagnose environment failures
   separately; do not suppress required checks or bypass access restrictions.
3. **Recorded evidence:** inspect a saved pilot row/summary before full collection.
   Does it retain the actual invocation/argv, returned ref identities/revisions,
   complete intermediate fields needed for the claim (including optional fields),
   effective mode/model, errors, and denominators? Capture only what is needed;
   redact credentials/private content without destroying comparison identity.
4. **Measurement contract:** verify collector/scorer versions and input/label
   handling. If collection/scoring changed, follow the repository's version and
   `MEASUREMENT_CHANGELOG.md` rules. Missing required recorded data calls for the
   smallest collector fix and recollection of affected cases, not a misleading
   rescore or a new logging framework.
5. **Pilot:** select relevant success, no-op/negative, and failure cases. Run
   existing contract smoke when it covers the runner, then verify actual work
   and the lifecycle stage observed. Stub smoke is compatibility evidence, not
   model-quality evidence. Apply the [process-specific checks](process-guidance.md).

Record effective settings rather than requiring identical hashes/manifests.
Builds should differ; models/defaults may be intentional treatments. Explain
whether a comparison isolates code or evaluates the whole new experience.

## Variation and comparison

Before tuning a stochastic score difference, compare unchanged baseline and
candidate on the same decision-relevant pilot. Two observations each are a
useful initial diagnostic; existing comparable runs count. Inspect per-case
flips and ranges, not only a mean. Hold non-treatment inputs/settings and
relevant load/cache conditions fixed. Temperature zero is not proof of identical
model judgments; verify actual served modes/models and errors. More repeats
need a named decision question and must fit the run budget.

Do not tune noise. A clear deterministic failure can justify repair without
waiting for repeats, and variation never excuses an integrity blocker. Do not
repeat identical deterministic tests or full collections when a focused replay
or pilot resolves the uncertainty. Report ambiguity when it remains.

For retrieval-only changes that leave indexing unchanged, investigate a ranking
regression by alternating baseline/candidate code against the **same physical
index and compatible fixed configuration** before attributing it to the patch.
Use disposable snapshots and prevent writes during comparison. Both builds must
read it correctly: changed schemas, indexing/embedding semantics, or migrations
can invalidate this control. Then use appropriate per-build rebuilds and bound
the causal claim instead. Same-index testing does not remove query-model or
service variation; inspect that too.

Report completion, excluded errors/judgments, timeouts, denominators, and actual
fallback. Separate cold setup/indexing, warm queries, answer time, and total
elapsed time; tokens alone do not establish dollar savings. Classify negative
signals using the [acceptance rules](definition-of-done.md#acceptance).

## Reuse evidence after edits

Add one short statement to the existing record: **measured revision → final
revision; changed boundary/dependencies; affected claims; retained evidence;
checks to rerun and remaining gaps**.

- Evidence-only or unrelated documentation edits need the relevant content/link
  checks, not recollection of unchanged product behavior.
- A repair within deterministic post-processing needs exact-input replay and
  affected persistence/consumer/recovery checks. Earlier model runs still describe
  their measured revision; they cannot be presented as final-build quality proof.
- Prompt/request/model/decoder changes invalidate affected model-quality evidence;
  indexing/embedding changes invalidate affected index/retrieval comparisons.
  Re-run the affected measurements, not automatically every suite.
- A rebase/dependency update requires reviewing the actual combined diff and
  rerunning affected checks. Empty diffs in one file alone do not establish that
  its inputs or dependencies stayed unchanged.

Respect repository/issue requirements for individual branches. Use the planned
combined check for integration claims; never combine green results from different
intermediate builds into a final-build pass. If final cases drive another edit,
they become development cases; reserve fresh relevant final checks. Missing
required validation remains a [closing-state limitation](definition-of-done.md#closing-state).

## Experiment budget

Default: **at most three exploratory treatments**, unless the task sets another
budget. Honor stricter task-defined attempt/edit limits. Count the first chosen
approach and each competing approach or intentional behavior experiment:
for example, a different parser algorithm/library, ranking/default strategy,
model, or semantic prompt. Reverted alternatives count; a new hypothesis,
process, or resumed session does not reset the task's budget.

A **correctness repair** restores an already required contract within the chosen
approach, such as retaining an omitted optional field or fixing a write-path bug.
Record repairs and rerun their affected checks; do not automatically charge each
edit as a new treatment. Replacing the approach or changing model decision
behavior is still a treatment even when called a repair. Failed integrity checks
always block acceptance.

Set separate finite run/time/cost bounds, including repairs, retries, calibration,
and reserved final validation. Repairs are not unlimited work outside the budget.
Stop earlier when accepted. At the treatment cap, select the best acceptable
approach and use reserved validation; at an exhausted execution budget with an
unresolved blocker or missing evidence, stop and report **needs iteration**.
Neither condition authorizes silently extending the task or accepting a failure.
Use the [acceptance checklist](definition-of-done.md#acceptance) to decide when
to submit; no perfect score, extra variant, or new approval service is required.

## Shared verification

When work is already parallel, agree on one coordinator and a lightweight plan
in the existing record. This is optional coordination guidance, not a requirement
to spawn agents or add an orchestration system.

- Record the shared skill revision, baseline/builds, per-agent focused checks,
  review responsibilities, final combined-check owner, and resource/run budgets.
- Isolate worktrees, config/state, indexes, output directories, and result labels.
  Assign one owner for shared mutable caches, model downloads, and heavyweight
  suites. Serialize writers or use separate resources; respect existing locks.
  Do not launch a competing semantic run while another owns the shared index.
- Agents run focused checks after affected edits. Schedule shared full coverage
  and one final combined-build check deliberately; link the result rather than
  making each agent rerun it without a changed risk. Preserve stricter required
  branch checks and repeat when source changes/failures justify it.
- Keep one acceptance narrative with linked branch evidence, current build IDs,
  remaining dependencies, and actual rollout state.

For containers, follow the existing [Docker guide](https://github.com/itlackey/akm-eval/blob/main/docker/README.md);
mount source dependencies and referenced Git/worktree directories. Native runs
need the selected checkout's runtime/dependencies. Reuse existing setup tools.

## Existing command patterns

Select a runner using [process guidance](process-guidance.md); its README/help
owns specific flags and corpus formats. These native examples assume Bun and
dependencies are installed and run from an akm-eval checkout:

```bash
AKM_BASE=/absolute/path/to/akm-baseline
AKM_CANDIDATE=/absolute/path/to/akm-candidate

scripts/smoke/run --contract --only retrieval \
  --akm "bun '$AKM_CANDIDATE/src/cli.ts'"
evals/retrieval/run --akm "bun '$AKM_BASE/src/cli.ts'" --label baseline
evals/retrieval/run --akm "bun '$AKM_CANDIDATE/src/cli.ts'" \
  --semantic --limit 5 --label hybrid-pilot
scripts/compare/run /absolute/path/to/baseline-library \
  /absolute/path/to/candidate-library
```

Quote checkout paths using the runner's command parser; do not use shell `eval`.
`--limit` restricts cases, not necessarily library/index size. Harness settings
and embedding timeouts can differ from shipped defaults; test actual defaults
separately. Run matched full collections only when the named acceptance question
requires them. Contract smoke skips some dataset/agent benchmarks; those need
their own relevant pilots.

When retrieval surfaces unjudged results, pool both rankings under one rubric,
review the missing judgments without favoring a candidate, and explicitly
rescore **both** saved runs with existing tools. `evals/retrieval/label --from`
can invoke a judge: confirm endpoint and data-sharing scope. For a custom corpus,
use the current documented `--cases` support.

```bash
scripts/rescore/run /absolute/path/to/baseline-library \
  /absolute/path/to/candidate-library
scripts/compare/run /absolute/path/to/baseline-library-rescored \
  /absolute/path/to/candidate-library-rescored
```

Comparison does not label/rescore. Keep original raw outputs. A changed score
from labels/scoring is not an AKM implementation gain. Full observed-pool coverage
is not exhaustive judging; generated rewrites are not independent held-out data.
Product-comparison claims require equivalent tasks/access actually measured.
