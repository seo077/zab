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
| `hooks/il.mjs` | the whole enforcement layer. One file, sectioned: `paths · bash · patch · hash · fm · smells · criteria · verify · brief · env · fsx · store · gate · state · git · out · handlers · main` |
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
| `test/` | 468 tests. `npm test` |
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
  variables. Building a fixed packet arms one signed, 10-minute, single-use write
  to its judgement file. `/il:doctor` calls this a capability convention rather
  than letting the invariant above read as if it still holds there.

`cmd()` picks the spelling for the detected host. It is display text only — a
wrong host can never change a gate decision, which is why detection is allowed
to guess.

---

## How to work here

**Test-first for pure functions** (`classify`, `analyzeBash`, `parseApplyPatch`,
`normalizeText`,
`parseFrontmatter`, `checkRequirements`, `parseCriteria`, `checkCriteria`,
`parseReview`, `composeVerifyPacket`, `composeCriteriaPacket`, `composeReviewPacket`,
`composeDesignBrief`, `composeHelp`, `wrapText`). Write the answer table, watch it
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

**Run it, do not only test it.** Install the plugin and drive a real feature.

---

## State as of the last session

v0.1 feature-complete, pushed to `github.com/seo077/interlocking` (private), CI
green on 3 OSes × Node 18/20/22. Not tagged and not public yet.

Deliberately not in v0.1, in rough priority order:

1. **Stop hook** — enforce `STATE.md` freshness. Blocking is confirmed possible
   (`platform-facts.md`); this is what makes resume trustworthy
2. **G2 — a failing verification should block, not just report.** Right now
   `/il:verify` writes a verdict and nothing stops. Making FAIL a gate needs the
   verdict in the signed store first: `VERIFY.md` lives in the repo, and the moment
   it has teeth, rewriting FAIL to PASS becomes worth doing. Same reasoning that
   put approvals outside the repo. Round ledger and golden-baseline comparison
   (compare against the last PASS, not the previous attempt) belong with it.
3. **G3 post-hoc validation** — settle the assumption ledger: what did "we don't
   know" turn out to be? The real fuel for the failure-learning loop
4. `/il:verify --cross` — the packet is already a file so it can be handed to
   another model unchanged
5. `domain: embedded` overlay — extension points are already in place (REQ tags,
   verifier registry, fixed `VERIFY.md` shape)

Never exercised, so treat as unknown: the **interactive interview** (the dogfood run
was headless, so `AskUserQuestion` never ran and all seven assumptions stayed
unconfirmed), running several features in sequence, and epic decomposition.

Also never exercised on a real feature: **`il-criteria` and the Gate 1 refusal**.
The hook layer is tested and was driven by hand end to end, but no actual run has
produced a `CRITERIA.md` from a real interview. The open question is whether a
criteria agent with only the spec and the decisions writes yardsticks that are
sharp enough to be worth the extra screen — if it produces restatements of the
requirements, the separation is ceremony. `restated-requirement` warns on exactly
that case; watch how often it fires.

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

**Not exercised on Codex:** `$il-console` as a skill the model routes to on its
own, the three judgement agents using one-use grants, and Codex on **macOS or Linux**,
where the POSIX `command` branch is the one that runs and has never been driven —
everything above was measured on Windows, where `commandWindows` is what fires.

The trust prompt is only reachable from the TUI, so the first thing to do on a real
Codex run is confirm `/il:doctor` reports what you expect **before** trusting the
gate — an untrusted hook and a working one look identical from the outside.
