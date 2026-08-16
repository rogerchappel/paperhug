import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

function createFixture() {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'paperhug-readiness-'));
  fs.mkdirSync(path.join(fixture, 'scripts'));
  fs.cpSync(path.join(root, '.github'), path.join(fixture, '.github'), { recursive: true });
  for (const file of ['AGENTS.md', 'package.json']) {
    fs.copyFileSync(path.join(root, file), path.join(fixture, file));
  }
  fs.copyFileSync(
    path.join(root, 'scripts', 'validate-release-readiness.mjs'),
    path.join(fixture, 'scripts', 'validate-release-readiness.mjs'),
  );
  return fixture;
}

function runReadiness(fixture) {
  return execFileSync(process.execPath, ['scripts/validate-release-readiness.mjs'], {
    cwd: fixture,
    encoding: 'utf8',
    stdio: 'pipe',
  });
}

test('release readiness accepts complete agent project context', (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  assert.match(runReadiness(fixture), /Release readiness validation passed/);
});

test('release readiness rejects an empty required agent context value', (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  const agentsPath = path.join(fixture, 'AGENTS.md');
  fs.writeFileSync(agentsPath, fs.readFileSync(agentsPath, 'utf8').replace(
    '- Primary maintainer: `Roger Chappel`',
    '- Primary maintainer: ``',
  ));

  assert.throws(
    () => runReadiness(fixture),
    (error) => error.stderr.includes('non-empty Primary maintainer'),
  );
});

test('release readiness rejects an empty branch policy ref', (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  const agentsPath = path.join(fixture, 'AGENTS.md');
  fs.writeFileSync(agentsPath, fs.readFileSync(agentsPath, 'utf8').replace(
    '- Branch from the latest `main` before editing.',
    '- Branch from the latest `` before editing.',
  ));

  assert.throws(
    () => runReadiness(fixture),
    (error) => error.stderr.includes('non-empty branch ref'),
  );
});
