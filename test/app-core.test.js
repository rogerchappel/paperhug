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

  it('preserves accented, non-Latin, and emoji text in app PDFs', () => {
    const draft = createCardDraft({ recipient: 'Zoë 李', sender: 'José', coverTitle: 'Félicitations', message: '生日快乐 🎉' });
    const pdf = createCardPdf(draft);

    assert.doesNotMatch(pdf, /Zo\?|Jos\?|F\?licitations|\?\?\?\?/);
    assert.match(pdf, /FEFF004600E9006C0069006300690074006100740069006F006E0073/);
    assert.match(pdf, /FEFF751F65E55FEB4E500020D83CDF89/);
    assert.match(pdf, /FEFF0046006F00720020005A006F00EB0020674E/);
    assert.match(pdf, /FEFF00460072006F006D0020004A006F007300E9/);
    assert.ok(createCardPdfBytes(draft).byteLength > 500);
    assert.match(pdf, /MediaBox \[0 0 841\.89 595\.28\]/);
    assert.match(pdf, /Paperhug print intent: A4 landscape duplex=short-edge/);
  });

  it('exposes family-friendly starter choices for app surfaces', () => {
    assert.ok(occasions.length >= 4);
    assert.ok(styles.length >= 4);
    assert.ok(occasions.some((occasion) => occasion.id === 'custom'));
  });
});
