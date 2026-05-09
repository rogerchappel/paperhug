import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPrompts, findOccasion, findStyle } from '../src/index.js';

test('builds prompts with reference image guidance', async () => {
  const occasion = await findOccasion('birthday');
  const style = await findStyle('warm-watercolour');
  const prompts = buildPrompts({
    occasion,
    style,
    recipient: 'Mum',
    sender: 'Roger',
    messageBrief: 'funny and grateful',
    references: [{ originalPath: '/tmp/family.jpg' }]
  });
  assert.match(prompts.imagePrompt, /Mum/);
  assert.match(prompts.imagePrompt, /Reference image guidance/);
  assert.match(prompts.textPrompt, /birthday/i);
});
