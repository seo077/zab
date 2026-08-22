# Platform facts — measured, not documented

> Measured on **Claude Code 2.1.233**, Windows 11, Node v24.14.0, Git Bash (MINGW64).
> Method: `test/probe/probe.mjs` wired as real hooks, driven by headless `claude -p` runs.
> Raw payloads are preserved in `test/fixtures/events/`.
>
> **Why this file exists.** The design depends on six platform behaviors. Documentation
> disagreed with itself on two of them, and a code trace of 2.1.77 disagreed with 2.1.233
> on two more. Anything the harness relies on must be measured on the version in front of
> us and re-measured by `/il:doctor` on the user's version.

---

## Summary

| # | Question | Answer | Design impact |
|---|---|---|---|
| Q1 | Does `UserPromptSubmit` receive the raw typed text, slash commands included? | **Yes — but only for registered commands.** | Approval path viable. `/il:approve` MUST be a real plugin command. |
| Q2 | Is `systemMessage` invisible to the model while `additionalContext` is visible? | **Yes. Confirmed both directions.** | A human-only channel exists. Not used in v0.1, but available. |
| Q3 | Does `PreToolUse` `permissionDecision: "deny"` actually block? | **Yes, and the reason reaches the model verbatim.** | G0 hard block is real. |
| Q4 | Does `SessionStart` `additionalContext` reach the model's context? | **Yes.** | 30-second resume is real. |
| Q5 | Which env vars exist? Which shell runs hooks? | See below. Git Bash on Windows. | POSIX `sh` syntax is correct on all platforms. |
| Q6 | Do hooks fire inside subagents, with agent identity? | **Yes — `agent_type` and `agent_id` are in the payload.** | The verifier's third (config-independent) write-block works. |

---

## Q1 — raw prompt text

`UserPromptSubmit` receives `prompt` as the **verbatim line the human typed**:

| Typed | Hook fired? | `prompt` field |
|---|---|---|
| `reply with the single word OK` | ✅ | `"reply with the single word OK"` |
| `il approve G0` (no slash) | ✅ | `"il approve G0"` |
| `/il:approve G0` (**registered** plugin command) | ✅ | `"/il:approve G0"` |
| `/il:approve G0` (**unregistered** — plugin not installed) | ❌ **hook skipped entirely** | — |

**The last row is the trap.** An unknown slash command short-circuits before hooks run
("Unknown command: /il:approve"). Consequences:

1. `commands/approve.md` and `commands/override.md` **must exist and be installed**, or the
   approval path silently does nothing.
2. Ship the **slash-free form as a first-class alias** (`il approve G0`). A non-command prompt
   cannot be short-circuited, so it is immune to whatever the slash-expansion path does next.
   This is free insurance — advertise both forms in the README from day one.

## Q2 — the human-only channel

A hook that emits both channels at once:

```json
{ "systemMessage": "IL_PROBE_UPS_SYSMSG_C9X4 …",
  "hookSpecificOutput": { "hookEventName": "UserPromptSubmit",
                          "additionalContext": "IL_PROBE_UPS_CTX_B3N8 …" } }
```

Asked to list every `IL_PROBE_*` string in its context, the model returned:

```
IL_PROBE_SS_CTX_A7K2      ← SessionStart  additionalContext
IL_PROBE_UPS_CTX_B3N8     ← UserPromptSubmit additionalContext
```

`IL_PROBE_UPS_SYSMSG_C9X4` was **absent**. `systemMessage` renders to the human's terminal and
does not enter the model's context.

> Not relied upon in v0.1 (single-step approval needs no secret), but it is what would make a
> challenge/response scheme possible if the threat model ever demands one. Treat as
> version-dependent and re-check in `/il:doctor`.

## Q3 — deny actually blocks

`PreToolUse` returning:

```json
{ "hookSpecificOutput": { "hookEventName": "PreToolUse",
    "permissionDecision": "deny", "permissionDecisionReason": "…" } }
```

- **Write tool**: blocked. File was not created. Model quoted the reason verbatim.
- **Bash tool**: blocked. (Observed live — it blocked one of this session's own commands.)
- **Inside a subagent**: blocked. See Q6.

Returning **no output at all** = allow, and falls through to the normal permission system.
This is the correct "allow" behavior: never emit `permissionDecision: "allow"`, which would
short-circuit permissions and silently auto-approve edits the human wanted to review.

## Q4 — SessionStart injection

`{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"…"}}` lands in the
model's context. Payload keys: `session_id`, `transcript_path`, `cwd`, `hook_event_name`, `source`.

`source` is one of `startup | resume | clear | compact` — matched `"startup"` in a headless run.

## Q5 — environment and shell

| Variable | From plugin hooks | From `.claude/settings.json` hooks |
|---|---|---|
| `CLAUDE_PLUGIN_ROOT` | `C:/Workspace/interlocking/` — **forward slashes, trailing slash** | `null` |
| `CLAUDE_PLUGIN_DATA` | `C:/Users/USER/.claude/plugins/data/il-interlocking` | `null` |
| `CLAUDE_PROJECT_DIR` | `C:/Workspace/interlocking` — forward slashes, no trailing slash | same |
| `CLAUDE_SESSION_ID` | **`null`** | `null` |
| `CLAUDE_ENV_FILE` | set on `SessionStart` only | same |

Consequences:

- **`CLAUDE_PLUGIN_DATA` does exist on 2.1.233** (a 2.1.77 trace said otherwise) — but it is
  deliberately **not** used to locate the store. It is present for hook processes and absent
  for the `!` blocks commands run from, which split the store in two. See the dogfooding
  section below.
- **`CLAUDE_SESSION_ID` is null in hooks.** Use `session_id` from stdin, never the env var.
- `CLAUDE_PLUGIN_ROOT` carries a **trailing slash**; join paths defensively.

**Shell**: `process.env.SHELL = C:\Program Files\Git\bin\bash.exe`, `MSYSTEM = MINGW64`.
Hooks run under **Git Bash on Windows**, so POSIX syntax (`command -v node`, `>/dev/null 2>&1`,
`|| true`) is correct on every platform. The `command -v node … || true` guard works.

**Path format mismatch — important for `classify()`:**

```
CLAUDE_PROJECT_DIR         C:/Workspace/interlocking          (forward slashes)
tool_input.file_path       C:\Workspace\interlocking\x.txt    (BACKslashes, absolute)
```

`classify()` must normalize separators on both sides before comparing. This is the single most
likely source of a silent "blocks nothing" bug on Windows.

## Q6 — hooks fire inside subagents

A `general-purpose` subagent asked to write the sentinel path was **blocked**, and the captured
payload carried agent identity:

```json
{ "agent_id": "a01fd10a679bb9664", "agent_type": "general-purpose",
  "tool_name": "Write",
  "tool_input": { "file_path": "C:\\Workspace\\interlocking\\sub-IL_DENY_PROBE.txt" } }
```

This is the load-bearing fact for the verifier: `tools:` / `disallowedTools:` live in a file the
agent's own definition controls, but a hook rule keyed on `agent_type === "il-verifier"` does not.
It is also what lets `pre-bash` whitelist exactly one write path for the verifier's `VERIFY.md`.

---

## Payload shapes (abridged, from real captures)

```jsonc
// every event
{ "session_id", "transcript_path", "cwd", "hook_event_name", "permission_mode", "prompt_id" }

// UserPromptSubmit  — adds
{ "prompt": "/il:approve G0" }

// SessionStart      — adds
{ "source": "startup" }

// PreToolUse        — adds
{ "tool_name": "Write", "tool_use_id": "toolu_…", "effort": { "level": "high" },
  "tool_input": { "file_path": "C:\\...\\x.txt", "content": "…" },
  "agent_id": "…", "agent_type": "general-purpose" }   // present only inside subagents
```

Treat **every** field as optional in the parser. A missing field must fail open, never throw.

---

## Measured cost per gated tool call

Windows 11, Node v24.14.0, 20 runs each:

| | |
|---|---|
| bare `node -e 0` | **81 ms** |
| `il.mjs`, repo without `.interlocking/` | 108 ms |
| `il.mjs`, gate closed, deny emitted | 107 ms |

**Node process startup dominates — our logic costs ~26 ms of it.** On Linux and macOS
Node starts in roughly half the time, so expect ~40–60 ms there.

Two consequences the design already reflects:

1. **Keep the matchers narrow.** This cost is paid per matching tool call, so `Read`,
   `Grep` and `Glob` are deliberately not hooked. Only `Edit|Write|MultiEdit|NotebookEdit`,
   `Bash` and `^mcp__.*` are.
2. **State it in the README rather than hide it**, and ship `IL_DISABLE=1`.

The `.interlocking/`-missing path is a single `existsSync` before anything else, so a repo
that does not use the harness pays only Node startup.

## Windows path forms the gate must understand

Three spellings of the same file reach the hook, and treating any of them as "outside the
project" silently disables the gate:

| Source | Form |
|---|---|
| `CLAUDE_PROJECT_DIR` | `C:/Workspace/proj` |
| `tool_input.file_path` | `C:\Workspace\proj\src\a.ts` |
| a Bash command (Git Bash) | `/c/Workspace/proj/src/a.ts`, `/cygdrive/c/...` |

The third form is easy to miss: MSYS rewrites path-shaped **environment variables** when it
launches a native process, but leaves **stdin payloads and command text alone**. So a Bash
command can name a project file in a spelling the env var never uses. `classify()` translates
all three; see the MSYS cases in `test/classify.test.mjs`.

## Still unverified

| | Why it is not blocking |
|---|---|
| `Stop` hook can force continuation (exit 2 → `stop_hook_active`) | Not used in v0.1. Highest-value v0.2 addition — re-measure then. |
| `PostToolUse` `tool_response` carries full subagent output | Only needed by a `VERIFY.md` design that was rejected. |
| MCP filesystem tool names in the wild | `^mcp__.*` matcher is best-effort by design; documented as partial. |

## Reproducing

```bash
claude plugin marketplace add ./
claude plugin install il@interlocking --yes
claude -p "il approve G0" --max-turns 1     # then read test/fixtures/events/
```

`/il:doctor` performs a subset of these checks against the user's own installation and degrades
the gate from `enforce` to `advisory` when a prerequisite is missing.

---

## Found by dogfooding, not by testing

Three defects survived 300 green unit tests and were only visible when the plugin
was installed and driven end to end. All three are silent — nothing errors, nothing
logs, the wrong thing simply happens.

### A `!` block needs permission, or the whole command does nothing

A command file containing ``!`node …` `` without `allowed-tools` produces
**`num_turns: 0`, empty output, no error**. Not a degraded command — no command at
all. `!`echo …`` works, because `echo` is already permitted; `node` is not.

Seven of nine shipped commands were in this state, including `/il:status` and
`/il:new`. Fix: `allowed-tools: Bash(node:*)`. Guarded by a test that reads every
command file and fails if a `!` block is undeclared.

### Hook-only env vars split the store in two

`CLAUDE_PLUGIN_DATA` is set for hook processes but **not** for the `!` blocks that
`/il:status` and `/il:doctor` run from. With it in the store-location ladder, the
same `status` command reported:

```
CLI  (! block):  gate CLOSED — G0 not approved
HOOK          :  gate OPEN   — G0 approved
```

Same project, same second. The command whose entire job is to report the enforced
state was reporting a different one. Fix: the store location depends on nothing
that varies by calling context — `IL_HOME` (explicit user choice) or
`~/.interlocking`, never `CLAUDE_PLUGIN_DATA`.

### `allowed-tools: []` and "now update STATE.md" cannot both be true

`commands/approve.md` gave the model no tools so it could not meddle, while the
hook's message told it to mirror the approval into `STATE.md`. It silently did
nothing, and `/il:status` then read an empty `gates_passed` forever.

Fix: `allowed-tools: Edit(.interlocking/**), Read` — scoped to the harness
directory, so the instruction is possible and still bounded.

**The pattern in all three:** unit tests check what a function returns. These are
failures of *integration with the platform*, and every one of them is quiet.

---

# Codex CLI

> Measured on **Codex CLI 0.149.0**, Windows 11, Node v24.14.0.
> Method: a probe plugin installed from a local marketplace, driven by real
> `codex exec` runs; payloads captured from the hook's stdin. The wire schemas
> below were cross-checked against the JSON Schema embedded in `codex.exe`.

The short version: **the hook contract is the same one Claude Code uses**, field
for field, so the enforcement layer ports without a translation shim. Three
things differ, and one of them is the kind of difference that fails silently.

## Summary

| # | Question | Answer | Design impact |
|---|---|---|---|
| C1 | Same hook events? | **Yes**, plus `PermissionRequest`, `PostCompact`, `SubagentStart/Stop`. | `SessionStart`, `UserPromptSubmit`, `PreToolUse` all exist. |
| C2 | Same input/output JSON? | **Yes** — `hook_event_name`, `tool_input`, `hookSpecificOutput.permissionDecision`. | `emit()`, `denyTool()`, `tellBoth()` unchanged. |
| C3 | Does `PreToolUse` deny actually block? | **Yes**, and the reason reaches the model verbatim. | G0 hard block is real here too. |
| C4 | Does `UserPromptSubmit` carry the literal prompt? | **Yes.** | Human-only approval survives. |
| C5 | Which write tool? | **`apply_patch`** — no Edit/Write/MultiEdit. | Needed `parseApplyPatch()`. See C7. |
| C6 | Which shell runs hooks on Windows? | **PowerShell, not Git Bash.** | POSIX hook commands fail open. See C8. |
| C7 | Is `agent_type` attested? | **No.** Not sent, and `spawn_agent` takes it as a model argument. | Owned-artifact rule degrades to a convention. |
| C8 | Do plugin hooks load at all? | **Yes**, from `hooks/hooks.json`, but only once **trusted**. | Untrusted = silently skipped. |

---

## C2 — the wire format is Claude Code's

Verbatim `PreToolUse` payload from a real run:

```json
{ "session_id": "01a029a0-…", "turn_id": "01a029a0-…",
  "transcript_path": "C:\Users\me\.codex\sessions\2026\08\22\rollout-….jsonl",
  "cwd": "C:\…\project", "hook_event_name": "PreToolUse",
  "model": "gpt-5.6-sol", "permission_mode": "bypassPermissions",
  "tool_name": "Bash", "tool_input": { "command": "echo hi" },
  "tool_use_id": "exec-096bd982-…" }
```

`Bash` is spelled `Bash`, and its input is `{command}` — identical. Deny works:

```
ERROR codex_core::tools::router: error=Command blocked by PreToolUse hook: <reason>
hook: PreToolUse Blocked
```

Two output fields Claude Code accepts are **rejected** here, and rejection fails
closed on the hook rather than on the tool: `permissionDecision: "allow"` and
`"ask"` both produce `PreToolUse hook returned unsupported permissionDecision`.
Only `deny` is honoured. This costs nothing — `il` never emits either, for its
own reasons (see `§ out`).

## C5 — `apply_patch` is the only write tool

There is no path field anywhere. The whole patch arrives as a string:

```json
{ "tool_name": "apply_patch",
  "tool_input": { "command": "*** Begin Patch\n*** Add File: hello.txt\n+hi\n*** End Patch" } }
```

So on Codex the G0 gate is exactly as good as the envelope parser is. Verbs are
`*** Add File:`, `*** Update File:`, `*** Delete File:` and `*** Move to:`, and a
header must begin its line — body lines always carry a `+`, `-` or space prefix,
which is what stops `+*** Add File: decoy.ts` from being read as a header.

## C6 — PowerShell, and the failure is silent

The hook command form that Claude Code needs is the form that disables the gate
here. This exact command, on Windows:

```
command -v node >/dev/null 2>&1 && node "${CLAUDE_PLUGIN_ROOT}/…/il.mjs" pre-bash || true
```

produced `hook: PreToolUse Failed` — **and the tool call then ran normally.**
Codex fails open on a hook that will not start, so a gate configured this way is
not a weakened gate, it is no gate, and nothing says so except one line of
scrollback.

The fix is `commandWindows`, a per-handler alternative Codex prefers on Windows:

```json
{ "type": "command",
  "command":        "command -v node >/dev/null 2>&1 && node \"${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs\" pre-bash || true",
  "commandWindows": "if (Get-Command node -ErrorAction SilentlyContinue) { node \"${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs\" pre-bash }" }
```

Measured: the PowerShell form runs and blocks. Claude Code ignores the extra key
and `claude plugin validate --strict` passes with it present, so one `hooks.json`
serves both hosts. `test/hooks-config.test.mjs` is what keeps it that way.

## C7 — there is no attested agent identity

`agent_type` is in the `PreToolUse` schema but Codex does not populate it, and
`spawn_agent` documents its own `agent_type` as *"Agent type override for the new
agent"* — a model-supplied argument. On Claude Code the harness attests it, which
is the entire reason `only il-verifier may write VERIFY.md` means anything.

There is no way to recover identity attestation here, and current `spawn_agent`
also has no per-agent environment parameter. Building a fixed packet therefore
arms one signed, 10-minute, single-use write to its judgement file. `/il:doctor`
calls this a capability convention, not identity proof. The G0 gate, which is the
load-bearing claim, does not depend on this.

## C8 — plugin hooks exist, but need trusting once

Plugins are discovered from `.codex-plugin/plugin.json`; `hooks/hooks.json` is
picked up by default component discovery. Do **not** add a `hooks` field to the
manifest — the installer's validation rejects it.

Codex sets `CLAUDE_PLUGIN_ROOT` and `CLAUDE_PLUGIN_DATA` for plugin hooks (under
`~/.codex/plugins/`), and substitutes `${CLAUDE_PLUGIN_ROOT}` in both `command`
and `commandWindows`. That is why host detection reads the *paths* and not the
variable names.

The trust step is the trap. A freshly installed plugin's hooks are **not trusted**,
and an untrusted hook is skipped without a word:

```
$ codex exec "…"                                  # hook never ran, tool proceeded
$ codex exec --dangerously-bypass-hook-trust "…"  # hook ran, tool blocked
```

Accept the prompt once in the TUI (`/hooks`) and it is recorded as a
`trusted_hash` in `config.toml`. Until then the gate is off. This is the first
thing `/il:doctor` should be run to rule out.

## Not measured on Codex

- **MCP tool names.** The `pre-mcp` handler matches `^mcp__.*`, which is Claude
  Code's naming. Codex has a `non_prefixed_mcp_tool_names` feature flag, so it
  clearly prefixes them by default — but with what was never checked, so assume
  the MCP row of the README's table does not apply on Codex until someone
  measures it. Everything else in the gate is tool-name-exact and verified.
- **macOS and Linux.** Every measurement above is Windows, where `commandWindows`
  is the branch that fires. The POSIX `command` branch has never been driven under
  Codex on any platform.
- **The TUI trust prompt.** Confirmed only by its absence: hooks did not run until
  `--dangerously-bypass-hook-trust` was passed. The `trusted_hash` in `config.toml`
  is read from the binary's config schema, not from a run that produced one.
