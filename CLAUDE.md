# zab

A **Claude Code plugin** that packages the Z·A·B collaboration pipeline: a human
decides, Z orchestrates and records, A builds, and a B that never saw the build
judges. Three commands — `/zab:setup`, `/zab:design`, `/zab:build`.

**Read `README.md` first**, then `pipeline/README.md` and
`pipeline/z/플러그인운용.md`.

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
| `pipeline/` | **the product.** Role documents, pipeline definitions and 갈래, in Korean. Ported from the method's original repo (v0.7) |
| `pipeline/z/플러그인운용.md` | the adapter: what the paths are in a plugin install, which stretch of the flow each command covers, how subagents are called |
| `templates/project/` | what `/zab:setup` copies into a project. `log/T1_예시작업/` is a form B reads from here and is deliberately *not* copied |
| `commands/*.md` | the three commands. Thin: print the paths, tell the session it is Z, point at the boot document |
| `agents/a.md` `agents/b.md` | mode-2 subagents. Thin on purpose — the role lives in `pipeline/a/부팅.md` and `pipeline/b/부팅.md` |
| `scripts/zab.mjs` | the only executable: `setup`, `where`, `banner`, `allow-read`, `own` |
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

**`setup` never overwrites.** It is run in folders that already hold work.

**The hooks must never take a session down.** Both swallow every error and exit
0. `banner` stays silent in any folder whose manifest does not say `plugin:zab`.

**The read hook only ever says "allow".** The role documents live in the plugin,
outside the project, so an unaided `Read` of `pipeline/z/부팅.md` is a permission
prompt — and refused outright in a headless run or a subagent. `allow-read`
answers for `Read`/`Grep`/`Glob` inside `pipeline/` and `templates/project/` and
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
`log/직접수정.jsonl`, because a person sometimes wants Z to make a small fix and
the harm is only in it being invisible. Mode-1 Tasks are exempt (their A and B
are ordinary sessions, indistinguishable from Z). It fails open, does not see
Bash, and is a guard against slips rather than against intent. The table lives
in `플러그인운용.md` §7; `classify()` and `decideWrite()` must match it.

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
one known warning: this file sitting at the plugin root.

## State

v0.1.0 of the rewrite. Claude Code only.

**Driven for real once** (2026-11-19, Claude Code 2.1.327, Windows, headless
`claude --plugin-dir . -p`, a throwaway word-count task on 범용): `/zab:setup`
scaffolded; `/zab:design` booted Z, negotiated the spec, opened T1, called a B
subagent that read the plugin's documents and wrote the criteria, and stopped at
★ 기준 승인 with file paths. `/zab:build` in a new session resumed from the ledger, called A, stopped at ★ 구현
확인, then a fresh B returned a real verdict (조건부, 17 of 18 required items) and
Z stopped at ★ 최종 수락. Not yet exercised: the final-acceptance close-out, an
interactive session, and an install from the marketplace rather than
`--plugin-dir`. (That run was made under the plugin's earlier name, `ung`.)

- **The ownership hook is measured** (2026-11-19, Claude Code 2.1.327, Windows,
  a scratch project with one 모드2 Task). `PreToolUse` input carries
  `agent_type` as `zab:a` / `zab:b` for plugin subagents and nothing for the
  main session. Observed: main session refused on `검증기준.md`; main session's
  write to `output/` allowed and logged to `log/직접수정.jsonl`; `zab:b` wrote
  `검증기준.md` and was refused on `output/`; `zab:a` wrote `output/` and was
  refused on `검증기준.md` and on `호출/`. The refusal reason reaches the model
  verbatim. Not measured: `Edit`/`MultiEdit`/`NotebookEdit` (only `Write` was
  driven), and mode 1.
- **The role files hold on their own.** In the first probe both subagents
  refused to start because the prompt carried no boot-document path — the rule in
  `agents/a.md` and `agents/b.md` — and made zero tool calls.

- **B could not hash the plugin's files.** `sha256sum` on a path outside the
  project is a Bash call, which the read hook does not cover, so B reported the
  fingerprints of the common criteria as unmeasured. Extending the hook to Bash
  would mean parsing commands; not done.

- **Codex is not supported yet.** `pipeline/z/Codex운용.md` and the Codex parts of
  `상호작용규칙.md` §1.3 are operating notes from the original repo, kept verbatim;
  they describe adapters this plugin does not ship. Codex has no plugin slash
  commands, so the three commands need a skill-shaped entry there.
- **The ported documents still cite their origin.** Decision numbers (`D-62` …)
  and paths such as `01. 최초부팅 및 디버깅/log/…` point into the original
  workspace and resolve to nothing here. Harmless to the method, confusing to a
  new reader; worth a cleaning pass.
- **No 갈래 for code.** Software work runs on 범용 until a `코드구현`-style 갈래 is
  made the intended way — by running 파이프라인신설.

## Next

**Translate `pipeline/` and `templates/` to English, on a branch.** Agreed with the
owner on 2026-11-19; not started. What was settled and what was not:

- Do it on its own branch, not on `main`. `main` stays the Korean release until
  the translation has been driven through a real `/zab:design` → `/zab:build`.
- Open question, to ask before starting: keep Korean and English side by side,
  or move to English only. Two copies must be kept in step on every rule change;
  one copy means Korean users read English rules. Note the language of the rule
  documents and the language the agents *write in* are separable — an English
  rule set can still tell the agents to converse and record in the user's
  language.
- File and folder names are Korean too (`부팅.md`, `갈래별/`, `검증기준.md`,
  `log/실행로그.md`) and `zab.mjs` hard-codes several of them — `classify()`,
  the manifest keys (`상태`, `모드`, `현재_단계`), `SKIP`, `LOCAL_DIRS`,
  `DIRECT_LOG`. Renaming them is a code change with tests, not a text change,
  and it changes the layout of every existing project.
- `pipeline/b/` defines what an independent verdict is. Translate it last and
  check it against the original clause by clause; a softened word there changes
  verdicts.
- The `D-N` citations stay as they are (see "출처 표기에 대하여" in
  `pipeline/README.md`).

**Waiting on the owner, not on code:** review `pipeline/` for anything that should
not be public; rename the GitHub repo to `zab` and make it public (the README
install line already says `seo077/zab`); then submit at
`claude.ai/directory/manage` → Submit new → Plugin bundle. The checklist was run
on 2026-11-19 and nothing failed; the security scan and human review only run in
the portal. The icon is `.claude-plugin/icon.png`; the portal reads it only on
the first save or submission.

Housekeeping: branch `ung` is identical to `main` and can be deleted.

