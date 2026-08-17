# interlocking

A Claude Code **plugin** that blocks source edits until a human approves the spec,
resumes a dead session in thirty seconds, and verifies with an agent that never saw
the implementation. Zero dependencies, one hook file, Node 18+.

**Read `README.md` first** — it states plainly what this does not do, and that
framing matters more here than the feature list.

---

## Where things are

| | |
|---|---|
| `hooks/il.mjs` | the whole enforcement layer. One file, sectioned: `paths · bash · hash · fm · smells · verify · env · fsx · store · gate · state · git · out · handlers · main` |
| `hooks/hooks.json` | which events call which mode |
| `commands/*.md` | slash commands. `approve` `override` `policy` are human-only |
| `skills/il-{spec,execute,verify}/` | the phase procedures — natural language, not testable |
| `agents/il-verifier.md` | the independent verifier |
| `templates/` | what gets written into a user's `.interlocking/` |
| `test/` | 306 tests. `npm test` |
| `docs/design/platform-facts.md` | **measured** platform behaviour, with the version |
| `docs/design/WALKTHROUGH.ko.md` | a real end-to-end run, quoted verbatim |
| `docs/design/concept.ko.md` | the original design doc. Historical — read its header |

Decision numbers in comments (`D-013`, `D-017`, …) are defined in `concept.ko.md`.

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

**Zero runtime dependencies.** The hand-rolled glob and flat-YAML parser are
deliberate; this file runs on every matching tool call.

---

## How to work here

**Test-first for pure functions** (`classify`, `analyzeBash`, `normalizeText`,
`parseFrontmatter`, `checkRequirements`, `composeVerifyPacket`). Write the answer
table, watch it fail, then implement. Then break the fix on purpose and confirm the
test catches it.

**Never string-assert on prompt text.** Skills and commands are natural language.
Such tests are brittle and catch nothing.

**Measure the platform, do not cite the docs.** They have been wrong here more than
once, and two Claude Code builds disagree with each other. Anything you rely on goes
into `platform-facts.md` with the version you measured on.

**Run the oldest Node before pushing** if you touched anything version-sensitive:
`npm run test:node18`. The suite was green on the dev machine and red on six of nine
CI cells because `node --test` changed what its argument means at 21.

Before pushing: `npm test && claude plugin validate . --strict`

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

**Run it, do not only test it.** Install the plugin and drive a real feature.

---

## State as of the last session

v0.1 feature-complete, pushed to `github.com/seo077/interlocking` (private), CI
green on 3 OSes × Node 18/20/22. Not tagged and not public yet.

Deliberately not in v0.1, in rough priority order:

1. **Stop hook** — enforce `STATE.md` freshness. Blocking is confirmed possible
   (`platform-facts.md`); this is what makes resume trustworthy
2. **G3 post-hoc validation** — settle the assumption ledger: what did "we don't
   know" turn out to be? The real fuel for the failure-learning loop
3. `/il:verify --cross` — the packet is already a file so it can be handed to
   another model unchanged
4. `domain: embedded` overlay — extension points are already in place (REQ tags,
   verifier registry, fixed `VERIFY.md` shape)

Never exercised, so treat as unknown: the **interactive interview** (the dogfood run
was headless, so `AskUserQuestion` never ran and all seven assumptions stayed
unconfirmed), running several features in sequence, and epic decomposition.
