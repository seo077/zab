<!-- Korean: README.ko.md -->

# interlocking

**A plugin for Claude Code and Codex that makes the planning gate real.**

An *interlocking* is the railway device that makes conflicting routes physically
impossible to set. This is the same idea for AI coding sessions: until a human has
approved the spec, the agent cannot edit source — and it cannot approve the spec
itself, however it is asked.

**Claude Code**

```
/plugin marketplace add seo077/interlocking
/plugin install il@interlocking
```

**Codex** — then open the TUI once and accept the hook trust prompt (`/hooks`).
Until you do, Codex skips the hooks without saying so and nothing is gated;
`$il-console doctor` will tell you which state you are in.

```
codex plugin marketplace add https://github.com/seo077/interlocking
codex plugin add il@interlocking
```


<p align="center">
  <img src="docs/demo.svg" alt="A terminal replay: the gate refusing a write, two forgery attempts failing, a human approving, and an independent verifier refusing to trust the project&apos;s own notes" width="880">
</p>

<sub>Real output from the run written up in <a href="docs/design/WALKTHROUGH.ko.md">WALKTHROUGH.ko.md</a> (Korean). Regenerate with <code>node tools/make-demo.mjs &gt; docs/demo.svg</code>.</sub>

---

## Why another one of these?

[spec-kit][spec-kit] and [BMAD][bmad] already describe good spec-driven workflows,
and both are worth using. But they are **documents and commands**: the agent is
asked to follow them, and an agent under pressure to be helpful will decide that
this particular case is fine to skip. spec-kit is agent-agnostic by design, which
rules out hooks entirely.

interlocking is not another methodology. It is the **enforcement layer**:

| | |
|---|---|
| **The gate blocks** | Until a human approves `SPEC.md`, source edits are denied — by a `PreToolUse` hook, not by a paragraph asking nicely. Markdown, docs and `.interlocking/**` stay writable, so planning is never blocked. |
| **The agent cannot self-approve** | Approval is recorded by a hook reading the human's literal keystrokes, into a signed record **outside the repo**. Editing `gates_passed` in `STATE.md` does not open anything — it prints a tamper warning at every session start. |
| **Nobody grades their own homework** | The session that writes a requirement does not write the criterion it will be judged by. `il-criteria` writes those, before any code exists, into a file the spec's author cannot touch — and the approval binds to it, so the yardstick cannot move afterwards either. On a failing round, shortening the ruler is the cheapest fix available; this is what takes it off the table. |
| **What you approve is what you read** | Before the gate is asked to open, the design is rendered by the hook — decisions, every requirement paired with the criterion set for it, the assumptions riding along — and ruled on cold by a critic that was not in the interview and cannot edit either document. Its `NOT YET` refuses the approval; a human can overrule it, on the record. |
| **Sessions resume** | Kill the session at any point. The next one starts with the resume anchor, the next action, and an explicit question about uncommitted work — which it will not answer for you. |
| **Verification is independent** | A verifier subagent that never saw the implementation conversation judges each requirement against its own acceptance criteria. It can read and run; it cannot write source, enforced by a hook rather than by its own config. |

[spec-kit]: https://github.com/github/spec-kit
[bmad]: https://github.com/bmad-code-org/BMAD-METHOD

---

## What a feature looks like

```
/il:new user login

  [il] Size: feature (4 REQs, ~8 tasks)
       Researching… interviewing (3 questions)… threat model…
       Wrote .interlocking/work/001-login/SPEC.md   ← requirements, no criteria

  [il] il-criteria wrote the yardstick. It did not write the spec, it will not
       write the code, and there is no code yet to write one around.
       Wrote .interlocking/work/001-login/CRITERIA.md   ← 4 criteria, 1 unjudgeable

  [il] The design, before you are asked to approve it — /il:design

    DECIDED WITH YOU (3)
      DEC-002  Sessions live on the server, not in a signed cookie.
               asked   Server sessions or a stateless JWT?
               you     Server. I want to be able to revoke one.
               lands   REQ-002, REQ-004
    BUILDING (4) — and how each is judged
      REQ-002  A session expires after 30 minutes of inactivity.
               judged  a request 31 minutes after the previous one returns 401
               how     run `npm test -- session-expiry`
      REQ-004  Login is fast enough under load.
               judged  NOTHING — no number in the requirement, so nothing to test
    ASSUMPTIONS (3) — 1 UNCONFIRMED
      ⚠ ASM-003  Single region. (user: declined to answer)

  [il] Read cold by il-spec-critic, which was not in the interview and saw the
       two documents side by side for the first time:
    REQ-004  "fast enough" has no number, so no verifier can rule on it
    VERDICT: NOT YET — REQ-004 is the blocker

> /il:approve
  [il] G0 refused for 001-login — il-spec-critic returned NOT YET (1 blocker).
       Read it:   .interlocking/work/001-login/REVIEW.md
       Overrule:  /il:approve despite-review

> the agent tries to get ahead of itself
  ⏺ Write(src/auth/session.ts)
  ⎿  ✗ [il] G0 not approved for 001-login — cannot write src/auth/session.ts
        Ask the human to review it and type:  /il:approve
        Urgent? the human can type:           /il:override <reason>
        Markdown, docs and .interlocking/** are never blocked — keep planning.

> the human puts a number on REQ-004, il-criteria runs again, the critic clears it

> /il:approve
  [il] G0 approved — 001-login (spec 4f2a9c1e, criteria 9b1d0c33). Code edits unlocked.

/il:next     one task, one subagent, one commit
/il:verify   an independent verifier judges each REQ against CRITERIA.md — which
             neither it nor the implementer wrote — and writes VERIFY.md itself
```

Then the laptop dies. The next session opens with:

```
[il] 001-login · EXECUTE · G0 approved (spec 4f2a9c1e ✓ unchanged)
NEXT: T-012 — session cookie in src/auth/session.ts (SPEC.md#REQ-007)

[il] ACTION REQUIRED — resolve with the human before anything else:
  3 file(s) have uncommitted changes: src/auth/session.ts, tests/test_session.ts…
  Ask the human, and do not decide for them: (a) finish  (b) discard and restart  (c) show me the diff
```

---

## Commands

| | |
|---|---|
| **`/il:help`** | **Start here.** Where you are, and the two or three commands that would do something right now |
| `/il:new <goal>` | Size, research, interview, threat model, spec, ask for approval |
| `/il:onboard` | Set an existing repo up. Existing code is never retro-gated. |
| `/il:design` | The design as it stands: decisions, every REQ with its criterion, assumptions |
| `/il:status` | Where things stand, in detail |
| `/il:next` | Run the next ready task in a fresh subagent, commit it |
| `/il:verify` | Independent acceptance verification |
| `/il:doctor` | What this installation can actually enforce |
| **`/il:approve`** | **Human only.** Open the gate. |
| **`/il:override <reason>`** | **Human only.** Time-boxed, recorded bypass — the fast lane for trivial and localized low-risk work. |
| **`/il:policy`** | **Human only.** Bless a widened `policy.json`. |

The last three cannot be invoked by the model. They are handled by a hook that
reads what you typed. Both forms work — `/il:approve` and plain `il approve` — and
the second one is deliberate insurance: an *unregistered* slash command skips hooks
entirely, so a plain sentence is the form that cannot be short-circuited.

### On Codex

Codex has no plugin slash commands, so the same actions are spelled differently.
The hook detects the host and prints the right spelling; this table is for when
you want to type one yourself.

| Claude Code | Codex |
|---|---|
| `/il:new <goal>` | `$il-spec` |
| `/il:onboard` | `$il-onboard` |
| `/il:next` | `$il-execute` |
| `/il:verify` | `$il-verify` |
| `/il:status` `/il:help` `/il:doctor` `/il:design` | `$il-console status` · `help` · `doctor` · `design` |
| `/il:approve` | **`il approve`** |
| `/il:override <reason>` | **`il override <reason>`** |
| `/il:policy` | **`il policy`** |

The three human-only directives are the ones worth committing to memory. They are
plain text on both hosts, they were always accepted without the slash, and no
skill or command sits between your keystrokes and the hook that records them.

---

## What it does not do

This is the part most tools leave out.

**interlocking makes it hard to slide from planning into implementing by accident,
and makes every deliberate bypass loud and recorded. It is not a sandbox.** A model
that decides to route around the gate can. The design goal is that you find out.

| Vector | v0.1 |
|---|---|
| `Edit` / `Write` / `MultiEdit` / `NotebookEdit` (Claude Code) | ✅ blocked |
| `apply_patch` (Codex — its only write tool) | ✅ blocked, envelope parsed for every target |
| Redirects `> f`, `>> f`, `tee`, heredocs, fd prefixes | ✅ |
| In-place editors `sed -i`, `perl -i` | ✅ |
| Patch appliers `git apply`, `patch`, `git checkout -- `, `git stash pop`, `git reset --hard` | ✅ denied while gated |
| Inline interpreters `python -c`, `node -e`, `ruby -e`, `php -r` | ✅ denied while gated |
| Scaffolders `npm init`, `npx create-*`, `cargo new`, `go mod init` | ✅ denied while gated |
| `cp` / `mv` / `install` / `ln` into a source path | ✅ |
| Nested `claude -p` / `codex exec` | ✅ denied while gated |
| Tool calls **inside subagents** | ✅ hooks fire there too |
| Untrusted hooks on Codex | ⚠️ **skipped silently until you accept the trust prompt once** — run `$il-console doctor` |
| Agent identity on Codex | ⚠️ not attested by the host, so the three judgement files are a convention there, not a lock — see below |
| Redirect targets built at runtime (`> $OUT`) | ✅ denied — unresolvable, so not waved through |
| `eval "$(… \| base64 -d)"`, `awk 'BEGIN{print > "f"}'`, variable-built paths | ❌ **not caught** |
| MCP filesystem servers | ⚠️ partial — tool names matching `write\|edit\|create\|patch\|…` only |
| You, in your own editor | ❌ out of scope by design |

The full corpus is [`test/fixtures/bash-writes.txt`][corpus] — 110 real bypass
attempts, each one a test.

> **Found one we miss? Add a line to that file and open a PR.** It is the single
> highest-value contribution here: a fix without a corpus entry regresses silently.

[corpus]: test/fixtures/bash-writes.txt

### How independent is "independent"?

| | v0.1 |
|---|---|
| Context — never sees the implementation conversation | ✅ |
| Permissions — cannot write source, enforced by hook | ✅ |
| Input — fixed template, no free-text slot for the caller | ✅ |
| Judgement — SPEC is the only source of requirements | ✅ |
| **Identity — attested by the host, not claimed by the agent** | ✅ Claude Code · ❌ Codex |
| **Model — same model as the implementer** | ❌ |

**On Codex the identity row is the one that changes.** Claude Code stamps
`agent_type` onto every tool call itself, which is what makes "only `il-verifier`
may write `VERIFY.md`" a rule rather than a request. Codex does not send it, and
its `spawn_agent` takes the agent type as an argument the *model* supplies — so
there is nothing to check. Building a fixed packet instead arms one signed,
10-minute, single-use write to its judgement file. `/il:doctor` describes this as
a capability convention rather than identity proof. The G0 gate does not depend
on this.

**The same model makes the same mistakes.** If Claude misremembers an API, the
implementer and the verifier misremember it identically. By [NASA IV&V][ivv]
standards this is partial *technical* independence and nothing more. Cross-model
verification (`--cross`) is planned; the packet is already a file so that it can be
handed to another tool unchanged.

[ivv]: https://swehb.nasa.gov/display/SWEHBVC/SWE-141+-+Software+Independent+Verification+and+Validation

### Validation vs verification

| | Question | Judged by | Here |
|---|---|---|---|
| **Validation** | Did we build the right thing? | a human, always | **G0 approval** |
| **Verification** | Did we build it to spec? | can be automated | **`/il:verify`** |

G0 *is* the validation step — the interview, the assumption ledger, the
build/don't-build summary. Post-hoc validation (does it hold up in use?) is not in
v0.1; that is G3.

### Cost

Roughly **110 ms per gated tool call on Windows, ~80 ms of which is bare Node
startup**; about half that on Linux and macOS. `Read`, `Grep` and `Glob` are
deliberately not hooked. `IL_DISABLE=1` turns everything off.

In a repo without `.interlocking/`, the hook is one `existsSync` and then gone.

---

## Disclaimer

> interlocking enforces a *process*. It does not verify that your code is correct,
> secure, or fit for purpose. Gates can be overridden, and the G0 edit block is a
> guardrail against accidental drift — **not a security boundary**. Do not rely on
> it as one.

No telemetry. Nothing leaves your machine. The harness reads your project's
documents, so that has to be true for it to be worth installing.

---

## Layout

```
your-repo/
├── src/                    ← your code. The harness never moves it.
├── CLAUDE.md
└── .interlocking/          ← committed, so work resumes on another machine
    ├── policy.json         what counts as code here, and what may bypass
    ├── CONTEXT.md          principles, stack, glossary, roadmap
    ├── DECISIONS/          ADRs: what was chosen, and what was rejected and why
    ├── work/001-login/     SPEC · PLAN · TASKS · STATE · VERIFY
    └── archive/            completed features
```

The plugin itself carries two manifests, because the two hosts look in different
places: `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`. Both point
at the same `hooks/il.mjs` and the same `hooks/hooks.json`.

The approval store lives **outside** the repo — `~/.interlocking/`, or wherever
`IL_HOME` points. That is the point: a gate recorded in a file the model can write
is not a gate. It is deliberately *not* `CLAUDE_PLUGIN_DATA`, which both hosts set
for hook processes and neither sets for anything else; a store that moves with the
calling context once had `/il:status` and the gate itself reporting opposite
answers on the same project in the same second.

---

## Docs

- [Korean README](README.ko.md)
- [Security model and reporting](SECURITY.md)
- [Contributing](CONTRIBUTING.md) — start with the bypass corpus
- [Measured platform behaviour](docs/design/platform-facts.md) — what was verified against the real binary, and what was not
- [Design notes (Korean)](docs/design/concept.ko.md)

MIT. Requires Node 18+ and either Claude Code or Codex CLI (measured on 0.149.0).
