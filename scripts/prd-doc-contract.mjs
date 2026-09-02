import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const commandOptions = {
  quick: new Set(['occasion', 'for', 'to', 'recipient', 'from', 'style', 'message', 'idea', 'tone', 'text', 'title', 'inside-style', 'font', 'reference', 'provider', 'model', 'image-model', 'out', 'cover-title', 'copy-references', 'force']),
  wizard: new Set(['provider', 'out']),
  refine: new Set(['note', 'setMessage', 'message', 'text']),
  render: new Set(),
  templates: new Set(),
  providers: new Set()
};
const aliases = new Set(['birthday', 'mothers-day', 'mother', 'mum', 'mom', 'fathers-day', 'father', 'dad', 'anniversary', 'thank-you', 'thanks', 'thankyou', 'congratulations', 'congrats', 'new-baby', 'baby', 'custom']);

export function validatePrdExamples(markdown) {
  const errors = [];
  const blocks = [...markdown.matchAll(/```(?:bash|sh)\s*\n([\s\S]*?)```/g)];

  for (const block of blocks) {
    const lines = block[1].replace(/\\\s*\n/g, ' ').split('\n');
    for (const source of lines) {
      const line = source.trim();
      if (!line || line.startsWith('#')) continue;
      if (/^npx\s+paperhug(?:\s|$)/.test(line)) {
        errors.push('uses unpublished `npx paperhug` instead of the documented local-tarball install');
        continue;
      }
      if (!line.startsWith('paperhug ')) continue;

      const tokens = line.match(/"[^"]*"|'[^']*'|\S+/g) || [];
      const rawCommand = tokens[1];
      const command = aliases.has(rawCommand) ? 'quick' : rawCommand;
      const allowed = commandOptions[command];
      if (!allowed) {
        errors.push(`uses unsupported command: ${rawCommand}`);
        continue;
      }
      for (const token of tokens.slice(2)) {
        if (!token.startsWith('--')) continue;
        const option = token.slice(2).replace(/^no-/, '');
        if (!allowed.has(option)) errors.push(`uses unsupported option for ${rawCommand}: ${token}`);
      }
      const providerIndex = tokens.indexOf('--provider');
      if (providerIndex >= 0 && tokens[providerIndex + 1]?.replace(/^['"]|['"]$/g, '') === 'nano-banana') {
        errors.push('uses future-only provider `nano-banana` in a runnable command');
      }
    }
  }
  return errors;
}

export async function checkPrd(root = '.') {
  const documents = ['docs/PRD.md', 'docs/ORCHESTRATION.md'];
  const errors = [];
  for (const document of documents) {
    const markdown = await readFile(resolve(root, document), 'utf8');
    errors.push(...validatePrdExamples(markdown).map((error) => `${document}: ${error}`));
  }
  if (errors.length) throw new Error(`Executable documentation contract failed:\n- ${errors.join('\n- ')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await checkPrd(process.argv[2] || '.');
  console.log('Executable documentation contract passed');
}
