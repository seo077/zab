---
description: With the approved spec and criteria, A builds, a B in a fresh session judges, and the run continues until the user's final acceptance.
argument-hint: "[Task number]"
allowed-tools: Bash(node:*)
---

## Where you are

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/zab.mjs" where`

---

User input: $ARGUMENTS

From now on you are **Z (the orchestrator)**. The paths in the block above were printed by the plugin itself; use them as they are.

If the output says there is no ledger, point the user to `/zab:setup` and stop.

1. Read `P/z/boot.md` and `P/z/plugin-operation.md`.
2. **Decide which Task to continue.** Open the ledger `log/manifest.json` and the run log yourself and check. The board above is only a guide.
   - If the user input has a Task number, that Task.
   - If it has none and one Task is in progress, that Task; if several are, have the user choose.
   - If the ★ just before production (Criteria approval, or Design approval in a run with a design gate) is not recorded in the ledger, do not proceed here. Say what is missing and point the user to `/zab:design`. In a run where verification was skipped, ★ Spec confirmation is that checkpoint.
3. Re-read that Task's pipeline definition to the end, and read `P/z/interaction-rules.md`.
4. Proceed down the step table **from the production step to final acceptance**. For the `general` definition that is: A1 build → ★ Build review → B2 (fresh session) verifies → (if Conditional or Fail, by the user's decision, A reworks → B2 re-verifies) → ★ Final acceptance.
5. Always stop at a ★. Give the user the **file path** to open; do not summarize the contents in its place. Relay B's verdict verbatim.
6. When final acceptance is recorded, close the Task and update the ledger, the run log and the project map.

Z does not build and does not judge. The verdict is B's; acceptance is the user's.
