# Pipeline definition — new-pipeline

> The **meta pipeline** that produces one set of pipeline for a new kind of job (track).
> To add one new job, run this pipeline.

---

## Header table

| Item | Content |
|---|---|
| Purpose | Produce one set of pipeline for a new kind of job (track) |
| Input | The new job spec set by the user (purpose · input · output · outline) — a seed confirmed first with a ★ and put in |
| Output | `z/pipelines/<job>.md` + `a/tracks/<job>/` + `b/tracks/<job>/` (three complete sets) |
| Tracks used | new-pipeline (verification criteria = `b/tracks/new-pipeline/`) |
| Expected step count | 4 (Z·B·A·B) + 3 human checkpoints |

---

## Step table

| # | Who | What | Reads | Writes | Parallel |
|---|---|---|---|---|---|
| ★ | User | Confirm the new job spec (input seed) | — | — | — |
| 1 | Z | Move the spec into the header table and create the new track's empty folders and the place for the definition | the spec · `z/pipelines/_template.md` | the definition (header table) · empty folders `a/tracks/<job>/`·`b/tracks/<job>/` | solo |
| 2 | B | Write the verification viewpoint of the new pipeline (criteria first) | the spec · `b/common-criteria.md` | `b/tracks/<job>/` | solo |
| ★ | User | Approve the verification criteria | `b/tracks/<job>/` | — | — |
| 3 | A | Fill in the definition's step table and write `a/tracks/<job>/` — `rules.md` · `references/` · `skills/` (if there is something to fill in, in the format of `a/common-rules.md` §7.2; if not, an empty folder) | the spec · `z/pipelines/_template.md` · `a/common-rules.md` | the definition · `a/tracks/<job>/` | solo |
| 4 | B | Judge whether the new pipeline was made well | the new deliverables · `b/tracks/new-pipeline/` | `improvements/` | solo |
| ★ | User | Final acceptance of the new pipeline | the verdict file | — | — |

> `<job>` = the name of the job being newly made this time. This pipeline is used for arbitrary new jobs, so the slot is left as a variable.
> Because there is one verifier (B), there is no verdict synthesis step.

---

## Confirmed baseline

Three positions kept while this pipeline runs.

- **Writing to `pipeline/` only while this pipeline runs.** Creating a new definition and track folders under `pipeline/` is limited to when `new-pipeline` is in progress. During any other job `pipeline/` is read-only.
- **Run records go in `improvements/`.** Problems and lessons that surface while running this pipeline are left in `improvements/` after the job is finished (the Writes of the step 4 B).
- **The meta pipeline's own verification criteria are in `b/tracks/new-pipeline/`.** The criteria used to judge whether this pipeline made the new pipeline well are here (referred to by the B of steps 2 and 4).

---

## Completion conditions

- [ ] All three sets exist and are not empty — `z/pipelines/<job>.md` · `a/tracks/<job>/` · `b/tracks/<job>/`.
- [ ] The header table · step table · completion conditions · records to keep cells of the definition (`<job>.md`) are all filled in.
- [ ] The user's approval at all three ★ points (Spec confirmation · verification Criteria approval · Final acceptance) is left in the records.
- [ ] The step 4 verdict has been given and the user has given final acceptance.
- [ ] The status of this Task (T{N}) in `log/manifest.json` has been updated and history has one line per step.

---

## Records to keep

| What | Where | Who |
|---|---|---|
| Trace of progress per step (shared by all Tasks) | `log/run-log.md` | Z |
| Task ledger — Task list · status · dependencies | `log/manifest.json` | **Z only** |
| Summary of what was built | `log/T{N}_new-pipeline/build-summary/A<N>_*.md` | A |
| Verification results | `log/T{N}_new-pipeline/verification-summary/B<N>_*.md` | B |
| Pipeline problems that surfaced this time | `improvements/` (after the job is finished) | Z |
