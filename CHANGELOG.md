# Changelog

Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Bump `version` in `.claude-plugin/plugin.json` on every release — users do not
receive an update until that string changes. Do **not** also set `version` in
`marketplace.json`: when both exist, `plugin.json` wins silently. `.codex-plugin/plugin.json`
carries its own `version`, and Codex serves the cached build until that string moves.

## [Unreleased]

### Fixed

- **A judgement grant was spent by the delete half of a replace.** Replacing an
  existing `VERIFY.md` is a delete and then an add; the single-use capability was
  consumed by the delete and the add was refused, so a verifier that had reached a
  verdict could not record it. A failed write burned it the same way, because
  `PreToolUse` fires *before* the tool runs and can never learn whether it
  succeeded — exactly-once is not available at that hook point, and pretending
  otherwise cost a real run its verdict. The grant is now a small use budget
  (4 calls) inside a 30-minute window, still bound to one feature, one artifact
  and one owner, and still signed. Ten minutes was also wrong: a verifier ruling
  on seventeen requirements runs the project's test suite first, and the
  capability expired before it had an answer.

- **A Codex agent could not write the file it was spawned to write.** The
  owned-artifact rule matched the registry name `il-verifier`, and Codex canonical
  task names cannot carry a hyphen — so the value that arrived was `verifier`, the
  name check failed, and the grant fallback was skipped because it additionally
  required the caller to be anonymous. Identity is now canonicalised
  (`canonicalAgent()`), and on a host that does not attest identity the grant
  alone authorises the write, which is what it was always for. This closes a hole
  in the other direction too: an unrecognised near-miss name used to mean *no*
  restriction, so a Codex task called `verifier` could write source that
  `il-verifier` could not.

- **The token signer did not sign nested fields.** `canonical()` used
  `JSON.stringify`'s replacer argument, which looks like it sorts keys and does —
  but an array replacer is an allowlist applied at *every* depth, so any nested
  object serialised as `{}` and its contents were never covered. Invisible while
  every field in every token was a scalar; live the moment one held a map. It is
  now a hand-written deterministic serialiser. Flat tokens sign byte-identically,
  so existing approvals keep verifying.

- **HEAD moving is no longer treated as a hazard by default.** A commit is the
  normal end of a task, so "HEAD is not the STATE.md anchor" was firing ACTION
  REQUIRED at the human about the thing the harness had just told them to do —
  and on a real run that is what stopped a finished feature from starting the next
  one. `gitInfo()` now asks whether HEAD still *contains* the anchor: an advance
  is a note, and only a rewind, a rebase, a different branch or an unresolvable
  anchor is a question. Unknown ancestry fails toward the question.

- **A stale `gates_passed` now says which of three things happened.** The warning
  was identical whether the spec had been amended on purpose, the criteria had
  moved, or the line had been written with no approval behind it — so it sent
  people hunting for tampering after an edit they had just made deliberately. The
  reason from the signed store is now printed, with advice that routes on it. The
  rule itself is unchanged: the hook never rewrites `STATE.md`, because a harness
  that silently repairs the record of its own gate destroys the only signal that
  says someone edited it.

### Added

- **`il delta` — scoped amendment after an approval.** Editing `SPEC.md` or
  `CRITERIA.md` still closes G0, and the approval still binds both whole-document
  hashes: none of that moves. What moves is how much work the two agents redo.
  Previously a two-line amendment to *how* one requirement is verified sent every
  requirement in the feature back through `il-criteria` and the critic — and
  because each full re-review surfaced unrelated findings in requirements nobody
  had touched, one verification-contract change cost four rounds and four
  approvals on a real run.

  Approvals now record a hash per requirement and per criterion. `il delta`
  compares the current documents against that **signed** record — never against
  anything in the repo — and reports what moved, what was added or removed, and
  what is byte-identical to what the human already approved. `criteria-packet
  --delta` and `review-packet --delta` scope the work to the answer.

  The refusals are the load-bearing part. No prior approval, a record predating
  per-requirement hashes, or a failed signature produces no scope at all: a reuse
  claim the store cannot substantiate is worth nothing, least of all from the
  session that would prefer less work. `il-criteria` carries the unchanged entries
  through rather than re-deriving them, and altering one is *detected* rather than
  trusted — it re-enters review on the next `delta`. The critic still reads both
  documents whole; only its attention is directed, and its packet says in as many
  words that a finding outside the scope is still a finding. The approval screen
  names how many requirements moved and how many carried, so the assurance
  difference is something the human reads rather than something the model decided.

- **`il preflight` — can the verification round run at all?** Two full rounds on
  one real run returned nothing but INCONCLUSIVE, and neither was about the code:
  `policy.verify.commands` was empty, and a criterion named `godot4` when the
  executable lived in the repository. Both were discovered *after* implementation
  was finished and a fresh agent had read every requirement. Preflight answers the
  same question in two seconds, before the packet is built, and `verify-packet`
  runs it automatically. It is deliberately shallow — found or not found, never
  "will it pass" — because a preflight that cries wolf is one people learn to skip.

- **`BLOCKED`, distinct from `INCONCLUSIVE`.** Both mean "I did not decide" and
  they are repaired by different people, so collapsing them routes the work to the
  wrong place: on a real run a verifier with a denied network reported
  INCONCLUSIVE, and the loop opened product tasks against code that was already
  correct. BLOCKED is the environment — denied network, missing program, absent
  device — and costs nothing to retry once fixed. INCONCLUSIVE means the evidence
  the criterion asks for does not exist, which is a change to `CRITERIA.md` and
  therefore a new approval. One test tells them apart: would this criterion pass
  on the implementer's machine, exactly as written?

- **`policy.artifacts`** — globs for files the harness and its verification
  generate: packets, evidence, screenshots, exports. The resume question exists to
  protect half-finished human work and only functions if it is rare; on a real run
  generated evidence made every session open with ACTION REQUIRED about files the
  harness had produced one command earlier. Declared artifacts become a note;
  everything else stays a question. Nothing is guessed — an undeclared file is
  human work, because guessing wrong here loses someone's work.

- **A delivery-surface question at intake** (`il-spec` §1). When the thing that
  runs the code and the thing the user touches are not the same — a browser, a
  phone, a deployed URL, a packaged binary — the spec needs requirements about the
  delivered artifact *before* the first G0: real input, rendered text, a whole
  lifecycle, and provenance tying deployed bytes to a source commit. On the run
  behind this rule a feature passed 11 of 11 requirements, was declared complete,
  and was reopened by the user four times over mojibake, a dead drag and a turn
  that never ended. Retrofitting those requirements costs an amendment; asking one
  question at intake costs a line.

- **`verified` and `accepted` are different states** (`il-verify`). A PASS means
  every requirement was judged met against the criteria, in the environment the
  verifier had. On a delivered surface that is not the same claim as "it works",
  and reporting it as completion is what let one feature be declared done four
  times. Report the verdict and what it did not cover, then let the human look.

- **Codex is now a first-class host.** `codex plugin marketplace add` +
  `codex plugin add il@interlocking`, and the same gate blocks there. Measured on
  Codex CLI 0.149.0 (Windows) with a probe plugin and real `codex exec` runs; the
  payloads and schemas are in `docs/design/platform-facts.md` under "Codex CLI".

  Almost nothing had to change, because Codex speaks Claude Code's hook wire
  format field for field — `hook_event_name`, `tool_input`,
  `hookSpecificOutput.permissionDecision`, even `Bash` spelled `Bash`. Three
  things did:

  - **`parseApplyPatch()`** — Codex has no Edit/Write/MultiEdit. Every file it
    writes arrives as one `apply_patch` call whose whole input is a patch envelope
    in `tool_input.command`, with no path field anywhere, so on that host this
    parser *is* the G0 gate. It collects both ends of a rename and refuses to be
    fooled by `+*** Add File: decoy.ts` in a patch body — a header has to begin its
    line. An envelope it cannot read denies rather than allowing, on the reasoning
    that silence here means "allow" and that is the gate-theatre failure.
  - **`commandWindows` on every hook handler** — Codex runs hooks through
    PowerShell on Windows, where `command -v node >/dev/null 2>&1 && …` is not a
    command. It failed, Codex fell open, and the tool call ran. Not a weakened
    gate: no gate, announced by one line of scrollback. `test/hooks-config.test.mjs`
    now fails the build if a handler loses its Windows form, drifts to a different
    mode, or stops matching one host's write tool.
  - **Host-aware spellings (`cmd()`)** — Codex has no plugin slash commands, so a
    blocked write that says "type `/il:approve`" is telling the human to do
    something that cannot work, and the gate reads as broken rather than closed.
    The hook detects the host from the plugin-root and transcript paths — Codex
    sets `CLAUDE_PLUGIN_ROOT` itself, so the variable names prove nothing — and
    prints `il approve` there. Display text only; no gate decision branches on it.

- **`skills/il-console`** — the read-only reports (`status`, `help`, `doctor`,
  the design brief) for Codex, which has no commands to hang them off. It cannot
  open a gate and says so. The `SessionStart` injection now hands Codex sessions
  the absolute path to `il.mjs`, because `CLAUDE_PLUGIN_ROOT` is set for hook
  processes and not for the shell a skill runs in — the unexpanded form would have
  produced `node "/hooks/il.mjs"` and a path error that looks like a broken install.

- **`/il:doctor` reports the host, and what is *not* enforced on it.** On Codex it
  lists the G0 gate, human-only approval and resume as intact, and states plainly
  that agent identity is not attested: Codex does not send `agent_type`, and its
  `spawn_agent` takes the type as a model-supplied argument, so the rule that
  `VERIFY.md`/`CRITERIA.md`/`REVIEW.md` each have exactly one author is a
  convention there rather than a lock. Current `spawn_agent` also cannot set a
  per-agent environment variable, so building each fixed packet now arms a
  signed, 10-minute, single-use write to its judgement file. The grant is consumed
  by the first matching write and cannot cover another path. A harness that
  quietly enforces less than it claims is worse than one that enforces nothing,
  because you stop checking.

- **The requirement and the yardstick now have different authors — `il-criteria`
  and `CRITERIA.md`.** Acceptance criteria have left `SPEC.md`. After the
  interview and before any code exists, the `il-criteria` subagent reads the
  requirements and the decisions behind them and writes one criterion per REQ into
  `CRITERIA.md` — a file the spec's author cannot write, enforced by the same
  `agent_type` hook rule that constrains the verifier. It in turn cannot write
  `SPEC.md`, so an awkward requirement cannot be quietly reshaped to suit a
  convenient criterion either.

  The gap this closes is not hypothetical. A verifier independent of the
  implementation but reading a yardstick the implementer chose is independent of
  the half that stops mattering the moment a round fails: the cheapest way to turn
  FAIL into PASS has always been to shorten the ruler. Owed to the Z/A/B
  orchestration template this project's author has been running on real work,
  where the verifier writes `VERIFY_CRITERIA/` *before* the implementer starts and
  `V-8` names criteria-weakening on a failing round as a violation by name.
- **The G0 approval binds to `CRITERIA.md` as well as `SPEC.md`.** Two hashes in
  the signed token, both checked on every gated write. Editing a criterion after
  approval re-closes the gate with the same message a rewritten requirement gets —
  without this, moving the yardstick would have been the one edit the gate did not
  notice.
- **Gate 1 — the critic's verdict now refuses the approval.** `il-spec-critic`
  writes `REVIEW.md` (its own file, which nobody else may write) carrying
  `VERDICT: READY` or `VERDICT: NOT YET`. `NOT YET` refuses `/il:approve`.

  A model's opinion must not be final over a person's, so `/il:approve
  despite-review` overrules it and the approval record keeps `review_overruled`.
  The verdict also binds to the hashes of the exact pair it read: fix a REQ after a
  `READY` and the stale verdict stops clearing anything, which is the failure mode
  that would otherwise look most like success.
- **`il.mjs criteria-packet` and `review-packet`.** Hook-composed prompts for the
  two new delegations, on the same principle as the verify packet: no free-text
  field the caller can narrate through. The criteria packet carries requirements
  *and* decisions verbatim — a criterion written without knowing what a requirement
  is for tests its letter while the thing the human asked for goes unmeasured. The
  review packet carries paths and two hashes, and no summary of anything.
- **The design brief

 — `/il:design`, and shown by `/il:new` before it asks.**
  Rendered from `SPEC.md` by the hook, not written by a model: decisions first,
  then every requirement with the criterion it will be judged by, the threat rows,
  and the assumptions the approval carries with it. A summary that has drifted
  from the spec is worse than no summary, and a deterministic render cannot drift.
- **`## Decisions` in `SPEC.md`** — `DEC-###`, with the question, the answer in
  the human's own words, and the REQs it produced. Outside the normative markers,
  so recording why something was chosen never costs a re-approval.
- **`il-spec-critic`** — reads the spec and its criteria cold before G0, having
  missed the interview on purpose, and reports where a requirement could not
  actually be judged. It writes `REVIEW.md` and nothing else — not the spec, not
  the criteria — enforced by the same `agent_type` hook rule that constrains the
  verifier: a critic that can resolve its own findings raises none.
- **`/il:help` — the one command you have to remember.** Rendered by the hook from
  the *enforced* gate, it names where you are and offers at most **three** commands:
  the ones that would actually do something in this state. Eleven commands and no
  entry point was the real complaint — not missing documentation, but no way to find
  which of them applied right now. The three-command cap is a tested invariant, since
  a screen that lists everything is the catalogue the user already could not navigate.
  It routes on the gate rather than on `phase`, so a stale `STATE.md` cannot offer a
  command that cannot work, and a tamper or advisory-mode warning is printed above the
  list rather than below it.
- Column-aware wrapping (`displayWidth`, `wrapText`). A Korean line is about twice
  as wide as it is long, and wrapping on character count produced 150-column lines
  the terminal then re-wrapped at random.

### Changed

- Make assurance proportional: trivial and localized low-risk small changes use
  a recorded override plus one targeted check, without miniature SPEC/critic/
  subagent/independent-verifier ceremony.
- Bound verification to affected requirements and classify unavailable network,
  browser, credentials, tools, or sandbox access as environmental BLOCKED; these
  no longer justify repeated agents or product-SPEC amendments by default.
- Codex help no longer points to the nonexistent `$il-console onboard` mode.
  Existing repositories are initialized through the dedicated `$il-onboard`
  skill, which creates the harness without starting a feature or retroactively
  gating existing code.
- **Nested `codex exec` is denied while gated, the same as `claude -p`.** A nested
  session can submit its own user prompts, which is the one thing the approval path
  assumes cannot happen. Only `claude` was on that list.
- **`apply_patch` as a *shell* command is denied too.** Reached as a tool call its
  envelope is parsed; reached through the shell the envelope is on stdin and
  invisible, so it joins `patch` and `git apply` in the deny list.
- **README no longer claims the approval store can live in `CLAUDE_PLUGIN_DATA`.**
  It cannot, deliberately — both hosts set that variable for hook processes and
  neither sets it anywhere else, and a store that moves with the calling context is
  the bug that once had `/il:status` and the gate reporting opposite answers on the
  same project in the same second.
- **`SPEC.md` no longer carries `Acceptance:` lines, and a missing one is no
  longer what G0 refuses on.** The blocker moved: a REQ with no entry in
  `CRITERIA.md` refuses the approval, and an inline `Acceptance:` left in a spec
  is now a *warning* — the yardstick exists in two places and the verifier reads
  the other one. `.interlocking/**` remains always writable with exactly three
  carve-outs: `CRITERIA.md`, `REVIEW.md` and `VERIFY.md`, each writable only by
  the agent that owns it. A human editing them by hand is unaffected; the hook sees
  tool calls, not editors.
- **Removed `/il:resume`.** Its two substantive steps — ask the human (a) finish /
  (b) discard / (c) show the diff about uncommitted work, and flag a moved `HEAD` —
  are what the `SessionStart` hook already injects automatically, in the same words.
  The command was a prose copy of that, and the hook version is strictly better
  because it fires without anyone remembering to type it. Use `/il:status` for the
  detail, or just say what you want to continue.
- The approval flow is now two screens: the brief to read, then the ~20-line
  screen to act on. This amends concept.ko.md §5.4, which said never to show the
  human the document. That rule prevented a rubber-stamp on a 90-line spec and
  caused the opposite failure instead — 20 lines is not enough to judge, so the
  human either approves blind or goes and reads the raw spec anyway. Both were
  observed on real runs.

## [0.1.0] — unreleased

First release. Three things, deliberately: resume, the G0 gate, independent
verification.

### Added

- **G0 spec gate.** Source edits are denied until a human approves `SPEC.md`.
  Enforced by a `PreToolUse` hook covering Write-family tools, Bash write targets
  (redirects, `sed -i`, `cp`/`mv`, patch appliers, inline interpreters,
  scaffolders) and MCP tools whose names look like writes. Markdown, docs and
  `.interlocking/**` are never blocked.
- **Approval that the model cannot forge.** Recorded by a hook reading the human's
  literal keystrokes into a signed record outside the repository. `/il:approve`,
  and the slash-free `il approve` as insurance — an unregistered slash command
  skips hooks entirely.
- **`/il:override <reason>`** — the escape hatch and the fast lane in one signed,
  time-boxed, edit-counted lease. Refused without a reason.
- **Session resume.** `SessionStart` injects the resume anchor within a hard
  45-line budget, and surfaces uncommitted work as a question with three options
  rather than deciding for you.
- **Independent verification.** A verifier subagent that never sees the
  implementation conversation, cannot write source (enforced by hook, not by its
  own config), and writes exactly one file. The packet is assembled from the SPEC
  and written to disk so it can later be handed to another model unchanged.
- **G0 red light.** Approval is refused when a requirement has no `Acceptance:`
  line, when there are no requirements, or when the threat model is missing.
  ISO/IEC/IEEE 29148 heuristics warn but never block.
- `/il:new`, `/il:onboard`, `/il:status`, `/il:resume`, `/il:next`, `/il:verify`,
  `/il:doctor`, `/il:policy`.
- Zero runtime dependencies. Node 18+.

### Known limits

Stated plainly rather than buried: the gate is **not a sandbox**. Obfuscated Bash,
`awk`'s internal redirect and runtime-built paths are not caught — the corpus at
`test/fixtures/bash-writes.txt` lists them. Verification is context- and
permission-independent but uses the **same model** as the implementer. Post-hoc
validation (G3) is not in this release.
