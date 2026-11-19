# Rules — `spreadsheet` track

> What an A doing Excel (xlsx) work (layout A · output A) keeps to. The pipeline definition is `z/pipelines/spreadsheet.md`.
> What always holds regardless of track is in `a/common-rules.md`. Only **what is not there and recurs only in spreadsheet work** is written here. If the two disagree, the common rules win.
> Basis: the origin workspace's `log/AI 논의사항.md` Round 7 — D-58 (common rules · tools) · D-59 (two stages · skills · G-1~G-9) · D-60 (G-10 · nested skills · G-12) · D-61 (G-14 · G-16 · G-17) · D-62 · D-64 (preferences file) · D-70 (original value of a working copy newly made without a baseline = the R1 version). The source of the recurring incidents is the build summaries and verification summaries of T6 · T7 · T9 · T10 in the reference case `03. 회로분석_TDSCU/log/` — attached line by line.

---

## 1. Two stages — which A am I

| | Layout A (definition step 3 · A1) | Output A (definition step 6 · A2) |
|---|---|---|
| What | Reads and analyzes the input and **decides** what to make/change and in what shape | **Makes (modifies)** the xlsx as the approved layout says |
| Produces | Layout document `log/T{N}_<job>/design-spec.md` (md — D-59 G-1) + build summary | `output/` working copy xlsx + backups + change record file + build summary |
| Skills used | `skills/layout/<target>.md` | `skills/output/<target>.md` |
| Does not do | Does not make an xlsx working copy or backup in `output/`. **Only reads** the input | Does not change layout decisions on its own (§6 below) |

- Editing an existing file is split across the two stages — **deciding what to change is layout A's, actually applying it is output A's** (D-59 확인 1 "가" (confirmation 1, option "가")).
- The difference between filling in a form · new creation · editing an existing file does not split the skills; it is handled as **an applicability condition inside the skill (the starting point)** (D-60 G-12). There are three starting points — **baseline · edit** (modify an existing xlsx) · **baseline · form** (fill in the cells of a fixed form) · **no baseline** (make it new from the source material).

## 2. Choosing a skill — stage × target

- Skills are nested, `skills/<step>/<target>.md` (D-60 G-11 ⓐ). `layout/` · `output/` are bundle folders, not skills (`a/common-rules.md` §7.2).
- **Layout A** — use the layout skill of the target the confirmed spec fixes. If there are two targets, both. If the spec has no target or can be read as two, do not choose; raise it as an open question in the layout document. In the layout document write the skills to be used **by their skill path name, verbatim** (`layout/table` · `output/table` …) — output A and the verifier find the counterpart by this name.
- **Output A** — use only the output skill the approved layout document fixes.
- For a target with no matching skill (e.g. a chart), do not fill the gap with a similar skill — stop and hand it back (new targets: §9 below).

## 3. Safety — original · working copy · backup · dry → apply (D-58)

- **Do not modify the original, the baseline or the source material.** At start and at finish, measure the SHA-256 of every input and write it in the build summary.
- **When reading, read a copy** — copy the input into a temporary folder dedicated to your own session (e.g. `<assignee>/` under the scratchpad) and open only the copy. Even if the user has the file open in Excel, a copy of the file on disk can be read. Do not share the temporary folder with another A or B — a file of the same name left by someone else was once overwritten (T6 A4 · A5).
- **Make the working copy only in `output/`.** If there is a baseline, start from a copy of the baseline placed in `output/` — do not open and save the file at the baseline path.
- **Per-step backup** — at every step that modifies the working copy (one apply), **immediately before** editing, make `<working-copy name>.pre<step>.bak` in the same folder and write its SHA-256 in the build summary and in the change record's version section. Name `<step>` from the version and the order (e.g. `preR1`; several times in one version: `preR1-2`). If a backup of the same name already exists, **do not overwrite it; stop** (T6 A6_2차). The first version of a new creation has no baseline to modify, so it has no backup.
- **dry → apply, two phases** — before writing, first extract and keep the list of what will change (sheet · cell/shape · before value · after value) (dry), and then write (apply). After apply, extract again what actually changed, compare it with the dry list, and write the reason for anything that differs.
  - **Where the dry list is kept** — an md file `<working-copy name>_dry_<step>.md` in the same folder as the working copy (`output/T{N}_<job>/`, or the other path if the spec fixed one). One file per apply, and `<step>` is the same fragment as in that apply's backup name (`R1` · `R1-2` — also `R1` for the first version of a new creation, which has no backup). The "before value" in the list is the value in the working copy immediately before apply (`(none)` for the first version of a new creation) — it differs from the "original value" (the original) in the change record. Write it before apply (in a version that takes a backup, before the backup), and do not modify it after apply. If a file of the same name already exists, as with backups, do not overwrite it; stop. Do not put it in the session's dedicated temporary folder — that disappears when the session ends.
  - **What goes in the build summary** — for each dry list file: path and SHA-256 · line count · number of actual changes after apply · the lines that differ from the list and why. The list itself is not copied into the build summary.
- Keep **one working-copy name.** Do not multiply copies such as `_v2` · `_final` · `_revised` — versions are told apart by the backups and the change record's version sections. Different versions with the same name, Rev and date were once mixed and could be told apart only by fingerprint (T10 · T6 mixed versions).

## 4. Checks before starting — do not touch the user's environment (D-58)

At start and **again immediately before apply**, look at the following. Write the check results (time · values) in the build summary. The user may open the file in between (T6 A7 — a lock file newly appeared after the check).

1. **Lock** — if `~$<filename>` is in the working-copy or input folder, someone has that file open in Excel. Do not write to that file.
2. **Running Excel** — note the PIDs with `tasklist /FI "IMAGENAME eq EXCEL.EXE"`. Treat these PIDs as the user's; neither attach to them nor close them.
3. **Version** — whether the SHA-256 of the working copy (if any) equals the last record (the last version section of the change record · the approval record). If it differs, someone saved it — compare copies with each other and write what changed, and if the content changed, stop (T6 A5 · A6).

**Where to stop** — if any of the following applies, end that call there and hand the situation back. Do not carry on without a new call on the strength of a user message alone (T6 A5, the "절차 밖" ("outside the procedure") remark).
- The file to be written has a lock or is open in the user's Excel — hand back asking for it to be closed. Do not save under another name or force an overwrite (T10 R2).
- **Permission denied** — the execution permission decision denied a write or delete. Do not achieve the same write through another path, another tool, piecewise execution or a settings change. When handing back, write the ways the user can choose from (changing the permission settings · the user running it directly · the closed-file method after closing Excel) (T6 A2 · A4).
- An open workbook is in an unsaved state (`Saved=False`) · the working copy's fingerprint changed in a way not expected.

## 5. Choosing a tool (D-58)

| Characteristics of the baseline / working copy | Writing tool | Why |
|---|---|---|
| It has at least one of: shapes · comments (notes · threaded comments) · pictures · data validation · rich text (several fonts within one cell) | **Excel COM (pywin32)** | Saving again with openpyxl drops or changes such elements (T10 A1_R1 M-1 · T6 A6) |
| A simple table without the elements above · new creation without a baseline | **openpyxl** | Excel is not launched, so nothing collides with the user's environment (T7 · T9) |

- The characteristics are **surveyed from the input by layout A** and written in the layout document together with the tool. Output A uses that tool. If it has to be changed to another tool, stop and hand back before changing.
- openpyxl can be used for **reading and comparing** in every case. The survey method is in `references/excel-tools-and-pitfalls.md` §1.
- **Writing** with a tool outside the two above (direct zip/XML editing · Excel MCP, etc.) is done only when the layout document fixes it together with the reason.
- Run Python with **`py`** (`python` on this PC is a Store shortcut). Run scripts with `PYTHONDONTWRITEBYTECODE=1` so they leave no `__pycache__`, or delete what is left (T10 A1_R2).
- **When using COM** — launch only a new instance (`DispatchEx`), and when done `Quit` **only your own instance.** Note the EXCEL.EXE list before and after the run and confirm "nothing I launched is left". One at a time, run in the foreground — several were once run overlapping and an instance was left behind (T6 A6). Detailed know-how is in `references/excel-tools-and-pitfalls.md` §2.

## 6. Between layout and output

- **Layout A** — decide enough for output A to follow without guessing: what (sheet · cell/range · shape) · how (before → after, or the rule for the values to be made) · why (basis). What could not be decided is not presented as decided; leave it as an open question. The form to write in is `references/layout-doc-template.md`.
- **Layout A — decisions outside the spec** — if you think a change not in the spec or the user's requirements has to be added, do not put it in the decisions; write it as M-N and then raise it as an open question.
- **Output A — before starting**, measure the fingerprint of the approved layout again (definition §Fingerprint of the approved layout). If it differs, do not build.
- **Output A — details the layout did not fix** (fine adjustment of column widths · fine adjustment of shape coordinates · font size, etc.): decide them and leave them as M-N. **Deviations that change the content or structure of the result** (composition of sheets, columns and rows · values · blocks and connections) are not made; stop and hand back (definition §When going back).

## 7. Change record — color marking of changed cells + record file (D-58 · D-59 G-2~G-6 · D-60 G-10 · D-61 G-14 · D-70)

Output A leaves it. The form is `references/change-record-template.md`.

- **Color marking** — fill the cells whose value was changed with one marking color. The layout document fixes the color (a color different from the fill colors already used in the baseline). For merged cells, fill the top-left cell. Shapes are not filled; they are written **only in the record file** (G-5).
- **Record file** — inside that Task's output, a file **separate** from the working copy (G-3). **Per-version (R) sections within one file** (G-6). Sections of earlier versions are neither deleted nor modified.
- **What a version section carries** — **only the cells (shapes) newly changed in that version** (G-10). The "original value" column is **the cell value of the original (baseline)** (G-2). The "Before" column of the shape table is the same — the value of that shape property in the original (baseline). The cumulative change against the original is read by combining the version sections and taking the last record for each cell (shape).
- **Unit of one line** — a cell that had an original value: **one line per cell.** Newly filled cells · new rows · new columns may be grouped as **one range line** (G-14).
- **No baseline (new creation)** — for the first version (R1), no color marking and no record file. They start from R2 (G-4). In this case **the original is fixed to the R1 version** — in R3 and later too, the "original value" column (the "Before" column in the shape table) is the R1 version's value, and the color marking is also cumulative against the R1 version (D-70 · G-2). The R1 version remains as R2's first backup (`<working-copy name>.preR2.bak`), so read the original values from that file. Work continues from the previous version (the current working copy), and the backup is also taken from that version (§3).
- In the basis column of the record write the material (file · section · page · row) · the user decision (date and the user's words) · the layout decision number. **Verification report numbers and pipeline words (things like ★ · B2 R1 X-1) are not written as a basis** — rewrite them as a user decision (T10 B2_R2 X-2).

## 8. User preferences file — layout A reads it (D-62 · D-64)

- Before writing the layout document, layout A **reads** `b/tracks/spreadsheet/references/user-preferences.md` (read only — everything under `b/` is the verifier's area). Look only at the lines that bear on the target and subject of your own Task. If there are several lines for the same subject, look at the latest line — however, where `B's remarks` lines in §4 diverge from each other, the later line does not replace the earlier one (that file's §2-4). Look at all the diverging lines and write as M-N which one you consulted (or that you followed neither).
- That file has two sections — **§3 What the user directly requested** / **§4 B's inferences.** Treat the two differently:
  - **Lines in §3** — the user's words. **Follow them** in decisions on formatting, notation and tone. If there is a line that cannot be followed, raise it as an open question together with the reason.
  - **Lines in §4** — what B inferred, or B's own remarks. **Consult them only.** If you decided to follow one, write that decision as M-N. Do not write a decision that followed a §4 line as "what the user requested".
  - If §3 and §4 disagree, follow §3.
- In the layout document, **point by line number** (`follows §3 U2` · `consulted §4 B1 — M-3`). Do not copy the content of the line.
- A line that the user fixed in the confirmed spec as "keep this preference" is the spec — follow that line wherever it is, §3 or §4.

## 9. New targets · new stages — the place left open (D-59 "확장" (extension))

- **New target** (e.g. chart · pivot) — add the two files `skills/layout/<target>.md` · `skills/output/<target>.md` in this track. Name them so that they do **not differ by a single character** from the counterpart in the verifier's `b/tracks/spreadsheet/skills/` (`a/common-rules.md` §7.2). If you borrow procedure steps from an existing skill, state that skill's path name and the procedure step numbers. The verifier-side counterpart and criteria are written by the verifier and approved by the user — do not write only the A side first.
- **New stage** (e.g. a trial output between layout and output) — add one `skills/<step>/` bundle and the target skills inside it. A stage has to change together with the definition's step table, so it is handled as **`new-pipeline` or an improvement round.**
- When a recurring method is newly confirmed in a real Task, write it under "Problems found" in the build summary as a candidate to be raised into these rules and skills — do not modify them in the middle of a Task.

## 10. Text the recipient reads — vocabulary · sentences · tone (D-61 G-17)

This is the policy for writing the text that people read in the working copy — cell strings (header row · body · guidance · remarks · question cells) · sheet names · notes · text in shapes and text boxes · explanation sheets. Formatting (font · color · column width …) follows the layout decisions and §6; only the text is dealt with here.

- **Who decides** — the tone (one within one file — e.g. sentences ending in "…다" (plain declarative) · itemized style ending in "…함" (terse nominal ending) · ending on a noun) and the source of the terms (source material · baseline · glossary) are fixed by **layout A** as decisions (L-numbers) in §6 of the layout document. If there is a baseline, first follow the tone and terms already used in the baseline. If a line in §3 of the preferences file applies, follow it (§8).
- **Output A** — if the layout fixed the text character for character, transfer it as is and do not rewrite it. If the layout fixed only the rule for the values and output A has to compose the text, compose it according to the policy below. If the layout has no tone, follow the baseline's tone, and if there is no baseline either, decide it and leave it as M-N (§6 — details the layout did not fix). If what to write (the content of the text) has not been decided, do not compose; stop (§6 — deviations that change the content).
- **Vocabulary** — use the words used in the recipient's field (source material · baseline · terms fixed by the layout) as they are. Within one file, call one thing by one name. Spell out an abbreviation where it first appears, or put it in the legend place (`skills/layout/table.md` ⑭).
- **Sentences** — write one piece of content in one cell. Write so that reading that cell alone tells what it refers to — instead of words pointing at neighboring cells, use the names of the sheet · cell · item. Attach units to numbers. Do not add evaluative · emphasizing · concluding sentences that are not in the source material.
- **Choice cells** — in a cell where one of a few words is chosen, such as status · classification, write only from within the word list fixed by the layout.
- Not putting in internal working symbols and internal paths is exactly as in `skills/layout/table.md` ⑭ · `skills/output/table.md` ⑧.
