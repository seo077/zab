# REVIEW — <NNN>-<slug>

<!--
  WRITTEN BY il-spec-critic, which read SPEC.md and CRITERIA.md cold — it did not
  attend the interview and it cannot write either document it is judging. Nobody
  else can write this file; a hook refuses it.

  This is Gate 1. A `VERDICT: NOT YET` here refuses `/il:approve`. A human can
  overrule it with `/il:approve despite-review`, and the approval record keeps
  the fact that they did.
-->

## Independence evidence

- critic: il-spec-critic / subagent / fresh context, interview not read
- reviewed: spec <spec8> criteria <criteria8>
- rights: read + execute; no write except this file

<!--
  The `reviewed:` line is read by a hook, not by a person. Both hashes come from
  the prompt that invoked the critic and are copied verbatim.

  They bind the verdict to the exact pair of documents it was formed against. If
  SPEC.md or CRITERIA.md changes afterwards, this review stops clearing the gate
  — which is right, because it ruled on something else. The commonest way that
  happens is entirely innocent: the critic ran, a REQ got fixed, and a stale
  READY was still sitting here looking valid.
-->

## Findings

<!--
  At most six, worst first. Quote the text being objected to — a finding without
  it cannot be checked. Silence about a requirement means it was fine.
-->

REQ-###  <one line: what is wrong>
  why it matters   <what ships broken, or what a verifier cannot decide>
  what would fix it <the smallest concrete change>

## Blockers

<!--
  What `NOT YET` rests on: approving this would mean approving something that
  cannot be verified. Everything else belongs above and does not stop the gate.
  Leave this section empty for READY.
-->

REQ-###  <why a human should not approve this yet>

VERDICT: NOT YET

<!--
  `VERDICT: READY` or `VERDICT: NOT YET`, alone on its own line. Prose that merely
  contains the word is not a verdict and is not read as one.
-->
