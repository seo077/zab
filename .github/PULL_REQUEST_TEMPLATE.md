## What and why

<!-- The why matters more. If there is a trade-off, this is where the next person looks. -->

## Checklist

- [ ] `npm test` passes
- [ ] `claude plugin validate . --strict` passes
- [ ] Ran on my OS (say which — Windows path handling has bitten this repo twice)

If you touched the Bash analyser or `classify`:

- [ ] Added the case to `test/fixtures/bash-writes.txt` or the `classify` answer table
- [ ] Broke the fix on purpose and watched the test fail

If you added a SPEC-checker heuristic:

- [ ] `severity: 'warn'`, not `'block'` — blockers are only for machine-certain facts
- [ ] False-positive cases in the same commit

If you relied on new Claude Code hook behaviour:

- [ ] Measured it against the real binary and added it to `docs/design/platform-facts.md`,
      with the version. The documentation has been wrong here more than once.
