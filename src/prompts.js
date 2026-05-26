function fill(template, values) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => values[key] ?? '');
}

export function buildPrompts({ occasion, style, recipient, sender, messageBrief, references = [], coverTitle }) {
  const titleText = coverTitle === false ? '' : String(coverTitle ?? occasion.coverTitle ?? '').trim();
  const values = {
    recipient,
    sender,
    style: style.prompt || style.name,
    messageBrief: messageBrief || occasion.defaultTone || 'warm and personal'
  };

  const referenceNote = references.length > 0
    ? `\n\nReference image guidance: Use these user-provided reference images respectfully as inspiration, not as hidden uploads unless the selected provider explicitly requires it and the user has opted in: ${references.map((ref) => ref.originalPath).join(', ')}`
    : '';

  const titleGuidance = titleText
    ? `Card cover title: ${titleText}. If the artwork includes title text, make it deliberate, decorative, and readable.`
    : 'Do not include readable cover text; let the artwork carry the story without a printed title.';
  const imagePrompt = `${fill(occasion.imagePrompt, values)}\n\n${titleGuidance}\nAvoid copyrighted characters, celebrity likenesses, watermarks, and unreadable text.${referenceNote}`;
  const textPrompt = `${fill(occasion.textPrompt, values)}\nCard idea: ${messageBrief || occasion.defaultTone || 'warm and personal'}.\nReturn only the inside card message, 3-6 short lines, suitable for printing.`;

  return { imagePrompt, textPrompt };
}

export function defaultMessage({ occasion, recipient, sender, messageBrief }) {
  const brief = (messageBrief || occasion.defaultTone || '').toLowerCase();
  const body = messageBodyForBrief(brief);
  return [
    `Dear ${recipient},`,
    '',
    ...body,
    '',
    'With love,',
    sender
  ].join('\n');
}

function messageBodyForBrief(brief) {
  if (brief.includes('cabin') && (brief.includes('mountain') || brief.includes('alpine'))) {
    return [
      'Here is to your next great adventure:',
      'fresh mountain air, a cabin to call your own,',
      'and the two of you heading into it together.',
      'We love you and cannot wait to see this new chapter unfold.'
    ];
  }

  if (brief.includes('new chapter') || brief.includes('moving') || brief.includes('home')) {
    return [
      'Here is to the next chapter, the new view,',
      'and all the good days waiting for you there.',
      'We are so happy for you, and so glad to share in it.'
    ];
  }

  if (brief.includes('funny')) {
    return [
      'Thank you for the love, the patience,',
      'and the heroic tolerance of our chaos.',
      'You make ordinary days feel like home.'
    ];
  }

  return [
    'Thank you for the love, kindness,',
    'and steady care you bring to our lives.',
    'We hope this brings a smile today and stays close for a long time.'
  ];
}
