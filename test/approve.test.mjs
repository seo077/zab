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
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseIlDirective, signToken } from '../hooks/il.mjs';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), '..', 'hooks', 'il.mjs');

const SPEC = `# SPEC — 001-login

## Background
Session cookies, researched on 2026-08-16. Contains a typo: teh.

<!-- il:normative:begin -->
## Requirements
REQ-001 The user can log in with email and password.
REQ-002 A session expires after 30 minutes of inactivity.
<!-- il:normative:end -->
`;

function setup({ spec = SPEC, policy = null } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'il-appr-'));
  const home = mkdtempSync(join(tmpdir(), 'il-home-'));
  mkdirSync(join(dir, '.interlocking', 'work', '001-login'), { recursive: true });
  mkdirSync(join(dir, 'src'), { recursive: true });
  writeFileSync(join(dir, '.interlocking', 'current'), '001-login\n');
  writeFileSync(join(dir, '.interlocking', 'work', '001-login', 'SPEC.md'), spec);
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
