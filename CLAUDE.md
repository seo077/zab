# zab

A **Claude Code plugin** that packages the Z·A·B collaboration pipeline: a human
decides, Z orchestrates and records, A builds, and a B that never saw the build
judges. Three commands — `/zab:setup`, `/zab:design`, `/zab:build` — plus
`/zab:migrate` for projects made by the Korean release.

**Read `README.md` first**, then `pipeline/README.md` and
`pipeline/z/plugin-operation.md`.

This repo used to be `interlocking`, a hook-enforced harness. That design was
dropped on 2026-11-18 in favour of this one and is preserved at the tag
`interlocking-v0.1-final`. Nothing of it remains on this branch. The approval
gate in particular is not coming back: making a human approval unforgeable needs
keystroke capture and a signed store outside the repo, and that machinery is what
made the old loop slow. The ownership hook below is a different thing — it never
involves a person.

---

## Where things are

| | |
|---|---|
| `pipeline/` | **the product.** Role documents, pipeline definitions and tracks (갈래 in the Korean original), in English. Ported from the method's original repo (v0.7) and translated; the Korean original is the tag `korean-v0.1` |
| `pipeline/z/plugin-operation.md` | the adapter: what the paths are in a plugin install, which stretch of the flow each command covers, how subagents are called |
| `templates/project/` | what `/zab:setup` copies into a project. `log/T1_example/` is a form B reads from here and is deliberately *not* copied |
| `commands/*.md` | the three commands and `migrate`. Thin: print the paths, tell the session it is Z, point at the boot document |
| `agents/a.md` `agents/b.md` | mode-2 subagents. Thin on purpose — the role lives in `pipeline/a/boot.md` and `pipeline/b/boot.md` |
| `scripts/zab.mjs` | the only executable: `setup`, `where`, `migrate`, `banner`, `allow-read`, `own` |
| `hooks/hooks.json` | `SessionStart` prints the Task board; `PreToolUse` on `Read|Grep|Glob` allows reads of the plugin's own documents; `PreToolUse` on the write tools checks file ownership |
| `test/zab.test.mjs` | tests for `zab.mjs`. `npm test` |

## Invariants

**The documents are the method; the code only finds them.** If a rule needs
changing, change the document in `pipeline/`. Do not encode role rules in
`zab.mjs`, in a command, or in an agent file — a second copy drifts.

**The plugin's `pipeline/` is read-only at run time.** An installed plugin is a
cached copy that an update replaces. Everything a pipeline run writes goes to the
project's own `pipeline/` (layer L). Promotion from a project to this repo is a
Pull Request, one direction only.

**Three layers, read nearest first: L (project `pipeline/`) → U (user layer,
`~/.zab/pipeline/`, `ZAB_USER_DIR` overrides) → P (the plugin).** A run writes
what it learns — new definitions, tracks, improvement history, accumulated
references such as user preferences — **to U by default**, so the next project
starts with it; L only when the user says "this project only". There is no copy
step and no command for it: an earlier `/zab:promote` was dropped the same day
because a step a person must remember to run is a step that does not happen.
Only definitions, tracks, improvement history and track references are layered;
the boot documents, common rules, common criteria and `interaction-rules.md` are
read from P alone, so the roles' rules cannot be overridden locally. Z lists
what a Task added to U when it closes (`plugin-operation.md` §2). The test suite
sets `ZAB_USER_DIR` so it never touches the real home folder — keep that line.

**`setup` never overwrites.** It is run in folders that already hold work.

**The hooks must never take a session down.** Both swallow every error and exit
0. `banner` stays silent in any folder whose manifest does not say `plugin:zab`.

**The read hook only ever says "allow".** The role documents live in the plugin,
outside the project, so an unaided `Read` of `pipeline/z/boot.md` is a permission
prompt — and refused outright in a headless run or a subagent. `allow-read`
answers for `Read`/`Grep`/`Glob` inside `pipeline/`, `templates/project/` and the
user layer, and
prints nothing for everything else, so the normal permission flow decides. It
must never emit `deny` or `ask`, and never cover a write tool. Measured on Claude
Code 2.1.327, Windows: without it `/zab:design` stops at step 1; with it Z boots.

**`b/` is the verifier's.** Text under `pipeline/b/` defines what independent
judgement means here. Do not thin it out while tidying other documents.

**One owner per file is the only rule the code enforces.** `own` runs before
`Write`/`Edit`/`MultiEdit`/`NotebookEdit` and compares who is writing (main
session = Z, `zab:a`, `zab:b`) with whose file it is. B's files are refused to
everyone else, Z's files are refused to A and B, and B is refused A's files. Z
writing A's files during a Task is **allowed and recorded** in
`log/direct-edits.jsonl`, because a person sometimes wants Z to make a small fix and
the harm is only in it being invisible. Mode-1 Tasks are exempt (their A and B
are ordinary sessions, indistinguishable from Z). In U the same line holds for
`b/` only, and there the hook also says **allow** to Z, `zab:a` and `zab:b`
working in a zab project: U is outside the project, and a subagent cannot answer
a permission prompt (`decideUserWrite`). It fails open, does not see
Bash, and is a guard against slips rather than against intent. The table lives
in `plugin-operation.md` §7; `classify()` and `decideWrite()` must match it.

Identity is exact: only `zab:a` and `zab:b` carry a role. A bare `b` or another
plugin's `x:b` is a stranger — the old repo once let a near-miss name through as
unrestricted.

**Zero runtime dependencies**, Node 18+.

## How to work here

**Never string-assert on prompt text.** Commands, agents and `pipeline/` are
natural language; such tests are brittle and catch nothing. Test `zab.mjs`.

**Run it, do not only test it.** `claude --plugin-dir .` in a scratch folder and
drive `/zab:setup` → `/zab:design` → `/zab:build`. The defects that reached HEAD in
this repo's previous life were all silent integration failures — a `!` block with
no `allowed-tools` makes a command do nothing at all, with no error.

**Measure the platform, do not cite the docs.**

Before pushing: `npm test && claude plugin validate .` — `--strict` currently fails on
two known warnings: this file sitting at the plugin root, and no icon yet.

## State

v0.1.0 of the rewrite. Claude Code only.

**The English set was driven end to end** (2026-11-19, Claude Code 2.1.327,
Windows, headless `claude --plugin-dir . -p`, a throwaway word-count task on
`general`, user prompts in Korean, four sessions): `/zab:setup` scaffolded;
`/zab:design` booted Z, recorded ★ Spec confirmation, opened T1, called a B
subagent that wrote the criteria and raised nine gray areas, and stopped at
★ Criteria approval; `/zab:build` in a new session resumed from the ledger,
called A, then a fresh B that reran the script in a copy and returned a real
verdict (⚠️ Conditional, Required 18/18, one Recommended ⚠️), and stopped at
★ Final acceptance; a last session recorded the acceptance as a user downgrade
and closed the Task (`done`). Ledger keys, values and file names came out in
English and the records in Korean, as `plugin-operation.md` §8 says. Things the
run showed:

- Z refused to record a ★ Build review "I opened it and approve" that was typed
  before the file existed as a direct inspection; it logged it as an advance
  instruction and left `reviewed` empty.
- The one ⚠️ was not about the deliverable: B could not confirm a section of
  `a/common-rules.md` because that path was not in its read assignment.
- At close Z wrote `improvements/001_…candidates.md` **to the user layer** and
  listed the path, as §2 says. It did so after a single run, though
  `improvements/README.md` asks for lessons confirmed by repetition — the "U by
  default" rule may be making that bar feel lower. Watch it.

**Later the same day** (headless, same version), each cut short by the usage
limit — pick up from here:

- **Migrated project**: a project driven to ★ 기준 승인 by the real
  `korean-v0.1` plugin was migrated (`migrate apply`, 13 renames) and
  `/zab:build` ran on it: A built, a fresh B verified, ★ Final acceptance. A
  change request there entered rework as documented (spec revision recorded, a
  new B wrote criteria r2, stop at ★ Criteria approval). The R2 build itself
  was not run.
- **`new-pipeline`** ran to ★ Final acceptance and wrote its three sets to U.
  The verdict failed on fingerprints nobody could measure — a role's shell is
  confined to the project. `zab.mjs fingerprint` was added for that
  (`plugin-operation.md` §1); Z did save its output to `assignments/`, but the
  re-verification using it was cut off. **Unmeasured whether it clears the
  verdict.**
- The real `~/.zab/pipeline/` and `zab:a` are measured: both write; A is
  refused under `U/b/`.
- An empty-folder marker (`.gitkeep`) under `b/` is now writable by anyone —
  the documents let Z and A set up B's folders and the hook used to refuse it.
- The once/twice bar for `improvements/` is now in `plugin-operation.md` §2
  (`_seen-once.md`). **Not yet seen in a run.**
- `z/`, `a/` and `templates/` were compared with the Korean clause by clause by
  independent reviewers (two reversed meanings and six term slips fixed), so
  the "not independently reviewed" note under Next no longer holds.

Not yet exercised: an interactive session, an install from the marketplace
rather than `--plugin-dir`, the build of a rework round (R2). An earlier run on the Korean documents
(same day, under the name `ung`) reached ★ Final acceptance only.

- **Writes to the user layer are measured** (same day and version, default
  permission mode, headless). With the hook's `allow`, the main session wrote
  `U/improvements/…` and a `zab:b` subagent wrote `U/b/…` and
  `U/improvements/…`, U being outside the project folder; the main session's
  write to `U/b/…` was refused with the hook's reason. Not measured: what
  happens without the hook, `zab:a`, and the real default location `~/.zab/`
  (the probes used `ZAB_USER_DIR`).

- **The ownership hook is measured** (2026-11-19, Claude Code 2.1.327, Windows,
  a scratch project with one mode-2 Task, Korean file names). `PreToolUse` input carries
  `agent_type` as `zab:a` / `zab:b` for plugin subagents and nothing for the
  main session. Observed: main session refused on `criteria.md` (then `검증기준.md`); main session's
  write to `output/` allowed and logged to `log/direct-edits.jsonl`; `zab:b` wrote
  `criteria.md` and was refused on `output/`; `zab:a` wrote `output/` and was
  refused on `criteria.md` and on `calls/`. The refusal reason reaches the model
  verbatim. Not measured: `Edit`/`MultiEdit`/`NotebookEdit` (only `Write` was
  driven), and mode 1.
- **The role files hold on their own.** In the first probe both subagents
  refused to start because the prompt carried no boot-document path — the rule in
  `agents/a.md` and `agents/b.md` — and made zero tool calls.

- **B could not hash the plugin's files.** `sha256sum` on a path outside the
  project is a Bash call, which the read hook does not cover, so B reported the
  fingerprints of the common criteria as unmeasured. Extending the hook to Bash
  would mean parsing commands; not done.

- **Codex is not supported yet.** `pipeline/z/codex-operation.md` and the Codex parts of
  `interaction-rules.md` §1.3 are operating notes from the original repo, kept verbatim;
  they describe adapters this plugin does not ship. Codex has no plugin slash
  commands, so the three commands need a skill-shaped entry there.
- **The ported documents still cite their origin.** Decision numbers (`D-62` …)
  and paths such as `01. 최초부팅 및 디버깅/log/…` point into the original
  workspace and resolve to nothing here. Harmless to the method, confusing to a
  new reader; worth a cleaning pass.
- **No track for code.** Software work runs on `general` until a code track is
  made the intended way — by running `new-pipeline`.

## Next

**Merge `english` into `main` — the owner's call.** `pipeline/` and `templates/`
were translated to English on the branch `english` on 2026-11-19 (owner's
decisions: English only, and file names, folder names and ledger keys in English
too). The condition set for merging — a real `/zab:design` → `/zab:build` on the
English set — is met (see State).

- **What changed besides the text.** Every Korean path became English
  (`부팅.md` → `boot.md`, `갈래별/` → `tracks/`, `검증기준.md` → `criteria.md`,
  `log/실행로그.md` → `log/run-log.md`, `log/AI 논의사항.md` → `log/decisions.md`,
  `프로젝트지도.md` → `project-map.md`, …) and so did the ledger keys and values
  (`상태: 진행중` → `status: in_progress`, `모드2` → `mode2`). `zab.mjs` reads the
  new names only. A project scaffolded by the Korean version is recognised
  (`isLegacy`): `where` and the banner print nothing but a pointer to
  `/zab:migrate`.
- **`migrate` is the bridge.** Dry run by default, `apply` to do it. It renames
  files under `log/`, the project's `pipeline/` and `프로젝트지도.md` by the
  `SEGMENTS` table, rewrites ledger keys and the method's own values (status,
  mode, checkpoint result, `N단계`, the ★ names, paths), and keeps the old ledger
  as `log/manifest.ko.json`. It never overwrites — a name that already exists in
  English is reported and left. It does **not** touch the text inside records,
  Task room names, a verdict's own words, or what the user said. `SEGMENTS`,
  `KEYS` and the value maps must stay the inverse of what this branch renamed.
  Tested on a project scaffolded by the real `korean-v0.1` script; not driven
  through `/zab:build` afterwards.
- **Pipeline ids are English**: `general`, `circuit-analysis`, `spreadsheet`,
  `new-pipeline`. The header-table row `| Purpose | … |` is what `where` lists;
  a test checks every definition has it.
- **`plugin-operation.md` §8 Language is new text, not a translation**: agents
  converse and record in the user's language; names, ledger values, ★ names,
  verdict marks and words stay English; the user's words are recorded verbatim.
  Whether Z actually passes the record language to A and B is unmeasured.
- **How the translation was checked.** `pipeline/b/` was translated last and
  compared with the Korean clause by clause by reviewers that had not made the
  translation. The other folders were translated against a shared glossary and
  not independently reviewed. Verdict words are fixed: ✅ Pass / ⚠️ Conditional /
  ❌ Fail, severities Required / Recommended / Optional, 문면 ⚠️ = doc-gap ⚠️.
- **Deliberate Korean that remains**: citations into the origin workspace
  (`log/AI 논의사항.md`, `03. 회로분석_TDSCU/…`), the user's verbatim words in
  decision records, option labels such as `(가)` `(ㄴ)`, and the Korean
  expressions the spreadsheet pattern dictionary tells B to look for.
- The `D-N` citations stay as they are (see "About the source citations" in
  `pipeline/README.md`).
- `README.ko.md` is kept as a Korean guide to the English method.
- The tag `korean-v0.1` marks the last Korean commit. It exists locally only;
  push it when the branch is merged.

**Waiting on the owner, not on code:** review `pipeline/` for anything that should
not be public; rename the GitHub repo to `zab` and make it public (the README
install line already says `seo077/zab`); then submit at
`claude.ai/directory/manage` → Submit new → Plugin bundle. The checklist was run
on 2026-11-19 and nothing failed; the security scan and human review only run in
the portal. No icon yet.
