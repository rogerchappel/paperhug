import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCardDraft, createCardPdf, createCardPdfBytes, createCardProjectJson, defaultPrintIntent, filenameForDraft, occasions, styles } from '../packages/app-core/src/index.js';

describe('@paperhug/app-core', () => {
  it('creates a browser-safe draft with explicit A4 landscape duplex intent', () => {
    const draft = createCardDraft({
      occasionId: 'birthday',
      styleId: 'native-flowers',
      recipient: 'Aunty Jo',
      sender: 'Roger',
      tone: 'warm and cheeky'
    });

    assert.equal(draft.surface, 'app');
    assert.equal(draft.recipient, 'Aunty Jo');
    assert.equal(draft.style.id, 'native-flowers');
    assert.deepEqual(draft.printIntent, defaultPrintIntent);
    assert.equal(draft.layout.orientation, 'landscape');
    assert.equal(draft.layout.duplex, 'short-edge');
    assert.match(draft.prompts.imagePrompt, /Aunty Jo/);
    assert.match(draft.prompts.textPrompt, /warm and cheeky/);
  });

  it('creates a downloadable app PDF and project JSON without Node-only APIs', () => {
    const draft = createCardDraft({ recipient: 'Aunty Jo', sender: 'Roger' });
    const pdf = createCardPdf(draft);
    const bytes = createCardPdfBytes(draft);
    const projectJson = createCardProjectJson(draft);

    assert.match(pdf, /^%PDF-1\.4/);
    assert.match(pdf, /Paperhug print intent: A4 landscape duplex=short-edge/);
    assert.ok(bytes.byteLength > 500);
    assert.equal(JSON.parse(projectJson).printIntent.duplex, 'short-edge');
    assert.equal(filenameForDraft(draft), 'birthday-for-aunty-jo.pdf');
  });

  it('exposes family-friendly starter choices for app surfaces', () => {
    assert.ok(occasions.length >= 4);
    assert.ok(styles.length >= 4);
    assert.ok(occasions.some((occasion) => occasion.id === 'custom'));
  });
});
