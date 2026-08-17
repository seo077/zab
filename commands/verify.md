---
description: Judge the implemented requirements with a verifier that never saw the implementation.
argument-hint: "[<from>..<to>]"
allowed-tools: Bash(node:*)
---

## Current state

!`node "${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs" status`

---

Verify the current feature. Use the `il-verify` skill and follow it.

Range: **$ARGUMENTS** if given, otherwise `last_verified_commit`..`HEAD` from
`STATE.md`.

1. Build the packet with `il.mjs verify-packet <range>` — do not write one yourself.
2. Delegate to the named subagent with the packet as its whole prompt. Add nothing.
3. Take back three lines.
4. On FAIL: append new tasks, set the originals to `blocked`, update `STATE.md`.

Report the verdict and the failing REQ ids. If the verdict is FAIL, do not start
fixing it in the same breath — say what failed and let the human decide whether to
continue.
