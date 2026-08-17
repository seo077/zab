// The shipped templates and the hook's parsers are coupled: SPEC.md's markers,
// its "Acceptance:" convention and its section headings are all things
// checkRequirements() looks for, and STATE.md's frontmatter is a subset
// parseFrontmatter() can read.
//
// Nothing enforces that coupling at runtime, so a change to either side would
// ship a harness that refuses every spec it generated itself. These tests are
// the only thing standing between that and a release.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkRequirements, parseFrontmatter, normativeRegion, normalizeText, DEFAULT_POLICY } from '../hooks/il.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const tpl = (name) => readFileSync(join(ROOT, 'templates', name), 'utf8');

test('SPEC.md carries the markers the approval hash binds to', () => {
  const s = tpl('SPEC.md');
  assert.match(s, /<!--\s*il:normative:begin\s*-->/);
  assert.match(s, /<!--\s*il:normative:end\s*-->/);
  assert.notEqual(normativeRegion(s), s, 'the markers must actually delimit something');
});

test('SPEC.md puts requirements, threats and assumptions INSIDE the binding region', () => {
  const region = normativeRegion(tpl('SPEC.md'));
  assert.match(region, /## Requirements/);
  assert.match(region, /## Threat model/);
  assert.match(region, /## Assumptions/);
  // Background and research are prose: editable without costing a re-approval.
  assert.doesNotMatch(region, /## Background/);
  assert.doesNotMatch(region, /## Research/);
});

test('SPEC.md teaches the exact conventions the checker requires', () => {
  const s = tpl('SPEC.md');
  assert.match(s, /REQ-001/, 'REQ id form');
  assert.match(s, /Acceptance:/, 'the acceptance keyword checkRequirements looks for');
  assert.match(s, /ASM-001/, 'assumption id form');
  assert.match(s, /declined to answer/, 'the avoided-answer wording the checker flags');
});

test('a spec written from the template passes its own gate', () => {
  // The end-to-end coupling: fill the placeholders the way the template tells you
  // to, and G0 must accept it. If this fails, the harness rejects its own output.
  const filled = tpl('SPEC.md')
    .replace('REQ-001 <what the system does, in one sentence>', 'REQ-001 The user can log in with email and password.')
    .replace(
      '  Acceptance: <the command to run, or the observable fact, with numbers and units>',
      '  Acceptance: POST /login with valid credentials returns 200; run `npm test -- login`.'
    )
    .replace('REQ-002 <...>', 'REQ-002 A session expires after 30 minutes of inactivity.')
    .replace('  Acceptance: <...>', '  Acceptance: a request 31 minutes later returns 401.')
    .replace(
      '| <what an attacker wants> | <how they get it> | <what stops them> | REQ-### |',
      '| session cookie | XSS theft | HttpOnly + Secure | REQ-003 |'
    )
    .replace(
      'ASM-001 <the assumption> (user: explicitly agreed | declined to answer)',
      'ASM-001 Single-region deployment. (user: explicitly agreed)'
    );

  const blockers = checkRequirements(filled).filter((f) => f.severity === 'block');
  assert.deepEqual(blockers, [], `the template must not produce a spec its own gate refuses: ${JSON.stringify(blockers, null, 2)}`);
});

test('STATE.md frontmatter is readable by the parser that has to read it', () => {
  const { data, body } = parseFrontmatter(tpl('STATE.md'));
  for (const key of ['il_version', 'feature', 'phase', 'gates_passed', 'next_action', 'blocked_on', 'open_assumptions', 'head_commit']) {
    assert.ok(key in data, `STATE.md template is missing ${key}`);
  }
  assert.ok(Array.isArray(data.gates_passed), 'gates_passed must parse as a list');
  assert.ok(Array.isArray(data.open_assumptions), 'open_assumptions must parse as a list');
  assert.match(body, /## Resume brief/);
  assert.match(body, /## History/);
});

test('STATE.md stays inside the flat YAML subset it documents', () => {
  const fm = tpl('STATE.md').split(/\r?\n/);
  const close = fm.indexOf('---', 1);
  for (const line of fm.slice(1, close)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    assert.doesNotMatch(line, /^\s+\S/, `indented (nested) frontmatter is not supported: ${line}`);
  }
});

test('policy.json template is valid JSON and matches the shipped defaults', () => {
  const p = JSON.parse(tpl('policy.json'));
  assert.ok(Array.isArray(p.code));
  assert.ok(Array.isArray(p.always_allow));
  assert.equal(typeof p.gate?.enforce, 'boolean');
  assert.equal(typeof p.override?.max_minutes, 'number');
  assert.equal(typeof p.override?.max_edits, 'number');
  assert.equal(p.verifiers?.default?.name, 'il-verifier', 'must match the shipped agent name');
  // An empty template policy must behave exactly like no policy at all.
  assert.deepEqual(p.code, [...DEFAULT_POLICY.code]);
});

test('every template is normalization-stable, so a checkout cannot shift a hash', () => {
  for (const name of readdirSync(join(ROOT, 'templates'))) {
    if (!name.endsWith('.md')) continue;
    const text = tpl(name);
    assert.equal(normalizeText(text), normalizeText(text.replace(/\n/g, '\r\n')), `${name} is not CRLF-stable`);
  }
});

test('the agent named in policy.json actually ships', () => {
  const names = readdirSync(join(ROOT, 'agents')).map((f) => f.replace(/\.md$/, ''));
  assert.ok(names.includes('il-verifier'), `agents/ has ${names.join(', ')}`);
});

test('a command that runs a ! block declares permission to run it', () => {
  // Found by dogfooding, not by testing. A `!`cmd`` block whose command is not
  // permitted makes the WHOLE command silently do nothing: zero turns, empty
  // output, no error anywhere. Seven of nine commands shipped that way and every
  // unit test was green.
  const dir = join(ROOT, 'commands');
  for (const name of readdirSync(dir)) {
    const text = readFileSync(join(dir, name), 'utf8');
    const { data, body } = parseFrontmatter(text);
    const bang = /^\s*!`([^`]+)`/m.exec(body);
    if (!bang) continue;

    const allowed = data['allowed-tools'];
    assert.ok(
      allowed !== undefined && allowed !== '' && String(allowed) !== '[]',
      `commands/${name} runs \`${bang[1].slice(0, 40)}…\` but declares no allowed-tools — it will silently produce nothing`
    );
    assert.match(
      String(allowed),
      /Bash/,
      `commands/${name} runs a shell command, so allowed-tools must include Bash (got: ${allowed})`
    );
  }
});

test('every command referenced in a deny or approval message exists', () => {
  // These strings are shown to the model and to the human as instructions. An
  // unregistered slash command skips hooks entirely, so a message pointing at a
  // command that does not ship is worse than no message at all.
  const commands = readdirSync(join(ROOT, 'commands')).map((f) => f.replace(/\.md$/, ''));
  const hook = readFileSync(join(ROOT, 'hooks', 'il.mjs'), 'utf8');
  const referenced = new Set([...hook.matchAll(/\/il:([a-z-]+)/g)].map((m) => m[1]));
  for (const name of referenced) {
    assert.ok(commands.includes(name), `il.mjs tells users to run /il:${name}, but commands/${name}.md does not exist`);
  }
});
