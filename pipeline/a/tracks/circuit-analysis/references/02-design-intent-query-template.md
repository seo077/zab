# Design intent query (DQ-ID) template

> The template for asking the user the "why was it designed this way" that comes up while going through the circuit, instead of filling it in with a guess.
> The rule is `../rules.md` §3. This query list is the step 2 deliverable, and it goes to the user's ★ response point.

---

## 1. When to pull out a query

Pull one out when, while checking the three materials (netlist · schematic · BOM) against each other, **a design intent that A cannot judge** comes up. Examples:

- The three materials disagree with each other (not populated · labeling mismatch · missing connection).
- The wiring differs from common practice, and it cannot be known whether it is intent or a mistake.
- A part's identity or value is `TBD` or cannot be obtained, so the user has to decide the direction to proceed.

> A goes **only as far as asking and putting things side by side**. The verdict of error/not error is the verifier's share.

## 2. DQ-ID template

One query = one block in the file. Collect them per module in `output/queries/design-logic-query_<module>.md`.

```markdown
### `DQ-<module>-<NN>` — <one-line title>

| Item | Content |
|---|---|
| Target | <node · part · net — by netlist identifier> |
| Question | <the fact of what looks how + what is being asked> |
| Scope A has grasped | (a) <possible interpretation 1><br>(b) <interpretation 2><br>(c) other |
| Impact if unanswered | <which hypothesis or calculation is blocked if this query is not resolved (H-N · Q-ID)> |
| Related | <H-N · Q-ID · datasheet basis> |

#### User response

<The user appends here. Writing only the option number is fine>

#### A's reply

<The gist of what A returned when it was a counter-query — only when there is one>
```

## 3. ID convention

- `DQ-<module>-<serial>` (e.g. `DQ-M4-01`). **A number once given is not reused or rearranged** (`../rules.md` §2).
- When a response comes, **the response cell and the reply cell are preserved verbatim** (round preservation, common rules §4). Even if the version changes and node numbers differ, the cell stays on the basis of the version it states.
- An unanswered item is marked `intent unconfirmed` and only that item is put on hold — the rest of the analysis proceeds.

## 4. When reflecting a response in the in-depth analysis

- If the user's response was "it is an error", index it into **the user-confirmed errors section of the design error list** (`../rules.md` §7).
- If the response confirms the design intent, cite it as the [Intent] yardstick in the **logical consistency check** (`03-datasheet-check-and-assumption-index.md` §Logical consistency).
- If two statements within a response disagree (e.g. "it is needed but missing" vs "judged not needed"), **A does not decide which it is** and leaves only that fact.
