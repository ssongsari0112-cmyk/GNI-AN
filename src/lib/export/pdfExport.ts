import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getNoSplitRanges, adjustBoundary, PDF_MARGIN_V_MM } from './pdfPageBreaks';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

export async function exportPagesToPdf(container: HTMLElement, filename: string) {
  const pages = Array.from(container.querySelectorAll<HTMLElement>('.doc-page'));
  if (pages.length === 0) return;

  const pdf = new jsPDF('p', 'mm', 'a4');
  let isFirstPage = true;

  const contentHeightMm = A4_HEIGHT_MM - PDF_MARGIN_V_MM * 2;

  for (const page of pages) {
    const noSplitRanges = getNoSplitRanges(page);
    const pageHeightCss = page.scrollHeight || page.offsetHeight;
    if (pageHeightCss === 0) continue; // 빈 페이지(흰 페이지) 방지

    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    if (canvas.width === 0 || canvas.height === 0) continue;

    const scaleY = canvas.height / pageHeightCss; // CSS px → canvas px 변환 비율
    const pxPerMm = canvas.width / A4_WIDTH_MM;
    const pageHeightPx = contentHeightMm * pxPerMm;
    const minTrailingPx = pageHeightPx * 0.08; // 너무 작은 마지막 조각은 흰 페이지처럼 보이므로 직전 조각에 합침

    const blocksPx = noSplitRanges.map((r) => ({ top: r.top * scaleY, bottom: r.bottom * scaleY }));

    let renderedPx = 0;
    while (renderedPx < canvas.height - 0.5) {
      let sliceEnd = Math.min(renderedPx + pageHeightPx, canvas.height);

      if (canvas.height - sliceEnd < minTrailingPx) {
        // 남은 분량이 적으면 이번 조각에 합쳐서 거의 빈 페이지가 생기는 것을 방지
        sliceEnd = canvas.height;
      } else {
        const adjusted = adjustBoundary(blocksPx, sliceEnd, renderedPx);
        sliceEnd = adjusted > renderedPx + 1 ? adjusted : sliceEnd;
      }

      const sliceHeightPx = Math.max(1, sliceEnd - renderedPx);

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
      pdf.addImage(imgData, 'JPEG', 0, PDF_MARGIN_V_MM, A4_WIDTH_MM, sliceHeightMm);

      renderedPx += sliceHeightPx;
    }
  }

  pdf.save(filename);
}
