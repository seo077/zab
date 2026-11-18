---
description: Before verifying — can the programs the acceptance criteria name actually run here?
allowed-tools: Bash(node:*)
---

## Verification preflight

!`node "${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs" preflight`

---

Relay the report above. It answers one narrow question — can the programs the
criteria name be launched on this machine — and deliberately not whether they
pass. A deeper check would start failing for reasons that are nobody's business
here, and a preflight that cries wolf is one people learn to skip.

Run it before `/il:verify`, every time. Twice on one real run a fresh verifier
read every requirement, ran nothing, and returned nothing but INCONCLUSIVE: once
because `policy.verify.commands` was empty, once because a criterion named a
program that lived in the repository rather than on PATH. Both were answerable
here in two seconds, before an agent was spawned.

If it reports problems, fix them **before** delegating:

- **A missing program is not a product defect.** Never open a product task for it.
- **`verify.commands` empty** means the verifier has no declared execution commands.
  Put the project's own test command in `.interlocking/policy.json`.
- **A criterion naming the wrong path** is repaired by amending `CRITERIA.md`,
  which closes the gate. That is the expensive one, and it is exactly why this
  runs before the round rather than after it. `/il:delta` scopes the amendment to
  the requirements it touches.

A clean preflight is not a prediction that verification will pass. Say so if
anyone reads it that way.
