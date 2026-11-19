# Rules — `circuit-analysis` track

> What A keeps when analyzing a designed circuit module by module to diagnose function, behavior, errors and risks.
> What is always kept, whatever the track, is in `a/common-rules.md`. Only **what is not there and is needed only in this track** is written here.
> The method details (decomposition method · hypothesis template · simulation procedure · datasheet index format) are in `references/` — take them out and read only when needed.

---

## 1. Pin down the version before starting

The three circuit materials (schematic PDF · netlist · BOM) are revised often. **Before starting the analysis, fix by fingerprint which version is taken as the baseline**, and write it as is at the head of the integrated and per-module documents.

- Fingerprint = **file path · size (bytes) · creation time · SHA256**. Later rounds take this version as the baseline.
- If the version changes, leave **the fact that it was changed + the new fingerprint + the reason for replacing it**, and mark the old version "excluded from the baseline" but do not delete it.
- Fixing the version is the pipeline's first ★ (user confirmation) — the analysis is not finalized before that approval.

---

### 1.1 Format and the basis for a version switch

In step 1, at the start, one assignee records in `output/analysis/netlist-format.md` actual original-text/byte samples and the boundaries of spaces · tabs · empty leading/trailing fields · component values, the package/pin count, the exporter version · the source of the ordering, and the basis · unconfirmed parts of the position↔pin correspondence. Do not generalize string alignment or the agreement of a few reference points/the pin count into a confirmation of the whole pin map. The fields are in `references/06-netlist-and-signal-connections.md` §1.

Connections whose input · parser · pin map changed, and connections unconfirmed before, are traced again. For reusing a confirmed unchanged connection, leave the before/after input version/fingerprint · both ends/all branches · the basis that the selected mode is unchanged · the source of the earlier confirmation. Do not carry a connection over because the node number remains, and do not force a manual exhaustive analysis of unchanged connections every time (§3 of the same reference).

## 2. Divide into modules, and do not change a name once given

Split the whole circuit into **functional domains** and analyze each independently.

- Module identifier = `M#_function-code` (e.g. `M2_PWR-CONV`, `M5_COMM-485`). Name it by **the function of that circuit, not by the kind of work**.
- **A module number or code once assigned is not rearranged even as rounds go by.** Traceability breaks. (The same intent as the self-made decision numbering rule of common rules §3 — here it applies to all of the module · hypothesis · query · assumption IDs)
- State the **analysis depth L1/L2/L3** for each module. The depth definitions and the assignment criteria are in `references/01-module-decomposition-and-depth.md`.

---

## 3. Read the three materials by checking them against each other (do not trust one material alone)

A circuit fact is confirmed only by **cross-verification of the three materials: netlist · schematic · BOM**. Do not conclude from looking at one alone.

- Node and pin names **follow the netlist identifiers** — it must be possible to match them 1:1 against simulation signals later.
- If the three materials disagree, that itself is a finding (not populated · labeling mismatch · missing connection, etc.). **A does not judge** which side is right — write only the facts side by side.
- A "why was it designed this way" that comes up while going through the materials is not filled in with a guess; pull it out as a **design intent query (`DQ-ID`)** and pass it to the user's ★ response point. The query template is `references/02-design-intent-query-template.md`.

---

### 3.1 Link both ends and the branches of a signal

Distinguish power/passive nets from signal nets. For each assigned signal, record in the module document's "Signal connections" the component · pin/ball of every endpoint/branch, the location in the original text of the input version, the datasheet version · page · pin function, the possible multiplexed functions and the selected mode · output-enable condition · external drive · the source of the intent. Names such as TX/RX are kept only as auxiliary identifiers, and the basis for direction is not filled in from the name.

Bidirectional · open-drain · tri-state · external drive are distinguished per condition. Zero outputs/multiple outputs are candidates to check, and are not used as a law that every signal must have exactly one output. An unconfirmed pin/mode is left as a Q-ID. The range of unconfirmed items allowed at each depth (L1/L2/L3) · submission step is set in the Task spec concerned, and the existing depths are not all turned into exhaustive analysis. For the tables and the linking of evidence, use `references/06-netlist-and-signal-connections.md` §2.

## 4. A value that could not be obtained is not estimated; leave it on hold

If there is no datasheet, or the part is custom-ordered so its constants are unknown, **do not make them up.**

- Every estimated or unobtained value is **indexed with a `Q-ID`**, and the source of the assumption is written next to where it is used. The format is in `references/03-datasheet-check-and-assumption-index.md`.
- Failure to obtain a datasheet = **`analysis on hold` + `Q-ID`**. That item is left blank in the in-depth analysis, but in a way that shows why it is blank.
- For a part it was decided to proceed with as `TBD`, **estimation is prohibited** — if the user decided so, hold it as is.
- If the pin correspondence · selected mode · enable condition is unknown, leave, in the same Q-ID manner, the fact that could not be confirmed · the affected signals/hypotheses · the means tried/substitute means · the decision needed. Registration in a follow-up table is not completion of the confirmation needed now. The assignee · round · stop/accept decision is returned to Z · the user.

---

## 5. Set up hypotheses but do not judge them

Error and risk candidates are accumulated as **hypotheses `H-N`**. A's share goes as far as setting up a hypothesis and designing the measurement/simulation mapping that will discriminate it.

- **Verdict words (`PASS` · `FAIL` etc.) are not used** in the hypothesis table (consistent with common rules §2 G-5 reinforcement). The status goes only as far as `remaining` · `candidate`. **The verdict of rejected/confirmed is the verifier's alone.**
- An `H-N` number once assigned is not reused or rearranged. Even if rejected, do not delete it; leave it struck through + the basis (consistent with the round preservation of common rules §4).
- The hypothesis template and fields are in `references/04-hypothesis-H-N-template.md`.

---

## 6. A does not run the simulation — prepare it and hand it over

Quantitative behavior is not confirmed by reasoning alone. However, **the simulation is run manually by the user** (there is no automatic simulation tool).

- What A does: in the existing step 4, prepare in `output/models/<module>_sim-spec.md` **the expected operating points + stimulus + analysis settings + observation points (netlist node names) + model source/assumption Q-IDs + H-N links** so that the user can run it as is, and link the spec version · fingerprint.
- What the user does: run with OrCAD/LTspice → load the results · waveforms · logs of the same spec version into the per-round/per-item paths of `output/sim/` (★ Simulation result retrieval).
- Even if reasoning and simulation disagree, **do not conclude "the analysis is wrong"** — first discriminate whether the culprit is the analysis, the model, or the stimulus. The procedure is in `references/05-simulation-prep-and-comparison.md`. **Comparison and verdict are the verifier's alone.** Hand to step 5 and to B the versions · paths of both the preparation spec (`output/models/`) and the user's results (`output/sim/`).

---

## 7. The output is delivered in 4 layers

The deliverables of this track are **four parts**. Put the **project name** in the file name so that the file name alone tells which circuit it is.

| Layer | File name | What |
|---|---|---|
| Integrated analysis | `circuit-analysis_<project>.md` | Module index + `H-N` synthesis + `Q-ID` synthesis + coverage |
| Per-module analysis | `circuit-analysis_<project>_<module>.md` | Node mapping · signal flow · quantitative values of one module |
| Design error list | `design-error-list_<project>.md` | User-confirmed errors / remaining hypotheses, organized **in separate sections** |
| Datasheet index | `circuit-analysis_<project>_datasheet-index.md` | Part↔datasheet↔assumption (`Q-ID`) correspondence |

- **User-confirmed errors** and **unjudged remaining hypotheses** are kept **in separate sections** and not mixed, even within one document — the former is a citation of fact, the latter is still before a verdict.
- The 4 layers are tied to each other by reference, but **the same content is not duplicated as body text in two places.** Keep one place as the single source and have the rest point to it.

---

## 8. Map of the references

`references/` is not read wholesale. Open only what is needed at that step.

| File | When |
|---|---|
| `01-module-decomposition-and-depth.md` | step 1 — when dividing into modules and setting L1/L2/L3 |
| `02-design-intent-query-template.md` | step 2 — when pulling out `DQ-ID` queries |
| `03-datasheet-check-and-assumption-index.md` | step 3 — when checking against datasheets and indexing `Q-ID`s |
| `04-hypothesis-H-N-template.md` | step 4 — when deriving errors and hypotheses |
| `05-simulation-prep-and-comparison.md` | step 3–5 — when preparing quantitative operating points and the simulation |
| `06-netlist-and-signal-connections.md` | step 1–3 · version switch — format observation, basis for both ends/branches · pin function/mode, re-trace/reuse records |
