---
description: Start a new feature — sizing, research, interview, threat model, spec, then ask a human to approve it.
argument-hint: "<what you want to build>"
allowed-tools: Bash(node:*)
---

## Current state

!`node "${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs" status`

---

Start a new interlocking feature for: **$ARGUMENTS**

Use the `il-spec` skill and follow it. In outline:

1. If `.interlocking/` does not exist yet, create it from the plugin's `templates/`:
   `policy.json`, `CONTEXT.md`, and a `work/` directory.
2. Pick the next feature number, create `work/<NNN>-<slug>/`, and write the feature
   name into `.interlocking/current`. **This closes the code gate** — that is
   intended, and it is why the spec comes first.
3. Size it. Trivial work does not belong here: tell the human to use
   `/il:override <reason>` instead. An epic gets decomposed before anything else.
4. Research, interview, threat model, `SPEC.md`, `STATE.md`.
5. Run the checker, present a ~20-line approval screen, and stop.

Do not write source code, and do not approve anything. Only a human's keystrokes
can open the gate; nothing you write can.

If a feature is already active, say so and ask whether to finish it, archive it, or
start alongside it — do not silently overwrite `.interlocking/current`.
