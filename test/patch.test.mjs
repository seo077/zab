// The answer table for the apply_patch envelope parser.
//
// Codex has no Edit/Write tool. Every file it writes arrives as one `apply_patch`
// call whose entire input is a patch envelope in `tool_input.command`, so this
// parser is the whole of the G0 gate on that host. Both failure directions are
// fatal in the same way classify() is: miss a target and the gate is theatre,
// invent one and the harness blocks work it was never meant to touch.
//
// The rule that does most of the work: a file header must begin the line. Body
// lines in this format always carry a `+`, `-` or space prefix, so a line reading
// `+*** Add File: x` is content, not a header, and must not be collected.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseApplyPatch } from '../hooks/il.mjs';

/** @param {string[]} lines */
const patch = (...lines) => ['*** Begin Patch', ...lines, '*** End Patch'].join('\n');

const CASES = [
  // ── the three file verbs ────────────────────────────────────────────────
  {
    name: 'add file',
    input: patch('*** Add File: src/a.ts', '+export const a = 1;'),
    writes: ['src/a.ts'],
  },
  {
    name: 'update file',
    input: patch('*** Update File: src/b.ts', '@@', '-old', '+new'),
    writes: ['src/b.ts'],
  },
  {
    name: 'delete file',
    input: patch('*** Delete File: src/c.ts'),
    writes: ['src/c.ts'],
  },

  // ── a rename touches both ends ──────────────────────────────────────────
  {
    name: 'move names source and destination',
    input: patch('*** Update File: src/old.ts', '*** Move to: src/new.ts', '@@', ' ctx'),
    writes: ['src/old.ts', 'src/new.ts'],
  },

  // ── several files in one envelope ───────────────────────────────────────
  {
    name: 'multiple hunks',
    input: patch(
      '*** Add File: README.md',
      '+hi',
      '*** Update File: src/d.ts',
      '@@',
      '+x',
      '*** Delete File: src/e.ts'
    ),
    writes: ['README.md', 'src/d.ts', 'src/e.ts'],
  },

  // ── the spoofing case this parser exists to survive ─────────────────────
  {
    name: 'a header-shaped line inside the body is content, not a header',
    input: patch('*** Add File: safe.txt', '+*** Add File: evil.ts', '+*** Delete File: gone.ts'),
    writes: ['safe.txt'],
  },
  {
    name: 'a removed line that looks like a header is content too',
    input: patch('*** Update File: doc.txt', '@@', '-*** Add File: evil.ts', '+ok'),
    writes: ['doc.txt'],
  },
  {
    name: 'a context line that looks like a header is content too',
    input: patch('*** Update File: doc.txt', '@@', ' *** Delete File: evil.ts', '+ok'),
    writes: ['doc.txt'],
  },

  // ── shapes the tool actually produces ───────────────────────────────────
  {
    name: 'CRLF line endings',
    input: patch('*** Add File: win.ts', '+x').replace(/\n/g, '\r\n'),
    writes: ['win.ts'],
  },
  {
    name: 'paths containing spaces',
    input: patch('*** Add File: my docs/a note.md', '+x'),
    writes: ['my docs/a note.md'],
  },
  {
    name: 'trailing whitespace on the header is trimmed',
    input: patch('*** Add File: src/f.ts   ', '+x'),
    writes: ['src/f.ts'],
  },
  {
    name: 'backslash paths survive as written',
    input: patch('*** Update File: src\\g.ts', '@@', '+x'),
    writes: ['src\\g.ts'],
  },
  {
    name: 'absolute paths pass through',
    input: patch('*** Add File: /tmp/h.ts', '+x'),
    writes: ['/tmp/h.ts'],
  },
  {
    name: 'no End Patch marker (truncated envelope) still yields its targets',
    input: '*** Begin Patch\n*** Add File: src/i.ts\n+x',
    writes: ['src/i.ts'],
  },
  {
    name: 'leading blank lines before the envelope',
    input: '\n\n' + patch('*** Add File: src/j.ts', '+x'),
    writes: ['src/j.ts'],
  },

  // ── not a patch at all ──────────────────────────────────────────────────
  { name: 'empty string', input: '', writes: [] },
  { name: 'not a string', input: null, writes: [] },
  { name: 'ordinary prose', input: 'please add a file', writes: [] },
  {
    name: 'the words appear but there is no envelope',
    input: 'the header is *** Add File: x.ts in that format',
    writes: [],
  },
];

for (const c of CASES) {
  test(`parseApplyPatch: ${c.name}`, () => {
    const got = parseApplyPatch(c.input);
    assert.deepEqual(got.writes, c.writes);
    assert.equal(got.denyTag, null, 'must not deny');
  });
}

// ── the envelope is there but nothing in it parses ────────────────────────
//
// Silence here would mean allow, and allowing an envelope we could not read is
// exactly the gate-theatre failure. It denies instead, with the same tag the bash
// analyzer uses for `patch` and `git apply`.

test('an unreadable envelope denies rather than allowing', () => {
  const got = parseApplyPatch('*** Begin Patch\n*** Frobnicate File: x.ts\n*** End Patch');
  assert.deepEqual(got.writes, []);
  assert.equal(got.denyTag, 'patch');
});

test('an empty envelope denies', () => {
  const got = parseApplyPatch('*** Begin Patch\n*** End Patch');
  assert.equal(got.denyTag, 'patch');
});

// ── the parser must not be the thing that breaks the session ──────────────

test('pathological input terminates and never throws', () => {
  const huge = '*** Begin Patch\n' + '+x\n'.repeat(200000) + '*** Add File: a.ts\n';
  const got = parseApplyPatch(huge);
  assert.deepEqual(got.writes, ['a.ts']);
});

test('every non-string input is handled', () => {
  for (const v of [undefined, null, 0, 42, true, {}, [], Symbol.iterator]) {
    const got = parseApplyPatch(v);
    assert.deepEqual(got.writes, []);
    assert.equal(got.denyTag, null);
  }
});
