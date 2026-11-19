# References — accumulated user preferences (`spreadsheet` track)

> **Not a basis for the verdict.** What accumulates here is a record of likes and dislikes about the expression · design · readability of Excel deliverables. **It is divided into two sections** — **§3 What the user directly requested** (the user's words verbatim) / **§4 B's inferences** (user preferences B made out from the user's words · decisions · reactions + output B's own preference remarks). Items · severity are only in `criteria.md` — a line in this file does not by itself decide pass or fail (`b/common-rules.md` I-5 — the basis for a verdict is only three things: the approved criteria · the deliverable · B's judgment).
> **§3 and §4 carry different weight.** §3 is the user's, and §4 is B's — do not carry a line of §4 over as something the user requested.
> Lines are accumulated per target **so that the file need not be read whole** (`b/common-rules.md` §9, the references convention). The reading side looks only at the lines that bear on the target and subject of its own Task.
> Basis for having this file: the origin workspace's `log/AI 논의사항.md` Round 7 **D-62** — "B의 취향 소견(좋다·싫다)은 판정에 넣지 않고 사용자 취향 누적 파일에 쌓는다 — 자리는 `b/갈래별/엑셀작업/참고자료/` 안" ("B's preference remarks (like · dislike) are not put into the verdict but accumulated in a user-preferences file — its place is inside `b/tracks/spreadsheet/references/`") · the user's words "사용자마다 다르기 때문에 사용자의 취향을 누적해서 적을 수 있는 파일이 있으면 좋겠네요. 싫다 뿐만 아니라 좋다까지. 너무나 주관적인 부분이기 때문" ("Since it differs from user to user, it would be good to have a file where the user's preferences can be accumulated. Not only dislikes but likes too. Because it is such a subjective matter"). Who writes it and when is **D-63 G-21 (ㄴ)** — the user's words "G-21 : ㄴ, B가 파악한 사용자 취향도 적기 가능" ("G-21: ㄴ, user preferences B has made out may also be written"). What is written where, separately, is **D-64 G-22 (ㄴ)** — the user's words "1. ㄴ, 사용자가 직접 요청한 내용과 B의 추론 같은 파일 내 섹션 나눠서 분리해서 적어주세요" ("1. ㄴ, please write what the user directly requested and B's inferences separately, in divided sections within the same file").

---

## 1. Who uses it and how

| Who | What | Basis |
|---|---|---|
| **Layout A** | **Reads** it before writing the layout document — consults the user preferences for layout decisions (formatting · notation · tone). **Reads §3 (user requests) and §4 (B's inferences) apart** — when it followed a line of §4, it does not write that as something the user requested. Which line it followed or did not follow, and what weight it gives the two sections, is fixed by the A-side rules | D-62 "레이아웃 A 읽음" ("layout A reads") · D-64 G-22 (ㄴ) section separation |
| **Output B** | **Only consults it.** Does not use it for the verdict, and **does not write to this file.** B's own preference remarks (like · dislike) are written in the report's X-N notes, "preference remarks" group (an X-N number per remark), and if this file has a line for the same target, its section · number is written as well (same direction or diverging) — so that the user sees it at a glance at ★ Final acceptance. Those remarks are later carried into §4 by the preference-recording B | D-62 "출력 B 참고만" ("output B only consults") · D-64 G-22 (ㄴ) · preamble of `criteria.md` §5.1.7 |
| **Preference-recording B** (the one who records) | **One short B call after ★ Final acceptance** adds lines to this file — following the procedure in §2 below. It is a call that does not judge, and it writes nowhere outside this file. **Only this B writes the body of this file** (`b/common-rules.md` §1.1 — body text under `b/` is the verifier's only). Z only makes the call and does not write lines | **D-63 G-21 (ㄴ)** |
| Others | Output-criteria B carries a line over as a third-layer item only when the user fixed "keep this preference" in that Task's spec (`criteria.md` §6 "Reflecting user preferences in the Task"). In every other case no B judges by a line of this file. A line of §4 does not become a third-layer item unless the user fixes in that Task that it is to be kept | `b/common-criteria.md` §8 (only the approved criteria are a basis for the verdict) |

> **When it is written, and the read-only rule** — `b/boot.md` the three prohibitions 3 · `b/common-rules.md` §1 · `README.md` say "everything under `pipeline/` is read-only while work is in progress". The preference-recording B writes **after ★ Final acceptance — not while work is in progress.** This write is the place fixed by user decision D-63 G-21 (ㄴ) (`b/common-rules.md` I-6 last line — the user's final decision is the standard). `pipeline/` outside this file is read-only for that B too.

## 2. What to write — the preference-recording B's procedure

**What it reads** (the call gives the paths): that Task's ledger checkpoints (`log/manifest.json` — `user_words`) · that Task's discussion record (if any) · the X-N "preference remarks" group of the output B report · this file.

1. **§3 — What the user directly requested.** Of the user's words left in the ledger checkpoints and elsewhere, carry over **verbatim** the likes and dislikes about the expression · design · readability of Excel deliverables. Summary · interpretation go only in the "Target" column, briefly. Only what the user actually said goes in this section — what B inferred goes to §4, however certain it looks.
2. **§4 — B's inferences.** Lines on two grounds are written in the same section and told apart by the "Ground" column.
   - `user reaction` — the user's preferences that can be made out **from the user's words · decisions · reactions** even though the user did not say like or dislike directly (D-63 "B가 파악한 사용자 취향도 적기 가능" ("user preferences B has made out may also be written")). Examples: having seen output B's preference remark, the user asked without a word for that place to be fixed · the same kind of change request was repeated.
   - `B's remarks` — **B's own** likes and dislikes that output B wrote in the report's X-N "preference remarks" group (including those the user did not react to — D-64 G-22 (ㄴ)). Carry the remarks over one line each, and if the user showed a reaction to a remark, write it as well in the "Basis" column. The preference-recording B itself does not open that Task's deliverable again and make new remarks — only remarks already written in the output B report are carried over.
   - **In the "Basis" column write where and from what it was written** (checkpoint name · report path and X-N number · quotation of the user's words) — if no basis can be given, do not write the line.
   - If the user answered a B remark **in words** (e.g. "그 색은 싫다" ("I dislike that color")), those words become a §3 line. Leave the remark line in §4 as it is, and write its number in the "Related §4" column of the §3 line.
3. Write **both likes and dislikes.**
4. A line once written is neither deleted nor modified. If the view changes, add a **new line** and write the old line's number in the "Replaced line" column — the reading side follows **the latest line** for the same target. **If a §3 line diverges from a §4 line, §3 wins** (regardless of which line came first — what the user directly requested comes before B's inference). **`B's remarks` lines in §4 diverging from each other is not a change of view** — output B is a different session for each Task · round, so a later remark does not replace an earlier one. Leave the "Replaced line" column empty and keep both — the reading side sees the fact that B's remarks are split.
5. Line numbers are assigned separately per section — §3 is `U1`·`U2`·…, §4 is `B1`·`B2`·… (output B reports · layout documents point by these numbers).
6. Whose preference it is, is told apart by the "Source" column (project · Task). If other people come to use this pipeline, the reading side looks **only at its own user's lines.**
7. If there is nothing to accumulate, do not add a line — write that fact in the result of the call.

## 3. What the user directly requested

| # | Like / dislike | Target (expression · design · readability — target · what) | The user's words verbatim | Source (project · Task · checkpoint) | Date | Related §4 | Replaced line |
|---|---|---|---|---|---|---|---|

(No lines yet — they accumulate from the first `spreadsheet` Task.)

## 4. B's inferences

| # | Ground (user reaction / B's remarks) | Like / dislike | Target (expression · design · readability — target · what) | Content (one line) | Basis (where and from what — checkpoint · report path · X-N · user reaction) | Source (project · Task) | Date | Replaced line |
|---|---|---|---|---|---|---|---|---|

(No lines yet — they accumulate from the first `spreadsheet` Task.)
