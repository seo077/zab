# SPEC — <NNN>-<slug>

<!--
  Everything ABOVE the normative markers is free to edit without re-approval:
  background, research, links, notes. Everything BETWEEN them is what the G0
  approval binds to — change a REQ and the gate closes again.

  Keep prose in whatever language you work in. Keep IDs and keys in English:
  REQ-001, ASM-001, "Acceptance:" — the hook parses those.
-->

## Background

What is this, and what did we find out before writing any of it down?

## Research

Cite sources with the date you read them. "Everyone knows" is not a source.

- [finding] — <url> (read YYYY-MM-DD)

## Size

`trivial` | `small` | `feature` | `epic`

A feature is *one verification's worth of work*: if a verifier cannot judge
"are these REQs met?" in a day, it is too big. Rough bounds: 3–10 REQs,
5–15 tasks, 1–2 weeks. An epic gets decomposed first — see CONTEXT.md's roadmap.

<!-- il:normative:begin -->

## Requirements

<!--
  One requirement per REQ. Each needs an "Acceptance:" line or G0 will refuse.
  Acceptance must be something a separate agent can RUN or POINT AT — a command,
  a status code, a number with a unit, a file:line. "Works correctly" is not one.

  Optional domain tag routes verification: REQ-007 [circuit] ...
-->

REQ-001 <what the system does, in one sentence>
  Acceptance: <the command to run, or the observable fact, with numbers and units>

REQ-002 <...>
  Acceptance: <...>

## Threat model

<!--
  This comes BEFORE approval, not after (D-012): mitigations turn into
  requirements, and adding a REQ after approval would invalidate the approval.
  For each asset worth protecting, name the threat and the mitigation, and feed
  the mitigation back in as a REQ above.
-->

| Asset | Threat | Mitigation | Becomes |
|---|---|---|---|
| <what an attacker wants> | <how they get it> | <what stops them> | REQ-### |

Out of scope, and why: <threats deliberately not handled — record them as ASM below>

## Assumptions

<!--
  Anything you could not confirm. Distinguish two cases explicitly — they carry
  different responsibility when something goes wrong later:
    (user: explicitly agreed)     they were asked and said yes
    (user: declined to answer)    they were asked and deferred to you
  The second one is surfaced on the approval screen every time.
-->

ASM-001 <the assumption> (user: explicitly agreed | declined to answer)
  Affects: REQ-###

<!-- il:normative:end -->

## Out of scope

What this feature deliberately does not do. Being explicit here is what stops it
being rediscovered as a "missing requirement" three sessions later.
