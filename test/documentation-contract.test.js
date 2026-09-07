import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('the development workflow installs locked dependencies before validation', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  const development = readme.match(/## Development\s+```(?:bash|sh)\n([\s\S]*?)```/);

  assert.ok(development, 'README must include a shell command block under Development');
  const commands = development[1]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  assert.equal(commands[0], 'npm ci', 'Development must start with a locked clean install');
  assert.ok(commands.includes('bash scripts/validate.sh'), 'Development must run repository validation');
  assert.ok(commands.includes('npm run release:check'), 'Development must run the release gate');
});
