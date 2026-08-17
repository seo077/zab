---
description: Bring an existing repository under interlocking — write CONTEXT.md and tune policy.json without gating work already done.
---

## Current state

!`node "${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs" status`

---

Set this repository up for interlocking. `/il:new` starts a *feature*; this sets up
the *harness*.

**Existing code is not gated.** The gate applies from the next `/il:new` onward.
Onboarding a repo must never turn into "you may not touch your own project" —
that is the fastest way for someone to uninstall this.

1. **Read the repository first.** Languages, layout, build and test commands,
   conventions that are followed in practice rather than documented.

2. **Create `.interlocking/`** from the plugin's `templates/`: `CONTEXT.md`,
   `policy.json`, and an empty `work/`. Do not create a feature.

3. **Fill `CONTEXT.md` from evidence**, not assumption:
   - stack and constraints you can point at
   - a glossary of domain words that mean something specific here
   - principles only where you can cite the code that shows them. The principles
     section is injected into every session and has a 40-line budget — a guess
     that lands there is a guess you pay for forever.

4. **Tune `policy.json` to the real layout.** Propose `code` globs that match this
   repo (`src/**`? `app/**`? `packages/*/src/**`?) and set `verify.commands` to the
   test command that actually works here. Show the human the list and let them
   correct it — over-gating is what makes the harness feel hostile.

5. **Commit `.interlocking/`.** It is meant to be in version control: that is what
   lets work resume on another machine.

6. Tell them what changed, and that nothing is gated until `/il:new`.

Note for step 4: widening `always_allow` later has no effect until a human runs
`/il:policy`. Narrowing takes effect immediately. Say so, so the setting is not
mistaken for broken.
