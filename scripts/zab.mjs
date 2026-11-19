#!/usr/bin/env node
// zab — the only executable in the plugin. Zero dependencies, Node 18+.
//
//   setup    scaffold a project folder (never overwrites)
//   where    print the paths and state Z needs to boot
//   banner   SessionStart hook: show the Task board, hand the model the paths
//   allow-read  PreToolUse hook: let a session read the plugin's own documents
//   own      PreToolUse hook: one owner per file
//   migrate  rename a project made by the Korean release (v0.1) to the English layout
//   fingerprint  size and SHA-256 of the files in P, E, U and L
//
// The method lives in pipeline/ as documents; this file finds them, copies a
// template, and checks the one rule a machine can check — file ownership.

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PIPELINE = path.join(ROOT, 'pipeline');
export const TEMPLATE = path.join(ROOT, 'templates', 'project');

// The user layer: what this person's projects have learned. It is where a run
// writes new definitions, tracks, lessons and accumulated references, so they
// outlive both a plugin update and any one project. Same shape as pipeline/.
export const userLayer = () =>
  process.env.ZAB_USER_DIR ? path.resolve(process.env.ZAB_USER_DIR) : path.join(os.homedir(), '.zab', 'pipeline');

// Folders of the project-local layer. Same shape as the plugin's pipeline/.
const LOCAL_DIRS = ['z/pipelines', 'a/tracks', 'b/tracks', 'improvements'];

// The example Task room is a form B copies from the template root. It is not
// copied into a project: a room named T1 there would read as a real Task.
const SKIP = new Set(['log/T1_example']);

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
  if (tasks.length === 0) return ['  no Tasks registered — not started'];
  const active = tasks.filter(([, t]) => t.status !== 'done');
  const lines = active.map(([id, t]) => {
    const step = t.current_step ? ` | ${t.current_step}` : '';
    const dep = t.depends_on?.length ? ` | depends on: ${t.depends_on.join('·')}` : '';
    return `  ${id} ${t.name} — ${t.status}${step}${dep}`;
  });
  if (active.length === 0) lines.push('  no Task in progress');
  const done = tasks.length - active.length;
  if (done > 0) lines.push(`  (${done} done)`);
  return lines;
}

export function lastRecord(manifest) {
  const h = manifest?.history?.at(-1);
  if (!h) return 'none';
  return `${h.task ? h.task + ' / ' : ''}${h.step} / ${h.actor} — ${h.did}`;
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
    const m = fs.readFileSync(file, 'utf8').match(/^\|\s*(?:Purpose|목적)\s*\|\s*(.+?)\s*\|\s*$/m);
    return m ? m[1] : '';
  } catch {
    return '';
  }
}

export function where(projectDir) {
  const local = path.join(projectDir, 'pipeline');
  const user = userLayer();
  const manifest = readManifest(projectDir);
  const out = [
    `pipeline repository P = ${PIPELINE}`,
    `template root E       = ${TEMPLATE}`,
    `project root          = ${projectDir}`,
    `project layer L       = ${fs.existsSync(local) ? local : '(none)'}`,
    `user layer U          = ${user}${fs.existsSync(user) ? '' : '  (empty — created on first write)'}`,
    '',
  ];
  if (!manifest) {
    out.push('There is no ledger log/manifest.json — this folder is not prepared yet. Run /zab:setup first.');
    return out.join('\n');
  }
  if (isLegacy(manifest)) {
    out.push(LEGACY_NOTICE);
    return out.join('\n');
  }
  out.push('Pipeline definitions (P = plugin, U = yours, across projects, L = this project):');
  for (const [tag, base] of [['P', PIPELINE], ['U', user], ['L', local]]) {
    for (const n of names(path.join(base, 'z', 'pipelines'), { files: true })) {
      out.push(`  [${tag}] ${n} — ${purpose(path.join(base, 'z', 'pipelines', n + '.md'))}`);
    }
  }
  out.push('', 'Tracks:');
  for (const role of ['a', 'b']) {
    const p = names(path.join(PIPELINE, role, 'tracks'), {});
    const u = names(path.join(user, role, 'tracks'), {});
    const l = names(path.join(local, role, 'tracks'), {});
    out.push(`  ${role}/ P: ${p.join(' · ') || 'none'} / U: ${u.join(' · ') || 'none'} / L: ${l.join(' · ') || 'none'}`);
  }
  out.push('', 'Task board =', ...taskBoard(manifest), `last record = ${lastRecord(manifest)}`);
  const edits = directEdits(projectDir);
  if (edits.length) {
    out.push('', `Direct edits by Z to A's files (${DIRECT_LOG}) — recorded by the hook. Show this list to the user verbatim at the next ★:`);
    for (const e of edits.slice(-20)) out.push(`  ${e.at} ${e.file} (${(e.active ?? []).join(', ') || 'no Task'})`);
  }
  return out.join('\n');
}

export function banner(projectDir) {
  const manifest = readManifest(projectDir);
  // Stay silent anywhere that is not a zab project — including folders that
  // happen to keep some other log/manifest.json.
  if (manifest?._meta?.pipeline_repo !== 'plugin:zab') return null;
  const project = manifest._meta?.project || path.basename(projectDir);
  if (isLegacy(manifest)) {
    return {
      systemMessage: `workspace = ${project} (zab)\n\n${LEGACY_NOTICE}`,
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: LEGACY_NOTICE },
    };
  }
  const board = ['Task board =', ...taskBoard(manifest), `last record = ${lastRecord(manifest)}`].join('\n');
  const human = [
    `workspace = ${project} (zab)`,
    '',
    board,
    '',
    'start = /zab:design (spec · criteria · design) → /zab:build (build · verify · accept) / ordinary questions are fine too',
  ].join('\n');
  const model = [
    'This folder is a zab project (the Z·A·B pipeline).',
    `pipeline repository P = ${PIPELINE}`,
    `template root E = ${TEMPLATE}`,
    `user layer U = ${userLayer()}`,
    `project root = ${projectDir}`,
    board,
    'Until the user runs /zab:design or /zab:build, do not open a Task or call a role. Answer ordinary questions as usual.',
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
// two folders this plugin ships and the user layer, which holds the same kind
// of document. For anything else it says nothing at all and
// the normal permission flow decides.
export function allowRead(event, bases = [PIPELINE, TEMPLATE, userLayer()], platform = process.platform) {
  const name = event?.tool_name;
  const input = event?.tool_input ?? {};
  const target = name === 'Read' ? input.file_path : name === 'Grep' || name === 'Glob' ? input.path : null;
  if (!bases.some((b) => inside(target, b, platform))) return null;
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      permissionDecisionReason: "zab: the plugin's own pipeline documents (read-only)",
    },
  };
}

// ── ownership ───────────────────────────────────────────────────────────────
//
// "One file has one owner" is the one rule of the method a machine can check
// without reading anyone's mind: who is writing, and where. Everything else —
// the ★ stops, the cap on what B is told — stays a document.

export const PLUGIN = 'zab';

// Only this plugin's own agents carry a role. A bare `a`, or another plugin's
// `x:a`, is a stranger: an unrecognised near-miss must never be read as B.
export function roleOf(agentType) {
  if (!agentType) return 'Z'; // the main session
  if (agentType === `${PLUGIN}:a`) return 'A';
  if (agentType === `${PLUGIN}:b`) return 'B';
  return 'other';
}

// An empty-folder marker is structure, not text: anyone may set it up
// (a/common-rules.md §1.2, plugin-operation.md §7).
const isMarker = (rel) => /(^|\/)\.gitkeep$/.test(rel);

// Whose file is this? `rel` is relative to the project root, forward slashes.
export function classify(rel) {
  if (/^pipeline\/b\//.test(rel)) return isMarker(rel) ? null : 'B';
  if (/^output\//.test(rel)) return /\/tmp\//.test(rel) ? null : 'A';
  if (['log/manifest.json', 'log/run-log.md', 'log/decisions.md', 'project-map.md'].includes(rel)) return 'Z';
  const m = /^log\/T\d+_[^/]+\/(.+)$/.exec(rel);
  if (!m) return null;
  const inRoom = m[1];
  if (inRoom === 'criteria.md' || inRoom.startsWith('verification-summary/') || /^observations\/B[^/]*\//.test(inRoom)) return 'B';
  if (inRoom === 'design-spec.md' || inRoom.startsWith('build-summary/') || /^observations\/A[^/]*\//.test(inRoom)) return 'A';
  if (inRoom.startsWith('assignments/') || inRoom.startsWith('calls/')) return 'Z';
  return null;
}

const isMode1 = (t) => String(t?.mode ?? '').includes('1');
const isActive = (t) => !['done', 'stopped'].includes(t?.status);

// In mode 1 a person opens A and B as ordinary sessions, which are
// indistinguishable from Z here, so those Tasks are left alone.
function mode1Applies(rel, manifest) {
  const tasks = manifest?.tasks ?? {};
  const id = /^log\/(T\d+)_/.exec(rel)?.[1];
  if (id) return isMode1(tasks[id]);
  return Object.values(tasks).some((t) => isActive(t) && isMode1(t));
}

function hasActiveMode2(rel, manifest) {
  const tasks = manifest?.tasks ?? {};
  const id = /^log\/(T\d+)_/.exec(rel)?.[1];
  const pool = id ? [tasks[id]].filter(Boolean) : Object.values(tasks);
  return pool.some((t) => isActive(t) && !isMode1(t));
}

// → null (say nothing) | { action: 'deny', reason } | { action: 'log' }
export function decideWrite({ role, rel, manifest }) {
  const owner = classify(rel);
  if (!owner || owner === role) return null;
  const deny = (reason) => ({ action: 'deny', reason });

  if (owner === 'B') {
    if ((role === 'Z' || role === 'other') && mode1Applies(rel, manifest)) return null;
    return deny(`zab: ${rel} belongs to the verifier (B). Only B writes criteria and verdicts — if something needs changing, tell the user and have it revised by a fresh B call.`);
  }
  if (owner === 'Z') {
    if (role === 'A' || role === 'B') {
      return deny(`zab: ${rel} belongs to the orchestrator (Z). Only Z writes the ledger, the shared logs, assignments and calls — put what you need to record in your own summary file.`);
    }
    return null;
  }
  // owner === 'A'
  if (role === 'B') {
    return deny(`zab: ${rel} belongs to the builder (A). The verifier does not fix deliverables — write what must be fixed, and how, in your report.`);
  }
  if (role === 'Z' && hasActiveMode2(rel, manifest)) return { action: 'log' };
  return null;
}

// Walk up from the file to the folder that holds this plugin's ledger.
function projectOf(file) {
  let dir = path.dirname(path.resolve(file));
  for (;;) {
    const m = readManifest(dir);
    if (m?._meta?.pipeline_repo === `plugin:${PLUGIN}`) return { dir, manifest: m };
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

export const DIRECT_LOG = 'log/direct-edits.jsonl';

export function own(event, now = new Date()) {
  const input = event?.tool_input ?? {};
  const file = input.file_path ?? input.notebook_path;
  if (typeof file !== 'string' || !file) return null;
  const abs = process.platform === 'win32' ? file.replace(/^\/([a-zA-Z])\//, '$1:/') : file;
  if (inside(abs, userLayer())) return ownUser(event, abs);
  const project = projectOf(abs);
  if (!project) return null;
  const rel = rel_(project.dir, abs);
  const decision = decideWrite({ role: roleOf(event.agent_type), rel, manifest: project.manifest });
  if (!decision) return null;
  if (decision.action === 'log') {
    const active = Object.entries(project.manifest.tasks ?? {})
      .filter(([, t]) => isActive(t))
      .map(([id, t]) => `${id} ${t.current_step ?? ''}`.trim());
    const line = JSON.stringify({ at: now.toISOString(), file: rel, tool: event.tool_name, active });
    fs.appendFileSync(path.join(project.dir, DIRECT_LOG), line + '\n');
    return null;
  }
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: decision.reason,
    },
  };
}

const rel_ = (base, p) => path.relative(base, path.resolve(p)).split(path.sep).join('/');

// The user layer sits outside every project, so a write there is a permission
// prompt — and a subagent cannot answer one. For a session working in a zab
// project this answers it: B's folder for B alone, the rest for the three
// roles. Anyone else, and any other folder, gets no answer from here.
export function decideUserWrite({ role, rel, manifest }) {
  const owner = /^b\//.test(rel) && !isMarker(rel) ? 'B' : null;
  if (owner === 'B' && role !== 'B') {
    // Mode 1: B is an ordinary session, indistinguishable from Z.
    if ((role === 'Z' || role === 'other') && mode1Applies(rel, manifest)) return role === 'Z' ? { action: 'allow' } : null;
    return { action: 'deny', reason: `zab: ${rel} in the user layer belongs to the verifier (B). Only B writes under b/ — if something needs changing, tell the user and have it revised by a fresh B call.` };
  }
  if (!manifest || role === 'other') return null;
  return { action: 'allow' };
}

function ownUser(event, abs) {
  const rel = rel_(userLayer(), abs);
  const here = typeof event.cwd === 'string' && event.cwd ? projectOf(path.join(event.cwd, 'x')) : null;
  const decision = decideUserWrite({ role: roleOf(event.agent_type), rel, manifest: here?.manifest ?? null });
  if (!decision) return null;
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision.action,
      permissionDecisionReason: decision.reason ?? "zab: the user's own pipeline layer",
    },
  };
}

export function directEdits(projectDir) {
  try {
    return fs
      .readFileSync(path.join(projectDir, DIRECT_LOG), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

// ── migrate ─────────────────────────────────────────────────────────────────
//
// v0.1 shipped Korean file names and Korean ledger keys. This renames what a
// project of that release holds to the names the documents use now. It renames
// and rewrites the ledger; it never overwrites, and it does not touch the text
// inside the records — those are history, written in the words of their day.

export const LEGACY_NOTICE =
  'This project was made by the Korean release of zab (Korean file names and ledger keys). ' +
  'This version reads the English layout only. Run /zab:migrate to see what would be renamed, ' +
  'then /zab:migrate apply. Until then do not open a Task or call a role.';

export function isLegacy(manifest) {
  if (!manifest || typeof manifest !== 'object') return false;
  if ('_주의' in manifest) return true;
  return Object.values(manifest.tasks ?? {}).some((t) => t && typeof t === 'object' && ('상태' in t || '모드' in t || '이름' in t));
}

// Names that mean the same thing wherever they appear under log/ or pipeline/.
const SEGMENTS = {
  '프로젝트지도.md': 'project-map.md',
  '실행로그.md': 'run-log.md',
  'AI 논의사항.md': 'decisions.md',
  '직접수정.jsonl': 'direct-edits.jsonl',
  '검증기준.md': 'criteria.md',
  '검증기준_레이아웃.md': 'criteria-layout.md',
  '검증기준_출력.md': 'criteria-output.md',
  '검증기준_공통.md': 'common-criteria.md',
  '설계명세.md': 'design-spec.md',
  '구현요약': 'build-summary',
  '검증요약': 'verification-summary',
  '관찰': 'observations',
  '제출본': 'submitted',
  '배정': 'assignments',
  '호출': 'calls',
  '갈래별': 'tracks',
  '개선이력': 'improvements',
  '규칙.md': 'rules.md',
  '공통규칙.md': 'common-rules.md',
  '부팅.md': 'boot.md',
  '참고자료': 'references',
};
// The four shipped pipelines, renamed only where the name is an id: a
// definition file under pipelines/ or a track folder under tracks/. A Task
// room called T1_회로분석 keeps its name — that one is the user's.
const PIPELINE_IDS = { 범용: 'general', 회로분석: 'circuit-analysis', 엑셀작업: 'spreadsheet', 파이프라인신설: 'new-pipeline' };

export function mapPath(p) {
  if (typeof p !== 'string' || p === '') return p;
  const out = [];
  for (const seg of p.split('/')) {
    const prev = out.at(-1);
    let next = SEGMENTS[seg] ?? seg;
    if (prev === 'pipelines' && seg.endsWith('.md') && PIPELINE_IDS[seg.slice(0, -3)]) next = PIPELINE_IDS[seg.slice(0, -3)] + '.md';
    if (prev === 'tracks' && PIPELINE_IDS[seg]) next = PIPELINE_IDS[seg];
    out.push(next);
  }
  return out.join('/');
}

const KEYS = {
  이름: 'name', 방: 'room', 파이프라인: 'pipeline', 모드: 'mode', 상태: 'status', 의존: 'depends_on',
  현재_단계: 'current_step', 맡은_범위: 'scope', 전용_파일: 'owned_files', 산출물: 'outputs',
  확인지점: 'checkpoints', 단계: 'step', 확인_대상: 'reviewed', 결과: 'result', 일자: 'date',
  사용자_말: 'user_words', 판정: 'verdict', 종합자: 'synthesizer', 보고서: 'reports',
  시작: 'started', 종료: 'ended', 담당: 'actor', 한_일: 'did', 시각: 'at', 파일: 'files', 메모: 'note',
};
const STATUS = { 대기: 'pending', 진행중: 'in_progress', 사람확인대기: 'awaiting_human', 완료: 'done', 중단: 'stopped' };
const MODE = { 모드1: 'mode1', 모드2: 'mode2' };
const RESULT = { 승인: 'approved', 수정요청: 'changes_requested', 보류: 'hold' };
const PATH_KEYS = new Set(['room', 'pipeline', 'owned_files', 'outputs', 'reviewed', 'reports', 'files']);
const STARS = { '사양 확정': 'Spec confirmation', '기준 승인': 'Criteria approval', '설계 승인': 'Design approval', '구현 확인': 'Build review', '최종 수락': 'Final acceptance' };
const stepOf = (v) =>
  typeof v === 'string'
    ? v.replace(/(\d+)\s*단계/g, 'step $1').replace(/★\s*(사양 확정|기준 승인|설계 승인|구현 확인|최종 수락)/g, (_, n) => '★ ' + STARS[n])
    : v;
const deep = (v, fn) => (Array.isArray(v) ? v.map((x) => deep(x, fn)) : fn(v));

// Keys are renamed everywhere; values only where the value is one of the
// method's own words. What a person said and what was done stay as written.
function convert(node, parent) {
  if (Array.isArray(node)) return node.map((x) => convert(x, parent));
  if (!node || typeof node !== 'object') return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    const key = KEYS[k] ?? k;
    let val = convert(v, key);
    if (key === 'status') val = STATUS[val] ?? val;
    else if (key === 'mode') val = MODE[val] ?? val;
    else if (key === 'result' && parent === 'checkpoints') val = RESULT[val] ?? val;
    else if (key === 'current_step' || key === 'step') val = stepOf(val);
    else if (key === 'synthesizer' || key === 'id') val = val === 'B종합' ? 'B-synth' : val;
    else if (PATH_KEYS.has(key)) val = deep(val, mapPath);
    out[key] = val;
  }
  return out;
}

export function migrateManifest(old, template) {
  const m = { _meta: old._meta, _notes: template._notes, _schema: template._schema };
  m.tasks = convert(old.tasks ?? {}, 'tasks');
  m.history = convert(old.history ?? [], 'history');
  for (const [k, v] of Object.entries(old)) if (!(k in m) && k !== '_주의') m[k] = v;
  return m;
}

function listFiles(dir, base = dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) listFiles(full, base, out);
    else out.push(rel(base, full));
  }
  return out;
}

const BACKUP = 'log/manifest.ko.json';

// → { legacy, moves: [[from, to]], conflicts: [[from, to]], ledger } — applied only when `apply`.
export function migrate(projectDir, { apply = false } = {}) {
  const manifest = readManifest(projectDir);
  if (manifest?._meta?.pipeline_repo !== `plugin:${PLUGIN}`) return { legacy: false, notProject: true, moves: [], conflicts: [] };
  const files = [
    ...listFiles(path.join(projectDir, 'log'), projectDir),
    ...listFiles(path.join(projectDir, 'pipeline'), projectDir),
    ...(fs.existsSync(path.join(projectDir, '프로젝트지도.md')) ? ['프로젝트지도.md'] : []),
  ];
  const moves = [];
  const conflicts = [];
  const taken = new Set(files);
  for (const from of files) {
    const to = mapPath(from);
    if (to === from) continue;
    if (taken.has(to)) conflicts.push([from, to]);
    else {
      moves.push([from, to]);
      taken.add(to);
    }
  }
  const legacy = isLegacy(manifest);
  const result = { legacy, moves, conflicts, ledger: legacy, backup: BACKUP };
  if (!apply) return result;

  // The ledger first, from the copy in memory: its own path does not change.
  if (legacy) {
    const backup = path.join(projectDir, BACKUP);
    if (!fs.existsSync(backup)) fs.copyFileSync(path.join(projectDir, 'log', 'manifest.json'), backup);
    const template = JSON.parse(fs.readFileSync(path.join(TEMPLATE, 'log', 'manifest.json'), 'utf8'));
    const next = migrateManifest(manifest, template);
    fs.writeFileSync(path.join(projectDir, 'log', 'manifest.json'), JSON.stringify(next, null, 2) + '\n');
  }
  const dirs = new Set();
  for (const [from, to] of moves) {
    const src = path.join(projectDir, from);
    const dest = path.join(projectDir, to);
    if (fs.existsSync(dest)) {
      conflicts.push([from, to]);
      continue;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(src, dest);
    for (let d = path.dirname(src); d.length > projectDir.length; d = path.dirname(d)) dirs.add(d);
  }
  // Folders the renames emptied, deepest first. A folder with anything left in it stays.
  for (const d of [...dirs].sort((a, b) => b.length - a.length)) {
    try {
      fs.rmdirSync(d);
    } catch {}
  }
  // The hook's own log uses ledger-style keys too.
  const direct = path.join(projectDir, DIRECT_LOG);
  if (fs.existsSync(direct)) {
    const lines = fs.readFileSync(direct, 'utf8').split('\n').filter(Boolean).map((l) => {
      try {
        const e = JSON.parse(l);
        if (!('시각' in e)) return l;
        return JSON.stringify({ at: e['시각'], file: mapPath(e['파일']), tool: e['도구'], active: (e['진행중'] ?? []).map(stepOf) });
      } catch {
        return l;
      }
    });
    fs.writeFileSync(direct, lines.join('\n') + '\n');
  }
  return result;
}

export function migrateReport(r, apply) {
  if (r.notProject) return 'This folder is not a zab project (no log/manifest.json that says plugin:zab). Nothing to migrate.';
  if (!r.legacy && r.moves.length === 0 && r.conflicts.length === 0) return 'Already on the English layout. Nothing to migrate.';
  const out = [apply ? 'Migrated to the English layout.' : 'Dry run — nothing was changed. Run with "apply" to do it.', ''];
  if (r.ledger) out.push(`${apply ? 'rewrote' : 'would rewrite'} log/manifest.json — keys and the method's own values to English; the old file is kept as ${r.backup}`);
  out.push(`${apply ? 'renamed' : 'would rename'} (${r.moves.length}):`, ...r.moves.map(([a, b]) => `  ${a} → ${b}`));
  if (r.conflicts.length) out.push('', `left alone, because the English name already exists (${r.conflicts.length}):`, ...r.conflicts.map(([a, b]) => `  ${a} (→ ${b})`));
  out.push(
    '',
    'Not changed: the text inside the records (they still cite the old names), Task room names, file names inside',
    'build-summary/ and verification-summary/, input/ and output/, and CLAUDE.md — the current form of that is in the template root.',
  );
  return out.join('\n');
}

// Size and SHA-256 of every file in the named layers. A role's shell is confined
// to the project folder, so it cannot hash the plugin's documents or the user
// layer itself; this prints them from where the session already stands. It only
// reads. `which` is any of the letters P E U L; the default is all four.
export function fingerprint(projectDir, which = []) {
  const roots = { P: PIPELINE, E: TEMPLATE, U: userLayer(), L: path.join(projectDir, 'pipeline') };
  const want = which.length ? which.map((w) => String(w).toUpperCase()).filter((w) => roots[w]) : Object.keys(roots);
  const out = [];
  for (const k of want) {
    const root = roots[k];
    out.push(`# ${k} = ${root}`);
    if (!fs.existsSync(root)) { out.push('# (does not exist)'); continue; }
    const files = listFiles(root).sort();
    if (!files.length) out.push('# (no files)');
    for (const r of files) {
      const buf = fs.readFileSync(path.join(root, r));
      out.push([k, r, buf.length, crypto.createHash('sha256').update(buf).digest('hex')].join('\t'));
    }
  }
  return out.join('\n');
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
  if (mode === 'own') {
    // Fail open: a bug here must not stop anyone writing a file.
    try {
      const out = own(JSON.parse(fs.readFileSync(0, 'utf8')));
      if (out) process.stdout.write(JSON.stringify(out));
    } catch {}
    return;
  }
  if (mode === 'setup') {
    const { created, kept } = setup(cwd);
    console.log(`project root = ${cwd}`);
    console.log(created.length ? `created (${created.length}):\n${created.map((r) => '  + ' + r).join('\n')}` : 'nothing new created');
    if (kept.length) console.log(`already there, left as is (${kept.length}):\n${kept.map((r) => '  = ' + r).join('\n')}`);
    return;
  }
  if (mode === 'migrate') {
    const apply = process.argv[3] === 'apply';
    console.log(migrateReport(migrate(cwd, { apply }), apply));
    return;
  }
  if (mode === 'fingerprint') {
    console.log(fingerprint(cwd, process.argv.slice(3)));
    return;
  }
  if (mode === 'where') {
    console.log(where(cwd));
    return;
  }
  console.error('usage: zab.mjs setup | where | migrate [apply] | fingerprint [P E U L] | banner | allow-read | own');
  process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
