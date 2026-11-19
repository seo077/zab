# Z interaction rules — how to exchange with A·B

> The rules for when Z hands work to A·B and receives results. **Always read §3 before instructing B.**

---

## 0. The skeleton of this document

```
§1  Two execution modes                 — whether several windows are opened, or Z runs subagents
§2  When handing over to A              — give generously
§3  When handing over to B              — give sparingly (there is an information cap)
§4  When running several at once        — defence against file collisions
§5  The final verdict when there are several Bs
§6  When receiving and recording results
```

---

## 1. Two execution modes

**The two modes use the same pipeline definition.** The steps are the same, the assignees are the same, and **the places where they stop are the same.**
Exactly one thing differs — *whether a person opens the session, or Z does.*

| | Mode 1 — several windows | Mode 2 — Z drives subagents |
|---|---|---|
| Who opens the session | A person | Z |
| How the instruction reaches A·B | A person copies the call message Z wrote and pastes it into a new window | Z passes that message as is as the subagent prompt |
| How the result comes back | A person pastes the result into Z's window | When the subagent finishes, Z receives the result |
| Several at the same time | A person opens several windows | Z launches them at the same time |
| When it fits | When human judgement is needed often along the way · when a long conversation is needed | When the tracks separate cleanly and there is much repetition |

### 1.1 Why the "places where they stop" must be the same — the most important rule

**A subagent cannot talk with the user in the middle of the work.** This is not a preference but a structural property of the tool.
So at a place that needs a human check, **split the agent call itself in two.**

```
(X) Wrong way — ask for it all at once
    B call: "Make the verification criteria → get the user's approval → verify against those criteria"
    → The subagent cannot ask the user.
      It either moves on as if it had approved by itself, or skips the approval step entirely.

(O) Right way — cut at the checkpoint
    B call ①: "Make the verification criteria. Make them and end."
        ↓
    ★ Z shows the result to the person → the person fixes or approves it
        ↓
    B call ②: "Verify the deliverable against the approved criteria."   ← fresh session
```

In the step table of a pipeline definition, **the lines marked with ★ are exactly these places to cut**.
Mode 1 cuts at the same places too — only then do the two modes produce the same result.

> What Z does at a ★: **tell the person the path** of the previous step's deliverable, and have the person open it themselves.
> Z does not summarize the content and say "it is like this" in their place. A summary dulls the person's check.

If, in a revision round, the user has already permitted a specific scope of change and the next action, the conditional proceed permission of §6.4 may be applied. Record it as distinct from approval by direct inspection; the role call still ends at the ★, and Z assigns the next fresh session. Conditional proceed does not manufacture a user answer or the result of a manual run.

### 1.2 What to be especially careful of in mode 2

- The prompt handed to a subagent **must be identical, character for character, to the message a person would have been made to paste in mode 1.** Do not shorten it because it is mode 2.
- A subagent's memory disappears when its session ends. **Instruct it to leave in files everything that is needed in the next step.**
- Z relays the subagent's response to the person as is. If Z polishes it, it is already Z's words.
- **If a session is cut off by external circumstances (API limit 429 and the like)** — continue in the following order without changing the instruction.
  ① Z checks the state of the write locations (`git status` · whether the files in the write locations exist · no changes outside the write locations).
  ② If the same session can be resumed, **resume the same session**. The resume message carries only "it was cut off · the same instruction as is · the current state of the write locations" and **adds no new information** (for B, the §3 cap as is).
  ③ If it cannot be resumed, open a fresh session with **the same call message** (B stays fresh · if there is a partial deliverable from just before, add only its path to MR-2).
  ④ Write the fact of the interruption and resumption in `log/run-log.md` and in the history of `log/manifest.json` — verdicts and results are recorded on the basis of the completed round.

### 1.3 The means of calling for Codex and Claude

The work roles, the MR/VB cap, file ownership and ★ are the rules above as is. This section connects the client's means of calling.

- Codex mode 2 passes the call message Z has kept, **the full text as is**, to a new `collaboration.spawn_agent` and states `fork_turns="none"` explicitly. Omit model·reasoning_effort overrides the user did not specify. An actual response of ②/③ in the configuration selection below is a specification of the corresponding preset; a preselect or no response is not a specification. Link it with the full-text file and SHA256 of mode 1. A/B, and the next step after an approval, are each a fresh session.
- A fresh conversation and automatically loaded instructions are separate things. Observe together the additional context from project/global AGENTS and hooks, and the actual initial response and reading traces. Do not additionally pass to B the A/Z conversation or evaluations, or the whole installation guide. If the independent-session capability or the evidence is insufficient, leave it as unconfirmed and negotiate a switch to mode 1 or a rerun with the user.
- Mode 2 with Claude selected uses a new Agent of the official `claude mcp serve` registered in the project. Pass `subagent_type="general-purpose"`, a description and an independent prompt. Omit model/effort that was not separately requested (an actual response in the configuration selection below is recorded as a specification). Omit name/isolation for ordinary roles. A/B are each a new Agent, and a previous role is not resumed with SendMessage. Check isError, the internal status/content and the returned ID, and for stopping use TaskStop on that ID.
- A tool failure or a timeout is not a role result or the user's acceptance. Only recovery of the same step from an external interruption follows §1.2; the next step after a ★ is a new call. Check the MCP cwd against the approved scope, and do not route a refused Codex operation around through Claude.
- Automatic execution review / sandbox permissions and the ★ work approval do not substitute for each other. How to use the client is in [codex-operation.md](codex-operation.md), and B is given only the paths permitted for the step concerned.

---

### 1.3.1 Mode 2 configuration selection — common to both Z families

First confirm the family and host of the current Z. This selection is for configuring A/B and does not restart Z itself or change its model. Query the supported values of the installed CLI and of the actual calling tool, and record the version, command, output, time and failures. Do not substitute the installed CLI's model list for the tool's declared list.

| No. | Choice | A/B configuration |
|---|---|---|
| ① | Choose directly | A's family (Claude/Codex) → model → effort, then B's family → model → effort, each chosen from the list of what can actually be run |
| ② | Same family — default | Z·A·B are the same family. For Claude, the opus alias that points to the latest Opus in the installed version · xhigh; for Codex, the latest astra confirmed from the installed CLI's list · high |
| ③ | Z·A the same, B on the other family | A=Z, B=the opposite family. Model and effort are the values of ② for the family concerned |

Confirm in the current session that there is a multiple-choice question tool, and use it. The default preselection is ②, but if the UI does not support preselect, mark ② as the default recommendation. In a UI where the recommendation must be placed first, show ② first and keep the meaning of the numbers. If there is no UI, ask in text with the same numbers and effects. Not observed is not the same as not supported. Record what was displayed on screen and the receipt of the response separately from the tool's declaration. The default selection is not an actual answer, and do not start a call with that configuration before the response.

Present ③ as selectable only when the installation of the opposite family's CLI is confirmed. Distinguish not installed, query failed and unconfirmed, and show the reason it cannot be enabled. When only one family is installed, ② can be used. ① likewise presents only candidates whose installation, model, effort and calling-tool support are confirmed. If whether it is the latest, or effort support, is not confirmed, leave null with the reason and the query evidence, and hand it back to the user's choice. Do not silently substitute high for xhigh, or another model for astra.

| Z | A | B | Selection path |
|---|---|---|---|
| Claude | Claude | Claude | ① or ② |
| Claude | Claude | Codex | ① or ③ |
| Claude | Codex | Claude | ① |
| Claude | Codex | Codex | ① |
| Codex | Claude | Claude | ① |
| Codex | Claude | Codex | ① |
| Codex | Codex | Claude | ① or ③ |
| Codex | Codex | Codex | ① or ② |

The table gives the paths after installation and support are confirmed; it is not evidence of an actual run. With one family installed, only that family's A/B are offered. Every row uses the multiple-choice form when the UI is supported and the numbered form when it is not, and if the support does not match, that call is put on hold. Present to the user the effects of choosing a supported value directly (recorded as a configuration change), keeping the preset after preparing the environment (waiting), and switching to mode 1.

Before the call, check the selected model and effort against the actual tool schema. For Codex Z → Codex, check fork_turns=none of the new spawn_agent and the confirmed model/reasoning_effort; for Codex Z → Claude, check the model/effort of the new Agent of the existing official MCP. For Claude Z → Claude, check the new Agent schema; for Claude Z → Codex, check --model·--effort of the existing codex-companion and the places for the independent full text, the session and the logs. If the supported values do not match, do not run before it is resolved. No permission to change settings, install, or bypass permissions arises from this section.

Z records, in the Task's assignments/mode2-run-config_R{M}.json: version, Z's family and host, mode, UI tool / numbered form, preselected=2 (the intended default) and whether preselect is actually supported, the original text, source, time and chosen number of the actual answer, A/B's family·model_selector·resolved_model_id·effort, the CLI path, version, list evidence, time, installation state, capability evidence, the scope of calls it applies to, and replaces. For an unmeasured resolved_model_id, put null and the reason. A fixed model ID is kept only in this run's event record and is not embedded in the body of the rules. The actual call arguments, the fingerprint of the full text and the returned ID are linked to Z's execution record. This whole file is not automatically assigned to B; only the necessary execution facts and permissions are provided as a neutral section.

If there is no selection record, keep the existing omission of overrides. If a new selection procedure is in progress, wait for the response; a configuration already stated is kept within the approved scope. The next role after a ★ is a fresh session.

### 1.3.2 Automatic context and commit titles before a B call

In both Claude Code Agent mode 2 and Codex, immediately before a B call Z does not add hints such as approved, provisional or the expected verdict to commit titles or to new automatically exposed records in the ledger. Do not erase or rewrite the original text of past approvals and verdicts. A commit title Z makes before a B call uses neutral wording such as `T{N}: <step> record`, and does not contain approval, provisional, downgrade, verdict symbols or the content of a decision. This is a rule for titles and is not extended into a prohibition on commit bodies. Nor is it permission to run a commit/push without a request. Put the context-disclosure boilerplate of §3.5 in the B call. Successful removal of context is not guaranteed.


## 2. When handing over to A — give generously

A can build only if it knows the context. **Do not be sparing.**

| # | What to include |
|---|---|
| A-1 | What this step does, and why it is done (background) |
| A-2 | The related user decisions and agreements, **verbatim**. No altering of figures or proper nouns |
| A-3 | Paths of what to read · paths of where to write (carry over that cell of the pipeline definition as is). Link the input-preparation originals, common extracts, fingerprints and reading observations (§3.5). State separately the place for temporary files (the per-role session temp, or output/T{N}_<job>/tmp/<role>_<round>/; clean up its own files before submitting) and the place for tool logs (inside the execution evidence when a log-location environment value is supported; when not possible, record the actual location, count and reason) (§3.6) |
| A-4 | Z's own views, concerns and findings — with `[provisional]` attached. State that they are not instructions |
| A-5 | Before handing over, **check that the spec is confirmed**. If handed over with the spec still blurry, A looks at existing assets and makes the spec up |
| A-6 | When letting A into B's sole domain (verification rules · verification criteria), nail down in a sentence: **"folders and empty files only; entering the body text is prohibited"** |
| A-7 | **Delegation procedure** — when "the user permits, this time only, something that was originally forbidden", put that delegation in the instruction message and write the **three elements of evidence** with it: ① the source of the permission ② the date ③ **the user's statement, verbatim.** If ③ is missing, the fact of the delegation cannot be reconstructed later. However, there is a line that even delegation cannot cross — **A does not enter the verifier's body text (B's sole domain) even if the user delegates it** (consistent with `a/common-rules.md` §1.2) |
| A-8 | **Repository entry path** — put in the instruction **the absolute path of the repository + the path of the boot document A reads** (`a/boot.md` and the like). Carry it identically in mode 1 and mode 2. Do not rely on the automatic loading of the project `CLAUDE.md` as the "means of entry" (it is only a bonus). State the repository path as an absolute path |
| A-9 | **Self-check instruction** — write that, before submitting, A is to run its own deliverable (exists · runs · reproduces), fix it, and then leave the result in a **separate section "Self-check"** of the build summary following the self-check frame of `a/common-rules.md` §5. Also include the boundary: the self-check is existence, execution and reproduction and the builder's prevention and correction of errors, and independent judgement is B's part. Have it write "not applicable" if the deliverable is not something that runs (a document and the like), and "incomplete" if it should run but could not be run for lack of a tool or permission |
| A-10 | **Passing the approved criteria at a design gate** — in both the first round and revision rounds, after the criteria are revised and approved, fix that version and assign the design. Use the design excerpt / per-target criteria file written by B, or a full reproduction of the approved wording. Fix together: the original criteria path, r, fingerprint and scope of approval; the included IDs (D-* · the relevant C-D1 and so on) and their location in the original text; the correspondence of applicability conditions, notes and external definitions; and the handoff file path, fingerprint and method of handoff. B writes it, so that conditions do not disappear when items alone are detached. A reads only the handoff sheet assigned to it and is given no permission to open b/ or the whole of the original criteria. Hash and line comparison are facts of version identification / difference, and are not a verdict on correctness of content, completeness, or absence of impact on the design. Do not use chained references to past call messages as the default |

### 2.1 Handing rework over to A

Pass the original text of the findings and their source, the versions of the approved spec, design and criteria handoff sheet, the permitted read/write paths, and the paths of the per-round submitted copies and build summaries. B's body text that A cannot read is assigned as handoff wording for A. Instruct that, after fixing the findings, A re-reviews the assigned deliverable as a whole, the causes and the related effects, and writes a separate "Overall re-review" section. Have it leave what was fixed, what was kept, what is unconfirmed, and requests outside the scope; spec changes, files of other roles/Tasks and new design decisions are handed over to a separate decision. Do not limit the scope of B's independent re-verification by A's own list.

---

## 3. When handing over to B — give sparingly

B has value only when it **judges alone**. B's eye is clouded by exactly as much as it is told in advance.
**What was given to A must not be given to B as is.** The roles are different.

### 3.1 What may be included — these four are the cap

| # | Item | Content | Prohibited |
|---|---|---|---|
| **MR-1** | Identifier of the requested Task and step | The notation `T{N} / <step> R{M}` (attach `R{M}` if it is rework) | Only the Task and step identifier itself. **No summary of the content of the Task or step** |
| **MR-2** | Paths of the verification target, permissions and reading sources | Neutral file/root paths and identifiers of the fixed version and baseline. Includes the actual per-round permission record and the paths of the before/after material (§6.2). If the ledger is needed, assign the path of the fact excerpt of §3.3 instead of the whole ledger | No summary of the body, no exposure of structure, no quoting of important lines, no list of important changes selected by A/Z. The actual changes are **derived by B directly** |
| **MR-3** | Source and approval of the request | Whether there is explicit user approval + the date of the request | No inclusion of A's self-assessment, Z's guesses or the expected verdict |
| **MR-4** | Meta of the previous round (when it is re-verification) | The overall verdict of the previous round in **one word** + the path of the previous report file | No quoting of the body of the previous round's findings, basis or check points. **B Reads it directly** |

If you find yourself wanting to include information outside these four, it usually falls under §3.2 below.

### 3.2 What must not be included — five violation patterns

After writing the whole message, scan it yourself. If even one applies, **stop drafting, report to the user, and then rewrite with the four items of §3.1.**

| # | Violation pattern | Why it is not allowed |
|---|---|---|
| **VB-1** | Presenting verification check items in advance (e.g. "checking the N items below is recommended") | Anchoring — B looks only within that list |
| **VB-2** | Summarizing the structure of the verification target in advance (laying out the step composition, slots, fields, identifier scheme and so on without quoting the body) | It makes B skip the process of reading and grasping it directly |
| **VB-3** | Attaching a summary of the body of decisions | A compressed quotation that bypasses B's direct reading |
| **VB-4** | Quoting A's self-assessment as is (e.g. "A saw no problem") | A's view becomes B's starting point |
| **VB-5** | "Please look especially at ~" / "Please pay attention to ~" | When attention is concentrated, the rest is left empty |

> These five apply **only to requests to B**. They do not apply to requests to A (see §2).

### 3.3 The premise that B reads for itself

When B starts, it opens the files it needs by itself, as its own boot document tells it to.
So Z has no reason to "kindly" carry content over. **Giving the paths accurately is enough.**

Before a verdict call, Z checks that the reading/substitute sources and means B set in the approved criteria are linked to the actual read assignment. If a source is missing or conflicts with a role boundary, supplement the assignment or obtain the decision needed. If views or evaluations are mixed into the full text of the A call, do not pass it to B; assign a neutral original that fixes the identical permission section of §6.2. Do not substitute the current ledger's agents or A's change list for the permissions of that time.

If the ledger is needed, Z fixes Task/assignments/B{N}_<step>_R{M}_ledger-facts.json and assigns only the path. Link source_path·source_sha256·collection time·task with the location/value of the original fields. Project only, for the scope needed: `current_step` of tasks; `id`·`role`·`owned_files` of agents[]; `outputs`; and `task`·`step`·`actor`·`at`·`files` of history. Exclude free-form description such as `scope` of agents, `checkpoints`, `verdict`, `did`·`note`, and summaries or interpretations of user decisions. If fact and evaluation are mixed, do not rewrite the meaning; take only the permitted fact fields. The existing manifest schema and C-8 are kept. The permissions of that time are linked separately by the neutral permission record of §6.2 and are not replaced by the current ledger.

### 3.4 Why it matters more in mode 2

In mode 1, B could ask the person back when something seemed odd. A mode 2 subagent cannot ask back.
So **a single line Z put in becomes B's entire field of view.** The information cap is kept more strictly in mode 2.

### 3.5 Repository entry path — the way in is separate from the cap

Put in the instruction **the absolute path of the repository + the path of the boot document B reads** (`b/boot.md` and the like). Carry it identically in mode 1 and mode 2.
Do not rely on the automatic loading of the project `CLAUDE.md` as the "means of entry" (it is only a bonus). State the repository path as an absolute path.

> This is **"the way in"**, so it is separate from the information cap of §3.1 (MR-1–MR-4) — giving a path does not lift the cap.
> **The cap itself stays as is.** Adding a summary of the verification target or check items on top of §3 is still prohibited (§3.2 VB-1–VB-5).

---

In the A/B read assignment, link the actual absolute paths and fingerprints of the source material, the common extracts and the input list. The preparation procedure follows "Input and host preparation" in [boot.md](boot.md). Do not append a summary of the material's content for B.

B reading boilerplate: "You may also open the example form that the body of the common rules points to by path. The current example form is project_example/log/T1_example/criteria.md, and Z resolves it to the actual absolute path of template E and assigns it. If it is missing, return the path and the reason. This is not extended into permission to read all of b/ or arbitrary links."

B context boilerplate: "Exclude automatically injected context from your basis, and on the first line of your first reply write the categories of initial context actually visible and whether anything outside the assignment was exposed. Do not conclude that context you cannot observe was absent." This is not a pretext for summarizing and passing on content outside the information cap.

### 3.6 B write assignment — rerun · temporary · logs

In a run where B must execute the deliverable, assign log/T{N}_<job>/verification-summary/B{M}_R{K}_evidence/rerun-copy/ as the standard write location. For Git, it is composed only of the tracked files of the designated output scope at the fixed baseline commit. Do not copy the current working tree or an existing node_modules. For non-Git, it is composed of the copy of the submitted original text fixed by Z and the full inclusion list and hashes. Leave the source kind, the fixed version, the included/excluded files, the hashes and the time of composition. If there are links, external dependencies or omissions, or the boundary of the original text is undetermined, postpone execution and do not substitute execution of the original.

Installed and generated items are excluded by ignore rules inside the rerun copy. Ignore is not a security boundary or permission to delete. Tool state, logs and before/after execution evidence are placed in the same B evidence section. For a run that only reads documents, write in the assignment that a rerun copy is not needed. This is planned to move to the code track when verification criteria for a code track come into being, and this rule does not create a new track.

In A/B calls, state the two places separately: temporary files go in the per-role assigned session temp or output/T{N}_<job>/tmp/<role>_<round>/, and tool logs go inside the execution evidence of the role concerned. Before submitting, delete only your own temporary files and record it in your own summary. Transient writes outside the write assignment are allowed only in the OS temp folder. If a log-location environment value is accepted, point it inside the evidence (e.g. npm_config_logs_dir); if not possible, record the actual location, count and reason. Leave an unobservable value as null with the reason. Distinguish A's explanation from the source of the tool's original output, and do not bypass a permission refusal.

## 4. When running several at once — the 3 collision-defence rules

Parallelism happens at two levels — **between Tasks** (T1·T2 proceeding at the same time) and **between assignees within one Task** (A1·A2 assigned at the same time). At either level the 3 rules below apply identically.

| # | Rule | How |
|---|---|---|
| **P-1** | **One owner per file** | When assigning, Z **nails down the write path** for each agent. Do not say "write it somewhere suitable as you see fit". When the Tasks differ, the rooms (`log/T{N}_<job>/`) differ, so they do not overlap |
| **P-2** | **Only Z writes the shared ledger** | The Task ledger `log/manifest.json` is **Z's alone**. A·B only read. Each one's summary is **separated into per-agent files** inside its own Task room, like `log/T{N}_<job>/build-summary/A1_*.md` · `log/T{N}_<job>/verification-summary/B1_*.md`. The shared files outside the Task rooms (`log/run-log.md`·`log/decisions.md`) are also **written only by Z** |
| **P-3** | **If it does not separate cleanly, do not run it in parallel** | If two tracks touch the same file, or if the files differ but the wording of one depends on the content of the other, run them in order. The order of design after the criteria are revised and approved is kept in revision rounds too, and no new exception for simultaneous progress is made. The same holds between Tasks — if two Tasks touch the same deliverable, bind them by a dependency and run them in order. Parallelism is done to gain speed, not something that must be done |

How to number agents: when there are several of the same role, call them `A1`·`A2`·`B1`·`B2`, and **put that number in the file name.** Numbers are counted within a Task — the room is different from that of another Task's A1, so they do not collide.

---

## 5. The final verdict when there are several Bs

If **Z merges** the results of several Bs, **at the moment of merging Z has in effect judged.** That crosses the hard line.

So **one more B, a synthesizing B, is added.**

```
B1 ─┐
B2 ─┼→  synthesizing B  →  one line of final verdict  →  Z relays it to the person
B3 ─┘
```

- Give the synthesizing B **only the paths of each B's report file** (the §3.1 cap as is).
- Z does not add which B's opinion looks right.
- If there is only one B, skip the synthesis step.

---

## 6. When receiving and recording results

1. **Preserve the original text** — carry the verdict and the findings over in the words B wrote, as is. Do not soften them.
2. **Update the ledger** — append one line to `history` in `log/manifest.json` — **tagged with which Task it is (`T{N}`).** Also update that Task's status and current step (only Z writes, P-2).
3. **Relay to the person** — the path of the result file + one line of verdict. Do not attach interpretation.
4. **The person judges the next step** — whether to go on, go back or stop is decided by the user. Permissions already granted are recorded and applied per §6.3·§6.4, and only the parts that need a new decision are asked.
5. **Note improvement candidates** — if the pipeline itself went wrong somewhere this time, make a memo of it as a candidate for `improvements/`. Do not fix it during the work.


### 6.1 Linking submitted and approved versions

The original text of every submitted/approved version of the design and the verification criteria is left by the owning role as a recoverable copy. The method for deliverables is set in the Task spec. Z separately links the user's original words, source, date and scope of approval to the Task, step, role, call R, document revision (the criteria r is separate), working/copy paths, bytes, SHA256, submission time, baseline version, and previous version / recovery source. Do not overwrite a fixed copy with approval wording.

A copy is the default. If the spec chooses Git/version storage, leave the original file, the commit/blob, a separate restore location, and the result of actually restoring, opening and fingerprinting it. Hashes and change history alone do not substitute for preservation. If the approved version and the actual file come to differ, preserve both versions and hand it over to the new role/decision needed. Z's fingerprint/line comparison is not used as a verdict on design impact or quality.

### 6.2 Per-round neutral assignment and comparison sources

When Z issues a call, it links and fixes `log/T{N}_<job>/assignments/<role>_<step>_R<M>_permissions.json` and `calls/<role>_<step>_R<M>.md`. The paths are made concrete in the actual call. An example does not automatically add read/write permissions.

The neutral permission record holds the Task, step, role, round, date / time of application, roots, reads (distinguishing whole / section / meta), writes (specific files or an assigned folder), the excluded scope, the actual call path/fingerprint and the identical permission section, the path/fingerprint of the approval it rests on, and the path/fingerprint of the baseline list. A/Z's evaluations, concerns and expected verdict are not put in. A change of permissions partway through preserves the basis, the time and the new version separately and does not overwrite the previous version.

Before production, fix the comparison scope and the copy of the original text, and after production collect the same scope again. In each file row, leave the root, relative path, kind (file/directory), existence, bytes, SHA256 and collection time, so that new/deleted/changed/unchanged are distinguished. State explicitly the hidden, untracked and ignored items and the excluded scope. For Git, fix together the root, baseline commit, target commit, HEAD, index/working tree, and the uncommitted and untracked state. For non-Git / outside tracking, use the before/after file lists, fingerprints and recovery originals. A list is not a substitute for a copy from which the content can be recovered.

B derives the changes directly from this actual before/after material. A's explanatory list is a delivery note and is not the whole of the comparison or the upper limit of B's scope. Z assigns the reading/substitute sources and means set by the criteria-writing B, as actual paths, before the verdict call. If they are insufficient, do not arbitrarily substitute the current ledger or A's list; hand it over to supplementation/a decision.

The ledger fact excerpt (§3.3) is a record of facts at the time of collection, and the permission record of that time is a separate event. Link the paths, fingerprints and times of the two separately. Z's access to the ledger for the excerpt is not permission for B to access the whole ledger.

### 6.3 Conflicts in the user's answer · waiting

If within the same response there are mutually incompatible choices, or the target/scope remains ambiguous, present the conflicting original text, source, date and the point concerned, and ask only for the choice needed. An unmistakable latest instruction to change is recorded as an original-text permission and followed, without repeated approval. No response is not consent.

While a further answer is needed, do not confirm the confirmed spec at your own discretion. In the ledger, on the existing `awaiting_human` status, distinguish "Z awaiting further answer" by `current_step` · `history.note`. Leave the checkpoint result as `hold` only when the user directly chose to hold. Do not turn Z's waiting into a hold statement by the user.

### 6.4 Conditional proceed permission

Limited to **a revision round in which the user has already permitted a specific scope of change and the next action**. Distinguish the kind of record from an approval in which the document was inspected directly.

| Record field | What it holds |
|---|---|
| Kind · permission original | Conditional proceed; the user's original words, source, date of the original instruction |
| Baseline · permitted scope | The existing approved version/copy and fingerprint; the permitted changes and objective conditions |
| Actual comparison | The before/after material, result and unconfirmed points from comparing the actual full changes of the applied version against the permitted scope |
| Application · next action | The applied document version/fingerprint and date of application; the permitted next step and the new role call |

Z preserves this record as a separate event file. Use the existing checkpoint `result`=`approved`, but put the applied version and the path of the conditional proceed record in `reviewed`, the actual permission original in `user_words`, and the date of application in `date`. Preserve the date of the original instruction in the event record, and state explicitly in history that this is the application of a conditional proceed permission, not an approval by direct viewing. Do not create a new status or result enum.

Do not make a blanket approval out of the mere fact that some design items are the same, a number of R2 or higher, or the absence of objection afterwards. Changes outside the scope, new decisions, failed conditions and insufficient comparison are handed over to a separate choice for the part concerned. If the original text is clear and the scope and conditions correspond, do not ask for the same permission again. The role ends after submitting, and Z makes the next fresh call according to the permission record.

The spreadsheet pipeline's skipping of approval of the existing output criteria follows as is that definition's conditions of user choice, gray area and presence of a record. This section does not widen the scope of skipping or remove the reopening of a gray area. A response to a circuit user query or the result of a manual simulation is not generated in its place by conditional proceed.

### 6.5 Relaying unconfirmed follow-ups

Relay the items B presented as could not be verified, their impact, the attempts / substitute means and the decisions needed, with the original text and the source. The assignee, the round and stop/accept are decided by Z and the user and recorded separately. Do not write that the check needed now is finished merely because of A's Q-ID or registration in a follow-up table. If the spec, role or scope changes, first link the relevant version and the new assignment.
