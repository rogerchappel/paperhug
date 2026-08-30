import test from 'node:test';
import assert from 'node:assert/strict';
import { checkPrd, validatePrdExamples } from '../scripts/prd-doc-contract.mjs';

test('the checked-in PRD executable examples match the shipped CLI', async () => {
  await checkPrd();
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
