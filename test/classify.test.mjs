// The answer table for classify() — written BEFORE the implementation.
//
// classify() decides whether a path is subject to the G0 gate. It has two ways to be
// fatally wrong and no harmless middle:
//   - blocks too much  -> the user uninstalls the plugin
//   - blocks too little -> the gate is theater
// So the answers are pinned first.
//
// `platform` is a parameter, not `process.platform`, so Windows semantics are tested
// on every CI runner rather than only on Windows.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, DEFAULT_POLICY } from '../hooks/il.mjs';

const POSIX = { projectDir: '/home/u/proj', policy: DEFAULT_POLICY, platform: 'linux' };
const WIN = { projectDir: 'C:/Workspace/proj', policy: DEFAULT_POLICY, platform: 'win32' };

/** @type {Array<[string, object, string, string]>} [path, ctx, expected, why] */
const CASES = [
  // ─── 1. outside the project is not ours to police ────────────────────────────
  ['/etc/passwd', POSIX, 'foreign', 'absolute path outside the project'],
  ['/home/u/other/x.ts', POSIX, 'foreign', 'sibling project'],
  ['/home/u/proj/../evil.ts', POSIX, 'foreign', 'traversal that escapes the project'],
  ['/home/u/proj/src/../../evil.ts', POSIX, 'foreign', 'deep traversal that escapes'],
  ['/home/u/projX/src/a.ts', POSIX, 'foreign', 'prefix collision must not count as inside'],
  ['D:/other/src/a.ts', WIN, 'foreign', 'different drive'],

  // ─── 2. the harness must always be able to write its own artifacts ───────────
  ['/home/u/proj/.interlocking/work/001-x/SPEC.md', POSIX, 'harness', 'spec under .interlocking'],
  ['/home/u/proj/.interlocking/policy.json', POSIX, 'harness', 'policy file'],
  ['/home/u/proj/.interlocking', POSIX, 'harness', 'the directory itself'],
  ['C:\\Workspace\\proj\\.interlocking\\work\\001\\STATE.md', WIN, 'harness', 'windows separators'],
  // ...but only at the project root. A nested one would be a trivial bypass.
  ['/home/u/proj/src/.interlocking/evil.ts', POSIX, 'code', 'nested .interlocking is NOT harness'],
  ['/home/u/proj/.interlockingfoo/evil.ts', POSIX, 'code', 'segment must match exactly'],

  // ─── 3. Windows path normalization — the most likely silent-failure bug ──────
  // tool_input.file_path arrives with BACKslashes; CLAUDE_PROJECT_DIR uses forward
  // slashes. Comparing them raw classifies every Windows path as `foreign`, which
  // means the gate blocks nothing at all.
  ['C:\\Workspace\\proj\\src\\auth.ts', WIN, 'code', 'backslash path vs slash projectDir'],
  ['C:\\Workspace\\proj/src\\auth.ts', WIN, 'code', 'mixed separators'],
  ['c:\\workspace\\proj\\src\\auth.ts', WIN, 'code', 'windows is case-insensitive'],
  ['C:/Workspace/proj/src/auth.ts', WIN, 'code', 'already-normalized windows path'],
  ['C:\\Workspace\\proj\\README.md', WIN, 'free', 'windows path, allowed file'],
  // POSIX is case-SENSITIVE: these must not be treated as the same file.
  ['/home/u/PROJ/src/a.ts', POSIX, 'foreign', 'posix case sensitivity is preserved'],

  // ─── 4. traversal that stays inside must resolve, not string-match ───────────
  ['/home/u/proj/src/../src/auth.ts', POSIX, 'code', 'traversal resolving back inside'],
  ['/home/u/proj/./src/auth.ts', POSIX, 'code', 'single-dot segment'],
  ['/home/u/proj/src//auth.ts', POSIX, 'code', 'duplicate separators'],
  ['/home/u/proj/docs/../src/auth.ts', POSIX, 'code', 'traversal from a free dir into a code dir'],
  ['/home/u/proj/src/../README.md', POSIX, 'free', 'traversal from a code dir into a free file'],

  // ─── 5. source files are gated ───────────────────────────────────────────────
  ['/home/u/proj/src/auth.ts', POSIX, 'code', 'typescript'],
  ['/home/u/proj/main.py', POSIX, 'code', 'python at root'],
  ['/home/u/proj/lib/x.rs', POSIX, 'code', 'rust'],
  ['/home/u/proj/cmd/main.go', POSIX, 'code', 'go'],
  ['/home/u/proj/A.java', POSIX, 'code', 'java'],
  ['/home/u/proj/Main.PY', POSIX, 'code', 'extension match is case-insensitive'],
  ['/home/u/proj/notebook.ipynb', POSIX, 'code', 'notebook'],
  ['/home/u/proj/scripts/deploy.sh', POSIX, 'code', 'shell script'],

  // ─── 6. manifests ARE gated: adding a dependency is an architectural decision ─
  ['/home/u/proj/package.json', POSIX, 'code', 'npm manifest'],
  ['/home/u/proj/pyproject.toml', POSIX, 'code', 'python manifest'],
  ['/home/u/proj/Cargo.toml', POSIX, 'code', 'rust manifest'],
  ['/home/u/proj/go.mod', POSIX, 'code', 'go manifest'],
  ['/home/u/proj/requirements-dev.txt', POSIX, 'code', 'requirements beats the .txt allowance'],
  ['/home/u/proj/Dockerfile', POSIX, 'code', 'no extension at all'],
  ['/home/u/proj/infra/main.tf', POSIX, 'code', 'terraform'],
  ['/home/u/proj/.github/workflows/ci.yml', POSIX, 'code', 'CI config is executable policy'],

  // ─── 7. tests are NOT gated ─────────────────────────────────────────────────
  // Writing a failing test to discover a requirement is legitimate pre-spec work.
  // Blocking it is the fastest way to make the harness feel hostile.
  ['/home/u/proj/tests/test_auth.py', POSIX, 'free', 'pytest convention'],
  ['/home/u/proj/test/classify.test.mjs', POSIX, 'free', 'js convention'],
  ['/home/u/proj/src/auth.test.ts', POSIX, 'free', 'colocated test'],
  ['/home/u/proj/src/auth.spec.ts', POSIX, 'free', 'spec suffix'],
  ['/home/u/proj/src/__tests__/auth.ts', POSIX, 'free', '__tests__ directory'],
  ['/home/u/proj/spec/models_spec.rb', POSIX, 'free', 'rspec convention'],
  ['/home/u/proj/src/contest.py', POSIX, 'code', 'substring "test" must NOT match'],
  ['/home/u/proj/src/latest.ts', POSIX, 'code', 'substring "test" must NOT match'],

  // ─── 8. docs and prose are never gated — planning must stay unblocked ────────
  ['/home/u/proj/README.md', POSIX, 'free', 'readme'],
  ['/home/u/proj/docs/guide.md', POSIX, 'free', 'docs tree'],
  ['/home/u/proj/CHANGELOG.md', POSIX, 'free', 'changelog'],
  ['/home/u/proj/LICENSE', POSIX, 'free', 'license, no extension'],
  ['/home/u/proj/notes.txt', POSIX, 'free', 'plain text'],
  ['/home/u/proj/.gitignore', POSIX, 'free', 'dotfile'],
  ['/home/u/proj/.vscode/settings.json', POSIX, 'free', 'editor config, not a manifest'],
  ['/home/u/proj/data/fixture.csv', POSIX, 'free', 'unknown extension defaults to free'],

  // ─── 9. per-project policy overrides ────────────────────────────────────────
  [
    '/home/u/proj/scratch/spike.ts',
    { ...POSIX, policy: { ...DEFAULT_POLICY, always_allow: [...DEFAULT_POLICY.always_allow, 'scratch/**'] } },
    'free',
    'always_allow exempts a code file',
  ],
  [
    '/home/u/proj/src/auth.test.ts',
    { ...POSIX, policy: { ...DEFAULT_POLICY, code: ['src/**'] } },
    'free',
    'always_allow (test heuristic) is checked before policy.code',
  ],
  [
    '/home/u/proj/config/app.yaml',
    { ...POSIX, policy: { ...DEFAULT_POLICY, code: ['config/**'] } },
    'code',
    'policy.code gates a file the builtins would leave free',
  ],
  [
    '/home/u/proj/README.md',
    { ...POSIX, policy: { ...DEFAULT_POLICY, code: ['**/*.md'] } },
    'free',
    'always_allow still wins over policy.code — planning is never blocked',
  ],
];

for (const [p, ctx, expected, why] of CASES) {
  test(`classify: ${p} -> ${expected} (${why})`, () => {
    assert.equal(classify(p, ctx), expected);
  });
}

// ─── malformed input must never throw. A crashing classifier bricks the session ──
test('classify: malformed input fails open as free, never throws', () => {
  for (const bad of [undefined, null, '', 42, {}, [], '\0', 'relative/path.ts']) {
    assert.doesNotThrow(() => classify(bad, POSIX));
  }
  assert.equal(classify('', POSIX), 'free');
  assert.equal(classify(null, POSIX), 'free');
});

test('classify: missing or broken policy falls back to defaults', () => {
  const noPolicy = { projectDir: '/home/u/proj', platform: 'linux' };
  assert.equal(classify('/home/u/proj/src/a.ts', noPolicy), 'code');
  assert.equal(classify('/home/u/proj/.interlocking/x.md', noPolicy), 'harness');

  const junk = { projectDir: '/home/u/proj', platform: 'linux', policy: { code: 'not-an-array', always_allow: 7 } };
  assert.equal(classify('/home/u/proj/src/a.ts', junk), 'code');
  assert.equal(classify('/home/u/proj/README.md', junk), 'free');
});
