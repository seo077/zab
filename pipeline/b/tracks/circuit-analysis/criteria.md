# Verification criteria — track "circuit-analysis"

> **This document is the second of the three layers** (`b/common-criteria.md` §8). What is here is checked **only in circuit-analysis work**.
> In actual work the verifier merges `common` + this document + the items needed only for this Task into one and sends it down as `log/T{N}_<job>/criteria.md` in the Task room concerned.
> **The definitions of the verdict values · severities · overall rules are not here** — they are only in `b/common-criteria.md` §1·§2·§6. Here only what to check (the items) is set.
> Only the verifier writes the body. Other roles go only as far as the folder and an empty file.

---

## 0. What this document checks and what it does not check

**What it checks** — whether the **analysis report** (the 4 output layers) that comes out when the circuit-analysis pipeline is run on an actual circuit has the form · content · consistency the track requires.

**What it does not check**
- The format of the pipeline definition file (`z/pipelines/circuit-analysis.md`) · the rules (`a/tracks/circuit-analysis/`) themselves → the common layer + this job's items check that. This document takes **the analysis report produced** as its target.
- **B's own independent engineering verdict** on whether the circuit design is right → B checks whether the report **reaches its conclusion on its own basis**; B does not redesign the circuit in its place. The check of circuit facts (netlist · datasheet values) is done as P-4 fact verification (§4), but the final right or wrong of the design is the share of the user · the simulation.

> This track is **not work that touches the original** (it does not convert · move the input; it produces a new analysis). Therefore common §5 (intactness · comparison baseline · preservation list) does not apply in principle — except that **fixing the input version** (the first ★ of §1) is an exception, which CA-2 of this document checks separately.

### Skeleton

```
§1  Input · version           CA-1 ~ CA-3   — what the analysis was based on, and whether that version was fixed
§2  The 4 output layers       CA-4 ~ CA-8   — whether all four layers exist and each does its own job
§3  Module decomposition · depth  CA-9 ~ CA-11  — M#_code naming · L1~L3 depth assignment
§4  Substance of the analysis CA-12 ~ CA-18 — three-way cross-check · 4 axes · datasheet check · quantitative operating points
    §4.1 Connection basis     CA-26 ~ CA-30 — format · direction/name · both ends · version transition
    §4.2 Reading sources and means — the reading methods for connections · simulation to carry into the merged criteria
§5  Traceability              CA-19 ~ CA-22 — whether it is linked by query (DQ) · hold (Q) · hypothesis (H) IDs
§6  The 3 human checkpoints   CA-23 ~ CA-25 — ★ input version · query answers · simulation comparison reflected
§7  Gray areas · discovery    — the places to be careful about that are peculiar to this track
```

---

## 1. Input · version (CA-1 ~ CA-3)

| # | Item | Severity | How to check |
|---|---|---|---|
| **CA-1** | The basic three inputs were **all used as the basis** | Required | Whether the report actually referred to **all three** of the schematic (PDF) · netlist · BOM. If even one of the three does not appear as a basis, the three-way cross-check (CA-12) cannot hold. If there were optional additional inputs (requirements · interface specification · block diagram), also check where they were reflected |
| **CA-2** | The **input version** that was the basis of the analysis is **fixed · stated** | Required | Whether the versions (fingerprint such as size · time) of the three chosen at the first ★ (input version confirmation) are written in the report, and whether the analysis thereafter went **with that version as the baseline**. If the version is not pinned down, it cannot be traced back which drawing the analysis looked at |
| **CA-3** | There is **no break** between the basis input and the conclusion | Recommended | Whether it can be traced back "where in which input" a conclusion · error finding came from (pin · net · part reference, etc.). If there is a place concluded without a basis, leave it as a finding |

---

## 2. The 4 output layers (CA-4 ~ CA-8)

> Output = the four layers **integrated analysis · per-module analysis · design error list · datasheet index** (header table). The four do different jobs, and only when they point to each other do they make one set.

| # | Item | Severity | How to check |
|---|---|---|---|
| **CA-4** | **All four layers exist and are not empty** | Required | Whether the deliverable (file or section) of each of integrated · per-module · design error list · datasheet index exists and has substance. Since the file-path-level detail is set by A in step 3 of the definition, check the **paths listed in the definition's completion conditions** against the actual output |
| **CA-5** | Whether the **integrated analysis** ties the whole together | Required | Whether it organizes, one layer above, the function of the whole circuit · the signal flow · the relations between modules, rather than simply stringing the per-module parts together. If it is a copy of the per-module parts, Fail |
| **CA-6** | Whether the **per-module analysis** holds actual content for each module | Required | Whether there is a function · behavior analysis for each of the modules (M#) divided in §3. Whether it has the detail that fits the assigned depth (L1~L3, CA-11) |
| **CA-7** | Whether the **design error list** holds the diagnosis results | Required | Since the purpose is "diagnose errors · risks · points for improvement", whether the errors · risks · points for improvement found are organized as a list. Whether each item is linked to a basis (which module · which input). **If there are none, whether "confirmed that there are none" is written together with a basis** — a silent blank is Fail |
| **CA-8** | Whether the **datasheet index** supports the check | Recommended | Whether the datasheets referred to are indexed per BOM part, and whether it is linked to the datasheet check of the 4-axis analysis (CA-14) |

---

## 3. Module decomposition · depth (CA-9 ~ CA-11)

| # | Item | Severity | How to check |
|---|---|---|---|
| **CA-9** | The circuit was **decomposed into modules** | Required | Whether the whole circuit was not looked at as one lump but divided into functional-unit modules. Whether the result of the division does not disagree with the actual composition of the circuit (check against the netlist · drawing) |
| **CA-10** | Module naming follows a **consistent code scheme** | Recommended | Whether an identifier of the form `M#_function-code` is attached to each module, and whether that identifier points to the same thing throughout the integrated · per-module · error list. If the same module is called by two names, the cross-references break |
| **CA-11** | An **analysis depth was assigned** to each module | Recommended | Whether a depth grade such as L1/L2/L3 was given per module, and whether the actual analysis detail fits that grade (whether a module to be looked at deeply was not skimmed shallowly and passed over). Whether the basis of the depth assignment is not arbitrary |

---

## 4. Substance of the analysis (CA-12 ~ CA-18)

> Checking the format alone passes a report whose **shape is 4 layers but which actually has no analysis** (consistent with common C-F1). The substance is checked with the items below. This is the core of this track.

| # | Item | Severity | How to check |
|---|---|---|---|
| **CA-12** | The **three-way cross-verification** was actually done | Required | Whether there is a trace of having checked the three, netlist↔drawing↔BOM, against each other — whether the places where the three disagree (a part that is in the drawing but not in the BOM, etc.) were pointed out. If only one source was copied over, it is not a cross-check |
| **CA-13** | **All four axes were covered** | Required | ① datasheet check ② reflecting the intent of the query answers ③ logical consistency (intent↔circuit↔datasheet) ④ quantitative operating points — whether the four axes actually appear in the analysis. If an axis is missing, point out which axis |
| **CA-14** | The **datasheet check** was done against the BOM, and failures were not swallowed | Required | Whether the part specs were confirmed with datasheets, and whether the baseline for that is the BOM. **Whether a datasheet that could not be obtained was exposed as "on hold + Q-ID"** — if something that could not be obtained was passed over as if it had been confirmed, Fail (consistent with common §7 "could not be verified is not counted as Pass") |
| **CA-15** | The **logical consistency** links the three vertices | Required | Whether it was examined that the three — design intent ↔ actual circuit ↔ datasheet — fit each other. If consistency was discussed looking at only two of the three (e.g. the circuit alone, without the intent), it is half done |
| **CA-16** | The **quantitative operating points** come out as numbers | Recommended | Whether operating points such as voltage · current · timing are presented not in words but as numbers · supporting formulas. If there is only qualitative description such as "appears that it will operate normally", it is regarded as axis ④ of CA-13 not being met |
| **CA-17** | **The errors · hypotheses were derived from facts** | Required | Whether the design error list · hypotheses (H-N) came out of the preceding checks · analysis, or were laid on without a basis. Whether each error can be traced back to "which module · which basis" |
| **CA-18** | The producer's **self-assessment is not taken as a basis** | Required | Producer statements such as "analysis complete" "no abnormality" are not a basis (consistent with common §7). Judge by **the analysis itself in the body** of the report. This item is a discipline on the verifier itself |

### 4.1 Netlist and signal connections (CA-26 ~ CA-30)

The existing numbers CA-1~25 are kept. The items below are additional items for following the three-way cross-check · logical consistency all the way to the actual pin connections. The signals to be analyzed · the depth · the submission step and **the permitted range of unresolved points are set in the Task spec concerned and fixed in the merged criteria**. L1/L2/L3 are not unconditionally turned into exhaustive confirmation. If a fact needed for the approved scope cannot be confirmed, follow §7 and common §7. B does not arbitrarily narrow the scope or fill in blanks with a guess on the ground that the spec is missing.

| # | Item | Severity | How to check |
|---|---|---|---|
| **CA-26** | **The basis and the uncertainty of the actual netlist format · pin map are recorded** | Required | Check `output/analysis/netlist-format.md` against the actual input version. Look for spaces · tabs · consecutive spaces · empty leading/trailing fields · part-value boundaries, the package · pin count · export tool/version · source of the ordering, and the original-text samples and the basis of the position↔pin/ball correspondence. Do not discard empty fields; reproduce them to fit the actual format. Do not confirm the whole pin map from a pin-count match or 3 reference points alone, and do not take string alignment as the rule of every tool. Separate the confirmed scope from hypothesis/unresolved |
| **CA-27** | **Pin function and direction were checked across the whole connection · mode · activation condition** | Required | Distinguish power/passive nets from signal nets. Follow both ends and every branch · external drive of the assigned signals, and set the datasheet function · multiplexed function · selected mode · activation condition against the actual wiring. Distinguish bidirectional · open-drain · tri-state. Zero/multiple outputs are candidates to check per condition, not an automatic error or a conclusion of normal. If the selected mode · drive condition is unknown, leave it as unresolved |
| **CA-28** | **Signal names were not used as a confirming basis for direction · connection · intent** | Required | Separately from which device an auxiliary name such as TX/RX is relative to, check the pin function · the actual connection · the source of the user's intent. Even if the name and the pin function disagree, do not cover the direction with the name. A description that has only the name is not evidence of a function check |
| **CA-29** | **It is traced from the device · pin/ball at both ends of the assigned signals to the original text and the functional basis** | Required | In the module's signal connection table, follow the device · pin/ball of every endpoint/branch, the input version · original netlist row/field and the drawing/BOM location, and the datasheet version · page/table · pin-function basis. An endpoint that has only a device name is not a complete pin basis. An unresolved pin leaves the target · impact · substitute check by Q-ID or the like, and is checked against the range permitted by the spec per depth/submission step. Do not treat a needed pin confirmation as met merely on the ground that it was recorded |
| **CA-30** | **At a version transition, the basis of re-tracing and the basis of reusing unchanged connections are distinguished** | Required | Check whether the connections affected by an input · parser · pin-map change and the previously unverified connections were traced again. A reused connection links the before/after input version · fingerprint, the basis that the device/pin at both ends · the branch connections are unchanged, the unchanged state or the impact of change of the mode/activation condition, and the source of the earlier direct confirmation. The existence of a node number alone does not prove preservation. Do not force a manual exhaustive confirmation every time even of unchanged connections that have a basis. If, being the first version, there is nothing to carry over/reuse, leave not applicable and the reason in the merged criteria and exclude it from the count |

### 4.2 Reading sources and means — carried together in the merged criteria

The criteria-writing B carries the methods below and the actual paths · versions · reading scope of the Task concerned into the reading-method section of the merged criteria. The methods of this section do not create new items or a separate severity. The judging B uses the items and methods of the approved merged criteria, and does not judge only by the output of parser/check code A made. If a source has not been assigned, request it from Z according to common §8.2.

| Target | Main source | Substitute source · conditions | B's means of reading |
|---|---|---|---|
| Format · pin/ball mapping | The fixed netlist original text · netlist-format record, the pin-order basis of the CAD/exporter concerned · the part library/package pin table | A copy of the original text of the same version, the export specification · the correspondence between a separate export that includes pin names and the original input. Agreement of some reference points is auxiliary evidence for that scope | Read the original rows by bytes · tab/space separation and reproduce them with known samples. Include samples of empty leading/trailing positions · value boundaries, and write separately the level of confirmation of the pin count/the whole ordering |
| Connection · function · intent | netlist · drawing · BOM, the datasheet pin function/multiplexing table, the actual selected mode · activation condition, the user's DQ answers | An explicit pin-connection export of the same version, reading of the drawing image, additional original-text material. The correspondence · limits of each substitute and actual read permission are needed | Find directly every part row and branch in which the node appears, link them by device/pin, and check the function/mode. Do not read the row of one side only or fill in a pin from the name |
| Version transition | The before/after input · parser/pin-map versions and the change record, the source of the earlier confirmation | A copy of the same version and the correspondence record of the unchanged connections | Changed/previously unconfirmed connections are traced again. For reuse, confirm the evidence that both ends · branches · mode are unchanged before and after, and use only that scope |
| Simulation preparation · results | `output/models/<module>_sim-spec.md`, the actual model/assumptions, the per-round · per-item waveforms · logs/results of `output/sim/`, the module's H-N · Q-ID | A copy of the same version, a waveform image/text that has the observation points · axes · units · version link. If a value or condition cannot be read, unconfirmed | Link the preparation spec version and the user's run result version, read directly the expected operating points · stimulus · analysis settings · observation nodes · model assumptions, and check them against the results |

Do not conclude from failure of PDF plain-text extraction alone that every substitute reading is impossible. Within the assignment · tool scope, consider the possible means such as images, and leave the reason for failure/not doing it. If it could not be verified, hand it off with the impact · substitute means · decision needed of §7, and do not raise a signal name from another source or an earlier report to evidence of the original-text function.

---

## 5. Traceability (CA-19 ~ CA-22)

> This track **hands unresolved items over by ID** across several steps (design-logic query DQ · hold Q · hypothesis H). If an ID breaks, it cannot be known which thing of an earlier step a later step answered.

| # | Item | Severity | How to check |
|---|---|---|---|
| **CA-19** | The **design-logic queries (DQ-ID)** were produced at the draft step | Required | The design-logic query is not input received in advance but something **the pipeline made during the analysis draft and asked the user** (spec D-31 (1)). Whether that query list exists with DQ-IDs attached |
| **CA-20** | **The query answers were reflected in the in-depth analysis** | Required | Whether the design intent the user answered actually went into the subsequent per-axis in-depth analysis (② reflecting intent · ③ logical consistency). If the answers were only received and the analysis did not change, the ★ ran for nothing |
| **CA-21** | A **hold (Q-ID)** did not end while still pending, or if it did, that fact and its impact are exposed | Recommended | Check whether the target · impact · substitute check of unresolved Q-IDs such as datasheet · pin map · selected mode were exposed and the decision needed was handed off. Do not pretend an open item is closed. This Recommended item is the traceability of the hold record. The non-confirmation of a separate Required fact is not resolved by registration as a Q-ID/in a follow-up table, and is handled per common §7 |
| **CA-22** | A **hypothesis (H-N)** is distinguished from a confirmed conclusion | Recommended | Whether hypotheses not yet verified and confirmed errors are not mixed together. Whether it is shown that a hypothesis is something that goes on to the simulation comparison (★) |

---

## 6. The 3 human checkpoints (CA-23 ~ CA-25)

> The three ★ of the outline — input version confirmation · query answers · simulation comparison. Check whether what the person gave at each ★ was **actually reflected** and **left in the records** (where the ★ itself is placed is the share of the definition · Z, so this document does not set it — it checks only whether it was reflected).

| # | Item | Severity | How to check |
|---|---|---|---|
| **CA-23** | ★① **Input version confirmation** was reflected | Required | Paired with CA-2. Whether the version the user fixed was used as the baseline of the analysis and that approval was left in the records |
| **CA-24** | ★② **Query answers** were reflected | Required | Paired with CA-20. Whether the user's answers and (if it was opened) the optional additional input went into the in-depth analysis, and the fact of the answers was left in the records |
| **CA-25** | **Simulation result retrieval · comparison** is linked to the preparation spec | Required | Read directly the expected operating points · stimulus · analysis settings · observation nodes · model/Q-ID and the H-N of `output/models/<module>_sim-spec.md`, which A wrote in the existing step 4. Link the per-round/per-item results · waveforms · logs that the user, running manually with the same spec version, handed over to `output/sim/`, and B compares them. Distinguish the report's user-confirmed errors from the unjudged remaining hypotheses, and leave B's H-N verdict with its basis. A's self-assessment or the result files alone do not stand in for the preparation spec. Simulation not performed · version mismatch · results unreadable leave the impact and the decision needed, and follow common §7 |

Simulation preparation is the work of the existing step 4; do not create a new step or remove `output/models/`. After retrieving the user's results, Z assigns to the judging B the actual paths · versions of **both** the model/preparation spec and the simulation results. Running is the user's role, preparation is A's, comparison · verdict is B's. A mismatch is examined for its basis by distinguishing analysis · model · settings/stimulus, and B does not directly fix the model or the deliverables. The next assignee · round is returned to Z · the user.

---

## 7. Gray areas · self-discovery — the places to be especially careful about in this track

| Situation | How |
|---|---|
| A datasheet could not be obtained, so the spec cannot be confirmed | The on-hold marking of CA-14 is a requirement not to hide whether something was confirmed. If a Required fact of the currently approved criteria could not be confirmed, it is Fail regardless of whether a Q-ID was registered (common §7). If it is a Recommended fact, handle it as Conditional/Fail according to the impact. If it pretends to have confirmed, CA-14 is not met either |
| B is not confident whether the circuit itself is right | B does not redesign the circuit. It checks only **whether the report reaches its conclusion on its own basis**. The final word on engineering right or wrong is the share of the simulation · the user (§0) |
| There are no simulation results yet (simulation result retrieval not performed) | Do not conclude whether hypothesis H-N is confirmed. Leave the non-confirmation of the preparation spec · results and the impact. Do not treat a Required comparison needed in the currently approved scope as met by a record of the limitation alone (CA-25 · common §7) |
| The pin/ball mapping or the selected mode is unresolved | Leave the Q-ID and the affected connections · substitute means · decision needed. Separate the confirmation of the datasheet pin function from the confirmation of the exporter position mapping/the mode actually used. Do not mix the levels of confirmation and conclude always contention · necessarily floating |
| There are zero outputs or several | Keep the net type · all branches · external drive · bidirectional/open-drain/tri-state and the activation condition as candidates to check. Do not settle the right or wrong of the design from the number of outputs alone |
| An unconfirmed item was put in the follow-up table | Distinguish follow-up registration from the current verdict. B presents only as far as the item that could not be verified · impact · substitute means · decision needed. The assignee · round · stop/accept are decisions of Z · the user, and a currently Required unconfirmed item remains as it is |
| There is no right answer to how far to split the modules | Check by **whether the decomposition does not disagree with the circuit facts** (CA-9) and **whether the depth assignment is not arbitrary** (CA-11), rather than by the decomposition itself |
| It is the first version, so only one shallow lap was run | Since the spec set that the first version is run lightly (D-31, Phase 4 = run test), a lack of depth is not in itself an immediate Fail. However, **whether the skeleton of 4 layers · 4 axes · three-way cross-check stands** is Required even for the first version. Distinguish shallow from missing |

> **Self-discovery (X-N) is attached in the verdict round.** Since this document is the criteria-writing step, the above marks in advance the places to be careful about at the time of the verdict.

---

## 8. Basis — where these items were drawn from

The source of the existing CA-1~25 is **`AI 논의사항.md` Round 1 §"Phase 4-1 회로분석 파이프라인 입력 시드 사양 확정 (D-31)" §확정 사양(머리표 + 얼개)** (the confirmed spec: header table + outline). The reinforcements below were derived from the D-98 confirmed spec R1 of T8 of the origin workspace (H-001 · U-01~06, including the adopted adjustment points). The past circuit facts · parser hypotheses of the T8 input were not carried over as a verdict on a new circuit. Each actual circuit Task merges · approves this track and its own spec and uses that (common §8 · independence I-1).

| Place | Basis |
|---|---|
| §1 Input · version (CA-1~3) | Header table "Input" + the first ★ of the outline (input version confirmation) + lesson C (version fingerprint) |
| §2 The 4 output layers (CA-4~8) | Header table "Output = 4 layers" + outline step 5 (cross-references of the 4 layers) + asset 7 |
| §3 Module · depth (CA-9~11) | Outline step 1 (M#_function-code · L1/L2/L3) + assets 2·3 |
| §4 Substance of the analysis (CA-12~18) | Outline steps 2·3·4 (three-way cross-check · 4 axes · datasheet failure = on hold · quantitative operating points) + assets 1·4·5 |
| §5 Traceability (CA-19~22) | D-31 (1) (the design-logic query is a deliverable) + outline step 2 DQ-ID · step 3 Q-ID · step 4 H-N |
| §6 The 3 ★ points (CA-23~25) | D-31 (3) the 3 ★ + the three ★ lines of the outline |
| §4.1 CA-26~30 · §4.2 | T8 confirmed spec R1 U-01~05, additional adjustment X-9. The basis and limits of the actual format · both ends · conditions · version transition |
| CA-21 · §7 reinforcement | T8 U-06. The common rule on Required unconfirmed items and the role boundary of follow-up decisions |
| CA-25 · §4.2 simulation reinforcement | T8 H-001, additional adjustment X-5. Linked from the existing step 4 preparation material through to the user's · B's reading |

---

## 9. Item count

| Severity | Count | Items |
|---|---|---|
| **Required** | 23 | CA-1, CA-2, CA-4, CA-5, CA-6, CA-7, CA-9, CA-12, CA-13, CA-14, CA-15, CA-17, CA-18, CA-19, CA-20, CA-23, CA-24, CA-25, CA-26, CA-27, CA-28, CA-29, CA-30 |
| **Recommended** | 7 | CA-3, CA-8, CA-10, CA-11, CA-16, CA-21, CA-22 |
| **Optional** | 0 | — |
| **Total** | **30** | CA-1 ~ CA-30 |

This is the track's original item count. The Task's merged criteria leave the items that are not applicable under the applicability conditions and the reason, and exclude those items from the count. If a common item and a track item require the same fact in duplicate, tidy them keeping the sources according to the merging rules of common §8, and do not weaken could-not-be-verified.
