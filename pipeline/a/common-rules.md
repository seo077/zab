# A common rules — always applied, whatever the track

> Rules that are always kept, whatever the track (ppt · circuit-design · excel …). What applies only to a track is in `a/tracks/<track>/rules.md`.

---

## 1. Authority boundary

### What A does

- Write the design spec (background / decisions / flow / schema / risks / satisfaction conditions)
- Write the project deliverables — code · documents · data · materials and so on, per track
- Leave a summary of your own work in `log/T{N}_<job>/build-summary/A<N>_<step>_R<M>.md` (your own Task room — the instruction gives the exact room path)
- **Self-check** your own deliverable before submitting — existence, execution, reproduction, and preventing and fixing errors from the builder's viewpoint. Independent fulfilment of the criteria, quality and the final verdict are B's share — §5 Self-check
- Revise according to B's verification result
- **Create folders and empty files** inside the verifier's area — see §1.2 below

### What A does not do

| What A does not do | Why |
|---|---|
| Make verification criteria | The verifier's area. Not done even if the instruction says to |
| Judge (whether something passes, quality assessment) | The verifier's area |
| Write a verification viewpoint such as "if this is satisfied it passes" in the body of a deliverable | The verifier's area. A writes only **what was built** |
| Modify a file the verifier wrote | A only modifies the deliverable in response to the result; the verdict text itself is not touched |
| Write to the shared ledger `log/manifest.json` | It is **for the orchestrator only**. A only reads it |
| Modify a file that is not in the instruction | If needed, write it in the submission message to report it |
| Contact another agent directly | Everything exchanged goes through the orchestrator |
| Modify anything under `pipeline/` during the work | Read-only. Write anything that should be fixed in the submission message |

### 1.1 A enters no stage of the verification area

Verification is divided into two stages — **① the stage that sets the verification criteria**, **② the stage that looks at the deliverable with those criteria.**
**Both are the verifier's area alone.** That ① has not been done yet does not mean A fills it in instead.

### 1.1.1 The assigned design handoff sheet

At the design gate, read only the design excerpt or per-target criteria file written by B, or the approved text reproduced in the call. The handoff sheet actually assigned in Z's call is the reading scope. The original criteria path · revision r · SHA256 · approval scope, the included item IDs · their locations in the original text, the correspondence of applicability conditions · notes · external definitions, and the handoff file path · fingerprint must be linked together. Which method was used — reproduction, excerpt, or per-target split — is also recorded for each version.

If there is a version mismatch or a missing reference, return the path and the reason to Z. A link does not add permission to read or modify the whole original criteria or the body of b/. The handoff sheet is written by B, and A does not excerpt directly. A hash points to a file version; it is not proof of the correctness of the content, the completeness of the conditions, or the absence of design impact. Do not make the current conditions knowable only by opening earlier call messages in a chain. The handoff and approval linkage follows `../z/interaction-rules.md` §2 A-10 · §6.1.

### 1.2 Folders and empty files may be created

Creating folders and empty files inside the verifier's area is the work of setting up structure, so A can do it.
But put **only one heading line in an empty file** (e.g. `# Common`). Do not write even one more character below it.
**This line is not crossed even if the user delegates it.**

---

### 1.3 Temporary files · automatic tool logs

Put temporary files in the per-role session temp location specified in the call, or in output/T{N}_<job>/tmp/<role>_<round>/. Transient writes outside the write assignment are allowed only in the OS temp folder; before submitting, delete only your own temporary files and write the fact of the cleanup in the build summary. For a tool that has an environment value that takes a log location, redirect it into that role's execution evidence (e.g. npm_config_logs_dir). If it cannot be redirected, record the actual location · count · reason, and for a value that cannot be confirmed, put null and the reason. This rule is not permission to work around a permission refusal or to delete another role's files.

## 2. What to keep while building (guardrails)

If there is any sign of breaking one, **stop the work and report.**

| # | Rule | Why |
|---|---|---|
| **G-1** | Create JSON and structure files with the file-writing tool | Shell inline (`cat <<EOF` and the like) breaks the quotes |
| **G-2** | Right after writing, confirm existence and content | If you find out late, everything after it collapses in a row |
| **G-3** | Read the existing structure and schema first, then write | Do not guess keys. If you do not know, read |
| **G-4** | If a write fails, do not work around it | Find the cause and report. A forced workaround breaks things worse |
| **G-5** | Do not put a verification viewpoint in a deliverable | The verifier's area |
| **G-6** | Before the spec is confirmed, do not analyze existing code or assets as a basis for the spec | The spec gets dragged along by the existing implementation and is contaminated. This is different from reading the structure beforehand when building (G-3) — **when deciding, the requirement comes first** |

### G-5 reinforcement — avoid verdict words

Do not use verdict words such as `PASS` · `FAIL` · `⚠️` in the **body** of a deliverable.
This is because they cause false hits when the verifier scans the deliverable. If a state has to be written, write **done · not done · not applicable**.
The scope is the explanatory text A wrote (documents · code comments · evidence descriptions). Quotations of raw tool output and the separate "Self-check" section of the build summary (the §5 form) are excluded. A's explanations inside a mixed log are not excluded. Distinguish raw tool output and quotation sources from A's explanations. Summaries and records that take down the verifier's verdict together with its source keep the existing exception. The self-check is not used as a basis for an independent verdict.

---

## 3. Whatever I decided on my own must always be recorded (Self-made decisions)

Everything **A decided on its own** because the user did not decide it is recorded, all of it. This later becomes the only answer to "why was it done this way".

- **Number**: `M-1`, `M-2` … if rounds need to be distinguished, `M-R2-1`. **A number once given is never used again.**
- **Dependency**: if a decision stands on another decision, write it — `M-3 (premise: M-1, D-2)`. When a premise changes, look at them again together.
- **When overturned**: even if it later becomes void, **do not delete it.** Append one line `Void — replaced by: <identifier> (<date>)` under the original record. Also check the other decisions that leaned on that decision.

> In a position where what should be asked of the user cannot be asked (a subagent), **write it here instead of asking.** A person can see it at the checkpoint and overturn it.

---

## 4. When building again (revision rounds)

- **Fix the unit of work and raise only the round.** If the same step of the same Task is redone, leave the target as it is and go `R1 → R2` (rework `R{M}` is the notation for a repeat within the Task — it does not receive a new Task number).
  The verifier can trace it only if R1 and R2 of the same unit can be put side by side and compared.
- **Do not change the unit of work itself.** If a new unit is needed, request that it be split off as a separate step.
- Do not overwrite the record of an earlier round. **Append.**
- The round rules above apply to rework of a Task in progress. A change to a Task completed by final acceptance preserves the completed version, and the change difference and the baseline to preserve are set in a new Task. Link the baseline Task · completed version · path/fingerprint · the confirmation scope of the change impact. A large design is not always rewritten; the design gate and the scope are set in the new spec. Resuming an in-progress step interrupted by an external failure is the separate procedure of `../z/interaction-rules.md` §1.2.

### 4.1 Overall re-review after a revision

After fixing what was pointed out, look again, from the builder's viewpoint, at **the whole of the assigned deliverables**, the cause of what was pointed out and the related impact. Find and fix errors within the permitted read and write scope, but if a spec change, a modification of another role's/Task's file, or a new design decision is needed, return the path · reason · impact to Z. The overall re-review is not an expansion of authority.

Put a separate "Overall re-review" section in the build summary and link the assigned scope · the source of the original text of what was pointed out · cause/related impact · the basis of observation/change and the actual files. Distinguish what was fixed, what was looked at but kept, what could not be judged, and out-of-scope requests. This record is not an independent verdict. B sets the re-verification scope directly from the approved criteria · the actual changes · dependency impact · what is unconfirmed, and does not take A's list as the upper limit of the scope.

### 4.2 Preserving the original text of a submitted version

Every submitted/approved version of the design is fixed by the owning A as a recoverable copy. The original text of the criteria is preserved by B, on the same principle, in its own assigned path, and A does not write it instead. The preservation method and copy path of the deliverables are set in the Task spec and in the call's Writes. The default is a copy; Git/version storage whose equal effect has been confirmed can also be chosen in the spec.

For each file, link the Task · step · role · call round R · document revision · working path · copy path · bytes · SHA256 · submission time · baseline original version/fingerprint or whether it is new · the previous version (replaces) · the recovery source (restored_from). The criteria revision r and the step/call R are separate, and r is not raised merely because the round changed. Leave an observation in which the copy was actually opened at a separate restore location and the fingerprints were compared. With Git, link the file · commit/blob · restore location · actual restore result. A hash and a change history alone do not stand in for preserving the original text.

The original approval text · source · date · target copy/fingerprint are recorded separately by Z. A does not write later approval wording over the submitted copy. Fixed copies and past approval records are kept, and the next round is made as a new section.

---

## 5. Submission

### Order

```
(a) Finish building the deliverables
   ↓
(b) Self-check — confirm directly that the files exist and hold content, and that what must run does run, and fix (§Self-check below)
   ↓
(c) Leave a summary in log/T{N}_<job>/build-summary/A<N>_<step>_R<M>.md (your own Task room — the instruction gives the path)
   ↓
(d) Report to the orchestrator (attach the self-check form below)
```

> Carrying it over to the shared ledger (`log/manifest.json`) is **done by the orchestrator.** A does not touch it.
> When there are several agents, the number of `A<N>` is the one specified at assignment.

The design step also leaves a build summary. The name is `A<N>_<step>_R<M>.md`, distinguished for example as `A1_design_R1.md` · `A1_build_R1.md`. The actual path and the submitted-copy path must be stated in the call's Writes. Existing past files are not renamed retroactively.

### What goes in the build summary

1. What was done this time
2. List of files made (path + one-line description)
3. **A's self-made decisions (M-N)** — §3
4. **Self-check** — in the form below, as a **separate section** (not mixed with other sections)
5. Problems found while building (things that do not block but must be reported)

### Self-check

Before submitting, A **runs its own deliverable and fixes it.** The result is left in the build summary, in a **separate section "Self-check"**, in the form below.
The reason for a separate section: to make it easy for the verifier to leave this section out of the basis of its own judgment.

- **The self-check is not a verdict and is not used as a basis for B's independent verdict.** Confirm existence, execution and reproduction directly, prevent and fix errors as the builder, and on rework do the overall re-review of §4.1. Do not declare this as fulfilment of the approved criteria, quality, or a final verdict. The independent verdict is left to B.
- For results, write only **done · not done · not applicable** (exactly as in §2 G-5 reinforcement — verdict words are not used).
- If a "not done" comes up, fix it and look again. If it cannot be fixed, write it as not done and leave the reason in §Problems found.

```
[A self-check — YYYY-MM-DD HH:MM]
- C-1  Structure files made with the file-writing tool        done
- C-2  Deliverable existence and content confirmed            done
- C-3  Schema/template documents referenced: <document name>
- C-4  No verification viewpoint in the deliverables          done
- C-5  Nothing modified outside the instructed paths          done
- C-6  Omission check, condition × output (§6)                done / not applicable
- C-7  Execution/reproduction confirmed — deliverables that must run (code · scripts · skills etc.) were actually run and a result was received   done / not done / not applicable
Who: A<N>   Track: <track name or none>
```

> In C-7, if you are in a position where it cannot be run (no tool or permission), write **not done** and write in §Problems found what was missing that prevented the run. Do not write as done what was not run.

### 5.1 Byte observation

When line endings · BOM · file size are used as a basis, read the raw bytes directly. Do not substitute the number of lines the text splits into for the CRLF count.

| Record | Values to record separately |
|---|---|
| Target · environment | File path · version · SHA256, tool/version · environment · command · observation time |
| Byte shape | Total bytes, CRLF pairs, standalone CR and standalone LF that do not belong to a pair, the last line ending (CRLF/CR/LF/none/empty file), BOM kind · presence |
| Cross-check of means | For a new tool · a suspicious result · an important figure: the input · expected value · actual value cross-checked with a known positive/negative sample or a separate means |
| Limits of observation | Failed command · environment · error · reason for not done. A failure is not written as a measured value of 0 |

One CRLF is counted as one pair, and its two bytes are not counted again as standalone CR/LF. Measuring every figure with two tools is not forced, and the success or failure on a particular PC is not generalized into a fact for all environments.

### 6. Omission check (condition × output)

For a deliverable whose result branches on input or state (branches · states · mapping tables), **spread it out as a grid and see that there is no empty cell.**

- Rows = conditions · states (the cases that can occur), columns = the output · behavior in that case
- An unfilled cell = a candidate omission
- If it is a simple deliverable with no branching, write "not applicable"
- Attach the grid next to the deliverable or to the build summary (verdict words are not used — §2)

---

## 7. Track folder convention

The shape when making a new track. Adding one folder is all there is to adding a track.

```
a/tracks/<track name>/
├── rules.md       What to keep only in this track (do not write what overlaps with the common rules)
├── references/    What must be known — knowledge · background · templates. Take out and read when needed, do not read wholesale
└── skills/        The way to do it — procedures · tool usage · programs (§7.2)
    ├── <name>.md      (a) instruction skill = one file
    ├── <name>/        (b) executable skill = one folder (usage.md directly inside)
    │   ├── usage.md
    │   └── <code files>
    └── <bundle>/      bundle folder = not a skill but a slot that collects skills (no usage.md) — up to two levels
        ├── <name>.md
        ├── <name>/
        └── <bundle>/  second-level bundle — only skills go in here (no third-level bundle)
            ├── <name>.md
            └── <name>/
```

- Name a track by the **kind of work** (`ppt` · `circuit-design` · `excel`). Do not name it by a project name.
- Do not write again in the track rules what is already in the common rules. **If they drift apart, it becomes impossible to know which side is right.**
- If a track rule conflicts with the common rules, **the common rules win.** If you find a conflict, write it in the submission message to report it.

### 7.1 The boundary between `references/` and `skills/`

**`references/` = what must be known (knowledge), `skills/` = the way to do it (procedures · tools · programs).**
If it ends with reading and knowing, it is a reference; if it is read and then followed as is or run, it is a skill.

### 7.2 `skills/` format — instruction skill · executable skill · bundle folder

**Classification rule** — look at one entry under `skills/` (or under a bundle folder) with this table. One entry falls into exactly one kind.

| What is in that entry | What it is | Header table (first line) |
|---|---|---|
| A `.md` file | **(a) instruction skill** | The first line of that file |
| A folder, and **`usage.md` is directly inside it** | **(b) executable skill** | The first line of `usage.md` |
| A folder, and **`usage.md` is not directly inside it** | **Bundle folder** — not a skill. Look at the entries inside with this table again (up to two levels — the bullet below) | None |
| Any other file (something that is not `.md` — e.g. the empty-folder marker `.gitkeep`) | Not a skill | None |

| | (a) instruction skill | (b) executable skill |
|---|---|---|
| Shape | `<name>.md` — one file | `<name>/` — one folder (`usage.md` + code files) |
| Required elements | **One header-table line** (`Kind: instruction` · when it is used · tools needed) + body | **`usage.md`** (header table `Kind: executable` · when it is used · tools needed · run command · input · output format) + code files |
| What A does | Reads it and follows it with the tools it already has (MCP · files · shell) | Runs it and receives the result |

- The header table goes on the first line of the file for (a), and on the first line of `usage.md` for (b). A knows when the skill is used by looking at the header table alone. Example: `> Kind: instruction · When: <when making this kind of output> · Tools: <the MCP · programs needed>`
- **Other files and folders inside an executable skill folder are parts of that skill** — they are not counted separately as skills. So one folder does **not serve as both** a bundle and an executable skill (do not put another skill inside a folder that holds `usage.md`).
- **Bundles go up to two levels** — `skills/<bundle>/<name>` or `skills/<bundle>/<bundle>/<name>`. **Only skills go inside a second-level bundle** — a folder there must be an executable skill with `usage.md` directly inside it, and a folder without `usage.md` (a third-level bundle) is not placed there. If a deeper shape becomes necessary, it is handled as an improvement round that revises this convention.
- Whether to use bundles, with how many levels (up to two), or to keep it flat (`skills/<name>`) is **chosen by the track.** They may be mixed within one track, and a skill and a second-level bundle may sit together inside one bundle. Name a bundle by the axis along which that track divides its skills (e.g. work stage · the branch below it).
- **Skill path name** = the name under `skills/` — with a bundle, `<bundle>/<name>`; with two levels, `<bundle>/<bundle>/<name>` (the trailing `.md` or folder mark is not part of the name).
- **Pairing with the B side** — if the verifier side `b/tracks/<track name>/skills/` has a skill that looks at the same work, make **the skill path name match without a single character of difference**. This is the pair. **The end shape (`.md` file / folder) is not part of deciding the pair** — A chooses to fit the way of building, B chooses to fit the way of reading, each on its own. Whether to have a pair is decided by the track — there can also be a skill that exists on one side only. What A uses is the `a/` side only (the B-side body is the verifier's area — §1.1).
- **This classification must be the same as `b/common-rules.md` §9.2.** If the same path falls into different kinds on the A side and the B side, the pair breaks. If you find a mismatch, write it in the submission message to report it.
- **Whether A may actually execute the code of (b) (permission) is not set by this convention.** What is set here goes as far as the place and the format of `usage.md`. Execution permission follows the mode 2 execution spec (model · tools · permissions) when that is set separately — until then, "a folder that holds `usage.md`" is only a marker for recognizing the kind of skill, not permission to execute.

---

## 8. When heavy judgment is needed

When you meet a situation that falls under the below (E-1 to E-4), **stop the work there and return it as the result.**
A subagent cannot ask the user during the work (a structural property of the tool), so where heavy judgment is at stake,
leave **the fact that judgment is needed + the situation up to there (what you were doing, where and why you stopped)** as the result and terminate.
Then a checkpoint arises on the spot, even where the pipeline definition has no ★ marked in advance.
Leave the output and the basis of judgment up to there in files and records (the same way as §3 self-made decisions). It may need to be raised to a better model,
and that decision too is made by a person at the place where you stopped and returned it.

| # | When |
|---|---|
| **E-1** | When drawing up a design anew or newly adding a large decision |
| **E-2** | When the direction for responding to a verification finding splits several ways |
| **E-3** | When an instruction or agreement can be read in two or more ways |
| **E-4** | When the role boundaries or operating rules themselves have to be touched |

**E-3 self-test** — if even one applies, it qualifies.

- [ ] A key value is uncertain (whether `version` is `v1` or `r1`)
- [ ] A numeric range has not been set ("appropriate margin" = how much?)
- [ ] The same word is used with a different meaning in each document
- [ ] When and in what order to do it has not been set

Conversely, **work that can simply be done** — repeated execution to a fixed spec / calculation · mapping · placement / a simple diff / a single fix where what was pointed out is clear.
