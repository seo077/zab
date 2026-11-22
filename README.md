# zab

**English** · [한국어](README.ko.md)

**A Claude Code plugin for work that is expensive to get wrong.**
The acceptance criteria are written first, a verifier that never saw the build checks the result against them, and a person looks at the actual files at every decision point. It is not limited to code.

```
/zab:setup     prepare the folder
/zab:design    settle what to make, and what will count as done
/zab:build     make it, check it, accept it
```

> **Language note.** The commands and this guide are in English and Korean. The method itself — the role rules and verification criteria the agents read — is written in Korean, and the agents write their working records in Korean. See [What it costs](#what-it-costs).

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
log/실행로그.md          what was done, step by step
log/AI 논의사항.md       decisions, and what you said, verbatim
pipeline/               job definitions created in this project (empty at first)
프로젝트지도.md          a one-page map of the project
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

If you already know the kind of job, name it: `/zab:design 회로분석`.

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
- **It enforces almost nothing.** There are three hooks: one shows the Task board when a session opens, one lets a session read the plugin's own documents without a permission prompt, and one checks who owns a file before it is written and refuses a role that tries to write another role's file. That last one guards against slips, not intent: it does not see shell commands, and it fails open. Every other rule is a document; if a model breaks one, nothing mechanical stops it. Exactly what runs is listed under [What it runs on your machine](#what-it-runs-on-your-machine).
- **It does not replace your checking.** Approve at a ★ without opening the file and the method is worth half as much.
- **The method is written in Korean.** The role rules, the criteria and the records the agents write are Korean. The commands work in any language you type, but you will be reading Korean files at the checkpoints.
- **Claude Code only.** Codex is not supported yet.

---

## Install

Inside Claude Code:

```
/plugin install zab --marketplace seo077/zab
```

Requires Node 18 or later. Nothing else to install.

## What it runs on your machine

Everything the plugin executes is one file, [scripts/zab.mjs](scripts/zab.mjs) — plain, unminified Node with no dependencies. It uses only Node's file-system and path modules. It makes **no network requests**, starts no other programs, and reads no environment variables or credentials. Nothing is downloaded, installed or sent anywhere.

| When | What runs | What it does |
|---|---|---|
| `/zab:setup` | `zab.mjs setup` | Copies the project template into the current folder. Never overwrites a file that already exists |
| `/zab:design`, `/zab:build` | `zab.mjs where` | Prints the plugin's paths and the Task board read from `log/manifest.json`. Read-only |
| A session starts (hook) | `zab.mjs banner` | Shows the Task board, and only in a folder that `/zab:setup` prepared. Silent everywhere else |
| Before `Read`, `Grep`, `Glob` (hook) | `zab.mjs allow-read` | Answers the permission check with **allow** when the target is inside the plugin's own `pipeline/` or `templates/project/` folder. For any other path it says nothing, and Claude Code's normal permission flow decides. It never answers for a write tool or a shell command, and it never denies |
| Before `Write`, `Edit`, `MultiEdit`, `NotebookEdit` (hook) | `zab.mjs own` | Inside a zab project only, **refuses** a write to a file that belongs to another role (table below). Says nothing in any other folder |

**Why a hook answers a permission check.** The role documents live in the plugin's install folder, outside your project. Without the read hook every read of them is a permission prompt, and a subagent cannot answer one. The hook covers those two folders of the plugin's own shipped documents and nothing else.

**What the ownership hook refuses.**

| File | Owner | A write by anyone else |
|---|---|---|
| In a Task room: `검증기준.md` (criteria), `검증요약/` (verdicts), `관찰/B*/`. In the project: `pipeline/b/` | B, the verifier | Refused |
| `log/manifest.json`, `log/실행로그.md`, `log/AI 논의사항.md`, `프로젝트지도.md`, and a Task room's `배정/` and `호출/` | Z, the orchestrator | Refused to A and B |
| `output/`, and in a Task room `구현요약/`, `설계명세.md`, `관찰/A*/` | A, the builder | Refused to B. Z is let through, and the edit is recorded in `log/직접수정.jsonl` so you see it at the next ★ |

The roles are told apart by agent type: the main session is Z, and the plugin's own `zab:a` and `zab:b` subagents are A and B. A Task you run in mode 1 — opening A and B yourself as ordinary sessions — is exempt, because those sessions cannot be told apart. The hook sees the editing tools only, not shell commands.

**Permissions the commands ask for.** Each of the three commands pre-approves exactly one command line in its front matter (`allowed-tools`): its own `zab.mjs` call from the table above, so that line can run without a prompt. Nothing else is pre-approved — any other shell command an agent wants to run goes through Claude Code's normal permission prompt.

**If something goes wrong in the script**, all three hooks stay silent and exit normally: an error never blocks a session. Without Node on the PATH the hooks do nothing at all.

**What gets written.** `/zab:setup` creates `input/`, `output/`, `log/`, `pipeline/`, `CLAUDE.md` and `프로젝트지도.md` in the current folder. After that the agents write their records under `log/` and their results under `output/`. The script writes nothing outside the project folder.

**To switch it off**, disable or uninstall the plugin from `/plugin`. The files in your project are ordinary files and stay as they are.

## Privacy

zab collects nothing. It has no server, no telemetry and no network code, and it adds no data flow of its own to Claude Code. The records the agents write — including your instructions, quoted verbatim in the decision log — are ordinary files under `log/` in your own project folder, and they stay there until you delete them. See [PRIVACY.md](PRIVACY.md).

## Kinds of job

`/zab:design` shows the kinds of job (pipelines) you can pick.

| Pipeline | For |
|---|---|
| **범용** (general) | Work with no fixed shape. Code starts here |
| **회로분석** (circuit analysis) | Reading a schematic module by module, analysing it, and diagnosing errors, risks and improvements |
| **엑셀작업** (spreadsheet work) | Spreadsheet work in two stages, layout then output, without modifying the original |
| **파이프라인신설** (new pipeline) | Making a pipeline for a new kind of job you will repeat |

The knowledge that changes with the kind of job is attached separately. Pick circuit analysis and A reads the circuit-analysis rules and references while B reads the circuit-analysis criteria. When you find yourself repeating a kind of work, run **파이프라인신설** once to create its definition; what it creates lands in your project's `pipeline/` folder.

### Three requests to try

Run `/zab:setup` in an empty folder, then one of these. You can type the request in any language.

1. **A small script, on the general pipeline.** `/zab:design 범용` — "Write a script that counts the words in each text file under input/ and prints one total per file."
2. **Spreadsheet work.** Put a workbook in `input/`, then `/zab:design 엑셀작업` — "Build a summary sheet from input/sales.xlsx without changing the original file."
3. **A pipeline of your own.** `/zab:design 파이프라인신설` — "Make a pipeline for reviewing meeting minutes: what the builder must produce and what the verifier must check."

Each one stops at the first ★ and gives you the path of the file to open. `/zab:build` carries on from there.

## Where things live

The role documents and job definitions exist **once, inside the plugin**. A project holds only its materials, results and records.

```
plugin                               project
├─ pipeline/                         ├─ CLAUDE.md · 프로젝트지도.md
│  ├─ z/  Z's rules · definitions     ├─ input/      materials
│  ├─ a/  A's rules · per-job notes   ├─ output/     results
│  └─ b/  B's rules · criteria        ├─ pipeline/   definitions made in this project
├─ templates/project/                └─ log/
├─ commands/  setup · design · build     ├─ manifest.json    the Task ledger
├─ agents/    a · b                      ├─ 실행로그.md · AI 논의사항.md
└─ scripts/                              └─ T1_<name>/       everything about one Task
                                             criteria · build notes · verdicts · call messages
```

- One run of a job is **one Task** (`T1`, `T2`, …). Fixing and redoing is not a new Task but a repeat inside the same one (`R2`, `R3`).
- **Every file has one owner.** Only Z writes the ledger and shared logs, only A writes results, only B writes criteria and verdicts.
- The plugin's `pipeline/` is read-only. If a definition you made in a project proves useful more than once, send it here as a pull request.

The whole method is in [pipeline/README.md](pipeline/README.md); paths and command boundaries for the plugin are in [pipeline/z/플러그인운용.md](pipeline/z/플러그인운용.md).

### What each document tells the agents

The method documents are Korean. This is what each one is, for readers who do not read Korean. They are plain Markdown; nothing in them is hidden, encoded or fetched at run time.

| Document | What it is |
|---|---|
| `pipeline/z/부팅.md` | Z's boot document: how a session starts, picks a job definition and opens a Task |
| `pipeline/z/상호작용규칙.md` | How Z calls A and B, and the cap on what Z may tell the verifier |
| `pipeline/z/플러그인운용.md` | Paths and command boundaries when the method runs as this plugin, and the file-ownership table |
| `pipeline/z/pipelines/` | The job definitions — the step tables for 범용, 회로분석, 엑셀작업 and 파이프라인신설 |
| `pipeline/z/Codex운용.md` | Operating notes kept from the method's original repository. This plugin does not use them |
| `pipeline/a/부팅.md`, `pipeline/a/공통규칙.md` | A's boot document and common rules |
| `pipeline/a/갈래별/` | Per-job rules, references and working procedures for A |
| `pipeline/b/부팅.md`, `pipeline/b/공통규칙.md` | B's boot document and common rules: what an independent judgement means here |
| `pipeline/b/검증기준_공통.md` | The verification criteria common to every job |
| `pipeline/b/갈래별/` | Per-job criteria and references for B |
| `pipeline/개선이력/` | Where lessons from finished Tasks are recorded |
| `templates/project/` | The folder `/zab:setup` copies into a project |

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `/zab:design` or `/zab:build` says there is no ledger (`log/manifest.json`) | The folder is not prepared. Run `/zab:setup` there first |
| A command shows an empty first block, or the Task board never appears | Node 18 or later is not on your PATH. Check with `node --version`. Without Node the hooks do nothing and the commands cannot print their paths |
| The Task board does not appear when a session opens | It shows only in a folder that `/zab:setup` prepared. Open Claude Code in that folder |
| A write is refused with a message that starts with `zab:` | The ownership hook stopped an agent writing another role's file, and the message names the owner. If the file should change, have Z call the owning role again |
| Z reports that the `zab:a` or `zab:b` agent is not available | The plugin is not enabled in this session. Check `/plugin` |
| The records and checkpoint files are in Korean | That is this release. The method documents are Korean; see [What it costs](#what-it-costs) |
| You want to stop using it in a project | Disable or uninstall the plugin from `/plugin`. The files in your project stay as they are |

## Support

Questions and bug reports go to [GitHub issues](https://github.com/seo077/zab/issues). To report a security problem, see [SECURITY.md](SECURITY.md).

## Development

```
npm test                    # tests for scripts
claude plugin validate .
claude --plugin-dir .       # run this repo as a plugin
```

## Authors

zab was made by [Hongsungung](https://github.com/Hongsungung) and [seo077](https://github.com/seo077).

## License

MIT
