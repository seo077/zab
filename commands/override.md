---
description: Bypass the spec gate for a short, recorded window. Also the fast lane for typo-sized work.
argument-hint: "<reason>"
disable-model-invocation: true
allowed-tools: []
---

The human typed `/il:override $ARGUMENTS`. The il `UserPromptSubmit` hook has already
granted or refused the lease and told them which.

You have no role in granting it. Do not write to the approval store, do not claim the
gate is open, and do not treat this as G0 approval — **the spec is still unapproved**.

If the hook reported a lease, do exactly one thing: append a single line to the
active feature's `STATE.md` history recording that an override was used and why.

Reply in at most one line.
