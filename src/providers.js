import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const providers = [
  {
    id: 'none',
    name: 'Prompt-only / placeholder art',
    env: [],
    supportsReferences: true,
    network: false,
    description: 'CI-safe default. Writes prompts, project JSON, placeholder printable PDFs, and instructions without calling any external API.'
  },
  {
    id: 'nano-banana',
    name: 'Nano Banana / Gemini-style image adapter placeholder',
    env: ['GEMINI_API_KEY'],
    supportsReferences: true,
    network: true,
    description: 'Planned adapter shape for Gemini-style image generation with reference images. Not implemented in v0.1.0.'
  },
  {
    id: 'openai',
    name: 'OpenAI Images artwork adapter',
    env: ['OPENAI_API_KEY'],
    supportsReferences: false,
    network: true,
    defaultModel: 'gpt-image-1.5',
    description: 'Generates print-ready front-cover artwork with OpenAI Images and embeds it into the printable card PDF.'
  }
];

export function findProvider(id = 'none') {
  const provider = providers.find((candidate) => candidate.id === id);
  if (!provider) {
    throw new Error(`Unknown provider: ${id}. Supported provider IDs: ${providers.map((candidate) => candidate.id).join(', ')}.`);
  }
  return provider;
}

export function providerStatus(provider) {
  const configured = provider.env.every((name) => Boolean(process.env[name]));
  const usable = provider.id === 'none' || (provider.id === 'openai' && configured);
  return {
    ...provider,
    configured,
    usable,
    note: provider.id === 'none'
      ? 'Ready now. No network calls.'
      : provider.id === 'openai'
        ? configured
          ? `Ready for artwork generation with ${provider.defaultModel}.`
          : 'Set OPENAI_API_KEY to generate front-cover artwork with OpenAI Images.'
      : configured
        ? 'Credentials detected, but this adapter is intentionally a documented placeholder in v0.1.0.'
        : `Set ${provider.env.join(', ')} to use this adapter when implemented.`
  };
}

export async function generateArtwork({ provider, project, outputDir, model, fetchImpl = globalThis.fetch }) {
  if (!provider || provider.id === 'none') {
    return {
      kind: 'placeholder',
      note: 'No image provider selected. Use the image prompt with Nano Banana/Gemini/OpenAI/etc, then replace assets/front.svg or rerun render later.',
      prompt: project.prompts.imagePrompt
    };
  }

  if (provider.id !== 'openai') {
    throw new Error(`Provider ${provider.id} is documented but not implemented yet. Re-run with --provider none for prompt-only output.`);
  }

  if (!outputDir) throw new Error('generateArtwork requires outputDir for image providers.');
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is required when using --provider openai.');
  if (typeof fetchImpl !== 'function') throw new Error('OpenAI Images requires a fetch implementation. Use Node.js 20 or newer.');

  const selectedModel = model || provider.defaultModel;
  const response = await fetchImpl('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: selectedModel,
      prompt: project.prompts.imagePrompt,
      size: '1024x1536',
      quality: 'medium',
      output_format: 'jpeg',
      n: 1
    })
  });

  const body = await response.text();
  const parsed = parseJsonResponse(body, response.status, 'OpenAI Images');

  if (!response.ok) {
    const message = parsed?.error?.message || parsed?.message || body.slice(0, 240);
    throw new Error(`OpenAI Images request failed (${response.status}): ${message}`);
  }

  const b64 = parsed?.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI Images returned no base64 artwork.');

  const artworkPath = path.join(outputDir, 'assets', 'front.jpg');
  await mkdir(path.dirname(artworkPath), { recursive: true });
  await writeFile(artworkPath, Buffer.from(b64, 'base64'));

  project.provider.model = selectedModel;
  project.provider.artworkGenerated = true;
  project.artwork = {
    kind: 'image',
    provider: provider.id,
    model: selectedModel,
    path: 'assets/front.jpg',
    width: 1024,
    height: 1536,
    prompt: project.prompts.imagePrompt
  };

  return project.artwork;
}

function parseJsonResponse(body, status, service) {
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`${service} returned a non-JSON response with status ${status}.`);
  }
}
