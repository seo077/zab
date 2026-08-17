#!/usr/bin/env node
// Throwaway spike probe. Answers the 5 platform questions the design depends on:
//
//   Q1  Does UserPromptSubmit see the RAW typed text (slash commands included)?
//   Q2  Is `systemMessage` really invisible to the model, while additionalContext is visible?
//   Q3  Does PreToolUse `permissionDecision: "deny"` actually block a tool call?
//   Q4  Does SessionStart stdout/additionalContext reach the model's context?
//   Q5  Which env vars exist, and which shell runs hooks on this platform?
//
// It captures every payload to test/fixtures/events/ AND emits sentinels so the
// answers are observable from inside the session.
//
// MUST exit 0 on any internal failure — it runs on every tool call while installed.
// Delete this directory once docs/design/platform-facts.md is written.

import { appendFileSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'fixtures', 'events');

// Distinctive strings. Their presence/absence in the model's context IS the result.
const S = {
  ssCtx: 'IL_PROBE_SS_CTX_A7K2',
  upsCtx: 'IL_PROBE_UPS_CTX_B3N8',
  upsSys: 'IL_PROBE_UPS_SYSMSG_C9X4',
  denyReason: 'IL_PROBE_DENY_D5R1',
};

// Writing to a path containing this, or running a Bash command containing it,
// should be denied. That is the Q3 experiment.
const DENY_TOKEN = 'IL_DENY_PROBE';

const ENV_KEYS = [
  'CLAUDE_PLUGIN_ROOT',
  'CLAUDE_PLUGIN_DATA',
  'CLAUDE_PROJECT_DIR',
  'CLAUDE_SESSION_ID',
  'CLAUDE_SKILL_DIR',
  'CLAUDE_ENV_FILE',
];

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

function capture(label, raw, parsed, parseError) {
  const existing = readdirSync(OUT).filter((f) => f.startsWith(label + '-')).length;
  const env = {};
  for (const k of ENV_KEYS) env[k] = k in process.env ? process.env[k] : null;
  writeFileSync(
    join(OUT, `${label}-${String(existing).padStart(2, '0')}.json`),
    JSON.stringify(
      {
        captured_argv: process.argv.slice(2),
        env_present: env,
        shell: {
          platform: process.platform,
          shell: process.env.SHELL ?? null,
          comspec: process.env.ComSpec ?? null,
          msystem: process.env.MSYSTEM ?? null, // Git Bash sets this on Windows
          node: process.version,
          cwd: process.cwd(),
        },
        stdin_raw_length: raw.length,
        stdin_parse_error: parseError,
        stdin: parsed ?? raw,
      },
      null,
      2
    ) + '\n',
    'utf8'
  );
}

function emit(obj) {
  process.stdout.write(JSON.stringify(obj));
}

function writeTargets(input) {
  // Enough to spot the deny-probe token; the real classifier comes later.
  const ti = input?.tool_input ?? {};
  const paths = [ti.file_path, ti.notebook_path];
  if (Array.isArray(ti.edits)) for (const e of ti.edits) paths.push(e?.file_path);
  return paths.filter(Boolean);
}

let raw = '';
let parsed = null;
let parseError = null;

try {
  mkdirSync(OUT, { recursive: true });
  raw = await readStdin();
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    parseError = String(e && e.message);
  }

  const mode = process.argv[2] || 'unknown';
  const label = parsed?.hook_event_name || mode;
  capture(label, raw, parsed, parseError);

  if (mode === 'session-start') {
    // Q4: does this text land in the model's context?
    emit({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: `${S.ssCtx} — il probe active. SessionStart injection works if you can read this.`,
      },
    });
  } else if (mode === 'prompt') {
    // Q1 is answered by the captured fixture (does `prompt` hold the raw slash text?).
    // Q2 is answered by which of these two sentinels the model can quote back.
    emit({
      systemMessage: `${S.upsSys} — HUMAN-ONLY channel test. If the assistant can quote this string, systemMessage is NOT model-invisible.`,
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: `${S.upsCtx} — model-visible channel test.`,
      },
    });
  } else if (mode === 'pre-write') {
    // Q3: deny only the sentinel path, so normal work is unaffected.
    if (writeTargets(parsed).some((p) => String(p).includes(DENY_TOKEN))) {
      emit({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: `${S.denyReason} — blocked by il probe (path contains ${DENY_TOKEN}).`,
        },
      });
    }
  } else if (mode === 'pre-bash') {
    const cmd = String(parsed?.tool_input?.command ?? '');
    if (cmd.includes(DENY_TOKEN)) {
      emit({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: `${S.denyReason} — blocked by il probe (command contains ${DENY_TOKEN}).`,
        },
      });
    }
  }
} catch (err) {
  try {
    appendFileSync(join(HERE, 'probe-error.log'), `${new Date().toISOString()} ${err?.stack}\n`);
  } catch {}
}

process.exit(0);
