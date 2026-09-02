import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkPrd, validatePrdExamples } from '../scripts/prd-doc-contract.mjs';

test('the checked-in PRD executable examples match the shipped CLI', async () => {
  await checkPrd();
});

test('the executable-documentation contract includes orchestration commands', async () => {
  const root = await mkdtemp(join(tmpdir(), 'paperhug-doc-contract-'));
  await mkdir(join(root, 'docs'));
  await writeFile(join(root, 'docs', 'PRD.md'), '# PRD\n');
  await writeFile(join(root, 'docs', 'ORCHESTRATION.md'), `
\`\`\`bash
npx paperhug birthday --for Mum
\`\`\`
`);

  await assert.rejects(
    checkPrd(root),
    /docs\/ORCHESTRATION\.md: uses unpublished `npx paperhug`/
  );
  await rm(root, { recursive: true, force: true });
});

test('the PRD contract rejects the previously documented command drift', () => {
  const markdown = `
\`\`\`bash
npx paperhug birthday --for Mum
paperhug wizard --conversation
paperhug quick birthday --for Mum --layout folded --provider nano-banana
paperhug render dist/card/project.json --no-generate
\`\`\`
`;
  assert.deepEqual(validatePrdExamples(markdown), [
    'uses unpublished `npx paperhug` instead of the documented local-tarball install',
    'uses unsupported option for wizard: --conversation',
    'uses unsupported option for quick: --layout',
    'uses future-only provider `nano-banana` in a runnable command',
    'uses unsupported option for render: --no-generate'
  ]);
});
