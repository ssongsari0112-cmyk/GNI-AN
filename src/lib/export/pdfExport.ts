import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getNoSplitRanges, adjustBoundary, getPageSizeMm, PDF_MARGIN_V_MM, type PageOrientation, type Range } from './pdfPageBreaks';

/** 연속된 .doc-page를 방향(orientation)이 같은 구간끼리 묶음 — 같은 방향이 이어지는
 *  섹션들은 한 페이지의 남은 공간을 채우며 이어 흐르고, 방향이 바뀌는 지점(트리 다이어그램,
 *  가로 표 등)에서만 새 페이지로 강제 전환됨 */
function groupByOrientation(pages: HTMLElement[]): { orientation: PageOrientation; pages: HTMLElement[] }[] {
  const runs: { orientation: PageOrientation; pages: HTMLElement[] }[] = [];
  for (const page of pages) {
    const orientation: PageOrientation = page.dataset.pdfOrientation === 'landscape' ? 'landscape' : 'portrait';
    const lastRun = runs[runs.length - 1];
    if (lastRun && lastRun.orientation === orientation) lastRun.pages.push(page);
    else runs.push({ orientation, pages: [page] });
  }
  return runs;
}

export async function exportPagesToPdf(container: HTMLElement, filename: string) {
  const pages = Array.from(container.querySelectorAll<HTMLElement>('.doc-page'));
  if (pages.length === 0) return;

  const pdf = new jsPDF('p', 'mm', 'a4');
  let isFirstPage = true;
  const runs = groupByOrientation(pages);

  for (const run of runs) {
    const { orientation, pages: runPages } = run;
    const { widthMm, heightMm } = getPageSizeMm(orientation);
    const contentHeightMm = heightMm - PDF_MARGIN_V_MM * 2;

    // 같은 방향 구간 안의 각 .doc-page를 개별 캔버스로 캡처한 뒤, 분할 금지 영역(px 좌표를
    // 누적 높이만큼 보정)과 함께 하나의 긴 캔버스로 이어붙임 — 섹션 경계에서 무조건 새
    // 페이지로 끊기지 않고, 이전 섹션이 남긴 빈 공간을 다음 섹션이 채우며 이어지게 함
    const canvasList: HTMLCanvasElement[] = [];
    const noSplitRangesPx: Range[] = [];
    let canvasWidth = 0;
    let cumulativeCanvasHeight = 0;

    for (const page of runPages) {
      const pageHeightCss = page.scrollHeight || page.offsetHeight;
      if (pageHeightCss === 0) continue; // 빈 페이지(흰 페이지) 방지

      const localRanges = getNoSplitRanges(page);
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        ignoreElements: (el) => el.classList?.contains('pdf-preview-only'),
      });
      if (canvas.width === 0 || canvas.height === 0) continue;

      const scaleY = canvas.height / pageHeightCss;
      canvasWidth = canvas.width;
      for (const r of localRanges) {
        noSplitRangesPx.push({ top: r.top * scaleY + cumulativeCanvasHeight, bottom: r.bottom * scaleY + cumulativeCanvasHeight });
      }
      canvasList.push(canvas);
      cumulativeCanvasHeight += canvas.height;
    }

    if (canvasList.length === 0) continue;

    const totalHeight = cumulativeCanvasHeight;
    const merged = document.createElement('canvas');
    merged.width = canvasWidth;
    merged.height = totalHeight;
    const mergeCtx = merged.getContext('2d');
    if (!mergeCtx) continue;
    let offsetY = 0;
    for (const c of canvasList) {
      mergeCtx.drawImage(c, 0, offsetY);
      offsetY += c.height;
    }

    const pxPerMm = canvasWidth / widthMm;
    const pageHeightPx = contentHeightMm * pxPerMm;
    const minTrailingPx = pageHeightPx * 0.08;

    let renderedPx = 0;
    while (renderedPx < merged.height - 0.5) {
      let sliceEnd = Math.min(renderedPx + pageHeightPx, merged.height);

      if (merged.height - sliceEnd < minTrailingPx) {
        sliceEnd = merged.height;
      } else {
        const adjusted = adjustBoundary(noSplitRangesPx, sliceEnd, renderedPx, pageHeightPx);
        sliceEnd = adjusted > renderedPx + 1 ? adjusted : sliceEnd;
      }

      const sliceHeightPx = Math.max(1, sliceEnd - renderedPx);

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvasWidth;
      sliceCanvas.height = sliceHeightPx;
      const ctx = sliceCanvas.getContext('2d');
      if (!ctx) break;
      ctx.drawImage(
        merged,
        0, renderedPx, canvasWidth, sliceHeightPx,
        0, 0, canvasWidth, sliceHeightPx,
      );

      const imgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
      const sliceHeightMm = sliceHeightPx / pxPerMm;

      if (!isFirstPage) pdf.addPage('a4', orientation);
      isFirstPage = false;
      pdf.addImage(imgData, 'JPEG', 0, PDF_MARGIN_V_MM, widthMm, sliceHeightMm);

      renderedPx += sliceHeightPx;
    }
  }

  pdf.save(filename);
}
