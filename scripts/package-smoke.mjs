import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? '.');
const temporaryProject = await mkdtemp(join(tmpdir(), 'paperhug-package-smoke-'));
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const readme = await readFile(join(root, 'README.md'), 'utf8');
let tarball;

try {
  if (/\bnpx\s+paperhug\s+(?!will\b)/.test(readme)) {
    throw new Error('README must not present npx paperhug as available before registry publication');
  }
  const releaseAsset = `https://github.com/rogerchappel/paperhug/releases/download/v${manifest.version}/paperhug-${manifest.version}.tgz`;
  for (const command of [
    `npm install --global ${releaseAsset}`,
    'paperhug --help', 'paperhug birthday'
  ]) {
    if (!readme.includes(command)) throw new Error(`README is missing tested install command: ${command}`);
  }

  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--json'], { cwd: root, encoding: 'utf8' }));
  tarball = join(root, pack.filename);
  execFileSync('npm', ['init', '--yes'], { cwd: temporaryProject, stdio: 'ignore' });
  execFileSync('npm', ['install', '--ignore-scripts', tarball], { cwd: temporaryProject, stdio: 'inherit' });

  const cli = join(temporaryProject, 'node_modules', '.bin', 'paperhug');
  const help = execFileSync(cli, ['--help'], { cwd: temporaryProject, encoding: 'utf8' });
  if (!help.includes('paperhug — print-at-home greeting cards')) throw new Error('packed CLI help output was not recognized');

  const quick = JSON.parse(execFileSync(cli, [
    'birthday', '--for', 'Package Smoke', '--message', 'cheerful', '--provider', 'none',
    '--out', join(temporaryProject, 'output')
  ], { cwd: temporaryProject, encoding: 'utf8' }));
  if (!quick.ok || quick.provider !== 'none') throw new Error('packed prompt-only quick run failed');
  console.log(`package smoke passed for ${basename(tarball)}`);
} finally {
  await rm(temporaryProject, { recursive: true, force: true });
  if (tarball) await rm(tarball, { force: true });
}
