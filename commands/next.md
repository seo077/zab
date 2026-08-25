---
description: Run the next ready task in a fresh subagent, commit it, and update the resume anchor.
allowed-tools: Bash(node:*)
---

## Current state

!`node "${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs" status`

---

Run the next task. Use the `il-execute` skill and follow it.

This command is for an approved feature. Do not create a one-task feature to run
localized low-risk work that belongs on the recorded override fast path.

**Refuse to start if the gate is CLOSED.** The spec is not approved, so there is
nothing legitimate to implement yet. Say so and point at `/il:approve`.

**If `TASKS.md` does not exist yet, build it first.** This is the normal state right
after approval — `/il:new` stops at the gate and does not plan past it, because a
plan written before approval is a plan for a spec that might still change.

1. Write `PLAN.md`: the architecture, the sequence, and *why* each technical choice.
2. Derive `TASKS.md` from the approved REQs, using the plugin's template. Every task
   needs `covers`, `produces` (paths **and** signatures) and `verify`. A task
   covering no REQ is a task nobody asked for.
3. Show the human the task list in a few lines and let them correct it before you
   spend a subagent on task one. This is cheap now and expensive later.
4. Commit the plan and tasks as one checkpoint, together with any uncommitted spec
   work — that is the boundary a dead session restores to.

Then the loop, one task only:

1. Pick the first `todo` task whose `depends` are all `done`.
2. Build the delegation packet: role, the applicable conventions, the task, the REQs
   it covers in full, **and the `produces` of every task it depends on**.
3. Delegate to a fresh subagent. Do not implement it in this session.
4. Take back at most three lines.
5. Commit — one task, one commit, tagged with the task and REQ ids.
6. Update `STATE.md`: `next_action`, one history line, refreshed resume brief.

Stop after one task and report in a few lines, unless the human asked for more.
