# Module decomposition and analysis depth (L1/L2/L3)

> How to split the whole circuit into functional domains + how to set how deep to dig for each module.
> The rule is `../rules.md` §2. This is the method detail for it.

---

## 1. Divide into functional domains

Split the circuit into **functional units** and analyze each independently. The standard axes that recur in any circuit are roughly these (add or remove to fit the target circuit).

| Domain (example) | Scope | Typical analysis points |
|---|---|---|
| Power | Rectification · smoothing · regulators · voltage reference · supervision | DC operating point · ripple · dropout · threshold voltage |
| Clock · reset | Oscillator · crystal · POR · reset | Frequency accuracy · load capacitance · reset timing |
| Core · logic | MCU/FPGA · decoupling · debug (JTAG) | Power distribution · clock tree · IO levels |
| Communication | Serial (485/USB) · Ethernet · isolated IF | Termination · matching · isolation voltage · pull-ups |
| IO · mechanical | Switches · LEDs · connectors · relay IF | Wiring · pull-up/pull-down · not populated |

- Module identifier = `M#_function-code`. **Once given, rearranging is prohibited** (`../rules.md` §2).
- Signals that straddle module boundaries (power rails · clock · reset) are grouped separately as **cross-cutting axes** to look at the cross-section between modules.

## 2. Analysis depth L1/L2/L3

State how deep to dig for each module. Digging everything at L3 makes the cost explode — go deep only where there is suspicion.

| Depth | Definition | Output level |
|---|---|---|
| L1 | Concept level | Qualitative description of block roles · signal flow. No quantitative values |
| L2 | Operating principle | Operating mechanism + identification of the main nodes (some quantitative) |
| L3 | Quantitative behavior model | Quantitative operating-point table + cited component constants + simulation mapping + stated assumptions |

- **A module suspected of an error or fault = L3 recommended** (without quantitative values, comparison with simulation is impossible). Save on surrounding modules with L1–L2.
- Even within one module, only some blocks can be raised to L3 (e.g. partial L3 for the clock · reset block only).

## 3. Quantitative operating-point table (required form for L3)

An L3 module has an operating-point table in **a form that can be confirmed by measurement or simulation**.

| Node/signal | Normal value (typ) | Limit/margin | Source · assumption |
|---|---|---|---|
| `<node name (netlist identifier)>` | `<voltage/current/frequency>` | `<upper/lower limit or margin>` | `<calculation basis + assumption Q-ID>` |

- Node names are made to **match the netlist identifiers** (1:1 comparison with simulation signals).
- If it is an estimated value, **always write the source of the assumption (`Q-ID`) alongside**.

## 4. step 1 deliverable

- Module decomposition table (`output/analysis/module-decomposition-table.md`) = module list + each module's function · schematic sheets · depth assignment + cross-cutting axes.
- This table becomes the skeleton of the per-module analysis documents that follow.
