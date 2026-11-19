> Kind: instruction · When: **output A** of a `spreadsheet` Task makes or modifies in `output/` the working copy xlsx of the target "table" (cell grid) as the approved layout document says · Tools: shell (`sha256sum`·`ls -la`·`tasklist`) · Python (`py`) + openpyxl · (if the layout fixed COM) pywin32 · `zipfile`

# A skill — output/table

> Makes the approved layout (the decisions written with `layout/table`) into an actual xlsx. Counterpart: layout skill `layout/table`.
> What to keep to is `../../rules.md` (especially §3 safety · §4 checks before starting · §7 change record). The form of the change record is `../../references/change-record-template.md`. Tool know-how is in `../../references/excel-tools-and-pitfalls.md` §2 · §4.
> Procedure steps ① ~ ③ · ⑤ · ⑥ · ⑦ · ⑪ of this skill are borrowed by `output/block-diagram` (the borrowing side states the procedure step numbers).

## Applicability — starting point (what §1 of the approved layout fixed)

| Starting point | What differs in this skill |
|---|---|
| Baseline · edit · Baseline · form | Start by copying the baseline into `output/`. Do ⑤ backup · ⑦ color marking · ⑨ change record. For a form, do not touch the layout's list of cells to leave empty |
| No baseline · first version (R1) | Make it new from the source material. No backup · color marking · change record (D-59 G-4) — write "R1 not applied" in the build summary |
| No baseline · R2 and later | Continue from the previous version (the current working copy) and take the backup from that version too. The original for the change record's original values and for the color marking is the **R1 version** — in R3 and later too (`../../rules.md` §7). Otherwise do as for baseline · edit |

## Procedure

① **Check the approval fingerprint** — measure the SHA-256 of `log/T{N}_<job>/design-spec.md` and check that it equals the approved value the call message gave. If it differs, stop here.
② **Start check** — `rules.md` §4 (lock · EXCEL.EXE PID · working copy fingerprint). Measure the SHA-256 of every input and check that it equals the values in §2 of the layout document — if it differs, stop.
③ **Working copy location** — the working copy path in layout §1. If there is a baseline, copy the baseline to that location and check that the SHA-256 equals the baseline's. If a working copy already exists (R2 and later), do not delete it; leave it as is.
④ **dry** — for each layout §6 decision (L-number), extract what will change as a list of sheet · cell · before value · after value (nothing is written yet). Keep the list as the dry list file of `../../rules.md` §3 (`<working-copy name>_dry_<step>.md`) and count its lines. If a place comes up that has to be guessed because the layout did not fix it: if it is a formatting detail, decide it and record it as M-N; if it is content or structure, stop (`rules.md` §6).
⑤ **Backup** — immediately before writing, make `<working-copy name>.pre<step>.bak` and check that its SHA-256 equals the current working copy's. If the same name exists, stop. Do the lock · Excel check of ② **once more at this point.**
⑥ **apply** — write with the tool the layout fixed.
   - openpyxl: open the working copy, write the values and formatting, and save. If the file's baseline has shapes · comments · pictures · data validation, do not save with openpyxl (the layout will have fixed COM — if not, stop).
   - COM: with a new `DispatchEx` instance · `Visible=False` · `DisplayAlerts=False`, open only the working copy, write the values and fills, save · close · `Quit` your own instance. If there are fit-to-page print settings, set them again in the order given in `excel-tools-and-pitfalls.md` §2.
   - After everything is written, extract what actually changed by comparing cell by cell with the immediately preceding backup (omitted for the first version with no baseline), and compare it with the ④ dry list. Write the differing lines and why in the build summary — do not modify the dry list file.
⑦ **Color marking** — fill the cells whose value changed in this version with the marking color of layout §8. For merged cells, the top-left cell. Cells returned to the original value are returned to their original fill. Do not add any fill color other than the formatting changes the layout fixed.
⑧ **Formatting · recipient-facing notation** — keep the formatting decisions of layout §6 (column width · wrap text · number format · frozen header row · print) and the one format for cells of the same role. Row heights are only increased. Do not put internal symbols or paths in a sheet that goes to the recipient. Write the text people read (vocabulary · sentences · tone) as in `../../rules.md` §10.
⑨ **Change record** — append this version's section as in `change-record-template.md`. The cell lines are exactly the set of this version's changes extracted in ⑥, and the original value is the cell value of the **original (baseline).**
⑩ **Open it yourself** — reopen the saved working copy with openpyxl (no exception raised), count the sheets · the non-empty cells per sheet, and look at the result of `zipfile.testzip()`. If there are formula cells, check whether the computed values are empty, and if they are, write that fact. Search by string for whether error values such as `#REF!` that were not in the baseline have appeared. If there is a baseline, compare the part counts · merge counts · defined names of the preservation list (layout §7) with the baseline again.
⑪ **Final check** — whether the SHA-256 of the input · baseline · layout document equals ① ② · whether no `~$` · temporary file · `__pycache__` is left in the output folder · whether your own Excel instance is not left behind (whether the EXCEL.EXE list is exactly the PIDs at start).

## What else to write in the build summary

- The skill path name used (`output/table`) · the SHA-256 of the approved layout (the value measured in ①)
- Input fingerprints · working copy SHA-256 · size · backup names and SHA-256 · change record file path
- Results of the start check and of the check immediately before apply · if there was a permission denial, that fact and how it was handled (if there was none, "none")
- The tool used and the commands run · for each dry list file the path and SHA-256 · line count and number of actual changes · why lines differ (`../../rules.md` §3 — the list itself is not copied in)
- List of places done differently from the layout (formatting details, M-N) · list of remaining items needing confirmation
- The full text or the core of the script used for writing, and its SHA-256 (the temporary folder may disappear when the session ends)
