// Two things that only tell the truth against a real system: whether a program
// can actually be found, and whether a commit is actually an ancestor.
//
// Both are here rather than in the pure-function tables because both were wrong
// in exactly the way a mock would have agreed with. `godot4` "exists" in every
// fixture; it was not on PATH on the machine that mattered. HEAD "moved"; what
// nobody asked was whether it had moved forward.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gitInfo } from '../hooks/il.mjs';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), '..', 'hooks', 'il.mjs');

// ─────────────────────────────────────────────────────────────────────────────
// § preflight — before the round, not after it
// ─────────────────────────────────────────────────────────────────────────────

function project({ policy, criteria } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'il-pre-'));
  const home = mkdtempSync(join(tmpdir(), 'il-home-'));
  const work = join(dir, '.interlocking', 'work', '001-x');
  mkdirSync(work, { recursive: true });
  writeFileSync(join(dir, '.interlocking', 'current'), '001-x\n');
  writeFileSync(join(work, 'SPEC.md'), '# SPEC\n');
  if (policy) writeFileSync(join(dir, '.interlocking', 'policy.json'), JSON.stringify(policy, null, 2));
  if (criteria) writeFileSync(join(work, 'CRITERIA.md'), criteria);
  return { dir, home, work };
}

const preflight = ({ dir, home }) =>
  spawnSync(process.execPath, [HOOK, 'preflight'], {
    input: '',
    encoding: 'utf8',
    timeout: 20000,
    env: { ...process.env, IL_HOME: home, CLAUDE_PROJECT_DIR: dir },
  });

const criteriaWith = (method) => `# CRITERIA

<!-- il:normative:begin -->

REQ-001
  Judged: the scene loads and reports 200 blocks.
  Method: ${method}

<!-- il:normative:end -->
`;

test('an empty verify.commands is reported before a round is spent on it', () => {
  // The real failure: a fresh verifier read ten requirements, ran nothing,
  // and returned ten INCONCLUSIVE. The answer was one line of policy.json.
  const env = project({ policy: { verify: { commands: [] } } });
  const r = preflight(env);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /EMPTY/);
  assert.match(r.stdout, /BLOCKED/, 'and what it costs under the current verdict taxonomy');
  assert.match(r.stdout, /policy\.json/, 'and where to fix it');
});

test('a program a criterion names but the machine does not have is reported, with the REQ', () => {
  // `godot4` was not on PATH; the executable lived in the repository. Ten more
  // INCONCLUSIVE, discovered after implementation was finished.
  const env = project({
    policy: { verify: { commands: ['godot4 --headless'] } },
    criteria: criteriaWith('godot4 --headless --script tests/req001.gd'),
  });
  const r = preflight(env);
  assert.match(r.stdout, /godot4/);
  assert.match(r.stdout, /not on PATH/i);
  assert.match(r.stdout, /REQ-001/, 'so you know which criterion is about to fail');
});

test('a repository-local executable resolves and is not reported', () => {
  const env = project({ policy: { verify: { commands: ['node --version'] } } });
  mkdirSync(join(env.dir, '.tools'), { recursive: true });
  writeFileSync(join(env.dir, '.tools', 'godot.exe'), 'not really a binary');
  writeFileSync(
    join(env.work, 'CRITERIA.md'),
    criteriaWith('./.tools/godot.exe --headless --script tests/req001.gd')
  );
  const r = preflight(env);
  assert.doesNotMatch(r.stdout, /godot/, 'a repo-relative path is exactly the fix being asked for');
  assert.match(r.stdout, /2 resolved|1 resolved/);
});

test('a preflight with nothing wrong says so without claiming the round will pass', () => {
  const env = project({ policy: { verify: { commands: ['node --version'] } } });
  const r = preflight(env);
  assert.doesNotMatch(r.stdout, /Problems:/);
  assert.match(r.stdout, /not that they pass/i, 'the limit of the claim is stated');
});

test('prose in a Method does not become a missing program', () => {
  const env = project({
    policy: { verify: { commands: ['node --version'] } },
    criteria: criteriaWith('the operator watches the screen and confirms the turn advances'),
  });
  const r = preflight(env);
  assert.doesNotMatch(r.stdout, /Problems:/, 'a criterion that needs a human is not a broken environment');
});

test('block_siege policy and criteria produce no prose or PowerShell false positives', () => {
  const fixture = JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'block-siege-preflight.json'), 'utf8')
  );
  const env = project({
    policy: { verify: { commands: fixture.policyCommands } },
    criteria: fixture.criteria,
  });
  mkdirSync(join(env.dir, '.tools', 'godot-4.7.2'), { recursive: true });
  writeFileSync(
    join(env.dir, '.tools', 'godot-4.7.2', 'Godot_v4.7.2-stable_win64_console.exe'),
    'fixture'
  );
  const r = preflight(env);
  assert.equal(r.status, 0, r.stderr);
  assert.doesNotMatch(r.stdout, /Problems:/);
  assert.doesNotMatch(r.stdout, /\b(?:First|Normally|env:IL_GH_PATH)\b/);
});

test('building a verify packet runs the preflight first', () => {
  const env = project({ policy: { verify: { commands: [] } } });
  writeFileSync(
    join(env.work, 'SPEC.md'),
    '# SPEC\n<!-- il:normative:begin -->\nREQ-001 A thing happens.\n<!-- il:normative:end -->\n'
  );
  const r = spawnSync(process.execPath, [HOOK, 'verify-packet'], {
    input: '',
    encoding: 'utf8',
    timeout: 20000,
    env: { ...process.env, IL_HOME: env.home, CLAUDE_PROJECT_DIR: env.dir },
  });
  assert.match(r.stdout, /preflight found problems/i);
  assert.match(r.stdout, /verify-packet\.md/, 'and it still builds the packet — this is advice, not a gate');
});

test('preflight on a project with no feature says so rather than failing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'il-pre-'));
  const home = mkdtempSync(join(tmpdir(), 'il-home-'));
  mkdirSync(join(dir, '.interlocking'), { recursive: true });
  const r = preflight({ dir, home });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /no active feature/i);
});

// ─────────────────────────────────────────────────────────────────────────────
// § anchor — did HEAD move forward, or somewhere else?
// ─────────────────────────────────────────────────────────────────────────────

function repo() {
  const dir = mkdtempSync(join(tmpdir(), 'il-git-'));
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: dir,
      encoding: 'utf8',
      timeout: 10000,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore'],
      env: { ...process.env, GIT_CONFIG_GLOBAL: '', GIT_CONFIG_SYSTEM: '' },
    }).trim();
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 't@example.com');
  git('config', 'user.name', 'test');
  git('config', 'commit.gpgsign', 'false');
  const commit = (name) => {
    writeFileSync(join(dir, name), name);
    git('add', '-A');
    git('commit', '-q', '-m', name);
    return git('rev-parse', '--short', 'HEAD');
  };
  return { dir, git, commit };
}

test('a finished task reads as an advance, with a count', () => {
  const r = repo();
  const first = r.commit('a.txt');
  r.commit('b.txt');
  r.commit('c.txt');
  const info = gitInfo(r.dir, first);
  assert.equal(info.anchor, 'advanced');
  assert.equal(info.ahead, 2);
});

test('the anchor equalling HEAD reads as same, not as a move', () => {
  const r = repo();
  const head = r.commit('a.txt');
  assert.equal(gitInfo(r.dir, head).anchor, 'same');
});

test('a rewind does not read as an advance', () => {
  const r = repo();
  r.commit('a.txt');
  const lost = r.commit('b.txt');
  r.git('reset', '-q', '--hard', 'HEAD~1');
  const info = gitInfo(r.dir, lost);
  assert.notEqual(info.anchor, 'advanced', 'the anchor is no longer reachable from HEAD');
});

test('a commit from another branch does not read as an advance', () => {
  const r = repo();
  r.commit('a.txt');
  r.git('checkout', '-q', '-b', 'side');
  const sideCommit = r.commit('side.txt');
  r.git('checkout', '-q', 'main');
  r.commit('main.txt');
  assert.equal(gitInfo(r.dir, sideCommit).anchor, 'diverged');
});

test('an anchor that is not a commit here is unknown, never advanced', () => {
  const r = repo();
  r.commit('a.txt');
  assert.equal(gitInfo(r.dir, 'deadbee').anchor, 'unknown');
  assert.equal(gitInfo(r.dir, 'not-a-sha').anchor, null, 'and a malformed one is not probed at all');
});

test('gitInfo outside a repo returns the same shape', () => {
  const dir = mkdtempSync(join(tmpdir(), 'il-nogit-'));
  const info = gitInfo(dir, 'a1b2c3d');
  assert.equal(info.isRepo, false);
  assert.deepEqual(info.dirty, []);
  assert.equal(info.anchor, null);
});
