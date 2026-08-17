# Captured hook payloads

Real `stdin` payloads recorded from Claude Code **2.1.233** by wiring a probe as an
actual hook and driving it with headless runs. They exist so that the contract tests
are written against what the platform *does*, not what the documentation says it
does — the two have disagreed here more than once.

The findings drawn from these captures are written up in
[`docs/design/platform-facts.md`](../../../docs/design/platform-facts.md).

## Scrubbed

Machine identity has been replaced; **shape and field names are untouched**, because
the shape is the whole point:

| Was | Now |
|---|---|
| the capturing machine's username in paths | `USER` |
| session / prompt UUIDs | `00000000-0000-4000-8000-00000000000N` |
| temp and scratch paths | `<TMP>` |

If you add a capture, scrub it the same way before committing. A payload carries the
transcript path, which points at a real conversation on a real disk.

## Re-capturing

The probe that produced these was deliberately thrown away once the findings were
written down — it ran on every tool call, and a debugging tool that outlives its
question becomes a liability. To capture again, wire a small script as a hook that
writes its stdin to a file, and drive it with `claude -p`. The method is described in
`platform-facts.md`.
