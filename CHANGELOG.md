# Changelog

Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Bump `version` in `.claude-plugin/plugin.json` on every release — users do not
receive an update until that string changes. Do **not** also set `version` in
`marketplace.json`: when both exist, `plugin.json` wins silently. `.codex-plugin/plugin.json`
carries its own `version`, and Codex serves the cached build until that string moves.

## [Unreleased]

### Fixed

- Codex help no longer points to the nonexistent `$il-console onboard` mode.
  Existing repositories are initialized through the dedicated `$il-onboard`
  skill, which creates the harness without starting a feature or retroactively
  gating existing code.

### Added

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
