import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildPrompts, createProject, defaultMessage, findOccasion, findStyle, renderProject } from '../src/index.js';

test('renders a two-page A4 card PDF and prompt artifacts', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'paperhug-'));
  try {
    const occasion = await findOccasion('mothers-day');
    const style = await findStyle('warm-watercolour');
    const prompts = buildPrompts({ occasion, style, recipient: 'Mum', sender: 'Roger', messageBrief: 'warm' });
    const project = createProject({
      occasion,
      style,
      recipient: 'Mum',
      sender: 'Roger',
      messageBrief: 'warm',
      provider: 'none',
      references: [],
      prompts,
      message: defaultMessage({ occasion, recipient: 'Mum', sender: 'Roger', messageBrief: 'warm' })
    });
    await renderProject(project, dir);
    const pdf = await readFile(path.join(dir, 'card.pdf'), 'utf8');
    assert.match(pdf, /^%PDF-1\.4/);
    assert.match(pdf, /\/Count 2/);
    assert.equal(project.outputs.cardPdf, 'card.pdf');
    assert.match(await readFile(path.join(dir, 'prompts', 'image-prompt.txt'), 'utf8'), /Mother/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
