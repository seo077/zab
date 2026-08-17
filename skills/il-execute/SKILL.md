---
name: il-execute
description: Run the implementation loop for an approved interlocking feature — one task per subagent, one task per commit, STATE.md updated after each. Use after G0 is approved, or when the user runs /il:next.
---

# Running tasks without poisoning the session

G0 is approved, so code is unlocked. Your job now is **orchestration, not typing**.
The main session stays clean so that it can still reason about the whole feature
after fifteen tasks; the implementing happens in fresh contexts that are thrown
away.

---

## Turning PLAN into TASKS

Each task must be:

- **atomic** — one commit's worth
- **assigned** — `covers:` names at least one REQ. A task covering no requirement
  is a task nobody asked for.
- **contracted** — `produces:` gives paths *and function signatures*
- **checkable** — `verify:` gives a command

`produces` is the one that gets skipped and the one that costs most. It is the
only thing a later task's subagent learns about this one. Without it, the agent
building T-005 does not know what `createSession()` looks like, so it invents
something plausible and wrong, and you find out two tasks later (D-013).

`TASKS.md` is **append-only**. Never rewrite a task.

---

## The loop

For each `todo` task whose dependencies are `done`:

**1 · Build the delegation packet.** It must be self-sufficient — the subagent
sees nothing else:

```
① role + definition of done
② the CONTEXT.md conventions that actually apply (not the whole file)
③ the task entry verbatim
④ the REQs it covers, with acceptance criteria in full
⑤ the `produces` of every task it depends on   ← the one people forget
```

**2 · Delegate it.** A fresh subagent per task. Do not implement it yourself in the
main session — that is what fills the context you are trying to protect.

**3 · Take back three lines.** Verdict, files touched, one caveat. Nothing more.
If you let a subagent return its full reasoning, the main session is polluted
after eight tasks anyway and the whole arrangement was pointless (D-014). Detail
belongs in the commit and in `VERIFY.md`.

**4 · Commit.** One task, one commit, referencing the task and REQ:

```
feat(auth): session cookie issuance  [T-012, REQ-007]
```

A session can die at any moment. Commits are the only restore points that survive.

**5 · Update `STATE.md` before moving on.** Set `next_action` to the *next* task,
append one history line, refresh the resume brief. This is what makes the next
session start in thirty seconds instead of reconstructing progress from source.

---

## When a task fails

Retry **at most twice**. Then stop and escalate — an agent looping on a failing
task damages the codebase and burns the user's budget.

On escalation: set the task `blocked`, write what you tried and what you observed
into `STATE.md`, and ask the human. Do not silently change the approach: a task
that "worked" by quietly abandoning its REQ is worse than one that failed.

## When the spec turns out to be wrong

It will happen — implementation teaches you things the interview could not.

**Do not edit the spec quietly.** Editing a REQ invalidates G0 and the gate closes
again, which is correct behaviour, not an obstacle. Tell the human what you learned,
propose the amendment, and let them re-approve.

## What not to do

- Do not mark a task `done` before its `verify` command passes.
- Do not fix a verification failure by rewriting the original task. Append a new
  task and set the original to `blocked`, so the history still answers "why is it
  like this?" (D-016).
- Do not batch several tasks into one commit to "save time". You are trading a
  restore point for nothing.
