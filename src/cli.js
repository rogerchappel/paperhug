#!/usr/bin/env node
import { spawn } from 'node:child_process';
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

const optionSchemas = {
  quick: {
    values: new Set(['occasion', 'for', 'to', 'recipient', 'from', 'style', 'message', 'idea', 'tone', 'text', 'title', 'inside-style', 'font', 'reference', 'provider', 'model', 'image-model', 'out']),
    booleans: new Set(['cover-title', 'copy-references', 'force']),
    repeatable: new Set(['reference'])
  },
  wizard: { values: new Set(['provider', 'out']), booleans: new Set(), repeatable: new Set() },
  render: { values: new Set(), booleans: new Set(), repeatable: new Set() },
  print: { values: new Set(['printer', 'duplex']), booleans: new Set(['dry-run']), negatable: new Set(['duplex']), repeatable: new Set() },
  refine: { values: new Set(['note', 'setMessage', 'message', 'text']), booleans: new Set(), repeatable: new Set() }
};

async function main(argv = process.argv.slice(2)) {
  const [rawCommand, ...rest] = argv;
  const command = rawCommand || 'help';

  if (command === 'help' || command === '--help' || command === '-h') return help();
  if (command === 'templates') return templates(rest);
  if (command === 'providers') return providersCommand(rest);
  if (command === 'quick') return quick(rest);
  if (command === 'wizard') return wizard(rest);
  if (command === 'render') return render(rest);
  if (command === 'print') return printCard(rest);
  if (command === 'refine') return refine(rest);
  if (occasionAliases.has(command)) return quick(rest, command);

  throw new Error(`Unknown command: ${command}. Run paperhug help.`);
}

function requirePositionalArity(parsed, { command, min = 0, max = min, usage }) {
  if (parsed._.length < min || parsed._.length > max) {
    throw new Error(`Usage: paperhug ${usage || command}`);
  }
}

function parseArgs(args, command) {
  const schema = optionSchemas[command];
  const values = { _: [] };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) {
      values._.push(arg);
      continue;
    }
    const option = arg.slice(2);
    const negatedKey = option.startsWith('no-') ? option.slice(3) : null;
    if (negatedKey) {
      const negatable = schema.negatable || schema.booleans;
      if (!negatable.has(negatedKey)) throw new Error(`Unknown option for ${command}: --${option}`);
      values[negatedKey] = false;
      continue;
    }
    if (schema.booleans.has(option)) {
      values[option] = true;
      continue;
    }
    if (!schema.values.has(option)) throw new Error(`Unknown option for ${command}: --${option}`);
    const next = args[index + 1];
    if (!next || next.startsWith('--')) {
      throw new Error(`Option --${option} requires a value.`);
    }
    index += 1;
    if (schema.repeatable.has(option)) values[option] = [...(values[option] || []), next];
    else values[option] = next;
  }
  return values;
}

async function quick(args, occasionAlias = null) {
  const parsed = parseArgs(args, 'quick');
  requirePositionalArity(parsed, {
    command: occasionAlias || 'quick',
    max: occasionAlias ? 0 : 1,
    usage: occasionAlias ? `${occasionAlias} [options]` : 'quick <occasion> [options]'
  });
  const occasionId = occasionAlias || parsed._[0] || parsed.occasion || 'custom';
  const recipient = parsed.for || parsed.to || parsed.recipient;
  if (!recipient) throw new Error('quick requires --for <recipient>.');

  const sender = parsed.from || 'Me';
  const messageBrief = buildMessageBrief(parsed);
  const coverTitle = parsed['cover-title'] === false || parsed.title === 'none' ? false : parsed.title;
  const insideStyle = parsed['inside-style'] || parsed.font || 'classic-serif';
  const occasion = await findOccasion(occasionId);
  const style = await findStyle(parsed.style || 'warm-watercolour');
  const provider = findProvider(parsed.provider || 'none');
  const outputDir = path.resolve(defaultOutputDir(parsed.out || 'dist', occasion.id, recipient));

  if (parsed.force) await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  const references = await prepareReferences(parsed.reference || [], outputDir, parsed['copy-references'] !== false);
  const prompts = buildPrompts({ occasion, style, recipient, sender, messageBrief, references, coverTitle });
  const message = parsed.text || defaultMessage({ occasion, recipient, sender, messageBrief });
  const project = createProject({ occasion, style, recipient, sender, messageBrief, provider: provider.id, model: parsed.model, references, prompts, message, coverTitle, insideStyle });

  await generateArtwork({ provider, project, outputDir, model: parsed['image-model'] || parsed.model });
  await renderProject(project, outputDir);
  await saveProject(path.join(outputDir, 'project.json'), project);

  console.log(JSON.stringify({
    ok: true,
    outputDir,
    project: path.join(outputDir, 'project.json'),
    cardPdf: path.join(outputDir, 'card.pdf'),
    preview: path.join(outputDir, 'preview.svg'),
    provider: provider.id,
    note: provider.id === 'none'
      ? 'Prompt-only mode: no network calls or image uploads were made.'
      : provider.id === 'openai'
        ? 'OpenAI generated front-cover artwork and embedded it into the printable PDF.'
        : 'Provider generation completed.'
  }, null, 2));
}

function buildMessageBrief(parsed) {
  if (parsed.idea && parsed.message && parsed.idea !== parsed.message) {
    return `Idea: ${parsed.idea}. Tone: ${parsed.message}`;
  }
  return parsed.idea || parsed.message || parsed.tone || 'warm and personal';
}

async function wizard(args) {
  const parsed = parseArgs(args, 'wizard');
  requirePositionalArity(parsed, { command: 'wizard', usage: 'wizard' });
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
  const parsed = parseArgs(args, 'render');
  requirePositionalArity(parsed, { command: 'render', min: 1, max: 1, usage: 'render <project.json>' });
  const projectPath = parsed._[0];
  const project = await readProject(projectPath);
  const outputDir = path.dirname(path.resolve(projectPath));
  await renderProject(project, outputDir);
  await saveProject(path.join(outputDir, 'project.json'), project);
  console.log(JSON.stringify({ ok: true, outputDir, cardPdf: path.join(outputDir, 'card.pdf') }, null, 2));
}

async function printCard(args) {
  const parsed = parseArgs(args, 'print');
  requirePositionalArity(parsed, { command: 'print', min: 1, max: 1, usage: 'print <project.json|card.pdf> [options]' });
  const target = parsed._[0];

  const resolvedTarget = path.resolve(target);
  const pdfPath = resolvedTarget.endsWith('.json') ? path.join(path.dirname(resolvedTarget), 'card.pdf') : resolvedTarget;
  const printer = parsed.printer || process.env.PAPERHUG_PRINTER;
  const duplex = parsed.duplex === false || parsed.duplex === 'none'
    ? null
    : parsed.duplex === 'long-edge'
      ? 'DuplexNoTumble'
      : 'DuplexTumble';
  const lpArgs = [
    ...(printer ? ['-d', printer] : []),
    '-o', 'landscape',
    '-o', 'PageSize=A4',
    '-o', 'fit-to-page',
    ...(duplex ? ['-o', `Duplex=${duplex}`, '-o', 'sides=two-sided-short-edge'] : []),
    pdfPath
  ];

  if (parsed['dry-run']) {
    console.log(JSON.stringify({ ok: true, command: 'lp', args: lpArgs, pdf: pdfPath, printer: printer || null, landscape: true, duplex: duplex || 'none' }, null, 2));
    return;
  }

  const result = await runPrintCommand('lp', lpArgs);
  console.log(JSON.stringify({ ok: true, pdf: pdfPath, printer: printer || 'default', landscape: true, duplex: duplex || 'none', output: result.trim() }, null, 2));
}

function runPrintCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr.trim() || `${command} exited with code ${code}`));
    });
  });
}

async function refine(args) {
  const parsed = parseArgs(args, 'refine');
  requirePositionalArity(parsed, { command: 'refine', min: 1, max: 1, usage: 'refine <project.json> [options]' });
  const projectPath = parsed._[0];
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
  const parsed = { _: args };
  requirePositionalArity(parsed, { command: 'templates', max: 1, usage: 'templates [list]' });
  const sub = parsed._[0] || 'list';
  if (sub !== 'list') throw new Error('templates only supports: list');
  console.log(JSON.stringify({ occasions: await loadOccasions(), styles: await loadStyles() }, null, 2));
}

async function providersCommand(args) {
  const parsed = { _: args };
  requirePositionalArity(parsed, { command: 'providers', max: 1, usage: 'providers [list]' });
  const sub = parsed._[0] || 'list';
  if (sub !== 'list') throw new Error('providers only supports: list');
  console.log(JSON.stringify({ providers: providers.map(providerStatus) }, null, 2));
}

function help() {
  console.log(`paperhug — print-at-home greeting cards from a friendly CLI\n\nUsage:\n  paperhug quick <occasion> --for <name> [--from <name>] [--style <style>] [--message <brief>] [--idea <story>] [--inside-style classic-serif|modern-sans|typewriter|script] [--reference <path>] [--provider none|openai]\n  paperhug birthday --for Mum --style "warm watercolour garden" --message "funny and grateful"\n  paperhug wizard\n  paperhug refine <project.json> --note "less cheesy"\n  paperhug render <project.json>\n  paperhug print <project.json|card.pdf> [--printer <name>] [--no-duplex] [--dry-run]\n  paperhug templates [list]\n  paperhug providers [list]\n\nDefault provider is none, which makes no network calls and writes prompts plus printable placeholder PDFs. Use --provider openai with OPENAI_API_KEY for generated front-cover artwork embedded in the printable PDF. Use --no-cover-title when the generated artwork should carry any stylized text itself.\n\nThe print command always sends A4 landscape output by default and uses double-sided short-edge duplex unless --no-duplex is supplied.`);
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exitCode = 1;
});
