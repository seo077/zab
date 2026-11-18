---
description: After amending an approved spec — what actually moved, and what carries forward from the last approval.
allowed-tools: Bash(node:*)
---

## What moved

!`node "${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs" delta`

---

Relay the report above. It compares the current `SPEC.md` and `CRITERIA.md`
against the **signed approval record** — not against anything in the repo — so it
answers "how much of this did the human already approve?" with hashes rather than
with anyone's recollection.

Editing either document closes G0, and that does not change. What this scopes is
how much work the two agents redo before the human is asked again. On a real run,
a two-line amendment to how one requirement is verified sent all seventeen through
`il-criteria` and the critic, four times over.

If it reports a scope, the next two steps are:

```
node "${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs" criteria-packet --delta
node "${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs" review-packet --delta
```

`il-spec` §10 has the full procedure, including when **not** to scope: an
amendment that changes a shared assumption, a threat, a vocabulary or a data model
can change what an untouched requirement means, and there the full re-derivation
is the honest one. When you are unsure, that uncertainty is the answer.

If it refuses to scope — no prior approval, a record that predates
per-requirement hashes, a failed signature — report that plainly and use the full
path. A reuse claim the store cannot substantiate is not a saving.
