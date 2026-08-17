---
name: il-verify
description: Run independent acceptance verification for an interlocking feature — build the packet from the SPEC, delegate to a verifier subagent that never saw the implementation, and record failures as new tasks. Use after implementing tasks, or when the user runs /il:verify.
---

# Verifying work you did yourself

The point of this step is that **you do not do it**. A generator grading its own
output is not verification, whatever it concludes. Your job is to hand the problem
to something that has not been told what was built, and then to record what comes
back without softening it.

---

## 1 · Build the packet

Do not write it yourself. Run:

```
!`node "${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs" verify-packet <from>..<to>`
```

The range runs from `last_verified_commit` in `STATE.md` to `HEAD`.

The packet is assembled from `SPEC.md` and written to a file. That matters: the
acceptance criteria arrive **verbatim**, not as your paraphrase of them, and the
packet has no free-text field for you to explain the implementation through. If
you could narrate, the verifier would inherit your framing and the whole
arrangement would be theatre.

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
  acceptance criterion is wrong — fix that, visibly.
- Do not write `VERIFY.md` yourself. If the verifier could not, that is a finding.
- Do not mark a feature done while any REQ is unjudged.
