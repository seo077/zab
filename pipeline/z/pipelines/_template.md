# Pipeline definition — template

> Adding a new job = **copying this file, saving it as `<job>.md`, and filling in the cells.** There is nothing else to do.
> Lines below that start with `▶` are explanations; delete them after filling in.
>
> **One run of this definition = one Task (`T{N}`).** Within a project the same definition can be run several times, and in parallel with other definitions.
> `log/T{N}_<job>/` below is that Task's room, which Z creates when it opens the Task — the actual number `N` is assigned by Z.
> Rework of the same step while in progress is a **repeat within the Task, `R{M}`** (e.g. `T1 / step 3 R2`). A change after completion preserves the completed version, and a new Task settles the change delta, the baseline to preserve, and the impact (`../boot.md` §Changes after completion).

---

## Header table

| Item | Content |
|---|---|
| Purpose | `<what this pipeline produces — one line>` |
| Input | `<what must exist at the start. Files, material, values the user must decide>` |
| Output | `<what is left in hand at the end. Concrete, down to file paths>` |
| Tracks used | `<folder name inside a/tracks/ · b/tracks/. e.g. ppt · circuit-design · excel>` |
| Expected step count | `<number>` |

▶ **Tracks used**: A and B use this name to find and read `a/tracks/<track>/` · `b/tracks/<track>/`. If the track folder does not exist yet, it must be created.
▶ For a purely general job that uses no track, write `none`.

---

## Step table

| # | Who | What | Reads | Writes | Parallel |
|---|---|---|---|---|---|
| 1 | `<Z/A/B>` | `<one line>` | `<path>` | `<path>` | `<solo / A1·A2 at the same time>` |
| ★ | User | `<what is checked and approved>` | `<path of the file the person will open>` | — | — |
| 2 | | | | | |
| 3 | | | | | |
| Synth | B (synth) | Gather each B's report into a one-line final verdict | `<paths of the B1·B2… reports>` | `<path of the final verdict file>` | solo |
| ★ | User | Decide whether to give final acceptance | `<path of the final verdict file>` | — | — |

### How to fill in each cell

| Cell | How to fill it in |
|---|---|
| **#** | Sequence number. A human checkpoint uses **★** instead of a number |
| **Who** | One of `Z`·`A`·`B`·`User`. If there are several, number them, as in `A1`·`A2` |
| **What** | One line. If it needs two lines, it is two steps — split it |
| **Reads** | **The file paths** the assignee of that step **will open**. Do not write "whatever is needed, as you see fit". For a B step, write only the paths and attach no description of the content |
| **Writes** | **The file paths** the assignee of that step **will write**. One file has one owner — if two steps write the same path, the definition is built wrong |
| **Parallel** | `solo`, or the list of assignees running at the same time. If the split is not clean, do not make it parallel |

### The ★ mark — human checkpoint

**A row marked ★ = the place where the agent call is cut in two.**

- The agent of the preceding step **finishes its work there.** Do not tell it to "get confirmation and continue".
- After Z records approval by direct inspection or the conditional proceed permission of `../interaction-rules.md` §6.4, the next step starts in a **fresh session**. Z checks the existing permission for the concrete revision scope and the next action, and the role's ending at the ★ is kept.
- A subagent cannot talk with the user in the middle of its work. That is why the ★ must be in **the same place** in both modes.

Signs of a place that needs a ★:
- Where the next thing only holds with the user's approval (confirming the verification criteria · confirming the design · final acceptance)
- Just before something that is hard to undo starts
- A fork where a person must choose

### Design gate — only in a pipeline that declares it

▶ If the job needs its design confirmed first, keep this section and put the two rows below into the step table. If not needed, delete this section together with its table — **a pipeline without the declaration does not produce a design spec** (it is not forced on every pipeline).

To have a design gate, **declare the two rows in the step table yourself:**

| # | Who | What | Reads | Writes | Parallel |
|---|---|---|---|---|---|
| n | A | Write the design spec and the step-and-round summary — background / decisions / flow / schema / risks / satisfaction conditions | `<path of the spec · agreement documents>` · `<path/version of the design handoff sheet written by B and assigned by Z (when verification proceeds)>` | `log/T{N}_<job>/design-spec.md` · `log/T{N}_<job>/build-summary/A<N>_design_R<M>.md` · `<submitted-copy path specified in the call>` | solo |
| ★ | User | Design approval (gate) | `log/T{N}_<job>/design-spec.md` | — | — |

- The owner of the design spec is **A**, and its place is **that Task's log room** — `log/T{N}_<job>/design-spec.md`.
- It holds the design decisions and structure of **that one Task**. The shape of the whole project is held not by the design spec but by `project-map.md` (recorded by Z) at the project root.
- ★ Design approval ends the role's call exactly like any other ★. The permission to proceed and the assignment of a fresh session follow the ★ section above and `../interaction-rules.md` §6.4.
- In a run with verification, in both the first and the revision rounds, the design is assigned after the criteria are revised and approved. If the contents depend on each other, do not make them parallel even when the files differ. Pass on the approved version, conditions and external definitions of the excerpt / per-target criteria written by B, or of the verbatim reproduction, and do not assign B's full text to A (`../interaction-rules.md` A-10).
- The owning role keeps the original text of every submitted/approved version of the design and the criteria as a recoverable copy. If the spec chooses Git/version storage, confirm an actual restore. Distinguish criteria r from call R, the working copy from the fixed copy, and the owning role's submission from Z's approval link (`../interaction-rules.md` §6.1).
- The step-and-round summary is named `A<N>_<step>_R<M>.md`. Write the actual write path in both the step table and the call. An example path does not add permission automatically.

### File ownership in parallel assignment

▶ Fill in only when several run the same step at the same time. If not, delete it together with its table.

| Who | Scope | Files written exclusively |
|---|---|---|
| `<A1>` | `<its share>` | `<path only this assignee writes>` |
| `<A2>` | `<its share>` | `<path only this assignee writes>` |

- The shared ledger (`log/manifest.json` — the Task ledger) is written **only by Z.** Parallel assignees only read it.
- Summaries are split into one file per assignee (`log/T{N}_<job>/build-summary/A1_*.md`).

### Verdict synthesis step

▶ Have it **only when there are several Bs**. If there is one B, delete the Synth row.

- **Z does not merge** the results of several Bs. The moment it merges them, Z has judged.
- Add one more, a **synthesizing B**, and hand it **only the paths** of each B's report.
- The synthesizing B's one-line final verdict is the verdict of this pipeline.

---

## Completion conditions

▶ Write what confirms that "it is all done". Write it in a form that turns out true or false when opened.

- [ ] `<all output files exist and are not empty — list the paths>`
- [ ] `<the user's approval at every ★ point is left in the records>`
- [ ] `<the final verdict has been given and the user has accepted>`
- [ ] `<the status of this Task (T{N}) in log/manifest.json has been updated and history has one line per step>`

---

## Records to keep

| What | Where | Who |
|---|---|---|
| Trace of progress per step (shared by all Tasks) | `log/run-log.md` | Z |
| Task ledger — Task list · status · dependencies | `log/manifest.json` | **Z only** |
| This Task's verification criteria (merged criteria · subject to human approval) | `log/T{N}_<job>/criteria.md` | B |
| Design spec (only when a design gate is declared) | `log/T{N}_<job>/design-spec.md` | A |
| Summary of what was built | `log/T{N}_<job>/build-summary/A<N>_<step>_R<M>.md` | A |
| Verification results | `log/T{N}_<job>/verification-summary/B<N>_*.md` | B |
| Pipeline problems that surfaced this time | `improvements/` (after the job is finished) | Z |

### Version and assignment link records

| What | Where | Who |
|---|---|---|
| Original text of the submitted version · own observation · fingerprint | `log/T{N}_<job>/observations/<role>_<step>_R<M>/submitted/` and the submission record (the actual path is fixed in the call) | the owning A/B |
| Per-round neutral permission record · change assignment · approval link | `log/T{N}_<job>/assignments/` | Z |
| Full text of the actual call | `log/T{N}_<job>/calls/<role>_<step>_R<M>.md` | Z |

A neutral assignment fixes the actual read/write and excluded scope at that time, and the same permission section and fingerprints as the call. The judging B's reading/substitute sources and before/after comparison material are assigned per `../interaction-rules.md` §6.2. The current ledger or A's change list alone does not substitute for it.
