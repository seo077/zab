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

// The suite must never read or write the real user layer in the home folder.
process.env.ZAB_USER_DIR = path.join(tmp(), 'pipeline');

test('setup creates the project skeleton', () => {
  const dir = tmp();
  const { created, kept } = setup(dir, new Date('2026-01-02T03:04:05Z'));
  assert.deepEqual(kept, []);
  for (const r of [
    'CLAUDE.md', 'project-map.md', 'input/.gitkeep', 'output/.gitkeep',
    'log/manifest.json', 'log/run-log.md', 'log/decisions.md',
    'pipeline/z/pipelines/.gitkeep', 'pipeline/a/tracks/.gitkeep',
    'pipeline/b/tracks/.gitkeep', 'pipeline/improvements/.gitkeep',
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
  assert.ok(!fs.existsSync(path.join(dir, 'log', 'T1_example')));
  assert.ok(fs.existsSync(path.join(TEMPLATE, 'log', 'T1_example', 'criteria.md')));
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
  fs.writeFileSync(path.join(dir, 'pipeline/z/pipelines/mine.md'), '| Item | Content |\n|---|---|\n| Purpose | my job |\n');
  fs.mkdirSync(path.join(dir, 'pipeline/a/tracks/mine'));
  const out = where(dir);
  assert.match(out, /\[P\] general — \S/);
  assert.match(out, /\[L\] mine — my job/);
  assert.doesNotMatch(out, /_template/);
  assert.match(out, /a\/ P: .*circuit-analysis.* \/ L: mine/);
  assert.ok(out.includes(PIPELINE));
});

test('where on an unprepared folder points at setup', () => {
  assert.match(where(tmp()), /\/zab:setup/);
});

test('task board and last record', () => {
  const m = {
    tasks: {
      T1: { name: 'one', status: 'done' },
      T2: { name: 'two', status: 'awaiting_human', current_step: 'step 2', depends_on: ['T1'] },
    },
    history: [{ task: 'T2', step: 'step 2', actor: 'B1', did: 'wrote the criteria' }],
  };
  assert.deepEqual(taskBoard(m), ['  T2 two — awaiting_human | step 2 | depends on: T1', '  (1 done)']);
  assert.equal(lastRecord(m), 'T2 / step 2 / B1 — wrote the criteria');
  assert.deepEqual(taskBoard({ tasks: {} }), ['  no Tasks registered — not started']);
  assert.equal(lastRecord({}), 'none');
});

test('banner speaks only in a zab project', () => {
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
    assert.match(fs.readFileSync(path.join(dir, f), 'utf8'), /^\|\s*Purpose\s*\|\s*\S/m, f);
  }
});

test('inside — the answer table', () => {
  const table = [
    // platform, target, base, expected
    ['win32', 'C:\\p\\pipeline\\z\\boot.md', 'C:\\p\\pipeline', true],
    ['win32', 'c:/P/Pipeline/z/boot.md', 'C:\\p\\pipeline', true],
    ['win32', '/c/p/pipeline/z/boot.md', 'C:\\p\\pipeline', true],
    ['win32', 'C:\\p\\pipeline', 'C:\\p\\pipeline', true],
    ['win32', 'C:\\p\\pipeline-evil\\x.md', 'C:\\p\\pipeline', false],
    ['win32', 'C:\\p\\pipeline\\..\\secrets.txt', 'C:\\p\\pipeline', false],
    ['win32', 'D:\\p\\pipeline\\x.md', 'C:\\p\\pipeline', false],
    ['linux', '/p/pipeline/z/boot.md', '/p/pipeline', true],
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
  assert.equal(ask('Read', { file_path: '/p/pipeline/z/boot.md' }).hookSpecificOutput.permissionDecision, 'allow');
  assert.equal(ask('Grep', { pattern: 'x', path: '/p/pipeline/b' }).hookSpecificOutput.permissionDecision, 'allow');
  assert.equal(ask('Glob', { pattern: '**', path: '/p/templates/project' }).hookSpecificOutput.permissionDecision, 'allow');
  assert.equal(ask('Read', { file_path: '/home/me/.ssh/id_rsa' }), null);
  assert.equal(ask('Read', { file_path: '/p/scripts/zab.mjs' }), null);
  assert.equal(ask('Grep', { pattern: 'x' }), null);
  assert.equal(ask('Write', { file_path: '/p/pipeline/z/boot.md' }), null);
  assert.equal(ask('Edit', { file_path: '/p/pipeline/z/boot.md' }), null);
  assert.equal(ask('Bash', { command: 'cat /p/pipeline/z/boot.md' }), null);
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
    ['log/T1_wordcount/criteria.md', 'B'],
    ['log/T1_wordcount/verification-summary/B2_verify_R1.md', 'B'],
    ['log/T12_x/observations/B1_criteria_R1/submitted/criteria.md', 'B'],
    ['pipeline/b/tracks/newtrack/criteria.md', 'B'],
    ['log/T1_wordcount/build-summary/A1_build_R1.md', 'A'],
    ['log/T1_wordcount/design-spec.md', 'A'],
    ['log/T1_wordcount/observations/A1_build_R1/submitted/x.py', 'A'],
    ['output/wordcount.py', 'A'],
    ['output/T1_wordcount/docs/x.md', 'A'],
    ['output/T1_wordcount/tmp/B1_R1/scratch.txt', null],
    ['log/manifest.json', 'Z'],
    ['log/run-log.md', 'Z'],
    ['log/decisions.md', 'Z'],
    ['project-map.md', 'Z'],
    ['log/T1_wordcount/assignments/x.json', 'Z'],
    ['log/T1_wordcount/calls/B1_criteria_R1.md', 'Z'],
    ['input/T1_samples/a.txt', null],
    ['src/app.js', null],
    ['CLAUDE.md', null],
    ['pipeline/a/tracks/newtrack/rules.md', null],
    ['log/criteria.md', null],
    ['outputs/x', null],
  ];
  for (const [rel, want] of table) assert.equal(classify(rel), want, rel);
});

test('decideWrite — the answer table', () => {
  const m2 = { tasks: { T1: { mode: 'mode2', status: 'in_progress' } } };
  const m1 = { tasks: { T1: { mode: 'mode1', status: 'in_progress' } } };
  const done = { tasks: { T1: { mode: 'mode2', status: 'done' } } };
  const none = { tasks: {} };
  const crit = 'log/T1_x/criteria.md';
  const table = [
    // role, path, manifest, expected action
    ['B', crit, m2, null],
    ['A', crit, m2, 'deny'],
    ['Z', crit, m2, 'deny'],
    ['other', crit, m2, 'deny'],
    ['Z', crit, done, 'deny'],
    ['Z', crit, m1, null],            // mode 1: B is a main session
    ['Z', 'log/T9_x/criteria.md', m2, 'deny'], // room not in the ledger yet
    ['Z', 'pipeline/b/tracks/n/criteria.md', m2, 'deny'],
    ['Z', 'pipeline/b/tracks/n/criteria.md', none, 'deny'],
    ['Z', 'pipeline/b/tracks/n/criteria.md', m1, null],
    ['B', 'output/wordcount.py', m2, 'deny'],
    ['B', 'log/T1_x/build-summary/A1.md', m2, 'deny'],
    ['B', 'output/T1_x/tmp/B1_R1/s.txt', m2, null],
    ['A', 'output/wordcount.py', m2, null],
    ['Z', 'output/wordcount.py', m2, 'log'],
    ['Z', 'log/T1_x/build-summary/A1.md', m2, 'log'],
    ['Z', 'output/wordcount.py', m1, null],
    ['Z', 'output/wordcount.py', done, null],  // no Task in progress
    ['Z', 'output/wordcount.py', none, null],
    ['other', 'output/wordcount.py', m2, null],
    ['A', 'log/manifest.json', m2, 'deny'],
    ['B', 'log/run-log.md', m2, 'deny'],
    ['A', 'log/T1_x/calls/A1.md', m2, 'deny'],
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

function projectWithTask(mode = 'mode2') {
  const dir = tmp();
  setup(dir);
  const p = path.join(dir, 'log', 'manifest.json');
  const m = JSON.parse(fs.readFileSync(p, 'utf8'));
  m.tasks.T1 = { name: 'x', mode, status: 'in_progress', current_step: 'step 4' };
  fs.writeFileSync(p, JSON.stringify(m));
  return dir;
}
const write = (dir, rel, agent_type) =>
  own({ tool_name: 'Write', agent_type, tool_input: { file_path: path.join(dir, ...rel.split('/')) } });

test('own denies a non-owner and names the owner', () => {
  const dir = projectWithTask();
  const out = write(dir, 'log/T1_x/criteria.md', undefined);
  assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /B/);
  assert.equal(write(dir, 'log/T1_x/criteria.md', PLUGIN + ':b'), null);
  assert.equal(write(dir, 'output/a.py', PLUGIN + ':b').hookSpecificOutput.permissionDecision, 'deny');
  assert.equal(write(dir, 'log/manifest.json', PLUGIN + ':a').hookSpecificOutput.permissionDecision, 'deny');
});

test('own lets Z edit output during a Task, and records it', () => {
  const dir = projectWithTask();
  assert.equal(write(dir, 'output/a.py', undefined), null);
  assert.equal(write(dir, 'output/a.py', PLUGIN + ':a'), null);
  const edits = directEdits(dir);
  assert.equal(edits.length, 1);
  assert.equal(edits[0].file, 'output/a.py');
  assert.deepEqual(edits[0].active, ['T1 step 4']);
  assert.match(where(dir), /Direct edits by Z/);
});

test('own stays out of mode-1 Tasks and of folders that are not zab projects', () => {
  const m1 = projectWithTask('mode1');
  assert.equal(write(m1, 'log/T1_x/criteria.md', undefined), null);
  assert.equal(write(m1, 'output/a.py', undefined), null);
  assert.equal(fs.existsSync(path.join(m1, DIRECT_LOG)), false);
  const plain = tmp();
  fs.mkdirSync(path.join(plain, 'log', 'T1_x'), { recursive: true });
  assert.equal(write(plain, 'log/T1_x/criteria.md', undefined), null);
  assert.equal(own({ tool_name: 'Write', tool_input: {} }), null);
});

// ── migrate ────────────────────────────────────────────────────────────────

import { migrate, mapPath, isLegacy } from '../scripts/zab.mjs';

test('mapPath — the answer table', () => {
  const table = [
    ['프로젝트지도.md', 'project-map.md'],
    ['log/실행로그.md', 'log/run-log.md'],
    ['log/AI 논의사항.md', 'log/decisions.md'],
    ['log/T1_단어수/검증기준.md', 'log/T1_단어수/criteria.md'],
    ['log/T1_회로분석/관찰/B1_기준작성_R1/제출본/검증기준.md', 'log/T1_회로분석/observations/B1_기준작성_R1/submitted/criteria.md'],
    ['log/T2_x/구현요약/A1_구현_R1.md', 'log/T2_x/build-summary/A1_구현_R1.md'],
    ['pipeline/a/갈래별/내갈래/규칙.md', 'pipeline/a/tracks/내갈래/rules.md'],
    ['pipeline/b/갈래별/엑셀작업/참고자료/x.md', 'pipeline/b/tracks/spreadsheet/references/x.md'],
    ['z/pipelines/범용.md', 'z/pipelines/general.md'],
    ['pipeline/z/pipelines/내것.md', 'pipeline/z/pipelines/내것.md'],
    ['output/회로분석/x.md', 'output/회로분석/x.md'],
    ['log/manifest.json', 'log/manifest.json'],
  ];
  for (const [from, to] of table) assert.equal(mapPath(from), to, from);
});

function koreanProject() {
  const dir = tmp();
  const put = (r, c = 'x') => {
    fs.mkdirSync(path.dirname(path.join(dir, r)), { recursive: true });
    fs.writeFileSync(path.join(dir, r), c);
  };
  put('log/manifest.json', JSON.stringify({
    _meta: { project: 'k', pipeline_repo: 'plugin:zab', updated_at: 't', owner: 'Z' },
    _주의: ['…'],
    _schema: { tasks: {} },
    tasks: {
      T1: {
        이름: '단어수', 방: 'log/T1_단어수/', 파이프라인: 'z/pipelines/범용.md', 모드: '모드2', 상태: '사람확인대기',
        의존: [], 현재_단계: '4단계 R2', 산출물: ['output/wc.py'],
        확인지점: [{ 단계: '★ 기준 승인', 확인_대상: ['log/T1_단어수/검증기준.md'], 결과: '승인', 일자: 'd', 사용자_말: '좋아 진행해' }],
        판정: { 종합자: 'B2', 결과: '⚠️ 조건부', 보고서: ['log/T1_단어수/검증요약/B2.md'], 일자: 'd' },
      },
    },
    history: [{ task: 'T1', 단계: '2단계', 담당: 'B1', 한_일: '기준 작성', 시각: 't', 파일: ['log/T1_단어수/검증기준.md'], 메모: '' }],
  }));
  put('프로젝트지도.md');
  put('log/실행로그.md', 'log');
  put('log/T1_단어수/검증기준.md', 'criteria body');
  put('log/T1_단어수/검증요약/B2.md');
  put('log/직접수정.jsonl', JSON.stringify({ 시각: 't', 파일: 'output/wc.py', 도구: 'Write', 진행중: ['T1 4단계'] }) + '\n');
  put('pipeline/a/갈래별/내갈래/규칙.md');
  put('pipeline/z/pipelines/내것.md', '| 항목 | 내용 |\n|---|---|\n| 목적 | 내 작업 |\n');
  put('output/wc.py');
  return dir;
}

test('a Korean-layout project is recognised, and where and banner point at migrate', () => {
  const dir = koreanProject();
  assert.equal(isLegacy(JSON.parse(read(dir, 'log/manifest.json'))), true);
  assert.match(where(dir), /\/zab:migrate/);
  assert.match(banner(dir).systemMessage, /\/zab:migrate/);
  const fresh = tmp();
  setup(fresh);
  assert.equal(isLegacy(JSON.parse(read(fresh, 'log/manifest.json'))), false);
});

test('migrate without apply changes nothing', () => {
  const dir = koreanProject();
  const before = read(dir, 'log/manifest.json');
  const r = migrate(dir);
  assert.ok(r.moves.length >= 6);
  assert.equal(read(dir, 'log/manifest.json'), before);
  assert.ok(fs.existsSync(path.join(dir, 'log', '실행로그.md')));
  assert.ok(!fs.existsSync(path.join(dir, 'log', 'run-log.md')));
});

test('migrate apply renames files, rewrites the ledger, and keeps what people wrote', () => {
  const dir = koreanProject();
  migrate(dir, { apply: true });
  assert.equal(read(dir, 'log/T1_단어수/criteria.md'), 'criteria body');
  assert.equal(read(dir, 'log/run-log.md'), 'log');
  for (const r of ['project-map.md', 'log/T1_단어수/verification-summary/B2.md', 'pipeline/a/tracks/내갈래/rules.md', 'output/wc.py', 'log/manifest.ko.json']) {
    assert.ok(fs.existsSync(path.join(dir, ...r.split('/'))), r);
  }
  assert.ok(!fs.existsSync(path.join(dir, 'log', 'T1_단어수', '검증요약')));
  const m = JSON.parse(read(dir, 'log/manifest.json'));
  const t = m.tasks.T1;
  assert.equal(isLegacy(m), false);
  assert.deepEqual(
    [t.name, t.room, t.pipeline, t.mode, t.status, t.current_step],
    ['단어수', 'log/T1_단어수/', 'z/pipelines/general.md', 'mode2', 'awaiting_human', 'step 4 R2'],
  );
  assert.deepEqual(t.checkpoints[0], { step: '★ Criteria approval', reviewed: ['log/T1_단어수/criteria.md'], result: 'approved', date: 'd', user_words: '좋아 진행해' });
  assert.equal(t.verdict.result, '⚠️ 조건부'); // B's own words are not rewritten
  assert.deepEqual(t.verdict.reports, ['log/T1_단어수/verification-summary/B2.md']);
  assert.equal(m.history[0].did, '기준 작성');
  assert.equal(m.history[0].step, 'step 2');
  assert.ok(Array.isArray(m._notes) && !('_주의' in m));
  assert.deepEqual(directEdits(dir), [{ at: 't', file: 'output/wc.py', tool: 'Write', active: ['T1 step 4'] }]);
  assert.deepEqual(taskBoard(m), ['  T1 단어수 — awaiting_human | step 4 R2']);
  // a definition the user wrote in Korean is still listed with its purpose
  assert.match(where(dir), /\[L\] 내것 — 내 작업/);
  // ownership works on the migrated project
  assert.equal(write(dir, 'log/T1_단어수/criteria.md', undefined).hookSpecificOutput.permissionDecision, 'deny');
  // and a second run finds nothing to do
  const again = migrate(dir, { apply: true });
  assert.deepEqual([again.legacy, again.moves.length], [false, 0]);
});

test('migrate never overwrites an English-named file, and stays out of other folders', () => {
  const dir = koreanProject();
  fs.writeFileSync(path.join(dir, 'log', 'run-log.md'), 'mine');
  const r = migrate(dir, { apply: true });
  assert.equal(read(dir, 'log/run-log.md'), 'mine');
  assert.equal(read(dir, 'log/실행로그.md'), 'log');
  assert.ok(r.conflicts.some(([from]) => from === 'log/실행로그.md'));
  const plain = tmp();
  fs.mkdirSync(path.join(plain, 'log'));
  fs.writeFileSync(path.join(plain, 'log', '실행로그.md'), 'x');
  assert.equal(migrate(plain, { apply: true }).notProject, true);
  assert.ok(fs.existsSync(path.join(plain, 'log', '실행로그.md')));
});

// ── user layer ─────────────────────────────────────────────────────────────

import { userLayer, decideUserWrite } from '../scripts/zab.mjs';

// Each call gives the suite a fresh, empty user layer and a project next to it.
function withUserLayer() {
  const u = path.join(tmp(), 'pipeline');
  process.env.ZAB_USER_DIR = u;
  const dir = tmp();
  setup(dir);
  return { u, dir };
}

test('where lists the user layer between the plugin and the project', () => {
  const { u, dir } = withUserLayer();
  assert.equal(userLayer(), path.resolve(u));
  assert.match(where(dir), /user layer U\s+= .*created on first write/);
  fs.mkdirSync(path.join(u, 'z', 'pipelines'), { recursive: true });
  fs.writeFileSync(path.join(u, 'z', 'pipelines', 'report.md'), '| Item | Content |\n|---|---|\n| Purpose | my reports |\n');
  fs.mkdirSync(path.join(u, 'a', 'tracks', 'report'), { recursive: true });
  const out = where(dir);
  assert.match(out, /\[U\] report — my reports/);
  assert.match(out, /a\/ P: .* \/ U: report \/ L: none/);
  assert.ok(out.includes(path.resolve(u)));
  assert.ok(banner(dir).hookSpecificOutput.additionalContext.includes(path.resolve(u)));
});

test('allowRead covers the user layer by default, and still nothing else', () => {
  const { u } = withUserLayer();
  const ask = (tool_name, file_path) => allowRead({ tool_name, tool_input: { file_path } });
  assert.equal(ask('Read', path.join(u, 'b', 'tracks', 'x', 'criteria.md')).hookSpecificOutput.permissionDecision, 'allow');
  assert.equal(ask('Read', path.join(u, '..', 'secrets.txt')), null);
  assert.equal(ask('Write', path.join(u, 'b', 'tracks', 'x', 'criteria.md')), null);
});

test('decideUserWrite — the answer table', () => {
  const m2 = { tasks: { T1: { mode: 'mode2', status: 'in_progress' } } };
  const m1 = { tasks: { T1: { mode: 'mode1', status: 'in_progress' } } };
  const table = [
    // role, path in U, manifest of the project the session is in, expected
    ['B', 'b/tracks/x/references/user-preferences.md', m2, 'allow'],
    ['Z', 'b/tracks/x/references/user-preferences.md', m2, 'deny'],
    ['A', 'b/tracks/x/criteria.md', m2, 'deny'],
    ['other', 'b/tracks/x/criteria.md', m2, 'deny'],
    ['Z', 'b/tracks/x/criteria.md', null, 'deny'],   // b/ is refused even outside a project
    ['A', 'b/tracks/x/.gitkeep', m2, 'allow'],        // an empty-folder marker is structure
    ['Z', 'b/tracks/x/skills/.gitkeep', m2, 'allow'],
    ['Z', 'b/tracks/x/criteria.md', m1, 'allow'],    // mode 1: B is a main session
    ['other', 'b/tracks/x/criteria.md', m1, null],
    ['Z', 'improvements/001_x.md', m2, 'allow'],
    ['Z', 'z/pipelines/report.md', m2, 'allow'],
    ['A', 'a/tracks/report/rules.md', m2, 'allow'],
    ['B', 'a/tracks/report/rules.md', m2, 'allow'],  // same as L: only b/ has an owner
    ['other', 'a/tracks/report/rules.md', m2, null],
    ['Z', 'improvements/001_x.md', null, null],      // not in a zab project: no answer
  ];
  for (const [role, rel, manifest, want] of table) {
    assert.equal(decideUserWrite({ role, rel, manifest })?.action ?? null, want, `${role} → ${rel}`);
  }
});

test('own answers for the user layer only from inside a zab project', () => {
  const { u, dir } = withUserLayer();
  const ask = (file, agent_type, cwd) => own({ tool_name: 'Write', agent_type, cwd, tool_input: { file_path: file } });
  const pref = path.join(u, 'b', 'tracks', 'x', 'references', 'user-preferences.md');
  const lesson = path.join(u, 'improvements', '001_x.md');
  assert.equal(ask(pref, PLUGIN + ':b', dir).hookSpecificOutput.permissionDecision, 'allow');
  assert.equal(ask(pref, undefined, dir).hookSpecificOutput.permissionDecision, 'deny');
  assert.equal(ask(lesson, undefined, dir).hookSpecificOutput.permissionDecision, 'allow');
  assert.equal(ask(lesson, PLUGIN + ':a', path.join(dir, 'output')).hookSpecificOutput.permissionDecision, 'allow');
  assert.equal(ask(lesson, undefined, tmp()), null);          // some other folder
  assert.equal(ask(lesson, undefined, undefined), null);
  assert.equal(ask(lesson, 'general-purpose', dir), null);
  assert.equal(ask(path.join(u, '..', 'elsewhere.md'), undefined, dir), null);
  assert.ok(!fs.existsSync(u));                               // the hook itself writes nothing
});

test('an empty-folder marker under b/ has no owner', () => {
  assert.equal(classify('pipeline/b/tracks/x/.gitkeep'), null);
  assert.equal(classify('pipeline/b/tracks/x/references/.gitkeep'), null);
  assert.equal(classify('pipeline/b/tracks/x/criteria.md'), 'B');
  assert.equal(classify('pipeline/b/tracks/x/.gitkeep.md'), 'B');
});

test('fingerprint lists size and hash per layer and only reads', async () => {
  const { fingerprint } = await import('../scripts/zab.mjs');
  const { u, dir } = withUserLayer();
  assert.match(fingerprint(dir, ['U']), /# U = .*\n# \(does not exist\)/);
  assert.ok(!fs.existsSync(u));
  fs.mkdirSync(path.join(u, 'improvements'), { recursive: true });
  fs.writeFileSync(path.join(u, 'improvements', '_seen-once.md'), 'abc');
  const line = fingerprint(dir, ['u']).split('\n')[1];
  assert.equal(line, ['U', 'improvements/_seen-once.md', 3, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'].join('\t'));
  assert.match(fingerprint(dir), /^# P = /);
  assert.match(fingerprint(dir, ['P']), /\nP\tb\/boot\.md\t\d+\t[0-9a-f]{64}/);
});
