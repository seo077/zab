---
description: Check what interlocking can actually enforce on this installation.
allowed-tools: Bash(node:*)
---

## Environment

!`node "${CLAUDE_PLUGIN_ROOT}/hooks/il.mjs" doctor "${CLAUDE_PLUGIN_ROOT}"`

---

Relay the report above in a few lines.

Why this command exists: hook behaviour differs between Claude Code versions —
measured, not assumed (`docs/design/platform-facts.md` records two builds
disagreeing). Rather than pretending a guarantee it cannot deliver, the harness
measures its own environment and drops from enforcing to advisory when a
prerequisite is missing.

If anything is missing, say plainly what stops working. Do not describe the gate as
blocking if this report says advisory.
