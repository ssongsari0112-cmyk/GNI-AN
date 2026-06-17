/**
 * PDF 내보내기(html2canvas 슬라이싱)와 미리보기 페이지 구분선 오버레이가
 * 동일한 기준으로 "어디서 페이지가 나뉘는지"를 계산하도록 공유하는 모듈.
 */

export type Range = { top: number; bottom: number };

/** 표/목록과 별개로, 절대 분할되면 안 되는 블록(예: 나무 다이어그램)에 부여하는 클래스 */
export const PDF_ATOMIC_CLASS = 'pdf-atomic-block';

const A4_HEIGHT_MM = 297;
export const PDF_MARGIN_V_MM = 6; // 페이지 상/하 여백

/**
 * 분할 금지 영역을 수집.
 * - table: 표 전체를 통째로 다음 페이지로 넘기는 것을 우선 시도
 * - tr, li: 표가 한 페이지보다 커서 통째로 옮길 수 없을 때, 행/항목 단위로는 절대 분할되지 않도록 보장
 * - .pdf-atomic-block: 나무 다이어그램 등 분할 금지 블록
 * - 본문(doc-content) 제목+목록 묶음
 */
export function getNoSplitRanges(page: HTMLElement): Range[] {
  const pageRect = page.getBoundingClientRect();
  const ranges: Range[] = [];

  const pushEl = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    ranges.push({ top: r.top - pageRect.top, bottom: r.bottom - pageRect.top });
  };

  page.querySelectorAll<HTMLElement>('table').forEach(pushEl);
  page.querySelectorAll<HTMLElement>('tr').forEach(pushEl);
  page.querySelectorAll<HTMLElement>('li').forEach(pushEl);
  page.querySelectorAll<HTMLElement>(`.${PDF_ATOMIC_CLASS}`).forEach(pushEl);

  page.querySelectorAll('.doc-content').forEach((container) => {
    const children = Array.from(container.children) as HTMLElement[];
    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      const tag = el.tagName.toLowerCase();
      if (tag === 'table' || tag === 'ul' || tag === 'ol') continue; // 이미 보호됨
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

/**
 * desired 경계가 보호 영역을 가로지르면 경계를 조정.
 * 1) 통째로 다음 페이지로 옮길 수 있는(아직 시작 안 한) 영역이 있으면, 그 중 가장 바깥쪽(가장 이른 top)으로 경계를 끌어올림
 *    → 표 전체가 한 페이지에 들어가면 표째로 다음 페이지로 넘어감
 * 2) 옮길 수 있는 영역이 없다면(이미 그 영역 안에서 자르는 중) — 가장 안쪽(가장 작은) 영역의 끝으로 경계를 내려서
 *    표는 분할되더라도 행/항목만큼은 절대 쪼개지지 않도록 함
 */
export function adjustBoundary(ranges: Range[], desired: number, minBoundary: number): number {
  let boundary = desired;
  for (let guard = 0; guard < 12; guard++) {
    const straddlers = ranges.filter((r) => r.top < boundary - 0.5 && r.bottom > boundary + 0.5);
    if (straddlers.length === 0) return boundary;

    const movable = straddlers.filter((r) => r.top > minBoundary + 0.5);
    if (movable.length > 0) {
      // 옮길 수 있는 영역(표 전체 등) 중 가장 바깥쪽으로 한 번에 결정 — 이후 그 영역 내부를
      // 다시 검사하면 표 전체가 또 "분할 금지"로 잡혀 무한히 표의 끝까지 밀려나가는
      // 문제가 생기므로, movable을 찾으면 즉시 확정한다.
      return Math.min(...movable.map((r) => r.top));
    }

    const innermost = straddlers.reduce((a, b) => (b.bottom - b.top < a.bottom - a.top ? b : a));
    if (innermost.bottom <= boundary + 0.5) return boundary; // 진행이 없으면 무한루프 방지
    boundary = innermost.bottom;
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
