---
description: Show where this feature stands — phase, gate, next action, open assumptions, uncommitted work.
allowed-tools: []
---

## Current state

!`node "${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs" status`

---

The block above is produced by the il hook itself, so it reflects what is actually
enforced rather than what any document claims. In particular, `gate` comes from the
signed approval store outside the repo, **not** from `gates_passed` in `STATE.md` —
that field is a human-readable mirror and can be wrong.

Relay it to the human in a few lines. Do not re-read `STATE.md` to "check"; if the two
disagree, the store is right and the mismatch is itself the finding worth reporting.

If a `⚠` line appears, lead with it.
