---
description: Pick up an interrupted feature — read the resume anchor and settle any uncommitted work with the human first.
allowed-tools: Bash(node:*)
---

## Current state

!`node "${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs" status`

---

Resume the feature above.

1. **Read `STATE.md` for the active feature.** It is the source of truth for where things
   stand. Do not reconstruct progress by reading source files.

2. **If there is uncommitted work, ask the human before touching anything.** Offer exactly
   three options and wait:
   - (a) finish this work
   - (b) discard it and restart the task
   - (c) show me the diff first

   Never decide this yourself. Auto-discarding loses work; auto-continuing builds on a state
   nobody has looked at.

3. **If HEAD moved since `STATE.md` was written**, ask whether work landed elsewhere before
   continuing.

4. Then read only what `next_action` points at — the named task and the REQ it covers. Not
   the whole spec.

State the next action in one line and wait for the human unless it is unambiguous.
