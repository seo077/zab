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

- **`CLAUDE_PLUGIN_DATA` does exist on 2.1.233** (a 2.1.77 trace said otherwise). Still prefer
  it only as one rung of the ladder: `IL_HOME` → `CLAUDE_PLUGIN_DATA` → `~/.interlocking/`.
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
