// The scoped-amendment path, end to end through the process boundary.
//
// The property that matters is not that a scope gets produced. It is that the
// scope is derived from the SIGNED approval record and from nothing else, so a
// session that would prefer less work cannot talk its way into a wider reuse
// claim than the store supports.
//
// Everything the gate did before still holds here, and two tests say so
// explicitly: an amendment still closes G0, and the approval still binds both
// whole-document hashes. What changed is only how much work the two agents are
// asked to redo in between.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { specHash, projectId } from '../hooks/il.mjs';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), '..', 'hooks', 'il.mjs');

const REQS = `REQ-001 The user can log in with email and password.

REQ-002 A session expires after 30 minutes of inactivity.

REQ-003 The deployed bundle is byte-identical to the built one.`;

const specOf = (reqs) => `# SPEC — 001-login

## Background
Researched 2026-08-16.

<!-- il:normative:begin -->
## Requirements
${reqs}

## Threat model
Asset: session cookie. Threat: theft via XSS. Mitigation: HttpOnly + Secure.
<!-- il:normative:end -->
`;

const CRITERIA = `# CRITERIA — 001-login

<!-- il:normative:begin -->

REQ-001
  Judged: POST /login with valid credentials returns 200 and sets a cookie.
  Method: npm test -- login

REQ-002
  Judged: a request made 31 minutes after the previous one returns 401.
  Method: npm test -- expiry

REQ-003
  Judged: sha256 of every deployed file equals the manifest entry.
  Method: node tools/manifest.mjs --check

<!-- il:normative:end -->
`;

const readyReview = (spec, criteria) => `# REVIEW — 001-login

## Independence evidence
- critic: il-spec-critic / subagent / fresh context, interview not read
- reviewed: spec ${specHash(spec).slice(0, 8)} criteria ${specHash(criteria).slice(0, 8)}

## Blockers

VERDICT: READY
`;

function setup({ spec = specOf(REQS), criteria = CRITERIA, policy = null } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'il-amend-'));
  const home = mkdtempSync(join(tmpdir(), 'il-home-'));
  const work = join(dir, '.interlocking', 'work', '001-login');
  mkdirSync(work, { recursive: true });
  mkdirSync(join(dir, 'src'), { recursive: true });
  writeFileSync(join(dir, '.interlocking', 'current'), '001-login\n');
  writeFileSync(join(work, 'SPEC.md'), spec);
  writeFileSync(join(work, 'CRITERIA.md'), criteria);
  writeFileSync(join(work, 'REVIEW.md'), readyReview(spec, criteria));
  if (policy) writeFileSync(join(dir, '.interlocking', 'policy.json'), JSON.stringify(policy, null, 2));
  return { dir, home, work };
}

function hook(mode, args, { dir, home }, payload) {
  return spawnSync(process.execPath, [HOOK, mode, ...args], {
    input: payload === undefined ? '' : JSON.stringify(payload),
    encoding: 'utf8',
    timeout: 20000,
    env: { ...process.env, IL_HOME: home, CLAUDE_PROJECT_DIR: dir },
  });
}

const approve = (env, session = 's-1') =>
  hook('prompt', [], env, {
    hook_event_name: 'UserPromptSubmit',
    session_id: session,
    prompt: 'il approve',
  });

/** Rewrite SPEC.md and re-bless the review so only the amendment is under test. */
function amend(env, spec) {
  writeFileSync(join(env.work, 'SPEC.md'), spec);
  writeFileSync(join(env.work, 'REVIEW.md'), readyReview(spec, readFileSync(join(env.work, 'CRITERIA.md'), 'utf8')));
}

const tokenOf = (env) =>
  JSON.parse(
    readFileSync(join(env.home, 'projects', projectId(env.dir), 'approvals', '001-login.G0.json'), 'utf8')
  );

const writeTo = (rel, env) =>
  hook('pre-write', [], env, {
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: join(env.dir, rel) },
  });

const denied = (r) =>
  Boolean(r.stdout.trim()) &&
  JSON.parse(r.stdout).hookSpecificOutput?.permissionDecision === 'deny';

// ─────────────────────────────────────────────────────────────────────────────
// the record the scoping is derived from
// ─────────────────────────────────────────────────────────────────────────────

test('an approval records a hash per requirement, not just per document', () => {
  const env = setup();
  approve(env);
  const t = tokenOf(env);
  assert.deepEqual(Object.keys(t.req_digest).sort(), ['REQ-001', 'REQ-002', 'REQ-003']);
  assert.deepEqual(Object.keys(t.criteria_digest).sort(), ['REQ-001', 'REQ-002', 'REQ-003']);
  assert.equal(typeof t.spec_hash, 'string', 'and the whole-document binding is still there');
  assert.equal(typeof t.criteria_hash, 'string');
});

test('amending the spec still closes the gate — scoping changes work, not enforcement', () => {
  const env = setup();
  approve(env);
  assert.equal(denied(writeTo('src/app.ts', env)), false, 'approved: writes are open');

  amend(env, specOf(REQS.replace('30 minutes', '15 minutes')));
  assert.equal(denied(writeTo('src/app.ts', env)), true, 'amended: the gate closed, as before');
});

// ─────────────────────────────────────────────────────────────────────────────
// `il delta`
// ─────────────────────────────────────────────────────────────────────────────

test('delta names what moved and what carries, against the signed record', () => {
  const env = setup();
  approve(env);
  amend(env, specOf(REQS.replace('byte-identical to the built one.', 'byte-identical, proven offline against an attestation.')));

  const r = hook('delta', [], env);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /REQ-003/, 'the moved requirement is named');
  assert.match(r.stdout, /changed/i);
  assert.match(r.stdout, /REQ-001/, 'the carried ones are named too');
  assert.match(r.stdout, /criteria-packet --delta/, 'and it says what to do with the answer');
  assert.match(r.stdout, /binds BOTH whole-document hashes/i, 'and what this does NOT buy');
});

test('with no prior approval, delta refuses to scope anything', () => {
  const env = setup();
  const r = hook('delta', [], env);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /never been approved/i);
  assert.match(r.stdout, /Every requirement is in scope/i);
});

test('a tampered approval record produces no scope at all', () => {
  const env = setup();
  approve(env);
  const path = join(env.home, 'projects', projectId(env.dir), 'approvals', '001-login.G0.json');
  const t = JSON.parse(readFileSync(path, 'utf8'));
  t.req_digest['REQ-001'] = 'deadbeefdead';
  writeFileSync(path, JSON.stringify(t, null, 2));

  const r = hook('delta', [], env);
  assert.match(r.stdout, /signature/i, 'the answer is tampering, not a smaller scope');
  assert.doesNotMatch(r.stdout, /criteria-packet --delta/);
});

test('a threat-only amendment refuses scoped reuse and requires full review', () => {
  const env = setup();
  approve(env);
  const changed = specOf(REQS).replace('Threat: theft via XSS.', 'Threat: theft via XSS or forged deployment evidence.');
  amend(env, changed);

  const delta = hook('delta', [], env);
  assert.match(delta.stdout, /Shared normative context changed/i);
  assert.match(delta.stdout, /Every requirement is in scope/i);
  assert.doesNotMatch(delta.stdout, /criteria-packet --delta/);

  const packet = hook('review-packet', ['--delta'], env);
  assert.match(packet.stdout, /--delta ignored/i);
  assert.doesNotMatch(packet.stdout, /WHERE THE CHANGE IS/);
});

// ─────────────────────────────────────────────────────────────────────────────
// what the two agents actually get
// ─────────────────────────────────────────────────────────────────────────────

test('a scoped criteria packet lists only what moved and forbids touching the rest', () => {
  const env = setup();
  approve(env);
  amend(env, specOf(REQS.replace('byte-identical to the built one.', 'byte-identical, proven offline.')));

  const r = hook('criteria-packet', ['--delta'], env);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /AMENDMENT, NOT A FIRST DRAFT/);
  assert.match(r.stdout, /proven offline/, 'the moved requirement is quoted');
  assert.doesNotMatch(r.stdout, /email and password/, 'the carried ones are not re-derived');
  assert.match(r.stdout, /carry those entries through unchanged/i);
  assert.match(r.stdout, /re-opens that requirement for review/, 'and says what altering one costs');
});

test('without --delta nothing is scoped, even when a valid baseline exists', () => {
  const env = setup();
  approve(env);
  amend(env, specOf(REQS.replace('byte-identical to the built one.', 'byte-identical, proven offline.')));

  const r = hook('criteria-packet', [], env);
  assert.doesNotMatch(r.stdout, /AMENDMENT, NOT A FIRST DRAFT/);
  assert.match(r.stdout, /email and password/, 'the whole document comes back');
});

test('a criterion-only amendment skips criteria regeneration and goes straight to review', () => {
  const env = setup();
  approve(env);
  const changed = CRITERIA.replace('returns 401', 'returns HTTP 401');
  writeFileSync(join(env.work, 'CRITERIA.md'), changed);
  writeFileSync(join(env.work, 'REVIEW.md'), readyReview(specOf(REQS), changed));

  const criteriaPacket = hook('criteria-packet', ['--delta'], env);
  assert.match(criteriaPacket.stdout, /no criteria regeneration needed/i);
  assert.match(criteriaPacket.stdout, /review-packet --delta/i);
  assert.doesNotMatch(criteriaPacket.stdout, /ROLE: acceptance-criteria author/);

  const reviewPacket = hook('review-packet', ['--delta'], env);
  assert.match(reviewPacket.stdout, /WHERE THE CHANGE IS/);
  assert.match(reviewPacket.stdout, /REQ-002/);
});

test('--delta with no baseline falls back to the whole document and says so', () => {
  const env = setup();
  const r = hook('criteria-packet', ['--delta'], env);
  assert.match(r.stdout, /--delta ignored/);
  assert.match(r.stdout, /email and password/, 'and every requirement is still there');
});

test('a scoped review still sends the critic the whole pair', () => {
  // Narrowing what the critic READS would be the wrong saving: a criterion is
  // only judgeable against the requirements around it, and an amendment that
  // breaks a neighbour is exactly what the critic is for.
  const env = setup();
  approve(env);
  amend(env, specOf(REQS.replace('byte-identical to the built one.', 'byte-identical, proven offline.')));

  const r = hook('review-packet', ['--delta'], env);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /WHERE THE CHANGE IS/);
  assert.match(r.stdout, /REQ-003/);
  assert.match(r.stdout, /Read the whole pair anyway/i);
  assert.match(r.stdout, /it was approved before. is not an answer/i);
  assert.match(r.stdout, /reviewed: spec [0-9a-f]{8} criteria [0-9a-f]{8}/, 'the binding line is unchanged');
});

test('a scoped review still binds to the current pair, so it cannot inherit an old verdict', () => {
  const env = setup();
  approve(env);
  const spec2 = specOf(REQS.replace('byte-identical to the built one.', 'byte-identical, proven offline.'));
  writeFileSync(join(env.work, 'SPEC.md'), spec2);
  // The old REVIEW.md, left in place: it cleared the PREVIOUS pair.
  const r = approve(env, 's-2');
  assert.match(r.stdout, /REFUSED|refused/, r.stdout);
  assert.match(r.stdout, /stale|different SPEC/i);
});

// ─────────────────────────────────────────────────────────────────────────────
// what the human is told
// ─────────────────────────────────────────────────────────────────────────────

test('the approval screen says how much of this was already approved', () => {
  const env = setup();
  approve(env);
  amend(env, specOf(REQS.replace('byte-identical to the built one.', 'byte-identical, proven offline.')));

  const r = approve(env, 's-2');
  assert.match(r.stdout, /Amendment/);
  assert.match(r.stdout, /carried forward/i);
  assert.match(r.stdout, /REQ-003/, 'and which requirement moved');
});

test('a first approval says nothing about amendments', () => {
  const env = setup();
  const r = approve(env);
  assert.doesNotMatch(r.stdout, /carried forward/i);
  assert.match(r.stdout, /approved/i);
});
