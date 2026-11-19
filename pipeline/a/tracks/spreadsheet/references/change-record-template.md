# References — change record file template (`spreadsheet` track)

> The form of the change record file that output A leaves together with the working copy. The rules are `rules.md` §7 (D-59 G-2~G-6 · D-60 G-10 · D-61 G-14 · D-70). The name and place are fixed by §8 of the layout document — default `output/T{N}_<job>/<working-copy name>_change-record.md`.
> Version sections are **appended** to one file. Sections of earlier versions are neither deleted nor modified.

---

```markdown
# Change record — <working-copy filename>

| Item | Value |
|---|---|
| Working copy | `output/T{N}_<job>/<filename>.xlsx` |
| Baseline (source of the original values) | `input/…` · SHA-256 (if no baseline, "the R1 version — `<working-copy name>.preR2.bak` · SHA-256. R1 is not recorded, recording starts from R2, and the original value is the R1 version's value in R3 and later too") |
| Marking color | `FF……` (layout document §8) |
| Approved layout | `log/T{N}_<job>/design-spec.md` · SHA-256 |

## R<M> — YYYY-MM-DD

| Item | Value |
|---|---|
| This version's working copy SHA-256 · size | |
| Backup immediately before editing | `<working-copy name>.pre<step>.bak` · SHA-256 (add a line if there are several steps) |
| Line count of this section · expanded cell count | |

### Cells
| # | Sheet | Cell (or range) | Original value (original) | Changed value | Basis | Layout decision |
|---|---|---|---|---|---|---|

### Shapes (no color marking, only here)
| # | Sheet | Shape name / id | Property changed | Before | After | Basis | Layout decision |
|---|---|---|---|---|---|---|---|

### Non-value changes (formatting · column width · row height · print settings · sheet order · merges · row/column insertion/deletion)
| # | Sheet | Location | What | Before → after | Basis |
|---|---|---|---|---|---|
```

## How to fill in the cells

| Cell | How |
|---|---|
| Cell (or range) | A cell that had an original value: **one line per cell.** Only newly filled cells · new rows · new columns may be grouped as one range line (`C5:C40`) (G-14) |
| Original value (original) | **The value of the original (baseline) cell**, character for character (including line breaks). It is the same in every version section (G-2 · G-10). With no baseline (new creation), the original = **the R1 version** — the R1 version's value even in sections of R3 and later (D-70 · `rules.md` §7). A cell that was originally empty is written as `(empty)` |
| Changed value | The value of the cell in that version's working copy, character for character |
| Shape table "Before" · "After" | "Before" is **the value of that shape property in the original (baseline)** — like a cell's original value, the same in every version section (G-2 · the R1 version if no baseline). A shape that was not in the original is `(none)`. "After" is the value in that version's working copy, and a deleted shape is `(deleted)` |
| Lines carried in this version's section | **Only the cells and shapes newly changed in this version** — what changed in this version compared with the immediately preceding backup (G-10). Lines of earlier versions are not carried again |
| Cells returned to the original | Leave a line — changed value = original value. The color marking is returned to the original fill |
| Basis | Material (file · section · page · row) · user decision (date · the user's words) · layout decision number. Pipeline words such as verification report numbers and ★ are not written (`rules.md` §7) |
| Row/column insertion/deletion | Write it first under "Non-value changes" — so that the reader can account for the cell addresses below it having shifted |

- The change record file itself is a file outside the working copy, so it is not subject to color marking.
- If there is a spec asking for the change record to be shown as a sheet inside the working copy as well, that sheet is made as a layout decision, and the master of the record remains this file.
