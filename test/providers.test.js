import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  buildPrompts,
  createProject,
  defaultMessage,
  findOccasion,
  findProvider,
  findStyle,
  generateArtwork,
  providerStatus,
  renderProject
} from '../src/index.js';

test('OpenAI provider is usable when configured', async () => {
  await withEnv('OPENAI_API_KEY', 'test-key', () => {
    const status = providerStatus(findProvider('openai'));
    assert.equal(status.configured, true);
    assert.equal(status.usable, true);
    assert.match(status.note, /Ready for artwork generation/);
  });
});

test('OpenAI artwork generation writes front image and render embeds it', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'paperhug-openai-'));
  try {
    await withEnv('OPENAI_API_KEY', 'test-openai-key', async () => {
      const provider = findProvider('openai');
      const project = await sampleProject();
      const artwork = await generateArtwork({
        provider,
        project,
        outputDir: dir,
        model: 'gpt-image-1-mini',
        fetchImpl: async (url, request) => {
          assert.equal(url, 'https://api.openai.com/v1/images/generations');
          assert.equal(request.headers.Authorization, 'Bearer test-openai-key');
          const body = JSON.parse(request.body);
          assert.equal(body.model, 'gpt-image-1-mini');
          assert.equal(body.output_format, 'jpeg');
          assert.equal(body.size, '1024x1536');
          assert.equal(body.quality, 'medium');
          return new Response(JSON.stringify({
            data: [{ b64_json: Buffer.from('fake-jpeg-bytes').toString('base64') }]
          }), { status: 200 });
        }
      });

      assert.equal(artwork.path, 'assets/front.jpg');
      assert.equal(project.provider.artworkGenerated, true);
      assert.equal(await readFile(path.join(dir, 'assets', 'front.jpg'), 'utf8'), 'fake-jpeg-bytes');

      await renderProject(project, dir);
      const pdf = await readFile(path.join(dir, 'card.pdf'), 'utf8');
      assert.match(pdf, /\/Subtype \/Image/);
      assert.match(pdf, /\/Im1 Do/);
      assert.equal(project.outputs.frontArtwork, 'assets/front.jpg');
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

async function sampleProject() {
  const occasion = await findOccasion('birthday');
  const style = await findStyle('warm-watercolour');
  const prompts = buildPrompts({ occasion, style, recipient: 'Mum', sender: 'Roger', messageBrief: 'warm' });
  return createProject({
    occasion,
    style,
    recipient: 'Mum',
    sender: 'Roger',
    messageBrief: 'warm',
    provider: 'openai',
    references: [],
    prompts,
    message: defaultMessage({ occasion, recipient: 'Mum', sender: 'Roger', messageBrief: 'warm' })
  });
}

async function withEnv(name, value, callback) {
  const previous = process.env[name];
  process.env[name] = value;
  try {
    await callback();
  } finally {
    if (previous === undefined) delete process.env[name];
    else process.env[name] = previous;
  }
}
