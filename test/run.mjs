#!/usr/bin/env node
/**
 * Test runner.
 *
 * `node --test <arg>` has no form that works across the versions this project
 * supports, because what the argument MEANS changed:
 *
 *   node --test "test/​**​/*.test.mjs"
 *     Node 21+   argument is a glob          -> works
 *     Node 18/20 argument is a literal path  -> nothing matches, fails
 *
 *   node --test test/
 *     Node 18/20 recurses the directory      -> also loads fixtures/*.json, fails
 *     Node 23+   argument is a glob, and     -> MODULE_NOT_FOUND on "test"
 *                "test/" resolves to a file
 *
 * Explicit file paths are the one form every version agrees on. So this script
 * collects them itself and passes them through.
 *
 * (The toy project used to dogfood this harness hit the same trap from the other
 * side: its SPEC named `node --test test/` as an acceptance command, and the
 * independent verifier reported it unrunnable rather than quietly substituting a
 * command that worked. Same lesson, opposite direction.)
 */

import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const files = readdirSync(here)
  .filter((name) => name.endsWith('.test.mjs'))
  .sort()
  .map((name) => join(here, name));

if (files.length === 0) {
  console.error('no test files found in ' + here);
  process.exit(1);
}

const extra = process.argv.slice(2); // e.g. --test-name-pattern=classify
const result = spawnSync(process.execPath, ['--test', ...extra, ...files], {
  stdio: 'inherit',
  windowsHide: true,
});

process.exit(result.status ?? 1);
