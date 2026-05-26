import { mkdir, readFile, writeFile, copyFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { slugify } from './templates.js';

export function createProject({ occasion, style, recipient, sender, messageBrief, provider, model, references, prompts, message, coverTitle }) {
  const now = new Date().toISOString();
  return {
    version: '0.1.0',
    createdAt: now,
    updatedAt: now,
    occasion: { id: occasion.id, name: occasion.name },
    recipient,
    sender,
    style: { id: style.id, name: style.name, prompt: style.prompt },
    layout: { id: 'a4-landscape-fold-half', page: 'A4 landscape', workflow: 'print two landscape A4 pages duplex, flip on short edge if available, then fold on the centre line' },
    provider: { id: provider || 'none', model: model || null },
    references,
    coverTitle: coverTitle || occasion.coverTitle,
    messageBrief,
    prompts,
    message,
    outputs: {},
    revisions: [
      { at: now, note: 'Initial card draft generated.' }
    ]
  };
}

export async function readProject(projectPath) {
  return JSON.parse(await readFile(projectPath, 'utf8'));
}

export async function saveProject(projectPath, project) {
  project.updatedAt = new Date().toISOString();
  await writeFile(projectPath, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
}

export function defaultOutputDir(baseOut, occasionId, recipient) {
  return path.join(baseOut || 'dist', `${slugify(occasionId)}-for-${slugify(recipient)}`);
}

export async function prepareReferences(referencePaths = [], outputDir, copyReferences = true) {
  const refs = [];
  for (const [index, refPath] of referencePaths.entries()) {
    const resolved = path.resolve(refPath);
    const info = await stat(resolved);
    const ext = path.extname(resolved) || '.img';
    const record = {
      id: `reference-${index + 1}`,
      originalPath: resolved,
      bytes: info.size,
      copiedPath: null
    };
    if (copyReferences) {
      const destination = path.join(outputDir, 'assets', `${record.id}${ext}`);
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(resolved, destination);
      record.copiedPath = path.relative(outputDir, destination);
    }
    refs.push(record);
  }
  return refs;
}
