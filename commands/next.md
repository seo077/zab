---
description: Run the next ready task in a fresh subagent, commit it, and update the resume anchor.
allowed-tools: Bash(node:*)
---

## Current state

!`node "${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs" status`

---

Run the next task. Use the `il-execute` skill and follow it.

Refuse to start if the gate is CLOSED — the spec is not approved, so there is
nothing legitimate to implement yet. Say so and point at `/il:approve`.

Short version of the loop:

1. Pick the first `todo` task whose `depends` are all `done`.
2. Build the delegation packet: role, the applicable conventions, the task, the
   REQs it covers in full, **and the `produces` of every task it depends on**.
3. Delegate to a fresh subagent. Do not implement it in this session.
4. Take back at most three lines.
5. Commit — one task, one commit, tagged with the task and REQ ids.
6. Update `STATE.md`: `next_action`, one history line, refreshed resume brief.

Stop after one task and report in a few lines, unless the human asked for more.
