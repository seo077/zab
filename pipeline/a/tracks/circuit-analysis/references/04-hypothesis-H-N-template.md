# Hypothesis H-N template · design error list

> The template for step 4, deriving errors and hypotheses. The rules are `../rules.md` §5 · §7.
> A's share goes as far as setting up a hypothesis and designing the measurement/simulation mapping that will discriminate it. The verdict is the verifier's alone.

---

## 1. Hypothesis table (standard fields)

All error and risk candidates are accumulated under `H-N` numbers.

| Field | Description |
|---|---|
| `H-N` | Hypothesis number (once given, not reused or rearranged) |
| Hypothesis | One sentence saying "what deviated/failed and how" |
| Circuit area | Related module (`M#`) + block · part location |
| Means of confirmation | The measurement point · simulation item · netlist basis that will discriminate this hypothesis |
| Priority | High/medium/low — impact scope × likelihood of occurrence |
| Verification dependency | Other `H-N` · `Q-ID` that need to be confirmed first |
| Verdict | **Only as far as `remaining`/`candidate`** — rejected/confirmed is the verifier's |

> Verdict words (`PASS` · `FAIL` etc.) are not used (common rules §2 G-5 reinforcement). They cause false hits when the verifier scans the deliverable.

## 2. Narrowing down and preservation

- Many initial hypotheses → narrow down each round by measurement/simulation. **A rejected hypothesis is not deleted; strike it through + preserve the basis** (regression prevention, common rules §4).
- Each hypothesis must have a means of confirmation that will discriminate it. A hypothesis with no mapping is marked separately as "means of confirmation not designed".

## 3. Design error list — do not mix the two sections

`design-error-list_<project>.md` holds two groups of different character **in separate sections**.

| Section | Content | Standing |
|---|---|---|
| §1 User-confirmed errors | Items the user replied "it is an error" to | The user's reply is **cited as fact**. Error confirmed |
| §2 Remaining hypotheses | Risks needing confirmation that A registered (`H-N` remaining) | **Unjudged**. Whether it is an error is not decided here |

- A §2 item is confirmed as an actual error only **after the verifier's verdict**.
- Write the **impact scope of a fix** for each error item, so it can be used right away when fixing them in a batch later.
- If the user's policy is "not fixing in the current round; analyze the current state as it is", update only the wiring facts and do not write a verdict that it "has been resolved".

## 4. Synthesis in the integrated document

Collect the per-module `H-N` in the integrated analysis document (`circuit-analysis_<project>.md`) and deliver them as **a hypothesis synthesis table + a coverage grid**.

- Coverage grid = modules (rows) × confirmation axes (columns). An empty cell = a combination not yet looked at (common rules §6 omission check).
