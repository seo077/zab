> Kind: instruction · When: **layout A** of a `spreadsheet` Task writes the layout document (`log/T{N}_<job>/design-spec.md`) for the target "table" (cell grid) · Tools: shell (`sha256sum`·`ls -la`·`tasklist`) · Python (`py`) + openpyxl · `zipfile`

# A skill — layout/table

> Fixes the **shape and content rules** of a table deliverable — sheets · columns · rows · basis of values · form frame. Counterpart: output skill `output/table`.
> The form of the document is `../../references/layout-doc-template.md`. This skill gives what table work additionally fixes in that template's §6 decisions section, and the procedure. What to keep to is `../../rules.md`.

## Applicability — starting point

| Starting point | What differs in this skill |
|---|---|
| Baseline · edit | Do procedure step ④ baseline measurement · ⑥ sheet composition compared with the baseline · ⑪ merge changes (if any) |
| Baseline · form | In addition to the above, do ⑧ form frame · cells to leave empty |
| No baseline | Write ④ · ⑧ as "N/A (no baseline)". ⑦ column definitions without omission. The change record plan is "R1 not applied (D-59 G-4)" |

## Procedure

① **Start check** — look at the lock · running Excel of `rules.md` §4 and write them down. Measure the SHA-256 · size of every input and write them in template §2.
② **Make copies** — copy the input into your own dedicated temporary folder and check that the copy's SHA-256 equals the original's. From then on read only from the copy.
③ **Read the preferences file** — in `b/tracks/spreadsheet/references/user-preferences.md` find the lines that bear on the target "table" and on this Task's subject (`rules.md` §8). Note the numbers of the applicable lines.
④ **Baseline measurement** (with a baseline) — as in `../../references/excel-tools-and-pitfalls.md` §1, read the zip parts · sheet XML · `workbook.xml` and fill in the characteristics table of template §4 and the preservation list of §7. Extract the fill-color distribution at this point too (used when choosing the marking color).
⑤ **Read and analyze** — read the sheets and ranges the spec points to, and write the range read (whether hidden · filtered · merged · text inside shapes · comments were included) in template §3. Analysis results go in §5 together with cell positions. Counts and sums are counted by script, and the conditions are written down.
⑥ **Sheet composition** — for each sheet: name · order · role. If there is a baseline, set it side by side with the baseline's sheet list and write the sheets to keep · remove · add. If the recipient needs an explanation, fix it as an explanation sheet inside the same file.
⑦ **Column definitions** (a newly made table · when adding columns) — for each column: name · meaning · whether required · value format (number · unit · date · text) · **one unconfirmed marker to write when there is no value** (do not leave it blank).
⑧ **Form frame** (baseline · form) — the frame to keep (header row · column header wording · merges · end-row marker · print settings · data validation) and the **list of cells to leave empty** (result cells · signature · approval · fields the user fills in). How merges, the end marker and the print area are moved when rows increase or decrease — if it can be handled without inserting rows, choose that method first.
⑨ **Row population** (a Task that makes a list of rows) — what the rows are a list of · which input they are drawn from · how many · the key that separates rows. Rows added from outside the population get a basis attached.
⑩ **Rule for the basis of values** — how the basis is written for each cell (file · section · page · row) · how values confirmed from the material are separated from proposed · conventional · estimated values (with one marker) · when bases differ from each other, do not pick one side; take it to §9 open questions.
⑪ **Merge changes** (when changing merges) — the list of ranges to unmerge and re-merge, and where the values that were in cells other than the top-left cell are moved to / whether they are discarded + basis.
⑫ **Value decisions** — for each cell to change (fill): write sheet · cell/range · before → after (or the value rule) · basis in the template §6 table with an L-number.
⑬ **Formatting** — what the use of the result needs: column width · wrap text · number format · frozen header row · print orientation and fit. Cells of the same role (header row · body · guidance) are fixed to one format. If a line in §3 of the preferences file applies, follow it here.
⑭ **Recipient-facing notation** (a file delivered to a person) — the place for explaining abbreviations and symbols · the place for the version and input identification notation. Internal working symbols (M-N · G-N · verification words) and internal paths are not put in the file. Fix the tone of the text people read and the source of the terms as in `../../rules.md` §10 and write them in template §6 with L-numbers.
⑮ **Tool** — choose the output tool from the characteristics of ④ and write the reason in template §4 (`rules.md` §5).
⑯ **Change record plan** — marking color RGB (not overlapping the fill-color distribution of ④) · record file name and place · this version (template §8).
⑰ **Open questions · preferences applied · satisfaction conditions** — fill in template §9 · §10 · §11.
⑱ **Final check** — measure the input SHA-256 again and check that it equals ①. Check that nothing was made in `output/`. Keep the copies and scripts of the temporary folder only inside your own folder.

## What else to write in the build summary

- The skill path name used (`layout/table`) · the layout document's path and SHA-256 · input fingerprints (start · finish)
- Start check results (lock · EXCEL.EXE PID)
- The location and key conditions of the scripts used for analysis (the temporary folder may disappear when the session ends, so leave in writing the conditions needed to count again)
