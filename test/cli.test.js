import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const cli = path.resolve('src/cli.js');

test('templates list prints occasions and styles', async () => {
  const { stdout } = await execFileAsync(process.execPath, [cli, 'templates', 'list']);
  const parsed = JSON.parse(stdout);
  assert.ok(parsed.occasions.some((item) => item.id === 'birthday'));
  assert.ok(parsed.styles.some((item) => item.id === 'warm-watercolour'));
});

test('providers list exposes prompt-only mode', async () => {
  const { stdout } = await execFileAsync(process.execPath, [cli, 'providers', 'list']);
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.providers.find((item) => item.id === 'none').usable, true);
});

test('quick prompt-only mode writes a project and valid PDF', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'paperhug-cli-'));
  try {
    const out = path.join(dir, 'card');
    const { stdout } = await execFileAsync(process.execPath, [cli, 'quick', 'birthday', '--for', 'Test', '--message', 'cheerful', '--provider', 'none', '--out', out]);
    const parsed = JSON.parse(stdout);
    assert.equal(parsed.ok, true);
    const project = JSON.parse(await readFile(path.join(out, 'birthday-for-test', 'project.json'), 'utf8'));
    assert.equal(project.provider.id, 'none');
    assert.match(await readFile(path.join(out, 'birthday-for-test', 'card.pdf'), 'utf8'), /^%PDF/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('print dry-run always uses landscape and duplex short-edge options', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'paperhug-print-'));
  try {
    const pdf = path.join(dir, 'card.pdf');
    await import('node:fs/promises').then(({ writeFile }) => writeFile(pdf, '%PDF test'));
    const { stdout } = await execFileAsync(process.execPath, [cli, 'print', pdf, '--printer', 'Test_Printer', '--dry-run']);
    const parsed = JSON.parse(stdout);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.command, 'lp');
    assert.equal(parsed.landscape, true);
    assert.equal(parsed.duplex, 'DuplexTumble');
    assert.deepEqual(parsed.args.slice(0, 10), ['-d', 'Test_Printer', '-o', 'landscape', '-o', 'PageSize=A4', '-o', 'fit-to-page', '-o', 'Duplex=DuplexTumble']);
    assert.ok(parsed.args.includes('sides=two-sided-short-edge'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
