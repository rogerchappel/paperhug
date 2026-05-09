import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
}

export async function loadOccasions() {
  return readJson('templates/occasions.json');
}

export async function loadStyles() {
  return readJson('templates/styles.json');
}

export async function findOccasion(input) {
  const normalized = normalizeId(input || 'custom');
  const occasions = await loadOccasions();
  return occasions.find((occasion) => {
    const ids = [occasion.id, occasion.name, ...(occasion.aliases || [])].map(normalizeId);
    return ids.includes(normalized);
  }) || occasions.find((occasion) => occasion.id === 'custom');
}

export async function findStyle(input) {
  const styles = await loadStyles();
  if (!input) return styles[0];
  const normalized = normalizeId(input);
  return styles.find((style) => normalizeId(style.id) === normalized || normalizeId(style.name) === normalized) || {
    id: slugify(input),
    name: input,
    prompt: input
  };
}

export function normalizeId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function slugify(value) {
  return normalizeId(value).slice(0, 80) || 'card';
}
