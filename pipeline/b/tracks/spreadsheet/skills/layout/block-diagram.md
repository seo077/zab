> Kind: instruction · When: **layout B** of a `spreadsheet` Task judges the layout document (`log/T{N}_<job>/design-spec.md`) for the target "block diagram" — this file is opened by **layout-criteria B**, who carries it over into the reading-method section of the merged criteria `criteria-layout.md`; layout B does not open this file when judging and reads what was carried over into the merged criteria (`b/common-rules.md` §9.3) · Tools: shell (`sha256sum`·`ls -la`) · Python (`py -3 -I`) + `zipfile` · XML parser (`xml.etree.ElementTree`) · openpyxl

# B skill — layout/block-diagram

> **Holds the method only.** Items · severity are only in the Task room's approved merged criteria (`criteria.md` table of contents + `criteria-layout.md` — track criteria §7 ①) — the track source is `b/tracks/spreadsheet/criteria.md` §4.1 LC · §4.3 LB. If they seem to disagree, **the approved criteria win.**
> Counterpart: A side `a/tracks/spreadsheet/skills/layout/block-diagram` (the ending form — file `.md` / folder — follows the A convention `a/common-rules.md` §7.2. If the path name `layout/block-diagram` differs by even a single character, write it in the result).
> Reading pitfalls are in `b/tracks/spreadsheet/references/excel-reading-pitfalls.md` §1 (especially "Re-serialization on Excel re-save"), reading discipline in §2 of the same file.

## 1. Preparation

1. Check for a `~$` lock (if there is one, do not start).
2. Copy the layout document · input into my own subfolder under the scratchpad; check copy SHA-256 = original.
3. **Write the SHA-256 of the layout document at the head of the report** — after ★ Design approval, output-criteria B checks this value against the approved copy and fixes it in the output merged criteria as the value at the time of approval (track criteria §7 ⑤ ⓐ), and output B checks OC-2 against that value.
4. If [baseline], unzip the copy of the baseline xlsx to obtain `xl/drawings/drawingN.xml` · `xl/drawings/_rels/` · `xl/worksheets/_rels/` · `xl/media/`, and match up the sheet ↔ drawing correspondence through the rels.

## 2. Reading procedure

| Step | What | Items |
|---|---|---|
| ① | Recompute the input fingerprints → the values written in the document. If they differ, stop and report | LC-1 |
| ② | Skill name · starting point · baseline · working-copy path · version | LC-2 |
| ③ | [baseline] Extract the shape inventory — `xdr:sp` (blocks · text boxes: `cNvPr` id·name · text · `a:off`/`a:ext` · fill) · `xdr:cxnSp` (connectors: `stCxn`/`endCxn` id · `headEnd`/`tailEnd`) · `xdr:pic` (`r:embed`) · groups (`xdr:grpSp`). Check against the document's "range read" · preservation list | LC-3 · LC-9 |
| ④ | Open representative entries of the block · connection list (LB-1) in the source material — how many blocks · how many connections; write the range. If [baseline], inventory count of ③ ↔ list count | LB-1 · LC-5 · LC-7 |
| ⑤ | Place a few representative blocks as the placement rule (LB-2) says and see whether it settles into a single placement | LB-2 · LC-10 |
| ⑥ | [baseline] Whether the shape ids · names the change list (LB-3) points to really exist in the inventory of ③ · distinction between presentation and fact · list of shapes to delete | LB-3 |
| ⑦ | Notation rules (color · legend · line · arrow · source of terms) · readability constraints · division into sheets | LB-4~6 |
| ⑧ | Tool decision (LC-8) · change record plan (LC-11 — shapes are not filled, only recorded, D-59 G-5) · decision ↔ spec attribution table (LC-12) | LC-8 · LC-11 · LC-12 |

## 3. What to leave

- In the report: the layout document's SHA-256 · result of extracting the shape inventory (number of sp · cxnSp · pic per sheet) · sample range · attribution table · script names and results verbatim.
- If there are shapes that could not be paired because of re-serialization, write them as "not seen".
