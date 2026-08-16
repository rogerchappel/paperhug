import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const scripts = packageJson.scripts ?? {};
const failures = [];
const requireField = (condition, message) => { if (!condition) failures.push(message); };

const agentsPath = path.join(root, 'AGENTS.md');
requireField(fs.existsSync(agentsPath), 'repository must include AGENTS.md');
if (fs.existsSync(agentsPath)) {
  const agents = fs.readFileSync(agentsPath, 'utf8');
  const contextFields = ['Repository', 'Primary maintainer', 'Default branch', 'Package manager'];
  const context = Object.fromEntries(contextFields.map((field) => {
    const match = agents.match(new RegExp('^- ' + field + ': `([^`]*)`', 'm'));
    return [field, match?.[1].trim() ?? ''];
  }));

  for (const field of contextFields) {
    requireField(context[field], `AGENTS.md Project Context must declare a non-empty ${field}`);
  }

  const branchRef = agents.match(/^- Branch from the latest `([^`]*)` before editing\.$/m)?.[1].trim() ?? '';
  requireField(branchRef, 'AGENTS.md Branch Policy must declare a non-empty branch ref');
  requireField(
    !context['Default branch'] || !branchRef || branchRef === context['Default branch'],
    'AGENTS.md Branch Policy branch ref must match the default branch',
  );
}

requireField(packageJson.repository, 'package.json must declare repository metadata');
requireField(Array.isArray(packageJson.files) && packageJson.files.length > 0, 'package.json must declare a non-empty files allowlist');
requireField(scripts['package:smoke'], 'package.json scripts must include package:smoke');
requireField(scripts['dependency:audit'], 'package.json scripts must include dependency:audit');
requireField(scripts['release:check'], 'package.json scripts must include release:check');
requireField(
  /(?:^|&&)\s*npm run dependency:audit(?:\s*&&|$)/.test(scripts['release:check'] ?? ''),
  'release:check must run npm run dependency:audit',
);
requireField(
  /(?:^|&&)\s*npm run check:apps(?:\s*&&|$)/.test(scripts['release:check'] ?? ''),
  'release:check must run npm run check:apps',
);

const workflowDir = path.join(root, '.github', 'workflows');
if (fs.existsSync(workflowDir)) {
  const workflowFiles = fs.readdirSync(workflowDir).filter((file) => /\.ya?ml$/.test(file));
  requireField(workflowFiles.length > 0, 'repository must include at least one workflow file');
  for (const file of workflowFiles) {
    const workflow = fs.readFileSync(path.join(workflowDir, file), 'utf8');
    requireField(!/TODO|FIXME|template becomes an app|customization TODO/i.test(workflow), '.github/workflows/' + file + ' still contains placeholder text');
  }
  const combined = workflowFiles.map((file) => fs.readFileSync(path.join(workflowDir, file), 'utf8')).join('\n');
  requireField(/release:check/.test(combined), 'CI workflows must run npm run release:check');
  const releaseWorkflow = fs.readFileSync(path.join(workflowDir, 'release.yml'), 'utf8');
  requireField(/verify-tag/.test(releaseWorkflow), 'release workflow must verify the tag version');
  requireField(/npm publish/.test(releaseWorkflow), 'release workflow must publish the npm package');
  requireField(/--provenance/.test(releaseWorkflow), 'npm publishing must include provenance');
}

if (failures.length > 0) {
  console.error('Release readiness validation failed:');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}
console.log('Release readiness validation passed.');
