// Answer table for /il:help — the one command a human has to remember.
//
// The complaint this answers is not "there is no documentation". It is "I cannot
// find which of eleven commands applies right now". So the contract is narrow and
// the tests below exist to keep it narrow:
//
//   - AT MOST THREE commands, ever. A screen that lists everything is the feature
//     list the user already could not navigate.
//   - Only commands that would DO something in the current state. Offering
//     /il:next while the gate is shut teaches the user the screen lies.
//   - Routed on the GATE, never on `phase`. `phase` is a field in a document
//     anyone can edit; the gate is what is actually enforced. Same reason
//     /il:status refuses to trust `gates_passed`.
//   - A tamper or degraded signal LEADS. Guidance that buries "nothing is being
//     enforced" under a tidy command list is worse than no guidance.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composeHelp, HELP_MAX_COMMANDS } from '../hooks/il.mjs';

/** The command tokens a rendered screen offers, in order. */
const offered = (text) => [...text.matchAll(/^ {2}(\/il:[a-z]+)/gm)].map((m) => m[1]);

const OPEN = { open: true, why: 'G0 approved', feature: '001-login' };
const SHUT = { open: false, why: 'G0 not approved for 001-login', feature: '001-login' };
const NO_FEATURE = { open: true, why: 'no active feature', feature: null };

test('no feature — offers the two ways in, and says nothing is blocked', () => {
  const out = composeHelp({ feature: null, gate: NO_FEATURE, state: { data: {} } });
  assert.deepEqual(offered(out), ['/il:new', '/il:onboard', '/il:doctor']);
  assert.match(out, /no active feature/);
  assert.match(out, /Nothing is blocked/);
  assert.doesNotMatch(out, /\/il:approve/, 'nothing to approve yet');
});

test('gate shut — read it, approve it, or force it. Never /il:next', () => {
  const out = composeHelp({ feature: '001-login', gate: SHUT, state: { data: { phase: 'SPEC' } } });
  assert.deepEqual(offered(out), ['/il:design', '/il:approve', '/il:override']);
  assert.match(out, /BLOCKED/);
  assert.match(out, /never blocked/, 'must say planning still works, or the user thinks il is stuck');
});

test('gate open — the implementation loop, and no approve command left over', () => {
  const out = composeHelp({ feature: '001-login', gate: OPEN, state: { data: { phase: 'EXECUTE' } } });
  assert.deepEqual(offered(out), ['/il:next', '/il:verify', '/il:status']);
  assert.doesNotMatch(out, /\/il:approve/, 'already approved — offering it again is noise');
  assert.match(out, /unlocked/);
});

test('phase never routes — a lying STATE.md cannot change the offered commands', () => {
  const lying = composeHelp({ feature: '001-login', gate: SHUT, state: { data: { phase: 'EXECUTE' } } });
  const honest = composeHelp({ feature: '001-login', gate: SHUT, state: { data: { phase: 'SPEC' } } });
  assert.deepEqual(offered(lying), offered(honest));
});

test('tamper leads — the mismatch outranks the command list', () => {
  const out = composeHelp({
    feature: '001-login',
    gate: SHUT,
    state: { data: { gates_passed: ['G0'] } },
  });
  const warn = out.indexOf('⚠');
  assert.ok(warn !== -1, 'a STATE.md claiming G0 without an approval must warn');
  assert.ok(warn < out.indexOf('/il:design'), 'the warning comes before the commands');
  assert.match(out, /mirror/i);
});

test('advisory mode leads and routes to doctor — "open" here means nothing is enforced', () => {
  const out = composeHelp({
    feature: '001-login',
    gate: { open: true, why: 'approval store unavailable', feature: '001-login', degraded: true },
    state: { data: {} },
  });
  assert.match(out, /⚠[\s\S]*advisory/i);
  assert.match(out, /\/il:doctor/);
  assert.ok(out.indexOf('⚠') < out.indexOf('Now:'));
});

test('an override lease is open, but says so and still points at approval', () => {
  const out = composeHelp({
    feature: '001-login',
    gate: {
      open: true,
      why: 'override lease',
      feature: '001-login',
      lease: { reason: 'hotfix build break', edits_used: 2, max_edits: 10 },
    },
    state: { data: {} },
  });
  assert.match(out, /⚠[\s\S]*override/i);
  assert.match(out, /2\/10/);
  assert.ok(offered(out).includes('/il:approve'), 'a lease is a delay, not an approval');
});

test('every state stays within the cap', () => {
  const states = [
    { feature: null, gate: NO_FEATURE, state: { data: {} } },
    { feature: '001-login', gate: SHUT, state: { data: { gates_passed: ['G0'] } } },
    { feature: '001-login', gate: OPEN, state: { data: {} } },
    { feature: '001-login', gate: { ...OPEN, degraded: true }, state: { data: {} } },
    { feature: '001-login', gate: { ...OPEN, lease: { reason: 'x', edits_used: 1, max_edits: 3 } }, state: { data: {} } },
  ];
  for (const s of states) {
    const n = offered(composeHelp(s)).length;
    assert.ok(n > 0 && n <= HELP_MAX_COMMANDS, `${n} commands offered for ${s.gate.why}`);
  }
});

test('next_action is echoed when recorded, so help answers "what now" literally', () => {
  const out = composeHelp({
    feature: '001-login',
    gate: OPEN,
    state: { data: { next_action: 'T-012 — src/auth/session.ts' } },
  });
  assert.match(out, /T-012 — src\/auth\/session\.ts/);
});

test('garbage in never throws — help is the screen you reach for when things are broken', () => {
  for (const bad of [undefined, null, {}, { gate: null }, { state: 'nope' }, { gate: { open: 'yes' } }]) {
    assert.equal(typeof composeHelp(bad), 'string');
  }
});

test('the header names the feature once — gate.why already carries it', () => {
  const out = composeHelp({
    feature: '001-login',
    gate: { open: false, why: 'G0 not approved for 001-login', feature: '001-login' },
    state: { data: {} },
  });
  const header = out.split('\n')[0];
  assert.equal(header, '[il] 001-login · G0 not approved');
});
