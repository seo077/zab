# interlocking

A **plugin for Claude Code and Codex** that blocks source edits until a human
approves the spec, resumes a dead session in thirty seconds, and verifies with an
agent that never saw the implementation. Zero dependencies, one hook file, Node 18+.

**Read `README.md` first** — it states plainly what this does not do, and that
framing matters more here than the feature list.

---

## Where things are

| | |
|---|---|
| `hooks/il.mjs` | the whole enforcement layer. One file, sectioned: `paths · bash · patch · hash · fm · smells · criteria · delta · preflight · verify · brief · env · fsx · store · gate · state · git · out · handlers · main` |
| `hooks/hooks.json` | which events call which mode. Read by **both** hosts — see the Windows note below |
| `.claude-plugin/` `.codex-plugin/` | one manifest per host, pointing at the same hooks and skills |
| `.agents/plugins/marketplace.json` | the Codex marketplace entry (`codex plugin marketplace add .`) |
| `commands/*.md` | slash commands. Claude Code only — `approve` `override` `policy` are human-only |
| `skills/il-{spec,execute,verify}/` | the phase procedures — natural language, not testable |
| `skills/il-console/` | the read-only reports, for Codex, which has no plugin slash commands |
| `skills/il-onboard/` | initialize an existing repo on Codex without creating a feature |
| `agents/il-verifier.md` | the independent verifier — writes `VERIFY.md` only |
| `agents/il-criteria.md` | writes the yardstick before any code exists — `CRITERIA.md` only |
| `agents/il-spec-critic.md` | the pre-approval critic — reads the pair cold, writes `REVIEW.md` only |
| `templates/` | what gets written into a user's `.interlocking/` |
| `test/` | 539 tests. `npm test` |
| `docs/design/platform-facts.md` | **measured** platform behaviour, with the version |
| `docs/design/WALKTHROUGH.ko.md` | a real end-to-end run, quoted verbatim |
| `docs/design/concept.ko.md` | the original design doc. Historical — read its header |

Decision numbers in comments (`D-013`, `D-017`, …) are defined in `concept.ko.md`.

**One of them has since been amended.** §5.4 said never to show the human the
document — G0 is a 20-line summary, because a 90-line spec guarantees a
rubber-stamp. True, and it caused the mirror failure: 20 lines is not enough to
judge from, so the human approves blind or goes and reads the raw spec anyway. The
flow is now two screens — `il.mjs brief` to read, the 20-line screen to act on —
plus `il-spec-critic`, which reads the spec having missed the interview. See the
Unreleased section of `CHANGELOG.md`.

---

## Invariants — expensive to relearn, cheap to state

**The hook must never take a session down.** Any unexpected throw logs to
`crash.log` and exits 0. Only 0 and 2 are safe exit codes; anything else shows the
user an error on *every* tool call. Fail open. The one exception: a signature that
does not verify fails closed, because that is tampering rather than a bug.

**Gate state lives outside the repo.** `~/.interlocking/`, signed. `gates_passed`
in `STATE.md` is a mirror the hook never reads — a mismatch is reported as tamper.
The store location must depend on nothing that varies by calling context; that is
why `CLAUDE_PLUGIN_DATA` is deliberately not in the ladder.

**Only a human can open a gate.** Approval is recorded by a `UserPromptSubmit` hook
reading literal keystrokes. Nothing driven by model output may ever write an
approval.

**`.interlocking/**` is always writable**, or the harness cannot manage its own
files. That is why a widened `policy.json` needs `/il:policy` to take effect.

**Except three files, each owned by one agent.** `CRITERIA.md` (`il-criteria`),
`REVIEW.md` (`il-spec-critic`), `VERIFY.md` (`il-verifier`) — every other writer,
main session included, is refused by path in `decideWrites()`. Each is a judgement,
and a judgement is worth exactly what its author's independence is worth. Humans
editing them by hand are unaffected: the hook sees tool calls, not editors.

**The author of a requirement never writes its criterion.** The spec says what the
system does; `CRITERIA.md` says what would prove it, and a different context writes
each. Without this the verifier is independent of the implementation but not of the
standard — and on a failing round, shortening the ruler is the cheapest move
available. The G0 token carries both hashes so the ruler cannot move after approval
either.

**An amendment narrows the work, never the gate.** Editing either document closes
G0 and the approval binds both whole-document hashes — that does not move. What
`il delta` narrows is which requirements the two agents re-derive, and it does so
against the **signed approval record**, never against a file in the repo. That
distinction is the whole design: a reuse claim from the session that would prefer
less work is worth nothing, so the store carries a hash per requirement and the
claim is checked. Carried criteria are not trusted either — altering one is
detected on the next `delta` and re-enters review. Read `§ delta` before changing
any of it.

**Anything signed must be signed all the way down.** `canonical()` is hand-written
because `JSON.stringify`'s replacer argument is an allowlist applied at every
depth: a nested object serialises as `{}` and its contents go unsigned. That was
harmless for as long as every token field was a scalar and became a hole the moment
one held a map. If you add a field, make sure the serialiser actually reaches it.

**Zero runtime dependencies.** The hand-rolled glob and flat-YAML parser are
deliberate; this file runs on every matching tool call.

**Two hosts, one decision path.** Claude Code and Codex send the same hook JSON,
so nothing on the gate path branches on the host. Exactly three things differ, and
all three are in `platform-facts.md` with the measurement:

- Codex's only write tool is `apply_patch`, and the whole patch arrives as a
  string. `parseApplyPatch()` is therefore the entire G0 gate on that host.
- Codex on Windows runs hooks through **PowerShell**, where the `command -v node`
  guard is a syntax error — and Codex **fails open** on a hook that will not start.
  That is why every handler carries `commandWindows`, and why
  `test/hooks-config.test.mjs` exists: the failure is one line of scrollback and
  a gate that silently is not there.
- Codex does not attest `agent_type` and cannot set per-subagent environment
  variables. Building a fixed packet arms a signed, 30-minute, use-budgeted write
  to its judgement file. `/il:doctor` calls this a capability convention rather
  than letting the invariant above read as if it still holds there.

  Two things about that grant are not arbitrary and were both learned the hard
  way. It is a **budget, not a single use**, because replacing a file is a delete
  and then an add, and because `PreToolUse` fires before the tool runs and can
  never learn whether the write succeeded — exactly-once is not available at this
  hook point, and claiming it cost a real run its verdict. And identity goes
  through `canonicalAgent()`, because Codex task names cannot carry a hyphen: an
  unrecognised near-miss name meant *no* restriction, so a task called `verifier`
  could write source that `il-verifier` could not.

`cmd()` picks the spelling for the detected host. It is display text only — a
wrong host can never change a gate decision, which is why detection is allowed
to guess.

---

## How to work here

**Test-first for pure functions** (`classify`, `analyzeBash`, `parseApplyPatch`,
`normalizeText`,
`parseFrontmatter`, `checkRequirements`, `parseCriteria`, `checkCriteria`,
`parseReview`, `composeVerifyPacket`, `composeCriteriaPacket`, `composeReviewPacket`,
`composeDesignBrief`, `composeHelp`, `wrapText`, `requirementDigest`,
`criteriaDigest`, `computeDelta`, `partitionDirty`, `leadingExecutable`,
`verifyExecutables`, `canonicalAgent`, `mirrorAdvice`).
Write the answer table, watch it
fail, then implement. Then break the fix on purpose and confirm the test catches it.

**Never string-assert on prompt text.** Skills and commands are natural language.
Such tests are brittle and catch nothing.

**Measure the platform, do not cite the docs.** They have been wrong here more than
once, and two Claude Code builds disagree with each other. Anything you rely on goes
into `platform-facts.md` with the version you measured on.

**Run the oldest Node before pushing** if you touched anything version-sensitive:
`npm run test:node18`. The suite was green on the dev machine and red on six of nine
CI cells because `node --test` changed what its argument means at 21.

Before pushing: `npm test && claude plugin validate . --strict`

To exercise the Codex side, install from the repo itself and drive a real run:

```
codex plugin marketplace add .
codex plugin add il@interlocking
```

Bump `version` in `.codex-plugin/plugin.json` before re-adding, or the installer
serves the cached copy and you test the previous build. Hooks from a freshly
installed plugin are **untrusted and silently skipped** until you accept the
prompt once in the TUI; `codex exec --dangerously-bypass-hook-trust` is the
non-interactive way past that, and the only reliable signal that you forgot is
that nothing gets blocked.

---

## The thing that keeps biting

Every defect that reached this repo's HEAD was **silent**, and none were wrong
return values — they were failures of integration with the platform:

- a `!` block with no `allowed-tools` makes the entire command do nothing: zero
  turns, empty output, no error
- `CLAUDE_PLUGIN_DATA` is set for hooks but not for `!` blocks, so `/il:status`
  read a different store than the gate used and reported the opposite answer
- `requirementBlocks()` parsed the `[circuit]` tag and then discarded it, so domain
  routing silently sent everything to the default verifier — while both units
  passed their own tests
- Git Bash spells `C:/x` as `/c/x`, and untranslated that classified as outside the
  project, so the gate blocked nothing on Windows
- the POSIX `command -v node` guard is not a command in PowerShell, so on Codex for
  Windows every hook failed to start — and Codex fails open, so the gate was simply
  absent. One line of scrollback said `PreToolUse Failed`; nothing else did
- `JSON.stringify(obj, Object.keys(obj).sort())` looks like a canonical serialiser
  and is an allowlist applied at every depth, so every nested object signed as
  `{}`. Harmless for as long as every token field was a scalar, and a hole the
  moment one held a map — with the signature still verifying either way
- the judgement grant was single-use, and replacing a file is a delete plus an
  add, so the delete spent it and the add was refused. The verdict existed and
  could not be written down. Nothing errored on the harness side

**Run it, do not only test it.** Install the plugin and drive a real feature.

---

## State as of the last session

v0.1 feature-complete, pushed to `github.com/seo077/interlocking` (private), CI
green on 3 OSes × Node 18/20/22. Not tagged and not public yet.

**A real four-day feature ran on this harness** (a Godot/Web game, Codex on
Windows, 17 requirements, 35 tasks, several G0 re-approvals). Every open question
below about "never exercised" that it touched is now answered, and it produced the
first evidence about what this costs a person rather than what it prevents. That
evidence is the reason for the `delta`, `preflight`, `BLOCKED` and
`policy.artifacts` work in the Unreleased changelog — read those entries before
changing any of it, because each one names the specific failure it exists to stop.

The headline finding is not a defect. **The user's verdict was that the loop is
too slow**, and the arithmetic backs them: one two-line amendment to how a
requirement is *verified* cost four full criteria regenerations, four cold
reviews and four approvals, because nothing distinguished "this requirement
changed" from "this document changed". That is what `il delta` addresses, and the
principle it establishes is worth more than the feature: **the gate is not the
expensive part — the undifferentiated re-derivation behind it is.** When you are
tempted to add assurance, check first whether the cost lands on the human or on
the machine.

Still open from the same run, and deliberately not built:

- **Nothing enforces the difference between `verified` and `accepted`.** It is
  guidance in `il-verify` only. The feature that was declared complete four times
  would have been caught by a state machine; it is not obvious that the state
  machine is worth what it costs.
- **The evidence-retention question is untouched.** `policy.artifacts` keeps
  generated evidence out of the resume question; it says nothing about what should
  be committed, what should be cached, or when to clean up. Large browser evidence
  will accumulate.
- **Phase timing is in `audit.log` and nowhere a human reads.** Every entry
  already carries an ISO timestamp, so "where did the time go" is a reporting
  question, not an instrumentation one. Worth doing only if someone asks it twice.

Deliberately not in v0.1, in rough priority order:

1. **Stop hook** — enforce `STATE.md` freshness. Blocking is confirmed possible
   (`platform-facts.md`); this is what makes resume trustworthy
2. **G2 — a failing verification should block, not just report.** Right now
   `/il:verify` writes a verdict and nothing stops. Making FAIL a gate needs the
   verdict in the signed store first: `VERIFY.md` lives in the repo, and the moment
   it has teeth, rewriting FAIL to PASS becomes worth doing. Same reasoning that
   put approvals outside the repo. Round ledger and golden-baseline comparison
   (compare against the last PASS, not the previous attempt) belong with it.
   `BLOCKED` must not count as FAIL when this lands — that distinction exists now
   precisely so a denied network cannot stop a gate.
3. **G3 post-hoc validation** — settle the assumption ledger: what did "we don't
   know" turn out to be? The real fuel for the failure-learning loop
4. `/il:verify --cross` — the packet is already a file so it can be handed to
   another model unchanged
5. `domain: embedded` overlay — extension points are already in place (REQ tags,
   verifier registry, fixed `VERIFY.md` shape). A `domain: web` overlay now has a
   concrete shape too — the delivery-surface checklist in `il-spec` §1 is what it
   would encode

Never exercised, so treat as unknown: the **interactive interview** (both the
dogfood run and the Godot run were headless, so `AskUserQuestion` has still never
run), and running several features in sequence.

**`il-criteria` and the Gate 1 refusal are now exercised**, and the answer to the
open question is yes: across the Godot run the critic returned `NOT YET` around a
dozen times, and the findings were substantive — a missing stability threshold, an
unspecified round boundary, an oracle that could self-certify a coordinated
corruption, a criterion that could pass without checking the thing it named. It
also cuts the other way, and that is the cost side: a cold critic re-reading a
whole document finds *old* problems, which is rigour when you wanted rigour and
scope creep when you wanted a two-line amendment. `--delta` exists so that
trade-off is chosen rather than suffered. `restated-requirement` never fired.

### Codex support — what was measured and what was not

Measured on **Codex CLI 0.149.0, Windows**, with a probe plugin and real
`codex exec` runs (`platform-facts.md`, "Codex CLI"):

- the G0 gate blocks `apply_patch` and `Bash`, with the reason reaching the model
- `SessionStart` injection arrives, with the Codex spellings and a resolvable path
  to the read-only reports
- `commandWindows` runs, and the POSIX form does not
- the **whole loop**, on a plugin installed from this repo's own marketplace:
  `apply_patch` denied → `il approve` refused for a missing `REVIEW.md` →
  `il approve` accepted → the same write allowed. The audit log has all four,
  with real Codex session ids

A four-day Godot/Web feature has since run end to end on Codex for Windows, and
the three judgement agents did use the grants. Two things broke there, both now
fixed and both worth knowing about before touching that code: the grant was spent
by the delete half of a file replacement, and the identity check wanted
`il-verifier` while Codex canonical task names cannot contain a hyphen. Together
they meant a verifier that had reached a correct verdict could not record it. See
the Unreleased changelog and `canonicalAgent()`.

**Not exercised on Codex:** `$il-console` as a skill the model routes to on its
own, and Codex on **macOS or Linux**, where the POSIX `command` branch is the one
that runs and has never been driven — everything above was measured on Windows,
where `commandWindows` is what fires.

The trust prompt is only reachable from the TUI, so the first thing to do on a real
Codex run is confirm `/il:doctor` reports what you expect **before** trusting the
gate — an untrusted hook and a working one look identical from the outside.
