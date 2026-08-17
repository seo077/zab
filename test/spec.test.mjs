// Answer table for the hashing and frontmatter primitives, written first.
//
// specHash() decides whether a G0 approval is still valid. Two ways to be wrong:
//   - too sensitive -> a checkout on another OS silently revokes every approval
//   - too permissive -> a requirement can be rewritten under an approval
// parseFrontmatter() runs on every SessionStart. If it can throw, it can brick a session.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeText,
  normativeRegion,
  sha256hex,
  specHash,
  parseFrontmatter,
} from '../hooks/il.mjs';

// ─────────────────────────────────────────────────────────────────────────────
// normalizeText — line endings, BOM, trailing space, blank-line runs
// ─────────────────────────────────────────────────────────────────────────────

test('CRLF and LF normalize identically — the Windows/Linux collaboration case', () => {
  const lf = 'REQ-001 login\nREQ-002 logout\n';
  const crlf = 'REQ-001 login\r\nREQ-002 logout\r\n';
  const cr = 'REQ-001 login\rREQ-002 logout\r';
  assert.equal(normalizeText(crlf), normalizeText(lf));
  assert.equal(normalizeText(cr), normalizeText(lf));
  assert.equal(sha256hex(normalizeText(crlf)), sha256hex(normalizeText(lf)));
});

test('BOM is stripped', () => {
  assert.equal(normalizeText('\uFEFFREQ-001'), normalizeText('REQ-001'));
});

test('trailing whitespace on a line is irrelevant', () => {
  assert.equal(normalizeText('REQ-001   \nREQ-002\t\n'), normalizeText('REQ-001\nREQ-002\n'));
});

test('runs of blank lines collapse to one, but a paragraph break is preserved', () => {
  assert.equal(normalizeText('a\n\n\n\nb'), 'a\n\nb');
  assert.notEqual(normalizeText('a\n\nb'), normalizeText('a\nb'));
});

test('leading and trailing blank lines are irrelevant', () => {
  assert.equal(normalizeText('\n\n  a\nb\n\n\n'), normalizeText('  a\nb'));
});

test('leading indentation IS significant — it changes markdown meaning', () => {
  assert.notEqual(normalizeText('  a'), normalizeText('a'));
});

test('normalizeText never throws', () => {
  for (const bad of [undefined, null, 42, {}, []]) {
    assert.doesNotThrow(() => normalizeText(bad));
    assert.equal(typeof normalizeText(bad), 'string');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// normativeRegion — only requirements bind an approval
// ─────────────────────────────────────────────────────────────────────────────

const WITH_MARKERS = `# SPEC — 001-login

## Background
Some prose with a typo: teh.

<!-- il:normative:begin -->
## Requirements
REQ-001 The user can log in.
<!-- il:normative:end -->

## Notes
Anything down here.
`;

test('only the marked region is extracted', () => {
  const r = normativeRegion(WITH_MARKERS);
  assert.match(r, /REQ-001/);
  assert.doesNotMatch(r, /Background/);
  assert.doesNotMatch(r, /Anything down here/);
  assert.doesNotMatch(r, /il:normative/, 'the markers themselves are not part of the region');
});

test('editing prose outside the region does NOT invalidate an approval', () => {
  const fixed = WITH_MARKERS.replace('teh.', 'the.');
  assert.equal(specHash(fixed), specHash(WITH_MARKERS));
});

test('editing a requirement DOES invalidate an approval', () => {
  const changed = WITH_MARKERS.replace('can log in', 'can log in with SSO');
  assert.notEqual(specHash(changed), specHash(WITH_MARKERS));
});

test('multiple marked regions are concatenated in order', () => {
  const doc = [
    'intro',
    '<!-- il:normative:begin -->',
    'REQ-001',
    '<!-- il:normative:end -->',
    'middle prose',
    '<!-- il:normative:begin -->',
    'ASM-001',
    '<!-- il:normative:end -->',
    'outro',
  ].join('\n');
  const r = normativeRegion(doc);
  assert.match(r, /REQ-001/);
  assert.match(r, /ASM-001/);
  assert.doesNotMatch(r, /middle prose/);
  assert.doesNotMatch(r, /intro|outro/);
});

test('no markers means the whole document binds', () => {
  const plain = '# SPEC\nREQ-001 anything\n';
  assert.equal(normativeRegion(plain).trim(), plain.trim());
});

test('an unclosed begin marker falls back to the whole document', () => {
  // Safer to over-invalidate than to leave a requirement editable under approval.
  const broken = 'intro\n<!-- il:normative:begin -->\nREQ-001\n';
  assert.match(normativeRegion(broken), /intro/);
});

test('marker matching tolerates spacing variations', () => {
  const spaced = 'a\n<!--il:normative:begin-->\nREQ-001\n<!--   il:normative:end   -->\nb';
  const r = normativeRegion(spaced);
  assert.match(r, /REQ-001/);
  assert.doesNotMatch(r, /^a$/m);
});

test('specHash is stable, hex, and never throws', () => {
  const h = specHash(WITH_MARKERS);
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.equal(h, specHash(WITH_MARKERS));
  for (const bad of [undefined, null, 42, {}]) {
    assert.doesNotThrow(() => specHash(bad));
    assert.match(specHash(bad), /^[0-9a-f]{64}$/);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// parseFrontmatter — the flat YAML subset STATE.md is restricted to
// ─────────────────────────────────────────────────────────────────────────────

const STATE = `---
il_version: 1
feature: 001-login
phase: EXECUTE
gates_passed: [G0]
spec_sha256: 4f2a9c1e
next_action: "T-012: session cookie (SPEC.md#REQ-007)"
blocked_on: null
open_assumptions: [ASM-002, ASM-005]
enforce: true
---

## Resume brief
- Goal: server sessions
`;

test('parseFrontmatter reads the documented subset', () => {
  const { data, body } = parseFrontmatter(STATE);
  assert.equal(data.il_version, 1);
  assert.equal(data.feature, '001-login');
  assert.equal(data.phase, 'EXECUTE');
  assert.deepEqual(data.gates_passed, ['G0']);
  assert.equal(data.spec_sha256, '4f2a9c1e');
  assert.equal(data.blocked_on, null);
  assert.deepEqual(data.open_assumptions, ['ASM-002', 'ASM-005']);
  assert.equal(data.enforce, true);
  assert.match(body, /## Resume brief/);
  assert.doesNotMatch(body, /il_version/);
});

test('a quoted value keeps its colons and hashes', () => {
  const { data } = parseFrontmatter(STATE);
  assert.equal(data.next_action, 'T-012: session cookie (SPEC.md#REQ-007)');
});

test('unquoted trailing comments are stripped, but a bare # is not a comment', () => {
  const { data } = parseFrontmatter('---\na: hello   # side note\nb: c#d\n---\n');
  assert.equal(data.a, 'hello');
  assert.equal(data.b, 'c#d');
});

test('empty list and empty string are distinguishable', () => {
  const { data } = parseFrontmatter('---\na: []\nb: ""\nc:\n---\n');
  assert.deepEqual(data.a, []);
  assert.equal(data.b, '');
  assert.equal(data.c, null);
});

test('later keys win over earlier duplicates', () => {
  const { data } = parseFrontmatter('---\na: 1\na: 2\n---\n');
  assert.equal(data.a, 2);
});

test('CRLF frontmatter parses the same as LF', () => {
  const { data } = parseFrontmatter('---\r\nfeature: x\r\ngates_passed: [G0]\r\n---\r\nbody\r\n');
  assert.equal(data.feature, 'x');
  assert.deepEqual(data.gates_passed, ['G0']);
});

test('no frontmatter leaves the document untouched', () => {
  const { data, body } = parseFrontmatter('# Just markdown\n');
  assert.deepEqual(data, {});
  assert.equal(body, '# Just markdown\n');
});

test('an unterminated frontmatter block is not frontmatter', () => {
  const text = '---\nfeature: x\nno closing fence\n';
  const { data, body } = parseFrontmatter(text);
  assert.deepEqual(data, {});
  assert.equal(body, text);
});

test('unsupported nesting is skipped, not fatal', () => {
  // The template documents the flat subset. Anything else must degrade, not throw.
  const { data } = parseFrontmatter('---\nfeature: x\nnested:\n  a: 1\n  b: 2\nphase: SPEC\n---\n');
  assert.equal(data.feature, 'x');
  assert.equal(data.phase, 'SPEC', 'keys after an unsupported block are still read');
});

test('parseFrontmatter never throws and always returns the shape', () => {
  const nasty = [
    undefined, null, 42, {}, [], '', '---', '---\n', '---\n---',
    '---\n:\n---\n', '---\n[]: x\n---\n', '---\n' + 'a: 1\n'.repeat(5000) + '---\n',
    '---\nkey: [unclosed\n---\n', '---\nkey: "unterminated\n---\n',
    '\uFEFF---\nfeature: bom\n---\n',
  ];
  for (const bad of nasty) {
    assert.doesNotThrow(() => parseFrontmatter(bad), `threw on ${JSON.stringify(bad)?.slice(0, 30)}`);
    const r = parseFrontmatter(bad);
    assert.equal(typeof r.data, 'object');
    assert.equal(typeof r.body, 'string');
  }
});

test('a BOM before the fence still parses', () => {
  const { data } = parseFrontmatter('\uFEFF---\nfeature: bom\n---\nbody');
  assert.equal(data.feature, 'bom');
});

test('values are never coerced into JS surprises', () => {
  const { data } = parseFrontmatter('---\na: 007\nb: 1.5\nc: NaN\nd: 1e3\ne: yes\nf: 0x10\n---\n');
  assert.equal(data.a, '007', 'leading zeros stay a string — 007 is an id, not a number');
  assert.equal(data.b, 1.5);
  assert.equal(data.c, 'NaN', 'NaN stays a string');
  assert.equal(data.d, 1000);
  assert.equal(data.e, 'yes', 'only true/false are booleans, not yes/no');
  assert.equal(data.f, '0x10', 'hex stays a string');
});
