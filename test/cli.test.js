import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const cli = path.resolve('src/cli.js');

async function assertCliError(args, message) {
  await assert.rejects(
    execFileAsync(process.execPath, [cli, ...args]),
    (error) => {
      const parsed = JSON.parse(error.stderr);
      assert.equal(parsed.ok, false);
      assert.match(parsed.error, message);
      return true;
    }
  );
}

test('quick rejects missing option values and unknown options', async () => {
  await assertCliError(['quick', 'birthday', '--for'], /--for requires a value/);
  await assertCliError(['quick', 'birthday', '--for', 'Test', '--reference'], /--reference requires a value/);
  await assertCliError(['quick', 'birthday', '--for', 'Test', '--bogus'], /Unknown option for quick: --bogus/);
});

test('commands reject surplus positional operands before acting', async () => {
  await assertCliError(['quick', 'birthday', 'unexpected', '--for', 'Test'], /Usage: paperhug quick <occasion>/);
  await assertCliError(['birthday', 'unexpected', '--for', 'Test'], /Usage: paperhug birthday/);
  await assertCliError(['wizard', 'unexpected'], /Usage: paperhug wizard/);
  await assertCliError(['render', 'project.json', 'unexpected'], /Usage: paperhug render <project\.json>/);
  await assertCliError(['print', 'card.pdf', 'unexpected', '--dry-run'], /Usage: paperhug print <project\.json\|card\.pdf>/);
  await assertCliError(['refine', 'project.json', 'unexpected', '--note', 'clearer'], /Usage: paperhug refine <project\.json>/);
  await assertCliError(['templates', 'list', 'unexpected'], /Usage: paperhug templates \[list\]/);
  await assertCliError(['providers', 'list', 'unexpected'], /Usage: paperhug providers \[list\]/);
});

test('commands reject missing required positional operands', async () => {
  await assertCliError(['render'], /Usage: paperhug render <project\.json>/);
  await assertCliError(['print', '--dry-run'], /Usage: paperhug print <project\.json\|card\.pdf>/);
  await assertCliError(['refine', '--note', 'clearer'], /Usage: paperhug refine <project\.json>/);
});

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

test('quick accepts card ideas, inside styles, and title-free covers', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'paperhug-idea-'));
  try {
    const out = path.join(dir, 'card');
    const { stdout } = await execFileAsync(process.execPath, [
      cli,
      'quick',
      'custom',
      '--for',
      'Mum and Dad',
      '--from',
      'Roger, Sarah, Arthur and Henry',
      '--idea',
      'alpine mountains, escaping to a new cabin together',
      '--inside-style',
      'script',
      '--no-cover-title',
      '--provider',
      'none',
      '--out',
      out
    ]);
    const parsed = JSON.parse(stdout);
    assert.equal(parsed.ok, true);
    const project = JSON.parse(await readFile(path.join(out, 'custom-for-mum-and-dad', 'project.json'), 'utf8'));
    assert.equal(project.coverTitle, '');
    assert.equal(project.insideStyle, 'script');
    assert.match(project.messageBrief, /new cabin/);
    assert.match(project.message, /fresh mountain air/);
    assert.match(project.prompts.imagePrompt, /Do not include readable cover text/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('quick accepts boolean flags and repeated references', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'paperhug-options-'));
  try {
    const first = path.join(dir, 'first.png');
    const second = path.join(dir, 'second.png');
    await Promise.all([writeFile(first, 'first'), writeFile(second, 'second')]);
    const out = path.join(dir, 'card');
    const { stdout } = await execFileAsync(process.execPath, [
      cli, 'quick', 'birthday', '--for', 'Test', '--reference', first, '--reference', second,
      '--no-copy-references', '--force', '--provider', 'none', '--out', out
    ]);
    const parsed = JSON.parse(stdout);
    const project = JSON.parse(await readFile(parsed.project, 'utf8'));
    assert.equal(project.references.length, 2);
    assert.deepEqual(project.references.map((reference) => reference.originalPath), [first, second]);
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
