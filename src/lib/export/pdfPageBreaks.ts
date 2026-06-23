/**
 * PDF 내보내기(html2canvas 슬라이싱)와 미리보기 페이지 구분선 오버레이가
 * 동일한 기준으로 "어디서 페이지가 나뉘는지"를 계산하도록 공유하는 모듈.
 */

export type Range = { top: number; bottom: number };

/** 표/목록과 별개로, 절대 분할되면 안 되는 블록(예: 나무 다이어그램)에 부여하는 클래스 */
export const PDF_ATOMIC_CLASS = 'pdf-atomic-block';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
export const PDF_MARGIN_V_MM = 6; // 페이지 상/하 여백

export type PageOrientation = 'portrait' | 'landscape';

/** 방향에 따른 실제 출력 페이지의 폭/높이(mm) */
export function getPageSizeMm(orientation: PageOrientation): { widthMm: number; heightMm: number } {
  return orientation === 'landscape'
    ? { widthMm: A4_HEIGHT_MM, heightMm: A4_WIDTH_MM }
    : { widthMm: A4_WIDTH_MM, heightMm: A4_HEIGHT_MM };
}

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
  // 본문 문단·제목 자체도 분할 금지 — 그렇지 않으면 줄 중간에서 페이지가 잘려
  // 글자가 위/아래 페이지로 쪼개진 것처럼 보이는 문제가 생김
  page.querySelectorAll<HTMLElement>('p, h1, h2, h3, h4, h5, h6').forEach(pushEl);

  // 제목(p/h3) 바로 다음에 표/목록/분할금지블록이 오면, 제목만 페이지 끝에 혼자 남지 않도록
  // 묶어서 보호. .doc-content 내부뿐 아니라 페이지 전체(예: PDM 표 제목)에 적용
  page.querySelectorAll<HTMLElement>('h3, p').forEach((el) => {
    const next = el.nextElementSibling as HTMLElement | null;
    if (!next) return;
    const tag = next.tagName.toLowerCase();
    const isProtectedNext = tag === 'table' || tag === 'ul' || tag === 'ol' || next.classList.contains(PDF_ATOMIC_CLASS);
    if (!isProtectedNext) return;
    const r1 = el.getBoundingClientRect();
    const r2 = next.getBoundingClientRect();
    ranges.push({ top: r1.top - pageRect.top, bottom: r2.top - pageRect.top });
  });

  return ranges;
}

/**
 * desired 경계가 보호 영역을 가로지르면 경계를 조정.
 * 1) 통째로 다음 페이지로 옮길 수 있는(아직 시작 안 했고, 자기 자신의 높이가 한 페이지 분량
 *    이하인) 영역이 있으면, 그 중 가장 바깥쪽(가장 이른 top)으로 경계를 끌어올림
 *    → 표 전체가 한 페이지에 들어가면 표째로 다음 페이지로 넘어감
 *    (표 자체가 한 페이지보다 커서 어차피 새 페이지에서도 다 못 담는 경우는 "옮길 수 있는"
 *    대상에서 제외 — 그렇지 않으면 표를 통째로 다음 페이지로 미루기만 하고 정작 그 표는
 *    여러 페이지에 걸쳐야 해서, 제목만 있는 페이지에 빈 공간이 크게 남는 문제가 생김)
 * 2) 옮길 수 있는 영역이 없다면(이미 그 영역 안에서 자르는 중) — 가장 안쪽(가장 작은) 영역의 끝으로 경계를 내려서
 *    표는 분할되더라도 행/항목만큼은 절대 쪼개지지 않도록 함
 */
export function adjustBoundary(ranges: Range[], desired: number, minBoundary: number, pageHeightPx: number): number {
  let boundary = desired;
  for (let guard = 0; guard < 12; guard++) {
    const straddlers = ranges.filter((r) => r.top < boundary - 0.5 && r.bottom > boundary + 0.5);
    if (straddlers.length === 0) return boundary;

    const movable = straddlers.filter((r) => r.top > minBoundary + 0.5 && r.bottom - r.top <= pageHeightPx + 0.5);
    if (movable.length > 0) {
      // 옮길 수 있는 영역(표 전체 등) 중 가장 바깥쪽으로 한 번에 결정 — 이후 그 영역 내부를
      // 다시 검사하면 표 전체가 또 "분할 금지"로 잡혀 무한히 표의 끝까지 밀려나가는
      // 문제가 생기므로, movable을 찾으면 즉시 확정한다.
      const moved = Math.min(...movable.map((r) => r.top));
      // 옮긴 위치가 시작점에서 한 페이지 분량보다 멀면(앞에 이미 다른 내용이 있던 경우),
      // 그대로 옮기면 슬라이스가 한 페이지보다 커져 페이지 밖으로 잘려나간다 — 옮기지 않고
      // 원래 경계에서 자른다(아래로 폴스루).
      if (moved - minBoundary <= pageHeightPx + 0.5) return moved;
    }

    const innermost = straddlers.reduce((a, b) => (b.bottom - b.top < a.bottom - a.top ? b : a));
    if (innermost.bottom <= boundary + 0.5) return boundary; // 진행이 없으면 무한루프 방지
    // 분할 금지 블록 자체가 한 페이지보다 커서, 그 끝까지 밀면 슬라이스가 한 페이지를 넘는
    // 경우 — 무리하게 통째로 옮기면 페이지 밖으로 잘려 내용이 사라지므로, 정상 경계에서
    // 블록을 분할해서라도(시각적으로는 다소 어색해도) 내용 손실을 방지한다.
    if (innermost.bottom - minBoundary > pageHeightPx + 0.5) return desired;
    boundary = innermost.bottom;
  }
  return desired;
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
      const adjusted = adjustBoundary(ranges, sliceEnd, renderedPx, pageHeightPx);
      sliceEnd = adjusted > renderedPx + 1 ? adjusted : sliceEnd;
    }

    renderedPx = Math.max(renderedPx + 1, sliceEnd);
    if (renderedPx < total - 0.5) breaks.push(renderedPx);
  }

  return breaks;
}

/**
 * 미리보기 화면에서 실제 내보내기와 동일한 기준의 페이지 높이(px)를 계산.
 * pageWidthPx는 화면에 렌더링된 .doc-page의 실제 너비(px). 내보내기 시 이 픽셀 폭을
 * 그대로 출력 페이지의 폭(mm, portrait=210mm / landscape=297mm)에 맞춰 배치하므로,
 * landscape 페이지는 같은 내용이 더 크게 확대되어 페이지당 담기는 높이(px)가 줄어든다.
 */
export function getPreviewPageHeightPx(pageWidthPx: number, orientation: PageOrientation = 'portrait'): number {
  const { widthMm, heightMm } = getPageSizeMm(orientation);
  const pxPerMm = pageWidthPx / widthMm;
  return (heightMm - PDF_MARGIN_V_MM * 2) * pxPerMm;
}
