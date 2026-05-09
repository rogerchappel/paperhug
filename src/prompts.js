function fill(template, values) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => values[key] ?? '');
}

export function buildPrompts({ occasion, style, recipient, sender, messageBrief, references = [], coverTitle }) {
  const values = {
    recipient,
    sender,
    style: style.prompt || style.name,
    messageBrief: messageBrief || occasion.defaultTone || 'warm and personal'
  };

  const referenceNote = references.length > 0
    ? `\n\nReference image guidance: Use these user-provided reference images respectfully as inspiration, not as hidden uploads unless the selected provider explicitly requires it and the user has opted in: ${references.map((ref) => ref.originalPath).join(', ')}`
    : '';

  const imagePrompt = `${fill(occasion.imagePrompt, values)}\n\nCard cover title: ${coverTitle || occasion.coverTitle}.\nAvoid copyrighted characters, celebrity likenesses, watermarks, and unreadable text.${referenceNote}`;
  const textPrompt = `${fill(occasion.textPrompt, values)}\nReturn only the card message, 2-5 short lines, suitable for printing.`;

  return { imagePrompt, textPrompt };
}

export function defaultMessage({ occasion, recipient, sender, messageBrief }) {
  const brief = (messageBrief || occasion.defaultTone || '').toLowerCase();
  const lineTwo = brief.includes('funny')
    ? 'Thanks for putting up with the chaos and still making it feel like home.'
    : 'Thank you for the love, kindness, and steady magic you bring.';
  return [
    occasion.coverTitle || 'For You',
    `Dear ${recipient},`,
    lineTwo,
    `With love, ${sender}`
  ].join('\n');
}
