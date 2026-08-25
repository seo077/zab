# SPEC — <NNN>-<slug>

<!--
  Everything ABOVE the normative markers is free to edit without re-approval:
  background, research, links, notes. Everything BETWEEN them is what the G0
  approval binds to — change a REQ and the gate closes again.

  Keep prose in whatever language you work in. Keep IDs and keys in English:
  REQ-001, ASM-001 — the hook parses those.

  You do not write the acceptance criteria. They live in CRITERIA.md, written by
  il-criteria, which did not sit in the interview and will not write the code.
  The gate binds to both files.
-->

## Background

What is this, and what did we find out before writing any of it down?

## Research

Cite sources with the date you read them. "Everyone knows" is not a source.

- [finding] — <url> (read YYYY-MM-DD)

## Decisions

<!--
  What the interview settled, one entry per question that had a real fork in it.
  This is the part of the spec the human actually owns, so it is the first thing
  the design brief shows them (`/il:design`).

  Record the answer in THEIR words, not your paraphrase of it, and name the REQs
  it produced. Three months from now "why is it done this way" is answerable from
  here or it is not answerable at all.

  Outside the normative markers on purpose: adding the record of a decision must
  never cost a re-approval.
-->

DEC-001 <what was settled, in one line>
  Asked: <the question you put to them>
  Answer: <what they said>
  Lands in: REQ-###, REQ-###

## Size

`trivial` | `small` | `feature` | `epic`

A feature is *one verification's worth of work*: if a verifier cannot judge
"are these REQs met?" in a day, it is too big. Rough bounds: 3–10 REQs,
5–15 tasks, 1–2 weeks. An epic gets decomposed first — see CONTEXT.md's roadmap.

`trivial` and eligible low-risk `small` work should not have a SPEC at all; they
use the recorded override fast path. If this template is being filled in, either
the work is a `feature`/`epic` slice or a documented risk trigger made the full
path necessary.

<!-- il:normative:begin -->

## Requirements

<!--
  One requirement per REQ: what the system does, in one sentence. Continuation
  lines add detail.

  Do NOT write the criterion here. il-criteria writes one per REQ into
  CRITERIA.md, and G0 refuses any REQ that has no entry there. The separation is
  the point — a requirement graded against a yardstick its own author chose is
  graded by the party being measured, and the cheapest way out of a failing round
  is to shorten the ruler.

  What you owe the criteria agent is a requirement precise enough to be judged.
  It cannot fix an unclear one — it can only record that it is unjudgeable, which
  a human then reads on the approval screen.

  Optional domain tag routes verification: REQ-007 [circuit] ...
-->

REQ-001 <what the system does, in one sentence>

REQ-002 <...>

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
