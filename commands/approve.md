---
description: Approve a gate for the current feature. Recorded by the il hook, never by the model.
argument-hint: "G0"
disable-model-invocation: true
allowed-tools: Edit(.interlocking/**), Read
---

The human typed `/il:approve $ARGUMENTS`. The il `UserPromptSubmit` hook has already
handled it and written (or refused) the approval record.

You did not grant this and cannot. Do not claim a gate is approved on your own account —
report only what the hook said.

If the hook reported an approval, do exactly one thing: mirror it into the active
feature's `STATE.md` — `gates_passed`, `spec_sha256`, one history line. That file is
advisory; the gate reads a signed record outside the repo. Keeping it accurate is what
makes `/il:status` readable and what makes a later mismatch meaningful.

Nothing else. Reply in at most one line.
