# zab

**English** · [한국어](README.ko.md)

**A Claude Code plugin for work that is expensive to get wrong.**
The acceptance criteria are written first, a verifier that never saw the build checks the result against them, and a person looks at the actual files at every decision point. It is not limited to code.

```
/zab:setup     prepare the folder
/zab:design    settle what to make, and what will count as done
/zab:build     make it, check it, accept it
```

> **Language note.** The method — the role rules and verification criteria the agents read — is written in English, and so are the file names and the ledger. The agents talk to you and write their working records in the language you use. The Korean original of the method is kept at the tag `korean-v0.1`.

---

## Who this is for

**Do not use this for work you can ship fast and fix later.** A typo, a small feature, a throwaway script — lighter tools are better at those, and zab will feel slow and fussy.

zab is built for the other kind of work.

| This kind of work | Examples |
|---|---|
| **One error is a real loss** | circuit analysis, a report with calculations in it, anything handed to someone else |
| **It runs for days and gets interrupted** | sessions change several times, and progress has to live in records rather than in a conversation |
| **Someone will later ask "why was it decided this way?"** | work whose decisions and reasons must be traceable |
| **It is not code** | documents, analysis, spreadsheet work — where there are no tests to run and checking is the hard part |

What matters in that kind of work is not speed. It is an answer to **"can this result be trusted?"** That is the one thing zab provides.

## The problem

Hand a whole job to an AI and three things go wrong.

- **The builder grades its own work.** One session builds and then reports that it went well. It is hard to doubt assumptions you made yourself.
- **The pass line is drawn afterwards.** Criteria set after seeing the result bend to fit the result.
- **The person approves a summary.** Read the explanation, move on, and nobody has opened the actual file.

For work you can fix quickly, none of this matters much. For work that is expensive to get wrong, these three are the accident.

## How zab handles it

The work is split across three roles.

| Role | Does | Does not |
|---|---|---|
| **You** | Decide. At each checkpoint (★) you open the file and say approve, revise, or hold | — |
| **Z** — orchestrator | Assigns work, calls A and B, relays results verbatim, keeps the ledger | Build. Judge. Choose for you at a fork |
| **A** — builder | Designs and builds | Judge |
| **B** — verifier | Writes the acceptance criteria, then checks the result against them | Fix the result |

And four rules hold throughout.

1. **Criteria come first.** B writes the acceptance criteria from the spec alone, before any result exists. Building starts only after you approve them, and approved criteria stay fixed for that job.
2. **The verifier does not know how it was built.** The B that checks is a fresh session, separate from A. There is a cap on what Z may tell it — roughly the paths of the files to check and whether you approved. Z may not say "look especially at this" or "A reports it went well". A judgement formed from what you were told in advance is not an independent one.
3. **A re-check uses fresh eyes too.** After fixes, the B that re-checks is a different session from the previous B, and is told the previous verdict in a single word.
4. **You look at files, not summaries.** At a ★ Z stops and gives you the **path** to open. It does not summarize the contents for you.

---

## Commands

### `/zab:setup` — prepare the folder

Creates the skeleton in the folder you have open. Run it once. **It never touches a file that already exists.**

```
input/                  where materials go
output/                 where results come out
log/manifest.json       the Task ledger — what is in progress and how far
log/run-log.md          what was done, step by step
log/decisions.md        decisions, and what you said, verbatim
pipeline/               job definitions created in this project (empty at first)
project-map.md          a one-page map of the project
CLAUDE.md               project guide
```

### `/zab:design` — what to make, and what will count as done

Runs up to the point just **before** building. It builds nothing.

| Step | Who | What happens |
|---|---|---|
| 1 | Z ↔ you | Pick the kind of job, and talk until you agree on what to make |
| ★ | You | **Confirm the spec** |
| 2 | B | Writes the **verification criteria** from the spec alone, and hands back questions wherever the spec is ambiguous |
| ★ | You | **Approve the criteria** — open the file yourself; approve or ask for changes |
| 3 | A | (only for jobs whose design must be settled first) writes a design document |
| ★ | You | (only then) **Approve the design** |

If you already know the kind of job, name it: `/zab:design circuit-analysis`.

### `/zab:build` — make it, check it, accept it

Starts from the approved spec and criteria. If the ledger has no record of the criteria being approved, it does not start and sends you back to `/zab:design`.

| Step | Who | What happens |
|---|---|---|
| 1 | A | Builds to the spec into `output/`, and records what it made and what it decided on its own |
| ★ | You | **Review the build** — open the result yourself |
| 2 | B (fresh session) | Checks against the approved criteria. Gives evidence per item and a verdict: pass, conditional, or fail |
| 3 | A → B | If conditional or fail, and you say so, A fixes it and **yet another fresh** B re-checks |
| ★ | You | **Final acceptance** — read B's verdict in its own words and decide |

You can close the session and come back. The Task board appears when you reopen, and running the same command reads the ledger and resumes where it stopped.

### `/zab:migrate` — only for projects made by the Korean release

Version 0.1 used Korean file names and ledger keys. In such a project the other commands only point here. `/zab:migrate` lists what would be renamed and changes nothing; `/zab:migrate apply` does it, keeps the old ledger as `log/manifest.ko.json`, and never overwrites a file. The text inside your records is left as it was written.

---

## What a run looks like

A small request — "a script that counts words in the text files under `input`" — went into `/zab:design`. This is what happened.

- The user answered "only files directly under `input/`" and also "put the test files in a subfolder of `input/`". Z pointed out that **as stated, the test files would never be counted**, offered three ways to resolve it, and stopped. It did not quietly rewrite the spec.
- While writing the criteria, B found eight places where the spec alone left the verdict open: does "whitespace" include a full-width space; does `.TXT` count; what happens with zero matching files; where do errors go and what is the exit code.
- Once the user answered, a **fresh B session** revised the criteria and asked for approval again.

Eight questions that would otherwise have surfaced after the build came out before a line of code was written. For a word counter, that is too much ceremony. If the number that script prints is going into a report, it is not.

---

## How it differs

| Common approach | What happens | zab |
|---|---|---|
| One session: "build it and review it" | The same context builds and grades | Building and judging are separate sessions, and the judge is not told how it was built |
| Plan, get approval, implement | Settles what to build, not **what will count as done** | Verification criteria are written separately from the spec, first, and you approve them |
| Run a review agent afterwards | The reviewer is handed the implementation summary and reads within that frame | There is a cap on what the verifier may be told |
| The same party writes requirements and criteria | When a check fails, lowering the bar is the cheapest move | You and Z write the spec; B writes the criteria; only B edits them |
| The AI summarizes, the person approves | Nobody opens the file | At a checkpoint you get a path, and you open it |
| Development-only workflow tools | Work with no tests to run has no means of checking | Each kind of job carries its own criteria. Circuit analysis and spreadsheet work ship with theirs |

## What it costs

Stated plainly.

- **It is slow.** Criteria first, three or four human checkpoints, checks run in fresh sessions. Even a small request goes through several steps.
- **It uses a lot of tokens.** The role documents are long, and the verifier reads its rules from the top on every call.
- **It enforces almost nothing.** There are three hooks: one shows the Task board when a session opens, one lets a session read the plugin's own documents without a permission prompt, and one checks who owns a file before it is written — the verifier's files are refused to everyone else, and the builder and verifier are refused the orchestrator's. That last one guards against slips, not intent: it does not see shell commands, and it fails open. Every other rule is a document; if a model breaks one, nothing mechanical stops it.
- **It does not replace your checking.** Approve at a ★ without opening the file and the method is worth half as much.
- **Claude Code only.** Codex is not supported yet.

---

## Install

Inside Claude Code:

```
/plugin install zab --marketplace seo077/zab
```

Requires Node 18 or later. Nothing else to install.

## Kinds of job

`/zab:design` shows the kinds of job (pipelines) you can pick.

| Pipeline | For |
|---|---|
| **general** | Work with no fixed shape. Code starts here |
| **circuit-analysis** | Reading a schematic module by module, analysing it, and diagnosing errors, risks and improvements |
| **spreadsheet** | Spreadsheet work in two stages, layout then output, without modifying the original |
| **new-pipeline** | Making a pipeline for a new kind of job you will repeat |

The knowledge that changes with the kind of job is attached separately. Pick circuit analysis and A reads the circuit-analysis rules and references while B reads the circuit-analysis criteria. When you find yourself repeating a kind of work, run **new-pipeline** once to create its definition; what it creates lands in your project's `pipeline/` folder.

## Where things live

The role documents and job definitions exist **once, inside the plugin**. A project holds only its materials, results and records.

```
plugin                               project
├─ pipeline/                         ├─ CLAUDE.md · project-map.md
│  ├─ z/  Z's rules · definitions     ├─ input/      materials
│  ├─ a/  A's rules · per-job notes   ├─ output/     results
│  └─ b/  B's rules · criteria        ├─ pipeline/   definitions made in this project
├─ templates/project/                └─ log/
├─ commands/  setup · design · build     ├─ manifest.json    the Task ledger
├─ agents/    a · b                      ├─ run-log.md · decisions.md
└─ scripts/                              └─ T1_<name>/       everything about one Task
                                             criteria · build notes · verdicts · call messages
```

- One run of a job is **one Task** (`T1`, `T2`, …). Fixing and redoing is not a new Task but a repeat inside the same one (`R2`, `R3`).
- **Every file has one owner.** Only Z writes the ledger and shared logs, only A writes results, only B writes criteria and verdicts.
- The plugin's `pipeline/` is read-only, and an update replaces it. What your work teaches is written to your own layer, outside the plugin and outside any one project.

### It learns from your work, and keeps it

A run leaves more than a result. Preferences you stated at a checkpoint, a pitfall the verifier hit, a kind of job you ended up defining — these are written down as files, in the same shape as the plugin's own rules, **in a folder of your own**: `~/.zab/pipeline/`. Nothing to run and nothing to copy. The next project you open, in any folder, starts with them, and a plugin update does not touch them.

| Layer | Where | Read by | Written |
|---|---|---|---|
| Project | `pipeline/` in the project | this project | only when you say "for this project only" |
| **Yours** | `~/.zab/pipeline/` | every project you open | by default, as you work |
| Plugin | inside the plugin | everyone | never — it is the shipped baseline |

The nearer layer wins, so your own track replaces the shipped one of the same name. When a Task closes, Z lists the files it added to your layer; they are plain files, and deleting one undoes it. The role rules themselves — who may judge, what the verifier may be told — are not layered; they stay as shipped. If something of yours should reach everyone, send it here as a pull request.

The whole method is in [pipeline/README.md](pipeline/README.md); paths and command boundaries for the plugin are in [pipeline/z/plugin-operation.md](pipeline/z/plugin-operation.md).

## Development

```
npm test                    # tests for scripts
claude plugin validate .
claude --plugin-dir .       # run this repo as a plugin
```

## License

MIT
