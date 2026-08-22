// The criterion a requirement is judged by is written by a context that did not
// write the requirement and will not write the code.
//
// This is the one rule the orchestrator/designer/verifier template (v0.6, B_호출
// §V-8) enforces that a spec-with-inline-acceptance cannot: if the author of the
// spec also authors the yardstick, "independent verification" measures the
// implementer against the implementer's own ruler. Worse, the yardstick can be
// quietly shortened on a failing round to manufacture a pass.
//
// So: criteria live in their own file, written by their own agent, and the G0
// approval binds to BOTH hashes — moving the ruler after approval closes the gate
// exactly like rewriting a requirement does.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCriteria, checkCriteria, parseReview } from '../hooks/il.mjs';

const SPEC = `# SPEC — 001-login

## Background
Prose that is not a requirement.

<!-- il:normative:begin -->
## Requirements

REQ-001 The user can log in with email and password.

REQ-002 A session expires after 30 minutes of inactivity.

REQ-003 [circuit] GPIO12 is input-only with no pull-up.

## Threat model
| Asset | Threat | Mitigation | Becomes |
|---|---|---|---|
| session cookie | theft via XSS | HttpOnly | REQ-001 |

## Assumptions
ASM-001 Single region. (user: declined to answer)
<!-- il:normative:end -->
`;

const CRITERIA = `# CRITERIA — 001-login

<!-- il:normative:begin -->

REQ-001
  Judged: POST /login with valid credentials returns 200 and sets a session cookie;
  invalid credentials return 401.
  Method: run \`npm test -- login\`

REQ-002
  Judged: a request made 31 minutes after the previous one returns 401.
  Method: run \`npm test -- session-expiry\`

REQ-003
  Judged: hardware/pinmap.md PU setting matches GPIO_MODE in the source.
  Method: point at hardware/pinmap.md:14 and src/pins.c:22

<!-- il:normative:end -->
`;

// ── parseCriteria ────────────────────────────────────────────────────────────

test('parseCriteria keys by REQ id and keeps the judged text verbatim', () => {
  const m = parseCriteria(CRITERIA);
  assert.equal(m.size, 3);
  assert.match(m.get('REQ-001').judged, /returns 200 and sets a session cookie/);
  assert.match(m.get('REQ-001').judged, /invalid credentials return 401/);
  assert.equal(m.get('REQ-002').method, 'run `npm test -- session-expiry`');
});

test('parseCriteria reads only the normative region', () => {
  const withPreamble = `# CRITERIA\n\nREQ-009\n  Judged: a draft nobody approved\n\n${CRITERIA}`;
  const m = parseCriteria(withPreamble);
  assert.equal(m.has('REQ-009'), false);
});

test('parseCriteria never throws on junk', () => {
  for (const junk of [null, undefined, 42, '', '# nothing here']) {
    assert.doesNotThrow(() => parseCriteria(junk));
  }
});

// ── checkCriteria ────────────────────────────────────────────────────────────

const kinds = (findings) => findings.map((f) => f.kind);
const blockers = (findings) => findings.filter((f) => f.severity === 'block');

test('a matched pair produces no blockers', () => {
  assert.deepEqual(blockers(checkCriteria(SPEC, CRITERIA)), []);
});

test('a REQ with no criterion blocks the gate', () => {
  const missing = CRITERIA.replace(/REQ-002[\s\S]*?\n\n/, '');
  const found = checkCriteria(SPEC, missing);
  const b = blockers(found);
  assert.equal(b.length, 1);
  assert.equal(b[0].kind, 'uncriterioned-requirement');
  assert.equal(b[0].req, 'REQ-002');
});

test('a criterion with no Judged line blocks the gate', () => {
  const empty = CRITERIA.replace(/  Judged: a request made 31 minutes[\s\S]*?returns 401\.\n/, '');
  const b = blockers(checkCriteria(SPEC, empty));
  assert.equal(b.length, 1);
  assert.equal(b[0].kind, 'no-judged-line');
  assert.equal(b[0].req, 'REQ-002');
});

test('a criterion for a REQ that no longer exists blocks the gate as stale', () => {
  const stale = CRITERIA.replace('<!-- il:normative:end -->', 'REQ-044\n  Judged: something deleted\n\n<!-- il:normative:end -->');
  const b = blockers(checkCriteria(SPEC, stale));
  assert.equal(b.length, 1);
  assert.equal(b[0].kind, 'orphan-criterion');
  assert.equal(b[0].req, 'REQ-044');
});

test('a missing CRITERIA.md blocks with one clear finding, not one per REQ', () => {
  const b = blockers(checkCriteria(SPEC, null));
  assert.equal(b.length, 1);
  assert.equal(b[0].kind, 'no-criteria');
});

test('unmeasurable wording in a criterion warns but never blocks', () => {
  const vague = CRITERIA.replace(
    'a request made 31 minutes after the previous one returns 401.',
    'the session expires reasonably fast.'
  );
  const found = checkCriteria(SPEC, vague);
  assert.deepEqual(blockers(found), []);
  assert.ok(kinds(found).includes('unmeasurable-criterion'));
});

test('a criterion that is only a restatement of the requirement warns', () => {
  const echo = CRITERIA.replace(
    'a request made 31 minutes after the previous one returns 401.',
    'A session expires after 30 minutes of inactivity.'
  );
  const found = checkCriteria(SPEC, echo);
  assert.ok(kinds(found).includes('restated-requirement'));
});

test('checkCriteria never throws on junk', () => {
  for (const junk of [null, undefined, 42, {}]) {
    assert.doesNotThrow(() => checkCriteria(junk, junk));
  }
});

// ── parseReview ──────────────────────────────────────────────────────────────

const REVIEW = `# REVIEW — 001-login

## Independence evidence
- critic: il-spec-critic / subagent / fresh context, interview not read
- reviewed: spec 4f2a9c1e criteria 9b1d0c33
- wrote: nothing but this file

## Blockers
REQ-003  the criterion points at a file that does not exist in the repo

VERDICT: NOT YET
`;

test('parseReview reads the verdict and what it binds to', () => {
  const r = parseReview(REVIEW);
  assert.equal(r.verdict, 'NOT YET');
  assert.equal(r.specHash, '4f2a9c1e');
  assert.equal(r.criteriaHash, '9b1d0c33');
  assert.equal(r.blockers.length, 1);
  assert.match(r.blockers[0], /REQ-003/);
});

test('READY is recognised', () => {
  const r = parseReview(REVIEW.replace('VERDICT: NOT YET', 'VERDICT: READY'));
  assert.equal(r.verdict, 'READY');
});

test('a review with no VERDICT line is not a verdict', () => {
  const r = parseReview(REVIEW.replace(/VERDICT: NOT YET/, 'I think it looks fine'));
  assert.equal(r.verdict, null);
});

test('prose that merely mentions the words is not a verdict', () => {
  const r = parseReview('The spec is READY in my opinion, no VERDICT here.');
  assert.equal(r.verdict, null);
});

test('parseReview never throws on junk', () => {
  for (const junk of [null, undefined, 42, '']) {
    assert.doesNotThrow(() => parseReview(junk));
  }
});

test('a criterion inside an HTML comment is documentation, not a criterion', () => {
  // The shipped template documents the format with a worked example. Without
  // this, every file written from that template carries an orphan criterion and
  // the gate refuses it.
  const commented = CRITERIA.replace(
    '<!-- il:normative:end -->',
    '<!--\n  REQ-044\n    Judged: an example, for the reader\n-->\n\n<!-- il:normative:end -->'
  );
  const m = parseCriteria(commented);
  assert.equal(m.has('REQ-044'), false);
  assert.deepEqual(blockers(checkCriteria(SPEC, commented)), []);
});

// ─────────────────────────────────────────────────────────────────────────────
// The two packets — the same trick as the verify packet, for the same reason.
//
// A subagent's independence is a property of what it is handed, not of the fact
// that it is a subagent. If the caller can narrate — "REQ-004 is the shaky one",
// "we already decided 30 minutes is fine" — the fresh context inherits the
// caller's framing and the separation buys nothing.
// ─────────────────────────────────────────────────────────────────────────────

import { composeCriteriaPacket, composeReviewPacket, specHash } from '../hooks/il.mjs';

test('the criteria packet carries the requirements verbatim', () => {
  const p = composeCriteriaPacket({ feature: '001-login', spec: SPEC });
  assert.match(p, /REQ-001 The user can log in with email and password\./);
  assert.match(p, /REQ-003 \[circuit\] GPIO12 is input-only with no pull-up\./);
});

test('the criteria packet carries the decisions — a criterion needs to know what a REQ is for', () => {
  const withDec = SPEC.replace(
    '## Background',
    `## Decisions

DEC-001 Sessions live on the server, not in a signed cookie.
  Asked: Server sessions or a stateless JWT?
  Answer: Server. I want to be able to revoke one.
  Lands in: REQ-002

## Background`
  );
  const p = composeCriteriaPacket({ feature: '001-login', spec: withDec });
  assert.match(p, /I want to be able to revoke one\./, 'the human\'s own words, not a paraphrase');
});

test('the criteria packet has no free-text slot for the caller to narrate through', () => {
  const base = { feature: '001-login', spec: SPEC };
  assert.equal(
    composeCriteriaPacket({ ...base, notes: 'REQ-002 is the tricky one', hint: 'keep it simple' }),
    composeCriteriaPacket(base),
    'extra fields must be ignored, not appended'
  );
});

test('the criteria packet names the one path that agent may write', () => {
  const p = composeCriteriaPacket({ feature: '001-login', spec: SPEC });
  assert.match(p, /\.interlocking\/work\/001-login\/CRITERIA\.md/);
});

test('the review packet carries the hashes the verdict must bind to', () => {
  const p = composeReviewPacket({ feature: '001-login', spec: SPEC, criteria: CRITERIA });
  assert.match(p, new RegExp(`reviewed: spec ${specHash(SPEC).slice(0, 8)} criteria ${specHash(CRITERIA).slice(0, 8)}`));
});

test('the review packet hands over paths, not summaries — the critic reads them itself', () => {
  const p = composeReviewPacket({ feature: '001-login', spec: SPEC, criteria: CRITERIA });
  assert.match(p, /\.interlocking\/work\/001-login\/SPEC\.md/);
  assert.match(p, /\.interlocking\/work\/001-login\/CRITERIA\.md/);
  // The whole point of a cold read is that nothing is pre-digested for it.
  assert.ok(!p.includes('The user can log in with email and password'), 'no requirement text');
  assert.ok(!p.includes('returns 200 and sets a session cookie'), 'no criterion text');
});

test('the review packet has no free-text slot either', () => {
  const base = { feature: '001-login', spec: SPEC, criteria: CRITERIA };
  assert.equal(
    composeReviewPacket({ ...base, focus: 'look hard at REQ-002', notes: 'we think it is fine' }),
    composeReviewPacket(base)
  );
});

test('neither packet throws on junk', () => {
  for (const bad of [null, undefined, 42, {}, { feature: 'x' }, { feature: 'x', spec: null }]) {
    assert.doesNotThrow(() => composeCriteriaPacket(bad));
    assert.doesNotThrow(() => composeReviewPacket(bad));
  }
});
