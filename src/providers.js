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
    name: 'OpenAI Images adapter placeholder',
    env: ['OPENAI_API_KEY'],
    supportsReferences: true,
    network: true,
    description: 'Planned adapter shape for OpenAI image generation. Not implemented in v0.1.0.'
  }
];

export function findProvider(id = 'none') {
  return providers.find((provider) => provider.id === id) || providers[0];
}

export function providerStatus(provider) {
  const configured = provider.env.every((name) => Boolean(process.env[name]));
  return {
    ...provider,
    configured,
    usable: provider.id === 'none',
    note: provider.id === 'none'
      ? 'Ready now. No network calls.'
      : configured
        ? 'Credentials detected, but this adapter is intentionally a documented placeholder in v0.1.0.'
        : `Set ${provider.env.join(', ')} to use this adapter when implemented.`
  };
}

export async function generateArtwork({ provider, project }) {
  if (!provider || provider.id === 'none') {
    return {
      kind: 'placeholder',
      note: 'No image provider selected. Use the image prompt with Nano Banana/Gemini/OpenAI/etc, then replace assets/front.svg or rerun render later.',
      prompt: project.prompts.imagePrompt
    };
  }

  throw new Error(`Provider ${provider.id} is documented but not implemented yet. Re-run with --provider none for prompt-only output.`);
}
