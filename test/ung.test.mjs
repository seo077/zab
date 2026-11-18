import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setup, where, banner, taskBoard, lastRecord, inside, allowRead, PIPELINE, TEMPLATE } from '../scripts/ung.mjs';

const SCRIPT = fileURLToPath(new URL('../scripts/ung.mjs', import.meta.url));
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'ung-'));
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
  assert.equal(m._meta.pipeline_repo, 'plugin:ung');
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
  assert.match(where(tmp()), /\/ung:setup/);
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

test('banner speaks only in an ung project', () => {
  const dir = tmp();
  assert.equal(banner(dir), null);
  fs.mkdirSync(path.join(dir, 'log'));
  fs.writeFileSync(path.join(dir, 'log', 'manifest.json'), '{"_meta":{"pipeline_repo":"../00. pipeline"},"tasks":{}}');
  assert.equal(banner(dir), null);
  const ung = tmp();
  setup(ung);
  const b = banner(ung);
  assert.match(b.systemMessage, /\/ung:design/);
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
  assert.equal(ask('Read', { file_path: '/p/scripts/ung.mjs' }), null);
  assert.equal(ask('Grep', { pattern: 'x' }), null);
  assert.equal(ask('Write', { file_path: '/p/pipeline/z/부팅.md' }), null);
  assert.equal(ask('Edit', { file_path: '/p/pipeline/z/부팅.md' }), null);
  assert.equal(ask('Bash', { command: 'cat /p/pipeline/z/부팅.md' }), null);
  assert.equal(allowRead(null, bases, 'linux'), null);
});
