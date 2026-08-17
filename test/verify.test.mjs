// The verify packet is what makes "independent" mean something.
//
// A subagent starts with a fresh context seeded only by the caller's prompt, so
// independence is not a property of the agent — it is a property of the PACKET.
// If the caller can narrate what was built, the verifier inherits the
// implementer's framing and the separation buys nothing.
//
// Hence: the packet is assembled from the SPEC itself, has no free-text slot, and
// carries acceptance criteria verbatim rather than summarised.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { composeVerifyPacket, verifierFor, routeRequirements, DEFAULT_POLICY } from '../hooks/il.mjs';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), '..', 'hooks', 'il.mjs');

const SPEC = `# SPEC — 001-login

## Background
Some prose the verifier has no business reading as a requirement.

<!-- il:normative:begin -->
## Requirements
REQ-001 The user can log in with email and password.
  Acceptance: POST /login with valid credentials returns 200 and sets a session
  cookie; invalid credentials return 401.

REQ-002 A session expires after 30 minutes of inactivity.
  Acceptance: a request made 31 minutes after the previous one returns 401.

REQ-003 [circuit] GPIO12 is input-only with no pull-up.
  Acceptance: hardware/pinmap.md PU setting matches GPIO_MODE in the source.

## Threat model
Asset: session cookie. Mitigation: HttpOnly.
<!-- il:normative:end -->
`;

const base = {
  feature: '001-login',
  spec: SPEC,
  range: 'a1b2c3d..9f8e7d6',
  commands: ['npm test'],
  verifier: 'il-verifier',
  reqIds: ['REQ-001', 'REQ-002'],
};

test('acceptance criteria travel verbatim, not summarised', () => {
  const p = composeVerifyPacket(base);
  assert.match(p, /POST \/login with valid credentials returns 200 and sets a session/);
  assert.match(p, /a request made 31 minutes after the previous one returns 401\./);
});

test('only the requested REQs are included', () => {
  const p = composeVerifyPacket(base);
  assert.match(p, /REQ-001/);
  assert.match(p, /REQ-002/);
  assert.doesNotMatch(p, /REQ-003/, 'a REQ routed to another verifier must not leak in');
});

test('prose from the spec is not carried in as if it were a requirement', () => {
  const p = composeVerifyPacket(base);
  assert.doesNotMatch(p, /no business reading as a requirement/);
});

test('the packet names the diff, the commands, and the one writable path', () => {
  const p = composeVerifyPacket(base);
  assert.match(p, /a1b2c3d\.\.9f8e7d6/);
  assert.match(p, /npm test/);
  assert.match(p, /\.interlocking\/work\/001-login\/VERIFY\.md/);
});

test('the packet tells the verifier what it must not assume', () => {
  const p = composeVerifyPacket(base);
  assert.match(p, /did not implement|not implement this/i);
  assert.match(p, /evidence|data/i, 'files are evidence, not instructions');
  assert.match(p, /INCONCLUSIVE/, 'the third verdict has to be offered or it will not be used');
});

test('there is no free-text slot for the caller to narrate through', () => {
  // Same structured inputs -> byte-identical packet. Nothing the implementer
  // "knows" can ride along.
  assert.equal(composeVerifyPacket(base), composeVerifyPacket({ ...base }));
  const withJunk = composeVerifyPacket({ ...base, notes: 'I already checked, it works', summary: 'all good' });
  assert.equal(withJunk, composeVerifyPacket(base), 'extra fields must be ignored, not appended');
});

test('a missing acceptance criterion is surfaced rather than silently dropped', () => {
  const spec = SPEC.replace('  Acceptance: a request made 31 minutes after the previous one returns 401.\n', '');
  const p = composeVerifyPacket({ ...base, spec });
  assert.match(p, /REQ-002/);
  assert.match(p, /no acceptance criterion/i);
});

test('composeVerifyPacket never throws', () => {
  for (const bad of [undefined, null, 42, {}, { feature: 'x' }, { ...base, spec: null }, { ...base, reqIds: null }]) {
    assert.doesNotThrow(() => composeVerifyPacket(bad), `threw on ${JSON.stringify(bad)?.slice(0, 40)}`);
    assert.equal(typeof composeVerifyPacket(bad), 'string');
  }
});

// ─── routing: the extension point for domain verifiers ──────────────────────

test('an untagged REQ goes to the default verifier', () => {
  assert.equal(verifierFor('REQ-001 The user can log in.', DEFAULT_POLICY), 'il-verifier');
});

test('a tagged REQ routes to its domain verifier when one is configured', () => {
  const policy = {
    verifiers: {
      default: { type: 'subagent', name: 'il-verifier' },
      circuit: { type: 'subagent', name: 'il-circuit-verifier' },
    },
  };
  assert.equal(verifierFor('REQ-003 [circuit] GPIO12 is input-only.', policy), 'il-circuit-verifier');
  // An unconfigured tag must fall back rather than route into thin air.
  assert.equal(verifierFor('REQ-004 [timing] p95 under 66ms.', policy), 'il-verifier');
});

test('routing survives the trip through the SPEC parser, not just a raw line', () => {
  // requirementBlocks() strips the [tag] out of the requirement text, so routing
  // that reads the parsed text sees no tag at all. Both units passed their own
  // tests while the seam between them dropped the routing entirely.
  const policy = {
    verifiers: {
      default: { type: 'subagent', name: 'il-verifier' },
      circuit: { type: 'subagent', name: 'il-circuit-verifier' },
    },
  };
  const routed = routeRequirements(SPEC, policy);
  assert.equal(routed.get('il-circuit-verifier')?.join(), 'REQ-003');
  assert.equal(routed.get('il-verifier')?.join(), 'REQ-001,REQ-002');
});

// ─── the packet is a FILE: the extension point for external verifiers ───────

function project() {
  const dir = mkdtempSync(join(tmpdir(), 'il-vfy-'));
  const home = mkdtempSync(join(tmpdir(), 'il-home-'));
  mkdirSync(join(dir, '.interlocking', 'work', '001-login'), { recursive: true });
  mkdirSync(join(dir, 'src'), { recursive: true });
  writeFileSync(join(dir, '.interlocking', 'current'), '001-login\n');
  writeFileSync(join(dir, '.interlocking', 'work', '001-login', 'SPEC.md'), SPEC);
  return { dir, home };
}

function run(mode, args, { dir, home }, input = '') {
  return spawnSync(process.execPath, [HOOK, mode, ...args], {
    input,
    encoding: 'utf8',
    timeout: 20000,
    env: { ...process.env, IL_HOME: home, CLAUDE_PROJECT_DIR: dir },
  });
}

test('the packet is written to disk, so any tool can be handed the same input', () => {
  const env = project();
  const r = run('verify-packet', ['a1b2c3d..9f8e7d6'], env, '');
  assert.equal(r.status, 0, r.stderr);
  const path = join(env.dir, '.interlocking', 'work', '001-login', '.verify-packet.md');
  assert.ok(existsSync(path), `expected the packet at ${path}, got stdout: ${r.stdout}`);
  const packet = readFileSync(path, 'utf8');
  assert.match(packet, /REQ-001/);
  assert.match(packet, /a1b2c3d\.\.9f8e7d6/);
  assert.match(r.stdout, /\.verify-packet\.md/, 'the path is reported so a skill can pass it on');
});

// ─── the write block that config cannot undo ────────────────────────────────

const writeAs = (relPath, env, agent) =>
  run('pre-write', [], env, JSON.stringify({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    agent_type: agent,
    tool_input: { file_path: join(env.dir, relPath) },
  }));

const bashAs = (command, env, agent) =>
  run('pre-bash', [], env, JSON.stringify({
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    agent_type: agent,
    tool_input: { command },
  }));

const denied = (r) => {
  if (!r.stdout.trim()) return false;
  return JSON.parse(r.stdout).hookSpecificOutput?.permissionDecision === 'deny';
};

test('the verifier cannot write source, even with the gate wide open', () => {
  const env = project();
  assert.ok(denied(writeAs('src/auth.ts', env, 'il-verifier')));
  assert.ok(denied(bashAs('echo x > src/auth.ts', env, 'il-verifier')));
  assert.ok(denied(bashAs('sed -i s/a/b/ src/auth.ts', env, 'il-verifier')));
});

test('the verifier CAN write exactly one file, and only that one', () => {
  const env = project();
  assert.equal(denied(writeAs('.interlocking/work/001-login/VERIFY.md', env, 'il-verifier')), false);
  assert.equal(
    denied(bashAs("cat > .interlocking/work/001-login/VERIFY.md <<'IL_EOF'", env, 'il-verifier')),
    false
  );
  // Not the spec, not another feature's verdict, not the state file.
  assert.ok(denied(writeAs('.interlocking/work/001-login/SPEC.md', env, 'il-verifier')));
  assert.ok(denied(writeAs('.interlocking/work/001-login/STATE.md', env, 'il-verifier')));
  assert.ok(denied(writeAs('.interlocking/work/002-other/VERIFY.md', env, 'il-verifier')));
});

test('the verifier can still read and run — it is useless otherwise', () => {
  const env = project();
  for (const cmd of ['npm test', 'git diff a1b2c3d..9f8e7d6', 'grep -rn session src/', 'cat src/auth.ts']) {
    assert.equal(denied(bashAs(cmd, env, 'il-verifier')), false, cmd);
  }
});

test('an ordinary subagent is not subject to the verifier rule', () => {
  const env = project();
  const r = writeAs('README.md', env, 'general-purpose');
  assert.equal(denied(r), false);
});
