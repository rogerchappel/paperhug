import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const A4 = { width: 595.28, height: 841.89 };
const A4_LANDSCAPE = { width: 841.89, height: 595.28 };

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

function pageContent(lines, page = A4) {
  const commands = ['q', `1 1 1 rg 0 0 ${page.width} ${page.height} re f`, '0.12 0.12 0.12 rg'];
  let y = page.height - 82;
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

function drawText({ text, x, y, size = 14, max = 68, leading = Math.round(size * 1.45) }) {
  const commands = [];
  let cursorY = y;
  for (const line of wrapText(text, max)) {
    commands.push(`BT /F1 ${size} Tf ${x} ${cursorY} Td (${escapePdfText(line)}) Tj ET`);
    cursorY -= leading;
  }
  return commands.join('\n');
}

function landscapeOutsideContent(project, hasArtwork) {
  const half = A4_LANDSCAPE.width / 2;
  const artBox = { x: half + 56, y: 56, width: half - 112, height: A4_LANDSCAPE.height - 112 };
  const commands = [
    'q',
    `1 1 1 rg 0 0 ${A4_LANDSCAPE.width} ${A4_LANDSCAPE.height} re f`,
    '0.72 0.62 0.50 RG 1 w',
    `${half} 0 m ${half} ${A4_LANDSCAPE.height} l S`,
    '0.82 0.70 0.56 RG 2 w',
    `36 36 ${half - 72} ${A4_LANDSCAPE.height - 72} re S`,
    '0.93 0.87 0.78 RG 1 w',
    `48 48 ${half - 96} ${A4_LANDSCAPE.height - 96} re S`,
    '0.82 0.70 0.56 RG 2 w',
    `${half + 36} 36 ${half - 72} ${A4_LANDSCAPE.height - 72} re S`,
    '0.93 0.87 0.78 RG 1 w',
    `${half + 48} 48 ${half - 96} ${A4_LANDSCAPE.height - 96} re S`,
    '0.24 0.19 0.16 rg',
    drawText({ text: 'Made with love', x: 82, y: 318, size: 18, max: 28 }),
    drawText({ text: `by ${project.sender}`, x: 82, y: 286, size: 16, max: 28 })
  ];

  if (hasArtwork) {
    commands.push(
      'q',
      `${artBox.x} ${artBox.y} ${artBox.width} ${artBox.height} re W n`,
      `${artBox.width} 0 0 ${artBox.height} ${artBox.x} ${artBox.y} cm /Im1 Do`,
      'Q',
      '1 1 1 rg',
      `${artBox.x + 24} ${A4_LANDSCAPE.height - 152} ${artBox.width - 48} 74 re f`,
      '0.68 0.54 0.35 RG 1.25 w',
      `${artBox.x + 24} ${A4_LANDSCAPE.height - 152} ${artBox.width - 48} 74 re S`
    );
  } else {
    commands.push(
      '1 1 1 rg',
      `${artBox.x} ${artBox.y} ${artBox.width} ${artBox.height} re f`,
      '0.95 0.79 0.69 RG 2 w',
      `${artBox.x} ${artBox.y} ${artBox.width} ${artBox.height} re S`,
      '1 0.82 0.76 rg',
      `${artBox.x + 34} ${artBox.y + artBox.height - 190} 72 72 re f`,
      '0.83 0.93 0.85 rg',
      `${artBox.x + artBox.width - 118} ${artBox.y + 74} 82 82 re f`,
      '0.68 0.58 0.94 RG 8 w',
      `${artBox.x + 56} ${artBox.y + 130} m ${artBox.x + 142} ${artBox.y + 222} ${artBox.x + 214} ${artBox.y + 92} ${artBox.x + 252} ${artBox.y + 186} c S`,
      '0.46 0.38 0.28 rg',
      drawText({ text: 'Prompt-only draft', x: artBox.x + 70, y: artBox.y + 102, size: 11, max: 26 })
    );
  }

  commands.push(
    '0.12 0.10 0.10 rg',
    drawText({ text: project.coverTitle || 'For You', x: artBox.x + 44, y: A4_LANDSCAPE.height - 106, size: 24, max: 24, leading: 28 }),
    'Q'
  );
  return commands.join('\n');
}

function landscapeInsideContent(project) {
  const half = A4_LANDSCAPE.width / 2;
  const commands = [
    'q',
    `1 1 1 rg 0 0 ${A4_LANDSCAPE.width} ${A4_LANDSCAPE.height} re f`,
    '0.72 0.62 0.50 RG 1 w',
    `${half} 0 m ${half} ${A4_LANDSCAPE.height} l S`,
    '0.82 0.70 0.56 RG 2 w',
    `36 36 ${half - 72} ${A4_LANDSCAPE.height - 72} re S`,
    '0.93 0.87 0.78 RG 1 w',
    `48 48 ${half - 96} ${A4_LANDSCAPE.height - 96} re S`,
    '0.82 0.70 0.56 RG 2 w',
    `${half + 36} 36 ${half - 72} ${A4_LANDSCAPE.height - 72} re S`,
    '0.93 0.87 0.78 RG 1 w',
    `${half + 48} 48 ${half - 96} ${A4_LANDSCAPE.height - 96} re S`,
    '0.28 0.22 0.18 rg',
    drawText({ text: `For ${project.recipient}`, x: 82, y: 322, size: 20, max: 28 }),
    drawText({ text: `from ${project.sender}`, x: 82, y: 288, size: 16, max: 28 })
  ];

  let y = 392;
  for (const line of wrapText(project.message, 34)) {
    commands.push(`BT /F1 21 Tf ${half + 75} ${y} Td (${escapePdfText(line)}) Tj ET`);
    y -= 34;
  }

  commands.push('Q');
  return commands.join('\n');
}

export function createPdf(pages, page = A4) {
  const objects = [];
  const add = (body) => {
    objects.push(Buffer.isBuffer(body) ? body : Buffer.from(body, 'binary'));
    return objects.length;
  };

  const catalogId = add('');
  const pagesId = add('');
  const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageIds = [];

  for (const rawPage of pages) {
    const spec = typeof rawPage === 'string' ? { content: rawPage, images: [] } : rawPage;
    const xobjects = [];
    for (const image of spec.images || []) {
      const header = `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.data.length} >>\nstream\n`;
      const footer = '\nendstream';
      const id = add(Buffer.concat([Buffer.from(header, 'binary'), image.data, Buffer.from(footer, 'binary')]));
      xobjects.push({ name: image.name, id });
    }

    const content = spec.content;
    const contentId = add(`<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`);
    const xobjectResources = xobjects.length
      ? ` /XObject << ${xobjects.map((image) => `/${image.name} ${image.id} 0 R`).join(' ')} >>`
      : '';
    const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources << /Font << /F1 ${fontId} 0 R >>${xobjectResources} >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  }

  objects[catalogId - 1] = Buffer.from(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`, 'binary');
  objects[pagesId - 1] = Buffer.from(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`, 'binary');

  const chunks = [Buffer.from('%PDF-1.4\n', 'binary')];
  const offsets = [0];
  for (const [index, body] of objects.entries()) {
    offsets.push(Buffer.concat(chunks).length);
    chunks.push(Buffer.from(`${index + 1} 0 obj\n`, 'binary'), body, Buffer.from('\nendobj\n', 'binary'));
  }
  const beforeXref = Buffer.concat(chunks);
  let trailer = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    trailer += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  trailer += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${beforeXref.length}\n%%EOF\n`;
  return Buffer.concat([beforeXref, Buffer.from(trailer, 'binary')]);
}

export async function renderProject(project, outputDir) {
  await mkdir(path.join(outputDir, 'prompts'), { recursive: true });
  await mkdir(path.join(outputDir, 'assets'), { recursive: true });

  await writeFile(path.join(outputDir, 'prompts', 'image-prompt.txt'), `${project.prompts.imagePrompt}\n`, 'utf8');
  await writeFile(path.join(outputDir, 'prompts', 'text-prompt.txt'), `${project.prompts.textPrompt}\n`, 'utf8');

  const artwork = project.artwork?.path ? await loadArtwork(project, outputDir) : null;
  const svg = createPlaceholderSvg(project);
  if (!artwork) {
    await writeFile(path.join(outputDir, 'assets', 'front.svg'), svg, 'utf8');
  }
  await writeFile(path.join(outputDir, 'preview.svg'), svg, 'utf8');

  const isLandscapeFold = project.layout?.id === 'a4-landscape-fold-half';
  if (isLandscapeFold) {
    const outside = { content: landscapeOutsideContent(project, Boolean(artwork)), images: artwork ? [{ name: 'Im1', ...artwork }] : [] };
    const inside = { content: landscapeInsideContent(project), images: [] };
    await writeFile(path.join(outputDir, 'front.pdf'), createPdf([outside], A4_LANDSCAPE), 'binary');
    await writeFile(path.join(outputDir, 'back.pdf'), createPdf([inside], A4_LANDSCAPE), 'binary');
    await writeFile(path.join(outputDir, 'card.pdf'), createPdf([outside, inside], A4_LANDSCAPE), 'binary');
  } else {
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
  }

  const readme = `paperhug print instructions\n\n1. Open card.pdf.\n2. Print the two A4 pages at 100% scale.\n3. Trim if needed.\n4. Glue the front and inside/back pages to folded cardstock.\n\nImage prompt:\n${project.prompts.imagePrompt}\n\nText prompt:\n${project.prompts.textPrompt}\n`;
  await writeFile(path.join(outputDir, 'README.txt'), readme, 'utf8');

  project.outputs = {
    project: 'project.json',
    cardPdf: 'card.pdf',
    frontPdf: 'front.pdf',
    backPdf: 'back.pdf',
    preview: 'preview.svg',
    frontArtwork: project.artwork?.path || 'assets/front.svg'
  };
  return project.outputs;
}

async function loadArtwork(project, outputDir) {
  const artworkPath = path.resolve(outputDir, project.artwork.path);
  const data = await readFile(artworkPath);
  return {
    data,
    width: project.artwork.width || 1024,
    height: project.artwork.height || 1536
  };
}

function createPlaceholderSvg(project) {
  const title = escapeXml(project.coverTitle || 'For You');
  const subtitle = escapeXml(`${project.occasion.name} for ${project.recipient}`);
  const style = escapeXml(project.style.name);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1754" height="1240" viewBox="0 0 1754 1240" role="img" aria-label="paperhug preview">\n  <rect width="1754" height="1240" fill="#ffffff"/>\n  <line x1="877" y1="0" x2="877" y2="1240" stroke="#b8a085" stroke-width="4"/>\n  <rect x="90" y="90" width="697" height="1060" fill="#ffffff" stroke="#d2b58f" stroke-width="8"/>\n  <rect x="116" y="116" width="645" height="1008" fill="none" stroke="#eee1cf" stroke-width="3"/>\n  <rect x="967" y="90" width="697" height="1060" fill="#ffffff" stroke="#d2b58f" stroke-width="8"/>\n  <rect x="993" y="116" width="645" height="1008" fill="none" stroke="#eee1cf" stroke-width="3"/>\n  <circle cx="1080" cy="330" r="70" fill="#ffd3c2"/>\n  <circle cx="1550" cy="980" r="110" fill="#d8f3dc"/>\n  <path d="M1050 960 C1170 820 1320 1120 1460 950 S1620 920 1630 1060" fill="none" stroke="#b7b7ff" stroke-width="18" stroke-linecap="round"/>\n  <text x="1315" y="560" text-anchor="middle" font-family="Georgia, serif" font-size="72" fill="#2f2a2a">${title}</text>\n  <text x="1315" y="640" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#5f5a5a">${subtitle}</text>\n  <text x="1315" y="705" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#837b7b">${style}</text>\n  <text x="1315" y="1110" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#9b8f8f">prompt-only placeholder • use an image provider for generated artwork</text>\n</svg>\n`;
}

function escapeXml(value) {
  return String(value).replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}
