import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const skillJson = JSON.parse(
  await readFile(new URL('../skills/paperhug-card/skill.json', import.meta.url), 'utf8'),
);

test('skill installer uses the versioned release asset while npm is unpublished', () => {
  const { requiresCli } = skillJson.metadata;
  const releaseAsset = `https://github.com/rogerchappel/paperhug/releases/download/v${packageJson.version}/paperhug-${packageJson.version}.tgz`;

  assert.equal(skillJson.version, packageJson.version);
  assert.equal(requiresCli.version, `>=${packageJson.version}`);
  assert.equal(requiresCli.install.npm, `npm install -g ${releaseAsset}`);
  assert.notEqual(requiresCli.install.npm, 'npm install -g paperhug');
});
