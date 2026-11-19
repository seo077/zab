# References — Excel tools and pitfalls (`spreadsheet` track)

> This is what needs to be known (knowledge). Do not read it whole; take out and look at only the section needed. The procedures to follow are in `skills/`, and what to keep to is in `rules.md`.
> The sources are facts written in the build summaries and verification summaries of the reference case `03. 회로분석_TDSCU/log/` — attached line by line. (T6 = 블록도정리 (block diagram cleanup), T7 = 임피던스가이드 (impedance guide), T9 = 아트웍대응 (artwork response), T10 = 테스트케이스 (test cases))

---

## 1. Surveying input characteristics · reading values

| What | How to look | Pitfall | Source |
|---|---|---|---|
| Presence of shapes · pictures · charts · comments | An xlsx is a zip — extract the part list with `zipfile`: `xl/drawings/` · `xl/media/` · `xl/charts/` · `xl/comments*` · `xl/threadedComments/` · `xl/richData/` | With openpyxl, shapes · threaded comments · in-cell pictures are not visible or are dropped when saving again | T10 A1_R1 M-1 |
| Data validation · conditional formatting · merges · print settings · defined names | `dataValidations` · `conditionalFormatting` · `mergeCells` · `pageSetup` in the sheet XML, `definedNames` in `workbook.xml` (openpyxl `merged_cells` · `page_setup` can also be used for reading) | | T10 A1_R1 §11 · A1_R3 §10 |
| Formulas and computed values | Open the same file twice, with `data_only=False` (formulas) · `data_only=True` (computed values as of the last save) | A file made with openpyxl has empty computed values (they appear only when Excel recalculates) | T7 B2_R1 T7-1 |
| Text that looks like numbers | Enter it as text (e.g. serial number `0012`) — entered as a number, the leading 0s disappear and the display changes | | T10 M-18 |
| Empty cells | Count `None` (empty cell) and `''` (empty string) separately. A cell with no data is not left empty; fill it with the one fixed unconfirmed marker — a blank cannot be told apart from an omission | | T7 B2_R1 X-1 · T9 B2_R1 T9-13 |
| How to count | First decide, and write down, whether the empty lines and empty cells of the source material are excluded from or included in the count — counting with them excluded once made the sequence numbers wrong | | T9 B2_R1 X-1 |
| Another version with the same name | Even with the same file name · Rev · date the content can differ — there was a case told apart only by SHA-256 · file time · `docProps/core.xml` | Values written from material with mixed versions end up with a different version label on each sheet | T10 검증기준 · T6 091 검증요약 |

## 2. Excel COM (pywin32)

| Know-how | Why · case | Source |
|---|---|---|
| Launch a **new instance** with `win32com.client.DispatchEx("Excel.Application")`, with `Visible=False` · `DisplayAlerts=False` | `Dispatch` · `GetActiveObject` can attach to the user's running Excel | T6 A4 · A6_2차 · A7 |
| When done, the script `Close`s its own workbook and `Quit`s its own instance, then takes the EXCEL.EXE list again and checks that nothing is left | Even after `Quit` the process stayed for a few seconds (T6 A1), or stayed for good (T6 A3 · A5). The command to end one's own process was also once denied by the permission decision (T6 A3 · A6) — in that case do not work around it; write the remaining PIDs and hand back | T6 A1 · A3 · A5 · A6 |
| **One at a time**, run in the foreground | One run in the background could not be stopped, three ran overlapping, and an instance was left behind | T6 A6 |
| Do not mistake a child instance of the user's Excel (one launched with `/Embedding`) for your own — treat every PID that was running before the run as the user's | | T6 A3 |
| Import `pythoncom` first, on the script's first line | When another module (pymupdf) was imported first, reading COM properties failed | T6 A6_2차 |
| Backup: a file copy if the file is closed, `SaveCopyAs` if the workbook is open | If a backup of the same name exists, stop | T6 A3 · A6_2차 |
| On saving, Excel may rewrite `printerSettings*.bin` and newly create the print scale attribute (`scale`). To keep fit-to-page, first set `Zoom=100`, then set `Zoom=False` · `FitToPagesWide=1` · `FitToPagesTall=False` in that order | With `Zoom=False` alone, `scale=39` remained | T10 A1_R1 §12-1 · A1_R3 §9-2 |
| Color values are `R + G×256 + B×65536` (BGR order) | | T6 A2 §7.2 |
| Partial formatting of text is `TextFrame.Characters(start, len).Font` | `TextFrame2.TextRange.Paragraphs(i)` raised an error | T6 A2 §7.2 |
| Shape adjustment values are `Adjustments.SetItem(i, v)` | `Adjustments.Item[i] = v` had no effect | T6 A2 §7.2 |
| If you have to attach to an open workbook, take hold of only that file with `GetObject(<full path>)` and first print `FullName` · `Saved` · `ReadOnly`. If `Saved=False`, stop | So as not to mix in and save what the user was editing | T6 A3 · A5 |
| The permission decision has treated **shape deletion and creation** as "irreversible deletion" and denied it. If the same result can be produced by property changes alone (position · size · text), fix it that way in the layout | The method of opening in a new instance and applying after the user closed Excel has been allowed | T6 A2 · A3 M-A3-3 · A4 |

## 3. Handling shapes (block diagrams)

| Know-how | Source |
|---|---|
| Edit with COM; check by reading `xl/drawings/drawingN.xml` inside the zip (anchor cell number + EMU offset). Saving with openpyxl erases rich text | T6 A3 · A6 |
| Shape names can collide (names differing only in letter case · several with the same name) — find them by name together with stacking order | T6 A3 · A5 |
| An existing connector may be a free straight line not attached to a shape — check first with `ConnectorFormat.BeginConnected` | T6 A2 · A5 |
| The coordinates Excel reads out fluctuate by 1~2.7 % depending on the active sheet and the saved view zoom — compare after applying by **anchors**, not coordinates. Shapes are `Placement=3` (don't move or size with cells) | T6 A3 · A4 · A5 |
| Placement is **calculated in a variable block at the very top** rather than fixed values — so that the block diagram is fixed first and the zones follow its size. It came to this after the user asked four times for a placement fitted to a fixed width to be redone | T6 A3 · A6_2차 M-A6-R2-10 |
| If a text box's height is short, the last line is cut off in PDF and print even though it fits on screen — size it as line count × font size plus generous line spacing (about 2×) and margins | T6 A2 · A6_2차 M-A6-R2-11 |
| The view zoom is the user's to set — the script does not change it | T6 A3 M-A3-7 |
| To check as a picture, open a **copy** in a new instance, export a PDF with `ExportAsFixedFormat`, and then convert it to an image. Do not do it on the working copy (the print area changes) | T6 A2 · A6_2차 |
| The font size · color · title block form of an earlier sheet that the user accepted are carried over as is to the next sheet (example of an accepted font hierarchy: minimum 12 pt) | T6 A4 M-A4-2 · A6_2차 · A7 M-A7-4 |

## 4. Handling tables

| Know-how | Source |
|---|---|
| Form filling: open a copy of the baseline with COM and modify **only values and fills.** Handling it with wording, without deleting or inserting rows, keeps the form's end marker and formatting | T10 A1_R1 · M-R2-3 |
| Making it **again from the baseline from scratch** every round keeps "changed cells = color-marked cells = record" relative to the baseline | T10 A1_R2 M-R2-1 · A1_R3 M-R3-1 |
| The height of a modified row is only increased, never reduced | T10 M-16 |
| For the data validation of a cell that is no longer used, remove only that cell from the range (so that no dropdown list remains) | T10 A1_R3 M-R3-9 |
| It is confusing when print title rows are also printed on another table's pages — keep the repeating rows and put in a guidance sentence | T10 B2_R1 X-3 · A1_R3 M-R3-8 |
| Example of the basic form of a newly created table: column widths set · `wrap_text` · freeze panes on the header row · AutoFilter · print orientation. Do not put internal symbols or paths in a recipient-facing sheet | T9 A1_R2 M-R2-7 · M-R2-12 |
| Without launching Excel, the screen rendering (clipped text) cannot be seen directly — write in the build summary the fact that column widths are estimated by character count (full-width 2 · half-width 1) | T9 A1_R2 §5-3 |

## 5. Places where notation wavered

| Case | Source |
|---|---|
| Two notations for the same dimension (`13 × 2 mm` / `13.0 × 2.0 mm`) — unify to one notation and leave verbatim quotations as they are | T9 B2_R1 · A1_R2 M-R2-3 |
| The marking grade for the same value split into two — first fix the grade rule in writing | T9 A1_R2 M-R2-2 |
| Define the status words (open · closed) first and align them with what the sheet shows — an open question once remained with no trace in the sheet | T10 A1_R1 M-4 · B2_R1 X-1 |
| Synonyms (labels) mixed between sheets · hyphens and dashes mixed · abbreviations without explanation · traces of work (EMU values · `%d`) | T6 A1 M-R2-19·20 · A4 · A5 |
| Wording that went stale as rounds passed (reflected location, etc.) remains — at every new version check again whether the wording is still true | T10 B2_R2 X-1 |
