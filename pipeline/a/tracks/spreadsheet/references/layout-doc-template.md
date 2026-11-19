# References — layout document template (`spreadsheet` track)

> The form for when layout A writes `log/T{N}_<job>/design-spec.md`. Copy this file and fill in the cells. `▶` lines are explanations, so delete them after filling in.
> It is the design gate template (`z/pipelines/_template.md` — background / decisions / flow / schema / risks / satisfaction conditions) spelled out to fit Excel work. Which section corresponds to which of those six is written in parentheses next to the section title.
> What else to write in the decisions section (§6) per target is in that layout skill (`skills/layout/<target>.md`).

---

```markdown
# Layout — <job> (T{N})

| Item | Value |
|---|---|
| Version | R<M> (written YYYY-MM-DD) |
| Written by | Layout A (A1) |
| Basis spec | `log/decisions.md` <section name> |

## 1. Skeleton of the work (background)
| Item | Value |
|---|---|
| Target · skill | `layout/<target>` → output `output/<target>` (add a line if there are two targets) |
| Starting point | Baseline · edit / Baseline · form / No baseline |
| Baseline file | `input/…` (if none, "none") |
| Working copy | `output/T{N}_<job>/<filename>.xlsx` |
| This version | R<M> |
| One-line purpose | Who uses this working copy for what |

## 2. Input pinning
| # | File (path) | SHA-256 | Size (B) | Marker that tells versions apart (if there may be another version of the same name) |
|---|---|---|---|---|
▶ Every original, baseline and source material. Values measured at start.

## 3. Range read
▶ For each file: sheets · ranges read. Whether each of the following was read / excluded (if excluded, why): hidden sheets · hidden rows and columns · AutoFilter · merged areas · text inside pictures and shapes · notes and threaded comments.

## 4. Input characteristics and output tool (schema)
| Characteristic | Present/absent · count · location | How it was measured |
|---|---|---|
| Shapes · pictures · charts | | zip part list (`xl/drawings/` · `xl/media/` · `xl/charts/`) |
| Notes · threaded comments | | `xl/comments*` · `xl/threadedComments/` |
| Data validation · conditional formatting | | sheet XML `dataValidations` · `conditionalFormatting` |
| Formulas | | openpyxl (`data_only=False`) |
| Merges · print settings · defined names | | `mergeCells` · `pageSetup` · `definedNames` |
| Fill-color distribution | | tally of cell fill RGB |
- Output tool: COM (pywin32) / openpyxl — reason (`a/tracks/spreadsheet/rules.md` §5)
- Run with: `py`

## 5. Analysis results
▶ Counts · sums · lists · comparison results. Attach to each value its basis location (file · sheet · cell/row · shape). For what can be counted, write how it was counted (script · conditions) so that someone else can count it again.
▶ If you met a place where the interpretation of a value diverges (formula cells · date serial numbers · text that looks like numbers · leading/trailing spaces and line breaks · merged cells · empty string vs. empty cell), write how you read it (`references/excel-tools-and-pitfalls.md` §1).

## 6. Decisions (decisions · flow)
▶ Number them (L-1, L-2 …) — output A and the change record point by these numbers.
| # | What (sheet · cell/range · shape name/id) | Before → after (or the rule for the values to be made) | Basis (material section · page · row · user decision) |
|---|---|---|---|
▶ What else to fix per target is in the "Procedure" section of that layout skill (`skills/layout/<target>.md`).
▶ Do not write words such as "appropriately" · "nicely" · "if needed" in a decision cell — if it could not be decided, take it to §9 open questions.

## 7. What to keep — preservation list (when there is a baseline)
▶ Measure in the baseline what must not be changed and write it by count and location: sheet names · order · hidden state · defined names · formulas · data validation · conditional formatting · merged ranges · print settings · pictures · shapes · charts · notes/comments · original-text cells that people rely on (including cells to leave empty).

## 8. Change record plan
| Item | Value |
|---|---|
| Marking color (RGB) | `FF……` — differs from the fill colors used in the baseline: <list> |
| Record file | `output/T{N}_<job>/<working-copy name>_change-record.md` |
| This version's section | R<M> |
| No baseline, first version | "R1 color marking and record not applied (D-59 G-4)" — only when applicable |

## 9. Open questions (risks)
| # | What is not known | What it blocks | A's proposal (if any — do not write it as if confirmed) |
|---|---|---|---|
▶ Values not in the input · values that differ between bases · changes outside the spec that the user has to be asked about. For what was left because it could not be verified, attach the reason.

## 10. User preferences applied
▶ Point only by line numbers of `b/tracks/spreadsheet/references/user-preferences.md` — e.g. `follows §3 U2 (decision L-7)` · `consulted §4 B1 — M-3` · `cannot follow §3 U4 — question Q-2`. If no line applies, "no applicable line (first 8 characters of the SHA-256 of the version read)".

## 11. Satisfaction conditions (satisfaction conditions)
▶ What will be seen in the working copy once this layout is realized — write it paired with decision numbers (e.g. "L-3: sheet `목록` (List), 37 rows, columns A~M"). Write only what the deliverable will contain.

## 12. Change history
| Version | Date | Sections modified | Why (user decision · things to fix that came out of a verdict) |
|---|---|---|---|
```

- From layout R2 on, this document is rewritten in place. Accumulate the modified sections and the reasons in §12 — so that an earlier decision does not change without a trace.
- After ★ Design approval this document is not modified (definition §Fingerprint of the approved layout).
