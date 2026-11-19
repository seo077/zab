# References — expression pattern dictionary (`spreadsheet` track)

> **Material supporting the verdict. Not read whole** (`b/common-rules.md` §9) — open only the sections that the items of `criteria.md` §5.1.7 (OC-20 · OC-21 · OC-22) point to. The sections that reading procedure ⑫ of the B skills `output/table` · `output/block-diagram` points to (§1 · §2 · §3) are carried over by the criteria-writing B into the reading-method section of the merged criteria (`b/common-rules.md` §9.3).
> Not verdict criteria. Items · severity are only in `criteria.md`. What is written here is a list for deciding "which string falls under which pattern".
> **B does not judge "awkward" (preference).** It writes only "this string falls under pattern X" (fact). It does not offer a rewritten sentence (`b/common-rules.md` V-1).
> Source: BD-N1 · BD-N2 · BD-H · BD-T4 of the reference case `03. 회로분석_TDSCU/log/T6_블록도정리/검증기준.md` and the old pattern dictionary its preamble points to, `03. 회로분석_TDSCU/log/_승계_v0.6/VERIFY_CRITERIA/R5.md` §0.7 (lines 139~169). The web sources of that document — GitHub `epoko77-ai/im-not-ai` (71 kinds of Korean AI tells) · 국립국어원 『번역과 국어』 (National Institute of Korean Language, "Translation and the Korean Language") (translationese) · Grammarly/나무위키 (Namuwiki) translationese sentences (retrieved 2026-09-11, TDSCU record) — were not retrieved again when these track criteria were written (2026-10-14).
> Basis for using this dictionary as a track item: the origin workspace's `log/AI 논의사항.md` Round 7 D-61 G-17 ("AI스럽지 않은 어휘적인 표현, 디자인과 가독성" ("lexical expression that does not sound like AI, design and readability") → output B checks them together).

---

## 1. Pattern list

**Verdict pattern** = one that, in OC-20, is pointed out as a list if even 1 hit is found. **Attention pattern** = one for which, in OC-21, only the count · locations are reported (no verdict — there is no basis for how many hits make a problem).

| Category | Representative patterns (strings) | Item that uses it | Labels (short cells · shapes) | Explanatory text (sentences) |
|---|---|---|---|---|
| Translationese | `~를 통해` ("through ~") · `~에 대해(서)` ("about / regarding ~") · `~에 있어(서)` ("in terms of ~") · double passive `~되어지` · `가지고 있다` ("to have", calqued) · double particle `~에서의` / `~으로의` | Verdict (OC-20) | Applies | Applies |
| Excessive English in parentheses | A parenthesized `(English)` attached although it can be put in Korean | Verdict (OC-20) | Applies | Applies |
| AI stock phrases | `결론적으로` ("in conclusion") · `주목할 만하다` ("is noteworthy") · `시사하는 바(가 크다)` ("has (great) implications") | Verdict (OC-20) | Hardly relevant | Applies |
| Hedge overuse | `~할 수 있을 것으로 보인다` ("it appears that ~ could be possible") · `~것으로 판단됩니다` ("it is judged that ~") | Verdict (OC-20) | Hardly relevant | Applies |
| Mechanical enumeration | `첫째 / 둘째 / 셋째` ("first / second / third") | Verdict (OC-20) | Hardly relevant | Applies |
| Suffix overuse | Excess of `~적` · `~성` · `~화` (roughly "-ic/-al" · "-ity/-ness" · "-ization") | Attention (OC-21) | Applies | Applies |
| Dependent nouns | Excess of `것` · `점` · `수` · `바` (roughly "thing" · "point" · "way/possibility" · "what") · `~할 필요가 있다` ("there is a need to ~") | Attention (OC-21) | Sometimes | Applies |
| Unnecessary modifiers | `매우` ("very") · `정말` ("really") · `혁신적인` ("innovative") · duplicated synonyms | Attention (OC-21) | Sometimes | Applies |
| Clustered conjunctions | `또한` ("also") · `따라서` ("therefore") · `즉` ("that is") one after another | Attention (OC-21) | Hardly relevant | Applies |
| Visual decoration | Excessive bold · quotation marks · emoji | Attention (OC-21) | Overlaps with formatting | Applies |
| Uniform rhythm | Small variation in sentence length · the same sentence ending repeated | Attention (OC-21) | Hardly relevant | Applies |

- The grades of the original dictionary (S1/S2/S3) were a reference for detection priority. Here there are only two kinds, verdict / caution — the verdict patterns follow TDSCU T6 BD-N1 (confirmed by the same user — T6 G-5 "1. a"), the attention patterns BD-N2.
- If there are **words the Task spec separately said to avoid**, do not mix them into the track dictionary; write them in the third layer of the Task's merged criteria (`criteria.md` §6).

## 2. Exclusion reasons — cases not pointed out even though a pattern is hit

Write, for each case, **which reason it is.** If no reason can be written, do not exclude it.

| Reason | Example |
|---|---|
| A quotation carrying the original text of the source material over as is | Datasheet pin names · net names · sentences of a specification · cells holding the user's answer verbatim |
| Proper names | Names of parts · standards · products · organizations |
| A substitute word changes the meaning | `~를 통해` stating the fact that a signal actually "passes through" |
| The user fixed that notation | There is a record in the spec · user answers saying to use that notation (write the location) |
| [baseline] Text that was there originally | Cells · shapes this Task did not change — subject to preservation (OC-8). As a note only |

**"It is not awkward" · "this much is fine" is not an exclusion reason** (TDSCU T6 §9).

## 3. Text errors caught by rule (OC-22 ④)

Count only what is obvious and can be decided by rule. Do not count matters of spacing · style where judgment is divided.

| Error | How to catch it |
|---|---|
| The same word twice in a row (`의 의`, `을 을`) | Consecutive duplicates among whitespace-separated tokens |
| Doubled punctuation (`..` · `,,` · `。` mixed in) | String search (ellipses `…`·`...` are excluded) |
| Unmatched parentheses · quotation marks | Compare the number of opening / closing ones per cell · shape |
| Doubled particles (`을를` · `은는` · `이가`) | String search |
| The spelling of the same word splits within the same file (`데이타`/`데이터`) | Extract candidate spelling pairs and see whether both are used — if there is a glossary, hand it over to the Task's third layer as "Unified terminology" |
