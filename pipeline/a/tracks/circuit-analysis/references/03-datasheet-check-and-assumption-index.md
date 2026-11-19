# Datasheet check · assumption index (Q-ID) · logical consistency

> The three methods of the step 3 in-depth analysis. The rules are `../rules.md` §3 · §4 · §7.
> Put the datasheet ratings and the actual circuit conditions side by side, hold values that could not be obtained with a Q-ID, and check intent↔circuit↔datasheet against each other.

---

## 1. Datasheet check (axis ①)

Taking the parts of the BOM as the basis, obtain the datasheets and match **datasheet rating ↔ actual circuit condition** row by row.

| Item | Datasheet (rating/recommended) | Actual circuit condition |
|---|---|---|
| `<VCC · current · timing · clamp etc.>` | `<datasheet value>` | `<value from the netlist · calculation>` |

- **Do not judge** — "the margin is sufficient/insufficient" is the verifier's share. A only puts the two values side by side.
- If the datasheet cannot be obtained, that row is `analysis on hold` + `Q-ID` (§2 below). Do not fill it in with an estimate.

### 1.1 Pin function · selected mode check

Separately from the ratings table, link the datasheet pin function to both ends/all branches of each assigned signal. Distinguish the actual wiring by its location in the netlist · schematic · BOM, the possible functions by the datasheet version/page, and the actually selected mode by the circuit configuration · firmware/user-provided evidence. Do not fill in missing evidence with the TX/RX name.

| Signal/node · endpoint component/pin | DS document · version · page/table | Possible functions (including multiplexing) | Selected mode · basis | Output-enable condition · external drive | Source of intent · unconfirmed Q-ID |
|---|---|---|---|---|---|
| `<linked to the input version · location in the original text>` | `<where the function is cited>` | `<input/output/bidirectional etc.>` | `<observed fact or unconfirmed>` | `<per condition or unconfirmed>` | `<DQ response/spec or Q-ID>` |

The table that spreads out all endpoints/branches and the locations in the original text follows `06-netlist-and-signal-connections.md` §2. Even when the pin function has been obtained, that does not mean the whole exporter position↔pin mapping or the actually selected mode has been confirmed. Record them separately.

## 2. Assumption index (Q-ID)

Every value decided because the datasheet was not obtained or the part is custom-ordered is **indexed with a `Q-ID`**.

**(a) Stating the assumption** — next to the quantitative value or as a footnote:
```markdown
> Assumption stated (Q-<abbrev><NN>): <part><assumed constant · basis>. Datasheet not obtained —
> <where it was back-calculated from>. The exact value needs confirmation by the user's simulation or board measurement.
```

**(b) Datasheet index document** — collect part↔datasheet↔assumption in `circuit-analysis_<project>_datasheet-index.md`:

| Part | Specification | Where applied | Assumption | Q-ID | Datasheet | Affected circuit |
|---|---|---|---|---|---|---|
| `<part name>` | `<specification>` | `<module/block>` | `<assumed constant · basis>` | `Q-<abbrev><NN>` | available/not available | `<impact scope + priority>` |

- A `Q-ID` too is **not rearranged once given**. When the value is obtained, update that row but keep the number.
- An unconfirmed pin/ball correspondence · selected mode · enable condition is also linked with a Q-ID. This is not permission to newly estimate a constant that does not exist; leave the fact that it was not obtained as it is.

### 2.1 Handoff of unconfirmed impact · substitute confirmation

| Q-ID | Fact that could not be confirmed | Affected signal/module · H-N · limits of the current output | Means tried · result/failure | Substitute means of confirmation · materials needed | Decision needed · decision record |
|---|---|---|---|---|---|
| `<fixed ID>` | `<pin/mode/constant etc.>` | `<how far can anything be said>` | `<only what was actually carried out>` | `<distinguish possible candidates from untried ones>` | `<assignee/round/stop · accept go to Z · the user>` |

Do not write that the confirmation needed now is finished merely because of a Q-ID or registration in a follow-up table. The allowed range of unconfirmed items for the analysis depth/submission step concerned is set in the Task spec. B's unconfirmed results are also relayed as item · impact · substitute means · decision needed, and the actual assignee · round · stop/accept is linked to the separate record of Z · the user.

## 3. Logical consistency check (axis ③)

Put the confirmed **design intent** (user response), the **circuit facts** (the three materials) and the **datasheet ratings** — the three — side by side and present the points that need confirmation together with the basis.

- **State what was taken as the yardstick** for each item:

| Yardstick | Meaning |
|---|---|
| [Intent] | The confirmed design intent the user replied with (citation of fact) |
| [DS] | Datasheet rating · explicit statement (documentary basis) |
| [Practice] | General design practice (no written standard — a place where the yardstick is weak) |

- **Do not make a verdict of consistent/inconsistent.** Go only as far as matching the three and presenting "this is a point to confirm" together with the basis.
- For an item whose yardstick is filled by [Practice] alone, add a mark that the basis is weak.

## 4. Handling not-populated (NI) · `TBD`

- For a **not-populated part**, write down to the wiring consequence (e.g. the upper component is absent, so the node is fixed to GND). Not-populated is confirmed in both the BOM and the netlist.
- For a **`TBD` part**, estimation is prohibited — hold it with a `Q-ID` and wait for the user's decision.
