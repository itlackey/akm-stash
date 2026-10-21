# Select guidance for the affected process

Choose by the behavior being changed, not just its command name. Read only the
relevant sections, then use the shared [preflight and decision rules](evaluation-guide.md).
These are starting measurements and failure cases, not new release requirements
or one priority order for every process. The task and current contracts decide
which outcomes block acceptance and which tradeoffs are tolerable.

Runner notes were checked against akm-eval `99ca952` on 2026-10-21. Read the
selected checkout's help/README and compatibility notes before using its flags,
strategy names, schemas, or scores; a later version may differ.

| Affected behavior | Guidance |
|---|---|
| Search, curate, ranking, embeddings, memory answers | [Retrieval and answers](#retrieval-and-answers) |
| Remember/enrich, session summaries, extraction, ingestion | [Capture and extraction](#capture-and-extraction) |
| Reflect, metadata repair, schema repair | [Reflection and repair](#reflection-and-repair) |
| Distill, lesson creation or update | [Distillation](#distillation) |
| Consolidation, retirement, promotion planning | [Consolidation](#consolidation) |
| Quality judging, promotion decisions, proposal acceptance/drain | [Judgment and proposal application](#judgment-and-proposal-application) |
| Improve strategies, inference, autonomous or scheduled maintenance | [Maintenance and orchestration](#maintenance-and-orchestration) |
| Agent dispatch, workflows, tasks, executable capabilities | [Execution and agent usefulness](#execution-and-agent-usefulness) |
| Index/adapters/links, storage/migrations, UI, CLI, bundle/registry/sync | [Deterministic operations and interfaces](#deterministic-operations-and-interfaces) |
| akm-eval runners, collection, labels, scoring, reporting | [Evaluation infrastructure](#evaluation-infrastructure) |

## A process is not listed, or the change crosses processes

Trace its entry point, actual inputs, transformation/decision, outputs, and
persisted or external effects. Identify its current tests, contracts, relevant
configuration, and one representative user job. State the primary benefit,
hard invariants, secondary outcomes, and resource limits in the existing record.

Choose the nearest relevant AKM tests and akm-eval runner/helper. If no runner
observes the changed behavior, use a focused fixture or operation measurement
through existing tools; do not substitute an unrelated quality score or create
a suite automatically. Add a runner only when the missing repeated measurement
justifies its maintenance cost. Record what remains unmeasured.

For a cross-process change, verify each affected boundary and one combined
user path on the final build. Scope the existing three-variant/run budgets to
the task as a whole; selecting another section does not reset them. Product
features deferred in a historical plan remain decisions of that task, not
permanent restrictions on what this skill can evaluate.

## Retrieval and answers

- **Measure:** [retrieval](https://github.com/itlackey/akm-eval/blob/main/evals/retrieval/README.md);
  [SkillRet](https://github.com/itlackey/akm-eval/blob/main/benchmarks/skillret/README.md)
  for capability ranking; [LongMemEval](https://github.com/itlackey/akm-eval/blob/main/benchmarks/longmemeval/README.md)
  for memory retrieval/answers. Select only benchmarks relevant to the claim.
- **Priorities/cases:** eligibility and evidence constraints, useful ranking or
  answer accuracy, abstention/negative transfer, then relevant cost. Include
  answerable/unanswerable, current/historical, scope/source, ambiguous terminology,
  and multi-evidence cases. Filters are not an authentication system.
- **Setup:** verify keyword/hybrid/fallback and shipped defaults separately;
  judge new pooled results and rescore both saved runs when labels change.
  Separate cold indexing from warm queries and answer-model time/tokens.
- **Boundary:** retrieval hit rate does not prove answer support or all-evidence
  recall. Raw-session LongMemEval does not establish extraction/consolidation
  integrity; test that lifecycle separately when affected.

## Capture and extraction

- **Measure:** [extract](https://github.com/itlackey/akm-eval/blob/main/evals/extract/README.md)
  for durable insights, preferences, routine noise, and planted instructions;
  [bakeoff](https://github.com/itlackey/akm-eval/blob/main/evals/bakeoff/README.md)
  for supported remember-enrich or session-summary behavior. Use AKM tests for
  direct remember/import writes and adapter ingestion.
- **Priorities/cases:** evidence/intent fidelity and supported scope, useful
  durable coverage, appropriate no-op behavior, then cost. Test missing sources,
  quoted or injected instructions, dates, duplicate capture, and malformed input.
- **Setup:** isolate session directories and source files; verify which stage
  actually ran and the emitted asset/proposal. In the checked bakeoff runner,
  session-summary follows extraction and therefore needs both replies.
- **Boundary:** extraction proposal quality does not prove publication fidelity.
  If acceptance/indexing/recall is affected, check evidence and source identity
  after those stages too. Confidence and automated verification stamps are not
  factual-truth measurements.

## Reflection and repair

- **Measure:** [reflect](https://github.com/itlackey/akm-eval/blob/main/evals/reflect/README.md)
  for feedback-driven repairs and unchanged controls; bakeoff's schema-repair
  cases when that process is affected. Use exact AKM write/field tests too.
- **Priorities/cases:** grounded authorized edits and content preservation,
  intended defects fixed, healthy assets left alone, then cost. Include valid
  controls, historical notes, malformed metadata, and stale proposal targets.
- **Setup:** check the selected release's allowed fields/body-edit contract,
  active strategy, and whether judging is enabled. A legacy scorer's allowed
  edits do not define a newer feature's contract; explain any scoring update.
- **Boundary:** inspect the actual proposed and accepted changes. Use judgment
  evaluation separately if changing a downstream quality gate.

## Distillation

- **Measure:** [distill](https://github.com/itlackey/akm-eval/blob/main/evals/distill/README.md)
  and relevant AKM lesson/proposal tests.
- **Priorities/cases:** claim fidelity and preserved qualifications, useful new
  lessons or updates, restraint for duplicate/ephemeral inputs, then cost. Include
  over-claiming, contradictory advice, existing lessons, and updates with new facts.
- **Setup:** verify whether the selected AKM version supports the update class,
  the strategy/judge configuration, and whether output is new content or an
  update to an existing ref. Do not treat unsupported old-build cases as model
  failures without explaining the compatibility difference.
- **Boundary:** inspect lesson text and actual update/acceptance behavior when
  affected. Lexical required/forbidden checks are a floor, not a semantic guarantee.

## Consolidation

- **Measure:** [consolidate](https://github.com/itlackey/akm-eval/blob/main/evals/consolidate/README.md)
  pair/pool modes; bakeoff's consolidate-promote cases for promotion planning;
  proposal/promotion and recovery checks for downstream behavior.
- **Priorities/cases:** start with claim/evidence and scope preservation, useful
  safe recall, safe automatic staging, then cost; operational ceilings remain
  blockers. Record unsafe proposals, staged retirements, accepted changes, and
  recovery separately. Retiring nothing is not a useful win, and recovery does
  not excuse an unsafe action.
- **Pilot:** include short/long notes, safe duplicates, unique claims throughout
  the body, contradictions, scopes, and failed judgments. Compare existing cases
  as well as the new fixtures. The pair scorer observes retirement proposals;
  acceptance/archive/revert need their own existing isolated tests.

Apply the shared preflight, then check the following runner-specific details.
The table describes the checked runner, not an interface promised forever:

| Pair mode | Pool mode |
|---|---|
| Supports `--cases DIR`, `--limit N`, and `--concurrency N`; separate sandbox per pair. | One shared public pool; rejects custom/all corpora, `--cases`, and `--limit`; no concurrency option. |
| `--timeout-ms` limits commands, with shorter index/list caps. | `--timeout-ms` is AKM's improve budget, with additional harness kill slack. |

Inspect `run --help` and `run --pool --help`; ensure patches target the selected
strategy. The checked runner defaults to deterministic word-hash pairing and
uses the real embedder with `--semantic`: compare these as separate treatments.
Verify actual paired/judged counts; deterministic pairing does not make model
judgments deterministic. A never-paired/all-error run establishes no safety gain.

## Judgment and proposal application

- **Measure:** [judge-gate](https://github.com/itlackey/akm-eval/blob/main/evals/judge-gate/README.md)
  for revision judgments; [promotion](https://github.com/itlackey/akm-eval/blob/main/evals/promotion/README.md)
  for promotion decisions; AKM proposal/drain/write/revert tests for application.
- **Priorities/cases:** required integrity/authorization and harmful acceptance
  limits, useful acceptance versus unnecessary refusal, appropriate deferral,
  then cost. Include good/bad/no-op proposals, stale targets, wrong bundles,
  duplicate acceptance, failed judgments, and interruption/resume.
- **Setup:** verify queue/stage/apply mode, active strategy/policy, and the actual
  verdict meanings. The checked promotion eval stages accepted decisions in
  queue mode; it does not prove that a final write or deletion succeeded.
- **Boundary:** inspect live content/state and recovery when application changes.
  Do not equate accepted verdicts, staged work, completed writes, and restored
  content, or extend a changed policy to old queued decisions without review.

## Maintenance and orchestration

- **Measure:** the affected individual runners, then
  [nightly](https://github.com/itlackey/akm-eval/blob/main/evals/nightly/README.md)
  for integrated autonomous maintenance. Use bakeoff for supported memory-inference,
  enrichment, summary, schema-repair, or promotion-planning cases.
- **Priorities/cases:** intended processes run with integrity preserved, useful
  repairs/outputs, correct no-op/defer behavior, then total resource cost. Check
  unchanged assets, source boundaries, skipped/unavailable engines, partial
  budgets, retries, repeated runs, and interrupted execution.
- **Setup:** distinguish isolated process strategies from the shipped strategy.
  The checked bakeoff uses `--process` and per-process strategies; it does not
  accept a shared `--strategy`. Verify feature switches and all actual calls.
- **Boundary:** aggregate success cannot hide a skipped process or outside change.
  Confirm the final combined build; separate green component runs are insufficient.

## Execution and agent usefulness

- **Measure:** relevant AKM dispatch/workflow/task integration tests first;
  [agent A/B](https://github.com/itlackey/akm-eval/blob/main/evals/agent-ab/README.md)
  or [Terminal-Bench](https://github.com/itlackey/akm-eval/blob/main/benchmarks/terminal-bench/README.md)
  when their tasks represent the intended end-to-end claim.
- **Priorities/cases:** correct execution boundaries and required approvals,
  actual task success, interruptions/retries/idempotency, then time/tokens/cost.
  Use disposable targets for failures or destructive-action checks; scheduling
  and remote execution need tests of the actual relevant behavior.
- **Setup:** these agent benchmarks take `--akm` as a checkout directory/package,
  unlike CLI-command runners. Check Docker/Harbor, endpoint/tool/API compatibility,
  task/control access, and actual AKM use before paying for a collection.
- **Boundary:** a dispatched process or retrieved skill is not task completion.
  A benchmark without the affected workflow/task path does not validate that path;
  equivalent tasks/access are needed for product-comparison claims.

## Deterministic operations and interfaces

- **Measure:** existing AKM unit/integration tests and representative operation
  measurements for indexing, adapters/links, storage/migrations, authoring/UI,
  CLI/API, bundle/registry, sync, or scheduling. Add retrieval evaluation only
  when downstream discovery quality is affected.
- **Priorities/cases:** input/output and write-boundary correctness, data fidelity,
  useful operation success, recovery, then latency/resources. Select relevant
  valid/invalid input, identity collisions, stale/conflicting writes, unsupported
  syntax, interrupted migration/sync, and missing/unavailable-source cases.
- **Setup:** inspect actual adapter/write capabilities and existing persisted-data
  contracts. Isolate temporary state, indexes, user directories, schedules, and
  external targets. Compare logical rebuild results rather than SQLite file bytes.
- **Boundary:** verify the actual published/installed CLI/API/UI behavior and
  persisted effects. Deterministic correctness does not need an LLM score or
  repeated identical tests; performance claims may need controlled timing repeats.

## Evaluation infrastructure

- **Measure:** affected collector, fixture, scorer/rescore, summary/comparison,
  provenance, and compatibility tests; use existing real-AKM contract smoke for
  changed invocation/output parsing and a small affected-runner pilot.
- **Priorities/cases:** truthful collection/scoring, error/coverage accounting,
  reproducible interpretation, then setup/runtime cost. Ensure malformed or
  missing output and deliberately bad cases cannot become silent successes.
- **Setup:** distinguish collector changes, label/scoring changes, and product
  changes. Follow existing measurement versions/changelog; rescore both saved
  runs when required. Do not turn intentional treatment differences into a new
  mandatory hash/configuration-equality gate.
- **Boundary:** fake-AKM tests alone do not establish live compatibility; a
  scorer improvement is not an AKM quality improvement. Documentation-only
  changes need content/link/packaging checks, not expensive model collections.
