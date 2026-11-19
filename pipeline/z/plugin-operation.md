# Plugin operation — when this repository is distributed as the zab plugin

The role documents of this repository were written on the premise that "the instruction tells you at which absolute path the repository is". This document sets what those paths are in an environment installed as a plugin, and which stretch of the standard flow each of the three commands covers. Roles, hard lines, ★ and the information cap are as in the other documents and are not changed here.

**If the description of paths in this document and in another document disagree, this document is right, for paths only.** The procedure in other documents, "read the repository path from the project `CLAUDE.md`", is replaced in the plugin environment by §1 below.

---

## 1. The five paths

| Name | What | Where you learn it |
|---|---|---|
| **P** pipeline repository | `pipeline/` inside the plugin — the originals of the role documents, definitions and tracks | The first block of `/zab:design`·`/zab:build` and the session-start banner print it as an absolute path |
| **E** template root | `templates/project/` inside the plugin — the project template and the example Task room form (`log/T1_example/criteria.md`) | Same place |
| Project root | The folder where the session was opened — `input/` · `output/` · `log/` · `project-map.md` | Same place |
| **U** user layer | A folder outside every project and outside the plugin, the same shape as `pipeline/` — the definitions, tracks, improvement history and accumulated references this user's work has produced, **shared by all their projects** | Same place. It may be empty; it is created by the first write |
| **L** project layer | `pipeline/` at the project root — only what the user said should hold **for this project alone** | Same place |

- Use the printed values as is. Do not make up a path by guessing.
- Put P and the project root in the A·B call messages **as absolute paths** (`interaction-rules.md` A-8 · §3.5). What other documents call `project_example` is E.
- The value `plugin:zab` of the ledger's `_meta.pipeline_repo` is a marker meaning "the plugin tells you the path". Do not check it against a path.

### Fingerprints of P, E and U

P, E and U are outside the project folder, and a role's shell is confined to the project — A and B cannot measure the size or SHA-256 of a file there. Z gets them from the plugin's script, run from the project root (`<plugin root>` is the folder that holds P; the first block of the command shows the script's path):

```
node "<plugin root>/scripts/zab.mjs" fingerprint          # all of P, E, U, L
node "<plugin root>/scripts/zab.mjs" fingerprint U L      # only the named ones
```

It only reads, and prints one line per file: layer, relative path, bytes, SHA-256.

- Wherever a document asks for a before/after list or a fingerprint of files in P, E or U (a baseline before a Task that writes to U, the common criteria B merges from, the three output sets of `new-pipeline`), Z saves this output as is into the Task room's `assignments/` — once before the first write and once after the last — and assigns those files to B as neutral material. Z does not edit or excerpt the output.
- A value B takes from such a file is a value measured by the script, not by B; B records it as that.

## 2. P is read-only; writes go to U

P is an installed copy. Updating the plugin replaces it wholesale, so **do not write to P in any round.** Every place where another document says to write to the pipeline repository is read as the same relative path in U. U belongs to the user, survives a plugin update, and is read by every project — what one project learns, the next one starts with.

| The write another document speaks of | Where it is actually written |
|---|---|
| The three output sets of `new-pipeline` | `U/z/pipelines/<job>.md` · `U/a/tracks/<job>/` · `U/b/tracks/<job>/` |
| Improvement history — a lesson met a second time | `U/improvements/NNN_<title>.md` |
| Something met once that may be a lesson | One line in `U/improvements/_seen-once.md` |
| Files among the track references that accumulate (e.g. user preferences) | `U/<same relative path>` — one file, continued across projects |

- **L instead of U only when the user says so** — "for this project only". Z does not choose L on its own, and does not ask at every write; U is the default.
- "The pipeline is read-only during the work" holds for U and L as is. Writing there happens only while `new-pipeline` is running, and for the improvement history and accumulated records after the work is finished.
- **The improvement history keeps its bar.** `improvements/README.md` admits only a lesson confirmed by repetition, and writing to U by default does not lower that. What a Task met once is recorded in the project's run log and as **one line** in `U/improvements/_seen-once.md` (date · project · pipeline and step · what happened). That file is a waiting list, not history: nobody reads it as a rule, and it is not assigned to A or B. At the close of a Task Z reads the list; something on it that was met again — in this project or in another — becomes a numbered entry, and its line is removed from the list. Do not make a numbered entry, or a separate file of candidates, out of a single run.
- The body text under `b/` is written only by B, in U and in L as well.
- **Say what was added.** Because every later project reads U, at the close of a Task Z lists for the user, by path, each file that this Task created or changed in U — as a list, without summarizing the contents. If nothing was, Z says nothing.

## 3. When reading — L first, then U, then P

- **The list of definitions** is the `z/pipelines/` of P, of U and of L combined. When showing it to the user, write alongside which side each one is from.
- **A track** is found by name. If it is in L, use L's; if not and it is in U, use U's; if in neither, use P's. Put the absolute path of the side actually chosen in the call message — A·B do not look for the track themselves.
- **If the same name is on more than one side**, the nearer one wins (L over U over P), but tell the user that fact and write it in the run log.
- **Accumulating references**: assign P's (the baseline at the time of distribution), U's (what this user's earlier work accumulated) and L's (this project only) — all that exist. A new line is appended to U's; if U has no such file yet, the role that owns it creates it there, starting from P's.
- Only definitions, tracks, improvement history and track references are layered. The boot documents, the common rules, the common criteria and `interaction-rules.md` are read from P alone; a file of the same name in U or L does not replace them.

## 4. From U to P — the way up

What should reach every user of the plugin is submitted to the plugin's original repository as a change proposal (Pull Request). Submitting is the user's decision, and the direction is one way only, user → pipeline. Z does not submit on its own.

## 5. The stretch each of the three commands covers

| Command | Stretch | Where it ends |
|---|---|---|
| `/zab:setup` | Preparing the project folder (the script does it — no role call) | When the folders and the empty ledger exist |
| `/zab:design` | Z's startup flow → in the definition's step table, up to **the ★ immediately before the production step** | The approval record of that ★ |
| `/zab:build` | Production step → ★ Final acceptance | Task close |

- The boundary between the two commands is **the place of a ★**. It is the same line as the rule that at a ★ the role call ends and the work continues in a fresh session.
- In the general definition the boundary is ★ Criteria approval (★ Design approval in a run with a design gate, ★ Spec confirmation in a run where verification is skipped). In other definitions it is the ★ immediately before the first step in which A starts writing to `output/`.
- `/zab:build` does not start if the approval of that ★ is not in the ledger.
- "Typing `z`" in other documents is, in this environment, `/zab:design` or `/zab:build`.

## 6. Mode and the means of calling

- **The default is mode 2** (Z runs subagents). If the user says mode 1, use mode 1. The call messages of the two modes are identical character for character.
- In mode 2, A is called as the `zab:a` agent and B as the `zab:b` agent. Both receive the full text of the call message as is. Do not substitute another agent type — these two names are the only ones by which the hook recognizes a role (§7), so a B of another type cannot write to its own criteria file. If the two types are not visible, do not call; tell the user.
- A·B are a **new agent** on every call. Do not continue from an earlier role session (for resuming the same step cut off by an external failure, see `interaction-rules.md` §1.2).
- For model and effort, **not specifying them is the default** (the same as Z is used — this corresponds to ② of `interaction-rules.md` §1.3.1). Go through the selection procedure of that section only when the user says they will choose the configuration.
- The Codex adapter is not yet included in this plugin. `codex-operation.md` is an operating record of the origin repository and is not a procedure for using Codex in this plugin.

## 7. File owners — the one thing the hook guards

"One owner per file" is checked by the hook in this environment. Immediately before a write tool runs, it compares **who** (main session = Z, `zab:a` = A, `zab:b` = B) is writing **where**. The other rules — stopping at the ★, B's information cap — are as in the documents, and the hook does not look at them.

| File | Owner | When a non-owner tries to write |
|---|---|---|
| `log/T{N}_*/criteria.md` · `verification-summary/` · `observations/B*/` · `L/b/` · `U/b/` | B | **Refused** |
| `log/manifest.json` · `log/run-log.md` · `log/decisions.md` · `project-map.md` · the Task room's `assignments/` · `calls/` | Z | A·B are **refused** |
| `output/` · the Task room's `build-summary/` · `design-spec.md` · `observations/A*/` | A | B is **refused**. Z passes but **is recorded** |

- Anyone writes to a `tmp/` folder under `output/` (the place for temporary files). The hook does not concern itself with `input/` and other paths.
- **It is not applied to mode 1 Tasks.** The A·B of mode 1 are ordinary sessions opened by a person and cannot be told apart from Z.
- When there is no Task in progress, Z editing `output/` is not recorded.
- **In U the hook keeps the same line for `b/`**: `U/b/` is B's, and a write there by anyone else is **refused**. The rest of U has no single owner, as in L. Because U is outside the project, the hook also answers the permission question for a write there by Z, `zab:a` or `zab:b` working in a zab project, so that a subagent is not stopped by a prompt it cannot answer.
- **Setting up B's folders**: an empty-folder marker (`.gitkeep`) under `b/` is structure and anyone may write it — this is how Z and A do the "create the empty folders" that `new-pipeline` and `a/common-rules.md` §1.2 speak of. Any other file under `b/`, a file holding only a heading line included, is refused to everyone but B here; leave it for B to create.
- The hook sees only the edit tools. It cannot see writes made by shell commands, so this hook is a device that prevents slips and does not replace the hard lines of the documents.

### When Z edits A's files directly

It is not refused. Instead the hook leaves one line in `log/direct-edits.jsonl` with the time, the file and the step in progress at that moment, and the first block of the command shows that list again.

- **At the next ★, Z shows that list to the user as is.** Do not filter it or attach explanations.
- If there is a file edited after B's verdict, also report the fact that the file differs from what the verdict saw. Whether to accept it as is or go to re-verification by B is decided by the user.
- `log/direct-edits.jsonl` is the hook's file. None of Z·A·B edits or deletes it.

## 8. Language

The rule documents, the file and folder names, and the ledger are in English. The people using them may not be.

- **Talk to the user in the user's language.** Z converses, asks at a ★ and reports in the language the user writes in.
- **Write the records in the user's language** — the run log, the decision log, the project map, criteria, design specs, build summaries, verification summaries and deliverables — unless the spec says otherwise. The user opens these files at a ★; they must be able to read them.
- **Fixed names stay as they are, in English**, whatever the language of the prose around them: file and folder names, ledger keys and ledger values (`in_progress`, `approved`, `mode2` …), step identifiers (`step 3 R2`), item IDs, the ★ names, the verdict marks ✅ ⚠️ ❌ with their words Pass · Conditional · Fail, and the severities Required · Recommended · Optional. A translated verdict word next to the mark is allowed; the mark and the English word are never dropped.
- **The user's words are recorded verbatim, in the language they were said in.** They are not translated in the ledger or in the decision log.
- Z states the record language in every A and B call message, next to the paths. A and B do not choose it themselves. For B this is one line naming the language and nothing else — like the entry path (`interaction-rules.md` §3.5) it says nothing about the deliverable, and it does not widen the cap of §3.1.
- A rule is read in English as written. A record in another language does not change what the rule says.
