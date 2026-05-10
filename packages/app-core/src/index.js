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
    printIntent: defaultPrintIntent,
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

function findById(items, id) {
  return items.find((item) => item.id === id);
}

function clean(value) {
  return String(value || '').trim();
}
