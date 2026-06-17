import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_V_MM = 6; // 페이지 상/하 여백 — 표·문단이 페이지 경계에 바로 붙지 않도록

type Range = { top: number; bottom: number };

/** 표의 행(tr), 목록 항목(li), 제목+목록 묶음 등 페이지 경계에서 잘리면 안 되는 영역을 수집 */
function getNoSplitRanges(page: HTMLElement): Range[] {
  const pageRect = page.getBoundingClientRect();
  const ranges: Range[] = [];

  const pushEl = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    ranges.push({ top: r.top - pageRect.top, bottom: r.bottom - pageRect.top });
  };

  // 표의 모든 행은 절대 분할되지 않도록 보호
  page.querySelectorAll<HTMLElement>('tr').forEach(pushEl);
  // 목록 항목도 보호
  page.querySelectorAll<HTMLElement>('li').forEach(pushEl);

  // 본문(doc-content) 영역의 최상위 블록 — 제목(p/h3) + 바로 이어지는 목록을 한 묶음으로 보호
  page.querySelectorAll('.doc-content').forEach((container) => {
    const children = Array.from(container.children) as HTMLElement[];
    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      const tag = el.tagName.toLowerCase();
      if (tag === 'table' || tag === 'ul' || tag === 'ol') continue; // 이미 tr/li로 보호됨
      const next = children[i + 1];
      const r1 = el.getBoundingClientRect();
      const top = r1.top - pageRect.top;
      let bottom = r1.bottom - pageRect.top;
      if ((tag === 'p' || tag === 'h3') && next && ['ul', 'ol'].includes(next.tagName.toLowerCase())) {
        // 제목과 목록 전체를 하나의 단위로 묶어 보호(목록 내부는 li 단위로 별도 보호됨)
        const r2 = next.getBoundingClientRect();
        bottom = r2.top - pageRect.top; // 목록 시작 직전까지만 묶고, 목록 자체는 li 보호에 위임
      }
      ranges.push({ top, bottom });
    }
  });

  return ranges;
}

/** desired 경계가 보호 영역을 가로지르면, 해당 영역의 시작 지점으로 경계를 끌어올림 */
function adjustBoundary(ranges: Range[], desired: number, minBoundary: number): number {
  let boundary = desired;
  for (let pass = 0; pass < 8; pass++) {
    const straddler = ranges.find((r) => r.top < boundary - 0.5 && r.bottom > boundary + 0.5);
    if (!straddler) break;
    if (straddler.top > minBoundary + 0.5) {
      boundary = straddler.top;
    } else {
      // 영역 자체가 한 페이지보다 커서 어쩔 수 없이 끝까지 포함
      boundary = straddler.bottom;
      break;
    }
  }
  return boundary;
}

export async function exportPagesToPdf(container: HTMLElement, filename: string) {
  const pages = Array.from(container.querySelectorAll<HTMLElement>('.doc-page'));
  if (pages.length === 0) return;

  const pdf = new jsPDF('p', 'mm', 'a4');
  let isFirstPage = true;

  const contentHeightMm = A4_HEIGHT_MM - MARGIN_V_MM * 2;

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
      pdf.addImage(imgData, 'JPEG', 0, MARGIN_V_MM, A4_WIDTH_MM, sliceHeightMm);

      renderedPx += sliceHeightPx;
    }
  }

  pdf.save(filename);
}
