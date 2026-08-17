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
