# ung

A **Claude Code plugin** that packages the Z·A·B collaboration pipeline: a human
decides, Z orchestrates and records, A builds, and a B that never saw the build
judges. Three commands — `/ung:setup`, `/ung:design`, `/ung:build`.

**Read `README.md` first**, then `pipeline/README.md` and
`pipeline/z/플러그인운용.md`.

This repo used to be `interlocking`, a hook-enforced harness. That design was
dropped on 2026-11-18 in favour of this one and is preserved at the tag
`interlocking-v0.1-final`. Nothing of it remains on this branch; do not bring the
gate back piecemeal.

---

## Where things are

| | |
|---|---|
| `pipeline/` | **the product.** Role documents, pipeline definitions and 갈래, in Korean. Ported from the method's original repo (v0.7) |
| `pipeline/z/플러그인운용.md` | the adapter: what the paths are in a plugin install, which stretch of the flow each command covers, how subagents are called |
| `templates/project/` | what `/ung:setup` copies into a project. `log/T1_예시작업/` is a form B reads from here and is deliberately *not* copied |
| `commands/*.md` | the three commands. Thin: print the paths, tell the session it is Z, point at the boot document |
| `agents/a.md` `agents/b.md` | mode-2 subagents. Thin on purpose — the role lives in `pipeline/a/부팅.md` and `pipeline/b/부팅.md` |
| `scripts/ung.mjs` | the only executable: `setup`, `where`, `banner`, `allow-read` |
| `hooks/hooks.json` | `SessionStart` prints the Task board; `PreToolUse` on `Read|Grep|Glob` allows reads of the plugin's own documents |
| `test/ung.test.mjs` | tests for `ung.mjs`. `npm test` |

## Invariants

**The documents are the method; the code only finds them.** If a rule needs
changing, change the document in `pipeline/`. Do not encode role rules in
`ung.mjs`, in a command, or in an agent file — a second copy drifts.

**The plugin's `pipeline/` is read-only at run time.** An installed plugin is a
cached copy that an update replaces. Everything a pipeline run writes goes to the
project's own `pipeline/` (layer L). Promotion from a project to this repo is a
Pull Request, one direction only.

**`setup` never overwrites.** It is run in folders that already hold work.

**The hooks must never take a session down.** Both swallow every error and exit
0. `banner` stays silent in any folder whose manifest does not say `plugin:ung`.

**The read hook only ever says "allow".** The role documents live in the plugin,
outside the project, so an unaided `Read` of `pipeline/z/부팅.md` is a permission
prompt — and refused outright in a headless run or a subagent. `allow-read`
answers for `Read`/`Grep`/`Glob` inside `pipeline/` and `templates/project/` and
prints nothing for everything else, so the normal permission flow decides. It
must never emit `deny` or `ask`, and never cover a write tool. Measured on Claude
Code 2.1.327, Windows: without it `/ung:design` stops at step 1; with it Z boots.

**`b/` is the verifier's.** Text under `pipeline/b/` defines what independent
judgement means here. Do not thin it out while tidying other documents.

**Zero runtime dependencies**, Node 18+.

## How to work here

**Never string-assert on prompt text.** Commands, agents and `pipeline/` are
natural language; such tests are brittle and catch nothing. Test `ung.mjs`.

**Run it, do not only test it.** `claude --plugin-dir .` in a scratch folder and
drive `/ung:setup` → `/ung:design` → `/ung:build`. The defects that reached HEAD in
this repo's previous life were all silent integration failures — a `!` block with
no `allowed-tools` makes a command do nothing at all, with no error.

**Measure the platform, do not cite the docs.**

Before pushing: `npm test && claude plugin validate .` — `--strict` currently fails on
two known warnings: this file sitting at the plugin root, and no icon yet.

## State

v0.1.0 of the rewrite. Claude Code only.

**Driven for real once** (2026-11-19, Claude Code 2.1.327, Windows, headless
`claude --plugin-dir . -p`, a throwaway word-count task on 범용): `/ung:setup`
scaffolded; `/ung:design` booted Z, negotiated the spec, opened T1, called a B
subagent that read the plugin's documents and wrote the criteria, and stopped at
★ 기준 승인 with file paths. **`/ung:build` has not been run**, nor has an
interactive session, nor an install from the marketplace rather than
`--plugin-dir`.

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
