# Verification criteria — T{N} <job>

> **This file is a form.** In a real project, when a Task room (`log/T{N}_<job>/`) is opened, this form is copied and the verifier (B) fills it in.
> Lines that start with `▶` are guidance on how to fill it in, so delete them after filling in. `<...>` is a placeholder.
>
> **Three-layer structure** — the verification criteria come from three places:
> ```
> ① pipeline/b/common-criteria.md            items always checked, whatever the job        ┐
> ② pipeline/b/tracks/<track>/criteria.md    items checked only in this kind of job        ┴ Section A (pipeline reference)
> ③ items needed only for this Task          derived from this project's spec · agreement  — Section B (project additions)
> ```
> The three are merged into **these merged criteria** — by default the thing to approve is this one file. If it is split by target or a design handoff sheet is kept separately, **state the table of contents · the component files · the handoff scope and the version of each in the list of things to approve**. But do not lump them together:
> leave it divided into sections, **how far is what was brought from the pipeline (Section A) and from where is what was written in this project (Section B)**.
> The rules for merging (tidying duplicates · handling conflicts · marking sources) are set by `pipeline/b/common-criteria.md` §8.
>
> **Only the verifier (B) writes the body.** Other roles go only as far as copying this form into place (empty file · preamble).

| Item | Value |
|---|---|
| Task | `T{N}` |
| Job | `<job>` |
| Track | `<track name or none>` |
| Pipeline definition | `<z/pipelines/<job>.md or general mode>` |
| Revision | `r1` |
| Step · call round | `<step / B<N> / R<M> — separate from the criteria r>` |
| Status | Draft — awaiting ★ user approval (this row is not updated. The actual approval original text · the link to the target version are confirmed by the checkpoints of the Task concerned or the neutral assignment copy of that section) |
| Author | B |
| Spec · baseline version | `<spec path · version · approval. If it follows a completed Task: the baseline Task · completed version · fingerprint · change difference · preservation scope>` |

▶ Raise the revision to r2 · r3… each time user feedback is reflected, and stack one line each in §Change history at the very bottom. Do not overwrite and erase the content of a past revision.
▶ Preserve **a copy of the original text of each submitted/approved version** in B's write-assigned section and fill in §Version preservation record. A fingerprint · change history alone does not stand in for the copy. Git/version storage is chosen in the spec and used only when actual recovery is confirmed. Even if the call R goes up, do not automatically increase r if the criteria are the same. The path examples of this form do not stand in for the actual read/write assignment.

---

## 0. What these criteria check

▶ Write the verification target of this Task (the deliverable paths) and where the items were drawn from (the spec · agreement documents).
▶ The criteria are made **before the deliverables come out** — draw the items only from the spec · agreement, and do not draw them by looking at deliverables already produced (`pipeline/b/common-rules.md` §4.1).

- **Verification target**: `<the paths of the deliverables this Task will make>`
- **Where the items were drawn from**: `<spec · agreement document paths and sections>`
- **Track layer present or not**: `<if a track is designated, the path of layer ② / if not designated, write "no track layer — two-layer merged criteria">`
- **Version to use · approval scope**: `<this merged criteria r · table of contents/per-target composition · whether a design handoff sheet is included. The approval record links the version concerned in a separate file>`
- **Baseline for deriving changes / version for comparing preservation quality**: `<before/after comparison scope · point in time / the last Pass version or the first-round spec. Distinguish the purposes of the two>`

---

# ━━━ Section A — pipeline reference: criteria brought from the pipeline ━━━

▶ From here to before the Section B marker line is **what came from the pipeline repository**. The original of this section is the pipeline-side documents, and here is left "what was brought from which revision and how it is applied to this Task".
▶ If there is something you want to change from the original, do not change it here; write the fact that it disagrees in §Gray areas and get the user's confirmation.

## A-1. Verdict values · severities · overall verdict rules

▶ **Carry over as is** §1 (verdict values) · §2 (severities) · §6 (overall rules) of `pipeline/b/common-criteria.md`. This is because the person must approve, with this one file, even "what is checked with what weight" (§8 merging rules). Do not define them anew — if a definition is in two places, it cannot be told which is right when they drift apart.

`<reproduce here the tables of common-criteria.md §1·§2·§6>`

## A-2. Common-layer items (① `pipeline/b/common-criteria.md`)

▶ First state the location · revision (or date of confirmation) of the original referred to, and carry over the item table. Write the item numbers as in the original (in the form `common C-1`).
▶ In the "Applied this time" cell, make concrete in one line **how that item will be confirmed** in this Task.

- Original: `pipeline/b/common-criteria.md` (`<date of confirmation or revision>`)

| # | Item | Severity | Applied this time |
|---|---|---|---|
| common C-1 | `<original wording>` | Required | `<how to confirm in this Task>` |
| … | | | |

## A-3. Track-layer items (② `pipeline/b/tracks/<track>/criteria.md`)

▶ Fill in only for a Task with a designated track. If there is no track, do not delete this section; leave "no track layer" — a later reader must be able to tell "whether it was left out or does not exist".
▶ If a track item conflicts with the common layer, **the common layer wins** — write the fact of having found the conflict in §Gray areas.

- Original: `pipeline/b/tracks/<track>/criteria.md` (`<date of confirmation or revision>`)

| # | Item | Severity | Applied this time |
|---|---|---|---|
| track `<track code>-1` | `<original wording>` | `<original severity>` | `<how to confirm>` |
| … | | | |

# ━━━ Section B — project additions: criteria additionally written in this project ━━━

▶ From here on is **what was newly written in this project** (layer ③). Put only the items peculiar to this Task that are not in the pipeline — do not repeat what the pipeline layers say (if they overlap, it cannot be told which is right when they drift apart).
▶ Each item must always have **a source (which decision of which spec · agreement document)** attached. An item without a source loses its basis at approval.
▶ If an item worth using repeatedly is confirmed here, propose raising it to the pipeline track layer after the Task ends — the direction of raising is one way only, project→pipeline, and the raising too is the verifier's share.

## B-1. This Task's items (T-*)

| # | Item | Severity | How to check | Source (spec · agreement) |
|---|---|---|---|---|
| T-1 | `<item>` | `<Required/Recommended/Optional>` | `<how to confirm>` | `<decision number · document section>` |
| … | | | | |

## B-2. Preservation list (only for work that touches the original)

▶ If it is work that has an original, such as moving · tidying · converting, pin down here, before production, **what must be preserved** (`pipeline/b/common-criteria.md` §5.3). If not applicable, leave "not applicable — work that does not touch the original".

| # | What to preserve | Severity | How to check | Source |
|---|---|---|---|---|
| S-1 | `<preserved surface>` | `<severity>` | `<how to compare>` | `<basis>` |

# ━━━ End of sections ━━━

---

## Reading sources · means · link to the actual assignment

▶ According to `pipeline/b/common-criteria.md` §8.2, write per reading target the main source · substitute source · conditions of use · means · handling when missing. Mark a follow-up file that does not exist yet as a material slot · planned time. Z links the actual path · version · fingerprint · reading scope to MR-2 before the verdict call. A link is not additional read permission.
▶ The source for C-6 is the original text of the neutral read/write assignment per role · round that was actually applied. Link the same permission section · path/fingerprint · time of application · changed version of the A call. The current ledger `agents` or A's own change list alone does not stand in for it.

| Reading target/item | Main source · version · section | Substitute source · conditions of use | Means · location of the observation record | Handling when missing |
|---|---|---|---|---|
| Approved version | `<spec/criteria/design · approval original text · fingerprint>` | `<the preserved copy in the approval section of the same version>` | `<direct reading · version comparison>` | `<no assuming approval · return to Z>` |
| Actual permission (C-6) | `<neutral assignment per role/round · call link · time of application>` | `<the preserved copy of the same permission section of that time>` | `<compare with the actual before/after changes>` | `<request additional assignment · record as unconfirmed>` |
| Change · preservation | `<Git root/baseline/target version/working tree or before/after lists · original-text copies>` | `<recovery material of the same scope · point in time>` | `<uncommitted · untracked · hidden/ignored scope · fingerprint · body comparison>` | `<record exclusion · failure · unknown attribution>` |
| `<track/Task item>` | `<actual output · input original text · the section needed>` | `<the substitute and the limits of confirmation>` | `<tool · command · location of results>` | `<apply common §7>` |

### Reading method

▶ Write the independent reading procedure to be used in the actual Task. If there is a B skill, carry the method · the relevant reference section · the fingerprint into a separate section per `pipeline/b/common-rules.md` §9.3. The judging B uses the method of the approved merged criteria.
▶ If byte observation is needed, read directly per §4.4 of the same document and distinguish CRLF pairs · lone CR/LF · the end of the last line · BOM. Leave the target version · tool/environment · command · values, and check new tools · suspicious results · important figures against known positive/negative samples or by another means. Measurement of every figure with two tools is not required.
▶ The re-verification scope is set by the judging B from the approved criteria · the actual changes · the dependency impact · the unconfirmed items. Do not set the cap by A's self-check or the list of the previous findings. Do not treat a Required could-not-be-verified as met by follow-up registration alone.

`<the concrete reading method, or not applicable and the reason>`

## Version preservation record

▶ The default is a copy per round. In the record below, the final fingerprint of its own file points to a separate submission record. After the original text of the copy is fixed, Z links the approval original text · date · target version · scope. After approval, do not go on editing the Status in the body or the copy.

| Field | Value |
|---|---|
| Task · step · role · call R / criteria r | `<T… / step / B… / R… / r…>` |
| Working file · list of components | `<the actual list of the table of contents · merged/per-target criteria · design handoff sheet>` |
| Submission time · copy path | `<the fixed copy in the owning B's assigned section · submission time>` |
| Byte count · SHA-256 record | `<path of the separate submission record that has the values per component file>` |
| Previous version · means of recovery | `<the previous submitted/approved copy or a fixed commit/blob · restore location>` |
| Actual recovery confirmation | `<the record of having restored · opened · compared fingerprints in the permitted observation section>` |
| Approval link | `<the path where Z will record the actual user original text · source · date · target version/fingerprint · approval scope. If before approval, mark it as planned>` |

## Design handoff sheet — write only when applicable

▶ Follow `pipeline/b/common-rules.md` §7.3 · `common-criteria.md` §8.3. Use an excerpt/per-target file written by B, or a reproduction of the original text. A reads only the handoff sheet assigned in the call. Do not take as the default the whole merged criteria · the whole of `b/` · chained references to earlier call messages. If there is no design step, leave not applicable and the reason.

| Field | Value |
|---|---|
| Original criteria path · r · fingerprint · approval record/scope | `<the fixed version and the exact scope>` |
| Handoff target · method | `<the design-spec target / whichever method applies among reproduction of the original text · excerpt · per-target file>` |
| Handoff file · fingerprint record | `<path of the B write-assigned file / the separate submission record>` |
| Handoff-scope approval link | `<which components · items · versions of the original criteria and the handoff sheet are the things to approve>` |

| Included item ID | Original-text section/row | Location in the handoff sheet | Original text ↔ handoff location of the applicability conditions · notes · external definitions |
|---|---|---|---|
| `<D-* · C-D1, etc.>` | `<location in the original text>` | `<location>` | `<map them with none missing, including the not-applicable conditions>` |

▶ Check directly not only the items but also the conditions · notes · referenced definitions. A hash is a version identifier and does not prove correctness · completeness · absence of design impact. If it is unclear whether a new excerpt is included in the existing approval scope, return the scope to the user. After the criteria are revised · approved, design with that version. Z's fingerprint/line comparison is not a quality verdict.

## Link to the proceed-permission record

▶ Distinguish approval by direct inspection from conditional proceed (`pipeline/b/common-criteria.md` §8.4, the original text of the procedure `pipeline/z/interaction-rules.md` §6). The below are cells for linking the permission source Z recorded. B does not permit the next step or make up and insert a user statement.

- Kind of permission · source: `<whichever actually applies among approval by direct inspection / conditional proceed / the existing choice to skip in the track definition / before approval, and the record path>`
- Version concerned · scope: `<the criteria r · copy · fingerprint · link to the user's original text/source/date>`
- If conditional proceed: `<the Z record that has the existing approved version · the concrete changes/objective conditions already permitted · the material comparing the actual whole change · the applied version/fingerprint · the permitted next step>`
- Undecided · out-of-scope change · condition failure: `<what is to be returned as a separate choice, or none>`

▶ Conditional proceed applies only to a revision round for which the concrete change scope and the next action have already been permitted. Some rows unchanged · R2 or later · no objection after the fact are not blanket approval. The existing skipping of output Criteria approval in spreadsheet follows the user's choice · gray-area · record conditions as they are. In any case the criteria-writing call ends and the next role is a new call.

---

## Gray areas — what is asked to be settled at the ★ approval

▶ The ambiguous places found while making the criteria — a sentence that reads two ways, items that disagree between layers, a blank in the spec. Do not write a fix in its place — write only the four: where · what fact (quoting the original text) · provisional view · what is asked to be decided. If there are none, leave "none".

| # | Where | What fact | Provisional view | Asked to decide |
|---|---|---|---|---|
| G1 | | | | |

---

## Appendix

### Item count tally

▶ Count per section · severity. At the overall verdict the rule "3 or more Recommended items not met → Fail" hangs on this number.

| Section | Required | Recommended | Optional | Total |
|---|---|---|---|---|
| A-2 Common layer | | | | |
| A-3 Track layer | | | | |
| B-1 This Task | | | | |
| B-2 Preservation list | | | | |
| **Total** | | | | |

### Change history

| Date | Revision / call R | Change · previous-version copy/fingerprint record | Author |
|---|---|---|---|
| `<YYYY-MM-DD>` | r1 / R1 | `<draft · path of the submission record>` | B |
