# Security

## What this is not

**interlocking is not a security boundary.** It enforces a *process*: it makes it
hard to slide from planning into implementing by accident, and it makes deliberate
bypasses loud and recorded. It does not sandbox anything.

A model that decides to route around the gate can — see the honest bypass table in
the [README](README.md#what-it-does-not-do) and the corpus at
`test/fixtures/bash-writes.txt`. The design goal is that you find out, not that it
cannot happen.

It also does not verify that your code is correct, secure, or fit for purpose. A
`PASS` in `VERIFY.md` means one agent judged one requirement against one criterion.

## The threat model it *does* address

**Threat:** an agent, trying to be helpful, decides this particular case does not
need the spec, and unblocks itself.

**Mitigation:** approval state lives outside the repository in a signed record that
only a hook writes, and that hook only fires on a `UserPromptSubmit` event carrying
the human's literal keystrokes. A model writes its own replies; it cannot type into
the input box. Concretely:

- `gates_passed` in `STATE.md` is a mirror for humans. The hook never reads it, and
  a mismatch prints a tamper warning at every session start.
- `policy.json` is inside `.interlocking/` and therefore always writable, so a
  widened policy has no effect until a human runs `/il:policy`. Narrowing is free.
- A record whose HMAC does not verify fails **closed**. It is the one case that
  does — a bad signature is tampering, not a bug.

**Known limit:** the HMAC key sits on the same disk, and Bash can read it. Its job
is to turn forgery from "edit one plausible-looking line" into a deliberate,
named, multi-step act that lands in the audit log. Those are different
probabilities, not different possibilities.

**Headless mode:** with `claude -p`, "the human" is whoever controls stdin. G0 is
then an assertion about your pipeline, not about a person.

## `.interlocking/` is a prompt-injection surface

Everything under `.interlocking/` is read at the start of every session, and
`CONTEXT.md` is injected into the model's context directly.

**A pull request that edits `.interlocking/**` should be reviewed exactly as
carefully as one that edits source.** A single poisoned line in `CONTEXT.md`
influences every future session in that repository, including sessions run by
people who never read the diff.

The skills instruct the agent that documents are data and never instructions, but
treat that as defence in depth, not as a control.

## What the harness reads and writes

| | |
|---|---|
| Reads | your project's `.interlocking/**`, `SPEC.md`, `STATE.md`, `policy.json`, and `git status` / `rev-parse` |
| Writes | signed approval records, override leases, an audit log and a crash log under `IL_HOME` (default `~/.interlocking/`) |
| Sends | **nothing.** No telemetry, no network calls. |

The verifier subagent can read and execute but is refused every write except one
path, by a hook keyed on `agent_type` — which its own configuration cannot change.

## Reporting a vulnerability

For a bypass of the *gate*, the fastest useful thing is a pull request adding a
line to `test/fixtures/bash-writes.txt`. That is a public file and public
discussion is fine: the README already states that the gate is not a boundary.

For anything that leaks data, executes unintended code, or compromises a machine
running the plugin, please report privately via GitHub's **Report a vulnerability**
on the Security tab rather than opening an issue. Include the Claude Code version
(`/il:doctor` prints it), your OS, and a reproduction.

Expect an acknowledgement within a week.

## Supported versions

v0.1 is pre-1.0: fixes land on `main` and in the next release only. Hook behaviour
differs between Claude Code versions — `/il:doctor` reports what your installation
can actually enforce, and the harness drops from enforcing to advisory rather than
pretending a guarantee it cannot deliver.
