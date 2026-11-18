---
description: Judge the implemented requirements with a verifier that never saw the implementation.
argument-hint: "[<from>..<to>]"
allowed-tools: Bash(node:*)
---

## Current state

!`node "${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs" status`

## Can this round run at all?

!`node "${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs" preflight`

---

If the preflight reports problems, fix them **before** step 2. A missing program
or an empty `verify.commands` produces a BLOCKED round that says nothing
about the code, and it costs a fresh agent reading every requirement to find out.

Verify the current feature. Use the `il-verify` skill and follow it.

Range: **$ARGUMENTS** if given, otherwise `last_verified_commit`..`HEAD` from
`STATE.md`.

1. Identify REQs actually affected by the range; include unchanged REQs only when
   the diff crosses a shared invariant they depend on.
2. Build the packet with `il.mjs verify-packet <range> <affected REQ ids...>` — do
   not write one yourself.
3. Delegate to the named subagent with the packet as its whole prompt. Add nothing.
4. Take back three lines.
5. On product FAIL: append new tasks, set the originals to `blocked`, update
   `STATE.md`. On BLOCKED — the environment, not the product — record it and stop
   after the bounded diagnostic path in the skill; do not manufacture a product
   requirement. On INCONCLUSIVE the criteria have to change, which is an amendment
   and a re-approval, not a retry.

Report the verdict and the failing REQ ids. If the verdict is FAIL, do not start
fixing it in the same breath — say what failed and let the human decide whether to
continue.
