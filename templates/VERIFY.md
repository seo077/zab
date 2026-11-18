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
| REQ-004 | BLOCKED | `npm run e2e` -> ERR_NETWORK_ACCESS_DENIED; the criterion needs the deployed site |

VERDICT: <PASS | FAIL> (<n> pass, <n> fail, <n> blocked, <n> inconclusive)

<!--
  Neither BLOCKED nor INCONCLUSIVE is a soft fail. Forcing every REQ into
  PASS/FAIL pushes a verifier toward passing whatever it cannot check, which is
  the exact failure this document exists to prevent.

  They are separated because they are repaired by different people:

    BLOCKED       the criterion is runnable, but not from here - denied network,
                  missing program, absent device. Nothing about the product is in
                  question. Fix the environment (`il preflight` names most of
                  these before the round starts) and re-run. Do NOT open a product
                  task for it, and do not amend the criterion to route around it
                  without saying so.
    INCONCLUSIVE  no obstacle - the evidence the criterion asks for does not
                  exist. Somebody has to write a test, take a measurement, or
                  watch a screen. That is a change to CRITERIA.md, which re-opens
                  the gate.

  On the run that produced this distinction, a verifier with a denied network
  reported INCONCLUSIVE, and the loop responded by opening product tasks against
  code that was already correct.
-->

## Notes

≤10 lines. Anything longer belongs in a new task, not here.
