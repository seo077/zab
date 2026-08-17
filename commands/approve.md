---
description: Approve a gate for the current feature. Recorded by the il hook, never by the model.
argument-hint: "G0"
disable-model-invocation: true
allowed-tools: []
---

The human typed `/il:approve $ARGUMENTS`. The il `UserPromptSubmit` hook has already
handled it and written (or refused) the approval record.

You have no role here. Do not write `STATE.md`, do not create files, and do not claim
that a gate is approved. Reply with at most one line acknowledging what the hook reported.
