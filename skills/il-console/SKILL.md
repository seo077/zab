---
name: il-console
description: Read interlocking's own reports — status, help, doctor, the design brief, and the packets the judgement agents run on. Use on Codex, which has no plugin slash commands, wherever the Claude Code documentation says to run /il:status, /il:doctor, /il:design or /il:help. Read-only; it cannot open a gate.
metadata:
  short-description: interlocking's read-only reports
---

# The interlocking console

On Claude Code these reports are slash commands. Codex has no plugin slash
commands, so they are reached through this skill instead. Everything here is
**read-only** — it reports what the harness has already decided. Nothing in this
file can open a gate, and you must never tell the user it did.

Every report comes from the hook binary itself, which means it reflects what is
actually enforced rather than what any document in the repo claims.

## Running a report

```bash
node "$CLAUDE_PLUGIN_ROOT/hooks/il.mjs" <mode>
```

`CLAUDE_PLUGIN_ROOT` is set for hook processes. It is **not** set for the shell
you are running in, so resolve it first and reuse it:

```bash
IL="$(ls -d ~/.codex/plugins/cache/*/il/*/ 2>/dev/null | sort | tail -1)"
node "$IL/hooks/il.mjs" status
```

On Windows PowerShell:

```powershell
$IL = (Get-ChildItem "$HOME\.codex\plugins\cache\*\il\*" -Directory | Sort-Object Name | Select-Object -Last 1).FullName
node "$IL\hooks\il.mjs" status
```

If that path does not exist, the plugin is not installed and no gate is running;
say so plainly rather than reporting a state you could not read.

## The modes

| ask for | mode | what it answers |
|---|---|---|
| `status` | `status` | phase, gate, next action, open assumptions, uncommitted work |
| `help` | `help` | what to do right now, wherever the feature is |
| `doctor` | `doctor` | what this installation can actually enforce — read this one before trusting the rest |
| `design` | `brief` | the design the human is being asked to approve, in full |
| `delta` | `delta` | after an amendment: which requirements moved, and which carry forward from the last approval |
| `preflight` | `preflight` | before verification: whether the programs the criteria name can actually be launched here |

`preflight` is the cheapest report in this table and the one most worth running
unprompted. A verification round that returns nothing but INCONCLUSIVE because a
program is missing costs a fresh agent reading every requirement; this answers
the same question in two seconds, before any of that.

Three more exist for the judgement agents and are not for general use:
`criteria-packet`, `review-packet`, `verify-packet`. Each prints the packet a
specific agent runs on. They are named in `il-spec` and `il-verify` at the point
where they are needed.

Onboarding is intentionally not a console mode because it writes project files.
When `status` or `help` recommends onboarding, invoke `$il-onboard`.

## Reporting back

Relay the output in a few lines. Two rules that matter:

- **`gate` comes from the signed store outside the repo**, not from `gates_passed`
  in `STATE.md`. That field is a human-readable mirror and can be wrong. If the
  two disagree, the store is right and the mismatch is itself worth reporting.
- **If a `⚠` line appears, lead with it.** It means something is enforcing less
  than the user thinks.

## What this skill cannot do

Opening the gate is not here and never will be. Approval is recorded by a
`UserPromptSubmit` hook reading what a human typed, so the only thing that opens
G0 is the person at the keyboard typing:

```
il approve
```

Nothing you run, print or suggest can substitute for that. If the user asks you
to approve on their behalf, tell them the hook only counts their own keystrokes,
and show them the line to type.
