import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const A4 = { width: 595.28, height: 841.89 };

function escapePdfText(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapText(text, max = 68) {
  const lines = [];
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const words = rawLine.split(/\s+/).filter(Boolean);
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > max) {
        if (line) lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line || ' ');
  }
  return lines;
}

function pageContent(lines) {
  const commands = ['q', '1 1 1 rg 0 0 595.28 841.89 re f', '0.12 0.12 0.12 rg'];
  let y = 760;
  for (const item of lines) {
    const size = item.size || 14;
    const x = item.x || 72;
    const leading = item.leading || Math.round(size * 1.45);
    for (const line of wrapText(item.text, item.max || 68)) {
      commands.push(`BT /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(line)}) Tj ET`);
      y -= leading;
    }
    y -= item.gap || 8;
  }
  commands.push('Q');
  return commands.join('\n');
}

export function createPdf(pages) {
  const objects = [];
  const add = (body) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = add('');
  const pagesId = add('');
  const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageIds = [];

  for (const content of pages) {
    const contentId = add(`<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`);
    const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${A4.width} ${A4.height}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  }

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const [index, body] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return pdf;
}

export async function renderProject(project, outputDir) {
  await mkdir(path.join(outputDir, 'prompts'), { recursive: true });
  await mkdir(path.join(outputDir, 'assets'), { recursive: true });

  await writeFile(path.join(outputDir, 'prompts', 'image-prompt.txt'), `${project.prompts.imagePrompt}\n`, 'utf8');
  await writeFile(path.join(outputDir, 'prompts', 'text-prompt.txt'), `${project.prompts.textPrompt}\n`, 'utf8');

  const svg = createPlaceholderSvg(project);
  await writeFile(path.join(outputDir, 'assets', 'front.svg'), svg, 'utf8');
  await writeFile(path.join(outputDir, 'preview.svg'), svg, 'utf8');

  const front = pageContent([
    { text: project.coverTitle, size: 34, max: 28, gap: 24 },
    { text: `Artwork prompt: ${project.prompts.imagePrompt}`, size: 12, max: 76 },
    { text: 'Replace this placeholder with generated artwork when using an image provider.', size: 11, max: 72 }
  ]);
  const back = pageContent([
    { text: project.message, size: 22, max: 45, gap: 24 },
    { text: `For: ${project.recipient}`, size: 12 },
    { text: `From: ${project.sender}`, size: 12 },
    { text: 'Print instructions: print both A4 pages, trim if desired, and glue to folded cardstock.', size: 11, max: 76 },
    { text: `Made with paperhug • ${project.occasion.name} • ${project.style.name}`, size: 9, max: 80 }
  ]);

  await writeFile(path.join(outputDir, 'front.pdf'), createPdf([front]), 'binary');
  await writeFile(path.join(outputDir, 'back.pdf'), createPdf([back]), 'binary');
  await writeFile(path.join(outputDir, 'card.pdf'), createPdf([front, back]), 'binary');

  const readme = `paperhug print instructions\n\n1. Open card.pdf.\n2. Print the two A4 pages at 100% scale.\n3. Trim if needed.\n4. Glue the front and inside/back pages to folded cardstock.\n\nImage prompt:\n${project.prompts.imagePrompt}\n\nText prompt:\n${project.prompts.textPrompt}\n`;
  await writeFile(path.join(outputDir, 'README.txt'), readme, 'utf8');

  project.outputs = {
    project: 'project.json',
    cardPdf: 'card.pdf',
    frontPdf: 'front.pdf',
    backPdf: 'back.pdf',
    preview: 'preview.svg',
    frontArtwork: 'assets/front.svg'
  };
  return project.outputs;
}

function createPlaceholderSvg(project) {
  const title = escapeXml(project.coverTitle || 'For You');
  const subtitle = escapeXml(`${project.occasion.name} for ${project.recipient}`);
  const style = escapeXml(project.style.name);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1754" viewBox="0 0 1240 1754" role="img" aria-label="paperhug preview">\n  <rect width="1240" height="1754" fill="#fff8f0"/>\n  <rect x="90" y="90" width="1060" height="1574" rx="48" fill="#ffffff" stroke="#f0c9b5" stroke-width="8"/>\n  <circle cx="220" cy="250" r="70" fill="#ffd3c2"/>\n  <circle cx="1010" cy="1480" r="110" fill="#d8f3dc"/>\n  <path d="M270 1320 C430 1180 620 1510 820 1320 S1080 1270 1090 1420" fill="none" stroke="#b7b7ff" stroke-width="18" stroke-linecap="round"/>\n  <text x="620" y="760" text-anchor="middle" font-family="Georgia, serif" font-size="88" fill="#2f2a2a">${title}</text>\n  <text x="620" y="850" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" fill="#5f5a5a">${subtitle}</text>\n  <text x="620" y="930" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#837b7b">${style}</text>\n  <text x="620" y="1590" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#9b8f8f">prompt-only placeholder • replace with generated artwork</text>\n</svg>\n`;
}

function escapeXml(value) {
  return String(value).replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}
