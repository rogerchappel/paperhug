import { createCardPdfBlob, createCardProjectJson, filenameForDraft } from '@paperhug/app-core';

export function downloadCardPdf(draft) {
  downloadBlob(createCardPdfBlob(draft), filenameForDraft(draft, 'pdf'));
}

export function downloadProjectJson(draft) {
  const blob = new Blob([createCardProjectJson(draft)], { type: 'application/json' });
  downloadBlob(blob, filenameForDraft(draft, 'json'));
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
