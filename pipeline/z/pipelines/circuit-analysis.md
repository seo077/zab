# Pipeline definition — circuit-analysis

> A pipeline that analyzes a designed schematic module by module, examines function and behavior, and diagnoses errors, risks and points for improvement.
> **Status: complete (`new-pipeline` — Phase 4 of the v0.7 development repository, ★ Final acceptance 2026-08-20).** The header table · step table · completion conditions are filled in. The basis of its making (confirmed spec · outline) and the verdict and closing records are in `AI 논의사항.md` Round 1 §"Phase 4-1 …" · §"Phase 4 step 4 판정·마감" of the v0.7 development repository.

---

## Header table

| Item | Content |
|---|---|
| Purpose | Read a designed schematic module by module, analyze function and behavior, diagnose errors, risks and points for improvement, and deliver them as an analysis report |
| Input | The basic three: schematic PDF · netlist (.NET) · BOM (xlsx). Optional additions (opened at the ★ query-answer step): requirements specification · interface specification · block diagram, etc. |
| Output | Analysis report in 4 layers — integrated analysis (`output/analysis/circuit-analysis_<project>.md`) · per-module analysis (`output/analysis/circuit-analysis_<project>_<module>.md`) · design error list (`output/analysis/design-error-list_<project>.md`) · datasheet index (`output/analysis/circuit-analysis_<project>_datasheet-index.md`) |
| Tracks used | circuit-analysis (rules · references = `a/tracks/circuit-analysis/` · verification criteria = `b/tracks/circuit-analysis/`) |
| Expected step count | 5 (A's 5 steps) + 1 B merged criteria + 4 human checkpoints (input version confirmation · Criteria approval · query answers · simulation comparison) + B verification · ★ Final acceptance |

---

## Step table

| # | Who | What | Reads | Writes | Parallel |
|---|---|---|---|---|---|
| ★ | User | Confirm the versions of the three inputs (PDF · netlist · BOM) — the reference versions for the rounds that follow | the originals of the schematic PDF · netlist · BOM in `input/` | — | — |
| B-criteria | B | Merged criteria of this Task — write the common criteria + the circuit-analysis track + this project's additions merged into the single `log/T{N}_circuit-analysis/criteria.md` (criteria first, D-17·D-10) | `b/common-criteria.md` · `b/tracks/circuit-analysis/` · this project's spec | `log/T{N}_circuit-analysis/criteria.md` | solo |
| ★ | User | Criteria (merged) approval — before A starts producing | `log/T{N}_circuit-analysis/criteria.md` | — | — |
| 1 | A | Divide the circuit into functional domains and name them `M#_function-code` + assign each module an analysis depth L1/L2/L3. Write the version fingerprints (path · size · time · SHA256) and the basis/unresolved points of the actual netlist format and ordering | the three in `input/` · `a/tracks/circuit-analysis/rules.md` · `a/tracks/circuit-analysis/references/` | `output/analysis/module-decomposition-table.md` · `output/analysis/netlist-format.md` | solo |
| 2 | A | Write a draft of each module's behavior from the three-way check (netlist↔drawing↔BOM) and a signal connection table of both ends · branch devices/pins · original-text locations + produce the design-intent questions that arose in the process as a `DQ-ID` list | `output/analysis/module-decomposition-table.md` · `output/analysis/netlist-format.md` · the three in `input/` · `a/tracks/circuit-analysis/rules.md` | `output/analysis/circuit-analysis_<project>_<module>.md` (draft) · `output/queries/design-logic-query_<module>.md` | solo |
| ★ | User | Answer the design-intent questions (`DQ-ID`). If needed, hand over the requirements · interface specification · block diagram as additional input | `output/queries/design-logic-query_<module>.md` (question cells) | `output/queries/…` (append to the answer cells) · `input/` (additional input) | — |
| 3 | A | In-depth analysis per axis — ① datasheet check (against the BOM · pin function/multiplexing · selected mode/activation condition, unresolved = on hold + `Q-ID`) ② reflect the design intent of the query answers ③ logical consistency (laying intent↔circuit↔datasheet side by side) ④ derive quantitative operating points | the draft of 2 · the query answer cells · additional input · `a/tracks/circuit-analysis/rules.md`·`references/` | `output/analysis/circuit-analysis_<project>_<module>.md` (deepened) · `output/analysis/circuit-analysis_<project>_datasheet-index.md` | A1·A2… per module possible |
| 4 | A | Derive errors and hypotheses and prepare the simulation — design error list + the `H-N` hypothesis table and expected operating points · stimulus · analysis settings · observation nodes · model/Q-ID links | the deliverables of 3 · the query answer cells | `output/analysis/design-error-list_<project>.md` · §Hypothesis table of each module document · `output/models/<module>_sim-spec.md` | solo |
| ★ | User | Simulation result retrieval — run the manual simulation (OrCAD/LTspice) per the expected operating points and stimulus spec A produced, then hand over the results | the submitted version · fingerprint of `output/models/<module>_sim-spec.md` | `output/sim/` (results/waveforms/logs per round and item · link to the spec version used) | — |
| 5 | A | Overall report — tie the 4 layers, integrated · per-module · design error list · datasheet index, together with cross-references | all deliverables of 1~4 · the preparation spec in `output/models/` · the results in `output/sim/` | `output/analysis/circuit-analysis_<project>.md` (integrated) + update the cross-references of the 4 layers | solo |
| B | B | Verify the deliverables against the circuit-analysis verification criteria (`b/tracks/circuit-analysis/`) → verdict | `log/T{N}_circuit-analysis/criteria.md` (merged · ★ approved copy) · the 4 layers in `output/analysis/` · `output/analysis/netlist-format.md` · `output/models/` · `output/sim/` · `<paths of the version-transition record・neutral permission record・reading source>` | `log/T{N}_circuit-analysis/verification-summary/B<N>_*.md` | B1·B2… per module/axis possible |
| ★ | User | Decide whether to give final acceptance | `log/T{N}_circuit-analysis/verification-summary/B<N>_*.md` (verdict) | — | — |

### Format, connection and version-transition handoff

`netlist-format.md` of step 1 is written by one assignee. It leaves actual original-text/byte samples, spaces · tabs · empty leading/trailing fields · part-value boundaries, package/pin count, the exporter version · the source of the ordering, and the basis · uncertainty of the position↔pin correspondence. The method and fields follow `a/tracks/circuit-analysis/references/06-netlist-and-signal-connections.md`. A match of a few reference points or of the pin count is not used as confirmation of the whole pin map.

Steps 2~3 distinguish signal nets from power/passive nets, and link, across both ends and all branches of the assigned signals, the device/pin · original-text location · DS version/page · possible functions · selected mode · activation condition · source of intent. TX/RX names are auxiliary identifiers. For an unknown pin/mode, leave the Q-ID · impact · substitute check, and the unresolved points permitted per depth/submission stage are set in that Task's spec. Do not turn all of the existing L1/L2/L3 into exhaustive analysis.

Connections whose input · parser · pin map changed, and connections previously unverified, are traced again. For a reused connection, leave the before/after input version/fingerprint · both ends/branches · the basis that the mode is unchanged · the source of the earlier confirmation. A connection is not carried over merely because the node number exists, and exhaustive manual analysis of verified unchanged connections every time is not forced.

Keep the order: step 4 preparation → the user's manual run at ★ simulation result retrieval → step 5 linking → B comparison/verdict. Z assigns to B the paths and versions of both the preparation spec and the results. Unconfirmed follow-ups are relayed as item · impact · attempted/substitute means · decision needed, and the assignee · round · stop/accept are decided by Z and the user. Registering in the Q-ID/follow-up table does not substitute for a check that is needed now.

The role's ending at a ★ and the distinction between approval by direct inspection and conditional proceed follow `../interaction-rules.md` §1.1·§6.4. Conditional proceed is not treated as having generated the user's query answers or the manual simulation results.

### File ownership in parallel assignment

> step 3·step B can be run by several at the same time when there are many modules and axes. Fill in the below only then. If parallelism is not used within a pipeline, delete this table.

| Who | Scope | Files written exclusively |
|---|---|---|
| `A1` | The assigned bundle of modules (e.g. the power · clock family) | `output/analysis/circuit-analysis_<project>_<those modules>.md` |
| `A2` | Another bundle of modules (e.g. the communication · IO family) | `output/analysis/circuit-analysis_<project>_<those modules>.md` |

- The shared ledger (`log/manifest.json` — the Task ledger) is written **only by Z.** Parallel assignees only read it.
- Summaries are split into one file per assignee (`log/T{N}_circuit-analysis/build-summary/A1_*.md`).
- **A single file that several must fill in together**, such as the datasheet index (`circuit-analysis_<project>_datasheet-index.md`), is not made parallel — one assignee (e.g. A1) gathers and writes it, and the rest hand over their share.

### Verdict synthesis

> Have the Synth row only when there are several Bs per module/axis. If there is one B, it ends with the single `B` row of the step table above and this section is deleted.

| # | Who | What | Reads | Writes | Parallel |
|---|---|---|---|---|---|
| Synth | B (synth) | Gather each B's report into a one-line final verdict | `log/T{N}_circuit-analysis/verification-summary/B1_*.md`·`B2_*.md`… | `log/T{N}_circuit-analysis/verification-summary/B-synth_*.md` | solo |

---

## Completion conditions

- [ ] All 4 output layers exist and are not empty — `output/analysis/circuit-analysis_<project>.md` (integrated) · `output/analysis/circuit-analysis_<project>_<module>.md` (per module, as many as the modules decomposed) · `output/analysis/design-error-list_<project>.md` · `output/analysis/circuit-analysis_<project>_datasheet-index.md`
- [ ] The version fingerprints (size · creation time) of the three inputs are fixed at the head of the integrated and per-module documents
- [ ] The user's approvals and replies at the 4 ★ points (input version confirmation · Criteria approval · query answers · simulation comparison) are left in the round records of `log/run-log.md`
- [ ] This Task's merged criteria (`log/T{N}_circuit-analysis/criteria.md`) have been made and ★ approved (criteria first)
- [ ] For every design-intent query (`DQ-ID`), the user's answer cell has been filled in or it has been handled with the mark `intent unconfirmed`
- [ ] Every item whose datasheet could not be obtained is indexed with a `Q-ID` and left as `analysis on hold` (not filled in by guessing)
- [ ] B's verdict has been given and the user accepted at the ★ Final acceptance point
- [ ] The status of this Task (T{N}) in `log/manifest.json` has been updated and history has one line per step

---

## Records to keep

| What | Where | Who |
|---|---|---|
| Trace of progress per step (shared by all Tasks) | `log/run-log.md` | Z |
| Task ledger — Task list · status · dependencies | `log/manifest.json` | **Z only** |
| This Task's verification criteria (merged criteria · subject to human approval) | `log/T{N}_circuit-analysis/criteria.md` | B |
| Summary of what was built | `log/T{N}_circuit-analysis/build-summary/A<N>_<step>_R<M>.md` | A |
| Verification results | `log/T{N}_circuit-analysis/verification-summary/B<N>_*.md` | B |
| Pipeline problems that surfaced this time | `improvements/` (after the job is finished) | Z |

### Circuit handoff records

| What | Where | Who |
|---|---|---|
| Format observation · basis of the version transition | `output/analysis/netlist-format.md` · the signal connection/version transition sections of the per-module documents | A (the shared format file by one assignee) |
| Simulation preparation spec | `output/models/<module>_sim-spec.md` | the A of step 4 |
| Spec version used · run results · waveforms · logs | the per-round/per-item paths in `output/sim/` | User |
| Decisions on unconfirmed follow-ups | the decision records in `log/T{N}_circuit-analysis/assignments/` · link to the shared log | Z |
