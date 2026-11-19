---
description: Prepare this folder as a zab project — creates the input · output · log · pipeline folders and an empty ledger. Files that already exist are left untouched.
allowed-tools: Bash(node:*)
---

## Result

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/zab.mjs" setup`

---

The block above is what the setup script just did in this folder. Tell the user, briefly.

- Report what was created and what was left as is, exactly as the output says. Do not claim to have created a file that is not in the output.
- If `CLAUDE.md` is among the files left as is, say only that the existing file was preserved and that the template holds a form to consult if they want to add the zab guidance. Do not edit it yourself.
- Tell them to put their materials in `input/`, and that the next step is `/zab:design`.

Stop here. Do not open a Task or call a role.
