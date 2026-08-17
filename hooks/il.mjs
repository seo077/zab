#!/usr/bin/env node
/**
 * interlocking — hook entry point.
 *
 * Single file, zero dependencies, ESM, node >= 18.
 * Invoked as: node il.mjs <session-start|prompt|pre-write|pre-bash|pre-mcp>
 *
 * Two rules govern everything in here:
 *
 *  1. NEVER brick the session. Any unexpected failure logs and exits 0 (allow).
 *     Exit codes other than 0 and 2 surface a visible error on *every* tool call,
 *     which is enough on its own to get the plugin uninstalled.
 *  2. Keep the hot path pure. `pre-*` runs on every matching tool call, so the
 *     decision logic is pure functions over strings and all I/O lives at the edges.
 *     That is also what makes it testable.
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync, statSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

// ─────────────────────────────────────────────────────────────────────────────
// § paths — path classification
//
// classify() answers one question: is this path subject to the G0 gate?
// It is the most safety-critical function in the file. Both failure directions
// are fatal: over-blocking gets the plugin uninstalled, under-blocking makes the
// gate theater. See test/classify.test.mjs for the pinned answer table.
// ─────────────────────────────────────────────────────────────────────────────

/** Directory holding all harness artifacts. Writes here are never gated. */
export const HARNESS_DIR = '.interlocking';

/**
 * Files that must stay writable no matter what, so that planning is never blocked.
 * User policy can extend this list but cannot shrink it — a project that gates its
 * own README has broken the harness's core promise.
 */
const BUILTIN_ALWAYS_ALLOW = [
  'README*',
  'CHANGELOG*',
  'LICENSE*',
  'CONTRIBUTING*',
  'CODE_OF_CONDUCT*',
  'SECURITY*',
  'AUTHORS*',
  'NOTICE*',
  'docs/**',
  '**/*.md',
  '**/*.mdx',
  '.gitignore',
  '.gitattributes',
  '.editorconfig',
  '.vscode/**',
  '.idea/**',
];

/**
 * Test files are deliberately NOT gated. Writing a failing test to discover a
 * requirement is legitimate pre-spec exploration, and blocking it is the fastest
 * way to make the harness feel adversarial.
 */
const BUILTIN_TEST_PATTERNS = [
  '**/test/**',
  '**/tests/**',
  '**/__tests__/**',
  '**/spec/**',
  '**/test_*.*',
  '**/*_test.*',
  '**/*.test.*',
  '**/*.spec.*',
  '**/*_spec.*',
];

/**
 * Manifests ARE gated. Adding a dependency or changing a build pipeline is an
 * architectural decision — precisely the kind of thing a spec should cover.
 */
const BUILTIN_MANIFESTS = [
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'deno.json',
  'pyproject.toml',
  'setup.py',
  'setup.cfg',
  'Pipfile',
  'poetry.lock',
  'requirements*.txt',
  'Cargo.toml',
  'Cargo.lock',
  'go.mod',
  'go.sum',
  'pom.xml',
  'build.gradle*',
  'settings.gradle*',
  'Gemfile',
  'Gemfile.lock',
  'composer.json',
  'Dockerfile',
  'Dockerfile.*',
  'docker-compose*.yml',
  'docker-compose*.yaml',
  'Makefile',
  'CMakeLists.txt',
  '**/*.tf',
  '**/*.tfvars',
  '.github/workflows/**',
];

/** Extensions that mean "this is source". Matched case-insensitively. */
const BUILTIN_CODE_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'mts', 'cts',
  'py', 'rs', 'go', 'java', 'kt', 'kts', 'swift', 'm', 'mm',
  'c', 'h', 'cc', 'cpp', 'hpp', 'cxx', 'hxx', 'cs',
  'rb', 'php', 'scala', 'clj', 'ex', 'exs', 'erl', 'hs', 'lua', 'dart', 'zig',
  'sh', 'bash', 'zsh', 'ps1', 'psm1',
  'sql', 'proto', 'graphql', 'gql', 'ipynb',
  'vue', 'svelte',
]);

/** Shipped defaults. `code: []` means "builtin heuristics only". */
export const DEFAULT_POLICY = Object.freeze({
  always_allow: Object.freeze([...BUILTIN_ALWAYS_ALLOW]),
  code: Object.freeze([]),
});

/** Backslashes to forward slashes. Windows hands us `C:\a\b`; the project dir is `C:/a`. */
function toPosix(p) {
  return p.replace(/\\/g, '/');
}

/**
 * Git Bash / Cygwin spell `C:/x` as `/c/x` or `/cygdrive/c/x`, and hooks run under
 * Git Bash on Windows (docs/design/platform-facts.md). A Bash command naming a file
 * that way would otherwise look like it sits outside the project and skip the gate.
 * Only applied on win32 — `/c` is an ordinary directory everywhere else.
 */
function fromMsysPath(p, platform) {
  if (platform !== 'win32') return p;
  const cyg = /^\/cygdrive\/([a-zA-Z])(\/|$)/.exec(p);
  if (cyg) return `${cyg[1]}:/${p.slice(cyg[0].length)}`;
  const msys = /^\/([a-zA-Z])(\/|$)/.exec(p);
  if (msys) return `${msys[1]}:/${p.slice(msys[0].length)}`;
  return p;
}

/**
 * Split into segments with `.` and `..` resolved.
 * Segment-wise comparison (rather than string prefixing) is what stops
 * `/home/u/projX` from being read as inside `/home/u/proj`.
 */
function segments(posixPath) {
  const out = [];
  for (const seg of posixPath.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') {
      out.pop();
      continue;
    }
    out.push(seg);
  }
  return out;
}

function isAbsolute(posixPath) {
  return posixPath.startsWith('/') || /^[a-zA-Z]:\//.test(posixPath);
}

/**
 * Minimal glob → RegExp. Supports `**`, `*`, `?` and one level of `{a,b}`.
 * Deliberately hand-rolled: a dependency here would defeat the zero-dep rule,
 * and the subset we need is small enough to pin with tests.
 */
export function globToRegExp(pattern, { caseInsensitive = false } = {}) {
  let re = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '*') {
      if (pattern[i + 1] === '*') {
        i++;
        if (pattern[i + 1] === '/') {
          i++;
          re += '(?:.*/)?'; // `**/` may match zero directories
        } else {
          re += '.*';
        }
      } else {
        re += '[^/]*';
      }
    } else if (ch === '?') {
      re += '[^/]';
    } else if (ch === '{') {
      const close = pattern.indexOf('}', i);
      if (close === -1) {
        re += '\\{';
      } else {
        const alts = pattern.slice(i + 1, close).split(',');
        re += '(?:' + alts.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')';
        i = close;
      }
    } else {
      re += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp('^' + re + '$', caseInsensitive ? 'i' : '');
}

function matchesAny(relPath, patterns, caseInsensitive) {
  if (!Array.isArray(patterns)) return false;
  for (const pat of patterns) {
    if (typeof pat !== 'string' || !pat) continue;
    try {
      if (globToRegExp(pat, { caseInsensitive }).test(relPath)) return true;
    } catch {
      // A malformed pattern is a config bug, not a reason to block anything.
    }
  }
  return false;
}

function extensionOf(relPath) {
  const base = relPath.slice(relPath.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  return dot <= 0 ? '' : base.slice(dot + 1).toLowerCase();
}

/**
 * Path relative to the project root, or null when the path lies outside it.
 * Exported for the deny-message formatting and for tests.
 */
export function relativeToProject(rawPath, projectDir, platform) {
  const ci = platform === 'win32';
  const projRoot = fromMsysPath(toPosix(String(projectDir ?? '')), platform);
  const projSegs = segments(projRoot);
  let target = fromMsysPath(toPosix(String(rawPath)), platform);
  if (!isAbsolute(target)) target = projRoot + '/' + target;
  const targetSegs = segments(target);

  if (targetSegs.length < projSegs.length) return null;
  for (let i = 0; i < projSegs.length; i++) {
    const a = ci ? targetSegs[i].toLowerCase() : targetSegs[i];
    const b = ci ? projSegs[i].toLowerCase() : projSegs[i];
    if (a !== b) return null;
  }
  return targetSegs.slice(projSegs.length).join('/');
}

/**
 * @param {string} rawPath  path as it arrives in tool_input (may use backslashes)
 * @param {{projectDir: string, policy?: object, platform?: string}} ctx
 * @returns {'foreign'|'harness'|'free'|'code'}  only 'code' is gated
 */
export function classify(rawPath, ctx) {
  try {
    if (typeof rawPath !== 'string' || rawPath === '') return 'free';

    const platform = ctx?.platform ?? process.platform;
    const ci = platform === 'win32';
    const rel = relativeToProject(rawPath, ctx?.projectDir, platform);

    // 1. Outside the project — the permission system's business, not ours.
    if (rel === null) return 'foreign';

    // 2. The harness's own artifacts, at the project root only. A nested
    //    `src/.interlocking/` would otherwise be a one-line bypass.
    const relSegs = rel === '' ? [] : rel.split('/');
    const first = ci ? relSegs[0]?.toLowerCase() : relSegs[0];
    if (first === HARNESS_DIR) return 'harness';

    const policy = ctx?.policy ?? DEFAULT_POLICY;

    // 3. Always-allow. Builtins are unioned in, never replaced: a project must not
    //    be able to gate its own README and block planning.
    const allow = Array.isArray(policy.always_allow)
      ? [...BUILTIN_ALWAYS_ALLOW, ...policy.always_allow]
      : BUILTIN_ALWAYS_ALLOW;
    if (matchesAny(rel, allow, ci)) return 'free';

    // 4. Tests, before policy.code — see BUILTIN_TEST_PATTERNS.
    if (matchesAny(rel, BUILTIN_TEST_PATTERNS, ci)) return 'free';

    // 5. Explicit project policy.
    if (matchesAny(rel, policy.code, ci)) return 'code';

    // 6. Manifests.
    if (matchesAny(rel, BUILTIN_MANIFESTS, ci)) return 'code';

    // 7. Source extensions.
    if (BUILTIN_CODE_EXTENSIONS.has(extensionOf(rel))) return 'code';

    // 8. Unknown — fail open. Blocking things we do not understand is how a
    //    harness becomes hostile.
    return 'free';
  } catch {
    return 'free';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § bash — what does this shell command write?
//
// While G0 is closed, the gate is only as strong as this function. It is
// specified entirely by test/fixtures/bash-writes.txt; read that file first.
//
// Two honest limits, both recorded in the corpus and the README:
//   - a target built at runtime cannot be resolved, so those forms are denied
//     outright rather than guessed at
//   - obfuscation (base64 into a pipe, awk's internal redirect) is not caught.
//     This is a guardrail against accidental drift, not a sandbox.
// ─────────────────────────────────────────────────────────────────────────────

const SEPARATORS = new Set([';', '|', '||', '&&', '&']);

const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh']);

const LAUNCHERS = new Set(['npx', 'pnpx', 'bunx', 'dlx']);

const SCAFFOLD_SUBCOMMANDS = {
  npm: ['init'],
  yarn: ['create', 'init'],
  pnpm: ['create', 'init'],
  bun: ['create', 'init'],
  cargo: ['new', 'init'],
  rails: ['new'],
  dotnet: ['new'],
  'django-admin': ['startproject', 'startapp'],
};

/**
 * Quote-aware shell tokenizer, returning `{value, raw, op, quoted}`.
 * Getting the quoting right is the whole point: `echo "2 > 1"` must not look
 * like a redirect, and `echo "use python -c"` must not look like an interpreter.
 */
export function tokenizeShell(cmd) {
  const src = typeof cmd === 'string' ? cmd : '';
  const out = [];
  let cur = '';
  let raw = '';
  let started = false; // distinguishes an empty quoted arg '' from "no arg at all"
  let quoted = false;

  const flush = () => {
    if (started) out.push({ value: cur, raw, op: false, quoted });
    cur = '';
    raw = '';
    started = false;
    quoted = false;
  };
  const pushOp = (value) => {
    flush();
    out.push({ value, raw: value, op: true, quoted: false });
  };

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (ch === '\\') {
      const next = src[i + 1];
      if (next !== undefined) {
        cur += next;
        raw += ch + next;
        i++;
      }
      started = true;
      continue;
    }

    if (ch === "'" || ch === '"') {
      const close = src.indexOf(ch, i + 1);
      cur += close === -1 ? src.slice(i + 1) : src.slice(i + 1, close);
      raw += close === -1 ? src.slice(i) : src.slice(i, close + 1);
      started = true;
      quoted = true;
      i = close === -1 ? src.length : close;
      continue;
    }

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      flush();
      continue;
    }

    if (ch === '>' || ch === '<') {
      // A leading file-descriptor number belongs to the operator, not the word.
      let fd = '';
      if (!quoted && /^[0-9]+$/.test(cur)) {
        fd = cur;
        cur = '';
        raw = '';
        started = false;
      }
      let op = ch;
      if (src[i + 1] === ch) {
        op += ch;
        i++;
        if (ch === '<' && src[i + 1] === '<') {
          op += ch; // herestring <<<
          i++;
        }
      }
      // `2>&1` duplicates a descriptor; no filename follows it.
      if (src[i + 1] === '&') {
        let j = i + 2;
        let dup = '';
        while (j < src.length && /[0-9-]/.test(src[j])) dup += src[j++];
        if (dup) {
          pushOp(fd + op + '&' + dup);
          i = j - 1;
          continue;
        }
      }
      pushOp(fd + op);
      continue;
    }

    if (ch === '&') {
      if (src[i + 1] === '&') {
        pushOp('&&');
        i++;
      } else if (src[i + 1] === '>') {
        let op = '&>';
        i++;
        if (src[i + 1] === '>') {
          op += '>';
          i++;
        }
        pushOp(op);
      } else {
        pushOp('&');
      }
      continue;
    }

    if (ch === '|') {
      if (src[i + 1] === '|') {
        pushOp('||');
        i++;
      } else {
        pushOp('|');
      }
      continue;
    }

    if (ch === ';') {
      pushOp(';');
      continue;
    }

    cur += ch;
    raw += ch;
    started = true;
  }
  flush();
  return out;
}

/** An operator that names a file to write. Descriptor duplication does not. */
function isOutputRedirect(op) {
  return /^[0-9]*&?>>?$/.test(op);
}

function isInputRedirect(op) {
  return /^[0-9]*<<?<?$/.test(op);
}

/** A target we cannot resolve statically is not a target we can wave through. */
function isUnresolvable(value) {
  return value.includes('$') || value.includes('`');
}

function isFlag(tok) {
  return tok.startsWith('-') && tok !== '-' && tok !== '--';
}

function baseName(cmd) {
  const s = String(cmd).replace(/\\/g, '/');
  return s.slice(s.lastIndexOf('/') + 1).toLowerCase();
}

/** Strip `npx`/`bunx` so the tool is judged rather than its launcher. */
function effectiveArgv(argv) {
  if (argv.length > 1 && LAUNCHERS.has(baseName(argv[0]))) return argv.slice(1);
  return argv;
}

/** Blanket-deny rules, evaluated per simple command. Returns a tag, or null. */
function denyReason(argv) {
  if (argv.length === 0) return null;
  const cmd = baseName(argv[0]);
  const rest = argv.slice(1);
  const has = (...flags) => rest.some((r) => flags.includes(r));

  // A nested session could submit its own user prompts — the one thing the
  // approval path assumes cannot happen.
  if (cmd === 'claude') return 'nested-agent';

  // Code passed as a string literal cannot be inspected.
  if (['python', 'python3', 'py'].includes(cmd) && has('-c')) return 'interpreter';
  if (['node', 'nodejs'].includes(cmd) && has('-e', '--eval', '-p', '--print')) return 'interpreter';
  if (cmd === 'ruby' && has('-e')) return 'interpreter';
  if (cmd === 'php' && has('-r')) return 'interpreter';
  if (cmd === 'deno' && rest[0] === 'eval') return 'interpreter';
  // `perl -i` is in-place editing (targets are extractable); `perl -e` is not.
  const perlInPlace = rest.some((r) => /^-[a-zA-Z.]*i/.test(r));
  if (cmd === 'perl' && !perlInPlace && rest.some((r) => /^-[a-zA-Z]*e/.test(r))) return 'interpreter';

  // The command we would analyze is not the command that runs.
  if (['eval', 'source', '.', 'xargs'].includes(cmd)) return 'shell-eval';
  if (SHELLS.has(cmd) && rest.length > 0) return 'shell-eval';

  // Patch application and history rewrites move bytes we never see.
  if (cmd === 'patch') return 'patch';
  if (cmd === 'git') {
    const sub = rest.find((r) => !isFlag(r));
    if (sub === 'apply' || sub === 'restore') return 'patch';
    if (sub === 'checkout' && rest.includes('--')) return 'patch';
    if (sub === 'stash' && (rest.includes('pop') || rest.includes('apply'))) return 'patch';
    if (sub === 'reset' && rest.includes('--hard')) return 'patch';
    if (sub === 'clean') return 'patch';
  }

  // Scaffolders write whole trees, and the paths appear nowhere in the command.
  if (cmd.startsWith('create-')) return 'scaffold';
  if (cmd === 'go' && rest[0] === 'mod' && rest[1] === 'init') return 'scaffold';
  const subs = SCAFFOLD_SUBCOMMANDS[cmd];
  if (subs) {
    const sub = rest.find((r) => !isFlag(r));
    if (sub && (subs.includes(sub) || sub.startsWith('create-'))) return 'scaffold';
  }

  return null;
}

/** Write targets named by a single simple command (no separators inside). */
function targetsOf(tokens) {
  const targets = [];
  const argv = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t.op) {
      argv.push(t.value);
      continue;
    }
    const next = tokens[i + 1];
    if (isOutputRedirect(t.value)) {
      if (next && !next.op) {
        targets.push(next.value);
        i++;
      }
    } else if (isInputRedirect(t.value)) {
      // Consume the heredoc delimiter / input file so it is never read as a target.
      if (next && !next.op) i++;
    }
  }

  if (argv.length === 0) return { targets, argv };

  const a = effectiveArgv(argv);
  const cmd = baseName(a[0]);
  const rest = a.slice(1);
  const nonFlags = rest.filter((r) => !isFlag(r) && r !== '');

  if (cmd === 'tee') {
    targets.push(...nonFlags);
  } else if (cmd === 'sed' && rest.some((r) => /^-[a-zA-Z]*i/.test(r))) {
    targets.push(...nonFlags.slice(1)); // first non-flag is the sed script
  } else if (cmd === 'perl' && rest.some((r) => /^-[a-zA-Z.]*i/.test(r))) {
    const skip = rest.some((r) => /^-[a-zA-Z]*e/.test(r)) ? 1 : 0;
    targets.push(...nonFlags.slice(skip));
  } else if (['cp', 'mv', 'install', 'ln', 'rsync'].includes(cmd) && nonFlags.length >= 2) {
    targets.push(nonFlags[nonFlags.length - 1]);
  }

  return { targets, argv: a };
}

/**
 * @param {string} cmd
 * @returns {{writes: string[], denyTag: string|null}}
 *   `denyTag` means deny outright. `writes` are paths for classify() to judge —
 *   `> README.md` is extracted but will be allowed, because README.md is free.
 */
export function analyzeBash(cmd) {
  try {
    if (typeof cmd !== 'string' || cmd === '') return { writes: [], denyTag: null };

    const segments = [[]];
    for (const t of tokenizeShell(cmd)) {
      if (t.op && SEPARATORS.has(t.value)) segments.push([]);
      else segments[segments.length - 1].push(t);
    }

    const writes = [];
    for (const seg of segments) {
      const { targets, argv } = targetsOf(seg);
      const tag = denyReason(argv);
      if (tag) return { writes: [], denyTag: tag };
      for (const t of targets) {
        if (isUnresolvable(t)) return { writes: [], denyTag: 'unresolvable-target' };
        if (!writes.includes(t)) writes.push(t);
      }
    }
    return { writes, denyTag: null };
  } catch {
    // A parser bug must never block the user's work.
    return { writes: [], denyTag: null };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § hash — what exactly does an approval bind to?
//
// An approval records the hash of the SPEC's *normative region*. Get this wrong
// in either direction and the gate misbehaves:
//   - too sensitive: cloning the repo on another OS rewrites line endings and
//     silently revokes every approval
//   - too permissive: a requirement gets rewritten while the approval still stands
// ─────────────────────────────────────────────────────────────────────────────

const NORMATIVE_MARKER = /<!--\s*il:normative:(begin|end)\s*-->/g;

/**
 * Cosmetic differences that must not invalidate an approval: BOM, line endings,
 * trailing whitespace, runs of blank lines, leading/trailing blank lines.
 * Leading indentation is deliberately preserved — it changes markdown meaning.
 */
export function normalizeText(text) {
  let s = typeof text === 'string' ? text : String(text ?? '');
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  s = s.replace(/\r\n?/g, '\n');
  s = s
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.replace(/^\n+/, '').replace(/\n+$/, '');
}

/**
 * The part of a SPEC that binds an approval, delimited by
 * `<!-- il:normative:begin -->` / `<!-- il:normative:end -->`.
 *
 * This is what lets a typo in the background section be fixed without a
 * re-approval, while any change to a REQ still invalidates one. Absent or
 * malformed markers fall back to the whole document — over-invalidating is
 * annoying, under-invalidating is a hole.
 */
export function normativeRegion(text) {
  const s = typeof text === 'string' ? text : String(text ?? '');
  const re = new RegExp(NORMATIVE_MARKER.source, 'g');
  const parts = [];
  let openAt = null;
  let sawMarker = false;
  let m;
  while ((m = re.exec(s)) !== null) {
    sawMarker = true;
    if (m[1] === 'begin') {
      if (openAt === null) openAt = m.index + m[0].length;
    } else if (openAt !== null) {
      parts.push(s.slice(openAt, m.index));
      openAt = null;
    }
  }
  if (!sawMarker || openAt !== null || parts.length === 0) return s;
  return parts.join('\n');
}

export function sha256hex(text) {
  const s = typeof text === 'string' ? text : String(text ?? '');
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

/** The value recorded in an approval token and compared against on every write. */
export function specHash(text) {
  try {
    return sha256hex(normalizeText(normativeRegion(text)));
  } catch {
    return sha256hex('');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § fm — frontmatter
//
// STATE.md is restricted to a flat YAML subset so the harness needs no YAML
// dependency. The parser runs on every SessionStart, so it must never throw:
// anything it does not understand is skipped, not fatal.
// Supported: `key: scalar`, `key: "quoted"`, `key: [a, b]`, null/true/false/number.
// ─────────────────────────────────────────────────────────────────────────────

function unquote(v) {
  if (v.length >= 2) {
    const q = v[0];
    if ((q === '"' || q === "'") && v.endsWith(q)) return v.slice(1, -1);
  }
  return null;
}

function parseScalar(rawValue) {
  let v = rawValue.trim();
  if (v === '') return null;

  const quoted = unquote(v);
  if (quoted !== null) return quoted;

  // ` #` starts a comment; `c#d` does not.
  const hash = v.search(/\s+#/);
  if (hash !== -1) v = v.slice(0, hash).trim();
  if (v === '') return null;

  if (v.startsWith('[')) {
    if (!v.endsWith(']')) return v; // malformed — keep the raw text rather than guess
    const inner = v.slice(1, -1).trim();
    if (inner === '') return [];
    return inner.split(',').map((item) => {
      const t = item.trim();
      return unquote(t) ?? t;
    });
  }

  if (v === 'null' || v === '~') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  // Strict number form only. `007` is an identifier, `0x10` is a string, and
  // `yes` is not a boolean — YAML's looser rules cause more bugs than they solve.
  if (/^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?$/.test(v)) return Number(v);
  return v;
}

const KEY_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/;

/**
 * @param {string} text
 * @returns {{data: Record<string, unknown>, body: string}}
 *   No frontmatter, or an unterminated fence, returns `{data:{}, body:text}` verbatim.
 */
export function parseFrontmatter(text) {
  const fallback = { data: {}, body: typeof text === 'string' ? text : '' };
  try {
    if (typeof text !== 'string') return fallback;

    let s = text;
    if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
    const lines = s.replace(/\r\n?/g, '\n').split('\n');
    if (lines[0]?.trim() !== '---') return fallback;

    let close = -1;
    for (let i = 1; i < lines.length; i++) {
      const t = lines[i].trim();
      if (t === '---' || t === '...') {
        close = i;
        break;
      }
    }
    if (close === -1) return fallback;

    const data = {};
    for (const line of lines.slice(1, close)) {
      if (!line.trim() || line.trim().startsWith('#')) continue;
      if (/^\s/.test(line)) continue; // indented: nesting is out of the subset
      const colon = line.indexOf(':');
      if (colon <= 0) continue;
      const key = line.slice(0, colon).trim();
      if (!KEY_RE.test(key)) continue;
      data[key] = parseScalar(line.slice(colon + 1));
    }
    return { data, body: lines.slice(close + 1).join('\n') };
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § env — where things live
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The approval store lives OUTSIDE the repo on purpose. Gate state kept inside
 * the project would be a file the model can write, which would make the gate
 * decorative. `STATE.md`'s `gates_passed` is a human-readable mirror only; the
 * hook never consults it.
 *
 * Ladder, most specific first. CLAUDE_PLUGIN_DATA exists on 2.1.233 but not on
 * older builds (see docs/design/platform-facts.md), so it is never assumed.
 */
export function ilHome(env = process.env) {
  return env.IL_HOME || env.CLAUDE_PLUGIN_DATA || join(homedir(), '.interlocking');
}

/** Stable per-project key. realpath so that symlinked checkouts agree. */
export function projectId(projectDir, platform = process.platform) {
  let p = String(projectDir ?? '');
  try {
    p = realpathSync(p);
  } catch {
    /* not yet on disk — the raw path is still stable enough to key by */
  }
  p = p.replace(/\\/g, '/').replace(/\/+$/, '');
  if (platform === 'win32') p = p.toLowerCase();
  return sha256hex(p).slice(0, 16);
}

/** Feature directory names are used to build paths, so they are whitelisted. */
const FEATURE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function currentFeature(projectDir) {
  const raw = readTextSafe(join(projectDir, HARNESS_DIR, 'current'), 4096);
  if (raw === null) return null;
  const name = raw.trim().split(/\r?\n/)[0]?.trim() ?? '';
  return FEATURE_RE.test(name) ? name : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// § fsx — I/O that cannot throw
// ─────────────────────────────────────────────────────────────────────────────

const MAX_READ = 16 * 1024 * 1024;

export function readTextSafe(path, maxBytes = MAX_READ) {
  try {
    const st = statSync(path);
    if (!st.isFile() || st.size > maxBytes) return null;
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

function readJsonSafe(path) {
  const text = readTextSafe(path, 1024 * 1024);
  if (text === null) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
}

/** @returns {boolean} success — callers degrade rather than fail when false. */
function ensureDir(path) {
  try {
    mkdirSync(path, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § store — signed approval records
//
// The HMAC is NOT a cryptographic boundary against an adversarial model: the key
// sits on the same disk and Bash can read it. Its job is to turn forgery from
// "edit one plausible-looking line" into "a deliberate, named, multi-step act".
// Those are wildly different probabilities, and only the second one is visible
// in the audit log.
// ─────────────────────────────────────────────────────────────────────────────

function storeDir(home, pid) {
  return join(home, 'projects', pid);
}

/** @returns {Buffer|null} null means the store is unusable -> degraded mode. */
function loadKey(home) {
  const keyPath = join(home, 'key');
  try {
    if (existsSync(keyPath)) {
      const buf = readFileSync(keyPath);
      if (buf.length >= 32) return buf;
    }
  } catch {
    return null;
  }
  if (!ensureDir(home)) return null;
  try {
    const key = randomBytes(32);
    writeFileSync(keyPath, key, { mode: 0o600 });
    return key;
  } catch {
    return null;
  }
}

/** Stable serialization so the signature does not depend on key order. */
function canonical(obj) {
  const { sig, ...rest } = obj;
  return JSON.stringify(rest, Object.keys(rest).sort());
}

export function signToken(key, token) {
  return 'hmac-sha256:' + createHmac('sha256', key).update(canonical(token)).digest('hex');
}

export function verifyToken(key, token) {
  try {
    if (!token || typeof token.sig !== 'string') return false;
    const expected = Buffer.from(signToken(key, token));
    const actual = Buffer.from(token.sig);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function readApproval(home, pid, feature, gate) {
  return readJsonSafe(join(storeDir(home, pid), 'approvals', `${feature}.${gate}.json`));
}

function readLease(home, pid, feature) {
  return readJsonSafe(join(storeDir(home, pid), 'leases', `${feature}.json`));
}

function audit(home, pid, entry) {
  try {
    const dir = storeDir(home, pid);
    if (!ensureDir(dir)) return;
    appendFileSync(join(dir, 'audit.log'), JSON.stringify(entry) + '\n', 'utf8');
  } catch {
    /* auditing is best-effort; it must never affect a decision */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § gate — is the G0 lock open?
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @returns {{open: boolean, why: string, feature: string|null, degraded?: boolean, lease?: object}}
 */
export function gateState(ctx) {
  const { projectDir, home } = ctx;

  const feature = currentFeature(projectDir);
  // Nothing has been specced yet, so there is nothing to approve against.
  // `/il:new` creates the feature and closes the gate.
  if (!feature) return { open: true, why: 'no active feature', feature: null };

  const key = loadKey(home);
  if (!key) {
    // Cannot read or create the store. Advisory, never blocking: a harness that
    // bricks a session because its own storage broke gets uninstalled that day.
    return { open: true, why: 'approval store unavailable', feature, degraded: true };
  }

  const pid = projectId(projectDir);
  const token = readApproval(home, pid, feature, 'G0');

  if (!token) {
    const lease = readLease(home, pid, feature);
    if (lease && verifyToken(key, lease) && leaseIsLive(lease)) {
      return { open: true, why: 'override lease', feature, lease };
    }
    return { open: false, why: `G0 not approved for ${feature}`, feature };
  }

  if (!verifyToken(key, token)) {
    // Not a bug — a bad signature is tampering. This is the one case that fails closed.
    return { open: false, why: `approval record for ${feature} failed signature check`, feature };
  }

  const specPath = join(projectDir, HARNESS_DIR, 'work', feature, 'SPEC.md');
  const spec = readTextSafe(specPath);
  if (spec === null) {
    return { open: false, why: `SPEC.md for ${feature} is missing or unreadable`, feature };
  }
  if (token.spec_hash !== specHash(spec)) {
    return { open: false, why: `SPEC.md changed since G0 was approved for ${feature}`, feature };
  }

  return { open: true, why: 'G0 approved', feature };
}

function leaseIsLive(lease) {
  try {
    if (Number(lease.edits_used ?? 0) >= Number(lease.max_edits ?? 0)) return false;
    return Date.parse(lease.expires_at) > Date.now();
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § out — the stdout contract
//
// Silence means allow, and lets the normal permission system do its job.
// `permissionDecision: "allow"` is NEVER emitted: it short-circuits permissions
// and would silently auto-approve edits the human wanted to see.
// ─────────────────────────────────────────────────────────────────────────────

function emit(obj) {
  process.stdout.write(JSON.stringify(obj));
}

function denyTool(reason) {
  emit({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  });
}

function noteTool(context) {
  emit({ hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: context } });
}

function denyMessage(gate, target, specRelPath) {
  return [
    `[il] ${gate.why} — cannot write ${target}`,
    `     SPEC: ${specRelPath}`,
    `     Ask the human to review it and type:  /il:approve`,
    `     Urgent? the human can type:           /il:override <reason>`,
    `     Markdown, docs and ${HARNESS_DIR}/** are never blocked — keep planning.`,
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// § handlers
// ─────────────────────────────────────────────────────────────────────────────

const VERIFIER_AGENT = 'il-verifier';

function loadPolicy(projectDir) {
  const p = readJsonSafe(join(projectDir, HARNESS_DIR, 'policy.json'));
  return p ?? DEFAULT_POLICY;
}

/** Paths a Write/Edit-family call would touch. */
function writeTargetsOf(input) {
  const ti = input?.tool_input ?? {};
  const out = [];
  for (const v of [ti.file_path, ti.notebook_path, ti.path]) {
    if (typeof v === 'string' && v) out.push(v);
  }
  if (Array.isArray(ti.edits)) {
    for (const e of ti.edits) if (typeof e?.file_path === 'string') out.push(e.file_path);
  }
  return out;
}

function onPreWrite(input, ctx) {
  const targets = writeTargetsOf(input);
  decideWrites(targets, [], input, ctx);
}

function onPreBash(input, ctx) {
  const command = typeof input?.tool_input?.command === 'string' ? input.tool_input.command : '';
  const { writes, denyTag } = analyzeBash(command);
  decideWrites(writes, denyTag ? [denyTag] : [], input, ctx);
}

function onPreMcp(input, ctx) {
  // Best-effort only, and documented as such: MCP servers name their tools freely.
  const name = String(input?.tool_name ?? '');
  if (!/write|edit|create|patch|apply|move|delete|remove|mkdir|fs/i.test(name)) return;
  const gate = gateState(ctx);
  if (gate.open) return;
  denyTool(
    `[il] ${gate.why} — MCP tool "${name}" looks like it writes files.\n` +
      `     The human can approve with /il:approve, or bypass with /il:override <reason>.`
  );
}

/**
 * Shared decision path for Write-family and Bash.
 * Order matters: cheap pure checks first, and the store is only consulted once
 * something actually looks gated.
 */
function decideWrites(targets, denyTags, input, ctx) {
  const agentType = String(input?.agent_type ?? '');
  const policy = loadPolicy(ctx.projectDir);
  const classifyCtx = { projectDir: ctx.projectDir, policy };

  // The verifier's third, config-independent write block. `tools:` and
  // `disallowedTools:` live in a file the agent definition controls; this does not.
  if (agentType === VERIFIER_AGENT) {
    const allowed = ctx.feature
      ? `${HARNESS_DIR}/work/${ctx.feature}/VERIFY.md`
      : `${HARNESS_DIR}/work/<feature>/VERIFY.md`;
    const offending = targets.filter((t) => !isVerifyDoc(t, ctx));
    if (offending.length || denyTags.length) {
      denyTool(
        `[il] the ${VERIFIER_AGENT} subagent cannot write source. It reads and runs; it does not implement.\n` +
          `     Only ${allowed} is writable from this agent.\n` +
          `     Record findings there, then return at most 3 lines.`
      );
    }
    return;
  }

  const gated = targets.filter((t) => classify(t, classifyCtx) === 'code');
  if (!gated.length && !denyTags.length) return;

  const gate = gateState(ctx);
  if (gate.open) {
    if (gate.lease) {
      noteTool(
        `[il] override lease in force (reason: ${String(gate.lease.reason ?? '').slice(0, 80)}). ` +
          `Record this write in ${HARNESS_DIR}/work/${gate.feature}/STATE.md history.`
      );
    } else if (gate.degraded) {
      noteTool(`[il] running in advisory mode — ${gate.why}. The G0 block is NOT active.`);
    }
    return;
  }

  const specRel = gate.feature
    ? `${HARNESS_DIR}/work/${gate.feature}/SPEC.md`
    : `${HARNESS_DIR}/`;
  const what = denyTags.length
    ? `a command that cannot be checked statically (${denyTags.join(', ')})`
    : gated[0];

  audit(ctx.home, projectId(ctx.projectDir), {
    at: new Date().toISOString(),
    event: 'deny',
    feature: gate.feature,
    why: gate.why,
    targets: gated.slice(0, 8),
    tags: denyTags,
    session: input?.session_id ?? null,
    agent_type: agentType || null,
  });

  denyTool(denyMessage(gate, what, specRel));
}

function isVerifyDoc(target, ctx) {
  const rel = relativeToProject(target, ctx.projectDir, process.platform);
  if (rel === null) return false;
  const want = ctx.feature ? `${HARNESS_DIR}/work/${ctx.feature}/VERIFY.md` : null;
  return want !== null && rel.replace(/\\/g, '/') === want;
}

function onSessionStart() {
  // Context injection lands in the next step; staying silent is the correct
  // behavior until then.
}

function onPrompt() {
  // Approval and override recording land in the next step.
}

const DISPATCH = {
  'session-start': onSessionStart,
  prompt: onPrompt,
  'pre-write': onPreWrite,
  'pre-bash': onPreBash,
  'pre-mcp': onPreMcp,
};

// ─────────────────────────────────────────────────────────────────────────────
// § main
// ─────────────────────────────────────────────────────────────────────────────

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

function logCrash(home, err) {
  try {
    if (!ensureDir(home)) return;
    appendFileSync(join(home, 'crash.log'), `${new Date().toISOString()} ${err?.stack ?? err}\n`, 'utf8');
  } catch {
    /* nothing left to do but stay quiet */
  }
}

export async function main(argv = process.argv, env = process.env) {
  const home = ilHome(env);
  try {
    if (env.IL_DISABLE) return 0;

    const mode = argv[2];
    const handler = Object.prototype.hasOwnProperty.call(DISPATCH, mode) ? DISPATCH[mode] : null;
    if (!handler) return 0;

    let input = {};
    try {
      const parsed = JSON.parse(await readStdin());
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) input = parsed;
    } catch {
      /* malformed payload — every field is optional anyway */
    }

    const projectDir = env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();

    // The one check that must be fast: in a repo that does not use the harness,
    // this is a single stat and then we are gone.
    if (!existsSync(join(projectDir, HARNESS_DIR))) return 0;

    handler(input, { projectDir, home, feature: currentFeature(projectDir), env });
    return 0;
  } catch (err) {
    // Fail open, always. A bug here must cost the user nothing.
    logCrash(home, err);
    return 0;
  }
}

const invokedDirectly =
  typeof process.argv[1] === 'string' && process.argv[1].replace(/\\/g, '/').endsWith('/il.mjs');

if (invokedDirectly) {
  main().then(
    (code) => process.exit(code),
    () => process.exit(0)
  );
}
