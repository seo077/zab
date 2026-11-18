#!/usr/bin/env node
// ung — the only executable in the plugin. Zero dependencies, Node 18+.
//
//   setup    scaffold a project folder (never overwrites)
//   where    print the paths and state Z needs to boot
//   banner   SessionStart hook: show the Task board, hand the model the paths
//   allow-read  PreToolUse hook: let a session read the plugin's own documents
//
// Nothing here blocks anything. The method lives in pipeline/ as documents;
// this file only finds them and copies a template.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PIPELINE = path.join(ROOT, 'pipeline');
export const TEMPLATE = path.join(ROOT, 'templates', 'project');

// Folders of the project-local layer. Same shape as the plugin's pipeline/.
const LOCAL_DIRS = ['z/pipelines', 'a/갈래별', 'b/갈래별', '개선이력'];

// The example Task room is a form B copies from the template root. It is not
// copied into a project: a room named T1 there would read as a real Task.
const SKIP = new Set(['log/T1_예시작업']);

const rel = (base, p) => path.relative(base, p).split(path.sep).join('/');

function walk(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    const r = rel(base, full);
    if (SKIP.has(r)) continue;
    if (e.isDirectory()) walk(full, base, out);
    else out.push(r);
  }
  return out;
}

export function setup(projectDir, now = new Date()) {
  const created = [];
  const kept = [];
  const put = (r, content) => {
    const dest = path.join(projectDir, r);
    if (fs.existsSync(dest)) return void kept.push(r);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content);
    created.push(r);
  };

  for (const r of walk(TEMPLATE)) {
    let content = fs.readFileSync(path.join(TEMPLATE, r));
    if (r === 'log/manifest.json') {
      const j = JSON.parse(content.toString('utf8'));
      j._meta.project = path.basename(projectDir);
      j._meta.updated_at = now.toISOString();
      content = JSON.stringify(j, null, 2) + '\n';
    }
    put(r, content);
  }
  for (const d of LOCAL_DIRS) put(`pipeline/${d}/.gitkeep`, '');
  return { created, kept };
}

function readManifest(projectDir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(projectDir, 'log', 'manifest.json'), 'utf8'));
  } catch {
    return null;
  }
}

export function taskBoard(manifest) {
  const tasks = Object.entries(manifest?.tasks ?? {});
  if (tasks.length === 0) return ['  등록된 Task 없음 — 미시작'];
  const active = tasks.filter(([, t]) => t['상태'] !== '완료');
  const lines = active.map(([id, t]) => {
    const step = t['현재_단계'] ? ` | ${t['현재_단계']}` : '';
    const dep = t['의존']?.length ? ` | 의존: ${t['의존'].join('·')}` : '';
    return `  ${id} ${t['이름']} — ${t['상태']}${step}${dep}`;
  });
  if (active.length === 0) lines.push('  진행 중 Task 없음');
  const done = tasks.length - active.length;
  if (done > 0) lines.push(`  (완료 ${done}건)`);
  return lines;
}

export function lastRecord(manifest) {
  const h = manifest?.history?.at(-1);
  if (!h) return '없음';
  return `${h.task ? h.task + ' / ' : ''}${h['단계']} / ${h['담당']} — ${h['한_일']}`;
}

function names(dir, { files }) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => (files ? e.isFile() && e.name.endsWith('.md') : e.isDirectory()))
      .map((e) => (files ? e.name.slice(0, -3) : e.name))
      .filter((n) => !n.startsWith('_'))
      .sort();
  } catch {
    return [];
  }
}

function purpose(file) {
  try {
    const m = fs.readFileSync(file, 'utf8').match(/^\|\s*목적\s*\|\s*(.+?)\s*\|\s*$/m);
    return m ? m[1] : '';
  } catch {
    return '';
  }
}

export function where(projectDir) {
  const local = path.join(projectDir, 'pipeline');
  const manifest = readManifest(projectDir);
  const out = [
    `파이프라인 저장소 P = ${PIPELINE}`,
    `템플릿 루트 E      = ${TEMPLATE}`,
    `프로젝트 루트      = ${projectDir}`,
    `프로젝트 층 L      = ${fs.existsSync(local) ? local : '(없음)'}`,
    '',
  ];
  if (!manifest) {
    out.push('장부 log/manifest.json 이 없다 — 이 폴더는 아직 준비되지 않았다. /ung:setup 을 먼저 실행한다.');
    return out.join('\n');
  }
  out.push('파이프라인 정의 (P = 플러그인, L = 이 프로젝트):');
  for (const [tag, base] of [['P', PIPELINE], ['L', local]]) {
    for (const n of names(path.join(base, 'z', 'pipelines'), { files: true })) {
      out.push(`  [${tag}] ${n} — ${purpose(path.join(base, 'z', 'pipelines', n + '.md'))}`);
    }
  }
  out.push('', '갈래:');
  for (const role of ['a', 'b']) {
    const p = names(path.join(PIPELINE, role, '갈래별'), {});
    const l = names(path.join(local, role, '갈래별'), {});
    out.push(`  ${role}/ P: ${p.join(' · ') || '없음'} / L: ${l.join(' · ') || '없음'}`);
  }
  out.push('', 'Task 상황판 =', ...taskBoard(manifest), `마지막 기록 = ${lastRecord(manifest)}`);
  return out.join('\n');
}

export function banner(projectDir) {
  const manifest = readManifest(projectDir);
  // Stay silent anywhere that is not an ung project — including folders that
  // happen to keep some other log/manifest.json.
  if (manifest?._meta?.pipeline_repo !== 'plugin:ung') return null;
  const project = manifest._meta?.project || path.basename(projectDir);
  const board = ['Task 상황판 =', ...taskBoard(manifest), `마지막 기록 = ${lastRecord(manifest)}`].join('\n');
  const human = [
    `본 작업 공간 = ${project} (ung)`,
    '',
    board,
    '',
    '시작 = /ung:design (사양·기준·설계) → /ung:build (구현·검증·수락) / 자유 질문 가능',
  ].join('\n');
  const model = [
    '이 폴더는 ung 프로젝트다 (Z·A·B 파이프라인).',
    `파이프라인 저장소 P = ${PIPELINE}`,
    `템플릿 루트 E = ${TEMPLATE}`,
    `프로젝트 루트 = ${projectDir}`,
    board,
    '사용자가 /ung:design 또는 /ung:build 를 실행하기 전에는 Task를 개설하거나 역할을 호출하지 않는다. 일반 질문은 그대로 답한다.',
  ].join('\n');
  return {
    systemMessage: human,
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: model },
  };
}

// Git Bash spells C:\x as /c/x. Left untranslated, path.resolve reads it as
// a path on the current drive and nothing ever matches.
export function normalize(p, platform = process.platform) {
  if (platform !== 'win32') return path.posix.resolve(p);
  const m = /^\/([a-zA-Z])(\/.*)?$/.exec(p);
  const fixed = m ? `${m[1]}:${m[2] ?? '/'}` : p;
  return path.win32.resolve(fixed).toLowerCase();
}

export function inside(target, base, platform = process.platform) {
  if (typeof target !== 'string' || target === '') return false;
  const sep = platform === 'win32' ? '\\' : '/';
  const t = normalize(target, platform);
  const b = normalize(base, platform);
  return t === b || t.startsWith(b.endsWith(sep) ? b : b + sep);
}

// The role documents live in the plugin, outside the project, so without this
// every read of them is a permission prompt — and a subagent cannot answer
// one. This only ever says "allow", only for Read/Grep/Glob, and only for the
// two folders this plugin ships. For anything else it says nothing at all and
// the normal permission flow decides.
export function allowRead(event, bases = [PIPELINE, TEMPLATE], platform = process.platform) {
  const name = event?.tool_name;
  const input = event?.tool_input ?? {};
  const target = name === 'Read' ? input.file_path : name === 'Grep' || name === 'Glob' ? input.path : null;
  if (!bases.some((b) => inside(target, b, platform))) return null;
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      permissionDecisionReason: "ung: the plugin's own pipeline documents (read-only)",
    },
  };
}

function main() {
  const mode = process.argv[2];
  const cwd = process.cwd();
  if (mode === 'banner') {
    // A hook must never take a session down: any failure is silence and exit 0.
    try {
      const b = banner(cwd);
      if (b) process.stdout.write(JSON.stringify(b));
    } catch {}
    return;
  }
  if (mode === 'allow-read') {
    try {
      const out = allowRead(JSON.parse(fs.readFileSync(0, 'utf8')));
      if (out) process.stdout.write(JSON.stringify(out));
    } catch {}
    return;
  }
  if (mode === 'setup') {
    const { created, kept } = setup(cwd);
    console.log(`프로젝트 루트 = ${cwd}`);
    console.log(created.length ? `만든 것 (${created.length}):\n${created.map((r) => '  + ' + r).join('\n')}` : '새로 만든 것 없음');
    if (kept.length) console.log(`이미 있어 그대로 둔 것 (${kept.length}):\n${kept.map((r) => '  = ' + r).join('\n')}`);
    return;
  }
  if (mode === 'where') {
    console.log(where(cwd));
    return;
  }
  console.error('usage: ung.mjs setup | where | banner');
  process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
