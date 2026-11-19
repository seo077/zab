# Simulation preparation and comparison (manual simulation loop)

> Quantitative behavior is not confirmed by reasoning alone — A prepares → the user runs it manually → the verifier compares.
> The rule is `../rules.md` §6. There is no automatic simulation tool. Running the simulation is the user's share.

---

## 0. At a glance

```
[A] Prepare model · stimulus              →  [User] Manual simulation (OrCAD/LTspice)  →  [Verifier] Compare reasoning↔simulation · verdict
 Expected operating points + stimulus spec     Collect results (.raw/waveforms/logs)        Expected vs actual → verdict
 + observation points (netlist nodes)          (★ Simulation result retrieval)             (the verifier alone)
                                                   │
                                On mismatch ← one of 3 culprits (analysis/model/stimulus) → repeat R{N+1}
```

## 1. [A] What to prepare (before handing over to the user)

The A of the existing step 4 writes it in `output/models/<module>_sim-spec.md` in a form the user **can run as is**. No separate new step is created. Link the submitted version · fingerprint of the preparation spec with the user's run results.

| Prepared item | Content |
|---|---|
| Expected operating points | Expected voltage/current/frequency per node (A's quantitative operating-point table) |
| Stimulus spec | Input source · waveform · frequency · amplitude |
| Analysis settings | transient/AC/DC + time · frequency range |
| Observation points | List of netlist node names — so they can be compared **1:1 with the identifiers** |
| Model | For a part with no datasheet available, the assumption stated + `Q-ID` |

### 1.1 Linking the spec version with hypotheses and results

| Field | What to record |
|---|---|
| Identification | Task · module · round R · spec revision · submission time · spec path/SHA256 · baseline input version |
| Target | H-N · related Q-IDs · location of the analysis operating-point table |
| Expected values | Voltage/current/frequency per node · units · conditions · calculation source and what is unconfirmed |
| Stimulus · analysis | Source · waveform · amplitude/frequency · time · initial conditions, analysis type/range · models/settings needed |
| Observation | Netlist node name · endpoint/meaning of the observation · correspondence with the hypothesis prediction |
| Model | Model file/version · source, assumption Q-IDs and limits of applicability |
| Place for handing over results | Per-round/per-item result · waveform · log paths under `output/sim/`, and cells to record the spec version used · run tool/version · settings/date and time |

When the spec version is revised, preserve the previous version and leave the new version/fingerprint and the reason. Do not merge the results of different spec versions into the same run. Before the run, the result cells are left as not done/not run, and expected values are not filled in as if they were measured results.

## 2. [User] Manual run

Run with OrCAD PSpice or LTspice → **produce results**: waveform data (.raw/text) · waveform images (.png, with the observation points · axis labels visible) · logs (.log/.out). Load them into `output/sim/` per round · per item. Record together the spec path · version/fingerprint · H-N/nodes used, the run tool/version · settings/date and time, and the result files. Settings that differ from the spec, or omissions/failures, are recorded separately.

## 3. [Verifier] Comparison (the verifier alone)

Z links, in step 5 and in B's read assignment, the paths · versions of both the preparation spec/expected values in `output/models/` and the results in `output/sim/`. B matches the expected operating points · hypothesis predictions against the simulation results. **A does not do independent comparison or verdict.** If there is no user result or the spec version cannot be linked, leave that fact and return the decision needed.

## 4. Mismatch = one of 3 culprits

Even if reasoning and simulation disagree, **do not conclude "the analysis is wrong".** First discriminate the culprit.

| Culprit | Check | Fix in the next round |
|---|---|---|
| ① Analysis | Re-examine the equations · operating principle · node mapping | A: correct the reasoning |
| ② Model | Assumed values (`Q-ID`) vs actual part characteristics | A: correct the model constants |
| ③ Settings · stimulus | Stimulus · analysis type · convergence settings | A: correct the stimulus spec / User: re-simulate |

- Default: take the simulation as the answer key, but **if the analysis is sound and they still disagree, re-check the model · settings first** (avoiding both blind faith in the analysis and blind faith in the simulation).
- Which culprit it was is the direction of the fix in the next round.

## 5. Repeat R{N+1}

Mismatch → one of 3 culprits → the party concerned fixes it → **fix the same unit of work (module · hypothesis) + raise only the round to `R{N+1}`** and re-simulate (common rules §4). Accuracy converges through the R1→R2 comparison. The deliverables of earlier rounds are left untouched + append.
