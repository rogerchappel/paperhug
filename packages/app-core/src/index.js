export const occasions = [
  { id: 'birthday', name: 'Birthday', coverTitle: 'Happy Birthday', prompt: 'a joyful birthday card' },
  { id: 'mothers-day', name: "Mother's Day", coverTitle: "Happy Mother's Day", prompt: 'a warm and grateful Mother\'s Day card' },
  { id: 'fathers-day', name: "Father's Day", coverTitle: "Happy Father's Day", prompt: 'a warm and grateful Father\'s Day card' },
  { id: 'anniversary', name: 'Anniversary', coverTitle: 'Happy Anniversary', prompt: 'a romantic anniversary card' },
  { id: 'thank-you', name: 'Thank you', coverTitle: 'Thank You', prompt: 'a thoughtful thank-you card' },
  { id: 'custom', name: 'Custom', coverTitle: 'For You', prompt: 'a personal greeting card' }
];

export const styles = [
  { id: 'warm-watercolour', name: 'Warm watercolour', prompt: 'soft warm watercolour, handmade, gentle paper texture' },
  { id: 'kids-crayon', name: 'Kids crayon', prompt: 'playful childlike crayon drawing, bright colours, imperfect and charming' },
  { id: 'native-flowers', name: 'Australian native flowers', prompt: 'elegant Australian native flowers, gum leaves, banksia, soft botanical illustration' },
  { id: 'minimal-elegant', name: 'Minimal elegant', prompt: 'minimal premium stationery, generous whitespace, refined typography' }
];

export const defaultPrintIntent = {
  paper: 'A4',
  orientation: 'landscape',
  duplex: 'short-edge',
  scale: 'fit-to-page'
};

const A4_LANDSCAPE = { width: 841.89, height: 595.28 };
const encoder = new TextEncoder();

export function createCardDraft(input = {}) {
  const occasion = findById(occasions, input.occasionId) || occasions[0];
  const style = findById(styles, input.styleId) || styles[0];
  const recipient = clean(input.recipient) || 'Someone special';
  const sender = clean(input.sender) || 'Me';
  const tone = clean(input.tone) || 'warm, personal, not cheesy';
  const message = clean(input.message) || `For ${recipient},\n\nA ${tone} note from ${sender}.`;
  const coverTitle = clean(input.coverTitle) || occasion.coverTitle;

  return {
    version: 1,
    surface: 'app',
    occasion,
    style,
    recipient,
    sender,
    tone,
    message,
    coverTitle,
    references: input.references || [],
    layout: {
      id: 'a4-landscape-fold-half',
      paper: defaultPrintIntent.paper,
      orientation: defaultPrintIntent.orientation,
      duplex: defaultPrintIntent.duplex
    },
    printIntent: { ...defaultPrintIntent },
    prompts: buildPromptSet({ occasion, style, recipient, sender, tone, coverTitle }),
    revisions: [{ at: new Date().toISOString(), note: 'Initial mobile/web draft.' }]
  };
}

export function buildPromptSet({ occasion, style, recipient, sender, tone, coverTitle }) {
  return {
    imagePrompt: `${style.prompt}. ${occasion.prompt}. Cover title: "${coverTitle}". Recipient: ${recipient}. Print-ready greeting card artwork, no logos, no watermarks.`,
    textPrompt: `Write a short ${tone} greeting card message for ${recipient} from ${sender}. Return only the printable message.`
  };
}

export function refineTone(currentTone, refinement) {
  const next = clean(refinement);
  if (!next) return currentTone;
  return `${currentTone}; ${next}`;
}

export function createCardProjectJson(draft) {
  return `${JSON.stringify({
    version: '0.1.0-app',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    occasion: draft.occasion,
    recipient: draft.recipient,
    sender: draft.sender,
    style: draft.style,
    layout: draft.layout,
    printIntent: draft.printIntent,
    coverTitle: draft.coverTitle,
    prompts: draft.prompts,
    message: draft.message,
    references: draft.references,
    outputs: {}
  }, null, 2)}\n`;
}

export function createCardPdf(draft) {
  const front = pageContent([
    { text: draft.coverTitle, size: 44, x: 72, y: 365, max: 24, gap: 18 },
    { text: `For ${draft.recipient}`, size: 18, x: 72, max: 42, gap: 16 },
    { text: draft.style.name, size: 12, x: 72, max: 50 },
    { text: 'Artwork prompt:', size: 10, x: 520, y: 500, max: 34, gap: 4 },
    { text: draft.prompts.imagePrompt, size: 9, x: 520, max: 38, leading: 12 }
  ], { decorative: true });

  const inside = pageContent([
    { text: draft.message, size: 24, x: 92, y: 430, max: 46, gap: 26 },
    { text: `From ${draft.sender}`, size: 13, x: 92, max: 52 },
    { text: 'Print: A4 landscape, double-sided short-edge. Fold after printing.', size: 10, x: 92, y: 78, max: 74 },
    { text: 'Made with Paperhug', size: 9, x: 650, y: 78, max: 28 }
  ]);

  return createPdf([front, inside], draft.printIntent);
}

export function createCardPdfBytes(draft) {
  return encoder.encode(createCardPdf(draft));
}

export function createCardPdfBlob(draft) {
  return new Blob([createCardPdfBytes(draft)], { type: 'application/pdf' });
}

export function filenameForDraft(draft, extension = 'pdf') {
  return `${slugify(draft.occasion.id)}-for-${slugify(draft.recipient)}.${extension}`;
}

function createPdf(pages, printIntent) {
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
    const contentId = add(`<< /Length ${byteLength(content)} >>\nstream\n${content}\nendstream`);
    const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${A4_LANDSCAPE.width} ${A4_LANDSCAPE.height}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  }

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = `%PDF-1.4\n% Paperhug print intent: ${printIntent.paper} ${printIntent.orientation} duplex=${printIntent.duplex}\n`;
  const offsets = [0];
  for (const [index, body] of objects.entries()) {
    offsets.push(byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  }
  const xref = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return pdf;
}

function pageContent(items, { decorative = false } = {}) {
  const commands = [
    'q',
    '1 0.98 0.95 rg 0 0 841.89 595.28 re f',
    '0.94 0.82 0.75 rg 42 42 757.89 511.28 re S',
    '0.16 0.13 0.12 rg'
  ];

  if (decorative) {
    commands.push('1 0.82 0.76 rg 82 392 112 88 re f');
    commands.push('0.84 0.94 0.86 rg 660 76 118 112 re f');
    commands.push('0.72 0.72 1 RG 4 w 160 130 m 260 210 360 80 470 160 c 580 240 675 110 735 190 c S');
    commands.push('0.16 0.13 0.12 rg');
  }

  for (const item of items) {
    let y = item.y ?? 500;
    const size = item.size || 14;
    const x = item.x || 72;
    const leading = item.leading || Math.round(size * 1.45);
    for (const line of wrapText(item.text, item.max || 68)) {
      commands.push(`BT /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(line)}) Tj ET`);
      y -= leading;
    }
  }
  commands.push('Q');
  return commands.join('\n');
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

function findById(items, id) {
  return items.find((item) => item.id === id);
}

function clean(value) {
  return String(value || '').trim();
}

function slugify(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'card';
}

function escapePdfText(value) {
  return String(value).replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function byteLength(value) {
  return encoder.encode(value).length;
}
