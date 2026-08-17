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

import { createHash } from 'node:crypto';

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
  const projSegs = segments(toPosix(String(projectDir ?? '')));
  let target = toPosix(String(rawPath));
  if (!isAbsolute(target)) target = toPosix(String(projectDir ?? '')) + '/' + target;
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
