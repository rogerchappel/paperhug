import test from 'node:test';
import assert from 'node:assert/strict';
import { findOccasion, findStyle, loadOccasions, loadStyles } from '../src/index.js';

test('loads occasion and style templates', async () => {
  const occasions = await loadOccasions();
  const styles = await loadStyles();
  assert.ok(occasions.length >= 8);
  assert.ok(styles.length >= 7);
});

test('resolves occasion aliases', async () => {
  assert.equal((await findOccasion('mum')).id, 'mothers-day');
  assert.equal((await findOccasion('thanks')).id, 'thank-you');
});

test('accepts freeform style text', async () => {
  const style = await findStyle('Australian native flowers');
  assert.equal(style.id, 'australian-native-flowers');
  assert.match(style.prompt, /native flowers/);
});
