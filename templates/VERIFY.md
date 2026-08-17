# VERIFY — <NNN>-<slug> @ <commit>

<!--
  Written BY THE VERIFIER, not by the session that implemented the work. That
  separation is the whole value: a generator grading its own output is not
  verification (NASA IV&V; DO-178C calls it "with independence").
-->

## Independence evidence

<!-- DO-178C asks for the separation to be documented, not just performed. -->

- verifier: il-verifier / subagent / model=<model>
- context: fresh — implementation conversation not read
- rights: read + execute; no write except this file
- input: SPEC.md#REQ-001..NNN + git diff <from>..<to>
- ran: <command> → <result>

## Verdict

| REQ | Result | Evidence |
|---|---|---|
| REQ-001 | PASS | src/auth/session.ts:42; `npm test -- session` passed |
| REQ-002 | FAIL | criterion says 30 min TTL, code sets 3600s (session.ts:51) |
| REQ-003 | INCONCLUSIVE | no test exercises concurrent login |

VERDICT: <PASS | FAIL> (<n> pass, <n> fail, <n> inconclusive)

<!--
  INCONCLUSIVE is a first-class result, not a soft fail. Forcing every REQ into
  PASS/FAIL pushes a verifier toward passing whatever it cannot check, which is
  the exact failure this document exists to prevent. INCONCLUSIVE means: this
  needs a different kind of evidence (hardware, a real user, a load test) and
  the spec should say how.
-->

## Notes

≤10 lines. Anything longer belongs in a new task, not here.
