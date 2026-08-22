// hooks/hooks.json is read by BOTH hosts, and getting it wrong is silent.
//
// That is the whole reason this file exists. A hook whose command fails to start
// does not raise anything the user will see: Claude Code swallows it because of
// the `|| true`, and Codex logs "PreToolUse Failed" into a scrollback nobody
// reads and then runs the tool anyway. Either way the gate is simply gone, and
// every test in the suite still passes because they all call the handlers
// directly and never go through this file.
//
// The Windows split is the specific trap. Codex on Windows runs the hook through
// PowerShell, where `command -v node >/dev/null 2>&1 && …` is not a command, so
// the POSIX form that Claude Code needs is the exact form that disables the gate
// on the other host. `commandWindows` is what keeps both honest.
// (docs/design/platform-facts.md — Codex CLI 0.149.0, win32.)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG = JSON.parse(readFileSync(join(HERE, '..', 'hooks', 'hooks.json'), 'utf8'));

/** Every leaf handler, tagged with the event it hangs off. */
function handlers() {
  const out = [];
  for (const [event, groups] of Object.entries(CONFIG.hooks)) {
    for (const group of groups) {
      for (const h of group.hooks) out.push({ event, matcher: group.matcher ?? null, ...h });
    }
  }
  return out;
}

const HANDLERS = handlers();

/** The modes il.mjs dispatches on when invoked by a hook event. */
const HOOK_MODES = new Set(['session-start', 'prompt', 'pre-write', 'pre-bash', 'pre-mcp']);

const modeOf = (command) => {
  const m = /il\.mjs"?\s+([a-z-]+)/.exec(command);
  return m ? m[1] : null;
};

test('there is at least one handler per event we rely on', () => {
  const events = new Set(HANDLERS.map((h) => h.event));
  for (const e of ['SessionStart', 'UserPromptSubmit', 'PreToolUse']) {
    assert.ok(events.has(e), `no handler for ${e}`);
  }
});

for (const h of HANDLERS) {
  const label = `${h.event}${h.matcher ? ` [${h.matcher}]` : ''}`;

  test(`${label}: has a Windows form as well as a POSIX one`, () => {
    assert.equal(typeof h.command, 'string', 'missing command');
    assert.equal(
      typeof h.commandWindows,
      'string',
      'missing commandWindows — on Codex/Windows this hook would fail open and the gate would be gone'
    );
  });

  test(`${label}: both forms invoke the same il.mjs mode`, () => {
    const posix = modeOf(h.command);
    const win = modeOf(h.commandWindows);
    assert.ok(posix, `no il.mjs mode in: ${h.command}`);
    assert.equal(win, posix, 'the two shells would run different modes');
    assert.ok(HOOK_MODES.has(posix), `${posix} is not a hook-event mode`);
  });

  test(`${label}: the Windows form is free of POSIX-only syntax`, () => {
    for (const bad of ['/dev/null', '2>&1', '&&', '||', 'command -v']) {
      assert.ok(
        !h.commandWindows.includes(bad),
        `PowerShell cannot run "${bad}" — this is the failure that leaves the gate off on Windows`
      );
    }
  });

  test(`${label}: both forms resolve the plugin root rather than guessing`, () => {
    for (const c of [h.command, h.commandWindows]) {
      assert.ok(
        c.includes('${CLAUDE_PLUGIN_ROOT}'),
        'a relative path would resolve against the project, not the plugin'
      );
    }
  });

  test(`${label}: has a timeout, so a wedged hook cannot hang the session`, () => {
    assert.equal(typeof h.timeout, 'number');
    assert.ok(h.timeout > 0 && h.timeout <= 60, `implausible timeout: ${h.timeout}`);
  });
}

// ── the matcher has to name both hosts' write tools ───────────────────────
//
// Claude Code and Codex share nothing here: Codex has no Edit/Write/MultiEdit,
// and Claude Code has no apply_patch. A matcher that names only one host's tools
// still passes every other test in this suite while gating nothing on the other.

test('the write matcher covers both hosts', () => {
  const matchers = HANDLERS.filter((h) => h.event === 'PreToolUse').map((h) => h.matcher ?? '');
  const covers = (tool) => matchers.some((m) => new RegExp(m).test(tool));

  for (const tool of ['Edit', 'Write', 'MultiEdit', 'NotebookEdit']) {
    assert.ok(covers(tool), `Claude Code's ${tool} is not matched`);
  }
  assert.ok(covers('apply_patch'), "Codex's apply_patch is not matched — the gate would be off there");
  assert.ok(covers('Bash'), 'Bash is not matched');
});

test('every write-tool match routes to pre-write, and Bash to pre-bash', () => {
  const routeFor = (tool) => {
    const h = HANDLERS.find((x) => x.event === 'PreToolUse' && new RegExp(x.matcher ?? '').test(tool));
    return h ? modeOf(h.command) : null;
  };
  for (const tool of ['Edit', 'Write', 'MultiEdit', 'NotebookEdit', 'apply_patch']) {
    assert.equal(routeFor(tool), 'pre-write', `${tool} must reach pre-write`);
  }
  assert.equal(routeFor('Bash'), 'pre-bash');
});
