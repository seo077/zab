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

1. Size the requested change before creating an active feature. Trivial and
   eligible low-risk small work uses the recorded override fast path in `il-spec`;
   do not create `work/`, change `.interlocking/current`, or launch judgement
   agents for it.
2. If the full feature path is needed and `.interlocking/` does not exist yet, create it from the plugin's `templates/`:
   `policy.json`, `CONTEXT.md`, and a `work/` directory.
3. Pick the next feature number, create `work/<NNN>-<slug>/`, and write the feature
   name into `.interlocking/current`. **This closes the code gate** — that is
   intended, and it is why the spec comes first.
4. Research, interview, threat model, `SPEC.md`, `STATE.md`. Write each interview
   answer down as a `DEC-###` as you get it. **Do not write acceptance criteria** —
   they are not yours to write.
5. Build the criteria packet (`il.mjs criteria-packet`) and hand it to `il-criteria`,
   which writes `CRITERIA.md`. You cannot write that file; a hook refuses it.
6. Show the design brief (`il.mjs brief`) whole — that is the screen they judge by,
   and it pairs each REQ with the criterion a different agent set for it.
7. Build the review packet (`il.mjs review-packet`) and hand it to `il-spec-critic`,
   which reads both documents cold and writes `REVIEW.md`. A `NOT YET` there
   refuses the approval until a human overrules it.
8. Run the checker, present a ~20-line approval screen, and stop.

Do not write source code, and do not approve anything. Only a human's keystrokes
can open the gate; nothing you write can. You write `SPEC.md`; the criteria and
the verdict on them belong to agents you cannot speak for.

If a feature is already active, say so and ask whether to finish it, archive it, or
start alongside it — do not silently overwrite `.interlocking/current`.
