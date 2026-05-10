import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { createCardPdfBlob, filenameForDraft } from '@paperhug/app-core';

export async function shareOrDownloadCardPdf(draft) {
  const blob = createCardPdfBlob(draft);
  const filename = filenameForDraft(draft, 'pdf');

  if (!Capacitor.isNativePlatform()) {
    downloadBlob(blob, filename);
    return { mode: 'download', filename };
  }

  const base64 = await blobToBase64(blob);
  const writeResult = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
    recursive: true
  });

  await Share.share({
    title: 'Paperhug card PDF',
    text: 'Print this Paperhug card as A4 landscape, double-sided short-edge.',
    files: [writeResult.uri],
    dialogTitle: 'Share or print Paperhug card'
  });

  return { mode: 'share', filename };
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

async function blobToBase64(blob) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
  return String(dataUrl).split(',')[1];
}
