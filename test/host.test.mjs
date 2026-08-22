// Which host we are on, and what we tell the human to type there.
//
// None of this reaches a gate decision — it is display text. It is tested anyway
// because the failure is the kind this project keeps getting caught by: silent.
// A deny message that names `/il:approve` on Codex tells the human to type a
// command that does not exist, they type it, nothing happens, and the conclusion
// they draw is that the gate is broken rather than that it is doing its job.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectHost, spellingsFor, parseIlDirective } from '../hooks/il.mjs';

// ── detection ─────────────────────────────────────────────────────────────

const CODEX_ROOT = 'C:\\Users\\me\\.codex\\plugins\\cache\\interlocking\\il\\0.1.0';
const CLAUDE_ROOT = 'C:\\Users\\me\\.claude\\plugins\\cache\\interlocking\\il';

test('the plugin root under ~/.codex/ identifies Codex', () => {
  assert.equal(detectHost({}, { CLAUDE_PLUGIN_ROOT: CODEX_ROOT }), 'codex');
});

test('a transcript under ~/.codex/ identifies Codex', () => {
  assert.equal(
    detectHost({ transcript_path: 'C:\\Users\\me\\.codex\\sessions\\2026\\r.jsonl' }, {}),
    'codex'
  );
});

test('CLAUDECODE identifies Claude Code', () => {
  assert.equal(detectHost({}, { CLAUDECODE: '1', CLAUDE_PLUGIN_ROOT: CLAUDE_ROOT }), 'claude');
});

// Codex sets CLAUDE_PLUGIN_ROOT and CLAUDE_PLUGIN_DATA itself (measured — see
// docs/design/platform-facts.md), so the variable NAMES prove nothing. And a
// Codex session started from a Claude Code terminal inherits CLAUDECODE=1 from
// the parent shell. The specific evidence has to beat the inherited evidence.
test('a Codex session launched from a Claude Code terminal is still Codex', () => {
  const host = detectHost(
    { transcript_path: 'C:\\Users\\me\\.codex\\sessions\\r.jsonl' },
    { CLAUDECODE: '1', CLAUDE_CODE_ENTRYPOINT: 'cli', CLAUDE_PLUGIN_ROOT: CODEX_ROOT }
  );
  assert.equal(host, 'codex');
});

test('no evidence either way is reported as unknown, not guessed', () => {
  assert.equal(detectHost({}, {}), 'unknown');
});

test('a path merely containing the word codex is not enough', () => {
  assert.equal(detectHost({}, { CLAUDE_PLUGIN_ROOT: 'C:\\src\\codex-tools\\plugin' }), 'unknown');
});

// ── the spelling tables ───────────────────────────────────────────────────

test('both hosts spell exactly the same set of actions', () => {
  const claude = Object.keys(spellingsFor('claude')).sort();
  const codex = Object.keys(spellingsFor('codex')).sort();
  assert.deepEqual(codex, claude, 'one host is missing an entry the other has');
});

test('an unknown host falls back to Claude Code spellings', () => {
  assert.deepEqual(spellingsFor('unknown'), spellingsFor('claude'));
  assert.deepEqual(spellingsFor(undefined), spellingsFor('claude'));
});

// ── the three strings a human types by hand ───────────────────────────────
//
// These are the only spellings where being wrong changes an outcome rather than
// a reader's impression. Whatever we print, the directive parser has to accept.

const HUMAN = ['approve', 'approve-despite', 'override', 'policy'];

for (const host of ['claude', 'codex']) {
  for (const action of HUMAN) {
    test(`${host}: the printed "${action}" spelling is one the hook accepts`, () => {
      // What we print carries a placeholder where the human supplies a value.
      const typed = spellingsFor(host)[action].replace('<reason>', 'the build is on fire');
      const parsed = parseIlDirective(typed);
      assert.ok(parsed, `parseIlDirective refused the spelling we tell people to type: ${typed}`);
      const expected = action.startsWith('approve') ? 'approve' : action;
      assert.equal(parsed.kind, expected);
    });
  }
}

test('despite-review survives the spelling on both hosts', () => {
  for (const host of ['claude', 'codex']) {
    const parsed = parseIlDirective(spellingsFor(host)['approve-despite']);
    assert.equal(parsed.despiteReview, true, `${host} loses the despite-review flag`);
  }
});

test('an override still needs a reason on both hosts', () => {
  for (const host of ['claude', 'codex']) {
    const parsed = parseIlDirective(spellingsFor(host).override.replace('<reason>', 'hotfix'));
    assert.equal(parsed.reason, 'hotfix');
  }
});

// ── the model-facing entry points ─────────────────────────────────────────

test('no Codex spelling promises a slash command', () => {
  for (const [action, text] of Object.entries(spellingsFor('codex'))) {
    assert.ok(!text.startsWith('/'), `${action} points at "${text}", which Codex has no way to run`);
  }
});

test('Codex onboarding points to the dedicated writable skill', () => {
  assert.equal(spellingsFor('codex').onboard, '$il-onboard');
  assert.notEqual(spellingsFor('codex').onboard, '$il-console onboard');
});

test('every Claude Code spelling is a slash command or a bare directive', () => {
  for (const [action, text] of Object.entries(spellingsFor('claude'))) {
    assert.match(text, /^\/il:/, `${action} is spelled "${text}"`);
  }
});
