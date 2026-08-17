# Changelog

Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Bump `version` in `.claude-plugin/plugin.json` on every release — users do not
receive an update until that string changes. Do **not** also set `version` in
`marketplace.json`: when both exist, `plugin.json` wins silently.

## [Unreleased]

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
