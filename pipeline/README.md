# Pipeline repository

The place where the three roles Z·A·B, and the blueprints that assemble them, are kept **centrally, in one set only**.

---

## What changed

Before, when a new job came up, the collaboration template folder was **copied wholesale**. So:

- Copies were scattered across projects, and even when the original improved, old copies stayed stale
- The call documents grew heavy as rounds went by
- It was built on the premise of one A and one B each, so launching several made them collide in the shared ledger

Now **the roles are the main characters**, and for each job they are **assembled and used** according to a blueprint called a "pipeline definition".
Nothing is copied. Only materials, results and the progress log remain in the project.

---

## What goes where — 3 principles for deciding

| # | Principle |
|---|---|
| **1** | **Facts** used once go in the project; **methods** that are repeated go in the pipeline |
| **2** | During the work the pipeline is **read-only**. Improvement happens in a separate round |
| **3** | When unsure, put it in the **project** for now. When repetition is confirmed, promote it to the pipeline — **in one direction only** |

---

## Folder map

```
pipeline/
├── README.md              ← this document
├── z/                     orchestrator
│   ├── boot.md            the thin document Z reads when it starts
│   ├── interaction-rules.md    how to instruct A·B and receive results (including the two execution modes)
│   └── pipelines/
│       ├── _template.md   pipeline definition template
│       └── <job>.md       one job = one file
├── a/                     design · build
│   ├── boot.md
│   ├── common-rules.md    always applied, regardless of track
│   └── tracks/<job>/      rules.md · references/ · skills/
├── b/                     verify · judge
│   ├── boot.md
│   ├── common-rules.md    ★ the independence principle — do not make it lighter
│   ├── common-criteria.md
│   └── tracks/<job>/      criteria.md · references/ · skills/
└── improvements/          why · how it was fixed (only lessons confirmed by repetition)
```

> The **body text** of the documents under `b/` **is written only by the verifier.** Other roles may create only the folders and empty files.
> If this place gets lighter, verification collapses, so even when other documents are made thinner, nothing is taken away from here.

---

## When used as a plugin

This repository is distributed as the `pipeline/` folder of the zab plugin. This copy is never written to. What the work produces — new definitions, tracks, improvement history, accumulated references — is written to the user layer, a folder of the user's own that every project of theirs reads; the project's own `pipeline/` (the project layer) holds only what should apply to that project alone. Both are read before this copy. It is not copied into the project, and the project does not need to write the path down either — the commands and the session banner tell you the absolute paths. Path resolution · the project layer (`<project>/pipeline/`) · the stretch each command covers are in [z/plugin-operation.md](z/plugin-operation.md).

## How to start

1. Open a session in the project folder and run `/zab:setup` — the folders and an empty ledger are created.
2. Put the materials in `input/` and run `/zab:design` — Z shows the list in `z/pipelines/` → choose the job, and proceed with the spec and the verification criteria (and the design) up to ★ approval.
3. `/zab:build` — A builds, a B in a fresh session judges, and the user gives final acceptance.

**At a ★, end the role call and confirm the user's permission.** Approval by direct inspection and the conditional proceed permission of a specific revision round follow `z/interaction-rules.md` §1.1·§6.4. The next step is a fresh session.

There are two execution modes — **mode 1**, where a person opens several windows, and **mode 2** (the default), where Z runs subagents. The two modes **use the same pipeline definition and stop at the same places.** For details, see `z/interaction-rules.md`.

---

## How to add a new job

| What is needed | What to do |
|---|---|
| A new kind of job | Copy `z/pipelines/_template.md` and fill it in as `<job>.md` |
| Knowledge for A needed only for that job | Create the folder `a/tracks/<job>/` |
| A verification viewpoint needed only for that job | `b/tracks/<job>/` — **the verifier fills it in** |

Adding one folder and one file is all there is. Existing things are not touched.

---

## What the project side looks like

```
<project>/
├── CLAUDE.md           project purpose · project-specific instructions
├── project-map.md      map of the whole project — purpose · Task list and relationship diagram · map of deliverables · external dependencies (recorded by Z, always present)
├── input/              materials
├── output/             results
├── pipeline/           definitions · tracks · improvement history made in this project (project layer)
└── log/                progress records
    ├── manifest.json   Task ledger — Task list · statuses · dependencies (Z only)
    ├── run-log.md · decisions.md    shared by all Tasks (Z)
    └── T{N}_<job>/     Task room — the record of one run of the pipeline: criteria · (design spec) · build-summary/ · verification-summary/
```

Running one run of the pipeline = **one Task (`T1`·`T2`·…)**. Several Tasks can be run in parallel within one project.
The template is in the plugin's `templates/project/`.

### Linking submitted versions, assignments and calls

The Task room holds the step/round summaries `build-summary/A<N>_<step>_R<M>.md`, the fixed copies and fingerprints in each owning role's `observations/<role>_<step>_R<M>/submitted/`, Z's neutral permission and approval links in `assignments/`, and the actual full text in `calls/`. The actual file paths and reads/writes are fixed in the call.

Every submitted/approved original text of the design and the criteria is preserved by the owning role as a recoverable copy, and the criteria r and the call R are distinguished. For Git/version storage chosen by the spec, confirm an actual restoration of the original text. Z separately links the user's original words, source, date and scope of approval to the relevant copy/version/fingerprint. Details are in `z/interaction-rules.md` §6.1; A's submission is in `a/common-rules.md` §4.2·§5.

To B, assign the actual per-round neutral permission record and the paths of the before/after comparison and the reading / substitute sources. Preserve the call path/fingerprint and the identical permission section, and do not substitute the current ledger or A's own change list (`z/interaction-rules.md` §6.2). A path given for guidance is not permission to read another role's body text.

---

## About the source citations

The documents of this repository were made over several rounds in another workspace and brought over. That is why notations pointing to the records of that place remain throughout the text.

| Notation | Meaning |
|---|---|
| `D-58` · `D-62` … | The number of a decision the user made in the origin workspace. It is the source that states **whose decision, and which one,** that rule or item came from |
| `Round 7` · `Phase 4` | The discussion round in which that decision was made |
| "the origin workspace" · "the v0.7 development repository" | The place where these documents were made. The original text of those records (`log/AI 논의사항.md` and the like) is **not included in this distribution** |
| Dated change history · revisions `r1`–`r9` | The traces of the criteria being revised there |

The rules and verification items are complete with only the sentences written in the text. Even though the source citations cannot be followed, this does not hinder reading or writing; they were not erased because of this repository's principle that the basis is stated for every item. **A `D-N` newly arising in your project is a number in that project's `log/decisions.md` and is unrelated to the numbers above.**

---

## The three lines

1. **Only the verifier judges** — if the orchestrator merges several verification results, at that moment the orchestrator has in effect judged. When there are several verifiers, add **one more, a synthesizing verifier**.
2. **Only the orchestrator writes the shared ledger** — `log/manifest.json` is Z's alone. Each one's summary is split into per-assignee files.
3. **Cut at the human checkpoint** — a subagent cannot talk with the user in the middle of the work. So at a place that needs a check, the call is split in two.
