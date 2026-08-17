// Answer table for STATE.md reading and the SessionStart injection.
//
// This text is prepended to EVERY session, so it is charged against the context
// budget forever. The rules it has to obey:
//   - a hard line/char cap, enforced by the hook rather than by good intentions
//   - paths, never document contents
//   - uncommitted leftovers surface as a QUESTION for the human, never a decision
//   - a STATE.md that disagrees with the approval store is a tamper signal, loud

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resumeBrief,
  historyEntries,
  composeSessionContext,
  SESSION_CONTEXT_MAX_LINES,
  SESSION_CONTEXT_MAX_CHARS,
} from '../hooks/il.mjs';

const BODY = `
# 001-login

## Resume brief
- Goal: server sessions + HttpOnly cookies. No social login.
- Done: T-001..T-011 (11 commits)
- Now: T-012 — src/auth/session.ts
- Watch: ASM-002 (30 min session TTL assumed, unconfirmed)

## History
- 2026-08-16T22:10Z G0 approved (spec 4f2a9c1e)
- 2026-08-17T01:44Z T-010,T-011 done -> a1b2c3d
- 2026-08-17T09:12Z override 20m: "hotfix build break"
- 2026-08-17T10:02Z T-012 started
`;

const STATE = {
  il_version: 1,
  feature: '001-login',
  phase: 'EXECUTE',
  gates_passed: ['G0'],
  spec_sha256: '4f2a9c1e',
  next_action: 'T-012: session cookie in src/auth/session.ts (SPEC.md#REQ-007)',
  blocked_on: null,
  open_assumptions: ['ASM-002', 'ASM-005'],
  head_commit: 'a1b2c3d',
};

const CLEAN_GIT = { isRepo: true, dirty: [], head: 'a1b2c3d', op: null };
const OPEN_GATE = { open: true, why: 'G0 approved', feature: '001-login' };

function ctx(over = {}) {
  return {
    feature: '001-login',
    state: { data: STATE, body: BODY },
    git: CLEAN_GIT,
    gate: OPEN_GATE,
    source: 'startup',
    askedDirty: false,
    ...over,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// section extraction
// ─────────────────────────────────────────────────────────────────────────────

test('resumeBrief takes only its own section', () => {
  const lines = resumeBrief(BODY);
  assert.equal(lines.length, 4);
  assert.match(lines[0], /Goal:/);
  assert.ok(!lines.some((l) => /History|G0 approved/.test(l)), 'must not bleed into History');
});

test('resumeBrief is capped so a bloated section cannot eat the budget', () => {
  const huge = '## Resume brief\n' + Array.from({ length: 100 }, (_, i) => `- line ${i}`).join('\n');
  assert.ok(resumeBrief(huge).length <= 8);
});

test('HTML comments are stripped — the templates use them for guidance', () => {
  const withComments = [
    '## Resume brief',
    '<!-- Rewritten in full on every update. Max 8 lines. -->',
    '- Goal: ship login',
    '<!-- another note -->',
    '- Now: T-012',
    '',
    '## History',
    '<!-- APPEND ONLY, newest last -->',
    '- 2026-08-17 T-011 done',
  ].join('\n');
  assert.deepEqual(resumeBrief(withComments), ['- Goal: ship login', '- Now: T-012']);
  assert.deepEqual(historyEntries(withComments, 3), ['- 2026-08-17 T-011 done']);
});

test('resumeBrief on a document without the section returns nothing', () => {
  assert.deepEqual(resumeBrief('# just a title\n'), []);
  assert.deepEqual(resumeBrief(''), []);
  assert.deepEqual(resumeBrief(null), []);
});

test('historyEntries returns the most recent n, newest last', () => {
  const h = historyEntries(BODY, 3);
  assert.equal(h.length, 3);
  assert.match(h[0], /T-010,T-011/);
  assert.match(h[2], /T-012 started/);
  assert.ok(!h.some((l) => /G0 approved/.test(l)), 'the oldest entry is dropped');
});

test('historyEntries never throws', () => {
  for (const bad of [undefined, null, 42, {}, '']) {
    assert.doesNotThrow(() => historyEntries(bad, 3));
    assert.ok(Array.isArray(historyEntries(bad, 3)));
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// the injection itself
// ─────────────────────────────────────────────────────────────────────────────

function assertBudget(text, label) {
  const lines = text.split('\n').length;
  assert.ok(lines <= SESSION_CONTEXT_MAX_LINES, `${label}: ${lines} lines exceeds the budget`);
  assert.ok(text.length <= SESSION_CONTEXT_MAX_CHARS, `${label}: ${text.length} chars exceeds the budget`);
}

test('a normal resume fits the budget and names the next action', () => {
  const out = composeSessionContext(ctx());
  assertBudget(out, 'normal');
  assert.match(out, /001-login/);
  assert.match(out, /T-012/);
  assert.match(out, /STATE\.md/, 'points at the resume anchor');
  assert.match(out, /ASM-002/, 'open assumptions stay visible');
});

test('the budget holds even when every input is oversized', () => {
  const out = composeSessionContext(
    ctx({
      state: {
        data: { ...STATE, next_action: 'x'.repeat(4000), open_assumptions: Array.from({ length: 200 }, (_, i) => `ASM-${i}`) },
        body: '## Resume brief\n' + '- long line '.repeat(400) + '\n## History\n' + '- entry\n'.repeat(500),
      },
      git: { isRepo: true, dirty: Array.from({ length: 400 }, (_, i) => `src/f${i}.ts`), head: 'a1b2c3d', op: null },
    })
  );
  assertBudget(out, 'oversized');
});

test('document CONTENTS are never injected — only paths', () => {
  const out = composeSessionContext(ctx());
  assert.doesNotMatch(out, /REQ-001|acceptance criteria/i, 'SPEC content must stay out of every session');
  assert.match(out, /\.interlocking\/work\/001-login/, 'the path is enough');
});

test('uncommitted leftovers produce a QUESTION, never a decision', () => {
  const dirty = ['src/auth/session.ts', 'tests/test_session.ts', 'notes.txt'];
  const out = composeSessionContext(ctx({ git: { ...CLEAN_GIT, dirty } }));
  assertBudget(out, 'dirty');
  assert.match(out, /ACTION REQUIRED/);
  assert.match(out, /3 file/, 'says how many');
  assert.match(out, /src\/auth\/session\.ts/, 'names at least one');
  assert.match(out, /ask the human/i);
  assert.doesNotMatch(out, /\bI will (discard|keep|continue)\b/i, 'the hook must not choose');
});

test('uncommitted HARNESS files alone are a note, not a blocking question', () => {
  // Found by dogfooding: /il:new writes SPEC.md and STATE.md, then the very next
  // /il:next stops to ask what to do about them. The harness was interrogating
  // the human about files it had just created itself. The question exists to
  // protect half-finished IMPLEMENTATION work, which this is not.
  const dirty = ['.interlocking/current', '.interlocking/work/001-login/SPEC.md', '.interlocking/CONTEXT.md'];
  const out = composeSessionContext(ctx({ git: { ...CLEAN_GIT, dirty } }));
  assert.doesNotMatch(out, /ACTION REQUIRED/, 'harness artifacts must not stall the flow');
  assert.match(out, /uncommitted/i, 'but they are still mentioned');
  assert.match(out, /commit/i, 'with the obvious next step');
});

test('one uncommitted source file among harness files still asks', () => {
  const dirty = ['.interlocking/work/001-login/SPEC.md', 'src/auth/session.ts'];
  const out = composeSessionContext(ctx({ git: { ...CLEAN_GIT, dirty } }));
  assert.match(out, /ACTION REQUIRED/);
  assert.match(out, /src\/auth\/session\.ts/);
});

test('a clean tree asks nothing', () => {
  const out = composeSessionContext(ctx());
  assert.doesNotMatch(out, /ACTION REQUIRED/);
});

test('the leftovers question is asked once per session, not again after a compaction', () => {
  const dirty = ['src/a.ts'];
  const first = composeSessionContext(ctx({ git: { ...CLEAN_GIT, dirty } }));
  const after = composeSessionContext(ctx({ git: { ...CLEAN_GIT, dirty }, source: 'compact', askedDirty: true }));
  assert.match(first, /ACTION REQUIRED/);
  assert.doesNotMatch(after, /ACTION REQUIRED/);
  assert.match(after, /compact/i, 'but it still says why it is re-anchoring');
});

test('HEAD moving since STATE.md was written is surfaced', () => {
  const out = composeSessionContext(ctx({ git: { ...CLEAN_GIT, head: '9f8e7d6' } }));
  assert.match(out, /a1b2c3d/);
  assert.match(out, /9f8e7d6/);
  assert.match(out, /ACTION REQUIRED/);
});

test('a repo mid-rebase is reported before anything else is attempted', () => {
  const out = composeSessionContext(ctx({ git: { ...CLEAN_GIT, op: 'rebase' } }));
  assert.match(out, /rebase/);
  assert.match(out, /ACTION REQUIRED/);
});

test('without git, the hook says so and asks a different question', () => {
  const out = composeSessionContext(ctx({ git: { isRepo: false, dirty: [], head: null, op: null } }));
  assertBudget(out, 'no-git');
  assert.match(out, /no git/i);
  assert.match(out, /STATE\.md/);
  assert.doesNotMatch(out, /leftover/i, 'it cannot detect leftovers, so it must not imply it did');
});

test('a closed gate is stated, with the way to open it', () => {
  const out = composeSessionContext(
    ctx({ gate: { open: false, why: 'G0 not approved for 001-login', feature: '001-login' } })
  );
  assert.match(out, /not approved/);
  assert.match(out, /\/il:approve/);
});

test('STATE.md claiming a gate the store does not back is a loud tamper signal', () => {
  // gates_passed says G0; the store disagrees. STATE.md is a mirror, never the authority.
  const out = composeSessionContext(
    ctx({ gate: { open: false, why: 'G0 not approved for 001-login', feature: '001-login' } })
  );
  assert.match(out, /STATE\.md/);
  assert.match(out, /claims|mismatch|not backed/i);
});

test('an override lease keeps a banner up until the feature is verified', () => {
  const out = composeSessionContext(
    ctx({ gate: { open: true, why: 'override lease', feature: '001-login', lease: { reason: 'hotfix build break', edits_used: 7 } } })
  );
  assert.match(out, /override/i);
  assert.match(out, /hotfix build break/);
  assert.match(out, /VERIFY\.md/);
});

test('the harness installed but no feature started is three quiet lines', () => {
  const out = composeSessionContext(ctx({ feature: null, state: { data: {}, body: '' }, gate: { open: true, why: 'no active feature', feature: null } }));
  assert.ok(out.split('\n').length <= 4, `expected a short notice, got:\n${out}`);
  assert.match(out, /il:new/);
});

test('composeSessionContext never throws and always returns a string', () => {
  const nasty = [undefined, null, 42, {}, { state: null, git: null, gate: null }, { state: { data: null, body: null }, git: {}, gate: {} }];
  for (const bad of nasty) {
    assert.doesNotThrow(() => composeSessionContext(bad), `threw on ${JSON.stringify(bad)}`);
    assert.equal(typeof composeSessionContext(bad), 'string');
  }
});
