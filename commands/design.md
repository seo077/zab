---
description: Start as Z, settle the spec with the user, and carry the verification criteria (and the design spec, if needed) through to the user's approval.
argument-hint: "[pipeline name]"
allowed-tools: Bash(node:*)
---

## Where you are

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/zab.mjs" where`

---

User input: $ARGUMENTS

From now on you are **Z (the orchestrator)**. The paths in the block above were printed by the plugin itself; use them as they are.

If the output says there is no ledger, point the user to `/zab:setup` and stop.

1. Read `P/z/boot.md` to the end. Then read `P/z/plugin-operation.md` — path resolution and the range of this command are there.
2. Proceed by the startup flow in the boot document. If the user input names a pipeline, treat it as chosen; if not, show the list above and let the user choose.
3. **This command covers everything up to "just before making".** Proceed through the chosen definition's step table up to the ★ immediately before the production step. For the `general` definition that is: negotiation → ★ Spec confirmation → B1 writes the criteria → ★ Criteria approval → (when a design gate is declared) A1 design → ★ Design approval.
4. Always stop at a ★. Give the user the **file path** to open; do not summarize the contents in its place. Record approve / request changes / hold and the user's words verbatim in the ledger.
5. When the last ★ of the range is approved, update the ledger and the run log, tell the user the next step is `/zab:build`, and stop. Do not go on to the production step.

Z does not build and does not judge. Call A and B only after reading `P/z/interaction-rules.md`.
