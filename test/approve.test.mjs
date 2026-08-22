// The approval cycle, end to end through the process boundary.
//
// Two tests in here are the reason this project exists. If either regresses, the
// product is theater:
//
//   "the model cannot open its own gate by editing STATE.md"
//   "the model cannot open its own gate by widening policy.json"
//
// Everything else is supporting cast.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseIlDirective, signToken, specHash } from '../hooks/il.mjs';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), '..', 'hooks', 'il.mjs');

const SPEC = `# SPEC — 001-login

## Background
Session cookies, researched on 2026-08-16. Contains a typo: teh.

<!-- il:normative:begin -->
## Requirements
REQ-001 The user can log in with email and password.

REQ-002 A session expires after 30 minutes of inactivity.

## Threat model
Asset: session cookie. Threat: theft via XSS. Mitigation: HttpOnly + Secure.
<!-- il:normative:end -->
`;

// The yardstick, as il-criteria would have written it: one entry per REQ, in a
// file the session that wrote the SPEC cannot touch.
const CRITERIA = `# CRITERIA — 001-login

<!-- il:normative:begin -->

REQ-001
  Judged: POST /login with valid credentials returns 200 and sets a session cookie.
  Method: run \`npm test -- login\`

REQ-002
  Judged: a request made 31 minutes after the previous one returns 401.
  Method: run \`npm test -- session-expiry\`

<!-- il:normative:end -->
`;

/**
 * A cold review that clears Gate 1 for one specific spec/criteria pair. The
 * hashes are what makes it specific: change either document afterwards and this
 * same file stops clearing anything.
 */
const readyReview = (spec, criteria) => `# REVIEW — 001-login

## Independence evidence
- critic: il-spec-critic / subagent / fresh context, interview not read
- reviewed: spec ${specHash(spec).slice(0, 8)} criteria ${specHash(criteria).slice(0, 8)}

## Blockers

VERDICT: READY
`;

function setup({ spec = SPEC, criteria = CRITERIA, review, policy = null } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'il-appr-'));
  const home = mkdtempSync(join(tmpdir(), 'il-home-'));
  const work = join(dir, '.interlocking', 'work', '001-login');
  mkdirSync(work, { recursive: true });
  mkdirSync(join(dir, 'src'), { recursive: true });
  writeFileSync(join(dir, '.interlocking', 'current'), '001-login\n');
  writeFileSync(join(work, 'SPEC.md'), spec);
  if (criteria !== null) writeFileSync(join(work, 'CRITERIA.md'), criteria);
  // `undefined` means "the default READY review"; `null` means "no REVIEW.md".
  const rv = review === undefined ? readyReview(spec, criteria ?? '') : review;
  if (rv !== null) writeFileSync(join(work, 'REVIEW.md'), rv);
  if (policy) writeFileSync(join(dir, '.interlocking', 'policy.json'), JSON.stringify(policy, null, 2));
  return { dir, home };
}

function run(mode, payload, { dir, home }) {
  return spawnSync(process.execPath, [HOOK, mode], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    timeout: 20000,
    env: { ...process.env, IL_HOME: home, CLAUDE_PROJECT_DIR: dir },
  });
}

const prompt = (text, env, session = 's-1') =>
  run('prompt', { hook_event_name: 'UserPromptSubmit', session_id: session, prompt: text }, env);

const writeTo = (relPath, env, extra = {}) =>
  run('pre-write', {
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: join(env.dir, relPath) },
    ...extra,
  }, env);

function denyReasonOf(r) {
  if (!r.stdout.trim()) return null;
  const out = JSON.parse(r.stdout).hookSpecificOutput ?? {};
  return out.permissionDecision === 'deny' ? out.permissionDecisionReason : null;
}

function tokenFiles(home) {
  const projects = join(home, 'projects');
  if (!existsSync(projects)) return [];
  return readdirSync(projects).flatMap((p) => {
    const a = join(projects, p, 'approvals');
    return existsSync(a) ? readdirSync(a).map((f) => join(a, f)) : [];
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Directive recognition — the model must not be able to trigger this by talking
// ─────────────────────────────────────────────────────────────────────────────

test('directives are recognised in both the slash and slash-free forms', () => {
  for (const text of ['/il:approve', '/il:approve G0', 'il approve G0', '  /il:approve  ', 'IL Approve g0']) {
    assert.equal(parseIlDirective(text)?.kind, 'approve', text);
  }
  const o = parseIlDirective('/il:override build is broken in CI');
  assert.equal(o.kind, 'override');
  assert.equal(o.reason, 'build is broken in CI');
  assert.equal(parseIlDirective('il override typo in error message').reason, 'typo in error message');
});

test('a directive must OPEN the prompt — merely mentioning it does nothing', () => {
  // The user asking a question about the command must not approve anything.
  for (const text of [
    'what does /il:approve do?',
    'remind me to run /il:approve later',
    'the docs say you type /il:approve to unlock',
    'explain il approve',
  ]) {
    assert.equal(parseIlDirective(text), null, text);
  }
});

test('parseIlDirective never throws', () => {
  for (const bad of [undefined, null, 42, {}, [], '', '/il:', 'il', '/il:approve\n\nand also do X']) {
    assert.doesNotThrow(() => parseIlDirective(bad));
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// The cycle
// ─────────────────────────────────────────────────────────────────────────────

test('closed -> approve -> open, and the token lands outside the repo', () => {
  const env = setup();
  assert.ok(denyReasonOf(writeTo('src/auth.ts', env)), 'gate starts closed');

  const r = prompt('/il:approve', env);
  assert.equal(r.status, 0);
  const out = JSON.parse(r.stdout);
  assert.match(out.systemMessage ?? '', /approved/i, 'the human is told');
  assert.match(out.hookSpecificOutput?.additionalContext ?? '', /STATE\.md/, 'the model is told to mirror it');

  assert.equal(tokenFiles(env.home).length, 1, 'exactly one token, and it is not in the repo');
  assert.ok(!existsSync(join(env.dir, '.interlocking', 'approvals')), 'nothing written into the project');

  assert.equal(denyReasonOf(writeTo('src/auth.ts', env)), null, 'gate is now open');
});

test('a prompt that only mentions the command approves nothing', () => {
  const env = setup();
  prompt('what does /il:approve do?', env);
  assert.equal(tokenFiles(env.home).length, 0);
  assert.ok(denyReasonOf(writeTo('src/auth.ts', env)), 'still closed');
});

test('editing a REQ after approval re-closes the gate and says what changed', () => {
  const env = setup();
  prompt('/il:approve', env);
  assert.equal(denyReasonOf(writeTo('src/auth.ts', env)), null);

  writeFileSync(
    join(env.dir, '.interlocking', 'work', '001-login', 'SPEC.md'),
    SPEC.replace('30 minutes', '60 minutes')
  );
  const reason = denyReasonOf(writeTo('src/auth.ts', env));
  assert.ok(reason, 'a changed requirement must re-close the gate');
  assert.match(reason, /changed since/i);
});

test('fixing a typo OUTSIDE the normative region keeps the approval', () => {
  const env = setup();
  prompt('/il:approve', env);
  writeFileSync(
    join(env.dir, '.interlocking', 'work', '001-login', 'SPEC.md'),
    SPEC.replace('teh.', 'the.')
  );
  assert.equal(denyReasonOf(writeTo('src/auth.ts', env)), null, 'prose edits must not cost a re-approval');
});

// ─────────────────────────────────────────────────────────────────────────────
// ★ The two tests the product stands on
// ─────────────────────────────────────────────────────────────────────────────

test('★ the model cannot open its own gate by writing gates_passed into STATE.md', () => {
  const env = setup();
  writeFileSync(
    join(env.dir, '.interlocking', 'work', '001-login', 'STATE.md'),
    '---\nfeature: 001-login\ngates_passed: [G0]\nspec_sha256: deadbeef\n---\n\n## History\n'
  );
  const reason = denyReasonOf(writeTo('src/auth.ts', env));
  assert.ok(reason, 'STATE.md is a mirror; it must not be able to open a gate');
  assert.match(reason, /not approved/i);
});

test('★ the model cannot open its own gate by widening policy.json', () => {
  const env = setup();
  assert.ok(denyReasonOf(writeTo('src/auth.ts', env)), 'closed to begin with');

  // policy.json lives under .interlocking/, which is always writable by design.
  writeFileSync(
    join(env.dir, '.interlocking', 'policy.json'),
    JSON.stringify({ always_allow: ['**'], code: [] })
  );
  const reason = denyReasonOf(writeTo('src/auth.ts', env));
  assert.ok(reason, 'a widened policy must not unlock anything');
});

test('a policy may still be NARROWED without an approval', () => {
  const env = setup();
  prompt('/il:approve', env);
  // Gate more, not less: config/** becomes code on top of the builtins.
  writeFileSync(
    join(env.dir, '.interlocking', 'policy.json'),
    JSON.stringify({ code: ['config/**'], always_allow: [] })
  );
  mkdirSync(join(env.dir, 'config'), { recursive: true });
  assert.equal(denyReasonOf(writeTo('src/auth.ts', env)), null, 'the approval still stands');
});

// ─────────────────────────────────────────────────────────────────────────────
// Override — escape hatch and fast lane, one mechanism
// ─────────────────────────────────────────────────────────────────────────────

test('override opens the gate, records the reason, and tells the human', () => {
  const env = setup();
  const r = prompt('/il:override typo in an error message', env);
  assert.match(JSON.parse(r.stdout).systemMessage ?? '', /override/i);

  const w = writeTo('src/auth.ts', env);
  assert.equal(denyReasonOf(w), null, 'the lease opens the gate');
  const note = JSON.parse(w.stdout || '{}').hookSpecificOutput?.additionalContext ?? '';
  assert.match(note, /override/i, 'each leased write is announced, not silent');
  assert.match(note, /typo in an error message/, 'the reason travels with it');
});

test('override without a reason is refused — an unexplained bypass is worthless', () => {
  const env = setup();
  const r = prompt('/il:override', env);
  assert.match(JSON.parse(r.stdout).systemMessage ?? '', /reason/i);
  assert.ok(denyReasonOf(writeTo('src/auth.ts', env)), 'still closed');
});

test('an expired lease closes the gate again', () => {
  const env = setup();
  prompt('/il:override hotfix', env);
  assert.equal(denyReasonOf(writeTo('src/auth.ts', env)), null);

  // Forge a correctly signed but expired lease — only time should decide here.
  const key = readFileSync(join(env.home, 'key'));
  const leasePath = readdirSync(join(env.home, 'projects')).map((p) =>
    join(env.home, 'projects', p, 'leases', '001-login.json')
  )[0];
  const lease = JSON.parse(readFileSync(leasePath, 'utf8'));
  lease.expires_at = new Date(Date.now() - 60_000).toISOString();
  lease.sig = signToken(key, lease);
  writeFileSync(leasePath, JSON.stringify(lease));

  assert.ok(denyReasonOf(writeTo('src/auth.ts', env)), 'an expired lease must not keep the gate open');
});

test('a lease with a broken signature fails CLOSED — that is tampering, not a bug', () => {
  const env = setup();
  prompt('/il:override hotfix', env);
  const leasePath = readdirSync(join(env.home, 'projects')).map((p) =>
    join(env.home, 'projects', p, 'leases', '001-login.json')
  )[0];
  const lease = JSON.parse(readFileSync(leasePath, 'utf8'));
  lease.max_edits = 999999;
  writeFileSync(leasePath, JSON.stringify(lease)); // sig now stale
  assert.ok(denyReasonOf(writeTo('src/auth.ts', env)), 'edited lease must not be honoured');
});

test('a lease is spent by use, not only by time', () => {
  const env = setup({});
  writeFileSync(
    join(env.dir, '.interlocking', 'policy.json'),
    JSON.stringify({ override: { max_minutes: 20, max_edits: 2 } })
  );
  prompt('/il:override quick fix', env);
  assert.equal(denyReasonOf(writeTo('src/a.ts', env)), null, 'edit 1');
  assert.equal(denyReasonOf(writeTo('src/b.ts', env)), null, 'edit 2');
  assert.ok(denyReasonOf(writeTo('src/c.ts', env)), 'edit 3 is past the budget');
});

test('every grant and denial is auditable', () => {
  const env = setup();
  writeTo('src/auth.ts', env);
  prompt('/il:approve', env);
  const logs = readdirSync(join(env.home, 'projects')).map((p) =>
    readFileSync(join(env.home, 'projects', p, 'audit.log'), 'utf8')
  );
  const entries = logs.join('').trim().split('\n').map((l) => JSON.parse(l));
  assert.ok(entries.some((e) => e.event === 'deny'));
  assert.ok(entries.some((e) => e.event === 'approve'));
  for (const e of entries) assert.match(e.at, /^\d{4}-\d{2}-\d{2}T/);
});

test('approving with no SPEC is refused — there would be nothing to bind to', () => {
  const env = setup({ spec: '' });
  const r = prompt('/il:approve', env);
  assert.match(JSON.parse(r.stdout).systemMessage ?? '', /spec/i);
  assert.equal(tokenFiles(env.home).length, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// G0 has a red light. A gate that cannot refuse is decoration.
// ─────────────────────────────────────────────────────────────────────────────

test('a requirement with no criterion refuses the approval', () => {
  const env = setup({ criteria: CRITERIA.replace(/REQ-002[\s\S]*?session-expiry\`\n/, '') });
  const r = prompt('/il:approve', env);
  const msg = JSON.parse(r.stdout).systemMessage ?? '';
  assert.match(msg, /refused/i);
  assert.match(msg, /REQ-002/);
  assert.equal(tokenFiles(env.home).length, 0, 'nothing may be recorded');
  assert.ok(denyReasonOf(writeTo('src/auth.ts', env)), 'and the gate stays shut');
});

test('no CRITERIA.md at all refuses the approval', () => {
  const env = setup({ criteria: null });
  const r = prompt('/il:approve', env);
  assert.match(JSON.parse(r.stdout).systemMessage ?? '', /refused/i);
  assert.equal(tokenFiles(env.home).length, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// Gate 1 — the critic read it cold, and the gate asks what it found.
//
// The critic is a model, so its verdict must never be final over a person's:
// every refusal below has to be passable with `despite-review`, and the fact that
// it was has to survive into the record.
// ─────────────────────────────────────────────────────────────────────────────

test('no REVIEW.md refuses the approval — nobody has read this cold yet', () => {
  const env = setup({ review: null });
  const msg = JSON.parse(prompt('/il:approve', env).stdout).systemMessage ?? '';
  assert.match(msg, /refused/i);
  assert.match(msg, /REVIEW\.md/);
  assert.equal(tokenFiles(env.home).length, 0);
});

test('a NOT YET verdict refuses the approval and quotes the first blocker', () => {
  const env = setup({
    review: readyReview(SPEC, CRITERIA)
      .replace('VERDICT: READY', 'VERDICT: NOT YET')
      .replace('## Blockers\n', '## Blockers\nREQ-002  the criterion names a test that does not exist\n'),
  });
  const msg = JSON.parse(prompt('/il:approve', env).stdout).systemMessage ?? '';
  assert.match(msg, /refused/i);
  assert.match(msg, /NOT YET/);
  assert.match(msg, /does not exist/, 'the human is told what the objection actually was');
  assert.equal(tokenFiles(env.home).length, 0);
});

test('a human can overrule the critic, and the record says they did', () => {
  const env = setup({ review: readyReview(SPEC, CRITERIA).replace('VERDICT: READY', 'VERDICT: NOT YET') });
  const msg = JSON.parse(prompt('/il:approve despite-review', env).stdout).systemMessage ?? '';
  assert.match(msg, /approved/i);
  assert.match(msg, /over the critic/i, 'the approval line says it went over an objection');
  assert.equal(tokenFiles(env.home).length, 1);
  const token = JSON.parse(readFileSync(tokenFiles(env.home)[0], 'utf8'));
  assert.equal(token.review_overruled, true);
});

test('a review of a different spec does not clear this one', () => {
  // The commonest way this happens is honest: the critic ran, the human fixed a
  // REQ, and the old READY is still sitting there looking valid.
  const env = setup({ review: readyReview(SPEC.replace('REQ-002', 'REQ-009'), CRITERIA) });
  const msg = JSON.parse(prompt('/il:approve', env).stdout).systemMessage ?? '';
  assert.match(msg, /refused/i);
  assert.equal(tokenFiles(env.home).length, 0);
});

test('a review of a different CRITERIA does not clear this one either', () => {
  // This is the one that matters: the yardstick moved after it was reviewed.
  const env = setup({ review: readyReview(SPEC, CRITERIA.replace('31 minutes', '90 minutes')) });
  assert.match(JSON.parse(prompt('/il:approve', env).stdout).systemMessage ?? '', /refused/i);
  assert.equal(tokenFiles(env.home).length, 0);
});

test('prose in REVIEW.md is not a verdict', () => {
  const env = setup({ review: readyReview(SPEC, CRITERIA).replace('VERDICT: READY', 'Looks READY to me!') });
  assert.match(JSON.parse(prompt('/il:approve', env).stdout).systemMessage ?? '', /refused/i);
  assert.equal(tokenFiles(env.home).length, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// The approval binds to the yardstick, not only to the requirements.
// ─────────────────────────────────────────────────────────────────────────────

test('shortening a criterion after approval re-closes the gate', () => {
  // The one edit that turns a failing round into a passing one. If the gate does
  // not notice this, independent verification is decorative.
  const env = setup();
  prompt('/il:approve', env);
  assert.equal(denyReasonOf(writeTo('src/auth.ts', env)), null, 'open first');

  writeFileSync(
    join(env.dir, '.interlocking', 'work', '001-login', 'CRITERIA.md'),
    CRITERIA.replace('a request made 31 minutes after the previous one returns 401.', 'the session eventually ends.')
  );
  const why = denyReasonOf(writeTo('src/auth.ts', env));
  assert.ok(why, 'moving the yardstick must re-close the gate');
  assert.match(why, /CRITERIA\.md changed/i);
});

test('deleting CRITERIA.md after approval re-closes the gate', () => {
  const env = setup();
  prompt('/il:approve', env);
  rmSync(join(env.dir, '.interlocking', 'work', '001-login', 'CRITERIA.md'));
  assert.ok(denyReasonOf(writeTo('src/auth.ts', env)), 'a missing yardstick is a closed gate');
});

test('a missing threat model refuses the approval — mitigations become requirements', () => {
  const env = setup({ spec: SPEC.replace(/## Threat model[\s\S]*?(?=<!-- il:normative:end)/, '') });
  const r = prompt('/il:approve', env);
  assert.match(JSON.parse(r.stdout).systemMessage ?? '', /refused/i);
  assert.equal(tokenFiles(env.home).length, 0);
});

test('heuristic findings warn but never block — a false positive must not veto a human', () => {
  const env = setup({
    spec: SPEC.replace('A session expires after 30 minutes of inactivity.', 'The response is fast.'),
  });
  const r = prompt('/il:approve', env);
  const msg = JSON.parse(r.stdout).systemMessage ?? '';
  assert.match(msg, /approved/i, 'a warning must not veto the human');
  assert.match(msg, /warning/i, 'but they are told what they just accepted');
  assert.equal(tokenFiles(env.home).length, 1);
});

test('a refused approval is auditable, so a shut gate can be explained later', () => {
  const env = setup({ spec: SPEC.replace(/## Threat model[\s\S]*?(?=<!-- il:normative:end)/, '') });
  prompt('/il:approve', env);
  const log = readdirSync(join(env.home, 'projects')).map((p) =>
    readFileSync(join(env.home, 'projects', p, 'audit.log'), 'utf8')
  )[0];
  assert.match(log, /approve-refused/);
  assert.match(log, /no-threat-model/);
});
