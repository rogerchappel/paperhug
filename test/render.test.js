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
    assert.match(pdf, /\/MediaBox \[0 0 841\.89 595\.28\]/);
    assert.doesNotMatch(pdf, /Artwork prompt:/);
    assert.equal(project.layout.id, 'a4-landscape-fold-half');
    assert.equal(project.outputs.cardPdf, 'card.pdf');
    assert.match(await readFile(path.join(dir, 'prompts', 'image-prompt.txt'), 'utf8'), /Mother/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('renders title-free covers and styled inside fonts', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'paperhug-title-free-'));
  try {
    const occasion = await findOccasion('custom');
    const style = await findStyle('warm-watercolour');
    const prompts = buildPrompts({
      occasion,
      style,
      recipient: 'Mum and Dad',
      sender: 'Roger',
      messageBrief: 'alpine mountains, escaping to a new cabin together',
      coverTitle: false
    });
    const project = createProject({
      occasion,
      style,
      recipient: 'Mum and Dad',
      sender: 'Roger',
      messageBrief: 'alpine mountains, escaping to a new cabin together',
      provider: 'none',
      references: [],
      prompts,
      coverTitle: false,
      insideStyle: 'typewriter',
      message: defaultMessage({
        occasion,
        recipient: 'Mum and Dad',
        sender: 'Roger',
        messageBrief: 'alpine mountains, escaping to a new cabin together'
      })
    });

    await renderProject(project, dir);
    const pdf = await readFile(path.join(dir, 'card.pdf'), 'utf8');
    const preview = await readFile(path.join(dir, 'preview.svg'), 'utf8');
    assert.match(pdf, /\/BaseFont \/Courier-Oblique/);
    assert.doesNotMatch(pdf, /For You/);
    assert.doesNotMatch(pdf, /from Roger/);
    assert.doesNotMatch(preview, /For You/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
