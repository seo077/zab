# Pipeline definition — general

> The **basic skeleton** for running a **one-off, exploratory job** that no definition fits, as one Task. It is not the definition of any particular job.
> Something done once and never again is not hardened into a pipeline — such a job runs on this skeleton without making a new pipeline. **Once repetition is confirmed**, it is then promoted with `new-pipeline` (project → pipeline, one direction).
> It differs from other definitions in two ways — a **negotiation step** that first agrees on what the job is, and **conditional rows** switched on and off per run (verification skipped · design gate). The definition is this one file and is not split by run.
>
> `T{N}` · `<job>` · `<track>` are variables — this definition is used for arbitrary one-off jobs, so the slots are left as variables and Z fills them in when it opens the Task.

---

## Header table

| Item | Content |
|---|---|
| Purpose | The basic skeleton for running a one-off, exploratory job that no definition fits, as one Task |
| Input | ① **What must exist at the start** = the user's request (what they want to do) · material (what is in `input/` — when there is any) ② **What is confirmed at step 1 and ★ Spec confirmation** = the agreed job spec (purpose · input · output) · whether to verify (default = proceed) · whether there is a design gate · the designated track (default = none) |
| Output | ① Deliverables under the project's `output/` — the concrete paths are set at ★ Spec confirmation ② Task room records `log/T{N}_<job>/` — `criteria.md` · (`design-spec.md`) · `build-summary/` · `verification-summary/` |
| Tracks used | **None (default)** — at ★ Spec confirmation an **existing** track (a name already present in `a/tracks/`·`b/tracks/`) can be designated. The designated track reaches A and B **carried in Z's call message** — A and B do not look for a track themselves. There is no track folder named `general` and none is created |
| Expected step count | Default run: **4 (negotiation · B1 · A1 · B2) + 4 human checkpoints.** A run that declares a design gate: +1 (A1 design) + 1 checkpoint. A run that skips verification: −2 (B1·B2) − 1 checkpoint (★ Criteria approval). Counting = numbered rows + ★ rows; conditional rows are counted only when switched on in that run |

---

## Step table

| # | Who | What | Reads | Writes | Parallel |
|---|---|---|---|---|---|
| 1 | Z·User (negotiation) | Discuss what the job is **until agreement is reached**, and when the user approves what was agreed, Z writes down the confirmed spec (→ §The four things settled in negotiation, below) | the user's request · `input/` · `project-map.md` · `log/manifest.json` | `log/decisions.md` (Z only) | solo |
| ★ | User | Spec confirmation — settle the four: **spec · whether to verify · whether there is a design gate · track designation** | Z's briefing in the context window · the confirmed-spec section of `log/decisions.md` | — | — |
| 2 | B1 | **[skipped when verification is skipped]** Write the merged verification criteria of this Task — criteria first | `b/common-criteria.md` · the confirmed-spec section of `log/decisions.md` · (if a track is designated) `b/tracks/<track>/` | `log/T{N}_<job>/criteria.md` · `<paths specified in the call for the submitted copy of the criteria and the design handoff sheet written by B>` | solo |
| ★ | User | **[skipped when verification is skipped]** Criteria approval | `log/T{N}_<job>/criteria.md` | — | — |
| 3 | A1 | **[only when a design gate is declared]** Write the design spec — background / decisions / flow / schema / risks / satisfaction conditions | the confirmed-spec section of `log/decisions.md` · `<path/approved version of the design handoff sheet written by B and assigned by Z, when verification proceeds>` · `a/common-rules.md` · (if a track is designated) `a/tracks/<track>/rules.md` | `log/T{N}_<job>/design-spec.md` · `log/T{N}_<job>/build-summary/A1_design_R<M>.md` · `<path specified in the call for the submitted copy of the design>` | solo |
| ★ | User | **[only when a design gate is declared]** Design approval (gate) | `log/T{N}_<job>/design-spec.md` | — | — |
| 4 | A1 | Build the deliverables as the confirmed spec says and leave a build summary | the confirmed-spec section of `log/decisions.md` · `a/common-rules.md` · `input/` · (in a design-gate run) `log/T{N}_<job>/design-spec.md` · (if a track is designated) `a/tracks/<track>/rules.md` | `output/` (the path set by the spec) · `log/T{N}_<job>/build-summary/A1_build_R<M>.md` · `<path set in the spec and the call for the submitted copy of the deliverables>` | solo |
| ★ | User | Build review — open the deliverables directly and decide whether to go on | the deliverables in `output/` · `log/T{N}_<job>/build-summary/A1_*.md` | — | — |
| 5 | B2 (fresh) | **[skipped when verification is skipped]** Verify the deliverables against the approved criteria and judge | `log/T{N}_<job>/criteria.md` · the deliverables in `output/` · `log/T{N}_<job>/build-summary/A1_*.md` · `<path of the approved design/copy (gate run)>` · `<paths of the per-round neutral permission record · approval · reading/substitute sources · before/after comparison material>` | `log/T{N}_<job>/verification-summary/B2_*.md` | solo |
| ★ | User | Decide whether to give final acceptance — the **user downgrade** that can be chosen when B2's overall verdict is ⚠️ or ❌ is in §Collaboration backbone, below | `log/T{N}_<job>/verification-summary/B2_*.md` (in a run that skips verification, the material of ★ Build review as is) | — | — |

> **Assignee notation** — A1 = the designer-builder of this run (the same assignee for steps 3 and 4). B1 = the verifier who writes the criteria, B2 = the verifier who judges. **B1 and B2 are separate fresh sessions** — the eye that wrote the criteria and the eye that judges are kept apart. Because there is one judging verifier (B2), there is no verdict synthesis step.
> **Numbers** — the number of a skipped row is left empty and the flow goes to the next number (numbers are not pulled up). In any run "step 4" is A1's build, so the step notation in the ledger and the run log does not change from run to run.
> **Parallel** — this skeleton has one assignee per step. If a job splits enough that several assignees must run at the same time, it is already a job with the shape of something to be repeated — make a separate definition with `new-pipeline`.

### Conditional rows — switched on and off per run

| Mark | Meaning | Where it is switched |
|---|---|---|
| **[skipped when verification is skipped]** | **2 · ★ Criteria approval · 5** — in a run that skips verification, these three are skipped. ★ Build review · ★ Final acceptance remain as they are | "whether to verify" at ★ Spec confirmation |
| **[only when a design gate is declared]** | **3 · ★ Design approval** — attached in front of step 4 only when the spec said a design gate is needed. A run that does not declare it does not produce a design spec | "whether there is a design gate" at ★ Spec confirmation |

- Even in a run that skips verification, **opening the Task · the ledger (`log/manifest.json`) · `log/run-log.md` · the build summary are kept as they are.** Skipping filters out only the three verification rows.
- In a run that skips verification, ★ Final acceptance comes right after ★ Build review — the user looks at the deliverables and decides whether to accept.
- The conditions are settled once for that run at ★ Spec confirmation, so the places of the ★ are the same in either mode 1 or mode 2.

### The four things settled in negotiation (step 1) — the subject of ★ Spec confirmation

1. **Spec** — purpose · input · output (down to the deliverables' `output/` paths) · how/where deliverable versions are preserved. The submitted/approved original text of the design and the criteria is preserved as a copy by the owning role, and Git/version storage whose equal recovery effect has actually been confirmed is chosen in the spec. If it is a follow-up to a completed Task, also settle the baseline Task · the completed version/path/fingerprint · the acceptance record, and the change delta · the baseline to preserve · the impact of the change and the scope of checking. The design gate is chosen in the new spec, and a large design rewrite is not forced wholesale.
2. **Whether to verify** — **default = verification proceeds.** Z **proposes** skipping verification to the user only when it judges that **all** three below apply. The one who decides is the user.
   - ① The deliverable is not a final result but only material for the next step (e.g. web search results — they are still left in `output/`)
   - ② It is easy to undo if wrong
   - ③ It does not touch rule or configuration files
   - If even one does not hold, do not propose it — verification proceeds.
3. **Whether there is a design gate** — declare it if the job needs its design confirmed first.
4. **Track designation** — default none. If the job needs the knowledge of an existing track, designate its name (header table "Tracks used").

Order: **negotiation** (Z ↔ user, until agreement is reached) → **user approval** → **Z writes the confirmed spec in `log/decisions.md`** → ★ Spec confirmation. Z puts forward options and views (`[provisional]`), and the one who decides is the user.

Before ★ Spec confirmation, following "Input and host preparation" in [Z boot](../boot.md), record the actual means by which A/B read the source material, the common extract and its link to the original, the check that PDF tools are installed, and whether the project is tracked by git. Input preparation is format conversion and access checking; it is not interpretation, summarizing, or producing deliverables.

### Collaboration backbone — as is, even with a definition

- **Mode 1 · 2** — whether a person opens the windows or Z runs subagents. Chosen exactly as with other definitions.
- **★ Human checkpoint** — outside the ★ marked in the table in advance too, if a new human judgement is needed, stop and hand it back. A clear latest revision instruction, a conflicting/ambiguous answer, and the conditional proceed permission of a concrete revision round are distinguished by `../interaction-rules.md` §6.3·§6.4. Record approval by direct inspection and conditional proceed separately, and the next role after a ★ is a fresh session.
- **Criteria first** — in a run with verification, in both the first and the revision rounds, the order is step 2 criteria revision → ★ Criteria approval → step 3 design (gate run) → step 4 build. If the contents depend on each other, do not make them parallel even when the files differ. The approved version, conditions, annotations and external definitions of the design handoff sheet written by B, and its correspondence to the original text, follow `../interaction-rules.md` A-10.
- **Generous to A, sparing to B** — the call message rules are `z/interaction-rules.md` §2·§3 as is. The designated track is carried in that message.
- **B2 judges · the user accepts · Z neither builds nor judges** — the hard lines as is.
- **User downgrade — an official option at ★ Final acceptance** — even when B2's overall verdict is ⚠️/❌, **only when** B2's report has a `b/common-rules.md` §6.5 "[rule and actual verdict differ]" record can the user, on the basis of that record, downgrade by one level and accept. Without that record this option does not exist. Z writes the fact of the downgrade and the user's verbatim words in `log/decisions.md` and in the checkpoints of `log/manifest.json`. B2's report is not edited — the verdict stays verbatim as B2 wrote it, and the downgrade is a record of the acceptance.

### Rework and submitted versions

When the user decides on rework while in progress, a new A R{M+1} receives the original text of the findings, the approved version and the permitted paths, and fixes the findings and re-examines the assigned deliverables as a whole, the cause, and related impact. In a separate “Overall re-review” in the build summary it leaves what was fixed · kept · unverified · requests out of scope, and the basis. Spec changes · files of another role/Task · new design decisions are handed back as separate decisions. It ends at ★ Build review, and after the permission is recorded the flow goes to re-verification by a fresh B2. B2's scope is set by B2 itself, directly, from the approved criteria · the actual changes · dependent impact · what is unverified.

If the criteria need to change, after a fresh B revises the criteria and they are approved, the flow goes back in order starting from the design that is needed. The original text of every submitted/approved version of the design and the criteria, and the links among call R/criteria r · copy · fingerprint · user approval, follow `../interaction-rules.md` §6.1; the actual per-round neutral permission record · reading/substitute sources · before/after material follow §6.2. Z makes the variable paths of this step table concrete before the actual call. A's list of explanations is not a cap on B's comparison scope.

A change after completion preserves the earlier completed version and records and is opened as a new Task with a delta spec. Only the resumption of the same in-progress step after an external failure follows `../interaction-rules.md` §1.2.

---

## Completion conditions

- [ ] The deliverables in `output/` are at the path set by the spec and are not empty.
- [ ] `log/T{N}_<job>/build-summary/A1_*.md` exists and is not empty.
- [ ] A run with verification: `log/T{N}_<job>/criteria.md` (★ approved) and `log/T{N}_<job>/verification-summary/B2_*.md` exist, and a one-line verdict has been given. / A run that skips verification: the decision to skip (Z's proposal · the user's choice) is left in the confirmed-spec section of `log/decisions.md` and in `log/manifest.json`.
- [ ] A run that declares a design gate: `log/T{N}_<job>/design-spec.md` exists and ★ Design approval is left in the records.
- [ ] The user's approval at every ★ point switched on in this run is left in the records — Spec confirmation · (Criteria approval) · (Design approval) · Build review · Final acceptance.
- [ ] The user has given final acceptance.
- [ ] The status of this Task (`T{N}`) in `log/manifest.json` has been updated and `history` has one line per step.

---

## Records to keep

| What | Where | Who |
|---|---|---|
| Negotiation result · confirmed spec (including whether to verify · whether there is a design gate · track) | `log/decisions.md` | Z |
| Trace of progress per step (shared by all Tasks) | `log/run-log.md` | Z |
| Task ledger — Task list · status · dependencies | `log/manifest.json` | **Z only** |
| This Task's verification criteria (merged criteria · subject to human approval · only in a run with verification) | `log/T{N}_<job>/criteria.md` | B1 |
| Design spec (only in a run that declares a design gate) | `log/T{N}_<job>/design-spec.md` | A1 |
| Summary of what was built | `log/T{N}_<job>/build-summary/A1_<step>_R<M>.md` | A1 |
| Verification results (only in a run with verification) | `log/T{N}_<job>/verification-summary/B2_*.md` | B2 |
| Pipeline problems that surfaced this time · signs of repetition (candidates for `new-pipeline`) | `improvements/` (after the job is finished) | Z |

### Version and assignment link records

| What | Where | Who |
|---|---|---|
| Original text of the submitted version · own observation · fingerprint | `log/T{N}_<job>/observations/<role>_<step>_R<M>/submitted/` and the submission record (the actual path is fixed in the call) | the owning A/B |
| Per-round neutral permission record · change assignment · approval link | `log/T{N}_<job>/assignments/` | Z |
| Full text of the actual call | `log/T{N}_<job>/calls/<role>_<step>_R<M>.md` | Z |
