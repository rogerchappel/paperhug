#!/usr/bin/env node
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import {
  buildPrompts,
  createProject,
  defaultMessage,
  defaultOutputDir,
  findOccasion,
  findProvider,
  findStyle,
  generateArtwork,
  loadOccasions,
  loadStyles,
  prepareReferences,
  providers,
  providerStatus,
  readProject,
  renderProject,
  saveProject
} from './index.js';

const occasionAliases = new Set(['birthday', 'mothers-day', 'mother', 'mum', 'mom', 'fathers-day', 'father', 'dad', 'anniversary', 'thank-you', 'thanks', 'thankyou', 'congratulations', 'congrats', 'new-baby', 'baby', 'custom']);

async function main(argv = process.argv.slice(2)) {
  const [rawCommand, ...rest] = argv;
  const command = rawCommand || 'help';

  if (command === 'help' || command === '--help' || command === '-h') return help();
  if (command === 'templates') return templates(rest);
  if (command === 'providers') return providersCommand(rest);
  if (command === 'quick') return quick(rest);
  if (command === 'wizard') return wizard(rest);
  if (command === 'render') return render(rest);
  if (command === 'refine') return refine(rest);
  if (occasionAliases.has(command)) return quick([command, ...rest]);

  throw new Error(`Unknown command: ${command}. Run paperhug help.`);
}

function parseArgs(args) {
  const values = { _: [] };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) {
      values._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    if (key.startsWith('no-')) {
      values[key.slice(3)] = false;
      continue;
    }
    const next = args[index + 1];
    if (!next || next.startsWith('--')) {
      values[key] = true;
      continue;
    }
    index += 1;
    if (key === 'reference') values.reference = [...(values.reference || []), next];
    else values[key] = next;
  }
  return values;
}

async function quick(args) {
  const parsed = parseArgs(args);
  const occasionId = parsed._[0] || parsed.occasion || 'custom';
  const recipient = parsed.for || parsed.to || parsed.recipient;
  if (!recipient) throw new Error('quick requires --for <recipient>.');

  const sender = parsed.from || 'Me';
  const messageBrief = parsed.message || parsed.tone || 'warm and personal';
  const occasion = await findOccasion(occasionId);
  const style = await findStyle(parsed.style || 'warm-watercolour');
  const provider = findProvider(parsed.provider || 'none');
  const outputDir = path.resolve(defaultOutputDir(parsed.out || 'dist', occasion.id, recipient));

  if (parsed.force) await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  const references = await prepareReferences(parsed.reference || [], outputDir, parsed['copy-references'] !== false);
  const prompts = buildPrompts({ occasion, style, recipient, sender, messageBrief, references, coverTitle: parsed.title });
  const message = parsed.text || defaultMessage({ occasion, recipient, sender, messageBrief });
  const project = createProject({ occasion, style, recipient, sender, messageBrief, provider: provider.id, model: parsed.model, references, prompts, message, coverTitle: parsed.title });

  await generateArtwork({ provider, project });
  await renderProject(project, outputDir);
  await saveProject(path.join(outputDir, 'project.json'), project);

  console.log(JSON.stringify({
    ok: true,
    outputDir,
    project: path.join(outputDir, 'project.json'),
    cardPdf: path.join(outputDir, 'card.pdf'),
    preview: path.join(outputDir, 'preview.svg'),
    provider: provider.id,
    note: provider.id === 'none' ? 'Prompt-only mode: no network calls or image uploads were made.' : 'Provider generation completed.'
  }, null, 2));
}

async function wizard(args) {
  const parsed = parseArgs(args);
  const rl = readline.createInterface({ input, output });
  try {
    const occasion = await rl.question('Occasion (birthday, mothers-day, fathers-day, anniversary, thank-you, congratulations, new-baby, custom): ') || 'custom';
    const recipient = await rl.question('Who is it for? ');
    const sender = await rl.question('Who is it from? ') || 'Me';
    const style = await rl.question('Style (e.g. warm-watercolour, kids-crayon, native flowers): ') || 'warm-watercolour';
    const message = await rl.question('Message/tone brief: ') || 'warm and personal';
    await quick([occasion, '--for', recipient, '--from', sender, '--style', style, '--message', message, '--provider', parsed.provider || 'none', '--out', parsed.out || 'dist']);
  } finally {
    rl.close();
  }
}

async function render(args) {
  const parsed = parseArgs(args);
  const projectPath = parsed._[0];
  if (!projectPath) throw new Error('render requires <project.json>.');
  const project = await readProject(projectPath);
  const outputDir = path.dirname(path.resolve(projectPath));
  await renderProject(project, outputDir);
  await saveProject(path.join(outputDir, 'project.json'), project);
  console.log(JSON.stringify({ ok: true, outputDir, cardPdf: path.join(outputDir, 'card.pdf') }, null, 2));
}

async function refine(args) {
  const parsed = parseArgs(args);
  const projectPath = parsed._[0];
  if (!projectPath) throw new Error('refine requires <project.json>.');
  const project = await readProject(projectPath);
  let note = parsed.note || parsed.setMessage || parsed.message;
  if (!note) {
    const rl = readline.createInterface({ input, output });
    try {
      note = await rl.question('What should change? ');
    } finally {
      rl.close();
    }
  }
  if (!note) throw new Error('No refinement note supplied.');

  if (parsed.text) project.message = parsed.text;
  else project.message = `${project.message}\n\nRevision note: ${note}`;
  project.revisions.push({ at: new Date().toISOString(), note });
  await renderProject(project, path.dirname(path.resolve(projectPath)));
  await saveProject(projectPath, project);
  console.log(JSON.stringify({ ok: true, project: path.resolve(projectPath), revision: project.revisions.length }, null, 2));
}

async function templates(args) {
  const sub = args[0] || 'list';
  if (sub !== 'list') throw new Error('templates only supports: list');
  console.log(JSON.stringify({ occasions: await loadOccasions(), styles: await loadStyles() }, null, 2));
}

async function providersCommand(args) {
  const sub = args[0] || 'list';
  if (sub !== 'list') throw new Error('providers only supports: list');
  console.log(JSON.stringify({ providers: providers.map(providerStatus) }, null, 2));
}

function help() {
  console.log(`paperhug — print-at-home greeting cards from a friendly CLI\n\nUsage:\n  paperhug quick <occasion> --for <name> [--from <name>] [--style <style>] [--message <brief>] [--reference <path>] [--provider none]\n  paperhug birthday --for Mum --style "warm watercolour garden" --message "funny and grateful"\n  paperhug wizard\n  paperhug refine <project.json> --note "less cheesy"\n  paperhug render <project.json>\n  paperhug templates list\n  paperhug providers list\n\nDefault provider is none, which makes no network calls and writes prompts plus printable placeholder PDFs.`);
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exitCode = 1;
});
