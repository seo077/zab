# Rules — `new-pipeline` track

> What A keeps when making a new pipeline (when filling in the definition and writing this track's A knowledge).
> What is always kept, whatever the track, is in `a/common-rules.md`. Only **what is not there and is needed only in this track** is written here.

---

## 1. How to fill in the template cells

A's deliverables in this track are **the step table of the pipeline definition (`z/pipelines/<job>.md`)** and **`a/tracks/<job>/`**.
The definition is filled in using `z/pipelines/_template.md` as the format frame. Per cell, keep the following.

| Cell | What to keep especially in this track |
|---|---|
| **What** | If it cannot be written in one line, it is two steps — split it. Do not write "as needed, at your discretion" or "and so on" |
| **Reads** | Write **the file paths the assignee of that step will open**. Do not leave a blank or "as appropriate" |
| **Writes** | One path has one owner. If two steps write the same path, it was laid out wrong — split it and give each its own path |
| **Parallel** | If the split is not clean, do not make it parallel. If unsure, `solo` |

- The **explanation lines** of the template that start with `▶` **are deleted after filling in.**
- **Do not invent steps or cells that are not in the spec.** If the new job has no name yet, leave that place as the variable `<job>`.

---

## 2. Take care of all three parts of the complete set, with none missing

The output of this pipeline is **three parts** — the definition (`z/pipelines/<job>.md`) · `a/tracks/<job>/` · `b/tracks/<job>/`.
What A writes directly is **the first two parts**. The third (`b/tracks/<job>/`) is the verifier's area, so A does not write its body.

- If **even one** of A's two parts is empty, **it is not a complete set.** Filling in only the definition and not making `a/tracks/<job>/` is not done.
- A does not fill in the third part, but does confirm **whether the place for that part (an empty folder) exists**. If it does not, write it in the submission message to report it (creating it is possible because it is setting up structure, but the body is written by the verifier).

---

## 3. Where to put a ★

The signals for judging where to place a ★ (human checkpoint) in the definition's step table. If even one of the three signals fits, put a ★.

- **A place where the next thing holds only with the user's approval** — spec confirmation · verification criteria confirmation · final acceptance.
- **Right before something hard to undo begins.**
- **A place that is a fork, so a person has to choose.**

A row with a ★ is **the place where the agent call is cut in two**. Lay it out so that the preceding step ends there, and after a person has confirmed, the next begins in a fresh session.
Do not cram "get confirmation and then continue" into one session — because a subagent cannot talk with a person midway.

---

## 4. The 3 principles for deciding where something belongs (especially in this track)

While laying out a new pipeline, "does this knowledge go in the definition, in `a/tracks/`, or stay in the project" often splits. The judgment follows the 3 principles of `README.md`.

1. A **fact** used once goes in the project; a **method** that is repeated goes in the pipeline (definition · `a/tracks/`).
2. During the work the pipeline is **read-only** — except for the new track being made now.
3. If unsure, put it in the **project** for now. When repetition is confirmed, raise it to the pipeline — in one direction only.

Application in this track:
- **A fact that fits only one case** of the new job (that project's input values · paths) is not hard-coded in the definition — the definition is a frame used repeatedly.
- Only **the method that will be repeated every time** in the new track is raised to `a/tracks/<job>/rules.md`.

---

## 5. When writing the new track's rules and skills

In step 3 of this pipeline, A writes the new track's `a/tracks/<job>/rules.md`, and if there is something to fill in, also fills in `references/` · `skills/`. At that time:

- **What is already in the common rules is not written again in those rules either.** If they overlap, it becomes impossible to know which side is right.
- In the new track's rules, write only **what is repeated only in that job** (e.g. the output format peculiar to that job · the location of frequently used materials).
- If there is something to put in `skills/`, **the format follows `a/common-rules.md` §7.2.** Do not write the format again here. What is `references/` and what is `skills/` is divided by the one-line boundary in §7.1 of the same document.
- If there is nothing to fill in yet, leave `references/` · `skills/` empty (only the keep-empty-folder marker).
