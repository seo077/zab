---
description: Show the design — what the interview settled, the criterion a separate agent set for each requirement, and the assumptions you would be approving.
allowed-tools: Bash(node:*)
---

## The design

!`node "${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs" brief`

---

The block above is rendered from `SPEC.md` and `CRITERIA.md` by the hook, not
written by a model, so it cannot drift from the documents the approval binds to.
**Show it to the human as it is.** Do not summarise it, do not shorten it, do not
reorder it — a summary of the summary is how the thing nobody read gets approved
anyway.

The requirement and the `judged` line under it were written by two different
agents, and reading them as a pair is the whole exercise: the question is not "is
this a good requirement" but **"would that test actually settle it?"**

Add nothing except, at most, one line after it:

- if `/il:approve` has not happened yet: what the next action is
- if a `✗` line appears: that the gate will refuse this until it is fixed
- if it says there is no `CRITERIA.md` yet: that `il-criteria` has not run, and
  the gate will refuse until it has
- if the brief says there are no `DEC-###` entries and an interview did happen:
  that the decisions were never written down, and offer to record them now

Do not treat questions about the design as approval. Only the human's literal
`/il:approve` keystrokes open the gate.
