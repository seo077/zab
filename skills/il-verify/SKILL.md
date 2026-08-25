---
name: il-verify
description: Run independent acceptance verification for an interlocking feature — build the packet from the SPEC, delegate to a verifier subagent that never saw the implementation, and record failures as new tasks. Use after implementing tasks, or when the user runs /il:verify.
---

# Verifying work you did yourself

The point of this step is that **you do not do it**. A generator grading its own
output is not verification, whatever it concludes. Your job is to hand the problem
to something that has not been told what was built, and then to record what comes
back without softening it.

This independent acceptance pass is for approved `feature` work. Eligible
low-risk `small` changes already take the recorded fast path and receive one
targeted check in the implementing session; do not retrospectively expand them
into full acceptance verification.

## Before delegating: bound the pass

Run one independent pass over the REQs affected by the implementation range. Do
not rerun unchanged REQs merely because they exist in the same long-lived SPEC,
unless the diff crosses a shared invariant they depend on. State that dependency
explicitly in the packet when it does.

An unavailable network, browser, device, credential, executable, or sandbox
permission is a verification-environment result, not evidence that the product
requirement or SPEC is wrong. Do not add a product REQ, rewrite acceptance scope,
or reopen the whole design merely to make the verifier environment reproduce the
implementer's environment.

For an environmental INCONCLUSIVE:

1. confirm it once with diagnostics;
2. use an already-approved equivalent offline artifact or command if one exists;
3. otherwise record INCONCLUSIVE and ask the human whether to supply the missing
   environment/evidence or accept the residual uncertainty.

Do not repeatedly rebuild packets or launch fresh agents for the same unavailable
capability. Amend and re-approve the SPEC only when the promised behavior or the
meaning of PASS actually changes, not when a tool path, runner availability, or
evidence transport needs repair.

---

## 1 · Build the packet

Do not write it yourself. Run:

```
!`node "${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs" verify-packet <from>..<to> <affected REQ ids...>`
```

The range runs from `last_verified_commit` in `STATE.md` to `HEAD`.

The packet is assembled from `SPEC.md` and `CRITERIA.md` and written to a file.
That matters twice over.

Each criterion arrives **verbatim**, and it arrives from a file **you did not
write** — `il-criteria` wrote it before any code existed. A verifier that is
independent of the implementation but reads a yardstick the implementer chose is
only half independent, and it is the half that stops mattering the moment a round
fails: the cheapest way to turn FAIL into PASS is to shorten the ruler. You cannot;
a hook refuses the write, and moving it after approval closes the gate anyway.

The packet also has no free-text field for you to explain the implementation
through. If you could narrate, the verifier would inherit your framing and the
whole arrangement would be theatre.

If several packets come back, each names the subagent it belongs to — a REQ tagged
`[circuit]` routes to a circuit verifier when one is configured.

---

## 2 · Delegate

Launch the named subagent with the packet contents as its prompt. **Nothing else.**

Do not add context. Do not mention what was hard, what you already checked, which
tests you know pass, or what you think the answer is. Every one of those is an
attempt — however well meant — to get the verdict you expect.

The verifier can read and run. It cannot write anything except one file, and that
is enforced by a hook rather than by its own configuration, so it holds even if
the agent decides otherwise.

### On Codex

Use `spawn_agent` with `fork_turns="none"` — the packet is the whole prompt, and
`"none"` is what keeps your conversation out of it. Passing anything else hands
the verifier the implementation history and there is no longer anything
independent about the verdict.

Building the packet arms one short-lived, single-use write to `VERIFY.md`.
Codex's `spawn_agent` has no per-agent environment parameter, so none is needed.
If the write fails, rebuild the packet to issue a fresh grant.

**Be straight with the human about what this is worth.** On Claude Code the host
stamps the agent's identity onto every tool call and the model cannot forge it. On
Codex the identity is a label the caller sets, so the rule that only the verifier
writes `VERIFY.md` is a one-use capability convention here, not an identity lock.
`$il-console doctor` says the
same thing. Do not describe the verdict as more independent than it is — the
context isolation is real; the identity is not attested.

---

## 3 · Take back three lines

Verdict, failing REQ ids, one sentence of why. The detail is in `VERIFY.md`, which
the verifier wrote itself and signed with its own independence evidence.

Do not pull the full output back into this session. Doing so pollutes the context
you kept clean by delegating in the first place.

---

## 4 · On FAIL — append, never rewrite

```
T-009  state: blocked      ← the original task goes back, it does not get edited
T-014  covers: REQ-013     ← a NEW task carries the fix
```

Rewriting the original destroys the answer to "why is it like this?" three months
from now (D-016). The history of what failed is the most valuable thing a verified
feature leaves behind.

Then update `STATE.md`: `next_action`, one history line, `last_verified_commit`
only if the verdict was PASS.

## On INCONCLUSIVE

Not a soft fail, and not something to retry until it passes. It means the criterion
cannot be judged by reading and running — it needs hardware, a real user, a load
test. The right response is to **amend the spec with how that REQ will be checked**,
which needs a re-approval, not to quietly downgrade the requirement.

## What not to do

- Do not re-run the verifier hoping for a different answer.
- Do not argue with a FAIL in this session. If it is wrong, the packet or the
  criterion is wrong — and fixing the criterion means re-running `il-criteria` and
  re-approving, visibly. You cannot edit `CRITERIA.md`, which is the point: a
  failing round is exactly when moving the yardstick is most tempting.
- Do not write `VERIFY.md` yourself. If the verifier could not, that is a finding.
- Do not mark a feature done while any REQ is unjudged.
