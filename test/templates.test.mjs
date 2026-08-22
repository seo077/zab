// The shipped templates and the hook's parsers are coupled: SPEC.md's markers
// and section headings are what checkRequirements() looks for, CRITERIA.md's
// "Judged:" convention is what parseCriteria() reads, REVIEW.md's "VERDICT:" line
// is what Gate 1 rules on, and STATE.md's frontmatter is a subset
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
import {
  checkRequirements,
  checkCriteria,
  parseCriteria,
  parseReview,
  parseFrontmatter,
  normativeRegion,
  normalizeText,
  composeDesignBrief,
  DEFAULT_POLICY,
} from '../hooks/il.mjs';

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

test('SPEC.md keeps Decisions OUTSIDE the binding region', () => {
  // Writing down why something was chosen must never cost a re-approval, or it
  // stops being written down.
  const s = tpl('SPEC.md');
  assert.match(s, /## Decisions/);
  assert.match(s, /DEC-001/, 'the id form composeDesignBrief parses');
  assert.doesNotMatch(normativeRegion(s), /## Decisions/);
});

test('the design brief reads the template back without showing its instructions', () => {
  // The template is mostly HTML comments telling the author what to write. If
  // those reached the approval screen, the human would be reading boilerplate
  // instead of the design — and every heading would look filled in.
  const brief = composeDesignBrief({ feature: '001-x', spec: tpl('SPEC.md') });
  assert.ok(brief.includes('DESIGN BRIEF'));
  assert.ok(!brief.includes('<!--'), 'a comment leaked into the brief');
  assert.ok(!brief.includes('il:normative'), 'the region markers are not content');
  assert.ok(!brief.includes('the id form'), 'no instructional prose from the template');
  assert.ok(!brief.includes('Cite sources'), 'no instructional prose from the template');
});

test('the labels the brief looks for are the labels the template teaches', () => {
  // The coupling that has bitten this project before: two sides of a parser
  // agreeing with their own tests and disagreeing with each other.
  const filled = tpl('SPEC.md')
    .replace('DEC-001 <what was settled, in one line>', 'DEC-001 Coordinates come from the PDF.')
    .replace('  Asked: <the question you put to them>', '  Asked: Where do coordinates come from?')
    .replace('  Answer: <what they said>', '  Answer: Always the PDF.')
    .replace('  Lands in: REQ-###, REQ-###', '  Lands in: REQ-001')
    .replace(
      'ASM-001 <the assumption> (user: explicitly agreed | declined to answer)',
      'ASM-001 One region only. (user: declined to answer)'
    )
    .replace('  Affects: REQ-###', '  Affects: REQ-001');
  const brief = composeDesignBrief({ feature: '001-x', spec: filled });
  assert.match(brief, /asked\s+Where do coordinates come from\?/, 'Asked: is parsed');
  assert.match(brief, /you\s+Always the PDF\./, 'Answer: is parsed');
  assert.match(brief, /lands\s+REQ-001/, 'Lands in: is parsed');
  assert.match(brief, /affects REQ-001/, 'Affects: is parsed');
  assert.ok(brief.includes('⚠ ASM-001'), '"declined to answer" must read as unconfirmed');
});

test('SPEC.md teaches the exact conventions the checker requires', () => {
  const s = tpl('SPEC.md');
  assert.match(s, /REQ-001/, 'REQ id form');
  assert.match(s, /ASM-001/, 'assumption id form');
  assert.match(s, /declined to answer/, 'the avoided-answer wording the checker flags');
});

test('SPEC.md no longer teaches the author to write their own criterion', () => {
  // The single change this whole separation rests on. A template that still shows
  // an "Acceptance:" line teaches the habit back into existence, and the spec
  // author is once again choosing the yardstick they will be measured against.
  const region = normativeRegion(tpl('SPEC.md'));
  const uncommented = region.replace(/<!--[\s\S]*?-->/g, '');
  assert.doesNotMatch(uncommented, /Acceptance\s*:/i);
});

test('CRITERIA.md carries the markers the approval hash binds to', () => {
  const c = tpl('CRITERIA.md');
  assert.match(c, /<!--\s*il:normative:begin\s*-->/);
  assert.match(c, /<!--\s*il:normative:end\s*-->/);
  assert.notEqual(normativeRegion(c), c, 'the markers must actually delimit something');
});

test('CRITERIA.md teaches the labels parseCriteria reads', () => {
  // The coupling that has bitten this project before: two sides of a parser
  // agreeing with their own tests and disagreeing with each other.
  const filled = tpl('CRITERIA.md')
    .replace('  Judged: <what would prove it, with numbers and units>', '  Judged: a request 31 minutes later returns 401.')
    .replace('  Method: <the command to run, or the file:line to point at>', '  Method: run `npm test -- expiry`');
  const parsed = parseCriteria(filled);
  assert.ok(parsed.has('REQ-001'), 'the REQ id form the parser keys on');
  assert.equal(parsed.get('REQ-001').judged, 'a request 31 minutes later returns 401.');
  assert.equal(parsed.get('REQ-001').method, 'run `npm test -- expiry`');
});

test('REVIEW.md teaches the two lines Gate 1 actually reads', () => {
  const r = parseReview(tpl('REVIEW.md'));
  assert.equal(r.verdict, 'NOT YET', 'the VERDICT line must be on its own line to be read');
  assert.ok(r.blockers.length > 0, 'the blockers section is where NOT YET is justified');
  // The template's hashes are placeholders, so they must NOT parse as real ones —
  // a template that accidentally bound to something would clear a gate it never read.
  assert.equal(r.specHash, null);
  assert.equal(r.criteriaHash, null);
});

test('a spec and criteria written from the templates pass their own gate', () => {
  // The end-to-end coupling: fill the placeholders the way the templates tell you
  // to, and G0 must accept the pair. If this fails, the harness rejects its own
  // output — and now there are two documents that have to agree, so the failure
  // mode is one template drifting from the other.
  const spec = tpl('SPEC.md')
    .replace('REQ-001 <what the system does, in one sentence>', 'REQ-001 The user can log in with email and password.')
    .replace('REQ-002 <...>', 'REQ-002 A session expires after 30 minutes of inactivity.')
    .replace(
      '| <what an attacker wants> | <how they get it> | <what stops them> | REQ-### |',
      '| session cookie | XSS theft | HttpOnly + Secure | REQ-003 |'
    )
    .replace(
      'ASM-001 <the assumption> (user: explicitly agreed | declined to answer)',
      'ASM-001 Single-region deployment. (user: explicitly agreed)'
    );

  const criteria = tpl('CRITERIA.md')
    .replace(
      '  Judged: <what would prove it, with numbers and units>',
      '  Judged: POST /login with valid credentials returns 200 and sets a session cookie.'
    )
    .replace('  Method: <the command to run, or the file:line to point at>', '  Method: run `npm test -- login`')
    .replace('  Judged: <...>', '  Judged: a request 31 minutes after the previous one returns 401.')
    .replace('  Method: <...>', '  Method: run `npm test -- expiry`');

  const blockers = [...checkRequirements(spec), ...checkCriteria(spec, criteria)].filter(
    (f) => f.severity === 'block'
  );
  assert.deepEqual(
    blockers,
    [],
    `the templates must not produce a pair their own gate refuses: ${JSON.stringify(blockers, null, 2)}`
  );
});

test('the two templates agree on which REQ ids exist', () => {
  // An orphan criterion or an uncriterioned REQ in the shipped templates would
  // ship a harness that blocks the first spec written from it.
  const specIds = [...normativeRegion(tpl('SPEC.md')).matchAll(/^REQ-\d+/gm)].map((m) => m[0]);
  const criteriaIds = [...parseCriteria(tpl('CRITERIA.md')).keys()];
  assert.deepEqual(criteriaIds.sort(), specIds.sort());
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

test('every agent the hook has a write rule for actually ships', () => {
  // A rule keyed on an agent_type nobody can spawn silently protects nothing.
  const names = readdirSync(join(ROOT, 'agents')).map((f) => f.replace(/\.md$/, ''));
  const hook = readFileSync(join(ROOT, 'hooks', 'il.mjs'), 'utf8');
  for (const m of hook.matchAll(/^const (?:VERIFIER|CRITIC)_AGENT = '([^']+)';$/gm)) {
    assert.ok(names.includes(m[1]), `il.mjs has a write rule for ${m[1]}, which agents/ does not ship`);
  }
});

test('every agent a skill tells you to launch actually ships', () => {
  const names = readdirSync(join(ROOT, 'agents')).map((f) => f.replace(/\.md$/, ''));
  for (const dir of readdirSync(join(ROOT, 'skills'))) {
    const text = readFileSync(join(ROOT, 'skills', dir, 'SKILL.md'), 'utf8');
    for (const m of text.matchAll(/`(il-[a-z-]+)`\s+subagent/g)) {
      assert.ok(names.includes(m[1]), `skills/${dir} launches ${m[1]}, which agents/ does not ship`);
    }
  }
});

test('every CLI mode a command file invokes is a mode the hook dispatches', () => {
  // A `!` block that runs an unknown mode produces nothing at all — no output,
  // no error, no turn. The command just silently does less than it says.
  const hook = readFileSync(join(ROOT, 'hooks', 'il.mjs'), 'utf8');
  const declared = /const CLI_MODES = new Set\(\[([^\]]+)\]\)/.exec(hook);
  assert.ok(declared, 'CLI_MODES must stay greppable');
  const modes = new Set([...declared[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));
  for (const name of readdirSync(join(ROOT, 'commands'))) {
    const text = readFileSync(join(ROOT, 'commands', name), 'utf8');
    for (const m of text.matchAll(/il\.mjs"\s+([a-z-]+)/g)) {
      assert.ok(modes.has(m[1]), `commands/${name} runs "il.mjs ${m[1]}", which is not a CLI mode`);
    }
  }
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
