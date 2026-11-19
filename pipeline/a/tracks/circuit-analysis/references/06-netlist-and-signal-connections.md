# Netlist format · signal connections · version switch

> The record templates for steps 1–3 of `circuit-analysis` and for an input version switch. The rules are `../rules.md` §1 · §3 · §4; the rating/function sources are linked to `03-datasheet-check-and-assumption-index.md`.
> Leave what was observed in the actual circuit and what is unconfirmed. This document does not fix in advance the pin order of any particular exporter.

## 1. Record the actual format at the start

One assignee writes `output/analysis/netlist-format.md`. Without changing the original input, fix the path · version · bytes · SHA256. While the format is unknown, do not substitute a token count obtained by merging whitespace or discarding empty fields for the pin count.

| Record category | What to record |
|---|---|
| Original · tool | Input file/version · bytes · SHA256, character-encoding observation, exporter name/version · settings · the original source of the output format, or unconfirmed |
| Actual samples | The original lines of the file · line numbers or byte offsets, a verbatim copy of the original text and, separately, a space/tab visualization · hex sample. State the visualization notation and distinguish it from the original text |
| Field boundaries | The basis for distinguishing the component name · pin/node fields · the start/end of the component value, and the handling of spaces/tabs · quotes · consecutive delimiters inside a value |
| Empty positions | Not only internal consecutive spaces but also empty leading · trailing pin fields, and the original sample · interpretation · unconfirmed parts of a no-connect position right before the value |
| Package · pin count | The package · physical pin/ball count from the BOM/schematic/DS and their sources, the measured field count, the difference and possible reasons |
| Position↔pin order | The basis of the export order (original CAD library/settings/format definition etc.), and the source · scope · unconfirmed parts of the position→pin/ball correspondence table |
| Sample · tool observation | Parser/command used · version · environment, cross-check with a known sample or a separate means, failures and fixes, uninterpreted input |
| Limits · substitutes | The format/order still unknown · the affected connections, additional source material/substitute means · Q-ID of the decision needed |

How spaces/tabs/empty fields are represented and where value boundaries lie are judged **from the actual output format**. For example, even if simply splitting on whitespace is good enough for a fan-out search, it does not thereby guarantee the attribution to pin positions. Agreement of the pin count and agreement of a few reference points are partial evidence, not sufficient evidence for the whole mapping. "String alignment" is not set as a general rule for all tools. If there is no basis for the whole correspondence, distinguish hypothesis/partial confirmation · unconfirmed.

Byte observation follows `../../../common-rules.md` §5.1. A format/parser change is reflected in the connection re-trace of §3 below.

## 2. Spread out both ends and all branches of the assigned signals

First classify the net type into power/passive nets and signal nets. In the "Signal connections" section of the module analysis document, link the two tables below by signal ID. If one node has more than two endpoints, add a row per endpoint to expose all branches. For a branch that continues through a part to another node, also link the component/pin and the nodes before and after.

### 2.1 Signal · net table

| Signal ID | Auxiliary name (TX/RX etc.) | Input version · node | Net type | All endpoint/branch IDs | Design intent and source | Depth · submission step · unconfirmed Q-ID |
|---|---|---|---|---|---|---|
| `<fixed ID>` | `<relative to which device, or unknown>` | `<file version/fingerprint · node>` | `<signal/power/passive net>` | `<all rows of the table below>` | `<spec · DQ response · location in the original text>` | `<Task spec and current limits>` |

### 2.2 Endpoint · branch table

| Endpoint/branch ID · signal ID | Component · pin/ball · node | Location in the netlist/schematic/BOM original · version | Basis of the position↔pin mapping | DS document · version · page/table · pin function | Possible multiplexed functions | Selected mode · basis | Output-enable condition · external drive | Unconfirmed · impact · substitute confirmation |
|---|---|---|---|---|---|---|---|---|
| `<one row per endpoint>` | `<Q-ID if the pin is unknown>` | `<line/offset · sheet/coordinates · BOM row>` | `<location of the §1 correspondence table>` | `<source of the actual function>` | `<list of possible functions>` | `<observed material or unknown>` | `<per condition>` | `<Q-ID and related H-N>` |

The pin function · the actual connection · the design intent are each confirmed from their own source. A signal name is an auxiliary identifier, and direction · intent · selected mode are not confirmed from the name alone. Distinguish the possible functions in the datasheet from the mode actually selected. If there is no basis for the selected mode/pin map, leave that cell as unconfirmed with a Q-ID and link the impact · substitute confirmation. Do not force in a value that is not in the materials.

### 2.3 Recording drive conditions

| Condition/state | Endpoint behavior to record · candidates to check |
|---|---|
| Ordinary unidirectional signal | Record side by side the output · input under that condition and the basis of the actual connection |
| Bidirectional | The direction-switching condition · the driving/receiving endpoint in each direction and the basis |
| Open-drain | Release/drive condition · passive net such as pull-ups · shared endpoints · external drive |
| Tri-state | Output-enabled/high-impedance conditions and the time/mode basis |
| Driven by an external device | The connector · external drive source and the provided spec/unconfirmed |
| Zero or multiple outputs | Leave as a candidate to check per condition. Do not immediately conclude floating/contention |
| Pin function · selected mode unknown | Hand off the Q-ID · affected connections · means tried/substitute means · decision needed |

The depth L1/L2/L3 and the allowed unconfirmed range per submission step are set in each circuit Task spec. The existing depth definitions (`01-module-decomposition-and-depth.md`) are not all turned into exhaustive quantitative analysis. Writing the tables or registering a follow-up is not used as completion of the confirmation needed now, nor as an independent verdict.

## 3. When the version changes, re-trace the affected connections

Connections whose input · parser · pin map differ, and connections unconfirmed before, are traced again. Also when reusing an unchanged connection confirmed before, link the basis below.

| Connection ID | Before/after input version · path/SHA256 | Before/after parser · pin map version/fingerprint | Before/after component/pin · node of both ends · all branches | Before/after selected mode · enable condition | Location of the re-trace result, or the basis of invariance for reuse | Source of the earlier confirmation · unconfirmed |
|---|---|---|---|---|---|---|
| `<§2 connection ID>` | `<previous→current>` | `<source of change or invariance>` | `<including the location in the original text>` | `<including the basis>` | `<distinguish actually carried out/reused>` | `<report/observation version · Q-ID>` |

| Condition | What to record next |
|---|---|
| The input/parser/pin map change affects the connection | Trace that connection again and link the new original text · pin function/mode basis |
| Unconfirmed in the previous version | Do not carry the earlier description over as confirmed; record the re-trace · substitute confirmation result or the remaining Q-ID |
| The confirmed connection is unchanged | Leave the before/after both ends/branches · mode · input version · basis of invariance and the source of the earlier confirmation, and reuse it |
| There is no material to decide whether it is affected | Do not treat it as unchanged; return unconfirmed · impact · materials needed to Z |

The mere fact that the node number is the same, or that it exists in the current input, does not prove that the connection is preserved. Conversely, a manual exhaustive analysis every time is not forced for an unchanged connection that has a basis. Earlier versions and records are not deleted.

## 4. Handoff and scope

Unconfirmed items are linked to `03-datasheet-check-and-assumption-index.md` §2.1 by Q-ID, fact that could not be confirmed, affected signal/module/H-N, means tried/substitute means, and decision needed. The actual assignee · round · stop/accept is decided by Z · the user. A hypothesis that needs simulation is linked with the spec version · nodes · H-N/result paths of `05-simulation-prep-and-comparison.md`.

This template is not a record of having confirmed the UART wiring · whole pin map · firmware mode · ERC result of any particular project. It is filled in in a circuit Task to which actual materials and permissions have been assigned.
