import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const validator = join(homedir(), '.codex', 'skills', '.system', 'plugin-creator', 'scripts', 'validate_plugin.py');
if (!existsSync(validator)) {
  console.error(`Codex plugin validator not found: ${validator}`);
  process.exit(1);
}

const candidates = process.platform === 'win32'
  ? [['py', ['-3']], ['python', []], ['python3', []]]
  : [['python3', []], ['python', []]];

for (const [exe, prefix] of candidates) {
  const probe = spawnSync(exe, [...prefix, '--version'], { stdio: 'ignore', windowsHide: true });
  if (probe.error?.code === 'ENOENT' || probe.status !== 0) continue;
  const result = spawnSync(exe, [...prefix, validator, '.'], { stdio: 'inherit', windowsHide: true });
  process.exit(result.status ?? 1);
}

console.error('Python 3 was not found; it is required by the Codex plugin validator.');
process.exit(1);
