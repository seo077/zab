---
description: Bring a project made by the Korean release of zab (Korean file names and ledger keys) to the current English layout. Shows what would change first; pass "apply" to do it.
argument-hint: "[apply]"
allowed-tools: Bash(node:*)
---

## Result

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/zab.mjs" migrate $ARGUMENTS`

---

The block above is what the migration script just reported for this folder. Tell the user, briefly.

- If it says "Dry run", nothing was changed. Show the list of renames as printed and tell the user that `/zab:migrate apply` carries it out. Do not run it yourself.
- If it says "Migrated", report what was renamed and that the old ledger is kept as `log/manifest.ko.json`.
- If anything is listed as "left alone", show those lines as printed — both files exist and the user decides which to keep. Do not merge or delete them yourself.
- Say what the script did not change, as printed: the text inside the records still cites the old names.

Stop here. Do not open a Task or call a role.
