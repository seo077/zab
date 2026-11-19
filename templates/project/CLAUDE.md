# <project>

This folder is a **zab project** — a person decides, Z assigns · relays · records, A builds, and B judges.
The role documents · rules · work blueprints exist as one set only, inside the zab plugin. **They are not copied into this project folder.**

## Start

| Command | What it does |
|---|---|
| `/zab:design` | Z shows the task list, settles the spec with the user, and carries the verification criteria (· design) through to approval |
| `/zab:build` | A builds, a B in a fresh session judges, and the user gives final acceptance |

Do not create a Task without a command. Answer ordinary questions as they are.

**If there is a Z call message for A·B, enter directly with the specified role · absolute paths · permitted materials.** Do not go back to a whole-project briefing. Do not have B additionally read this whole document or other Tasks. Any project-specific guidance needed is assigned by Z as the original-text path permitted for that step.

| Role | What it does | How the session is opened |
|---|---|---|
| **Z** | Assign · relay · record | The user enters `/zab:design` · `/zab:build` |
| **A** | Design · produce deliverables | A fresh session from Z's call message. In mode 2 (default) Z calls; in mode 1 a person pastes the same full text into a new window |
| **B** | Verify · judge | A fresh session, separated from the A·Z conversation, from Z's call message and the permitted materials |

The user decides the work and the scope. A·B are assigned by Z and end their call at a ★ (human checkpoint). Automatic tool approval and ★ work approval are separate things.

## Unit of work — Task

**One run of the pipeline = one Task (`T1` · `T2` · …).** Each time work starts, Z gives a Task number and opens the room `log/T{N}_<job>/`.
Tasks can run **in parallel** with each other (only when file ownership and content dependencies split cleanly). Rework of the same step while in progress is **a repeat within the Task, `R{M}`** (e.g. `T1 / step 3 R2`).

A change after completion preserves the completed version · spec · verdict · acceptance records, and its scope is set by the new Task's change difference and the baseline to preserve. Link the baseline Task · completed version · path/fingerprint · change impact and the confirmation scope. A large design rewrite is not forced across the board, and the design gate is set in the new spec. This is distinguished from resuming an in-progress step after an external failure. Archive/transfer preserves the number · minimal history · final destination · recovery copy and follows the procedure of the shared `z/boot.md` §Task.

## Folders

| Folder · file | What | Who writes |
|---|---|---|
| `project-map.md` | Map of the whole project — purpose · background / Task list · relationship diagram / deliverable map / external dependency paths. Updated every time a Task is created or closed (subject to user approval) | Z |
| `input/` | Source material received is preserved. Z links the common extract · original fingerprint · read observation to the input preparation section (shared z/boot.md "Input and host preparation"). Interpretation · summarizing · producing deliverables are excluded | A person: source material / Z: input preparation |
| `output/` | Results — what this work produced | A |
| `pipeline/` | The pipeline definitions · tracks · improvement history made in this project. The same shape as the plugin's (`z/pipelines/` · `a/tracks/` · `b/tracks/` · `improvements/`). Empty at first | Z·A·B at the time of `new-pipeline` |
| `log/` | Progress records — see below | Divided by role |

### Inside log/

| What | Where | Who writes |
|---|---|---|
| Task ledger — Task list · status · dependencies (the only shared ledger) | `manifest.json` | **Z only** |
| Step-by-step trail of progress (shared by all Tasks) | `run-log.md` | Z |
| Decisions · agreements per round (shared by all Tasks) | `decisions.md` | Z |
| Task room — all the records of one Task | `T{N}_<job>/` (e.g. `T1_example/`) | Divided by file inside the room ↓ |

### Inside a Task room (`log/T{N}_<job>/`)

| File | What | Who writes |
|---|---|---|
| `criteria.md` | The merged verification criteria applied to this Task — references to the pipeline criteria (common · per-track) + project-specific additions (subject to human approval) | **B** |
| `design-spec.md` | This Task's design decisions · structure — exists only when the pipeline has declared a design gate (design step + ★ Design approval) | A |
| `build-summary/` | `A<N>_<step>_R<M>.md` — summary of each design · build step and round (e.g. A1_design_R1.md) | A |
| `verification-summary/` | `B1_*.md` — verification results | B |
| `observations/<role>_<step>_R<M>/submitted/` | Fixed submitted copies of the design · criteria/deliverables. The actual path is specified in the spec · call | The A/B that owns the file |
| `observations/<role>_<step>_R<M>/` | Submitted version · document revision · bytes · SHA256 · time · baseline version · restore/open observation | The role concerned |
| `assignments/` | The neutral permission record of the actual per-round read/write · excluded scope · time of application, and the record linking approval/conditional proceed | Z |
| `calls/<role>_<step>_R<M>.md` | The full text of the actual call, linked with the same section · path/fingerprint of the neutral permission record | Z |

**One file has one owner.** Even when several work at the same time — even when several Tasks run in parallel — each writes only to its own files.

For the original text of every submitted/approved version of the design · criteria, a recoverable copy is the default. If Git/version storage was chosen in the spec, leave the file · version · restore location · actual restore result. A fingerprint alone does not stand in for preserving the original text. Distinguish the criteria r from the call R, and Z links the user's original words · source · date · scope to the fixed copy separately (shared `z/interaction-rules.md` §6.1).

To B, assign by actual path the per-round neutral permission record · the before/after comparison · the reading/substitute source set by the criteria-writing B. The current ledger or A's list does not stand in for the permission record of that time (§6.2 of the same rules). The example paths in this table do not automatically add read/write permission.

## What applies only to this project

> If there are circumstances specific to the project (target materials, formats to keep, external paths, etc.), write them here in a few lines.
> **How to work** is not written here — that is the pipeline repository's share.
