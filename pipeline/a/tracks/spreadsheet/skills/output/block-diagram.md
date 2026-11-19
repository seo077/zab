> Kind: instruction · When: **output A** of a `spreadsheet` Task draws or modifies the target "block diagram" (shapes) in the `output/` working copy as the approved layout document says · Tools: shell (`sha256sum`·`ls -la`·`tasklist`) · Python (`py`) + pywin32 · `zipfile` · XML parser · openpyxl (read only)

# A skill — output/block-diagram

> Makes the approved layout (the decisions written with `layout/block-diagram`) into actual shapes. Counterpart: layout skill `layout/block-diagram`.
> What to keep to is `../../rules.md`. The form of the change record is `../../references/change-record-template.md`. Shape know-how is in `../../references/excel-tools-and-pitfalls.md` §2 · §3.
> Shapes are **written only with COM.** Do not save with openpyxl (rich text and shapes are erased).

## Applicability — starting point (what §1 of the approved layout fixed)

| Starting point | What differs in this skill |
|---|---|
| Baseline · edit · Baseline · form | Start by copying the baseline into `output/`. Do backup · change record (shape table) |
| No baseline · first version (R1) | No backup · change record (D-59 G-4) |
| No baseline · R2 and later | Continue from the previous version (the current working copy) and take the backup from that version too. The original for the change record's original values ("Before" in the shape table) and for the color marking (when cells were modified along with them) is the **R1 version** — in R3 and later too (`../../rules.md` §7). Otherwise do as for baseline · edit |

## Procedure

① **Approval fingerprint · start check · working copy location** — same as `output/table` procedure steps ① ~ ③.
② **Placement calculation** — move the blocks · connections · placement rules of layout §6 into a variable block at the very top of the script, and, without Excel, calculate the coordinates and first measure overlap · text overflow (text box height) · line crossings. If a place comes up that the rules alone do not determine uniquely, stop and hand back.
③ **Trial on a copy** — open a copy of the working copy in a new instance and try applying, and compare before and after by anchors to check that other sheets did not change. If a picture check is needed, export to PDF from this copy and look at it as an image (do not do it on the working copy).
④ **dry** — for the working copy, extract the list of shapes that will change (name/id · property · before · after) and the list of cells that will change. If shapes are deleted or created, mark them separately in the list. Keep the two lists as one dry list file of `../../rules.md` §3 (shape table · cell table).
⑤ **Backup · apply · comparison after applying** — same as `output/table` procedure steps ⑤ · ⑥ (the tool is COM). The comparison after applying is done not by the coordinates Excel reads out but by the anchors in the drawing XML inside the zip.
⑥ **Color marking** — shapes are not filled (D-59 G-5). If cells were modified as well, fill only those cells as in `output/table` procedure step ⑦.
⑦ **Notation · readability** — keep layout §6's colors and legend · lines · arrows · font size hierarchy · labels read horizontally. Blocks of the same functional group get the same color and font. Do not change the view zoom. Write the text of shapes · text boxes (vocabulary · sentences · tone) as in `../../rules.md` §10.
⑧ **Change record** — append to the "Shapes" table of `change-record-template.md` only the shapes changed in this version (including deleted shapes · new shapes). If cells were modified, to the "Cells" table too.
⑨ **Open it yourself** — open the saved working copy as a zip, parse the drawing XML, count the shapes per sheet and compare with the counts in the layout's lists. Check that no block without a label · no shapes of the same name have newly appeared. Check `zipfile.testzip()` · that it opens with openpyxl (read only).
⑩ **Final check** — same as `output/table` procedure step ⑪.

## What else to write in the build summary

- The skill path name used (`output/block-diagram`) — the rest is the same as "What else to write in the build summary" of `output/table`
- The placement calculation variable block (values) · the paths of the trial on a copy and of the pictures · the number of shape deletions and creations
