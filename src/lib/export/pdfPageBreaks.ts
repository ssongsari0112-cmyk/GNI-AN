/**
 * PDF 내보내기(html2canvas 슬라이싱)와 미리보기 페이지 구분선 오버레이가
 * 동일한 기준으로 "어디서 페이지가 나뉘는지"를 계산하도록 공유하는 모듈.
 */

export type Range = { top: number; bottom: number };

/** 표/목록과 별개로, 절대 분할되면 안 되는 블록(예: 나무 다이어그램)에 부여하는 클래스 */
export const PDF_ATOMIC_CLASS = 'pdf-atomic-block';

const A4_HEIGHT_MM = 297;
export const PDF_MARGIN_V_MM = 6; // 페이지 상/하 여백

/** 표의 행(tr), 목록 항목(li), 제목+목록 묶음, .pdf-atomic-block 요소를 분할 금지 영역으로 수집 */
export function getNoSplitRanges(page: HTMLElement): Range[] {
  const pageRect = page.getBoundingClientRect();
  const ranges: Range[] = [];

  const pushEl = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    ranges.push({ top: r.top - pageRect.top, bottom: r.bottom - pageRect.top });
  };

  page.querySelectorAll<HTMLElement>('tr').forEach(pushEl);
  page.querySelectorAll<HTMLElement>('li').forEach(pushEl);
  page.querySelectorAll<HTMLElement>(`.${PDF_ATOMIC_CLASS}`).forEach(pushEl);

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
        const r2 = next.getBoundingClientRect();
        bottom = r2.top - pageRect.top;
      }
      ranges.push({ top, bottom });
    }
  });

  return ranges;
}

/** desired 경계가 보호 영역을 가로지르면, 해당 영역의 시작 지점으로 경계를 끌어올림 */
export function adjustBoundary(ranges: Range[], desired: number, minBoundary: number): number {
  let boundary = desired;
  for (let pass = 0; pass < 8; pass++) {
    const straddler = ranges.find((r) => r.top < boundary - 0.5 && r.bottom > boundary + 0.5);
    if (!straddler) break;
    if (straddler.top > minBoundary + 0.5) {
      boundary = straddler.top;
    } else {
      boundary = straddler.bottom; // 영역 자체가 한 페이지보다 커서 어쩔 수 없이 끝까지 포함
      break;
    }
  }
  return boundary;
}

/**
 * 주어진 페이지 엘리먼트에서, pageHeightPx(분할 금지 영역 보정 전 기준 높이) 간격으로
 * 실제 페이지가 나뉘는 y좌표(엘리먼트 상단 기준, 동일 단위 px) 목록을 계산.
 * 마지막 조각이 너무 작아지는 경우는 직전 조각에 합쳐 표시하지 않음(흰 페이지 방지와 동일 기준).
 */
export function computePageBreaks(page: HTMLElement, pageHeightPx: number): number[] {
  const ranges = getNoSplitRanges(page);
  const total = page.scrollHeight;
  const minTrailingPx = pageHeightPx * 0.08;
  const breaks: number[] = [];

  let renderedPx = 0;
  while (renderedPx < total - 0.5) {
    let sliceEnd = Math.min(renderedPx + pageHeightPx, total);

    if (total - sliceEnd < minTrailingPx) {
      sliceEnd = total;
    } else {
      const adjusted = adjustBoundary(ranges, sliceEnd, renderedPx);
      sliceEnd = adjusted > renderedPx + 1 ? adjusted : sliceEnd;
    }

    renderedPx = Math.max(renderedPx + 1, sliceEnd);
    if (renderedPx < total - 0.5) breaks.push(renderedPx);
  }

  return breaks;
}

/** 미리보기 화면에서 실제 내보내기와 동일한 기준의 페이지 높이(px)를 계산 */
export function getPreviewPageHeightPx(pageWidthPx: number): number {
  const pxPerMm = pageWidthPx / 210;
  return (A4_HEIGHT_MM - PDF_MARGIN_V_MM * 2) * pxPerMm;
}
