---
description: Accept the current .interlocking/policy.json as the trusted baseline.
disable-model-invocation: true
allowed-tools: []
---

The human typed `/il:policy`. The il hook has re-blessed `.interlocking/policy.json`
as the baseline it compares against.

Why this command exists: `policy.json` lives under `.interlocking/`, which is always
writable — otherwise the harness could not manage its own files. That makes the policy
itself a way to unlock the gate, so a **widened** policy is ignored until a human
blesses it here. A **narrowed** policy needs no blessing and takes effect immediately.

You have no role in this. Reply in at most one line.
