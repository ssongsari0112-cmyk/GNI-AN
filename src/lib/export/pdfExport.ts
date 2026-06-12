import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

export async function exportPagesToPdf(container: HTMLElement, filename: string) {
  const pages = Array.from(container.querySelectorAll<HTMLElement>('.doc-page'));
  if (pages.length === 0) return;

  const pdf = new jsPDF('p', 'mm', 'a4');
  let isFirstPage = true;

  for (const page of pages) {
    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgWidthMm = A4_WIDTH_MM;
    const pxPerMm = canvas.width / imgWidthMm;
    const pageHeightPx = A4_HEIGHT_MM * pxPerMm;

    let renderedPx = 0;
    while (renderedPx < canvas.height) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeightPx;
      const ctx = sliceCanvas.getContext('2d');
      if (!ctx) break;
      ctx.drawImage(
        canvas,
        0, renderedPx, canvas.width, sliceHeightPx,
        0, 0, canvas.width, sliceHeightPx,
      );

      const imgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
      const sliceHeightMm = sliceHeightPx / pxPerMm;

      if (!isFirstPage) pdf.addPage();
      isFirstPage = false;
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidthMm, sliceHeightMm);

      renderedPx += sliceHeightPx;
    }
  }

  pdf.save(filename);
}
