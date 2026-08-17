# Contributing

## The highest-value contribution

**Find a way to write a source file that the gate does not catch, and add one line
to [`test/fixtures/bash-writes.txt`](test/fixtures/bash-writes.txt).**

That file is the specification for the Bash analyser, not a test fixture that
happens to live near it. A fix without a corpus entry regresses silently the next
time someone touches the tokenizer.

```
WRITE:src/auth.ts :: your-command-here
DENY:interpreter  :: a command whose target cannot be seen statically
NONE              :: something that must NOT be blocked
```

A corpus line with no fix is welcome. Open the PR anyway — an honest known miss in
the file is worth more than an unknown one in the wild.

## Setup

Node 18+ and Claude Code. No dependencies, and it stays that way.

```bash
git clone https://github.com/seo077/interlocking.git && cd interlocking
npm test                          # node --test, no install step
claude plugin validate . --strict

claude plugin marketplace add ./   # install your working copy
claude plugin install il@interlocking --yes
```

`IL_HOME=/tmp/il-scratch` points the approval store somewhere disposable while you
experiment. `IL_DISABLE=1` turns the hooks off entirely.

## House rules

**Zero runtime dependencies.** `hooks/il.mjs` runs on every matching tool call;
every millisecond and every supply-chain link is paid by every user on every call.
The hand-rolled glob and YAML subset are deliberate.

**The hook must never take a session down.** Any unexpected throw logs to
`crash.log` and exits 0. Never exit anything but 0 or 2 — other codes surface an
error on *every* tool call, which on its own gets the plugin uninstalled. Fail
open; the single exception is a signature that does not verify.

**Test-first for the pure functions.** `classify`, `analyzeBash`, `normalizeText`,
`parseFrontmatter`, `checkRequirements`, `composeVerifyPacket`. Write the answer
table, watch it fail, then implement. Both failure directions of `classify` are
fatal — over-blocking gets you uninstalled, under-blocking makes the gate theatre —
so the answers get pinned first.

**Do not string-assert on prompt text.** Skills, commands and agent definitions are
natural language. Tests that assert on their wording are brittle, break on every
improvement, and catch nothing. Verify those by running them.

**Prefer a mutation check to a green bar.** Break the thing you just protected and
confirm the test fails. Several tests in this repo were written before the code and
are annotated with what breaks them; keep that up.

## Adding a warning to the SPEC checker

Heuristics in `checkRequirements` are `severity: 'warn'` and never block. A regex
that vetoes a human's approval on a false positive is exactly how a tool like this
gets deleted.

**Every new detection needs false-positive cases in the same commit.** See
`test/smells.test.mjs`: "argon2id with OWASP 2024 parameters" and "the latest
session record is retained for 30 days" must stay clean.

Only `severity: 'block'` refuses an approval, and only for facts a machine is
certain of: no REQ at all, a REQ with no `Acceptance:` line, no threat model.

## Templates and parsers are coupled

`templates/SPEC.md`'s markers, its `Acceptance:` convention and its headings are
all things `checkRequirements()` looks for. Change one side and you ship a harness
that refuses every spec it generated itself. `test/templates.test.mjs` fills the
template as documented and asserts the result passes its own gate — keep it
passing.

## Platform behaviour

Anything the design depends on is measured against the real binary and written down
in [`docs/design/platform-facts.md`](docs/design/platform-facts.md), including the
version it was measured on. Two Claude Code builds already disagree about which
environment variables exist.

**If you rely on a new hook behaviour, measure it and add it to that file.** Do not
cite the documentation — it has been wrong here more than once.

Windows matters: hooks run under Git Bash, `tool_input.file_path` arrives with
backslashes while `CLAUDE_PROJECT_DIR` uses forward slashes, and a Bash command can
name the same file as `/c/...`. All three must classify identically. CI runs the
matrix; run `npm test` on your own OS before pushing.

## Translations

`README.md` and the shipped prompts are English. `docs/ko/` holds Korean, and
`docs/design/` keeps the Korean originals of the design notes. Translations are
welcome — keep structural keys and IDs (`REQ-001`, `phase`, `Acceptance:`) in
English, because the hook parses them.

## Commits

Explain *why*, not just what. If a decision has a trade-off, the commit message is
where the next person will look for it.

Run before pushing:

```bash
npm test && claude plugin validate . --strict
```
