# Pipeline definition — spreadsheet

> A pipeline that handles Excel (xlsx) work in general as one Task. It consists of **two stages of actual work** — ① layout work (reading and analyzing the input + deciding what to make/change and in what shape → the layout document) ② output work (writing the actual xlsx based on the layout). Each stage has its own builder and verifier, and skills per target (currently table · block diagram) are pulled in from `skills/`. New targets and new forms of work **may be added later.**
> **Status: complete (`new-pipeline` — T6 of the origin workspace, ★ Final acceptance 2026-10-15).** Step 1 (Z) filled in the header table, and step 3 (A) filled in the step table · completion conditions · records to keep — the basis is the confirmed spec, `log/AI 논의사항.md` Round 7 D-58 ~ D-72 of the origin workspace.
>
> `T{N}` · `<job>` · `<target>` are variables — Z fills them in when it opens the Task. `<target>` is the last part of the skill path name (`table` · `block-diagram` …).

---

## Header table

| Item | Content |
|---|---|
| Purpose | Carry out Excel (xlsx) work in two stages, layout work → output work, on a working copy without modifying the original |
| Input | The original xlsx + source material + the kind of work and the requirements set by the user. The original is not modified |
| Output | Layout document (md — in the design-gate place `log/T{N}_<job>/design-spec.md`) + working-copy xlsx in `output/` + change record (a separate file inside that Task's output, one section per version) + `log/T{N}_<job>/build-summary/A<N>_*.md` |
| Tracks used | spreadsheet (`a/tracks/spreadsheet/` · `b/tracks/spreadsheet/`) — skill = stage (layout · output) × target (table · block diagram …), paired by the same name on the A and B sides |
| Expected step count | **8 (Z negotiation · B1 · A1 · B2 · B3 · A2 · B4 · B5) + 4 human checkpoints** (Spec confirmation · layout Criteria approval · Design (layout) approval · Final acceptance). A run that opens ★ output Criteria approval: + 1 checkpoint. Counting = numbered rows + ★ rows; conditional rows are counted only when switched on in that run |


---

## Step table

| # | Who | What | Reads | Writes | Parallel |
|---|---|---|---|---|---|
| 1 | Z·User (negotiation) | Agree on what to make or change, and when the user approves, Z writes down the confirmed spec (→ §Spec, below) | the user's request · `input/` · `project-map.md` · `log/manifest.json` | `log/decisions.md` (Z only) | solo |
| ★ | User | Spec confirmation | the confirmed-spec section of `log/decisions.md` | — | — |
| 2 | B1 (layout-criteria B) | Write the merged verification criteria of the layout stage — criteria first | `b/common-criteria.md` · `b/tracks/spreadsheet/` · the confirmed-spec section of `log/decisions.md` · `input/` | `log/T{N}_<job>/criteria.md` · `log/T{N}_<job>/criteria-layout.md` | solo |
| ★ | User | Layout Criteria approval + decide **whether to receive · or skip the output Criteria approval** (Z asks and writes the answer in the ledger checkpoints — §Output Criteria approval, below) | `log/T{N}_<job>/criteria.md` · `log/T{N}_<job>/criteria-layout.md` | — | — |
| 3 | A1 (layout A) | Read and analyze the input, and write the layout document that settles what to make/change and in what shape (the design spec of the design gate) | the confirmed-spec section of `log/decisions.md` · `input/` · `a/common-rules.md` · `a/tracks/spreadsheet/rules.md` · `a/tracks/spreadsheet/skills/layout/<target>.md` · `a/tracks/spreadsheet/references/` · `b/tracks/spreadsheet/references/user-preferences.md` | `log/T{N}_<job>/design-spec.md` · `log/T{N}_<job>/build-summary/A1_*.md` | solo |
| 4 | B2 (layout B, fresh) | Judge the layout document against the approved layout criteria | `log/T{N}_<job>/criteria.md` · `log/T{N}_<job>/criteria-layout.md` · `log/T{N}_<job>/design-spec.md` · `log/T{N}_<job>/build-summary/A1_*.md` · `input/` | `log/T{N}_<job>/verification-summary/B2_*.md` | solo |
| ★ | User | Design (layout) approval (gate) — Z writes the fingerprint of the approved version in the ledger checkpoints (§Fingerprint of the approved layout, below) | `log/T{N}_<job>/design-spec.md` · `log/T{N}_<job>/verification-summary/B2_*.md` | — | — |
| 5 | B3 (output-criteria B) | Write the merged verification criteria of the output stage — with the approved layout as the source | `b/common-criteria.md` · `b/tracks/spreadsheet/` · the confirmed-spec section of `log/decisions.md` · `input/` · `log/T{N}_<job>/design-spec.md` · `log/T{N}_<job>/criteria.md` · `log/manifest.json` | `log/T{N}_<job>/criteria-output.md` | solo |
| ★ | User | **[Optional]** Output Criteria approval — the conditions under which it is switched on are in §Output Criteria approval, below | `log/T{N}_<job>/criteria-output.md` | — | — |
| 6 | A2 (output A) | Make (modify) the working-copy xlsx in `output/` as the approved layout says, and leave a change record | `log/T{N}_<job>/design-spec.md` (the approved copy) · the confirmed-spec section of `log/decisions.md` · `input/` · `a/common-rules.md` · `a/tracks/spreadsheet/rules.md` · `a/tracks/spreadsheet/skills/output/<target>.md` · `a/tracks/spreadsheet/references/` | `output/T{N}_<job>/` (working copy · backup · dry list · change record — if the spec set a different path, that path) · `log/T{N}_<job>/build-summary/A2_*.md` | solo |
| 7 | B4 (output B, fresh) | Judge the output against the approved output criteria — checking wording · design · readability together | `log/T{N}_<job>/criteria.md` · `log/T{N}_<job>/criteria-output.md` · `output/T{N}_<job>/` · `log/T{N}_<job>/build-summary/A2_*.md` · `log/T{N}_<job>/design-spec.md` · `input/` · `log/manifest.json` · `b/tracks/spreadsheet/references/` (the files that items of `criteria-output.md` point to) | `log/T{N}_<job>/verification-summary/B4_*.md` | solo |
| ★ | User | Decide whether to give final acceptance | `log/T{N}_<job>/verification-summary/B4_*.md` · `output/T{N}_<job>/` | — | — |
| 8 | B5 (preference-recording B) | After ★ Final acceptance, copy the user preferences that surfaced in this Task into the preferences file — does not judge | `log/manifest.json` (this Task's checkpoints) · `log/decisions.md` (this Task's section) · `log/T{N}_<job>/verification-summary/B4_*.md` · `b/tracks/spreadsheet/references/user-preferences.md` | `b/tracks/spreadsheet/references/user-preferences.md` (the original in the pipeline repository) | solo |

> **Assignee notation** — A1 = layout A, A2 = output A. B1 = layout-criteria B, B2 = layout B, B3 = output-criteria B, B4 = output B, B5 = preference-recording B. **The five Bs are fresh sessions separate from one another** — the eye that wrote the criteria and the eye that judges are kept apart, and the verdicts of the two stages are kept apart too. A1 and A2 are also separate sessions (there is a ★ between them).
> **There is no verdict synthesis step** (D-61 G-17). The verdicts of B2 and B4 are each material for a different ★ (Design approval · Final acceptance). Checking wording (vocabulary that does not sound like AI) · design · readability is done together by B4.
> **Numbers** — even when a row is skipped, numbers are not pulled up. In any run "step 6" is A2's output, so the step notation in the ledger and the run log does not change from run to run.
> **Skills** — there is one or more `<target>` per Task (both, if a table and a block diagram are handled together). The layout skill is chosen in the confirmed spec and confirmed by the layout document, and the output skill is chosen according to **the targets set by the approved layout document**. The A-side skill and the B-side skill are paired by the skill path name (`layout/table` · `layout/block-diagram` · `output/table` · `output/block-diagram`) (`a/common-rules.md` §7.2 · `b/common-rules.md` §9.2).

### Spec — what is settled in the step 1 negotiation (the subject of ★ Spec confirmation)

1. **Target** — the targets this Task handles (`table` · `block-diagram` …) and the layout skill that fits them. If it could not be settled, write that it could not be settled (B1 does not pick one by guessing).
2. **Starting point** — whether a baseline file is modified (editing an existing file) · a given form is filled in (filling in a form) · something is made anew without a baseline (new creation).
3. **Input** — the paths of the original/baseline xlsx and the source material (under `input/`).
4. **Output path** — default `output/T{N}_<job>/`. To make it different, settle it here.
5. **Requirements** — what is made or changed, what must not be done, and the preferences the user set to be kept in this Task (if any).

### Design gate — this pipeline declares it

Layout work is the design (D-59 "사람 확인" (human confirmation)). The two rows **3 (A1 layout document) · ★ Design (layout) approval** in the step table are the two design-gate rows of `_template.md`.

- The owner of the design spec is **A1**, and its place is that Task's log room — `log/T{N}_<job>/design-spec.md`. In this pipeline that file is called the **layout document**.
- What the layout document holds is the decisions of that one Task. The form to write it in is in `a/tracks/spreadsheet/references/layout-doc-template.md`.
- After ★ Design approval the layout document becomes **the spec of the output stage**. After approval that file is not modified — if something needs changing, see §When going back, below.

### Output Criteria approval — chosen per Task (D-62 G-18 · D-63 G-20)

| When | Who | What | What remains |
|---|---|---|---|
| At ★ layout Criteria approval | Z asks and the user decides | "Whether a person also approves the output criteria (`criteria-output.md`) / or it is skipped" | The user's answer verbatim, in that checkpoint of the ledger (`log/manifest.json`) |
| End of step 5 (when B3's result is received) | Z | **Switches** ★ output Criteria approval **on or off** by one of the three below | One line in the ledger history |

- **Switch on** — ① the user decided "receive it" ② even though the user decided "skip", **B3 raised a gray area for a person to decide** (including the case where it stopped the merged criteria — G-20) ③ there is no record of the choice in the ledger (without a record it is not regarded as skipped).
- **Switch off** — the user decided "skip", and B3 did not raise a gray area for a person to decide. In this case go straight to step 6 (A2). **In a run that skips it, that skip decision left in the ledger is the basis on which B4 uses the criteria** — skipping is a decision that "a person need not look at the criteria", not a decision that B may decide in the person's place what a person is to decide.
- Either way the place of the ★ is fixed, so mode 1 and mode 2 stop at the same place.

The common conditional proceed (`../interaction-rules.md` §6.4) is the permission of a round that has already allowed the concrete revision scope and the next action. It does not widen the conditions above for skipping the output Criteria approval — the user's choice · gray area · presence of a record — and it does not remove the reopening on a gray area. Approval by direct inspection · this definition's skip decision · the conditional proceed record are distinguished. The role ends at that step and the next is a fresh session.

### Fingerprint of the approved layout

- A1 fixes every submitted version of the layout as the separate copy specified in the call and leaves bytes · SHA256 · submission time · baseline version · step/role/round R · document revision and path. Z separately links to that copy the original text of the approval · source · date · scope. The criteria version is preserved by B, and criteria r and call R are distinguished. The copy is the default, and for Git/version storage chosen by the spec, confirm the file · commit/blob · restore location and an actual restore-and-open. Leaving only a fingerprint does not substitute for preserving the original text (`../interaction-rules.md` §6.1).
- At ★ Design (layout) approval Z measures the **SHA-256** of the approval target `log/T{N}_<job>/design-spec.md` and writes it, together with the user's words, in that checkpoint of the ledger. This is the value that points to "the approved layout".
- If that value differs from the value written in B2's report (the case where a version modified after the verdict was approved), Z writes that fact too in the same checkpoint.
- The step 6 call message carries this value. When A2 starts, it measures `design-spec.md` again and checks that it is the same, and if it differs, **it does not build and stops.** A2 writes this value at the head of the version section of the build summary and of the change record file.

### When going back (rounds)

- Even when a new round starts, the copies of the earlier submitted/approved original text and the version/approval links are kept. A's summaries distinguish step and round as `A<N>_<step>_R<M>.md`, and the names of existing past files are not changed. The actual places to write the copy and the summary are stated in the call.
- **Layout R{M}** — if something to fix comes out of B2's verdict or ★ Design approval, step 3 (A1) → step 4 (B2, a new fresh session) is run again as R2 · R3 …. The layout criteria are not rewritten (if the criteria need to change, a new revision by B1 + ★ approval again).
- **Output R{M}** — if something to fix comes out of B4's verdict or ★ Final acceptance, step 6 (A2) → step 7 (B4, a new fresh session) is run again. The approved layout stays as is.
- **Layout defect during output** — if A2 meets a place that cannot be built from the approved layout alone or where the layout must be changed, it does not change it; it stops and hands it back (`a/common-rules.md` §8). If the user decides to go back to layout R{M}, the flow runs again from step 3 and, with the newly approved layout, goes again from step 5 (B3) — because the approval fingerprint changes.

A new change after completion preserves the completed version, and the change delta · the baseline to preserve · the impact are settled as the spec of a new Task (`../boot.md` §Changes after completion). It is distinguished from resuming an in-progress step after an external failure.

### Preference recording — step 8 (D-62 · D-63 G-21 · D-64 G-22)

- After ★ Final acceptance Z calls B5 **always, once**. Deciding whether there is anything to accumulate is also B5's part — if there is nothing to accumulate, B5 adds no line and returns that fact as its result.
- The one place B5 writes is **the original in the pipeline repository**, `b/tracks/spreadsheet/references/user-preferences.md` (because it is after ★ Final acceptance, not in the middle of the work — D-63). The pipeline repository outside that file is read-only for B5 too. What to write and how follow §1 · §2 of that file.
- Step 8 is not a verdict, so it does not change the result of ★ Final acceptance. However, the Task is closed after the step 8 result is received (completion conditions).

### Collaboration backbone

- **Criteria first** — the criteria of each of the layout and output stages (B1 · B3) come before that stage's A (D-61 G-16). The order is not changed.
- **Generous to A, sparing to B** — the call message rules are `z/interaction-rules.md` §2·§3 as is. The step 6 call message carries the fingerprint of the approved layout.
- **B2 · B4 judge · the user accepts · Z neither builds nor judges** — the hard lines as is.

---

## Completion conditions

- [ ] `log/T{N}_<job>/design-spec.md` (the layout document) exists and is not empty, and ★ Design approval and the SHA-256 of that version are left in the ledger checkpoints.
- [ ] The working-copy xlsx and the change record file exist in `output/T{N}_<job>/` (or the path set by the spec) and are not empty. The SHA-256 of the working copy is written in `log/T{N}_<job>/build-summary/A2_*.md`.
- [ ] `log/T{N}_<job>/build-summary/A1_*.md` · `A2_*.md` exist and are not empty.
- [ ] `log/T{N}_<job>/criteria.md` · `criteria-layout.md` · `criteria-output.md` exist, and ★ layout Criteria approval is left in the records. For the output criteria, either the ★ approval record or the skip decision (the user's answer verbatim) is left in the ledger checkpoints.
- [ ] `log/T{N}_<job>/verification-summary/B2_*.md` · `B4_*.md` exist and each has given a one-line verdict.
- [ ] The user's approval at every ★ point switched on in this run is left in the records — Spec confirmation · layout Criteria approval (+ whether to have output Criteria approval) · Design approval · (output Criteria approval) · Final acceptance.
- [ ] The user has given final acceptance.
- [ ] The step 8 B5 result (the numbers of the lines added, or "nothing to accumulate") is left in `log/run-log.md`.
- [ ] The status of this Task (`T{N}`) in `log/manifest.json` has been updated and `history` has one line per step.

---

## Records to keep

| What | Where | Who |
|---|---|---|
| Negotiation result · confirmed spec | `log/decisions.md` | Z |
| Trace of progress per step (shared by all Tasks) | `log/run-log.md` | Z |
| Task ledger — status · dependencies · checkpoints (including the choice on output Criteria approval · the SHA-256 of the approved layout) | `log/manifest.json` | **Z only** |
| This Task's verification criteria — table of contents + merged layout criteria | `log/T{N}_<job>/criteria.md` · `log/T{N}_<job>/criteria-layout.md` | B1 |
| This Task's verification criteria — merged output criteria | `log/T{N}_<job>/criteria-output.md` | B3 |
| Layout document (design spec) | `log/T{N}_<job>/design-spec.md` | A1 |
| Summary of what was built | `log/T{N}_<job>/build-summary/A1_*.md` · `A2_*.md` | A1 · A2 (each its own file) |
| Working copy · backup · dry list · change record | `output/T{N}_<job>/` (or the path set by the spec) | A2 |
| Verification results | `log/T{N}_<job>/verification-summary/B2_*.md` · `B4_*.md` | B2 · B4 (each its own file) |
| Accumulated user preferences | `b/tracks/spreadsheet/references/user-preferences.md` (pipeline repository) | B5 |
| Pipeline problems that surfaced this time | `improvements/` (after the job is finished) | Z |

### Version and assignment link records

| What | Where | Who |
|---|---|---|
| Original text of the submitted version · own observation · fingerprint | `log/T{N}_<job>/observations/<role>_<step>_R<M>/submitted/` and the submission record (the actual path is fixed in the call) | the owning A/B |
| Per-round neutral permission record · change assignment · approval link | `log/T{N}_<job>/assignments/` | Z |
| Full text of the actual call | `log/T{N}_<job>/calls/<role>_<step>_R<M>.md` | Z |
