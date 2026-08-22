# CRITERIA — <NNN>-<slug>

<!--
  WRITTEN BY il-criteria, NOT by the session that wrote the SPEC and not by the
  one that will write the code. A hook enforces that: no other agent can write
  this file, and this agent can write nothing else.

  That separation is the point. A spec whose author also writes its acceptance
  criteria is graded against a yardstick the graded party chose — and when a
  round fails, the cheapest way to turn FAIL into PASS is to shorten the ruler.
  The G0 approval binds to this file's hash as well as the SPEC's, so moving the
  yardstick after approval closes the gate exactly like rewriting a requirement.

  A human editing this file by hand is fine and always was — the hook sees agent
  tool calls, not editors. But the edit costs a re-approval, which is correct.
-->

<!-- il:normative:begin -->

<!--
  One entry per REQ in SPEC.md. Every REQ needs one, including the ones you could
  not work out how to judge — say so in the entry rather than leaving it out.

    Judged:  the observable fact that settles it. A status code, a number with a
             unit, a file's contents, the state of something after an action.
             Not "the cache is checked first" (that is a mechanism) but "a second
             run with the network unplugged returns the same document".

    Method:  how a verifier gets that fact — a command to run, or a file:line to
             point at. Check it exists before you write it down.

  Korean is fine: `판정:` and `방법:` are read the same way.

  The test of a criterion: picture the implementation that satisfies the
  requirement's wording while doing nothing useful. If your criterion would pass
  it, it is a formality, not a criterion.
-->

REQ-001
  Judged: <what would prove it, with numbers and units>
  Method: <the command to run, or the file:line to point at>

REQ-002
  Judged: <...>
  Method: <...>

<!--
  When a requirement genuinely cannot be judged by reading and running — it needs
  hardware, a real user, a load test — say exactly that:

    REQ-007
      Judged: the enclosure survives 48 h at 85°C without the seal deforming.
      Method: cannot be judged by reading or running — needs a thermal chamber.
              INCONCLUSIVE until the spec says who runs it and what evidence
              comes back.

  That is a correct entry. Quietly substituting something checkable ("the
  datasheet says 105°C") measures a different claim and reports PASS for it.
-->

<!-- il:normative:end -->
