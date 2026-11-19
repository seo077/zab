# Project map — <project>

> **The owner of this document's record is Z.** Z writes **facts only** — interpretation · assessment · verdict are not written. The record and its updates are **subject to user approval**.
> **Place**: project root, **always present.** / **When updated**: every time a Task is newly opened and every time one is closed.
> The design decisions · structure of an individual Task are not written here — that is the share of `log/T{N}_<job>/design-spec.md` (written by A) of a Task that declared a design gate.
> The lines below that start with `▶` explain how to fill in, so delete them after filling in.

---

## 1. Purpose · background

▶ Write in 2–5 lines why this project exists and what makes it finished. If the decision has a source (discussion round · document), attach the path.

`<...>`

---

## 2. Task list · relationship diagram

▶ One Task = one run of the pipeline. Write whether it can run in parallel and its dependencies together. Keep the status values the same as the Task ledger (`log/manifest.json`).

| Task | Room | Pipeline | Status | Depends on | Parallel |
|---|---|---|---|---|---|
| `T1` | `log/T1_<job>/` | `<z/pipelines/<job>.md — for a one-off job, z/pipelines/general.md>` | `<pending / in_progress / awaiting_human / done / stopped>` | `<none or preceding T{N}>` | `<solo or concurrent with T{N}>` |

▶ If three or more dependencies · parallels are entangled, add a text relationship diagram:

```
T1 ──▶ T3    (T3 uses T1's deliverable as input — starts after T1 is done)
T2 ──┘       (T2 is parallel with T1 — the files they touch do not overlap)
```

---

### 2.1 Linking archive · transfer records

▶ Fill in only when something was archived/transferred at the user's request. Leave the Task number · name · original location · minimal history, and keep the existing status value or record one of the existing values according to the user's decision. Do not introduce a new "tidied" status or reuse a number. The actual procedure is in the shared `z/boot.md` §Archive / transfer requested by the user.

| Task · name | Original Task room · input/output | Final absolute destination · records left | Preservation decision/approval · execution record | Recovery copy/fingerprint · actual restore confirmation |
|---|---|---|---|---|
| `<T number · name kept>` | `<original location>` | `<archive/transfer location · minimal history>` | `<original text/source · reference impact · link to ledger history>` | `<paths of the copy and the observation record>` |

### 2.2 A new Task based on a completed version

▶ Preserve the completed Task's row · verdict · acceptance. The change can be limited to the new Task's difference spec, and the change impact and the preserved baseline are linked. It does not mean a large design is always rewritten.

| New Task | Baseline Task · completed version | Baseline file/copy · SHA256 · acceptance record | Location in the spec of the change difference · the baseline to preserve | Impact · confirmation scope/design gate decision |
|---|---|---|---|---|
| `<new T number>` | `<completed T number · version>` | `<the exact recoverable version>` | `<new Task spec path>` | `<new decision/record path>` |

---

## 3. Deliverable map

▶ What is where under `output/`. Write only the final deliverables Tasks made — intermediate records · summaries are in each Task's log room.

| Deliverable | Path | Task that made it |
|---|---|---|
| `<what — one line>` | `output/<...>` | `<T{N}>` |

---

## 4. External dependency paths

▶ Things outside this project folder that the work leans on — the pipeline repository, the location of original materials, external tools, etc. Write them as absolute paths.

| What | Absolute path | Note |
|---|---|---|
| Pipeline repository | `<the zab plugin's pipeline/ — the P that the command's first block prints>` | The original of the role documents · pipeline definitions |
| `<...>` | `<...>` | |
