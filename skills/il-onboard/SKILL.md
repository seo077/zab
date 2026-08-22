---
name: il-onboard
description: Bring an existing repository under interlocking without starting a feature or retroactively gating existing code. Use when a repo has no .interlocking directory, or when the user asks to initialize, onboard, or adopt interlocking in an existing project.
metadata:
  short-description: Initialize interlocking in an existing repo
---

# Onboard an existing repository

Set up the harness without creating a feature. Existing code remains untouched
and ungated; the G0 gate begins only after `$il-spec` creates the first active
feature.

## Procedure

1. Read the repository before writing anything. Establish the languages, layout,
   build and test commands, and conventions demonstrated by the code.

2. Resolve the installed plugin root. On Windows PowerShell:

   ```powershell
   $IL = (Get-ChildItem "$HOME\.codex\plugins\cache\*\il\*" -Directory |
     Sort-Object Name | Select-Object -Last 1).FullName
   ```

   On POSIX shells:

   ```bash
   IL="$(ls -d ~/.codex/plugins/cache/*/il/*/ 2>/dev/null | sort | tail -1)"
   ```

   If no installed root exists, stop and report that the plugin is not installed.

3. Create `.interlocking/work/`. Copy the installed `templates/CONTEXT.md` and
   `templates/policy.json` to `.interlocking/` only when the destination does not
   already exist. Never overwrite an existing harness file during onboarding.

4. Fill `CONTEXT.md` from repository evidence:

   - stack and constraints that can be pointed to;
   - domain terms with project-specific meanings;
   - principles only when code or maintained configuration demonstrates them.

   Keep the principles section within 40 lines and the whole file within 200.
   Do not create `.interlocking/current` or a feature directory.

5. Tune `policy.json` to the real repository layout. `code` globs should cover
   actual source roots, and `verify.commands` should contain commands verified to
   exist. Do not guess a command or run a destructive/build-publishing command.

6. Show the proposed paths and verification commands to the user. Do not commit
   unless the user asked for a commit. Report that existing code is still ungated
   and the first gate closes only when `$il-spec <feature>` starts a feature.

Widening `always_allow` later requires the human to type `il policy`; narrowing
takes effect immediately. Onboarding itself never opens or approves a gate.
