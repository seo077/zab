import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setup, where, banner, taskBoard, lastRecord, inside, allowRead, PIPELINE, TEMPLATE, PLUGIN } from '../scripts/zab.mjs';

const SCRIPT = fileURLToPath(new URL('../scripts/zab.mjs', import.meta.url));
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'zab-'));
const read = (dir, r) => fs.readFileSync(path.join(dir, r), 'utf8');

test('setup creates the project skeleton', () => {
  const dir = tmp();
  const { created, kept } = setup(dir, new Date('2026-01-02T03:04:05Z'));
  assert.deepEqual(kept, []);
  for (const r of [
    'CLAUDE.md', '프로젝트지도.md', 'input/.gitkeep', 'output/.gitkeep',
    'log/manifest.json', 'log/실행로그.md', 'log/AI 논의사항.md',
    'pipeline/z/pipelines/.gitkeep', 'pipeline/a/갈래별/.gitkeep',
    'pipeline/b/갈래별/.gitkeep', 'pipeline/개선이력/.gitkeep',
  ]) assert.ok(created.includes(r), r);
  const m = JSON.parse(read(dir, 'log/manifest.json'));
  assert.equal(m._meta.project, path.basename(dir));
  assert.equal(m._meta.pipeline_repo, 'plugin:zab');
  assert.equal(m._meta.updated_at, '2026-01-02T03:04:05.000Z');
  assert.deepEqual(m.tasks, {});
});

test('setup does not copy the example Task room', () => {
  const dir = tmp();
  setup(dir);
  assert.ok(!fs.existsSync(path.join(dir, 'log', 'T1_예시작업')));
  assert.ok(fs.existsSync(path.join(TEMPLATE, 'log', 'T1_예시작업', '검증기준.md')));
});

test('setup never overwrites', () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), 'mine');
  fs.mkdirSync(path.join(dir, 'log'));
  fs.writeFileSync(path.join(dir, 'log', 'manifest.json'), '{"keep":true}');
  const { created, kept } = setup(dir);
  assert.equal(read(dir, 'CLAUDE.md'), 'mine');
  assert.equal(read(dir, 'log/manifest.json'), '{"keep":true}');
  assert.ok(kept.includes('CLAUDE.md') && kept.includes('log/manifest.json'));
  assert.ok(!created.includes('CLAUDE.md'));
  assert.deepEqual(setup(dir).created, []);
});

test('where lists plugin and project-local definitions', () => {
  const dir = tmp();
  setup(dir);
  fs.writeFileSync(path.join(dir, 'pipeline/z/pipelines/내것.md'), '| 항목 | 내용 |\n|---|---|\n| 목적 | 내 작업 |\n');
  fs.mkdirSync(path.join(dir, 'pipeline/a/갈래별/내것'));
  const out = where(dir);
  assert.match(out, /\[P\] 범용 — /);
  assert.match(out, /\[L\] 내것 — 내 작업/);
  assert.doesNotMatch(out, /_양식/);
  assert.match(out, /a\/ P: .*회로분석.* \/ L: 내것/);
  assert.ok(out.includes(PIPELINE));
});

test('where on an unprepared folder points at setup', () => {
  assert.match(where(tmp()), /\/zab:setup/);
});

test('task board and last record', () => {
  const m = {
    tasks: {
      T1: { 이름: '가', 상태: '완료' },
      T2: { 이름: '나', 상태: '사람확인대기', 현재_단계: '2단계', 의존: ['T1'] },
    },
    history: [{ task: 'T2', 단계: '2단계', 담당: 'B1', 한_일: '기준 작성' }],
  };
  assert.deepEqual(taskBoard(m), ['  T2 나 — 사람확인대기 | 2단계 | 의존: T1', '  (완료 1건)']);
  assert.equal(lastRecord(m), 'T2 / 2단계 / B1 — 기준 작성');
  assert.deepEqual(taskBoard({ tasks: {} }), ['  등록된 Task 없음 — 미시작']);
  assert.equal(lastRecord({}), '없음');
});

test('banner speaks only in an zab project', () => {
  const dir = tmp();
  assert.equal(banner(dir), null);
  fs.mkdirSync(path.join(dir, 'log'));
  fs.writeFileSync(path.join(dir, 'log', 'manifest.json'), '{"_meta":{"pipeline_repo":"../00. pipeline"},"tasks":{}}');
  assert.equal(banner(dir), null);
  const zab = tmp();
  setup(zab);
  const b = banner(zab);
  assert.match(b.systemMessage, /\/zab:design/);
  assert.equal(b.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.ok(b.hookSpecificOutput.additionalContext.includes(PIPELINE));
});

test('the banner hook exits 0 and stays quiet on a broken manifest', () => {
  const dir = tmp();
  fs.mkdirSync(path.join(dir, 'log'));
  fs.writeFileSync(path.join(dir, 'log', 'manifest.json'), '{ not json');
  const out = execFileSync(process.execPath, [SCRIPT, 'banner'], { cwd: dir, encoding: 'utf8' });
  assert.equal(out, '');
});

test('every pipeline definition names a purpose', () => {
  const dir = path.join(PIPELINE, 'z', 'pipelines');
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.md') && !n.startsWith('_'))) {
    assert.match(fs.readFileSync(path.join(dir, f), 'utf8'), /^\|\s*목적\s*\|\s*\S/m, f);
  }
});

test('inside — the answer table', () => {
  const table = [
    // platform, target, base, expected
    ['win32', 'C:\\p\\pipeline\\z\\부팅.md', 'C:\\p\\pipeline', true],
    ['win32', 'c:/P/Pipeline/z/부팅.md', 'C:\\p\\pipeline', true],
    ['win32', '/c/p/pipeline/z/부팅.md', 'C:\\p\\pipeline', true],
    ['win32', 'C:\\p\\pipeline', 'C:\\p\\pipeline', true],
    ['win32', 'C:\\p\\pipeline-evil\\x.md', 'C:\\p\\pipeline', false],
    ['win32', 'C:\\p\\pipeline\\..\\secrets.txt', 'C:\\p\\pipeline', false],
    ['win32', 'D:\\p\\pipeline\\x.md', 'C:\\p\\pipeline', false],
    ['linux', '/p/pipeline/z/부팅.md', '/p/pipeline', true],
    ['linux', '/p/pipeline/../secrets', '/p/pipeline', false],
    ['linux', '/p/pipeline2/x', '/p/pipeline', false],
    ['linux', '/P/pipeline/x', '/p/pipeline', false],
    ['linux', '', '/p/pipeline', false],
    ['linux', undefined, '/p/pipeline', false],
  ];
  for (const [platform, target, base, want] of table) {
    assert.equal(inside(target, base, platform), want, `${platform} ${target}`);
  }
});

test('allowRead allows only reads of the plugin folders, and otherwise says nothing', () => {
  const bases = ['/p/pipeline', '/p/templates/project'];
  const ask = (tool_name, tool_input) => allowRead({ tool_name, tool_input }, bases, 'linux');
  assert.equal(ask('Read', { file_path: '/p/pipeline/z/부팅.md' }).hookSpecificOutput.permissionDecision, 'allow');
  assert.equal(ask('Grep', { pattern: 'x', path: '/p/pipeline/b' }).hookSpecificOutput.permissionDecision, 'allow');
  assert.equal(ask('Glob', { pattern: '**', path: '/p/templates/project' }).hookSpecificOutput.permissionDecision, 'allow');
  assert.equal(ask('Read', { file_path: '/home/me/.ssh/id_rsa' }), null);
  assert.equal(ask('Read', { file_path: '/p/scripts/zab.mjs' }), null);
  assert.equal(ask('Grep', { pattern: 'x' }), null);
  assert.equal(ask('Write', { file_path: '/p/pipeline/z/부팅.md' }), null);
  assert.equal(ask('Edit', { file_path: '/p/pipeline/z/부팅.md' }), null);
  assert.equal(ask('Bash', { command: 'cat /p/pipeline/z/부팅.md' }), null);
  assert.equal(allowRead(null, bases, 'linux'), null);
});

// ── ownership ──────────────────────────────────────────────────────────────

import { roleOf, classify, decideWrite } from '../scripts/zab.mjs';

test('roleOf — the answer table', () => {
  const table = [
    [undefined, 'Z'], [null, 'Z'], ['', 'Z'],
    [PLUGIN + ':a', 'A'], [PLUGIN + ':b', 'B'],
    ['a', 'other'], ['b', 'other'], ['other:a', 'other'], ['other:b', 'other'], [PLUGIN + ':ab', 'other'],
    ['general-purpose', 'other'], ['Explore', 'other'],
  ];
  for (const [type, want] of table) assert.equal(roleOf(type), want, String(type));
});

test('classify — the answer table', () => {
  const table = [
    ['log/T1_단어수/검증기준.md', 'B'],
    ['log/T1_단어수/검증요약/B2_검증_R1.md', 'B'],
    ['log/T12_x/관찰/B1_기준작성_R1/제출본/검증기준.md', 'B'],
    ['pipeline/b/갈래별/새갈래/검증기준.md', 'B'],
    ['log/T1_단어수/구현요약/A1_구현_R1.md', 'A'],
    ['log/T1_단어수/설계명세.md', 'A'],
    ['log/T1_단어수/관찰/A1_구현_R1/제출본/x.py', 'A'],
    ['output/wordcount.py', 'A'],
    ['output/T1_단어수/docs/x.md', 'A'],
    ['output/T1_단어수/tmp/B1_R1/scratch.txt', null],
    ['log/manifest.json', 'Z'],
    ['log/실행로그.md', 'Z'],
    ['log/AI 논의사항.md', 'Z'],
    ['프로젝트지도.md', 'Z'],
    ['log/T1_단어수/배정/x.json', 'Z'],
    ['log/T1_단어수/호출/B1_기준작성_R1.md', 'Z'],
    ['input/T1_시험자료/a.txt', null],
    ['src/app.js', null],
    ['CLAUDE.md', null],
    ['pipeline/a/갈래별/새갈래/규칙.md', null],
    ['log/검증기준.md', null],
    ['outputs/x', null],
  ];
  for (const [rel, want] of table) assert.equal(classify(rel), want, rel);
});

test('decideWrite — the answer table', () => {
  const m2 = { tasks: { T1: { 모드: '모드2', 상태: '진행중' } } };
  const m1 = { tasks: { T1: { 모드: '모드1', 상태: '진행중' } } };
  const done = { tasks: { T1: { 모드: '모드2', 상태: '완료' } } };
  const none = { tasks: {} };
  const crit = 'log/T1_x/검증기준.md';
  const table = [
    // role, path, manifest, expected action
    ['B', crit, m2, null],
    ['A', crit, m2, 'deny'],
    ['Z', crit, m2, 'deny'],
    ['other', crit, m2, 'deny'],
    ['Z', crit, done, 'deny'],
    ['Z', crit, m1, null],            // mode 1: B is a main session
    ['Z', 'log/T9_x/검증기준.md', m2, 'deny'], // room not in the ledger yet
    ['Z', 'pipeline/b/갈래별/n/검증기준.md', m2, 'deny'],
    ['Z', 'pipeline/b/갈래별/n/검증기준.md', none, 'deny'],
    ['Z', 'pipeline/b/갈래별/n/검증기준.md', m1, null],
    ['B', 'output/wordcount.py', m2, 'deny'],
    ['B', 'log/T1_x/구현요약/A1.md', m2, 'deny'],
    ['B', 'output/T1_x/tmp/B1_R1/s.txt', m2, null],
    ['A', 'output/wordcount.py', m2, null],
    ['Z', 'output/wordcount.py', m2, 'log'],
    ['Z', 'log/T1_x/구현요약/A1.md', m2, 'log'],
    ['Z', 'output/wordcount.py', m1, null],
    ['Z', 'output/wordcount.py', done, null],  // no Task in progress
    ['Z', 'output/wordcount.py', none, null],
    ['other', 'output/wordcount.py', m2, null],
    ['A', 'log/manifest.json', m2, 'deny'],
    ['B', 'log/실행로그.md', m2, 'deny'],
    ['A', 'log/T1_x/호출/A1.md', m2, 'deny'],
    ['Z', 'log/manifest.json', m2, null],
    ['other', 'log/manifest.json', m2, null],
    ['A', 'input/x.txt', m2, null],
    ['B', 'src/app.js', m2, null],
    ['Z', 'src/app.js', m2, null],
  ];
  for (const [role, rel, manifest, want] of table) {
    const got = decideWrite({ role, rel, manifest });
    assert.equal(got?.action ?? null, want, `${role} → ${rel}`);
    if (want === 'deny') assert.ok(got.reason.length > 10);
  }
});

import { own, directEdits, DIRECT_LOG } from '../scripts/zab.mjs';

function projectWithTask(mode = '모드2') {
  const dir = tmp();
  setup(dir);
  const p = path.join(dir, 'log', 'manifest.json');
  const m = JSON.parse(fs.readFileSync(p, 'utf8'));
  m.tasks.T1 = { 이름: 'x', 모드: mode, 상태: '진행중', 현재_단계: '4단계' };
  fs.writeFileSync(p, JSON.stringify(m));
  return dir;
}
const write = (dir, rel, agent_type) =>
  own({ tool_name: 'Write', agent_type, tool_input: { file_path: path.join(dir, ...rel.split('/')) } });

test('own denies a non-owner and names the owner', () => {
  const dir = projectWithTask();
  const out = write(dir, 'log/T1_x/검증기준.md', undefined);
  assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /B/);
  assert.equal(write(dir, 'log/T1_x/검증기준.md', PLUGIN + ':b'), null);
  assert.equal(write(dir, 'output/a.py', PLUGIN + ':b').hookSpecificOutput.permissionDecision, 'deny');
  assert.equal(write(dir, 'log/manifest.json', PLUGIN + ':a').hookSpecificOutput.permissionDecision, 'deny');
});

test('own lets Z edit output during a Task, and records it', () => {
  const dir = projectWithTask();
  assert.equal(write(dir, 'output/a.py', undefined), null);
  assert.equal(write(dir, 'output/a.py', PLUGIN + ':a'), null);
  const edits = directEdits(dir);
  assert.equal(edits.length, 1);
  assert.equal(edits[0]['파일'], 'output/a.py');
  assert.deepEqual(edits[0]['진행중'], ['T1 4단계']);
  assert.match(where(dir), /직접 고친 기록/);
});

test('own stays out of mode-1 Tasks and of folders that are not zab projects', () => {
  const m1 = projectWithTask('모드1');
  assert.equal(write(m1, 'log/T1_x/검증기준.md', undefined), null);
  assert.equal(write(m1, 'output/a.py', undefined), null);
  assert.equal(fs.existsSync(path.join(m1, DIRECT_LOG)), false);
  const plain = tmp();
  fs.mkdirSync(path.join(plain, 'log', 'T1_x'), { recursive: true });
  assert.equal(write(plain, 'log/T1_x/검증기준.md', undefined), null);
  assert.equal(own({ tool_name: 'Write', tool_input: {} }), null);
});
