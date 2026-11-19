# References — Excel reading pitfalls (`spreadsheet` track)

> **Material supporting the verdict. Not read whole** (`b/common-rules.md` §9) — open only the sections that items of `criteria.md` point to. The sections that the B skills (the four files in `skills/`) point to (§1 · §2) are carried over by the criteria-writing B into the reading-method section of the merged criteria (`b/common-rules.md` §9.3).
> Not verdict criteria. What is written here is "places where B easily miscounts when reading an xlsx" and "B's reading discipline"; items · severity are only in `criteria.md`.
> Item numbers are as of `criteria.md` r4·r5·r6 (same as r2·r3, with OC-20~24 added in r4. r5 · r6 have no change in numbering. The correspondence with r1 numbers is in §11.3 of that document).
> Source: only what was actually run into in the verification reports (B2) of the reference case `03. 회로분석_TDSCU/log/` was carried over. A source is attached to each line.

---

## 1. Places where values are easily miscounted

| Pitfall | What happens | How to avoid it | Related items | Source |
|---|---|---|---|---|
| **Formula cached values** | A file saved with openpyxl has empty computed results (cache) for its formulas. Reading with `data_only=True` gives `None` | Extract the list of formula cells separately and look at both the formula and the cached value | OC-12 · LC-6 | T7-1 · T9-27 |
| **Empty string `''` and empty cell `None`** | If `''` goes into a newly written cell, the count of "cells whose value changed" splits depending on how they are counted | When producing a diff, count both ways and write the differing cells separately | OC-14 · OT-5 | T10 B2_R1 X-4 · T10 B2_R2 T10-9 |
| **Value of a merged cell** | The value of a merged range is only in the top-left cell. The remaining cells read as `MergedCell` and have no value | Read by merged range. Check in the original whether other cells inside the range had values before a new merge | LT-6 · OT-12 · LC-6 | T10 A1_R1 M-2 (for merged cells only the top-left is filled) · T10-5 |
| **Threaded comments** | openpyxl reads a threaded comment only as a legacy note ("[스레드 댓글] …" ("[Threaded comment] …")). The content · reply structure is in `xl/threadedComments/*.xml` | Look at the parts list and the notes together. To check as far as identity of content, open the XML directly | OC-8 · LC-3 · LC-6 | T10 검증기준 "못 본 것" · T10 B2_R1 §6 |
| **`scale` and `fitToPage`** | If `fitToPage=True`, the `scale` value is not used for printing. Even if a value newly appears, it may have no effect | Interpret print settings together with `fitToPage`·`fitToWidth/Height` | OT-3 · LT-5 | T10 B2_R1 X-3 |
| **Print area and added rows · columns** | Adding rows · columns does not automatically extend the print area. A new column is left outside the print area | Compare the last row · last column of `print_area` with `max_row`·`max_column` | OT-3 · LT-5 | T10-7 · T10 S-4 (column G outside the area already in the original) |
| **Same name, different version** | There can be two versions with the same file name · cover-page version notation · footer date | Tell versions apart by SHA-256 · file time · modification time in `docProps/core.xml` | LC-1 · OC-2 | T10 검증기준 §"한계" |
| **Re-serialization on Excel re-save** | Saving again with Excel changes the XML attribute order · ids even when the meaning is the same | Pair shapes by name · text · coordinates instead of id, and write the basis for judging the meaning the same. A range that could not be told apart is not seen | OB-1 · OC-17 | T6 P-6 · T6 §9 |
| **Fill-color notation** | The same color can be stored differently, as a theme color and as rgb. The original's background fill is often theme | Produce the distribution with rgb values and theme fills separated | OC-16 · LC-11 | T10 S-3 ("theme 채움 + `FFFFC000` 4칸" ("theme fill + `FFFFC000` in 4 cells")) |

---

## 2. B's reading discipline (method — to keep independence · safety)

| Discipline | Why | Source |
|---|---|---|
| Read the working copy · input **only from copies made in the scratchpad** (check copy hash = original hash) | So as not to lock or change the original · working copy by mistake | T10 B2_R1 §0 · T6 §8-4 |
| **Do not launch Excel.** If Excel is running, only write down the PID and do not close it | No interference with the user's instance · file lock | T10 B2_R2 §0 · X-3 |
| If there is a `~$` lock in the output folder before starting, **do not start judging** | A's editing session may not have ended | T6 §8-1 |
| **Do not run** A's build script | If the output path is omitted it overwrites the designated path | T10 B2_R1 §6 · B2_R2 §6 |
| **Do not open** the check scripts · intermediate results A left in the scratchpad. Keep your own files in a subfolder | Independence (I-2) — in mode 2, A · B may use the same temporary folder | T7 B2_R1 X-7 |
| Keep my scripts · extracts in the scratchpad, and write their names and results verbatim in the report | So that it can be reproduced (P-5) | T10 B2_R1 §0 "도구" |
| Do not use the extracts · scripts of other verifiers (B1 · an earlier B2) either | I-1 | T10 B2_R2 §0 |

---

## 3. Frequently used reading means (for reference)

- **Values · fills · merges · print settings · validation**: Python (`py -3 -I`) + openpyxl — `ws.merged_cells.ranges` · `ws.page_setup` · `ws.print_area` · `ws.print_title_rows` · `ws.sheet_properties.pageSetUpPr.fitToPage` · `cell.fill.fgColor.rgb` · `ws.data_validations` (the likes of T10 B2 `meta.py`·`diff.py`·`form.py`)
- **Shapes · pictures · comments · external links**: parts list with `zipfile` · `xdr:sp`·`xdr:cxnSp`(`stCxn`·`endCxn`)·`xdr:pic` in `xl/drawings/drawingN.xml` · hashes of `xl/media/*` (T6 R1 보고서 "검증 도구·재현")
- **Fingerprints**: `sha256sum` · `ls -la --time-style=full-iso`
- **Changed files**: `find <project> -newer <criteria.md> -type f` (in a project not tracked by git — it cannot catch an overwrite that preserves the time)

> The reading procedures per stage × target are in `skills/<step>/<target>.md` (`layout/table` · `layout/block-diagram` · `output/table` · `output/block-diagram`) — judging B does not open those files and reads what the criteria-writing B carried over into the reading-method section of the merged criteria (`b/common-rules.md` §9.3). §3 here is the list of means those procedures share (D-59 G-9 · D-60 G-11 · `criteria.md` §3). The pattern list for expression · design · readability (OC-20~24) is in `expression-pattern-dictionary.md` in the same folder.
