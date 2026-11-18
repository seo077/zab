// Answer tables for the four things a real four-day run broke on.
//
// Each block here corresponds to a specific, dated failure, and the comment says
// which — because without that these read as arbitrary preferences, and the next
// person to "simplify" one of them will do it in the direction that caused the
// failure in the first place.
//
//   § delta        a two-line verification amendment re-derived all 17 criteria
//                  and re-reviewed all 17 requirements, four times over
//   § artifacts    generated evidence made every session open with ACTION REQUIRED
//   § preflight    two whole verification rounds returned nothing but INCONCLUSIVE
//                  for reasons that were never about the code
//   § identity     a Codex verifier that had reached a verdict could not record it

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  requirementDigest,
  sharedNormativeDigest,
  criteriaDigest,
  computeDelta,
  summarizeIds,
  partitionDirty,
  mirrorAdvice,
  canonicalAgent,
  leadingExecutable,
  verifyExecutables,
  artifactCandidateGlob,
  observeArtifactCandidates,
  BRIEF_WIDTH,
} from '../hooks/il.mjs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const spec = (reqs) => `# SPEC — 001-x

## Background
Prose that is not normative and must never affect a digest.

<!-- il:normative:begin -->
## Requirements
${reqs}

## Threat model
Asset: nothing. Threat: none. Mitigation: none.
<!-- il:normative:end -->
`;

const BASE_REQS = `REQ-001 The user can log in with email and password.

REQ-002 A session expires after 30 minutes of inactivity.

REQ-003 The deployed bundle is byte-identical to the built one.`;

const criteria = (entries) => `# CRITERIA — 001-x

<!-- il:normative:begin -->
${entries}
<!-- il:normative:end -->
`;

const BASE_CRITERIA = `
REQ-001
  Judged: POST /login with valid credentials returns 200.
  Method: npm test -- login

REQ-002
  Judged: a request 31 minutes later returns 401.
  Method: npm test -- expiry

REQ-003
  Judged: sha256 of every deployed file equals the manifest.
  Method: node tools/manifest.mjs --check
`;

const baselineOf = (s, c) => ({
  spec_hash: 'aaaaaaaa',
  granted_at: '2026-08-25T10:00:00.000Z',
  req_digest: requirementDigest(s),
  shared_digest: sharedNormativeDigest(s),
  criteria_digest: criteriaDigest(c),
});

test('threat-only normative amendments require a full review', () => {
  const before = spec(BASE_REQS);
  const after = before.replace('Threat: none.', 'Threat: forged deployment evidence.');
  const d = computeDelta(baselineOf(before, criteria(BASE_CRITERIA)), after, criteria(BASE_CRITERIA));

  assert.equal(d.available, false);
  assert.equal(d.globalChanged, true);
  assert.deepEqual(requirementDigest(before), requirementDigest(after), 'no REQ text moved');
});

// ─────────────────────────────────────────────────────────────────────────────
// § delta — per-requirement digests
// ─────────────────────────────────────────────────────────────────────────────

test('a requirement digests the same wherever it sits in the document', () => {
  const a = requirementDigest(spec(BASE_REQS));
  const reordered = requirementDigest(
    spec(`REQ-003 The deployed bundle is byte-identical to the built one.

REQ-001 The user can log in with email and password.

REQ-002 A session expires after 30 minutes of inactivity.`)
  );
  assert.deepEqual(a, reordered, 'moving a requirement is not changing it');
});

test('background prose is outside the normative region and cannot move a digest', () => {
  const a = requirementDigest(spec(BASE_REQS));
  const b = requirementDigest(
    spec(BASE_REQS).replace('Prose that is not normative', 'Completely different prose')
  );
  assert.deepEqual(a, b);
});

test('changing one requirement moves exactly one digest', () => {
  const a = requirementDigest(spec(BASE_REQS));
  const b = requirementDigest(spec(BASE_REQS.replace('30 minutes', '15 minutes')));
  assert.equal(a['REQ-001'], b['REQ-001']);
  assert.notEqual(a['REQ-002'], b['REQ-002']);
  assert.equal(a['REQ-003'], b['REQ-003']);
});

test('a criterion digests independently of the requirement it judges', () => {
  const a = criteriaDigest(criteria(BASE_CRITERIA));
  const b = criteriaDigest(criteria(BASE_CRITERIA.replace('npm test -- expiry', './node_modules/.bin/jest expiry')));
  assert.equal(a['REQ-001'], b['REQ-001']);
  assert.notEqual(a['REQ-002'], b['REQ-002']);
});

// ─────────────────────────────────────────────────────────────────────────────
// § delta — the scope it produces
// ─────────────────────────────────────────────────────────────────────────────

test('the exact case that motivated this: one requirement amended, the rest carried', () => {
  // REQ-014/017 on the real run changed only how they are verified. Everything
  // else was identical, and every one of them was re-derived anyway.
  const before = spec(BASE_REQS);
  const after = spec(BASE_REQS.replace('byte-identical to the built one.', 'byte-identical to the built one, proven offline against an attestation.'));
  const d = computeDelta(baselineOf(before, criteria(BASE_CRITERIA)), after, criteria(BASE_CRITERIA));

  assert.equal(d.available, true);
  assert.deepEqual(d.changed, ['REQ-003']);
  assert.deepEqual(d.added, []);
  assert.deepEqual(d.removed, []);
  assert.deepEqual(d.needCriteria, ['REQ-003'], 'only the moved requirement needs a fresh criterion');
  assert.deepEqual(d.carried, ['REQ-001', 'REQ-002'], 'the others are byte-identical to what was approved');
});

test('a criterion that moved re-opens its requirement even when the requirement did not', () => {
  // The yardstick is half of what the human approved. Shortening a criterion
  // under an unchanged requirement is the single cheapest way to turn FAIL into
  // PASS, so it must never fall into the carried set.
  const s = spec(BASE_REQS);
  const before = criteria(BASE_CRITERIA);
  const after = criteria(BASE_CRITERIA.replace('returns 401', 'does something reasonable'));
  const d = computeDelta(baselineOf(s, before), s, after);

  assert.deepEqual(d.changed, [], 'no requirement moved');
  assert.deepEqual(d.criteriaChanged, ['REQ-002']);
  assert.ok(d.needReview.includes('REQ-002'), 'but it still has to be reviewed');
  assert.ok(!d.carried.includes('REQ-002'), 'and it is not carried');
});

test('an added requirement is in scope; a removed one is reported, not silently dropped', () => {
  const before = spec(BASE_REQS);
  const after = spec(
    BASE_REQS.replace('REQ-002 A session expires after 30 minutes of inactivity.\n\n', '') +
      '\n\nREQ-004 Korean strings render with the bundled font.'
  );
  const d = computeDelta(baselineOf(before, criteria(BASE_CRITERIA)), after, criteria(BASE_CRITERIA));
  assert.deepEqual(d.added, ['REQ-004']);
  assert.deepEqual(d.removed, ['REQ-002']);
  assert.ok(d.needCriteria.includes('REQ-004'));
  assert.ok(d.needReview.includes('REQ-002'), 'deleting a requirement is still a review change');
});

test('a deletion-only amendment cannot look like nothing moved', () => {
  const before = spec(BASE_REQS);
  const after = spec(BASE_REQS.replace('\n\nREQ-003 The deployed bundle is byte-identical to the built one.', ''));
  const d = computeDelta(baselineOf(before, criteria(BASE_CRITERIA)), after, criteria(BASE_CRITERIA));

  assert.deepEqual(d.removed, ['REQ-003']);
  assert.ok(d.needReview.includes('REQ-003'));
  assert.notEqual(d.needReview.length, 0);
});

test('nothing moved means nothing is in scope', () => {
  const s = spec(BASE_REQS);
  const c = criteria(BASE_CRITERIA);
  const d = computeDelta(baselineOf(s, c), s, c);
  assert.equal(d.available, true);
  assert.deepEqual(d.needReview, []);
  assert.equal(d.carried.length, 3);
});

test('no baseline means no scoping — the whole document is in play', () => {
  // The refusals matter more than the successes. A scope the signed store cannot
  // substantiate is a reuse CLAIM, and a reuse claim from the session that wants
  // the work to be smaller is worth nothing.
  for (const bad of [null, undefined, {}, { req_digest: null }, { req_digest: {} }, 42, 'nope']) {
    const d = computeDelta(bad, spec(BASE_REQS), criteria(BASE_CRITERIA));
    assert.equal(d.available, false, JSON.stringify(bad));
    assert.deepEqual(d.needCriteria, []);
    assert.deepEqual(d.carried, []);
  }
});

test('an unparseable current spec cannot produce a carried set', () => {
  const d = computeDelta(baselineOf(spec(BASE_REQS), criteria(BASE_CRITERIA)), 'no requirements here', '');
  assert.equal(d.available, false);
});

test('computeDelta never throws', () => {
  for (const a of [null, undefined, 42, {}, [], 'x']) {
    for (const b of [null, undefined, 42, {}, 'x']) {
      assert.doesNotThrow(() => computeDelta(a, b, b));
    }
  }
});

test('summarizeIds stays short without hiding how many there were', () => {
  assert.equal(summarizeIds(['REQ-001', 'REQ-002']), 'REQ-001, REQ-002');
  const many = Array.from({ length: 17 }, (_, i) => `REQ-${String(i + 1).padStart(3, '0')}`);
  const s = summarizeIds(many);
  assert.ok(s.length < BRIEF_WIDTH, s, 'it has to fit one line of the brief');
  assert.match(s, /17 total/);
  assert.match(s, /REQ-017/, 'the last one is still named');
  assert.equal(summarizeIds(null), '');
});

// ─────────────────────────────────────────────────────────────────────────────
// § artifacts — generated output is not a resume hazard
// ─────────────────────────────────────────────────────────────────────────────

test('.interlocking is managed without anyone declaring it', () => {
  const { managed, source } = partitionDirty(
    ['.interlocking/current', '.interlocking/work/001-x/SPEC.md', 'src/app.ts'],
    []
  );
  assert.deepEqual(managed, ['.interlocking/current', '.interlocking/work/001-x/SPEC.md']);
  assert.deepEqual(source, ['src/app.ts']);
});

test('declared artifact globs move generated evidence out of the question', () => {
  // The real dirty tree: browser screenshots, evidence JSON and a web export,
  // every one of them produced by the verification that just ran.
  const dirty = [
    'build/web/index.wasm',
    'build/evidence/req-014.json',
    'build/evidence/shot-3.png',
    'scripts/combat.gd',
  ];
  const { managed, source } = partitionDirty(dirty, ['build/**']);
  assert.equal(managed.length, 3);
  assert.deepEqual(source, ['scripts/combat.gd'], 'the one real change is the one that gets asked about');
});

test('an undeclared file is a source change — the harness never guesses what is disposable', () => {
  const { managed, source } = partitionDirty(['tmp/scratch.png'], ['build/**']);
  assert.deepEqual(managed, []);
  assert.deepEqual(source, ['tmp/scratch.png']);
});

test('windows separators partition the same way', () => {
  const { managed } = partitionDirty(['.interlocking\\work\\001-x\\SPEC.md'], []);
  assert.equal(managed.length, 1);
});

test('partitionDirty never throws', () => {
  for (const a of [null, undefined, 42, 'x', [null, 42, '']]) {
    for (const b of [null, undefined, 42, [null, 3]]) {
      assert.doesNotThrow(() => partitionDirty(a, b));
    }
  }
});

test('repeated artifact candidates are advice only after two distinct sessions', () => {
  const home = mkdtempSync(join(tmpdir(), 'il-artifacts-'));
  const paths = ['build/web-evidence/deployed/result.json'];
  assert.deepEqual(observeArtifactCandidates(home, 'project', 'session-1', paths), []);
  const repeated = observeArtifactCandidates(home, 'project', 'session-2', paths);
  assert.equal(repeated[0].glob, 'build/web-evidence/deployed/**');
  assert.equal(repeated[0].sessions, 2);
  assert.equal(artifactCandidateGlob(paths[0]), repeated[0].glob);
  assert.deepEqual(partitionDirty(paths, []).source, paths, 'the candidate remains protected as source');
});

// ─────────────────────────────────────────────────────────────────────────────
// § mirror — a stale STATE.md says which of three things happened
// ─────────────────────────────────────────────────────────────────────────────

test('the mirror warning routes on which document actually moved', () => {
  assert.match(mirrorAdvice('SPEC.md changed since G0 was approved for 001-x'), /amended the spec/i);
  assert.match(mirrorAdvice('SPEC.md changed since G0 was approved for 001-x'), /delta/, 'and points at the cheap path');
  assert.match(mirrorAdvice('CRITERIA.md changed since G0 was approved for 001-x'), /yardstick/i);
  assert.match(mirrorAdvice('approval record for 001-x failed signature check'), /tampering/i);
  assert.match(mirrorAdvice('G0 not approved for 001-x'), /without an approval/i);
});

test('mirrorAdvice always returns something usable', () => {
  for (const bad of [null, undefined, 42, {}, '']) {
    assert.equal(typeof mirrorAdvice(bad), 'string');
    assert.ok(mirrorAdvice(bad).length > 0);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// § identity — the same role under whatever name the host sends
// ─────────────────────────────────────────────────────────────────────────────

test('a Codex task name resolves to the registry name', () => {
  // Codex canonical task names cannot carry the hyphen. Unrecognised meant NO
  // restriction, so `verifier` could write source that `il-verifier` could not.
  for (const alias of ['il-verifier', 'verifier', 'il_verifier', 'il verifier', 'IL-Verifier']) {
    assert.equal(canonicalAgent(alias), 'il-verifier', alias);
  }
  assert.equal(canonicalAgent('spec-critic'), 'il-spec-critic');
  assert.equal(canonicalAgent('criteria'), 'il-criteria');
});

test('an unrelated agent name is passed through unchanged', () => {
  assert.equal(canonicalAgent('general-purpose'), 'general-purpose');
  assert.equal(canonicalAgent('Explore'), 'Explore');
  assert.equal(canonicalAgent(''), '');
  assert.equal(canonicalAgent(null), '');
});

// ─────────────────────────────────────────────────────────────────────────────
// § preflight — can the round run at all?
// ─────────────────────────────────────────────────────────────────────────────

test('the program a command line would launch', () => {
  const table = [
    ['npm test', 'npm'],
    ['  `godot4 --headless --script t.gd`  ', 'godot4'],
    ['./scripts/check.sh --all', './scripts/check.sh'],
    ['node tools/manifest.mjs --check', 'node'],
    ['CI=1 sudo node x.mjs', 'node'],
    ["$env:IL_GH_PATH='C:\\Program Files\\GitHub CLI\\gh.exe'; node verify.mjs", 'node'],
    ['', ''],
    ['# not a command', ''],
    ['| piped continuation', ''],
  ];
  for (const [line, want] of table) {
    assert.equal(leadingExecutable(line), want, JSON.stringify(line));
  }
});

test('prose in a Method is not mistaken for a program', () => {
  // Criteria Methods are model-written and mix shell with English. A preflight
  // that reports every sentence's first word as a missing program buries the one
  // finding that mattered, and people learn to skip it.
  for (const prose of [
    'the operator watches the screen and confirms the turn advances',
    'Run the suite twice.',
    'observe that no missing-glyph telemetry is emitted',
    'manually inspect the exported PNG',
  ]) {
    assert.equal(leadingExecutable(prose), '', prose);
  }
});

test('inline-code values and evidence paths are not treated as commands', () => {
  const found = verifyExecutables([], criteria(`
REQ-001
  Judged: evidence is complete.
  Method: Inspect \`player-1-catapult-240px-zero-lateral\` and \`build/web-evidence/local\`, then run \`node verify.mjs --all\`.
`));
  assert.deepEqual(found.map((item) => item.exe), ['node']);
});

test('leadingExecutable never throws', () => {
  for (const bad of [null, undefined, 42, {}, []]) {
    assert.doesNotThrow(() => leadingExecutable(bad));
    assert.equal(typeof leadingExecutable(bad), 'string');
  }
});

test('the executables a round needs come from the policy AND from the criteria', () => {
  // Both of the wasted rounds are in here: an empty policy, and a criterion that
  // names a program the policy never mentions.
  const found = verifyExecutables(
    ['npm test'],
    criteria(`
REQ-001
  Judged: the scene loads.
  Method: godot4 --headless --script tests/req001.gd

REQ-002
  Judged: the bundle matches.
  Method: node tools/manifest.mjs --check
`)
  );
  const names = found.map((f) => f.exe);
  assert.ok(names.includes('npm'));
  assert.ok(names.includes('godot4'), 'a criterion can need a program the policy never declared');
  assert.ok(names.includes('node'));
  const godot = found.find((f) => f.exe === 'godot4');
  assert.equal(godot.where, 'REQ-001', 'the report has to say which criterion will fail');
});

test('the same program named twice is reported once per source, not once per line', () => {
  const found = verifyExecutables(['npm test', 'npm test'], '');
  assert.equal(found.filter((f) => f.exe === 'npm').length, 1);
});

test('verifyExecutables never throws', () => {
  for (const a of [null, undefined, 42, 'x', [null, 42]]) {
    for (const b of [null, undefined, 42, {}]) {
      assert.doesNotThrow(() => verifyExecutables(a, b));
      assert.ok(Array.isArray(verifyExecutables(a, b)));
    }
  }
});
