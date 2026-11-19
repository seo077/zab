> Kind: instruction · When: **layout A** of a `spreadsheet` Task writes the layout document (`log/T{N}_<job>/design-spec.md`) for the target "block diagram" (shapes — blocks · connectors · text boxes) · Tools: shell (`sha256sum`·`ls -la`·`tasklist`) · Python (`py`) + `zipfile` · XML parser · openpyxl · (if a picture check is needed) pywin32

# A skill — layout/block-diagram

> Fixes the **content and placement** of a deliverable that conveys meaning through shapes. Counterpart: output skill `output/block-diagram`.
> The form of the document is `../../references/layout-doc-template.md`. This skill gives what block diagram work additionally fixes in that template's §6 decisions section, and the procedure. What to keep to is `../../rules.md`. Shape know-how is in `../../references/excel-tools-and-pitfalls.md` §2 · §3.
> The domain facts of the block diagram's content (whether circuit nodes · signal names are right) are fixed only from the source material the spec fixes — if the versions of the source materials differ from each other, do not choose; raise an open question.

## Applicability — starting point

| Starting point | What differs in this skill |
|---|---|
| Baseline · edit (modify an existing block diagram) | Do ④ baseline shape measurement · ⑨ per-shape change list |
| Baseline · form (draw on a sheet whose title block and frame are fixed) | In ④ measure the frame (title block · zones · print area), and fix the ⑦ placement within that frame |
| No baseline | ④ · ⑨ are "N/A (no baseline)". The change record plan is "R1 not applied (D-59 G-4)" |

## Procedure

① **Start check** — as in `rules.md` §4 look at the lock · running Excel, and write the SHA-256 · size of every input in template §2.
② **Make copies** — copy the input into your own dedicated temporary folder and read only the copy.
③ **Read the preferences file** — in `b/tracks/spreadsheet/references/user-preferences.md` find the lines that bear on the target "block diagram" and on this Task's subject (`rules.md` §8).
④ **Baseline shape measurement** (with a baseline) — from `xl/drawings/drawingN.xml` inside the zip extract, per sheet, the shape count · names · ids · anchors (cell + offset) · text. Shapes whose names collide (including those differing only in letter case) are written distinguished by name + order. Also write whether the connectors are attached to shapes (or are free straight lines). Fill in the preservation list (template §7) and the characteristics table (§4).
⑤ **Read and analyze** — extract the blocks and connections from the source material. The range read goes in template §3, the extracted result in §5.
⑥ **Block · connection list** — for each block: label · role · basis. For each connection: source → destination · label (signal name) · direction · basis. If there is a baseline, write them paired with the baseline shapes. Do not leave a block without a label.
⑦ **Placement** — so that output A does not guess coordinates, write for each block the position and size, or the rule that determines them (grid · flow direction · group box extent · area within the sheet). Prefer **rules computed from variables** (the block diagram is fixed first and the zones follow its size) over fixed coordinates (`excel-tools-and-pitfalls.md` §3).
⑧ **Notation rules** — the meaning of colors and the legend · line types · arrow direction · the source of label terms (glossary · source document). Blocks of the same functional group get the same color and the same font. The tone of labels · text-box text is also fixed here as in `../../rules.md` §10. If a line in §3 of the preferences file applies, follow it here.
⑨ **Per-shape changes** (baseline · edit) — for each shape to change: name/id · property to change (text · position · size · color · line · connection endpoints) · before → after · basis · the distinction of **whether it changes the presentation or changes a fact.** The list of shapes to delete. If the same result can be produced by property changes alone, choose that over deletion and creation (`excel-tools-and-pitfalls.md` §2 — permission decision).
⑩ **Readability constraints** — no overlapping blocks (except intended group boxes) · prevention of text overflow (shape size rule — so that the last line fits in print too) · labels read horizontally · whether connectors are attached to the shapes' connection points · font size hierarchy (including the minimum size).
⑪ **Sheet division** (several sheets) — for each sheet the range it covers · how a connection crossing sheets is shown with the same name on both sheets · a title block for each sheet (title · version · version of the basis).
⑫ **Tool** — work that writes shapes is COM (`rules.md` §5). If the placement has to be shown in advance as a picture, draw it only on a copy — attach the drawn picture to the layout document by path.
⑬ **Change record plan** — shapes get no color marking and are written only in the record file (D-59 G-5). If cells are modified along with them, fix the marking color RGB too (template §8).
⑭ **Open questions · preferences applied · satisfaction conditions** — template §9 · §10 · §11.
⑮ **Final check** — measure the input SHA-256 again and check that it equals ①, and that nothing was made in `output/`. If COM was used for the picture check, check that your own instance is not left behind.

## What else to write in the build summary

- The skill path name used (`layout/block-diagram`) · the layout document's path and SHA-256 · input fingerprints (start · finish)
- Start check results (lock · EXCEL.EXE PID — before and after the run)
- The key conditions of the script used for shape measurement · the path of the pictures drawn in advance
