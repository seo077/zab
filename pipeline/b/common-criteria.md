# Common criteria — items that apply to any work

> **This document is the first of three layers.** What is here is always looked at, whatever the track.
> In actual work, this document + `b/tracks/<track>/criteria.md` + the items needed only for this work are
> **merged into one by the verifier** and sent down as `log/T{N}_<job>/criteria.md` of the Task room concerned (§8).
> The body is written only by the verifier. Other roles go only as far as the folder and an empty file.

---

## 0. The skeleton of this document

```
§1  The three verdict values   — Pass / Conditional / Fail
    §1.1 Doc-gap ⚠️            — a ⚠️ where only the written place is missing and the deliverable has it
§2  The three severities       — Required / Recommended / Optional
§3  Common items · form        C-1 – C-8
§4  Common items · does it actually work  C-F1 – C-F3
    §4.1 What else is checked in a design-gate run — C-D1
§5  When the work touches an original — intactness · comparison baseline · preservation list
§6  Overall-verdict rules
§7  Handling gray areas
§8  How to merge the three layers — making the Task room's criteria.md
```

The **definitions** of the verdict values and the severities **are in this document only.** They are not written in the orchestrator's or the designer's documents — if a definition is in two places, when they drift apart it becomes impossible to know which side is right.

---

## 1. The three verdict values

| Notation | Meaning | What to do next |
|---|---|---|
| ✅ **Pass** | All Required satisfied and Recommended largely satisfied too | Go to the next step |
| ⚠️ **Conditional** | Required is satisfied, but something remains in Recommended or discovered items (the effect is small) | Fix it, then look again |
| ❌ **Fail** | Even one Required not met, or the spec violated, or several Recommended missing | The user decides whether to send it back |

> **"Almost done" is not a Pass.** If not certain, do not give a Pass.

### 1.1 Doc-gap ⚠️ — one kind of ⚠️

**Doc-gap ⚠️** = the ⚠️ for the case where the content an item requires **is not written in the document**, but **B has directly confirmed** that **the deliverable itself has that content (measure · means · value)**.

- **The basis is required in full, as is** — in addition to the three (which criterion / which deliverable / which evidence), **the evidence on the deliverable side (file · line · execution result)** must always be written. If it cannot be written, it is an ordinary ⚠️ (§7).
- **Only B decides it.** Z·A cannot decide which ⚠️ is a doc-gap ⚠️. "It is in the deliverable" written in A's summary or self-check is not a basis — only what B confirmed by opening the deliverable directly counts (`b/common-rules.md` I-2).
- **It does not hold when the document is itself the deliverable.** Where the written wording itself is the product, as with a rule document or a report, missing wording means that the deliverable does not have that content, so it is an ordinary ⚠️ (or ❌).
- **It exists only for ⚠️.** ❌ is not divided by doc-gap. The verdict values are still three, and doc-gap ⚠️ is only a marking that states the nature of a ⚠️ — the only place where it is counted differently is §6 Overall-verdict rules.
- **Write it in the report like this** — in the result cell of the per-item table write `⚠️ doc-gap`, and in the basis cell write the evidence on the deliverable side. A ⚠️ without the marking is counted as an ordinary ⚠️. On the overall line, state separately the number of ⚠️ and, of those, the number of doc-gap ⚠️ (e.g. `Required ⚠️ 1 (doc-gap 1)`).
- **It does not drop out of what to fix** — for a doc-gap ⚠️ too, write "what · how · where" the wording is to be reinforced (`b/common-rules.md` V-5). It is only counted less heavily in the overall verdict; the finding does not disappear.
- The meaning of §1 ⚠️ Conditional ("Required is satisfied, but…") and §2 Required's "even one → ❌" are **excepted for doc-gap ⚠️ only** — the content is in the deliverable and only the written place is missing, so the overall verdict follows the doc-gap rows of the §6 table.

---

## 2. The three severities

| Grade | Meaning | When not met |
|---|---|---|
| **Required** | Without this the deliverable does not hold | Even one → ❌ Fail |
| **Recommended** | It runs without it, but the price is paid later | 1–2 → ⚠️ or ❌ depending on the effect / **3 or more → ❌** |
| **Optional** | Good to have | Does not block. Leave it as a memo, as a candidate for the next round |

> If what is not met is **doc-gap ⚠️ (§1.1) only**, follow the doc-gap rows of the §6 table instead of the "When not met" column above. Recommended's "3 or more → ❌" counts doc-gap ⚠️ as well.

---

## 3. Common items · form (C-1 – C-8)

| # | Item | Severity | How to look |
|---|---|---|---|
| **C-1** | The deliverable is **at the path** instructed | Required | Query the file list and existence directly. Search tools can miss Korean names and empty files, so **use a shell query as well** |
| **C-2** | It is not empty | Required | Size + whether the sections that must be there are actually there |
| **C-3** | The explanatory text A wrote (documents · code comments · explanations of evidence) has **no verification viewpoint or verdict words** | Required | Search for `PASS`·`FAIL`·`⚠️`·`Pass`·`Fail`·`통과`·`미달` and **look at the context as well.** A rule sentence that points at what is prohibited is not applicable. Original tool output (quotations of test runners, build logs and the like) and the "Self-check" section of the build summary (the form in `a/common-rules.md` §5) are excluded. The self-check is not used as a basis for the verdict (`common-rules.md` I-2). Even in a mixed log, an explanation A appended is not excluded as original tool output |
| **C-4** | Rounds were **stacked, not overwritten** | Required | See whether the previous rounds of the report remain and whether the original text of each submitted/approved version of the design and the criteria is recovered from a copy or from confirmed version storage. Link the path · r/R · fingerprint · scope of approval. Fingerprints and change history alone are not preservation. Other deliverables are compared against the version-preservation method set by the spec |
| **C-5** | **The paths** the document points to **actually exist** | Recommended | Check the paths that appear in the body one by one, within the assigned scope. If outside the assignment, follow the additional-assignment procedure of §8.2. If a broken one is an intended follow-up, §7 |
| **C-6** | **Nothing outside the instructed paths was touched** | Required | Compare the original text of the neutral read/write assignment actually applied per role and round (including the time of application · the A call path/fingerprint · the identical permission section · changed assignments) against the actual before/after files · fingerprints/commits. For Git, fix the baseline · target version · working tree and include uncommitted and untracked items as well; for non-Git, use the before/after lists and original-text copies. The current ledger or A's own change list alone does not substitute for the whole of the permissions and changes (`common-rules.md` §4.3) |
| **C-7** | **Self-made decisions (M-N) are recorded** | Recommended | Whether what was decided without the user having decided it remains in the summary. If it does not remain, the basis is lost |
| **C-8** | This step **remains in the ledger and the summaries** | Recommended | `log/manifest.json` by the orchestrator, the per-assignee summaries by each one. Also see that the per-assignee files are not mixed. B confirms by the neutral assignment file in which Z excerpted only the necessary facts of the ledger, and by the assigned per-assignee summaries (§8.2). Do not demand to read the whole ledger |

> For C-3·C-6, **do not pass it by looking only at what is written.** "Did not touch it" is a self-report, so compare the actual files.

If byte counts, line endings or the BOM are taken as a basis, observe the bytes directly per `common-rules.md` §4.4. Distinguish CRLF pairs · lone CR/LF · the final line ending · the BOM, and check new tools, suspicious results and important figures against known positive/negative samples or another means. In the merged criteria, write the reading means to be used in the Task concerned and the location of the evidence (§8.2). This is not a rule to measure every figure with two tools or to generalize the experience of a particular PC to all environments.

---

## 4. Common items · does it actually work (C-F1 – C-F3)

Looking only at form ends up passing a deliverable whose **shape is right but which is of no use**. Look at the following as well.

| # | Item | Severity | How to look |
|---|---|---|---|
| **C-F1** | **Does it actually perform its original purpose** | Required | Confirm in the spec what this deliverable was made to do, and see whether the body actually does that. If only the shape is right, Fail |
| **C-F2** | **Does it hold when actually used** | Required | If it is a document, follow one step as that document tells you to. If you get stuck while following, Fail. If it cannot be followed, write that fact as a limit |
| **C-F3** | **Does it not conflict with other rules and structures** | Required | Whether two documents are not saying the same thing differently. If one side is the latest agreement, that side is right, and **the fact of the mismatch itself is left as a finding** |

### 4.1 What else is checked in a design-gate run (C-D1)

**Applicability condition — looked at only when it is a code Task, and also a design-gate run.** Code Task = a Task whose deliverables include code that is executed (programs · scripts). Design-gate run = a run in which the pipeline declares a design step + ★ Design approval so that `design-spec.md` comes into being in the Task room. If either one is not the case, it is **not applicable** — in the merged criteria (§8) do not delete it but leave it as "Not applicable (which condition is not met)", and do not count it in the item tally or the overall verdict.

| # | Item | Severity | How to look |
|---|---|---|---|
| **C-D1** | **The means for the verifier to execute and observe are stated explicitly in the design spec** — **run command · state-inspection means · log location** | Required | Open `design-spec.md` and look for the three means one by one — run command (the command or entry point that runs the deliverable) / state-inspection means (the command or tool that looks into the state of the deliverable, such as DB · files · screen) / log location (what is left where). **If even one of the three is missing, it is not met.** Whether the means written are actually usable is seen by using them in C-F2 |

> C-D1 is an item whose target is the design spec. In a design-gate run, Z either reproduces verbatim the wording, the applicability condition and the notes of this item, or assigns to the A1 call the version of the design-use excerpt / per-target criteria file of the approved scope written by B (§8.3, `z/interaction-rules.md` A-10). It does not mean A reading the original merged criteria or all of `b/`.
> If it is missing from the design spec but B has directly confirmed that the code has that means, it may be written as a doc-gap ⚠️ (§1.1).

---

## 5. When the work touches an original

Applied only to work in which **there is an original and it must not be damaged**, such as moving · tidying · swapping · converting.

### 5.1 What "not damaged" means

It means **not that the letters are the same but that the meaning and behavior are alive**.

| Situation | Verdict |
|---|---|
| The letters changed, but the meaning · behavior · reference relations are as they were (reordering · path updates · numbering) | ✅ Not damaged |
| The letters are the same, but the context was cut and the meaning changed (relative paths not fixed after moving) | ❌ Damaged |

Do not conclude from a comparison of letters alone. Word-level comparison is an **auxiliary means**, and the final judgment is made by whether the meaning and behavior are alive. If not certain, do not give a Pass.

### 5.2 What to compare against

Compare **not against the immediately preceding result but against the last one that received a Pass verdict**.
If compared against the immediately preceding one, an error that was already mixed in just before appears as "no change" and is mistaken for normal.

- If there is not yet anything that received a Pass verdict (the first round), take **the spec and agreement documents** as the baseline instead, and write that fact in the basis.

This is the **comparison baseline for preservation quality**. The baseline immediately before/after production for finding the actual changes (`common-rules.md` §4.3) is also fixed separately, and the purposes and versions of the two comparisons are not mixed. The re-verification scope is set directly by B from the approved criteria, the actual changes, the dependency effects and what is unconfirmed. Do not limit the scope by A's re-review list or by the file of the immediately preceding findings alone.

A new change after a completed Task takes as its spec the **change difference + the baseline to be preserved** of a new Task that preserves the completed version. Link in the merged criteria the baseline Task, the completed version's path/fingerprint, the acceptance record and the reading targets for the effect of the change. Do not force a large design rewrite across the board, and do not handle it by resuming the completed Task under the same number. It is different from resuming a step in progress that was cut off by an external failure.

### 5.3 Write down in advance what must be kept

When making the criteria, **first draw out "what must be preserved" and nail it down as items.** It is a procedure to keep "this too should have been kept" from coming out after the fact.

The order of drawing out — ① paths · names · identifiers referred to from outside ② behavior and promises ③ the surface that a person or another role is leaning on.

---

## 6. Overall-verdict rules

| Per-item distribution | Overall |
|---|---|
| All Required ✅ + all Recommended ✅ + discovered items none to few | ✅ **Pass** |
| All Required ✅ + the Recommended ⚠️ (1–2) are **all doc-gap ⚠️** (§1.1) · no Recommended ❌ + discovered items none to few | ✅ **Pass** + memo (reinforce the wording at the next opportunity for revision) |
| All Required ✅ + 1–2 Recommended ⚠️ (small effect) — the case that does not fall under the row directly above (an ordinary ⚠️ is mixed in, and so on) | ⚠️ **Conditional** |
| The Required ⚠️ are **all doc-gap ⚠️** (no ❌ or ordinary ⚠️ in Required — no substantive ❌) | ⚠️ **Conditional** (not ❌) |
| 1 or more Required ⚠️ or ❌ — the case where the Required ⚠️ are all doc-gap ⚠️ is the row directly above | ❌ **Fail** |
| 3 or more Recommended ⚠️ or ❌ — doc-gap ⚠️ are counted too | ❌ **Fail** |
| The spec was violated, or it conflicts head-on with another rule | ❌ **Fail** |

**When several rows apply** — if even one of the ❌ **Fail** rows (the bottom three rows) applies, the overall verdict is ❌. Only when none applies, pick the one that fits among the top four rows. The doc-gap rows (the second · the fourth) are used only when the doc-gap ⚠️ are **all** of them, and are not used if even one ordinary ⚠️ is mixed in.

**"✅ Pass + memo" is also a Pass** — it goes through §1's "if not certain, do not give a Pass" and the completeness check below in exactly the same way. In the memo, write the place where the wording is to be reinforced (which document · which section · what) and leave it as a candidate for the next revision.

**Just before giving a Pass, always go through the completeness check** (`b/common-rules.md` §6.3). A scope not looked at cannot be a basis for a Pass.

---

## 7. Handling gray areas

| Situation | How |
|---|---|
| A criterion sentence reads two ways | ⚠️ Conditional + request to the user to confirm the interpretation → rewrite the criterion in the next round |
| A Required item cannot be verified | ❌ Fail (could not be verified = cannot be trusted) |
| A Recommended item cannot be verified | ⚠️ or ❌ depending on the effect |
| The side that made it wrote "no problem" | That sentence is not a basis. Judge only by the deliverable itself |
| About to classify as a doc-gap ⚠️ (§1.1) | The evidence on the deliverable side (file · line · execution result) **must** be written. **If it cannot be written, it is an ordinary ⚠️** |
| The body says that a broken reference is an **intended follow-up** | By the rule it is a Fail. To make the actual verdict different, **write openly the fact that it differs from the rule** (`b/common-rules.md` §6.5) |
| The user gave an opinion first | Review it against the facts I confirmed, then answer with my own view. **After the final decision has been made, that becomes the criterion** |
| The record says "done" but the file differs | Compare the three: record · file · what the user said. **The actual file wins** |
| The search tool found nothing | Not finding and not existing are different. Conclude only after **checking again with a shell query** |

What could not be verified is handed over to Z and the user, leaving the item · effect · attempts / substitute means · decision needed (`common-rules.md` §4.5). B does not decide the assignee, the round or stop/accept. Do not turn the unconfirmed state of a current Required item into satisfied on the ground that it was entered under a Q-ID or in a follow-up table.

---

## 8. How to merge the three layers — making the Task room's `criteria.md`

For each Task, the verifier, **at the step of making the criteria**, merges the three layers and sends them down as one file into that Task's room.

```
① b/common-criteria.md            items regardless of track (this document)
② b/tracks/<track>/criteria.md    items looked at only in this kind of work
③ items needed only for this Task  newly drawn this time from the spec and agreements
                ↓ the verifier merges
        <project>/log/T{N}_<job>/criteria.md    ← what a person approves
```

For the starting skeleton, copy and use the Task room example form of `project_example` (`log/T1_example/criteria.md`) — the pipeline reference section and the project additions section are divided **with their sources distinguished**. It may be written without the form, but "What to keep when merging" below applies all the same.

B may also open the example form that the body of the common provisions points to by path. The form above is `log/T1_example/criteria.md` of the template root E designated in the call. Z resolves it to the actual absolute path and includes it in the read assignment, and B opens it within the assignment received. If it is missing, return the exact path and the reason. Do not widen the permission to the links of the example form or to all of `b/`. The criteria of the judging B are still the approved merged criteria, and the example form does not substitute for the approved criteria.

### Why merge

- Approval holds only if **what a person approves is one thing**. If it is scattered in three places, the person cannot know what they approved.
- **The verifier of the looking step reads only this one file.** Only then can it be said that what was approved and what was actually applied are the same.
  (The role rules, `b/common-rules.md`, are always read at boot. "Reads only one" is **a statement about the criteria**.)

### What to keep when merging

- Attach to each item **which layer it came from** (`common C-3` · `track ppt-2` · `this-task P1-4`).
- If the three layers **say the same thing, reduce it to one**, and **if they say different things, do not reduce; keep both and write that they disagree.** Quietly dropping one side is itself a weakening of the criteria.
- The items of this work (③) are drawn **from the spec and agreement documents**. They are not drawn by looking at a deliverable that has already come out (`b/common-rules.md` §4.1).
- The merged criteria **also carry the verdict values · severities · overall-verdict rules (§1·§2·§6).** This is because, when approving, a person must see even "what is looked at with what weight".
- The **"Status" row of the header table is the value at the time of writing and is not updated after approval** — the verifier of the looking step confirms the fact of approval of MR-3 and the actual original approval text and record that link that version. It confirms this by the checkpoint of the Task concerned in the ledger or by a neutral assignment copy that preserves that section, and does not automatically demand to read the whole ledger. The path · r · fingerprint · scope of approval and the kind of permission follow §8.1·§8.4.

### If it gets too long — how to split

If one file becomes unmanageable, **split by target, not by layer.**

```
log/T{N}_<job>/criteria.md              ← table of contents + verdict values · severities · overall-verdict rules
log/T{N}_<job>/criteria-<targetA>.md
log/T{N}_<job>/criteria-<targetB>.md
```

If split by layer (common/track/this-task), the verifier has to read three files again and the point of merging is lost.
If split by target, **only one file** need be opened **when looking at one target**. The table-of-contents file points to which target is in which file.

### After approval

- Approved criteria are **fixed as the criteria of that work.** At the looking step, do not lower or remove criteria (`b/common-rules.md` V-8).
- Items newly found while looking are **written separately as `X-N`.** They are reflected in this verdict only at memo grade, and raising them to formal items goes through approval in the next round.

### 8.1 Preserving submitted and approved versions

The criteria-writing B leaves the submitted versions of the merged criteria, the table of contents, the per-target component files and the design handoff sheet as copies in its own assigned section (`common-rules.md` §7.2). Leave the Task · step · role · call R, the criteria r, the working/copy paths, the byte count · SHA-256 · submission time, the relation to the previous version, and the record path to which Z will link the original approval text · date · scope of approval. Do not write a file's own final fingerprint into the file itself; put it in a separate submission record.

When changing the criteria, preserve the original text of the previous submitted/approved version. Distinguish revision r from call R, and do not raise r merely because the next call was made with the same criteria. If Git/version storage was chosen in the spec, present the file · commit/blob · restore location and the actual recovery result. Having only a path, a hash and change history, with the original text not recoverable, is not preservation. Do not change the version by writing approval wording over the copy after approval.

### 8.2 Reading sources and the actual read assignment

The criteria-writing B fills in the following table in the merged criteria. A source that has not yet been made is marked as **a material slot and its planned time**, and Z settles it as the actual path · version · fingerprint · read scope before the verdict call. A link or a slot in the criteria is not in itself additional read permission.

| Reading target | Main source · version | Substitute source · conditions of use | Reading means | Handling when missing |
|---|---|---|---|---|
| Approved criteria · spec · design | Original approval text · the version concerned · copy · fingerprint | A neutral assignment copy of the section of the Task concerned that preserves the same content | Comparison of version links · reading the body | Leave approval/version as unconfirmed and do not guess |
| Actual permissions (C-6) | The neutral assignment per role · round · time of application, and its link to the A call | Material that preserves the identical permission section of the actual call and links the call/version/time of that time | Comparison of the changes in assignment against the actual before/after changes | Do not substitute the current ledger or A's own list; request an additional path from Z |
| Changes · preservation | Git fixed version + working tree, or before/after lists · original-text copies | A file copy / version storage that recovers the same scope and point in time | Independent derivation including uncommitted · untracked · hidden/ignored items, comparison of the meaning of the body | Record the excluded scope · failures · unknown attribution; an unconfirmed Required item concerned goes to §7 |
| Actual outputs · records | The assigned actual deliverables and the record sections needed | A copy of the same version or the original-text sections needed | Direct reading · execution · observation. For bytes, the method of §3 | Do not use a summary in place of the actual deliverable |

The table above is the common skeleton. Write along with it the additional sources per track and Task and the concrete commands/tools and output locations. The criteria-writing B does not settle future call messages at its own discretion. Z compares this table against the actual read assignment of MR-2 before the verdict call, and the judging B confirms by the original text received. If a file needed is outside the assignment, return the exact path and the reason to Z. The full text of a call that contains A/Z's views is not passed off as neutral permission material.

The ledger facts for C-8 are provided by Z as `log/T{N}_<job>/assignments/B{N}_<step>_R{M}_ledger-facts.json`. In the record, link `source_path` · `source_sha256` · collection time · Task with the location and value of the original fields. Only the fact fields needed are excerpted, from the following scope.

- `current_step` of `tasks`; `id` · `role` · `owned_files` of `agents[]`; `outputs`; and Task · `step` · `actor` · `at` · `files` of `history`.
- Summaries, interpretations and verdict hints of user decisions, `scope` of `agents`, and free-form description such as `checkpoints` · `verdict` · `did` · `note` are excluded. If fact and evaluation are mixed in the original text, do not summarize the meaning again; take only the permitted fact fields.
- Z's access to the ledger for the excerpt is not permission for B to read the whole ledger. Compare directly the excerpt and the per-assignee summaries for which the actual path · version · read scope were assigned. If a fact needed is not there, return the path of and the reason for the additional neutral material, and leave C-8 unconfirmed per §7.
- The ledger facts are not evidence of the permissions of that time. C-6 is confirmed by the separate neutral permission record that preserves the call of that time in the table above, the identical permission section and the time of application. Do not substitute the current ledger's `agents` or A's change list.

### 8.3 Writing and fixing the design handoff sheet

At a design gate, B may write a design-use excerpt or a per-target criteria file per `common-rules.md` §7.3. Mark distinctly the method of splitting the merged criteria by target and a partial excerpt for design use. The criteria of the judging B are still the approved merged criteria (when split, the table of contents + the target file).

The handoff record holds **the original criteria path · r · fingerprint · scope of approval / the handoff target · method / the included IDs · original locations / the correspondence of conditions · notes · external definitions / the handoff file path · fingerprint / the approval record**. Compare the original text and the handoff sheet directly item by item and confirm that no condition or definition is missing. A hash alone does not establish accuracy or completeness. C-D1 is handed over together with its applicability condition and its not-applicable handling.

Z reproduces verbatim the version whose scope of approval has been confirmed, or assigns only that file to A. If it is unclear whether a new excerpt is included in the scope of approval of the existing original criteria, return that scope to the user. A reading the original merged criteria or the whole of B's area, and chained reference to past call messages, are not made the default. Design proceeds after criteria revision and approval, and a dependency of wording is not treated as parallel work merely by separating files.

### 8.4 Approval by direct inspection and conditional proceed

A quality verdict on the content of the criteria and **the permission for the next action** are distinguished. The original text of the conditional proceed procedure is in `z/interaction-rules.md` §6. B does not newly grant conditional proceed or assign a ★.

In **a revision round in which the user has already permitted a specific scope of change and the next action**, that permission may be used. The record must hold the user's original words · source · date, the existing approved version, the permitted changes · objective conditions, **the comparison of the actual full changes against the permitted scope**, the applied version/fingerprint, and the permitted next step. Distinguish a version that received approval by direct inspection from a version to which conditional proceed permission was applied. Changes outside the scope, new decisions and failed conditions go back to a separate choice. Do not make a blanket approval out of the mere fact that some rows are unchanged, that it is R2 or higher, or that there was no objection afterwards.

The criteria-writing B leaves the submitted version and the facts of the changes and the undecided matters, and ends the call. Z assigns the next **new role call** according to the permission record. Conditional proceed does not substitute for the separation of calls between criteria writing and judging, for the independent verdict, or for an actual user response or manual simulation result. The spreadsheet pipeline's skipping of approval of the existing output criteria follows as is that definition's conditions of user choice, gray area and record. That skipping and conditional proceed do not widen each other's permitted scope.
