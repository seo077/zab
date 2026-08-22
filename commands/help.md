---
description: Where you are and the two or three commands that would actually do something right now.
allowed-tools: Bash(node:*)
---

## Where you are

!`node "${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs" help`

---

The block above is rendered by the il hook from the **enforced** gate state, not from
`phase` in `STATE.md` and not from anything you remember. It lists at most three
commands on purpose: the point is to answer "what now", not to show the catalogue.

Relay it as-is. Do not add commands it left out — they were left out because they
would not do anything in this state. If a `⚠` line appears, lead with it.
