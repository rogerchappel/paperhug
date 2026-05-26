import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPrompts, defaultMessage, findOccasion, findStyle } from '../src/index.js';

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

test('builds title-free artwork prompts and cabin-aware inside copy', async () => {
  const occasion = await findOccasion('custom');
  const style = await findStyle('warm-watercolour');
  const messageBrief = 'alpine mountains, escaping to a new cabin together';
  const prompts = buildPrompts({
    occasion,
    style,
    recipient: 'Mum and Dad',
    sender: 'Roger',
    messageBrief,
    coverTitle: false
  });
  const message = defaultMessage({ occasion, recipient: 'Mum and Dad', sender: 'Roger', messageBrief });

  assert.match(prompts.imagePrompt, /Do not include readable cover text/);
  assert.doesNotMatch(prompts.imagePrompt, /Card cover title/);
  assert.match(prompts.textPrompt, /Card idea:/);
  assert.match(message, /fresh mountain air/);
  assert.doesNotMatch(message, /For You/);
});
