# Verification criteria — `new-pipeline` track

> **This is the second of the three layers.** What is here is checked only in "new-pipeline" work.
> The items always checked, whatever the track, are in `b/common-criteria.md` (the first layer), and only what **does not overlap with it** is put here (`b/common-rules.md` §9).
> The items needed only for this Task (the third layer) are drawn further from the spec · agreement documents by the verifier at the step of making the criteria, and attached to the merged criteria (`log/T{N}_<job>/criteria.md` in the Task room concerned).
> Only the verifier writes the body. Other roles go only as far as the folder and an empty file.

| Item | Value |
|---|---|
| Date written | 2026-08-19 |
| Revision | `r1` |
| Status | Draft — awaiting ★ user approval (this row is not updated. The reference for whether it is approved is the checkpoints of the Task concerned in `log/manifest.json` of the project that made or revised these track criteria — improvement history 001) |
| Author | B |
| Track | new-pipeline |

---

## 0. What these criteria check

**The verification target of these criteria = "one set of new pipeline that the new-pipeline pipeline actually ran and produced".** They do not check the meta pipeline's own definition document (`z/pipelines/new-pipeline.md`); they check the **result it produced**.

One set of the target produced = **the three parts of the complete set** (`../AI 논의사항.md` Round 1 §Phase 3-1 §D-25 · confirmed spec §Output):

```
① z/pipelines/<job>.md      the new pipeline definition (the template filled in)
② a/tracks/<job>/           the design · build knowledge of that job
③ b/tracks/<job>/           the verification viewpoint of that job  ← only with this too is it a "complete set"
```

`<job>` = the name of the track newly made this time (in the case of Phase 4, `circuit-analysis`). Read the `<job>` of every item below as that actual name.

### 0.1 Where these criteria were drawn from

**Where they were drawn from = the spec · agreement documents only** (`b/common-rules.md` §4.1 · V-8):

- `../AI 논의사항.md` Round 1 §Phase 3-1 (D-25·D-26 + the confirmed spec's header table · step table) · §결정 (decisions) D-11·D-13·D-4·D-10·D-8·D-6·D-3
- `z/pipelines/_template.md` (the pipeline definition template — required cells · ★ rules · file ownership · completion conditions)
- `pipeline/README.md` (how to add a new job · the 3 principles for deciding where something belongs · folder map)
- `b/common-criteria.md` §9 (track folder convention) · `a/common-rules.md` §7 (the A-side track convention)

**They were not drawn from the deliverables.** These criteria are written **before** Phase 3-3 (A lays out the meta pipeline) · Phase 4 (running it to make a new pipeline) (D-17 criteria first). Since there are no deliverables to look at yet, each item was drawn backwards from a sentence of the spec, and the source is written on every row.

### 0.2 So as not to overlap with the common layer — what is not dealt with here

The following is already checked by `b/common-criteria.md` (the first layer). **It is not repeated here** (if they overlap, it cannot be told which is right when they drift apart — `b/common-rules.md` §9):

| What the common layer checks | Place |
|---|---|
| Whether the file is at the instructed path and is not empty | common C-1·C-2 |
| Whether verdict words have not leaked into the body of the deliverable | common C-3 |
| Whether the rounds were stacked without being overwritten | common C-4 |
| Whether the cross-reference paths actually exist | common C-5 |
| Whether nothing outside the instructed paths was touched | common C-6 |
| Self-made decisions (M-N) · ledger · summary records | common C-7·C-8 |
| Whether it actually does its original purpose / whether it holds when used / whether it does not disagree with other rules | common C-F1·C-F2·C-F3 |
| Verdict values · severities · overall verdict rules · completeness check | common §1·§2·§6 |

These track criteria add, on top of that, only the viewpoint peculiar to this job: **"whether the one set of new pipeline was laid out properly as a pipeline"**.

### 0.3 What is checked especially heavily in this track — why

A pipeline is **not a deliverable used once in one project and thrown away, but a blueprint reused repeatedly in several projects** (D-3 ① · D-13 ②). So it must be more rigorous than a one-off deliverable. A wrongly laid-out pipeline spreads its defect to **every** project that uses it. The Required items of §4 below were given their severity from this property — what was made Required is **what, if that item collapses, makes it impossible to actually run this pipeline, or makes verification · parallelism · human confirmation collapse even if it is run**.

---

## 1. Verdict values · severities · overall rules

These track criteria do not define them separately. **The three verdict values (Pass/Conditional/Fail) · the three severity grades (Required/Recommended/Optional) · the overall verdict rules follow `b/common-criteria.md` §1·§2·§6 as is.** (If a definition is in two places, it cannot be told which is right when they drift apart — `b/common-criteria.md` §0.)

One thing to note in this track: **"almost done" is not Pass.** Since a pipeline is reused, do not give Pass without confidence (§0.3 · `b/common-rules.md` §2.1).

---

## 2. Are all three parts there (complete set) — PN-A

> Target = the existence · completeness of the three parts of the deliverable. Source = D-25 (complete set) · confirmed spec §Output.
> Common C-1 (is it at the path) · C-2 (is it empty) check only existence per file. Here the viewpoint peculiar to the complete set is checked: **"whether the three parts are in place as one set"**.

| # | Item | Severity | How to check | Spec source |
|---|---|---|---|---|
| **PN-A1** | The **definition file** (`z/pipelines/<job>.md`) has been newly made — it is a new file made by copying `_template.md` and filling it in, and `_template.md` itself is untouched | Required | Confirm the new file exists + whether it is a file separate from `_template.md`. If `_template.md` was changed, Fail (the template is preserved as the original) | confirmed spec §Output · D-11 · the preamble of `_template.md` |
| **PN-A2** | The **A track folder** (`a/tracks/<job>/`) stands and follows the shape of the convention of `a/common-rules.md` §7 (`rules.md` · `references/` · `skills/`) | Required | Look up the folder · files + check against the convention. At the least `rules.md` must exist with a body | confirmed spec §Output · D-4 · `a/common-rules.md` §7 |
| **PN-A3** | The **B track folder** (`b/tracks/<job>/`) stands and follows the shape of the convention of `b/common-rules.md` §9 (`criteria.md` · `references/`) — **only with this third part is it a "complete set"** | Required | Look up the folder · files + check against the convention. `criteria.md` must exist with a body. **If this part is empty it is not a complete set, so Fail** | D-25 (the core of the complete set) · D-13 ⑤ · `b/common-rules.md` §9 |
| **PN-A4** | The `<job>` of the three parts is **the same name in all three** — the definition's "Tracks used" cell · the `a/tracks/` folder name · the `b/tracks/` folder name do not differ by even one character | Required | Check the name strings of the three places directly against each other. If even one differs, the material of the same job is scattered and A·B cannot find each other's | D-4 · `_template.md` §Tracks used (`▶`) · `a/common-rules.md` §7 · `b/common-rules.md` §9 |
| **PN-A5** | The track name was given by the **kind of work** — it is not a project name · a domain proper noun | Recommended | Look at the name. If a specific project/company/file name is hard-coded in it, it goes wrong on reuse | `a/common-rules.md` §7 · `b/common-rules.md` §9 · D-1 |

---

## 3. Does the definition file hold as a pipeline — PN-B

> Target = the content of part ① (the definition file). Source = D-11 · `_template.md` · D-6 · D-8 · D-9.
> Whereas common C-F1 (does it do its original purpose) checks in broad terms "whether this definition can actually run a job", here it is checked cell by cell **whether the cells the template required were filled in with none missing · properly**.

### 3.1 Are all the required cells there

| # | Item | Severity | How to check | Spec source |
|---|---|---|---|---|
| **PN-B1** | In the header table **Purpose · Input · Output · Tracks used · Expected step count** are all filled in — no `<...>` placeholder or `▶` explanation line remains | Required | Confirm the header-table cells one by one + search for remnants of `<`·`▶`. If an empty cell · placeholder remains, each pipeline gets filled in as it pleases | D-11 · `_template.md` §Header table |
| **PN-B2** | In the step table the five cells **Who · What · Reads · Writes · Parallel** are filled in on every step row | Required | Check the five cells of each row. If even one is empty, it is not set what that step opens and where it writes | D-11 · `_template.md` §Step table |
| **PN-B3** | There are **completion conditions**, and they are written **in a form that turns out true or false when opened** — not a sentence that cannot be judged, of the "it went well" kind | Recommended | Read the completion-condition items and check whether each item can be confirmed objectively, like the existence of a file · the presence of a record | D-11 · `_template.md` §Completion conditions |
| **PN-B4** | There is a **Records to keep** table, and what · where · who are set | Recommended | The table exists + whether all three cells are filled. In particular whether "who" does not disagree with PN-B8 below | `_template.md` §Records to keep |

### 3.2 Are the human checkpoints (★) placed properly

| # | Item | Severity | How to check | Spec source |
|---|---|---|---|---|
| **PN-B5** | The step table has **at least one ★ (human checkpoint)** — if there are 0 ★, there is no place for a person to step in, and the subagents run unattended from beginning to end | Required | Count the ★ rows. Also check whether there is a ★ just before something hard to undo starts · where the next thing only holds with the user's approval | D-6 · `_template.md` §The ★ mark ("Signs of a place that needs a ★") |
| **PN-B6** | The structure is such that the assignee of the step before a ★ **finishes its work there** — it is written in the form of cutting the call in two, not "get confirmation and continue" | Required | Look at the "What" · "Writes" of the step right before the ★ and confirm that the step does not contain an instruction that continues past the ★ | D-6 · `_template.md` §The ★ mark |
| **PN-B7** | **A ★ is placed** at the place where the verification criteria are confirmed and at the place of final acceptance — the verification criteria only hold when a person approves them (D-10), and accepting the result is the person's share | Recommended | Whether there is a ★ after the step that produces the verification criteria · after the final verdict, respectively. Since the meta pipeline's own spec already shows these two ★ (step table), check whether the newly made pipeline also has the same skeleton | D-10 · D-6 · Phase 3-1 confirmed spec §Step table |

### 3.3 Do file ownership · parallelism · verdict synthesis keep the rules

| # | Item | Severity | How to check | Spec source |
|---|---|---|---|---|
| **PN-B8** | In the "Writes" of the step table **one file has one owner** — two steps do not write the same path | Required | Spread out all the "Writes" cells and see whether the same path appears twice. If they overlap, they collide when parallel | D-8 ① · `_template.md` §How to fill in each cell ("Writes") |
| **PN-B9** | **The only assignee that writes the shared ledger (`log/manifest.json`) is Z** — nowhere in the step table · the parallel table · Records to keep is A·B set to write to the ledger | Required | Confirm the assignee that writes the ledger in the three places (the step table's Writes · the parallel table · Records to keep). If A or B is set to write it, Fail | D-8 ② · `_template.md` §File ownership in parallel assignment · §Records to keep |
| **PN-B10** | When **parallelism** is used, the split is clean and **exclusive files** are designated for each split assignee — the summaries are divided into per-assignee files (`build-summary/A<N>_*.md` · `verification-summary/B<N>_*.md`) | Recommended | If the Parallel cell has simultaneous assignees, whether their exclusive files do not overlap. If there is no parallelism, not applicable | D-8 ①③ · `_template.md` §File ownership in parallel assignment |
| **PN-B11** | If it is a pipeline **with several Bs**, there is one more, a **synthesizing B (verdict synthesis step)**, and it is set that the synthesizing B is given **only the paths** of each B's report. If there is one B, there is no synthesis row | Recommended | Count the parallel Bs; if several, the synthesis step exists + whether only paths are handed over. If one, whether the synthesis row was deleted | D-9 · `_template.md` §Verdict synthesis step |

### 3.4 The discipline of the "Reads" cell

| # | Item | Severity | How to check | Spec source |
|---|---|---|---|---|
| **PN-B12** | The "Reads" cell has **nothing of the "whatever is needed, as you see fit" kind** — the file paths to open are written concretely | Recommended | Look at the "Reads" cell of each step. If there is an expression such as "as you see fit" · "if needed", it is not set what the assignee opens | D-11 · D-8 ① · `_template.md` §How to fill in each cell |
| **PN-B13** | **The "Reads" cell of a B step has only paths and no description of the content is attached** — summarizing the target for the verifier in advance creates anchoring | Recommended | Whether a description · summary other than paths is mixed into the "Reads" cell of the rows whose assignee is B | `_template.md` §How to fill in each cell ("For a B step, write only the paths") · `b/common-rules.md` §3 contamination prevention |

---

## 4. Is the A track knowledge (part ②) laid out properly — PN-C

> Target = `a/tracks/<job>/`. Source = D-4 · `a/common-rules.md` §7 · D-3 · D-5.
> The track specialization of common C-F1 (performing the purpose) · C-F3 (disagreement with other rules). Here it is checked **whether the A knowledge keeps the "track convention" and does not overlap or disagree with the common rules**.

| # | Item | Severity | How to check | Spec source |
|---|---|---|---|---|
| **PN-C1** | `rules.md` holds **what is kept only in that track** — it does not repeat what is already in `a/common-rules.md` | Required | Put `rules.md` and `a/common-rules.md` side by side and look for duplicate sentences. If they overlap, it cannot be told which is right when they drift apart | `a/common-rules.md` §7 · D-4 |
| **PN-C2** | The track rules **do not conflict with the common rules** — if there is a conflict, that fact is written (the common rules win) | Required | Whether the two documents do not say the same thing differently. When a conflict is found, whether the deliverable has that finding | `a/common-rules.md` §7 |
| **PN-C3** | The track knowledge holds only **methods that are repeated** — project-specific facts used once have not been mixed in | Required | Whether a specific project's values · paths · proper nouns are hard-coded in the body posing as a method | D-3 ① · README §3 principles for deciding |
| **PN-C4** | `references/` · `skills/` are there per the convention (they may be absent if not needed, but if present, their place and name fit the convention) | Optional | Look up the folders + check against the convention | `a/common-rules.md` §7 |

---

## 5. Is the B track verification viewpoint (part ③) laid out properly — PN-D

> Target = `b/tracks/<job>/`. Source = D-25 · D-10 · D-13 ⑤ · `b/common-rules.md` §9·§merged criteria · D-17.
> **This §5 is the core of the "complete set".** D-25, that the meta pipeline must make even the verification viewpoint, is confirmed here.
> Note: this verification-criteria document itself is precisely one actual instance of that "part ③". The items below are used when checking part ③ of another track to be newly made (e.g. circuit-analysis).

| # | Item | Severity | How to check | Spec source |
|---|---|---|---|---|
| **PN-D1** | `criteria.md` exists and holds **the verification viewpoint checked only in that track** — it does not overlap with `b/common-criteria.md` (the first layer) | Required | Put the track criteria and the common layer side by side and look for duplication. If they overlap, it cannot be told which is right when they drift apart | D-25 · `b/common-rules.md` §9 |
| **PN-D2** | The verification viewpoint was **drawn from the spec · agreement** — it was not laid out to fit the shape of deliverables already produced, and a source is attached to each item | Required | Whether each item has a spec-source marking. Whether there is a trace of having been "made by looking at the deliverable" (an item that exists only in the section structure of the deliverable) | D-17 · `b/common-rules.md` §4.1 · V-8 |
| **PN-D3** | **A severity (Required/Recommended/Optional) and a verdict method** are attached to each item | Required | Whether each item row has a severity + "How to check". An item without a verdict method cannot be applied at the verification step | `b/common-criteria.md` §2 · §How to merge the three layers ("also carry the verdict values · severities") |
| **PN-D4** | It states that the verdict values · severities · overall rules are **not newly defined here** and follow the common layer | Recommended | Whether the track criteria wrote the definitions of the verdict values in duplicate. If duplicated, the definition is in two places and drifts apart | `b/common-criteria.md` §0 · §How to merge the three layers |
| **PN-D5** | The verification viewpoint of this track is **in a form that can actually judge the deliverables of that job** — it actually targets what that job must produce (the "Output" cell of the definition) | Required | Check the target of the track criteria against the "Output" of that pipeline definition. If there is a deliverable that is in the Output but that no item targets, it is a verification hole | D-25 (right through to verification) · track specialization of C-F1 |
| **PN-D6** | `references/` is per the convention (if present). It is material for the basis of a verdict and is not set to be read wholesale | Optional | Look up the folder + check against the convention | `b/common-rules.md` §9 |

---

## 6. Did adding the new job end with "one folder · one file" — PN-E

> Target = the whole way of producing. Source = D-4 · D-11 · README §How to add a new job.
> The original purpose of new-pipeline is to keep the promise that "adding a new job = ends with adding one folder · one file". Check whether that promise was actually kept.

| # | Item | Severity | How to check | Spec source |
|---|---|---|---|---|
| **PN-E1** | In adding the new pipeline, **existing files were not changed** — `_template.md` · `a/common-rules.md` · `b/common-criteria.md` · other track folders · existing definition files are untouched | Required | Check what newly appeared against what changed. Whether the promise (README) that "adding one folder and one file is all there is" was kept. If an existing thing was changed, as far as whether where · why is recorded | README §How to add a new job ("Existing things are not touched") · D-4 · common C-6 |
| **PN-E2** | What newly appeared fits the minimal set of **1 definition + 1 A track folder + 1 B track folder** — files that were not promised have not appeared scattered here and there | Recommended | Check the list of newly appeared files · folders against the three-part set. If there is a new file outside the set, what it is · why | README §Folder map · confirmed spec §Output |
| **PN-E3** | Writing to `pipeline/` happened **only while this pipeline was running**, and the run record was left in `improvements/` — `pipeline/` is not kept being touched after the work has ended | Recommended | Confirm the time of the change · the location of the record. However, "who · when wrote it" may not leave its subject in the file, so if it could not be verified, write that limitation (do not conclude by guessing) | D-13 ③④ · confirmed spec §Confirmed baseline |

---

## 7. Gray areas to be especially careful about in this track

> In addition to common §7 (handling gray areas), only the places often run into in new-pipeline are written. The handling principles (no Pass without confidence · record · transparency of rule versus actual verdict) follow common §7 and `b/common-rules.md` §6.5.

| Situation | How |
|---|---|
| **"It is a complete set, but part ③ (B's verification criteria) is thin"** — the file exists, but there are almost no items that can actually judge | Check from the viewpoint of PN-A3·PN-D5. **Do not count it as a complete set on the existence of the file alone.** If there is no viewpoint that can actually judge, lean toward Fail (§0.3 rigor for reuse) |
| **When this verification-criteria document itself overlaps with the target of the verdict** — when the session that made this document (`new-pipeline/criteria.md`) is about to go as far as the verdict that uses this document as its basis | **Do not do both in one session** (`b/common-rules.md` §7). Separate the session that made these criteria from the session that judges a new pipeline by these criteria |
| **When the new pipeline can only be confirmed to hold by "running it"** — an item for which the documents alone cannot confirm the actual run (e.g. tool permissions when the repository is outside the folder) | Go only as far as tracing on the documents and **write what could not be seen as a limitation** (common C-F2). Confirming the actual run is the share of the round that actually runs that pipeline (of the Phase 4 kind) |
| **When the track name differs subtly between the A side · the B side · the definition** (`circuit-analysis` vs `circuit-design`, etc.) | **Check the strings directly** with PN-A4. Do not let it through because they look similar — even one character of difference and A·B cannot find each other's |

---

## 8. Self-discovered items (X-N)

> Things seen while checking the spec in making the criteria. They are candidates for **formal items from the next round on**, and are things not put into this (first-approval) version of the criteria, or put at a lowered grade, for the reasons below.
> The derivation path is stated — since this author has not yet seen the deliverables (before production), all of them came from **checking the spec**.

| # | Item | Grade | Derivation path | Why it is not a formal item now |
|---|---|---|---|---|
| **X-1** | There is no item to check **whether the "Expected step count" of the pipeline definition and the actual number of step-table rows match** | memo | Checking the spec (the header table of `_template.md` has an Expected step count cell, but there is no sentence requiring consistency with the step table) | The expected value is an estimate, so a mismatch is not at once Fail. If it diverges widely it is a sign that the design changed, so a Recommended candidate for the next round |
| **X-2** | **The risk that a new track looks like "the definition is complete" even when it exists only on the A side and the B-side verification viewpoint is empty** — the complete set (D-25) is the decision meant to block this risk, but the only items that catch its violation are PN-A3·PN-D. Whether to nail it down further with one item | Recommended | Checking the spec (the intent of D-25) + D-13 ⑤ | PN-A3·PN-D5 already target it. Avoid a duplicate entry and look at whether to consolidate in the next round |
| **X-3** | **The round convention for "revising with that same new-pipeline again" a new pipeline the meta pipeline made** — the boundary between improvement history and a rerun | memo | Checking the spec (D-13 ③④ speak of making new, but the round convention for "making again · revising" is a blank) | A place that will actually be met in Phase 4 · Round 2. If set up as an item now, there is no means of confirming it |
| **X-4** | **The circularity that the verdict criteria of "a finished product that goes right through to verification" (D-25) are this document itself** — if this document is deficient, there is no higher device to catch that deficiency | Recommended | Self (derived from the structure of these criteria) | Human approval (★) plays the role of that higher device. As long as this document is subject to ★ approval, the person breaks the circle. Handled by structure, not by an item |

---

## 9. Change history

| Date | Revision | Change | Author |
|---|---|---|---|
| 2026-10-12 | r1 (wording of the Status row only) | Appended to the "Status" row of the header table the wording "this row is not updated · the reference for whether it is approved is the ledger (the checkpoints of the Task concerned in `log/manifest.json`)" — improvement history 001 (b). No change to the status value itself or to the items · severities · meaning of the body | B |
| 2026-09-15 | r1 (path notation only) | Updated the merged-criteria path in the preamble to the Task-room structure (`log/T{N}_<job>/criteria.md`) — the B① work of the D-7·D-12 reorganization round. No change to the items · severities · meaning of the body | B |
| 2026-08-19 | r1 | Draft. New verification criteria for the new-pipeline track — §2 the three parts of the complete set (PN-A) · §3 the definition holds (PN-B) · §4 A track knowledge (PN-C) · §5 B track verification viewpoint (PN-D) · §6 the promise of adding a new job (PN-E) · §7 gray areas · §8 self-discovered X-1~X-4. Items derived from = `../../../AI 논의사항.md` Round 1 §Phase 3-1 (D-25·D-26·confirmed spec) · §D-11·D-13·D-4·D-10·D-8·D-9·D-6·D-3 · `z/pipelines/_template.md` · `pipeline/README.md` · `b/common-criteria.md` §9 · `a/common-rules.md` §7. Items overlapping the common layer (the first layer) are stated in §0.2 and not included. The verdict values · severities · overall rules follow the common layer (no duplicate definition). Delegation not applicable — B's sole area (both structure · body written by B, delegation stated explicitly in this request). | B |

---

## Appendix — Item count

| Section | Required | Recommended | Optional | Total |
|---|---|---|---|---|
| §2 The three parts of the complete set (PN-A) | 4 | 1 | 0 | 5 |
| §3 The definition holds (PN-B) | 6 | 7 | 0 | 13 |
| §4 A track knowledge (PN-C) | 3 | 0 | 1 | 4 |
| §5 B track verification viewpoint (PN-D) | 4 | 1 | 1 | 6 |
| §6 The promise of adding a new job (PN-E) | 1 | 2 | 0 | 3 |
| **Subtotal (formal items)** | **18** | **11** | **2** | **31** |
| §8 Self-discovered (formal from the next round on) | — | 2 | — | 4 (2 memo · 2 Recommended) |

> Since there are 11 Recommended items, at the overall verdict **if 3 or more Recommended items are not met, it is Fail** (`b/common-criteria.md` §6).
> These figures apply when judging "one set of new pipeline". In an actual verdict round, these track criteria + `b/common-criteria.md` (the common layer) + this job's items drawn from that job's spec (the third layer) are **merged** and used (`b/common-criteria.md` §8).
