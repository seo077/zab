> Kind: instruction · When: **layout B** of a `spreadsheet` Task judges the layout document (`log/T{N}_<job>/design-spec.md`) for the target "table" — this file is opened by **layout-criteria B**, who carries it over into the reading-method section of the merged criteria `criteria-layout.md`; layout B does not open this file when judging and reads what was carried over into the merged criteria (`b/common-rules.md` §9.3) · Tools: shell (`sha256sum`·`ls -la`·`find`) · Python (`py -3 -I`) + openpyxl · `zipfile`

# B skill — layout/table

> **Holds the method only.** What to look at (items · severity) is only in the Task room's approved merged criteria (`criteria.md` table of contents + `criteria-layout.md` — track criteria §7 ①) — the track source is `b/tracks/spreadsheet/criteria.md` §4.1 LC · §4.2 LT. If this file and the items seem to disagree, **the approved criteria win.**
> Counterpart: A side `a/tracks/spreadsheet/skills/layout/table` (the ending form — file `.md` / folder — follows the A convention `a/common-rules.md` §7.2. If the path name `layout/table` differs by even a single character, write it in the result).
> Reading pitfalls are in `b/tracks/spreadsheet/references/excel-reading-pitfalls.md` §1, reading discipline in §2 of the same file.

## 1. Preparation

1. `ls -la` whether there is a `~$` lock in the output folder · input folder — if there is, do not start; hand it back.
2. Copy the layout document and every input (original · baseline xlsx · source material) into **my own subfolder under the scratchpad** and check that the SHA-256 of original and copy are equal. Do not open the scripts · intermediate files A left.
3. **Write the SHA-256 of the layout document at the head of the report** — after ★ Design approval, output-criteria B checks this value against the approved copy and fixes it in the output merged criteria as the value at the time of approval (track criteria §7 ⑤ ⓐ), and output B checks OC-2 against that value.

## 2. Reading procedure (in item order)

| Step | What | Items |
|---|---|---|
| ① | Recompute the SHA-256 of every input → compare with the values written in the document. If they differ, **stop and report** | LC-1 |
| ② | Find in the document the skill name · starting point · baseline · working-copy path · version | LC-2 |
| ③ | Open the input with openpyxl and extract the sheet list · hidden state (`sheet_state` · row/column `hidden`) · `auto_filter.ref` · `merged_cells` · notes, and with `zipfile` the drawing · threadedComments parts; check them against the document's "range read" | LC-3 · LC-6 |
| ④ | Recompute the document's counts · sums · lists with **my own script** (do not use A's script) | LC-4 |
| ⑤ | Open, in the input copy, at least 10 randomly chosen basis citations + every citation the conclusion depends on | LC-5 · LC-7 |
| ⑥ | Input characteristics (parts list · validation · formulas) ↔ the document's tool decision | LC-8 |
| ⑦ | [baseline] Measure the preservation list — parts list · number of `merged_cells` per sheet · `defined_names` · `page_setup`·`print_area`·`print_title_rows` · `data_validations` · conditional formatting · fill-color distribution (rgb · theme separately) → check both ways against the document's list. Whether the chosen marking color does not overlap the baseline's fill colors | LC-9 · LC-11 |
| ⑧ | Sheet list (LT-1) · column table (LT-2) · population (LT-3 — extract it directly myself from the source material and take the set difference) · basis rule (LT-4) · form frame · cells to leave empty (LT-5 — measure from the baseline and compare) · merge plan (LT-6 — extract from the baseline the non-empty cells inside the ranges and check whether each is handled) | LT-1~6 |
| ⑨ | **Become output A** and, for each sheet, follow at least 3 decisions + every decision the spec points to, down to the cell address. Write the places where guessing is needed | LC-10 · common C-F2 |
| ⑩ | Decision list ↔ attribution table to the Task spec · user answers | LC-12 |
| ⑪ | Formatting · plan for the recipient's readability | LT-7 · LT-8 |

## 3. What to leave

- In the verdict report (`log/T{N}_<job>/verification-summary/B<N>_*.md`): the layout document's SHA-256 · result of recomputing the input fingerprints · the names of my scripts and their results verbatim · sample range · attribution table.
- Keep my scripts · extracts in my own subfolder under the scratchpad and write their names.
