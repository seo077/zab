<!-- Korean: README.ko.md -->

# interlocking

**A Claude Code plugin that makes the planning gate real.**

An *interlocking* is the railway device that makes conflicting routes physically
impossible to set. This is the same idea for AI coding sessions: until a human has
approved the spec, the agent cannot edit source — and it cannot approve the spec
itself, however it is asked.

```
/plugin marketplace add seo077/interlocking
/plugin install il@interlocking
```

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
       Wrote .interlocking/work/001-login/SPEC.md

  [il] G0 approval requested — 001-login

    ⚠ REQ-004 uses unmeasurable wording (fast). What number would prove it?
    ⚠ ASM-003 was never actually confirmed.

    Building:     email+password login · server sessions · 30-min expiry
    NOT building: social login · password reset
    4 REQs · 1 unconfirmed assumption · full text: .interlocking/work/001-login/SPEC.md
    To approve, type:  /il:approve

> the agent tries to get ahead of itself
  ⏺ Write(src/auth/session.ts)
  ⎿  ✗ [il] G0 not approved for 001-login — cannot write src/auth/session.ts
        Ask the human to review it and type:  /il:approve
        Urgent? the human can type:           /il:override <reason>
        Markdown, docs and .interlocking/** are never blocked — keep planning.

> /il:approve
  [il] G0 approved — 001-login (spec 4f2a9c1e). Code edits unlocked.

/il:next     one task, one subagent, one commit
/il:verify   an independent verifier judges each REQ and writes VERIFY.md itself
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
| `/il:new <goal>` | Size, research, interview, threat model, spec, ask for approval |
| `/il:onboard` | Set an existing repo up. Existing code is never retro-gated. |
| `/il:status` · `/il:resume` | Where things stand · pick up an interrupted feature |
| `/il:next` | Run the next ready task in a fresh subagent, commit it |
| `/il:verify` | Independent acceptance verification |
| `/il:doctor` | What this installation can actually enforce |
| **`/il:approve`** | **Human only.** Open the gate. |
| **`/il:override <reason>`** | **Human only.** Time-boxed, recorded bypass — and the fast lane for typo-sized work. |
| **`/il:policy`** | **Human only.** Bless a widened `policy.json`. |

The last three cannot be invoked by the model. They are handled by a hook that
reads what you typed. Both forms work — `/il:approve` and plain `il approve` — and
the second one is deliberate insurance: an *unregistered* slash command skips hooks
entirely, so a plain sentence is the form that cannot be short-circuited.

---

## What it does not do

This is the part most tools leave out.

**interlocking makes it hard to slide from planning into implementing by accident,
and makes every deliberate bypass loud and recorded. It is not a sandbox.** A model
that decides to route around the gate can. The design goal is that you find out.

| Vector | v0.1 |
|---|---|
| `Edit` / `Write` / `MultiEdit` / `NotebookEdit` | ✅ blocked |
| Redirects `> f`, `>> f`, `tee`, heredocs, fd prefixes | ✅ |
| In-place editors `sed -i`, `perl -i` | ✅ |
| Patch appliers `git apply`, `patch`, `git checkout -- `, `git stash pop`, `git reset --hard` | ✅ denied while gated |
| Inline interpreters `python -c`, `node -e`, `ruby -e`, `php -r` | ✅ denied while gated |
| Scaffolders `npm init`, `npx create-*`, `cargo new`, `go mod init` | ✅ denied while gated |
| `cp` / `mv` / `install` / `ln` into a source path | ✅ |
| Nested `claude -p` | ✅ denied while gated |
| Tool calls **inside subagents** | ✅ hooks fire there too |
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
| **Model — same model as the implementer** | ❌ |

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

The approval store lives **outside** the repo (`~/.interlocking/`, or
`CLAUDE_PLUGIN_DATA`). That is the point: a gate recorded in a file the model can
write is not a gate.

---

## Docs

- [Korean README](README.ko.md)
- [Security model and reporting](SECURITY.md)
- [Contributing](CONTRIBUTING.md) — start with the bypass corpus
- [Measured platform behaviour](docs/design/platform-facts.md) — what was verified against the real binary, and what was not
- [Design notes (Korean)](docs/design/concept.ko.md)

MIT. Requires Node 18+ and Claude Code.
